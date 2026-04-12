import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { allTopics, areas, Topic } from '../data/far-topics';
import useStudyStore, { QuizLogPayload } from '../store/studyStore';
import { getAccuracy, SRCard } from '../lib/srs';
import QuizView, { QuizItemWithContext, QuizResult } from '../components/quiz/QuizView';
import { generateQuestion, GeneratedQuestion, WeakModuleRef } from '../hooks/useDynamicQuiz';

const SESSION_MAX = 20;

type QuizMode = 'interleave' | 'due' | 'weak' | 'single';

// ── Weighted module picker ────────────────────────────────────
// Weight: weak modules (<60% or never-attempted) get boost; rest baseline.
function pickNextModule(
  mode: QuizMode,
  singleId: string | null,
  pool: Topic[],
  srsCards: Record<string, SRCard>,
): Topic | null {
  if (singleId) return pool.find((t) => t.id === singleId) ?? null;
  const candidates = mode === 'weak'
    ? pool.filter((t) => {
        const c = srsCards[t.id];
        if (!c || c.attempts === 0) return true;
        return getAccuracy(c) < 60;
      })
    : pool;
  if (candidates.length === 0) return null;

  const weighted: { t: Topic; w: number }[] = candidates.map((t) => {
    const c = srsCards[t.id];
    if (!c || c.attempts === 0) return { t, w: 3 }; // unseen → boost
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

interface SessionItem {
  moduleId: string;
  moduleLabel: string;
  areaColor: string;
  question: GeneratedQuestion;
}

export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recordAnswer = useStudyStore((s) => s.recordAnswer);
  const srsCards = useStudyStore((s) => s.srsCards);

  const mode = (params.get('mode') ?? 'interleave') as QuizMode;
  const topicId = params.get('topicId');

  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentWrong, setRecentWrong] = useState<string[]>([]);
  const completedRef = useRef(false);

  const weakModules = useMemo<WeakModuleRef[]>(() => {
    return Object.entries(srsCards)
      .map(([id, c]) => ({ id, label: allTopics.find((t) => t.id === id)?.label ?? id, accuracy: getAccuracy(c) }))
      .filter((w) => w.accuracy >= 0 && w.accuracy < 60)
      .slice(0, 8);
  }, [srsCards]);

  const fetchNext = useCallback(async () => {
    if (completedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const target = pickNextModule(mode, topicId, allTopics as Topic[], srsCards);
      if (!target) {
        setError('생성할 모듈을 찾지 못했습니다.');
        setLoading(false);
        return;
      }
      const q = await generateQuestion(target.id, target.label, weakModules, recentWrong);
      const area = areas.find((a) => a.topics.some((t) => t.id === target.id));
      setItems((prev) => [
        ...prev,
        {
          moduleId: target.id,
          moduleLabel: target.label,
          areaColor: area?.color ?? '#4f6ef7',
          question: q,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제 생성 실패');
    } finally {
      setLoading(false);
    }
  }, [mode, topicId, srsCards, weakModules, recentWrong]);

  // Initial kickoff per (mode, topicId)
  useEffect(() => {
    completedRef.current = false;
    setItems([]);
    setRecentWrong([]);
    setError(null);
    // kick off first question
    void fetchNext();
    // intentionally skip fetchNext from deps to avoid re-kick on state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topicId]);

  const handleAnswer = (result: QuizResult) => {
    const log: QuizLogPayload = {
      topicId: result.topicId,
      topicLabel: result.topicLabel,
      question: result.question,
      options: result.options,
      correct: result.correct,
      selected: result.selected,
      answer: result.answer,
    };
    recordAnswer(result.topicId, result.correct, log);
    if (!result.correct) {
      setRecentWrong((prev) => [result.topicId, ...prev].slice(0, 8));
    }
  };

  const handleRequestNext = () => {
    if (items.length >= SESSION_MAX) {
      completedRef.current = true;
      return;
    }
    void fetchNext();
  };

  const modeLabel: Record<string, string> = {
    interleave: '전체 퀴즈 (Interleaving)',
    due: '복습 DUE 퀴즈',
    weak: '약점 집중 퀴즈',
  };
  const label = topicId
    ? allTopics.find((t) => t.id === topicId)?.label ?? '모듈 퀴즈'
    : modeLabel[mode] ?? '퀴즈';

  // Transform current items into QuizView's expected shape
  const quizItems: QuizItemWithContext[] = items.map((it) => ({
    topicId: it.moduleId,
    topicLabel: it.moduleLabel,
    areaColor: it.areaColor,
    q: it.question.q,
    opts: it.question.opts as [string, string, string, string],
    ans: it.question.ans,
    exp: it.question.exp,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[#0f172a] text-lg">{label}</h1>
            <p className="text-xs text-muted mt-0.5">
              {items.length} / {SESSION_MAX} · AI 동적 생성
            </p>
          </div>
          <div className="flex gap-2">
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
              <strong>Interleaving 모드:</strong> 약점 모듈을 더 자주 출제합니다. Claude가 매 문제 동적 생성.
            </p>
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-xl text-xs text-[#991b1b]"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            ⚠️ {error} <button onClick={() => void fetchNext()} className="underline ml-2">재시도</button>
          </div>
        )}

        {quizItems.length > 0 && (
          <QuizView
            key={mode + (topicId ?? 'all')}
            questions={quizItems}
            onAnswer={handleAnswer}
            onComplete={() => { completedRef.current = true; }}
            onRequestNext={handleRequestNext}
            sessionMax={SESSION_MAX}
            isLoadingNext={loading}
            title={label}
          />
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
