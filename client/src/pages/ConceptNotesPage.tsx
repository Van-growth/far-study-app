import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DB } from '../constants/db'
import useStudyStore from '../store/studyStore'

// ── Types ──────────────────────────────────────────────────────
interface TopicRow {
  topicId: string
  topicName: string
  rule: string | null
  trap: string | null
  example: string | null
}

interface FlashResult {
  topic: TopicRow
  result: 'known' | 'confused'
}

type Phase = 'menu' | 'quiz' | 'result'

// ── Constants ──────────────────────────────────────────────────
const MAX_CARDS = 5

const TAB_CATEGORIES: Record<string, string[]> = {
  'Asset vs. Liability': ['PPE', 'LEASE', 'INV', 'INVEST', 'EQUITY', 'INTANG', 'SW', 'CONT'],
  'Valuation':           ['TAX', 'CF', 'CHANGE', 'CONSOL', 'NFP', 'VAL'],
  'Financial Ratios':    ['EPS', 'INT', 'ANNUITY', 'REV', 'PART'],
  'Required Disclosures':['TBS'],
}

const SIDEBAR_TABS = [
  { key: 'Asset vs. Liability', icon: '⚖️' },
  { key: 'Valuation',           icon: '💰' },
  { key: 'Financial Ratios',    icon: '📊' },
  { key: 'Required Disclosures',icon: '📢' },
]

// ── Supabase ───────────────────────────────────────────────────
async function loadTopics(): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from(DB.TABLES.TOPICS)
    .select('topic_id, topic_name, rule, trap, example')
    .eq('exam_section', 'FAR')
    .order('topic_id')
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(r => ({
    topicId: String(r.topic_id ?? ''),
    topicName: String(r.topic_name ?? ''),
    rule: r.rule ? String(r.rule) : null,
    trap: r.trap ? String(r.trap) : null,
    example: r.example ? String(r.example) : null,
  }))
}

async function saveFlashResult(userId: string, topicId: string, result: 'known' | 'confused') {
  await supabase.from(DB.TABLES.REVIEW_LOG).insert({
    user_id: userId,
    concept_id: null,
    topic_id: topicId,
    result,
    source: 'flashcard',
    reviewed_at: new Date().toISOString(),
  })
}

// ── Helpers ────────────────────────────────────────────────────
function categoryOf(topicId: string): string {
  return topicId.split('_')[0]
}

function pickDeck(allTopics: TopicRow[], tabKey: string): TopicRow[] {
  const cats = TAB_CATEGORIES[tabKey] ?? []
  const pool = allTopics.filter(t => cats.includes(categoryOf(t.topicId)))
  const source = pool.length > 0 ? pool : allTopics
  return [...source].sort(() => Math.random() - 0.5).slice(0, MAX_CARDS)
}

// ── Sub-components ─────────────────────────────────────────────

function RuleText({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trimStart()).filter(l => l.length > 0)
  return (
    <div style={{ lineHeight: 1.8, fontSize: 14 }}>
      {lines.map((line, i) => {
        const isJournal = line.startsWith('Dr.') || line.startsWith('Cr.')
        const isCr = line.startsWith('Cr.')
        if (isJournal) {
          return (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 13, paddingLeft: isCr ? 16 : 0 }}>
              {line}
            </div>
          )
        }
        return (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
            <span>{line}</span>
          </div>
        )
      })}
    </div>
  )
}

function TrapText({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trimStart()).filter(l => l.length > 0)
  return (
    <div style={{ lineHeight: 1.8, fontSize: 14 }}>
      {lines.map((line, i) => (
        <div key={i} style={{ fontWeight: i === 0 ? 700 : 400 }}>{line}</div>
      ))}
    </div>
  )
}

function ExampleText({ text }: { text: string }) {
  return (
    <div style={{ lineHeight: 1.8, fontSize: 14 }}>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trimStart()
        const isJournal = trimmed.startsWith('Dr.') || trimmed.startsWith('Cr.')
        const isCr = trimmed.startsWith('Cr.')
        if (isJournal) {
          return (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 13, paddingLeft: isCr ? 16 : 0 }}>
              {trimmed}
            </div>
          )
        }
        // Highlight numbers (integers and decimals, possibly with commas)
        const parts = trimmed.split(/(\$?[\d,]+(?:\.\d+)?%?)/)
        return (
          <div key={i}>
            {parts.map((part, j) =>
              /^\$?[\d,]+(?:\.\d+)?%?$/.test(part) && /\d/.test(part) ? (
                <span key={j} style={{ fontWeight: 600, color: '#534AB7', fontFamily: 'monospace' }}>{part}</span>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProgressDots({ total, current, results }: {
  total: number; current: number; results: (FlashResult | null)[]
}) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i]
        const done = r !== null && r !== undefined
        const isKnown = r?.result === 'known'
        const isCurrent = i === current
        return (
          <div key={i} className="rounded-full transition-all duration-300" style={{
            width: isCurrent ? 12 : 8,
            height: isCurrent ? 12 : 8,
            background: done ? (isKnown ? '#22c55e' : '#ef4444') : isCurrent ? '#4f6ef7' : '#e2e8f0',
            boxShadow: isCurrent ? '0 0 0 3px rgba(79,110,247,0.25)' : 'none',
          }} />
        )
      })}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function ConceptNotesPage() {
  const userId = useStudyStore((s) => s.userId)
  const [allTopics, setAllTopics] = useState<TopicRow[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('menu')
  const [deck, setDeck] = useState<TopicRow[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<(FlashResult | null)[]>([])
  const [confusedItems, setConfusedItems] = useState<TopicRow[]>([])

  useEffect(() => { loadTopics().then(setAllTopics) }, [])

  const startQuiz = (tabKey: string) => {
    const picked = pickDeck(allTopics, tabKey)
    if (picked.length === 0) return
    setActiveTab(tabKey)
    setDeck(picked)
    setIndex(0)
    setRevealed(false)
    setResults(new Array(picked.length).fill(null))
    setConfusedItems([])
    setPhase('quiz')
  }

  const advance = (nextIdx: number) => {
    if (nextIdx >= deck.length) {
      setPhase('result')
    } else {
      setIndex(nextIdx)
      setRevealed(false)
    }
  }

  const handleRate = (result: 'known' | 'confused') => {
    const topic = deck[index]
    if (!topic) return
    const newResults = [...results]
    newResults[index] = { topic, result }
    setResults(newResults)
    if (result === 'confused') setConfusedItems(prev => [...prev, topic])
    if (userId) void saveFlashResult(userId, topic.topicId, result)
    advance(index + 1)
  }

  const handleSkip = () => advance(index + 1)

  const topic = deck[index]
  const known = results.filter(r => r?.result === 'known').length

  const sidebarNav = (
    <nav className="flex flex-col gap-1 p-3">
      {SIDEBAR_TABS.map(tab => {
        const active = activeTab === tab.key && phase !== 'menu'
        return (
          <button key={tab.key}
            onClick={() => startQuiz(tab.key)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors"
            style={{
              background: active ? '#eef2ff' : 'transparent',
              color: active ? '#4f6ef7' : '#475569',
              fontWeight: active ? 600 : 400,
            }}>
            <span>{tab.icon}</span>
            <span>{tab.key}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 bg-white"
        style={{ width: 196, borderRight: '1.5px solid #e2e8f0' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">📑 개념노트</p>
        </div>
        {sidebarNav}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-3 pt-3 pb-2 bg-white shrink-0"
          style={{ borderBottom: '1.5px solid #e2e8f0' }}>
          {SIDEBAR_TABS.map(tab => {
            const active = activeTab === tab.key && phase !== 'menu'
            return (
              <button key={tab.key}
                onClick={() => startQuiz(tab.key)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: active ? '#4f6ef7' : '#f1f5f9',
                  color: active ? 'white' : '#475569',
                }}>
                {tab.icon} {tab.key}
              </button>
            )
          })}
        </div>

        {/* ── Menu ── */}
        {phase === 'menu' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3 px-6">
              <div className="text-4xl">📑</div>
              <p className="text-sm font-semibold text-[#0f172a]">카테고리를 선택해 플래시카드를 시작하세요</p>
              <p className="text-xs text-muted">최대 {MAX_CARDS}장 랜덤</p>
            </div>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === 'quiz' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Header row: dots + counter */}
                <div className="flex items-center justify-between">
                  <ProgressDots total={deck.length} current={index} results={results} />
                  <span className="text-xs text-muted">{index + 1} / {deck.length}</span>
                </div>

                {/* Category badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#eff6ff', color: '#4f6ef7' }}>
                    {topic?.topicId}
                  </span>
                  <span className="text-xs text-muted truncate">{activeTab}</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-card border border-border" style={{ padding: 24 }}>
                  {/* Front: topic name */}
                  <p className="leading-snug" style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                    {topic?.topicName}
                  </p>

                  {/* Reveal button */}
                  {!revealed && (
                    <button
                      onClick={() => setRevealed(true)}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-colors"
                      style={{ background: '#eff6ff', color: '#4f6ef7' }}
                    >
                      Reveal RULE →
                    </button>
                  )}

                  {/* Revealed: RULE + TRAP + Next */}
                  {revealed && topic && (
                    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {topic.rule && (
                        <div className="rounded-xl p-3"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">RULE</div>
                          <RuleText text={topic.rule} />
                        </div>
                      )}
                      {topic.trap && (
                        <div className="rounded-xl p-3"
                          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">TRAP ⚠️</div>
                          <TrapText text={topic.trap} />
                        </div>
                      )}
                      {topic.example && (
                        <div className="rounded-xl p-3"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">EXAMPLE</div>
                          <ExampleText text={topic.example} />
                        </div>
                      )}
                      <button
                        onClick={handleSkip}
                        className="w-full py-3.5 rounded-2xl text-white font-bold animate-slideUp"
                        style={{ background: '#4f6ef7' }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom bar: ✕ Don't know | ✓ Got it */}
            <div className="shrink-0 px-4 pb-4 pt-2 bg-[#f0f4f8]"
              style={{ borderTop: '1px solid #e2e8f0' }}>
              <div className="max-w-lg mx-auto flex gap-3">
                <button
                  onClick={() => handleRate('confused')}
                  className="flex-1 py-4 rounded-2xl text-base font-black active:scale-95 transition-transform"
                  style={{ background: '#fef2f2', border: '2px solid #fca5a5', color: '#dc2626' }}
                >
                  ✕ Don't know
                </button>
                <button
                  onClick={() => handleRate('known')}
                  className="flex-1 py-4 rounded-2xl text-base font-black active:scale-95 transition-transform"
                  style={{ background: '#f0fdf4', border: '2px solid #86efac', color: '#16a34a' }}
                >
                  ✓ Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Result ── */}
        {phase === 'result' && (
          <div className="flex-1 overflow-auto">
            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

              {/* Score header */}
              <div
                className="rounded-2xl p-6 text-center text-white shadow-lg"
                style={{
                  background: known >= deck.length * 0.8
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                }}
              >
                <div className="text-5xl font-black mb-1">
                  {known}<span className="text-2xl opacity-70">/{deck.length}</span>
                </div>
                <div className="text-white/80 text-sm">
                  {deck.length > 0 ? Math.round((known / deck.length) * 100) : 0}% Got it
                </div>
              </div>

              {/* Confused list */}
              {confusedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider px-1">
                    Review Needed
                  </div>
                  {confusedItems.map(t => (
                    <div key={t.topicId} className="bg-white rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center gap-3 p-3.5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: '#fef2f2', color: '#b91c1c' }}>✗</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#eff6ff', color: '#4f6ef7' }}>
                              {t.topicId}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[#0f172a]">{t.topicName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pb-6">
                <button
                  onClick={() => { setPhase('menu'); setActiveTab(null) }}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold border border-border bg-white text-[#64748b]"
                >
                  Back
                </button>
                <button
                  onClick={() => activeTab && startQuiz(activeTab)}
                  className="py-3.5 px-6 rounded-2xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)', flex: 2 }}
                >
                  다시 {MAX_CARDS}장 ⚡
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
