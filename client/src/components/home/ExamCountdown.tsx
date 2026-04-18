import { useEffect, useState } from 'react'

const STORAGE_KEY = 'far_exam_date'
const PROMPT_SEEN_KEY = 'far_exam_prompt_seen'

export interface ExamInfo {
  examDate: string | null // YYYY-MM-DD
  daysLeft: number | null
}

export function readExamInfo(): ExamInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { examDate: null, daysLeft: null }
    const d = new Date(raw + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return { examDate: null, daysLeft: null }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffMs = d.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
    return { examDate: raw, daysLeft }
  } catch {
    return { examDate: null, daysLeft: null }
  }
}

interface Props {
  coveredModules: number
  totalModules: number
  /** Fires when the user saves or clears the date — parent refreshes. */
  onChange?: () => void
}

export default function ExamCountdown({
  coveredModules,
  totalModules,
  onChange,
}: Props) {
  const [info, setInfo] = useState<ExamInfo>(() => readExamInfo())
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState<string>(info.examDate ?? '')

  // Auto-open the modal on first visit (no saved date AND first time
  // seeing this page). After dismissing once, it won't auto-reopen even
  // if the user closes without entering — they can still click the
  // "시험일 설정" button to open it later.
  useEffect(() => {
    if (info.examDate) return
    const seen = localStorage.getItem(PROMPT_SEEN_KEY)
    if (!seen) {
      setModalOpen(true)
      localStorage.setItem(PROMPT_SEEN_KEY, '1')
    }
  }, [info.examDate])

  function save(newVal: string) {
    if (!newVal) return
    try {
      localStorage.setItem(STORAGE_KEY, newVal)
    } catch {
      /* ignore */
    }
    setInfo(readExamInfo())
    setModalOpen(false)
    onChange?.()
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setInfo({ examDate: null, daysLeft: null })
    setInput('')
    setModalOpen(false)
    onChange?.()
  }

  const coveragePct = totalModules > 0
    ? Math.round((coveredModules / totalModules) * 100)
    : 0

  // Simple pacing heuristic: remaining modules / avg modules covered per
  // week so far (assume 1 week of use = coveredModules so far; if user
  // has the exam date, we can also bound by examDaysLeft).
  const remaining = Math.max(0, totalModules - coveredModules)
  let paceLine = '데이터가 더 쌓이면 완료 예상 시점을 알려드릴게요.'
  if (coveredModules >= 3) {
    // Assume the user has been going for ~1-4 weeks; use coveredModules/4
    // as a rough weekly velocity estimate (conservative).
    const weeklyVelocity = Math.max(1, Math.round(coveredModules / 4))
    const weeksLeft = Math.ceil(remaining / weeklyVelocity)
    paceLine =
      remaining === 0
        ? '전 모듈 커버리지 달성! 약점 보강 단계로 들어가세요.'
        : `현재 속도 기준 남은 ${remaining}개 모듈 커버리지에 약 ${weeksLeft}주 예상.`
  }

  return (
    <>
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <h3 className="font-semibold text-[#0f172a]">시험 D-day</h3>
          </div>
          <button
            onClick={() => {
              setInput(info.examDate ?? '')
              setModalOpen(true)
            }}
            className="text-[11px] text-[#4f6ef7] hover:underline"
          >
            {info.examDate ? '수정' : '시험일 설정'}
          </button>
        </div>

        {info.examDate && info.daysLeft !== null ? (
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{
                color:
                  info.daysLeft < 30
                    ? '#ef4444'
                    : info.daysLeft < 60
                    ? '#f59e0b'
                    : '#4f6ef7',
              }}
            >
              D{info.daysLeft >= 0 ? `-${info.daysLeft}` : `+${Math.abs(info.daysLeft)}`}
            </span>
            <span className="text-xs text-muted">· {info.examDate}</span>
          </div>
        ) : (
          <p className="text-sm text-muted">시험일을 설정하면 카운트다운과 페이스 가이드가 표시됩니다.</p>
        )}

        <div className="flex items-center gap-3 text-xs">
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${coveragePct}%`, background: '#4f6ef7' }}
            />
          </div>
          <span className="text-muted shrink-0">
            커버리지 {coveredModules}/{totalModules} ({coveragePct}%)
          </span>
        </div>

        <p className="text-xs text-muted">{paceLine}</p>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-[#0f172a] text-lg">시험 날짜 입력</h3>
              <p className="text-xs text-muted mt-1">
                FAR 시험 예정일을 입력하면 학습 페이스 가이드가 나와요. 기기에만 저장되고 서버로 전송되지 않습니다.
              </p>
            </div>
            <input
              type="date"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full text-sm p-2.5 rounded-lg border border-border"
              style={{ outline: 'none' }}
            />
            <div className="flex gap-2 justify-end">
              {info.examDate && (
                <button
                  onClick={clear}
                  className="px-3 py-2 rounded-lg text-xs text-[#ef4444]"
                  style={{ border: '1px solid #fecaca' }}
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs text-[#64748b]"
                style={{ border: '1px solid #e2e8f0' }}
              >
                나중에
              </button>
              <button
                onClick={() => save(input)}
                disabled={!input}
                className="px-3 py-2 rounded-lg text-xs text-white font-semibold disabled:opacity-40"
                style={{ background: '#4f6ef7' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
