import { useMemo, useState } from 'react';

type SectionKey = 'assets' | 'liabilities' | 'equity';

interface Item {
  id: string;
  number: number;
  title: string;
  summary: string;
  details: { label?: string; text: string }[];
}

interface Section {
  key: SectionKey;
  label: string;
  emoji: string;
  tint: string;
  border: string;
  headerBg: string;
  headerColor: string;
  accent: string;
  items: Item[];
}

const SECTIONS: Section[] = [
  {
    key: 'assets',
    label: '자산 (Assets)',
    emoji: '💎',
    tint: '#eff6ff',
    border: '#bfdbfe',
    headerBg: '#dbeafe',
    headerColor: '#1e3a8a',
    accent: '#2563eb',
    items: [
      {
        id: 'cash',
        number: 1,
        title: 'Cash & Foreign Currency',
        summary: 'Cash: Face Value · Foreign Currency: CMV',
        details: [
          { label: 'Cash', text: 'Face Value (액면가)' },
          {
            label: 'Foreign Currency',
            text: 'CMV (Current Market Value) — 환율 변동은 FX Translation G/L로 인식',
          },
        ],
      },
      {
        id: 'st-invest',
        number: 2,
        title: 'S/T Investment',
        summary: 'Trading: FV → PL',
        details: [
          {
            label: 'Trading Securities',
            text: 'Fair Value로 측정. Unrealized G/L은 즉시 I/S(당기손익) 반영',
          },
        ],
      },
      {
        id: 'ar',
        number: 3,
        title: 'Accounts Receivable',
        summary: 'NRV = AR − Allowance for Doubtful Accounts',
        details: [
          {
            text: 'NRV(Net Realizable Value) = 매출채권 총액 − 대손충당금',
          },
          {
            text: '대손충당금은 기대 회수불능액을 차감하여 순실현가능가치로 보고',
          },
        ],
      },
      {
        id: 'inventory',
        number: 4,
        title: 'Inventory',
        summary: '기본: Lower of Cost or NRV',
        details: [
          { label: '기본 원칙', text: 'Lower of Cost or NRV' },
          { label: 'FIFO / Average', text: 'NRV 기준으로 평가' },
          {
            label: 'LIFO / Retail',
            text:
              'C/Cost = R/Cost (Current Cost = Replacement Cost)\n' +
              '  · Ceiling = NRV\n' +
              '  · Floor = NRV − Normal Profit\n' +
              'Market은 Ceiling과 Floor 사이로 제한',
          },
        ],
      },
      {
        id: 'lt-invest',
        number: 5,
        title: 'L/T Investment',
        summary: 'AFS / HTM / Equity Method',
        details: [
          {
            label: 'AFS (Available-for-Sale)',
            text: 'Fair Value. Unrealized G/L → OCI 누적. 매각 시 PL로 재분류',
          },
          {
            label: 'HTM (Held-to-Maturity)',
            text: 'Amortized Cost (상각후원가). 시장가치 변동은 미반영',
          },
          {
            label: 'Equity Method',
            text: 'FV × 지분율(%) — 피투자회사 순자산 변동을 지분만큼 반영',
          },
          {
            label: 'Impairment',
            text: 'US GAAP: 손상 인식 후 회복 불가 (No reversal)',
          },
        ],
      },
      {
        id: 'ppe',
        number: 6,
        title: 'PP&E',
        summary: 'Historical Cost − Accumulated Depreciation',
        details: [
          { label: '기본', text: 'Historical Cost − Accumulated Depreciation' },
          {
            label: 'Available for Sale',
            text: 'Lower of (PP&E BV, NRV) — 보유 의도가 매각으로 전환된 자산',
          },
          {
            label: 'Impairment Test',
            text:
              'PP&E BV vs Recoverable Amount\n' +
              '  · BV > 미래 undiscounted cash flows → 손상 가능성\n' +
              '  · 손상액 = BV − Fair Value',
          },
        ],
      },
      {
        id: 'intangible',
        number: 7,
        title: 'Intangible Asset',
        summary: 'Definite Life: Cost − Amortization',
        details: [
          {
            label: 'Definite Life',
            text: 'Cost − Accumulated Amortization (정액법이 일반적)',
          },
          {
            label: 'Indefinite Life (Goodwill 등)',
            text: '상각하지 않음. 매년 또는 사건 발생 시 손상평가',
          },
          {
            label: 'S/W Developed for Sale',
            text:
              'Lower of (BV, NRV)\n' +
              'BV = Max of:\n' +
              '  · 내용연수 기준 상각액\n' +
              '  · Realized Revenue / Total Expected Revenue 비율 상각액',
          },
        ],
      },
    ],
  },
  {
    key: 'liabilities',
    label: '부채 (Liabilities)',
    emoji: '📘',
    tint: '#f0fdf4',
    border: '#bbf7d0',
    headerBg: '#dcfce7',
    headerColor: '#14532d',
    accent: '#16a34a',
    items: [
      {
        id: 'bond',
        number: 8,
        title: 'Bond',
        summary: 'PV of (Principal + Interest) by Market Rate at issuance',
        details: [
          {
            text:
              '발행 시 시장이자율(Market Rate)로 원금과 이자의 현재가치 합계를 구함.\n' +
              '  · Stated Rate > Market Rate → Premium (할증발행)\n' +
              '  · Stated Rate < Market Rate → Discount (할인발행)\n' +
              '이후 유효이자율법으로 Premium/Discount 상각',
          },
        ],
      },
      {
        id: 'lease',
        number: 9,
        title: 'Lease Obligation',
        summary: 'PV of Remaining Cash Flows',
        details: [
          {
            text:
              '남은 리스료(Remaining Cash Flows)의 현재가치.\n' +
              '할인율: Implicit Rate 우선, 미상정 시 Incremental Borrowing Rate',
          },
        ],
      },
      {
        id: 'pbo',
        number: 10,
        title: 'PBO (Projected Benefit Obligation)',
        summary: 'BB + Service + Interest + Actuarial ± Amendment − Payment',
        details: [
          {
            text:
              'PBO 기말잔액 계산식:\n\n' +
              '  Beginning Balance\n' +
              '  + Service Cost (당기근무원가)\n' +
              '  + Interest Cost (이자원가)\n' +
              '  ± Actuarial Gain/Loss (보험수리적 변동)\n' +
              '  ± Prior Service Cost (제도 개정 — Policy Amendment)\n' +
              '  − Benefit Payment (지급액)\n' +
              '  = Ending Balance',
          },
        ],
      },
    ],
  },
  {
    key: 'equity',
    label: '자본 (Equity)',
    emoji: '🟠',
    tint: '#fff7ed',
    border: '#fed7aa',
    headerBg: '#ffedd5',
    headerColor: '#9a3412',
    accent: '#ea580c',
    items: [
      {
        id: 'stock-option',
        number: 11,
        title: 'Stock Option',
        summary: 'FV at Grant Date spread over Service Period (≤ 3 years)',
        details: [
          {
            text:
              '부여일(Grant Date) Fair Value를 용역제공기간(Service Period)에 걸쳐 안분.\n' +
              'Service Period는 일반적으로 최대 3년.\n\n' +
              '매 기 분개:\n' +
              '  Dr. Compensation Expense\n' +
              '    Cr. APIC — Stock Options',
          },
        ],
      },
    ],
  },
];

const ABBREVIATIONS: { abbr: string; meaning: string }[] = [
  { abbr: 'CMV', meaning: 'Current Market Value — 현행 시장가치' },
  { abbr: 'NRV', meaning: 'Net Realizable Value — 순실현가능가치' },
  { abbr: 'PV', meaning: 'Present Value — 현재가치' },
  { abbr: 'FV', meaning: 'Fair Value — 공정가치' },
  { abbr: 'BV', meaning: 'Book Value — 장부가액' },
  { abbr: 'OCI', meaning: 'Other Comprehensive Income — 기타포괄손익' },
  { abbr: 'PL', meaning: 'Profit/Loss (I/S) — 당기손익' },
];

export default function ValuationPage() {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.summary.toLowerCase().includes(q) ||
          it.details.some(
            (d) =>
              (d.label ?? '').toLowerCase().includes(q) ||
              d.text.toLowerCase().includes(q),
          ),
      ),
    })).filter((sec) => sec.items.length > 0);
  }, [query]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">💰 Valuation</h1>
          <p className="text-xs text-muted mt-0.5">
            계정과목별 Valuation 기준 — 자산 · 부채 · 자본
          </p>
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="계정과목 검색 (예: Inventory, Bond, PBO)"
          className="w-full text-sm rounded-xl px-4 py-2.5 bg-white"
          style={{ border: '1.5px solid #e2e8f0', outline: 'none' }}
        />

        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-6">검색 결과가 없습니다.</p>
        )}

        {/* Sections */}
        {filtered.map((sec) => (
          <section
            key={sec.key}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1.5px solid ${sec.border}`, background: sec.tint }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{ background: sec.headerBg, color: sec.headerColor }}
            >
              <span>{sec.emoji}</span>
              <h2 className="font-bold text-sm">{sec.label}</h2>
              <span className="ml-auto text-[11px] opacity-70">{sec.items.length}개 항목</span>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {sec.items.map((it) => {
                const open = !!openIds[it.id];
                return (
                  <div
                    key={it.id}
                    className="rounded-xl bg-white"
                    style={{ border: `1px solid ${sec.border}` }}
                  >
                    <button
                      onClick={() => toggle(it.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: sec.accent }}
                      >
                        {it.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{it.title}</p>
                        <p className="text-[11px] text-muted truncate">{it.summary}</p>
                      </div>
                      <span className="text-muted text-xs shrink-0">{open ? '▴' : '▾'}</span>
                    </button>
                    {open && (
                      <div
                        className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t"
                        style={{ borderColor: sec.border }}
                      >
                        {it.details.map((d, i) => (
                          <div key={i} className="text-xs">
                            {d.label && (
                              <p
                                className="font-semibold mb-0.5"
                                style={{ color: sec.headerColor }}
                              >
                                {d.label}
                              </p>
                            )}
                            <p className="text-[#0f172a] whitespace-pre-wrap leading-relaxed">
                              {d.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Abbreviations */}
        <section
          className="rounded-2xl p-4"
          style={{ border: '1.5px solid #e2e8f0', background: 'white' }}
        >
          <p className="font-semibold text-sm text-[#0f172a] mb-2">📖 핵심 약어</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ABBREVIATIONS.map((a) => (
              <div key={a.abbr} className="flex gap-2 text-xs">
                <span
                  className="shrink-0 font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#eef2ff', color: '#4338ca' }}
                >
                  {a.abbr}
                </span>
                <span className="text-muted leading-relaxed">{a.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
