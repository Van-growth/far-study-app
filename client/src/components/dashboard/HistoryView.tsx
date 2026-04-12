import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHistory, HistoryItem } from '../../hooks/useDynamicQuiz';
import { allTopics, areas } from '../../data/far-topics';
import { ConceptCardView, formatElapsed, elapsedTone } from '../quiz/QuizView';

type CorrectFilter = 'all' | 'correct' | 'wrong';

export default function HistoryView() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctFilter, setCorrectFilter] = useState<CorrectFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const reload = () => {
    setLoading(true);
    setError(null);
    fetchHistory({
      moduleId: moduleFilter || undefined,
      isCorrect:
        correctFilter === 'correct' ? true : correctFilter === 'wrong' ? false : undefined,
      limit: 200,
    })
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'load failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctFilter, moduleFilter]);

  const wrongItems = useMemo(() => items.filter((i) => !i.isCorrect), [items]);

  const handleReplayWrong = () => {
    const payload = wrongItems.map((i) => ({
      id: i.id,
      moduleId: i.moduleId,
      question: i.question,
      options: i.options,
      correctAnswer: i.correctAnswer,
    }));
    if (payload.length === 0) return;
    try {
      sessionStorage.setItem('far_replay_payload', JSON.stringify(payload));
    } catch {/* ignore */}
    navigate('/replay');
  };

  const moduleLabel = (moduleId: string) =>
    allTopics.find((t) => t.id === moduleId)?.label ?? moduleId;

  const moduleColor = (moduleId: string) =>
    areas.find((a) => a.topics.some((t) => t.id === moduleId))?.color ?? '#4f6ef7';

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#0f172a]">📚 풀이 히스토리</h3>
          <p className="text-xs text-muted mt-0.5">
            답 선택 + 개념 카드 생성 후 서버에 영구 저장 (최대 1000건)
          </p>
        </div>
        {wrongItems.length > 0 && (
          <button
            onClick={handleReplayWrong}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#ef4444' }}
          >
            틀린 {wrongItems.length}문제 다시 풀기 →
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1">
          {(['all', 'correct', 'wrong'] as CorrectFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setCorrectFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: correctFilter === f ? '#4f6ef7' : '#f1f5f9',
                color: correctFilter === f ? 'white' : '#64748b',
              }}
            >
              {f === 'all' ? '전체' : f === 'correct' ? '맞음' : '틀림'}
            </button>
          ))}
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white border border-border outline-none"
        >
          <option value="">전체 모듈</option>
          {areas.map((area) => (
            <optgroup key={area.id} label={area.label}>
              {area.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-6 text-xs text-muted">로딩 중...</div>
      ) : error ? (
        <div className="text-center py-6 text-xs text-[#991b1b]">⚠️ {error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted">히스토리가 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isOpen = expanded[item.id] === true;
            const color = moduleColor(item.moduleId);
            const d = new Date(item.timestamp);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
            const preview =
              item.question.length > 50 ? item.question.slice(0, 50) + '…' : item.question;

            return (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [item.id]: !isOpen }))}
                  className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-gray-50"
                >
                  <span className="text-xs text-muted shrink-0 w-16">{dateStr}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: color + '18', color }}
                  >
                    {item.moduleId}
                  </span>
                  <span className="text-xs flex-1 truncate text-[#0f172a]">{preview}</span>
                  {item.elapsed_seconds !== null && (() => {
                    const tone = elapsedTone(item.elapsed_seconds);
                    return (
                      <span
                        className="text-[10px] font-mono tabular-nums shrink-0"
                        style={{ color: tone.color, fontWeight: tone.bold ? 700 : 500 }}
                      >
                        {formatElapsed(item.elapsed_seconds)}
                      </span>
                    );
                  })()}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: item.isCorrect ? '#dcfce7' : '#fee2e2',
                      color: item.isCorrect ? '#166534' : '#991b1b',
                    }}
                  >
                    {item.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-xs text-muted shrink-0">{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className="p-4 border-t border-border bg-[#fafbfc] flex flex-col gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted uppercase mb-1">
                        {moduleLabel(item.moduleId)}
                      </p>
                      <p className="text-sm text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                        {item.question}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {item.options.map((opt, i) => {
                        const letter = ['A', 'B', 'C', 'D'][i] ?? String(i);
                        const isUser = letter === item.userAnswer;
                        const isCorrect = letter === item.correctAnswer;
                        const bg = isCorrect
                          ? '#f0fdf4'
                          : isUser && !isCorrect
                          ? '#fff5f5'
                          : 'white';
                        const border = isCorrect
                          ? '#22c55e'
                          : isUser && !isCorrect
                          ? '#ef4444'
                          : '#e2e8f0';
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 rounded text-xs"
                            style={{ background: bg, border: `1px solid ${border}` }}
                          >
                            <span className="font-bold shrink-0 w-4">{letter}.</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <span className="text-[10px] text-[#16a34a]">정답</span>}
                            {isUser && !isCorrect && (
                              <span className="text-[10px] text-[#dc2626]">내 선택</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {item.conceptCard && (
                      <div
                        className="p-3 rounded-xl"
                        style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
                      >
                        <p className="text-[10px] font-bold text-[#92400e] mb-2">
                          🧠 개념 카드 · {item.conceptCard.type}
                        </p>
                        <ConceptCardView card={item.conceptCard} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
