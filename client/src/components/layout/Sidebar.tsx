import { useNavigate } from 'react-router-dom';
import { areas, Topic } from '../../data/far-topics';
import useStudyStore from '../../store/studyStore';
import { getAccuracy, getStatusColor, getDaysUntilReview, isDue } from '../../lib/srs';

export default function Sidebar() {
  const navigate = useNavigate();
  const expandedAreas = useStudyStore((s) => s.expandedAreas);
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const toggleArea = useStudyStore((s) => s.toggleArea);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);
  const srsCards = useStudyStore((s) => s.srsCards);

  const handleTopicClick = (topicId: string) => {
    setCurrentTopic(topicId);
    navigate(`/quiz?topicId=${topicId}`);
  };

  return (
    <aside
      className="overflow-y-auto bg-white border-r border-border shrink-0"
      style={{ width: 250, minHeight: 0 }}
    >
      <div className="p-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5 px-1">
          Becker F1–F6
        </p>
        <p className="text-[9px] text-muted px-1 mb-3">
          출처: AICPA Blueprint 2026 · Becker 구조
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
                      const hasContent = topic.quiz.length > 0;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => hasContent && handleTopicClick(topic.id)}
                          disabled={!hasContent}
                          title={hasContent ? topic.label : `${topic.label} (문제 준비 중)`}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'bg-[#4f6ef7]/10'
                              : hasContent
                              ? 'hover:bg-gray-50'
                              : 'opacity-40 cursor-not-allowed'
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
