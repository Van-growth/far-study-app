import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TX_GROUPS,
  TxGroup,
  TxItem,
  TxStage,
  StepId,
  JournalEntry,
  FsImpact,
  topicIdToCatId,
} from '../data/fs_transactions'

const NAVY = '#1a2744'
const BG = '#fafaf8'

// ── Metadata ──────────────────────────────────────────────────────────────────

const STEP_META: Record<StepId, { label: string; num: number; color: string; bg: string }> = {
  source:  { label: 'Source',  num: 1,  color: '#888780', bg: '#f3f3f0' },
  journal: { label: 'Journal', num: 2,  color: '#185FA5', bg: '#E6F1FB' },
  ledger:  { label: 'Ledger',  num: 3,  color: '#0369a1', bg: '#e0f2fe' },
  tb:      { label: 'Adj. TB', num: 4,  color: '#4f6ef7', bg: '#eef2ff' },
  is:      { label: 'I/S',     num: 5,  color: '#1D9E75', bg: '#E1F5EE' },
  oci:     { label: 'OCI',     num: 6,  color: '#534AB7', bg: '#EEEDFE' },
  se:      { label: 'S/E',     num: 7,  color: '#BA7517', bg: '#FAEEDA' },
  bs:      { label: 'B/S',     num: 8,  color: '#0f766e', bg: '#f0fdfa' },
  scf:     { label: 'SCF',     num: 9,  color: '#c2410c', bg: '#fff7ed' },
  notes:   { label: 'Notes',   num: 10, color: '#5F5E5A', bg: '#F1EFE8' },
}

const FS_IMPACT_META = [
  { key: 'is_ni',  label: 'I/S — NET INCOME',           color: '#1D9E75', bg: '#E1F5EE' },
  { key: 'is_oci', label: 'I/S — OCI',                  color: '#534AB7', bg: '#EEEDFE' },
  { key: 'bs',     label: 'BALANCE SHEET',               color: '#185FA5', bg: '#E6F1FB' },
  { key: 'se',     label: "STOCKHOLDERS' EQUITY",        color: '#993C1D', bg: '#FAECE7' },
  { key: 'cfo',    label: 'SCF — OPERATING ACTIVITIES',  color: '#BA7517', bg: '#FAEEDA' },
  { key: 'cfi',    label: 'SCF — INVESTING ACTIVITIES',  color: '#BA7517', bg: '#FFF8E6' },
  { key: 'cff',    label: 'SCF — FINANCING ACTIVITIES',  color: '#993C1D', bg: '#FAECE7' },
  { key: 'notes',  label: 'NOTES',                       color: '#5F5E5A', bg: '#F1EFE8' },
] as const

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const activeGroup = TX_GROUPS.find(g => g.items.some(i => i.id === selectedId))
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(activeGroup ? [activeGroup.id] : [TX_GROUPS[0]?.id ?? ''])
  )
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: '0.5px solid rgba(26,39,68,0.1)',
        background: 'white',
        overflowY: 'auto',
        padding: '12px 0',
      }}
    >
      {TX_GROUPS.map(group => {
        const isExpanded = expandedGroups.has(group.id)
        return (
          <div key={group.id} style={{ marginBottom: 2 }}>
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '7px 12px 7px 14px',
                background: 'transparent',
                border: 'none',
                borderLeft: `2.5px solid ${group.color}`,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: group.color,
                  textAlign: 'left',
                  lineHeight: 1.4,
                }}
              >
                {group.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: group.color,
                  opacity: 0.7,
                  flexShrink: 0,
                  marginLeft: 6,
                }}
              >
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>

            {isExpanded &&
              group.items.map(item => {
                const isActive = selectedId === item.id
                const isEmpty = item.stages.length === 0
                const isHovered = hoveredItem === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 12px 5px 20px',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: isActive ? group.color : isEmpty ? '#bbb' : '#374151',
                      background: isActive
                        ? `${group.color}14`
                        : isHovered
                        ? 'rgba(0,0,0,0.03)'
                        : 'transparent',
                      border: 'none',
                      borderRight: isActive
                        ? `2px solid ${group.color}`
                        : '2px solid transparent',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span>{item.label}</span>
                    {isEmpty && (
                      <span
                        style={{ fontSize: 10, color: '#ccc', marginLeft: 4, flexShrink: 0 }}
                      >
                        +
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        )
      })}
    </aside>
  )
}

// ── Step Visualizations ───────────────────────────────────────────────────────

function JournalViz({ entries }: { entries: JournalEntry[] }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 12.5,
        background: '#f8f9fc',
        border: '0.5px solid rgba(26,39,68,0.15)',
        borderRadius: 8,
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#888',
          fontWeight: 700,
          letterSpacing: 1,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>ACCOUNT</span>
        <span>DEBIT (CREDIT)</span>
      </div>
      {entries.map((e, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: i < entries.length - 1 ? 5 : 0,
            paddingLeft: e.type === 'cr' ? 24 : 0,
          }}
        >
          <span
            style={{
              color: e.type === 'dr' ? NAVY : '#4a5568',
              fontWeight: e.type === 'dr' ? 600 : 400,
            }}
          >
            {e.type === 'dr' ? 'Dr. ' : 'Cr. '}
            {e.account}
          </span>
          <span style={{ color: e.type === 'dr' ? NAVY : '#c2410c', fontWeight: 600 }}>
            {e.type === 'dr'
              ? `$${e.amount.toLocaleString()}`
              : `($${e.amount.toLocaleString()})`}
          </span>
        </div>
      ))}
    </div>
  )
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩']

function NotesViz({ note }: { note: string }) {
  const lines = note.split('\n').filter(l => l.trim())
  const farTBSLines = lines.filter(l => l.includes('FAR TBS'))
  const regularLines = lines.filter(l => !l.includes('FAR TBS'))

  return (
    <div>
      <div style={{ fontSize: 12, lineHeight: 1.8 }}>
        {regularLines.map((line, i) => (
          <div key={i} style={{ color: line.startsWith('⚠') ? '#c2410c' : '#333' }}>
            {CIRCLED[i] ?? `${i + 1}.`} {line.replace(/^[•\-]\s*/, '').trim()}
          </div>
        ))}
      </div>
      {farTBSLines.length > 0 && (
        <div
          style={{
            background: '#FAEEDA',
            borderRadius: 4,
            padding: '6px 8px',
            fontSize: 11,
            color: '#633806',
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          {farTBSLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function NoteLines({ note, hasEntries }: { note: string; hasEntries: boolean }) {
  return (
    <div style={{ marginBottom: hasEntries ? 10 : 0 }}>
      {note.split('\n').map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: line.startsWith('⚠') ? '#c2410c' : '#444',
            minHeight: line ? undefined : '0.4em',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

// ── StageCard (accordion) ─────────────────────────────────────────────────────

function StageCard({
  stage,
  isFirst,
}: {
  stage: TxStage
  isFirst: boolean
}) {
  const [isOpen, setIsOpen] = useState(isFirst)
  const meta = STEP_META[stage.step]

  const firstLine = stage.note.split('\n')[0] ?? ''
  const preview = firstLine.length > 60 ? firstLine.slice(0, 60) + '...' : firstLine

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {/* Left connector — numbered circle */}
      <div
        style={{
          width: 48,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: meta.color,
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {meta.num}
        </div>
      </div>

      {/* Accordion card */}
      <div
        style={{
          flex: 1,
          background: 'white',
          border: '0.5px solid rgba(26,39,68,0.1)',
          borderRadius: 8,
        }}
      >
        {/* Header — always visible, click to toggle */}
        <div
          onClick={() => setIsOpen(v => !v)}
          style={{
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            cursor: 'pointer',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                background: meta.bg,
                color: meta.color,
                border: `0.5px solid ${meta.color}40`,
              }}
            >
              {meta.label}
            </span>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginTop: 4 }}
            >
              {stage.label}
            </div>
            {!isOpen && preview && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                {preview}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 12,
              color: '#aaa',
              marginLeft: 8,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {isOpen ? '▾' : '▸'}
          </span>
        </div>

        {/* Body */}
        {isOpen && (
          <div
            style={{
              padding: '10px 14px 14px',
              borderTop: '0.5px solid rgba(26,39,68,0.06)',
            }}
          >
            {stage.step === 'notes' ? (
              <NotesViz note={stage.note} />
            ) : (
              <NoteLines note={stage.note} hasEntries={!!stage.entries?.length} />
            )}

            {stage.step === 'journal' && stage.entries && (
              <JournalViz entries={stage.entries} />
            )}

            {stage.trap && (
              <div
                style={{
                  background: '#FAECE7',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontSize: 11,
                  color: '#993C1D',
                  marginTop: 8,
                  lineHeight: 1.6,
                }}
              >
                ⚠ {stage.trap}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CenterPanel ───────────────────────────────────────────────────────────────

function CenterPanel({
  item,
  group,
  onGoToConcept,
}: {
  item: TxItem | null
  group: TxGroup | null
  onGoToConcept: (topicId: string) => void
}) {
  if (!item) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          fontSize: 14,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>←</div>
          <div>Select a transaction from the left</div>
        </div>
      </div>
    )
  }

  if (item.stages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🚧</div>
          <div
            style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 8 }}
          >
            {item.label}
          </div>
          <div
            style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}
          >
            Step-by-step flow coming soon.
          </div>
          <button
            onClick={() => onGoToConcept(item.topicId)}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: `1.5px solid ${group?.color ?? NAVY}`,
              color: group?.color ?? NAVY,
              background: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            View related concept →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Item header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: `${group?.color ?? NAVY}18`,
              color: group?.color ?? NAVY,
            }}
          >
            {group?.label}
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#aaa',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {item.topicId}
          </span>
        </div>
        <div
          style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginTop: 6 }}
        >
          {item.label}
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
          {item.stages.length} steps ·{' '}
          {item.stages.map(s => STEP_META[s.step].label).join(' → ')}
        </div>
      </div>

      {/* Stage flow with background vertical connector */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 23,
            top: 14,
            bottom: 14,
            width: 1,
            background: '#e5e7eb',
            zIndex: 0,
          }}
        />

        {item.stages.map((stage, i) => (
          <div key={stage.step} style={{ marginBottom: 8 }}>
            <StageCard stage={stage} isFirst={i === 0} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── RightPanel ────────────────────────────────────────────────────────────────

function RightPanel({
  item,
  onGoToConcept,
}: {
  item: TxItem | null
  onGoToConcept: (topicId: string) => void
}) {
  const hasStages = !!(item && item.stages.length > 0)
  const hasImpact =
    hasStages &&
    FS_IMPACT_META.some(f => item!.fsImpact[f.key as keyof FsImpact])

  return (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        borderLeft: '0.5px solid rgba(26,39,68,0.1)',
        background: 'white',
        padding: '20px 16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#888',
          letterSpacing: 1.5,
          marginBottom: 14,
        }}
      >
        F/S IMPACT
      </div>

      {!item ? (
        <div
          style={{
            fontSize: 12,
            color: '#ccc',
            textAlign: 'center',
            marginTop: 40,
            lineHeight: 1.6,
          }}
        >
          Select a transaction
          <br />
          to see F/S impact
        </div>
      ) : !hasStages ? (
        <div
          style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 20 }}
        >
          Coming soon
        </div>
      ) : !hasImpact ? (
        <div
          style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 20 }}
        >
          No data
        </div>
      ) : (
        <div>
          {FS_IMPACT_META.map(f => {
            const val = item!.fsImpact[f.key as keyof FsImpact]
            if (!val) return null
            return (
              <div
                key={f.key}
                style={{
                  borderLeft: `4px solid ${f.color}`,
                  background: f.bg,
                  borderRadius: 6,
                  padding: '9px 11px',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: f.color,
                    letterSpacing: 0.8,
                    marginBottom: 5,
                  }}
                >
                  {f.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#333',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {val}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasStages && item && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 16,
            borderTop: '0.5px solid rgba(26,39,68,0.08)',
          }}
        >
          <button
            onClick={() => onGoToConcept(item.topicId)}
            style={{
              width: '100%',
              padding: 9,
              borderRadius: 7,
              background: NAVY,
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              marginBottom: 6,
              fontFamily: 'inherit',
            }}
          >
            View concept detail →
          </button>
          <button
            style={{
              width: '100%',
              padding: 9,
              borderRadius: 7,
              background: 'white',
              color: NAVY,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(26,39,68,0.2)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Related practice questions →
          </button>
        </div>
      )}
    </aside>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FSMapPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem =
    TX_GROUPS.flatMap(g => g.items).find(i => i.id === selectedId) ?? null
  const selectedGroup =
    TX_GROUPS.find(g => g.items.some(i => i.id === selectedId)) ?? null

  function handleGoToConcept(topicId: string) {
    const catId = topicIdToCatId(topicId)
    navigate(`/concept-notes?cat=${catId}&topic=${topicId}`)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: BG,
      }}
    >
      {/* Page header */}
      <div
        style={{
          height: 40,
          flexShrink: 0,
          background: 'white',
          borderBottom: '0.5px solid rgba(26,39,68,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 20,
          paddingRight: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>F/S Map</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>
            Transaction to Financial Statements
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            color: '#bbb',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 0.3,
          }}
        >
          Source → Journal → Ledger → TB → I/S → S/E → B/S → SCF → Notes
        </span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        <CenterPanel
          item={selectedItem}
          group={selectedGroup}
          onGoToConcept={handleGoToConcept}
        />
        <RightPanel item={selectedItem} onGoToConcept={handleGoToConcept} />
      </div>
    </div>
  )
}
