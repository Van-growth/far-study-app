import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import {
  getTodayReviewStats,
  getConfusedCount,
  getWeakestTopics,
  getRecentConfusedTopics,
  getTutorSession,
  upsertTutorSession,
  markTutorSessionClicked,
} from '../lib/db'
import { allTopics } from '../data/far-topics'

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001'
const SESSION_KEY = 'far-daily-briefing-shown'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

interface Props {
  userId: string | null
}

export default function DailyBriefingModal({ userId }: Props) {
  const dailyGoal = useStudyStore((s) => s.dailyGoal)
  const navigate = useNavigate()

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [briefingText, setBriefingText] = useState('')
  const [suggestedMode, setSuggestedMode] = useState<'queue' | 'confused' | 'normal'>('normal')
  const [queueCount, setQueueCount] = useState(0)
  const [confusedTotal, setConfusedTotal] = useState(0)
  const dateRef = useRef(todayStr())
  const ranRef = useRef(false)

  useEffect(() => {
    if (!userId || ranRef.current) return
    if (sessionStorage.getItem(SESSION_KEY)) return
    ranRef.current = true
    void run(userId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function run(uid: string) {
    setLoading(true)
    setVisible(true)

    const today = dateRef.current
    const yesterday = yesterdayStr()

    // Check if today's session already exists
    const existing = await getTutorSession(uid, today)
    if (existing?.briefingText) {
      setBriefingText(existing.briefingText)
      setSuggestedMode((existing.suggestedMode ?? 'normal') as 'queue' | 'confused' | 'normal')
      setLoading(false)
      const cc = await getConfusedCount(uid)
      setConfusedTotal(cc)
      setQueueCount(Math.min(5, cc))
      return
    }

    // Collect data in parallel
    const [todayStats, totalConfused, weakTopics, recentTopics, yesterdaySession] = await Promise.all([
      getTodayReviewStats(uid),
      getConfusedCount(uid),
      getWeakestTopics(uid, 2),
      getRecentConfusedTopics(uid, 3),
      getTutorSession(uid, yesterday),
    ])

    setConfusedTotal(totalConfused)
    setQueueCount(Math.min(5, totalConfused))

    const topicLabel = (tid: string) => allTopics.find((t) => t.id === tid)?.label ?? tid

    const payload = {
      todayKnew: todayStats.knewCount,
      todayConfused: todayStats.confusedCount,
      dailyGoal,
      totalConfusedCards: totalConfused,
      weakestTopics: weakTopics.map((t) => ({ ...t, label: topicLabel(t.topicId) })),
      recentConfusedTopics: recentTopics.map((t) => ({ ...t, label: topicLabel(t.topicId) })),
      yesterdaySession: yesterdaySession
        ? {
            briefingText: yesterdaySession.briefingText ?? '',
            suggestedMode: yesterdaySession.suggestedMode ?? 'normal',
            wasClicked: yesterdaySession.wasClicked,
          }
        : null,
    }

    try {
      const res = await fetch(`${API_URL}/api/tutor/daily-briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { briefingText: string; suggestedMode: string }
      const mode = (['queue', 'confused', 'normal'] as const).includes(json.suggestedMode as 'queue' | 'confused' | 'normal')
        ? (json.suggestedMode as 'queue' | 'confused' | 'normal')
        : 'normal'
      setBriefingText(json.briefingText)
      setSuggestedMode(mode)
      void upsertTutorSession(uid, today, json.briefingText, mode)
    } catch {
      setBriefingText('오늘도 화이팅! 복습 큐에서 시작해보자 💪')
      setSuggestedMode(totalConfused >= 3 ? 'queue' : 'normal')
    } finally {
      setLoading(false)
    }
  }

  function close() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleAction(mode: 'queue' | 'confused' | 'normal') {
    if (userId) void markTutorSessionClicked(userId, dateRef.current)
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
    if (mode === 'normal') {
      navigate('/history')
    } else {
      navigate(`/history?mode=${mode}`)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div
        className="relative w-full max-w-sm mx-4 mb-4 md:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: '1.5px solid #e2e8f0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: '#eef2ff', borderBottom: '1px solid #c7d2fe' }}>
          <span className="text-sm font-bold text-[#4338ca]">🤖 오늘의 학습 브리핑</span>
          <button onClick={close} className="text-[#94a3b8] hover:text-[#475569] text-lg leading-none px-1">×</button>
        </div>

        {/* Briefing text */}
        <div className="px-4 py-4 min-h-[80px] flex items-center">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              <div className="w-4 h-4 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
              브리핑 생성 중...
            </div>
          ) : (
            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">{briefingText}</p>
          )}
        </div>

        {/* Action buttons */}
        {!loading && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            <p className="text-xs text-[#94a3b8] mb-1">오늘 뭐 할까요?</p>

            {confusedTotal > 0 && (
              <button
                onClick={() => void handleAction('queue')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  background: suggestedMode === 'queue' ? '#4f6ef7' : '#eef2ff',
                  color: suggestedMode === 'queue' ? 'white' : '#4338ca',
                  border: suggestedMode === 'queue' ? 'none' : '1.5px solid #c7d2fe',
                }}
              >
                🔄 오늘의 큐 {queueCount}문제
                {suggestedMode === 'queue' && <span className="text-[10px] opacity-80 ml-1">추천</span>}
              </button>
            )}

            {confusedTotal > 0 && (
              <button
                onClick={() => void handleAction('confused')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  background: suggestedMode === 'confused' ? '#dc2626' : '#fef2f2',
                  color: suggestedMode === 'confused' ? 'white' : '#b91c1c',
                  border: suggestedMode === 'confused' ? 'none' : '1.5px solid #fecaca',
                }}
              >
                ❌ 오답 재출제 {confusedTotal}개
                {suggestedMode === 'confused' && <span className="text-[10px] opacity-80 ml-1">추천</span>}
              </button>
            )}

            <button
              onClick={() => void handleAction('normal')}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                background: suggestedMode === 'normal' ? '#0f172a' : '#f1f5f9',
                color: suggestedMode === 'normal' ? 'white' : '#475569',
              }}
            >
              📚 일반 복습
              {suggestedMode === 'normal' && <span className="text-[10px] opacity-80 ml-1">추천</span>}
            </button>

            <button onClick={close} className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors mt-1 text-center">
              오늘은 그냥 넘어갈게요
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
