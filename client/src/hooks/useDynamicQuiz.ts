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

// Concept card streaming. Caller provides an onChunk to accumulate text.
export async function streamConceptCard(
  input: {
    moduleId: string;
    moduleName: string;
    question: string;
    options: string[];
    correctIdx: number;
    selectedIdx: number;
  },
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/concept-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok || !res.body) {
      onError(`HTTP ${res.status}`);
      onDone();
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') { onDone(); return; }
        try {
          const payload = JSON.parse(data) as { text?: string; error?: string };
          if (payload.error) { onError(payload.error); continue; }
          if (payload.text) onChunk(payload.text);
        } catch {
          // skip malformed chunk
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : 'network error');
    onDone();
  }
}
