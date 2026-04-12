import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface HistoryItem {
  id: string;
  timestamp: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  elapsed_seconds: number | null;
  conceptCard: unknown | null;
}

export interface SaveInput {
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  elapsed_seconds: number | null;
  conceptCard: unknown | null;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'quiz_history.json');
const MAX_ITEMS = 1000;

// Serial mutex so concurrent writes don't stomp each other.
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(task, task);
  chain = next.catch(() => undefined);
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<HistoryItem[]> {
  try {
    const buf = await fs.readFile(FILE, 'utf8');
    const parsed = JSON.parse(buf);
    if (Array.isArray(parsed)) return parsed as HistoryItem[];
  } catch {
    // file missing or unreadable — treat as empty
  }
  return [];
}

async function writeAtomic(items: HistoryItem[]): Promise<void> {
  await ensureDir();
  const tmp = `${FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

function validateInput(input: SaveInput): string | null {
  if (typeof input.moduleId !== 'string' || !input.moduleId) return 'moduleId required';
  if (typeof input.question !== 'string' || !input.question) return 'question required';
  if (!Array.isArray(input.options) || input.options.length === 0) return 'options required';
  if (typeof input.correctAnswer !== 'string') return 'correctAnswer required';
  if (typeof input.userAnswer !== 'string') return 'userAnswer required';
  if (typeof input.isCorrect !== 'boolean') return 'isCorrect required';
  if (
    input.elapsed_seconds !== null &&
    (typeof input.elapsed_seconds !== 'number' || input.elapsed_seconds < 0)
  ) {
    return 'elapsed_seconds must be number or null';
  }
  return null;
}

export function appendHistory(input: SaveInput): Promise<HistoryItem> {
  return serialize(async () => {
    const err = validateInput(input);
    if (err) throw new Error(err);
    const items = await readAll();
    const item: HistoryItem = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      moduleId: input.moduleId,
      question: input.question,
      options: input.options,
      correctAnswer: input.correctAnswer,
      userAnswer: input.userAnswer,
      isCorrect: input.isCorrect,
      elapsed_seconds: input.elapsed_seconds,
      conceptCard: input.conceptCard ?? null,
    };
    items.push(item);
    // Cap: drop oldest first, keep newest MAX_ITEMS.
    const trimmed = items.length > MAX_ITEMS ? items.slice(items.length - MAX_ITEMS) : items;
    await writeAtomic(trimmed);
    return item;
  });
}

export async function listHistory(opts: {
  moduleId?: string;
  isCorrect?: boolean;
  limit?: number;
}): Promise<{ items: HistoryItem[]; total: number }> {
  const all = await readAll();
  let filtered = all;
  if (opts.moduleId) filtered = filtered.filter((h) => h.moduleId === opts.moduleId);
  if (typeof opts.isCorrect === 'boolean') {
    filtered = filtered.filter((h) => h.isCorrect === opts.isCorrect);
  }
  // Newest first.
  filtered = filtered.slice().reverse();
  const limit = typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : 100;
  return { items: filtered.slice(0, limit), total: filtered.length };
}

export async function getHistoryItem(id: string): Promise<HistoryItem | null> {
  const all = await readAll();
  return all.find((h) => h.id === id) ?? null;
}
