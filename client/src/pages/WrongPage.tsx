import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWrongLogs, getModulePerformance, ModulePerf } from '../lib/db';
import useStudyStore from '../store/studyStore';
import useClaudeStore from '../store/claudeStore';
import { useClaudeChat } from '../hooks/useClaudeChat';
import { areas } from '../data/far-topics';
import { formatElapsed, elapsedTone } from '../components/quiz/QuizView';

interface WrongLog {
  id: string;
  topic_id: string;
  topic_label: string;
  question: string;
  options: string[];
  correct: boolean;
  selected: number;
  answer: number;
  created_at: string;
}

const ALPHA = ['A', 'B', 'C', 'D'];

// ── Module performance tree ──────────────────────────────────
function ModulePerformanceTree({
  perf,
  navigate,
}: {
  perf: Record<string, ModulePerf>;
  navigate: (path: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#0f172a]">⏱ 모듈별 풀이 시간 · 정답률</p>
        <p className="text-[10px] text-muted">초록 ≤40s · 주황 41–60s · 빨강 ≥61s</p>
      </div>
      <div className="flex flex-col gap-1">
        {areas.map((area) => {
          const isCollapsed = collapsed[area.id] === true;
          return (
            <div key={area.id}>
              <button
                onClick={() => toggle(area.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left"
              >
                <span
                  className="text-[10px] transition-transform"
                  style={{
                    color: area.color,
                    transform: isCollapsed ? 'none' : 'rotate(90deg)',
                    display: 'inline-block',
                  }}
                >
                  ▸
                </span>
                <span className="text-xs font-semibold flex-1" style={{ color: area.color }}>
                  {area.label}
                </span>
              </button>
              {!isCollapsed && (
                <div
                  className="ml-4 pl-2 border-l-2 flex flex-col gap-0.5 mb-1"
                  style={{ borderColor: area.color + '40' }}
                >
                  {area.topics.map((topic) => {
                    const p = perf[topic.id];
                    const hasData = p && p.total > 0;
                    const avg = hasData ? p.avgSeconds : null;
                    const accuracy = hasData ? Math.round((p.correct / p.total) * 100) : null;
                    const tone = avg !== null ? elapsedTone(avg) : null;
                    const bg = !hasData
                      ? 'transparent'
                      : tone
                      ? tone.color + '10'
                      : 'transparent';

                    return (
                      <button
                        key={topic.id}
                        onClick={() => navigate(`/quiz?topicId=${topic.id}`)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-colors hover:bg-gray-50"
                        style={{ background: bg }}
                      >
                        <span className="text-[10px] text-muted shrink-0 font-mono">
                          {topic.id.split('-')[1]}
                        </span>
                        <span className="text-xs flex-1 truncate text-[#0f172a]">{topic.label}</span>
                        {!hasData ? (
                          <span className="text-[10px] text-[#94a3b8] shrink-0">미학습</span>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            {avg !== null && tone ? (
                              <span
                                className="text-[10px] font-mono tabular-nums"
                                style={{
                                  color: tone.color,
                                  fontWeight: tone.bold ? 700 : 500,
                                }}
                              >
                                {formatElapsed(avg)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted">—:—</span>
                            )}
                            <span className="text-[9px] text-muted">·</span>
                            <span
                              className="text-[10px] font-semibold"
                              style={{
                                color:
                                  (accuracy ?? 0) >= 80
                                    ? '#22c55e'
                                    : (accuracy ?? 0) >= 60
                                    ? '#f59e0b'
                                    : '#ef4444',
                              }}
                            >
                              정답률 {accuracy}%
                            </span>
                            <span className="text-[9px] text-muted">({p.total})</span>
                          </div>
                        )}
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
  );
}

export default function WrongPage() {
  const navigate = useNavigate();
  const userId = useStudyStore((s) => s.userId);
  const [logs, setLogs] = useState<WrongLog[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [perf, setPerf] = useState<Record<string, ModulePerf>>({});

  const openPanel = useClaudeStore((s) => s.openPanel);
  const { sendMessage } = useClaudeChat();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      getWrongLogs(userId, 100).then((d) => setLogs(d as WrongLog[])),
      getModulePerformance(userId).then(setPerf).catch(() => setPerf({})),
    ]).finally(() => setLoading(false));
  }, [userId]);

  const filtered = filter ? logs.filter((l) => l.topic_id === filter) : logs;

  // Topic frequency
  const topicCounts: Record<string, { label: string; count: number }> = {};
  for (const l of logs) {
    if (!topicCounts[l.topic_id]) topicCounts[l.topic_id] = { label: l.topic_label, count: 0 };
    topicCounts[l.topic_id].count++;
  }
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3);

  const getAreaColor = (topicId: string) =>
    areas.find((a) => a.topics.some((t) => t.id === topicId))?.color ?? '#4f6ef7';

  const askClaude = (log: WrongLog) => {
    openPanel();
    const opts = (log.options as string[]).map((o, i) => `${ALPHA[i]}. ${o}`).join(' / ');
    sendMessage(
      `다음 FAR 오답을 해설해줘.\n\n문제: ${log.question}\n선택지: ${opts}\n정답: ${ALPHA[log.answer]}. ${log.options[log.answer]}\n내 선택: ${ALPHA[log.selected]}. ${log.options[log.selected]}\n\n1. 왜 틀렸는지\n2. 핵심 규칙\n3. Trigger 키워드`,
    );
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">📕 오답노트</h1>
            <p className="text-sm text-muted mt-0.5">총 {logs.length}개 오답</p>
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => navigate(`/quiz?mode=wrong`)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#ef4444' }}
            >
              오답만 다시 풀기
            </button>
          )}
        </div>

        {/* Module performance tree — time + accuracy by Becker section */}
        <ModulePerformanceTree perf={perf} navigate={navigate} />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {topTopics.map(([tid, { label, count }]) => (
            <div
              key={tid}
              className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeft: `3px solid ${getAreaColor(tid)}` }}
              onClick={() => setFilter(filter === tid ? '' : tid)}
            >
              <p className="text-xs text-muted">오답 빈출 토픽</p>
              <p className="text-sm font-semibold text-[#0f172a] truncate">{label}</p>
              <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{count}회</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white outline-none"
          style={{ border: '1.5px solid #e2e8f0' }}
        >
          <option value="">전체 토픽</option>
          {Object.entries(topicCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([tid, { label, count }]) => (
              <option key={tid} value={tid}>
                {label} ({count})
              </option>
            ))}
        </select>

        {/* Wrong Log Cards */}
        {loading ? (
          <div className="text-center py-8 text-muted text-sm">로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="font-semibold text-[#0f172a]">오답이 없습니다!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((log) => {
              const color = getAreaColor(log.topic_id);
              const d = new Date(log.created_at);
              const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
              return (
                <div key={log.id} className="card overflow-hidden" style={{ borderTop: `3px solid ${color}` }}>
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: color + '18', color }}
                      >
                        {log.topic_label}
                      </span>
                      <span className="text-xs text-muted">{dateStr}</span>
                    </div>

                    <p className="text-sm font-medium text-[#0f172a] leading-relaxed">
                      Q. {log.question}
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
                        <span className="text-xs font-bold" style={{ color: '#ef4444' }}>❌</span>
                        <span className="text-sm text-[#991b1b]">
                          내 선택: {ALPHA[log.selected]}. {(log.options as string[])[log.selected]}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span className="text-xs font-bold" style={{ color: '#22c55e' }}>✅</span>
                        <span className="text-sm text-[#166534]">
                          정답: {ALPHA[log.answer]}. {(log.options as string[])[log.answer]}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => askClaude(log)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[#eef2ff]"
                      style={{ border: '1.5px solid #c7d2fe', color: '#4f6ef7' }}
                    >
                      📋 Claude 상세 해설
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
