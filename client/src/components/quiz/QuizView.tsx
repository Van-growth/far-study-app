import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import useClaudeStore from '../../store/claudeStore';
import { useClaudeChat, QuizContext } from '../../hooks/useClaudeChat';
import PVFVTable, { questionNeedsPVFVTable } from './PVFVTable';
import QuizCalculator from './QuizCalculator';
import FeedbackButtons from '../feedback/FeedbackButtons';
import ErrorTagSection from './ErrorTagSection';
import {
  fetchConceptCard,
  ConceptCard,
  CompareBlock,
  GapBlock,
  CalculationBlock,
  TimelineBlock,
  TrapBlock,
  TrapCalcRow,
  StatementRow,
  StatementNote,
  IncomeStatementData,
  BalanceSheetData,
  SCFData,
  MultiStatementData,
  HighlightColor,
} from '../../hooks/useDynamicQuiz';

// ── Timer helpers ─────────────────────────────────────────────
export function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function elapsedTone(sec: number): { color: string; bold: boolean } {
  if (sec >= 61) return { color: '#ef4444', bold: true };
  if (sec >= 41) return { color: '#f59e0b', bold: false };
  return { color: '#22c55e', bold: false };
}

// ── Safe string render — prevents React Error #31 ────────────
// LLM이 가끔 StatementRow({label, amount, indent, ...}) 같은 객체를 텍스트
// 섹션(sections.markdown, compare.rows 등)에 잘못 넣어 반환할 때가 있다.
// 그대로 JSON.stringify하면 화면에 raw JSON이 노출되므로, 객체는 먼저
// label/text 필드를 읽어 사람이 읽을 수 있는 문자열로 복구한다.
function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v == null) return '';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.label === 'string') {
      const amount =
        typeof o.amount === 'number'
          ? ` — $${Math.abs(o.amount).toLocaleString()}`
          : '';
      return o.label + amount;
    }
    if (typeof o.text === 'string') return o.text;
  }
  return JSON.stringify(v);
}

// ── Concept card renderers ────────────────────────────────────
function typeLabel(t: ConceptCard['type']): string {
  switch (t) {
    case 'comparison': return '비교';
    case 'timeline': return '시점/순서';
    case 'formula': return '공식/계산';
    case 'income_statement': return 'Income Statement';
    case 'balance_sheet': return 'Balance Sheet';
    case 'scf': return 'Cash Flows';
    case 'multi_statement': return 'Multi Statement';
    default: return '요약';
  }
}

export function ConceptCardView({ card }: { card: ConceptCard }) {
  const s = card.sections;
  return (
    <div className="flex flex-col gap-3 text-[#451a03]">
      {card.headline && (
        <p className="text-sm font-semibold leading-snug">🎯 {safeStr(card.headline)}</p>
      )}
      {/* Statement types */}
      {card.type === 'income_statement' && card.statement && (
        <IncomeStatementBlock data={card.statement as IncomeStatementData} notes={card.notes} />
      )}
      {card.type === 'balance_sheet' && card.statement && (
        <BalanceSheetBlock data={card.statement as BalanceSheetData} notes={card.notes} />
      )}
      {card.type === 'scf' && card.statement && (
        <SCFBlock data={card.statement as SCFData} notes={card.notes} />
      )}
      {card.type === 'multi_statement' && card.statement && (
        <MultiStatementBlock data={card.statement as MultiStatementData} notes={card.notes} />
      )}
      {/* Existing narrative types */}
      {card.type === 'comparison' && s.compare && <CompareView compare={s.compare} />}
      {card.type === 'timeline' && s.timeline && <TimelineView timeline={s.timeline} />}
      {card.type === 'formula' && s.calculation && <CalculationView calc={s.calculation} />}
      {card.type === 'plain' && s.markdown && <PlainView markdown={s.markdown} />}
      {s.gap && <GapView gap={s.gap} />}
      {s.traps && s.traps.length > 0 && <TrapsView traps={s.traps} />}
      {card.correct_approach && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
        >
          <p className="text-xs font-semibold mb-1">✅ 정답 접근법</p>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MD_COMPONENTS as never}>
            {card.correct_approach}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ── Statement renderers ──────────────────────────────────────
const HIGHLIGHT_PALETTE: Record<
  HighlightColor,
  { bg: string; border: string; text: string }
> = {
  amber:  { bg: '#FAEEDA', border: '#EF9F27', text: '#633806' },
  blue:   { bg: '#E6F1FB', border: '#378ADD', text: '#0C447C' },
  purple: { bg: '#EEEDFE', border: '#7F77DD', text: '#3C3489' },
  green:  { bg: '#EAF3DE', border: '#639922', text: '#3B6D11' },
};

const AMOUNT_FMT = new Intl.NumberFormat('en-US', { style: 'decimal' });

function formatAmount(amount: number | null, isSubtraction: boolean): string {
  if (amount === null || amount === undefined) return '';
  const abs = AMOUNT_FMT.format(Math.abs(amount));
  return isSubtraction ? `($${abs})` : `$${abs}`;
}

function StatementRowView({ row }: { row: StatementRow }) {
  const indentPx = row.indent === 2 ? 38 : row.indent === 1 ? 26 : 14;
  const hl = row.highlight && row.highlight_color ? HIGHLIGHT_PALETTE[row.highlight_color] : null;
  const amountText = formatAmount(row.amount, row.is_subtraction);

  return (
    <div
      className="flex items-center justify-between text-[11px] py-[3px] pr-2"
      style={{
        paddingLeft: `${indentPx}px`,
        background: hl?.bg,
        borderLeft: hl ? `3px solid ${hl.border}` : '3px solid transparent',
        color: hl?.text ?? '#451a03',
        fontWeight: row.is_total ? 500 : 400,
        borderTop: row.is_total ? '0.5px solid rgba(120, 53, 15, 0.5)' : undefined,
        marginTop: row.is_total ? 2 : 0,
      }}
    >
      <span className="flex-1 truncate pr-2 leading-tight">
        {safeStr(row.label)}
        {row.note_tag && (
          <sup className="ml-0.5 text-[9px] font-bold opacity-80">({safeStr(row.note_tag)})</sup>
        )}
      </span>
      <span className="font-mono tabular-nums whitespace-nowrap">{amountText}</span>
    </div>
  );
}

function collectTags(rows: StatementRow[]): Set<string> {
  const out = new Set<string>();
  for (const r of rows) if (r.note_tag) out.add(r.note_tag);
  return out;
}

function NotesView({ notes }: { notes: StatementNote[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-[#fcd34d] flex flex-col gap-1">
      {notes.map((n, i) => {
        const palette = n.color ? HIGHLIGHT_PALETTE[n.color] : HIGHLIGHT_PALETTE.amber;
        return (
          <div
            key={`${n.tag}-${i}`}
            className="text-[10px] px-2 py-1 rounded leading-snug"
            style={{
              background: palette.bg,
              borderLeft: `3px solid ${palette.border}`,
              color: palette.text,
            }}
          >
            <span className="font-bold">({safeStr(n.tag)})</span> {safeStr(n.text)}
          </div>
        );
      })}
    </div>
  );
}

function StatementSubSection({ label, rows }: { label: string; rows: StatementRow[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-bold text-[#78350f] uppercase tracking-wider px-[14px] mt-1 mb-0.5">
        {label}
      </p>
      {rows.map((r, i) => <StatementRowView key={i} row={r} />)}
    </div>
  );
}

function statementWrapper(title: string | undefined, icon: string, children: React.ReactNode, rightBadge?: React.ReactNode) {
  return (
    <div className="bg-white/80 border border-[#fcd34d] rounded-lg p-3">
      {(title || rightBadge) && (
        <div className="flex items-center justify-between mb-2 px-[14px]">
          <p className="text-[11px] font-bold text-[#78350f]">{icon} {title}</p>
          {rightBadge}
        </div>
      )}
      {children}
    </div>
  );
}

function IncomeStatementBlock({ data, notes }: { data: IncomeStatementData; notes?: StatementNote[] }) {
  const allRows = data.sections.flatMap((s) => s.rows);
  const tags = collectTags(allRows);
  const matched = (notes ?? []).filter((n) => tags.has(n.tag));

  return statementWrapper(
    data.title,
    '📈',
    <>
      {data.sections.map((section, i) => (
        <StatementSubSection key={i} label={section.label} rows={section.rows} />
      ))}
      <NotesView notes={matched} />
    </>,
  );
}

function BalanceSheetBlock({ data, notes }: { data: BalanceSheetData; notes?: StatementNote[] }) {
  const allRows = [
    ...(data.assets?.current ?? []),
    ...(data.assets?.noncurrent ?? []),
    ...(data.liabilities?.current ?? []),
    ...(data.liabilities?.noncurrent ?? []),
    ...(data.equity ?? []),
  ];
  const tags = collectTags(allRows);
  const matched = (notes ?? []).filter((n) => tags.has(n.tag));

  return statementWrapper(
    data.title,
    '📊',
    <>
      <StatementSubSection label="Current assets" rows={data.assets?.current ?? []} />
      <StatementSubSection label="Noncurrent assets" rows={data.assets?.noncurrent ?? []} />
      <StatementSubSection label="Current liabilities" rows={data.liabilities?.current ?? []} />
      <StatementSubSection label="Noncurrent liabilities" rows={data.liabilities?.noncurrent ?? []} />
      <StatementSubSection label="Equity" rows={data.equity ?? []} />
      <NotesView notes={matched} />
    </>,
  );
}

function SCFBlock({ data, notes }: { data: SCFData; notes?: StatementNote[] }) {
  const allRows = data.sections.flatMap((s) => s.rows);
  const tags = collectTags(allRows);
  const matched = (notes ?? []).filter((n) => tags.has(n.tag));
  const badge = (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#f59e0b] text-white font-semibold uppercase">
      {data.method}
    </span>
  );

  return statementWrapper(
    data.title,
    '💵',
    <>
      {data.sections.map((section, i) => (
        <StatementSubSection key={i} label={section.label} rows={section.rows} />
      ))}
      <NotesView notes={matched} />
    </>,
    badge,
  );
}

function MultiStatementBlock({ data, notes }: { data: MultiStatementData; notes?: StatementNote[] }) {
  // Canonical render order: I/S → B/S → SCF
  const ORDER: Record<string, number> = {
    income_statement: 0,
    balance_sheet: 1,
    scf: 2,
  };
  const entries = (data.statements ?? [])
    .filter(<T,>(e: T | null): e is T => e !== null)
    .sort(
      (a, b) =>
        (ORDER[(a as { type: string }).type] ?? 9) - (ORDER[(b as { type: string }).type] ?? 9),
    );

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <div key={i}>
          {entry.type === 'income_statement' && (
            <IncomeStatementBlock data={entry.data} notes={notes} />
          )}
          {entry.type === 'balance_sheet' && (
            <BalanceSheetBlock data={entry.data} notes={notes} />
          )}
          {entry.type === 'scf' && <SCFBlock data={entry.data} notes={notes} />}
          {i < entries.length - 1 && <div className="h-px bg-[#fcd34d] my-2 mx-2" />}
        </div>
      ))}
    </div>
  );
}

function CompareView({ compare }: { compare: CompareBlock }) {
  const side = (label: string, rows: unknown[], bg: string) => (
    <div className="flex-1 min-w-0 p-3 rounded-lg" style={{ background: bg, border: '1px solid #fcd34d' }}>
      <p className="text-[11px] font-bold mb-1.5 text-[#78350f]">{safeStr(label)}</p>
      <ul className="flex flex-col gap-1 text-xs leading-snug">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-[#a16207]">·</span>
            <span className="flex-1">{safeStr(r)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {side(compare.left.label, compare.left.rows, '#fef9c3')}
      {side(compare.right.label, compare.right.rows, '#fde68a')}
    </div>
  );
}

function GapView({ gap }: { gap: GapBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-1 text-[#78350f]">⚖️ {safeStr(gap.label)}</p>
      <ul className="flex flex-col gap-1 text-xs leading-snug text-[#451a03]">
        {gap.rows.map((r, i) => <li key={i}>· {safeStr(r)}</li>)}
      </ul>
      {gap.note && <p className="text-[11px] italic text-[#78350f] mt-1.5">{safeStr(gap.note)}</p>}
    </div>
  );
}

function CalculationView({ calc }: { calc: CalculationBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-1.5 text-[#78350f]">📐 풀이 흐름</p>
      <ol className="flex flex-col gap-1 text-xs leading-snug text-[#451a03]">
        {calc.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="flex-1">{safeStr(s)}</span>
          </li>
        ))}
      </ol>
      <div className="mt-2 pt-2 border-t border-[#fcd34d]">
        <p className="text-xs font-bold text-[#78350f]">= {safeStr(calc.result)}</p>
      </div>
    </div>
  );
}

function TimelineView({ timeline }: { timeline: TimelineBlock }) {
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d]">
      <p className="text-[11px] font-bold mb-2 text-[#78350f]">⏱ 시점별 처리</p>
      <ol className="relative border-l-2 border-[#f59e0b] ml-1 pl-3 flex flex-col gap-2">
        {timeline.events.map((ev, i) => (
          <li key={i} className="relative">
            <span
              className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#f59e0b]"
              aria-hidden
            />
            <p className="text-xs font-semibold text-[#78350f] leading-tight">{safeStr(ev.label)}</p>
            {ev.detail && <p className="text-xs text-[#451a03] leading-snug mt-0.5">{safeStr(ev.detail)}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlainView({ markdown }: { markdown: unknown }) {
  // LLM이 markdown 자리에 배열/객체를 넣어 반환하는 경우가 있음. 배열이면
  // 각 원소를 safeStr로 복구해 bullet list markdown으로 재조립하고, 객체면
  // 그대로 safeStr 1회. 문자열이면 손대지 않고 통과.
  const text =
    typeof markdown === 'string'
      ? markdown
      : Array.isArray(markdown)
        ? markdown.map((item) => `- ${safeStr(item)}`).join('\n')
        : safeStr(markdown);
  return (
    <div className="p-3 rounded-lg bg-white/70 border border-[#fcd34d] text-xs leading-snug text-[#451a03]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MD_COMPONENTS as never}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function TrapsView({ traps }: { traps: TrapBlock[] }) {
  return (
    <div className="p-3 rounded-lg bg-[#fff1f2] border border-[#fecaca]">
      <p className="text-[11px] font-bold mb-1.5 text-[#991b1b]">⚠️ 함정</p>
      <ul className="flex flex-col gap-2 text-xs leading-snug">
        {traps.map((t, i) => {
          const hasCalc = Array.isArray(t.calculation) && t.calculation.length > 0;
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">
                  {t.option}
                </span>
                <div className="flex-1 text-[#7f1d1d]">
                  {typeof t.amount === 'number' && (
                    <div className="font-mono tabular-nums text-[#991b1b] text-[11px] mb-0.5">
                      → {formatAmount(t.amount, false)}
                    </div>
                  )}
                  <div>{safeStr(t.reason)}</div>
                </div>
              </div>
              {hasCalc && <TrapCalcTable rows={t.calculation as TrapCalcRow[]} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TrapCalcTable({ rows }: { rows: TrapCalcRow[] }) {
  return (
    <div
      className="ml-7 rounded border border-[#fecaca]"
      style={{ background: 'rgba(255,255,255,0.6)' }}
    >
      {rows.map((row, i) => {
        const isTotal = row.is_total === true;
        const isSub = row.is_subtraction === true;
        return (
          <div
            key={i}
            className="flex items-center justify-between text-[11px] px-2 py-1"
            style={{
              borderTop: isTotal ? '0.5px solid #fca5a5' : undefined,
              fontWeight: isTotal ? 600 : 400,
              color: isTotal ? '#7f1d1d' : '#991b1b',
            }}
          >
            <span className="flex-1 truncate pr-2">{safeStr(row.label)}</span>
            <span className="font-mono tabular-nums whitespace-nowrap">
              {formatAmount(row.amount, isSub)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Structured explanation renderer (question_bank Migration 034) ─
function StructuredExplanationView({ item }: { item: QuizItemWithContext }) {
  const { context_background, context_trigger, rule_title, rule_items, trigger, trap, speed, exp } = item;
  const hasStructured = !!(context_background || rule_title || trap || speed);

  if (!hasStructured) {
    return (
      <div className="text-sm text-[#0f172a] leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MD_COMPONENTS as never}>
          {exp}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {context_background && (
        <div className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">CONTEXT</div>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MONO_MD_COMPONENTS as never}>
            {context_background}
          </ReactMarkdown>
          {context_trigger && (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MONO_MD_COMPONENTS as never}>
              {`→ ${context_trigger}`}
            </ReactMarkdown>
          )}
        </div>
      )}
      {rule_title && (
        <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">
            RULE: {rule_title}
          </div>
          {rule_items && rule_items.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {rule_items.map((line, i) => (
                <div key={i} className="text-[0.72rem] font-mono leading-relaxed">{line}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {trigger && (
        <div className="rounded-xl p-3" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1.5">TRIGGER</div>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MONO_MD_COMPONENTS as never}>
            {trigger}
          </ReactMarkdown>
        </div>
      )}
      {trap && (
        <div className="rounded-xl p-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5">TRAP ⚠️</div>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MONO_MD_COMPONENTS as never}>
            {trap}
          </ReactMarkdown>
        </div>
      )}
      {speed && (
        <div className="rounded-xl p-3" style={{ background: '#eff6ff', border: '1px solid #c7d2fe' }}>
          <div className="text-[10px] font-bold text-[#4f6ef7] uppercase tracking-wider mb-1.5">SPEED</div>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MONO_MD_COMPONENTS as never}>
            {speed}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// Detect financial data blocks and convert them to markdown bullet lists for
// mobile readability. Handles three formats found in question_bank:
//   1. "Label: $amount"  (CF_008, CASH_001)
//   2. "Label   $amount" (RATIO_004)
//   3. Space-aligned columns, amounts without $, continuation lines (IS_001)
function formatFinancialQuestion(text: string): string {
  return text
    .split(/\n\n/)
    .map(block => {
      const rawLines = block.split('\n');
      const trimmedLines = rawLines.filter(l => l.trim());
      if (trimmedLines.length < 3) return block;

      // Pattern 1 — "Label: $amount"
      if (trimmedLines.filter(l => /:\s*\$/.test(l)).length >= 3) {
        return trimmedLines.map(l => `- ${l.trim()}`).join('\n');
      }

      // Pattern 2 — "Label   $amount" (space-aligned with $)
      if (trimmedLines.filter(l => /\S.*\s{2,}\$[\d,.()\-]+/.test(l)).length >= 2) {
        return trimmedLines
          .map(l => `- ${l.trim().replace(/\s{2,}(\$)/, ': $')}`)
          .join('\n');
      }

      // Pattern 3 — space-aligned columns, amounts may lack $ (IS_001)
      if (trimmedLines.filter(l => /\S.*\s{2,}[\d,.()\-]+\s*$/.test(l)).length >= 3) {
        const joined: string[] = [];
        for (const line of rawLines) {
          if (!line.trim()) continue;
          if (/^\s+\S/.test(line) && joined.length > 0) {
            joined[joined.length - 1] += ' ' + line.trim();
          } else {
            joined.push(line);
          }
        }
        return joined
          .map(l => `- ${l.trim().replace(/\s{2,}(\$?)/, ': $1')}`)
          .join('\n');
      }

      return block;
    })
    .join('\n\n');
}

// Shared markdown component map for exp/concept-card blocks.
// Tight spacing, small table that scrolls horizontally if it overflows.
const MD_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-1.5 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-5 my-1 flex flex-col gap-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-5 my-1 flex flex-col gap-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className?.includes('language-')) {
      return (
        <pre
          className="my-2 p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
          style={{ background: '#f1f5f9', color: '#0f172a' }}
        >
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="px-1 py-0.5 rounded text-[11px] font-mono bg-black/5">{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  hr: () => <hr className="my-2 border-black/10" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 pl-3 my-2 text-sm italic border-current opacity-80">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-xs border border-black/10 w-full">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead style={{ background: 'rgba(0,0,0,0.04)' }}>{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-black/10 px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-black/10 px-2 py-1 align-top">{children}</td>
  ),
};

const MONO_MD_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-[0.72rem] font-mono leading-relaxed mb-1 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc ml-4 my-0.5 flex flex-col gap-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal ml-4 my-0.5 flex flex-col gap-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[0.72rem] font-mono leading-relaxed">{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-0.5 rounded text-[0.68rem] font-mono bg-black/5">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};

export interface QuizItemWithContext {
  topicId: string;
  topicLabel: string;
  areaColor: string;
  q: string;
  opts: [string, string, string, string];
  ans: number;
  exp: string;
  /** Validator confidence from /api/generate-question. Drives the
   * uncertainty banner above the question card. */
  confidence?: 'high' | 'medium' | 'low';
  warning?: string | null;
  /** 내부 태그 — concept_stats 누적. stem/exp에는 노출 안 됨. */
  sourceConcepts?: string[];
  sourceTrap?: string | null;
  // question_bank structured explanation columns (Migration 034)
  context_background?: string | null;
  context_trigger?: string | null;
  rule_title?: string | null;
  rule_items?: string[] | null;
  trigger?: string | null;
  trap?: string | null;
  speed?: string | null;
}

export interface QuizResult {
  topicId: string;
  topicLabel: string;
  correct: boolean;
  question: string;
  options: string[];
  selected: number;
  answer: number;
  /** Seconds from question display to selection click, or null if the
   * visible-time elapsed exceeded the 120s cap (treated as "don't count"). */
  elapsedSeconds: number | null;
  sourceConcepts?: string[];
  sourceTrap?: string | null;
}

interface QuizViewProps {
  questions: QuizItemWithContext[];
  onAnswer: (result: QuizResult) => void;
  onComplete: (results: QuizResult[]) => void;
  onRequestNext?: () => void;
  onConceptCardReady?: (card: ConceptCard, result: QuizResult) => void;
  /** Called when the student uses the uncertainty-banner "다음 문제로"
   * button to skip a low-confidence item. Parent is expected to log
   * the skip somewhere (e.g. quiz_logs with elapsed=null). */
  onSkip?: (current: QuizItemWithContext) => void;
  sessionMax?: number;
  isLoadingNext?: boolean;
  title?: string;
}

export default function QuizView({
  questions,
  onAnswer,
  onComplete,
  onRequestNext,
  onConceptCardReady,
  onSkip,
  sessionMax,
  isLoadingNext,
  title,
}: QuizViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);
  // Which question indexes have had their uncertainty banner dismissed.
  const [bannerDismissed, setBannerDismissed] = useState<Record<number, boolean>>({});

  // Structured concept card state (reset per question)
  const [cardData, setCardData] = useState<ConceptCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Per-question timer — only counts while the tab is visible AND the
  // user hasn't manually paused, capped at 120s. Going over the cap flags
  // the result as "don't count" (elapsedSeconds=null) so it's excluded
  // from averages.
  const ELAPSED_CAP_SEC = 120;
  const [elapsed, setElapsed] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Accumulated "active" milliseconds for the current question.
  const accumulatedRef = useRef<number>(0);
  // Wall-clock at which the current active streak started. Null when
  // paused by either the user or the browser tab going hidden.
  const visibleStartRef = useRef<number | null>(null);
  // Mirror of manualPaused for synchronous access inside timer callbacks.
  const manualPausedRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Compute total active milliseconds for the current question.
  const currentElapsedMs = useCallback((): number => {
    const base = accumulatedRef.current;
    return visibleStartRef.current !== null
      ? base + (Date.now() - visibleStartRef.current)
      : base;
  }, []);

  const foldStreakIntoAccumulator = useCallback(() => {
    if (visibleStartRef.current !== null) {
      accumulatedRef.current += Date.now() - visibleStartRef.current;
      visibleStartRef.current = null;
    }
  }, []);

  const openPanel = useClaudeStore((s) => s.openPanel);
  const current = questions[currentIdx];
  const { sendQuizExplanation } = useClaudeChat(current?.topicLabel);
  const [calcOpen, setCalcOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(true);    // 해설: 기본 펼침
  const [cardOpen, setCardOpen] = useState(false); // 개념 카드: 기본 접힘

  // Start/restart when the displayed question changes. Stop on answer /
  // unmount / session completion. Auto-pauses while the tab is hidden
  // (Page Visibility API) AND while the user manually paused — both fold
  // into the same "streak / accumulator" model.
  useEffect(() => {
    if (!current || selected !== null) {
      stopTimer();
      return;
    }

    // Reset accumulators and manual pause for the new question.
    accumulatedRef.current = 0;
    setManualPaused(false);
    manualPausedRef.current = false;
    visibleStartRef.current =
      typeof document !== 'undefined' && document.visibilityState === 'visible'
        ? Date.now()
        : null;
    setElapsed(0);

    const tick = () => {
      const ms = currentElapsedMs();
      const sec = Math.floor(ms / 1000);
      if (sec >= ELAPSED_CAP_SEC) {
        setElapsed(ELAPSED_CAP_SEC);
        // Freeze the ticker — further counting is meaningless once we'll
        // record null anyway.
        stopTimer();
        return;
      }
      setElapsed(sec);
    };
    timerRef.current = setInterval(tick, 250);

    const onVis = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        // Freeze: fold the current visible streak into the accumulator.
        foldStreakIntoAccumulator();
      } else {
        // Only auto-resume if the user hasn't also manually paused.
        if (visibleStartRef.current === null && !manualPausedRef.current) {
          visibleStartRef.current = Date.now();
          if (timerRef.current === null) {
            timerRef.current = setInterval(tick, 250);
          }
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      stopTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [currentIdx, current, selected, stopTimer, currentElapsedMs, foldStreakIntoAccumulator]);

  // ── Manual pause / resume handlers ─────────────────────────
  const handlePauseClick = useCallback(() => {
    if (manualPausedRef.current) return;
    foldStreakIntoAccumulator();
    manualPausedRef.current = true;
    setManualPaused(true);
    stopTimer();
  }, [foldStreakIntoAccumulator, stopTimer]);

  const handleResumeClick = useCallback(() => {
    if (!manualPausedRef.current) return;
    manualPausedRef.current = false;
    setManualPaused(false);
    // Only actually restart the streak if the tab is currently visible.
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      if (visibleStartRef.current === null) visibleStartRef.current = Date.now();
      if (timerRef.current === null) {
        timerRef.current = setInterval(() => {
          const ms = currentElapsedMs();
          const sec = Math.floor(ms / 1000);
          if (sec >= ELAPSED_CAP_SEC) {
            setElapsed(ELAPSED_CAP_SEC);
            stopTimer();
            return;
          }
          setElapsed(sec);
        }, 250);
      }
    }
  }, [currentElapsedMs, stopTimer]);

  const handleSelect = useCallback(
    (i: number) => {
      if (selected !== null || !current) return;
      // Snapshot the active-time elapsed at click. `currentElapsedMs`
      // already returns the correct value in the paused case (accumulator
      // only, no live streak). Implicitly clear manual pause so the next
      // question starts cleanly if anything depends on that flag.
      if (manualPausedRef.current) {
        manualPausedRef.current = false;
        setManualPaused(false);
      }
      const rawSec = Math.floor(currentElapsedMs() / 1000);
      const loggedElapsed: number | null = rawSec >= ELAPSED_CAP_SEC ? null : rawSec;
      stopTimer();
      // Freeze the display at the uncapped value (or the cap) — the effect
      // will no-op because `selected` becomes non-null on the next render.
      setElapsed(Math.min(rawSec, ELAPSED_CAP_SEC));
      setSelected(i);

      // Fire result up to parent immediately
      const correct = i === current.ans;
      const result: QuizResult = {
        topicId: current.topicId,
        topicLabel: current.topicLabel,
        correct,
        question: current.q,
        options: [...current.opts],
        selected: i,
        answer: current.ans,
        elapsedSeconds: loggedElapsed,
        sourceConcepts: current.sourceConcepts,
        sourceTrap: current.sourceTrap ?? null,
      };
      onAnswer(result);
      setResults((prev) => [...prev, result]);

      // Fetch structured concept card
      setCardData(null);
      setCardError(null);
      setCardLoading(true);
      fetchConceptCard({
        moduleId: current.topicId,
        moduleName: current.topicLabel,
        question: current.q,
        options: [...current.opts],
        correctIdx: current.ans,
        selectedIdx: i,
      })
        .then((card) => {
          setCardData(card);
          onConceptCardReady?.(card, result);
        })
        .catch((e) => setCardError(e instanceof Error ? e.message : 'concept card 실패'))
        .finally(() => setCardLoading(false));
    },
    [selected, current, onAnswer],
  );

  const handleNext = useCallback(() => {
    if (!current || selected === null) return;
    const nextIdx = currentIdx + 1;
    const atSessionMax = sessionMax !== undefined && nextIdx >= sessionMax;

    if (atSessionMax) {
      setFinished(true);
      onComplete(results);
      return;
    }

    // Dynamic mode: ask parent to fetch next question
    if (onRequestNext && nextIdx >= questions.length) {
      onRequestNext();
    }
    setCurrentIdx(nextIdx);
    setSelected(null);
    setCardData(null);
    setCardError(null);
    setExpOpen(true);
    setCardOpen(false);
  }, [current, selected, currentIdx, questions.length, onRequestNext, sessionMax, results, onComplete]);

  // Skip the current low-confidence question without recording an answer.
  // Parent receives the skipped item to persist (elapsed=null).
  const handleBannerSkip = useCallback(() => {
    if (!current) return;
    onSkip?.(current);
    stopTimer();

    const nextIdx = currentIdx + 1;
    const atSessionMax = sessionMax !== undefined && nextIdx >= sessionMax;
    if (atSessionMax) {
      setFinished(true);
      onComplete(results);
      return;
    }
    if (onRequestNext && nextIdx >= questions.length) {
      onRequestNext();
    }
    setCurrentIdx(nextIdx);
    setSelected(null);
    setCardData(null);
    setCardError(null);
  }, [
    current,
    currentIdx,
    questions.length,
    onRequestNext,
    sessionMax,
    results,
    onComplete,
    onSkip,
    stopTimer,
  ]);

  const handleBannerDismiss = useCallback(() => {
    setBannerDismissed((prev) => ({ ...prev, [currentIdx]: true }));
  }, [currentIdx]);

  const handleClaudeExplain = useCallback(() => {
    if (!current || selected === null) return;
    const ctx: QuizContext = {
      q: current.q,
      opts: current.opts,
      ans: current.ans,
      selected,
      topicLabel: current.topicLabel,
    };
    useClaudeStore.getState().setPendingQuiz(ctx);
    openPanel();
    // No auto-send — ClaudePanel renders Short Starter buttons instead.
  }, [current, selected, openPanel]);
  void sendQuizExplanation;

  const cardRef = useRef<HTMLDivElement>(null);

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const topicMap: Record<string, { correct: number; total: number; label: string }> = {};
    results.forEach((r) => {
      if (!topicMap[r.topicId]) topicMap[r.topicId] = { correct: 0, total: 0, label: r.topicLabel };
      topicMap[r.topicId].total++;
      if (r.correct) topicMap[r.topicId].correct++;
    });

    return (
      <div className="card p-6 flex flex-col gap-5">
        <div className="text-center">
          <p className="text-5xl mb-2">{pct >= 80 ? '🎉' : pct >= 60 ? '📚' : '💪'}</p>
          <p className="text-2xl font-bold text-[#0f172a]">{pct}%</p>
          <p className="text-sm text-muted mt-1">{total}문제 중 {correct}문제 정답</p>
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(topicMap).map(([id, data]) => {
            const topicPct = Math.round((data.correct / data.total) * 100);
            const color = topicPct >= 80 ? '#22c55e' : topicPct >= 60 ? '#f59e0b' : '#ef4444';
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="text-xs text-[#0f172a] flex-1 truncate">{data.label}</span>
                <div className="w-24 h-1.5 rounded-full bg-gray-200">
                  <div className="h-full rounded-full" style={{ width: `${topicPct}%`, background: color }} />
                </div>
                <span className="text-xs font-medium w-8 text-right" style={{ color }}>{topicPct}%</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 rounded-xl font-semibold text-white text-sm"
          style={{ background: '#4f6ef7' }}
        >
          새 세션 시작
        </button>
      </div>
    );
  }

  if (!current) {
    // No current item AND we still have a non-empty questions array
    // means our currentIdx walked past the last fetched item — usually a
    // race after handleNext fires onRequestNext but the parent hasn't
    // appended the new item yet. Show a tiny placeholder so the user
    // sees *something* instead of a blank canvas.
    if (questions.length === 0 && isLoadingNext) {
      return (
        <div className="card p-8 text-center">
          <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">다음 문제 생성 중...</p>
        </div>
      );
    }
    return null;
  }

  // Defensive: server-side schema is well-defined, but if Claude ever
  // returns an empty stem or malformed options the UI silently went
  // blank. Detect and surface it so the student isn't stuck on a
  // visually empty card with no way to advance.
  const hasValidStem = typeof current.q === 'string' && current.q.trim().length > 0;
  const hasValidOpts =
    Array.isArray(current.opts) &&
    current.opts.length === 4 &&
    current.opts.every((o) => typeof o === 'string');
  if (!hasValidStem || !hasValidOpts) {
    console.warn('[QuizView] received malformed question, skipping render', {
      currentIdx,
      current,
      questionsLength: questions.length,
    });
    return (
      <div className="card p-6 flex flex-col gap-3 text-center">
        <p className="text-3xl">⚠️</p>
        <p className="font-semibold text-[#0f172a]">문제 데이터가 비어 있습니다</p>
        <p className="text-xs text-muted">
          AI가 빈 응답을 반환했어요. 다음 문제로 넘어가거나 새로고침해주세요.
        </p>
        <button
          onClick={() => {
            stopTimer();
            const nextIdx = currentIdx + 1;
            if (onRequestNext && nextIdx >= questions.length) onRequestNext();
            setCurrentIdx(nextIdx);
            setSelected(null);
            setCardData(null);
            setCardError(null);
          }}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#4f6ef7' }}
        >
          다음 문제 →
        </button>
      </div>
    );
  }

  const optLabels = ['A', 'B', 'C', 'D'];
  const progressPct = sessionMax ? (currentIdx / sessionMax) * 100 : 0;
  const isLastFetchedAndLoading = currentIdx >= questions.length - 1 && isLoadingNext;

  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${current.areaColor}` }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-2 mb-2">
          {title && <p className="text-xs font-semibold text-muted">{title}</p>}
          <div className="flex items-center gap-2 ml-auto">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: current.areaColor + '18', color: current.areaColor }}
            >
              {current.topicId} · {current.topicLabel}
            </span>
            {(() => {
              const capped = elapsed >= ELAPSED_CAP_SEC;
              const tone = elapsedTone(elapsed);
              const canToggle = selected === null && !capped;
              return (
                <div className="flex items-center gap-1">
                  <span
                    className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full"
                    style={{
                      background: tone.color + '18',
                      color: manualPaused ? '#64748b' : tone.color,
                      fontWeight: tone.bold ? 700 : 500,
                      border: `1px solid ${(manualPaused ? '#94a3b8' : tone.color)}40`,
                      opacity: manualPaused ? 0.7 : 1,
                    }}
                    title={
                      capped
                        ? '120초 초과 — 이 문제는 평균 시간 계산에서 제외됩니다'
                        : manualPaused
                        ? '일시정지됨 — ▶를 눌러 재개'
                        : '문제 풀이 경과 시간 (탭 전환 시 자동 일시정지)'
                    }
                  >
                    ⏱ {formatElapsed(elapsed)}
                    {capped && '+'}
                  </span>
                  {canToggle && (
                    <button
                      onClick={manualPaused ? handleResumeClick : handlePauseClick}
                      aria-label={manualPaused ? '타이머 재개' : '타이머 일시정지'}
                      title={manualPaused ? '재개' : '일시정지'}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] transition-colors hover:bg-gray-100"
                      style={{
                        border: '1px solid #e2e8f0',
                        color: manualPaused ? '#22c55e' : '#64748b',
                      }}
                    >
                      {manualPaused ? '▶' : '⏸'}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, background: current.areaColor }}
          />
        </div>
        <p className="text-xs text-muted mt-1">
          {currentIdx + 1} / {sessionMax ?? questions.length}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Uncertainty banner — shown only for validator-flagged items. */}
        {(() => {
          const level = current.confidence;
          const hasWarning = typeof current.warning === 'string' && current.warning.trim().length > 0;
          const show =
            (level === 'medium' || level === 'low') &&
            hasWarning &&
            !bannerDismissed[currentIdx];
          if (!show) return null;

          const theme =
            level === 'low'
              ? { bg: '#FCEBEB', border: '#E24B4A', text: '#7f1d1d' }
              : { bg: '#FAEEDA', border: '#EF9F27', text: '#78350f' };

          return (
            <div
              className="rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2"
              style={{
                background: theme.bg,
                borderLeft: `3px solid ${theme.border}`,
              }}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-base shrink-0">⚠️</span>
                <p
                  className="text-xs leading-snug flex-1"
                  style={{ color: theme.text }}
                >
                  {current.warning}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={handleBannerDismiss}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-md"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    color: theme.text,
                    border: `1px solid ${theme.border}80`,
                  }}
                >
                  계속 풀기
                </button>
                <button
                  onClick={handleBannerSkip}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-white"
                  style={{ background: theme.border }}
                >
                  다음 문제로
                </button>
              </div>
            </div>
          );
        })()}

        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-medium text-[#0f172a] leading-relaxed flex-1 min-w-0">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={MD_COMPONENTS as never}>
              {formatFinancialQuestion(current.q)}
            </ReactMarkdown>
          </div>
          <button
            onClick={() => setCalcOpen(true)}
            className="shrink-0 text-xs px-2 py-1 rounded-lg hover:bg-gray-100"
            style={{ border: '1px solid #e2e8f0', color: '#475569' }}
            title="계산기"
          >
            🧮
          </button>
        </div>

        {questionNeedsPVFVTable(current.q) && <PVFVTable />}

        <QuizCalculator open={calcOpen} onClose={() => setCalcOpen(false)} />

        <div className="flex flex-col gap-2">
          {current.opts.map((opt, i) => {
            let style: React.CSSProperties = { border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a' };
            if (selected !== null) {
              if (i === current.ans) style = { border: '1.5px solid #22c55e', background: '#f0fdf4', color: '#166534' };
              else if (i === selected) style = { border: '1.5px solid #ef4444', background: '#fff5f5', color: '#991b1b' };
              else style = { border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#94a3b8' };
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
                style={style}
              >
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      selected !== null && i === current.ans
                        ? '#22c55e'
                        : selected !== null && i === selected && i !== current.ans
                        ? '#ef4444'
                        : '#f1f5f9',
                    color: selected !== null && (i === current.ans || i === selected) ? 'white' : '#64748b',
                  }}
                >
                  {optLabels[i]}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <>
            {/* 정답 해설 accordion */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #c7d2fe' }}>
              <button
                onClick={() => setExpOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: '#f8faff' }}
              >
                <span className="text-xs font-semibold text-[#4f6ef7]">💡 정답 해설</span>
                <span className="text-xs text-[#4f6ef7]">{expOpen ? '▲' : '▼'}</span>
              </button>
              {expOpen && (
                <div className="px-4 pb-4 pt-1" style={{ background: '#f8faff' }}>
                  <StructuredExplanationView item={current} />
                  <FeedbackButtons
                    messageId={`quiz-exp-${current.topicId}-${currentIdx}`}
                    messagePreview={current.exp}
                    source="quiz"
                    topicId={current.topicId}
                  />
                </div>
              )}
            </div>

            {/* 개념 카드 accordion */}
            <div
              ref={cardRef}
              className="rounded-xl overflow-hidden"
              style={{ border: '1.5px solid #fde68a' }}
            >
              <button
                onClick={() => setCardOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: '#fffbeb' }}
              >
                <span className="text-xs font-semibold text-[#92400e]">
                  🧠 개념 카드
                  {cardLoading && !cardData && ' 🔄'}
                  {cardData && ' ✅'}
                  {cardData && ` · ${typeLabel(cardData.type)}`}
                </span>
                <span className="text-xs text-[#92400e]">{cardOpen ? '▲' : '▼'}</span>
              </button>
              {cardOpen && (
                <div className="px-4 pb-4 pt-1" style={{ background: '#fffbeb' }}>
                  {cardError ? (
                    <p className="text-sm text-[#991b1b]">⚠️ {cardError}</p>
                  ) : cardLoading && !cardData ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <div className="w-3 h-3 border-2 border-[#92400e] border-t-transparent rounded-full animate-spin" />
                      <span>구조 분석 중...</span>
                    </div>
                  ) : cardData ? (
                    <ConceptCardView card={cardData} />
                  ) : null}
                </div>
              )}
            </div>

            {selected !== current.ans && (
              <ErrorTagSection
                key={`${current.topicId}-${currentIdx}`}
                question={current.q}
                userAnswer={current.opts[selected] ?? ''}
                correctAnswer={current.opts[current.ans] ?? ''}
                topicId={current.topicId}
                topicLabel={current.topicLabel}
                quizLogId={null}
              />
            )}

            <button
              onClick={handleClaudeExplain}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium hover:bg-[#eef2ff]"
              style={{ border: '1.5px solid #c7d2fe', color: '#4f6ef7' }}
            >
              📋 Claude에게 심층 해설 요청
            </button>

            <button
              onClick={handleNext}
              disabled={isLastFetchedAndLoading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: current.areaColor }}
            >
              {isLastFetchedAndLoading
                ? '다음 문제 생성 중...'
                : sessionMax && currentIdx + 1 >= sessionMax
                ? '결과 보기 →'
                : '다음 문제 →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
