import { useState, useMemo } from 'react';

interface ALItem {
  cat: string; item: string; std: string;
  rule: string; trigger: string; trap: string;
}
interface ValItem {
  cat: string; item: string; std: string;
  method: string; rule: string; trigger: string; trap: string;
}
type QuizItem = { cat: string; item: string; std: string; method?: string; rule: string; trigger: string; trap: string };
type TabKey = 'asset-liability' | 'valuation';
type ViewMode = 'table' | 'quiz';

// ─── Data ─────────────────────────────────────────────────────

const assetLiabilityData: ALItem[] = [
  { cat:"Receivables", item:"A/R Factoring — Sale", std:"gaap",
    rule:"Control 이전 → A/R 제거. Cash + Loss 인식. Recourse 있으면 recourse liability 추가 인식.",
    trigger:"'sold receivables' / 'transferred A/R' / 'without recourse'",
    trap:"Recourse를 asset으로 착각. A/R 제거 vs 유지 혼동. With recourse → liability 인식 필수." },
  { cat:"Receivables", item:"A/R Pledged — Borrowing", std:"gaap",
    rule:"Control 유지 → A/R 제거하지 않음. Cash 수령 + Note payable 인식.",
    trigger:"'pledged as collateral' / 'assigned receivables' / 'borrowing against A/R'",
    trap:"담보 제공을 A/R 제거로 착각. A/R은 BS에 그대로 유지." },
  { cat:"Receivables", item:"Notes Receivable (Long-term)", std:"gaap",
    rule:"PV로 인식(시장이자율 할인). 이자수익 = 유효이자율법. Non-interest-bearing → 할인 필수.",
    trigger:"'non-interest-bearing note' / 'below-market rate'",
    trap:"액면가로 인식하면 오답. 이자수익은 carrying value × market rate." },
  { cat:"Inventory", item:"FOB Shipping Point", std:"gaap",
    rule:"선적 시점에 구매자가 title + risk 취득 → 구매자 inventory.",
    trigger:"'FOB shipping point' / '운송 중 재고 귀속'",
    trap:"물리적 점유 기준으로 판단. FOB destination과 혼동." },
  { cat:"Inventory", item:"Consignment", std:"gaap",
    rule:"Consignor가 판매 시까지 control 유지 → consignor inventory. Consignee BS에 포함 안 됨.",
    trigger:"'consignment' / 'goods on consignment'",
    trap:"Consignee가 physical possession → inventory로 착각. Control 기준으로 판단." },
  { cat:"Revenue", item:"Revenue Recognition (ASC 606)", std:"gaap",
    rule:"5-step: 계약식별 → 수행의무 → 거래가격 → SSP배분 → control 이전 시 인식.",
    trigger:"'performance obligation satisfied' / 'control transferred' / 'point in time vs over time'",
    trap:"현금 수령 시점 = 수익 인식으로 착각. Shipment vs delivery 혼동." },
  { cat:"Revenue", item:"Deferred Revenue (Unearned)", std:"gaap",
    rule:"선수금 수령 → control 미이전 → liability. 수행의무 완료 시 revenue로 전환.",
    trigger:"'advance payment' / 'gift cards' / 'contract liability'",
    trap:"현금 받으면 바로 revenue 인식. Deferred revenue를 asset으로 착각." },
  { cat:"Revenue", item:"Long-term Contracts (POC)", std:"gaap",
    rule:"진행률 = costs incurred ÷ total estimated costs. 손실 예상 시 전액 즉시 인식.",
    trigger:"'percentage of completion' / 'estimated total cost 변경'",
    trap:"Completed contract method와 혼동. 예상 손실 분할 인식하면 오답." },
  { cat:"Liabilities", item:"Contingent Liability", std:"gaap",
    rule:"Probable + Estimable → accrual. Reasonably possible → disclosure only. Remote → nothing.",
    trigger:"'probable' / 'guarantee' / 'lawsuit' / 'warranty'",
    trap:"모든 가능성 accrual. Gain contingency를 수익 인식(실현 시까지 불가)." },
  { cat:"Liabilities", item:"Warranty Liability", std:"gaap",
    rule:"판매 시점에 예상 보증비용 전액 liability 인식(matching principle).",
    trigger:"'warranty expense' / 'estimated warranty costs'",
    trap:"실제 수리 발생 시 비용 인식. Warranty liability를 기간비용으로 처리." },
  { cat:"Liabilities", item:"Lease Liability", std:"gaap",
    rule:"Finance/Operating 모두 PV of lease payments로 liability 인식(ASC 842). ROU asset 동시 인식.",
    trigger:"'right of use' / 'lease term' / 'FL vs OL 분류'",
    trap:"Operating lease는 liability 없다고 착각(ASC 840 구기준). Asset만 또는 liability만 인식." },
  { cat:"PPE & Intangibles", item:"PP&E Capitalization", std:"gaap",
    rule:"미래경제효익 + control → capitalize. 취득가 = 구입가 + 직접비용 + 설치비.",
    trigger:"'future benefit' / 'capitalized interest' / 'betterment vs repair'",
    trap:"Training비, R&D 자산화. 수선비(maintenance) 자산화. Repair vs betterment 혼동." },
  { cat:"PPE & Intangibles", item:"Impairment — GAAP (2-step)", std:"gaap",
    rule:"Step 1: undiscounted future CF < carrying value? → Step 2: FV로 write-down. Reversal 불가.",
    trigger:"'recoverability test' / '손상 여부 판단'",
    trap:"Step 1에서 discounted CF 사용(undiscounted 사용해야 함). Step 1 통과 시 손상 없음(FV 무관). Reversal 인식." },
  { cat:"PPE & Intangibles", item:"Goodwill", std:"gaap",
    rule:"상각 없음. 연 1회 이상 impairment test. FV of reporting unit < carrying value → 손상.",
    trigger:"'goodwill impairment' / 'reporting unit FV'",
    trap:"Goodwill 상각 처리. Reversal 인식(절대 불가). Private company: amortization 선택 가능(예외)." },
  { cat:"PPE & Intangibles", item:"R&D Costs", std:"gaap",
    rule:"연구개발비 전액 즉시 비용 처리(GAAP). 내부개발 무형자산 인식 불가.",
    trigger:"'research and development' / 'internally developed software'",
    trap:"R&D 자산화. Software 개발비: 기술적 실현가능성 이전은 expense, 이후는 capitalize." },
  { cat:"Equity", item:"Common Stock Issuance", std:"gaap",
    rule:"Common stock = par × shares issued. APIC = (issue price − par) × shares.",
    trigger:"'stock issuance' / 'par value vs issue price'",
    trap:"전액을 Common stock으로 처리. APIC 계산 누락." },
  { cat:"Equity", item:"Treasury Stock", std:"gaap",
    rule:"Cost method: Dr. Treasury Stock(cost). 재발행 차익 → APIC. 차손 → APIC 소진 후 RE.",
    trigger:"'share buyback' / 'treasury stock reissued'",
    trap:"Treasury stock 보유 중 배당·의결권 있다고 착각. 재발행 차손을 loss로 인식." },
  { cat:"Equity", item:"Stock Dividend vs Stock Split", std:"gaap",
    rule:"Small stock div(<25%): FMV로 이전. Large stock div(≥25%): par value로 이전. Split: par 변경, equity 총액 불변.",
    trigger:"'stock dividend' / 'stock split' / '25% threshold'",
    trap:"Stock split 시 equity 총액 변한다고 착각. Large vs small dividend 처리 혼동." },
  { cat:"Tax", item:"Deferred Tax Asset (DTA)", std:"gaap",
    rule:"Future deductible temporary difference → DTA. Valuation allowance: more-likely-than-not 실현 불가 시.",
    trigger:"'future deductible' / 'tax loss carryforward' / 'valuation allowance'",
    trap:"DTA/DTL 방향 반대로. 영구차이(permanent diff.)에 DTA 인식. 세율 변경 시 즉시 재측정 누락." },
  { cat:"Tax", item:"Deferred Tax Liability (DTL)", std:"gaap",
    rule:"Future taxable temporary difference → DTL. 세율 변경 → 기존 잔액 즉시 재측정(enacted rate).",
    trigger:"'accelerated depreciation for tax' / 'installment sales'",
    trap:"Timing difference와 permanent difference 혼동. 세율 변경 효과를 다음 연도에 반영." },
  { cat:"NFP", item:"Contributions — Conditional vs Unconditional", std:"gaap",
    rule:"무조건부 → 즉시 FV로 인식. 조건부 → 조건 충족 시 인식. Restriction ≠ Condition.",
    trigger:"'conditional pledge' / 'donor restriction' / 'purpose restriction'",
    trap:"Restriction을 Condition으로 혼동. 조건부 pledge 즉시 인식." },
  { cat:"NFP", item:"Donated Services", std:"gaap",
    rule:"SOME test 4가지 모두 충족 시만 인식: Specialized skill / Otherwise purchased / Measurable / Entity controls.",
    trigger:"'volunteer services' / 'donated professional services'",
    trap:"일반 자원봉사 인식. SOME 4가지 중 하나만 충족해도 인식." },
  { cat:"Gov", item:"Modified Accrual — Revenue Recognition", std:"gaap",
    rule:"Measurable + Available(60일 내 수취 가능) 충족 시 수익 인식.",
    trigger:"'governmental fund' / 'property tax' / 'available criterion'",
    trap:"Full accrual과 혼동. 60일 기준 초과 receivable을 당기수익 인식." },
];

const valuationData: ValItem[] = [
  { cat:"Assets", item:"Cash & Cash Equivalents", std:"gaap", method:"Face value / FMV",
    rule:"외화 → 기말 spot rate. Restricted cash는 별도 분류(current or non-current). 90일 초과 T-bill은 CE 아님.",
    trigger:"외화 현금 환산 / restricted cash 분류",
    trap:"Restricted cash를 CE에 포함. 90일 초과 단기투자를 CE로 분류." },
  { cat:"Assets", item:"Accounts Receivable", std:"gaap", method:"NRV (Gross AR − Allowance)",
    rule:"CECL(ASC 326): 기대손실 모델. Direct write-off는 GAAP 불인정(tax only). Write-off 시 NRV 불변.",
    trigger:"Bad debt expense 계산 / allowance 잔액 변동",
    trap:"% of sales vs aging 방법 혼동. Write-off가 NRV를 바꾼다고 착각." },
  { cat:"Assets", item:"Inventory", std:"gaap", method:"Lower of Cost or NRV",
    rule:"FIFO·Avg → LCNRV. LIFO·Retail → LCM(replacement cost). GAAP: write-down reversal 불가.",
    trigger:"NRV 계산 / LIFO reserve / LIFO liquidation",
    trap:"LIFO layer 청산 시 오래된 원가 → 이익 급증. GAAP write-down reversal 불가." },
  { cat:"Assets", item:"Trading Securities", std:"gaap", method:"Fair Value → Net Income",
    rule:"매 기말 FV 재측정. Unrealized G/L → Income statement.",
    trigger:"기말 FV 변동 → 당기손익 영향 계산",
    trap:"AFS와 혼동. Trading은 unrealized도 NI 반영." },
  { cat:"Assets", item:"AFS Securities", std:"gaap", method:"Fair Value → OCI",
    rule:"Unrealized G/L → AOCI. 처분 시 OCI → NI reclassify. Impairment → NI(OCI 아님).",
    trigger:"처분 시 실현손익 + OCI reclassify 계산",
    trap:"처분 전 AOCI를 NI 반영 안 함. Impairment를 OCI로 처리." },
  { cat:"Assets", item:"HTM Securities", std:"gaap", method:"Amortized Cost",
    rule:"FV 변동 미반영. 이자수익 = carrying value × market rate. Tainting rule: 만기 전 매도 시 HTM 전체 재분류.",
    trigger:"Premium/discount 상각 / 이자수익 계산",
    trap:"이자수익에 쿠폰율 사용. Tainting rule 간과." },
  { cat:"Assets", item:"Equity Method Investment", std:"gaap", method:"Cost + Share of NI − Dividends",
    rule:"20–50% 또는 significant influence. 배당 수령 → 투자자산 감소(수익 X). Carrying value 0 이하 불가(원칙).",
    trigger:"지분법 손익 계산 / dividends 수령 처리",
    trap:"배당을 수익으로 인식. Investee 손실로 carrying value 마이너스." },
  { cat:"Assets", item:"PP&E — Initial", std:"gaap", method:"Historical Cost",
    rule:"구입가 + 직접비 + 설치비. Capitalized interest: 건설 중 자산에만 적용. 운영 후 이자는 자본화 불가.",
    trigger:"Capitalized interest 계산 (weighted-avg expenditure)",
    trap:"운영 시작 후 이자 자본화. Weighted-average accumulated expenditure 계산 실수." },
  { cat:"Assets", item:"PP&E — Impairment", std:"gaap", method:"2-step: Undiscounted CF → FV",
    rule:"Step 1: undiscounted future CF < carrying value? Step 2: FV로 write-down. Reversal 불가.",
    trigger:"손상차손 인식 여부 / 손상 금액 계산",
    trap:"Step 1에서 discounted CF 사용. Step 1 통과 시 손상 없음(FV 무관). Reversal 인식." },
  { cat:"Assets", item:"Goodwill", std:"gaap", method:"No amortization — Impairment only",
    rule:"연 1회 이상 impairment test. Reversal 절대 불가. Private company: amortization 선택 예외.",
    trigger:"Goodwill impairment 금액 계산",
    trap:"Goodwill 상각 처리. Reversal 인식." },
  { cat:"Assets", item:"ROU Asset — Finance Lease", std:"gaap", method:"PV of lease payments → Amortization",
    rule:"Amortization: lease term or useful life 중 짧은 기간. 비용 패턴: 초기 高(이자+감가상각).",
    trigger:"FL vs OL 분류 기준 / 비용 패턴 차이",
    trap:"OL과 비용 패턴 혼동. 분류 기준(ASC 842) 5가지 미체크." },
  { cat:"Assets", item:"ROU Asset — Operating Lease", std:"gaap", method:"PV of lease payments → Straight-line expense",
    rule:"ROU asset 인식(ASC 842). 비용: straight-line. Amortization = lease expense − interest on liability.",
    trigger:"OL ROU amortization back-calculation",
    trap:"ASC 840(구기준)으로 판단 — OL은 BS 인식 없다고 착각." },
  { cat:"Liabilities", item:"Accounts Payable / Accrued Liabilities", std:"gaap", method:"Face value / Settlement amount",
    rule:"단기 → 할인 불필요. 기말 미지급 비용 accrual 처리.",
    trigger:"기말 accrual 분개",
    trap:"현금 지급 시점에만 비용 인식(cash basis 오류)." },
  { cat:"Liabilities", item:"Bonds Payable", std:"gaap", method:"Amortized Cost (유효이자율법)",
    rule:"이자비용 = carrying value × market rate. Premium: 이자비용 < 현금지급. Discount: 반대.",
    trigger:"이자비용 / carrying value 계산 / 발행가격 산정",
    trap:"이자비용에 쿠폰율(stated rate) 사용. Face value와 carrying value 혼동." },
  { cat:"Liabilities", item:"Lease Liability", std:"gaap", method:"PV of remaining lease payments",
    rule:"매기 이자비용 = Beg. liability × discount rate. 원리금 지급 시 liability 감소.",
    trigger:"리스 부채 상각표 계산",
    trap:"리스료 전액을 비용 처리. Liability와 ROU asset 계산 혼동." },
  { cat:"Liabilities", item:"Deferred Tax Liability (DTL)", std:"gaap", method:"Enacted rate × future taxable temp. diff.",
    rule:"가속상각 등 future taxable amount → DTL. 세율 변경 시 즉시 재측정.",
    trigger:"Accelerated depreciation / installment sales",
    trap:"Permanent difference에 DTL 인식. 세율 변경 효과 다음 연도 반영." },
  { cat:"Liabilities", item:"Pension Obligation (PBO)", std:"gaap", method:"PV of projected benefit obligation",
    rule:"Funded status = Plan assets FV − PBO. Pension expense: service cost + interest − expected return ± amortization.",
    trigger:"Pension expense 구성요소 / funded status 계산",
    trap:"Expected return 대신 actual return 사용. Actuarial G/L을 즉시 NI 인식." },
  { cat:"Equity", item:"Common Stock / APIC", std:"gaap", method:"Historical issuance price",
    rule:"Common stock = par × shares issued. APIC = (issue price − par) × shares.",
    trigger:"주식발행 분개",
    trap:"전액 Common stock 처리. Par value 없으면 전액 Common stock(no-par stock)." },
  { cat:"Equity", item:"Treasury Stock", std:"gaap", method:"Cost method",
    rule:"재취득: Dr. Treasury Stock(cost). 재발행 차익 → APIC. 차손 → APIC 소진 후 RE 차감.",
    trigger:"자기주식 취득·재발행 분개 / EPS 영향",
    trap:"TS 보유 중 배당·의결권 있다고 착각. 재발행 차손을 loss로 인식." },
  { cat:"Revenue", item:"ASC 606 — Transaction Price", std:"gaap", method:"SSP 기준 배분",
    rule:"Variable consideration: constraint 적용. SSP 없으면 추정(adjusted market / expected cost+margin).",
    trigger:"번들 계약 배분 / variable consideration",
    trap:"SSP 없으면 배분 불가라고 착각. Constraint 미적용." },
  { cat:"Revenue", item:"Long-term Contracts", std:"gaap", method:"Percentage of Completion",
    rule:"진행률 = costs incurred ÷ total est. costs. 손실 예상 → 즉시 전액 인식. Revised estimate → cumulative catch-up.",
    trigger:"당기 수익·손실 인식액 계산",
    trap:"Completed contract method 혼용. 예상 손실 분할 인식." },
  { cat:"NFP", item:"Contributions / Pledges", std:"gaap", method:"FV at date of gift",
    rule:"무조건부 → 즉시 인식. 조건부 → 조건 충족 시. 다년도 pledge → PV 할인.",
    trigger:"조건부 vs 무조건부 기증 분류",
    trap:"Restriction과 Condition 혼동. 조건부 pledge 즉시 인식." },
  { cat:"NFP", item:"Net Assets Classification", std:"gaap", method:"With / Without Donor Restriction",
    rule:"With restriction(기간·목적) vs Without restriction. Purpose restriction: 목적 달성 시 reclassify.",
    trigger:"기부금 분류 / restriction 해제 시점",
    trap:"Time restriction을 purpose restriction으로 혼동." },
  { cat:"Gov", item:"Capital Assets (GASB)", std:"gaap", method:"Historical Cost",
    rule:"Infrastructure 포함. Modified Approach: 감가상각 면제, 유지보수비 즉시 비용화.",
    trigger:"Gov vs Proprietary fund 처리 차이",
    trap:"Modified Approach 선택 시도 감가상각 인식." },
  { cat:"Gov", item:"Fund Accounting — Modified Accrual", std:"gaap", method:"Current financial resources focus",
    rule:"수익 = measurable + available(60일). 장기부채는 governmental fund에서 인식 안 함.",
    trigger:"수익·지출 인식 시점 / fund 유형 분류",
    trap:"Full accrual과 혼동. 장기 debt를 governmental fund에서 인식." },
];

// ─── Constants ────────────────────────────────────────────────

const AL_CATS = ['All','Receivables','Inventory','Revenue','Liabilities','PPE & Intangibles','Equity','Tax','NFP','Gov'];
const VAL_CATS = ['All','Assets','Liabilities','Equity','Revenue','NFP','Gov'];

const VAL_BS_ORDER: Record<string, number> = {
  'Cash & Cash Equivalents':1,'Accounts Receivable':2,'Inventory':3,
  'Trading Securities':4,'AFS Securities':5,'HTM Securities':6,
  'Equity Method Investment':7,'PP&E — Initial':8,'PP&E — Impairment':9,
  'Goodwill':10,'ROU Asset — Finance Lease':11,'ROU Asset — Operating Lease':12,
  'Accounts Payable / Accrued Liabilities':13,'Bonds Payable':14,
  'Lease Liability':15,'Deferred Tax Liability (DTL)':16,'Pension Obligation (PBO)':17,
  'Common Stock / APIC':18,'Treasury Stock':19,
  'ASC 606 — Transaction Price':20,'Long-term Contracts':21,
  'Contributions / Pledges':22,'Net Assets Classification':23,
  'Capital Assets (GASB)':24,'Fund Accounting — Modified Accrual':25,
};

// ─── Sub-components ───────────────────────────────────────────

function GaapBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
      style={{ background:'#dbeafe', color:'#1d4ed8' }}>
      US GAAP
    </span>
  );
}

function QuizCard({ item, flipped, onFlip }: { item: QuizItem; flipped: boolean; onFlip: () => void }) {
  return (
    <div style={{ perspective:'1200px' }} onClick={onFlip} className="cursor-pointer select-none">
      <div style={{
        transformStyle:'preserve-3d',
        transition:'transform 0.42s ease',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        position:'relative', height:300,
      }}>
        {/* Front */}
        <div style={{ backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', position:'absolute', inset:0 }}
          className="bg-white rounded-2xl border-2 border-[#e2e8f0] flex flex-col items-center justify-center p-8 text-center gap-3">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background:'#f1f5f9', color:'#475569' }}>
            {item.cat}
          </span>
          <p className="text-2xl font-bold text-[#0f172a] leading-tight">{item.item}</p>
          {item.std === 'gaap' && <GaapBadge />}
          {item.method && (
            <p className="text-xs font-medium text-[#4f6ef7]">{item.method}</p>
          )}
          <p className="text-xs text-muted mt-2">탭하여 정답 확인 ↩</p>
        </div>
        {/* Back */}
        <div style={{
          backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden',
          transform:'rotateY(180deg)', position:'absolute', inset:0, overflowY:'auto',
        }}
          className="bg-white rounded-2xl border-2 border-[#4f6ef7] flex flex-col p-5 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background:'#eef2ff', color:'#4f6ef7' }}>{item.cat}</span>
            {item.std === 'gaap' && <GaapBadge />}
          </div>
          {item.method && (
            <p className="text-xs font-bold text-[#4f6ef7]">{item.method}</p>
          )}
          <p className="text-sm text-[#0f172a] leading-relaxed">{item.rule}</p>
          <div className="rounded-lg p-2.5 mt-auto" style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
            <p className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wide mb-1">Trigger</p>
            <p className="text-xs text-[#0f172a]">{item.trigger}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ background:'#fef2f2', border:'1px solid #fecaca' }}>
            <p className="text-[10px] font-bold text-[#dc2626] uppercase tracking-wide mb-1">Trap</p>
            <p className="text-xs text-[#0f172a]">{item.trap}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { key: 'asset-liability' as TabKey, label: 'Asset vs. Liability', icon: '⚖️' },
  { key: 'valuation' as TabKey, label: 'Valuation', icon: '💰' },
];

export default function ConceptNotesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('asset-liability');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<QuizItem[] | null>(null);

  const cats = activeTab === 'asset-liability' ? AL_CATS : VAL_CATS;

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setActiveCat('All');
    setQuery('');
    setExpandedRow(null);
    setQuizIndex(0);
    setFlipped(false);
    setShuffledItems(null);
  };

  const resetFilter = () => {
    setQuizIndex(0);
    setFlipped(false);
    setShuffledItems(null);
    setExpandedRow(null);
  };

  const allItems = useMemo<QuizItem[]>(() => {
    if (activeTab === 'asset-liability') return assetLiabilityData;
    return [...valuationData].sort(
      (a, b) => (VAL_BS_ORDER[a.item] ?? 99) - (VAL_BS_ORDER[b.item] ?? 99),
    );
  }, [activeTab]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (activeCat !== 'All') items = items.filter(it => it.cat === activeCat);
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(it =>
        it.item.toLowerCase().includes(q) ||
        it.rule.toLowerCase().includes(q) ||
        it.trigger.toLowerCase().includes(q) ||
        it.trap.toLowerCase().includes(q) ||
        (it.method?.toLowerCase().includes(q) ?? false),
      );
    }
    return items;
  }, [allItems, activeCat, query]);

  const quizItems = shuffledItems ?? filtered;
  const currentCard = quizItems[quizIndex] ?? quizItems[0];

  const toggleShuffle = () => {
    if (!shuffledItems) {
      const arr = [...filtered].sort(() => Math.random() - 0.5);
      setShuffledItems(arr);
    } else {
      setShuffledItems(null);
    }
    setQuizIndex(0);
    setFlipped(false);
  };

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col shrink-0 bg-white"
        style={{ width: 196, borderRight: '1.5px solid #e2e8f0' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">📑 개념노트</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {SIDEBAR_TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors"
              style={{
                background: activeTab === tab.key ? '#eef2ff' : 'transparent',
                color: activeTab === tab.key ? '#4f6ef7' : '#475569',
                fontWeight: activeTab === tab.key ? 600 : 400,
              }}>
              <span>{tab.icon}</span>
              <span>[{i + 1}] {tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile tab toggle */}
        <div className="md:hidden flex gap-2 px-3 pt-3 pb-2 bg-white shrink-0"
          style={{ borderBottom: '1.5px solid #e2e8f0' }}>
          {SIDEBAR_TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: activeTab === tab.key ? '#4f6ef7' : '#f1f5f9',
                color: activeTab === tab.key ? 'white' : '#475569',
              }}>
              [{i + 1}] {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">

            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-[#0f172a]">
                  {activeTab === 'asset-liability' ? '⚖️ Asset vs. Liability' : '💰 Valuation'}
                </h1>
                <p className="text-xs text-muted mt-0.5">{filtered.length}개 항목</p>
              </div>
              <div className="flex rounded-xl overflow-hidden" style={{ border:'1.5px solid #e2e8f0' }}>
                {(['table','quiz'] as ViewMode[]).map(mode => (
                  <button key={mode}
                    onClick={() => { setViewMode(mode); setFlipped(false); setQuizIndex(0); }}
                    className="px-4 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      background: viewMode === mode ? '#4f6ef7' : 'white',
                      color: viewMode === mode ? 'white' : '#475569',
                    }}>
                    {mode === 'table' ? '📋 테이블' : '🃏 카드퀴즈'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <input value={query}
              onChange={e => { setQuery(e.target.value); resetFilter(); }}
              placeholder="항목명 / 핵심기준 / Trigger / Trap 검색"
              className="w-full text-sm rounded-xl px-4 py-2.5 bg-white"
              style={{ border:'1.5px solid #e2e8f0', outline:'none' }} />

            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
              {cats.map(cat => (
                <button key={cat}
                  onClick={() => { setActiveCat(cat); resetFilter(); }}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: activeCat === cat ? '#4f6ef7' : '#f1f5f9',
                    color: activeCat === cat ? 'white' : '#475569',
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* ── Table View ── */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ border:'1.5px solid #e2e8f0' }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                        {['항목명','핵심 기준','Trigger','Trap'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-sm text-muted text-center">
                            검색 결과가 없습니다.
                          </td>
                        </tr>
                      ) : filtered.map(item => {
                        const isExpanded = expandedRow === item.item;
                        return (
                          <tr key={item.item}
                            onClick={() => setExpandedRow(isExpanded ? null : item.item)}
                            className="border-b border-[#f1f5f9] cursor-pointer transition-colors"
                            style={{ background: isExpanded ? '#f8faff' : undefined }}
                            onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = ''; }}>
                            <td className="px-3 py-2.5" style={{ minWidth: 180 }}>
                              <p className="text-sm font-semibold text-[#0f172a]">{item.item}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted">{item.cat}</span>
                                {item.std === 'gaap' && <GaapBadge />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#0f172a]" style={{ minWidth: 200 }}>
                              {item.method && (
                                <p className="text-[10px] font-semibold text-[#4f6ef7] mb-0.5">{item.method}</p>
                              )}
                              <p className="leading-relaxed"
                                style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.rule}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#0f172a]" style={{ minWidth: 180 }}>
                              <p style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.trigger}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs" style={{ minWidth: 180, color:'#dc2626' }}>
                              <p style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.trap}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Quiz View ── */}
            {viewMode === 'quiz' && (
              <div className="flex flex-col gap-4">
                {quizItems.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center">
                    <p className="text-sm text-muted">해당 조건에 항목이 없습니다.</p>
                  </div>
                ) : (
                  <>
                    {/* Controls row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm font-bold text-[#0f172a]">
                        {quizIndex + 1} <span className="font-normal text-muted">/ {quizItems.length}</span>
                      </p>
                      <div className="flex gap-2">
                        <button onClick={toggleShuffle}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                          style={{
                            background: shuffledItems ? '#4f6ef7' : '#f1f5f9',
                            color: shuffledItems ? 'white' : '#475569',
                          }}>
                          🔀 셔플 {shuffledItems ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => setFlipped(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#f1f5f9] text-[#475569]">
                          ↩ 뒤집기
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4f6ef7] rounded-full transition-all"
                        style={{ width:`${((quizIndex + 1) / quizItems.length) * 100}%` }} />
                    </div>

                    {/* Card */}
                    {currentCard && (
                      <QuizCard item={currentCard} flipped={flipped}
                        onFlip={() => setFlipped(f => !f)} />
                    )}

                    {/* Prev / Next */}
                    <div className="flex gap-3">
                      <button onClick={() => { setQuizIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
                        disabled={quizIndex === 0}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                        style={{ background:'#f1f5f9', color:'#475569' }}>
                        ← 이전
                      </button>
                      <button onClick={() => { setQuizIndex(i => Math.min(quizItems.length - 1, i + 1)); setFlipped(false); }}
                        disabled={quizIndex === quizItems.length - 1}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                        style={{ background:'#4f6ef7', color:'white' }}>
                        다음 →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
