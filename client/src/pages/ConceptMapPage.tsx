import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2';

// ── Static structure ──────────────────────────────────────────

const UNITS: {
  key: string;
  label: string;
  color: string;
  subCats: { id: string; label: string }[];
}[] = [
  {
    key: 'U1',
    label: 'Financial Reporting',
    color: '#4f6ef7',
    subCats: [
      { id: 'U1_BALANCE_SHEET', label: 'Balance Sheet' },
      { id: 'U1_EPS', label: 'EPS' },
      { id: 'U1_INCOME_STATEMENT', label: 'Income Statement' },
      { id: 'U1_STOCKHOLDERS_EQUITY', label: 'Stockholders Equity' },
    ],
  },
  {
    key: 'U2',
    label: 'Select Transactions',
    color: '#7c3aed',
    subCats: [
      { id: 'U2_ACCOUNTING_CHANGES', label: 'Accounting Changes' },
      { id: 'U2_ADJUSTING_ENTRIES', label: 'Adjusting Entries' },
      { id: 'U2_FAIR_VALUE', label: 'Fair Value' },
      { id: 'U2_NOTES_TO_FS', label: 'Notes to FS' },
      { id: 'U2_RATIO_ANALYSIS', label: 'Ratio Analysis' },
      { id: 'U2_RATIO_VARIANCE', label: 'Ratio Variance' },
      { id: 'U2_REVENUE_RECOGNITION', label: 'Revenue Recognition' },
      { id: 'U2_SPECIAL_PURPOSE_FRAMEWORKS', label: 'Special Purpose' },
    ],
  },
  {
    key: 'U3',
    label: 'Balance Sheet Accounts',
    color: '#0891b2',
    subCats: [
      { id: 'U3_CASH', label: 'Cash' },
      { id: 'U3_INTANGIBLES', label: 'Intangibles' },
      { id: 'U3_INVENTORY', label: 'Inventory' },
      { id: 'U3_PPE', label: 'PPE' },
      { id: 'U3_TRADE_RECEIVABLES', label: 'Trade Receivables' },
    ],
  },
  {
    key: 'U4',
    label: 'Liabilities',
    color: '#d97706',
    subCats: [
      { id: 'U4_BONDS', label: 'Bonds' },
      { id: 'U4_CONTINGENCIES', label: 'Contingencies' },
      { id: 'U4_LEASE', label: 'Lease' },
      { id: 'U4_LONG_TERM_LIABILITIES', label: 'Long-term Liabilities' },
      { id: 'U4_PAYABLES', label: 'Payables' },
      { id: 'U4_TROUBLED_DEBT', label: 'Troubled Debt' },
    ],
  },
  {
    key: 'U5',
    label: 'Advanced Topics',
    color: '#16a34a',
    subCats: [
      { id: 'U5_CASH_FLOWS', label: 'Cash Flows' },
      { id: 'U5_CONSOLIDATED_FS', label: 'Consolidated FS' },
      { id: 'U5_EQUITY_METHOD', label: 'Equity Method' },
      { id: 'U5_FINANCIAL_INSTRUMENTS', label: 'Financial Instruments' },
      { id: 'U5_INCOME_TAX', label: 'Income Tax' },
      { id: 'U5_PARTNERSHIPS', label: 'Partnerships' },
    ],
  },
  {
    key: 'U6',
    label: 'Government & NFP',
    color: '#dc2626',
    subCats: [
      { id: 'U6_GOVERNMENTAL_FUND', label: 'Governmental Fund' },
      { id: 'U6_GOVERNMENTAL_OVERVIEW', label: 'Governmental Overview' },
      { id: 'U6_NFP_FINANCIAL_REPORTING', label: 'NFP Financial Reporting' },
    ],
  },
];

const UNIT_BY_SUBCAT = new Map<string, (typeof UNITS)[0]>(
  UNITS.flatMap((u) => u.subCats.map((s) => [s.id, u]))
);

// ── Helpers ───────────────────────────────────────────────────

const LS_KEY = 'far-concept-map-learned';

function loadLearned(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLearned(set: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

function hl(text: string | undefined, q: string): React.ReactNode {
  if (!text) return '';
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} style={{ background: '#fef08a', color: '#713f12', borderRadius: 2, padding: '0 1px' }}>
        {p}
      </mark>
    ) : (
      p
    )
  );
}

// ── Card type badge ───────────────────────────────────────────

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  calculation: { bg: '#dbeafe', color: '#1d4ed8', label: 'calculation' },
  concept:     { bg: '#dcfce7', color: '#166534', label: 'concept' },
  conditional: { bg: '#fef3c7', color: '#92400e', label: 'conditional' },
};

// ── Index cards by subcat ─────────────────────────────────────

const CARDS_BY_SUBCAT = new Map<string, TopicCard[]>();
for (const card of PROFESSOR_SSOT_V2) {
  const arr = CARDS_BY_SUBCAT.get(card.sub_category_id) ?? [];
  arr.push(card);
  CARDS_BY_SUBCAT.set(card.sub_category_id, arr);
}

// ── Main page ─────────────────────────────────────────────────

export default function ConceptMapPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string>('U1_BALANCE_SHEET');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    new Set(UNITS.map((u) => u.key))
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [learned, setLearned] = useState<Set<string>>(loadLearned);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { saveLearned(learned); }, [learned]);

  const isSearching = search.trim().length > 0;

  const displayCards = useMemo(() => {
    if (isSearching) {
      const q = search.toLowerCase();
      return PROFESSOR_SSOT_V2.filter(
        (c) =>
          c.card_name.toLowerCase().includes(q) ||
          c.rule.toLowerCase().includes(q) ||
          c.trigger.toLowerCase().includes(q) ||
          c.trap.toLowerCase().includes(q) ||
          c.one_sentence?.toLowerCase().includes(q)
      );
    }
    return CARDS_BY_SUBCAT.get(selected) ?? [];
  }, [search, selected, isSearching]);

  const toggleUnit = useCallback((key: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleCard = useCallback((id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleLearned = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLearned((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectSubCat = useCallback((id: string) => {
    setSelected(id);
    setSearch('');
    setMobileOpen(false);
  }, []);

  // Unit completion counts
  const unitStats = useMemo(() => {
    return UNITS.map((u) => {
      let total = 0;
      let done = 0;
      for (const s of u.subCats) {
        const cards = CARDS_BY_SUBCAT.get(s.id) ?? [];
        total += cards.length;
        done += cards.filter((c) => learned.has(c.topic_id)).length;
      }
      return { key: u.key, total, done };
    });
  }, [learned]);

  // Selected subcat info for header
  const selectedUnit = UNIT_BY_SUBCAT.get(selected);
  const selectedLabel = UNITS.flatMap((u) => u.subCats).find((s) => s.id === selected)?.label ?? '';
  const selectedCards = CARDS_BY_SUBCAT.get(selected) ?? [];
  const selectedDone = selectedCards.filter((c) => learned.has(c.topic_id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* ── Search bar ─────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Mobile nav toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            background: '#f8fafc',
            fontSize: 12,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          <span>☰</span>
          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isSearching ? '검색 중' : selectedLabel}
          </span>
        </button>

        {/* Search input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="card_name · trigger · rule · trap 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: search ? 32 : 12,
              paddingTop: 7,
              paddingBottom: 7,
              fontSize: 13,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              outline: 'none',
              background: '#f8fafc',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#4f6ef7'; e.target.style.background = 'white'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Sidebar (desktop) ────────────────────────────── */}
        <aside
          className="hidden md:flex"
          style={{
            flexDirection: 'column',
            width: 220,
            flexShrink: 0,
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              🗺️ Concept Map
            </p>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {UNITS.map((unit) => {
              const stats = unitStats.find((s) => s.key === unit.key)!;
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              const isOpen = expandedUnits.has(unit.key);

              return (
                <div key={unit.key}>
                  {/* Unit header */}
                  <button
                    onClick={() => toggleUnit(unit.key)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 9, color: '#94a3b8', width: 10, flexShrink: 0 }}>
                      {isOpen ? '▾' : '▸'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: unit.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{unit.key}] {unit.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{pct}%</span>
                  </button>

                  {/* Sub-categories */}
                  {isOpen && unit.subCats.map((sub) => {
                    const cards = CARDS_BY_SUBCAT.get(sub.id) ?? [];
                    const done = cards.filter((c) => learned.has(c.topic_id)).length;
                    const isActive = selected === sub.id && !isSearching;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => selectSubCat(sub.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 12px 5px 26px',
                          background: isActive ? unit.color + '12' : 'none',
                          borderLeft: isActive ? `3px solid ${unit.color}` : '3px solid transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                      >
                        <span style={{
                          fontSize: 12,
                          color: isActive ? unit.color : '#374151',
                          fontWeight: isActive ? 600 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {sub.label}
                        </span>
                        <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>
                          {done}/{cards.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile nav dropdown */}
          {mobileOpen && (
            <div
              className="md:hidden"
              style={{
                flexShrink: 0,
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {UNITS.map((unit) => (
                <div key={unit.key}>
                  <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: unit.color, background: unit.color + '0d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    [{unit.key}] {unit.label}
                  </div>
                  {unit.subCats.map((sub) => {
                    const cards = CARDS_BY_SUBCAT.get(sub.id) ?? [];
                    const done = cards.filter((c) => learned.has(c.topic_id)).length;
                    const isActive = selected === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => selectSubCat(sub.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '5px 12px 5px 20px',
                          background: isActive ? unit.color + '10' : 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 12, color: isActive ? unit.color : '#374151', fontWeight: isActive ? 600 : 400 }}>
                          {sub.label}
                        </span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{done}/{cards.length}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Content header */}
          {isSearching ? (
            <div style={{ flexShrink: 0, padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>
                🔍 "{search}" 검색 결과
              </span>
              <span style={{ fontSize: 12, color: '#78350f' }}>{displayCards.length}개</span>
            </div>
          ) : (
            <div style={{
              flexShrink: 0,
              padding: '8px 16px',
              background: 'white',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                  [{selectedUnit?.key}] {selectedUnit?.label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {selectedLabel}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: selectedDone === selectedCards.length && selectedCards.length > 0 ? '#22c55e' : '#64748b', margin: 0 }}>
                  {selectedDone}/{selectedCards.length}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>완료</p>
              </div>
            </div>
          )}

          {/* Card list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
            {displayCards.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8' }}>
                <span style={{ fontSize: 36, marginBottom: 12 }}>📭</span>
                <p style={{ fontSize: 13, margin: 0 }}>
                  {isSearching ? '검색 결과가 없어요' : '카드가 없어요'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayCards.map((card) => (
                  <CardItem
                    key={card.topic_id}
                    card={card}
                    isExpanded={expandedCards.has(card.topic_id)}
                    isLearned={learned.has(card.topic_id)}
                    searchQuery={isSearching ? search : ''}
                    onToggle={() => toggleCard(card.topic_id)}
                    onToggleLearned={(e) => toggleLearned(card.topic_id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card component ────────────────────────────────────────────

interface CardItemProps {
  card: TopicCard;
  isExpanded: boolean;
  isLearned: boolean;
  searchQuery: string;
  onToggle: () => void;
  onToggleLearned: (e: React.MouseEvent) => void;
}

function CardItem({ card, isExpanded, isLearned, searchQuery, onToggle, onToggleLearned }: CardItemProps) {
  const badge = card.card_type ? TYPE_BADGE[card.card_type] : null;
  const leftColor = isLearned ? '#22c55e' : '#e2e8f0';

  return (
    <div style={{
      background: 'white',
      borderRadius: 10,
      border: '1px solid #e2e8f0',
      borderLeft: `3px solid ${leftColor}`,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* ── Card header ── */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '11px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Topic ID + badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 500 }}>
              {card.topic_id}
            </span>
            {badge && (
              <span style={{
                fontSize: 9,
                padding: '1px 6px',
                borderRadius: 99,
                fontWeight: 600,
                background: badge.bg,
                color: badge.color,
              }}>
                {badge.label}
              </span>
            )}
          </div>
          {/* Card name */}
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
            {hl(card.card_name, searchQuery)}
          </p>
          {/* One-sentence summary */}
          {card.one_sentence && (
            <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', lineHeight: 1.4 }}>
              {hl(card.one_sentence, searchQuery)}
            </p>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
          <button
            onClick={onToggleLearned}
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 99,
              border: `1px solid ${isLearned ? '#86efac' : '#e2e8f0'}`,
              background: isLearned ? '#f0fdf4' : 'white',
              color: isLearned ? '#166534' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {isLearned ? '✓ 완료' : '완료'}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>

          {/* RULE */}
          <CardSection
            icon="📋"
            label="RULE"
            labelColor="#374151"
            bg="#f8fafc"
          >
            <p style={{ fontSize: 12, color: '#1e293b', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {hl(card.rule, searchQuery)}
            </p>
          </CardSection>

          {/* Structured rule items */}
          {card.rule_items && card.rule_items.length > 0 && (
            <CardSection
              icon=""
              label={card.rule_title ?? 'Rule Items'}
              labelColor="#374151"
              bg="#f8fafc"
              noBorderTop
            >
              {card.rule_items.map((item, i) => (
                <p key={i} style={{ fontSize: 12, color: '#1e293b', margin: i > 0 ? '4px 0 0' : 0, lineHeight: 1.55 }}>
                  {item}
                </p>
              ))}
            </CardSection>
          )}

          {/* TRIGGER */}
          <CardSection icon="⚡" label="TRIGGER" labelColor="#1d4ed8" bg="#eff6ff">
            <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {hl(card.trigger, searchQuery)}
            </p>
          </CardSection>

          {/* TRAP */}
          <CardSection icon="⚠️" label="TRAP" labelColor="#dc2626" bg="#fff5f5">
            <p style={{ fontSize: 12, color: '#9b1c1c', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {hl(card.trap, searchQuery)}
            </p>
          </CardSection>

          {/* SPEED */}
          {card.speed && (
            <CardSection icon="⏱" label="SPEED" labelColor="#92400e" bg="#fffbeb">
              <p style={{ fontSize: 12, color: '#78350f', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {card.speed}
              </p>
            </CardSection>
          )}

          {/* EXAMPLE */}
          {card.example && (
            <CardSection icon="💡" label="EXAMPLE" labelColor="#374151" bg="#f8fafc">
              <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {card.example}
              </p>
            </CardSection>
          )}

          {/* JOURNAL ENTRY */}
          {card.journal_entry && (
            <CardSection icon="📝" label="JE" labelColor="#374151" bg="#f0fdf4">
              <p style={{ fontSize: 12, color: '#14532d', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {card.journal_entry}
              </p>
            </CardSection>
          )}

          {/* CONTEXT */}
          {card.context_background && (
            <CardSection icon="📖" label="CONTEXT" labelColor="#6b21a8" bg="#faf5ff">
              <p style={{ fontSize: 12, color: '#581c87', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {card.context_background}
              </p>
            </CardSection>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────

function CardSection({
  icon,
  label,
  labelColor,
  bg,
  noBorderTop,
  children,
}: {
  icon: string;
  label: string;
  labelColor: string;
  bg: string;
  noBorderTop?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderTop: noBorderTop ? 'none' : '1px solid #f1f5f9',
      background: bg,
      padding: '10px 14px',
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        color: labelColor,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        margin: '0 0 5px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {icon && <span>{icon}</span>}
        {label}
      </p>
      {children}
    </div>
  );
}
