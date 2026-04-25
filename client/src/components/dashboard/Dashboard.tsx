import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allTopics, areas } from '../../data/far-topics';
import useStudyStore from '../../store/studyStore';
import {
  getStudyActivityStats, getAnalyzeCountByTopic, getTodayReviewStats, StudyActivityStats,
  getMyPatternStats, getErrorPatterns, getTopWrongTopics, MyPatternStat, ErrorPattern, TopWrongTopic,
  getTopicProgressList, get7DayReviewTrend, TopicProgressRow, DayReviewCount,
} from '../../lib/db';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = useStudyStore((s) => s.userId);
  const dueCount = useStudyStore((s) => s.conceptDueCount);

  const [activityStats, setActivityStats] = useState<StudyActivityStats>({
    totalDays: 0, weekCount: 0, analyzeTotal: 0, quizTotal: 0, quizCorrect: 0, streak: 0,
  });
  const [analyzeByTopic, setAnalyzeByTopic] = useState<Record<string, number>>({});
  const [todayReviewed, setTodayReviewed] = useState(0);
  const [patternStats, setPatternStats] = useState<MyPatternStat[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [wrongTopics, setWrongTopics] = useState<TopWrongTopic[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgressRow[]>([]);
  const [reviewTrend, setReviewTrend] = useState<DayReviewCount[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      getStudyActivityStats(userId),
      getAnalyzeCountByTopic(userId),
      getTodayReviewStats(userId),
      getMyPatternStats(userId),
      getErrorPatterns(),
      getTopWrongTopics(userId, 3),
      getTopicProgressList(userId),
      get7DayReviewTrend(userId),
    ]).then(([stats, analyzeMap, reviewStats, myPatterns, patterns, topTopics, progress, trend]) => {
      if (cancelled) return;
      setActivityStats(stats);
      setAnalyzeByTopic(analyzeMap);
      setTodayReviewed(reviewStats.knewCount + reviewStats.confusedCount);
      setPatternStats(myPatterns);
      setErrorPatterns(patterns);
      setWrongTopics(topTopics);
      setTopicProgress(progress);
      setReviewTrend(trend);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const totalAnalyzeCount = Object.values(analyzeByTopic).reduce((s, n) => s + n, 0);

  const topicsWithAnalyze = allTopics.map((topic) => ({
    ...topic,
    analyzeCount: analyzeByTopic[topic.id] ?? 0,
  }));

  // Section-level (F1-F6) analysis count aggregates
  const sectionStats = areas.map((area) => {
    const mods = area.topics.map((t) => ({
      id: t.id,
      label: t.label,
      analyzeCount: analyzeByTopic[t.id] ?? 0,
    }));
    const totalAnalyze = mods.reduce((s, m) => s + m.analyzeCount, 0);
    const analyzed = mods.filter((m) => m.analyzeCount > 0).length;
    return { area, mods, totalAnalyze, analyzed };
  });

  const weakTopics = topicsWithAnalyze
    .filter((t) => t.analyzeCount > 0)
    .sort((a, b) => b.analyzeCount - a.analyzeCount)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 학습일', value: activityStats.totalDays, color: '#4f6ef7', sub: '분석+복습 합산' },
          { label: '이번 주 학습', value: activityStats.weekCount, color: '#0ea5e9', sub: '학습 활동' },
          { label: '총 분석 건수', value: totalAnalyzeCount, color: '#10b981', sub: 'concept 추출 누적' },
          { label: '연속 학습', value: activityStats.streak, color: '#f59e0b', sub: '일 연속' },
        ].map((s) => (
          <div key={s.label} className="card p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <p className="text-xs text-muted mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 복습 카드 현황 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[#0f172a]">복습 카드 현황</h3>
            <p className="text-xs text-muted mt-0.5">
              {dueCount > 0
                ? `${dueCount}개 대기 / 오늘 ${todayReviewed}개 완료`
                : todayReviewed > 0 ? `오늘 ${todayReviewed}개 완료` : 'SRS 기반 복습'}
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: dueCount > 0 ? '#ef4444' : '#4f6ef7' }}
          >
            {dueCount > 0 ? `복습 시작 (${dueCount}개) →` : '복습 카드 보기 →'}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: dueCount > 0 ? '#ef4444' : '#94a3b8' }}>
              {dueCount}
            </p>
            <p className="text-xs text-muted mt-1">오늘 대기</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: todayReviewed > 0 ? '#10b981' : '#94a3b8' }}>
              {todayReviewed}
            </p>
            <p className="text-xs text-muted mt-1">오늘 완료</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#4f6ef7]">{totalAnalyzeCount}</p>
            <p className="text-xs text-muted mt-1">누적 카드</p>
          </div>
        </div>
      </div>

      {/* Section-level (F1-F6) 분석 현황 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0f172a]">Becker 섹션별 분석 현황</h3>
          <p className="text-xs text-muted">F1~F6 누적 분석 건수</p>
        </div>
        <div className="flex flex-col gap-2">
          {sectionStats.map(({ area, mods, totalAnalyze, analyzed }) => {
            const maxAnalyze = Math.max(...sectionStats.map((s) => s.totalAnalyze), 1);
            const pct = Math.round((totalAnalyze / maxAnalyze) * 100);
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
                  {analyzed}/{mods.length} 모듈
                </span>
                <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: area.color }}
                  />
                </div>
                <span className="text-xs font-semibold w-12 text-right" style={{ color: area.color }}>
                  {totalAnalyze}건
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 전체 모듈 진도 — 분석 건수 기반 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0f172a]">전체 모듈 분석 현황</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: '#eef2ff', color: '#4338ca' }}
          >
            복습 카드 →
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {topicsWithAnalyze.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: t.analyzeCount > 0 ? '#4f6ef7' : '#e2e8f0' }}
              />
              <span className="text-sm flex-1">{t.label}</span>
              <span
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: t.areaColor + '15', color: t.areaColor }}
              >
                {t.areaLabel}
              </span>
              {t.analyzeCount > 0 && (
                <span className="text-[10px] text-muted shrink-0">분석 {t.analyzeCount}건</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 분석 많이 한 토픽 */}
      {weakTopics.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">분석 집중 토픽 (Top 5)</h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: '#4f6ef7' }}
            >
              복습 시작
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {weakTopics.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#4f6ef7] shrink-0" />
                <span className="text-sm flex-1">{t.label}</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: t.areaColor + '15', color: t.areaColor }}
                >
                  {t.areaLabel}
                </span>
                <span className="text-sm font-bold text-[#4f6ef7]">분석 {t.analyzeCount}건</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내 실수 패턴 Top 5 */}
      {patternStats.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">내 실수 패턴 Top 5</h3>
            <p className="text-xs text-muted">누적 오답 기록</p>
          </div>
          <div className="flex flex-col gap-2">
            {patternStats.slice(0, 5).map((stat) => {
              const pattern = errorPatterns.find((p) => p.patternId === stat.patternId);
              const maxOcc = Math.max(...patternStats.map((s) => s.occurrence), 1);
              const pct = Math.round((stat.occurrence / maxOcc) * 100);
              return (
                <div key={stat.patternId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-[#0f172a] truncate">
                        {pattern?.name ?? stat.patternId}
                      </span>
                      <span className="text-xs font-bold text-[#ef4444] shrink-0 ml-2">
                        {stat.occurrence}회
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: '#ef4444' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 토픽별 실수 집중도 Top 3 */}
      {wrongTopics.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">토픽별 실수 집중도 Top 3</h3>
            <p className="text-xs text-muted">오답 태깅 기준</p>
          </div>
          <div className="flex flex-col gap-2">
            {wrongTopics.map((wt, i) => {
              const topic = allTopics.find((t) => t.id === wt.topicId);
              return (
                <div key={wt.topicId} className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: i === 0 ? '#fff1f2' : '#fff7f7', border: `1px solid ${i === 0 ? '#fecaca' : '#fee2e2'}` }}>
                  <span className="text-sm font-bold text-[#ef4444] shrink-0 w-4">{i + 1}</span>
                  <span className="text-sm flex-1 truncate">{topic?.label ?? wt.topicId}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: '#fee2e2', color: '#991b1b' }}
                  >
                    {wt.count}회
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 토픽별 정답률 */}
      {topicProgress.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">토픽별 정답률</h3>
            <p className="text-xs text-muted">Becker 분석 기반</p>
          </div>
          <div className="flex flex-col gap-2">
            {topicProgress.slice(0, 8).map((tp) => {
              const topic = allTopics.find((t) => t.id === tp.topicId);
              const pct = Math.round(tp.accuracy * 100);
              const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={tp.topicId} className="flex items-center gap-3">
                  <span className="text-xs w-16 shrink-0 truncate font-medium text-[#0f172a]">{tp.topicId}</span>
                  <span className="text-xs flex-1 truncate text-muted">{topic?.label ?? ''}</span>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-xs font-bold shrink-0 w-10 text-right" style={{ color }}>
                    {pct}%
                  </span>
                  <span className="text-[10px] text-muted shrink-0 w-12 text-right">
                    {tp.correct}/{tp.attempts}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 복습 완료 추이 (최근 7일) */}
      {reviewTrend.some((d) => d.count > 0) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0f172a]">복습 완료 추이</h3>
            <p className="text-xs text-muted">최근 7일</p>
          </div>
          <div className="flex items-end gap-2 h-20">
            {reviewTrend.map((d) => {
              const maxCount = Math.max(...reviewTrend.map((x) => x.count), 1);
              const heightPct = d.count > 0 ? Math.max((d.count / maxCount) * 100, 8) : 0;
              const isToday = d.date === reviewTrend[reviewTrend.length - 1]?.date;
              const label = new Date(d.date + 'T00:00:00').toLocaleDateString('ko-KR', { weekday: 'short' });
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] font-bold" style={{ color: d.count > 0 ? '#4f6ef7' : '#94a3b8' }}>
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: 52 }}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: d.count > 0 ? `${heightPct}%` : '2px',
                        background: isToday ? '#4f6ef7' : d.count > 0 ? '#c7d2fe' : '#f1f5f9',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
