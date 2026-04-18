import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import { getAnalyzeCountByTopic } from '../lib/db'
import { getAccuracy } from '../lib/srs'
import { getBadge, BADGE_CRITERIA } from '../lib/badges'
import { areas } from '../data/far-topics'

export default function BadgesPage() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const srsCards = useStudyStore((s) => s.srsCards)

  const [analyzeCounts, setAnalyzeCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false
    getAnalyzeCountByTopic(userId).then((counts) => {
      if (!cancelled) { setAnalyzeCounts(counts); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  // Summary stats
  const { masteredCount, learnedCount, totalModules, badgedModules } = useMemo(() => {
    let mastered = 0
    let learned = 0
    let badged = 0
    let total = 0
    for (const area of areas) {
      for (const topic of area.topics) {
        total++
        const count = analyzeCounts[topic.id] ?? 0
        const card = srsCards[topic.id]
        const acc = card ? getAccuracy(card) : 0
        const badge = getBadge(count, acc)
        if (badge) {
          badged++
          if (badge.level >= 4) mastered++
          if (badge.level >= 2) learned++
        }
      }
    }
    return { masteredCount: mastered, learnedCount: learned, totalModules: total, badgedModules: badged }
  }, [analyzeCounts, srsCards])

  // Recent achievements: modules with badge sorted by analyze count desc
  const recentAchievements = useMemo(() => {
    const items: { topicId: string; label: string; areaLabel: string; count: number; level: number; emoji: string; badgeLabel: string }[] = []
    for (const area of areas) {
      for (const topic of area.topics) {
        const count = analyzeCounts[topic.id] ?? 0
        const card = srsCards[topic.id]
        const acc = card ? getAccuracy(card) : 0
        const badge = getBadge(count, acc)
        if (badge) {
          items.push({ topicId: topic.id, label: topic.label, areaLabel: area.label, count, level: badge.level, emoji: badge.emoji, badgeLabel: badge.label })
        }
      }
    }
    return items.sort((a, b) => b.level - a.level || b.count - a.count).slice(0, 8)
  }, [analyzeCounts, srsCards])

  return (
    <div className="max-w-xl mx-auto px-4 pt-5 pb-24 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted hover:text-[#0f172a] text-lg">←</button>
        <div>
          <h1 className="text-lg font-bold text-[#0f172a]">🏆 뱃지 & 성취</h1>
          <p className="text-xs text-muted">모듈별 학습 진행 현황</p>
        </div>
      </div>

      {/* Summary card */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #4f6ef7 100%)' }}
      >
        <p className="text-xs font-semibold opacity-80 mb-3">전체 진행 현황</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{loading ? '…' : badgedModules}</div>
            <div className="text-[11px] opacity-75 mt-0.5">학습 시작</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{loading ? '…' : masteredCount}</div>
            <div className="text-[11px] opacity-75 mt-0.5">🏆 마스터</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalModules}</div>
            <div className="text-[11px] opacity-75 mt-0.5">전체 모듈</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] opacity-75 mb-1">
            <span>마스터 진행률</span>
            <span>{totalModules > 0 ? Math.round((masteredCount / totalModules) * 100) : 0}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${totalModules > 0 ? (masteredCount / totalModules) * 100 : 0}%`,
                background: 'white',
              }}
            />
          </div>
        </div>
      </div>

      {/* Module gallery by part */}
      {areas.map((area) => (
        <div key={area.id} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: area.color }}
            />
            <h2 className="font-semibold text-[#0f172a] text-sm">{area.label}</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted py-2">
              <div className="w-3 h-3 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
              <span>불러오는 중…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {area.topics.map((topic) => {
                const count = analyzeCounts[topic.id] ?? 0
                const card = srsCards[topic.id]
                const acc = card ? getAccuracy(card) : 0
                const badge = getBadge(count, acc)
                return (
                  <div
                    key={topic.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/analyze?topic=${topic.id}`)}
                  >
                    <span className="text-xl shrink-0 w-7 text-center">
                      {badge ? badge.emoji : '⬜'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0f172a] truncate">{topic.label}</p>
                      <p className="text-[11px] text-muted">
                        {count > 0 ? `분석 ${count}건` : '미학습'}
                        {card && acc > 0 ? ` · 퀴즈 ${Math.round(acc)}%` : ''}
                      </p>
                    </div>
                    {badge && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: badge.level >= 4 ? '#fef9c3' : badge.level >= 3 ? '#e0e7ff' : badge.level >= 2 ? '#f0fdf4' : '#f8fafc',
                          color: badge.level >= 4 ? '#854d0e' : badge.level >= 3 ? '#3730a3' : badge.level >= 2 ? '#166534' : '#64748b',
                        }}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Badge criteria card */}
      <div className="card p-5">
        <h2 className="font-semibold text-[#0f172a] text-sm mb-4">뱃지 획득 기준</h2>
        <div className="flex flex-col gap-3">
          {BADGE_CRITERIA.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center">{c.emoji}</span>
              <div>
                <p className="text-sm font-medium text-[#0f172a]">{c.label}</p>
                <p className="text-[11px] text-muted">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent achievements */}
      {recentAchievements.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-[#0f172a] text-sm mb-4">최근 획득 성취</h2>
          <div className="flex flex-col gap-2">
            {recentAchievements.map((item) => (
              <div
                key={item.topicId}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => navigate(`/analyze?topic=${item.topicId}`)}
              >
                <span className="text-xl w-7 text-center">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f172a] truncate">{item.label}</p>
                  <p className="text-[11px] text-muted">{item.areaLabel} · 분석 {item.count}건</p>
                </div>
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: item.level >= 4 ? '#fef9c3' : item.level >= 3 ? '#e0e7ff' : item.level >= 2 ? '#f0fdf4' : '#f8fafc',
                    color: item.level >= 4 ? '#854d0e' : item.level >= 3 ? '#3730a3' : item.level >= 2 ? '#166534' : '#64748b',
                  }}
                >
                  {item.badgeLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
