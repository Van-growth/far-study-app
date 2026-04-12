import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allTopics, areas } from '../../data/far-topics';
import useStudyStore from '../../store/studyStore';
import { getAccuracy, getStatusColor, getDaysUntilReview, isDue, SR_INTERVALS } from '../../lib/srs';
import { getCalendar } from '../../lib/db';

export default function Dashboard() {
  const navigate = useNavigate();
  const srsCards = useStudyStore((s) => s.srsCards);
  const userId = useStudyStore((s) => s.userId);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);

  const [sessionStats, setSessionStats] = useState({ totalDays: 0, weekCount: 0, streak: 0 });

  useEffect(() => {
    if (!userId) return;
    getCalendar(userId).then((rows) => {
      const data = rows as { date: string; quiz_count: number }[];
      const totalDays = data.filter((d) => d.quiz_count > 0).length;
      // This week
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const weekStr = monday.toISOString().split('T')[0];
      const weekCount = data
        .filter((d) => d.date >= weekStr && d.quiz_count > 0)
        .reduce((s, d) => s + d.quiz_count, 0);
      // Streak
      let streak = 0;
      const sorted = [...data].filter((d) => d.quiz_count > 0).sort((a, b) => b.date.localeCompare(a.date));
      const todayStr = today.toISOString().split('T')[0];
      let cursor = todayStr;
      for (const row of sorted) {
        if (row.date === cursor) { streak++; const d = new Date(cursor); d.setDate(d.getDate() - 1); cursor = d.toISOString().split('T')[0]; }
        else if (row.date < cursor) break;
      }
      setSessionStats({ totalDays, weekCount, streak });
    });
  }, [userId]);

  const topicsWithStats = allTopics.map((topic) => {
    const card = srsCards[topic.id];
    const accuracy = card ? getAccuracy(card) : -1;
    const due = card ? isDue(card) : false;
    const daysUntil = card ? getDaysUntilReview(card) : -1;
    return { ...topic, card, accuracy, due, daysUntil };
  });

  const started = topicsWithStats.filter((t) => t.card && t.card.attempts > 0);
  const dueTopics = topicsWithStats.filter((t) => t.due);
  const weakTopics = topicsWithStats.filter((t) => t.accuracy >= 0 && t.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy);

  // Section-level (F1-F6) aggregates
  const sectionStats = areas.map((area) => {
    const mods = area.topics.map((t) => {
      const c = srsCards[t.id];
      return {
        id: t.id,
        label: t.label,
        attempts: c?.attempts ?? 0,
        correct: c?.correct ?? 0,
      };
    });
    const totalAtt = mods.reduce((s, m) => s + m.attempts, 0);
    const totalCor = mods.reduce((s, m) => s + m.correct, 0);
    const acc = totalAtt > 0 ? Math.round((totalCor / totalAtt) * 100) : -1;
    const attempted = mods.filter((m) => m.attempts > 0).length;
    return { area, mods, acc, attempted, totalAtt };
  });

  const overallAccuracy = started.length > 0 ? Math.round(started.reduce((s, t) => s + t.accuracy, 0) / started.length) : 0;
  const totalAttempts = Object.values(srsCards).reduce((s, c) => s + c.attempts, 0);
  const totalCorrect = Object.values(srsCards).reduce((s, c) => s + c.correct, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 학습일', value: sessionStats.totalDays, color: '#4f6ef7', sub: '일' },
          { label: '이번 주 풀이', value: sessionStats.weekCount, color: '#0ea5e9', sub: '문제' },
          { label: '전체 정답률', value: started.length > 0 ? `${overallAccuracy}%` : '-', color: getStatusColor(overallAccuracy), sub: `${totalCorrect}/${totalAttempts}` },
          { label: '연속 학습', value: sessionStats.streak, color: '#f59e0b', sub: '일 연속' },
        ].map((s) => (
          <div key={s.label} className="card p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <p className="text-xs text-muted mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* DUE */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0f172a]">오늘 복습 DUE</h3>
            {dueTopics.length > 0 && (
              <button onClick={() => navigate('/quiz?mode=due')} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: '#ef4444' }}>
                전체 복습
              </button>
            )}
          </div>
          {dueTopics.length === 0 ? (
            <div className="text-center py-6"><p className="text-3xl mb-2">✅</p><p className="text-sm text-muted">DUE 없음</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {dueTopics.map((t) => (
                <button key={t.id} onClick={() => { setCurrentTopic(t.id); navigate(`/quiz?topicId=${t.id}`); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getStatusColor(t.accuracy) }} />
                  <span className="text-sm flex-1">{t.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#ef4444', color: 'white' }}>DUE</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SRS Schedule */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#0f172a] mb-4">간격 복습 스케줄</h3>
          <div className="flex flex-col gap-2">
            {SR_INTERVALS.map((days, idx) => {
              const count = topicsWithStats.filter((t) => t.card && t.card.attempts > 0 && t.card.interval === idx && !t.due).length;
              return (
                <div key={days} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#4f6ef7', opacity: 0.4 + idx * 0.1 }}>{days}d</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / Math.max(allTopics.length, 1)) * 100}%`, background: '#4f6ef7' }} />
                  </div>
                  <span className="text-xs text-muted w-16 text-right">{count}개</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section-level (F1-F6) summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0f172a]">Becker 섹션별 정답률</h3>
          <p className="text-xs text-muted">F1~F6 누적 집계</p>
        </div>
        <div className="flex flex-col gap-2">
          {sectionStats.map(({ area, mods, acc, attempted, totalAtt }) => {
            const color = acc >= 80 ? '#22c55e' : acc >= 60 ? '#f59e0b' : acc >= 0 ? '#ef4444' : '#94a3b8';
            return (
              <div key={area.id} className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
                  style={{ background: area.color + '18', color: area.color, minWidth: 32, textAlign: 'center' }}
                >
                  {area.id}
                </span>
                <span className="text-xs flex-1 truncate">{area.label.replace(/^F\d · /, '')}</span>
                <span className="text-[10px] text-muted shrink-0 w-16 text-right">
                  {attempted}/{mods.length} 모듈
                </span>
                <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: acc >= 0 ? `${acc}%` : '0%', background: color }}
                  />
                </div>
                <span
                  className="text-xs font-semibold w-12 text-right"
                  style={{ color: acc >= 0 ? color : '#94a3b8' }}
                >
                  {acc >= 0 ? `${acc}%` : '-'}
                </span>
                <span className="text-[10px] text-muted shrink-0 w-10 text-right">{totalAtt}회</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* All topics */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0f172a]">전체 모듈 진도</h3>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" /> ≥80%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block" /> 60-79%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" /> &lt;60%</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {topicsWithStats.map((t) => {
            const color = getStatusColor(t.accuracy);
            return (
              <button key={t.id} onClick={() => { setCurrentTopic(t.id); navigate(`/quiz?topicId=${t.id}`); }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm flex-1">{t.label}</span>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: t.areaColor + '15', color: t.areaColor }}>{t.areaLabel}</span>
                {t.due && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: '#ef4444', color: 'white' }}>DUE</span>}
                {!t.due && t.daysUntil >= 0 && <span className="text-[10px] text-muted">+{t.daysUntil}일</span>}
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: t.accuracy >= 0 ? `${t.accuracy}%` : '0%', background: color }} />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color: t.accuracy >= 0 ? color : '#94a3b8' }}>{t.accuracy >= 0 ? `${t.accuracy}%` : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">약점 토픽 (60% 미만)</h3>
            <button onClick={() => navigate('/quiz?mode=weak')} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: '#f59e0b' }}>약점 퀴즈</button>
          </div>
          <div className="flex flex-col gap-2">
            {weakTopics.slice(0, 5).map((t) => (
              <button key={t.id} onClick={() => navigate(`/quiz?topicId=${t.id}`)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0" />
                <span className="text-sm flex-1">{t.label}</span>
                <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{t.accuracy}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
