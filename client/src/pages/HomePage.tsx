import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import { daysBetween, todayKST } from '../components/home/ExamCountdown'
import DailyReflectionModal from '../components/home/DailyReflectionModal'
import { hasTodayReflection, getExamDate } from '../lib/db'
import { supabase } from '../lib/supabase'
import { DB } from '../constants/db'

const EXAM_DATE_DEFAULT = '2026-06-08'
const EXAM_LS_KEY = 'far_exam_date'
const REFLECTION_KEY = 'far-reflection-date'

interface WeakTopic {
  topicId: string
  topicName: string
  confusedCount: number
}

async function loadWeakTopics(userId: string): Promise<WeakTopic[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('topic_id, result')
    .eq('user_id', userId)
    .not('topic_id', 'is', null)
    .gte('reviewed_at', since.toISOString())

  if (!data || data.length === 0) return []

  const confused: Record<string, number> = {}
  for (const r of data as { topic_id: string; result: string }[]) {
    if (r.result === 'confused') {
      confused[r.topic_id] = (confused[r.topic_id] ?? 0) + 1
    }
  }

  const topIds = Object.entries(confused)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)

  if (topIds.length === 0) return []

  const { data: topics } = await supabase
    .from(DB.TABLES.TOPICS)
    .select('topic_id, topic_name')
    .in('topic_id', topIds)

  const nameMap: Record<string, string> = {}
  for (const t of (topics ?? []) as { topic_id: string; topic_name: string }[]) {
    nameMap[t.topic_id] = t.topic_name
  }

  return topIds.map(id => ({
    topicId: id,
    topicName: nameMap[id] ?? id,
    confusedCount: confused[id] ?? 0,
  }))
}

async function loadTodaySprintCount(userId: string): Promise<number> {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('concept_id', null)
    .gte('reviewed_at', midnight.toISOString())
  return Math.ceil((count ?? 0) / 5)
}

export default function HomePage() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const streakDays = useStudyStore((s) => s.streakDays)
  const todayReviewCount = useStudyStore((s) => s.todayReviewCount)

  const [examDate, setExamDate] = useState(EXAM_DATE_DEFAULT)
  const [daysLeft, setDaysLeft] = useState<number | null>(
    () => daysBetween(todayKST(), EXAM_DATE_DEFAULT),
  )
  const [sprintCount, setSprintCount] = useState(0)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [showReflection, setShowReflection] = useState(false)
  const [showStreakWarning, setShowStreakWarning] = useState(false)

  // Sync exam date from DB
  useEffect(() => {
    if (!userId) return
    getExamDate(userId).then((date) => {
      if (!date) return
      try { localStorage.setItem(EXAM_LS_KEY, date) } catch { /* ignore */ }
      setExamDate(date)
      setDaysLeft(daysBetween(todayKST(), date))
    })
  }, [userId])

  // Load sprint count + weak topics
  useEffect(() => {
    if (!userId) return
    loadTodaySprintCount(userId).then(setSprintCount)
    loadWeakTopics(userId).then(setWeakTopics)
  }, [userId])

  // Reflection modal
  useEffect(() => {
    if (!userId) return
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(REFLECTION_KEY) === today) return
    hasTodayReflection(userId).then((has) => {
      if (has) {
        localStorage.setItem(REFLECTION_KEY, today)
      } else {
        setShowReflection(true)
      }
    })
  }, [userId])

  // Streak warning
  useEffect(() => {
    const check = () => {
      const hour = parseInt(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false }),
        10,
      )
      const isWarning = (hour >= 12 && hour < 14) || (hour >= 18 && hour < 20) || hour >= 23
      setShowStreakWarning(streakDays > 0 && todayReviewCount === 0 && isWarning)
    }
    check()
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [streakDays, todayReviewCount])

  const handleClose = () => {
    localStorage.setItem(REFLECTION_KEY, new Date().toISOString().slice(0, 10))
    setShowReflection(false)
  }

  // Format exam date as "2026년 6월 8일"
  const examDateLabel = (() => {
    const [y, m, d] = examDate.split('-').map(Number)
    return `${y}년 ${m}월 ${d}일`
  })()

  return (
    <>
      {showReflection && userId && (
        <DailyReflectionModal userId={userId} onClose={handleClose} />
      )}

      <div
        className="flex flex-col items-center justify-center px-6 gap-7"
        style={{ height: 'calc(100dvh - 98px)' }}
      >
        {/* D-Day — dominant */}
        <div className="text-center">
          <div
            className="font-extrabold leading-none"
            style={{ fontSize: 88, color: '#4f6ef7', letterSpacing: '-3px' }}
          >
            {daysLeft !== null ? `D-${daysLeft}` : 'D-?'}
          </div>
          <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
            FAR 시험일 · {examDateLabel}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 w-full max-w-xs">
          <div
            className="flex-1 flex flex-col items-center py-4 rounded-2xl gap-1"
            style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>오늘 스프린트</span>
            <span className="text-2xl font-extrabold" style={{ color: '#0f172a' }}>
              {sprintCount}회
            </span>
          </div>
          <div
            className="flex-1 flex flex-col items-center py-4 rounded-2xl gap-1"
            style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>연속 스트릭</span>
            <span className="text-2xl font-extrabold" style={{ color: streakDays > 0 ? '#f97316' : '#cbd5e1' }}>
              {streakDays > 0 ? `🔥 ${streakDays}일` : '—'}
            </span>
          </div>
        </div>

        {/* Streak warning */}
        {showStreakWarning && (
          <div
            className="w-full max-w-xs px-4 py-2.5 rounded-2xl text-sm font-semibold text-center"
            style={{ background: '#fff7ed', border: '1.5px solid #fb923c', color: '#c2410c' }}
          >
            ⚠️ 오늘 복습 안 하면 스트릭이 끊겨요!
          </div>
        )}

        {/* Weak Topics TOP 3 */}
        <div className="w-full max-w-xs flex flex-col gap-2">
          <span className="text-xs font-semibold" style={{ color: '#64748b' }}>
            📉 개선 필요 TOP 3
          </span>
          {weakTopics.length === 0 ? (
            <div
              className="py-3 px-4 rounded-xl text-sm text-center"
              style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#94a3b8' }}
            >
              아직 데이터 없음 — 스프린트를 시작해보세요!
            </div>
          ) : (
            weakTopics.map((t, i) => (
              <button
                key={t.topicId}
                onClick={() => navigate('/sprint')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left w-full transition-opacity hover:opacity-80 active:opacity-60"
                style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#fef2f2', color: '#ef4444' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>
                    {t.topicName}
                  </div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>
                    오답 {t.confusedCount}회
                  </div>
                </div>
                <span className="text-lg" style={{ color: '#cbd5e1' }}>›</span>
              </button>
            ))
          )}
        </div>

        {/* Sprint CTA */}
        <button
          onClick={() => navigate('/sprint')}
          className="w-full max-w-xs py-5 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-xl transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: '#4f6ef7',
            boxShadow: '0 8px 24px rgba(79,110,247,0.3)',
          }}
        >
          ⚡ 스프린트 시작
        </button>
      </div>
    </>
  )
}
