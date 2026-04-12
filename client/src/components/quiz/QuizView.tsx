import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useClaudeStore from '../../store/claudeStore';
import { useClaudeChat, QuizContext } from '../../hooks/useClaudeChat';
import {
  fetchConceptCard,
  ConceptCard,
  CompareBlock,
  GapBlock,
  CalculationBlock,
  TimelineBlock,
  TrapBlock,
} from '../../hooks/useDynamicQuiz';

// ── Concept card renderers ────────────────────────────────────
function typeLabel(t: ConceptCard['type']): string {
  switch (t) {
    case 'comparison': return '비교';
    case 'timeline': return '시점/순서';
    case 'formula': return '공식/계산';
    default: return '요약';
  }
}

function ConceptCardView({ card }: { card: ConceptCard }) {
  const s = card.sections;
  return (
    <div className="flex flex-col gap-3 text-[#451a03]">
      {card.headline && (
        <p className="text-sm font-semibold leading-snug">🎯 {card.headline}</p>
      )}
      {card.type === 'comparison' && s.compare && <CompareView compare={s.compare} />}
      {card.type === 'timeline' && s.timeline && <TimelineView timeline={s.timeline} />}
      {card.type === 'formula' && s.calculation && <CalculationView calc={s.calculation} />}
      {card.type === 'plain' && s.markdown && <PlainView markdown={s.markdown} />}
      {s.gap && <GapView gap={s.gap} />}
      {s.traps && s.traps.length > 0 && <TrapsView traps={s.traps} />}
    </div>
  );
}

function CompareView({ compare }: { compare: CompareBlock }) {
  const side = (label: string, rows: string[], bg: string) => (
    <div className="flex-1 min-w-0 p-3 rounded-lg" style={{ background: bg, border: '1px solid #fcd34d' }}>
      <p className="text-[11px] font-bold mb-1.5 text-[#78350f]">{label}</p>
      <ul className="flex flex-col gap-1 text-xs leading-snug">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-[#a16207]">·</span>
            <span className="flex-1">{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {side(compare.left.label, compare.left.rows, '#fef9c3')}
      {side(compare.right.label, compare.right.rows, '#fde68a')}
    </div>
  );
}

function GapView({ gap }: { gap: GapBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-1 text-[#78350f]">⚖️ {gap.label}</p>
      <ul className="flex flex-col gap-1 text-xs leading-snug text-[#451a03]">
        {gap.rows.map((r, i) => <li key={i}>· {r}</li>)}
      </ul>
      {gap.note && <p className="text-[11px] italic text-[#78350f] mt-1.5">{gap.note}</p>}
    </div>
  );
}

function CalculationView({ calc }: { calc: CalculationBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-1.5 text-[#78350f]">📐 풀이 흐름</p>
      <ol className="flex flex-col gap-1 text-xs leading-snug text-[#451a03]">
        {calc.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="flex-1">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2 pt-2 border-t border-[#fcd34d]">
        <p className="text-xs font-bold text-[#78350f]">= {calc.result}</p>
      </div>
    </div>
  );
}

function TimelineView({ timeline }: { timeline: TimelineBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-2 text-[#78350f]">⏱ 시점별 처리</p>
      <ol className="relative border-l-2 border-[#f59e0b] ml-1 pl-3 flex flex-col gap-2">
        {timeline.events.map((ev, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#f59e0b]"
              aria-hidden
            />
            <p className="text-xs font-semibold text-[#78350f] leading-tight">{ev.label}</p>
            {ev.detail && <p className="text-xs text-[#451a03] leading-snug mt-0.5">{ev.detail}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlainView({ markdown }: { markdown: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d] text-xs leading-snug text-[#451a03]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS as never}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function TrapsView({ traps }: { traps: TrapBlock[] }) {
  return (
    <div className="p-3 rounded-lg bg-[#fff1f2] border border-[#fecaca]">
      <p className="text-[11px] font-bold mb-1.5 text-[#991b1b]">⚠️ 함정</p>
      <ul className="flex flex-col gap-1 text-xs leading-snug">
        {traps.map((t, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">
              {t.option}
            </span>
            <span className="flex-1 text-[#7f1d1d]">{t.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Shared markdown component map for exp/concept-card blocks.
// Tight spacing, small table that scrolls horizontally if it overflows.
const MD_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-1.5 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-5 my-1 flex flex-col gap-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-5 my-1 flex flex-col gap-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className?.includes('language-')) {
      return (
        <pre
          className="my-2 p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
          style={{ background: '#f1f5f9', color: '#0f172a' }}
        >
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1 py-0.5 rounded text-[11px] font-mono bg-black/5">{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  hr: () => <hr className="my-2 border-black/10" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 pl-3 my-2 text-sm italic border-current opacity-80">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border border-black/10 w-full">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead style={{ background: 'rgba(0,0,0,0.04)' }}>{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-black/10 px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-black/10 px-2 py-1 align-top">{children}</td>
  ),
};

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

  // Structured concept card state (reset per question)
  const [cardData, setCardData] = useState<ConceptCard | null>(null);
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

      // Fetch structured concept card
      setCardData(null);
      setCardError(null);
      setCardLoading(true);
      fetchConceptCard({
        moduleId: current.topicId,
        moduleName: current.topicLabel,
        question: current.q,
        options: [...current.opts],
        correctIdx: current.ans,
        selectedIdx: i,
      })
        .then((card) => setCardData(card))
        .catch((e) => setCardError(e instanceof Error ? e.message : 'concept card 실패'))
        .finally(() => setCardLoading(false));
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
    setCardData(null);
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

  // Scroll concept card into view as soon as it's loading or rendered
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cardLoading || cardData) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [cardLoading, cardData]);

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
              <div className="text-sm text-[#0f172a] leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS as never}>
                  {current.exp}
                </ReactMarkdown>
              </div>
            </div>

            {/* Structured concept card */}
            <div
              ref={cardRef}
              className="p-4 rounded-xl"
              style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
            >
              <p className="text-xs font-semibold text-[#92400e] mb-2">
                🧠 개념 카드 {cardData && `· ${typeLabel(cardData.type)}`}
              </p>
              {cardError ? (
                <p className="text-sm text-[#991b1b]">⚠️ {cardError}</p>
              ) : cardLoading && !cardData ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="w-3 h-3 border-2 border-[#92400e] border-t-transparent rounded-full animate-spin" />
                  <span>구조 분석 중...</span>
                </div>
              ) : cardData ? (
                <ConceptCardView card={cardData} />
              ) : null}
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
