import { useState, useMemo, useEffect } from 'react';
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2';

// ── Unit metadata ─────────────────────────────────────────────
const UNIT_META: Record<string, { label: string; color: string }> = {
  U1: { label: 'U1 · Financial Reporting', color: '#4f6ef7' },
  U2: { label: 'U2 · Select Transactions', color: '#7c3aed' },
  U3: { label: 'U3 · Balance Sheet Accounts', color: '#0891b2' },
  U4: { label: 'U4 · Liabilities', color: '#d97706' },
  U5: { label: 'U5 · Advanced Topics', color: '#16a34a' },
  U6: { label: 'U6 · Government & NFP', color: '#dc2626' },
};

function getUnitKey(sub_category_id: string): string {
  return sub_category_id.split('_')[0];
}

function formatSubCatLabel(sub_category_id: string): string {
  return sub_category_id
    .split('_')
    .slice(1)
    .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
    .join(' ');
}

function highlight(text: string | undefined, query: string): React.ReactNode {
  if (!text) return '';
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface GroupedData {
  [unitKey: string]: { [subCatId: string]: TopicCard[] };
}

const LS_KEY = 'far-concept-map-learned';

// ── Main page ─────────────────────────────────────────────────
export default function ConceptMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    new Set(Object.keys(UNIT_META))
  );
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [learnedTopics, setLearnedTopics] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify([...learnedTopics]));
  }, [learnedTopics]);

  const grouped = useMemo<GroupedData>(() => {
    const result: GroupedData = {};
    for (const card of PROFESSOR_SSOT_V2) {
      const unit = getUnitKey(card.sub_category_id);
      if (!result[unit]) result[unit] = {};
      if (!result[unit][card.sub_category_id]) result[unit][card.sub_category_id] = [];
      result[unit][card.sub_category_id].push(card);
    }
    return result;
  }, []);

  // Set initial sub-cat selection
  useEffect(() => {
    if (!selectedSubCat) {
      const firstUnit = Object.keys(UNIT_META).find((u) => grouped[u]);
      if (firstUnit) {
        const firstSub = Object.keys(grouped[firstUnit])[0];
        if (firstSub) setSelectedSubCat(firstSub);
      }
    }
  }, [grouped, selectedSubCat]);

  const isSearching = searchQuery.trim().length > 0;

  const displayCards = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.toLowerCase();
      return PROFESSOR_SSOT_V2.filter(
        (c) =>
          c.card_name.toLowerCase().includes(q) ||
          c.rule.toLowerCase().includes(q) ||
          c.trigger.toLowerCase().includes(q) ||
          c.trap.toLowerCase().includes(q) ||
          c.one_sentence?.toLowerCase().includes(q)
      );
    }
    if (!selectedSubCat) return [];
    const unit = getUnitKey(selectedSubCat);
    return grouped[unit]?.[selectedSubCat] ?? [];
  }, [searchQuery, selectedSubCat, grouped, isSearching]);

  const toggleUnit = (unit: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      next.has(unit) ? next.delete(unit) : next.add(unit);
      return next;
    });
  };

  const toggleCard = (topicId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      return next;
    });
  };

  const toggleLearned = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLearnedTopics((prev) => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      return next;
    });
  };

  const selectSubCat = (subCatId: string) => {
    setSelectedSubCat(subCatId);
    setSearchQuery('');
    setMobileNavOpen(false);
  };

  // Total stats
  const totalAll = PROFESSOR_SSOT_V2.length;
  const learnedAll = PROFESSOR_SSOT_V2.filter((c) => learnedTopics.has(c.topic_id)).length;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Left Tree Nav (desktop) ───────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 bg-white border-r border-border overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border shrink-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            🗺️ Concept Map
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            {learnedAll}/{totalAll} 완료
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {Object.keys(UNIT_META).map((unitKey) => {
            const unitData = grouped[unitKey];
            if (!unitData) return null;
            const meta = UNIT_META[unitKey];
            const isExpanded = expandedUnits.has(unitKey);
            const subCats = Object.keys(unitData).sort();
            const totalUnit = subCats.reduce((a, s) => a + unitData[s].length, 0);
            const learnedUnit = subCats.reduce(
              (a, s) => a + unitData[s].filter((c) => learnedTopics.has(c.topic_id)).length,
              0
            );
            const pct = totalUnit > 0 ? Math.round((learnedUnit / totalUnit) * 100) : 0;

            return (
              <div key={unitKey}>
                {/* Unit row */}
                <button
                  onClick={() => toggleUnit(unitKey)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left group"
                >
                  <span className="text-[9px] text-muted w-3">{isExpanded ? '▾' : '▸'}</span>
                  <span className="flex-1 text-[11px] font-bold truncate" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[9px] text-muted shrink-0">{pct}%</span>
                </button>

                {/* Sub-category rows */}
                {isExpanded &&
                  subCats.map((subCatId) => {
                    const cards = unitData[subCatId];
                    const learned = cards.filter((c) => learnedTopics.has(c.topic_id)).length;
                    const isSelected = selectedSubCat === subCatId && !isSearching;

                    return (
                      <button
                        key={subCatId}
                        onClick={() => selectSubCat(subCatId)}
                        className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-gray-50 transition-colors text-left"
                        style={{
                          background: isSelected ? meta.color + '12' : undefined,
                          borderLeft: isSelected
                            ? `3px solid ${meta.color}`
                            : '3px solid transparent',
                        }}
                      >
                        <span
                          className="text-[12px] truncate"
                          style={{
                            color: isSelected ? meta.color : '#374151',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {formatSubCatLabel(subCatId)}
                        </span>
                        <span className="text-[10px] text-muted ml-1 shrink-0">
                          {learned}/{cards.length}
                        </span>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── Right Content ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar: search + mobile nav toggle */}
        <div className="shrink-0 bg-white border-b border-border px-3 py-2 flex items-center gap-2">
          {/* Mobile nav toggle */}
          <button
            className="md:hidden flex items-center gap-1 text-[12px] border border-border rounded-lg px-2 py-1.5 shrink-0 text-[#374151] bg-gray-50"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span className="text-[11px]">☰</span>
            <span className="max-w-[100px] truncate">
              {selectedSubCat ? formatSubCatLabel(selectedSubCat) : '단원 선택'}
            </span>
          </button>

          {/* Search input */}
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="card_name · trigger · rule 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted text-[12px] px-1 shrink-0 hover:text-[#0f172a]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden shrink-0 bg-white border-b border-border overflow-y-auto max-h-56 z-20">
            {Object.keys(UNIT_META).map((unitKey) => {
              const unitData = grouped[unitKey];
              if (!unitData) return null;
              const meta = UNIT_META[unitKey];
              return (
                <div key={unitKey}>
                  <div
                    className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: meta.color, background: meta.color + '0d' }}
                  >
                    {meta.label}
                  </div>
                  {Object.keys(unitData)
                    .sort()
                    .map((subCatId) => {
                      const cards = unitData[subCatId];
                      const learned = cards.filter((c) => learnedTopics.has(c.topic_id)).length;
                      const isSelected = selectedSubCat === subCatId;
                      return (
                        <button
                          key={subCatId}
                          onClick={() => selectSubCat(subCatId)}
                          className="w-full flex items-center justify-between px-5 py-1.5 text-[12px] hover:bg-gray-50 transition-colors"
                          style={{
                            color: isSelected ? meta.color : '#374151',
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          <span>{formatSubCatLabel(subCatId)}</span>
                          <span className="text-muted text-[10px]">
                            {learned}/{cards.length}
                          </span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}

        {/* Sub-category header / Search header */}
        {isSearching ? (
          <div className="shrink-0 px-4 py-2 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
            <span className="text-[12px] text-yellow-800 font-medium">
              🔍 "{searchQuery}" 검색 결과
            </span>
            <span className="text-[12px] text-yellow-700">{displayCards.length}개</span>
          </div>
        ) : selectedSubCat ? (
          <div
            className="shrink-0 px-4 py-2 border-b border-border flex items-center justify-between"
            style={{
              background: (UNIT_META[getUnitKey(selectedSubCat)]?.color ?? '#4f6ef7') + '08',
            }}
          >
            <div>
              <span className="text-[10px] text-muted">
                {UNIT_META[getUnitKey(selectedSubCat)]?.label}
              </span>
              <h2 className="text-[14px] font-bold text-[#0f172a]">
                {formatSubCatLabel(selectedSubCat)}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted">
                {displayCards.filter((c) => learnedTopics.has(c.topic_id)).length}/
                {displayCards.length}
              </p>
              <p className="text-[10px] text-muted">완료</p>
            </div>
          </div>
        ) : null}

        {/* Card list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {displayCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-[13px]">
                {isSearching ? '검색 결과가 없어요' : '좌측에서 단원을 선택하세요'}
              </p>
            </div>
          )}

          {displayCards.map((card) => (
            <TopicCardItem
              key={card.topic_id}
              card={card}
              isExpanded={expandedCards.has(card.topic_id)}
              isLearned={learnedTopics.has(card.topic_id)}
              searchQuery={searchQuery}
              onToggle={() => toggleCard(card.topic_id)}
              onToggleLearned={(e) => toggleLearned(card.topic_id, e)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Topic Card Item ───────────────────────────────────────────

interface TopicCardItemProps {
  card: TopicCard;
  isExpanded: boolean;
  isLearned: boolean;
  searchQuery: string;
  onToggle: () => void;
  onToggleLearned: (e: React.MouseEvent) => void;
}

const CARD_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  calculation: { bg: '#dbeafe', color: '#1d4ed8' },
  conditional: { bg: '#fef3c7', color: '#92400e' },
  concept: { bg: '#f0fdf4', color: '#166534' },
};

function TopicCardItem({
  card,
  isExpanded,
  isLearned,
  searchQuery,
  onToggle,
  onToggleLearned,
}: TopicCardItemProps) {
  const unitColor = UNIT_META[getUnitKey(card.sub_category_id)]?.color ?? '#4f6ef7';
  const typeStyle = card.card_type ? CARD_TYPE_STYLE[card.card_type] : null;

  return (
    <div
      className="bg-white rounded-xl border transition-all"
      style={{
        borderLeft: `3px solid ${isLearned ? '#22c55e' : unitColor}`,
        borderColor: isLearned ? '#bbf7d0' : undefined,
        opacity: isLearned && !isExpanded ? 0.75 : 1,
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 flex items-start gap-2"
      >
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] text-muted font-mono">{card.topic_id}</span>
            {typeStyle && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: typeStyle.bg, color: typeStyle.color }}
              >
                {card.card_type}
              </span>
            )}
          </div>
          {/* Title */}
          <p className="text-[13px] font-semibold text-[#0f172a] leading-snug">
            {highlight(card.card_name, searchQuery)}
          </p>
          {/* One-liner */}
          {card.one_sentence && (
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              {highlight(card.one_sentence, searchQuery)}
            </p>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            onClick={onToggleLearned}
            className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
            style={
              isLearned
                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }
                : { background: 'white', borderColor: '#e2e8f0', color: '#94a3b8' }
            }
          >
            {isLearned ? '✓ 완료' : '완료'}
          </button>
          <span className="text-muted text-[11px] leading-none">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-border space-y-2.5">
          {/* Rule */}
          <Section label="Rule" labelColor="#374151">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-[12px] text-[#1e293b] leading-relaxed whitespace-pre-wrap">
              {highlight(card.rule, searchQuery)}
            </div>
          </Section>

          {/* Rule items (structured) */}
          {card.rule_items && card.rule_items.length > 0 && (
            <Section label={card.rule_title ?? 'Rule Items'} labelColor="#374151">
              <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
                {card.rule_items.map((item, i) => (
                  <p key={i} className="text-[12px] text-[#1e293b] leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </Section>
          )}

          {/* Trigger */}
          <Section label="Trigger" labelColor="#1d4ed8">
            <div
              className="rounded-lg px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
              style={{ background: '#eff6ff', color: '#1e40af' }}
            >
              {highlight(card.trigger, searchQuery)}
            </div>
          </Section>

          {/* Trap */}
          <Section label="⚠️ Trap" labelColor="#dc2626">
            <div
              className="rounded-lg px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
              style={{ background: '#fff5f5', color: '#9b1c1c' }}
            >
              {highlight(card.trap, searchQuery)}
            </div>
          </Section>

          {/* Speed */}
          {card.speed && (
            <Section label="Speed" labelColor="#92400e">
              <div className="bg-amber-50 rounded-lg px-3 py-2 text-[12px] text-amber-900 leading-relaxed whitespace-pre-wrap">
                {card.speed}
              </div>
            </Section>
          )}

          {/* Example */}
          {card.example && (
            <Section label="Example" labelColor="#374151">
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-[12px] text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">
                {card.example}
              </div>
            </Section>
          )}

          {/* Context background */}
          {card.context_background && (
            <Section label="Context" labelColor="#6b21a8">
              <div
                className="rounded-lg px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ background: '#faf5ff', color: '#581c87' }}
              >
                {card.context_background}
              </div>
            </Section>
          )}

          {/* Context trigger */}
          {card.context_trigger && (
            <Section label="Context Trigger" labelColor="#1d4ed8">
              <div
                className="rounded-lg px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ background: '#eff6ff', color: '#1e40af' }}
              >
                {card.context_trigger}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  labelColor,
  children,
}: {
  label: string;
  labelColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ color: labelColor }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
