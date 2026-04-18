const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

export type QuestionConfidence = 'high' | 'medium' | 'low';

export interface GeneratedQuestion {
  q: string;
  opts: string[];
  ans: number; // 0-3
  exp: string;
  confidence?: QuestionConfidence;
  warning?: string | null;
  /** 내부 태그 — concept_stats 누적용. stem/exp에는 노출 안 됨. */
  source_concepts?: string[];
  source_trap?: string | null;
}

export interface WeakModuleRef {
  id: string;
  label: string;
  accuracy: number;
}

/** concept_stats 기반 취약 태그 — /api/generate-question 요청 시 전달. */
export interface WeakConceptRef {
  tag: string;
  tag_type: 'concept' | 'trap';
  accuracy: number;
  total: number;
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
/** Single-line item inside a trap's derivation table. */
export interface TrapCalcRow {
  label: string;
  amount: number;
  is_total?: boolean;
  is_subtraction?: boolean;
}

export interface TrapBlock {
  option: string;
  reason: string;
  /** The numeric value the wrong option represents (if the wrong answer
   * is a specific dollar amount or number). */
  amount?: number | null;
  /** Step-by-step derivation of how a student would arrive at this wrong
   * answer. Rendered as a compact computation block in the trap card. */
  calculation?: TrapCalcRow[];
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
  correct_approach?: string | null;
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
  focusConcept?: string | null,
  weakConcepts?: WeakConceptRef[],
): Promise<GeneratedQuestion> {
  const res = await fetch(`${API_URL}/api/generate-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moduleId,
      moduleName,
      weakModules,
      recentWrongTopics,
      ...(focusConcept ? { focusConcept } : {}),
      ...(weakConcepts && weakConcepts.length ? { weakConcepts } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as GeneratedQuestion;
  cacheQuestion(moduleId, data);
  return data;
}

// ── Persistent quiz history ───────────────────────────────────
export async function saveHistory(input: {
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  elapsed_seconds: number | null;
  conceptCard: ConceptCard | null;
}): Promise<{ id: string; saved: boolean }> {
  const res = await fetch(`${API_URL}/api/history/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { id: string; saved: boolean };
}


// ── Learned concept data types ────────────────────────────────
export interface LearnedConcepts {
  concepts: Record<string, number>;
  asc_references: Record<string, number>;
  topic_tags: Record<string, number>;
  trap_patterns: string[];
  updated_at: string;
}

export interface ConceptTrigger {
  keyword: string;
  auto_rule: string;
  trap: string;
  comparison: string;
  irrelevant: string;
}

export interface ExtractedConcepts {
  concepts: string[];
  asc_references: string[];
  topic_tags: string[];
  trap_pattern: string | null;
  triggers: ConceptTrigger[];
}

export async function extractConcepts(input: {
  questionText: string;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  topicId?: string | null;
}): Promise<{ extracted: ExtractedConcepts; learned: LearnedConcepts; correctedTopicId?: string | null }> {
  const res = await fetch(`${API_URL}/api/extract-concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as { extracted: ExtractedConcepts; learned: LearnedConcepts; correctedTopicId?: string | null };
}

export async function fetchLearnedConcepts(): Promise<LearnedConcepts> {
  const res = await fetch(`${API_URL}/api/learned-concepts`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as LearnedConcepts;
}

// Raw-text concept card — for the "문제 분석" paste flow.
// Reuses /api/concept-card but sends the rawText branch.
export async function fetchConceptCardFromText(input: {
  rawText: string;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  topicId?: string | null;
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
  if (!data || typeof data !== 'object') throw new Error('invalid concept card response');
  const ALLOWED: ConceptCardType[] = [
    'comparison', 'timeline', 'formula', 'plain',
    'income_statement', 'balance_sheet', 'scf', 'multi_statement',
  ];
  const type: ConceptCardType = data.type && ALLOWED.includes(data.type) ? data.type : 'plain';
  return {
    type,
    headline: typeof data.headline === 'string' ? data.headline : '',
    correct_approach: typeof data.correct_approach === 'string' ? data.correct_approach : null,
    sections: (data.sections ?? {}) as ConceptCard['sections'],
    statement: (data as ConceptCard).statement,
    notes: (data as ConceptCard).notes,
  };
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
    correct_approach: typeof data.correct_approach === 'string' ? data.correct_approach : null,
    sections: (data.sections ?? {}) as ConceptCard['sections'],
    statement: (data as ConceptCard).statement,
    notes: (data as ConceptCard).notes,
  };
}
