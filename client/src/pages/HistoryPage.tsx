import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../store/studyStore'
import useClaudeStore from '../store/claudeStore'
import { allTopics } from '../data/far-topics'
import QuizCalculator from '../components/quiz/QuizCalculator'
import MoneyRainOverlay from '../components/MoneyRainOverlay'
const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

import { addXp } from '../lib/db'
import {
  fetchDueExtractions,
  updateConceptReview,
  getConceptDueCount,
  getTodayReviewStats,
  upsertDailyReviewLog,
  generateOnDemandReviewCards,
  saveFeedback,
  saveWrongAnswer,
  fetchReviewHistory,
  insertReviewLog,
  fetchConfusedCards,
  fetchTodayQueue,
  fetchRelatedExtractions,
  getConfusedCount,
  RecentExtractionItem,
  ReviewHistoryItem,
  ConceptTrigger,
  ExampleQuestion,
  ExplanationStructured,
} from '../lib/db'

const DAILY_GOAL = 10


async function fetchCardHint(
  concepts: string[],
  auto_rules: string[],
  trap_pattern?: string
): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/claude/card-hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concepts, auto_rules, trap_pattern }),
    })
    if (!res.ok) return ''
    const text = await res.text()
    if (!text) return ''
    const data = JSON.parse(text) as { hint?: string }
    return data.hint ?? ''
  } catch {
    return ''
  }
}

type Stage = 'loading' | 'empty' | 'review' | 'done'

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ current, total, mode }: { current: number; total: number; mode?: 'normal' | 'queue' | 'confused' }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  const label = mode === 'queue' ? '오늘의 큐' : mode === 'confused' ? '오답 재출제' : '오늘 복습'
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[#4f6ef7]">{label}</span>
        <span className="text-xs font-bold text-[#0f172a]">{current} / {total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#4f6ef7' }}
        />
      </div>
    </div>
  )
}

// ── Example Question ──────────────────────────────────────────
function StructuredExplanation({ exp }: { exp: ExplanationStructured }) {
  return (
    <div className="flex flex-col gap-2 mt-1">
      <div>
        <p className="text-[10px] font-bold text-[#166534] mb-0.5">💡 핵심 근거</p>
        <p className="text-xs text-[#14532d] leading-relaxed">{exp.core}</p>
      </div>
      {exp.calculation && (
        <div>
          <p className="text-[10px] font-bold text-[#166534] mb-0.5">🔢 계산 과정</p>
          <p className="text-xs text-[#14532d] leading-relaxed whitespace-pre-line">{exp.calculation}</p>
        </div>
      )}
      {Array.isArray(exp.traps) && exp.traps.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-[#166534] mb-0.5">⚠️ 오답 함정</p>
          <div className="flex flex-col gap-0.5">
            {exp.traps.map((t, i) => (
              <p key={i} className="text-xs text-[#14532d] leading-relaxed">{t}</p>
            ))}
          </div>
        </div>
      )}
      {exp.memory && (
        <div
          className="rounded-lg px-2.5 py-1.5"
          style={{ background: '#fefce8', border: '1px solid #fde047' }}
        >
          <p className="text-[10px] font-bold text-[#713f12] mb-0.5">📌 기억할 것</p>
          <p className="text-xs text-[#713f12] leading-relaxed">{exp.memory}</p>
        </div>
      )}
    </div>
  )
}

// ── TTS (Haiku podcast script → Google WaveNet via /api/tts/podcast) ──────
function useTTS() {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setPlaying(false)
  }, [])

  const play = useCallback(async (
    topicId: string | null,
    oneLiner: string | null,
    trapPattern: string | null,
  ) => {
    if (!oneLiner && !trapPattern) return
    stop()
    setPlaying(true)
    try {
      const res = await fetch(`${API_URL}/api/tts/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, oneLiner, trapPattern }),
      })
      if (!res.ok) { setPlaying(false); return }
      const { audioContent } = await res.json() as { audioContent: string }
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`)
      audioRef.current = audio
      audio.onended = () => { audioRef.current = null; setPlaying(false) }
      audio.onerror = () => { audioRef.current = null; setPlaying(false) }
      await audio.play()
    } catch {
      setPlaying(false)
    }
  }, [stop])

  useEffect(() => stop, [stop])
  return { play, stop, playing }
}

// ── Sound effects ─────────────────────────────────────────────
type AudioCtxCtor = typeof AudioContext
function getAudioCtx(): AudioContext | null {
  try {
    const Ctor: AudioCtxCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext
    return Ctor ? new Ctor() : null
  } catch { return null }
}

function playCorrectSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  ;([[880, 0], [1100, 0.13]] as Array<[number, number]>).forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + 0.25)
  })
  setTimeout(() => { try { ctx.close() } catch { /* ignore */ } }, 700)
}

function playWrongSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.value = 110
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
  setTimeout(() => { try { ctx.close() } catch { /* ignore */ } }, 500)
}

function playGoalSound() {
  const ctx = getAudioCtx()
  if (!ctx) return
  ;([[523, 0], [659, 0.19], [784, 0.38]] as Array<[number, number]>).forEach(([freq, delay]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.38)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + 0.42)
  })
  setTimeout(() => { try { ctx.close() } catch { /* ignore */ } }, 1500)
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

const WRONG_MESSAGES = [
  '😢 아쉬워요! 해설 다시 읽어봐요',
  '🔍 천천히 다시 읽어보면 보여요!',
  '💪 틀려야 늘어요. 해설 확인!',
  '😅 한 번 더! 이 개념 곧 마스터해요',
]
const CORRECT_MESSAGES = [
  '🎉 정답! 완벽해요!',
  '⭐ 맞았어요! 이 개념 마스터 중!',
  '🔥 정답! 계속 이 기세로!',
  '✨ 완벽! FAR 합격 가까워지고 있어요',
]
function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function ExampleQuestionBlock({
  eq,
  cardId,
  onAnswer,
}: {
  eq: ExampleQuestion
  cardId: string
  onAnswer?: (isCorrect: boolean, selected: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pulsingLetter, setPulsingLetter] = useState<string | null>(null)
  const [xpVisible, setXpVisible] = useState(false)
  const [xpWrongVisible, setXpWrongVisible] = useState(false)

  if (!eq?.question) return null

  const hasOptions = Array.isArray(eq.options) && eq.options.length > 0
  const correctLetter = eq.answer?.trim()[0]?.toUpperCase() ?? ''
  const letters = OPTION_LETTERS.slice(0, eq.options?.length ?? 0)

  const isStructured = (e: unknown): e is ExplanationStructured =>
    typeof e === 'object' && e !== null && 'core' in e

  function handleSelect(letter: string) {
    if (selected) return
    setSelected(letter)
    const isCorrect = letter === correctLetter
    if (isCorrect) {
      playCorrectSound()
      // pulse glow on correct button
      setPulsingLetter(letter)
      setTimeout(() => setPulsingLetter(null), 600)
      // XP float-up
      setXpVisible(true)
      setTimeout(() => setXpVisible(false), 1000)
      // toast
      setToast(pickRandom(CORRECT_MESSAGES))
      setTimeout(() => setToast(null), 1800)
    } else {
      playWrongSound()
      void saveWrongAnswer(cardId, letter, correctLetter)
      // shake
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      // XP float-down
      setXpWrongVisible(true)
      setTimeout(() => setXpWrongVisible(false), 1000)
      // toast
      setToast(pickRandom(WRONG_MESSAGES))
      setTimeout(() => setToast(null), 2500)
    }
    onAnswer?.(isCorrect, letter)
  }

  const isAnswered = selected !== null

  // No options → old "정답 보기" flow
  if (!hasOptions) {
    return (
      <div className="rounded-xl px-3 py-2.5" style={{ background: '#f8faff', border: '1px solid #c7d2fe' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[#3730a3]">📝 예시 문제</p>
          <button
            onClick={() => setCalcOpen(true)}
            className="shrink-0 text-xs px-2 py-1 rounded-lg hover:bg-[#eef2ff]"
            style={{ border: '1px solid #c7d2fe', color: '#4338ca' }}
            title="계산기"
          >🧮</button>
        </div>
        <QuizCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
        <p className="text-xs text-[#1e1b4b] leading-relaxed mb-3">{String(eq.question)}</p>
        {revealed ? (
          <div className="rounded-lg px-2.5 py-2" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <p className="text-xs font-bold text-[#166534]">정답: {eq.answer ? String(eq.answer) : '(미입력)'} ✅</p>
            {isStructured(eq.explanation)
              ? <StructuredExplanation exp={eq.explanation} />
              : <p className="text-xs text-[#14532d] mt-0.5 leading-relaxed">{String(eq.explanation ?? '')}</p>
            }
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
          >
            정답 보기
          </button>
        )}
      </div>
    )
  }

  // MCQ interactive mode
  return (
    <div
      className={`rounded-xl px-3 py-2.5 relative${shaking ? ' animate-shake' : ''}`}
      style={{ background: '#f8faff', border: '1px solid #c7d2fe' }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="animate-toastIn absolute left-0 right-0 -top-11 flex justify-center pointer-events-none z-10"
        >
          <div
            className="px-3 py-2 rounded-xl text-xs font-semibold shadow-md"
            style={{ background: '#1e293b', color: 'white', maxWidth: '90%' }}
          >
            {toast}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-[#3730a3]">📝 예시 문제</p>
        <button
          onClick={() => setCalcOpen(true)}
          className="shrink-0 text-xs px-2 py-1 rounded-lg hover:bg-[#eef2ff]"
          style={{ border: '1px solid #c7d2fe', color: '#4338ca' }}
          title="계산기"
        >🧮</button>
      </div>
      <QuizCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />
      <p className="text-xs text-[#1e1b4b] leading-relaxed mb-3">{String(eq.question)}</p>

      {/* A/B/C/D option buttons */}
      <div className="flex flex-col gap-1.5 mb-2">
        {letters.map((letter, i) => {
          const opt = eq.options[i]
          const isSelected = selected === letter
          const isCorrect = letter === correctLetter

          let bg = 'white'
          let border = '#e2e8f0'
          let color = '#374151'

          if (isAnswered) {
            if (isCorrect) { bg = '#f0fdf4'; border = '#86efac'; color = '#166534' }
            else if (isSelected) { bg = '#fff5f5'; border = '#fecaca'; color = '#991b1b' }
          } else {
            border = '#c7d2fe'
          }

          return (
            <div key={letter} className="relative">
              {isCorrect && xpVisible && (
                <span
                  className="animate-floatUp absolute -top-1 right-2 text-xs font-bold pointer-events-none z-10"
                  style={{ color: '#16a34a' }}
                >
                  +5 🪙
                </span>
              )}
              {isSelected && !isCorrect && xpWrongVisible && (
                <span
                  className="animate-floatDown absolute -bottom-1 right-2 text-xs font-bold pointer-events-none z-10"
                  style={{ color: '#dc2626' }}
                >
                  -5 💸
                </span>
              )}
              <button
                onClick={() => handleSelect(letter)}
                disabled={isAnswered}
                className={`w-full text-left rounded-xl px-3 py-2 text-xs transition-all disabled:cursor-default${pulsingLetter === letter ? ' animate-correctPulse' : ''}`}
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontWeight: isAnswered && isCorrect ? 600 : 400,
                }}
              >
                <span className="font-bold mr-1.5" style={{ color: isAnswered && isCorrect ? '#166534' : isAnswered && isSelected && !isCorrect ? '#991b1b' : '#4338ca' }}>{letter}.</span>
                {(typeof opt === 'string' ? opt : String(opt)).replace(/^\(?[A-Ea-e][.):\s]\)?\s*/i, '')}
                {isAnswered && isCorrect && <span className="ml-1.5">✅</span>}
                {isAnswered && isSelected && !isCorrect && <span className="ml-1.5">❌</span>}
              </button>
            </div>
          )
        })}
      </div>

      {/* Explanation — auto-shown after answer */}
      {isAnswered && (
        <div
          className="rounded-lg px-2.5 py-2 mt-1"
          style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
        >
          <p className="text-xs font-bold text-[#166534] mb-1">
            {selected === correctLetter ? '✅ 정답!' : `❌ 오답 — 정답: ${correctLetter}`}
          </p>
          {isStructured(eq.explanation)
            ? <StructuredExplanation exp={eq.explanation} />
            : <p className="text-xs text-[#14532d] leading-relaxed">{String(eq.explanation ?? '')}</p>
          }
        </div>
      )}
    </div>
  )
}

// ── Flashcard body ────────────────────────────────────────────
function FlashCard({
  card,
  visible,
  onMcqAnswer,
}: {
  card: RecentExtractionItem
  visible: boolean
  onMcqAnswer?: (isCorrect: boolean, selected: string) => void
}) {
  const triggers = (card.triggers ?? []) as ConceptTrigger[]
  const [hint, setHint] = useState<string>('')
  const [hintLoading, setHintLoading] = useState(false)
  const fetchedId = useRef<string | null>(null)
  const navigate = useNavigate()
  const flashUserId = useStudyStore((s) => s.userId)
  const [relatedCount, setRelatedCount] = useState(0)
  const relatedFetchedRef = useRef<string | null>(null)
  const { play, stop, playing } = useTTS()

  // Stop TTS on card change or unmount
  useEffect(() => { stop() }, [card.id, stop])

  useEffect(() => {
    if (!flashUserId || !card.topicId || relatedFetchedRef.current === card.id) return
    relatedFetchedRef.current = card.id
    fetchRelatedExtractions(flashUserId, card.topicId, card.id, 20)
      .then((items) => setRelatedCount(items.length))
      .catch(() => {})
  }, [card.id, card.topicId, flashUserId])

  useEffect(() => {
    if (fetchedId.current === card.id) return
    fetchedId.current = card.id
    const auto_rules = triggers.map((t) => t.auto_rule).filter(Boolean)
    if (!auto_rules.length && !card.concepts.length) return
    setHintLoading(true)
    fetchCardHint(card.concepts, auto_rules, card.trapPattern ?? undefined)
      .then((h) => setHint(h))
      .catch(() => {})
      .finally(() => setHintLoading(false))
  }, [card.id])

  return (
    <div
      className="flex flex-col gap-4 px-4 py-5 rounded-2xl mx-4"
      style={{
        border: '1.5px solid #e2e8f0',
        background: 'white',
        boxShadow: '0 4px 24px 0 rgba(79,110,247,0.07)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {/* Module badge + status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {card.topicId && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#eef2ff', color: '#4338ca' }}
          >
            {card.topicId}
          </span>
        )}
        {card.isFixed && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}
          >
            ✅ 수정됨
          </span>
        )}
        {!card.isFixed && card.feedback && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#fefce8', color: '#713f12', border: '1px solid #fde047' }}
          >
            📝 피드백 있음
          </span>
        )}
        {card.topicTags.slice(0, 2).map((tag, i) => (
          <span
            key={i}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: '#f1f5f9', color: '#64748b' }}
          >
            {tag}
          </span>
        ))}
        <button
          onClick={() => playing
            ? stop()
            : void play(card.topicId, card.oneLiner, card.trapPattern)
          }
          className="ml-auto text-base leading-none px-1 py-0.5 rounded-lg hover:bg-[#f1f5f9]"
          title={playing ? '정지' : '읽기'}
        >
          {playing ? '⏹' : '🔊'}
        </button>
      </div>

      {/* Example question — shown first so you see the challenge before the concepts */}
      {card.exampleQuestion && (
        <ExampleQuestionBlock
          eq={card.exampleQuestion}
          cardId={card.id}
          onAnswer={onMcqAnswer}
        />
      )}

      {/* Concepts */}
      {card.concepts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
            핵심 개념
          </p>
          <div className="flex flex-wrap gap-1.5">
            {card.concepts.map((c, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#eef2ff', color: '#3730a3' }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trigger keywords */}
      {triggers.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
            ⚡ 트리거 키워드
          </p>
          <div className="flex flex-wrap gap-1.5">
            {triggers.map((t, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}
              >
                {t.keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trap pattern */}
      {card.trapPattern && (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: '#fff5f5', border: '1px solid #fecaca' }}
        >
          <p className="text-[10px] font-semibold text-[#991b1b] mb-1">⚠️ 함정 패턴</p>
          <p className="text-xs text-[#7f1d1d] leading-relaxed">{card.trapPattern}</p>
        </div>
      )}

      {/* Formula / numeric example hint */}
      {(hintLoading || hint) && (
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
        >
          <p className="text-[10px] font-semibold text-[#166534] mb-1">💡 핵심 공식 / 예시</p>
          {hintLoading ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-[#166534] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#166534]">생성 중…</span>
            </div>
          ) : (
            <p className="text-xs text-[#14532d] leading-relaxed whitespace-pre-line">{hint}</p>
          )}
        </div>
      )}

      {/* Review count */}
      {card.reviewCount > 0 && (
        <p className="text-[10px] text-[#94a3b8] mt-auto">
          복습 {card.reviewCount}회 · {card.reviewInterval}일 간격
        </p>
      )}

      {/* Related notes link */}
      {relatedCount > 0 && card.topicId && (
        <button
          onClick={() => {
            const q = card.topicTags[0] ?? allTopics.find(t => t.id === card.topicId)?.label ?? card.topicId!
            navigate(`/concept-notes?q=${encodeURIComponent(q)}`)
          }}
          className="text-[10px] text-[#4f6ef7] self-start hover:underline"
        >
          📚 같은 토픽 분석 {relatedCount}개 보기 →
        </button>
      )}
    </div>
  )
}

// ── Explanation text extractor ────────────────────────────────
// explanation can be ExplanationStructured | string | unknown object.
// For the feedback panel we only need one readable string.
function extractExplanationText(
  explanation: unknown,
  answer: string,
): string {
  if (typeof explanation === 'string') return explanation
  if (typeof explanation !== 'object' || explanation === null) return String(explanation)

  const exp = explanation as Record<string, unknown>

  // ExplanationStructured: { core, calculation, traps, memory }
  if (typeof exp.core === 'string') return exp.core

  // Key matching the correct answer letter (e.g. answer = "C")
  const key = answer?.trim()
  if (key && typeof exp[key] === 'string') return exp[key] as string

  // Key 'correct'
  if (typeof exp.correct === 'string') return exp.correct

  return JSON.stringify(explanation)
}

// ── Feedback panel ────────────────────────────────────────────
type ErrorType = 'explanation' | 'answer' | 'option'

type AiFixResult =
  | { valid: true; correct_answer: string; explanation: string; options?: string[] }
  | { valid: false; reason: string }

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  explanation: '해설 오류',
  answer: '정답 오류',
  option: '선지 오류',
}

interface FeedbackPanelProps {
  card: RecentExtractionItem
  feedbackText: string
  setFeedbackText: (v: string) => void
  errorType: ErrorType | null
  setErrorType: (v: ErrorType | null) => void
  aiFixLoading: boolean
  aiFixResult: AiFixResult | null
  savingFix: boolean
  fixError: string | null
  onSaveFeedback: () => void
  onAiFix: () => void
  onConfirmFix: () => void
  onCancelFix: () => void
  onClose: () => void
}

function FeedbackPanel({
  card, feedbackText, setFeedbackText,
  errorType, setErrorType,
  aiFixLoading, aiFixResult, savingFix, fixError,
  onSaveFeedback, onAiFix, onConfirmFix, onCancelFix, onClose,
}: FeedbackPanelProps) {
  const eq = card.exampleQuestion
  const expStr = eq ? extractExplanationText(eq.explanation, eq.answer) : ''

  return (
    <div
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ border: '1.5px solid #e2e8f0', background: 'white' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: '#f8faff', borderBottom: '1px solid #e2e8f0' }}
      >
        <span className="text-xs font-semibold text-[#0f172a]">✏️ 문제 수정</span>
        <button
          onClick={onClose}
          className="text-[#94a3b8] hover:text-[#0f172a] text-lg leading-none px-1"
        >
          ×
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Current answer / explanation */}
        {eq && (
          <div
            className="text-xs flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
            style={{ background: '#f8faff' }}
          >
            <p>
              <span className="font-semibold text-[#3730a3]">현재 정답: </span>
              <span className="text-[#0f172a]">{eq.answer || '(없음)'}</span>
            </p>
            <p>
              <span className="font-semibold text-[#3730a3]">현재 해설: </span>
              <span className="text-[#64748b] whitespace-pre-wrap">{expStr}</span>
            </p>
          </div>
        )}

        {/* AI 결과 뷰 */}
        {aiFixResult ? (
          aiFixResult.valid ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#0f172a]">수정 전 → 수정 후</p>
                <div
                  className="rounded-xl px-3 py-2.5 flex flex-col gap-2 text-xs"
                  style={{ background: '#f8faff', border: '1px solid #c7d2fe' }}
                >
                  <p>
                    <span className="font-semibold text-[#3730a3]">정답: </span>
                    <span className="line-through text-[#94a3b8]">{eq?.answer || '(없음)'}</span>
                    <span className="text-[#94a3b8]"> → </span>
                    <span className="font-bold text-[#166534]">{aiFixResult.correct_answer}</span>
                  </p>
                  {aiFixResult.options && (
                    <div>
                      <p className="font-semibold text-[#3730a3] mb-1">선지:</p>
                      {eq?.options?.map((opt, i) => (
                        <p key={i} className="line-through text-[#94a3b8] leading-relaxed">{opt}</p>
                      ))}
                      {aiFixResult.options.map((opt, i) => (
                        <p key={i} className="text-[#166534] leading-relaxed">{opt}</p>
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#3730a3] mb-1">해설:</p>
                    <p className="line-through text-[#94a3b8] leading-relaxed">{expStr}</p>
                    <p className="text-[#166534] mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {aiFixResult.explanation}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCancelFix}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  ✖ 취소
                </button>
                <button
                  onClick={onConfirmFix}
                  disabled={savingFix}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}
                >
                  {savingFix ? '저장 중…' : '✅ 확인 저장'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className="rounded-xl px-3 py-3 flex flex-col gap-2"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
              >
                <p className="text-xs font-bold text-[#92400e]">⚠️ 기존 정답이 맞습니다</p>
                <p className="text-xs text-[#78350f] leading-relaxed whitespace-pre-wrap">
                  {aiFixResult.reason}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onCancelFix}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  확인
                </button>
                <button
                  onClick={onSaveFeedback}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: '#fff7ed', color: '#92400e', border: '1px solid #fed7aa' }}
                >
                  그래도 피드백 반영하기
                </button>
              </div>
            </>
          )
        ) : (
          <>
            {/* Error type selector */}
            <div className="flex gap-1.5">
              {(Object.keys(ERROR_TYPE_LABELS) as ErrorType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setErrorType(errorType === type ? null : type)}
                  className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                  style={errorType === type
                    ? { background: '#eef2ff', color: '#3730a3', border: '1.5px solid #818cf8' }
                    : { background: '#f8faff', color: '#94a3b8', border: '1.5px solid #e2e8f0' }
                  }
                >
                  {ERROR_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={'틀린 부분을 입력하세요.\n예) 정답이 C인데 B로 나와있어요'}
              rows={3}
              className="w-full text-xs resize-none rounded-xl px-3 py-2.5"
              style={{ border: '1.5px solid #e2e8f0', outline: 'none', lineHeight: 1.6 }}
            />

            {fixError && (
              <p className="text-xs text-[#ef4444]">{fixError}</p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={onSaveFeedback}
                disabled={!feedbackText.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: '#f8faff', color: '#4338ca', border: '1px solid #c7d2fe' }}
              >
                💬 피드백만 남기기
              </button>
              <button
                onClick={onAiFix}
                disabled={!feedbackText.trim() || aiFixLoading || !eq || !errorType}
                className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #a5b4fc' }}
              >
                {aiFixLoading ? (
                  <span className="flex items-center justify-center gap-1">
                    <span className="w-3 h-3 border-2 border-[#3730a3] border-t-transparent rounded-full animate-spin inline-block" />
                    AI 수정 중…
                  </span>
                ) : (
                  '🔄 AI로 즉시 수정'
                )}
              </button>
            </div>
            {!errorType && feedbackText.trim() && (
              <p className="text-[10px] text-[#94a3b8] text-center">오류 유형을 선택해야 AI 수정이 활성화됩니다</p>
            )}
            {aiFixLoading && (
              <p className="text-[10px] text-[#94a3b8] text-center">
                최대 15초 소요될 수 있어요
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Review History Tab ────────────────────────────────────────
type HistoryFilter = 'today' | 'week' | 'all'

function applyHistToggles(base: ReviewHistoryItem[], shuffle: boolean, confusedOnly: boolean): ReviewHistoryItem[] {
  let result = confusedOnly ? base.filter((c) => c.reviewResult === 'confused') : base
  if (shuffle) result = [...result].sort(() => Math.random() - 0.5)
  return result
}

function ReviewHistoryTab({ userId }: { userId: string }) {
  const [filter, setFilter] = useState<HistoryFilter>('today')
  const [originalItems, setOriginalItems] = useState<ReviewHistoryItem[]>([])
  const [items, setItems] = useState<ReviewHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cardIdx, setCardIdx] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cardVisible, setCardVisible] = useState(true)
  const touchStartX = useRef<number | null>(null)
  const [histShuffleOn, setHistShuffleOn] = useState(false)
  const [histConfusedFilterOn, setHistConfusedFilterOn] = useState(false)

  useEffect(() => {
    setLoading(true)
    setCardIdx(0)
    setExpandedId(null)
    fetchReviewHistory(userId, filter)
      .then((data) => {
        setOriginalItems(data)
        setItems(applyHistToggles(data, histShuffleOn, histConfusedFilterOn))
      })
      .finally(() => setLoading(false))
  }, [userId, filter])

  function handleHistToggleShuffle() {
    const next = !histShuffleOn
    setHistShuffleOn(next)
    setItems(applyHistToggles(originalItems, next, histConfusedFilterOn))
    setCardIdx(0)
  }

  function handleHistToggleConfused() {
    const next = !histConfusedFilterOn
    setHistConfusedFilterOn(next)
    setItems(applyHistToggles(originalItems, histShuffleOn, next))
    setCardIdx(0)
  }

  const goTo = (next: number) => {
    if (next < 0 || next >= items.length) return
    setCardVisible(false)
    setExpandedId(null)
    setTimeout(() => { setCardIdx(next); setCardVisible(true) }, 150)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(cardIdx + 1)
      else goTo(cardIdx - 1)
    }
    touchStartX.current = null
  }

  const FILTER_LABELS: Record<HistoryFilter, string> = { today: '오늘', week: '이번 주', all: '전체' }
  const current = items[cardIdx]

  const navigate = useNavigate()
  const [relatedCount, setRelatedCount] = useState(0)
  const relatedFetchedRef = useRef<string | null>(null)
  const { play: ttsPlay, stop: ttsStop, playing: ttsPlaying } = useTTS()

  // Stop TTS on card change or page navigation
  useEffect(() => { ttsStop() }, [current?.id, ttsStop])

  useEffect(() => {
    if (!current?.id || !current?.topicId || relatedFetchedRef.current === current.id) return
    relatedFetchedRef.current = current.id
    fetchRelatedExtractions(userId, current.topicId, current.id, 20)
      .then((items) => setRelatedCount(items.length))
      .catch(() => {})
  }, [current?.id, current?.topicId, userId])

  const setReviewCardContext = useClaudeStore((s) => s.setReviewCardContext)
  useEffect(() => {
    if (!current) { setReviewCardContext(null); return }
    const topicLabel = current.topicId
      ? (allTopics.find((t) => t.id === current.topicId)?.label ?? null)
      : null
    setReviewCardContext({
      topicId: current.topicId,
      topicLabel,
      topicTags: current.topicTags,
      concepts: current.concepts,
      trapPattern: current.trapPattern,
      questionText: current.exampleQuestion?.question ?? null,
      correctAnswer: current.exampleQuestion?.answer ?? null,
      extractionId: current.id,
      exampleQuestion: current.exampleQuestion ?? null,
    })
    return () => setReviewCardContext(null)
  }, [current, setReviewCardContext])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* Date filter */}
      <div className="flex gap-1.5">
        {(Object.keys(FILTER_LABELS) as HistoryFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={filter === f
              ? { background: '#eef2ff', color: '#3730a3', border: '1.5px solid #818cf8' }
              : { background: '#f8faff', color: '#94a3b8', border: '1.5px solid #e2e8f0' }
            }
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Shuffle + confused filter toggles */}
      {originalItems.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handleHistToggleShuffle}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            style={{
              background: histShuffleOn ? '#4f6ef7' : '#f1f5f9',
              color: histShuffleOn ? 'white' : '#64748b',
              border: histShuffleOn ? '1.5px solid #4f6ef7' : '1.5px solid #e2e8f0',
            }}
          >
            🔀 {histShuffleOn ? '섞는 중' : '순서 섞기'}
          </button>
          <button
            onClick={handleHistToggleConfused}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            style={{
              background: histConfusedFilterOn ? '#f59e0b' : '#f1f5f9',
              color: histConfusedFilterOn ? 'white' : '#64748b',
              border: histConfusedFilterOn ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
            }}
          >
            {histConfusedFilterOn ? `🔄 필터 중 ${items.length}개` : '헷갈린 것만'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center gap-2">
          <p className="text-4xl">{histConfusedFilterOn ? '🎉' : '📭'}</p>
          <p className="text-sm font-semibold text-[#0f172a]">
            {histConfusedFilterOn ? '헷갈린 카드가 없어요!' : '복습 기록이 없어요'}
          </p>
          <p className="text-xs text-[#64748b]">
            {histConfusedFilterOn ? '이 기간엔 모두 알았어요 👍' : '복습을 완료하면 여기에 기록이 쌓여요'}
          </p>
        </div>
      ) : (
        <>
          {/* Navigation */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => goTo(cardIdx - 1)}
              disabled={cardIdx === 0}
              className="text-xs px-2 py-1.5 rounded-lg font-semibold disabled:opacity-30 transition-opacity"
              style={{ color: '#4f6ef7' }}
            >
              ← 이전
            </button>
            <span className="text-xs font-bold text-[#64748b]">{cardIdx + 1} / {items.length}</span>
            <button
              onClick={() => goTo(cardIdx + 1)}
              disabled={cardIdx === items.length - 1}
              className="text-xs px-2 py-1.5 rounded-lg font-semibold disabled:opacity-30 transition-opacity"
              style={{ color: '#4f6ef7' }}
            >
              다음 →
            </button>
          </div>

          {/* Card */}
          {current && (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="rounded-2xl overflow-hidden"
              style={{
                border: `1.5px solid ${current.reviewResult === 'known' ? '#86efac' : '#fecaca'}`,
                background: 'white',
                boxShadow: '0 4px 24px 0 rgba(79,110,247,0.07)',
                transition: 'opacity 0.15s ease',
                opacity: cardVisible ? 1 : 0,
              }}
            >
              {/* Result banner */}
              <div
                className="px-4 py-2.5 flex items-center justify-between"
                style={{ background: current.reviewResult === 'known' ? '#f0fdf4' : '#fff5f5' }}
              >
                <span className="text-xs font-bold" style={{ color: current.reviewResult === 'known' ? '#166534' : '#991b1b' }}>
                  {current.reviewResult === 'known' ? '✅ 알았다' : '🔄 헷갈려'}
                </span>
                <span className="text-[10px] text-[#94a3b8]">
                  {new Date(current.lastReviewedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-3">
                {/* Topic badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  {current.topicId && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#eef2ff', color: '#4338ca' }}>
                      {current.topicId}
                    </span>
                  )}
                  {current.topicTags.slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Example question — shown first; concepts below */}
                {current.exampleQuestion && (
                  <div className="flex flex-col gap-2">
                    {/* 1. 문제 텍스트 — 항상 표시 */}
                    <p className="text-xs text-[#1e1b4b] leading-relaxed">{current.exampleQuestion.question}</p>

                    {/* 2. 선지 A/B/C/D — 항상 표시. 해설 펼친 후에만 정답 강조 */}
                    {Array.isArray(current.exampleQuestion.options) && current.exampleQuestion.options.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        {current.exampleQuestion.options.slice(0, 4).map((opt, i) => {
                          const letter = OPTION_LETTERS[i]
                          const revealed = expandedId === current.id
                          const correctLetter = current.exampleQuestion!.answer?.trim()[0]?.toUpperCase() ?? ''
                          const isCorrect = revealed && letter === correctLetter
                          return (
                            <p
                              key={i}
                              className="text-xs leading-relaxed"
                              style={{ color: isCorrect ? '#166534' : '#374151', fontWeight: isCorrect ? 600 : 400 }}
                            >
                              <span className="font-bold mr-1" style={{ color: isCorrect ? '#166534' : '#4338ca' }}>
                                {letter}.
                              </span>
                              {(typeof opt === 'string' ? opt : String(opt)).replace(/^\(?[A-Ea-e][.):\s]\)?\s*/i, '')}
                              {isCorrect && <span className="ml-1">✅</span>}
                            </p>
                          )
                        })}
                      </div>
                    )}

                    {/* 3. 해설 보기 버튼 + TTS */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === current.id ? null : current.id)}
                        className="text-xs font-semibold"
                        style={{ color: '#4338ca' }}
                      >
                        {expandedId === current.id ? '해설 접기 ▲' : '해설 보기 ▼'}
                      </button>
                      <button
                        onClick={() => ttsPlaying
                          ? ttsStop()
                          : void ttsPlay(current.topicId, current.oneLiner, current.trapPattern)
                        }
                        className="text-base leading-none px-1 py-0.5 rounded-lg hover:bg-[#f1f5f9]"
                        title={ttsPlaying ? '정지' : '읽기'}
                      >
                        {ttsPlaying ? '⏹' : '🔊'}
                      </button>
                    </div>

                    {/* 4. 펼쳤을 때만: 정답 + 해설 + 트리거 + 함정 */}
                    {expandedId === current.id && (
                      <div
                        className="flex flex-col gap-2 rounded-xl px-3 py-2.5 text-xs"
                        style={{ background: '#f8faff', border: '1px solid #c7d2fe' }}
                      >
                        <p className="font-bold" style={{ color: '#166534' }}>정답: {current.exampleQuestion.answer}</p>

                        {current.triggers.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">⚡ 트리거</p>
                            <div className="flex flex-wrap gap-1">
                              {current.triggers.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
                                  {t.keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {current.trapPattern && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#991b1b] mb-0.5">⚠️ 함정</p>
                            <p className="text-[#7f1d1d] leading-relaxed">{current.trapPattern}</p>
                          </div>
                        )}

                        {current.exampleQuestion.explanation && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#166534] mb-0.5">💡 해설</p>
                            <p className="text-[#14532d] leading-relaxed whitespace-pre-wrap">
                              {typeof current.exampleQuestion.explanation === 'string'
                                ? current.exampleQuestion.explanation
                                : (current.exampleQuestion.explanation as ExplanationStructured).core
                                  ?? JSON.stringify(current.exampleQuestion.explanation)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Concepts — below question */}
                {current.concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {current.concepts.slice(0, 5).map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#f8faff', color: '#3730a3', border: '1px solid #e0e7ff' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Related notes link */}
                {relatedCount > 0 && current.topicId && (
                  <button
                    onClick={() => {
                      const q = current.topicTags[0] ?? allTopics.find(t => t.id === current.topicId)?.label ?? current.topicId!
                      navigate(`/concept-notes?q=${encodeURIComponent(q)}`)
                    }}
                    className="text-[10px] text-[#4f6ef7] self-start hover:underline mt-1"
                  >
                    📚 같은 토픽 분석 {relatedCount}개 보기 →
                  </button>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-[10px] text-[#94a3b8]">좌우 스와이프 또는 버튼으로 이동</p>
        </>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyView({
  onGenerate,
  generating,
  noData,
}: {
  onGenerate: () => void
  generating: boolean
  noData: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 px-6 text-center">
      <div className="text-5xl">✅</div>
      <p className="text-lg font-bold text-[#0f172a]">오늘 복습할 카드 없음!</p>
      <p className="text-sm text-[#64748b] leading-relaxed">
        문제를 더 분석하면 다음날 자동으로 복습 카드가 생성돼요.
      </p>
      {noData ? (
        <p className="text-sm text-[#f59e0b] font-medium mt-1">
          분석한 문제가 없어요. 먼저 문제를 풀어보세요!
        </p>
      ) : (
        <button
          onClick={onGenerate}
          disabled={generating}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: '#4f6ef7' }}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              생성 중…
            </>
          ) : (
            '지금 바로 생성하기'
          )}
        </button>
      )}
    </div>
  )
}

// ── Done state ────────────────────────────────────────────────
function DoneView({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-6 text-center">
      <div className="text-6xl">🤑</div>
      <p className="text-xl font-bold text-[#0f172a]">오늘 복습 완료!</p>
      <p className="text-sm text-[#64748b]">총 {count}개 카드를 복습했어요.</p>
      <div
        className="mt-2 px-5 py-2 rounded-full text-sm font-semibold"
        style={{ background: '#eef2ff', color: '#4338ca' }}
      >
        내일 다시 확인해요 👋
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function HistoryPage() {
  const userId = useStudyStore((s) => s.userId)
  const setConceptDueCount = useStudyStore((s) => s.setConceptDueCount)
  const setTodayReviewCount = useStudyStore((s) => s.setTodayReviewCount)
  const incrementTodayReviewCount = useStudyStore((s) => s.incrementTodayReviewCount)
  const addXpLocal = useStudyStore((s) => s.addXpLocal)
  const setTotalXp = useStudyStore((s) => s.setTotalXp)
  const todayCount = useStudyStore((s) => s.todayReviewCount)
  const dailyGoal = useStudyStore((s) => s.dailyGoal)
  const setReviewCardContext = useClaudeStore((s) => s.setReviewCardContext)

  const [cards, setCards] = useState<RecentExtractionItem[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('loading')
  const [knewCount, setKnewCount] = useState(0)
  const [confusedCount, setConfusedCount] = useState(0)
  const [fixCount, setFixCount] = useState(0)
  const [moneyRain, setMoneyRain] = useState({ open: false, count: 0 })
  const [nonMcqXp, setNonMcqXp] = useState<{ visible: boolean; correct: boolean } | null>(null)
  const [visible, setVisible] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [noOnDemandData, setNoOnDemandData] = useState(false)
  // MCQ answer state — reset on card change
  const [mcqAnswerState, setMcqAnswerState] = useState<{ isCorrect: boolean; selected: string } | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'review' | 'history'>('review')

  // Review mode (normal = SRS due cards, confused = retry confused, queue = today's top-5 confused)
  const [reviewMode, setReviewMode] = useState<'normal' | 'confused' | 'queue'>('normal')
  const [totalConfusedCount, setTotalConfusedCount] = useState(0)
  const [queueDone, setQueueDone] = useState(false)
  const [modeLoading, setModeLoading] = useState(false)
  const [originalCards, setOriginalCards] = useState<RecentExtractionItem[]>([])
  const [shuffleOn, setShuffleOn] = useState(false)
  const [confusedFilterOn, setConfusedFilterOn] = useState(false)

  // Visual effects state
  const [showGoalOverlay, setShowGoalOverlay] = useState(false)
  const [cardBouncing, setCardBouncing] = useState(false)
  const [showGreenFlash, setShowGreenFlash] = useState(false)
  const [showRedFlash, setShowRedFlash] = useState(false)
  const overlayShownRef = useRef(false)
  const goalFanfarePlayedRef = useRef(false)
  const prevTodayCountRef = useRef(todayCount)

  // Feedback panel state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [aiFixLoading, setAiFixLoading] = useState(false)
  const [aiFixResult, setAiFixResult] = useState<AiFixResult | null>(null)
  const [savingFix, setSavingFix] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const modeParam = new URLSearchParams(window.location.search).get('mode') as 'queue' | 'confused' | null

    Promise.all([
      fetchDueExtractions(userId),
      getTodayReviewStats(userId),
      getConfusedCount(userId),
    ]).then(async ([items, log, confusedCnt]) => {
      setKnewCount(log.knewCount)
      setConfusedCount(log.confusedCount)
      setTodayReviewCount(log.knewCount + log.confusedCount)
      setTotalConfusedCount(confusedCnt)

      if (modeParam === 'queue' && confusedCnt > 0) {
        const qCards = await fetchTodayQueue(userId, 5)
        if (qCards.length > 0) {
          setOriginalCards(qCards)
          setCards(qCards)
          setReviewMode('queue')
          setStage('review')
          return
        }
      } else if (modeParam === 'confused' && confusedCnt > 0) {
        const cCards = await fetchConfusedCards(userId)
        if (cCards.length > 0) {
          setOriginalCards(cCards)
          setCards(cCards)
          setReviewMode('confused')
          setStage('review')
          return
        }
      }

      setOriginalCards(items)
      setCards(items)
      setStage(items.length === 0 ? 'empty' : 'review')
    }).catch(() => setStage('empty'))
  }, [userId])

  // Must be before any early returns — Rules of Hooks
  // Only set context when on the review tab — history tab manages its own context via ReviewHistoryTab
  useEffect(() => {
    if (stage !== 'review' || activeTab !== 'review') {
      setReviewCardContext(null)
      return
    }
    const card = cards[idx]
    if (!card) {
      setReviewCardContext(null)
      return
    }
    const topicLabel = card.topicId
      ? (allTopics.find((t) => t.id === card.topicId)?.label ?? null)
      : null
    setReviewCardContext({
      topicId: card.topicId,
      topicLabel,
      topicTags: card.topicTags,
      concepts: card.concepts,
      trapPattern: card.trapPattern,
      questionText: card.exampleQuestion?.question ?? null,
      correctAnswer: card.exampleQuestion?.answer ?? null,
      extractionId: card.id,
      exampleQuestion: card.exampleQuestion ?? null,
    })
    return () => setReviewCardContext(null)
  }, [cards, idx, stage, activeTab, setReviewCardContext])

  // Goal overlay on first non-loading render
  useEffect(() => {
    if (stage !== 'loading' && !overlayShownRef.current) {
      overlayShownRef.current = true
      setShowGoalOverlay(true)
      const t = setTimeout(() => setShowGoalOverlay(false), 1500)
      return () => clearTimeout(t)
    }
  }, [stage])

  // Goal fanfare: play when count crosses threshold
  useEffect(() => {
    const prev = prevTodayCountRef.current
    prevTodayCountRef.current = todayCount
    if (!goalFanfarePlayedRef.current && prev < dailyGoal && todayCount >= dailyGoal && dailyGoal > 0) {
      goalFanfarePlayedRef.current = true
      playGoalSound()
    }
  }, [todayCount, dailyGoal])

  // Reset feedback panel + MCQ state when card changes
  useEffect(() => {
    setFeedbackOpen(false)
    setFeedbackText('')
    setErrorType(null)
    setAiFixResult(null)
    setFixError(null)
    setMcqAnswerState(null)
  }, [idx])

  function applyToggles(base: RecentExtractionItem[], shuffle: boolean, confusedOnly: boolean): RecentExtractionItem[] {
    let result = confusedOnly ? base.filter((c) => c.reviewResult === 'confused') : base
    if (shuffle) result = [...result].sort(() => Math.random() - 0.5)
    return result
  }

  function handleToggleShuffle() {
    const next = !shuffleOn
    setShuffleOn(next)
    setCards(applyToggles(originalCards, next, confusedFilterOn))
    setIdx(0)
  }

  function handleToggleConfusedFilter() {
    const next = !confusedFilterOn
    setConfusedFilterOn(next)
    setCards(applyToggles(originalCards, shuffleOn, next))
    setIdx(0)
  }

  async function handleAnswer(knew: boolean) {
    if (submitting || !visible) return
    const card = cards[idx]
    if (!card) return

    // Non-MCQ cards: play sound + XP float animation immediately on button click
    // MCQ cards: sound fires in handleSelect; here we just do DB writes
    if (mcqAnswerState === null) {
      if (knew) {
        playCorrectSound()
        addXpLocal(5)
        setCardBouncing(true)
        setTimeout(() => setCardBouncing(false), 400)
        setShowGreenFlash(true)
        setTimeout(() => setShowGreenFlash(false), 600)
      } else {
        playWrongSound()
        addXpLocal(-5)
        setShowRedFlash(true)
        setTimeout(() => setShowRedFlash(false), 600)
      }
      setNonMcqXp({ visible: true, correct: knew })
      setTimeout(() => setNonMcqXp(null), 1100)
    }

    setSubmitting(true)
    setVisible(false)

    await updateConceptReview(card.id, knew)

    // review_log INSERT (fire-and-forget)
    if (userId) {
      void insertReviewLog(userId, card.id, card.topicId, knew ? 'known' : 'confused')
    }

    // XP DB write for this card (fire-and-forget)
    if (userId) {
      void addXp(userId, knew ? 5 : -5, knew ? 'correct_answer' : 'wrong_answer')
        .then((r) => { if (r.totalXp > 0) setTotalXp(r.totalXp) })
    }

    setTimeout(() => {
      const next = idx + 1
      if (knew) setKnewCount((c) => c + 1)
      else setConfusedCount((c) => c + 1)
      incrementTodayReviewCount()
      // 오답 재출제/큐 모드에서 정답 처리 시 confused 카운트 감소
      if (knew && reviewMode !== 'normal') {
        setTotalConfusedCount((c) => Math.max(0, c - 1))
      }
      if (userId) void upsertDailyReviewLog(userId, { knew: knew ? 1 : 0, confused: knew ? 0 : 1 })
      if (next >= cards.length) {
        if (reviewMode === 'queue') setQueueDone(true)
        setStage('done')
        const finalCount = (knew ? knewCount + 1 : knewCount) + (knew ? confusedCount : confusedCount + 1)
        setMoneyRain({ open: true, count: finalCount })
        if (userId) {
          addXpLocal(10)
          void addXp(userId, 10, 'review_complete')
            .then((r) => {
              if (r.totalXp > 0) setTotalXp(r.totalXp + r.streakBonus)
            })
          getConceptDueCount(userId).then(setConceptDueCount).catch(() => {})
        }
      } else {
        setIdx(next)
        setVisible(true)
      }
      setSubmitting(false)
    }, 200)
  }

  async function handleStartQueue() {
    if (!userId || modeLoading) return
    setModeLoading(true)
    try {
      const qCards = await fetchTodayQueue(userId, 5)
      setOriginalCards(qCards)
      setCards(applyToggles(qCards, shuffleOn, confusedFilterOn))
      setIdx(0)
      setVisible(true)
      setReviewMode('queue')
      setQueueDone(false)
      setStage(qCards.length === 0 ? 'empty' : 'review')
    } finally {
      setModeLoading(false)
    }
  }

  async function handleStartConfused() {
    if (!userId || modeLoading) return
    setModeLoading(true)
    try {
      const cCards = await fetchConfusedCards(userId)
      setOriginalCards(cCards)
      setCards(applyToggles(cCards, shuffleOn, confusedFilterOn))
      setIdx(0)
      setVisible(true)
      setReviewMode('confused')
      setStage(cCards.length === 0 ? 'empty' : 'review')
    } finally {
      setModeLoading(false)
    }
  }

  async function handleExitMode() {
    if (!userId || modeLoading) return
    setModeLoading(true)
    try {
      const items = await fetchDueExtractions(userId)
      setOriginalCards(items)
      setCards(applyToggles(items, shuffleOn, confusedFilterOn))
      setIdx(0)
      setVisible(true)
      setReviewMode('normal')
      setStage(items.length === 0 ? 'empty' : 'review')
    } finally {
      setModeLoading(false)
    }
  }

  async function handleGenerate() {
    if (!userId || generating) return
    setGenerating(true)
    try {
      const count = await generateOnDemandReviewCards(userId)
      if (count === 0) {
        setNoOnDemandData(true)
        return
      }
      const [items, log] = await Promise.all([
        fetchDueExtractions(userId),
        getTodayReviewStats(userId),
      ])
      setOriginalCards(items)
      setCards(applyToggles(items, shuffleOn, confusedFilterOn))
      setIdx(0)
      setKnewCount(log.knewCount)
      setConfusedCount(log.confusedCount)
      setStage(items.length === 0 ? 'empty' : 'review')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveFeedback() {
    const card = cards[idx]
    if (!card || !feedbackText.trim()) return
    await saveFeedback(card.id, feedbackText)
    setCards((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, feedback: feedbackText } : c))
    )
    setFeedbackOpen(false)
    setFeedbackText('')
  }

  async function handleAiFix() {
    const card = cards[idx]
    if (!feedbackText.trim() || !card.exampleQuestion || !errorType) return
    setAiFixLoading(true)
    setFixError(null)

    const timeoutId = window.setTimeout(() => {
      setAiFixLoading(false)
      setFixError('다시 시도해주세요 (타임아웃)')
    }, 20000)

    try {
      const expStr = extractExplanationText(
        card.exampleQuestion.explanation,
        card.exampleQuestion.answer,
      )

      const res = await fetch(`${API_URL}/api/concept/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: card.id,
          feedback: feedbackText,
          errorType,
          current: {
            question: card.exampleQuestion.question,
            correct_answer: card.exampleQuestion.answer,
            explanation: expStr,
            options: card.exampleQuestion.options ?? [],
          },
        }),
      })
      window.clearTimeout(timeoutId)
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setFixError(err.error ?? '서버 오류가 발생했어요')
        return
      }
      const data = (await res.json()) as AiFixResult
      setAiFixResult(data)
    } catch {
      window.clearTimeout(timeoutId)
      setFixError('네트워크 오류가 발생했어요')
    } finally {
      setAiFixLoading(false)
    }
  }

  async function handleConfirmFix() {
    if (!aiFixResult || !aiFixResult.valid || !errorType) return
    const card = cards[idx]
    setSavingFix(true)
    try {
      const res = await fetch(`${API_URL}/api/concept/confirm-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: card.id,
          errorType,
          feedback: feedbackText,
          newAnswer: aiFixResult.correct_answer,
          newExplanation: aiFixResult.explanation,
          newOptions: aiFixResult.options,
          userId,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setFixError(err.error ?? '저장 중 오류가 발생했어요')
        return
      }
      setCards((prev) =>
        prev.map((c, i) => {
          if (i !== idx) return c
          const newEq = c.exampleQuestion
            ? {
                ...c.exampleQuestion,
                answer: aiFixResult.correct_answer,
                explanation: aiFixResult.explanation,
                ...(aiFixResult.options ? { options: aiFixResult.options } : {}),
              }
            : null
          return { ...c, exampleQuestion: newEq, isFixed: true, feedback: feedbackText }
        })
      )
      setFixCount((c) => c + 1)
      setFeedbackOpen(false)
      setFeedbackText('')
      setAiFixResult(null)
      setErrorType(null)
    } finally {
      setSavingFix(false)
    }
  }

  if (stage === 'loading') {
    return (
      <div className="flex items-center justify-center h-[60vh] gap-2 text-sm text-[#64748b]">
        <div className="w-4 h-4 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
        불러오는 중…
      </div>
    )
  }

  const current = cards[idx] ?? null
  const total = cards.length

  const goalAchieved = dailyGoal > 0 && todayCount >= dailyGoal
  const goalPct = dailyGoal > 0 ? Math.min(100, (todayCount / dailyGoal) * 100) : 0

  return (
    <div className="max-w-lg mx-auto flex flex-col pb-8">
      {/* Screen flash overlays */}
      {showGreenFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-50 animate-greenFlash"
          style={{ boxShadow: 'inset 0 0 0 7px #22c55e' }}
        />
      )}
      {showRedFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-50 animate-redFlash"
          style={{ boxShadow: 'inset 0 0 0 7px #ef4444' }}
        />
      )}

      {/* Goal overlay */}
      {showGoalOverlay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-goalCelebrate text-center px-8 py-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <p className="text-white text-3xl font-extrabold mb-2">
              {goalAchieved ? '🎉 오늘 목표 달성!' : `오늘 목표`}
            </p>
            {!goalAchieved && (
              <p className="text-white/90 text-xl font-bold mb-3">
                {todayCount} / {dailyGoal}
              </p>
            )}
            <div className="h-2.5 w-48 mx-auto rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${goalPct}%`, background: goalAchieved ? '#4ade80' : '#818cf8' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex px-4 pt-3">
        {(['review', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors"
            style={activeTab === tab
              ? { color: '#4f6ef7', borderBottom: '2.5px solid #4f6ef7' }
              : { color: '#94a3b8', borderBottom: '2.5px solid transparent' }
            }
          >
            {tab === 'review' ? '복습하기' : '히스토리'}
          </button>
        ))}
      </div>
      <div className="h-px bg-[#f1f5f9] mb-2" />

      {activeTab === 'history' ? (
        userId ? <ReviewHistoryTab userId={userId} /> : null
      ) : (
        <div className="flex flex-col gap-4 pt-2">
          {/* Mode quick-start buttons */}
          {totalConfusedCount > 0 && (
            <div className="flex gap-2 px-4">
              <button
                onClick={() => void handleStartQueue()}
                disabled={modeLoading}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                style={{
                  background: reviewMode === 'queue' ? '#4f6ef7' : '#eef2ff',
                  color: reviewMode === 'queue' ? 'white' : '#4338ca',
                  border: '1.5px solid #c7d2fe',
                }}
              >
                {queueDone ? '✅' : '🔄'} 오늘의 큐 {Math.min(5, totalConfusedCount)}문제
              </button>
              <button
                onClick={() => void handleStartConfused()}
                disabled={modeLoading}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                style={{
                  background: reviewMode === 'confused' ? '#dc2626' : '#fef2f2',
                  color: reviewMode === 'confused' ? 'white' : '#b91c1c',
                  border: '1.5px solid #fecaca',
                }}
              >
                ❌ 오답 재출제 {totalConfusedCount}개
              </button>
            </div>
          )}

          {/* Shuffle + confused filter toggles */}
          {stage === 'review' && (
            <div className="flex gap-2 px-4">
              <button
                onClick={handleToggleShuffle}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{
                  background: shuffleOn ? '#4f6ef7' : '#f1f5f9',
                  color: shuffleOn ? 'white' : '#64748b',
                  border: shuffleOn ? '1.5px solid #4f6ef7' : '1.5px solid #e2e8f0',
                }}
              >
                🔀 {shuffleOn ? '섞는 중' : '순서 섞기'}
              </button>
              <button
                onClick={handleToggleConfusedFilter}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                style={{
                  background: confusedFilterOn ? '#f59e0b' : '#f1f5f9',
                  color: confusedFilterOn ? 'white' : '#64748b',
                  border: confusedFilterOn ? '1.5px solid #f59e0b' : '1.5px solid #e2e8f0',
                }}
              >
                {confusedFilterOn ? `🔄 필터 중 ${cards.length}개` : '헷갈린 것만'}
              </button>
            </div>
          )}

          {stage === 'empty' && (
            <EmptyView onGenerate={handleGenerate} generating={generating} noData={noOnDemandData} />
          )}
          {stage === 'done' && (
            <DoneView count={knewCount + confusedCount} />
          )}
          {stage === 'review' && !current && confusedFilterOn && (
            <div className="px-4 py-8 text-sm text-center text-[#94a3b8]">
              현재 덱에 헷갈린 카드가 없어요 🎉
            </div>
          )}
          {stage === 'review' && current && (
            <>
              {reviewMode !== 'normal' && (
                <div className="flex items-center justify-between px-4">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: reviewMode === 'queue' ? '#eef2ff' : '#fef2f2',
                      color: reviewMode === 'queue' ? '#4338ca' : '#b91c1c',
                    }}
                  >
                    {reviewMode === 'queue' ? '🔄 오늘의 큐' : '❌ 오답 재출제'} 모드
                  </span>
                  <button
                    onClick={() => void handleExitMode()}
                    disabled={modeLoading}
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full disabled:opacity-40"
                    style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
                  >
                    모드 종료 ×
                  </button>
                </div>
              )}
              <ProgressBar current={idx + 1} total={total} mode={reviewMode} />

              <div className={cardBouncing ? 'animate-cardBounce' : ''}>
                <FlashCard
                  key={idx}
                  card={current}
                  visible={visible}
                  onMcqAnswer={(isCorrect, selected) => {
                    setMcqAnswerState({ isCorrect, selected })
                    if (isCorrect) {
                      setMoneyRain({ open: true, count: knewCount + confusedCount + 1 })
                      addXpLocal(5)
                      setCardBouncing(true)
                      setTimeout(() => setCardBouncing(false), 400)
                      setShowGreenFlash(true)
                      setTimeout(() => setShowGreenFlash(false), 600)
                    } else {
                      addXpLocal(-5)
                      setShowRedFlash(true)
                      setTimeout(() => setShowRedFlash(false), 600)
                    }
                  }}
                />
              </div>

              {/* Answer buttons */}
              <div className="relative">
                {nonMcqXp?.visible && (
                  <span
                    className={`absolute pointer-events-none z-10 text-xs font-bold right-6 ${
                      nonMcqXp.correct ? 'animate-floatUp -top-4' : 'animate-floatDown bottom-0'
                    }`}
                    style={{ color: nonMcqXp.correct ? '#16a34a' : '#dc2626' }}
                  >
                    {nonMcqXp.correct ? '+5 🪙' : '-5 💸'}
                  </span>
                )}
                <div className="flex gap-3 px-4">
                  {mcqAnswerState !== null ? (
                    <button
                      onClick={() => void handleAnswer(mcqAnswerState.isCorrect)}
                      disabled={submitting}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-opacity"
                      style={{ background: '#4f6ef7', color: 'white' }}
                    >
                      다음 카드 →
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => void handleAnswer(false)}
                        disabled={submitting}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-opacity"
                        style={{ background: '#fff9db', border: '1.5px solid #fde68a', color: '#92400e' }}
                      >
                        헷갈려 🔄
                      </button>
                      <button
                        onClick={() => void handleAnswer(true)}
                        disabled={submitting}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-opacity"
                        style={{ background: '#f0fdf4', border: '1.5px solid #86efac', color: '#166534' }}
                      >
                        알았다 ✅
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setFeedbackOpen((v) => !v)
                    if (feedbackOpen) { setAiFixResult(null); setFixError(null) }
                  }}
                  className="text-xs text-[#94a3b8] hover:text-[#64748b] transition-colors"
                >
                  ✏️ 문제 수정
                </button>
              </div>

              {/* Feedback panel */}
              {feedbackOpen && (
                <FeedbackPanel
                  card={current}
                  feedbackText={feedbackText}
                  setFeedbackText={setFeedbackText}
                  errorType={errorType}
                  setErrorType={setErrorType}
                  aiFixLoading={aiFixLoading}
                  aiFixResult={aiFixResult}
                  savingFix={savingFix}
                  fixError={fixError}
                  onSaveFeedback={() => void handleSaveFeedback()}
                  onAiFix={() => void handleAiFix()}
                  onConfirmFix={() => void handleConfirmFix()}
                  onCancelFix={() => setAiFixResult(null)}
                  onClose={() => { setFeedbackOpen(false); setAiFixResult(null); setFixError(null); setErrorType(null) }}
                />
              )}

              <p className="text-center text-[11px] text-[#64748b]">
                오늘 완료: <span className="font-semibold text-[#166534]">{knewCount}개 ✅</span>
                &nbsp;&nbsp;헷갈려: <span className="font-semibold text-[#92400e]">{confusedCount}개 🔄</span>
                &nbsp;&nbsp;문제수정: <span className="font-semibold text-[#4338ca]">{fixCount}개 ✏️</span>
              </p>
            </>
          )}

          <MoneyRainOverlay
            open={moneyRain.open}
            count={moneyRain.count}
            onClose={() => setMoneyRain(prev => ({ ...prev, open: false }))}
          />
        </div>
      )}
    </div>
  )
}
