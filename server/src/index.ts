import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { runMigrations } from './migrate';
import cors from 'cors';
import helmet from 'helmet';
import claudeRouter from './routes/claude';
import quizRouter from './routes/quiz';
import analyzeRouter from './routes/analyze';
import historyRouter from './routes/history';
import sessionRouter from './routes/session';
import feedbackRouter from './routes/feedback';
import adminRouter from './routes/admin';
import errorPatternsRouter from './routes/errorPatterns';
import tutorRouter from './routes/tutor';
import conceptRouter from './routes/concept';
import ttsRouter from './routes/tts';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

// ── Security headers ─────────────────────────────────────────
// 이 서버는 JSON API 전용(HTML 페이지 없음)이라 CSP는 최소화(default-src 'none').
// HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy는 helmet 기본값 사용.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // CORS로 이미 origin 제한 중 — 별도 origin의 client가 API를 fetch해야 함
}));
// helmet은 Permissions-Policy를 기본 설정하지 않으므로 명시적으로 추가 — 이 API는 카메라/마이크/위치 등 브라우저 기능이 전혀 불필요.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
});

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

// ── Quiz history (persistent) ─────────────────────────────────
app.use('/api', historyRouter);

// ── Daily session logs ────────────────────────────────────────
app.use('/api', sessionRouter);

// ── Feedback (👍👎) ───────────────────────────────────────────
app.use('/api', feedbackRouter);

// ── Admin dashboard ───────────────────────────────────────────
app.use('/api/admin', adminRouter);

// ── Error Pattern Library (Claude 진단 + 브리핑) ──────────────
app.use('/api/error-patterns', errorPatternsRouter);

// ── AI Tutor briefing (HomePage 랜딩) ─────────────────────────
app.use('/api/tutor', tutorRouter);

// ── Concept feedback & AI fix ─────────────────────────────────
app.use('/api/concept', conceptRouter);

// ── Google TTS proxy ──────────────────────────────────────────
app.use('/api/tts', ttsRouter);

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
(async () => {
  try {
    await runMigrations();
  } catch (err) {
    console.error('[migrate] startup migration failed — aborting:', err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`🚀 FAR Study API  →  http://localhost:${PORT}`);
    console.log(`   CORS origin    →  ${CLIENT_URL}`);
  });
})();
