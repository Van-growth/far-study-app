import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { allTopics, areas, Topic } from '../data/far-topics';
import useStudyStore, { QuizLogPayload } from '../store/studyStore';
import { getAccuracy, SRCard } from '../lib/srs';
import QuizView, { QuizItemWithContext, QuizResult } from '../components/quiz/QuizView';
import {
  generateQuestion,
  WeakModuleRef,
  saveHistory,
  ConceptCard,
  QuestionConfidence,
} from '../hooks/useDynamicQuiz';
import { saveQuizLog, getConceptStats } from '../lib/db';
import MobileSectionDrawer from '../components/layout/MobileSectionDrawer';
import { drainPrewarmed } from '../hooks/prewarmQuiz';

const SESSION_MAX = 20;
const BUFFER_CAPACITY = 2;
const SESSION_PERSIST_KEY = 'far_quiz_sessions_v1';
const HISTORY_PERSIST_KEY = 'far_quiz_history_v1';
const LAST_KEY_PERSIST_KEY = 'far_quiz_last_session_key_v1';

function loadPersistedSessions(): Record<string, ModuleSnapshot> {
  try {
    const raw = localStorage.getItem(SESSION_PERSIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function savePersistedSessions(store: Record<string, ModuleSnapshot>) {
  try { localStorage.setItem(SESSION_PERSIST_KEY, JSON.stringify(store)); } catch {}
}
function loadPersistedHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_PERSIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function savePersistedHistory(h: string[]) {
  try { localStorage.setItem(HISTORY_PERSIST_KEY, JSON.stringify(h)); } catch {}
}
function loadLastSessionKey(): string | null {
  try { return localStorage.getItem(LAST_KEY_PERSIST_KEY); } catch { return null; }
}
function saveLastSessionKey(key: string) {
  try { localStorage.setItem(LAST_KEY_PERSIST_KEY, key); } catch {}
}

type QuizMode = 'interleave' | 'due' | 'weak' | 'single';

// ── Shape of one rendered question ────────────────────────────
interface Question {
  moduleId: string;
  moduleLabel: string;
  areaColor: string;
  q: string;
  opts: [string, string, string, string];
  ans: number;
  exp: string;
  confidence?: QuestionConfidence;
  warning?: string | null;
  sourceConcepts?: string[];
  sourceTrap?: string | null;
}

// ── Per-(mode|topicId) session snapshot ───────────────────────
interface ModuleSnapshot {
  currentQuestion: Question | null;
  buffer: Question[];
  questionCount: number;
  wrongIds: string[];
}

// ─────────────────────────────────────────────────────────────
// QuestionBuffer — rolling prefetch of up to `capacity` questions.
// Current displayed question is NOT counted; the queue holds items that
// will be returned from subsequent take() / takeInstant() calls.
// ─────────────────────────────────────────────────────────────
class QuestionBuffer {
  private readonly capacity: number;
  private readonly fetcher: () => Promise<Question>;
  private queue: Question[] = [];
  private inFlight: Promise<void> | null = null;

  constructor(capacity: number, fetcher: () => Promise<Question>) {
    this.capacity = capacity;
    this.fetcher = fetcher;
  }

  /** Kick off background fetches until the queue fills to capacity. */
  prefetch(): void {
    if (this.queue.length >= this.capacity) return;
    if (this.inFlight) return;
    this.inFlight = this.fetcher()
      .then((q) => {
        this.queue.push(q);
        this.inFlight = null;
        if (this.queue.length < this.capacity) this.prefetch();
      })
      .catch(() => {
        this.inFlight = null;
        // Don't chain on error — caller will retry via take() or a manual button.
      });
  }

  /** Synchronous pop. Returns null if the queue is empty. */
  takeInstant(): Question | null {
    if (this.queue.length === 0) return null;
    const next = this.queue.shift()!;
    this.prefetch();
    return next;
  }

  /** Async take — instant if buffered, else awaits a fresh fetch. */
  async take(): Promise<Question> {
    const instant = this.takeInstant();
    if (instant) return instant;
    const q = await this.fetcher();
    this.prefetch();
    return q;
  }

  snapshot(): Question[] {
    return [...this.queue];
  }

  hydrate(questions: Question[]): void {
    this.queue = [...questions];
  }
}

// ── Weighted module picker ────────────────────────────────────
function pickNextModule(
  mode: QuizMode,
  singleId: string | null,
  pool: Topic[],
  srsCards: Record<string, SRCard>,
): Topic | null {
  if (singleId) return pool.find((t) => t.id === singleId) ?? null;
  const candidates =
    mode === 'weak'
      ? pool.filter((t) => {
          const c = srsCards[t.id];
          if (!c || c.attempts === 0) return true;
          return getAccuracy(c) < 60;
        })
      : pool;
  if (candidates.length === 0) return null;

  const weighted = candidates.map((t) => {
    const c = srsCards[t.id];
    if (!c || c.attempts === 0) return { t, w: 3 };
    const acc = getAccuracy(c);
    const w = acc < 60 ? 4 : acc < 80 ? 2 : 1;
    return { t, w };
  });
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const { t, w } of weighted) {
    r -= w;
    if (r <= 0) return t;
  }
  return weighted[weighted.length - 1].t;
}

function computeWeakList(srsCards: Record<string, SRCard>): WeakModuleRef[] {
  return Object.entries(srsCards)
    .map(([id, c]) => ({
      id,
      label: allTopics.find((t) => t.id === id)?.label ?? id,
      accuracy: getAccuracy(c),
    }))
    .filter((w) => w.accuracy >= 0 && w.accuracy < 60)
    .slice(0, 8);
}

// ─────────────────────────────────────────────────────────────
export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recordAnswer = useStudyStore((s) => s.recordAnswer);

  const mode = (params.get('mode') ?? 'interleave') as QuizMode;
  // Accept both `topicId` (legacy) and `moduleId` (used by the AI coach
  // deep-links). Both resolve to the same session key under the hood.
  const topicId = params.get('topicId') ?? params.get('moduleId');
  const focusConcept = params.get('focusConcept');
  const sessionKey =
    (topicId ?? `__mode:${mode}__`) + (focusConcept ? `#${focusConcept}` : '');

  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bufferRef = useRef<QuestionBuffer | null>(null);
  const sessionStoreRef = useRef<Record<string, ModuleSnapshot>>(loadPersistedSessions());
  const prevKeyRef = useRef<string | null>(null);
  const wrongIdsRef = useRef<string[]>([]);
  const completedRef = useRef(false);
  const moduleHistoryRef = useRef<string[]>(loadPersistedHistory());
  const isBackNavRef = useRef(false);

  const persistSnapshot = useCallback((key: string, snap: ModuleSnapshot) => {
    sessionStoreRef.current[key] = snap;
    savePersistedSessions(sessionStoreRef.current);
    saveLastSessionKey(key);
  }, []);
  // Bumps whenever history changes — forces a re-render so the back button's
  // enabled/disabled state and label stay in sync with the ref.
  const [historyTick, setHistoryTick] = useState(0);

  useEffect(() => { wrongIdsRef.current = wrongIds; }, [wrongIds]);

  // Build a fetcher bound to current (mode, topicId). wrongIds is read via
  // ref so each fetch sees fresh context without invalidating the buffer.
  const buildFetcher = useCallback((): (() => Promise<Question>) => {
    return async () => {
      const store = useStudyStore.getState();
      const target = pickNextModule(mode, topicId, allTopics as Topic[], store.srsCards);
      if (!target) throw new Error('생성할 모듈을 찾지 못했습니다.');
      const weak = computeWeakList(store.srsCards);

      // 태그별 취약 개념 — 정답률 50% 미만, 최소 3회 이상 출제된 것만.
      // 실패해도 생성은 진행 (fire-and-forget 아니라 await지만 빈 배열 fallback).
      let weakConcepts: { tag: string; tag_type: 'concept' | 'trap'; accuracy: number; total: number }[] = [];
      if (store.userId) {
        try {
          const stats = await getConceptStats(store.userId, target.id, 3);
          weakConcepts = stats
            .filter((s) => s.accuracy < 0.5)
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5)
            .map((s) => ({
              tag: s.tag,
              tag_type: s.tagType,
              accuracy: s.accuracy,
              total: s.total,
            }));
        } catch (e) {
          console.warn('[QuizPage] getConceptStats failed:', e);
        }
      }

      const gen = await generateQuestion(
        target.id,
        target.label,
        weak,
        wrongIdsRef.current,
        focusConcept,
        weakConcepts,
      );
      // Sanity check the AI response BEFORE we hand it to the buffer.
      // An empty stem or wrong-shaped opts would render a blank card
      // downstream, so reject here and let the buffer surface the error.
      if (
        !gen ||
        typeof gen.q !== 'string' ||
        gen.q.trim().length === 0 ||
        !Array.isArray(gen.opts) ||
        gen.opts.length !== 4 ||
        gen.opts.some((o) => typeof o !== 'string')
      ) {
        console.warn('[QuizPage] generateQuestion returned empty/invalid payload', gen);
        throw new Error('AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.');
      }
      const area = areas.find((a) => a.topics.some((t) => t.id === target.id));
      return {
        moduleId: target.id,
        moduleLabel: target.label,
        areaColor: area?.color ?? '#4f6ef7',
        q: gen.q,
        opts: gen.opts as [string, string, string, string],
        ans: gen.ans,
        exp: gen.exp,
        confidence: gen.confidence,
        warning: gen.warning ?? null,
        sourceConcepts: gen.source_concepts,
        sourceTrap: gen.source_trap ?? null,
      };
    };
  }, [mode, topicId, focusConcept]);

  // ── Module switch effect ────────────────────────────────────
  // 1. Save previous session snapshot
  // 2. Rebuild buffer with new fetcher
  // 3. Restore snapshot or kick first fetch
  useEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey && prevKey !== sessionKey) {
      persistSnapshot(prevKey, {
        currentQuestion: items[items.length - 1] ?? null,
        buffer: bufferRef.current?.snapshot() ?? [],
        questionCount,
        wrongIds,
      });
    }

    const buf = new QuestionBuffer(BUFFER_CAPACITY, buildFetcher());
    bufferRef.current = buf;
    completedRef.current = false;
    setError(null);

    const snap = sessionStoreRef.current[sessionKey];
    if (snap && snap.currentQuestion) {
      setItems([snap.currentQuestion]);
      setWrongIds(snap.wrongIds);
      wrongIdsRef.current = snap.wrongIds;
      setQuestionCount(snap.questionCount);
      buf.hydrate(snap.buffer);
      buf.prefetch();
      setLoading(false);
    } else {
      setItems([]);
      setWrongIds([]);
      wrongIdsRef.current = [];
      setQuestionCount(0);
      setLoading(true);

      // Seed from app-boot prewarmed questions when the session is an
      // interleave run (any module is valid there). Gives an instant
      // first question if prewarm completed before the click.
      if (mode === 'interleave' && !topicId) {
        const pre = drainPrewarmed();
        if (pre.length > 0) {
          buf.hydrate(pre as unknown as Question[]);
        }
      }

      buf
        .take()
        .then((q) => {
          setItems([q]);
          setQuestionCount(1);
          setLoading(false);
          persistSnapshot(sessionKey, {
            currentQuestion: q,
            buffer: buf.snapshot(),
            questionCount: 1,
            wrongIds: [],
          });
          buf.prefetch();
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : '문제 생성 실패');
          setLoading(false);
        });
    }
    prevKeyRef.current = sessionKey;
    saveLastSessionKey(sessionKey);

    // Push to history unless this transition is a back navigation.
    if (isBackNavRef.current) {
      isBackNavRef.current = false;
    } else {
      const h = moduleHistoryRef.current;
      if (h[h.length - 1] !== sessionKey) {
        h.push(sessionKey);
        savePersistedHistory(h);
      }
    }
    setHistoryTick((t) => t + 1);
    // Intentionally only rerun on route change. items/questionCount/wrongIds
    // are read as "current state at transition time" — not a dep loop driver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topicId, focusConcept]);

  // ── Answer handler ─────────────────────────────────────────
  const handleAnswer = (result: QuizResult) => {
    const log: QuizLogPayload = {
      topicId: result.topicId,
      topicLabel: result.topicLabel,
      question: result.question,
      options: result.options,
      correct: result.correct,
      selected: result.selected,
      answer: result.answer,
      elapsedSeconds: result.elapsedSeconds,
      sourceConcepts: result.sourceConcepts ?? null,
      sourceTrap: result.sourceTrap ?? null,
    };
    recordAnswer(result.topicId, result.correct, log);
    // History save happens in handleConceptCardReady once the card resolves
    // — this keeps the full payload together (answer + structured card).

    let nextWrong = wrongIds;
    if (!result.correct) {
      nextWrong = [result.topicId, ...wrongIds].slice(0, 8);
      setWrongIds(nextWrong);
      wrongIdsRef.current = nextWrong;
    }
    // Keep snapshot fresh so a mid-answer module switch is captured.
    persistSnapshot(sessionKey, {
      currentQuestion: items[items.length - 1] ?? null,
      buffer: bufferRef.current?.snapshot() ?? [],
      questionCount,
      wrongIds: nextWrong,
    });
  };

  // Fired after the structured concept card has been generated for the
  // most recent answer. Fire-and-forget persistent history save — failures
  // do NOT interrupt the quiz flow.
  const handleConceptCardReady = (card: ConceptCard, result: QuizResult) => {
    const ALPHA = ['A', 'B', 'C', 'D'];
    saveHistory({
      moduleId: result.topicId,
      question: result.question,
      options: result.options,
      correctAnswer: ALPHA[result.answer] ?? String(result.answer),
      userAnswer: ALPHA[result.selected] ?? String(result.selected),
      isCorrect: result.correct,
      elapsed_seconds: result.elapsedSeconds,
      conceptCard: card,
    }).catch(() => {
      // swallow — background persistence, no user-facing toast
    });
  };

  // ── "Next question" handler ────────────────────────────────
  // Buffer hit → synchronous setItems runs inside the same React batch as
  // QuizView's setCurrentIdx(nextIdx), so the new question renders with no
  // blank frame. Buffer miss → async fallback shows the skeleton briefly.
  const handleRequestNext = () => {
    if (questionCount >= SESSION_MAX) {
      completedRef.current = true;
      return;
    }
    const buf = bufferRef.current;
    if (!buf) return;

    const instant = buf.takeInstant();
    if (instant) {
      const newCount = questionCount + 1;
      setItems((prev) => [...prev, instant]);
      setQuestionCount(newCount);
      persistSnapshot(sessionKey, {
        currentQuestion: instant,
        buffer: buf.snapshot(),
        questionCount: newCount,
        wrongIds: wrongIdsRef.current,
      });
      buf.prefetch();
      return;
    }

    setLoading(true);
    buf
      .take()
      .then((q) => {
        const newCount = questionCount + 1;
        setItems((prev) => [...prev, q]);
        setQuestionCount(newCount);
        setLoading(false);
        persistSnapshot(sessionKey, {
          currentQuestion: q,
          buffer: buf.snapshot(),
          questionCount: newCount,
          wrongIds: wrongIdsRef.current,
        });
        buf.prefetch();
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '문제 생성 실패');
        setLoading(false);
      });
  };

  // ── Back navigation ────────────────────────────────────────
  const handleBack = () => {
    const h = moduleHistoryRef.current;
    if (h.length < 2) return;

    // Save current session (the effect's prelude also does this, but capture
    // the very latest state here so nothing is lost).
    persistSnapshot(sessionKey, {
      currentQuestion: items[items.length - 1] ?? null,
      buffer: bufferRef.current?.snapshot() ?? [],
      questionCount,
      wrongIds,
    });

    h.pop(); // drop current
    savePersistedHistory(h);
    const prevKey = h[h.length - 1];
    isBackNavRef.current = true;

    if (prevKey.startsWith('__mode:')) {
      const m = prevKey.slice('__mode:'.length).replace(/__$/, '');
      navigate(`/quiz?mode=${m}`);
    } else {
      navigate(`/quiz?topicId=${prevKey}`);
    }
  };

  // Label of the session we'd jump to if the back button were pressed now.
  const prevSessionKey =
    moduleHistoryRef.current.length >= 2
      ? moduleHistoryRef.current[moduleHistoryRef.current.length - 2]
      : null;
  const prevSessionLabel = (() => {
    if (!prevSessionKey) return null;
    if (prevSessionKey.startsWith('__mode:')) {
      const m = prevSessionKey.slice('__mode:'.length).replace(/__$/, '');
      return m === 'interleave' ? '전체' : m === 'due' ? 'DUE' : m === 'weak' ? '약점' : m;
    }
    return prevSessionKey; // e.g. "F1-M2"
  })();
  // Reference historyTick to make the back button re-evaluate on history changes.
  void historyTick;

  const handleRetry = () => {
    setError(null);
    const buf = bufferRef.current;
    if (!buf) return;
    setLoading(true);
    buf
      .take()
      .then((q) => {
        setItems([q]);
        setQuestionCount(1);
        setLoading(false);
        persistSnapshot(sessionKey, {
          currentQuestion: q,
          buffer: buf.snapshot(),
          questionCount: 1,
          wrongIds: [],
        });
        buf.prefetch();
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '재시도 실패');
        setLoading(false);
      });
  };

  const modeLabel: Record<string, string> = {
    interleave: '전체 퀴즈 (Interleaving)',
    due: '복습 DUE 퀴즈',
    weak: '약점 집중 퀴즈',
  };
  const label = topicId
    ? allTopics.find((t) => t.id === topicId)?.label ?? '모듈 퀴즈'
    : modeLabel[mode] ?? '퀴즈';

  // Filter out any undefined / null entries that may have slipped into
  // the items array (race conditions, stale closures, malformed pushes)
  // before they reach QuizView and cause a silent blank render.
  const quizItems: QuizItemWithContext[] = items
    .filter((it): it is Question => !!it && typeof it.q === 'string' && Array.isArray(it.opts))
    .map((it) => ({
      topicId: it.moduleId,
      topicLabel: it.moduleLabel,
      areaColor: it.areaColor,
      q: it.q,
      opts: it.opts,
      ans: it.ans,
      exp: it.exp,
      confidence: it.confidence,
      warning: it.warning ?? null,
      sourceConcepts: it.sourceConcepts,
      sourceTrap: it.sourceTrap ?? null,
    }));
  if (items.length !== quizItems.length) {
    console.warn(
      '[QuizPage] dropped malformed items',
      { rawCount: items.length, validCount: quizItems.length },
    );
  }

  // Skip handler — fire-and-forget log, no SRS / accuracy side effects.
  // Writes directly to Supabase with correct=false + selected=-1 so the
  // skipped item is traceable but not counted as a real answer.
  const handleSkip = (item: QuizItemWithContext) => {
    const uid = useStudyStore.getState().userId;
    if (!uid) return;
    void saveQuizLog(uid, {
      topicId: item.topicId,
      topicLabel: item.topicLabel,
      question: item.q,
      options: [...item.opts],
      correct: false,
      selected: -1,
      answer: item.ans,
      elapsedSeconds: null,
    }).catch(() => {/* background */});
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Mobile section drawer trigger — hidden on desktop */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          style={{ border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a' }}
        >
          <span>📚 Becker F1–F6</span>
          <span className="text-xs text-muted">탭하여 모듈 선택 ▾</span>
        </button>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-[#0f172a] text-base sm:text-lg truncate">{label}</h1>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5 truncate">
              {questionCount} / {SESSION_MAX} · AI 온디맨드 · 버퍼 {BUFFER_CAPACITY}
            </p>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            {(['interleave', 'due', 'weak'] as QuizMode[]).map((m) => (
              <button
                key={m}
                onClick={() => navigate(`/quiz?mode=${m}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: mode === m && !topicId ? '#4f6ef7' : '#f1f5f9',
                  color: mode === m && !topicId ? 'white' : '#64748b',
                }}
              >
                {m === 'interleave' ? '전체' : m === 'due' ? 'DUE' : '약점'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'interleave' && !topicId && (
          <div
            className="p-3 rounded-xl flex items-start gap-2"
            style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
          >
            <span>🔀</span>
            <p className="text-xs text-[#4c1d95]">
              <strong>Interleaving 모드:</strong> 약점 모듈을 더 자주 출제합니다. 문제는 1개씩 온디맨드 생성, 다음 {BUFFER_CAPACITY}개를 미리 준비합니다.
            </p>
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-xl text-xs text-[#991b1b]"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            ⚠️ {error}{' '}
            <button onClick={handleRetry} className="underline ml-2">재시도</button>
          </div>
        )}

        {quizItems.length > 0 && (
          <>
            <button
              onClick={handleBack}
              disabled={!prevSessionLabel}
              className="self-start flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                color: prevSessionLabel ? '#4f6ef7' : '#94a3b8',
                background: prevSessionLabel ? '#eef2ff' : '#f1f5f9',
                border: `1px solid ${prevSessionLabel ? '#c7d2fe' : '#e2e8f0'}`,
              }}
            >
              ← {prevSessionLabel ?? '이전 없음'}
            </button>
            <QuizView
              key={sessionKey + ':' + (items[0]?.q ?? '')}
              questions={quizItems}
              onAnswer={handleAnswer}
              onConceptCardReady={handleConceptCardReady}
              onComplete={() => { completedRef.current = true; }}
              onRequestNext={handleRequestNext}
              onSkip={handleSkip}
              sessionMax={SESSION_MAX}
              isLoadingNext={loading}
              title={label}
            />
          </>
        )}

        {quizItems.length === 0 && loading && <QuestionSkeleton />}

        {quizItems.length === 0 && !loading && !error && (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-3">🤖</p>
            <p className="font-semibold text-[#0f172a] mb-1">AI가 첫 문제를 준비 중입니다</p>
            <p className="text-sm text-muted">잠시만 기다려주세요.</p>
          </div>
        )}
      </div>

      <MobileSectionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function QuestionSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <p className="text-sm text-muted">AI가 문제를 생성 중...</p>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
      <div className="flex flex-col gap-2 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
