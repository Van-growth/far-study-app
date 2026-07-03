import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { areas, Topic } from '../../data/far-topics';
import useStudyStore from '../../store/studyStore';
import { getAccuracy, getStatusColor, getDaysUntilReview, isDue } from '../../lib/srs';
import { searchAll, SearchResults } from '../../lib/harrySearch';

interface SidebarProps {
  /** Called after navigating to a topic — lets the mobile drawer close itself. */
  onItemClick?: () => void;
}

const EMPTY_RESULTS: SearchResults = { topics: [], questions: [], wrongAnswers: [] };

export default function Sidebar({ onItemClick }: SidebarProps = {}) {
  const navigate = useNavigate();
  const expandedAreas = useStudyStore((s) => s.expandedAreas);
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const toggleArea = useStudyStore((s) => s.toggleArea);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);
  const srsCards = useStudyStore((s) => s.srsCards);
  const userId = useStudyStore((s) => s.userId);

  const handleTopicClick = (topicId: string) => {
    setCurrentTopic(topicId);
    navigate(`/quiz?topicId=${topicId}`);
    onItemClick?.();
  };

  // ── 통합 검색 (topics / question_bank / wrong_answers) ─────────
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchAll(query, userId)
        .then(setResults)
        .catch((e) => { console.warn('[search] 검색 실패:', e); setResults(EMPTY_RESULTS); })
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userId]);

  const closeSearch = () => { setQuery(''); setResults(EMPTY_RESULTS); };
  const showDropdown = query.trim().length >= 2;
  const hasResults = results.topics.length + results.questions.length + results.wrongAnswers.length > 0;

  const goToTopic = (topicId: string) => {
    closeSearch();
    navigate(`/concept-notes?topic=${encodeURIComponent(topicId)}`);
    onItemClick?.();
  };
  const goToQuestion = () => {
    closeSearch();
    navigate('/fsmap');
    onItemClick?.();
  };
  const goToWrongAnswer = () => {
    closeSearch();
    navigate('/wrong-answers');
    onItemClick?.();
  };

  return (
    <aside
      className="bg-white"
      style={{ width: '100%', minHeight: 0 }}
    >
      <div className="p-3">
        {/* 통합 검색바 */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색 (개념 · 문제 · 오답노트)"
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f172a' }}
          />
          {showDropdown && (
            <div
              className="absolute left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-20"
              style={{ background: 'white', border: '1px solid #e2e8f0', maxHeight: 360, overflowY: 'auto' }}
            >
              {searching ? (
                <p className="text-[11px] text-muted px-3 py-3">검색 중…</p>
              ) : !hasResults ? (
                <p className="text-[11px] text-muted px-3 py-3">"{query}"에 대한 결과가 없습니다.</p>
              ) : (
                <>
                  {results.topics.length > 0 && (
                    <div className="py-1">
                      <p className="text-[10px] font-semibold text-muted uppercase px-3 py-1">개념</p>
                      {results.topics.map((t) => (
                        <button
                          key={t.topic_id}
                          onClick={() => goToTopic(t.topic_id)}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-[#0f172a] truncate"
                          title={t.topic_name}
                        >
                          {t.topic_name}
                          {t.category && <span className="text-[10px] text-muted ml-1">· {t.category}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {results.questions.length > 0 && (
                    <div className="py-1 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted uppercase px-3 py-1">F/S Map 카드</p>
                      {results.questions.map((q) => (
                        <button
                          key={q.id}
                          onClick={goToQuestion}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-[#0f172a] truncate"
                          title={q.question_text}
                        >
                          {q.question_text.slice(0, 60)}{q.question_text.length > 60 ? '…' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {results.wrongAnswers.length > 0 && (
                    <div className="py-1 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted uppercase px-3 py-1">오답노트</p>
                      {results.wrongAnswers.map((w) => (
                        <button
                          key={w.id}
                          onClick={goToWrongAnswer}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-[#0f172a] truncate"
                          title={w.question_text}
                        >
                          {w.question_text.slice(0, 60)}{w.question_text.length > 60 ? '…' : ''}
                          {w.topic_tag && <span className="text-[10px] text-muted ml-1">· {w.topic_tag}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5 px-1">
          FAR F1–F6
        </p>
        <p className="text-[9px] text-muted px-1 mb-3">
          출처: AICPA Blueprint 2026
        </p>

        <div className="flex flex-col gap-1">
          {areas.map((area) => {
            // Default collapsed — user expands each section manually.
            const isExpanded = expandedAreas[area.id] === true;

            return (
              <div key={area.id}>
                {/* Area Header */}
                <button
                  onClick={() => toggleArea(area.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className="text-xs transition-transform"
                    style={{
                      color: area.color,
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      display: 'inline-block',
                    }}
                  >
                    ▸
                  </span>
                  <span
                    className="text-xs font-semibold flex-1 truncate"
                    style={{ color: area.color }}
                  >
                    {area.label}
                  </span>
                  <span className="text-[10px] text-muted" title={`AICPA Blueprint 2026 · Area ${area.blueprintArea} (${area.blueprintAreaName})`}>
                    Area {area.blueprintArea} · {area.blueprintRange}
                  </span>
                </button>

                {/* Topics */}
                {isExpanded && (
                  <div className="ml-4 pl-2 border-l-2 flex flex-col gap-0.5 mb-1" style={{ borderColor: area.color + '40' }}>
                    {area.topics.map((topic: Topic) => {
                      const card = srsCards[topic.id];
                      const accuracy = card ? getAccuracy(card) : -1;
                      const due = card ? isDue(card) : false;
                      const daysUntil = card ? getDaysUntilReview(card) : -1;
                      const statusColor = getStatusColor(accuracy);
                      const isSelected = currentTopicId === topic.id;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => handleTopicClick(topic.id)}
                          title={topic.label}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#4f6ef7]/10' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Status dot */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: statusColor }}
                          />

                          {/* Topic label */}
                          <span
                            className={`text-xs flex-1 truncate ${
                              isSelected ? 'font-semibold text-[#4f6ef7]' : 'text-[#0f172a]'
                            }`}
                          >
                            {topic.label}
                          </span>

                          {/* Right side: DUE badge or days + accuracy */}
                          <div className="flex items-center gap-1 shrink-0">
                            {due && (
                              <span
                                className="text-[9px] font-bold px-1 py-0.5 rounded"
                                style={{ background: '#ef4444', color: 'white' }}
                              >
                                DUE
                              </span>
                            )}
                            {!due && daysUntil >= 0 && (
                              <span className="text-[10px] text-muted">
                                +{daysUntil}일
                              </span>
                            )}
                            {accuracy >= 0 && (
                              <span
                                className="text-[10px] font-medium"
                                style={{ color: statusColor }}
                              >
                                {accuracy}%
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
