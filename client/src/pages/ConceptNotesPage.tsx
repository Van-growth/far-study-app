import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2'
import useStudyStore from '../store/studyStore'
import useClaudeStore from '../store/claudeStore'

// ── Constants ──────────────────────────────────────────────────────────────────
const NAVY = '#1a2744'

const CATEGORIES = [
  { id: 'bond',        label: 'Bond & TDR',                   groups: ['IA_CH8_BOND', 'IA_CH8_TDR'] },
  { id: 'lease',       label: 'Lease',                        groups: ['IA_CH8_LEASE'] },
  { id: 'note',        label: 'Note Payable & Interest',      groups: ['IA_CH8_NOTE', 'IA_CH8_INT'] },
  { id: 'aro',         label: 'ARO',                          groups: ['IA_CH8_ARO'] },
  { id: 'inventory',   label: 'Inventory',                    groups: ['IA_CH5_INV'] },
  { id: 'ppe',         label: 'PP&E & Depreciation',          groups: ['IA_CH4_PPE', 'IA_CH4_DEPR', 'IA_CH4_IMPAIR'] },
  { id: 'intangibles', label: 'Intangibles',                  groups: ['IA_CH4_INTANG'] },
  { id: 'revenue',     label: 'Revenue Recognition',          groups: ['IA_CH2_REV'] },
  { id: 'tax',         label: 'Deferred Tax',                 groups: ['IA_CH10_TAX'] },
  { id: 'eps',         label: 'EPS',                          groups: ['IA_CH9_EPS'] },
  { id: 'scf',         label: 'SCF',                          groups: ['IA_CH7_SCF'] },
  { id: 'investments', label: 'Investments & Equity Method',  groups: ['IA_CH6_INVEST'] },
  { id: 'equity',      label: "Stockholders' Equity",         groups: ['IA_CH9_EQUITY'] },
  { id: 'nfp',         label: 'NFP Accounting',               groups: ['IB_NFP'] },
  { id: 'gov',         label: 'Governmental Accounting',      groups: ['IB_GOV'] },
  { id: 'changes',     label: 'Accounting Changes & Errors',  groups: ['IA_CH11_CHANGE'] },
  { id: 'fv',          label: 'Fair Value',                   groups: ['IA_CH12_FV'] },
  { id: 'other',       label: 'Other',                        groups: [] },
] as const

type CategoryId = typeof CATEGORIES[number]['id']
type TabKey = 'content' | 'cards' | 'harry'

// ── Helpers ────────────────────────────────────────────────────────────────────
function getCardsForCategory(cat: typeof CATEGORIES[number]): TopicCard[] {
  if (cat.groups.length === 0) return []
  return PROFESSOR_SSOT_V2.filter(card =>
    cat.groups.some(g => (card as TopicCard & { topic_group?: string }).topic_group === g)
  )
}

// ── Structured Content Sections ────────────────────────────────────────────────

function BondContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Overview">
        <Table
          headers={['', 'Market Rate vs Coupon', 'Issue Price vs Face']}
          rows={[
            ['Premium', 'Market < Coupon', 'Issue > Face'],
            ['Discount', 'Market > Coupon', 'Issue < Face'],
          ]}
        />
      </Section>

      <Section title="2. PV Calculation">
        <p style={{ marginBottom: 8 }}>
          <strong>Issue Price = PV of Coupons + PV of Principal</strong>
        </p>
        <CodeBlock>{`Premium (coupon 6%, market 4%, 5yr):
  $6,000 × 4.4518  = $26,711
  $100,000 × 0.8219 = $82,190
  Issue Price       = $108,901

Discount (coupon 6%, market 8%, 5yr):
  $6,000 × 3.9927  = $23,956
  $100,000 × 0.6806 = $68,060
  Issue Price       = $92,016`}</CodeBlock>
      </Section>

      <Section title="3. Journal Entries — Issuance">
        <CodeBlock>{`Premium:
  Dr. Cash            108,000
    Cr. Bonds Payable          100,000
    Cr. Premium on Bonds         8,000

Discount:
  Dr. Cash             92,000
  Dr. Discount on Bonds  8,000
    Cr. Bonds Payable          100,000`}</CodeBlock>
      </Section>

      <Section title="4. Straight-Line Amortization (SL) — Premium Example">
        <Table
          headers={['Year', 'Int Exp', 'Cash Paid', 'Amort', 'Carrying Value']}
          rows={[
            ['1', '4,400', '6,000', '1,600', '106,400'],
            ['2', '4,400', '6,000', '1,600', '104,800'],
            ['3', '4,400', '6,000', '1,600', '103,200'],
            ['4', '4,400', '6,000', '1,600', '101,600'],
            ['5', '4,400', '6,000', '1,600', '100,000'],
          ]}
        />
        <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
          SL Amort = $8,000 premium ÷ 5 years = $1,600/yr
        </p>
      </Section>

      <Section title="5. Effective Interest (EI) — Premium (108,000 × 4%)">
        <Table
          headers={['Year', 'Int Exp (BV×4%)', 'Cash Paid', 'Amort', 'Ending BV']}
          rows={[
            ['1', '4,320', '6,000', '1,680', '106,320'],
            ['2', '4,253', '6,000', '1,747', '104,573'],
            ['3', '4,183', '6,000', '1,817', '102,756'],
            ['4', '4,110', '6,000', '1,890', '100,866'],
            ['5', '4,035*', '6,000', '1,965', '100,000'],
          ]}
        />
      </Section>

      <Section title="6. Effective Interest (EI) — Discount (92,000 × 8%)">
        <Table
          headers={['Year', 'Int Exp (BV×8%)', 'Cash Paid', 'Amort', 'Ending BV']}
          rows={[
            ['1', '7,360', '6,000', '1,360', '93,360'],
            ['2', '7,469', '6,000', '1,469', '94,829'],
            ['3', '7,586', '6,000', '1,586', '96,415'],
            ['4', '7,713', '6,000', '1,713', '98,128'],
            ['5', '7,872*', '6,000', '1,872', '100,000'],
          ]}
        />
      </Section>

      <Section title="7. Early Retirement">
        <CodeBlock>{`Net Carrying Value = Face ± Unamortized Premium/Discount
Gain/Loss = Net CV − Reacquisition Price
→ Reported on Income Statement (ordinary item)`}</CodeBlock>
      </Section>

      <TrapBox items={[
        '"sold to yield X%" → use X% as the discount factor only',
        'Never omit Principal PV from issue price calculation',
        'SL vs EI: BV differs at interim dates → early retirement produces different gain/loss',
      ]} />
    </div>
  )
}

function LeaseContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Finance Lease — Classification (TBORTS)">
        <Table
          headers={['Criterion', 'Threshold']}
          rows={[
            ['T — Title Transfer', 'Ownership passes at end'],
            ['B — Bargain Purchase Option', 'BPO likely exercised'],
            ['O — Lease term ≥ 75%', '≥ 75% of economic life'],
            ['R — PV ≥ 90%', 'PV of payments ≥ 90% of FV'],
            ['S — Specialized asset', 'No alternative use to lessor'],
          ]}
        />
      </Section>

      <Section title="Finance Lease — Day 1 Entry">
        <CodeBlock>{`Dr. ROU Asset          84,248
  Cr. Lease Liability          84,248
  (= PV of future payments)`}</CodeBlock>
      </Section>

      <Section title="Finance Lease — Amortization Table ($20K/yr, 6%, 5yr, PV=84,248)">
        <Table
          headers={['Year', 'Int Exp (BV×6%)', 'Payment', 'Principal', 'Ending BV']}
          rows={[
            ['1', '5,055', '20,000', '14,945', '69,303'],
            ['2', '4,158', '20,000', '15,842', '53,461'],
            ['3', '3,208', '20,000', '16,792', '36,669'],
            ['4', '2,200', '20,000', '17,800', '18,869'],
            ['5', '1,131', '20,000', '18,869', '0'],
          ]}
        />
      </Section>

      <Section title="Annuity Due vs Ordinary Annuity">
        <CodeBlock>{`Ordinary Annuity  → payments at END of period
Annuity Due       → payments at BEGINNING of period
                   PV(Due) = PV(Ordinary) × (1 + r)
                   → Due is LARGER (first payment discounted 0 periods)`}</CodeBlock>
      </Section>

      <Section title="Rate Priority">
        <CodeBlock>{`1st choice: Implicit rate (if known to lessee)
2nd choice: Incremental Borrowing Rate (IBR)`}</CodeBlock>
      </Section>

      <Section title="Operating Lease (ASC 842)">
        <CodeBlock>{`I/S: Straight-line lease expense (uniform each period)
B/S: ROU Asset + Lease Liability (both recognized)

ROU Amortization (plug):
  ROU Amort = SL Expense − Interest Expense`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Annuity Due vs Ordinary: Due → first payment today → higher PV',
        'Implicit rate available → must use it, not IBR',
        'Operating lease: I/S = SL expense; B/S liability = EI basis (different!)',
      ]} />
    </div>
  )
}

function NoteContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Interest Calculation">
        <CodeBlock>{`Interest = Beginning Principal × Rate × (months / 12)

Example: Borrowed $1,000,000 on Sep 30 @ 9%
  → 3 months remain in year
  → Interest = $1,000,000 × 9% × 3/12 = $22,500`}</CodeBlock>
      </Section>
      <Section title="Key Rule">
        <p>Use <strong>Beginning Balance × rate × time fraction</strong>. Never use payment amount directly for interest calculation.</p>
      </Section>
      <TrapBox items={[
        'Accrued interest at year-end: use days/months outstanding, not full year',
        'Do NOT confuse payment amount with interest expense',
      ]} />
    </div>
  )
}

function AroContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Day 1 Recognition">
        <CodeBlock>{`Recognize at Present Value using credit-adjusted risk-free rate

Dr. PP&E (Asset)         60,000   ← ARO PV added to asset cost
  Cr. Cash / Cr. Payable              (acquisition cost)
  Cr. ARO Liability        60,000  ← PV of future dismantlement`}</CodeBlock>
      </Section>

      <Section title="Subsequent Measurement">
        <CodeBlock>{`Two parallel tracks:

Asset Track  → Depreciate ROU/PP&E (straight-line or units)
Liability Track → Accretion each year

Accretion = Beginning ARO Balance × credit-adjusted rate`}</CodeBlock>
      </Section>

      <Section title="Accretion Example (ARO=$60,000, Rate=5%)">
        <Table
          headers={['Year', 'Beg ARO', 'Accretion', 'End ARO']}
          rows={[
            ['1', '60,000', '3,000', '63,000'],
            ['2', '63,000', '3,150', '66,150'],
            ['3', '66,150', '3,308', '69,458'],
          ]}
        />
      </Section>

      <TrapBox items={[
        'ARO uses credit-adjusted risk-free rate (not plain risk-free)',
        'Accretion ≠ depreciation — they are separate expense lines',
        'Rate changes: new layer approach for revisions',
      ]} />
    </div>
  )
}

function EpsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Basic EPS">
        <CodeBlock>{`Basic EPS = Net Income Available to Common ÷ WASO
  (WASO = Weighted Average Shares Outstanding)`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Convertible Bonds">
        <CodeBlock>{`Add back: After-tax interest = Face × coupon rate × (1 − tax rate)
Add shares: # bonds × conversion ratio
→ Include only if DILUTIVE (decreases EPS)`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Convertible Preferred">
        <CodeBlock>{`Add back: Preferred dividends (no tax shield — already after-tax)
Add shares: # preferred × conversion ratio`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Stock Options (Treasury Stock Method)">
        <CodeBlock>{`Proceeds = Options × Exercise Price
Shares repurchased = Proceeds ÷ Avg Market Price
Net new shares = Options issued − Shares repurchased

Example: 1,000 options @ $20 exercise, $25 avg market
  Proceeds = $20,000
  Repurchased = $20,000 ÷ $25 = 800
  Net dilutive shares = 200`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Antidilutive securities → EXCLUDE from diluted EPS',
        'Convertible bonds: interest add-back must be after-tax',
        'Convertible preferred: no tax shield → add back full dividend amount',
        'Options in-the-money → always dilutive; out-of-the-money → antidilutive',
      ]} />
    </div>
  )
}

function TaxContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Temporary Differences">
        <Table
          headers={['Type', 'Direction', 'Balance Sheet Item']}
          rows={[
            ['Deductible temp diff', 'Tax deduction later', 'DTA (Deferred Tax Asset)'],
            ['Taxable temp diff', 'Taxable income later', 'DTL (Deferred Tax Liability)'],
          ]}
        />
      </Section>

      <Section title="Permanent Differences — No DTA/DTL">
        <CodeBlock>{`Meals & Entertainment (50% disallowed)
Tax-exempt municipal bond interest
Fines and penalties
Life insurance proceeds on key employees`}</CodeBlock>
      </Section>

      <Section title="Key Rules (ASC 740)">
        <CodeBlock>{`Rate: Use ENACTED tax rate at balance sheet date
Classification: ALL deferred taxes are NON-CURRENT (ASC 740)

Valuation Allowance:
  If DTA "more likely than not" NOT to be realized
  → Contra asset reduces DTA to expected realizable amount`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Use enacted rate (not proposed or current rate)',
        'Permanent differences never create DTA or DTL',
        'All deferred taxes = non-current (no current/non-current split under ASC 740)',
        'Valuation allowance: "more likely than not" = > 50% chance of non-realization',
      ]} />
    </div>
  )
}

// ── Reusable Sub-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10, borderBottom: '1px solid #e0e0e0', paddingBottom: 6 }}>
        {title}
      </h3>
      <div style={{ fontSize: 13, color: '#111', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#f7f8fa',
      border: '1px solid #e0e0e0',
      borderRadius: 6,
      padding: '12px 14px',
      fontSize: 12.5,
      lineHeight: 1.7,
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      margin: 0,
      fontFamily: '"Fira Mono", "Cascadia Code", monospace',
    }}>
      {children}
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: '#f0f3f8' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: 600, color: NAVY }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '5px 10px', border: '1px solid #e0e0e0', color: '#111' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrapBox({ items }: { items: string[] }) {
  return (
    <div style={{ background: '#fff8f8', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8, letterSpacing: 0.5 }}>
        TRAP
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '60px 24px', color: '#999', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36 }}>📚</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13 }}>상세 정리 콘텐츠 준비 중입니다.</div>
    </div>
  )
}

function InventoryContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Overview">
        <p>FIFO / LIFO / Weighted Average / Periodic vs Perpetual / LCM(NRV) / Dollar-Value LIFO</p>
      </Section>

      <Section title="2. 가격 방향 비교 (가격 상승 시)">
        <Table
          headers={['Method', 'Ending Inventory', 'COGS', 'Net Income', 'Tax']}
          rows={[
            ['FIFO', '↑ 높음', '↓ 낮음', '↑ 높음', '↑ 높음'],
            ['LIFO', '↓ 낮음', '↑ 높음', '↓ 낮음', '↓ 낮음'],
            ['AVCO', '중간', '중간', '중간', '중간'],
          ]}
        />
      </Section>

      <Section title="3. Dollar-Value LIFO 3단계">
        <CodeBlock>{`Step1: Current year EI at base cost = Current EI $ ÷ Current index
Step2: Compare to prior year base cost → if increase, new layer = increase × current index
Step3: Add all layers = LIFO cost

예시: Y1 EI $55,000 / Index 1.10
  Base cost = $55,000 ÷ 1.10 = $50,000
  New layer = $50,000 × 1.10 = $55,000 (LIFO cost)`}</CodeBlock>
      </Section>

      <Section title="4. LCM Write-down 분개">
        <CodeBlock>{`Dr. COGS (or Inventory Loss)   [write-down amount]
  Cr. Inventory                  [write-down amount]`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'LIFO reserve = FIFO EI − LIFO EI',
        'Dollar-Value LIFO: index 방향 실수 주의 (나누기 vs 곱하기)',
        '"Before allowances" = estimates만 제외',
        'LIFO → FIFO 전환 시 방향 반전',
      ]} />
    </div>
  )
}

function PpeContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Overview">
        <p>Capitalization vs Expense / Depreciation methods / Interest capitalization / Impairment</p>
      </Section>

      <Section title="2. 감가상각 비교 (Cost $100,000 / Salvage $10,000 / Life 5yr)">
        <Table
          headers={['Method', '공식', 'Y1', 'Y2', '특징']}
          rows={[
            ['SL', '(Cost−Salvage)÷Life', '$18,000', '$18,000', '균등'],
            ['DDB', 'BV × 2/Life', '$40,000', '$24,000', '초기 크고 후기 작음 / Salvage 무시'],
            ['SYD', '(Cost−Salvage)×remaining/SYD', '$30,000', '$24,000', 'Sum=15, 가속'],
          ]}
        />
      </Section>

      <Section title="3. Interest Capitalization">
        <CodeBlock>{`- 건설 중 자산에만 해당 (Qualifying asset)
- Avoidable interest = 자산 지출 × weighted average rate
- 12/31 지출 → 가중치 0/12 = $0 (연도 말 지출은 이자 없음)
- Capitalization period: 지출 시작 ~ 완공`}</CodeBlock>
      </Section>

      <Section title="4. Impairment 2-Step (US GAAP)">
        <CodeBlock>{`Step1 Recoverability Test (스크리닝):
  CV > Undiscounted Future CF → impaired (계속 진행)
  CV ≤ Undiscounted Future CF → not impaired (stop)

Step2 Measurement:
  Impairment Loss = CV − Fair Value

분개: Dr. Impairment Loss / Cr. Accumulated Impairment Loss`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Land = 감가상각 없음',
        'DDB: Salvage 무시하지만 BV < Salvage 되면 감가상각 중단',
        'Step1 = Undiscounted CF (PV 아님!)',
        'US GAAP: impairment write-up 불가 (IFRS는 가능)',
        'Interest capitalization: 12/31 지출 = $0 (0/12 가중치)',
      ]} />
    </div>
  )
}

function IntangiblesContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Overview">
        <p>Definite vs Indefinite / Internally generated vs Purchased / R&D expense</p>
      </Section>

      <Section title="2. 자본화 기준">
        <Table
          headers={['항목', '처리', '비고']}
          rows={[
            ['Purchased intangible', 'Capitalize', 'Cost + legal fees'],
            ['Internally generated', 'Expense as incurred', 'R&D 전액 비용'],
            ['Software — Preliminary', 'Expense', ''],
            ['Software — Application dev', 'Capitalize', '개발 단계만'],
            ['Software — Post-implementation', 'Expense', ''],
            ['Patent defense — 승소', 'Capitalize', 'Dr. Patent / Cr. Cash'],
            ['Patent defense — 패소', 'Expense immediately', ''],
          ]}
        />
      </Section>

      <Section title="3. Goodwill">
        <CodeBlock>{`No amortization → Annual impairment test
Step1 (qualitative): any indicators of impairment?
Step2 (quantitative): if needed → FV of reporting unit vs CV
Impairment Loss = CV − FV of reporting unit`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'R&D = 항상 expense (자본화 금지)',
        'Goodwill = 상각 없음, impairment test만',
        'Trademark: 법적 10yr ≠ definite (renewal 가능하면 indefinite)',
        'Software 자본화: application development phase만',
      ]} />
    </div>
  )
}

function RevenueContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. ASC 606 Five-Step Model">
        <Table
          headers={['Step', '내용', '핵심 판단']}
          rows={[
            ['Step 1', 'Identify the contract', 'Approved + committed + collectible'],
            ['Step 2', 'Identify performance obligations', 'Distinct goods/services'],
            ['Step 3', 'Determine transaction price', 'Variable consideration + constraint'],
            ['Step 4', 'Allocate to POs', 'Standalone selling price basis'],
            ['Step 5', 'Recognize revenue', 'When (or as) PO satisfied'],
          ]}
        />
      </Section>

      <Section title="2. Point in Time vs Over Time">
        <CodeBlock>{`Over Time 조건 (하나라도 해당):
  1) Customer controls asset as it is created
  2) Entity has enforceable right to payment for work done
  3) Asset has no alternative use to entity

Over Time → % completion method (input or output measure)
Point in Time → control transfer at a specific moment`}</CodeBlock>
      </Section>

      <Section title="3. Variable Consideration & Constraint">
        <CodeBlock>{`측정 방법: Expected value OR Most likely amount (중 더 예측력 높은 것)
Constraint: high probability (significant reversal 없는 경우에만 포함)`}</CodeBlock>
      </Section>

      <Section title="4. Contract Modification">
        <CodeBlock>{`Distinct + standalone price → 별도 계약 (prospective)
그 외 → modification
  - Remaining goods/services distinct → prospective (catch-up 없음)
  - 나머지 → cumulative catch-up adjustment`}</CodeBlock>
      </Section>

      <TrapBox items={[
        '"In addition" → 별도 PO 여부 주의',
        'Gain contingency = 인식 금지',
        'Significant financing component (>1yr) → PV 할인',
        'Principal vs Agent: control 이전 여부 판단',
      ]} />
    </div>
  )
}

function ScfContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. 활동 분류">
        <Table
          headers={['활동', '항목 예시']}
          rows={[
            ['Operating', '매출채권/재고/매입채무/이자지급(US)/세금지급'],
            ['Investing', '장기자산 취득·처분, 대출금 실행·회수'],
            ['Financing', '부채 차입·상환, 주식 발행·자사주, 배당지급'],
            ['Non-cash', '자산 취득 + Liability 직접 인수 (별도 공시)'],
          ]}
        />
      </Section>

      <Section title="2. Indirect Method 조정 순서">
        <CodeBlock>{`Net Income
+ Depreciation / Amortization        (non-cash add-back)
+ Loss on sale / − Gain on sale      (remove investing item)
− Increase in AR / + Decrease in AR
− Increase in Inventory / + Decrease
+ Increase in AP / − Decrease in AP
= Cash from Operations`}</CodeBlock>
      </Section>

      <Section title="3. Finance Lease SCF 처리">
        <CodeBlock>{`원금 상환 → Financing Activities
이자 지급 → Operating Activities`}</CodeBlock>
      </Section>

      <Section title="4. Non-cash Disclosures">
        <CodeBlock>{`SCF 본문 제외 → FS 말미에 별도 공시
예: 토지 취득 + Mortgage 직접 인수 ($500,000)`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Notes receivable 회수 = Investing (AR과 혼동 금지)',
        '배당지급 = Financing / 배당수령 = Operating (US GAAP)',
        '이자비용 = Operating (US GAAP)',
        'Non-cash → SCF 본문 제외, 별도 공시만',
      ]} />
    </div>
  )
}

function InvestmentsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. 분류 기준">
        <Table
          headers={['분류', '측정', 'Unrealized G/L', '지분율']}
          rows={[
            ['Trading', 'Fair Value', 'Income Statement', '<20%'],
            ['AFS', 'Fair Value', 'OCI', '<20%'],
            ['HTM', 'Amortized Cost', '없음 (채권만)', '<20%'],
            ['Equity Method', 'Adjusted Cost', 'N/A', '20~50%'],
          ]}
        />
      </Section>

      <Section title="2. Equity Method 계산">
        <CodeBlock>{`취득: Dr. Investment / Cr. Cash

매년 Equity income 계산:
  NI × % − Differential amortization = Equity income
  예: NI $150,000 × 40% = $60,000 − Diff amort $8,000 = $52,000

분개: Dr. Investment $52,000 / Cr. Equity Income $52,000
배당: Dr. Cash / Cr. Investment (감액 — income 아님!)`}</CodeBlock>
      </Section>

      <Section title="3. AFS 매각 분개">
        <CodeBlock>{`Dr. Cash                   [proceeds]
Dr./Cr. OCI — AFS Unrealized  [제거]
  Cr. Investment             [amortized cost]
  Cr./Dr. Gain/Loss on Sale  [plug]

Realized G/L = 매각가 − amortized cost`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Equity income = NI×% − differential amortization',
        '배당 = Investment 감액 (income 아님)',
        'AFS unrealized → OCI (I/S 아님)',
        '매각 G/L = 매각가 vs amortized cost (FV 아님)',
      ]} />
    </div>
  )
}

function EquityContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Treasury Stock — Cost Method vs Par Value Method">
        <Table
          headers={['', 'Cost Method', 'Par Value Method']}
          rows={[
            ['매입', 'Dr. TS (cost) / Cr. Cash', 'Dr. CS(par)+APIC+RE / Cr. Cash'],
            ['재발행 > cost', 'Cr. APIC-TS', 'Cr. CS(par) + APIC'],
            ['재발행 < cost', 'Dr. APIC-TS → Dr. RE', 'Cr. CS(par) + APIC'],
          ]}
        />
      </Section>

      <Section title="2. Stock Dividend vs Stock Split">
        <Table
          headers={['구분', '기준', '분개']}
          rows={[
            ['Small stock div', '<20~25%', 'Dr. RE(FMV×sh) / Cr. CS(par×sh) + APIC'],
            ['Large stock div', '≥20~25%', 'Dr. RE(par×sh) / Cr. CS(par×sh)'],
            ['Stock split', 'any', 'No journal entry (메모만)'],
          ]}
        />
      </Section>

      <Section title="3. AOCI 구성 항목">
        <CodeBlock>{`1) AFS unrealized G/L
2) Pension adjustment (funded status)
3) Foreign currency translation adjustment
4) Cash flow hedge (effective portion)`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Cost Method 재발행 손실: APIC-TS 먼저 차감 → 부족 시 RE',
        'Stock split = 분개 없음 (memo entry만)',
        'Property dividend = FMV 기준 RE 차감 + G/L 인식',
      ]} />
    </div>
  )
}

function NfpContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Net Assets 분류">
        <Table
          headers={['분류', '설명', '예시']}
          rows={[
            ['Without donor restriction', '자유 사용 가능', '일반 기부금, 프로그램 수익'],
            ['With donor restriction — 일시적', '기간/목적 제한', '특정 프로그램용 기부'],
            ['With donor restriction — 영구', '원금 보존 필수', 'Endowment 원금'],
          ]}
        />
      </Section>

      <Section title="2. Contribution 인식">
        <CodeBlock>{`Unconditional → 즉시 인식 (조건 없음)
  Dr. Receivable / Cr. Contribution Revenue (without restriction)

Conditional → 조건 충족 시 인식
  조건 충족 전: no recognition

Restriction 해제:
  Dr. Net Assets with DR / Cr. Net Assets without DR`}</CodeBlock>
      </Section>

      <Section title="3. Endowment">
        <CodeBlock>{`원금 = 영구 보존 (지출 불가)
수익 = 지출 가능 (donor 지정 없으면 unrestricted)
Investment income → without restriction (별도 지정 없는 경우)`}</CodeBlock>
      </Section>

      <Section title="4. Functional Expense 분류">
        <CodeBlock>{`Program services (프로그램 비용)
Management & General (관리 운영)
Fundraising (모금 활동)
→ 3개 열로 분류 공시 필수`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Conditional contribution → 조건 충족 전 인식 금지',
        'Endowment 원금 지출 = 절대 불가',
        'Exchange transaction → ASC 606 적용 (contribution 아님)',
      ]} />
    </div>
  )
}

function GovContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Fund 유형 분류">
        <Table
          headers={['유형', 'Fund', '회계 기준']}
          rows={[
            ['Governmental', 'General / Special Revenue / Capital Projects / Debt Service / Permanent', 'Modified Accrual'],
            ['Proprietary', 'Enterprise / Internal Service', 'Full Accrual'],
            ['Fiduciary', 'Pension Trust / Investment Trust / Private-Purpose / Custodial', 'Full Accrual (no net position)'],
          ]}
        />
      </Section>

      <Section title="2. Modified Accrual 인식 기준">
        <CodeBlock>{`Revenue: available (60일 이내 수령) AND measurable
Expenditure: when liability incurred

Property tax:
  Measurable → levied 시점
  Available → 60일 이내 수령 가능한 금액만`}</CodeBlock>
      </Section>

      <Section title="3. Encumbrance 분개">
        <CodeBlock>{`주문/계약 시 (예약):
  Dr. Encumbrances              [예상금액]
    Cr. Fund Balance Reserved   [예상금액]

물품 수령 시 (예약 해제):
  Dr. Fund Balance Reserved     [예상금액]
    Cr. Encumbrances            [예상금액]

실제 지출 인식:
  Dr. Expenditure               [실제금액]
    Cr. Cash / Vouchers Payable [실제금액]`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Modified accrual = available (60일) + measurable 둘 다 필요',
        'Encumbrance = 예약 (실제 지출 아님)',
        'Proprietary fund = Full accrual (modified 아님)',
        'Property tax: measurable at levy, available = 60일',
      ]} />
    </div>
  )
}

function ChangesContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. 4가지 유형 비교">
        <Table
          headers={['유형', '처리 방법', '예시']}
          rows={[
            ['Change in Estimate', 'Prospective', '감가상각 내용연수 변경, 회수가능성'],
            ['Change in Accounting Principle', 'Retrospective', 'FIFO→LIFO, 수익인식 방법'],
            ['Change in Reporting Entity', 'Retrospective', '연결범위 변경'],
            ['Error Correction', 'Restatement (prior period)', '수익 이중 인식, 분류 오류'],
          ]}
        />
      </Section>

      <Section title="2. Error Correction 처리">
        <CodeBlock>{`Prior period error → Restatement
  Dr./Cr. Retained Earnings (net of tax)   [누적 효과]

공시 필수: 수정 내용, 영향 금액, 이유`}</CodeBlock>
      </Section>

      <Section title="3. 감가상각법 변경 (Estimate 취급)">
        <CodeBlock>{`감가상각법 변경 = Change in Estimate (Prospective)
  새 감가상각비 = 남은 BV ÷ 남은 내용연수
  (잔존가 차감 후 남은 연수로 나눔)

예시: BV $60,000 / 잔여 3년 / 잔존가 $0
  → 새 감가상각비 = $60,000 ÷ 3 = $20,000/yr`}</CodeBlock>
      </Section>

      <TrapBox items={[
        '감가상각법 변경 = Estimate 변경 (Principle 아님!)',
        'Retrospective = 과거 FS 재작성 (소급 적용)',
        'Error = Restatement + 공시 필수',
        '소급 적용 시 세금 효과(net of tax) 고려',
      ]} />
    </div>
  )
}

function FvContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="1. Fair Value Hierarchy">
        <Table
          headers={['Level', '정의', '예시']}
          rows={[
            ['Level 1', 'Identical asset/liability + Active market', 'NYSE 상장 주식'],
            ['Level 2', 'Similar + Active OR Identical + Inactive', 'OTC bond, 유사 자산'],
            ['Level 3', 'Unobservable / Internal assumptions', 'Internal DCF, 비상장 주식'],
          ]}
        />
      </Section>

      <Section title="2. 3가지 측정 방법">
        <Table
          headers={['방법', '설명', '적용']}
          rows={[
            ['Market approach', 'Comparable transactions/multiples', '유사 거래 가격 비교'],
            ['Income approach', 'PV of future cash flows (DCF)', '수익 창출 자산'],
            ['Cost approach', 'Replacement cost', '특수 자산, 구형 장비'],
          ]}
        />
      </Section>

      <Section title="3. Exit Price 원칙">
        <CodeBlock>{`Fair Value = Exit price (판매/이전 시 수령 금액)
           ≠ Entry price (취득 원가)

Principal market: 가장 거래량 많은 시장 우선
Most advantageous market: principal market 없을 때`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Similar + Active market → L2 (L1 아님)',
        'Identical + Inactive market → L2 (L1 아님)',
        '내부 DCF → L3 (복잡해도 L3)',
        'FV = exit price (entry price 아님!)',
      ]} />
    </div>
  )
}

// ── Content Tab Dispatcher ─────────────────────────────────────────────────────
function ContentTab({ catId, catLabel }: { catId: CategoryId; catLabel: string }) {
  switch (catId) {
    case 'bond':        return <BondContent />
    case 'lease':       return <LeaseContent />
    case 'note':        return <NoteContent />
    case 'aro':         return <AroContent />
    case 'eps':         return <EpsContent />
    case 'tax':         return <TaxContent />
    case 'inventory':   return <InventoryContent />
    case 'ppe':         return <PpeContent />
    case 'intangibles': return <IntangiblesContent />
    case 'revenue':     return <RevenueContent />
    case 'scf':         return <ScfContent />
    case 'investments': return <InvestmentsContent />
    case 'equity':      return <EquityContent />
    case 'nfp':         return <NfpContent />
    case 'gov':         return <GovContent />
    case 'changes':     return <ChangesContent />
    case 'fv':          return <FvContent />
    default:            return <ComingSoon label={catLabel} />
  }
}

// ── Cards Tab ──────────────────────────────────────────────────────────────────
function CardsTab({ cat }: { cat: typeof CATEGORIES[number] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const cards = getCardsForCategory(cat)

  if (cards.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: 14 }}>
        이 파트 카드 준비 중입니다
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {cards.map(card => {
        const isOpen = openId === card.topic_id
        return (
          <div
            key={card.topic_id}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : card.topic_id)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: NAVY, background: '#e8edf5',
                    borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap',
                  }}>
                    {card.topic_id}
                  </span>
                  {card.speed && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: card.speed === 'fast' ? '#dcfce7' : card.speed === 'slow' ? '#fee2e2' : '#fef9c3',
                      color: card.speed === 'fast' ? '#166534' : card.speed === 'slow' ? '#991b1b' : '#854d0e',
                    }}>
                      {card.speed}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                  {card.card_name ?? card.topic_name ?? '—'}
                </span>
                {card.one_sentence && (
                  <span style={{ fontSize: 12, color: '#555' }}>{card.one_sentence}</span>
                )}
              </div>
              <span style={{ fontSize: 16, color: '#999', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0f0f0' }}>
                {card.rule && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rule</div>
                    <div style={{ fontSize: 12.5, color: '#111', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{card.rule}</div>
                  </div>
                )}
                {card.trigger && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trigger</div>
                    <div style={{ fontSize: 12.5, color: '#111', lineHeight: 1.6 }}>{card.trigger}</div>
                  </div>
                )}
                {card.trap && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trap</div>
                    <div style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.6 }}>{card.trap}</div>
                  </div>
                )}
                {card.example && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Example</div>
                    <pre style={{ fontSize: 12, color: '#111', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#f7f8fa', borderRadius: 6, padding: '8px 12px', border: '1px solid #e0e0e0', margin: 0, fontFamily: 'inherit' }}>{card.example}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Harry Tab — delegates to global Harry sidebar ──────────────────────────────
function HarryTab({ catLabel }: { catLabel: string }) {
  const openPanel = useClaudeStore((s) => s.openPanel)
  const setPendingAutoMessage = useClaudeStore((s) => s.setPendingAutoMessage)

  const quickActions = [
    { label: '개념 확인', msg: `${catLabel} 개념 확인 문제 내줘` },
    { label: '분개 오류 찾기', msg: `${catLabel} 분개에서 오류 찾기 문제 내줘` },
    { label: '빈칸 채우기', msg: `${catLabel} 공식 빈칸 채우기 문제 내줘` },
  ]

  const send = (msg: string) => {
    openPanel()
    setPendingAutoMessage(msg)
  }

  return (
    <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🧙</div>
        <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, margin: 0 }}>
          우측 <strong style={{ color: NAVY }}>Harry 패널</strong>에서<br />
          <strong style={{ color: NAVY }}>{catLabel}</strong> 관련 질문을 시작하세요.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        {quickActions.map(a => (
          <button
            key={a.label}
            onClick={() => send(a.msg)}
            style={{
              padding: '11px 18px', border: `1.5px solid ${NAVY}`, borderRadius: 10,
              background: '#fff', color: NAVY, fontSize: 13.5, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
            }}
          >
            {a.label} <span style={{ opacity: 0.5 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ConceptNotesPage() {
  const userId = useStudyStore((s) => s.userId)
  const openPanel = useClaudeStore((s) => s.openPanel)
  const [selectedCatId, setSelectedCatId] = useState<CategoryId>('bond')
  const [activeTab, setActiveTab] = useState<TabKey>('content')
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const prevCatRef = useRef<CategoryId>(selectedCatId)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('wrong_answers')
      .select('topic_tag, times_wrong')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const agg: Record<string, number> = {}
        ;(data as { topic_tag: string | null; times_wrong: number }[]).forEach(r => {
          if (r.topic_tag) agg[r.topic_tag] = (agg[r.topic_tag] ?? 0) + (r.times_wrong ?? 1)
        })
        setWrongCounts(agg)
      })
  }, [userId])

  useEffect(() => {
    if (prevCatRef.current !== selectedCatId) {
      prevCatRef.current = selectedCatId
      setActiveTab('content')
    }
  }, [selectedCatId])

  const activeCat = CATEGORIES.find(c => c.id === selectedCatId) ?? CATEGORIES[0]

  function getWrongCountForCat(cat: typeof CATEGORIES[number]): number {
    const cards = getCardsForCategory(cat)
    const relevantTopicIds = new Set(cards.map(c => c.topic_id))
    return Object.entries(wrongCounts)
      .filter(([tag]) => relevantTopicIds.has(tag))
      .reduce((sum, [, cnt]) => sum + cnt, 0)
  }

  function getCardCountForCat(cat: typeof CATEGORIES[number]): number {
    return getCardsForCategory(cat).length
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'content', label: '핵심 정리' },
    { key: 'cards',   label: '개념 카드' },
    { key: 'harry',   label: 'Harry Practice' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8f9fb' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-over */}
      <aside style={{
        width: 240,
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: undefined,
        zIndex: 50,
      }}
        className="hidden md:flex"
      >
        <SidebarContent
          selectedCatId={selectedCatId}
          onSelect={id => setSelectedCatId(id)}
          getCardCount={getCardCountForCat}
          getWrongCount={getWrongCountForCat}
        />
      </aside>

      {/* Mobile slide sidebar */}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
          background: '#fff', borderRight: '1px solid #e0e0e0',
          overflowY: 'auto', zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s ease',
          display: 'flex', flexDirection: 'column',
        }}
        className="md:hidden"
      >
        <SidebarContent
          selectedCatId={selectedCatId}
          onSelect={id => { setSelectedCatId(id); setSidebarOpen(false) }}
          getCardCount={getCardCountForCat}
          getWrongCount={getWrongCountForCat}
        />
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Mobile top bar */}
        <div
          className="flex md:hidden"
          style={{
            padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e0e0e0',
            display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="9" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="14" width="16" height="2" rx="1" fill={NAVY} />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{activeCat.label}</span>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '24px 28px', maxWidth: 860 }}>

          {/* Page title (desktop) */}
          <div
            className="hidden md:block"
            style={{ marginBottom: 20 }}
          >
            <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>
              {activeCat.label}
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 24 }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key === 'harry') openPanel(); }}
                style={{
                  padding: '9px 20px', fontSize: 13.5, fontWeight: 600,
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: activeTab === tab.key ? NAVY : '#888',
                  borderBottom: activeTab === tab.key ? `2px solid ${NAVY}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'content' && (
            <ContentTab catId={activeCat.id as CategoryId} catLabel={activeCat.label} />
          )}
          {activeTab === 'cards' && (
            <CardsTab cat={activeCat} />
          )}
          {activeTab === 'harry' && (
            <HarryTab key={`harry-${selectedCatId}`} catLabel={activeCat.label} />
          )}
        </div>
      </main>
    </div>
  )
}

// ── Sidebar Content Component ──────────────────────────────────────────────────
function SidebarContent({
  selectedCatId,
  onSelect,
  getCardCount,
  getWrongCount,
}: {
  selectedCatId: CategoryId
  onSelect: (id: CategoryId) => void
  getCardCount: (cat: typeof CATEGORIES[number]) => number
  getWrongCount: (cat: typeof CATEGORIES[number]) => number
}) {
  return (
    <>
      <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>
          Topics
        </span>
      </div>
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {CATEGORIES.map(cat => {
          const isActive = cat.id === selectedCatId
          const cardCount = getCardCount(cat)
          const wrongCount = getWrongCount(cat)
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id as CategoryId)}
              style={{
                width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                padding: '8px 14px',
                background: isActive ? '#eef1f8' : 'transparent',
                borderLeft: isActive ? `3px solid ${NAVY}` : '3px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}
            >
              <span style={{
                fontSize: 13, fontWeight: isActive ? 700 : 400,
                color: isActive ? NAVY : '#333',
                flex: 1, lineHeight: 1.35,
              }}>
                {cat.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {cardCount > 0 && (
                  <span style={{
                    fontSize: 10, color: '#888', background: '#f0f0f0',
                    borderRadius: 10, padding: '1px 6px',
                  }}>
                    {cardCount}
                  </span>
                )}
                {wrongCount > 0 && (
                  <span style={{
                    fontSize: 10, color: '#fff', background: '#dc2626',
                    borderRadius: 10, padding: '1px 6px', fontWeight: 700,
                  }}>
                    {wrongCount}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </nav>
    </>
  )
}
