import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

const inviteSchema = z.object({
  partnerEmail: z.string().email(),
});

// Get all partners for current user
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const partnerships = await prisma.partnership.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { partnerId: req.user!.id },
        ],
        status: 'active',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
        partner: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
      },
    });

    const partners = await Promise.all(partnerships.map(async (p) => {
      const isUser = p.userId === req.user!.id;
      const partner = isUser ? p.partner : p.user;

      const activeAction = await prisma.action.findFirst({
        where: { userId: partner.id, state: 'active' },
        orderBy: { startedAt: 'desc' },
      });

      return {
        id: partner.id,
        name: partner.name,
        avatar: partner.avatar,
        bio: partner.bio,
        status: activeAction ? 'active' : 'idle' as const,
        currentActionTitle: activeAction?.title || null,
        lastActiveAt: activeAction?.startedAt?.getTime() || null,
      };
    }));

    res.json({ partners });
  } catch (err) {
    console.error('Get partner status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate invite link endpoint
router.get('/invite-link', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      inviteCode: user.id,
      inviterName: user.name,
    });
  } catch (err) {
    console.error('Get invite link error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invite (for new users registering via invite link)
router.post('/accept-invite', async (req, res) => {
  try {
    const { inviteCode, email, password, name } = z.object({
      inviteCode: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1).max(50),
    }).parse(req.body);

    const inviter = await prisma.user.findUnique({
      where: { id: inviteCode },
    });
    if (!inviter) {
      res.status(404).json({ error: 'Invite link invalid or expired' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        onboardingCompleted: true,
      },
    });

    await prisma.partnership.create({
      data: {
        userId: inviter.id,
        partnerId: newUser.id,
        status: 'active',
      },
    });

    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      partnerName: inviter.name,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invite info (public, no auth needed)
router.get('/invite-info/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const inviter = await prisma.user.findUnique({
      where: { id: inviteCode },
      select: { id: true, name: true },
    });
    if (!inviter) {
      res.status(404).json({ error: 'Invite link invalid' });
      return;
    }

    res.json({
      inviterName: inviter.name,
      inviterId: inviter.id,
      available: true,
    });
  } catch (err) {
    console.error('Get invite info error:', err);
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

    // Check if already partnered with this specific person
    const existing = await prisma.partnership.findFirst({
      where: {
        OR: [
          { userId: req.user!.id, partnerId: partner.id },
          { userId: partner.id, partnerId: req.user!.id },
        ],
      },
    });
    if (existing) {
      res.status(400).json({ error: 'You are already partnered with this user' });
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

router.delete('/:partnerId', async (req: AuthRequest, res) => {
  try {
    const { partnerId } = req.params;
    await prisma.partnership.deleteMany({
      where: {
        OR: [
          { userId: req.user!.id, partnerId },
          { userId: partnerId, partnerId: req.user!.id },
        ],
      },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Remove partner error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partner Messages — 炸弹/爱心/睡帽
const messageSchema = z.object({
  type: z.enum(['bomb', 'heart', 'sleep']),
  message: z.string().max(200).optional(),
  receiverId: z.string().optional(),
});

router.post('/message', async (req: AuthRequest, res) => {
  try {
    const { type, message, receiverId } = messageSchema.parse(req.body);
    const userId = req.user!.id;

    let targetReceiverId: string;
    if (receiverId) {
      targetReceiverId = receiverId;
    } else {
      // Find first active partnership
      const partnership = await prisma.partnership.findFirst({
        where: {
          OR: [
            { userId },
            { partnerId: userId },
          ],
          status: 'active',
        },
      });

      if (!partnership) {
        res.status(400).json({ error: 'No active partner' });
        return;
      }

      targetReceiverId = partnership.userId === userId ? partnership.partnerId : partnership.userId;
    }

    const msg = await prisma.partnerMessage.create({
      data: {
        senderId: userId,
        receiverId: targetReceiverId,
        type,
        message: message || null,
      },
    });

    res.json({ success: true, message: msg });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const messages = await prisma.partnerMessage.findMany({
      where: {
        receiverId: userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/messages/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.partnerMessage.update({
      where: { id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
