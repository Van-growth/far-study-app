import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const DATA_DIR = path.resolve(__dirname, '../../data');
const HISTORY_FILE = path.join(DATA_DIR, 'quiz_history.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback_logs.json');
const LEARNED_FILE = path.join(DATA_DIR, 'learned_concepts.json');
const EXTRACTION_LOG_FILE = path.join(DATA_DIR, 'concept_extraction_log.json');

const ADMIN_EMAIL = 'sg.van.p@gmail.com';

// Supabase client for concept_extractions coverage query
const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = sbUrl && sbKey ? createClient(sbUrl, sbKey) : null;

// 전체 Becker 모듈 목록 — 커버리지 공백 계산용
const ALL_TOPICS: { id: string; label: string }[] = [
  { id: 'F1-M1', label: 'Balance Sheet, I/S & CI' },
  { id: 'F1-M2', label: 'EPS & Public Company' },
  { id: 'F1-M3', label: "Stockholders' Equity Part 1" },
  { id: 'F1-M4', label: "Stockholders' Equity Part 2" },
  { id: 'F1-M5', label: 'Subsequent Events' },
  { id: 'F1-M6', label: 'Fair Value Measurements' },
  { id: 'F1-M7', label: 'Special Purpose Frameworks' },
  { id: 'F1-M8', label: 'Ratio & Variance Analysis' },
  { id: 'F2-M1', label: 'Revenue Recognition' },
  { id: 'F2-M2', label: 'Accounting Changes' },
  { id: 'F2-M3', label: 'Adjusting Journal Entries' },
  { id: 'F2-M4', label: 'Notes to FS' },
  { id: 'F2-M5', label: 'Subsequent Events' },
  { id: 'F2-M6', label: 'Fair Value Measurements' },
  { id: 'F2-M7', label: 'Special Purpose Frameworks' },
  { id: 'F2-M8', label: 'Ratio & Variance Analysis' },
  { id: 'F3-M1', label: 'Cash & Equivalents' },
  { id: 'F3-M2', label: 'Trade Receivables' },
  { id: 'F3-M3', label: 'Inventory' },
  { id: 'F3-M4', label: 'PP&E: Cost Basis' },
  { id: 'F3-M5', label: 'PP&E: Depreciation' },
  { id: 'F3-M6', label: 'Intangibles' },
  { id: 'F4-M1', label: 'Payables & Accrued' },
  { id: 'F4-M2', label: 'Contingencies' },
  { id: 'F4-M3', label: 'Long-Term Liabilities' },
  { id: 'F4-M4', label: 'Bonds Part 1' },
  { id: 'F4-M5', label: 'Bonds Part 2' },
  { id: 'F4-M6', label: 'TDR & Extinguishment' },
  { id: 'F4-M7', label: 'Lessee Accounting' },
  { id: 'F5-M1', label: 'Financial Instruments' },
  { id: 'F5-M2', label: 'Equity Method' },
  { id: 'F5-M3', label: 'Consolidated Statements' },
  { id: 'F5-M4', label: 'Partnerships' },
  { id: 'F5-M5', label: 'Statement of Cash Flows' },
  { id: 'F5-M6', label: 'Income Taxes Part 1' },
  { id: 'F5-M7', label: 'Income Taxes Part 2' },
  { id: 'F6-M1', label: 'NFP Part 1' },
  { id: 'F6-M2', label: 'NFP Part 2' },
  { id: 'F6-M3', label: 'NFP Revenue' },
  { id: 'F6-M4', label: 'NFP Transfers' },
  { id: 'F6-M5', label: 'Governmental Accounting' },
  { id: 'F6-M6', label: 'Governmental Funds' },
];

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

interface TopicCoverage {
  topic_id: string;
  label: string;
  count: number;
  trap_count: number;
  last_updated: string | null;
}

async function fetchTopicCoverage(): Promise<{
  topics: TopicCoverage[];
  gaps: string[];
}> {
  if (!supabase) {
    return { topics: [], gaps: ALL_TOPICS.map((t) => t.id) };
  }
  try {
    const { data, error } = await supabase
      .from('concept_extractions')
      .select('topic_id, trap_pattern, created_at');
    if (error || !data) {
      return { topics: [], gaps: ALL_TOPICS.map((t) => t.id) };
    }

    // topic_id별 집계
    const map = new Map<string, { count: number; trapCount: number; lastAt: string }>();
    for (const row of data) {
      const tid = row.topic_id as string | null;
      if (!tid) continue;
      const existing = map.get(tid) ?? { count: 0, trapCount: 0, lastAt: '' };
      existing.count++;
      if (row.trap_pattern) existing.trapCount++;
      const ca = row.created_at as string;
      if (ca > existing.lastAt) existing.lastAt = ca;
      map.set(tid, existing);
    }

    const topics: TopicCoverage[] = ALL_TOPICS.map((t) => {
      const stats = map.get(t.id);
      return {
        topic_id: t.id,
        label: t.label,
        count: stats?.count ?? 0,
        trap_count: stats?.trapCount ?? 0,
        last_updated: stats?.lastAt || null,
      };
    });

    // count > 0 기준 정렬 (많은 순)
    topics.sort((a, b) => b.count - a.count);

    const gaps = ALL_TOPICS
      .filter((t) => !map.has(t.id))
      .map((t) => `${t.id} (${t.label})`);

    return { topics, gaps };
  } catch {
    return { topics: [], gaps: ALL_TOPICS.map((t) => t.id) };
  }
}

// GET /api/admin/dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [history, feedback, learned, extractionLog, coverage] = await Promise.all([
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
      fetchTopicCoverage(),
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
      coverage,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    return res.status(500).json({ error: m });
  }
});

export default router;
