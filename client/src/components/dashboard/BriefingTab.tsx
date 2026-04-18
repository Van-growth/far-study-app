import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../../store/studyStore'
import {
  getErrorPatterns,
  getMyPatternStats,
  getGlobalPatternStats,
  refreshPatternStats,
  ErrorPattern,
  MyPatternStat,
  GlobalPatternStat,
} from '../../lib/db'
import { getAccuracy } from '../../lib/srs'
import { allTopics } from '../../data/far-topics'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

export default function BriefingTab() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const srsCards = useStudyStore((s) => s.srsCards)

  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [myStats, setMyStats] = useState<MyPatternStat[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalPatternStat[]>([])
  const [briefing, setBriefing] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // 약점 토픽 (60% 미만) — briefing 프롬프트에 같이 넣는다.
  const weakTopics = useMemo(() => {
    return allTopics
      .map((t) => {
        const c = srsCards[t.id]
        const acc = c ? getAccuracy(c) : -1
        return { topicLabel: t.label, accuracy: acc }
      })
      .filter((t) => t.accuracy >= 0 && t.accuracy < 60)
      .slice(0, 5)
  }, [srsCards])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      // refresh recent_rate/improvement 먼저.
      await refreshPatternStats()
      const [p, m, g] = await Promise.all([
        getErrorPatterns(),
        getMyPatternStats(userId),
        getGlobalPatternStats(),
      ])
      if (cancelled) return
      setPatterns(p)
      setMyStats(m)
      setGlobalStats(g)
      // Claude 브리핑 호출.
      const nameMap = new Map(p.map((x) => [x.patternId, x.name]))
      const myTop = m.slice(0, 3).map((s) => ({
        pattern_id: s.patternId,
        name: nameMap.get(s.patternId) ?? s.patternId,
        occurrence: s.occurrence,
        recent_rate: s.recentRate,
      }))
      const globalTop = g
        .slice()
        .sort((a, b) => b.totalOccurrence - a.totalOccurrence)
        .slice(0, 3)
        .map((s) => ({
          pattern_id: s.patternId,
          name: nameMap.get(s.patternId) ?? s.patternId,
          user_count: s.userCount,
          total_occurrence: s.totalOccurrence,
        }))
      try {
        const res = await fetch(`${API_URL}/api/error-patterns/briefing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ my: myTop, global: globalTop, weakTopics }),
        })
        if (!cancelled && res.ok) {
          const body = (await res.json()) as { briefing?: string }
          setBriefing(body.briefing ?? '')
        }
      } catch {
        // 네트워크 실패 — briefing 비워두고 나머지는 그대로 보여준다.
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const nameMap = useMemo(
    () => new Map(patterns.map((p) => [p.patternId, p.name])),
    [patterns],
  )

  const top3 = myStats.slice(0, 3)

  return (
    <div className="flex flex-col gap-5">
      {/* Briefing gradient card */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #4f6ef7 100%)',
          minHeight: 160,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold opacity-90">✦ Claude AI · FAR 학습 브리핑</span>
          <span className="text-[10px] opacity-70">· 오늘</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>브리핑 생성 중…</span>
          </div>
        ) : briefing ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{briefing}</div>
        ) : (
          <div className="text-sm opacity-80">
            {myStats.length === 0
              ? '오답 태깅이 아직 쌓이지 않았어요. 오늘 문제를 몇 개 풀고 "왜 틀렸나요?"에 답해보세요.'
              : '브리핑을 불러오지 못했어요. 네트워크를 확인하세요.'}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/quiz?mode=weak')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-[#1e293b] hover:bg-opacity-90"
          >
            오늘 추천 문제 시작
          </button>
          <button
            onClick={() =>
              document
                .getElementById('tab-error-pattern-board')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
          >
            취약 패턴 보기
          </button>
        </div>
      </div>

      {/* 상위 3패턴 미리보기 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#0f172a]">내 최다 오답 패턴 Top 3</h3>
          <span className="text-[10px] text-muted">{myStats.length} 패턴 태깅됨</span>
        </div>
        {top3.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            아직 태깅된 패턴이 없어요. 퀴즈에서 오답 후 "왜 틀렸나요?"를 눌러 태깅해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {top3.map((s, idx) => {
              const name = nameMap.get(s.patternId) ?? s.patternId
              const g = globalStats.find((x) => x.patternId === s.patternId)
              const avg = g && g.userCount > 0 ? g.totalOccurrence / g.userCount : 0
              const ratio = avg > 0 ? (s.occurrence / avg) : 0
              return (
                <div
                  key={s.patternId}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ background: idx === 0 ? '#fef2f2' : '#f8fafc' }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: idx === 0 ? '#ef4444' : '#64748b' }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm flex-1 font-medium text-[#0f172a]">{name}</span>
                  <span className="text-[10px] text-muted font-mono">{s.patternId}</span>
                  <span className="text-xs font-semibold text-[#ef4444] w-12 text-right">
                    {s.occurrence}회
                  </span>
                  {ratio > 1.5 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: '#fee2e2', color: '#991b1b' }}
                    >
                      평균 {ratio.toFixed(1)}×
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
