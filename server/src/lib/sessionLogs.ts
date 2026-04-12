import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface SessionModuleBreakdown {
  moduleId: string;
  total: number;
  correct: number;
}

export interface SessionLog {
  date: string; // YYYY-MM-DD (local day)
  totalSolved: number;
  correctRate: number;
  avgSeconds: number;
  moduleBreakdown: SessionModuleBreakdown[];
  coachComment: string;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const FILE = path.join(DATA_DIR, 'session_logs.json');

let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const next = chain.then(task, task);
  chain = next.catch(() => undefined);
  return next;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readAll(): Promise<SessionLog[]> {
  try {
    const buf = await fs.readFile(FILE, 'utf8');
    const parsed = JSON.parse(buf);
    if (Array.isArray(parsed)) return parsed as SessionLog[];
  } catch {
    // file missing → treat as empty
  }
  return [];
}

async function writeAtomic(items: SessionLog[]): Promise<void> {
  await ensureDir();
  const tmp = `${FILE}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8');
  await fs.rename(tmp, FILE);
}

function validate(s: Partial<SessionLog>): SessionLog {
  if (!s.date || typeof s.date !== 'string') throw new Error('date required');
  return {
    date: s.date,
    totalSolved: Number(s.totalSolved ?? 0),
    correctRate: Number(s.correctRate ?? 0),
    avgSeconds: Number(s.avgSeconds ?? 0),
    moduleBreakdown: Array.isArray(s.moduleBreakdown)
      ? s.moduleBreakdown.map((m) => ({
          moduleId: String(m.moduleId),
          total: Number(m.total),
          correct: Number(m.correct),
        }))
      : [],
    coachComment: String(s.coachComment ?? ''),
  };
}

/** Upsert by date — one session per day. Newest entry for a date wins. */
export function upsertSession(input: Partial<SessionLog>): Promise<SessionLog> {
  return serialize(async () => {
    const session = validate(input);
    const all = await readAll();
    const idx = all.findIndex((s) => s.date === session.date);
    if (idx >= 0) {
      all[idx] = session;
    } else {
      all.push(session);
    }
    // Keep chronological: sort by date asc.
    all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    await writeAtomic(all);
    return session;
  });
}

export async function readSummary(): Promise<{
  sessions: SessionLog[];
  today: SessionLog | null;
  last: SessionLog | null;
}> {
  const all = await readAll();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  return {
    sessions: all,
    today: all.find((s) => s.date === todayStr) ?? null,
    last: all.length > 0 ? all[all.length - 1] : null,
  };
}
