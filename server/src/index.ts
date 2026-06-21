import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import authRoutes from './routes/auth.js';
import actionRoutes from './routes/actions.js';
import partnerRoutes from './routes/partner.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';

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

// Serve frontend static files in production
const frontendDistPaths = [
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '../dist'),
  path.join(__dirname, '../../dist'),
];

const frontendDist = frontendDistPaths.find((p) => {
  try {
    return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.log('Frontend dist not found, running in API-only mode');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PairOS server running on http://0.0.0.0:${PORT}`);
});
