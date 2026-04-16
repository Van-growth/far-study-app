import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/feedback
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured' });
    }

    const body = req.body ?? {};
    if (body.rating !== 'up' && body.rating !== 'down') {
      return res.status(400).json({ error: 'invalid rating' });
    }
    if (!body.messageId || !body.source) {
      return res.status(400).json({ error: 'messageId and source required' });
    }

    const { error } = await supabase.from('feedback_logs').insert({
      user_id: body.userId ?? null,
      source: body.source,
      message_id: body.messageId,
      rating: body.rating,
      reason: body.reason ?? null,
      comment: typeof body.comment === 'string' ? body.comment.slice(0, 2000) : null,
      message_preview: typeof body.messagePreview === 'string' ? body.messagePreview.slice(0, 500) : null,
      topic_id: body.topicId ?? null,
    });

    if (error) {
      console.error('[feedback] insert error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ saved: true });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// GET /api/feedback
router.get('/feedback', async (_req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.json({ total: 0, ups: 0, downs: 0, upRate: 0, reasonCounts: {}, recent: [] });
    }

    const { data, error } = await supabase
      .from('feedback_logs')
      .select('id, rating, reason, comment, source, topic_id, message_preview, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[feedback] select error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const log = data ?? [];
    const ups = log.filter((e) => e.rating === 'up').length;
    const downs = log.filter((e) => e.rating === 'down').length;
    const total = log.length;
    const reasonCounts: Record<string, number> = {};
    for (const e of log) {
      if (e.rating === 'down' && e.reason) {
        reasonCounts[e.reason] = (reasonCounts[e.reason] ?? 0) + 1;
      }
    }

    return res.json({
      total,
      ups,
      downs,
      upRate: total ? ups / total : 0,
      reasonCounts,
      recent: log.slice(0, 50),
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
