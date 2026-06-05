import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useStudyStore from '../store/studyStore'
import useClaudeStore from '../store/claudeStore'

const NAVY = '#1a2744'
const BORDER = '1px solid #e0e0e0'
const EXAM_STORAGE_KEY = 'far_exam_info'

// wrong_answers topic_tag → concept-notes category id
const TOPIC_TO_CAT: Record<string, string> = {
  'Bond': 'bond',
  'Lease': 'lease',
  'EPS': 'eps',
  'Note Payable': 'note',
  'ARO': 'aro',
  'Deferred Tax': 'tax',
  'Inventory': 'inventory',
  'Revenue': 'revenue',
  'SCF': 'scf',
  'Equity Method': 'investments',
  'Foreign Currency': 'investments',
  'NFP/Gov': 'nfp',
}

interface WrongStats {
  weekCount: number
  repeatedCount: number
  resolvedCount: number
  byTopic: { topic: string; count: number }[]
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function getWeekStart(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

async function loadWrongStats(userId: string): Promise<WrongStats> {
  const weekStart = getWeekStart()

  const [{ data: allData }, { data: weekData }] = await Promise.all([
    supabase
      .from('wrong_answers')
      .select('topic_tag, times_wrong, is_resolved')
      .eq('user_id', userId),
    supabase
      .from('wrong_answers')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', weekStart),
  ])

  const all = (allData ?? []) as { topic_tag: string | null; times_wrong: number; is_resolved: boolean }[]

  const weekCount = (weekData ?? []).length
  const repeatedCount = all.filter(r => (r.times_wrong ?? 1) >= 2).length
  const resolvedCount = all.filter(r => r.is_resolved).length

  const topicAgg: Record<string, number> = {}
  for (const r of all) {
    if (r.topic_tag) topicAgg[r.topic_tag] = (topicAgg[r.topic_tag] ?? 0) + 1
  }
  const byTopic = Object.entries(topicAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, count]) => ({ topic, count }))

  return { weekCount, repeatedCount, resolvedCount, byTopic }
}

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 6,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const openPanel = useClaudeStore((s) => s.openPanel)

  const [examDate, setExamDate] = useState<string>('')
  const [stats, setStats] = useState<WrongStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Read exam date from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXAM_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { examDate?: string }
        setExamDate(parsed.examDate ?? '')
      }
    } catch { /* ignore */ }
  }, [])

  // Load wrong_answers stats
  useEffect(() => {
    if (!userId) return
    setLoading(true)
    loadWrongStats(userId)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [userId])

  const days = daysUntil(examDate)
  const maxCount = stats?.byTopic?.[0]?.count ?? 1

  return (
    <>
      {/* shimmer animation */}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div
        style={{
          minHeight: '100%', background: '#fff', padding: '28px 20px 48px',
          maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28,
        }}
      >
        {/* ── D-Day ──────────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          {examDate ? (
            <>
              <div style={{ fontSize: 80, fontWeight: 800, color: NAVY, letterSpacing: '-4px', lineHeight: 1 }}>
                {days !== null && days > 0 ? `D-${days}` : days === 0 ? 'D-Day' : days !== null ? `D+${Math.abs(days)}` : '—'}
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                FAR 시험일 · {examDate}
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate('/exam')}
              style={{
                padding: '14px 24px', border: `2px dashed ${NAVY}`, borderRadius: 12,
                background: 'none', color: NAVY, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', width: '100%',
              }}
            >
              시험일을 설정하세요 →
            </button>
          )}
        </div>

        {/* ── 요약 카드 3개 ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            {
              label: '이번 주 오답',
              value: stats?.weekCount,
              action: '복습하기 →',
              onClick: () => navigate('/wrong-answers'),
            },
            {
              label: '반복 오답',
              value: stats?.repeatedCount,
              action: '확인하기 →',
              onClick: () => navigate('/wrong-answers'),
            },
            {
              label: '해결된 오답',
              value: stats?.resolvedCount,
              action: null,
              onClick: null,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: NAVY, color: '#fff', borderRadius: 12,
                padding: '14px 10px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.75 }}>{card.label}</div>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton w={40} h={28} />
                </div>
              ) : (
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
                  {card.value ?? 0}
                </div>
              )}
              {card.action && (
                <button
                  onClick={card.onClick ?? undefined}
                  style={{
                    marginTop: 2, fontSize: 10, fontWeight: 600,
                    background: 'rgba(255,255,255,0.15)', border: 'none',
                    borderRadius: 6, color: '#fff', padding: '3px 6px',
                    cursor: 'pointer',
                  }}
                >
                  {card.action}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── 집중 필요 파트 ───────────────────────────── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 14 }}>
            집중 필요 파트
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 55, 35].map((w, i) => <Skeleton key={i} w={`${w}%`} h={36} />)}
            </div>
          ) : stats && stats.byTopic.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.byTopic.map(({ topic, count }) => {
                const catId = TOPIC_TO_CAT[topic]
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <button
                    key={topic}
                    onClick={() => navigate(catId ? `/concept-notes?cat=${catId}` : '/concept-notes')}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#111' }}>
                      <span>{topic}</span>
                      <span style={{ color: '#666', fontWeight: 400 }}>{count}회</span>
                    </div>
                    <div style={{ height: 8, background: '#e8edf5', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: NAVY, borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, padding: '24px 0', border: BORDER, borderRadius: 10 }}>
              아직 오답 기록이 없어요.
            </div>
          )}
        </div>

        {/* ── 빠른 이동 ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 2 }}>
            빠른 이동
          </div>
          {[
            { label: '📑  개념 공부', path: '/concept-notes', action: null },
            { label: '📝  오답 복습', path: '/wrong-answers', action: null },
            { label: '🧙  Harry 열기', path: null, action: openPanel },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => btn.action ? btn.action() : navigate(btn.path!)}
              style={{
                padding: '13px 16px', border: BORDER, borderRadius: 10,
                background: '#fff', color: NAVY, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
