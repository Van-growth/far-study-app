import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'far_exam_date'
const PROMPT_SEEN_KEY = 'far_exam_prompt_seen'

// ---------------- KST date utilities ----------------
// Everything is computed against Asia/Seoul so a student in another
// timezone (travel, VPN) still gets the same D-day the app would show
// at home. We deliberately avoid Date object math beyond what Date.UTC
// gives us because JS Date is implicitly browser-local.

/** Today in KST as 'YYYY-MM-DD'. `en-CA` locale is the reliable way to
 *  get ISO-formatted output across browsers. */
export function todayKST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

/** Whole-day difference between two 'YYYY-MM-DD' strings. Positive = b is
 *  after a. Computes using UTC midnight of each calendar date, so DST and
 *  user-local timezone can't bias the result. */
export function daysBetween(aYmd: string, bYmd: string): number {
  const [ay, am, ad] = aYmd.split('-').map(Number)
  const [by, bm, bd] = bYmd.split('-').map(Number)
  const aMs = Date.UTC(ay, am - 1, ad)
  const bMs = Date.UTC(by, bm - 1, bd)
  return Math.round((bMs - aMs) / 86400000)
}

/** ms until the next KST midnight, from `now`. Used to schedule a
 *  re-render exactly when the D-day should tick over. */
function msUntilNextKstMidnight(now: Date = new Date()): number {
  // KST is UTC+9 and never observes DST, so we can convert to a "KST
  // wall clock" by shifting UTC by +9h.
  const utcMs = now.getTime()
  const kstMs = utcMs + 9 * 60 * 60 * 1000
  const msInDay = 24 * 60 * 60 * 1000
  const elapsedInKstDay = kstMs % msInDay
  // +1s cushion so we're safely past midnight when the handler fires.
  return msInDay - elapsedInKstDay + 1000
}

// ---------------- Public read helper ----------------

export interface ExamInfo {
  examDate: string | null // 'YYYY-MM-DD'
  daysLeft: number | null // from KST today
}

export function readExamInfo(): ExamInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { examDate: null, daysLeft: null }
    // Guard against malformed or legacy values.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { examDate: null, daysLeft: null }
    }
    return { examDate: raw, daysLeft: daysBetween(todayKST(), raw) }
  } catch {
    return { examDate: null, daysLeft: null }
  }
}

// ---------------- Custom calendar picker ----------------
// Month grid with KR weekday labels, today highlighted, past dates
// disabled, keyboard-free. Small enough that an extra dependency
// (react-datepicker is ~40kB + CSS override work) wasn't worth it.

const WEEKDAYS_KR = ['일', '월', '화', '수', '목', '금', '토']

function formatYmd(y: number, m1: number, d: number): string {
  return `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface CalendarPickerProps {
  /** Currently selected date as 'YYYY-MM-DD', or null. */
  value: string | null
  onChange: (ymd: string) => void
  /** Minimum selectable date, inclusive. Defaults to KST today. */
  minDate?: string
}

function CalendarPicker({ value, onChange, minDate }: CalendarPickerProps) {
  const todayYmd = todayKST()
  const floor = minDate ?? todayYmd

  // Initial view = selected month if set, otherwise current KST month.
  const [viewYear, setViewYear] = useState<number>(() => {
    const seed = value ?? todayYmd
    return Number(seed.split('-')[0])
  })
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const seed = value ?? todayYmd
    return Number(seed.split('-')[1]) // 1-12
  })

  const cells = useMemo(() => {
    // Build a 6-row grid (42 cells) covering the visible month with
    // leading/trailing days from adjacent months.
    const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth - 1, 1))
    const firstWeekday = firstOfMonth.getUTCDay() // 0 = Sun
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate()
    const prevMonthDays = new Date(Date.UTC(viewYear, viewMonth - 1, 0)).getUTCDate()

    const out: {
      ymd: string
      day: number
      inMonth: boolean
      disabled: boolean
      isToday: boolean
      isSelected: boolean
    }[] = []

    for (let i = 0; i < 42; i++) {
      let y = viewYear
      let m = viewMonth
      let d: number
      let inMonth = true
      if (i < firstWeekday) {
        // prev month
        d = prevMonthDays - (firstWeekday - 1 - i)
        m = viewMonth - 1
        if (m < 1) {
          m = 12
          y--
        }
        inMonth = false
      } else if (i >= firstWeekday + daysInMonth) {
        // next month
        d = i - firstWeekday - daysInMonth + 1
        m = viewMonth + 1
        if (m > 12) {
          m = 1
          y++
        }
        inMonth = false
      } else {
        d = i - firstWeekday + 1
      }
      const ymd = formatYmd(y, m, d)
      out.push({
        ymd,
        day: d,
        inMonth,
        disabled: daysBetween(floor, ymd) < 0,
        isToday: ymd === todayYmd,
        isSelected: value !== null && ymd === value,
      })
    }
    return out
  }, [viewYear, viewMonth, value, floor, todayYmd])

  function gotoPrev() {
    let y = viewYear
    let m = viewMonth - 1
    if (m < 1) {
      m = 12
      y--
    }
    setViewYear(y)
    setViewMonth(m)
  }
  function gotoNext() {
    let y = viewYear
    let m = viewMonth + 1
    if (m > 12) {
      m = 1
      y++
    }
    setViewYear(y)
    setViewMonth(m)
  }

  // Disable back arrow if moving to prev month would cross the floor.
  const floorYear = Number(floor.split('-')[0])
  const floorMonth = Number(floor.split('-')[1])
  const backDisabled =
    viewYear < floorYear ||
    (viewYear === floorYear && viewMonth <= floorMonth)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          onClick={gotoPrev}
          disabled={backDisabled}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4f6ef7] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          type="button"
          aria-label="이전 달"
        >
          ◀
        </button>
        <div className="text-sm font-semibold text-[#0f172a]">
          {viewYear}년 {viewMonth}월
        </div>
        <button
          onClick={gotoNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4f6ef7] hover:bg-gray-50"
          type="button"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS_KR.map((w, i) => (
          <div
            key={w}
            className="text-[10px] font-medium py-1"
            style={{
              color: i === 0 ? '#ef4444' : i === 6 ? '#4f6ef7' : '#64748b',
            }}
          >
            {w}
          </div>
        ))}
        {cells.map((c, i) => {
          const dow = i % 7
          let bg = 'transparent'
          let color = c.inMonth ? '#0f172a' : '#cbd5e1'
          if (dow === 0 && c.inMonth && !c.disabled) color = '#ef4444'
          if (dow === 6 && c.inMonth && !c.disabled) color = '#4f6ef7'
          if (c.disabled) color = '#e2e8f0'
          if (c.isSelected) {
            bg = '#4f6ef7'
            color = 'white'
          } else if (c.isToday) {
            bg = '#eef2ff'
            color = '#4f6ef7'
          }
          return (
            <button
              key={i}
              onClick={() => !c.disabled && onChange(c.ymd)}
              disabled={c.disabled}
              type="button"
              className="h-9 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              style={{ background: bg, color }}
            >
              {c.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Main D-day card ----------------

interface Props {
  coveredModules: number
  totalModules: number
  /** Parent hook to refresh sibling widgets when the exam date changes. */
  onChange?: () => void
}

export default function ExamCountdown({
  coveredModules,
  totalModules,
  onChange,
}: Props) {
  // `tick` exists purely to force re-renders across KST midnight so the
  // D-day value updates without the user reloading. We read fresh info
  // on every render rather than caching in state.
  const [, setTick] = useState(0)
  const info = readExamInfo()

  const [modalOpen, setModalOpen] = useState(false)
  const [pickerValue, setPickerValue] = useState<string | null>(info.examDate)

  // Auto-open on first visit ever, only when no date is saved. After
  // the first auto-open we set PROMPT_SEEN_KEY so returning visits with
  // still no date set don't nag. Editing is always available through
  // the explicit button.
  useEffect(() => {
    if (info.examDate) return
    const seen = localStorage.getItem(PROMPT_SEEN_KEY)
    if (!seen) {
      setModalOpen(true)
      try {
        localStorage.setItem(PROMPT_SEEN_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    // We only need this check once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Schedule a re-render at the next KST midnight so D-day ticks down
  // automatically without a reload. The timeout re-arms itself after
  // each fire by bumping `tick`, which re-runs this effect.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setTick((t) => t + 1)
    }, msUntilNextKstMidnight())
    return () => window.clearTimeout(id)
  })

  function openEditor() {
    setPickerValue(info.examDate)
    setModalOpen(true)
  }

  function save(newVal: string | null) {
    if (!newVal) return
    try {
      localStorage.setItem(STORAGE_KEY, newVal)
    } catch {
      /* ignore */
    }
    setModalOpen(false)
    setTick((t) => t + 1) // force read of fresh info
    onChange?.()
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setPickerValue(null)
    setModalOpen(false)
    setTick((t) => t + 1)
    onChange?.()
  }

  const coveragePct =
    totalModules > 0 ? Math.round((coveredModules / totalModules) * 100) : 0

  const remaining = Math.max(0, totalModules - coveredModules)
  let paceLine = '데이터가 더 쌓이면 완료 예상 시점을 알려드릴게요.'
  if (coveredModules >= 3) {
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
            onClick={openEditor}
            className="text-[11px] px-2 py-1 rounded-lg text-[#4f6ef7] hover:bg-[#eef2ff]"
            style={{ border: '1px solid #c7d2fe' }}
          >
            시험일 설정
          </button>
        </div>

        {info.examDate && info.daysLeft !== null ? (
          <div className="flex items-baseline gap-3 flex-wrap">
            <span
              className="text-4xl font-bold leading-none"
              style={{
                color:
                  info.daysLeft < 0
                    ? '#64748b'
                    : info.daysLeft < 30
                    ? '#ef4444'
                    : info.daysLeft < 60
                    ? '#f59e0b'
                    : '#4f6ef7',
              }}
            >
              {info.daysLeft > 0
                ? `D-${info.daysLeft}`
                : info.daysLeft === 0
                ? 'D-Day'
                : `D+${Math.abs(info.daysLeft)}`}
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-muted">시험일</span>
              <span className="text-sm font-semibold text-[#0f172a]">
                {info.examDate}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            시험일을 설정하면 카운트다운과 페이스 가이드가 표시됩니다.
          </p>
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
                FAR 시험 예정일을 달력에서 선택하세요. 오늘 이후만 선택 가능하며, 기기에만 저장되고 서버로 전송되지 않습니다.
              </p>
            </div>

            <CalendarPicker
              value={pickerValue}
              onChange={setPickerValue}
            />

            {pickerValue && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted">선택한 날짜</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0f172a]">{pickerValue}</span>
                  <span
                    className="px-1.5 py-0.5 rounded font-bold"
                    style={{ background: '#eef2ff', color: '#4f6ef7' }}
                  >
                    D-{daysBetween(todayKST(), pickerValue)}
                  </span>
                </div>
              </div>
            )}

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
                취소
              </button>
              <button
                onClick={() => save(pickerValue)}
                disabled={!pickerValue}
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
