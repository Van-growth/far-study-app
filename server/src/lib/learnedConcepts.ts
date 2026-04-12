import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ── Shapes ────────────────────────────────────────────────────
export interface LearnedConcepts {
  concepts: Record<string, number>;
  asc_references: Record<string, number>;
  topic_tags: Record<string, number>;
  trap_patterns: string[];
  updated_at: string;
}

export interface ExtractedConcepts {
  concepts: string[];
  asc_references: string[];
  topic_tags: string[];
  trap_pattern: string | null;
}

// ── Storage ───────────────────────────────────────────────────
// File lives under server/data/ so it survives dev restarts. We never store
// original question text — only the extracted concept metadata.
const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'learned_concepts.json');

const EMPTY: LearnedConcepts = {
  concepts: {},
  asc_references: {},
  topic_tags: {},
  trap_patterns: [],
  updated_at: new Date(0).toISOString(),
};

// Simple serial mutex so two requests can't stomp on each other.
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(task, task);
  chain = next.catch(() => undefined);
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function read(): Promise<LearnedConcepts> {
  try {
    const buf = await fs.readFile(FILE, 'utf8');
    const parsed = JSON.parse(buf);
    if (parsed && typeof parsed === 'object') {
      return {
        concepts: parsed.concepts ?? {},
        asc_references: parsed.asc_references ?? {},
        topic_tags: parsed.topic_tags ?? {},
        trap_patterns: Array.isArray(parsed.trap_patterns) ? parsed.trap_patterns : [],
        updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : EMPTY.updated_at,
      };
    }
  } catch {
    // file missing or unreadable — start fresh
  }
  return { ...EMPTY };
}

async function writeAtomic(data: LearnedConcepts): Promise<void> {
  await ensureDir();
  const tmp = `${FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

function bumpCounts(map: Record<string, number>, items: string[]): void {
  for (const raw of items) {
    if (typeof raw !== 'string') continue;
    const key = raw.trim();
    if (!key) continue;
    map[key] = (map[key] ?? 0) + 1;
  }
}

function mergeInto(existing: LearnedConcepts, extracted: ExtractedConcepts): LearnedConcepts {
  const next: LearnedConcepts = {
    concepts: { ...existing.concepts },
    asc_references: { ...existing.asc_references },
    topic_tags: { ...existing.topic_tags },
    trap_patterns: [...existing.trap_patterns],
    updated_at: new Date().toISOString(),
  };
  bumpCounts(next.concepts, extracted.concepts);
  bumpCounts(next.asc_references, extracted.asc_references);
  bumpCounts(next.topic_tags, extracted.topic_tags);
  if (extracted.trap_pattern && typeof extracted.trap_pattern === 'string') {
    const trimmed = extracted.trap_pattern.trim();
    if (trimmed && !next.trap_patterns.includes(trimmed)) {
      // Cap the list so it can't grow forever.
      next.trap_patterns.unshift(trimmed);
      if (next.trap_patterns.length > 50) {
        next.trap_patterns = next.trap_patterns.slice(0, 50);
      }
    }
  }
  return next;
}

/** Merge-and-persist an extraction. Returns the new accumulated state. */
export function applyExtraction(extracted: ExtractedConcepts): Promise<LearnedConcepts> {
  return serialize(async () => {
    const existing = await read();
    const merged = mergeInto(existing, extracted);
    await writeAtomic(merged);
    return merged;
  });
}

// ── Helpers for prompt injection in other routes ──────────────
export function topConcepts(data: LearnedConcepts, limit = 5): { key: string; count: number }[] {
  return Object.entries(data.concepts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function topTrapPatterns(data: LearnedConcepts, limit = 5): string[] {
  return data.trap_patterns.slice(0, limit);
}
