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
export type ConceptCardType = 'comparison' | 'timeline' | 'formula' | 'plain';
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
  const type: ConceptCardType =
    data.type === 'comparison' || data.type === 'timeline' || data.type === 'formula'
      ? data.type
      : 'plain';
  return {
    type,
    headline: typeof data.headline === 'string' ? data.headline : '',
    sections: (data.sections ?? {}) as ConceptCard['sections'],
  };
}
