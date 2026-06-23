import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware as any);

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(checkIns: { date: string }[], referenceDate: string): number {
  const dateSet = new Set(checkIns.map((c) => c.date));
  
  // Start from reference date (today or yesterday if today not checked in)
  let streak = 0;
  let current = new Date(referenceDate + 'T00:00:00');
  
  // If today is checked in, count from today
  // If not, count from yesterday (if yesterday was checked in)
  // If neither, streak is 0
  while (true) {
    const dateStr = formatDate(current);
    if (dateSet.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// Get check-in status for today and streak
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = formatDate(new Date());
    
    // Check if checked in today
    const todayCheckIn = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    
    // Get recent check-ins (last 90 days for streak calculation)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        userId,
        date: {
          gte: formatDate(ninetyDaysAgo),
        },
      },
      orderBy: { date: 'desc' },
    });
    
    const streak = calculateStreak(recentCheckIns, today);
    
    res.json({
      checkedInToday: !!todayCheckIn,
      streak,
      todayDate: today,
      recentDates: recentCheckIns.map((c: { date: string }) => c.date),
    });
  } catch (err) {
    console.error('Get check-in status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Do check-in for today
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = formatDate(new Date());
    
    // Check if already checked in today
    const existing = await prisma.checkIn.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    
    if (existing) {
      res.json({
        checkedIn: true,
        alreadyCheckedIn: true,
        date: today,
        streak: 0, // Will be recalculated by client
      });
      return;
    }
    
    // Create check-in
    await prisma.checkIn.create({
      data: {
        userId,
        date: today,
      },
    });
    
    // Recalculate streak
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentCheckIns = await prisma.checkIn.findMany({
      where: {
        userId,
        date: {
          gte: formatDate(ninetyDaysAgo),
        },
      },
      orderBy: { date: 'desc' },
    });
    
    const streak = calculateStreak(recentCheckIns, today);
    
    res.json({
      checkedIn: true,
      alreadyCheckedIn: false,
      date: today,
      streak,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
