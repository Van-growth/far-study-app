import { useState, useMemo, useEffect, useCallback } from 'react';
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2';

// ── Static unit/subcat structure ──────────────────────────────

const UNITS: {
  key: string;
  label: string;
  color: string;
  subCats: { id: string; label: string }[];
}[] = [
  {
    key: 'U1', label: 'Financial Reporting', color: '#4f6ef7',
    subCats: [
      { id: 'U1_BALANCE_SHEET', label: 'Balance Sheet' },
      { id: 'U1_EPS', label: 'EPS' },
      { id: 'U1_INCOME_STATEMENT', label: 'Income Statement' },
      { id: 'U1_STOCKHOLDERS_EQUITY', label: 'Stockholders Equity' },
    ],
  },
  {
    key: 'U2', label: 'Select Transactions', color: '#7c3aed',
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
    key: 'U3', label: 'Balance Sheet Accounts', color: '#0891b2',
    subCats: [
      { id: 'U3_CASH', label: 'Cash' },
      { id: 'U3_INTANGIBLES', label: 'Intangibles' },
      { id: 'U3_INVENTORY', label: 'Inventory' },
      { id: 'U3_PPE', label: 'PPE' },
      { id: 'U3_TRADE_RECEIVABLES', label: 'Trade Receivables' },
    ],
  },
  {
    key: 'U4', label: 'Liabilities', color: '#d97706',
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
    key: 'U5', label: 'Advanced Topics', color: '#16a34a',
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
    key: 'U6', label: 'Government & NFP', color: '#dc2626',
    subCats: [
      { id: 'U6_GOVERNMENTAL_FUND', label: 'Governmental Fund' },
      { id: 'U6_GOVERNMENTAL_OVERVIEW', label: 'Governmental Overview' },
      { id: 'U6_NFP_FINANCIAL_REPORTING', label: 'NFP Financial Reporting' },
    ],
  },
];

// ── Static indexes ────────────────────────────────────────────

const UNIT_BY_SUBCAT = new Map<string, (typeof UNITS)[0]>(
  UNITS.flatMap((u) => u.subCats.map((s) => [s.id, u]))
);

const CARDS_BY_SUBCAT = new Map<string, TopicCard[]>();
const CARD_BY_TOPIC = new Map<string, TopicCard>();
for (const card of PROFESSOR_SSOT_V2) {
  const arr = CARDS_BY_SUBCAT.get(card.sub_category_id) ?? [];
  arr.push(card);
  CARDS_BY_SUBCAT.set(card.sub_category_id, arr);
  CARD_BY_TOPIC.set(card.topic_id, card);
}

// ── localStorage ──────────────────────────────────────────────

const LS_KEY = 'far-concept-map-learned';
function loadLearned(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveLearned(s: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...s]));
}

// ── Highlight helper ──────────────────────────────────────────

function hl(text: string | undefined, q: string): React.ReactNode {
  if (!text) return '';
  if (!q) return text;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.split(new RegExp(`(${esc})`, 'gi')).map((p, i) =>
    p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} style={{ background: '#fef08a', color: '#713f12', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
      : p
  );
}

// ── Card type badge ───────────────────────────────────────────

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
  calculation: { bg: '#dbeafe', color: '#1d4ed8' },
  concept:     { bg: '#dcfce7', color: '#166534' },
  conditional: { bg: '#fef3c7', color: '#92400e' },
};

// ── Main page ─────────────────────────────────────────────────

export default function ConceptMapPage() {
  const [search, setSearch]                   = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits]     = useState<Set<string>>(new Set(['U1']));
  const [expandedSubCats, setExpandedSubCats] = useState<Set<string>>(new Set(['U1_BALANCE_SHEET']));
  const [learned, setLearned]                 = useState<Set<string>>(loadLearned);
  const [mobileOpen, setMobileOpen]           = useState(false);

  useEffect(() => { saveLearned(learned); }, [learned]);

  // Auto-select first topic on mount
  useEffect(() => {
    if (!selectedTopicId) {
      const first = CARDS_BY_SUBCAT.get('U1_BALANCE_SHEET')?.[0];
      if (first) setSelectedTopicId(first.topic_id);
    }
  }, []);

  const isSearching = search.trim().length > 0;

  // Search: scan all cards
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    return PROFESSOR_SSOT_V2.filter(
      (c) =>
        c.card_name.toLowerCase().includes(q) ||
        c.rule.toLowerCase().includes(q) ||
        c.trigger.toLowerCase().includes(q) ||
        c.trap.toLowerCase().includes(q) ||
        c.one_sentence?.toLowerCase().includes(q)
    );
  }, [search, isSearching]);

  const selectedCard = selectedTopicId ? CARD_BY_TOPIC.get(selectedTopicId) : undefined;

  // Unit completion stats
  const unitStats = useMemo(() =>
    UNITS.map((u) => {
      let total = 0, done = 0;
      for (const s of u.subCats) {
        const cards = CARDS_BY_SUBCAT.get(s.id) ?? [];
        total += cards.length;
        done += cards.filter((c) => learned.has(c.topic_id)).length;
      }
      return { key: u.key, total, done };
    }), [learned]);

  const toggleUnit = useCallback((key: string) => {
    setExpandedUnits((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const toggleSubCat = useCallback((id: string) => {
    setExpandedSubCats((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const selectTopic = useCallback((topicId: string) => {
    setSelectedTopicId(topicId);
    setSearch('');
    setMobileOpen(false);
  }, []);

  const toggleLearned = useCallback((topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLearned((p) => { const n = new Set(p); n.has(topicId) ? n.delete(topicId) : n.add(topicId); return n; });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* ── Search bar ─────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          style={{ flexShrink: 0, padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 12, color: '#374151', cursor: 'pointer' }}
        >
          ☰ {isSearching ? '검색 중' : (selectedCard ? selectedCard.topic_id : '선택')}
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="card_name · trigger · rule · trap 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 32 : 12, paddingTop: 7, paddingBottom: 7, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
            onFocus={(e) => { e.target.style.borderColor = '#4f6ef7'; e.target.style.background = 'white'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Sidebar (desktop) ────────────────────────────── */}
        <aside
          className="hidden md:flex"
          style={{ flexDirection: 'column', width: 260, flexShrink: 0, background: 'white', borderRight: '1px solid #e2e8f0', overflow: 'hidden' }}
        >
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              🗺️ Concept Map
            </p>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
            {UNITS.map((unit) => {
              const stats = unitStats.find((s) => s.key === unit.key)!;
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              const isUnitOpen = expandedUnits.has(unit.key);

              return (
                <div key={unit.key}>
                  {/* ── Depth 1: Unit ── */}
                  <button
                    onClick={() => toggleUnit(unit.key)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 9, color: '#94a3b8', width: 10, flexShrink: 0 }}>{isUnitOpen ? '▾' : '▸'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: unit.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{unit.key}] {unit.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{pct}%</span>
                  </button>

                  {isUnitOpen && unit.subCats.map((sub) => {
                    const subCards = CARDS_BY_SUBCAT.get(sub.id) ?? [];
                    const subDone  = subCards.filter((c) => learned.has(c.topic_id)).length;
                    const isSubOpen = expandedSubCats.has(sub.id);

                    return (
                      <div key={sub.id}>
                        {/* ── Depth 2: Sub-category ── */}
                        <button
                          onClick={() => toggleSubCat(sub.id)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px 5px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{isSubOpen ? '▾' : '▸'}</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sub.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>
                            {subDone}/{subCards.length}
                          </span>
                        </button>

                        {/* ── Depth 3: Topic list ── */}
                        {isSubOpen && subCards.map((card) => {
                          const isActive  = selectedTopicId === card.topic_id && !isSearching;
                          const isDone    = learned.has(card.topic_id);
                          const unitColor = unit.color;

                          return (
                            <button
                              key={card.topic_id}
                              onClick={() => selectTopic(card.topic_id)}
                              title={card.card_name}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0,
                                padding: '4px 10px 4px 34px',
                                background: isActive ? unitColor + '12' : 'none',
                                borderLeft: isActive ? `2px solid ${unitColor}` : '2px solid transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? unitColor + '12' : 'none'; }}
                            >
                              <span style={{ fontSize: 10, color: '#cbd5e1', marginRight: 5, flexShrink: 0 }}>·</span>
                              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0, marginRight: 4 }}>
                                {card.topic_id}
                              </span>
                              <span style={{
                                fontSize: 11,
                                color: isActive ? unitColor : '#374151',
                                fontWeight: isActive ? 600 : 400,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {card.card_name}
                              </span>
                              {isDone && (
                                <span style={{ fontSize: 10, color: '#22c55e', flexShrink: 0, marginLeft: 3 }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile nav */}
          {mobileOpen && (
            <MobileNav
              units={UNITS}
              learned={learned}
              selectedTopicId={selectedTopicId}
              onSelect={selectTopic}
            />
          )}

          {/* Content header */}
          {isSearching ? (
            <div style={{ flexShrink: 0, padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>🔍 "{search}" 검색 결과</span>
              <span style={{ fontSize: 12, color: '#78350f' }}>{searchResults.length}개</span>
            </div>
          ) : selectedCard ? (
            <TopicHeader card={selectedCard} learned={learned} />
          ) : null}

          {/* Card area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
            {isSearching ? (
              searchResults.length === 0 ? (
                <EmptyState text="검색 결과가 없어요" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map((card) => (
                    <CardItem
                      key={card.topic_id}
                      card={card}
                      isExpanded={false}
                      isLearned={learned.has(card.topic_id)}
                      searchQuery={search}
                      defaultExpanded={false}
                      onTopicClick={() => selectTopic(card.topic_id)}
                      onToggleLearned={(e) => toggleLearned(card.topic_id, e)}
                    />
                  ))}
                </div>
              )
            ) : selectedCard ? (
              <CardItem
                key={selectedCard.topic_id}
                card={selectedCard}
                isExpanded={true}
                isLearned={learned.has(selectedCard.topic_id)}
                searchQuery=""
                defaultExpanded={true}
                onTopicClick={() => {}}
                onToggleLearned={(e) => toggleLearned(selectedCard.topic_id, e)}
              />
            ) : (
              <EmptyState text="좌측에서 토픽을 선택하세요" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Topic header bar ──────────────────────────────────────────

function TopicHeader({ card, learned }: { card: TopicCard; learned: Set<string> }) {
  const unit = UNIT_BY_SUBCAT.get(card.sub_category_id);
  const subLabel = UNITS.flatMap((u) => u.subCats).find((s) => s.id === card.sub_category_id)?.label ?? '';
  const isDone = learned.has(card.topic_id);

  return (
    <div style={{ flexShrink: 0, padding: '8px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
          [{unit?.key}] {unit?.label} · {subLabel}
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {card.card_name}
        </p>
      </div>
      {isDone && (
        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 99, padding: '2px 10px' }}>
          ✓ 완료
        </span>
      )}
    </div>
  );
}

// ── Mobile nav ────────────────────────────────────────────────

function MobileNav({
  units, learned, selectedTopicId, onSelect,
}: {
  units: typeof UNITS;
  learned: Set<string>;
  selectedTopicId: string | null;
  onSelect: (id: string) => void;
}) {
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set([units[0]?.key]));
  const [openSubs, setOpenSubs]   = useState<Set<string>>(new Set());

  return (
    <div className="md:hidden" style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid #e2e8f0', maxHeight: 260, overflowY: 'auto' }}>
      {units.map((unit) => {
        const isOpen = openUnits.has(unit.key);
        return (
          <div key={unit.key}>
            <button
              onClick={() => setOpenUnits((p) => { const n = new Set(p); n.has(unit.key) ? n.delete(unit.key) : n.add(unit.key); return n; })}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: unit.color + '0d', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 9, color: '#94a3b8' }}>{isOpen ? '▾' : '▸'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: unit.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>[{unit.key}] {unit.label}</span>
            </button>
            {isOpen && unit.subCats.map((sub) => {
              const subCards = CARDS_BY_SUBCAT.get(sub.id) ?? [];
              const isSubOpen = openSubs.has(sub.id);
              return (
                <div key={sub.id}>
                  <button
                    onClick={() => setOpenSubs((p) => { const n = new Set(p); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); return n; })}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 4px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{sub.label}</span>
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>{isSubOpen ? '▾' : '▸'}</span>
                  </button>
                  {isSubOpen && subCards.map((card) => (
                    <button
                      key={card.topic_id}
                      onClick={() => onSelect(card.topic_id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 12px 3px 28px', background: selectedTopicId === card.topic_id ? unit.color + '10' : 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{card.topic_id}</span>
                      <span style={{ fontSize: 11, color: selectedTopicId === card.topic_id ? unit.color : '#374151', fontWeight: selectedTopicId === card.topic_id ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.card_name}
                      </span>
                      {learned.has(card.topic_id) && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8' }}>
      <span style={{ fontSize: 36, marginBottom: 12 }}>📭</span>
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

// ── Card item ─────────────────────────────────────────────────

interface CardItemProps {
  card: TopicCard;
  isExpanded: boolean;
  isLearned: boolean;
  searchQuery: string;
  defaultExpanded: boolean;
  onTopicClick: () => void;
  onToggleLearned: (e: React.MouseEvent) => void;
}

function CardItem({ card, isLearned, searchQuery, defaultExpanded, onTopicClick, onToggleLearned }: CardItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const badge   = card.card_type ? TYPE_BADGE[card.card_type] : null;
  const leftBar = isLearned ? '#22c55e' : '#e2e8f0';

  // Re-expand when topic changes (defaultExpanded changes from navigation)
  useEffect(() => { setExpanded(defaultExpanded); }, [card.topic_id, defaultExpanded]);

  return (
    <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', borderLeft: `3px solid ${leftBar}`, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => { setExpanded((v) => !v); onTopicClick(); }}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', fontWeight: 500 }}>{card.topic_id}</span>
            {badge && (
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, fontWeight: 600, background: badge.bg, color: badge.color }}>
                {card.card_type}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
            {hl(card.card_name, searchQuery)}
          </p>
          {card.one_sentence && (
            <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', lineHeight: 1.4 }}>
              {hl(card.one_sentence, searchQuery)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
          <button
            onClick={onToggleLearned}
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, border: `1px solid ${isLearned ? '#86efac' : '#e2e8f0'}`, background: isLearned ? '#f0fdf4' : 'white', color: isLearned ? '#166534' : '#94a3b8', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
          >
            {isLearned ? '✓ 완료' : '완료'}
          </button>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
          <Sec icon="📋" label="RULE" lc="#374151" bg="#f8fafc">
            <pre style={PRE}>{hl(card.rule, searchQuery)}</pre>
          </Sec>
          {card.rule_items && card.rule_items.length > 0 && (
            <Sec icon="" label={card.rule_title ?? 'Rule Items'} lc="#374151" bg="#f8fafc" noBorder>
              {card.rule_items.map((item, i) => <p key={i} style={{ ...PRE, margin: i > 0 ? '4px 0 0' : 0 }}>{item}</p>)}
            </Sec>
          )}
          <Sec icon="⚡" label="TRIGGER" lc="#1d4ed8" bg="#eff6ff">
            <pre style={{ ...PRE, color: '#1e40af' }}>{hl(card.trigger, searchQuery)}</pre>
          </Sec>
          <Sec icon="⚠️" label="TRAP" lc="#dc2626" bg="#fff5f5">
            <pre style={{ ...PRE, color: '#9b1c1c' }}>{hl(card.trap, searchQuery)}</pre>
          </Sec>
          {card.speed && (
            <Sec icon="⏱" label="SPEED" lc="#92400e" bg="#fffbeb">
              <pre style={{ ...PRE, color: '#78350f' }}>{card.speed}</pre>
            </Sec>
          )}
          {card.example && (
            <Sec icon="💡" label="EXAMPLE" lc="#374151" bg="#f8fafc">
              <pre style={{ ...PRE, fontFamily: 'monospace' }}>{card.example}</pre>
            </Sec>
          )}
          {card.journal_entry && (
            <Sec icon="📝" label="JE" lc="#166534" bg="#f0fdf4">
              <pre style={{ ...PRE, color: '#14532d', fontFamily: 'monospace' }}>{card.journal_entry}</pre>
            </Sec>
          )}
          {card.context_background && (
            <Sec icon="📖" label="CONTEXT" lc="#6b21a8" bg="#faf5ff">
              <pre style={{ ...PRE, color: '#581c87' }}>{card.context_background}</pre>
            </Sec>
          )}
        </div>
      )}
    </div>
  );
}

const PRE: React.CSSProperties = {
  fontSize: 12, color: '#1e293b', margin: 0, lineHeight: 1.65,
  whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
};

// ── Section block ─────────────────────────────────────────────

function Sec({ icon, label, lc, bg, noBorder, children }: {
  icon: string; label: string; lc: string; bg: string; noBorder?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ borderTop: noBorder ? 'none' : '1px solid #f1f5f9', background: bg, padding: '10px 14px' }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: lc, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon && <span>{icon}</span>}{label}
      </p>
      {children}
    </div>
  );
}
