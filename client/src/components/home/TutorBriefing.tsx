import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import useStudyStore from '../../store/studyStore'
import { allTopics } from '../../data/far-topics'
import {
  getWeekAnalyzeCount,
  getAnalyzedModuleIds,
  getModuleWeekAccuracy,
  getWeakestConceptTag,
  getErrorPatterns,
  getMyPatternStats,
  refreshPatternStats,
  getStudyActivityStats,
  getTodayAnalyzeCount,
  getBriefingCache,
  BriefingResponse,
  ConceptStat,
  ModuleWeekAccuracy,
} from '../../lib/db'
import { readExamInfo } from './ExamCountdown'

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

interface Aggregated {
  weekAnalyzeCount: number
  weakestModule: { topicId: string; label: string; accuracy: number; sampleSize: number } | null
  improvingModule: {
    topicId: string
    label: string
    thisWeekAcc: number
    lastWeekAcc: number
    delta: number
  } | null
  weakestConcept: { tag: string; accuracy: number; total: number } | null
  topErrorPattern: { patternId: string; name: string; occurrence: number } | null
  coveragePercent: number
  coveredModules: number
  totalModules: number
  examDaysLeft: number | null
}

interface Props {
  onCoverage?: (covered: number, total: number) => void
}

function todayKey(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

const DAILY_GOAL = 3

export default function TutorBriefing({ onCoverage }: Props) {
  const userId = useStudyStore((s) => s.userId)
  const [loading, setLoading] = useState(true)
  const [agg, setAgg] = useState<Aggregated | null>(null)
  const [ai, setAi] = useState<BriefingResponse | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalDays, setTotalDays] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [todayCountLoading, setTodayCountLoading] = useState(true)

  // forceRefresh=true: bypass DB cache and call the server API directly
  // (used by the "다시 생성" button).
  async function loadData(userIdArg: string, forceRefresh = false) {
    setLoading(true)

    // Snapshot cards and streak are always loaded fresh from DB.
    const [weekCount, analyzedIds, weekAcc, weakConcept, patterns, patternStats, actStats] =
      await Promise.all([
        getWeekAnalyzeCount(userIdArg),
        getAnalyzedModuleIds(userIdArg),
        getModuleWeekAccuracy(userIdArg),
        getWeakestConceptTag(userIdArg),
        getErrorPatterns(),
        refreshPatternStats().then(() => getMyPatternStats(userIdArg)),
        getStudyActivityStats(userIdArg),
      ])

    const computed = buildAggregate({ weekCount, analyzedIds, weekAcc, weakConcept, patterns, patternStats })
    setAgg(computed)
    setStreak(actStats.streak)
    setTotalDays(actStats.totalDays)
    onCoverage?.(computed.coveredModules, computed.totalModules)

    setTodayCountLoading(true)
    getTodayAnalyzeCount(userIdArg).then((c) => { setTodayCount(c); setTodayCountLoading(false) })

    // AI text: use today's server-generated cache unless forceRefresh.
    if (!forceRefresh) {
      const cached = await getBriefingCache(userIdArg)
      if (cached) {
        setAi(cached)
        setLoading(false)
        return
      }
    }

    // Fallback: call server API in real time.
    let aiResp: BriefingResponse = { summary: '', actions: [], dayEstimate: '' }
    try {
      const res = await fetch(`${API_URL}/api/tutor/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(computed),
      })
      if (res.ok) aiResp = (await res.json()) as BriefingResponse
    } catch { /* network failure */ }
    setAi(aiResp)
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    void loadData(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleRegenerate() {
    if (!userId || regenerating) return
    setRegenerating(true)
    await loadData(userId, true)
    setRegenerating(false)
  }

  if (!userId) {
    return (
      <div className="card p-5 text-sm text-muted">
        로그인하면 오늘 학습 브리핑을 볼 수 있어요.
      </div>
    )
  }

  const goalPct = Math.min((todayCount / DAILY_GOAL) * 100, 100)
  const goalDone = todayCount >= DAILY_GOAL
  const streakBroken = !loading && streak === 0 && totalDays > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Hero briefing card */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #4f6ef7 100%)', minHeight: 180 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold opacity-90">✦ Claude AI · 오늘의 FAR 학습 브리핑</span>
            <span className="text-[10px] opacity-70">{todayKey()}</span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={loading || regenerating}
            className="text-[10px] px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.14)', color: 'white' }}
            title="오늘자 캐시 삭제 후 다시 생성"
          >
            {regenerating ? '갱신 중…' : '🔄 다시 생성'}
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>오늘자 브리핑 생성 중…</span>
          </div>
        ) : (
          <div className="text-sm leading-relaxed">
            {ai?.summary ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  p: ({ children }) => <p className="text-sm leading-relaxed mb-1.5 last:mb-0 text-white">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic opacity-90">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc ml-4 my-1 flex flex-col gap-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 my-1 flex flex-col gap-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-white leading-relaxed">{children}</li>,
                }}
              >
                {ai.summary}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-white opacity-80">분석한 문제가 아직 적어 브리핑을 생성할 수 없어요. 먼저 몇 문제를 분석해보세요.</p>
            )}
          </div>
        )}
      </div>

      {/* D: 오늘 목표 넛지 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#0f172a]">📍 오늘 목표: 문제 분석 {DAILY_GOAL}건</p>
          {goalDone && <span className="text-xs font-bold" style={{ color: '#22c55e' }}>✅ 달성!</span>}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${goalPct}%`, background: goalDone ? '#22c55e' : '#4f6ef7' }}
          />
        </div>
        {todayCountLoading ? (
          <p className="text-xs text-muted">불러오는 중…</p>
        ) : goalDone ? (
          <p className="text-xs text-muted">✅ 오늘 목표 달성! 내일도 화이팅 🎉</p>
        ) : (
          <p className="text-xs text-muted">
            {todayCount}건 완료 · 앞으로 {DAILY_GOAL - todayCount}건 더!
          </p>
        )}
      </div>

      {/* A: 스트릭 끊김 경고 배너 */}
      {streakBroken && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
        >
          <span className="text-xl shrink-0">⚠️</span>
          <p className="text-sm font-semibold">스트릭이 끊겼어요. 오늘 다시 시작하세요!</p>
        </div>
      )}

      {/* A: 스트릭 카드 */}
      <div
        className="card p-4 flex items-center gap-4"
        style={{ borderLeft: '4px solid #f97316' }}
      >
        <span className="text-3xl shrink-0">{streak > 0 ? '🔥' : '💤'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted mb-0.5">연속 학습</p>
          {loading ? (
            <p className="text-xl font-bold" style={{ color: '#f97316' }}>—</p>
          ) : streak === 0 ? (
            <p className="text-sm font-semibold text-[#0f172a]">오늘 첫 학습을 시작해보세요! 🔥</p>
          ) : (
            <p className="text-xl font-bold" style={{ color: '#f97316' }}>
              🔥 {streak}일 연속 학습 중!
            </p>
          )}
        </div>
        {!loading && streak > 0 && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-black" style={{ color: '#f97316' }}>{streak}</p>
            <p className="text-[10px] text-muted">일</p>
          </div>
        )}
      </div>

      {/* 3-section snapshot */}
      <div className="grid md:grid-cols-3 gap-3">
        <SnapshotCard icon="📝" label="이번 주 분석" main={agg ? `${agg.weekAnalyzeCount}` : '-'} sub="문제" loading={loading} />
        <SnapshotCard
          icon="⚠️"
          label="가장 약한 모듈"
          main={agg?.weakestModule ? agg.weakestModule.topicId : '-'}
          sub={agg?.weakestModule ? `${Math.round(agg.weakestModule.accuracy * 100)}% · ${agg.weakestModule.sampleSize}회` : '데이터 부족'}
          loading={loading}
          color="#ef4444"
        />
        <SnapshotCard
          icon="📈"
          label="개선 중인 모듈"
          main={agg?.improvingModule ? agg.improvingModule.topicId : '-'}
          sub={agg?.improvingModule ? `+${Math.round(agg.improvingModule.delta * 100)}%p vs 지난주` : '데이터 부족'}
          loading={loading}
          color="#22c55e"
        />
      </div>

      {/* Today's 3 actions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <h3 className="font-semibold text-[#0f172a]">오늘 추천 액션</h3>
          </div>
          <span className="text-[10px] text-muted">Claude 생성 · 하루 1회 갱신</span>
        </div>
        {loading ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : ai && ai.actions.length > 0 ? (
          <ol className="flex flex-col gap-2 pl-0 list-none">
            {ai.actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#f8fafc' }}>
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#4f6ef7' }}>
                  {idx + 1}
                </span>
                <span className="text-sm text-[#0f172a] leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted py-4 text-center">
            추천 액션을 생성하지 못했어요. 분석 탭에서 문제를 2~3건 분석하면 더 정확한 제안을 받을 수 있어요.
          </p>
        )}
        {agg && !loading && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-[10px] text-muted">
            {agg.weakestConcept && (
              <span>약한 개념: {agg.weakestConcept.tag} ({Math.round(agg.weakestConcept.accuracy * 100)}%)</span>
            )}
            {agg.topErrorPattern && (
              <span>· 반복 오류: {agg.topErrorPattern.name} ({agg.topErrorPattern.occurrence}회)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SnapshotCard(props: { icon: string; label: string; main: string; sub: string; loading: boolean; color?: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className="text-2xl">{props.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted">{props.label}</p>
        <p className="text-xl font-bold truncate" style={{ color: props.color ?? '#0f172a' }}>
          {props.loading ? '—' : props.main}
        </p>
        <p className="text-[10px] text-muted truncate">{props.sub}</p>
      </div>
    </div>
  )
}

function buildAggregate(input: {
  weekCount: number
  analyzedIds: string[]
  weekAcc: ModuleWeekAccuracy[]
  weakConcept: ConceptStat | null
  patterns: { patternId: string; name: string }[]
  patternStats: { patternId: string; occurrence: number }[]
}): Aggregated {
  const topicLabel = new Map(allTopics.map((t) => [t.id, t.label]))

  let weakest: Aggregated['weakestModule'] = null
  for (const m of input.weekAcc) {
    if (m.thisWeekAccuracy === null || m.thisWeekTotal < 2) continue
    if (!weakest || m.thisWeekAccuracy < weakest.accuracy) {
      weakest = { topicId: m.topicId, label: topicLabel.get(m.topicId) ?? m.topicId, accuracy: m.thisWeekAccuracy, sampleSize: m.thisWeekTotal }
    }
  }

  let improving: Aggregated['improvingModule'] = null
  for (const m of input.weekAcc) {
    if (m.delta === null || m.delta <= 0) continue
    if (m.thisWeekTotal < 2 || m.lastWeekTotal < 2) continue
    if (!improving || m.delta > improving.delta) {
      improving = { topicId: m.topicId, label: topicLabel.get(m.topicId) ?? m.topicId, thisWeekAcc: m.thisWeekAccuracy ?? 0, lastWeekAcc: m.lastWeekAccuracy ?? 0, delta: m.delta }
    }
  }

  const patternName = new Map(input.patterns.map((p) => [p.patternId, p.name]))
  const topPattern = [...input.patternStats].sort((a, b) => b.occurrence - a.occurrence)[0] ?? null
  const topErrorPattern = topPattern
    ? { patternId: topPattern.patternId, name: patternName.get(topPattern.patternId) ?? topPattern.patternId, occurrence: topPattern.occurrence }
    : null

  const totalModules = allTopics.length
  const coveredSet = new Set(input.analyzedIds.filter((id) => topicLabel.has(id)))
  const coveredModules = coveredSet.size
  const coveragePercent = totalModules > 0 ? Math.round((coveredModules / totalModules) * 100) : 0
  const exam = readExamInfo()

  return {
    weekAnalyzeCount: input.weekCount,
    weakestModule: weakest,
    improvingModule: improving,
    weakestConcept: input.weakConcept ? { tag: input.weakConcept.tag, accuracy: input.weakConcept.accuracy, total: input.weakConcept.total } : null,
    topErrorPattern,
    coveragePercent,
    coveredModules,
    totalModules,
    examDaysLeft: exam.daysLeft,
  }
}
