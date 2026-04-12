import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import claudeRouter from './routes/claude';
import quizRouter from './routes/quiz';
import analyzeRouter from './routes/analyze';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Claude proxy ──────────────────────────────────────────────
app.use('/api/claude', claudeRouter);

// ── Dynamic quiz endpoints ────────────────────────────────────
app.use('/api', quizRouter);

// ── Analyze / learned concepts ────────────────────────────────
app.use('/api', analyzeRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FAR Study API  →  http://localhost:${PORT}`);
  console.log(`   CORS origin    →  ${CLIENT_URL}`);
});
