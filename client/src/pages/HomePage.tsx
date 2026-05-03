import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import { readExamInfo, daysBetween, todayKST, type ExamInfo } from '../components/home/ExamCountdown'
import DailyReflectionModal from '../components/home/DailyReflectionModal'
import { hasTodayReflection, getExamDate } from '../lib/db'

function streakEmoji(days: number): string {
  if (days >= 30) return '🏆'
  if (days >= 7) return '🔥🔥'
  return '🔥'
}

const EXAM_LS_KEY = 'far_exam_date'

const REFLECTION_KEY = 'far-reflection-date';

export default function HomePage() {
  const navigate = useNavigate()
  const dueCount = useStudyStore((s) => s.conceptDueCount)
  const userId = useStudyStore((s) => s.userId)
  const totalXp = useStudyStore((s) => s.totalXp)
  const level = useStudyStore((s) => s.level)
  const streakDays = useStudyStore((s) => s.streakDays)
  const todayReviewCount = useStudyStore((s) => s.todayReviewCount)
  const dailyGoal = useStudyStore((s) => s.dailyGoal)
  const [examInfo, setExamInfo] = useState<ExamInfo>(() => readExamInfo())
  const [showReflection, setShowReflection] = useState(false)
  const [showStreakWarning, setShowStreakWarning] = useState(false)

  // Sync exam date from DB → localStorage on mount.
  // DashboardPage stores to Supabase only; readExamInfo() reads localStorage.
  // This closes the gap so D-day always reflects the DB value.
  useEffect(() => {
    if (!userId) return
    getExamDate(userId).then((date) => {
      if (!date) return
      try { localStorage.setItem(EXAM_LS_KEY, date) } catch { /* ignore */ }
      setExamInfo({ examDate: date, daysLeft: daysBetween(todayKST(), date) })
    })
  }, [userId])

  const { daysLeft, examDate } = examInfo

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().slice(0, 10);
    // Skip if already seen today (avoids DB call on same-day revisits)
    if (localStorage.getItem(REFLECTION_KEY) === today) return;
    // Check DB in case user submitted from another device / cleared storage
    hasTodayReflection(userId).then((has) => {
      if (has) {
        localStorage.setItem(REFLECTION_KEY, today);
      } else {
        setShowReflection(true);
      }
    });
  }, [userId]);

  const handleClose = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(REFLECTION_KEY, today);
    setShowReflection(false);
  };

  // 스트릭 손실 회피 경고 — 23시 이후 + 오늘 복습 0
  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours()
      setShowStreakWarning(streakDays > 0 && todayReviewCount === 0 && hour >= 23)
    }
    check()
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [streakDays, todayReviewCount])

  const goalAchieved = dailyGoal > 0 && todayReviewCount >= dailyGoal
  const goalPct = dailyGoal > 0 ? Math.min(100, (todayReviewCount / dailyGoal) * 100) : 0

  return (
    <>
      {showReflection && userId && (
        <DailyReflectionModal userId={userId} onClose={handleClose} />
      )}

      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-6">

        {/* XP / Level badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm"
          style={{ background: 'white', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <span className="font-bold" style={{ color: '#4338ca' }}>🪙 {totalXp} XP</span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span className="font-semibold" style={{ color: '#0f172a' }}>{level}</span>
          {streakDays >= 1 && (
            <>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span className="font-semibold" style={{ color: '#f97316' }}>
                {streakEmoji(streakDays)} {streakDays}일 연속
              </span>
            </>
          )}
        </div>

        {/* 스트릭 손실 회피 경고 */}
        {showStreakWarning && (
          <div
            className="w-full max-w-xs px-4 py-2.5 rounded-2xl text-sm font-semibold text-center"
            style={{ background: '#fff7ed', border: '1.5px solid #fb923c', color: '#c2410c' }}
          >
            ⚠️ 오늘 복습 안 하면 스트릭이 끊겨요!
          </div>
        )}

        {/* Daily goal progress card */}
        <div
          className="w-full max-w-xs px-4 py-3 rounded-2xl flex flex-col gap-2"
          style={{
            background: goalAchieved ? '#f0fdf4' : 'white',
            border: `1.5px solid ${goalAchieved ? '#86efac' : '#e2e8f0'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: goalAchieved ? '#166534' : '#64748b' }}>
              {goalAchieved ? '🎉 오늘 목표 달성!' : '오늘 복습'}
            </span>
            <span className="text-sm font-bold" style={{ color: goalAchieved ? '#166534' : '#4f6ef7' }}>
              {todayReviewCount} / {dailyGoal} {goalAchieved ? '✅' : '🔥'}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${goalPct}%`,
                background: goalAchieved ? '#22c55e' : 'linear-gradient(90deg, #4f6ef7, #818cf8)',
              }}
            />
          </div>
        </div>

        {/* D-day */}
        <div className="text-center">
          {daysLeft !== null ? (
            <>
              <span className="text-sm text-[#64748b]">FAR 시험까지</span>
              <div className="flex items-baseline gap-1 justify-center mt-0.5">
                <span className="text-4xl font-extrabold text-[#4f6ef7]">D-{daysLeft}</span>
              </div>
              {examDate && (
                <p className="text-xs text-[#94a3b8] mt-0.5">{examDate}</p>
              )}
            </>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-[#94a3b8] underline underline-offset-2"
            >
              시험일 설정하기
            </button>
          )}
        </div>

        {/* 복습하기 */}
        <button
          onClick={() => navigate('/history')}
          className="w-full max-w-xs py-5 rounded-2xl flex flex-col items-center gap-1 font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: dueCount > 0 ? '#ef4444' : '#4f6ef7',
            boxShadow: dueCount > 0
              ? '0 8px 24px rgba(239,68,68,0.3)'
              : '0 8px 24px rgba(79,110,247,0.25)',
          }}
        >
          <span className="text-xl">🔁 복습하기</span>
          {dueCount > 0 ? (
            <span className="text-sm font-medium opacity-90">{dueCount}개 대기 중</span>
          ) : (
            <span className="text-sm font-medium opacity-75">복습 카드 보기</span>
          )}
        </button>

        {/* 분석하기 */}
        <button
          onClick={() => navigate('/analyze')}
          className="w-full max-w-xs py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: 'white',
            border: '1.5px solid #e2e8f0',
            color: '#0f172a',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <span className="text-lg">📝</span>
          <span>분석하기</span>
        </button>

      </div>
    </>
  )
}
