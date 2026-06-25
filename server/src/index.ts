import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import actionRoutes from './routes/actions.js';
import partnerRoutes from './routes/partner.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import checkinRoutes from './routes/checkin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/checkin', checkinRoutes);

// Serve frontend static files in production
// Try multiple possible locations since cwd varies by deployment
const possibleDistPaths = [
  path.join(process.cwd(), 'dist'),               // cwd = project root
  path.join(process.cwd(), '..', 'dist'),         // cwd = server/
  path.join(process.cwd(), '..', '..', 'dist'),   // cwd = server/dist
  path.join(process.cwd(), 'server', '..', 'dist'), // cwd = server/ (npm run from server)
];

let frontendDist: string | null = null;
for (const p of possibleDistPaths) {
  try {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
      frontendDist = p;
      break;
    }
  } catch {
    // ignore
  }
}

console.log('CWD:', process.cwd());
console.log('Frontend dist path:', frontendDist || 'NOT FOUND');
if (frontendDist) {
  console.log('Dist files:', fs.readdirSync(frontendDist).slice(0, 10));
}

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist!, 'index.html'));
  });
} else {
  console.log('Frontend dist not found, running in API-only mode');
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', message: 'API-only mode — frontend dist not found' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PairOS server running on http://0.0.0.0:${PORT}`);
});
