import { useCallback, useEffect, useRef, useState } from 'react';
import useClaudeStore from '../../store/claudeStore';
import { useClaudeChat, QuizContext } from '../../hooks/useClaudeChat';
import { streamConceptCard } from '../../hooks/useDynamicQuiz';

export interface QuizItemWithContext {
  topicId: string;
  topicLabel: string;
  areaColor: string;
  q: string;
  opts: [string, string, string, string];
  ans: number;
  exp: string;
}

export interface QuizResult {
  topicId: string;
  topicLabel: string;
  correct: boolean;
  question: string;
  options: string[];
  selected: number;
  answer: number;
}

interface QuizViewProps {
  questions: QuizItemWithContext[];
  onAnswer: (result: QuizResult) => void;
  onComplete: (results: QuizResult[]) => void;
  onRequestNext?: () => void;
  sessionMax?: number;
  isLoadingNext?: boolean;
  title?: string;
}

export default function QuizView({
  questions,
  onAnswer,
  onComplete,
  onRequestNext,
  sessionMax,
  isLoadingNext,
  title,
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);

  // Concept card streaming state (keyed by question index so it resets per Q)
  const [cardText, setCardText] = useState('');
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const openPanel = useClaudeStore((s) => s.openPanel);
  const current = questions[currentIdx];
  const { sendQuizExplanation } = useClaudeChat(current?.topicLabel);

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null || !current) return;
      setSelected(i);

      // Fire result up to parent immediately
      const correct = i === current.ans;
      const result: QuizResult = {
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        correct,
        question: current.q,
        options: [...current.opts],
        selected: i,
        answer: current.ans,
      };
      onAnswer(result);
      setResults((prev) => [...prev, result]);

      // Stream concept card inline
      setCardText('');
      setCardError(null);
      setCardLoading(true);
      void streamConceptCard(
        {
          moduleId: current.topicId,
          moduleName: current.topicLabel,
          question: current.q,
          options: [...current.opts],
          correctIdx: current.ans,
          selectedIdx: i,
        },
        (chunk) => setCardText((prev) => prev + chunk),
        () => setCardLoading(false),
        (err) => setCardError(err),
      );
    },
    [selected, current, onAnswer],
  );

  const handleNext = useCallback(() => {
    if (!current || selected === null) return;
    const nextIdx = currentIdx + 1;
    const atSessionMax = sessionMax !== undefined && nextIdx >= sessionMax;

    if (atSessionMax) {
      setFinished(true);
      onComplete(results);
      return;
    }

    // Dynamic mode: ask parent to fetch next question
    if (onRequestNext && nextIdx >= questions.length) {
      onRequestNext();
    }
    setCurrentIdx(nextIdx);
    setSelected(null);
    setCardText('');
    setCardError(null);
  }, [current, selected, currentIdx, questions.length, onRequestNext, sessionMax, results, onComplete]);

  const handleClaudeExplain = useCallback(() => {
    if (!current || selected === null) return;
    const ctx: QuizContext = {
      q: current.q,
      opts: current.opts,
      ans: current.ans,
      selected,
      topicLabel: current.topicLabel,
    };
    openPanel();
    sendQuizExplanation(ctx);
  }, [current, selected, openPanel, sendQuizExplanation]);

  // Scroll concept card into view when it starts streaming
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cardLoading || cardText) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [cardLoading, cardText]);

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const topicMap: Record<string, { correct: number; total: number; label: string }> = {};
    results.forEach((r) => {
      if (!topicMap[r.topicId]) topicMap[r.topicId] = { correct: 0, total: 0, label: r.topicLabel };
      topicMap[r.topicId].total++;
      if (r.correct) topicMap[r.topicId].correct++;
    });

    return (
      <div className="card p-6 flex flex-col gap-5">
        <div className="text-center">
          <p className="text-5xl mb-2">{pct >= 80 ? '🎉' : pct >= 60 ? '📚' : '💪'}</p>
          <p className="text-2xl font-bold text-[#0f172a]">{pct}%</p>
          <p className="text-sm text-muted mt-1">{total}문제 중 {correct}문제 정답</p>
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(topicMap).map(([id, data]) => {
            const topicPct = Math.round((data.correct / data.total) * 100);
            const color = topicPct >= 80 ? '#22c55e' : topicPct >= 60 ? '#f59e0b' : '#ef4444';
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="text-xs text-[#0f172a] flex-1 truncate">{data.label}</span>
                <div className="w-24 h-1.5 rounded-full bg-gray-200">
                  <div className="h-full rounded-full" style={{ width: `${topicPct}%`, background: color }} />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color }}>{topicPct}%</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ background: '#4f6ef7' }}
        >
          새 세션 시작
        </button>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const optLabels = ['A', 'B', 'C', 'D'];
  const progressPct = sessionMax ? (currentIdx / sessionMax) * 100 : 0;
  const isLastFetchedAndLoading = currentIdx >= questions.length - 1 && isLoadingNext;

  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${current.areaColor}` }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          {title && <p className="text-xs font-semibold text-muted">{title}</p>}
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{ background: current.areaColor + '18', color: current.areaColor }}
          >
            {current.topicId} · {current.topicLabel}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, background: current.areaColor }}
          />
        </div>
        <p className="text-xs text-muted mt-1">
          {currentIdx + 1} / {sessionMax ?? questions.length}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <p className="text-sm font-medium text-[#0f172a] leading-relaxed">{current.q}</p>

        <div className="flex flex-col gap-2">
          {current.opts.map((opt, i) => {
            let style: React.CSSProperties = { border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a' };
            if (selected !== null) {
              if (i === current.ans) style = { border: '1.5px solid #22c55e', background: '#f0fdf4', color: '#166534' };
              else if (i === selected) style = { border: '1.5px solid #ef4444', background: '#fff5f5', color: '#991b1b' };
              else style = { border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8' };
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                style={style}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      selected !== null && i === current.ans
                        ? '#22c55e'
                        : selected !== null && i === selected && i !== current.ans
                        ? '#ef4444'
                        : '#f1f5f9',
                    color: selected !== null && (i === current.ans || i === selected) ? 'white' : '#64748b',
                  }}
                >
                  {optLabels[i]}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <>
            {/* Quick explanation from question payload */}
            <div className="p-4 rounded-xl" style={{ background: '#f8faff', border: '1.5px solid #c7d2fe' }}>
              <p className="text-xs font-semibold text-[#4f6ef7] mb-1.5">💡 정답 해설</p>
              <p className="text-sm text-[#0f172a] leading-relaxed whitespace-pre-wrap">{current.exp}</p>
            </div>

            {/* Streaming concept card */}
            <div
              ref={cardRef}
              className="p-4 rounded-xl"
              style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
            >
              <p className="text-xs font-semibold text-[#92400e] mb-1.5">🧠 개념 카드 (AI 실시간 생성)</p>
              {cardError ? (
                <p className="text-sm text-[#991b1b]">⚠️ {cardError}</p>
              ) : (
                <div className="text-sm text-[#451a03] leading-relaxed whitespace-pre-wrap">
                  {cardText || (cardLoading ? <span className="text-muted">생성 중...</span> : null)}
                  {cardLoading && cardText && (
                    <span className="inline-block w-1.5 h-4 bg-[#92400e] ml-0.5 animate-pulse align-text-bottom rounded-sm" />
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleClaudeExplain}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:bg-[#eef2ff]"
              style={{ border: '1.5px solid #c7d2fe', color: '#4f6ef7' }}
            >
              📋 Claude에게 심층 해설 요청
            </button>

            <button
              onClick={handleNext}
              disabled={isLastFetchedAndLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: current.areaColor }}
            >
              {isLastFetchedAndLoading
                ? '다음 문제 생성 중...'
                : sessionMax && currentIdx + 1 >= sessionMax
                ? '결과 보기 →'
                : '다음 문제 →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
