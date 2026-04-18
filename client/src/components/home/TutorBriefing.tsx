import { useEffect, useState } from 'react'
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
  ConceptStat,
  ModuleWeekAccuracy,
} from '../../lib/db'
import { readExamInfo } from './ExamCountdown'

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

interface BriefingResponse {
  summary: string
  actions: string[]
  dayEstimate: string
}

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
  /** Fires once the covered/total counts are known so the parent
   *  countdown widget can pick them up. */
  onCoverage?: (covered: number, total: number) => void
}

function todayKey(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function cacheKey(userId: string): string {
  return `far_briefing_${userId.slice(0, 8)}_${todayKey()}`
}

interface CachedBriefing {
  agg: Aggregated
  ai: BriefingResponse
}

function readCache(userId: string): CachedBriefing | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as CachedBriefing
  } catch {
    return null
  }
}

function writeCache(userId: string, value: CachedBriefing) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(value))
  } catch {
    /* quota / private mode — silent */
  }
}

export default function TutorBriefing({ onCoverage }: Props) {
  const userId = useStudyStore((s) => s.userId)
  const [loading, setLoading] = useState(true)
  const [agg, setAgg] = useState<Aggregated | null>(null)
  const [ai, setAi] = useState<BriefingResponse | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  async function loadFresh(userIdArg: string) {
    setLoading(true)
    const [weekCount, analyzedIds, weekAcc, weakConcept, patterns, patternStats] =
      await Promise.all([
        getWeekAnalyzeCount(userIdArg),
        getAnalyzedModuleIds(userIdArg),
        getModuleWeekAccuracy(userIdArg),
        getWeakestConceptTag(userIdArg),
        getErrorPatterns(),
        refreshPatternStats().then(() => getMyPatternStats(userIdArg)),
      ])

    const computed = buildAggregate({
      weekCount,
      analyzedIds,
      weekAcc,
      weakConcept,
      patterns,
      patternStats,
    })
    setAgg(computed)
    onCoverage?.(computed.coveredModules, computed.totalModules)

    let aiResp: BriefingResponse = { summary: '', actions: [], dayEstimate: '' }
    try {
      const res = await fetch(`${API_URL}/api/tutor/briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(computed),
      })
      if (res.ok) {
        aiResp = (await res.json()) as BriefingResponse
      }
    } catch {
      /* network failure — fall through with empty AI response */
    }
    setAi(aiResp)
    writeCache(userIdArg, { agg: computed, ai: aiResp })
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const cached = readCache(userId)
    if (cached) {
      setAgg(cached.agg)
      setAi(cached.ai)
      onCoverage?.(cached.agg.coveredModules, cached.agg.totalModules)
      setLoading(false)
      return
    }
    void loadFresh(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleRegenerate() {
    if (!userId || regenerating) return
    setRegenerating(true)
    try {
      localStorage.removeItem(cacheKey(userId))
    } catch {
      /* ignore */
    }
    await loadFresh(userId)
    setRegenerating(false)
  }

  if (!userId) {
    return (
      <div className="card p-5 text-sm text-muted">
        로그인하면 오늘 학습 브리핑을 볼 수 있어요.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Hero briefing card */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #4f6ef7 100%)',
          minHeight: 180,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold opacity-90">
              ✦ Claude AI · 오늘의 FAR 학습 브리핑
            </span>
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
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {ai?.summary || '분석한 문제가 아직 적어 브리핑을 생성할 수 없어요. 먼저 몇 문제를 분석해보세요.'}
          </div>
        )}
      </div>

      {/* 3-section snapshot */}
      <div className="grid md:grid-cols-3 gap-3">
        <SnapshotCard
          icon="📝"
          label="이번 주 분석"
          main={agg ? `${agg.weekAnalyzeCount}` : '-'}
          sub="문제"
          loading={loading}
        />
        <SnapshotCard
          icon="⚠️"
          label="가장 약한 모듈"
          main={agg?.weakestModule ? agg.weakestModule.topicId : '-'}
          sub={
            agg?.weakestModule
              ? `${Math.round(agg.weakestModule.accuracy * 100)}% · ${agg.weakestModule.sampleSize}회`
              : '데이터 부족'
          }
          loading={loading}
          color="#ef4444"
        />
        <SnapshotCard
          icon="📈"
          label="개선 중인 모듈"
          main={agg?.improvingModule ? agg.improvingModule.topicId : '-'}
          sub={
            agg?.improvingModule
              ? `+${Math.round(agg.improvingModule.delta * 100)}%p vs 지난주`
              : '데이터 부족'
          }
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
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: '#f8fafc' }}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#4f6ef7' }}
                >
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

        {/* Raw signals used — shown in a muted row for transparency */}
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

function SnapshotCard(props: {
  icon: string
  label: string
  main: string
  sub: string
  loading: boolean
  color?: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <span className="text-2xl">{props.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted">{props.label}</p>
        <p
          className="text-xl font-bold truncate"
          style={{ color: props.color ?? '#0f172a' }}
        >
          {props.loading ? '—' : props.main}
        </p>
        <p className="text-[10px] text-muted truncate">{props.sub}</p>
      </div>
    </div>
  )
}

// ---------------- Aggregation helpers ----------------

function buildAggregate(input: {
  weekCount: number
  analyzedIds: string[]
  weekAcc: ModuleWeekAccuracy[]
  weakConcept: ConceptStat | null
  patterns: { patternId: string; name: string }[]
  patternStats: { patternId: string; occurrence: number }[]
}): Aggregated {
  const topicLabel = new Map(allTopics.map((t) => [t.id, t.label]))

  // Weakest module: this-week accuracy, require >=2 attempts.
  let weakest: Aggregated['weakestModule'] = null
  for (const m of input.weekAcc) {
    if (m.thisWeekAccuracy === null || m.thisWeekTotal < 2) continue
    if (!weakest || m.thisWeekAccuracy < weakest.accuracy) {
      weakest = {
        topicId: m.topicId,
        label: topicLabel.get(m.topicId) ?? m.topicId,
        accuracy: m.thisWeekAccuracy,
        sampleSize: m.thisWeekTotal,
      }
    }
  }

  // Improving module: largest positive delta with both weeks populated.
  let improving: Aggregated['improvingModule'] = null
  for (const m of input.weekAcc) {
    if (m.delta === null || m.delta <= 0) continue
    if (m.thisWeekTotal < 2 || m.lastWeekTotal < 2) continue
    if (!improving || m.delta > improving.delta) {
      improving = {
        topicId: m.topicId,
        label: topicLabel.get(m.topicId) ?? m.topicId,
        thisWeekAcc: m.thisWeekAccuracy ?? 0,
        lastWeekAcc: m.lastWeekAccuracy ?? 0,
        delta: m.delta,
      }
    }
  }

  // Top error pattern (by occurrence).
  const patternName = new Map(input.patterns.map((p) => [p.patternId, p.name]))
  const sortedPatterns = [...input.patternStats].sort(
    (a, b) => b.occurrence - a.occurrence,
  )
  const topPattern = sortedPatterns[0] ?? null
  const topErrorPattern = topPattern
    ? {
        patternId: topPattern.patternId,
        name: patternName.get(topPattern.patternId) ?? topPattern.patternId,
        occurrence: topPattern.occurrence,
      }
    : null

  // Coverage: analyzed modules / total modules.
  const totalModules = allTopics.length
  const coveredSet = new Set(input.analyzedIds.filter((id) => topicLabel.has(id)))
  const coveredModules = coveredSet.size
  const coveragePercent =
    totalModules > 0 ? Math.round((coveredModules / totalModules) * 100) : 0

  const exam = readExamInfo()

  return {
    weekAnalyzeCount: input.weekCount,
    weakestModule: weakest,
    improvingModule: improving,
    weakestConcept: input.weakConcept
      ? { tag: input.weakConcept.tag, accuracy: input.weakConcept.accuracy, total: input.weakConcept.total }
      : null,
    topErrorPattern,
    coveragePercent,
    coveredModules,
    totalModules,
    examDaysLeft: exam.daysLeft,
  }
}
