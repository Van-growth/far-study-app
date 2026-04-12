import { Router, Request, Response } from 'express';
import {
  appendHistory,
  listHistory,
  getHistoryItem,
  SaveInput,
} from '../lib/quizHistory';

const router = Router();

// POST /api/history/save
router.post('/history/save', async (req: Request, res: Response) => {
  try {
    const input = req.body as Partial<SaveInput>;
    const saved = await appendHistory({
      moduleId: input.moduleId ?? '',
      question: input.question ?? '',
      options: Array.isArray(input.options) ? input.options.map((o) => String(o)) : [],
      correctAnswer: String(input.correctAnswer ?? ''),
      userAnswer: String(input.userAnswer ?? ''),
      isCorrect: !!input.isCorrect,
      elapsed_seconds:
        input.elapsed_seconds === null || input.elapsed_seconds === undefined
          ? null
          : Number(input.elapsed_seconds),
      conceptCard: input.conceptCard ?? null,
    });
    return res.json({ id: saved.id, saved: true });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(400).json({ saved: false, error: m });
  }
});

// GET /api/history?moduleId=&isCorrect=&limit=
router.get('/history', async (req: Request, res: Response) => {
  try {
    const moduleId = typeof req.query.moduleId === 'string' ? req.query.moduleId : undefined;
    let isCorrect: boolean | undefined;
    if (req.query.isCorrect === 'true') isCorrect = true;
    else if (req.query.isCorrect === 'false') isCorrect = false;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const result = await listHistory({ moduleId, isCorrect, limit });
    return res.json(result);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

// GET /api/history/:id
router.get('/history/:id', async (req: Request, res: Response) => {
  try {
    const item = await getHistoryItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'not found' });
    return res.json(item);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
