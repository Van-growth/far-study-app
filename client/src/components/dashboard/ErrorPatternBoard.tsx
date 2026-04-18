import { useEffect, useMemo, useState } from 'react'
import useStudyStore from '../../store/studyStore'
import {
  getErrorPatterns,
  getMyPatternStats,
  getGlobalPatternStats,
  ErrorPattern,
  MyPatternStat,
  GlobalPatternStat,
} from '../../lib/db'

const layerMeta: Record<
  ErrorPattern['layer'],
  { label: string; bg: string; fg: string }
> = {
  root:    { label: '원인', bg: '#fee2e2', fg: '#991b1b' },
  exec:    { label: '실행', bg: '#dbeafe', fg: '#1e40af' },
  outcome: { label: '결과', bg: '#ccfbf1', fg: '#0f766e' },
}

export default function ErrorPatternBoard() {
  const userId = useStudyStore((s) => s.userId)
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [myStats, setMyStats] = useState<MyPatternStat[]>([])
  const [globalStats, setGlobalStats] = useState<GlobalPatternStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [p, m, g] = await Promise.all([
        getErrorPatterns(),
        userId ? getMyPatternStats(userId) : Promise.resolve([] as MyPatternStat[]),
        getGlobalPatternStats(),
      ])
      if (cancelled) return
      setPatterns(p)
      setMyStats(m)
      setGlobalStats(g)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const rows = useMemo(() => {
    const myMap = new Map(myStats.map((s) => [s.patternId, s]))
    const gMap = new Map(globalStats.map((s) => [s.patternId, s]))
    return patterns.map((p) => {
      const mine = myMap.get(p.patternId)
      const g = gMap.get(p.patternId)
      const globalAvg = g && g.userCount > 0 ? g.totalOccurrence / g.userCount : 0
      return {
        pattern: p,
        occurrence: mine?.occurrence ?? 0,
        recentRate: mine?.recentRate ?? 0,
        improvement: mine?.improvement ?? 0,
        globalAvg,
        globalUsers: g?.userCount ?? 0,
      }
    })
  }, [patterns, myStats, globalStats])

  // GAP: 나 vs 전체 평균 비율 > 1.5 인 상위 3개.
  const gapRows = useMemo(() => {
    return rows
      .filter((r) => r.occurrence > 0 && r.globalAvg > 0)
      .map((r) => ({ ...r, ratio: r.occurrence / r.globalAvg }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3)
  }, [rows])

  if (loading) {
    return <div className="card p-5 text-sm text-muted">불러오는 중…</div>
  }

  return (
    <div id="tab-error-pattern-board" className="flex flex-col gap-5">
      {/* GAP 인사이트 */}
      {gapRows.length > 0 && (
        <div className="card p-5" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f172a]">GAP 인사이트 — 나 vs 전체 평균</h3>
            <span className="text-[10px] text-muted">ratio &gt; 1.5× 만</span>
          </div>
          <div className="flex flex-col gap-2">
            {gapRows.map((r) => (
              <div
                key={r.pattern.patternId}
                className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: '#fff5f5' }}
              >
                <span className="text-xs flex-1 font-medium text-[#0f172a]">
                  {r.pattern.name}
                </span>
                <span className="text-[11px] text-muted">
                  전체 평균 {r.globalAvg.toFixed(1)}회 ({r.globalUsers}명) → 나 {r.occurrence}회
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: '#ef4444' }}
                >
                  {r.ratio.toFixed(1)}× 취약
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full board */}
      <div className="card p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0f172a]">Error Pattern Board</h3>
          <span className="text-[10px] text-muted">{rows.length} 패턴 · 내 태깅 {myStats.length}</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted border-b border-gray-100">
              <th className="py-2 pr-2">ID</th>
              <th className="py-2 pr-2">패턴명</th>
              <th className="py-2 pr-2">층위</th>
              <th className="py-2 pr-2 text-right">내 발생</th>
              <th className="py-2 pr-2 text-right">전체 평균</th>
              <th className="py-2 pr-2 text-right">최근 7일 비중</th>
              <th className="py-2 text-right">개선율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = layerMeta[r.pattern.layer]
              // improvement 는 "지난 7일 - 이번 7일". 양수 = 덜 발생 = 개선.
              const imp = r.improvement
              const impColor = imp > 0 ? '#22c55e' : imp < 0 ? '#ef4444' : '#94a3b8'
              const impLabel = imp === 0 ? '-' : `${imp > 0 ? '+' : ''}${(imp * 100).toFixed(0)}%`
              return (
                <tr key={r.pattern.patternId} className="border-b border-gray-50">
                  <td className="py-2 pr-2 font-mono text-[10px] text-muted">{r.pattern.patternId}</td>
                  <td className="py-2 pr-2 font-medium text-[#0f172a]">
                    {r.pattern.name}
                    {r.pattern.description && (
                      <div className="text-[10px] text-muted font-normal mt-0.5">
                        {r.pattern.description}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: meta.bg, color: meta.fg }}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-right font-semibold" style={{ color: r.occurrence > 0 ? '#ef4444' : '#cbd5e1' }}>
                    {r.occurrence}
                  </td>
                  <td className="py-2 pr-2 text-right text-muted">
                    {r.globalUsers > 0 ? r.globalAvg.toFixed(1) : '-'}
                  </td>
                  <td className="py-2 pr-2 text-right text-muted">
                    {r.recentRate > 0 ? `${(r.recentRate * 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="py-2 text-right font-semibold" style={{ color: impColor }}>
                    {impLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
