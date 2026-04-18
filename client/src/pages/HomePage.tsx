import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TutorBriefing from '../components/home/TutorBriefing'
import ExamCountdown from '../components/home/ExamCountdown'
import { allTopics } from '../data/far-topics'

export default function HomePage() {
  const navigate = useNavigate()
  const [coverage, setCoverage] = useState<{ covered: number; total: number }>({
    covered: 0,
    total: allTopics.length,
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">
            <span className="text-[#4f6ef7]">AI 튜터</span> 브리핑
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Becker 학습 보조 — 오늘 집중할 것, 지금 약한 것, 시험까지의 페이스를 한 눈에.
          </p>
        </div>

        <TutorBriefing
          onCoverage={(covered, total) => setCoverage({ covered, total })}
        />

        <ExamCountdown
          coveredModules={coverage.covered}
          totalModules={coverage.total}
        />

        {/* Quick actions to primary flow */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/analyze')}
            className="card p-4 text-left hover:shadow-md transition-shadow"
            style={{ borderLeft: '4px solid #4f6ef7' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>📝</span>
              <span className="text-sm font-semibold text-[#0f172a]">문제 분석 열기</span>
            </div>
            <p className="text-xs text-muted">
              Becker 문제를 붙여넣고 한국어 최적화 해설 + 도식화 + 핵심 트리거를 즉시 확인.
            </p>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="card p-4 text-left hover:shadow-md transition-shadow"
            style={{ borderLeft: '4px solid #0ea5e9' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>📊</span>
              <span className="text-sm font-semibold text-[#0f172a]">대시보드 보기</span>
            </div>
            <p className="text-xs text-muted">
              Error Pattern Board · 토픽 Health · Error Chain 탐색.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
