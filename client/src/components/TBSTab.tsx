import { useState } from 'react';
import tbsData from '../data/tbs_patterns.json';

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
const BECKER_UNITS = ['All', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6'];

function fmtVal(val: number | null | string, type: string): string {
  if (val === null || val === undefined) return '—';
  if (type === 'number') return Number(val).toLocaleString();
  if (type === 'dollar') {
    const n = Number(val);
    if (n === 0) return '$0';
    return (n > 0 ? '' : '–') + '$' + Math.abs(n).toLocaleString();
  }
  return String(val);
}

// ── List ──────────────────────────────────────────────────────
function TBSList({ onSelect }: { onSelect: (p: TBSPattern) => void }) {
  const [unit, setUnit] = useState('All');

  const filtered = unit === 'All' ? patterns : patterns.filter((p) => p.becker_unit === unit);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <h2 className="text-base font-bold text-[#0f172a] mb-0.5">TBS 패턴 라이브러리</h2>
        <p className="text-xs text-muted">Task-Based Simulation 유형별 풀이 전략</p>
      </div>

      {/* Unit filter */}
      <div className="shrink-0 px-4 pb-3 flex gap-1.5 overflow-x-auto">
        {BECKER_UNITS.map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className="shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
            style={{
              background: unit === u ? '#4f6ef7' : '#f1f5f9',
              color: unit === u ? 'white' : '#64748b',
              border: `1px solid ${unit === u ? '#4f6ef7' : '#e2e8f0'}`,
            }}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">해당 유닛의 패턴이 없습니다.</div>
        )}
        {filtered.map((p) => {
          const done = p.practice_questions.length > 0;
          return (
            <button
              key={p.tbs_id}
              onClick={() => onSelect(p)}
              className="w-full text-left rounded-2xl p-4 transition-all hover:shadow-md"
              style={{
                background: 'white',
                border: '1.5px solid #e2e8f0',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#eef2ff', color: '#4338ca' }}>
                      {p.book_id}
                    </span>
                    <span className="text-[11px] text-muted">
                      {p.becker_unit} · {p.becker_modules.join(', ')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a] leading-snug">{p.pattern_name}</p>
                  <p className="text-[11px] text-muted mt-0.5">{p.tbs_id}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${done ? 'text-[#166534] bg-[#f0fdf4]' : 'text-muted bg-[#f8fafc]'}`}>
                    {done ? '✓ 완료' : '미완료'}
                  </span>
                  <span className="text-muted text-xs">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[13px] font-bold text-[#0f172a] mb-2 px-4">{title}</h3>
      {children}
    </div>
  );
}

// ── Detail ─────────────────────────────────────────────────────
function TBSDetail({ pattern, onBack }: { pattern: TBSPattern; onBack: () => void }) {
  const cols = pattern.answer_columns;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-border bg-white">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-gray-100 text-lg"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0f172a] truncate">{pattern.pattern_name}</p>
          <p className="text-[11px] text-muted">{pattern.tbs_id} · {pattern.becker_unit} {pattern.becker_modules.join(', ')}</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-8">

        {/* Question text */}
        <Section title="📋 문제 지문">
          <div className="mx-4 p-3 rounded-xl text-[13px] leading-relaxed text-[#0f172a] whitespace-pre-wrap" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            {pattern.question_text}
          </div>
        </Section>

        {/* Answer columns */}
        <Section title="📊 워크시트 컬럼 구조">
          <div className="px-4 flex flex-wrap gap-1.5">
            {cols.map((c) => (
              <div
                key={c.col}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px]"
                style={{ background: c.auto ? '#f0fdf4' : '#eef2ff', color: c.auto ? '#166534' : '#3730a3', border: `1px solid ${c.auto ? '#bbf7d0' : '#c7d2fe'}` }}
              >
                <span className="font-bold">{c.col}</span>
                <span className="text-[10px] opacity-70">|</span>
                <span>{c.label}</span>
                {c.auto && <span className="ml-1 opacity-60">(자동)</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* Exhibits */}
        {pattern.exhibits.map((ex) => (
          <Section key={ex.exhibit_id} title={`📄 Exhibit ${ex.exhibit_id}: ${ex.label}`}>
            <div className="mx-4 mb-2 p-2.5 rounded-lg text-[11px]" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <p className="font-semibold text-[#92400e] mb-0.5">역할: {ex.role}</p>
              <p className="text-[#78350f]">💡 {ex.read_tip}</p>
            </div>
            <div className="space-y-2 px-4">
              {ex.items.map((item, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
                  <p className="text-[11px] font-semibold text-muted mb-1">{item.row}</p>
                  <p className="text-[12px] text-[#0f172a] leading-relaxed mb-1.5">{item.en}</p>
                  <p className="text-[12px] font-medium" style={{ color: '#4f6ef7' }}>→ {item.ko}</p>
                </div>
              ))}
            </div>
          </Section>
        ))}

        {/* Solve steps */}
        <Section title="🪜 풀이 순서">
          <div className="px-4 space-y-2">
            {pattern.solve_steps.map((s) => (
              <div key={s.step} className="flex gap-3 rounded-xl p-3" style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ background: '#4f6ef7', color: 'white' }}
                >
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#0f172a]">{s.en}</p>
                  <p className="text-[12px] text-[#4f6ef7] mt-0.5">{s.ko}</p>
                  {s.detail && <p className="text-[11px] text-muted mt-1">{s.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Rules */}
        <Section title="📐 거래 유형별 규칙">
          <div className="px-4 space-y-2">
            {pattern.rules.map((r, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
                <div className="flex items-start gap-2 mb-2">
                  <p className="text-[12px] font-bold text-[#0f172a] flex-1">{r.tx_type}</p>
                  <div className="flex gap-1 shrink-0">
                    {r.columns.map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: '#eef2ff', color: '#4338ca' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[12px] text-[#0f172a] leading-relaxed mb-1.5">{r.en_rule}</p>
                <p className="text-[11px] font-medium" style={{ color: '#ef4444' }}>⚠️ {r.ko_trap}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Traps */}
        {pattern.traps.length > 0 && (
          <Section title="⚠️ 핵심 함정">
            <div className="mx-4 rounded-xl p-3 space-y-2" style={{ background: '#fff5f5', border: '1.5px solid #fecaca' }}>
              {pattern.traps.map((t, i) => (
                <p key={i} className="text-[12px] text-[#991b1b] leading-relaxed">
                  • {t}
                </p>
              ))}
            </div>
          </Section>
        )}

        {/* Answer table */}
        <Section title="✅ 정답 테이블">
          <div className="px-4 overflow-x-auto">
            <table className="text-[11px] border-collapse w-full min-w-max">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold text-muted border border-[#e2e8f0] bg-[#f8fafc] min-w-[140px]">
                    항목
                  </th>
                  {cols.map((c) => (
                    <th
                      key={c.col}
                      className="px-2 py-1.5 font-semibold border border-[#e2e8f0] text-center whitespace-nowrap"
                      style={{ background: c.auto ? '#f0fdf4' : '#f8fafc', color: c.auto ? '#166534' : '#64748b' }}
                    >
                      {c.col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pattern.answer_table.rows.map((row, i) => {
                  const isLast = i === pattern.answer_table.rows.length - 1;
                  return (
                    <tr
                      key={i}
                      style={{
                        background: isLast ? '#f0fdf4' : i % 2 === 0 ? 'white' : '#fafafa',
                        fontWeight: isLast ? 700 : 400,
                      }}
                    >
                      <td className="px-2 py-1.5 border border-[#e2e8f0] text-[#0f172a] text-[11px]">
                        {row.label}
                      </td>
                      {cols.map((c) => {
                        const val = row[c.col] as number | null;
                        const isNeg = typeof val === 'number' && val < 0;
                        return (
                          <td
                            key={c.col}
                            className="px-2 py-1.5 border border-[#e2e8f0] text-center text-[11px]"
                            style={{ color: isNeg ? '#ef4444' : val !== null ? '#0f172a' : '#cbd5e1' }}
                          >
                            {fmtVal(val, c.type)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Related topics */}
        {pattern.related_topic_ids.length > 0 && (
          <Section title="🔗 관련 토픽">
            <div className="px-4 flex flex-wrap gap-1.5">
              {pattern.related_topic_ids.map((id) => (
                <span
                  key={id}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
                >
                  {id}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function TBSTab() {
  const [selected, setSelected] = useState<TBSPattern | null>(null);

  if (selected) {
    return <TBSDetail pattern={selected} onBack={() => setSelected(null)} />;
  }
  return <TBSList onSelect={setSelected} />;
}
