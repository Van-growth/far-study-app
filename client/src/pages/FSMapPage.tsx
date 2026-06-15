import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TX_GROUPS, TxGroup, TxItem, TxStage, StepId, JournalEntry, topicIdToCatId } from '../data/fs_transactions'

// ── Constants ─────────────────────────────────────────────────────────────────
const NAVY = '#1a2744'

// 10-step accounting cycle metadata
const STEP_META: Record<StepId, { label: string; color: string; bg: string }> = {
  source:  { label: 'Source',    color: '#5F5E5A', bg: '#f3f3f0' },
  journal: { label: 'Journal',   color: '#185FA5', bg: '#eff6ff' },
  ledger:  { label: 'Ledger',    color: '#0369a1', bg: '#e0f2fe' },
  tb:      { label: 'Adj. TB',   color: '#4f6ef7', bg: '#eef2ff' },
  is:      { label: 'I/S',       color: '#1D9E75', bg: '#ecfdf5' },
  oci:     { label: 'OCI',       color: '#534AB7', bg: '#f0eeff' },
  se:      { label: 'S/E',       color: '#BA7517', bg: '#fffbeb' },
  bs:      { label: 'B/S',       color: '#0f766e', bg: '#f0fdfa' },
  scf:     { label: 'SCF',       color: '#c2410c', bg: '#fff7ed' },
  notes:   { label: 'Notes',     color: '#5F5E5A', bg: '#f3f3f0' },
}

interface FsImpactLabel {
  key: keyof TxItem['fsImpact']
  label: string
  color: string
  bg: string
  border: string
}

const FS_IMPACT_LABELS: FsImpactLabel[] = [
  { key: 'is_ni',  label: 'I/S — Net Income',          color: '#1D9E75', bg: '#E1F5EE', border: '#1D9E75' },
  { key: 'is_oci', label: 'I/S — OCI',                 color: '#534AB7', bg: '#EEEDFE', border: '#534AB7' },
  { key: 'bs',     label: 'Balance Sheet',              color: '#185FA5', bg: '#E6F1FB', border: '#185FA5' },
  { key: 'se',     label: "Stockholders' Equity",       color: '#993C1D', bg: '#FAECE7', border: '#993C1D' },
  { key: 'cfo',    label: 'SCF — Operating Activities', color: '#BA7517', bg: '#FAEEDA', border: '#BA7517' },
  { key: 'cfi',    label: 'SCF — Investing Activities', color: '#BA7517', bg: '#FFF8E6', border: '#BA7517' },
  { key: 'cff',    label: 'SCF — Financing Activities', color: '#993C1D', bg: '#FAECE7', border: '#993C1D' },
  { key: 'notes',  label: 'Notes',                      color: '#5F5E5A', bg: '#F1EFE8', border: '#5F5E5A' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBadge({ step }: { step: StepId }) {
  const meta = STEP_META[step]
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.color}40`,
      letterSpacing: 0.3,
    }}>
      {meta.label}
    </span>
  )
}

function JournalEntryTable({ entries }: { entries: JournalEntry[] }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5,
      background: '#f8f9fc',
      border: '0.5px solid rgba(26,39,68,0.15)',
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 10,
    }}>
      <div style={{
        fontSize: 10, color: '#888', fontWeight: 700,
        letterSpacing: 1, marginBottom: 8,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>ACCOUNT</span>
        <span>DEBIT (CREDIT)</span>
      </div>
      {entries.map((e, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: i < entries.length - 1 ? 5 : 0,
          paddingLeft: e.type === 'cr' ? 24 : 0,
        }}>
          <span style={{
            color: e.type === 'dr' ? NAVY : '#4a5568',
            fontWeight: e.type === 'dr' ? 600 : 400,
          }}>
            {e.type === 'dr' ? 'Dr. ' : 'Cr. '}{e.account}
          </span>
          <span style={{
            color: e.type === 'dr' ? NAVY : '#4a5568',
            fontWeight: 600,
          }}>
            {e.type === 'dr'
              ? `$${e.amount.toLocaleString()}`
              : `($${e.amount.toLocaleString()})`}
          </span>
        </div>
      ))}
    </div>
  )
}

function StageCard({ stage }: { stage: TxStage }) {
  const meta = STEP_META[stage.step]
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid rgba(26,39,68,0.12)',
      borderLeft: `3px solid ${meta.color}`,
      borderRadius: 10,
      padding: '14px 18px',
    }}>
      <StepBadge step={stage.step} />
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: '#555' }}>
        {stage.label}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {stage.note}
      </div>
      {stage.entries && stage.entries.length > 0 && (
        <JournalEntryTable entries={stage.entries} />
      )}
    </div>
  )
}

// ── Left Sidebar ──────────────────────────────────────────────────────────────

function Sidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const activeGroup = TX_GROUPS.find(g => g.items.some(i => i.id === selectedId))
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(activeGroup ? [activeGroup.id] : [TX_GROUPS[0].id])
  )

  function toggleGroup(groupId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      borderRight: '0.5px solid rgba(26,39,68,0.12)',
      background: '#fff',
      overflowY: 'auto',
      padding: '12px 0',
    }}>
      {TX_GROUPS.map(group => {
        const isExpanded = expandedGroups.has(group.id)
        return (
          <div key={group.id} style={{ marginBottom: 4 }}>
            {/* Group header — collapsible */}
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 14px',
                background: 'transparent',
                border: 'none',
                borderLeft: `2.5px solid ${group.color}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: group.color, textAlign: 'left' }}>
                {group.label}
              </span>
              <span style={{ fontSize: 10, color: group.color, opacity: 0.7, flexShrink: 0, marginLeft: 6 }}>
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>

            {/* Group items */}
            {isExpanded && group.items.map(item => {
              const isActive = selectedId === item.id
              const isEmpty = item.stages.length === 0
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 14px 5px 22px',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: isActive ? group.color : isEmpty ? '#bbb' : '#374151',
                    background: isActive ? `${group.color}12` : 'transparent',
                    border: 'none',
                    borderRight: isActive ? `2px solid ${group.color}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                >
                  {item.label}
                  {isEmpty && (
                    <span style={{ fontSize: 10, color: '#ccc', marginLeft: 4 }}>+</span>
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

// ── Center Content Panel ──────────────────────────────────────────────────────

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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.4 }}>←</div>
          <div style={{ fontWeight: 500 }}>Select a transaction type from the left</div>
          <div style={{ fontSize: 12, marginTop: 8, color: '#ccc', lineHeight: 1.6 }}>
            Source → Journal → Ledger → TB → I/S → S/E → B/S → SCF → Notes
          </div>
        </div>
      </div>
    )
  }

  if (item.stages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: `${group?.color ?? NAVY}18`,
            color: group?.color ?? NAVY,
          }}>
            {group?.label}
          </span>
          <span style={{ fontSize: 11, color: '#aaa', fontFamily: "'JetBrains Mono', monospace" }}>
            {item.topicId}
          </span>
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: NAVY, margin: 0 }}>{item.label}</h2>
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
          {item.stages.length} steps · {item.stages.map(s => STEP_META[s.step].label).join(' → ')}
        </div>
      </div>

      {/* Stage flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {item.stages.map((stage, i) => (
          <div key={stage.step}>
            <StageCard stage={stage} />
            {i < item.stages.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2, color: '#ddd', fontSize: 16 }}>
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Right F/S Impact Panel ────────────────────────────────────────────────────

function RightPanel({ item }: { item: TxItem | null }) {
  const isEmpty = !item || item.stages.length === 0
  const hasImpact = item ? FS_IMPACT_LABELS.some(f => item.fsImpact[f.key]) : false

  return (
    <aside style={{
      width: 268,
      flexShrink: 0,
      borderLeft: '0.5px solid rgba(26,39,68,0.12)',
      background: '#fff',
      padding: '20px 16px',
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#888',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
      }}>
        F/S Impact
      </div>

      {isEmpty ? (
        <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
          Select a transaction<br />to see F/S impact
        </div>
      ) : !hasImpact ? (
        <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 20 }}>No data</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {FS_IMPACT_LABELS.map(f => {
            const val = item!.fsImpact[f.key]
            if (!val) return null
            return (
              <div key={f.key} style={{
                background: f.bg,
                borderLeft: `4px solid ${f.border}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: f.color,
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
                }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {val}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FSMapPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem = TX_GROUPS.flatMap(g => g.items).find(i => i.id === selectedId) ?? null
  const selectedGroup = TX_GROUPS.find(g => g.items.some(i => i.id === selectedId)) ?? null

  const totalItems = TX_GROUPS.reduce((s, g) => s + g.items.length, 0)

  function handleGoToConcept(topicId: string) {
    const catId = topicIdToCatId(topicId)
    navigate(`/concept-notes?cat=${catId}&topic=${topicId}`)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: '#fafaf8',
    }}>
      {/* Page header */}
      <div style={{
        height: 48,
        flexShrink: 0,
        background: '#fff',
        borderBottom: '0.5px solid rgba(26,39,68,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
          F/S Map — Transaction to Financial Statements
        </span>
        <span style={{ fontSize: 11, color: '#bbb' }}>
          {totalItems} transaction types
        </span>
        <span style={{ fontSize: 11, color: '#ccc', marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          Source → Journal → Ledger → TB → I/S → S/E → B/S → SCF → Notes
        </span>
      </div>

      {/* Three-panel body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        <CenterPanel
          item={selectedItem}
          group={selectedGroup}
          onGoToConcept={handleGoToConcept}
        />
        <RightPanel item={selectedItem} />
      </div>
    </div>
  )
}
