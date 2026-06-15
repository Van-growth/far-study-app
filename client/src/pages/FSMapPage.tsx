import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TX_GROUPS, TxGroup, TxItem, TxStage, StepId, topicIdToCatId } from '../data/fs_transactions'

// ── 색상 상수 ─────────────────────────────────────────────────────────────────
const NAVY = '#1a2744'
const BG = '#fafaf8'

// 9단계 메타 정보
const STEP_META: Record<StepId, { label: string; color: string; bg: string }> = {
  source: { label: 'Source',         color: '#5F5E5A', bg: '#f3f3f0' },
  aje:    { label: 'AJE',            color: '#185FA5', bg: '#eff6ff' },
  tb:     { label: 'Adj. TB',        color: '#4f6ef7', bg: '#eef2ff' },
  is:     { label: 'I/S',            color: '#1D9E75', bg: '#ecfdf5' },
  oci:    { label: 'OCI',            color: '#534AB7', bg: '#f0eeff' },
  bs:     { label: 'B/S',            color: '#0f766e', bg: '#f0fdfa' },
  se:     { label: 'S/E',            color: '#BA7517', bg: '#fffbeb' },
  scf:    { label: 'SCF',            color: '#c2410c', bg: '#fff7ed' },
  notes:  { label: 'Notes',          color: '#5F5E5A', bg: '#f3f3f0' },
}

const FS_IMPACT_LABELS: Array<{ key: keyof TxItem['fsImpact']; label: string; color: string; bg: string }> = [
  { key: 'is_ni',  label: 'I/S — Net Income',     color: '#1D9E75', bg: '#ecfdf5' },
  { key: 'is_oci', label: 'I/S — OCI',             color: '#534AB7', bg: '#f0eeff' },
  { key: 'bs',     label: 'Balance Sheet',          color: '#0f766e', bg: '#f0fdfa' },
  { key: 'se',     label: "Stockholders' Equity",   color: '#BA7517', bg: '#fffbeb' },
  { key: 'cfo',    label: 'SCF — Operating',        color: '#c2410c', bg: '#fff7ed' },
  { key: 'cfi',    label: 'SCF — Investing',        color: '#c2410c', bg: '#fff7ed' },
  { key: 'cff',    label: 'SCF — Financing',        color: '#c2410c', bg: '#fff7ed' },
  { key: 'notes',  label: 'Notes',                  color: '#5F5E5A', bg: '#f3f3f0' },
]

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function StepBadge({ step }: { step: StepId }) {
  const meta = STEP_META[step]
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.color}40`,
    }}>
      {meta.label}
    </span>
  )
}

function JournalEntryTable({ entries }: { entries: NonNullable<TxStage['entries']> }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      background: '#f8f9fc',
      border: '0.5px solid rgba(26,39,68,0.15)',
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 10,
    }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < entries.length - 1 ? 4 : 0 }}>
          <span style={{ color: e.dr !== undefined ? '#111' : '#444' }}>{e.account}</span>
          <span style={{ color: NAVY, fontWeight: 600 }}>
            {e.dr !== undefined && `$${e.dr.toLocaleString()}`}
            {e.cr !== undefined && `$${e.cr.toLocaleString()}`}
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
      border: `0.5px solid rgba(26,39,68,0.12)`,
      borderLeft: `3px solid ${meta.color}`,
      borderRadius: 10,
      padding: '14px 18px',
    }}>
      <StepBadge step={stage.step} />
      <div style={{ marginTop: 8, fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {stage.note}
      </div>
      {stage.entries && stage.entries.length > 0 && (
        <JournalEntryTable entries={stage.entries} />
      )}
    </div>
  )
}

// ── 중앙 콘텐츠 패널 ──────────────────────────────────────────────────────────

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
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>←</div>
          <div>왼쪽에서 거래 유형을 선택하세요</div>
        </div>
      </div>
    )
  }

  if (item.stages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🚧</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: NAVY, marginBottom: 8 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            이 거래 유형의 단계별 흐름은 곧 추가됩니다.
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
            관련 개념 먼저 보기 →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: `${group?.color ?? NAVY}18`,
            color: group?.color ?? NAVY,
          }}>
            {group?.label}
          </span>
          <span style={{
            fontSize: 11, color: '#888', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {item.topicId}
          </span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, margin: 0 }}>{item.label}</h2>
      </div>

      {/* 단계 흐름 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {item.stages.map((stage, i) => (
          <div key={stage.step}>
            <StageCard stage={stage} />
            {i < item.stages.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, color: '#ccc', fontSize: 18 }}>
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 우측 재무제표 영향 패널 ───────────────────────────────────────────────────

function RightPanel({ item }: { item: TxItem | null }) {
  if (!item || item.stages.length === 0) {
    return (
      <aside style={{
        width: 268,
        flexShrink: 0,
        borderLeft: '0.5px solid rgba(26,39,68,0.12)',
        background: '#fff',
        padding: '24px 18px',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
          재무제표 영향
        </div>
        <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 40 }}>
          거래를 선택하면<br />영향을 표시합니다
        </div>
      </aside>
    )
  }

  const hasImpact = FS_IMPACT_LABELS.some(f => item.fsImpact[f.key])

  return (
    <aside style={{
      width: 268,
      flexShrink: 0,
      borderLeft: '0.5px solid rgba(26,39,68,0.12)',
      background: '#fff',
      padding: '24px 18px',
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
        재무제표 영향
      </div>

      {!hasImpact ? (
        <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 20 }}>데이터 없음</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FS_IMPACT_LABELS.map(({ key, label, color, bg }) => {
            const val = item.fsImpact[key]
            if (!val) return null
            return (
              <div key={key} style={{
                background: bg,
                border: `0.5px solid ${color}30`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                  {label}
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

// ── 좌측 사이드바 ────────────────────────────────────────────────────────────

function Sidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (itemId: string) => void
}) {
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      borderRight: '0.5px solid rgba(26,39,68,0.12)',
      background: '#fff',
      overflowY: 'auto',
      padding: '12px 0',
    }}>
      {TX_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom: 8 }}>
          {/* 그룹 헤더 */}
          <div style={{
            padding: '6px 14px 6px 16px',
            margin: '4px 10px 4px 0',
            borderLeft: `2.5px solid ${group.color}`,
            marginLeft: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: group.color, lineHeight: 1.3 }}>
              {group.label}
            </span>
          </div>

          {/* 그룹 아이템 */}
          {group.items.map(item => {
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
                  padding: '6px 16px 6px 26px',
                  fontSize: 12.5,
                  color: isActive ? group.color : isEmpty ? '#aaa' : '#374151',
                  background: isActive ? `${group.color}12` : 'transparent',
                  border: 'none',
                  borderRight: isActive ? `2px solid ${group.color}` : '2px solid transparent',
                  cursor: 'pointer',
                  lineHeight: 1.5,
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {item.label}
                {isEmpty && (
                  <span style={{ fontSize: 10, color: '#ccc', marginLeft: 4 }}>+예정</span>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </aside>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function FSMapPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedItem = TX_GROUPS.flatMap(g => g.items).find(i => i.id === selectedId) ?? null
  const selectedGroup = TX_GROUPS.find(g => g.items.some(i => i.id === selectedId)) ?? null

  function handleGoToConcept(topicId: string) {
    const catId = topicIdToCatId(topicId)
    navigate(`/concept-notes?cat=${catId}&topic=${topicId}`)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: 0,
      background: BG,
      overflow: 'hidden',
    }}>

      {/* 페이지 헤더 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 44,
        background: '#fff',
        borderBottom: '0.5px solid rgba(26,39,68,0.12)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 20,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>
          F/S Map — 거래 유형별 재무제표 흐름
        </span>
        <span style={{ fontSize: 11, color: '#aaa', marginLeft: 12 }}>
          {TX_GROUPS.reduce((s, g) => s + g.items.length, 0)}개 거래 유형
        </span>
      </div>

      {/* 본문 (헤더 44px 아래) */}
      <div style={{ display: 'flex', flex: 1, marginTop: 44, minHeight: 0, overflow: 'hidden' }}>
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
