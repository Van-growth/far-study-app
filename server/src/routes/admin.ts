import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

const DATA_DIR = path.resolve(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'quiz_history.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback_logs.json');
const LEARNED_FILE = path.join(DATA_DIR, 'learned_concepts.json');
const EXTRACTION_LOG_FILE = path.join(DATA_DIR, 'concept_extraction_log.json');

const ADMIN_EMAIL = 'sg.van.p@gmail.com';

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function requireAdmin(req: Request, res: Response): boolean {
  const email = (req.headers['x-user-email'] as string | undefined) ?? '';
  if (email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: 'admin only' });
    return false;
  }
  return true;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  moduleId: string;
  question: string;
  isCorrect: boolean;
  elapsed_seconds: number | null;
  userId?: string | null;
}

interface FeedbackEntry {
  id: string;
  timestamp: string;
  userId?: string | null;
  rating: 'up' | 'down';
  reason?: string | null;
  source: string;
}

interface LearnedState {
  concepts: Record<string, number>;
  asc_references: Record<string, number>;
  topic_tags: Record<string, number>;
  trap_patterns: string[];
  updated_at: string | null;
}

interface ExtractionLogEntry {
  timestamp: string;
  date: string;
  conceptsCount: number;
  ascCount: number;
  tagsCount: number;
  trapPattern: string | null;
}

// GET /api/admin/dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [history, feedback, learned, extractionLog] = await Promise.all([
      readJson<HistoryItem[]>(HISTORY_FILE, []),
      readJson<FeedbackEntry[]>(FEEDBACK_FILE, []),
      readJson<LearnedState>(LEARNED_FILE, {
        concepts: {},
        asc_references: {},
        topic_tags: {},
        trap_patterns: [],
        updated_at: null,
      }),
      readJson<ExtractionLogEntry[]>(EXTRACTION_LOG_FILE, []),
    ]);

    // Feedback stats
    const ups = feedback.filter((f) => f.rating === 'up').length;
    const downs = feedback.filter((f) => f.rating === 'down').length;
    const total = feedback.length;
    const reasonCounts: Record<string, number> = {};
    for (const f of feedback) {
      if (f.rating === 'down' && f.reason) {
        reasonCounts[f.reason] = (reasonCounts[f.reason] ?? 0) + 1;
      }
    }

    // Wrong-answer top 10 by question text
    const wrongMap: Record<string, { q: string; wrong: number; total: number; moduleId: string }> = {};
    for (const h of history) {
      const key = (h.question ?? '').slice(0, 140);
      if (!key) continue;
      const row = wrongMap[key] ?? { q: key, wrong: 0, total: 0, moduleId: h.moduleId };
      row.total += 1;
      if (!h.isCorrect) row.wrong += 1;
      wrongMap[key] = row;
    }
    const wrongTop10 = Object.values(wrongMap)
      .filter((r) => r.total >= 2)
      .map((r) => ({ ...r, wrongRate: r.wrong / r.total }))
      .sort((a, b) => b.wrongRate - a.wrongRate || b.wrong - a.wrong)
      .slice(0, 10);

    // DAU/MAU — from history timestamps grouped by day + unique userId
    const dayMap: Record<string, Set<string>> = {};
    const monthMap: Record<string, Set<string>> = {};
    for (const h of history) {
      const d = (h.timestamp ?? '').slice(0, 10);
      const m = (h.timestamp ?? '').slice(0, 7);
      const uid = h.userId ?? 'anon';
      if (d) (dayMap[d] ??= new Set()).add(uid);
      if (m) (monthMap[m] ??= new Set()).add(uid);
    }
    const dau = Object.entries(dayMap)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 30)
      .map(([date, set]) => ({ date, count: set.size }));
    const mau = Object.entries(monthMap)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 12)
      .map(([month, set]) => ({ month, count: set.size }));

    // Average solve time
    const solveTimes = history
      .map((h) => h.elapsed_seconds)
      .filter((s): s is number => typeof s === 'number' && s > 0);
    const avgSolveSeconds =
      solveTimes.length > 0
        ? Math.round(solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length)
        : 0;

    // ── Becker 분석 현황 ───────────────────────────────────
    const dailyCountMap: Record<string, number> = {};
    for (const e of extractionLog) {
      if (!e.date) continue;
      dailyCountMap[e.date] = (dailyCountMap[e.date] ?? 0) + 1;
    }
    const dailyExtractions = Object.entries(dailyCountMap)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 30)
      .map(([date, count]) => ({ date, count }));

    const topConceptsList = Object.entries(learned.concepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));
    const topAscList = Object.entries(learned.asc_references)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));

    const becker = {
      totalExtractions: extractionLog.length,
      uniqueConcepts: Object.keys(learned.concepts).length,
      uniqueAsc: Object.keys(learned.asc_references).length,
      trapPatterns: learned.trap_patterns.slice(0, 20),
      topConcepts: topConceptsList,
      topAsc: topAscList,
      dailyExtractions,
      updatedAt: learned.updated_at,
    };

    return res.json({
      feedback: {
        total,
        ups,
        downs,
        upRate: total ? ups / total : 0,
        reasonCounts,
      },
      wrongTop10,
      dau,
      mau,
      avgSolveSeconds,
      totalAnswered: history.length,
      becker,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
