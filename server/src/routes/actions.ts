import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// All action routes require auth
router.use(authMiddleware as any);

const createSchema = z.object({
  title: z.string().min(1).max(200),
  visibility: z.enum(['solo', 'visible', 'needs_verification']).default('solo'),
});

const stateUpdateSchema = z.object({
  state: z.enum(['active', 'away', 'blocked', 'completed', 'partial']),
  reason: z.string().optional(),
  note: z.string().optional(),
});

const endSchema = z.object({
  result: z.enum(['completed', 'partial', 'abandoned']),
  completionPercent: z.number().int().min(0).max(100).optional().nullable(),
  note: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const actions = await prisma.action.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
    res.json(actions);
  } catch (err) {
    console.error('Get actions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { mainLine: true },
    });

    const action = await prisma.action.create({
      data: {
        userId: req.user!.id,
        title: data.title,
        visibility: data.visibility,
        needsVerification: data.visibility === 'needs_verification',
        state: 'active',
        startedAt: new Date(),
        mainLine: user?.mainLine || null,
      },
    });

    await prisma.actionEvent.create({
      data: {
        actionId: action.id,
        userId: req.user!.id,
        type: 'created',
      },
    });

    await prisma.actionEvent.create({
      data: {
        actionId: action.id,
        userId: req.user!.id,
        type: 'started',
      },
    });

    res.json(action);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Create action error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/state', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = stateUpdateSchema.parse(req.body);

    const existing = await prisma.action.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    const now = new Date();
    let updateData: any = { state: data.state, updatedAt: now };

    if (data.state === 'away') {
      const elapsed = existing.startedAt ? now.getTime() - existing.startedAt.getTime() : 0;
      updateData = {
        ...updateData,
        totalDurationMs: existing.totalDurationMs + elapsed,
        lastAwayAt: now,
        awayReason: data.reason || 'none',
        startedAt: null,
      };
    } else if (data.state === 'active' && existing.state === 'away') {
      const awayTime = existing.lastAwayAt ? now.getTime() - existing.lastAwayAt.getTime() : 0;
      updateData = {
        ...updateData,
        awayDurationMs: existing.awayDurationMs + awayTime,
        startedAt: now,
        lastAwayAt: null,
      };
    } else if (data.state === 'blocked') {
      const elapsed = existing.startedAt ? now.getTime() - existing.startedAt.getTime() : 0;
      updateData = {
        ...updateData,
        totalDurationMs: existing.totalDurationMs + elapsed,
        blockedReason: data.reason || null,
        startedAt: null,
      };
    } else if (data.state === 'active' && existing.state === 'blocked') {
      updateData = {
        ...updateData,
        startedAt: now,
        blockedReason: null,
      };
    }

    const action = await prisma.action.update({
      where: { id },
      data: updateData,
    });

    // Create event
    let eventType = data.state;
    if (data.state === 'active' && existing.state === 'away') eventType = 'resumed';
    if (data.state === 'active' && existing.state === 'blocked') eventType = 'unblocked';

    await prisma.actionEvent.create({
      data: {
        actionId: id,
        userId: req.user!.id,
        type: eventType,
        data: data.reason ? JSON.stringify({ reason: data.reason }) : null,
      },
    });

    res.json(action);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Update action state error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/end', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = endSchema.parse(req.body);

    const existing = await prisma.action.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    const now = new Date();
    const elapsed = existing.state === 'active' && existing.startedAt
      ? now.getTime() - existing.startedAt.getTime()
      : 0;

    const action = await prisma.action.update({
      where: { id },
      data: {
        state: data.result === 'completed' ? 'completed' : data.result === 'partial' ? 'partial' : 'completed',
        endedAt: now,
        totalDurationMs: existing.totalDurationMs + elapsed,
        result: data.result,
        resultNote: data.note || null,
        completionPercent: data.completionPercent || (data.result === 'completed' ? 100 : data.result === 'partial' ? 50 : null),
        updatedAt: now,
        startedAt: null,
      },
    });

    await prisma.actionEvent.create({
      data: {
        actionId: id,
        userId: req.user!.id,
        type: 'ended',
        data: JSON.stringify({ result: data.result }),
      },
    });

    res.json(action);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('End action error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
