import { useState, useCallback } from 'react';
import useClaudeStore from '../../store/claudeStore';
import { useClaudeChat, QuizContext } from '../../hooks/useClaudeChat';

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
  title?: string;
}

export default function QuizView({ questions, onAnswer, onComplete, title }: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);

  const openPanel = useClaudeStore((s) => s.openPanel);
  const { sendQuizExplanation } = useClaudeChat(questions[currentIdx]?.topicLabel);

  const current = questions[currentIdx];

  const handleSelect = useCallback(
    (i: number) => { if (selected === null) setSelected(i); },
    [selected],
  );

  const handleNext = useCallback(() => {
    if (selected === null || !current) return;
    const correct = selected === current.ans;
    const result: QuizResult = {
      topicId: current.topicId,
      topicLabel: current.topicLabel,
      correct,
      question: current.q,
      options: [...current.opts],
      selected,
      answer: current.ans,
    };

    onAnswer(result);
    const newResults = [...results, result];

    if (currentIdx + 1 >= questions.length) {
      setResults(newResults);
      setFinished(true);
      onComplete(newResults);
    } else {
      setResults(newResults);
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  }, [selected, current, results, currentIdx, questions.length, onAnswer, onComplete]);

  const handleClaudeExplain = useCallback(() => {
    if (!current || selected === null) return;
    const ctx: QuizContext = { q: current.q, opts: current.opts, ans: current.ans, selected, topicLabel: current.topicLabel };
    openPanel();
    sendQuizExplanation(ctx);
  }, [current, selected, openPanel, sendQuizExplanation]);

  if (questions.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="font-semibold text-[#0f172a]">풀 수 있는 문제가 없습니다</p>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = Math.round((correct / total) * 100);
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
          {Object.entries(topicMap).map(([, data]) => {
            const topicPct = Math.round((data.correct / data.total) * 100);
            const color = topicPct >= 80 ? '#22c55e' : topicPct >= 60 ? '#f59e0b' : '#ef4444';
            return (
              <div key={data.label} className="flex items-center gap-3">
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
          onClick={() => { setCurrentIdx(0); setSelected(null); setResults([]); setFinished(false); }}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm" style={{ background: '#4f6ef7' }}
        >다시 풀기</button>
      </div>
    );
  }

  const optLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${current.areaColor}` }}>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          {title && <p className="text-xs font-semibold text-muted">{title}</p>}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-auto" style={{ background: current.areaColor + '18', color: current.areaColor }}>
            {current.topicLabel}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full">
          <div className="h-full rounded-full transition-all" style={{ width: `${(currentIdx / questions.length) * 100}%`, background: current.areaColor }} />
        </div>
        <p className="text-xs text-muted mt-1">{currentIdx + 1} / {questions.length}</p>
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
              <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors" style={style}>
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: selected !== null && i === current.ans ? '#22c55e' : selected !== null && i === selected && i !== current.ans ? '#ef4444' : '#f1f5f9',
                    color: selected !== null && (i === current.ans || i === selected) ? 'white' : '#64748b',
                  }}>
                  {optLabels[i]}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <>
            <div className="p-4 rounded-xl" style={{ background: '#f8faff', border: '1.5px solid #c7d2fe' }}>
              <p className="text-xs font-semibold text-[#4f6ef7] mb-1.5">💡 해설</p>
              <p className="text-sm text-[#0f172a] leading-relaxed">{current.exp}</p>
            </div>
            <button onClick={handleClaudeExplain}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:bg-[#eef2ff]"
              style={{ border: '1.5px solid #c7d2fe', color: '#4f6ef7' }}>
              📋 Claude에게 심층 해설 요청
            </button>
            <button onClick={handleNext}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90" style={{ background: current.areaColor }}>
              {currentIdx + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
