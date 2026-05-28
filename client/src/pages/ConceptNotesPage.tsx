import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PROFESSOR_SSOT_V2 } from '../constants/professor_ssot_v2'

// ── Types ──────────────────────────────────────────────────────────────────
interface GameCard {
  id: string
  topicId: string
  category: string
  trigger: string
  speed: string
}

interface CardResult {
  topicId: string
  step1: boolean
  step2: boolean
}

type Phase = 'loading' | 'menu' | 'game' | 'result'

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORY_TABS = [
  { key: 'All', label: '전체' },
  { key: 'Assets', label: 'Assets' },
  { key: 'Income & Equity', label: 'Income & Equity' },
  { key: 'Debt & Instr.', label: 'Debt & Instr.' },
  { key: 'Tax & Pension', label: 'Tax & Pension' },
  { key: 'Gov & NFP', label: 'Gov & NFP' },
  { key: 'Other Topics', label: 'Other Topics' },
]

const PREFIX_TO_CAT: Record<string, string> = {
  PPE: 'Assets', IMP: 'Assets', INV: 'Assets', CASH: 'Assets', REC: 'Assets', EQM: 'Assets',
  INTANG: 'Assets', SW: 'Assets',
  CF: 'Income & Equity', ADJ: 'Income & Equity', REV: 'Income & Equity',
  ACE: 'Income & Equity', EPS: 'Income & Equity', EQUITY: 'Income & Equity',
  IS: 'Income & Equity', DISC: 'Income & Equity', SPF: 'Income & Equity',
  BOND: 'Debt & Instr.', LEASE: 'Debt & Instr.', TDR: 'Debt & Instr.',
  ARO: 'Debt & Instr.', BC: 'Debt & Instr.', INT: 'Debt & Instr.',
  TAX: 'Tax & Pension', PEN: 'Tax & Pension',
  GOV: 'Gov & NFP', NFP: 'Gov & NFP',
}

const TOPIC_NAMES: Record<string, string> = Object.fromEntries(
  PROFESSOR_SSOT_V2.map(c => [c.topic_id, c.card_name ?? ''])
)

const CSS_ANIMS = `
  @keyframes cardIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes comboPop { 0%{transform:scale(1)} 50%{transform:scale(1.5)} 100%{transform:scale(1)} }
  @keyframes comboReset { 0%{transform:scale(1)} 35%{transform:scale(0.65);color:#ef4444} 100%{transform:scale(1)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
  @keyframes rainbow { 0%{box-shadow:0 0 0 3px #ef4444} 25%{box-shadow:0 0 0 3px #f59e0b} 50%{box-shadow:0 0 0 3px #22c55e} 75%{box-shadow:0 0 0 3px #3b82f6} 100%{box-shadow:0 0 0 3px #ef4444} }
  @keyframes pulse15 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  @keyframes timerDrain { from{width:100%} to{width:0%} }
  @keyframes dotBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }
`

// ── Helpers ────────────────────────────────────────────────────────────────
function catOf(topicId: string) {
  return PREFIX_TO_CAT[topicId.split('_')[0]] ?? 'Other Topics'
}

function topicLabel(id: string) {
  const name = TOPIC_NAMES[id]
  return name ? `${id}: ${name}` : id
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, '')
}

function truncate(text: string, max = 130) {
  const t = stripMd(text).replace(/\n/g, ' ')
  return t.length > max ? t.slice(0, max) + '…' : t
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick4<T>(correct: T, pool: T[]): T[] {
  const uniq = [...new Set(pool)].filter(x => x !== correct)
  return shuffle([correct, ...shuffle(uniq).slice(0, 3)])
}

function comboColor(n: number): string {
  if (n >= 10) return '#f97316'
  if (n >= 5) return '#f59e0b'
  return '#0f172a'
}

function comboSize(n: number): number {
  if (n >= 15) return 38
  if (n >= 10) return 34
  if (n >= 5) return 30
  return 26
}

function cardBorder(n: number): React.CSSProperties {
  if (n >= 20) return { animation: 'rainbow 1.2s linear infinite' }
  if (n >= 10) return { boxShadow: '0 0 0 3px #f97316, 0 0 16px rgba(249,115,22,0.25)' }
  if (n >= 3) return { boxShadow: '0 0 0 2px #f59e0b' }
  return {}
}

// ── Supabase ───────────────────────────────────────────────────────────────
async function fetchCards(): Promise<GameCard[]> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('question_id, topic_id, trigger, speed')
    .in('source', [1, 2])
    .eq('is_banned', false)
    .not('trigger', 'is', null)
    .not('speed', 'is', null)
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(r => {
    const topicId = String(r.topic_id ?? '')
    return {
      id: String(r.question_id ?? ''),
      topicId,
      category: catOf(topicId),
      trigger: String(r.trigger ?? ''),
      speed: String(r.speed ?? ''),
    }
  })
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ConceptNotesPage() {
  const [allCards, setAllCards] = useState<GameCard[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [activeCategory, setActiveCategory] = useState('All')
  const [deck, setDeck] = useState<GameCard[]>([])
  const [cardIdx, setCardIdx] = useState(0)
  const [step1Opts, setStep1Opts] = useState<string[]>([])
  const [step2Opts, setStep2Opts] = useState<string[]>([])
  const [step1Choice, setStep1Choice] = useState<number | null>(null)
  const [step2Choice, setStep2Choice] = useState<number | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const [combo, setCombo] = useState(0)
  const [comboKey, setComboKey] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [results, setResults] = useState<CardResult[]>([])
  const [shakingIdx, setShakingIdx] = useState<number | null>(null)
  const [timerActive, setTimerActive] = useState(false)
  const [timerDuration, setTimerDuration] = useState(1200)
  const [hasWrong, setHasWrong] = useState(false)
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchCards().then(cards => { setAllCards(cards); setPhase('menu') })
    return () => { if (advanceRef.current) clearTimeout(advanceRef.current) }
  }, [])

  function setupCard(theDeck: GameCard[], idx: number, cat: string, all: GameCard[]) {
    const card = theDeck[idx]
    if (!card) return
    const catCards = cat === 'All' ? all : all.filter(c => c.category === cat)

    const allTopics = [...new Set(all.map(c => c.topicId))]
    const catTopics = [...new Set(catCards.map(c => c.topicId))]
    const topicPool = catTopics.length >= 4 ? catTopics : allTopics

    const allSpeeds = [...new Set(all.map(c => c.speed))]
    const catSpeeds = [...new Set(catCards.map(c => c.speed))]
    const speedPool = catSpeeds.length >= 4 ? catSpeeds : allSpeeds

    setStep1Opts(pick4(card.topicId, topicPool))
    setStep2Opts(pick4(card.speed, speedPool))
    setStep1Choice(null)
    setStep2Choice(null)
    setShakingIdx(null)
    setTimerActive(false)
    setHasWrong(false)
    setCardKey(k => k + 1)
  }

  function startGame(cat: string) {
    if (advanceRef.current) clearTimeout(advanceRef.current)
    const pool = cat === 'All' ? allCards : allCards.filter(c => c.category === cat)
    if (pool.length === 0) return
    const shuffled = shuffle(pool)
    setDeck(shuffled)
    setActiveCategory(cat)
    setCardIdx(0)
    setCombo(0)
    setMaxCombo(0)
    setResults([])
    setupCard(shuffled, 0, cat, allCards)
    setPhase('game')
  }

  function handleStep1(i: number) {
    if (step1Choice !== null) return
    setStep1Choice(i)
    const ok = step1Opts[i] === deck[cardIdx].topicId
    if (!ok) { setShakingIdx(i); setTimeout(() => setShakingIdx(null), 400) }
    if ('vibrate' in navigator) navigator.vibrate(ok ? 30 : [50, 30, 50])
  }

  function handleStep2(i: number) {
    if (step1Choice === null || step2Choice !== null) return
    const card = deck[cardIdx]
    setStep2Choice(i)
    const s1ok = step1Opts[step1Choice!] === card.topicId
    const s2ok = step2Opts[i] === card.speed
    const wrong = !s1ok || !s2ok
    setHasWrong(wrong)
    if (!s2ok) { setShakingIdx(10 + i); setTimeout(() => setShakingIdx(null), 400) }
    if ('vibrate' in navigator) navigator.vibrate(s2ok ? 30 : [50, 30, 50])
    const newCombo = s1ok && s2ok ? combo + 1 : 0
    setCombo(newCombo)
    setMaxCombo(p => Math.max(p, newCombo))
    setComboKey(k => k + 1)
    setResults(p => [...p, { topicId: card.topicId, step1: s1ok, step2: s2ok }])
    const delay = wrong ? 1500 : 1200
    setTimerDuration(delay)
    setTimerActive(true)
    advanceRef.current = setTimeout(() => {
      const next = cardIdx + 1
      if (next >= deck.length) { setPhase('result'); return }
      setCardIdx(next)
      setupCard(deck, next, activeCategory, allCards)
    }, delay)
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ padding: 16 }}>
      {[80, 120, 100, 100].map((h, i) => (
        <div key={i} style={{ height: h, background: '#f1f5f9', borderRadius: 16, marginBottom: 10, opacity: 0.5 + i * 0.12 }} />
      ))}
    </div>
  )

  // ── Menu ───────────────────────────────────────────────────────────────
  if (phase === 'menu') return (
    <div style={{ height: 'calc(100dvh - 98px)', overflowY: 'auto', padding: '20px 16px 32px' }}>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>개념 게임</p>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>TRIGGER 보고 topic → 풀이 맞추기</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => startGame('All')} style={{ gridColumn: '1/-1', padding: '18px 16px', borderRadius: 18, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>전체 랜덤</span>
          <span style={{ opacity: 0.8, fontSize: 14 }}>{allCards.length}장 →</span>
        </button>
        {CATEGORY_TABS.slice(1).map(tab => {
          const count = allCards.filter(c => c.category === tab.key).length
          return (
            <button key={tab.key} onClick={() => count > 0 && startGame(tab.key)} disabled={count === 0}
              style={{ padding: '14px 12px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', textAlign: 'left', cursor: count === 0 ? 'not-allowed' : 'pointer', opacity: count === 0 ? 0.4 : 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{tab.label}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{count}장</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Result ─────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const total = results.length
    const both = results.filter(r => r.step1 && r.step2).length
    const pct = total > 0 ? Math.round(both / total * 100) : 0
    return (
      <div style={{ height: 'calc(100dvh - 98px)', overflowY: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ borderRadius: 24, padding: '28px 20px', background: pct >= 80 ? 'linear-gradient(135deg,#22c55e,#16a34a)' : pct >= 50 ? 'linear-gradient(135deg,#4f6ef7,#7c3aed)' : 'linear-gradient(135deg,#f97316,#ef4444)', color: 'white', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1 }}>{pct}%</div>
            <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>{both}/{total} 완벽 정답</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>최대 콤보 {maxCombo}×</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 16, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{results.filter(r => r.step1).length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Topic 맞춤</div>
            </div>
            <div style={{ flex: 1, background: '#eff6ff', borderRadius: 16, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4f6ef7' }}>{results.filter(r => r.step2).length}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>풀이 맞춤</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setPhase('menu')} style={{ flex: 1, padding: '14px', borderRadius: 16, background: 'white', border: '1.5px solid #e2e8f0', fontWeight: 700, color: '#64748b', fontSize: 14, cursor: 'pointer' }}>카테고리 선택</button>
            <button onClick={() => startGame(activeCategory)} style={{ flex: 2, padding: '14px', borderRadius: 16, background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)', color: 'white', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>다시 하기 ⚡</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game ───────────────────────────────────────────────────────────────
  const card = deck[cardIdx]
  if (!card) return null

  const s1Correct = step1Choice !== null ? step1Opts[step1Choice] === card.topicId : null
  const s2Correct = step2Choice !== null ? step2Opts[step2Choice] === card.speed : null

  const dotsFilled = combo === 0 ? 0 : combo >= 5 ? 5 : combo % 5
  const comboAnim = combo >= 15
    ? 'pulse15 0.8s ease infinite'
    : results.length > 0 && combo === 0
    ? 'comboReset 0.25s ease'
    : results.length > 0
    ? 'comboPop 0.15s ease'
    : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 98px)' }}>
      <style>{CSS_ANIMS}</style>

      {/* Category tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '7px 12px', borderBottom: '1.5px solid #e2e8f0', background: 'white', flexShrink: 0 }}>
        {CATEGORY_TABS.map(t => (
          <button key={t.key} onClick={() => startGame(t.key)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeCategory === t.key ? '#4f6ef7' : '#f1f5f9', color: activeCategory === t.key ? 'white' : '#475569', transition: 'background 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Combo + progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', background: 'white', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div
          key={`cn-${comboKey}`}
          style={{ color: comboColor(combo), fontSize: comboSize(combo), fontWeight: 900, lineHeight: 1, minWidth: 40, textAlign: 'center', animation: comboAnim, transition: 'font-size 0.2s, color 0.2s' }}
        >
          {combo}×
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < dotsFilled ? '#f59e0b' : '#e2e8f0', transition: 'background 0.2s', animation: i === dotsFilled - 1 && dotsFilled > 0 ? 'dotBounce 0.2s ease' : 'none' }} />
          ))}
        </div>
        <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#4f6ef7', width: `${((cardIdx) / deck.length) * 100}%`, transition: 'width 0.25s ease', borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{cardIdx + 1}/{deck.length}</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 24px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>

          {/* TRIGGER card */}
          <div
            key={cardKey}
            style={{ background: 'white', borderRadius: 18, padding: '14px 16px', marginBottom: 12, border: '1.5px solid #e2e8f0', animation: 'cardIn 0.18s ease both', transition: 'box-shadow 0.3s', ...cardBorder(combo) }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Trigger</div>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: '#1e293b', margin: 0, whiteSpace: 'pre-wrap' }}>{stripMd(card.trigger)}</p>
          </div>

          {/* Step 1 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#eff6ff', color: '#4f6ef7', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>Step 1</span>
              이게 무슨 topic?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {step1Opts.map((opt, i) => {
                const chosen = step1Choice === i
                const isCorrect = opt === card.topicId
                let bg = '#f8fafc', border = '#e2e8f0', color = '#1e293b'
                if (step1Choice !== null) {
                  if (isCorrect) { bg = '#f0fdf4'; border = '#4ade80'; color = '#15803d' }
                  else if (chosen) { bg = '#fef2f2'; border = '#f87171'; color = '#dc2626' }
                }
                return (
                  <button key={i} onClick={() => handleStep1(i)}
                    style={{ padding: '9px 10px', borderRadius: 11, background: bg, border: `1.5px solid ${border}`, color, fontSize: 11, fontWeight: 600, textAlign: 'left', cursor: step1Choice !== null ? 'default' : 'pointer', lineHeight: 1.4, minHeight: 44, transition: 'background 0.1s, border 0.1s', animation: shakingIdx === i ? 'shake 0.3s ease' : 'none', transform: chosen ? 'scale(1.02)' : 'scale(1)' }}>
                    {topicLabel(opt)}
                  </button>
                )
              })}
            </div>
            {s1Correct === false && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', padding: '6px 10px', background: '#f0fdf4', borderRadius: 8 }}>
                ✓ 정답: <strong style={{ color: '#15803d' }}>{topicLabel(card.topicId)}</strong>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div style={{ opacity: step1Choice === null ? 0.35 : 1, transition: 'opacity 0.2s', pointerEvents: step1Choice === null ? 'none' : 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#fdf4ff', color: '#7c3aed', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 800 }}>Step 2</span>
              어떻게 풀어?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {step2Opts.map((opt, i) => {
                const chosen = step2Choice === i
                const isCorrect = opt === card.speed
                let bg = '#f8fafc', border = '#e2e8f0', color = '#1e293b'
                if (step2Choice !== null) {
                  if (isCorrect) { bg = '#f0fdf4'; border = '#4ade80'; color = '#15803d' }
                  else if (chosen) { bg = '#fef2f2'; border = '#f87171'; color = '#dc2626' }
                }
                return (
                  <button key={i} onClick={() => handleStep2(i)}
                    style={{ padding: '10px 12px', borderRadius: 11, background: bg, border: `1.5px solid ${border}`, color, fontSize: 11, fontWeight: 500, textAlign: 'left', cursor: step2Choice !== null ? 'default' : 'pointer', lineHeight: 1.55, minHeight: 44, transition: 'background 0.1s, border 0.1s', animation: shakingIdx === 10 + i ? 'shake 0.3s ease' : 'none' }}>
                    {truncate(opt)}
                  </button>
                )
              })}
            </div>
            {s2Correct === false && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', padding: '6px 10px', background: '#f0fdf4', borderRadius: 8 }}>
                ✓ 정답: <strong style={{ color: '#15803d' }}>{truncate(card.speed, 150)}</strong>
              </div>
            )}
          </div>

          {/* Timer bar */}
          {timerActive && (
            <div style={{ marginTop: 14, height: 3, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div key={`t-${cardIdx}`} style={{ height: '100%', background: hasWrong ? '#ef4444' : '#f59e0b', borderRadius: 4, animation: `timerDrain ${timerDuration}ms linear forwards` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
