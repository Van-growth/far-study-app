import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tbsData from '../data/tbs_patterns.json';
import useClaudeStore from '../store/claudeStore';

// ── Types ─────────────────────────────────────────────────────
interface AnswerColumn {
  col: string;
  label: string;
  type: string;
  auto?: boolean;
}

interface ExhibitItem {
  row: string;
  en: string;
  ko: string;
}

interface Exhibit {
  exhibit_id: number;
  label: string;
  format: string;
  role: string;
  what_to_extract: string;
  read_tip: string;
  items: ExhibitItem[];
}

interface SolveStep {
  step: number;
  en: string;
  ko: string;
  detail: string;
}

interface Rule {
  tx_type: string;
  en_rule: string;
  columns: string[];
  ko_trap: string;
}

interface AnswerRow {
  label: string;
  [col: string]: number | null | string;
}

interface TBSPattern {
  tbs_id: string;
  pattern_name: string;
  becker_unit: string;
  becker_modules: string[];
  book_id: string;
  chapter_id: string;
  topic_group: string;
  related_topic_ids: string[];
  question_text: string;
  answer_format: string;
  answer_columns: AnswerColumn[];
  exhibits: Exhibit[];
  solve_steps: SolveStep[];
  rules: Rule[];
  traps: string[];
  answer_table: { rows: AnswerRow[] };
  practice_questions: unknown[];
}

const patterns = tbsData.patterns as TBSPattern[];
const UNIT_FILTERS = ['전체', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6'];

const BOOK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AA: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
  IA: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  GN: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
};

function bookTag(book_id: string) {
  return BOOK_COLORS[book_id] ?? { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
}

// ── Number formatting ─────────────────────────────────────────
function fmtCell(val: number | null | string, type: string): string {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  if (type === 'number') {
    // B col: plain number with commas, no $ sign
    return n.toLocaleString();
  }
  if (type === 'dollar') {
    const abs = '$' + Math.abs(n).toLocaleString();
    return n < 0 ? `(${abs})` : abs;
  }
  return String(val);
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12px] font-bold text-muted uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TBSList
// ═══════════════════════════════════════════════════════════════
function TBSList({ onSelect }: { onSelect: (p: TBSPattern) => void }) {
  const [unit, setUnit] = useState('전체');

  const filtered =
    unit === '전체' ? patterns : patterns.filter((p) => p.becker_unit === unit);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="shrink-0 px-4 pt-5 pb-3">
        <h2 className="text-[17px] font-bold text-[#0f172a]">TBS 패턴 라이브러리</h2>
        <p className="text-[12px] text-muted mt-0.5">Task-Based Simulation 유형별 풀이 전략</p>
      </div>

      {/* Unit filter chips */}
      <div className="shrink-0 px-4 pb-3 flex gap-2 overflow-x-auto">
        {UNIT_FILTERS.map((u) => {
          const active = unit === u;
          return (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className="shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors"
              style={{
                background: active ? '#4f6ef7' : '#f1f5f9',
                color: active ? 'white' : '#64748b',
                border: `1.5px solid ${active ? '#4f6ef7' : '#e2e8f0'}`,
              }}
            >
              {u}
            </button>
          );
        })}
      </div>

      {/* Pattern cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center py-16 text-sm text-muted">해당 유닛의 패턴이 없습니다.</p>
        )}
        {filtered.map((p) => {
          const done = p.practice_questions.length > 0;
          const tag = bookTag(p.book_id);
          return (
            <button
              key={p.tbs_id}
              onClick={() => onSelect(p)}
              className="w-full text-left bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: done ? '#22c55e' : '#cbd5e1' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
                    >
                      {p.book_id}
                    </span>
                    <span className="text-[11px] text-muted">
                      {p.becker_unit} · {p.becker_modules.join(', ')}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-[#0f172a] leading-snug">
                    {p.pattern_name}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">{p.tbs_id}</p>
                </div>
                <span className="text-muted text-sm shrink-0 mt-1">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TBSDetail
// ═══════════════════════════════════════════════════════════════
function TBSDetail({ pattern: p, onBack }: { pattern: TBSPattern; onBack: () => void }) {
  const navigate = useNavigate();
  const setCurrentTBSPattern = useClaudeStore((s) => s.setCurrentTBSPattern);

  // Inject TBS context into Harry when entering detail; clear on exit
  useEffect(() => {
    setCurrentTBSPattern({
      tbs_id: p.tbs_id,
      pattern_name: p.pattern_name,
      topic_group: p.topic_group,
      related_topic_ids: p.related_topic_ids,
    });
    return () => { setCurrentTBSPattern(null); };
  }, [p.tbs_id, setCurrentTBSPattern]);

  const tag = bookTag(p.book_id);
  const cols = p.answer_columns;
  const rows = p.answer_table.rows;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border bg-white">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-gray-100 text-base font-bold"
          aria-label="뒤로"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}
            >
              {p.book_id}
            </span>
            <span className="text-[11px] text-muted">{p.becker_unit} · {p.becker_modules.join(', ')}</span>
          </div>
          <p className="text-[14px] font-bold text-[#0f172a] truncate">{p.pattern_name}</p>
        </div>
      </div>

      {/* ── Scrollable body (overflow-auto for both axes) ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-5 space-y-6">

          {/* ── 1. Question ── */}
          <Section title="📋 Question">
            <div className="bg-white rounded-xl border border-border p-5 space-y-4">
              <p className="text-[13px] text-[#0f172a] leading-relaxed whitespace-pre-wrap">
                {p.question_text}
              </p>

              {/* Empty worksheet table */}
              <div className="border-t border-border pt-3">
                <p className="text-[11px] text-muted mb-2 italic">
                  Fill in each cell — positive for increases, negative for decreases, blank if no effect.
                </p>
                <table className="text-[11px] border-collapse" style={{ tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th
                        className="text-left px-2 py-1.5 font-semibold border border-[#e2e8f0] text-muted"
                        style={{ background: '#f8fafc', minWidth: 120 }}
                      >
                        항목
                      </th>
                      {cols.map((c) => (
                        <th
                          key={c.col}
                          className="px-1 py-1.5 font-bold border border-[#e2e8f0] text-center"
                          style={{
                            background: c.auto ? '#f0fdf4' : '#f8fafc',
                            color: c.auto ? '#166534' : '#0f172a',
                            minWidth: c.col === 'B' ? 80 : 90,
                          }}
                        >
                          <div>{c.col}</div>
                          <div className="text-[9px] font-normal text-muted leading-tight mt-0.5 whitespace-nowrap">
                            {c.label.length > 12 ? c.label.slice(0, 12) + '…' : c.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const isEnding = i === rows.length - 1;
                      return (
                        <tr key={i} style={{ fontWeight: isEnding ? 700 : 400 }}>
                          <td
                            className="px-2 py-1.5 border border-[#e2e8f0] text-[#0f172a] text-[11px]"
                            style={{ background: isEnding ? '#f0fdf4' : 'white' }}
                          >
                            {row.label}
                          </td>
                          {cols.map((c) => (
                            <td
                              key={c.col}
                              className="border border-[#e2e8f0]"
                              style={{
                                background: isEnding ? '#f0fdf4' : '#f1f5f9',
                                minWidth: c.col === 'B' ? 80 : 90,
                                height: 28,
                              }}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          {/* ── 2. Exhibits ── */}
          {p.exhibits.map((ex) => (
            <Section key={ex.exhibit_id} title={`📄 Exhibit ${ex.exhibit_id}: ${ex.label}`}>
              <div className="space-y-2">
                <div
                  className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
                >
                  <span className="font-semibold">역할: </span>{ex.role}
                  <span className="mx-2 opacity-40">|</span>
                  💡 {ex.read_tip}
                </div>
                {ex.items.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-border p-3.5">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1">
                      {item.row}
                    </p>
                    <p className="text-[13px] text-[#0f172a] leading-relaxed mb-2">{item.en}</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: '#4f6ef7' }}>
                      → {item.ko}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ))}

          {/* ── 3. Solve Steps ── */}
          <Section title="🪜 Solve Steps">
            <div className="space-y-2">
              {p.solve_steps.map((s) => (
                <div key={s.step} className="bg-white rounded-xl border border-border p-3.5 flex gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ background: '#4f6ef7', color: 'white' }}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0f172a]">{s.en}</p>
                    <p className="text-[12px] text-muted mt-0.5">{s.ko}</p>
                    {s.detail && (
                      <p className="text-[11px] text-muted mt-1 opacity-75">{s.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 4. Rules ── */}
          <Section title="📐 Rules by Transaction Type">
            <div className="space-y-2">
              {p.rules.map((r, i) => (
                <div key={i} className="bg-white rounded-xl border border-border p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[13px] font-bold text-[#0f172a] flex-1">{r.tx_type}</p>
                    <div className="flex gap-1 shrink-0">
                      {r.columns.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: '#eef2ff', color: '#3730a3' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[12px] text-[#0f172a] leading-relaxed mb-2">{r.en_rule}</p>
                  <p className="text-[11px] font-medium" style={{ color: '#ef4444' }}>
                    ⚠️ {r.ko_trap}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 5. Answer Table (Becker style) ── */}
          <Section title="✅ Answer Table">
            {/* No overflow wrapper — page scrolls naturally */}
            <table
              className="text-[11px] border-collapse bg-white rounded-xl"
              style={{ borderSpacing: 0 }}
            >
              <thead>
                <tr>
                  <th
                    className="text-left px-3 py-2 font-semibold border border-[#e2e8f0] rounded-tl-xl"
                    style={{ background: '#f8fafc', color: '#64748b', minWidth: 120, fontSize: 11 }}
                  >
                    항목
                  </th>
                  {cols.map((c, ci) => {
                    const ABBR: Record<string, string> = {
                      B: 'B-Shares', C: 'C-CS', D: 'D-APIC',
                      E: 'E-RE', F: 'F-AOCI', G: 'G-TS', H: 'H-Total',
                    };
                    return (
                      <th
                        key={c.col}
                        className="px-2 py-2 font-bold border border-[#e2e8f0] text-center"
                        style={{
                          background: c.auto ? '#f0fdf4' : '#f8fafc',
                          color: c.auto ? '#166534' : '#0f172a',
                          minWidth: c.col === 'B' ? 80 : 90,
                          fontSize: 11,
                          borderTopRightRadius: ci === cols.length - 1 ? 12 : 0,
                        }}
                      >
                        {ABBR[c.col] ?? c.col}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isBeginning = i === 0;
                  const isEnding = i === rows.length - 1;
                  const rowBg = isBeginning
                    ? '#eff6ff'
                    : isEnding
                    ? '#f0fdf4'
                    : i % 2 === 1 ? '#fafafa' : 'white';

                  return (
                    <tr
                      key={i}
                      style={{
                        background: rowBg,
                        fontWeight: isEnding ? 700 : 400,
                        borderTop: isEnding ? '2px solid #86efac' : undefined,
                      }}
                    >
                      <td
                        className="px-3 py-2 border border-[#e2e8f0] text-[#0f172a] text-[11px]"
                        style={{
                          borderBottomLeftRadius: i === rows.length - 1 ? 12 : 0,
                        }}
                      >
                        {row.label}
                      </td>
                      {cols.map((c, ci) => {
                        const val = row[c.col] as number | null;
                        const isNeg = typeof val === 'number' && val < 0;
                        const isNull = val === null || val === undefined;
                        return (
                          <td
                            key={c.col}
                            className="px-2 py-2 border border-[#e2e8f0] text-center text-[11px] tabular-nums"
                            style={{
                              color: isNull ? '#cbd5e1' : isNeg ? '#ef4444' : '#0f172a',
                              borderBottomRightRadius:
                                i === rows.length - 1 && ci === cols.length - 1 ? 12 : 0,
                            }}
                          >
                            {fmtCell(val, c.type)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          {/* ── 6. Related Topics ── */}
          {p.related_topic_ids.length > 0 && (
            <Section title="🔗 Related Topics">
              <div className="flex flex-wrap gap-1.5">
                {p.related_topic_ids.map((id) => (
                  <button
                    key={id}
                    onClick={() => navigate(`/concept-notes?topic=${id}`)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-70"
                    style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
                  >
                    {id} →
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════
export default function TBSTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? patterns.find((p) => p.tbs_id === selectedId) ?? null : null;

  if (selected) {
    return <TBSDetail pattern={selected} onBack={() => setSelectedId(null)} />;
  }
  return <TBSList onSelect={(p) => setSelectedId(p.tbs_id)} />;
}
