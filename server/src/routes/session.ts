import { Router, Request, Response } from 'express';
import { upsertSession, readSummary } from '../lib/sessionLogs';

const router = Router();

// GET /api/session-logs
router.get('/session-logs', async (_req: Request, res: Response) => {
  try {
    const summary = await readSummary();
    return res.json(summary);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// POST /api/session-logs/save
router.post('/session-logs/save', async (req: Request, res: Response) => {
  try {
    const saved = await upsertSession(req.body);
    return res.json({ saved: true, session: saved });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(400).json({ saved: false, error: m });
  }
});

export default router;
