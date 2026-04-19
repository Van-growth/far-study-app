import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import { readExamInfo } from '../components/home/ExamCountdown'

export default function HomePage() {
  const navigate = useNavigate()
  const dueCount = useStudyStore((s) => s.conceptDueCount)
  const { daysLeft, examDate } = readExamInfo()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-6">

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
  )
}
