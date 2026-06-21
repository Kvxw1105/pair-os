import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

const inviteSchema = z.object({
  partnerEmail: z.string().email(),
});

router.get('/status', async (req: AuthRequest, res) => {
  try {
    const partnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId: req.user!.id },
          { partnerId: req.user!.id },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        partner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!partnership) {
      res.json({ partner: null });
      return;
    }

    const isUser = partnership.userId === req.user!.id;
    const partner = isUser ? partnership.partner : partnership.user;

    // Get partner's current active action
    const activeAction = await prisma.action.findFirst({
      where: { userId: partner.id, state: 'active' },
      orderBy: { startedAt: 'desc' },
    });

    res.json({
      partner: {
        id: partner.id,
        name: partner.name,
        status: activeAction ? 'active' : 'idle',
        currentActionTitle: activeAction?.title || null,
        lastActiveAt: activeAction?.startedAt?.getTime() || null,
      },
      partnershipStatus: partnership.status,
    });
  } catch (err) {
    console.error('Get partner status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/invite', async (req: AuthRequest, res) => {
  try {
    const data = inviteSchema.parse(req.body);

    const partner = await prisma.user.findUnique({
      where: { email: data.partnerEmail },
    });
    if (!partner) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (partner.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot invite yourself' });
      return;
    }

    const existing = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId: req.user!.id },
          { partnerId: req.user!.id },
        ],
      },
    });
    if (existing) {
      res.status(400).json({ error: 'You already have a partner' });
      return;
    }

    const partnership = await prisma.partnership.create({
      data: {
        userId: req.user!.id,
        partnerId: partner.id,
        status: 'active',
      },
    });

    res.json({ partnership });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Invite partner error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/', async (req: AuthRequest, res) => {
  try {
    await prisma.partnership.deleteMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { partnerId: req.user!.id },
        ],
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Remove partner error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
