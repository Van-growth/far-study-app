const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

export interface GeneratedQuestion {
  q: string;
  opts: string[];
  ans: number; // 0-3
  exp: string;
}

export interface WeakModuleRef {
  id: string;
  label: string;
  accuracy: number;
}

// ── Structured concept card ───────────────────────────────────
export interface CompareBlock {
  left: { label: string; rows: string[] };
  right: { label: string; rows: string[] };
}
export interface GapBlock {
  label: string;
  rows: string[];
  note?: string;
}
export interface CalculationBlock {
  steps: string[];
  result: string;
}
export interface TimelineBlock {
  events: { label: string; detail?: string }[];
}
export interface TrapBlock {
  option: string;
  reason: string;
}
// ── Statement-shaped rows (I/S, B/S, SCF, multi) ──────────────
export type HighlightColor = 'amber' | 'blue' | 'purple' | 'green';

export interface StatementRow {
  label: string;
  amount: number | null;
  indent: 0 | 1 | 2;
  highlight: boolean;
  highlight_color: HighlightColor | null;
  is_total: boolean;
  is_subtraction: boolean;
  note_tag: string | null;
}

export interface StatementNote {
  tag: string;
  text: string;
  color?: HighlightColor;
}

export interface IncomeStatementSection {
  label: string;
  rows: StatementRow[];
}
export interface IncomeStatementData {
  title: string;
  sections: IncomeStatementSection[];
}

export interface BalanceSheetData {
  title: string;
  assets: { current: StatementRow[]; noncurrent: StatementRow[] };
  liabilities: { current: StatementRow[]; noncurrent: StatementRow[] };
  equity: StatementRow[];
}

export interface SCFSection {
  label: 'Operating' | 'Investing' | 'Financing';
  rows: StatementRow[];
}
export interface SCFData {
  title: string;
  method: 'indirect' | 'direct';
  sections: SCFSection[];
}

export type MultiStatementEntry =
  | { type: 'income_statement'; data: IncomeStatementData }
  | { type: 'balance_sheet'; data: BalanceSheetData }
  | { type: 'scf'; data: SCFData };

export interface MultiStatementData {
  statements: (MultiStatementEntry | null)[];
}

export type StatementData =
  | IncomeStatementData
  | BalanceSheetData
  | SCFData
  | MultiStatementData;

export type ConceptCardType =
  | 'comparison'
  | 'timeline'
  | 'formula'
  | 'plain'
  | 'income_statement'
  | 'balance_sheet'
  | 'scf'
  | 'multi_statement';

export interface ConceptCard {
  type: ConceptCardType;
  headline: string;
  sections: {
    compare?: CompareBlock;
    gap?: GapBlock;
    calculation?: CalculationBlock;
    timeline?: TimelineBlock;
    markdown?: string;
    traps?: TrapBlock[];
  };
  /** For income_statement / balance_sheet / scf / multi_statement. */
  statement?: StatementData;
  /** Notes referenced by row.note_tag. Used by statement renderers. */
  notes?: StatementNote[];
}

// ── localStorage cache ────────────────────────────────────────
// Bucketed by moduleId → list of generated questions. Grows across sessions
// so students see variety and don't burn API on repeats.
const CACHE_KEY = 'far_dynamic_quiz_cache_v1';
const MAX_PER_MODULE = 40;

function loadCache(): Record<string, GeneratedQuestion[]> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, GeneratedQuestion[]>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full — drop oldest entries
    const entries = Object.entries(cache);
    if (entries.length > 20) {
      const trimmed = Object.fromEntries(entries.slice(-10));
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
      } catch {/* give up */}
    }
  }
}

export function cacheQuestion(moduleId: string, q: GeneratedQuestion) {
  const cache = loadCache();
  const list = cache[moduleId] ?? [];
  // de-dupe by question text
  if (list.some((x) => x.q === q.q)) return;
  list.push(q);
  cache[moduleId] = list.slice(-MAX_PER_MODULE);
  saveCache(cache);
}

export function getCachedPool(moduleId: string): GeneratedQuestion[] {
  return loadCache()[moduleId] ?? [];
}

export function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {/* ignore */}
}

// ── API calls ─────────────────────────────────────────────────

export async function generateQuestion(
  moduleId: string,
  moduleName: string,
  weakModules: WeakModuleRef[],
  recentWrongTopics: string[],
): Promise<GeneratedQuestion> {
  const res = await fetch(`${API_URL}/api/generate-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moduleId, moduleName, weakModules, recentWrongTopics }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as GeneratedQuestion;
  cacheQuestion(moduleId, data);
  return data;
}

// Structured concept card fetch (non-streaming).
// Server returns a ConceptCard shaped by problem type; client renders
// per-type sections. Falls back to a "plain" card with an error note if the
// server response is malformed.
export async function fetchConceptCard(input: {
  moduleId: string;
  moduleName: string;
  question: string;
  options: string[];
  correctIdx: number;
  selectedIdx: number;
}): Promise<ConceptCard> {
  const res = await fetch(`${API_URL}/api/concept-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as Partial<ConceptCard> | null;
  if (!data || typeof data !== 'object') {
    throw new Error('invalid concept card response');
  }
  const ALLOWED: ConceptCardType[] = [
    'comparison',
    'timeline',
    'formula',
    'plain',
    'income_statement',
    'balance_sheet',
    'scf',
    'multi_statement',
  ];
  const type: ConceptCardType =
    data.type && ALLOWED.includes(data.type) ? data.type : 'plain';
  return {
    type,
    headline: typeof data.headline === 'string' ? data.headline : '',
    sections: (data.sections ?? {}) as ConceptCard['sections'],
    statement: (data as ConceptCard).statement,
    notes: (data as ConceptCard).notes,
  };
}
