import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { generateToken } from '../middleware/auth.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.get('/me', authMiddleware as any, async (req: AuthRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
      select: { id: true, email: true, name: true },
    });

    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest register — only requires name, auto-generates email/password
router.post('/guest', async (req, res) => {
  try {
    const { name } = z.object({
      name: z.string().min(1).max(50),
    }).parse(req.body);

    const guestId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(2);
    const guestEmail = `guest_${guestId}@pairos.local`;
    const guestPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const passwordHash = await bcrypt.hash(guestPassword, 10);

    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        passwordHash,
        name,
        onboardingCompleted: true,
      },
      select: { id: true, email: true, name: true },
    });

    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Guest register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
