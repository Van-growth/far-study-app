// Background prewarming of quiz questions so the first click after app
// launch feels instant. Kicks off on import; results are stashed in a
// module-level queue that QuizPage consumes for its initial buffer fill.
import { generateQuestion, GeneratedQuestion } from './useDynamicQuiz';
import { allTopics, areas } from '../data/far-topics';

export interface PrewarmedQuestion {
  moduleId: string;
  moduleLabel: string;
  areaColor: string;
  q: string;
  opts: [string, string, string, string];
  ans: number;
  exp: string;
  confidence?: GeneratedQuestion['confidence'];
  warning?: string | null;
}

const PREWARM_COUNT = 2;
let started = false;
const ready: PrewarmedQuestion[] = [];

function pickRandomTopic() {
  return allTopics[Math.floor(Math.random() * allTopics.length)];
}

function areaColorFor(topicId: string): string {
  return areas.find((a) => a.topics.some((t) => t.id === topicId))?.color ?? '#4f6ef7';
}

export function startPrewarmQuiz(count = PREWARM_COUNT) {
  if (started) return;
  started = true;
  for (let i = 0; i < count; i++) {
    const t = pickRandomTopic();
    if (!t) continue;
    generateQuestion(t.id, t.label, [], [])
      .then((gen) => {
        if (
          !gen ||
          typeof gen.q !== 'string' ||
          !Array.isArray(gen.opts) ||
          gen.opts.length !== 4
        ) return;
        ready.push({
          moduleId: t.id,
          moduleLabel: t.label,
          areaColor: areaColorFor(t.id),
          q: gen.q,
          opts: gen.opts as [string, string, string, string],
          ans: gen.ans,
          exp: gen.exp,
          confidence: gen.confidence,
          warning: gen.warning ?? null,
        });
      })
      .catch(() => {
        // Silent — prefetch failure is not user-visible; the regular
        // fetch path will still serve the first question.
      });
  }
}

/** Drain all prewarmed questions. Caller hydrates its buffer with them. */
export function drainPrewarmed(): PrewarmedQuestion[] {
  const out = ready.splice(0, ready.length);
  return out;
}
