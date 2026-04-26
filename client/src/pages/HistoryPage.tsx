import { useEffect, useState, useRef } from 'react'
import useStudyStore from '../store/studyStore'
import useClaudeStore from '../store/claudeStore'
import { allTopics } from '../data/far-topics'
import QuizCalculator from '../components/quiz/QuizCalculator'
const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

import {
  fetchDueExtractions,
  updateConceptReview,
  getConceptDueCount,
  getTodayReviewStats,
  upsertDailyReviewLog,
  generateOnDemandReviewCards,
  saveFeedback,
  saveConceptFix,
  saveWrongAnswer,
  RecentExtractionItem,
  ConceptTrigger,
  ExampleQuestion,
  ExplanationStructured,
} from '../lib/db'

const DAILY_GOAL = 10

function fireConfetti(origin?: { x: number; y: number }) {
  const fn = (window as { confetti?: (o: object) => void }).confetti
  fn?.({ particleCount: 90, spread: 70, origin: origin ?? { x: 0.5, y: 0.55 } })
}

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
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[#4f6ef7]">오늘 복습</span>
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

const WRONG_MESSAGES = [
  '😢 아쉬워요! 해설 다시 읽어봐요',
  '🔍 천천히 다시 읽어보면 보여요!',
  '💪 틀려야 늘어요. 해설 확인!',
  '😅 한 번 더! 이 개념 곧 마스터해요',
]

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
      fireConfetti()
    } else {
      void saveWrongAnswer(cardId, letter, correctLetter)
      // shake
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      // random toast
      const msg = WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]
      setToast(msg)
      setTimeout(() => setToast(null), 2000)
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
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={isAnswered}
              className="text-left rounded-xl px-3 py-2 text-xs transition-all disabled:cursor-default"
              style={{
                background: bg,
                border: `1.5px solid ${border}`,
                color,
                fontWeight: isAnswered && isCorrect ? 600 : 400,
              }}
            >
              <span className="font-bold mr-1.5" style={{ color: isAnswered && isCorrect ? '#166534' : isAnswered && isSelected && !isCorrect ? '#991b1b' : '#4338ca' }}>{letter}.</span>
              {typeof opt === 'string' ? opt : String(opt)}
              {isAnswered && isCorrect && <span className="ml-1.5">✅</span>}
              {isAnswered && isSelected && !isCorrect && <span className="ml-1.5">❌</span>}
            </button>
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
      </div>

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

      {/* Example question */}
      {card.exampleQuestion && (
        <ExampleQuestionBlock
          eq={card.exampleQuestion}
          cardId={card.id}
          onAnswer={onMcqAnswer}
        />
      )}

      {/* Review count */}
      {card.reviewCount > 0 && (
        <p className="text-[10px] text-[#94a3b8] mt-auto">
          복습 {card.reviewCount}회 · {card.reviewInterval}일 간격
        </p>
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
type AiFixResult =
  | { valid: true; correct_answer: string; explanation: string }
  | { valid: false; reason: string }

interface FeedbackPanelProps {
  card: RecentExtractionItem
  feedbackText: string
  setFeedbackText: (v: string) => void
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
              <button
                onClick={onCancelFix}
                className="w-full py-2 rounded-xl text-xs font-semibold"
                style={{ background: '#f1f5f9', color: '#64748b' }}
              >
                확인
              </button>
            </>
          )
        ) : (
          <>
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
                disabled={!feedbackText.trim() || aiFixLoading || !eq}
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
      <div className="text-6xl">🎉</div>
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
  const setReviewCardContext = useClaudeStore((s) => s.setReviewCardContext)

  const [cards, setCards] = useState<RecentExtractionItem[]>([])
  const [idx, setIdx] = useState(0)
  const [stage, setStage] = useState<Stage>('loading')
  const [knewCount, setKnewCount] = useState(0)
  const [confusedCount, setConfusedCount] = useState(0)
  const [visible, setVisible] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [noOnDemandData, setNoOnDemandData] = useState(false)
  // MCQ answer state — reset on card change
  const [mcqAnswerState, setMcqAnswerState] = useState<{ isCorrect: boolean; selected: string } | null>(null)

  // Feedback panel state
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [aiFixLoading, setAiFixLoading] = useState(false)
  const [aiFixResult, setAiFixResult] = useState<AiFixResult | null>(null)
  const [savingFix, setSavingFix] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      fetchDueExtractions(userId),
      getTodayReviewStats(userId),
    ]).then(([items, log]) => {
      setCards(items)
      setKnewCount(log.knewCount)
      setConfusedCount(log.confusedCount)
      setTodayReviewCount(log.knewCount + log.confusedCount)
      setStage(items.length === 0 ? 'empty' : 'review')
    }).catch(() => setStage('empty'))
  }, [userId])

  // Must be before any early returns — Rules of Hooks
  useEffect(() => {
    if (stage !== 'review') {
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
  }, [cards, idx, stage, setReviewCardContext])

  // Reset feedback panel + MCQ state when card changes
  useEffect(() => {
    setFeedbackOpen(false)
    setFeedbackText('')
    setAiFixResult(null)
    setFixError(null)
    setMcqAnswerState(null)
  }, [idx])

  async function handleAnswer(knew: boolean) {
    if (submitting || !visible) return
    const card = cards[idx]
    if (!card) return

    setSubmitting(true)
    setVisible(false)

    await updateConceptReview(card.id, knew)

    setTimeout(() => {
      const next = idx + 1
      if (knew) setKnewCount((c) => c + 1)
      else setConfusedCount((c) => c + 1)
      incrementTodayReviewCount()
      if (userId) void upsertDailyReviewLog(userId, { knew: knew ? 1 : 0, confused: knew ? 0 : 1 })
      if (next >= cards.length) {
        setStage('done')
        if (userId) getConceptDueCount(userId).then(setConceptDueCount).catch(() => {})
      } else {
        setIdx(next)
        setVisible(true)
      }
      setSubmitting(false)
    }, 200)
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
      setCards(items)
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
    if (!feedbackText.trim() || !card.exampleQuestion) return
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
          current: {
            question: card.exampleQuestion.question,
            correct_answer: card.exampleQuestion.answer,
            explanation: expStr,
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
    if (!aiFixResult || !aiFixResult.valid) return
    const card = cards[idx]
    setSavingFix(true)
    try {
      await saveConceptFix(card.id, feedbackText, aiFixResult.correct_answer, aiFixResult.explanation)
      setCards((prev) =>
        prev.map((c, i) => {
          if (i !== idx) return c
          const newEq = c.exampleQuestion
            ? { ...c.exampleQuestion, answer: aiFixResult.correct_answer, explanation: aiFixResult.explanation }
            : null
          return { ...c, exampleQuestion: newEq, isFixed: true, feedback: feedbackText }
        })
      )
      setFeedbackOpen(false)
      setFeedbackText('')
      setAiFixResult(null)
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

  if (stage === 'empty') return <EmptyView onGenerate={handleGenerate} generating={generating} noData={noOnDemandData} />
  if (stage === 'done') return <DoneView count={knewCount + confusedCount} />

  const current = cards[idx]
  const total = cards.length

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4 pb-8">
      <ProgressBar current={idx + 1} total={total} />

      <FlashCard
        key={idx}
        card={current}
        visible={visible}
        onMcqAnswer={(isCorrect, selected) => setMcqAnswerState({ isCorrect, selected })}
      />

      {/* Answer buttons — MCQ answered → 다음 카드, otherwise 알았다/헷갈려 */}
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
          aiFixLoading={aiFixLoading}
          aiFixResult={aiFixResult}
          savingFix={savingFix}
          fixError={fixError}
          onSaveFeedback={() => void handleSaveFeedback()}
          onAiFix={() => void handleAiFix()}
          onConfirmFix={() => void handleConfirmFix()}
          onCancelFix={() => setAiFixResult(null)}
          onClose={() => { setFeedbackOpen(false); setAiFixResult(null); setFixError(null) }}
        />
      )}

      <p className="text-center text-[11px] text-[#64748b]">
        오늘 완료: <span className="font-semibold text-[#166534]">{knewCount}개 ✅</span>
        &nbsp;&nbsp;헷갈려: <span className="font-semibold text-[#92400e]">{confusedCount}개 🔄</span>
      </p>
    </div>
  )
}
