import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TX_GROUPS,
  TxGroup,
  TxItem,
  TxStage,
  StepId,
  FsImpact,
  topicIdToCatId,
} from '../data/fs_transactions'

// ── Color constants ───────────────────────────────────────────────────────────

const C = {
  cream:         '#fafaf8',
  navy:          '#1a2744',
  navyLight:     '#2a3a5c',
  border:        'rgba(26,39,68,0.12)',
  borderStrong:  'rgba(26,39,68,0.25)',
  textPrimary:   '#1a2744',
  textSecondary: '#4a5568',
  textTertiary:  '#9aa3b0',
  teal:          '#0f6e56',
  tealLight:     '#e1f5ee',
  coral:         '#993c1d',
  coralLight:    '#faece7',
  purple:        '#3c3489',
  purpleLight:   '#eeedfe',
  amber:         '#633806',
  amberLight:    '#faeeda',
  blue:          '#0c447c',
  blueLight:     '#e6f1fb',
  grayLight:     '#f1efe8',
}

// ── Stage badge / dot colors ──────────────────────────────────────────────────

const BADGE_META: Record<StepId, {
  bg: string; color: string; dotColor: string
  shortLabel: string; subLabel: string
}> = {
  source:  { bg: '#D3D1C7', color: '#2C2C2A', dotColor: '#888780', shortLabel: 'Source',        subLabel: 'Event'     },
  journal: { bg: '#B5D4F4', color: '#042C53', dotColor: '#378ADD', shortLabel: 'Journal',       subLabel: 'Entry'     },
  ledger:  { bg: '#C0DD97', color: '#173404', dotColor: '#639922', shortLabel: 'Ledger',        subLabel: 'T-accounts'},
  tb:      { bg: '#FAC775', color: '#412402', dotColor: '#EF9F27', shortLabel: 'Trial Balance', subLabel: 'Adj. TB'   },
  is:      { bg: '#9FE1CB', color: '#04342C', dotColor: '#1D9E75', shortLabel: 'I/S + CI',      subLabel: '1st F/S'   },
  oci:     { bg: '#CECBF6', color: '#26215C', dotColor: '#534AB7', shortLabel: 'OCI',           subLabel: '2nd F/S'   },
  se:      { bg: '#F5C4B3', color: '#4A1B0C', dotColor: '#D85A30', shortLabel: 'S/E',           subLabel: '3rd F/S'   },
  bs:      { bg: '#CECBF6', color: '#26215C', dotColor: '#534AB7', shortLabel: 'B/S',           subLabel: '4th F/S'   },
  scf:     { bg: '#FAC775', color: '#412402', dotColor: '#BA7517', shortLabel: 'SCF',           subLabel: '5th F/S'   },
  notes:   { bg: '#C0DD97', color: '#173404', dotColor: '#639922', shortLabel: 'Notes',         subLabel: 'Disclosure'},
}

// ── F/S Impact panel metadata ─────────────────────────────────────────────────

const FSP_META = [
  { key: 'is_ni',  label: 'I/S — NET INCOME',           bg: C.tealLight,   borderLeft: '3px solid #1D9E75', labelColor: '#0f6e56' },
  { key: 'is_oci', label: 'I/S — OCI',                  bg: C.purpleLight, borderLeft: '3px solid #534AB7', labelColor: '#3c3489' },
  { key: 'bs',     label: 'BALANCE SHEET',               bg: C.blueLight,   borderLeft: '3px solid #185FA5', labelColor: '#0c447c' },
  { key: 'se',     label: "STOCKHOLDERS' EQUITY",        bg: C.coralLight,  borderLeft: '3px solid #D85A30', labelColor: '#993c1d' },
  { key: 'cfo',    label: 'SCF — OPERATING ACTIVITIES',  bg: C.amberLight,  borderLeft: '3px solid #BA7517', labelColor: '#633806' },
  { key: 'cfi',    label: 'SCF — INVESTING ACTIVITIES',  bg: '#fff8e6',     borderLeft: '3px solid #BA7517', labelColor: '#633806' },
  { key: 'cff',    label: 'SCF — FINANCING ACTIVITIES',  bg: C.coralLight,  borderLeft: '3px solid #993C1D', labelColor: '#993c1d' },
  { key: 'notes',  label: 'NOTES',                       bg: C.grayLight,   borderLeft: '3px solid #5F5E5A', labelColor: '#5F5E5A' },
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
  const [hoveredId, setHoveredId] = useState<string | null>(null)

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
      width: 200,
      flexShrink: 0,
      borderRight: `1px solid ${C.border}`,
      background: 'white',
      overflowY: 'auto',
      padding: '12px 0',
    }}>
      {TX_GROUPS.map(group => {
        const isExpanded = expandedGroups.has(group.id)
        return (
          <div key={group.id}>
            <div
              onClick={() => toggleGroup(group.id)}
              style={{
                padding: '10px 16px 4px',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: C.textTertiary,
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                userSelect: 'none',
              }}
            >
              <span>{group.label}</span>
              <span style={{ fontSize: 9, opacity: 0.7 }}>{isExpanded ? '▾' : '▸'}</span>
            </div>

            {isExpanded && group.items.map(item => {
              const isActive = selectedId === item.id
              const isEmpty = item.stages.length === 0
              const isHovered = hoveredId === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '7px 16px',
                    fontSize: 12,
                    color: isActive ? C.teal : isEmpty ? '#bbb' : C.textSecondary,
                    background: isActive ? C.tealLight : isHovered ? C.grayLight : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? `2px solid ${C.teal}` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all .1s',
                  }}
                >
                  {item.label}
                </div>
              )
            })}
          </div>
        )
      })}
    </aside>
  )
}

// ── Drill Panel ───────────────────────────────────────────────────────────────

function DrillPanel({ stage }: { stage: TxStage }) {
  const drill = stage.drill

  const panelStyle: React.CSSProperties = {
    margin: '2px 0 4px 96px',
    borderRadius: 8,
    border: `0.5px solid ${C.border}`,
    padding: '12px 14px',
    background: C.cream,
    fontSize: 11,
  }
  const titleStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: C.textPrimary,
    marginBottom: 8,
  }
  const trapStyle: React.CSSProperties = {
    fontSize: 11,
    color: C.coral,
    background: C.coralLight,
    padding: '6px 10px',
    borderRadius: 4,
    marginTop: 6,
    lineHeight: 1.5,
  }

  if (!drill) {
    return (
      <div style={panelStyle}>
        <div style={titleStyle}>{stage.label}</div>
        <div style={{ color: C.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {stage.note}
        </div>
        {stage.trap && <div style={trapStyle}>⚠ {stage.trap}</div>}
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>{drill.title}</div>

      {drill.je && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6 }}>
          <thead>
            <tr>
              {(['Account', 'Debit(Credit)', 'Reason'] as const).map(h => (
                <th key={h} style={{
                  fontSize: 10,
                  color: C.textTertiary,
                  fontWeight: 500,
                  padding: '3px 6px',
                  borderBottom: `1px solid ${C.border}`,
                  textAlign: 'left',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drill.je.map((row, i) => (
              <tr key={i}>
                <td style={{
                  padding: '3px 6px',
                  paddingLeft: row.type === 'cr' ? 18 : 6,
                  fontWeight: row.type === 'dr' ? 600 : 400,
                  color: row.type === 'dr' ? C.textPrimary : C.textSecondary,
                }}>
                  {row.acct}
                </td>
                <td style={{
                  padding: '3px 6px',
                  fontWeight: 700,
                  color: row.signClass === 'sign-positive' ? C.teal : C.coral,
                }}>
                  {row.sign}
                </td>
                <td style={{ padding: '3px 6px', fontSize: 10, color: C.textTertiary }}>
                  {row.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {drill.custom && (
        <div dangerouslySetInnerHTML={{ __html: drill.custom }} />
      )}

      {drill.trap && <div style={trapStyle}>⚠ {drill.trap}</div>}

      {drill.note && (
        <div style={{
          fontSize: 11,
          color: C.textSecondary,
          background: C.grayLight,
          padding: '6px 10px',
          borderRadius: 4,
          marginTop: 4,
          lineHeight: 1.5,
        }}>
          {drill.note}
        </div>
      )}
    </div>
  )
}

// ── StageCard ─────────────────────────────────────────────────────────────────

function StageCard({
  stage,
  index,
  isActive,
  onClick,
}: {
  stage: TxStage
  index: number
  isActive: boolean
  onClick: () => void
}) {
  const meta = BADGE_META[stage.step]
  const firstLine = stage.note.split('\n')[0] ?? ''
  const sub = firstLine.length > 85 ? firstLine.slice(0, 85) + '…' : firstLine

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: 2, position: 'relative' }}>
      {/* Left: numbered badge + step label */}
      <div style={{
        width: 80,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-start',
        padding: '10px 8px 10px 0',
        gap: 6,
      }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: meta.bg,
          color: meta.color,
          fontSize: 10,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{
          fontSize: 9,
          color: C.textTertiary,
          fontWeight: 500,
          lineHeight: 1.3,
          paddingTop: 2,
        }}>
          {meta.shortLabel}<br />
          <span style={{ fontWeight: 400 }}>{meta.subLabel}</span>
        </div>
      </div>

      {/* Connector: vertical line + dot */}
      <div style={{
        width: 16,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 1,
          background: C.border,
          transform: 'translateX(-50%)',
        }} />
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          border: `1.5px solid ${meta.dotColor}`,
          background: 'white',
          position: 'relative',
          zIndex: 1,
          marginTop: 14,
          flexShrink: 0,
        }} />
      </div>

      {/* Card: title + sub */}
      <div
        onClick={onClick}
        style={{
          flex: 1,
          borderRadius: 8,
          border: isActive ? `1.5px solid ${meta.dotColor}` : `0.5px solid ${C.border}`,
          padding: '10px 14px',
          background: 'white',
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>
          {stage.label}
        </div>
        <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.4 }}>
          {sub}
        </div>
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
  const [openDrillIdx, setOpenDrillIdx] = useState<number | null>(null)

  useEffect(() => {
    setOpenDrillIdx(null)
  }, [item?.id])

  function toggleDrill(i: number) {
    setOpenDrillIdx(prev => (prev === i ? null : i))
  }

  if (!item) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.textTertiary,
        fontSize: 14,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>←</div>
          <div>Select a transaction from the left</div>
        </div>
      </div>
    )
  }

  if (item.stages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
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
              border: `1.5px solid ${group?.color ?? C.navy}`,
              color: group?.color ?? C.navy,
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 16 }}>
        {item.label}
      </div>

      {item.stages.map((stage, i) => (
        <div key={stage.step}>
          {i > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              margin: '1px 0 1px 96px',
              fontSize: 10,
              color: C.textTertiary,
            }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span>↓</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
          )}
          <StageCard
            stage={stage}
            index={i}
            isActive={openDrillIdx === i}
            onClick={() => toggleDrill(i)}
          />
          {openDrillIdx === i && <DrillPanel stage={stage} />}
        </div>
      ))}
    </div>
  )
}

// ── RightPanel ────────────────────────────────────────────────────────────────

function RightPanel({
  item,
  onGoToConcept,
  onGoToPractice,
}: {
  item: TxItem | null
  onGoToConcept: (topicId: string) => void
  onGoToPractice: (topicId: string) => void
}) {
  const hasStages = !!(item && item.stages.length > 0)

  return (
    <aside style={{
      width: 260,
      flexShrink: 0,
      borderLeft: `1px solid ${C.border}`,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: `1px solid ${C.border}`,
        fontSize: 12,
        fontWeight: 700,
        color: C.textPrimary,
        lineHeight: 1.4,
      }}>
        {item ? item.label : 'Select a transaction'}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {!item ? (
          <div style={{ fontSize: 11, color: C.textTertiary, paddingTop: 8, lineHeight: 1.6 }}>
            Select a transaction from the left<br />
            to see F/S impact.
          </div>
        ) : !hasStages ? (
          <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 20 }}>
            Coming soon
          </div>
        ) : (
          FSP_META.map(f => {
            const val = item.fsImpact[f.key as keyof FsImpact]
            if (!val) return null
            return (
              <div
                key={f.key}
                style={{
                  borderRadius: 6,
                  border: `0.5px solid ${C.border}`,
                  borderLeft: f.borderLeft,
                  background: f.bg,
                  padding: '8px 10px',
                  marginBottom: 4,
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: f.labelColor,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary }}>
                  {val}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Nav buttons */}
      {hasStages && item && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <button
            onClick={() => onGoToConcept(item.topicId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              border: `0.5px solid ${C.navy}`,
              background: C.navy,
              color: 'white',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>View concept detail</span>
            <span>→</span>
          </button>
          <button
            onClick={() => onGoToPractice(item.topicId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              border: `0.5px solid ${C.border}`,
              background: 'white',
              color: C.textPrimary,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Related practice questions</span>
            <span>→</span>
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

  const selectedItem = TX_GROUPS.flatMap(g => g.items).find(i => i.id === selectedId) ?? null
  const selectedGroup = TX_GROUPS.find(g => g.items.some(i => i.id === selectedId)) ?? null

  function handleGoToConcept(topicId: string) {
    navigate(`/concept-notes?cat=${topicIdToCatId(topicId)}&topic=${topicId}`)
  }

  function handleGoToPractice(topicId: string) {
    navigate(`/review?topic=${topicId.split('_')[0]}`)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: C.cream,
    }}>
      {/* Page header */}
      <div style={{
        padding: '14px 24px 12px',
        background: 'white',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>
          F/S Map — Transaction to Financial Statements
        </div>
        <div style={{ fontSize: 11, color: C.textSecondary }}>
          Select a transaction → Source → Journal → Ledger → Trial Balance → I/S → S/E → B/S → SCF → Notes
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar selectedId={selectedId} onSelect={setSelectedId} />
        <CenterPanel
          item={selectedItem}
          group={selectedGroup}
          onGoToConcept={handleGoToConcept}
        />
        <RightPanel
          item={selectedItem}
          onGoToConcept={handleGoToConcept}
          onGoToPractice={handleGoToPractice}
        />
      </div>
    </div>
  )
}
