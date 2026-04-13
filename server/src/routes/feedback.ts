import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

const DATA_DIR = path.resolve(__dirname, '../../data');
const LOG_FILE = path.join(DATA_DIR, 'feedback_logs.json');

async function readLog(): Promise<FeedbackEntry[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLog(entries: FeedbackEntry[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LOG_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

interface FeedbackEntry {
  id: string;
  timestamp: string;
  userId?: string | null;
  source: 'claude' | 'coach' | 'quiz';
  messageId: string;
  rating: 'up' | 'down';
  reason?: string | null;
  comment?: string | null;
  messagePreview?: string | null;
  topicId?: string | null;
}

// POST /api/feedback
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    if (body.rating !== 'up' && body.rating !== 'down') {
      return res.status(400).json({ error: 'invalid rating' });
    }
    if (!body.messageId || !body.source) {
      return res.status(400).json({ error: 'messageId and source required' });
    }
    const entry: FeedbackEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      userId: body.userId ?? null,
      source: body.source,
      messageId: body.messageId,
      rating: body.rating,
      reason: body.reason ?? null,
      comment: typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null,
      messagePreview: typeof body.messagePreview === 'string' ? body.messagePreview.slice(0, 500) : null,
      topicId: body.topicId ?? null,
    };
    const log = await readLog();
    log.push(entry);
    await writeLog(log);
    return res.json({ saved: true });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// GET /api/feedback (admin only — basic auth via email header check downstream)
router.get('/feedback', async (_req: Request, res: Response) => {
  try {
    const log = await readLog();
    const ups = log.filter((e) => e.rating === 'up').length;
    const downs = log.filter((e) => e.rating === 'down').length;
    const reasonCounts: Record<string, number> = {};
    for (const e of log) {
      if (e.rating === 'down' && e.reason) {
        reasonCounts[e.reason] = (reasonCounts[e.reason] ?? 0) + 1;
      }
    }
    return res.json({
      total: log.length,
      ups,
      downs,
      upRate: log.length ? ups / log.length : 0,
      reasonCounts,
      recent: log.slice(-50).reverse(),
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
