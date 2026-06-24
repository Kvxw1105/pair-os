import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware as any);

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  return d;
}

function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr + 'T23:59:59.999Z');
  return d;
}

// Helper: get first active partnership for user (or null if solo)
async function getFirstPartnership(userId: string) {
  const p = await prisma.partnership.findFirst({
    where: {
      OR: [
        { userId, status: 'active' },
        { partnerId: userId, status: 'active' },
      ],
    },
  });
  return p;
}

// GET /api/reports — list recent reports for user's first partnership
router.get('/', async (req: AuthRequest, res) => {
  try {
    const partnership = await getFirstPartnership(req.user!.id);
    if (!partnership) {
      return res.json({ reports: [] });
    }

    const reports = await prisma.dailyReport.findMany({
      where: { partnershipId: partnership.id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    res.json({ reports });
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

// GET /api/reports/:date — get or generate report for a date
router.get('/:date', async (req: AuthRequest, res) => {
  try {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format, use YYYY-MM-DD' });
    }

    const userId = req.user!.id;
    const partnership = await getFirstPartnership(userId);

    // If no partner, generate solo report
    if (!partnership) {
      const myActions = await prisma.action.findMany({
        where: {
          userId,
          createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
        },
        orderBy: { createdAt: 'asc' },
      });
      const myDuration = myActions.reduce((sum, a) => sum + a.totalDurationMs, 0);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

      res.json({
        report: {
          date,
          user1Id: userId,
          user1Name: user?.name || '我',
          user1Actions: myActions.map((a) => ({
            id: a.id,
            title: a.title,
            state: a.state,
            duration: a.totalDurationMs,
            result: a.result,
            resultNote: a.resultNote,
            completionPercent: a.completionPercent,
          })),
          user1Duration: myDuration,
          user2Id: null,
          user2Name: null,
          user2Actions: [],
          user2Duration: 0,
          user1Summary: null,
          user2Summary: null,
          mutualMessage: null,
        },
      });
      return;
    }

    const partnerId = partnership.userId === userId ? partnership.partnerId : partnership.userId;

    // Find existing report
    let report = await prisma.dailyReport.findUnique({
      where: { date_partnershipId: { date, partnershipId: partnership.id } },
    });

    // If not found, auto-generate from actions
    if (!report) {
      let partnerName = '伙伴';
      try {
        const partnerUser = await prisma.user.findUnique({
          where: { id: partnerId },
          select: { name: true },
        });
        if (partnerUser?.name) partnerName = partnerUser.name;
      } catch { /* fallback */ }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

      const myActions = await prisma.action.findMany({
        where: {
          userId,
          createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
        },
        orderBy: { createdAt: 'asc' },
      });

      const partnerActions = await prisma.action.findMany({
        where: {
          userId: partnerId,
          createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
        },
        orderBy: { createdAt: 'asc' },
      });

      const myDuration = myActions.reduce((sum, a) => sum + a.totalDurationMs, 0);
      const partnerDuration = partnerActions.reduce((sum, a) => sum + a.totalDurationMs, 0);

      report = await prisma.dailyReport.create({
        data: {
          date,
          partnershipId: partnership.id,
          user1Id: userId,
          user1Name: user?.name || '我',
          user1Actions: JSON.stringify(myActions.map((a) => ({
            id: a.id,
            title: a.title,
            state: a.state,
            duration: a.totalDurationMs,
            result: a.result,
            resultNote: a.resultNote,
            completionPercent: a.completionPercent,
          }))),
          user1Duration: myDuration,
          user2Id: partnerId,
          user2Name: partnerName,
          user2Actions: JSON.stringify(partnerActions.map((a) => ({
            id: a.id,
            title: a.title,
            state: a.state,
            duration: a.totalDurationMs,
            result: a.result,
            resultNote: a.resultNote,
            completionPercent: a.completionPercent,
          }))),
          user2Duration: partnerDuration,
        },
      });
    }

    // Parse JSON actions for response
    const response = {
      ...report,
      user1Actions: report.user1Actions ? JSON.parse(report.user1Actions) : [],
      user2Actions: report.user2Actions ? JSON.parse(report.user2Actions) : [],
    };

    res.json({ report: response });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// PUT /api/reports/:id — update summary / message
const updateSchema = z.object({
  user1Summary: z.string().optional(),
  user2Summary: z.string().optional(),
  mutualMessage: z.string().optional(),
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);

    const report = await prisma.dailyReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Only allow updating fields for the current user
    const updateData: Record<string, unknown> = {};
    if (report.user1Id === req.user!.id && data.user1Summary !== undefined) {
      updateData.user1Summary = data.user1Summary;
    }
    if (report.user2Id === req.user!.id && data.user2Summary !== undefined) {
      updateData.user2Summary = data.user2Summary;
    }
    // Mutual message can be updated by either
    if (data.mutualMessage !== undefined) {
      updateData.mutualMessage = data.mutualMessage;
    }

    const updated = await prisma.dailyReport.update({
      where: { id },
      data: updateData,
    });

    res.json({ report: updated });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

export default router;
