import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import { daysBetween, todayKST } from '../components/home/ExamCountdown'
import { supabase } from '../lib/supabase'
import { DB } from '../constants/db'

const EXAM_DATE = '2026-06-08'

interface WeakTopic {
  topicId: string
  topicName: string
  confusedCount: number
}

interface FlashWeakTopic {
  topicId: string
  topicName: string
  confusedCount: number
}

interface CriticalTopic {
  topicId: string
  topicName: string
  count: number
}

async function loadTodaySprintCount(userId: string): Promise<number> {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'sprint')
    .is('concept_id', null)
    .gte('reviewed_at', midnight.toISOString())
  return Math.ceil((count ?? 0) / 5)
}

async function loadWeakTopics(userId: string): Promise<WeakTopic[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('topic_id')
    .eq('user_id', userId)
    .eq('source', 'sprint')
    .eq('result', 'confused')
    .not('topic_id', 'is', null)
    .gte('reviewed_at', since.toISOString())
  if (!data || data.length === 0) return []
  const counts: Record<string, number> = {}
  for (const r of data as { topic_id: string }[]) {
    counts[r.topic_id] = (counts[r.topic_id] ?? 0) + 1
  }
  const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
  const { data: topics } = await supabase
    .from(DB.TABLES.TOPICS).select('topic_id, topic_name').in('topic_id', topIds)
  const nameMap: Record<string, string> = {}
  for (const t of (topics ?? []) as { topic_id: string; topic_name: string }[]) {
    nameMap[t.topic_id] = t.topic_name
  }
  return topIds.map(id => ({ topicId: id, topicName: nameMap[id] ?? id, confusedCount: counts[id] ?? 0 }))
}

async function loadFlashWeakTopics(userId: string): Promise<FlashWeakTopic[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('topic_id')
    .eq('user_id', userId)
    .eq('source', 'flashcard')
    .eq('result', 'confused')
    .not('topic_id', 'is', null)
    .gte('reviewed_at', since.toISOString())
  if (!data || data.length === 0) return []
  const counts: Record<string, number> = {}
  for (const r of data as { topic_id: string }[]) {
    counts[r.topic_id] = (counts[r.topic_id] ?? 0) + 1
  }
  const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
  const { data: topics } = await supabase
    .from(DB.TABLES.TOPICS).select('topic_id, topic_name').in('topic_id', topIds)
  const nameMap: Record<string, string> = {}
  for (const t of (topics ?? []) as { topic_id: string; topic_name: string }[]) {
    nameMap[t.topic_id] = t.topic_name
  }
  return topIds.map(id => ({ topicId: id, topicName: nameMap[id] ?? id, confusedCount: counts[id] ?? 0 }))
}

async function loadCriticalTopics(userId: string): Promise<CriticalTopic[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString()
  const [{ data: sprintData }, { data: flashData }] = await Promise.all([
    supabase.from(DB.TABLES.REVIEW_LOG).select('topic_id')
      .eq('user_id', userId).eq('result', 'confused').eq('source', 'sprint')
      .not('topic_id', 'is', null).gte('reviewed_at', sinceStr),
    supabase.from(DB.TABLES.REVIEW_LOG).select('topic_id')
      .eq('user_id', userId).eq('result', 'confused').eq('source', 'flashcard')
      .not('topic_id', 'is', null).gte('reviewed_at', sinceStr),
  ])
  if (!sprintData || !flashData || flashData.length === 0) return []
  const sprintSet = new Set((sprintData as { topic_id: string }[]).map(r => r.topic_id))
  const flashCounts: Record<string, number> = {}
  for (const r of flashData as { topic_id: string }[]) {
    if (sprintSet.has(r.topic_id)) flashCounts[r.topic_id] = (flashCounts[r.topic_id] ?? 0) + 1
  }
  const topIds = Object.entries(flashCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
  if (topIds.length === 0) return []
  const { data: topics } = await supabase
    .from(DB.TABLES.TOPICS).select('topic_id, topic_name').in('topic_id', topIds)
  const nameMap: Record<string, string> = {}
  for (const t of (topics ?? []) as { topic_id: string; topic_name: string }[]) {
    nameMap[t.topic_id] = t.topic_name
  }
  return topIds.map(id => ({ topicId: id, topicName: nameMap[id] ?? id, count: flashCounts[id] ?? 0 }))
}

export default function HomePage() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const streakDays = useStudyStore((s) => s.streakDays)

  const daysLeft = daysBetween(todayKST(), EXAM_DATE)
  const [sprintCount, setSprintCount] = useState(0)
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [flashWeakTopics, setFlashWeakTopics] = useState<FlashWeakTopic[]>([])
  const [criticalTopics, setCriticalTopics] = useState<CriticalTopic[]>([])

  useEffect(() => {
    if (!userId) return
    loadTodaySprintCount(userId).then(setSprintCount)
    loadWeakTopics(userId).then(setWeakTopics)
    loadFlashWeakTopics(userId).then(setFlashWeakTopics)
    loadCriticalTopics(userId).then(setCriticalTopics)
  }, [userId])

  return (
    <div
      className="flex flex-col items-center justify-start px-5 gap-4 pt-5 pb-8"
      style={{ minHeight: 'calc(100dvh - 98px)', overflowY: 'auto' }}
    >
      {/* ① D-Day */}
      <div className="text-center">
        <div
          className="leading-none"
          style={{ fontSize: 88, fontWeight: 700, color: '#4f6ef7', letterSpacing: '-4px' }}
        >
          {daysLeft !== null ? `D-${daysLeft}` : 'D-?'}
        </div>
        <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>
          FAR 시험일 · 2026년 6월 8일
        </p>
      </div>

      {/* ② 오늘 현황 */}
      <div className="flex gap-3 w-full max-w-xs">
        <div
          className="flex-1 flex flex-col items-center py-3 rounded-2xl gap-0.5"
          style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>오늘 스프린트</span>
          <span className="text-2xl font-extrabold" style={{ color: '#0f172a' }}>{sprintCount}회</span>
        </div>
        <div
          className="flex-1 flex flex-col items-center py-3 rounded-2xl gap-0.5"
          style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>연속 스트릭</span>
          <span className="text-2xl font-extrabold" style={{ color: streakDays > 0 ? '#f97316' : '#cbd5e1' }}>
            {streakDays > 0 ? `🔥 ${streakDays}일` : '—'}
          </span>
        </div>
      </div>

      {/* ③ 개선 필요 TOP 3 */}
      <div className="w-full max-w-xs flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: '#64748b' }}>
          📉 개선 필요 TOP 3 (스프린트)
        </span>
        {weakTopics.length === 0 ? (
          <div
            className="py-2.5 px-4 rounded-xl text-xs text-center"
            style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#94a3b8' }}
          >
            아직 데이터 없음 — 스프린트를 시작해보세요!
          </div>
        ) : (
          weakTopics.map((t, i) => (
            <button
              key={t.topicId}
              onClick={() => navigate(`/sprint?topic_id=${t.topicId}`)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left w-full transition-opacity hover:opacity-80 active:opacity-60"
              style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#fef2f2', color: '#ef4444' }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: '#0f172a' }}>{t.topicName}</div>
                <div className="text-[10px]" style={{ color: '#94a3b8' }}>오답 {t.confusedCount}회</div>
              </div>
              <span className="text-base" style={{ color: '#cbd5e1' }}>›</span>
            </button>
          ))
        )}
      </div>

      {/* ④ 개념 취약 TOP3 */}
      <div className="w-full max-w-xs flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: '#1d4ed8' }}>
          📘 개념 취약 TOP3 (플래시카드)
        </span>
        {flashWeakTopics.length === 0 ? (
          <div
            className="py-2.5 px-4 rounded-xl text-xs text-center"
            style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', color: '#3b82f6' }}
          >
            아직 기록이 없어요 — 개념 탭을 사용해보세요!
          </div>
        ) : (
          flashWeakTopics.map((t, i) => (
            <button
              key={t.topicId}
              onClick={() => navigate(`/concept-notes?topic_id=${t.topicId}`)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left w-full transition-opacity hover:opacity-80 active:opacity-60"
              style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', boxShadow: '0 1px 4px rgba(59,130,246,0.08)' }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#dbeafe', color: '#1d4ed8' }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: '#1e3a5f' }}>{t.topicName}</div>
                <div className="text-[10px]" style={{ color: '#60a5fa' }}>오답 {t.confusedCount}회</div>
              </div>
              <span className="text-base" style={{ color: '#93c5fd' }}>›</span>
            </button>
          ))
        )}
      </div>

      {/* ⑤ 집중 필요 교집합 */}
      <div className="w-full max-w-xs flex flex-col gap-1.5">
        <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>
          🔴 집중 필요 (스프린트+개념 동시 취약)
        </span>
        {criticalTopics.length === 0 ? (
          <div
            className="py-2.5 px-4 rounded-xl text-xs text-center"
            style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#f87171' }}
          >
            아직 기록이 없어요
          </div>
        ) : (
          criticalTopics.map((t, i) => (
            <button
              key={t.topicId}
              onClick={() => navigate(`/sprint?topic_id=${t.topicId}`)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left w-full transition-opacity hover:opacity-80 active:opacity-60"
              style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', boxShadow: '0 1px 4px rgba(239,68,68,0.08)' }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: '#7f1d1d' }}>{t.topicName}</div>
                <div className="text-[10px]" style={{ color: '#ef4444' }}>오답 {t.count}회</div>
              </div>
              <span className="text-base" style={{ color: '#fca5a5' }}>›</span>
            </button>
          ))
        )}
      </div>

      {/* ⑥ 개념 복습 시작 */}
      <button
        onClick={() => navigate('/concept-notes')}
        className="w-full max-w-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-opacity hover:opacity-80 active:opacity-60"
        style={{ background: 'white', border: '2px solid #4f6ef7', color: '#4f6ef7' }}
      >
        📑 개념 복습 시작
      </button>

      {/* ⑦ 스프린트 시작 */}
      <button
        onClick={() => navigate('/sprint')}
        className="w-full max-w-xs py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white text-lg transition-opacity hover:opacity-90 active:opacity-80"
        style={{ background: '#4f6ef7', boxShadow: '0 8px 24px rgba(79,110,247,0.3)' }}
      >
        ⚡ 스프린트 시작
      </button>
    </div>
  )
}
