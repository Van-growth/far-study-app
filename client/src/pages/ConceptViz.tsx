// ConceptViz.tsx — 7개 SVG 시각화 컴포넌트

export function InterestFamilyViz() {
  return (
    <svg viewBox="0 0 680 480" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* 중앙 공통 공식 박스 */}
      <rect x={240} y={195} width={200} height={70} rx={8} fill="#1a2744" />
      <text x={340} y={222} textAnchor="middle" fill="white" fontSize={13} fontWeight="bold">
        Interest = Beg × rate × m/12
      </text>
      <text x={340} y={242} textAnchor="middle" fill="#9ba8c4" fontSize={11}>
        Principal = Payment − Interest
      </text>
      <text x={340} y={258} textAnchor="middle" fill="#9ba8c4" fontSize={11}>
        → Plug-in
      </text>

      {/* Bond 박스 */}
      <rect x={40} y={40} width={180} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={130} y={68} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Bond</text>
      <text x={130} y={86} textAnchor="middle" fill="#666" fontSize={12}>Issuer perspective</text>
      <text x={130} y={102} textAnchor="middle" fill="#666" fontSize={12}>SL or Effective</text>
      <text x={130} y={118} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Premium CV↓ / Discount CV↑</text>
      <rect x={100} y={124} width={60} height={16} rx={4} fill="#fef2f2" stroke="#dc2626" strokeWidth={1} />
      <text x={130} y={135} textAnchor="middle" fill="#dc2626" fontSize={10}>Call option</text>

      {/* Finance Lease 박스 */}
      <rect x={460} y={40} width={180} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={550} y={68} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Finance Lease</text>
      <text x={550} y={86} textAnchor="middle" fill="#666" fontSize={12}>Lessee perspective</text>
      <text x={550} y={102} textAnchor="middle" fill="#666" fontSize={12}>Effective only</text>
      <text x={550} y={118} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Liability↓ / ROU↓</text>
      <rect x={520} y={124} width={60} height={16} rx={4} fill="#f0fdf4" stroke="#166534" strokeWidth={1} />
      <text x={550} y={135} textAnchor="middle" fill="#166534" fontSize={10}>TBORTS</text>

      {/* Note Payable 박스 */}
      <rect x={40} y={330} width={180} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={130} y={358} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Note Payable</text>
      <text x={130} y={376} textAnchor="middle" fill="#666" fontSize={12}>Borrower perspective</text>
      <text x={130} y={392} textAnchor="middle" fill="#666" fontSize={12}>Effective only</text>
      <text x={130} y={408} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Beg × rate × m/12</text>
      <rect x={88} y={416} width={84} height={16} rx={4} fill="#eff6ff" stroke="#1d4ed8" strokeWidth={1} />
      <text x={130} y={427} textAnchor="middle" fill="#1d4ed8" fontSize={10}>m/12 주의</text>

      {/* ARO 박스 */}
      <rect x={460} y={330} width={180} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={550} y={358} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">ARO</text>
      <text x={550} y={376} textAnchor="middle" fill="#666" fontSize={12}>Legal obligation</text>
      <text x={550} y={392} textAnchor="middle" fill="#666" fontSize={12}>Credit-adjusted rate</text>
      <text x={550} y={408} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Liability↑ (만기 수렴)</text>
      <rect x={515} y={416} width={70} height={16} rx={4} fill="#fefce8" stroke="#854d0e" strokeWidth={1} />
      <text x={550} y={427} textAnchor="middle" fill="#854d0e" fontSize={10}>Accretion</text>

      {/* 연결선 */}
      <line x1={220} y1={95} x2={240} y2={215} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={460} y1={95} x2={440} y2={215} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={220} y1={385} x2={240} y2={250} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={460} y1={385} x2={440} y2={250} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />

      {/* 하단 SPEED 박스 */}
      <rect x={40} y={455} width={600} height={36} rx={8} fill="#1a2744" />
      <text x={340} y={477} textAnchor="middle" fill="white" fontSize={12}>
        SPEED: 이자 먼저 계산 → 나머지 원금 | SL 명시 없으면 Effective | Payment=이자비용 → 오답
      </text>
    </svg>
  )
}

export function InventoryCostViz() {
  return (
    <svg viewBox="0 0 680 380" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* Inventory 박스 */}
      <rect x={40} y={40} width={180} height={120} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={130} y={70} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Inventory</text>
      <text x={130} y={88} textAnchor="middle" fill="#666" fontSize={12}>FIFO / LIFO / WA</text>
      <text x={130} y={104} textAnchor="middle" fill="#666" fontSize={12}>LCM / NRV</text>
      <text x={130} y={120} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Dollar-Value LIFO</text>
      <rect x={50} y={132} width={80} height={16} rx={4} fill="#fff7ed" stroke="#c2410c" strokeWidth={1} />
      <text x={90} y={143} textAnchor="middle" fill="#c2410c" fontSize={10}>가격방향 주의</text>

      {/* PP&E 박스 */}
      <rect x={250} y={40} width={180} height={120} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={70} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">PP&amp;E</text>
      <text x={340} y={88} textAnchor="middle" fill="#666" fontSize={12}>SL / DDB / SYD</text>
      <text x={340} y={104} textAnchor="middle" fill="#666" fontSize={12}>Impairment 2-Step</text>
      <text x={340} y={120} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Interest capitalization</text>
      <rect x={290} y={132} width={100} height={16} rx={4} fill="#fff7ed" stroke="#c2410c" strokeWidth={1} />
      <text x={340} y={143} textAnchor="middle" fill="#c2410c" fontSize={10}>write-up 불가</text>

      {/* Intangibles 박스 */}
      <rect x={460} y={40} width={180} height={120} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={550} y={70} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Intangibles</text>
      <text x={550} y={88} textAnchor="middle" fill="#666" fontSize={12}>Definite → Amortize</text>
      <text x={550} y={104} textAnchor="middle" fill="#666" fontSize={12}>Indefinite → No amort</text>
      <text x={550} y={120} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Annual impairment test</text>
      <rect x={490} y={132} width={120} height={16} rx={4} fill="#eff6ff" stroke="#1d4ed8" strokeWidth={1} />
      <text x={550} y={143} textAnchor="middle" fill="#1d4ed8" fontSize={10}>Goodwill no amort</text>

      {/* 화살표: 각 박스 → 중앙 I/S 박스 */}
      <line x1={130} y1={160} x2={200} y2={220} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-inv)" />
      <line x1={340} y1={160} x2={340} y2={220} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-inv)" />
      <line x1={550} y1={160} x2={480} y2={220} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-inv)" />
      <defs>
        <marker id="arrow-inv" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1a2744" />
        </marker>
      </defs>

      {/* 중앙 I/S 박스 */}
      <rect x={140} y={220} width={400} height={44} rx={8} fill="#1a2744" />
      <text x={340} y={246} textAnchor="middle" fill="white" fontSize={13}>
        COGS / Depreciation / Amortization → I/S
      </text>

      {/* 하단 원칙 박스 */}
      <rect x={40} y={295} width={600} height={60} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={320} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">공통 원칙</text>
      <text x={340} y={340} textAnchor="middle" fill="#666" fontSize={12}>
        Historical cost 기준 | US GAAP write-up 불가 | 손상 후 회복 불가
      </text>
    </svg>
  )
}

export function EquityCapitalViz() {
  return (
    <svg viewBox="0 0 680 420" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* SE 박스 */}
      <rect x={40} y={155} width={160} height={120} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={120} y={182} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">Stockholders' Equity</text>
      <text x={120} y={200} textAnchor="middle" fill="#666" fontSize={12}>Cost vs Par Value</text>
      <text x={120} y={217} textAnchor="middle" fill="#666" fontSize={12}>Stock div / Split</text>
      <text x={120} y={234} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">OCI 4항목</text>

      {/* EPS 박스 */}
      <rect x={265} y={40} width={150} height={100} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={68} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">EPS</text>
      <text x={340} y={86} textAnchor="middle" fill="#666" fontSize={12}>Basic: (NI−Pref)÷WASO</text>
      <text x={340} y={103} textAnchor="middle" fill="#666" fontSize={12}>Diluted: +전환증권</text>

      {/* Equity Method 박스 */}
      <rect x={265} y={280} width={150} height={100} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={308} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">Equity Method</text>
      <text x={340} y={326} textAnchor="middle" fill="#666" fontSize={12}>NI×%−Diff amort</text>
      <text x={340} y={343} textAnchor="middle" fill="#666" fontSize={12}>배당→Investment↓</text>

      {/* Consolidation 박스 */}
      <rect x={480} y={155} width={160} height={120} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={560} y={182} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Consolidation</text>
      <text x={560} y={200} textAnchor="middle" fill="#666" fontSize={12}>Intercompany 제거</text>
      <text x={560} y={217} textAnchor="middle" fill="#666" fontSize={12}>Goodwill 인식</text>
      <text x={560} y={234} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">NCI</text>

      {/* 화살표: SE → EPS */}
      <defs>
        <marker id="arrow-eq" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1a2744" />
        </marker>
      </defs>
      <line x1={120} y1={155} x2={265} y2={90} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-eq)" />
      <text x={180} y={115} fill="#666" fontSize={11}>NI 귀속</text>

      {/* 화살표: SE → Equity Method */}
      <line x1={120} y1={275} x2={265} y2={330} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-eq)" />
      <text x={175} y={320} fill="#666" fontSize={11}>20~50%</text>

      {/* 화살표: Equity Method → Consolidation */}
      <line x1={415} y1={330} x2={480} y2={215} stroke="#1a2744" strokeWidth={1.5} markerEnd="url(#arrow-eq)" />
      <text x={445} y={280} fill="#666" fontSize={11}>&gt;50%</text>
    </svg>
  )
}

export function TaxAdjustmentViz() {
  return (
    <svg viewBox="0 0 680 340" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* Deferred Tax 박스 */}
      <rect x={40} y={60} width={250} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={165} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Deferred Tax</text>
      <text x={165} y={108} textAnchor="middle" fill="#666" fontSize={12}>Deductible diff → DTA</text>
      <text x={165} y={126} textAnchor="middle" fill="#666" fontSize={12}>Taxable diff → DTL</text>
      <text x={165} y={144} textAnchor="middle" fill="#666" fontSize={12}>Permanent → 제외</text>
      <text x={165} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">Enacted rate / All non-current</text>
      <rect x={50} y={172} width={70} height={16} rx={4} fill="#fef2f2" stroke="#dc2626" strokeWidth={1} />
      <text x={85} y={183} textAnchor="middle" fill="#dc2626" fontSize={10}>VA 주의</text>

      {/* Accounting Changes 박스 */}
      <rect x={390} y={60} width={250} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={515} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Accounting Changes</text>
      <text x={515} y={108} textAnchor="middle" fill="#666" fontSize={12}>Estimate → Prospective</text>
      <text x={515} y={126} textAnchor="middle" fill="#666" fontSize={12}>Principle → Retrospective</text>
      <text x={515} y={144} textAnchor="middle" fill="#666" fontSize={12}>Error → Restatement</text>
      <text x={515} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">감가상각 변경 = Estimate!</text>

      {/* 하단 연결 박스 */}
      <rect x={140} y={265} width={400} height={44} rx={8} fill="#1a2744" />
      <text x={340} y={291} textAnchor="middle" fill="white" fontSize={13}>둘 다 I/S + RE에 영향</text>

      {/* 화살표 */}
      <defs>
        <marker id="arrow-tax" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#1a2744" />
        </marker>
      </defs>
      <line x1={165} y1={230} x2={240} y2={265} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" markerEnd="url(#arrow-tax)" />
      <line x1={515} y1={230} x2={440} y2={265} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" markerEnd="url(#arrow-tax)" />
    </svg>
  )
}

export function RevenueRecognitionViz() {
  return (
    <svg viewBox="0 0 680 360" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* Revenue 박스 */}
      <rect x={240} y={40} width={200} height={100} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={68} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">Revenue Recognition</text>
      <text x={340} y={86} textAnchor="middle" fill="#666" fontSize={12}>ASC 606 5-Step</text>
      <text x={340} y={103} textAnchor="middle" fill="#666" fontSize={12}>PO 충족 시 인식</text>
      <text x={340} y={120} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Point vs Over Time</text>

      {/* Foreign Currency 박스 */}
      <rect x={40} y={225} width={200} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={140} y={253} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">Foreign Currency</text>
      <text x={140} y={271} textAnchor="middle" fill="#666" fontSize={12}>Title transfer 기준 JE</text>
      <text x={140} y={288} textAnchor="middle" fill="#666" fontSize={12}>AR+Gain → 외화강세</text>
      <text x={140} y={305} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">units per $ → Decrease</text>

      {/* Subsequent Events 박스 */}
      <rect x={440} y={225} width={200} height={110} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={540} y={253} textAnchor="middle" fill="#1a2744" fontSize={13} fontWeight="bold">Subsequent Events</text>
      <text x={540} y={271} textAnchor="middle" fill="#666" fontSize={12}>Type 1 → 수정 (인식)</text>
      <text x={540} y={288} textAnchor="middle" fill="#666" fontSize={12}>Type 2 → 주석 공시</text>
      <text x={540} y={305} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">BS date ~ 발행일</text>

      {/* 연결선 */}
      <line x1={340} y1={140} x2={140} y2={225} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={340} y1={140} x2={540} y2={225} stroke="#1a2744" strokeWidth={1} strokeDasharray="4,3" />
      <text x={200} y={195} fill="#666" fontSize={11}>환율 시점</text>
      <text x={470} y={195} fill="#666" fontSize={11}>인식 시점</text>
    </svg>
  )
}

export function FinancialAnalysisViz() {
  return (
    <svg viewBox="0 0 680 340" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* SCF 박스 */}
      <rect x={40} y={60} width={180} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={130} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">SCF</text>
      <text x={130} y={108} textAnchor="middle" fill="#666" fontSize={12}>Operating (Indirect)</text>
      <text x={130} y={126} textAnchor="middle" fill="#666" fontSize={12}>Investing</text>
      <text x={130} y={144} textAnchor="middle" fill="#666" fontSize={12}>Financing</text>
      <text x={130} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">Notes rec = Investing!</text>

      {/* Ratio 박스 */}
      <rect x={250} y={60} width={180} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={340} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Ratio Analysis</text>
      <text x={340} y={108} textAnchor="middle" fill="#666" fontSize={12}>Liquidity: Current/Quick</text>
      <text x={340} y={126} textAnchor="middle" fill="#666" fontSize={12}>Profitability: ROA/ROE</text>
      <text x={340} y={144} textAnchor="middle" fill="#666" fontSize={12}>Efficiency: Turnover</text>
      <text x={340} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">Avg Total Assets 사용</text>

      {/* Fair Value 박스 */}
      <rect x={460} y={60} width={180} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={550} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Fair Value</text>
      <text x={550} y={108} textAnchor="middle" fill="#666" fontSize={12}>L1: identical + active</text>
      <text x={550} y={126} textAnchor="middle" fill="#666" fontSize={12}>L2: observable</text>
      <text x={550} y={144} textAnchor="middle" fill="#666" fontSize={12}>L3: unobservable</text>
      <text x={550} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">Similar ≠ Identical (L2)</text>

      {/* Bank Reconciliation 배지 */}
      <rect x={40} y={258} width={180} height={44} rx={8} fill="#f0f3f8" stroke="#1a2744" strokeWidth={1.5} />
      <text x={130} y={284} textAnchor="middle" fill="#1a2744" fontSize={11}>
        Bank Rec: Book vs Bank
      </text>
      <text x={130} y={297} textAnchor="middle" fill="#1a2744" fontSize={11}>
        → Adjusted balance
      </text>

      {/* 하단 공통 박스 */}
      <rect x={250} y={258} width={390} height={44} rx={8} fill="#1a2744" />
      <text x={445} y={284} textAnchor="middle" fill="white" fontSize={12}>재무제표 분석 도구:</text>
      <text x={445} y={298} textAnchor="middle" fill="white" fontSize={12}>수익성·유동성·효율성·가치 평가</text>
    </svg>
  )
}

export function PublicNonprofitViz() {
  return (
    <svg viewBox="0 0 680 340" style={{ maxWidth: 680, width: '100%', height: 'auto', display: 'block' }}>
      {/* NFP 박스 */}
      <rect x={40} y={60} width={260} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={170} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">NFP Accounting</text>
      <text x={170} y={108} textAnchor="middle" fill="#666" fontSize={12}>FASB ASC 958</text>
      <text x={170} y={126} textAnchor="middle" fill="#666" fontSize={12}>Net assets with/without</text>
      <text x={170} y={144} textAnchor="middle" fill="#666" fontSize={12}>Contribution vs Exchange</text>
      <text x={170} y={162} textAnchor="middle" fill="#1a2744" fontSize={12} fontWeight="bold">Endowment 원금 보존</text>

      {/* Governmental 박스 */}
      <rect x={380} y={60} width={260} height={170} rx={8} fill="white" stroke="#1a2744" strokeWidth={1.5} />
      <text x={510} y={88} textAnchor="middle" fill="#1a2744" fontSize={14} fontWeight="bold">Governmental</text>
      <text x={510} y={108} textAnchor="middle" fill="#666" fontSize={12}>GASB 기준</text>
      <text x={510} y={126} textAnchor="middle" fill="#666" fontSize={12}>Fund types 3그룹</text>
      <text x={510} y={144} textAnchor="middle" fill="#666" fontSize={12}>Modified Accrual</text>
      <text x={510} y={162} textAnchor="middle" fill="#dc2626" fontSize={12} fontWeight="bold">Encumbrance 주의</text>

      {/* 하단 공통 박스 */}
      <rect x={140} y={265} width={400} height={44} rx={8} fill="#1a2744" />
      <text x={340} y={291} textAnchor="middle" fill="white" fontSize={12}>
        공통: 영리 목적 없음 | 자원 배분·수탁 책임 강조
      </text>
    </svg>
  )
}
