import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useStudyStore from '../store/studyStore'

// ── Types ─────────────────────────────────────────────────────
interface TopicRow {
  topicId: string
  topicName: string
  summary: string | null
  rule: string | null
  trap: string | null
  example: string | null
  triggerKeywords: string[] | null
}

interface SprintCard {
  topic: TopicRow
  question: string
  options: string[]
  answer: string
}

interface SprintResult {
  card: SprintCard
  selected: string | null
  isCorrect: boolean
}

type Phase = 'setup' | 'loading' | 'quiz' | 'result'
type QCount = 5 | 10 | 15
type TimerMode = 3 | 5 | 0

// ── Supabase fetch ─────────────────────────────────────────────
import { supabase } from '../lib/supabase'
import { DB } from '../constants/db'

async function loadAllTopics(): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('topic_id, topic_name, summary, rule, trap, example, trigger_keywords')
    .eq('exam_section', 'FAR')
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(r => ({
    topicId: String(r.topic_id ?? ''),
    topicName: String(r.topic_name ?? ''),
    summary: r.summary ? String(r.summary) : null,
    rule: r.rule ? String(r.rule) : null,
    trap: r.trap ? String(r.trap) : null,
    example: r.example ? String(r.example) : null,
    triggerKeywords: Array.isArray(r.trigger_keywords)
      ? (r.trigger_keywords as unknown[]).map(String)
      : null,
  }))
}

async function loadWrongTopics(userId: string): Promise<{ topicId: string; count: number }[]> {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  const { data, error } = await supabase
    .from(DB.TABLES.REVIEW_LOG)
    .select('topic_id')
    .eq('user_id', userId)
    .eq('result', 'confused')
    .not('topic_id', 'is', null)
    .gte('reviewed_at', since.toISOString())
  if (error || !data) return []
  const counts: Record<string, number> = {}
  for (const r of data as { topic_id: string }[]) {
    counts[r.topic_id] = (counts[r.topic_id] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([topicId, count]) => ({ topicId, count }))
    .sort((a, b) => b.count - a.count)
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

async function saveTopicResult(userId: string, topicId: string, isCorrect: boolean): Promise<void> {
  await supabase.from(DB.TABLES.REVIEW_LOG).insert({
    user_id: userId,
    concept_id: null,
    topic_id: topicId,
    result: isCorrect ? 'known' : 'confused',
    source: 'sprint',
    reviewed_at: new Date().toISOString(),
  })
}

// ── [Task 1] MCQ — English questions ──────────────────────────
function firstMeaningfulLine(text: string | null): string {
  if (!text) return ''
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 8)
  return lines[0] ?? ''
}

function generateCard(topic: TopicRow, allTopics: TopicRow[]): SprintCard {
  const trigger = topic.triggerKeywords?.[0] ?? null
  const question = trigger
    ? `When you see "${trigger}", what is the correct treatment?`
    : `What is the correct treatment for ${topic.topicName}?`

  const correctAnswer = firstMeaningfulLine(topic.rule) || `${topic.topicName} → apply professor SSOT rule`

  const distractors = allTopics
    .filter(t => t.topicId !== topic.topicId && t.rule)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(t => firstMeaningfulLine(t.rule))
    .filter(d => d && d !== correctAnswer)
    .slice(0, 3)

  while (distractors.length < 3) {
    distractors.push(['Accrue the full amount', 'Expense immediately', 'Capitalize and amortize'][distractors.length] ?? 'None of the above')
  }

  const shuffled = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5)
  return { topic, question, options: shuffled, answer: correctAnswer }
}

function buildDeck(allTopics: TopicRow[], wrongTopicIds: string[], count: number): SprintCard[] {
  const usable = allTopics.filter(t => t.rule && t.rule.length > 10)
  const wrongSet = new Set(wrongTopicIds)
  const wrongTopics = usable.filter(t => wrongSet.has(t.topicId))
  const otherTopics = usable.filter(t => !wrongSet.has(t.topicId)).sort(() => Math.random() - 0.5)
  const ordered = [...wrongTopics.sort(() => Math.random() - 0.5), ...otherTopics]
  return ordered.slice(0, count).map(topic => generateCard(topic, usable))
}

// ── [Task 3] Formatted text — Dr/Cr monospace ─────────────────
function FormattedText({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.75 }}>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trimStart()
        const isCr = trimmed.startsWith('Cr.')
        return (
          <div key={i} style={{ paddingLeft: isCr ? 24 : 0 }}>
            {trimmed || ' '}
          </div>
        )
      })}
    </div>
  )
}

// ── [Task 4] TTS Overlay — Web Speech API ─────────────────────
function TTSOverlay({ topic, onClose }: { topic: TopicRow; onClose: () => void }) {
  const { lines, fullText, offsets } = useMemo(() => {
    const parts: string[] = []
    if (topic.rule) parts.push(topic.rule)
    if (topic.trap) parts.push(topic.trap)
    if (topic.example) parts.push(topic.example)

    const rawLines = parts
      .join('\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)

    const offsets: number[] = []
    let pos = 0
    for (const line of rawLines) {
      offsets.push(pos)
      pos += line.length + 1
    }

    return { lines: rawLines, fullText: rawLines.join(' '), offsets }
  }, [topic])

  const [currentLine, setCurrentLine] = useState(0)

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) { onClose(); return }

    const utter = new SpeechSynthesisUtterance(fullText)
    utter.lang = 'en-US'
    utter.rate = 0.9

    const pickVoice = () => {
      const voices = synth.getVoices()
      const voice =
        voices.find(v => v.lang === 'en-US' && /samantha|victoria|zira|karen|google us/i.test(v.name)) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en'))
      if (voice) utter.voice = voice
    }

    if (synth.getVoices().length > 0) {
      pickVoice()
    } else {
      synth.addEventListener('voiceschanged', pickVoice, { once: true })
    }

    utter.onboundary = (e: SpeechSynthesisEvent) => {
      let lineIdx = 0
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (offsets[i] <= e.charIndex) { lineIdx = i; break }
      }
      setCurrentLine(lineIdx)
    }

    utter.onend = onClose

    synth.speak(utter)
    return () => { synth.cancel() }
  }, [fullText, offsets, onClose])

  // Show window of 7 lines centered on current
  const windowSize = 7
  const winStart = Math.max(0, Math.min(currentLine - 3, lines.length - windowSize))
  const winEnd = Math.min(lines.length, winStart + windowSize)
  const visibleLines = lines.slice(winStart, winEnd)

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-3 pt-12 pb-6 px-6">
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
          style={{ background: '#4f6ef7', color: 'white' }}
        >
          {topic.topicId}
        </span>
        <span className="text-white text-base font-semibold text-center leading-snug">
          {topic.topicName}
        </span>
      </div>

      {/* Subtitle lines */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 gap-3"
        onClick={e => e.stopPropagation()}
      >
        {visibleLines.map((line, i) => {
          const absIdx = winStart + i
          const isCurrent = absIdx === currentLine
          return (
            <p
              key={absIdx}
              className="text-center leading-relaxed transition-all duration-300 max-w-md"
              style={{
                color: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.22)',
                fontWeight: isCurrent ? 700 : 400,
                fontSize: isCurrent ? '1.05rem' : '0.78rem',
                transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {line}
            </p>
          )
        })}
      </div>

      {/* Footer */}
      <div className="pb-12 text-center text-white/30 text-xs tracking-wider">
        tap anywhere to dismiss
      </div>
    </div>
  )
}

// ── Sound effects ──────────────────────────────────────────────
function playCorrect() {
  try {
    const ctx = new AudioContext()
    const freqs = [880, 1100]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = f; o.type = 'sine'
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25)
      o.start(ctx.currentTime + i * 0.1)
      o.stop(ctx.currentTime + i * 0.1 + 0.25)
    })
  } catch {}
}

function playWrong() {
  try {
    const ctx = new AudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 280; o.type = 'sawtooth'
    g.gain.setValueAtTime(0.12, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    o.start(); o.stop(ctx.currentTime + 0.35)
  } catch {}
}

// ── Confetti ───────────────────────────────────────────────────
function ConfettiEffect() {
  const colors = ['#4f6ef7', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.4}s`,
    size: Math.random() * 8 + 6,
    rotate: Math.random() * 360,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: p.left, top: -20,
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: p.delay,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ── Progress dots ──────────────────────────────────────────────
function ProgressDots({ total, current, results }: { total: number; current: number; results: (boolean | null)[] }) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const done = results[i] !== null && results[i] !== undefined
        const correct = results[i] === true
        const isCurrent = i === current
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: isCurrent ? 12 : 8, height: isCurrent ? 12 : 8,
              background: done ? (correct ? '#22c55e' : '#ef4444') : isCurrent ? '#4f6ef7' : '#e2e8f0',
              boxShadow: isCurrent ? '0 0 0 3px rgba(79,110,247,0.25)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// ── Timer ──────────────────────────────────────────────────────
function Timer({ seconds, unlimited }: { seconds: number; unlimited: boolean }) {
  if (unlimited) return <span className="text-xs text-muted">∞</span>
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return (
    <span
      className="text-sm font-mono font-bold tabular-nums transition-colors"
      style={{ color: seconds < 60 ? '#ef4444' : '#64748b' }}
    >
      {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

// ── Setup view ────────────────────────────────────────────────
function SetupView({
  todayCount, wrongTopics, allTopics, qCount, setQCount,
  timerMode, setTimerMode, onStart, onStartFocused, streak,
}: {
  todayCount: number
  wrongTopics: { topicId: string; count: number }[]
  allTopics: TopicRow[]
  qCount: QCount
  setQCount: (n: QCount) => void
  timerMode: TimerMode
  setTimerMode: (n: TimerMode) => void
  onStart: () => void
  onStartFocused: (tid: string) => void
  streak: number
}) {
  const topicMap = Object.fromEntries(allTopics.map(t => [t.topicId, t.topicName]))
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">⚡ 스프린트</h1>
          <p className="text-xs text-muted mt-0.5">Professor SSOT — MCQ drill</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-[#4f6ef7]">{streak}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider">🔥 스트릭</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-border text-center">
          <div className="text-3xl font-black text-[#0f172a]">{todayCount}</div>
          <div className="text-xs text-muted mt-1">오늘 완료 스프린트</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-border text-center">
          <div className="text-3xl font-black text-[#ef4444]">{wrongTopics.length}</div>
          <div className="text-xs text-muted mt-1">오답 누적 토픽</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-card border border-border space-y-4">
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">문제 수</div>
          <div className="flex gap-2">
            {([5, 10, 15] as QCount[]).map(n => (
              <button
                key={n}
                onClick={() => setQCount(n)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: qCount === n ? '#4f6ef7' : '#f8fafc',
                  color: qCount === n ? '#fff' : '#64748b',
                  border: `1.5px solid ${qCount === n ? '#4f6ef7' : '#e2e8f0'}`,
                }}
              >
                {n}문제
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">타이머</div>
          <div className="flex gap-2">
            {([3, 5, 0] as TimerMode[]).map(m => (
              <button
                key={m}
                onClick={() => setTimerMode(m)}
                className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: timerMode === m ? '#4f6ef7' : '#f8fafc',
                  color: timerMode === m ? '#fff' : '#64748b',
                  border: `1.5px solid ${timerMode === m ? '#4f6ef7' : '#e2e8f0'}`,
                }}
              >
                {m === 0 ? '제한없음' : `${m}분`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}
      >
        스프린트 시작 ⚡
      </button>

      {wrongTopics.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-card border border-border">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">🎯 오답 토픽 집중 훈련</div>
          <div className="space-y-2">
            {wrongTopics.slice(0, 8).map(({ topicId, count }) => (
              <button
                key={topicId}
                onClick={() => onStartFocused(topicId)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#ef4444' }}>
                    {topicId}
                  </span>
                  <span className="text-sm text-[#0f172a]">{topicMap[topicId] ?? topicId}</span>
                </div>
                <span className="text-xs text-[#ef4444] font-bold">{count}회 오답</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── [Task 2 + 3] Quiz view ────────────────────────────────────
function QuizView({
  deck, currentIdx, results, timeLeft, unlimited,
  onAnswer, onNext, onOpenTTS,
}: {
  deck: SprintCard[]
  currentIdx: number
  results: (boolean | null)[]
  timeLeft: number
  unlimited: boolean
  onAnswer: (option: string) => void
  onNext: () => void
  onOpenTTS: (topic: TopicRow) => void
}) {
  const card = deck[currentIdx]
  const answered = results[currentIdx] !== null && results[currentIdx] !== undefined
  const isCorrect = results[currentIdx] === true
  const [selected, setSelected] = useState<string | null>(null)
  const [cardAnim, setCardAnim] = useState('')

  useEffect(() => { setSelected(null); setCardAnim('') }, [currentIdx])

  const handleSelect = (opt: string) => {
    if (selected !== null) return
    setSelected(opt)
    const correct = opt === card.answer
    setCardAnim(correct ? 'animate-cardBounce' : 'animate-shake')
    onAnswer(opt)
  }

  if (!card) return null

  const optionLabels = ['A', 'B', 'C', 'D']

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <ProgressDots total={deck.length} current={currentIdx} results={results} />
        <Timer seconds={timeLeft} unlimited={unlimited} />
      </div>

      {/* topic_id badge */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#eff6ff', color: '#4f6ef7' }}>
          {card.topic.topicId}
        </span>
        <span className="text-xs text-muted truncate">{card.topic.topicName}</span>
      </div>

      {/* Question card */}
      <div
        className={`bg-white rounded-2xl p-5 shadow-card border border-border relative overflow-hidden ${cardAnim}`}
        onAnimationEnd={() => setCardAnim('')}
      >
        {/* Flash overlays */}
        {answered && isCorrect && (
          <div className="absolute inset-0 rounded-2xl animate-greenFlash pointer-events-none" style={{ background: 'rgba(34,197,94,0.15)' }} />
        )}
        {answered && !isCorrect && (
          <div className="absolute inset-0 rounded-2xl animate-redFlash pointer-events-none" style={{ background: 'rgba(239,68,68,0.12)' }} />
        )}

        <p className="text-sm font-medium text-[#0f172a] leading-relaxed">{card.question}</p>

        {/* [Task 2] Full feedback — always shown on both correct and wrong */}
        {answered && (
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 animate-fadeIn">
            {/* Correct indicator */}
            <div className="text-xs font-semibold" style={{ color: isCorrect ? '#15803d' : '#b91c1c' }}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>

            {/* RULE */}
            {card.topic.rule && (
              <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">RULE</div>
                <FormattedText text={card.topic.rule} />
              </div>
            )}

            {/* TRAP */}
            {card.topic.trap && (
              <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">TRAP ⚠️</div>
                <FormattedText text={card.topic.trap} />
              </div>
            )}

            {/* EXAMPLE */}
            {card.topic.example && (
              <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">EXAMPLE</div>
                <FormattedText text={card.topic.example} />
              </div>
            )}

            {/* TTS button */}
            <button
              onClick={() => onOpenTTS(card.topic)}
              className="w-full py-2 rounded-xl text-xs font-bold transition-colors"
              style={{ background: '#eff6ff', color: '#4f6ef7' }}
            >
              🎧 Listen
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {card.options.map((opt, i) => {
          const label = optionLabels[i] ?? String(i + 1)
          const isSelected = selected === opt
          const isAnswer = opt === card.answer
          let bg = '#fff', border = '#e2e8f0', textColor = '#0f172a'
          if (answered) {
            if (isAnswer) { bg = '#f0fdf4'; border = '#22c55e'; textColor = '#15803d' }
            else if (isSelected && !isAnswer) { bg = '#fef2f2'; border = '#ef4444'; textColor = '#b91c1c' }
          } else if (isSelected) {
            bg = '#eff6ff'; border = '#4f6ef7'
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={answered}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ background: bg, border: `1.5px solid ${border}`, color: textColor }}
            >
              <span className="font-bold mr-2">{label}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Next button */}
      {answered && (
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-2xl text-white font-bold animate-slideUp"
          style={{ background: isCorrect ? '#22c55e' : '#4f6ef7' }}
        >
          {currentIdx + 1 >= deck.length ? 'See Results →' : 'Next →'}
        </button>
      )}
    </div>
  )
}

// ── [Task 2 + 3 + 4] Result item ──────────────────────────────
function ResultItem({
  result, onOpenTTS,
}: {
  result: SprintResult
  onOpenTTS: (topic: TopicRow) => void
}) {
  const [open, setOpen] = useState(false)
  const { card } = result

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3.5 text-left">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: result.isCorrect ? '#f0fdf4' : '#fef2f2',
            color: result.isCorrect ? '#15803d' : '#b91c1c',
          }}
        >
          {result.isCorrect ? '✓' : '✗'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: '#eff6ff', color: '#4f6ef7' }}>
              {card.topic.topicId}
            </span>
            <span className="text-xs text-muted truncate">{card.topic.topicName}</span>
          </div>
          <p className="text-xs text-[#0f172a] truncate">{card.question}</p>
        </div>
        <span className="text-muted text-sm shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3 animate-fadeIn">
          {!result.isCorrect && result.selected && (
            <div className="text-xs">
              <span className="text-[#ef4444] font-semibold">Selected: </span>
              <span className="text-muted">{result.selected}</span>
            </div>
          )}
          <div className="text-xs">
            <span className="text-[#22c55e] font-semibold">Correct: </span>
            <span className="text-[#0f172a]">{card.answer}</span>
          </div>

          {card.topic.rule && (
            <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">RULE</div>
              <FormattedText text={card.topic.rule} />
            </div>
          )}

          {card.topic.trap && (
            <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">TRAP ⚠️</div>
              <FormattedText text={card.topic.trap} />
            </div>
          )}

          {card.topic.example && (
            <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">EXAMPLE</div>
              <FormattedText text={card.topic.example} />
            </div>
          )}

          <button
            onClick={() => onOpenTTS(card.topic)}
            className="w-full py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: '#eff6ff', color: '#4f6ef7' }}
          >
            🎧 Listen
          </button>
        </div>
      )}
    </div>
  )
}

function ResultView({
  results, elapsedSec, maxStreak, onRetry, onBack, onOpenTTS,
}: {
  results: SprintResult[]
  elapsedSec: number
  maxStreak: number
  onRetry: () => void
  onBack: () => void
  onOpenTTS: (topic: TopicRow) => void
}) {
  const correct = results.filter(r => r.isCorrect).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)
  const elapsedMin = Math.floor(elapsedSec / 60)
  const elapsedS = elapsedSec % 60

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div
        className="rounded-2xl p-6 text-center text-white shadow-lg"
        style={{ background: correct >= total * 0.8 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}
      >
        <div className="text-5xl font-black mb-1">
          {correct}<span className="text-2xl opacity-70">/{total}</span>
        </div>
        <div className="text-white/80 text-sm mb-3">{pct}% correct</div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold">🔥 {maxStreak}</div>
            <div className="text-white/70 text-xs">best streak</div>
          </div>
          <div className="text-center">
            <div className="font-bold">⏱ {elapsedMin}:{elapsedS.toString().padStart(2, '0')}</div>
            <div className="text-white/70 text-xs">time</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider px-1">Review</div>
        {results.map((r, i) => (
          <ResultItem key={i} result={r} onOpenTTS={onOpenTTS} />
        ))}
      </div>

      <div className="flex gap-3 pb-6">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-2xl text-sm font-bold border border-border bg-white text-[#64748b]"
        >
          Back
        </button>
        <button
          onClick={onRetry}
          className="flex-2 py-3.5 px-6 rounded-2xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', flex: 2 }}
        >
          Retry {total}Q ⚡
        </button>
      </div>
    </div>
  )
}

// ── Main SprintPage ────────────────────────────────────────────
export default function SprintPage() {
  const [searchParams] = useSearchParams()
  const deepLinkTopicId = searchParams.get('topic_id')

  const [phase, setPhase] = useState<Phase>('setup')
  const [qCount, setQCount] = useState<QCount>(5)
  const [timerMode, setTimerMode] = useState<TimerMode>(5)

  const [allTopics, setAllTopics] = useState<TopicRow[]>([])
  const [wrongTopics, setWrongTopics] = useState<{ topicId: string; count: number }[]>([])
  const [todayCount, setTodayCount] = useState(0)

  const [deck, setDeck] = useState<SprintCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState<(boolean | null)[]>([])
  const [sprintResults, setSprintResults] = useState<SprintResult[]>([])
  const [selected, setSelected] = useState<string[]>([])

  const [timeLeft, setTimeLeft] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)

  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // [Task 4] TTS overlay
  const [ttsOverlayTopic, setTtsOverlayTopic] = useState<TopicRow | null>(null)

  const userId = useStudyStore((s) => s.userId)
  const storeStreak = useStudyStore((s) => s.streakDays)

  useEffect(() => { loadAllTopics().then(setAllTopics) }, [])

  useEffect(() => {
    if (!userId || phase !== 'setup') return
    Promise.all([loadWrongTopics(userId), loadTodaySprintCount(userId)]).then(([wt, cnt]) => {
      setWrongTopics(wt)
      setTodayCount(cnt)
    })
  }, [userId, phase])

  useEffect(() => {
    if (phase !== 'quiz' || timerMode === 0) return
    if (timeLeft <= 0) { setPhase('result'); return }
    const id = setInterval(() => { setTimeLeft(t => t - 1); setElapsedSec(e => e + 1) }, 1000)
    return () => clearInterval(id)
  }, [phase, timeLeft, timerMode])

  useEffect(() => {
    if (phase !== 'quiz' || timerMode !== 0) return
    const id = setInterval(() => setElapsedSec(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase, timerMode])

  const launchSprint = useCallback((focusTopicId?: string) => {
    if (allTopics.length === 0) return
    const wrongIds = wrongTopics.map(w => w.topicId)
    const newDeck = buildDeck(
      focusTopicId ? allTopics.filter(t => t.topicId === focusTopicId) : allTopics,
      wrongIds,
      focusTopicId ? Math.min(qCount, allTopics.filter(t => t.topicId === focusTopicId).length * 5) : qCount,
    )
    if (newDeck.length === 0) return
    setDeck(newDeck)
    setResults(new Array(newDeck.length).fill(null))
    setSelected([])
    setSprintResults([])
    setCurrentIdx(0)
    setStreak(0)
    setMaxStreak(0)
    setTimeLeft(timerMode * 60)
    setElapsedSec(0)
    setPhase('quiz')
  }, [allTopics, wrongTopics, qCount, timerMode])

  const deepLinkLaunched = useRef(false)
  useEffect(() => {
    if (!deepLinkTopicId || allTopics.length === 0 || deepLinkLaunched.current) return
    deepLinkLaunched.current = true
    launchSprint(deepLinkTopicId)
  }, [deepLinkTopicId, allTopics, launchSprint])

  const handleAnswer = useCallback((option: string) => {
    const card = deck[currentIdx]
    if (!card) return
    const isCorrect = option === card.answer

    if (isCorrect) {
      playCorrect()
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
      const ns = streak + 1
      setStreak(ns)
      setMaxStreak(m => Math.max(m, ns))
    } else {
      playWrong()
      setStreak(0)
    }

    const newResults = [...results]
    newResults[currentIdx] = isCorrect
    setResults(newResults)

    const newSelected = [...selected]
    newSelected[currentIdx] = option
    setSelected(newSelected)

    setSprintResults(prev => [...prev, { card, selected: option, isCorrect }])

    if (userId) void saveTopicResult(userId, card.topic.topicId, isCorrect)
  }, [deck, currentIdx, results, selected, streak, userId])

  const handleNext = useCallback(() => {
    setShowConfetti(false)
    if (currentIdx + 1 >= deck.length) {
      setPhase('result')
    } else {
      setCurrentIdx(i => i + 1)
    }
  }, [currentIdx, deck.length])

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-3 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* [Task 4] TTS overlay */}
      {ttsOverlayTopic && (
        <TTSOverlay
          topic={ttsOverlayTopic}
          onClose={() => setTtsOverlayTopic(null)}
        />
      )}

      {phase === 'setup' && (
        <SetupView
          todayCount={todayCount}
          wrongTopics={wrongTopics}
          allTopics={allTopics}
          qCount={qCount}
          setQCount={setQCount}
          timerMode={timerMode}
          setTimerMode={setTimerMode}
          onStart={() => launchSprint()}
          onStartFocused={(tid) => launchSprint(tid)}
          streak={storeStreak}
        />
      )}

      {phase === 'quiz' && (
        <>
          {showConfetti && <ConfettiEffect />}
          <QuizView
            deck={deck}
            currentIdx={currentIdx}
            results={results}
            timeLeft={timeLeft}
            unlimited={timerMode === 0}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onOpenTTS={setTtsOverlayTopic}
          />
        </>
      )}

      {phase === 'result' && (
        <ResultView
          results={sprintResults}
          elapsedSec={elapsedSec}
          maxStreak={maxStreak}
          onRetry={() => setPhase('setup')}
          onBack={() => setPhase('setup')}
          onOpenTTS={setTtsOverlayTopic}
        />
      )}
    </>
  )
}
