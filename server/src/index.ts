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

// ─── Find frontend dist ────────────────────────────────────────
// Try to infer the project root from the script location

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const scriptDir = scriptPath ? path.dirname(scriptPath) : process.cwd();

const possibleDistPaths: string[] = [
  // From script location: if script is at server/dist/index.js,
  // then ../../dist = project-root/dist
  path.join(scriptDir, '..', '..', 'dist'),
  path.join(scriptDir, '..', '..', '..', 'dist'),
  // From process.cwd()
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '..', 'dist'),
  path.join(process.cwd(), '..', '..', 'dist'),
  // Common Render paths
  '/opt/render/project/dist',
  '/opt/render/project/pair-os/dist',
  '/app/dist',
];

let frontendDist: string | null = null;
for (const p of possibleDistPaths) {
  try {
    const resolved = path.resolve(p);
    if (fs.existsSync(resolved) && fs.existsSync(path.join(resolved, 'index.html'))) {
      frontendDist = resolved;
      break;
    }
  } catch {
    // ignore
  }
}

// ─── Debug endpoint ────────────────────────────────────────────
app.get('/api/debug', (_req, res) => {
  const checkedPaths = possibleDistPaths.map((p) => {
    try {
      const resolved = path.resolve(p);
      const exists = fs.existsSync(resolved);
      const hasIndex = exists && fs.existsSync(path.join(resolved, 'index.html'));
      let files: string[] = [];
      try {
        if (exists) files = fs.readdirSync(resolved).slice(0, 20);
      } catch { /* ignore */ }
      return { path: resolved, exists, hasIndex, files };
    } catch (e: any) {
      return { path: p, error: e.message };
    }
  });

  res.json({
    cwd: process.cwd(),
    scriptPath,
    scriptDir,
    frontendDist,
    checkedPaths,
  });
});

// ─── Serve static files ────────────────────────────────────────
console.log('=== PairOS Server Startup ===');
console.log('CWD:', process.cwd());
console.log('Script path:', scriptPath);
console.log('Script dir:', scriptDir);
console.log('Frontend dist:', frontendDist || 'NOT FOUND');

if (frontendDist) {
  try {
    const distFiles = fs.readdirSync(frontendDist);
    console.log('Dist contents:', distFiles.slice(0, 15));
    const assetsPath = path.join(frontendDist, 'assets');
    if (fs.existsSync(assetsPath)) {
      console.log('Assets:', fs.readdirSync(assetsPath).slice(0, 10));
    }
  } catch (e) {
    console.log('Could not read dist:', e);
  }

  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist!, 'index.html'));
  });
} else {
  console.log('ERROR: Frontend dist not found. Checked paths:');
  possibleDistPaths.forEach((p) => console.log('  -', path.resolve(p)));
  app.get('/', (_req, res) => {
    res.json({ status: 'error', message: 'Frontend dist not found — check /api/debug for details' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PairOS server running on http://0.0.0.0:${PORT}`);
});
