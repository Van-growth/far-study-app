import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2';

// ── Static book/chapter structure ─────────────────────────────

const BOOKS: {
  key: string;
  label: string;
  color: string;
  chapters: { id: string; label: string }[];
}[] = [
  {
    key: 'IA', label: 'Intermediate Accounting', color: '#4f6ef7',
    chapters: [
      { id: 'IA_CH2', label: 'Revenue & Balance Sheet' },
      { id: 'IA_CH3', label: 'Inventory' },
      { id: 'IA_CH4', label: 'Long-term Assets' },
      { id: 'IA_CH5', label: 'Cash & Receivables' },
      { id: 'IA_CH6', label: 'Contingencies & Liabilities' },
      { id: 'IA_CH7', label: 'Interest & TVM' },
      { id: 'IA_CH8', label: 'Bonds & TDR' },
      { id: 'IA_CH9', label: 'Leases' },
    ],
  },
  {
    key: 'AA', label: 'Advanced Accounting', color: '#7c3aed',
    chapters: [
      { id: 'AA_CH1', label: 'Accruals & Basics' },
      { id: 'AA_CH2', label: 'Deferred Tax' },
      { id: 'AA_CH3', label: "Stockholders' Equity & Pension" },
      { id: 'AA_CH4', label: 'EPS' },
      { id: 'AA_CH5', label: 'Investments & Fair Value' },
      { id: 'AA_CH6', label: 'Adjusting Entries & SPF' },
      { id: 'AA_CH7', label: 'Cash Flow Statement' },
      { id: 'AA_CH8', label: 'Accounting Changes' },
    ],
  },
  {
    key: 'GN', label: 'Government & NFP', color: '#16a34a',
    chapters: [
      { id: 'GN_CH1', label: 'Governmental Accounting' },
      { id: 'GN_CH2', label: 'NFP Financial Reporting' },
      { id: 'GN_CH3', label: 'Partnerships' },
      { id: 'GN_CH4', label: 'Consolidations' },
      { id: 'GN_CH7', label: 'Disclosures & Foreign Currency' },
      { id: 'GN_CH8', label: 'Ratio Analysis' },
    ],
  },
];

// ── Static indexes ────────────────────────────────────────────

const BOOK_BY_CHAPTER = new Map<string, (typeof BOOKS)[0]>(
  BOOKS.flatMap((b) => b.chapters.map((c) => [c.id, b]))
);

const CARDS_BY_CHAPTER = new Map<string, TopicCard[]>();
const CARD_BY_TOPIC = new Map<string, TopicCard>();
for (const card of PROFESSOR_SSOT_V2) {
  const arr = CARDS_BY_CHAPTER.get(card.chapter_id ?? '') ?? [];
  arr.push(card);
  CARDS_BY_CHAPTER.set(card.chapter_id ?? '', arr);
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

const LS_SIDEBAR_KEY = 'far-concept-map-sidebar-collapsed';
function loadSidebarCollapsed(): boolean {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return true;
  try {
    const v = localStorage.getItem(LS_SIDEBAR_KEY);
    return v === 'true';
  } catch { return false; }
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
  const [expandedBooks, setExpandedBooks]       = useState<Set<string>>(new Set(['IA']));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set(['IA_CH2']));
  const [learned, setLearned]                 = useState<Set<string>>(loadLearned);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(loadSidebarCollapsed);
  const [bounceDir, setBounceDir]             = useState<'left' | 'right' | null>(null);
  const touchStartX                           = useRef<number>(0);

  useEffect(() => { saveLearned(learned); }, [learned]);
  useEffect(() => {
    try { localStorage.setItem(LS_SIDEBAR_KEY, String(sidebarCollapsed)); } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  // Auto-select first topic on mount
  useEffect(() => {
    if (!selectedTopicId) {
      const first = CARDS_BY_CHAPTER.get('IA_CH2')?.[0];
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
        c.card_name?.toLowerCase().includes(q) ||
        c.rule.toLowerCase().includes(q) ||
        c.trigger.toLowerCase().includes(q) ||
        c.trap.toLowerCase().includes(q) ||
        c.one_sentence?.toLowerCase().includes(q)
    );
  }, [search, isSearching]);

  const selectedCard = selectedTopicId ? CARD_BY_TOPIC.get(selectedTopicId) : undefined;

  // Same topic_group 내 순서 계산 (스와이프 네비게이션용)
  const groupCards = useMemo(() => {
    if (!selectedCard) return [];
    return PROFESSOR_SSOT_V2.filter((c) => c.topic_group === selectedCard.topic_group);
  }, [selectedCard]);

  const currentIdx = groupCards.findIndex((c) => c.topic_id === selectedTopicId);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) {
      // 왼쪽 스와이프 → 다음 카드
      if (currentIdx < groupCards.length - 1) {
        setSelectedTopicId(groupCards[currentIdx + 1].topic_id);
      } else {
        setBounceDir('left');
        setTimeout(() => setBounceDir(null), 350);
      }
    } else {
      // 오른쪽 스와이프 → 이전 카드
      if (currentIdx > 0) {
        setSelectedTopicId(groupCards[currentIdx - 1].topic_id);
      } else {
        setBounceDir('right');
        setTimeout(() => setBounceDir(null), 350);
      }
    }
  }, [currentIdx, groupCards]);

  // Book completion stats
  const bookStats = useMemo(() =>
    BOOKS.map((b) => {
      let total = 0, done = 0;
      for (const ch of b.chapters) {
        const cards = CARDS_BY_CHAPTER.get(ch.id) ?? [];
        total += cards.length;
        done += cards.filter((c) => learned.has(c.topic_id)).length;
      }
      return { key: b.key, total, done };
    }), [learned]);

  const toggleBook = useCallback((key: string) => {
    setExpandedBooks((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
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
      <style>{`
        @keyframes swipeBounceLeft {
          0%   { transform: translateX(0); }
          30%  { transform: translateX(-18px); }
          65%  { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        @keyframes swipeBounceRight {
          0%   { transform: translateX(0); }
          30%  { transform: translateX(18px); }
          65%  { transform: translateX(-5px); }
          100% { transform: translateX(0); }
        }
        .swipe-bounce-left  { animation: swipeBounceLeft  0.35s ease; }
        .swipe-bounce-right { animation: swipeBounceRight 0.35s ease; }
      `}</style>

      {/* ── Search bar ─────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="hidden md:inline-flex"
          onClick={() => setSidebarCollapsed((v) => !v)}
          title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          style={{ flexShrink: 0, padding: '5px 9px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 16, color: '#374151', cursor: 'pointer', lineHeight: 1, alignItems: 'center' }}
        >
          ≡
        </button>
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
          style={{
            flexDirection: 'column',
            width: sidebarCollapsed ? 0 : 260,
            flexShrink: 0,
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
          }}
        >
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              🗺️ Concept Map
            </p>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px' }}>
            {BOOKS.map((book) => {
              const stats = bookStats.find((s) => s.key === book.key)!;
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              const isBookOpen = expandedBooks.has(book.key);

              return (
                <div key={book.key}>
                  {/* ── Depth 1: Book ── */}
                  <button
                    onClick={() => toggleBook(book.key)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: 9, color: '#94a3b8', width: 10, flexShrink: 0 }}>{isBookOpen ? '▾' : '▸'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: book.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      [{book.key}] {book.label}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{pct}%</span>
                  </button>

                  {isBookOpen && book.chapters.map((ch) => {
                    const chCards  = CARDS_BY_CHAPTER.get(ch.id) ?? [];
                    const chDone   = chCards.filter((c) => learned.has(c.topic_id)).length;
                    const isChOpen = expandedChapters.has(ch.id);

                    return (
                      <div key={ch.id}>
                        {/* ── Depth 2: Chapter ── */}
                        <button
                          onClick={() => toggleChapter(ch.id)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px 5px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', flexShrink: 0 }}>{isChOpen ? '▾' : '▸'}</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ch.label}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>
                            {chDone}/{chCards.length}
                          </span>
                        </button>

                        {/* ── Depth 3: Topic list ── */}
                        {isChOpen && chCards.map((card) => {
                          const isActive   = selectedTopicId === card.topic_id && !isSearching;
                          const isDone     = learned.has(card.topic_id);
                          const bookColor  = book.color;

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
                                background: isActive ? bookColor + '12' : 'none',
                                borderLeft: isActive ? `2px solid ${bookColor}` : '2px solid transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? bookColor + '12' : 'none'; }}
                            >
                              <span style={{ fontSize: 10, color: '#cbd5e1', marginRight: 5, flexShrink: 0 }}>·</span>
                              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0, marginRight: 4 }}>
                                {card.topic_id}
                              </span>
                              <span style={{
                                fontSize: 11,
                                color: isActive ? bookColor : '#374151',
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
              books={BOOKS}
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
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}
            onTouchStart={!isSearching ? handleTouchStart : undefined}
            onTouchEnd={!isSearching ? handleTouchEnd : undefined}
            className={bounceDir === 'left' ? 'swipe-bounce-left' : bounceDir === 'right' ? 'swipe-bounce-right' : ''}
          >
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

          {/* 스와이프 위치 표시기 */}
          {!isSearching && selectedCard && groupCards.length > 1 && (
            <div style={{
              flexShrink: 0,
              background: 'white',
              borderTop: '1px solid #e2e8f0',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 10, color: '#cbd5e1', letterSpacing: '0.04em' }}>← 스와이프 →</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 44, textAlign: 'center' }}>
                {currentIdx + 1} / {groupCards.length}
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                {selectedCard.topic_group}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Topic header bar ──────────────────────────────────────────

function TopicHeader({ card, learned }: { card: TopicCard; learned: Set<string> }) {
  const book     = BOOK_BY_CHAPTER.get(card.chapter_id ?? '');
  const chLabel  = BOOKS.flatMap((b) => b.chapters).find((c) => c.id === card.chapter_id)?.label ?? '';
  const isDone   = learned.has(card.topic_id);

  return (
    <div style={{ flexShrink: 0, padding: '8px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
          [{book?.key}] {book?.label} · {chLabel}
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
  books, learned, selectedTopicId, onSelect,
}: {
  books: typeof BOOKS;
  learned: Set<string>;
  selectedTopicId: string | null;
  onSelect: (id: string) => void;
}) {
  const [openBooks, setOpenBooks] = useState<Set<string>>(new Set([books[0]?.key]));
  const [openChs, setOpenChs]     = useState<Set<string>>(new Set());

  return (
    <div className="md:hidden" style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid #e2e8f0', maxHeight: 260, overflowY: 'auto' }}>
      {books.map((book) => {
        const isOpen = openBooks.has(book.key);
        return (
          <div key={book.key}>
            <button
              onClick={() => setOpenBooks((p) => { const n = new Set(p); n.has(book.key) ? n.delete(book.key) : n.add(book.key); return n; })}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: book.color + '0d', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 9, color: '#94a3b8' }}>{isOpen ? '▾' : '▸'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: book.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>[{book.key}] {book.label}</span>
            </button>
            {isOpen && book.chapters.map((ch) => {
              const chCards = CARDS_BY_CHAPTER.get(ch.id) ?? [];
              const isChOpen = openChs.has(ch.id);
              return (
                <div key={ch.id}>
                  <button
                    onClick={() => setOpenChs((p) => { const n = new Set(p); n.has(ch.id) ? n.delete(ch.id) : n.add(ch.id); return n; })}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 4px 20px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{ch.label}</span>
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>{isChOpen ? '▾' : '▸'}</span>
                  </button>
                  {isChOpen && chCards.map((card) => (
                    <button
                      key={card.topic_id}
                      onClick={() => onSelect(card.topic_id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 12px 3px 28px', background: selectedTopicId === card.topic_id ? book.color + '10' : 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{card.topic_id}</span>
                      <span style={{ fontSize: 11, color: selectedTopicId === card.topic_id ? book.color : '#374151', fontWeight: selectedTopicId === card.topic_id ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
