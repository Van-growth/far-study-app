/*
 * ============================================================
 * FAR STUDY APP — "SHOW ME" VISUALIZATION SPEC
 * ============================================================
 *
 * 슬기가 "show me"라고 하면 현재 대화 맥락에 맞는 SVG를 즉시 제시.
 * 이 기능이 앱의 핵심 차별화 포인트.
 *
 * 트리거: "show me" / "비주얼로" / "숫자로 보여줘" / "비교해줘" / "구조화해줘"
 *
 * 맥락별 시각화 유형:
 *
 * ① Before / After 비교
 *    - 조정 누락 / 과잉 / 오조정 / AJE 전후 / Error correction
 *    - 세금 조정 (Current / Deferred / VA) / FV excess / 두 방법 비교
 *    - 형태: 왼쪽(틀린 방식 c-gray) vs 오른쪽(올바른 방식 c-purple/coral)
 *            차이 줄 색깔 강조 + 차이 금액 화살표 + 빨간 badge
 *
 * ② 거래 / 구조 시각화
 *    - 다자간 거래 흐름 / Factoring / Consolidation
 *    - Intercompany / Equity method / Lease / Bond 구조
 *    - 형태: 참여자(박스) + 방향 화살표 + 금액/역할 레이블
 *
 * ③ 계산 단계 시각화
 *    - 다단계 계산 / WASO / EPS / DTA+VA / Bond amortization
 *    - 형태: 단계별 흐름 + 각 단계 숫자 + 최종 결과 강조
 *
 * ④ 개념 구조도
 *    - 개념 간 관계 / 분류 체계 / 조건 분기
 *    - 형태: 계층 구조 또는 조건 분기 다이어그램
 *
 * 공통 원칙:
 *    - 숫자는 문제의 실제 숫자 사용 (임의 예시 아님)
 *    - 맥락 애매하면 가장 이해에 도움되는 유형 자동 선택
 *    - 텍스트 설명 없이 SVG 바로 출력
 *
 * 앱 연동 계획 (향후):
 *    - 문제 틀리면 자동으로 "show me" 버전 렌더링
 *    - card_type(calculation/conditional/concept)별 디폴트 시각화 방식 지정
 *      calculation  → ③ 계산 단계
 *      conditional  → ① Before/After 또는 ② 구조
 *      concept      → ④ 개념 구조도
 * ============================================================
 */

export interface TopicCard {
  topic_id: string;
  // legacy structured fields (book/chapter/group-based entries)
  book_id?: 'IA' | 'AA' | 'GN';
  chapter_id?: string;
  topic_group?: string;
  sub_category_id?: string;
  card_name?: string;
  // newer flat-style fields
  category?: string;
  topic_name?: string;
  summary?: string;
  card_type?: 'calculation' | 'conditional' | 'concept';
  rule: string;
  trigger: string;
  trap: string;
  one_sentence?: string;
  example?: string;
  context?: string;             // alias used in some entries
  // structured explanation fields (question_bank Migration 034와 동일)
  context_background?: string;  // 경제적 실질 배경
  context_trigger?: string;     // → 회계처리 필요해지는 상황
  rule_title?: string;          // RULE 제목
  rule_items?: string[];        // ① ② ... 규칙 항목 배열
  speed?: string;               // SPEED 한 줄 풀이
  journal_entry?: string;       // 분개 예시 (있는 경우만)
  key_formula?: string;         // 공식/계산 요약
}

export const EXPLANATION_TEMPLATE = `CONTEXT:
{context_background}

→ {context_trigger}

RULE: {rule_title}
① {rule_1}
② {rule_2}

TRIGGER: {trigger}

TRAP: {trap}

SPEED:
{speed}`;

export const PROFESSOR_SSOT_V2: TopicCard[] = [

  // ── PPE ────────────────────────────────────────────────────────────────────
  {
    topic_id: "PPE_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "What goes into Land cost",
    rule: "Land cost includes purchase price, title fees, legal fees, survey costs, demolition of existing structures, grading, and back-filling. Deduct scrap proceeds from demolition.",
    trigger: "land purchase | demolition | grading | survey | title fees",
    trap: "Demolition costs are capitalized into Land, not expensed. Scrap proceeds reduce Land cost, not a gain.",
    one_sentence: "Land cost = everything spent to get the land ready for use, minus any scrap proceeds.",
    example: "Land $100,000 + demolition $10,000 − scrap proceeds $2,000 = Land cost $108,000",
  },
  {
    topic_id: "PPE_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Land vs Land Improvements — how to split",
    rule: "Land Improvements (parking lots, fences, landscaping, sprinklers) are separate from Land if they are replaceable and independent of the project. They depreciate; Land does not.",
    trigger: "parking lot | fence | landscaping | sprinkler | land improvements",
    trap: "Do not bundle replaceable improvements into Land — they must be depreciated separately.",
    one_sentence: "Land Improvements = replaceable assets on the land; record separately and depreciate.",
    example: "Parking lot $20,000 → Land Improvements (depreciated); grading $5,000 → Land (not depreciated)",
  },
  {
    topic_id: "PPE_003",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Demolition cost — where does it go",
    rule: "Demolition cost is added to Land cost, not expensed, regardless of timing relative to construction.",
    trigger: "demolition | tear down | remove existing building | razed",
    trap: "Never expense demolition costs — they always increase Land.",
    one_sentence: "Demolition is a cost of preparing land, so it capitalizes into Land.",
    example: "Old warehouse demolished for $15,000 → Dr. Land $15,000 / Cr. Cash $15,000",
  },
  {
    topic_id: "PPE_004",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Transaction costs on asset purchase",
    rule: "Transaction costs on individual asset purchases (legal fees, installation, shipping) are capitalized as part of asset cost.",
    trigger: "legal fee | installation | shipping | individual asset | standalone purchase",
    trap: "This rule applies only to individual asset purchases, not business acquisitions.",
    one_sentence: "For a standalone asset purchase, all costs to acquire and prepare capitalize into the asset.",
    example: "Machine $50,000 + installation $3,000 + shipping $1,000 → Asset cost $54,000",
  },
  {
    topic_id: "PPE_005",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Transaction costs on business acquisition",
    rule: "Transaction costs in a business combination (legal fees, investment banker, due diligence) are expensed as incurred, never added to goodwill.",
    trigger: "M&A | business combination | acquisition | investment banker | due diligence",
    trap: "Same legal fee that capitalizes for an asset purchase becomes immediate expense in M&A.",
    one_sentence: "M&A transaction costs are expensed immediately — never capitalized.",
    example: "Legal fees $500,000 in M&A → Acquisition Expense $500,000 (not added to Goodwill)",
  },

  // ── INT_CAP ────────────────────────────────────────────────────────────────
  {
    topic_id: "INT_CAP_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTR_CAP',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Interest capitalization — when does it stop",
    rule: "Capitalize interest from acquisition/construction start until the asset is ready for its intended use. Once ready for use, all subsequent interest is expensed immediately.",
    trigger: "capitalized interest | ceiling | cannot exceed | maximum | amount borrowed | solely | exclusively | interest income | reduced by",
    trap: "'Amount borrowed' → 기준은 평균 누적지출액(accumulated expenditures)임. 'Solely/exclusively one rate' → general debt 가중평균이자율도 사용 가능. 'Interest income 차감' → US GAAP 불가 (IFRS와 혼동 주의).",
    speed: "소거법: ① 'amount borrowed' → A 탈락 / ② 'solely/exclusively' → B 탈락 / ③ 'reduced by interest income' → C 탈락 → D 정답",
    one_sentence: "Stop capitalizing interest the moment the asset is ready for its intended use.",
    example: "Building ready April 1 → January–March interest capitalized; April–December interest expensed",
  },
  {
    topic_id: "INT_CAP_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTR_CAP',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Purchased asset — can you capitalize interest",
    rule: "US GAAP: only assets under self-construction qualify for interest capitalization; purchased ready-to-use assets do not. IFRS: any qualifying asset (including purchased) may qualify.",
    trigger: "purchased asset | US GAAP | IFRS | qualifying asset | off-the-shelf",
    trap: "US GAAP restricts capitalization to self-constructed assets; buying a finished machine does not qualify.",
    one_sentence: "US GAAP: capitalize only on self-constructed assets; IFRS extends it to qualifying purchased assets.",
    example: "Company buys machine off the shelf → US GAAP: no interest capitalization; IFRS: possibly yes",
  },

  // [INT_CAP_003] Interest Capitalization — Capitalization Period Start & End
  // RULE    : 시작 = 건설 지출 시작일 / 종료 = substantially complete and ready for its intended use
  // TRIGGER : 날짜 여러 개 → 지출 시작일 찾기 / 'substantially complete and ready for its intended use' → 종료일
  // TRAP    : 허가일(B) / 실제 사용일(C) / 차입일(D) → 모두 함정
  {
    topic_id: "INT_CAP_003",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTR_CAP',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "Interest Capitalization — Capitalization Period (Start and End Date)",
    rule: "자본화 시작일: 건설을 위한 지출이 실제로 발생한 시점\n(허가·이자는 통상 그 전에 충족)\n\n자본화 종료일: 'substantially complete and ready for its intended use'\n→ 실제 사용 시작일(moved in / began using) 아님\n→ 공사 지출 종료일 아님",
    trigger: "날짜 여러 개 나열 → 지출(expenditure) 시작일 찾기 → 시작일 확정\n'substantially complete and ready for its intended use' 옆 날짜 → 종료일\n'began using / moved in / placed in service' → 함정, 무시",
    trap: "허가일을 시작일로 착각\n차입일(이자 발생일)을 시작일로 착각\n실제 입주·사용일을 종료일로 착각\n공사 지출 종료일을 자본화 종료일로 혼동",
    one_sentence: "시작 = 건설 지출 시작일 / 종료 = substantially complete and ready for its intended use.",
    speed: "시작: 건설 지출 시작일\n종료: 'substantially complete and ready for its intended use' 옆 날짜\n'began using / moved in' 보이면 → 무시",
    example: "허가 Feb 15 / 차입 Mar 10 / 지출 Apr 1 → 시작 Apr 1 / 준공 Oct 20 → 종료 Oct 20 / 입주 Nov 30 → 무시",
  },

  // [INT_CAP_004] Interest Capitalization — Weighted-Average Interest Rate
  // RULE    : 복수 차입금 → 각 금액 비중(%) × 금리 합산 = 가중평균이자율
  // TRIGGER : "weighted-average interest rate" + 복수 note → 비중 계산
  // TRAP    : 단순 평균 함정 / 13개월 note도 연간 이자율 그대로 사용
  {
    topic_id: "INT_CAP_004",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTR_CAP',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Interest Capitalization — Weighted-Average Interest Rate",
    rule: "복수의 차입금으로 건설 자금을 조달한 경우:\n가중평균이자율 = Σ(각 차입금 금액 ÷ 총 차입금) × 각 금리\n→ 단순 평균(각 금리 합 ÷ 차입금 수)이 아님",
    trigger: '"weighted-average interest rate" + 복수 note → 각 note 금액 ÷ 총 차입금 = 비중 → 금리 × 비중 합산\n두 금리 모두 최고 금리 이하 → 가중평균은 반드시 그 사이값',
    trap: "단순 평균 함정: (10% + 8%) ÷ 2 = 9.0% → 비중 무시한 오답\n13개월 note도 'outstanding for the entire year' → 연간 이자율 그대로 사용\n총 차입금 아닌 다른 금액으로 나누는 실수 주의",
    speed: "① 총 차입금 확인 → ② 각 note 비중 계산 → ③ 금리 × 비중 합산\n→ 최고 금리 초과 선지 즉시 탈락",
    example: "총 $4,800,000: $3,600,000 @ 10% (75%) + $1,200,000 @ 8% (25%)\n= (10% × 75%) + (8% × 25%) = 7.5% + 2.0% = 9.5%",
  },

  // ── LEASE ──────────────────────────────────────────────────────────────────
  {
    topic_id: "LEASE_001",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Is this contract a lease or not",
    rule: "A contract contains a lease only if BOTH: (1) Identified Asset — specific asset identified and supplier cannot substitute; (2) Right to Control — lessee obtains substantially all economic benefits AND directs how/for what purpose the asset is used.",
    trigger: "identified asset | right to control | substitution rights | contains a lease | sublease | may relocate | may replace | not physically distinct",
    trap: "If the supplier has the substantive right to substitute the asset, the contract is a service, not a lease. 'Not physically distinct' capacity portions also fail the identified asset test.",
    one_sentence: "A contract is a lease only if there is a specific asset AND the lessee controls its use.",
    example: "Truck #42 identified, no substitution right, lessee decides routes → lease; 'any available truck' → service contract",
  },
  {
    topic_id: "LEASE_002",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'conditional',
    card_name: "Finance or Operating — how to classify",
    rule: "Any one of five criteria → Finance Lease: (T) Title transfers; (B) Bargain purchase option; (75) Lease term ≥ 75% of economic life; (90) PV of payments ≥ 90% of fair value; (S) Specialized asset with no alternative use.",
    trigger: "finance lease | operating lease | lease classification | 75% | 90%",
    trap: "Only ONE criterion needs to be met — not multiple.",
    one_sentence: "If any one of T-B-75-90-S is true, it is a Finance Lease.",
    example: "Lease term 8 yrs / Economic life 10 yrs → 80% ≥ 75% → Finance Lease",
  },
  {
    topic_id: "LEASE_003",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Finance lease — initial measurement on Day 1",
    rule: "Lease Obligation = PV of (fixed payments + bargain purchase option / guaranteed residual value). ROU Asset = Lease Obligation + initial direct costs.",
    trigger: "day 1 | initial measurement | ROU asset | lease obligation | inception | commencement",
    trap: "ROU Asset = Lease Obligation + initial direct costs — they are not always equal.",
    one_sentence: "At lease commencement, record ROU Asset and Lease Obligation both at the present value of future payments.",
    example: "PV of payments $100,000 + IDC $2,000 → ROU Asset $102,000 / Lease Obligation $100,000",
  },
  {
    topic_id: "LEASE_004",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Finance lease — initial direct costs",
    rule: "Initial direct costs (legal fees, broker commissions paid by lessee) are added to the ROU Asset on Day 1 and amortized over the lease term.",
    trigger: "initial direct costs | broker commission | legal fees | lessee costs",
    trap: "Initial direct costs increase ROU Asset only — they do NOT affect Lease Obligation.",
    one_sentence: "Initial direct costs are capitalized into ROU Asset on Day 1.",
    example: "IDC $3,000 → Dr. ROU Asset $3,000, Cr. Cash $3,000 (adds to ROU, not Lease Obligation)",
  },
  {
    topic_id: "LEASE_005",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Finance lease — interest expense each period",
    rule: "Interest Expense = Beginning Lease Obligation × discount rate × (months/12). For Annuity Due, no interest on the first payment since it occurs at inception.",
    trigger: "interest expense | lease obligation | beginning balance | discount rate",
    trap: "Always use Beginning balance × rate — not ending or average balance.",
    one_sentence: "Finance lease interest = beginning obligation times the discount rate.",
    example: "Beginning obligation $100,000 × 6% = $6,000 interest expense for Year 1",
  },
  {
    topic_id: "LEASE_006",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Finance lease — depreciation period (which life to use)",
    rule: "Title transfer or bargain purchase option (T or B criteria) → depreciate over useful life. All other criteria (75%, 90%, Specialized) → depreciate over lease term.",
    trigger: "depreciation | useful life | lease term | which period | shorter of",
    trap: "Default is lease term unless title/bargain purchase guarantees ownership transfer.",
    one_sentence: "Use useful life only if the lessee will own the asset; otherwise use the lease term.",
    example: "Finance lease via 90% criterion, lease term 5 yrs, useful life 8 yrs → depreciate over 5 years",
  },
  {
    topic_id: "LEASE_007",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'conditional',
    card_name: "Finance lease — journal entry at payment",
    rule: "Dr. Interest Expense (Beginning × rate) + Dr. Lease Obligation (remainder) / Cr. Cash. For Annuity Due Year 1: Dr. Lease Obligation / Cr. Cash only (no interest).",
    trigger: "payment | lease obligation | cash | interest expense | journal entry | finance lease",
    trap: "Cash payment = interest + principal — split them correctly; Annuity Due first payment has zero interest.",
    one_sentence: "Each payment reduces lease obligation by the principal portion and records interest separately.",
    example: "Payment $20,000 / Interest $6,000 → Dr. Interest Expense $6,000, Dr. Lease Obligation $14,000, Cr. Cash $20,000",
  },
  {
    topic_id: "LEASE_008",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Operating lease — expense each period",
    rule: "Lease Expense = straight-line over the lease term. If payments vary (e.g., free rent, step-ups), average them across the full term.",
    trigger: "operating lease | lease expense | straight-line | even | uniform | flat",
    trap: "Lease Expense is always straight-line even if cash payments fluctuate each year.",
    one_sentence: "Operating lease expense is always equal each period, regardless of actual cash payment amounts.",
    example: "3-yr lease: payments $8K, $10K, $12K → Lease Expense = $10,000/yr (average)",
  },
  // [LEASE_009] Operating Lease — Liability Balance (Effective Interest Method)
  // RULE    : Lease Liability = 빚의 원금 잔액 / 이자는 P&L, 원금만 Liability 차감
  // TRIGGER : "carrying value of lease liability at the end of Year N" → 유효이자율법 N회 상각
  // TRAP    : 초기값(PV)을 Year 1 말로 착각 / 납부액 전액 원금 처리 / "end of year" → Ordinary Annuity 확인
  {
    topic_id: "LEASE_009",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Operating Lease — Lease Liability Balance (Effective Interest Method)",
    rule: "Lease Liability = 빚의 원금 잔액 (이자 제외)\n\n① 초기 잔액 = Payment × PV factor (Ordinary Annuity)\n② 매기 상각:\n   Interest = 기초잔액 × rate  → P&L (Interest Expense), Liability 무관\n   Principal = 납부액 − Interest → Liability 차감\n   Ending = 기초잔액 − Principal\n③ Year N 말 잔액 = N회 상각 후 남은 원금",
    trigger: '"carrying value of lease liability at the end of Year N" → N회 상각 후 원금 잔액\n"payments due at the end of the year" → Ordinary Annuity → 개시일 = 초기잔액 그대로\n"Year 2 말" 질문 + "Year 2 초 개시" → 상각 1회만 적용',
    trap: "초기값 $18,655을 Year 2 말 잔액으로 착각 → 개시일 값이지 기말 아님 (B 오답)\n납부액 $5,200 전액을 원금으로 처리 → 이자 $839 먼저 분리 필수 (D 오답)\n'owe annual payments' → 확정 납부 의무액, Ordinary Annuity 확인 키워드",
    one_sentence: "Lease Liability = 아직 안 갚은 원금 잔액; 이자는 시간 사용료(P&L), 원금만 Liability에서 차감.",
    speed: "① 초기: Payment × PV factor\n② Interest = 기초잔액 × rate\n③ Principal = 납부액 − Interest\n④ Ending = 기초잔액 − Principal\n⑤ Year N 말이면 N회 반복",
    example: "Payment $5,200 / Rate 4.5% / Factor 3.5875\n초기: $5,200 × 3.5875 = $18,655\nYear 2: Interest $839 / Principal $4,361 / Ending $14,294\nYear 3: Interest $643 / Principal $4,557 / Ending $9,737",
    context_background: "[Lease Liability의 본질]\nLease = 돈을 빌려서 자산을 쓰는 계약.\nLease Liability = 아직 갚지 않은 원금 잔액.\n이자는 '빌린 기간에 대한 시간 사용료'이지 빚 자체가 아님.\n→ 이자는 P&L(Interest Expense)로 처리, Liability 잔액에 영향 없음.\n→ 원금 상환분만 Liability에서 차감.\n\n[납부액 분리 구조]\n매기 납부액 $5,200 =\n  이자 (기초잔액 × 4.5%) → P&L\n+ 원금 (납부액 − 이자)   → Liability 차감\n\n주택담보대출과 동일 논리:\n매달 납부액 = 이자(시간 사용료) + 원금 상환\n대출 잔액은 원금 상환분만큼만 감소.\n\n[Year N 말 잔액 계산 순서]\n① 개시일: 초기 Liability = PV of payments\n② Year 2 말: 1회 상각 → Ending\n③ Year 3 말: 전기 Ending을 기초잔액으로 → 2회 상각\n→ Year N 말 잔액 = 직전 기말잔액 기준으로 상각 반복\n\n[Ordinary Annuity 확인]\n'payments due at the end of the year' → 기말 납부 → Ordinary Annuity\n→ 개시일 = 초기잔액 그대로 (첫 납부 아직 안 함)\n\n[I/S vs B/S 구분]\nI/S: Lease Expense = Straight-line 균등 (Finance와 다름)\nB/S: Liability 상각 = 유효이자율법 (Finance와 동일)",
  },
  {
    topic_id: "LEASE_010",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'conditional',
    card_name: "Operating lease — journal entry at payment",
    rule: "Dr. Lease Expense (straight-line amount) + Dr. Lease Liability (principal portion) / Cr. Cash (actual payment) + Cr. Amortization—ROU Asset (same as principal).",
    trigger: "operating lease | journal entry | payment | ROU amortization | full entry",
    trap: "The Amortization—ROU Asset credit is a separate entry — omitting it creates an imbalance.",
    one_sentence: "Operating lease payment splits into: straight-line expense, liability reduction, and ROU asset amortization.",
    example: "Payment $10,000 / Interest $2,500 / Principal $7,500 → Dr. Lease Expense $10,000, Dr. Lease Liability $7,500, Cr. Cash $10,000, Cr. Amortization—ROU $7,500",
  },
  {
    topic_id: "LEASE_011",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'conditional',
    card_name: "Residual value guarantee — include in liability or not",
    rule: "Include the lessee's guaranteed residual value in PV calculation for Lease Obligation. Unguaranteed residual value is excluded from the lessee's calculation.",
    trigger: "residual value guarantee | RVG | guaranteed | unguaranteed | lessee",
    trap: "Only the lessee-guaranteed amount is included — third-party guarantees and unguaranteed amounts are excluded.",
    one_sentence: "Guaranteed RVG goes into the PV calculation; unguaranteed RVG does not.",
    example: "Guaranteed RVG $10,000 at lease end → include PV($10,000) in Lease Obligation; Unguaranteed $5,000 → excluded",
  },
  {
    topic_id: "LEASE_012",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Current vs noncurrent split on Balance Sheet (principal only)",
    rule: "Current portion of lease liability = principal to be repaid within the next 12 months (interest excluded). Noncurrent = remaining principal beyond 12 months.",
    trigger: "current portion | noncurrent | balance sheet | split | next 12 months",
    trap: "Current portion = next year's principal ONLY — not the full next payment (interest is excluded).",
    one_sentence: "Split lease liability into current (next year's principal) and noncurrent (everything else).",
    example: "Next year payment $20,000 / interest portion $8,000 → current portion = $12,000 (principal only)",
    context_background: "[왜 Finance Lease를 하는가]\n직접구매: Dr.Asset / Cr.Cash → 현금 한 번에 유출\nFinance Lease: Dr.ROU Asset / Cr.Lease Liability → 현금 보존 + 분할 상환\n항공사(비행기) / 제조업(설비) / 물류(트럭) 대표적\n\n[Finance Lease = Bond — Plug-in 구조]\n지급액(고정) = 이자(계산) + Plug-in(나머지)\n\nBond: Cash $8,000 / 이자 $7,500(계산) / Discount상각 $500(Plug-in)\nLease: Cash $9,000 / 이자 $7,500(계산) / 원금감소 $1,500(Plug-in)\n\n왜 Plug-in: 이자를 경제적 실질대로 먼저 계산 → 나머지 자동 결정\n역산: Cash − 이자 = Plug-in (모르는 값 있으면 역산)\n차이: Bond = 이자·원금 분리 / Lease = 하나의 지급액에 혼합\n\n[net of current portion 독해법]\n'$75,000 net of current $1,364'\n→ $75,000 = NCL(이미 current 뺀 값)\n→ 실제 총잔액 = $75,000 + $1,364 = $76,364\n'net of' = '~를 제외한' → 제시금액에 current 더해야 총잔액\n\n[이자율 우선순위]\nImplicit = 리스회사 실제 이자율 → known이면 반드시 우선\nIncremental = 추정치 → Implicit unknown일 때만\n'which was known to [회사명]' → Implicit 즉시 선택\n\n[계산 순서 — 항상 이 순서]\nStep1(계산): 이자 = 잔액 × 이자율\nStep2(Plug-in): 원금 = 지급액 − 이자\nStep3: 잔액 = 이전잔액 − 원금\n잔액↓ → 이자↓ → 원금↑ (Effective Interest Method 특성)\n\n[전체 흐름]\nDay1: ROU $76,364 / Liability $76,364\n1/2/Y2: 이자$7,636 / 원금$1,364 / 잔액$75,000\n12/31/Y2: 잔액$75,000 / Current(원금)=$1,500 / NCL=$73,500\n1/2/Y3: 이자$7,500 / 원금$1,500 / 잔액$73,500",
  },
  {
    topic_id: "LEASE_013",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Leasehold improvement — how many years to depreciate",
    rule: "Depreciate leasehold improvements over the shorter of (1) remaining lease term or (2) useful life of the improvement. If renewal is probable, include renewal period in remaining lease term.",
    trigger: "leasehold improvement | shorter of | lease term | useful life",
    trap: "If renewal option is probable, extend the lease term — that may change the 'shorter of' answer.",
    one_sentence: "Leasehold improvements depreciate over the shorter of their useful life or remaining lease term.",
    example: "Improvement useful life 8 yrs / Remaining lease term 5 yrs → depreciate over 5 years",
  },
  {
    topic_id: "LEASE_014",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Renewal option — does it extend the lease term",
    rule: "Include renewal period in the lease term if exercise is reasonably certain (probable). If not probable, exclude it from the lease term for both ROU and liability calculations.",
    trigger: "renewal option | probable | reasonably certain | lease term | extension",
    trap: "Include the renewal only if probable — do not automatically include all possible renewals.",
    one_sentence: "A renewal option extends the lease term only if the lessee is reasonably certain to exercise it.",
    example: "5-year lease + 3-year option; renewal probable → lease term = 8 years for all calculations",
  },
  {
    topic_id: "LEASE_015",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'conditional',
    card_name: "Finance vs Operating — expense pattern over time",
    rule: "Finance lease: higher expense early (interest larger when balance is high), lower expense later. Operating lease: flat expense each period. Total lifetime expense is the same.",
    trigger: "expense pattern | compare | total expense | finance vs operating | front-loaded",
    trap: "Finance lease front-loads expense — do not assume operating lease costs less overall.",
    one_sentence: "Finance lease expenses more in early years; operating lease expenses the same each year.",
    example: "4-yr Finance lease: Yr 1 $5,670 / Yr 4 $3,294; Operating: $10,000 every year — same total",
  },

  // [LEASE_016] Finance Lease — ROU Asset at Inception (Annuity Due + Lessee RVG)
  // RULE    : Annuity Due 팩터(기초 납부) + RVG × PV of $1(lease term 기준, 1회성)
  // TRIGGER : 'beginning Jan 1' → Annuity Due / 'owed by the company' → Lessee RVG 합산
  // TRAP    : 6년 팩터 사용(A) / TVM 무시(B) / RVG 누락(C)
  {
    topic_id: "LEASE_016",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Finance Lease — ROU Asset at Inception (Annuity Due + Lessee RVG)",
    rule: "ROU Asset = (Payment × Annuity Due factor, lease term 기준) + (Lessee RVG × PV of $1, lease term 기준). 기초 납부 → Annuity Due / 기말 납부 → Ordinary Annuity. RVG는 리스 종료 시점 1회성 lump sum → PV of $1 팩터. 팩터 기간은 항상 lease term(useful life 아님).",
    trigger: "'beginning January 1' → Annuity Due 팩터 (기초 납부 확정)\n'expected to be owed by the company' → Lessee RVG → 1회성 lump sum → PV of $1로 별도 할인\nPV 팩터 표에 두 기간 제공 시 → lease term 기준 선택",
    trap: "$535,340(A): 6년 팩터 통째로 사용 → useful life 혼동\n$520,000(B): TVM 무시, FV + RVG 단순 합산\n$446,510(C): Lessee RVG $14,946 누락\n공통 함정 ①: Ordinary Annuity 팩터(4.2124) 선택 — 'beginning'이 보이면 무조건 Annuity Due\n공통 함정 ②: RVG에 6년 팩터(0.7050) 적용 — RVG는 5년 말 1회성 → 5년 팩터(0.7473)",
    one_sentence: "ROU Asset = Payment × Annuity Due(lease term) + RVG × PV of $1(lease term); RVG는 1회성 lump sum이라 annuity 팩터 아님.",
    speed: "($100,000 × 4.4651) + ($20,000 × 0.7473) = $446,510 + $14,946 = $461,456",
    context_background: "[Finance Lease ROU Asset 인식 원칙]\nLessee는 리스 개시일에 최소리스료의 현재가치를 ROU Asset과 Lease Liability로 동시 인식한다.\n\n[ROU Asset 두 가지 구성요소]\n① 정기납부 $100,000 × 5회\n- 납부 시점: 'beginning January 1' = 기초 납부 → Annuity Due 팩터\n- 팩터 기간: lease term 5년\n- $100,000 × 4.4651 = $446,510\n\n② Lessee RVG $20,000\n- 성격: 리스 종료 시점(5년 말)에 딱 한 번 낼 수도 있는 1회성 lump sum\n- 정기납부가 아니므로 Annuity 팩터 아님 → PV of $1 팩터\n- 팩터 기간: lease term 5년 말 지급 → 5년 팩터\n- $20,000 × 0.7473 = $14,946\n\n[왜 6년 팩터를 쓰면 안 되는가]\n자산의 useful life는 6년이지만 현금흐름은 lease term 5년 동안만 발생한다. 팩터는 현금흐름 발생 기간 기준으로 선택해야 하므로 항상 lease term(5년) 기준.\n\n[Annuity Due vs Ordinary Annuity]\n- Annuity Due: 기초 납부 → 'beginning [개시일]'\n- Ordinary Annuity: 기말 납부 → 'ending' or 특별한 언급 없을 때",
  },

  // [LEASE_017] Finance Lease — Implicit Rate vs IBR + Lease Liability Amortization (Annuity Due)
  // RULE    : Implicit rate 알면 IBR 불가 / Annuity Due 첫 납부 = 전액 원금 / 이후 기초잔액 × rate = 이자
  // TRIGGER : 'known to lessee' → implicit rate 확정 / 개시일 첫 납부 → 이자 없음
  // TRAP    : IBR 12% 사용 오답(C) / Finance lease 미인식 오답(D) / 기말잔액으로 이자 계산 오류
  {
    topic_id: "LEASE_017",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Finance Lease — Implicit Rate vs IBR Selection + Lease Liability Amortization (Annuity Due)",
    rule: "Rate 선택 계층: implicit rate를 lessee가 알면 반드시 implicit rate 사용 — IBR은 implicit rate 모를 때만 차선. Annuity Due(개시일 납부): 첫 납부는 이자 없이 전액 원금 상환. 이후 납부: 기초잔액 × rate = 이자 / 납부액 − 이자 = 원금 상환분.",
    trigger: "'rate implicit in the lease (X%, known to lessee)' → implicit rate 확정, IBR 숫자는 함정\n'first payment made on commencement date' → Annuity Due → 첫 납부 전액 원금, 이자 없음\n'second payment' / 'Year 2 balance sheet' → 상각표 2행 끝값",
    trap: "C($228,320): IBR 12% 적용 오류 — implicit rate 아는데 IBR 사용 불가\nD($0): Finance lease 미인식 — 내용연수 전체 커버 = 무조건 B/S 인식\n이자 계산 시 기말잔액 사용 오류 → 항상 기초잔액(beginning balance) × rate\nROU Asset 감가상각이 Lease Liability에 영향 준다는 혼동 — 두 트랙 완전 독립",
    one_sentence: "Implicit rate 알면 IBR 무시 / Annuity Due 첫 납부 = 전액 원금 / 이후 기초잔액 × rate = 이자.",
    speed: "① Implicit rate 10% 확정(known) → PV = $316,500\n② Y1 첫 납부(개시일 Annuity Due): $316,500 − $50,000 = $266,500\n③ Y2 이자: $266,500 × 10% = $26,650\n④ Y2 원금: $50,000 − $26,650 = $23,350\n⑤ Y2 잔액: $266,500 − $23,350 = $243,150 → 답: B",
    context_background: "[Rate 선택 계층 구조]\nImplicit rate(리스 내재이자율): 리스계약에 내재된 이자율. Lessee가 알고 있으면 반드시 사용.\nIBR(증분차입이자율): Lessee가 implicit rate를 모를 때만 사용하는 차선책.\n→ 이 문제에서 'known to Birch(10%)' = implicit rate 확정. IBR 12%/$298,500은 함정 숫자.\n\n[Annuity Due 구조]\n개시일에 첫 납부 → 아직 이자가 한 푼도 발생하지 않은 시점 → 전액 원금 상환.\n이후 납부부터 기초잔액 × rate = 이자 계산 시작.\n\n[상각표]\nDate         Payment   Interest   Decline    Liability\n12/31/Y1(개시)                              $316,500\n12/31/Y1(1차)  50,000      –       50,000    266,500\n12/31/Y2(2차)  50,000   26,650    23,350    $243,150\n\n[Finance Lease 두 트랙 — 완전 독립]\n부채 트랙(Lease Liability): 납부액(이자+원금)으로 상각. 계약서에 확정된 스케줄.\n자산 트랙(ROU Asset): 감가상각으로 상각. $316,500 ÷ 9년 = $35,167/년.\n→ ROU Asset이 줄어도 Lease Liability 상각 스케줄에 영향 없음. 집 담보대출과 동일 논리.\n\n[JE 정리]\n개시일: Dr. ROU Asset 316,500 / Cr. Lease Liability 316,500\n첫 납부(Y1): Dr. Lease Liability 50,000 / Cr. Cash 50,000\nY2 이자: Dr. Interest Expense 26,650 / Cr. Interest Payable 26,650\n두번째 납부(Y2): Dr. Interest Payable 26,650 + Dr. Lease Liability 23,350 / Cr. Cash 50,000",
  },

  // [LEASE_018] Lease Payment Components — Included vs Excluded
  // RULE    : 포함 = Fixed + Purchase option(RC) + RVG + Termination(RC) / 제외 = 운영비용
  // TRIGGER : 'reasonably certain' + purchase option → 포함 / maintenance/insurance/tax → 제외
  // TRAP    : 리스 자산 관련이라 포함 착각(A/B/D) / RC 없으면 포함 불가
  {
    topic_id: "LEASE_018",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Lease Payment Components — Included vs Excluded (Purchase Option, Operating Costs)",
    rule: "Lease Payment 포함 항목 (ASC 842):\n✅ Fixed payments (확정 임차료)\n✅ Purchase option exercise price (reasonably certain)\n✅ Lessee RVG (잔존가치보증)\n✅ Termination penalty (reasonably certain)\n\n제외 항목 (발생 시 별도 expense):\n❌ Maintenance costs\n❌ Insurance expense\n❌ Property taxes",
    trigger: "'reasonably certain to exercise' + purchase option → exercise price 포함\n'maintenance/insurance/property taxes' → 운영비용 → lease payment 제외\n'lease payments at commencement' → 계약 확정 + reasonably certain 항목만",
    trap: "A/B/D: 리스 자산 관련 비용이라 포함될 것 같지만 → 발생 시 expense\n'reasonably certain' 없는 purchase option → 포함 불가",
    one_sentence: "Lease payment = Fixed + Purchase option(RC) + RVG + Termination(RC); 운영비용 제외.",
    speed: "① maintenance/insurance/taxes → 운영비용 → 제외\n② purchase option + 'reasonably certain' → 포함\n③ 답: C",
    context_background: "[Lease Payment 포함 기준]\nASC 842: lease liability = 미래 lease payments의 PV.\n'계약상 확정됐거나 reasonably certain한 것'만 포함.\n\n[운영비용 제외 이유]\nMaintenance/Insurance/Property taxes:\n→ 리스 계약 조건이 아닌 자산 사용 중 발생 비용\n→ 발생 시 Dr. Expense / Cr. Cash\n→ Lease liability와 무관\n\n[Purchase Option]\nReasonably certain → exercise price 포함 (PV 할인)\nNot reasonably certain → 포함 불가",
  },

  // [LEASE_019] Lease Payment — Full Classification Table
  // RULE    : 포함 4가지 vs 제외 3가지 전체 분류표
  // TRIGGER : lease payment 구성 전체 암기용
  // TRAP    : 운영비용 포함 착각 / RC 조건 누락
  {
    topic_id: "LEASE_019",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Lease Payment — Full Classification Table (Included vs Excluded)",
    rule: "=== LEASE PAYMENT 전체 분류표 ===\n\n✅ 포함 (Lease Liability에 반영)\n① Fixed payments — 계약상 확정 임차료\n② Purchase option — reasonably certain 조건 충족 시 exercise price\n③ Lessee RVG — 리스 종료 시 보증 잔존가치\n④ Termination penalty — reasonably certain하게 조기종료 시\n\n❌ 제외 (발생 시 별도 Expense)\n① Maintenance costs — 유지보수비\n② Insurance expense — 보험료\n③ Property taxes — 재산세\n\n공통 원칙:\n포함 = 계약상 의무 or reasonably certain한 미래 지급\n제외 = 리스 자산 사용 중 발생하는 운영비용",
    trigger: "lease payment 구성 전체 확인 필요 시\n운영비용(유지보수/보험/재산세) 등장 → 즉시 제외\nPurchase option → RC 여부 확인 후 판단\nRVG → 포함 (Lessee 보증분만)",
    trap: "운영비용(maintenance/insurance/tax)을 lease payment에 포함하는 오류\nPurchase option을 RC 확인 없이 자동 포함하는 오류\nLessor RVG를 Lessee RVG로 혼동하여 포함하는 오류\nVariable lease payments(판매량 연동 등)를 포함하는 오류 → 제외",
    one_sentence: "포함 4가지(Fixed/Purchase RC/RVG/Termination RC) vs 제외 3가지(유지보수/보험/재산세).",
    speed: "포함 키워드: Fixed / RC purchase option / RVG / RC termination\n제외 키워드: maintenance / insurance / property tax / variable payments",
    context_background: "[포함 항목 상세]\n\n① Fixed payments\n계약서에 명시된 확정 임차료. 변동 없는 기본 리스료.\n\n② Purchase option (RC)\n리스 종료 시 자산 매수 선택권. reasonably certain할 때만 포함.\n행사가격을 리스 종료 시점에 PV 할인하여 개시일 liability에 반영.\n\n③ Lessee RVG\n리스 종료 시 자산 잔존가치가 보증금액에 미달하면 lessee가 차액 보전.\n→ Lessee 부담분만 포함 (Lessor RVG는 포함 안 함).\n\n④ Termination penalty (RC)\nReasonably certain하게 리스를 조기종료할 경우 발생하는 위약금.\n\n[제외 항목 상세]\n\n① Maintenance costs\n자산 유지·수리비. 발생 시 Dr. Maintenance Expense / Cr. Cash.\n\n② Insurance expense\n리스 자산에 대한 보험료. 발생 시 Dr. Insurance Expense / Cr. Cash.\n\n③ Property taxes\n리스 자산 관련 재산세. 발생 시 Dr. Tax Expense / Cr. Cash.\n\n[추가 제외 항목]\nVariable payments (판매량·사용량 연동) → 불확실 → 제외\nLessor RVG → Lessee 의무 아님 → 제외",
  },

  // [LEASE_020] Finance Lease Liability Reduction — Payment Split (Principal vs Interest)
  // RULE    : Liability 감소 = 납부액 − 이자(원금 부분만) / 감가상각과 완전 독립
  // TRIGGER : 'liability reduced by' → 납부액 − 이자 / 감가상각 언급 → 즉시 소거
  // TRAP    : 납부액 전액(B) / 감가상각 연결(C/D)
  {
    topic_id: "LEASE_020",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Finance Lease Liability Reduction — Payment Split (Principal vs Interest)",
    rule: "Finance Lease 납부액 분리:\nMinimum Lease Payment = Interest + Principal\n\nLease Liability 감소 = Principal만\n= 납부액 − 이자 배분액\n\n이자 → P&L(Interest Expense), liability 감소 아님\n감가상각(ROU Asset) → 자산 트랙, liability와 완전 무관",
    trigger: "'finance lease liability reduced by' → 납부액 − 이자 = 원금\n감가상각 언급 선지(C/D) → 자산 트랙, liability 무관 → 즉시 소거\n'end of each period' → Ordinary Annuity, 기말 납부",
    trap: "B(납부액 전액): 이자 부분도 포함. 이자는 Interest Expense로 P&L 처리, liability 감소 아님.\nC/D(감가상각 연결): 감가상각은 ROU Asset(자산) 트랙. Lease Liability(부채) 트랙과 완전 독립.",
    one_sentence: "Lease Liability 감소 = 납부액 − 이자(원금만); 감가상각은 자산 트랙으로 liability와 무관.",
    speed: "① 납부액 = 이자 + 원금\n② Liability 감소 = 원금 = 납부액 − 이자\n③ 감가상각 언급 선지 → 즉시 소거\n④ 답: A",
    context_background: "[Finance Lease 두 트랙 복습]\n\n부채 트랙 (Lease Liability):\n납부 시: Dr. Interest Expense(이자) + Dr. Lease Liability(원금) / Cr. Cash\n→ Liability는 원금 부분만 감소\n→ 이자는 P&L, liability와 무관\n\n자산 트랙 (ROU Asset):\n감가상각: Dr. Depreciation Expense / Cr. Accumulated Depreciation\n→ ROU Asset만 감소\n→ Lease Liability와 완전 무관\n\n[비유: 주택담보대출]\n매달 납부액 = 이자 + 원금\n대출 잔액 감소 = 원금 부분만\n집 감가상각은 대출 잔액과 무관\n→ Finance Lease와 동일 구조\n\n[납부액 분리 공식]\nLease Liability 감소 = 납부액 − (기초 Liability × 이자율)\n= 원금 상환분\n\n[Minimum Lease Payment 용어 정리]\nMinimum Lease Payment = 계약상 확정된 고정 납부액 전체 (이자 + 원금 섞인 것)\n→ 원금만 뽑아낸 게 아님. 변동 납부액(판매량 연동 등) 제외한 무조건 내야 하는 금액.\n→ 현재 ASC 842에서는 'lease payment'로 표현, 시험에서 두 용어 혼용.\n\n선지 A 해석:\n'Minimum Lease Payment less the portion allocable to interest'\n= 납부액 전체 − 이자 배분액 = 원금 부분 = Liability 감소분",
  },

  // [LEASE_021] Lease classification — items included in lessee lease payments
  // RULE    : 포함 = fixed payments + RVG(미포함분) + purchase option(reasonably certain) + penalties
  // TRIGGER : "RVG" + "not included" → 포함 / "exceeds metrics" → variable → 제외 / "lessor's debt" → 별도 기준 / "indemnification/contingent" → 제외
  // TRAP    : variable payments를 포함으로 오분류 / RVG 중복 포함 / lessor's debt guarantee를 리스 의무로 혼동
  {
    topic_id: "LEASE_021",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Lease classification — items included in lessee lease payments",
    rule: "리스 분류(Operating vs. Finance) 시 lessee의 lease payments 포함 항목:\n① Fixed payments (in-substance fixed 포함)\n② Lessee RVG — lease payments에 미포함분만\n③ Purchase option — reasonably certain 행사 시\n④ Penalties — 단기 종료 시\n제외: variable payments(usage/performance 기반) / contingent payments / lessor's debt guarantee",
    trigger: '"residual value guarantee" + "not included in lease payments" → 리스 분류 포함\n"exceeds metrics/usage/thresholds" → variable → 제외, 발생 시 expense\n"guarantee of lessor\'s debt" → 별도 financial guarantee(ASC 460) → 제외\n"indemnification" / "environmental" / "contingent" → 미래 사건 의존 → 제외',
    trap: "① Variable payments(사용량·성과 기반) → 확정 의무 아님 → 리스 분류 제외\n② RVG가 이미 lease payments에 포함된 경우 → 중복 추가 불가 / 'not included' 조건이 핵심\n③ Lessor's debt guarantee → 리스 계약 밖 별도 금융보증(ASC 460) — 리스 분류와 무관",
    one_sentence: "Lease payments 포함 = fixed + RVG(미포함분) + 확실한 purchase option; variable·contingent·lessor debt guarantee 제외.",
    example: "RVG $10,000 (lease payments 별도) → 포함 ✅ / 사용량 초과 추가지급 → variable → 제외 ❌ / Lessor 부채 보증 → ASC 460 → 제외 ❌",
    context_background: "리스를 Operating vs. Finance로 분류할 때 lessee는 lease payments 총액을 계산해야 한다. 핵심은 '확정적 지급 의무'인지 여부다. RVG는 리스 종료 시 자산 잔존가치가 보증액에 미달하면 lessee가 차액을 지급해야 하는 확정적 잠재 의무이므로 포함된다. 반면 usage/performance 기반 variable payments나 contingent indemnification은 미래 사건에 의존하므로 제외된다. Lessor의 부채 보증은 리스 계약 자체와 별개로 ASC 460 적용 대상이다.",
    speed: "① 확정적 지급 의무? → RVG ✅\n② 'exceeds metrics' → variable → B 제외\n③ 'indemnification' → contingent → C 제외\n④ 'lessor\\'s debt' → 별도 기준 → A 제외\n⑤ 'not included in lease payments' → 중복 아님 → D 포함 → 정답 D",
  },

  // [LEASE_022] Finance Lease Classification — Criteria Traps (T-B-75-90-S)
  // RULE    : 5가지 중 하나 충족 → Finance Lease / 75%=lease term / 90%=PV / T=lessee에게 이전 / B=RC 조건
  // TRIGGER : "criterion for finance lease" → T-B-75-90-S
  // TRAP    : 75%↔90% 교차(C) / title→lessor(B) / FV purchase option(A)
  {
    topic_id: "LEASE_022",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'concept',
    card_name: "Finance Lease Classification — Criteria Traps (T-B-75-90-S)",
    rule: "Finance Lease 5가지 기준 (하나만 충족 시 분류):\nT — Title transfer: 리스 종료 시 소유권 lessee에게 이전\nB — Bargain purchase option: reasonably certain 행사 (fair value ≠ bargain)\n75 — Lease term ≥ 경제적 내용연수의 75%\n90 — PV of payments ≥ 공정가치의 90%\nS — Specialized asset: 대안적 용도 없음",
    trigger: '"criterion for finance lease" → T-B-75-90-S 5가지 암기\n75% 숫자 → lease term 기준 (경제적 내용연수 대비)\n90% 숫자 → PV of payments 기준 (fair value 대비)\n두 숫자 교차 배치 → 오답 신호',
    trap: "A (purchase option at fair value): B 기준은 reasonably certain + bargain price. Fair value = 시장가 → bargain 아님\nB (title remains with lessor): T 기준은 lessee에게 이전. Lessor 보유 = 정반대\nC (PV ≥ 75% of fair value): PV 기준 임계값은 90%. 75%를 PV에 붙이면 오답\n공통 함정: 75%↔90% 교차 출제 / FV purchase option을 bargain으로 착각",
    one_sentence: "Finance Lease = T-B-75-90-S 중 하나; 75%=term / 90%=PV / B=RC 조건 / T=lessee 이전.",
    speed: "75% → lease TERM ≥ economic life의 75%\n90% → PV ≥ fair value의 90%\nPurchase option → fair value이면 bargain 아님 → B 불충족",
    context_background: "[Finance Lease vs Operating Lease 분류 흐름]\n\n아래 5가지 중 하나라도 충족 → Finance Lease\n(모두 불충족 → Operating Lease)\n\nT: 리스 종료 시 소유권 lessee 이전\n   → 자동 충족, 조건 없음\n\nB: Bargain purchase option\n   → 행사 시 시장가보다 현저히 낮은 가격\n   → reasonably certain to exercise 조건 필요\n   → Fair value 가격 = 시장가 → bargain 아님\n\n75: Lease term ≥ 경제적 내용연수 × 75%\n   → '75%'는 항상 lease term에 배정\n   → PV에 75% 붙이면 오답\n\n90: PV of lease payments ≥ 공정가치 × 90%\n   → '90%'는 항상 PV에 배정\n   → lease term에 90% 붙이면 오답\n\nS: Specialized asset\n   → lessee 외 다른 용도 없는 특수 자산\n\n[시험 출제 패턴]\n① 75%와 90%를 교차 배치 (C 선지 단골)\n② Purchase option at fair value → fair value는 bargain 아님\n③ Title remains with lessor → 정반대 조건",
  },

  // [LEASE_023] Operating Lease — Expense: Rent + Leasehold Improvement + Security Deposit
  // RULE    : First month rent → expense / Last month → Prepaid / Security deposit(refundable) → Asset / Installation → LH Improvement 상각
  // TRIGGER : "last month's rent" → Prepaid / "refundable" → Asset / "installation/walls/premises" → LH Improvement
  // TRAP    : Last month expense(A) / Installation 누락(C) / Security deposit expense(D)
  {
    topic_id: "LEASE_023",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_LEASE',
    sub_category_id: "U4_LEASE",
    card_type: 'calculation',
    card_name: "Operating Lease — Expense: Rent + Leasehold Improvement + Security Deposit",
    rule: "Operating lease 개시 시 지급 항목별 처리:\n\n① First month's rent → Lease Expense (당월 소비)\n\n② Last month's rent → Prepaid Rent (자산)\n→ 마지막 달에 expense 처리\n→ 당기 expense 아님\n\n③ Security deposit (refundable) → Deposit (자산)\n→ 리스 종료 시 환급 예정\n→ expense 아님, 절대 비용 처리 불가\n\n④ Installation / renovation → Leasehold Improvement (자산)\n→ 자본화 후 리스 기간(또는 useful life 중 짧은 것)에 걸쳐 상각\n→ 당기 = 설치월부터 결산일까지 월수 × 월상각액",
    trigger: '"last month\'s rent" → Prepaid (당기 expense 아님)\n"refundable at lease expiration" → 환급 예정 → 자산\n\n[Leasehold Improvement 실전 키워드]\n"installation of new walls/offices/partitions" → 임차 공간 안 물리적 설치\n"improvements to the leased premises" → premises = 임차한 건물·사업장 전체\n"renovation of leased space" → 임차 공간 리노베이션\n"remodeling costs" → 임차 공간 리모델링\n판단 기준: 임차한 공간 안에서 + 물리적으로 설치·개조한 것 → Leasehold Improvement\n리스 종료 시 구조물은 건물주(lessor)에 귀속 → 리스 기간 동안만 상각하는 것이 논리적',
    trap: "Last month rent를 expense 처리: 마지막 달에 쓸 돈 → Prepaid\nSecurity deposit을 expense 처리: refundable = 환급 예정 → 자산 (비용 아님)\nInstallation 상각 누락: 자본화 후 리스 기간 상각 → 당기분 계산 필요\nInstallation을 즉시 expense 처리: Leasehold Improvement = 자본화 대상\n공통 함정: '같은 날 같이 지급했으니 다 expense' → 각 항목 성격 따라 처리 다름",
    one_sentence: "Operating lease 개시 expense = 당월 rent + improvement 당기 상각; Last month rent·Security deposit·미상각 improvement → 자산.",
    speed: "First month rent $60,000 → expense\nLast month rent → Prepaid → $0\nSecurity deposit → Asset(refundable) → $0\nInstallation $360,000 ÷ 60개월 × 1개월 = $6,000\n합계 $66,000",
    context_background: "[각 항목의 경제적 실질]\n\n■ First month's rent $60,000\n12월 한 달치 임차료. 당월 사용한 용역의 대가 → 즉시 Lease Expense.\n\n■ Last month's rent $60,000\n5년 후 마지막 달에 쓸 돈을 미리 냄. 아직 용역을 받지 않음\n→ Prepaid Rent (자산). 5년 후 마지막 달에 Lease Expense로 전환.\n\n■ Security deposit $80,000\n임차인이 계약 준수 담보로 맡기는 돈. 리스 종료 시 돌려받음(refundable).\n→ Deposit (자산). 비용화 절대 불가.\n\n■ Installation $360,000\n임차 공간(leased premises)에 물리적으로 설치한 구조물(벽·사무실 파티션).\n→ Leasehold Improvement. 자본화 후 리스 기간(60개월) 상각.\n→ 당기 상각: $360,000 ÷ 60개월 × 1개월 = $6,000\n\n[Leasehold Improvement 판단 기준]\n임차한 공간 안에서 + 물리적 설치·개조\n→ 리스 종료 시 구조물은 lessor에게 귀속\n→ 내가 혜택받는 기간(리스 기간)만 상각\n\n[premises란?]\n법률·회계 용어로 '건물·부지·사업장 전체'를 의미\n'leased premises' = '임차한 공간/건물'\n'on the premises' = '그 장소 안에서'\n'improvements to the leased premises' = '임차한 건물에 대한 개량'\n\n[Leasehold Improvement 실전 키워드 정리]\n- installation of new walls/offices/partitions\n- improvements to the leased premises\n- renovation of leased space\n- remodeling costs (임차 공간 내)\n- build-out costs\n\n[최종 당기 expense]\nLease Expense:           $60,000\nAmortization (LH Imp.):   $6,000\nTotal:                   $66,000",
    example: "Dec 1 계약 / 5년 / 월 $60,000\nFirst month $60K → expense / Last month $60K → Prepaid / Security $80K → Asset / Installation $360K ÷ 60 × 1 = $6K\n당기 expense = $60K + $6K = $66K",
  },

  // ── INT ────────────────────────────────────────────────────────────────────
  {
    topic_id: "INT_001",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Interest expense formula (lease / bond / note — all same)",
    rule: "Interest Expense = Beginning balance × effective rate × (months/12). Applies to bonds, lease liabilities, and notes payable.",
    trigger: "interest expense | beginning balance | effective rate | carrying value | note payable | borrowed on [date] | quarterly payment",
    trap: "① Beginning balance 사용 — ending/average 아님 ② Payment 금액 ≠ 이자비용 — payment = 이자 + 원금 혼합, 직접 쓰면 오답 ③ 차입일 기준 m/12 계산 — 9/30 차입이면 Oct~Dec = 3/12 ④ 정액법(straight-line) GAAP 불인정 — 유효이자율법만 허용",
    one_sentence: "Interest = Beginning × rate × m/12 — 차입일 기준 기간 계산, payment 숫자 무시.",
    example: "9/30 차입 $1,000,000 × 9% × 3/12 = $22,500 / quarterly payment $264,200 → 이자비용 계산에 사용 금지",
    speed: "① 차입일 확인 → 당해 연도 발생 기간(m) ② Beginning × rate × m/12 ③ payment 숫자 → 무시",
  },
  {
    topic_id: "INT_002",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Journal entry at payment (lease / note — same structure)",
    rule: "Dr. Interest Expense (beginning × rate) + Dr. Note/Lease Liability (principal portion) / Cr. Cash (payment). Structure is identical for notes payable and finance leases.",
    trigger: "payment | note payable | lease liability | journal entry | cash paid",
    trap: "Account names differ but the journal structure is identical for all installment-type liabilities.",
    one_sentence: "Every installment payment splits into interest expense and principal reduction.",
    example: "Payment $20,000 / Interest $6,000 → Dr. Interest Expense $6,000, Dr. Note Payable $14,000, Cr. Cash $20,000",
  },
  {
    topic_id: "INT_003",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Total interest expense over full term — quick calc",
    rule: "Total Interest Expense = Total Cash Payments − Beginning Principal (PV of loan/bond/lease). Count all payments by frequency (monthly, quarterly, semi-annual, annual).",
    trigger: "total interest | over the life | over the term | lifetime interest expense",
    trap: "Verify payment frequency first — miscounting payments (monthly vs annual) is the most common error.",
    one_sentence: "Total interest = total cash you pay out minus what you originally borrowed.",
    example: "Lease PV $218,116 / annual payment $30,000 / 8 years → Total Cash $240,000 − $218,116 = $21,884",
  },
  {
    topic_id: "INT_004",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'conditional',
    card_name: "Total interest income over full term — quick calc",
    rule: "Total Interest Income = Total Cash Receipts − Beginning Principal (PV of receivable/investment at inception).",
    trigger: "total interest income | note receivable | interest over life | interest earned",
    trap: "Use the PV at inception, not face value, as the starting principal.",
    one_sentence: "Total interest income = total cash received minus the initial investment (PV).",
    example: "Note receivable PV $8,573 / face value $10,000 → Total Interest Income = $10,000 − $8,573 = $1,427",
  },
  {
    topic_id: "INT_005",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Annuity due present value — how to convert",
    rule: "Method 1 (preferred on exam): PV(ordinary annuity, n−1 periods) + 1 payment. Method 2: PV(ordinary annuity, n periods) × (1 + r). Use Method 1 when tables are provided — avoids decimals.",
    trigger: "annuity due | beginning of period | payments at start | annuity due factor",
    trap: "Never apply the ordinary annuity factor directly to an annuity due — must convert.",
    one_sentence: "Annuity due PV = ordinary annuity PV × (1 + r), or use the (n−1) factor plus one cash payment.",
    example: "10%, 3 payments: PV factor(10%, 2yr) 1.7355 + 1.0000 = 2.7355; or PV factor(10%, 3yr) 2.4869 × 1.10 = 2.7356",
  },

  // ── INV ────────────────────────────────────────────────────────────────────
  {
    topic_id: "INV_001",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'conditional',
    card_name: "COGS formula — periodic system",
    rule: "COGS = Beginning Inventory + Purchases − Ending Inventory.",
    trigger: "COGS | periodic | beginning inventory | purchases | ending inventory",
    trap: "This is the periodic formula — perpetual tracks COGS at each sale.",
    one_sentence: "Under the periodic system, COGS is a plug calculated after counting ending inventory.",
    example: "Beginning $10,000 + Purchases $50,000 − Ending $12,000 = COGS $48,000",
  },
  {
    topic_id: "INV_002",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Ending inventory up — what happens to net income",
    rule: "Higher ending inventory → lower COGS → higher gross profit → higher net income → higher taxes. Ending inventory and COGS are inversely related.",
    trigger: "ending inventory | COGS | net income | overstated | understated",
    trap: "Ending inventory and COGS are inverse; ending inventory and net income are direct.",
    one_sentence: "Overstate ending inventory → understate COGS → overstate net income.",
    example: "Ending inventory overstated $5,000 → COGS understated $5,000 → Net income overstated $5,000",
  },
  {
    topic_id: "INV_003",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'conditional',
    card_name: "FIFO vs LIFO — tax and income impact",
    rule: "Rising prices: FIFO → higher ending inventory → higher net income → higher taxes. LIFO → lower ending inventory → lower net income → lower taxes. LIFO not permitted under IFRS.",
    trigger: "FIFO | LIFO | rising prices | tax | net income | inventory method",
    trap: "LIFO saves taxes in rising price environments but is not allowed under IFRS.",
    one_sentence: "In rising prices: FIFO gives higher income; LIFO gives lower taxes.",
    example: "Prices rising: FIFO ending = recent high-cost units (high NI, high tax); LIFO ending = old low-cost units (low NI, low tax)",
  },

  // ── REV ────────────────────────────────────────────────────────────────────
  {
    topic_id: "REV_001",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "Payment due over 1 year — present value required",
    rule: "If payment is due more than 1 year after sale, discount to PV. Revenue = PV of cash flows; difference between face and PV = Interest Revenue recognized over time.",
    trigger: "payment due in X years | financing component | note receivable | long-term payment",
    trap: "Even when a PV table is provided, skip discounting if the term is 1 year or less.",
    one_sentence: "Long-term receivables (>1 year) require PV discounting; the excess becomes interest revenue.",
    example: "Sale $10,000 due in 3 years / PV $8,573 → Revenue $8,573 now + Interest Revenue $1,427 over 3 years",
  },
  {
    topic_id: "REV_002",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "Payment due within 1 year — face value, no discounting",
    rule: "If payment is due within 1 year, use the practical expedient — record revenue at face value, no present value calculation required.",
    trigger: "6 months | within 1 year | practical expedient | no discounting | short-term",
    trap: "Do not use the PV table just because it is given — check the payment due date first.",
    one_sentence: "Payments due within 1 year → practical expedient → face value revenue, no discounting.",
    example: "Sale $10,000 due in 9 months → Revenue = $10,000 (no PV calculation needed)",
  },
  // [REV_003] Contract Modification — Separate Contract vs Modification of Original
  // RULE    : Separate contract = ① distinct goods 추가 + ② standalone price 증가 (둘 다 필요)
  // TRIGGER : "separate contract" + modification → 2요건 둘 다 확인
  // TRAP    : scope↑ + standalone price 미충족 → 종료+신결합계약 / 가격불변→기존수정 / PO이행→무관
  {
    topic_id: "REV_003",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "Contract Modification — Separate Contract vs Modification of Original",
    rule: "Contract Modification 처리 분류:\n\n[Case 1] Separate Contract (새 계약)\n조건 ① distinct 재화/서비스 추가 (scope 증가)\nAND\n조건 ② 가격 증가 = standalone selling price 수준 반영\n→ 원계약과 독립적인 별도 계약으로 처리\n\n[Case 2] 기존 계약 종료 + 새 결합계약\n조건 ① distinct 재화/서비스 추가\nBUT\n조건 ②X 가격이 standalone price 미반영\n→ 원계약 종료 + 새로운 결합계약 생성\n\n[Case 3] 기존 계약 수정 (Modification of original)\ndistinct goods 추가 없음 (가격만 변경 등)\n→ 기존 계약의 일부로 처리 (변경 시점부터 전진 적용)",
    trigger: '"separate contract" + "contract modification" → 2요건 확인\n요건 ①: distinct 재화/서비스 추가 (scope 증가) 있는가?\n요건 ②: 가격 증가가 standalone selling price를 반영하는가?\n둘 다 Yes → Separate contract / 하나라도 No → 별도 계약 아님',
    trap: "Terminated(A): scope↑ + standalone price 미충족 → 기존 종료+신결합계약. '별도 계약'이 아님\nPrice remains same(C): 별도 계약은 가격 증가(standalone 수준) 필수. 불변=기존 수정\nPO partially satisfied(D): 이행 상태는 계약 분류 기준 아님. 수익 시점 이슈\n공통 함정: 'scope 증가'만 보고 정답 선택 → ② standalone price 조건도 함께 확인 필수",
    one_sentence: "별도 계약 = ① distinct goods 추가 AND ② standalone price 증가; 하나라도 미충족 → 별도 계약 아님.",
    speed: "① scope 증가(distinct goods) + standalone price → Separate contract\n② scope 증가 + standalone price 미충족 → 기존 종료 + 신결합계약\n③ 가격만 변경 → 기존 계약 수정\n선지에서 'scope + distinct' → 정답 후보 먼저 선택",
    context_background: "[ASC 606 Contract Modification 3가지 경우]\n\nCase 1: Separate Contract\n- distinct 재화/서비스 추가 (Yes)\n- 가격 = standalone price (Yes)\n→ 원계약과 별개로 독립적 처리\n→ 기존 수익 인식에 영향 없음\n\nCase 2: 기존 종료 + 새 결합계약\n- distinct 재화/서비스 추가 (Yes)\n- 가격 ≠ standalone price (No)\n→ 원계약의 잔여 미이행분 + 추가분을 합쳐 새 단가 산출\n→ 변경 시점의 미완료 PO 재배분\n\nCase 3: 기존 계약 수정\n- distinct goods 추가 없음\n→ 미완료 PO에 대해 전진 적용\n→ 남은 거래가격 재산정하여 진행 중 조정\n\n[왜 standalone price가 중요한가]\n회사가 추가 재화를 시장가보다 낮게 공급하면:\n→ 기존 계약의 가격 암묵적 인하와 동일한 경제적 효과\n→ 별도 계약으로 처리하면 기존 계약 수익 왜곡\n→ 따라서 standalone price 충족 시에만 별도 계약 허용",
    example: "추가 5개 재화 @ 시장가 → Separate contract / 추가 5개 @ 할인가 → 기존 종료 + 신결합계약 / 수량 변동 없이 가격만 인하 → 기존 수정",
  },
  {
    topic_id: "REV_004",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "Premium coupon — how to calculate expense",
    rule: "【쿠폰 부채 계산 공식】\n잔여 부채 = 예상 상환 수 × (할인액 + 처리수수료) − 이미 지급액\n\n【핵심 원칙】\n① 발행 쿠폰 전체 아님 → 예상 상환 수(expected redemption) 기준\n② 쿠폰당 총비용 = 할인액 + 처리수수료(handling fee) 둘 다 포함\n③ 이미 지급액 차감 → 잔여 부채\n④ 미처리 쿠폰(수중 보유분) → 별도 계산 불필요 (이미 지급액 차감에 반영)",
    trigger: '"expects X coupons to be redeemed" → 예상 상환 수 기준\n"reimburses additional $X per coupon" → 처리수수료 → 부채 포함\n"paid to date $X" → 차감\n미처리 쿠폰 수 제시 → 함정, 별도 계산 불필요',
    trap: "발행 쿠폰 전체 수량 사용 → 예상 상환 수 기준이어야 함\n처리수수료 누락 → 할인액만 사용하는 오류\n이미 지급액 차감 누락 → 총 예상 부채를 그대로 답으로 사용\n미처리 쿠폰을 별도 가산 → 이미 지급액 차감에 반영됨",
    one_sentence: "Premium expense = expected number of prizes times prize cost.",
    example: "Grove Cereal: 예상 상환 100,000장 / 할인 $0.60 / 수수료 $0.10 / 지급 $20,000\n→ 100,000 × ($0.60 + $0.10) = $70,000\n→ $70,000 − $20,000 = $50,000 잔여 부채",
    speed: "예상 상환 수 × (할인 + 수수료) − 지급액 = 잔여 부채",
  },
  {
    topic_id: "REV_005",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "Warranty expense — how to calculate",
    rule: "Warranty Expense = total sales × total warranty rate. Do not split the rate by year — apply the full percentage in the year of sale.",
    trigger: "warranty | assurance-type | estimated warranty expense | warranty rate",
    trap: "Never split the warranty rate by year — use total rate against total sales all at once.",
    one_sentence: "Warranty expense = total sales × total warranty percentage, all recognized in the year of sale.",
    example: "Sales $500,000 / warranty rate 2% → Warranty Expense = $10,000 (not $5K yr1 + $5K yr2)",
  },
  {
    topic_id: "REV_006",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "Incremental Costs of Obtaining a Contract — CAC 자산화 실무 맥락",
    rule: `[핵심 원칙 — ASC 340-40]
Incremental costs = 계약 없었으면 발생 안 했을 비용 → Capitalize
Commissions → 계약 체결 시에만 발생 → Capitalize
Salaries     → 계약 여부와 무관 → Expense
Advertising  → 특정 계약과 직접 연결 안 됨 → Expense
Practical expedient: 1년 이하 계약은 expense 처리 허용

[실무 분개 흐름] 커미션 $3,600 / 2년 계약
① 계약 체결 시: Dr. Deferred Commission Asset $3,600 / Cr. Accrued Commission Payable $3,600
② 실제 지급 시: Dr. Accrued Commission Payable $3,600 / Cr. Cash $3,600
③ 매월 상각 시: Dr. Commission Expense $150 / Cr. Deferred Commission Asset $150
   ($3,600 ÷ 24개월 = $150/월 → Revenue와 비용 정확히 매칭)

[규모별 중요성]
소규모: materiality 낮음 → practical expedient → 즉시 expense 처리
대규모: 커미션 금액 큼 → 자산화로 Revenue-Cost 매칭 / CAC 정확히 추적 가능

[Capital Allocator 관점]
Deferred Commission 자산 규모 큰 SaaS 기업 분석 시 단기 이익이 부풀려져 있을 수 있음
Adjusted CAC로 다시 계산해야 진짜 LTV:CAC 나옴
Salesforce·HubSpot 10-K에 Deferred Commission 수백억 달러
Series B+ 감사 시 핵심 검토 항목`,
    trigger: "incremental costs | commissions | salaries | advertising | capitalize | contract costs | CAC | deferred commission | ASC 340-40",
    trap: "Salaries·Advertising을 커미션과 함께 capitalize 실수 → 계약 없어도 발생하면 무조건 Expense. 커미션 전액 expense 처리 시 계약 많이 딴 달 이익↓ → '영업 과지출' 잘못된 판단 가능.",
    one_sentence: "계약 없었으면 발생 안 했을 비용(커미션)만 자산화 — 급여·광고비는 항상 즉시 expense.",
    example: "Commissions $3,600 → Capitalize (2년 상각 $150/월) / Salaries $18,000 → Expense / Advertising $3,000 → Expense",
  },
  {
    topic_id: "REV_008",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'calculation',
    card_name: "Percentage of completion — current year gross profit",
    rule: "Over-time GP 계산 4단계: ① 총원가 = 누적실제원가(합산) + 잔여추정원가(최신 당해 기준) ② 추정총GP = 계약가 − 총원가 ③ Completion% = 누적실제원가 ÷ 총원가 ④ 당기GP = 추정총GP × Completion% − 전기누적GP. Billings = GP 계산 무관, B/S Contract Asset/Liability에만 사용.",
    trigger: "revenue recognized over time | construction contract | percentage of completion | actual costs incurred | estimated costs remaining | gross profit Year 2",
    trap: "B($800,000): Year 1 GP를 Year 2로 혼동. C($650,000): 누적 아닌 당기 원가만 사용. D($562,500): Billings 숫자 혼입. 핵심 함정 3가지: ① 전기 인식분 차감 누락 ② Actual costs = 누적합산 (당기만 아님) ③ Progress billings = Stage 1(완공률 계산)에도 Stage 2(당기분 분리)에도 전혀 사용 안 됨. ④ 건설계약에서 'income recognized' = 'gross profit on contract'로 동의어 — net income 개념 아님.",
    one_sentence: "당기GP = (추정총GP × 누적Completion%) − 전기누적GP; 건설계약 'income' = gross profit (net income 아님); Billings는 어느 단계에서도 GP 계산 무관.",
    example: "Y1: 총원가 $3M → GP $2M × 40% = $800K / Y2: 총원가 $2.75M → GP $2.25M × 80% = $1.8M − $800K = $1,000K",
    speed: "⚠️ 실전 팁: 계산 4단계라 시간 소요 큼 → 첫 패스에서 플래그 걸고 스킵, 나중에 돌아와서 풀 것.\n① 누적실제 $2,200K + 잔여 $550K = $2,750K ② 총GP $2,250K ③ 완성% 80% ④ 누적GP $1,800K − 전기 $800K = $1,000K → 정답 A",
    context_background: "[건설계약에서 Income = Gross Profit인 이유]\n일반 손익계산서: Revenue − COGS = Gross Profit → − SG&A 등 = Net Income.\n건설계약은 계약 단위로 원가·수익을 매칭하므로 SG&A를 계약별로 배분하지 않음.\n따라서 'income recognized on contract' = Contract Revenue − Contract Cost = Gross Profit.\n시험에서 'income', 'gross profit on contract', 'income recognized' 모두 같은 공식으로 풀면 됨.\n'net income'이 명시되면 별도 항목 고려 필요.\n\n[2단계 계산 구조]\nStage 1: % of completion = 누적 실제 원가 ÷ 총 예상 원가 (원가가 핵심 재료)\nStage 2: 당기 income = (총GP × 누적완공%) − 전기 인식분 (income previously recognized가 핵심 재료)\n→ 이 문제는 Stage 1이 완료된 이후, Stage 2를 묻는 것.\n→ 슬기가 원가를 떠올린 건 Stage 1의 핵심을 본 것 — 틀리지 않음, 질문 범위가 달랐을 뿐.\n\n[Progress Billings의 위치]\nBillings = 발주처에 보낸 청구서 금액. B/S에서 Contract Asset/Liability 결정에만 사용.\nStage 1 (완공률 계산): 원가만 사용, billings 무관.\nStage 2 (당기분 분리): income previously recognized만 사용, billings 무관.\n어느 단계에서도 GP/Income 계산과 무관.",
  },

  // [REV_009] Construction contract — point in time: progress billings NOT the trigger
  // RULE    : Point in time = 완성(completed) 시점 수익 인식 / Billings → 수익 기준 아님
  // TRIGGER : "point in time" + construction → 완성 시점 / billings collected/exceed → No/No
  // TRAP    : billings collected = 수익(A) / billings exceed costs = 수익(B) / 둘 다(D)
  {
    topic_id: "REV_009",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "Construction contract — point in time recognition: progress billings are not the trigger",
    rule: "Long-term 건설계약 수익 인식 방식 2가지:\n① Point in time: 완성(job completed) 시점에 수익 인식\n   → Progress billings 수취 여부 / 비용 초과 여부 → 수익 기준 아님\n   → Billings = Contract Asset/Liability B/S 표시에만 영향\n\n② Over time(실무 일반): costs incurred ÷ total estimated costs = 완성도 기준\n   → 이때도 Billings는 수익 기준 아님\n\n공통: Billings는 어떤 방식에서도 수익 인식 기준이 아님",
    trigger: "'point in time' + 'long-term construction contract' → 완성 시점 수익\n'are progress billings collected the trigger?' → No\n'do billings exceed recorded costs?' → No\n→ 답: No / No",
    trap: "A(Yes/No): Billings collected = 현금주의 → GAAP 불인정\nB(No/Yes): Billings exceed costs = 이익 발생 기준 착각\nD(Yes/Yes): 둘 다 오답\n공통 함정: 진행 중 청구(billings)를 수익 인식 근거로 착각 → billings는 B/S Contract Asset/Liability에만 영향",
    one_sentence: "Point in time 건설계약: 완성 시 수익 / Billings 수취·비용 초과 → 수익 기준 아님 → No/No.",
    speed: "① Point in time → 완공 시 수익\n② Billings collected? → No (현금주의 아님)\n③ Billings > costs? → No (완성도 기준 아님)\n→ C (No / No)",
    context_background: "[왜 실무에서 Over time을 쓰는가]\n건설 프로젝트는 몇 년에 걸쳐 가치가 만들어진다. 완공 때 한꺼번에 수익 인식하면 연도별 수익이 극단적으로 들쑥날쑥해져 투자자가 실적을 비교할 수 없다. Over time(진행기준)이 경제적 실질에 맞고 정보 유용성이 높다.\n\n[Progress Billings의 역할]\nBillings는 단순히 '공사 중간에 발행하는 청구서'. 수익과 무관하게 다음 B/S 계정에 영향:\n- Costs incurred > Billings → Contract Asset(미청구공사)\n- Billings > Costs incurred → Contract Liability(초과청구공사)\n\n[이 문제가 Point in time 가정을 까는 이유]\n현실에서 잘 안 쓰는 방식이기 때문에 개념 테스트 용도. 핵심: 어떤 인식 방식이든 Billings는 수익 기준이 아니라는 것.",
  },

  // [REV_010] Season Ticket Unearned Revenue — Home Games Only, Away Games Are Distractors
  // RULE    : Unearned = 총수령액 × 잔여 홈경기 / 총 홈경기 / 원정 → 즉시 무시
  // TRIGGER : "season tickets for home games" → 홈 경기만 / 원정 → 무시
  // TRAP    : 전액(A) / 16경기로 나눔(B) / $0(C)
  {
    topic_id: "REV_010",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'calculation',
    card_name: "Season Ticket Unearned Revenue — Home Games Only, Away Games Are Distractors",
    rule: "Season ticket Unearned Revenue:\n\n① 수익 인식 기준 = 홈 경기만\n→ 시즌권(season tickets for home games)은 홈 경기 입장권\n→ 원정 경기는 이 티켓으로 입장 불가 → 수익과 완전히 무관\n\n② 총수령액 = 티켓가 × 판매량\n→ 홈 경기 전체에 걸쳐 균등 인식\n\n③ Unearned Revenue = 총수령액 × (잔여 홈경기 / 총 홈경기)\n\n[원정 경기 정보]\n→ 즉시 무시 (함정 데이터)",
    trigger: '"season tickets for home games" → 수익 인식 기준 = 홈 경기만\n원정 경기 완료 수 → 즉시 무시\n"half home, half away" → 홈 경기 수만 추출\n"unearned revenue" → 잔여 홈경기 비율로 계산',
    trap: "전체 16경기로 나누는 오류: 원정 포함 → 홈 경기만이 수익 기준\n원정 경기를 잔여 경기에 포함: 시즌권 = 홈 전용, 원정 무관\n전액 Unearned: 이미 6경기 완료 → 그만큼 수익 인식\n$0: 홈 2경기 아직 미완료",
    one_sentence: "Season ticket unearned revenue = 총수령액 × 잔여홈경기/총홈경기; 원정 경기 = 완전한 함정.",
    speed: "총액 $4,800,000 ÷ 홈 8경기 = $600,000/경기\n잔여 홈 2경기 × $600,000 = $1,200,000\n원정 5경기 → 즉시 무시",
    context_background: "[왜 홈 경기만 카운트하는가]\n시즌권(season ticket)은 홈 경기 입장권 묶음 상품.\n원정 경기는 원정 구장에서 열리고 이 티켓으로 입장 불가.\n→ 수익 인식 의무(performance obligation) = 홈 경기 제공\n→ 홈 경기가 열릴 때마다 그 비율만큼 수익 인식\n\n[수익 인식 흐름]\n티켓 판매 시: Dr. Cash / Cr. Unearned Revenue (전액)\n홈 경기 1경기 완료: Dr. Unearned Revenue / Cr. Revenue ($4,800,000 ÷ 8)\n\n[Nov 30 기준]\n홈 6경기 완료 → Revenue 인식 $600,000 × 6 = $3,600,000\n홈 2경기 미완료 → Unearned Revenue $600,000 × 2 = $1,200,000\n원정 5경기 → 수익과 무관, 계산에서 제외\n\n[오답 B 분석 — 16경기 오류]\n$4,800,000 ÷ 16 = $300,000/경기\n잔여 경기를 5경기(원정 3 + 홈 2)로 계산 → $1,500,000\n→ 원정 경기가 포함된 잘못된 계산",
    example: "$480 × 10,000 = $4,800,000 총액\n홈 8경기 기준 → $600,000/경기\n홈 2경기 잔여 → Unearned $1,200,000",
  },

  // [REV_011] Service Contract Collections — Contract Liability Recognition
  // RULE    : 현금 선수령 + 서비스 미이행 → Dr. Cash / Cr. Contract Liability (수익 인식 불가)
  // TRIGGER : "paid in full at the time of sale" + "service contract" → Contract Liability
  // TRAP    : 현금 수취 즉시 Revenue 인식 오답 / Receivable 계정 오답 / Stockholders equity 오답
  // EXAMPLE : 서비스 계약 $500 선수령 → Dr. Cash $500 / Cr. Contract Liability $500
  {
    topic_id: "REV_011",
    category: "Revenue Recognition",
    topic_name: "Service Contract Collections — Contract Liability Recognition",
    summary: "서비스 계약 대금 선수령 시 수행의무 미완료 → Contract Liability 계상, 수익 인식 불가",
    rule: "현금 선수령 시 수행의무 미완료 → Dr. Cash / Cr. Contract Liability. 서비스 이행 시 → Dr. Contract Liability / Cr. Service Revenue.",
    trigger: '"paid in full at the time of sale" + "service contract" → Contract Liability. "collections received" → 수익 아님, 부채.',
    trap: "현금 수취 즉시 Revenue 인식 오답. Receivable 계정 오답 — 이미 현금 받음. Stockholders equity 오답 — 자본 무관.",
    example: "서비스 계약 $500 전액 선수령 → Dr. Cash $500 / Cr. Contract Liability $500. 서비스 이행 후 → Dr. Contract Liability $500 / Cr. Service Revenue $500",
    speed: "선수금 수취 → Dr. Cash / Cr. Contract Liability (수행의무 이행 전까지 수익 절대 금지)",
  },

  // [REV_012] Transaction Price Allocation — Relative Standalone Selling Price
  // RULE    : 배분 금액 = 계약가격 × (개별 SSP / SSP 합계) / 계약가격 조정 금지
  // TRIGGER : "can be sold separately" → 별도 수행의무 → SSP 비율 배분
  // TRAP    : 개별가격 그대로 배분 오답 / 단일 수행의무 처리 오답 / 계약가격을 SSP 합계로 조정 오답
  // EXAMPLE : 냉장고 SSP $48,000 + Warranty SSP $12,000 = $60,000. Warranty 20% → $54,000 × 20% = $10,800
  {
    topic_id: "REV_012",
    category: "Revenue Recognition",
    topic_name: "Transaction Price Allocation — Relative Standalone Selling Price",
    summary: "복수 수행의무 존재 시 계약가격을 개별판매가격 비율로 배분. 계약가격 자체는 변경 불가.",
    rule: "배분 금액 = 계약가격 × (개별 SSP / SSP 합계). 계약가격 ≠ SSP 합계여도 계약가격 조정 금지.",
    trigger: '"can be sold separately" → 별도 수행의무 → SSP 비율 배분. 개별가격 합계 ≠ 계약가격 → 비율만 적용.',
    trap: "개별가격 그대로 배분 오답. 단일 수행의무로 처리 오답. 계약가격을 SSP 합계로 조정 오답.",
    example: "냉장고 SSP $48,000 + Warranty SSP $12,000 = $60,000. Warranty 비율 20% → $54,000 × 20% = $10,800 배분.",
    speed: '"separately sold" → SSP 비율 계산 → 계약가격 × 비율 (계약가격 조정 금지)',
  },

  // [REV_013] Principal vs Agent — Revenue Recognition Amount
  // RULE    : Agent 수익 = 총매출 × 수수료율 / Principal 수익 = 총매출 전액
  // TRIGGER : "remits the balance to [transportation/principal]" → Agent → 수수료만 인식
  // TRAP    : 총액 수익 인식 오답 / 송금액 수익 인식 오답 / $0 오답 — 수수료는 수익
  // EXAMPLE : 티켓 판매 $350,000, 수수료 5% → Agent 수익 = $17,500
  {
    topic_id: "REV_013",
    category: "Revenue Recognition",
    topic_name: "Principal vs Agent — Revenue Recognition Amount",
    summary: "Agent는 수수료만 수익 인식. Principal은 총액 인식. remits to principal = Agent 신호.",
    rule: "Agent 수익 = 총매출 × 수수료율. Principal 수익 = 총매출 전액. Agent 판단: 실제 서비스 미제공 + 수수료 구조 + 리스크 없음.",
    trigger: '"remits the balance to [transportation/principal]" → Agent → 수수료만 인식. "responsible for fulfilling the contract" → 서비스 제공자 = Principal.',
    trap: "총액 수익 인식 오답 → Agent는 수수료만. 송금액 수익 인식 오답 → Principal에게 보내는 돈. $0 오답 → 수수료는 수익.",
    example: "티켓 판매 $350,000, 수수료 5% → Agent 수익 = $17,500. 항공사(Principal) 수익 = $350,000.",
    speed: '"remits to principal" → Agent → 수수료만 수익 인식 (무조건 반사)',
  },

  // [REV_014] Loss Contract — Overall Loss Recognized Immediately (Over Time or Point in Time)
  // RULE    : Overall loss 예상 → 방식 무관 전액 즉시 인식 → 둘 다 Decrease
  // TRIGGER : "overall loss anticipated at contract completion" → 인식 방식 무관 즉시 expense
  // TRAP    : Over time만 Decrease / Point in time만 Decrease / 둘 다 No effect
  {
    topic_id: "REV_014",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "Loss Contract — Overall Loss Recognized Immediately Regardless of Revenue Method",
    rule: "건설계약 Overall Loss(전체 예상 손실) 처리:\n인식 방식(Over time / Point in time) 무관\n→ 예상 손실 전액 즉시 인식 (당기 expense)\n→ 두 방식 모두 operating income Decrease\n\n[이유]\n보수주의 원칙: 손실은 예상되는 즉시 인식\n당기까지 발생한 손실분만 인식하는 게 아님\n계약 전체의 예상 총손실을 한꺼번에 인식",
    trigger: '"overall loss anticipated at contract completion" → 방식 무관 즉시 전액 인식\n"over time vs point in time" + loss → 둘 다 Decrease\n인식 방식 비교 표 문제 → loss contract이면 둘 다 동일',
    trap: "B(Decrease / No effect): Point in time은 완공까지 손실 없다고 착각 → 둘 다 Decrease\nA(No effect / Decrease): Over time은 진행분만 인식한다고 착각 → 전체 손실 즉시\nD(No effect / No effect): 보수주의 원칙 무시 → 손실은 예상 즉시 인식",
    one_sentence: "Overall loss = 인식 방식 무관 즉시 전액 인식 → Over time / Point in time 모두 Decrease.",
    speed: "① 'overall loss anticipated' 확인\n② 인식 방식 무관 → 전액 즉시 expense\n③ 둘 다 Decrease → C",
    context_background: "[왜 방식 무관하게 즉시 인식인가]\n\n보수주의(Conservatism) 원칙:\n이익 → 실현될 때까지 인식 안 함\n손실 → 예상되는 즉시 인식\n\nOver time(진행기준):\n원래: 진행도에 따라 손익 인식\n그러나 overall loss → 진행도와 무관하게 전체 손실 즉시 인식\n이유: 계약 전체가 손실임이 명확한데 당기분만 인식하면 미래 손실을 숨기는 셈\n\nPoint in time(완공기준):\n원래: 완공 시점에 수익·비용 인식\n그러나 overall loss → 완공 전이라도 전체 손실 즉시 인식\n이유: 완공까지 기다리면 손실 인식이 지연되어 정보 왜곡\n\n[핵심]\n두 방식의 차이는 '이익 인식 시점'에 있음\n손실은 방식 무관하게 항상 즉시 인식 → 보수주의",
  },

  // [REV_017] Construction Contract — Multiple Projects + Loss Contract (Conservatism)
  // RULE    : 프로젝트별 개별 계산 후 합산 / Loss contract = 완공% 무관 즉시 전액 인식
  // TRIGGER : 두 프로젝트 표 + "over time" + 총원가 > 계약가
  // TRAP    : 두 프로젝트 합산 후 계산 / Loss에 완공% 적용 / Billed·Received 사용
  {
    topic_id: "REV_017",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'calculation',
    card_name: "Construction contract — multiple projects and loss contract immediate recognition",
    rule: "복수 프로젝트 풀이 순서:\n① 프로젝트별 개별 계산 (합산 먼저 금지)\n② 각 프로젝트: 총원가 = 발생원가 + 잔여원가\n③ 총원가 > 계약가 → Loss contract → 완공% 무관, 전액 즉시 인식 (보수주의)\n   총원가 < 계약가 → 정상 GP → × 완공% (발생원가 ÷ 총원가)\n④ 프로젝트별 결과 마지막에 합산\n\nLoss contract 핵심:\n손실은 확정 즉시 전액 인식 — 방식(over time/point in time) 무관\n완공% 60%여도 Loss 전액($20,000) 인식, 60%만 인식 금지",
    trigger: "'두 프로젝트 표' + 'over time' → 프로젝트별 분리 계산 모드 '총원가 > 계약가' → Loss contract → 즉시 전액 인식 'billed to customers' / 'received from customers' → 즉시 무시 (GP 계산 무관) 'commenced during Year X' → 전기 인식분 = $0 → 당기 = 누적 전체",
    trap: "두 프로젝트 합산 후 완공% 계산 → 손실 프로젝트가 이익에 묻힘, 개별 계산 필수 Loss contract에 완공% 적용 → 보수주의 위반, 손실은 즉시 전액 Billed/Received 사용 → GP 계산과 무관, 함정 데이터 당기 착공 프로젝트에 전기 인식분 차감 → Year X 착공이면 전기분 = $0",
    one_sentence: "복수 프로젝트 → 개별 계산 후 합산 / Loss contract → 완공% 무관 즉시 전액 (보수주의)",
    example: "Project 1: 총원가 $360K / GP $60K / 완공% 240/360=2/3 → $40,000 Project 2: 총원가 $320K > 계약가 $300K → Loss ($20,000) 즉시 전액 합산: $40,000 − $20,000 = $20,000",
    speed: "① 각 프로젝트 총원가(발생+잔여) vs 계약가 ② 손실 → 즉시 전액 / 이익 → ×완공% ③ Billed·Received 무시 ④ 합산",
    context_background: "[Loss contract 즉시 인식 이유]\n보수주의(conservatism): 나쁜 소식은 확정되는 즉시 인식, 미루지 않음.\n이익은 아직 안 번 것 → 완공된 만큼만 인식(% of completion).\n손실은 이미 확정된 것 → 완공% 무관, 전액 즉시 인식.\n\n[복수 프로젝트 함정 구조]\n이 문제의 함정이 두 겹:\n① 두 프로젝트 데이터가 한꺼번에 쏟아져 압도당함\n② Loss contract가 처음 등장해 완공% 적용 충동\n\n대응: 표 보이면 프로젝트별로 분리 → 각자 독립적으로 계산 → 마지막에 합산.\n\n[Billed/Received 무시 원칙]\n건설계약 GP 계산에 billings·현금수취는 절대 사용 안 함.\n이 두 항목은 B/S Contract Asset/Liability 계산에만 사용.\n문제에 나오면 즉시 무시하고 원가·계약가만 사용.",
  },

  // [REV_015] Long-term Construction Contract — Point in Time vs Progress Billings
  // RULE    : Point-in-time = 완성 시점만 / Progress billings 수금·원가초과 → 수익 인식 기준 아님
  // TRIGGER : "point in time" + "construction" → progress billings 무관
  // TRAP    : billings 수금 = 수익(현금주의 혼동) / billings > costs = 수익(원가초과 혼동)
  {
    topic_id: "REV_015",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_REV',
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "Construction Contract Point-in-Time — Does progress billing collection trigger revenue?",
    rule: "Point-in-time 방식: 공사 완성(completion) 시점에만 수익 인식. Progress billings 수금 여부 → 수익 인식 트리거 아님. Progress billings > recorded costs → 수익 인식 트리거 아님. Progress billings = 현금 흐름 관리 도구.",
    trigger: '"recognizes revenue at a point in time" + "construction contract" → 완성 시점만\n"progress billings collected" → No\n"progress billings exceed recorded costs" → No\n"over time" + "costs incurred to date" → point-in-time과 별개 방식',
    trap: "Progress billings 수금 = 수익 인식 착각 → 현금주의 혼동.\nBillings > Costs = 수익 인식 착각 → 원가 초과는 기준 아님.\nOver-time 진행률 계산을 point-in-time에 적용하는 오류.",
    one_sentence: "Point-in-time 건설계약 = 완성 시점만. Progress billings 수금·원가초과 모두 수익 인식 트리거 아님 → No / No.",
    speed: "Point-in-time = 완성 시점만 | Progress billings 수금·원가초과 → 수익 인식 아님 → 둘 다 No → B",
    context_background: "[Point-in-time vs Over-time 비교]\nOver-time(진행기준): 진행률(costs incurred ÷ total estimated costs 또는 engineering estimates)에 따라 매 기간 수익 인식.\nPoint-in-time(완성기준): 공사 완전히 완료된 시점에 한꺼번에 수익 인식.\n\n[Progress Billings의 역할]\nProgress billings = 공사 진행 중 발주처에게 청구하는 금액. 현금 흐름 관리 도구. 수익 인식 시점과 완전히 별개.\n- 청구 → 수익 아님\n- 수금 → 수익 아님\n- 원가 초과 → 수익 아님\n\n[두 방식 모두에서 progress billings는 수익 인식 기준이 아님]\nOver-time: 진행률 기준으로 인식 (billings 아님)\nPoint-in-time: 완성 시점 기준으로 인식 (billings 아님)",
  },

  // ── Migration 031 ──────────────────────────────────────────────────────────
  {
    topic_id: "INV_004",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Dollar Value LIFO — layer calculation step by step",
    rule: "Step 1: Convert ending inventory at current-year cost to base-year cost (÷ current price index). Step 2: Compare to prior base-year balance to find the real quantity change. Step 3: If increased → new layer at current-year cost (× current index). If decreased → peel off most recent layers first (LIFO order). Step 4: Sum all surviving layers at their original layer cost = DV LIFO ending inventory.",
    trigger: "dollar value LIFO | DV LIFO | price index | base year | layer | LIFO layer | inventory pool",
    trap: "Never convert layers using the current index — each layer stays at the index of the year it was created. Peeling off layers goes newest-first (LIFO). A decrease in base-year dollars means quantity dropped, not price.",
    one_sentence: "DV LIFO = stack layers in base-year dollars; each layer locked at its own year's index; peel newest first on decrease.",
    example: "Base year inventory $100,000 (index 1.00) = Base Layer $100,000\nYear 1: EI at cost $126,000 ÷ index 1.05 = $120,000 base → increase $20,000 → Year 1 layer = $20,000 × 1.05 = $21,000\nYear 2: EI at cost $110,400 ÷ index 1.15 = $96,000 base → decrease $24,000 → peel Year 1 layer fully ($20,000) + $4,000 from Base\nDV LIFO EI = Base $96,000 × 1.00 = $96,000\n\nLayer stack (Base 하단 고정, 신규 레이어 위로 적층, 감소 시 위부터 제거):\n[Year 1 layer $21,000] ← 감소 시 먼저 제거\n[Base layer $100,000] ← 항상 하단 고정",
  },

  // ── INVEST ─────────────────────────────────────────────────────────────────
  {
    topic_id: "INVEST_001",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Trading securities — where does unrealized gain/loss go",
    rule: "Trading securities (FVTNI): mark to fair value each period; unrealized gains and losses go to Net Income, not OCI.",
    trigger: "trading securities | FVTNI | unrealized gain | mark to market | fair value through income",
    trap: "Stock dividends on trading securities → No journal entry (memo only).",
    one_sentence: "Unrealized gains/losses on trading securities flow through net income each period.",
    example: "Trading security cost $80,000 / FV year-end $90,000 → Dr. Investment $10,000, Cr. Unrealized Gain (NI) $10,000",
  },
  {
    topic_id: "INVEST_002",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'concept',
    card_name: "Equity method — how carrying value moves",
    rule: "Equity method: +% of investee net income; −% of dividends received; −amortization of excess fair value. Fair value changes → no entry.",
    trigger: "equity method | significant influence | 20% | carrying value | equity income",
    trap: "Do not mark equity method investments to fair value — only adjust for income, dividends, and amortization.",
    one_sentence: "Equity method CV = cost + share of income − share of dividends − excess FV amortization.",
    example: "30% interest; investee NI $100,000 → +$30,000; dividends $20,000 → −$6,000 to carrying value",
  },
  {
    topic_id: "INVEST_003",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Available-for-sale — where does unrealized gain/loss go",
    rule: "AFS securities: mark to fair value each period; unrealized gains/losses go to OCI, not Net Income. Realized gains/losses go to Net Income when sold.",
    trigger: "available-for-sale | AFS | OCI | unrealized | other comprehensive income",
    trap: "Unrealized → OCI; realized (upon sale) → Net Income.",
    one_sentence: "AFS unrealized gains/losses bypass net income and go directly to OCI.",
    example: "AFS bond cost $100,000 / FV $110,000 → Dr. Investment $10,000, Cr. Unrealized Gain (OCI) $10,000",
  },
  {
    topic_id: "INVEST_004",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Available-for-sale — how much credit loss to recognize",
    rule: "AFS Credit Loss = MIN of: (1) Amortized Cost − PV of expected cash flows; (2) Amortized Cost − Fair Value. If Fair Value > Amortized Cost → credit loss = $0.",
    trigger: "AFS | credit loss | expected cash flows | fair value | allowance for credit loss",
    trap: "If fair value has recovered above amortized cost, credit loss = $0 regardless of other indicators.",
    one_sentence: "AFS credit loss = smaller of the PV shortfall or the fair value decline.",
    example: "Amortized cost $100,000 / PV expected CFs $85,000 / FV $90,000 → MIN($15,000, $10,000) = $10,000",
    context_background: "[AFS Credit Loss — CECL 도입 배경]\nCECL(ASC 326) 도입 전: AFS 미실현손익 → OCI만 기록.\nCECL 도입 후: 신용 손상 발생 시 → credit loss 별도 인식 필요.\n\n[AFS Credit Loss 구조]\nFV > AC → Credit loss = $0 (FV가 보호막)\nFV < AC → Credit loss = MIN(AC−PV, AC−FV)\n\n[왜 MIN인가]\nAC−PV = 신용 손실 최대치 (실제 회수 예상 기준)\nAC−FV = 시장이 인정한 총 손실 (신용 + 금리 변동 포함)\nAFS = 시장에서 언제든 팔 수 있음 → FV가 손실 상한선\n→ 신용 손실이 시장 하락분보다 크면 과대계상 → MIN으로 방어\n\n[HTM과 비교]\nHTM = 팔 생각 없음 → FV 보호막 없음 → Credit loss = AC−PV 전액\nAFS = 팔 수 있음 → FV 하한선 → Credit loss = MIN(AC−PV, AC−FV)\n\n[PPE Recoverability test와 동일 논리]\nPPE: Undiscounted CF > BV → 손상 없음 (보호막)\nAFS: FV > AC → Credit loss $0 (보호막)\n보호막 넘으면 → 다음 단계 계산\n\n[Par 취득]\nPar 취득 = 할인/프리미엄 없음 = 상각 없음 → AC = 취득원가 고정",
  },
  {
    topic_id: "INVEST_005",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "Held-to-maturity — does fair value change matter",
    rule: "HTM securities are carried at amortized cost. Changes in fair value are ignored entirely.",
    trigger: "held-to-maturity | HTM | fair value | amortized cost | no adjustment",
    trap: "Fair value may fluctuate widely but HTM is never adjusted to fair value.",
    one_sentence: "HTM securities ignore fair value — always report at amortized cost.",
    example: "HTM bond amortized cost $95,000 / FV rises to $102,000 → carry at $95,000 (no adjustment)",
  },
  {
    topic_id: "INVEST_006",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Held-to-maturity — credit loss calculation",
    rule: "HTM Credit Loss = Amortized Cost − PV of expected cash flows. Unlike AFS, the fair value floor does not apply — full PV shortfall goes to credit loss.",
    trigger: "HTM | held-to-maturity | credit loss | expected cash flows | full amount",
    trap: "For HTM, do NOT cap credit loss at the fair value decline — use the full PV shortfall.",
    one_sentence: "HTM credit loss = amortized cost minus PV of expected cash flows, with no fair value cap.",
    example: "Amortized cost $100,000 / PV expected CFs $82,000 / FV $88,000 → Credit Loss = $18,000 (not $12,000)",
  },

  // [INVEST_008] Bond Investment — Gain on Sale (Discount Purchase + Partial Amortization)
  // RULE    : Gain = Premium + Unamortized discount | "discount of $X" = 할인액 / Amortization → BV 증가
  // TRIGGER : "purchased at discount of $X" + "sold at premium of $Y" + "amortization $Z" → Gain = Y + (X−Z)
  // TRAP    : discount를 취득가로 해석 / amortization이 BV 감소 / amortization 무시
  {
    topic_id: "INVEST_008",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Bond investment gain on sale — discount purchase + partial amortization",
    rule: "Gain on sale 계산:\nGain = 매각가 − BV (매각 시점)\n\n[BV 계산]\nBV = 취득원가 + 누적 상각액\n   = (face − discount) + amortized\n\n[매각가]\n= face + premium (프리미엄 매각 시)\n= face − discount (할인 매각 시)\n\n[단축 공식]\nGain = Premium + Unamortized discount\n     = Premium + (Original discount − Amortized)\n\n[핵심 언어 해석]\n'purchased at a discount of $X' = 할인액 $X (취득가 아님!)\n→ 취득가 = face − $X\n'sold at a premium of $Y' = 프리미엄 $Y\n→ 매각가 = face + $Y\n\n[상각 방향]\nDiscount 상각 → BV 증가 (face 방향)\n→ BV 올라갈수록 gain 감소",
    trigger: '"purchased at a discount of $X" → 할인액 $X / 취득가 = face − $X\n"sold at a premium of $Y" → 매각가 = face + $Y\n"amortization of discount $Z" → BV +$Z 증가\nGain = (face+premium) − (face−discount+amortized) → face 상쇄',
    trap: "'discount of $X'를 취득가로 해석: 할인액이 $X, BV = face − $X\nAmortization이 BV 감소: Discount 상각 → BV 증가 (반대 방향)\n상각액을 premium에서만 차감: discount 자체 무시하는 오류\nAmortization 무시: BV 올라간 것 미반영 → gain 과대계상",
    one_sentence: "Gain = Premium + Unamortized discount | 'discount of $X' = 할인액 (취득가 아님).",
    speed: "Gain = Premium + (Discount − Amortized) | face 상쇄 → 세 숫자만",
    example: "Discount $20K / Premium $28K / Amortized $4K:\nGain = $28K + ($20K−$4K) = $28K + $16K = $44K\n\nBV확인: face−$20K+$4K = face−$16K\n매각가: face+$28K\nGain: $28K+$16K = $44K ✓",
    context_background: "[할인 채권 투자 BV 변동 원리]\n할인 취득 = face보다 싸게 삼\n→ 만기까지 보유하면 face 전액 회수\n→ 그 차액(discount)을 보유 기간에 걸쳐 이자수익으로 인식 (amortization)\n→ 상각할수록 BV가 face 방향으로 올라감\n\n[매각 시 gain 구조]\n프리미엄으로 팔면: face보다 비싸게 팔았으니 premium만큼 이익\n아직 상각 안 된 discount만큼도 추가 이익 (싸게 산 것의 잔여 효과)\n→ Gain = Premium + Unamortized discount\n\n[상각이 Gain에 미치는 영향]\n상각 많이 할수록 BV 증가 → Unamortized discount 감소 → Gain 감소\n직관: 이미 이자수익으로 인식한 만큼은 처분이익에서 제외",
  },

  // [INVEST_007] Trading Security Bond — Interest Income with Discount Amortization (SL)
  // RULE    : 이자수익 = Face × Coupon% + Discount SL 상각. FV 변동 → 별도 NI. Trading/AFS/HTM 계산 동일.
  // TRIGGER : "trading" + "discount" + "straight-line" → 이자수익 = Coupon + 상각 / FV 정보 → 별도 항목
  // TRAP    : Coupon만 계산(Discount 상각 누락) / 취득원가 × Coupon% / FV 변동을 이자수익에 포함
  {
    topic_id: "INVEST_007",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_INVEST',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Trading Security Bond — Interest Income with Discount Amortization",
    rule: "이자수익 = Face × Coupon rate + Discount 상각(SL)\n\nDiscount 상각(SL) = (Face − 취득원가) ÷ 만기\n\n[FV 변동과 이자수익은 별개]\nTrading → FV 변동 → Unrealized G/L → NI (별도)\n이자수익 계산 방식은 Trading/AFS/HTM 동일\n\n[Discount 상각의 의미]\n$92,000에 사서 만기에 $100,000 회수\n→ $8,000 추가 수익을 10년에 걸쳐 $800씩 이자수익으로 인식\n→ 매년 BV $800씩 증가 → 만기에 BV = $100,000",
    trigger: '"trading security" + "discount" + "straight-line" → 이자수익 = Coupon + SL 상각\n"purchased at $X" + "face $Y" → Discount = Y − X\nFV 정보 제시 → 이자수익과 무관, 별도 처리',
    trap: "Coupon만 이자수익으로 계산 → Discount 상각 누락\n취득원가 × Coupon rate → 면가 기준으로 계산해야 함\nFV 변동을 이자수익에 포함 → 별도 항목\nTrading이라 이자수익 계산 다르다고 착각 → 동일",
    one_sentence: "이자수익 = Coupon + Discount SL 상각; FV 변동은 별도 NI; Trading/AFS/HTM 계산 방식 동일.",
    example: "취득원가 $92,000 / Face $100,000 / Coupon 5% / 10년\nDiscount $8,000 ÷ 10 = $800\n이자수익 = $5,000 + $800 = $5,800\nFV $98,000 → Unrealized gain $6,000 별도 NI",
    speed: "① Discount = Face − 취득원가 ÷ 만기 = SL 상각\n② 이자수익 = Face × Coupon% + SL 상각\n③ FV 변동 → 무시 (별도 항목)",
    context_background: "[투자자 입장 Bond Discount 구조]\n발행자: BV(부채) $92,000 → $100,000 수렴 / 매년 이자비용 $5,800\n투자자: BV(자산) $92,000 → $100,000 수렴 / 매년 이자수익 $5,800\n방향만 반대, 구조 동일.\n\n[10년 총 현금흐름]\n이자 수령: $5,000 × 10 = $50,000\n원금 회수: $100,000\n총 수령: $150,000\n취득원가: $92,000\n총 이익: $58,000 = $5,800 × 10년\n\n[BV 변화]\n매년 Discount $800 상각 → BV $800 증가\nYear 1: $92,800 / Year 2: $93,600 ... Year 10: $100,000\n만기에 BV = Face → 원금 회수 시 G/L 없음",
  },

  // ── VAL ────────────────────────────────────────────────────────────────────
  {
    topic_id: "VAL_001",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Cash and receivables — measurement basis",
    rule: "Cash at face value. Accounts receivable at net realizable value (NRV) = gross AR − allowance for doubtful accounts.",
    trigger: "cash | accounts receivable | NRV | allowance | net realizable value",
    trap: "Receivables are NRV, not face value — always deduct the allowance.",
    one_sentence: "Cash = face value; AR = gross balance minus the allowance for bad debts.",
    example: "AR $50,000 / Allowance $3,000 → NRV $47,000 on the Balance Sheet",
  },
  {
    topic_id: "VAL_002",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Inventory — measurement basis",
    rule: "Inventory at lower of cost or net realizable value (LCNRV). FIFO/Average: NRV = selling price − costs to complete/sell. LIFO: compare to replacement cost.",
    trigger: "inventory | lower of cost | NRV | LCNRV | write-down",
    trap: "LIFO uses replacement cost, not NRV, as the ceiling under US GAAP.",
    one_sentence: "Inventory is written down if cost exceeds NRV (or replacement cost under LIFO).",
    example: "FIFO inventory cost $100 / NRV $90 → report at $90; recognize $10 write-down",
  },
  {
    topic_id: "VAL_003",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "PP&E — measurement basis",
    rule: "PP&E at historical cost minus accumulated depreciation (book value). No upward revaluation under US GAAP. Impairment can reduce below book value.",
    trigger: "PP&E | property plant equipment | book value | carrying value | historical cost",
    trap: "US GAAP prohibits upward revaluation; IFRS permits it.",
    one_sentence: "PP&E = historical cost minus accumulated depreciation; no write-ups under US GAAP.",
    example: "Machine cost $200,000 / Accum. Depr. $50,000 → Book value $150,000",
  },
  {
    topic_id: "VAL_004",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Intangibles — measurement basis",
    rule: "Finite-life intangibles: cost minus accumulated amortization (residual value = zero). Indefinite-life: cost, no amortization, test for impairment annually.",
    trigger: "intangible | patent | trademark | amortization | indefinite life | finite life",
    trap: "Residual value of intangibles is assumed zero unless specific evidence supports otherwise.",
    one_sentence: "Finite-life intangibles = cost minus amortization (zero residual); indefinite-life = cost with annual impairment test.",
    example: "Patent cost $60,000 / 10-year life → amortize $6,000/yr; end of year 3 = $42,000 book value",
  },
  {
    topic_id: "VAL_005",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'calculation',
    card_name: "Bonds — measurement basis",
    rule: "Bonds recorded at PV of all future cash flows discounted at market rate at issuance. Carried at amortized cost using the effective interest method over the life of the bond.",
    trigger: "bond | discount | premium | amortized cost | carrying value | bond payable",
    trap: "After issuance, the carrying value changes with each period's amortization — not held at face value.",
    one_sentence: "Bond carrying value = PV at issuance, adjusted each period by effective interest amortization.",
    example: "Bond face $100,000 / issued at $95,000 → CV increases each period, reaches $100,000 at maturity",
  },
  {
    topic_id: "VAL_006",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Fair value hierarchy — how to determine the level",
    rule: "Level 1: quoted prices in active markets for identical assets/liabilities. Level 2: other observable inputs. Level 3: unobservable inputs (internal models, estimates).",
    trigger: "fair value | level 1 | level 2 | level 3 | hierarchy | observable | unobservable\n'discount rate / growth rate / assumed rate' → 자체 가정 → Level 3\n'identical asset + active market' → Level 1\n'similar asset + active market' or 'identical asset + inactive market' → Level 2",
    trap: "Level 1 requires all three: quoted + active market + identical (not similar) assets.\n비활성시장(rarely trades) 동일 자산 → Level 1처럼 보이지만 → Level 2\n유사 자산(similar) 활성시장 → Level 1처럼 보이지만 → Level 2\n할인율/성장률 등 자체 가정 → 복잡해 보여도 → Level 3",
    speed: "자체 가정(할인율/성장률/내부추정) → Level 3\n동일자산 + 활성시장 → Level 1\n나머지(유사자산 or 비활성시장) → Level 2",
    one_sentence: "Match the input to its observability: active market quote = L1, other observable = L2, internal = L3.",
    example: "NYSE listed stock price → L1; broker quote for thinly traded bond → L2; management DCF model → L3",
  },
  {
    topic_id: "VAL_007",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Internal estimates — which level does that put you in",
    rule: "Any valuation using unobservable inputs (company's own assumptions, internal DCF models) automatically classifies as Level 3.",
    trigger: "internal | own assumptions | unobservable | DCF model | management estimate",
    trap: "A sophisticated internal model is still Level 3 — complexity does not raise the level.",
    one_sentence: "Internal / unobservable inputs → always Level 3, no exceptions.",
    example: "Management DCF using internal growth projections → Level 3 (not Level 2 even if the math is complex)",
  },

  // ── TAX ────────────────────────────────────────────────────────────────────
  {
    topic_id: "TAX_001",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'calculation',
    card_name: "Deferred tax — which tax rate to use",
    rule: "Use the enacted tax rate for the period the deferred tax will reverse, not the current period rate.",
    trigger: "deferred tax | enacted rate | tax rate change | DTA | DTL",
    trap: "① 신 세율이 enacted됐어도 확정 전 연도 JE는 구 세율 사용. ② 세율 변경 연도에 기존 누적 Temporary difference 전체를 재측정 — 신규 거래 없어도 증분 세율 × 누적 잔액만큼 DTA/DTL 조정 JE 필요. ③ Book > Tax 감가(SL on tax, Accelerated on book) → DTA 발생 — 반직관 주의: Book 비용 커서 Book NI 낮음 → Tax NI 높음 → 세금 지금 더 냄 → DTA.",
    one_sentence: "Deferred taxes always use the enacted future rate, never the current period rate.",
    example: "Temporary difference $100,000 / enacted rate 25% → DTL = $25,000 (even if current rate is 30%)",
    context_background: "[왜 FS vs Tax 감가상각이 다른가]\nIRS가 기업 투자 장려 위해 가속상각 허용. 기업: 초기 세금 덜 냄 → 현금 보유 → 투자 재원. 정부: 설비 투자 유도 + 경기 부양.\nFS(SL): 매년 균등 상각 / Tax(가속): 초기 많이 → 후기 적게\n\n[DTL 발생 원리]\n초기: Tax 감가상각 > FS → 과세소득 < 회계소득 → 세금 덜 냄 → DTL 설정(나중에 더 낼 세금)\n후기: Tax 감가상각 < FS → 과세소득 > 회계소득 → 세금 많이 냄 → DTL 역전·제거\n\n[DTL/DTA = 무조건 Non-current]\nASC 740 2016년 개정 → DTA/DTL 전부 Non-current 단일 표시.\n이유: 역전 시점 예측 어렵고 대부분 장기 항목. Current 분류는 구 기준.\n\n[세율 결정 원칙]\nDTL/DTA 세율 = 임시차이가 역전되는 연도의 enacted 세율.\nYear 9 말 기준: 임시차이 $1,000 → Year 10 역전 → Year 10 세율 30% 사용.\nYear 11+ enacted 35% 무관 — 자산 Year 10 완전 상각 → 넘어갈 임시차이 없음.\n\n[DTL 제거 JE — Year 10]\nDTL은 부채이므로:\n  설정 시(Year 1~9): Dr. Income Tax Expense / Cr. DTL (부채 증가 = Credit)\n  제거 시(Year 10):  Dr. DTL / Cr. Income Tax Expense (부채 감소 = Debit)\n\nYear 10에 자산 완전 상각 → FS basis = Tax basis = $0 → 임시차이 소멸 → DTL 소멸.\n전체 흐름:\n  Year 1~9: Cr. DTL (쌓임) → DTL 잔액 $300\n  Year 10:  Dr. DTL (제거) → DTL 잔액 $0\n\n[함정 패턴]\n① 미래 enacted rate(35%) 사용 → 역전 연도(Year 10) 세율 기준\n② DTL 제거를 Credit 처리 → 부채 감소 = Debit\n\n[세율 변경 시 재측정 JE]\n세율 30%→35% 확정 연도: 신규 거래 없어도 기존 누적 Temporary difference 재측정 필요.\n재측정 공식: 증분 세율(5%) × 누적 Temporary difference 잔액 = 추가 DTA/DTL\n예) DTL base $17,000 × 5% = $850 추가 DTL → Cr. DTL $850\n    DTA base $75,000 × 5% = $3,750 추가 DTA → Dr. DTA $3,750\nTax Expense는 항상 플러그(균형 맞추기).\n실무 예: 2017년 미국 TCJA (35%→21%) → 모든 상장사 DTL 즉시 재측정.\n\n[Depreciation — DTA vs DTL 방향 반직관]\nTax > Book 감가(일반적): Tax 비용 먼저 → Tax NI 낮음 → 세금 지금 덜 냄 → DTL\nBook > Tax 감가(비정상): Book 비용 먼저 → Book NI 낮음 → Tax NI 높음 → 세금 지금 더 냄 → DTA\n핵심: Tax SL < Book Accelerated → DTA (DTL 아님)",
  },
  {
    topic_id: "TAX_002",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'conditional',
    card_name: "Permanent vs temporary difference",
    rule: "Temporary differences reverse over time → create DTA or DTL. Permanent differences never reverse → no deferred tax. Permanent 3대 패턴: (1) Tax-exempt interest (municipal bond) (2) Life insurance premium where corp is beneficiary (3) Dividends received — only the DRD portion is permanent (not the full amount). DRD rates: ownership <20% → 50%, 20~79% → 65%, ≥80% → 100%.",
    trigger: "permanent difference | temporary difference | tax-exempt | DRD | life insurance | NOL",
    trap: "① Dividend income 전액을 Permanent difference로 처리 금지 — 지분율 확인 후 DRD% 적용, 공제 부분만 Permanent. 예) 지분율 5%, 배당 $700 → $700×50%=$350만 Permanent. ② Permanent difference → D열(Change in Deferred Amounts) 반드시 $0 직접 입력 (빈칸 제출 오답). ③ Current 분류 선택지는 nonsense distractor — DTA/DTL 전부 non-current.",
    one_sentence: "Temporary → deferred tax; permanent → no deferred tax.",
    example: "지분율 5%, 배당 $700 → DRD 50% → Permanent $350 (나머지 $350은 과세). Municipal bond interest $250 → Permanent $250 전액. Life insurance premium $750 (법인 수혜자) → Permanent $750 전액. CSV 증가분 있으면 → Premium - CSV증가분 = Permanent difference.",
  },
  {
    topic_id: "TAX_003",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'conditional',
    card_name: "Net operating loss — how to carry forward",
    rule: "NOL is a temporary difference. Record DTA = NOL × enacted rate. Add a valuation allowance if more likely than not that the DTA will not be realized.",
    trigger: "net operating loss | NOL | carryforward | deferred tax asset | tax loss",
    trap: "NOL is a temporary, not permanent, difference — it always creates a DTA.",
    one_sentence: "NOL carryforward creates a DTA; add a valuation allowance if realization is doubtful.",
    example: "NOL $200,000 / enacted rate 25% → DTA $50,000; if realization uncertain → VA reduces net DTA",
  },
  {
    topic_id: "TAX_004",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'concept',
    card_name: "Valuation allowance — effect on deferred tax asset",
    rule: "Valuation allowance reduces DTA when more likely than not that some portion will not be realized. Decreasing VA → DTA increases → Tax Expense decreases → Net Income increases.",
    trigger: "valuation allowance | VA | more likely than not | deferred tax asset | release",
    trap: "A decrease in VA improves net income — remember the direction of the chain.",
    one_sentence: "Reducing the valuation allowance releases a tax benefit that increases net income.",
    example: "VA decreases $10,000 → DTA +$10,000 → Tax Expense −$10,000 → Net Income +$10,000",
  },
  {
    topic_id: "TAX_005",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'calculation',
    card_name: "Deferred tax balance shift — reverse-engineer the temporary difference",
    rule: "DTA/DTL = B/S 누적잔액(stock). 역산 공식: 순변동액 ÷ 세율 = Temporary difference. DTL→DTA 전환 시 순변동 = DTL잔액 + DTA잔액. DTA 방향 증가 원인 = taxable income > financial income (세금 먼저 납부). DTL 방향 증가 원인 = financial income > taxable income (세금 나중 납부).",
    trigger: "deferred tax liability | deferred tax asset | tax rate | temporary difference | which caused the change | DTL to DTA",
    trap: "A(Bad debt $16K): DTA 방향 맞지만 $16K×40%=$6,400≠$8,000 → 금액 불일치. C(Extra tax depreciation): 세금상 추가 감가상각 → DTL 방향(반대). D(Installment sales): DTL 방향 + 금액 불일치. 변동액 계산 시 DTL→DTA는 두 잔액을 합산(부호 반전).",
    one_sentence: "DTL→DTA 순변동 ÷ 세율 = Temporary difference; DTA 방향 = 세금 먼저 낸 항목.",
    example: "DTL $2K → DTA $6K = $8K 순변동 / $8K÷40% = $20K / Prepaid rent $20K×40% = $8K ✓",
    speed: "① 순변동: DTL$2K+DTA$6K = $8K DTA방향 ② $8K÷40% = $20K ③ DTA원인 = taxable>financial → Prepaid rent $20K ✓ → 정답 B",
  },

  // [TAX_006] Deferred Tax Liability — Enacted Future Tax Rate
  // RULE    : DTL = Temporary Difference × Enacted Future Tax Rate / 당기 세율 사용 금지
  // TRIGGER : "enacted rate for future years" → DTL에 미래 세율 적용
  // TRAP    : 당기 세율 적용 오답($37,500 함정) / 매출가 전액에 세율 적용 오답 / $0 오답 — 영구적 차이 아님
  // EXAMPLE : Gain $150,000, 미래 enacted rate 21% → DTL = $150,000 × 21% = $31,500
  {
    topic_id: "TAX_006",
    category: "Income Taxes",
    topic_name: "Deferred Tax Liability — Enacted Future Tax Rate",
    summary: "DTL 계산 시 당기 세율이 아닌 차이가 해소되는 미래 연도의 enacted rate 적용",
    rule: "DTL = Temporary Difference × Enacted Future Tax Rate. 당기 세율 사용 금지. Gain = Sales price - Cost.",
    trigger: '"enacted rate for future years" → DTL에 미래 세율 적용. "gain not reported as taxable income" + "replacement period" → 세무상 이연 → DTL.',
    trap: "당기 세율 적용 오답($37,500 함정). 매출가 전액에 세율 적용 오답. $0 처리 오답 — 영구적 차이 아님.",
    example: "Gain $150,000, 미래 enacted rate 21% → DTL = $150,000 × 21% = $31,500",
    speed: "DTL 계산 → temporary difference × enacted future rate (당기 세율 절대 금지)",
    context_background: "[DTA vs DTL 핵심 — Cash basis로 생각]\n세금을 미리 내면 → DTA(자산: 나중에 돌려받을 권리)\n세금을 나중에 내면 → DTL(부채: 나중에 갚아야 할 의무)\n\nExpense/Income, Taxable/Deductible은 전부 이 한 줄의 포장지.\n\n케이스별 적용:\nWarranty expense: 회계 먼저, 세무 나중 → 나중에 세금 덜 냄 → DTA\nDepreciation: 세무 먼저, 회계 나중 → 나중에 세금 더 냄 → DTL\nUnearned revenue: 세무 먼저, 회계 나중 → 나중에 세금 덜 냄 → DTA\nInstallment sales: 회계 먼저, 세무 나중 → 나중에 세금 더 냄 → DTL",
  },

  // [TAX_011] Intraperiod Tax Allocation — Net of Tax 표시 대상 vs 비대상
  // RULE    : Operating income만 before tax / 나머지 특별항목 전부 net of tax
  // TRIGGER : "NOT subject to intraperiod tax allocation" = before tax 표시 항목
  // TRAP    : Operating income을 net of tax로 착각 / discontinued를 비대상으로 착각
  {
    topic_id: "TAX_011",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'concept',
    card_name: "Intraperiod tax allocation — net of tax vs before tax display",
    rule: "Intraperiod tax allocation = 세금을 항목별로 쪼개서 각각 net of tax로 표시하는 방법론\nNet of tax = 그 배분을 적용한 결과물 (세후 표시)\n\n대상 항목 (net of tax 표시):\n① Income from continuing operations ✓\n② Discontinued operations ✓\n③ Accounting principle change (retrospective) ✓\n④ OCI 항목 ✓\n\n비대상 항목 (before tax 세전 표시):\n✗ Operating income — 일반 영업 흐름, 세금 별도 라인 차감\n\n문제 재해석:\n'NOT subject to intraperiod tax allocation'\n= net of tax 표시 안 하는 것\n= before tax 그대로 표시하는 것\n= Operating income",
    trigger: "'NOT subject to intraperiod tax allocation' → before tax 표시 항목 찾기 → Operating income 'subject to intraperiod tax allocation' → net of tax 표시 항목 → discontinued / continuing ops / accounting change / OCI 'net of tax' 표시 → intraperiod tax allocation 적용된 결과",
    trap: "Operating income을 net of tax로 착각 → 세금은 별도 라인, Operating income은 세전 표시 Discontinued operations를 비대상으로 착각 → 반드시 net of tax 표시 대상 Intraperiod = 기간 간(interperiod)과 혼동 → intra = 기간 내 항목별 배분",
    one_sentence: "Operating income만 before tax / 나머지 특별항목(discontinued·continuing ops·회계변경·OCI) 전부 net of tax.",
    speed: "NOT subject → before tax → Operating income / subject → net of tax → 나머지 전부",
    context_background: "[Intraperiod vs Interperiod 구분]\nIntraperiod tax allocation: 같은 기간 안에서 세금을 항목별로 배분\n→ I/S 각 항목을 net of tax로 표시\nInterperiod tax allocation: 기간 간 세금 차이 처리\n→ Deferred tax (DTA/DTL) 개념\n\n[Operating income이 제외되는 이유]\nOperating income은 일반 영업활동의 흐름.\n세금은 그 아래 별도 라인(Income tax expense)에서 한꺼번에 차감.\n특별·비경상 항목만 개별적으로 net of tax 표시 — 투자자가 실질 영향 파악 가능하도록.\n\n[Net of tax 표시 예시]\nDiscontinued operations loss    ($100,000)\nTax benefit (30%)                  30,000\n─────────────────────────────────────────\nNet of tax                        ($70,000) ← I/S 표시 금액\n\n[문제 풀이 재해석]\n'NOT subject to intraperiod tax allocation'\n= net of tax 표시 안 하는 것\n= before tax 그대로 표시하는 것\n= Operating income → 정답 A",
  },

  // [TAX_007] Deferred Tax Liability — F/S basis > Tax basis (Depreciation Difference)
  // RULE    : ① F/S basis > Tax basis → 현재 세금 덜 냄 → 미래에 더 냄 → DTL ② DTL = temporary difference × enacted FUTURE tax rate ③ DTA = Tax basis > F/S basis
  // TRIGGER : "F/S basis exceeded tax basis" → DTL | "will reverse in future years" → deferred tax 인식 | "enacted rate for future years = X%" → 이 세율로 계산
  // TRAP    : 현재 세율(30%) 사용 → $250,000 × 30% = $75,000 오답 | F/S > Tax basis 반대 해석 → DTA 오분류
  // EXAMPLE : $250,000 × 21%(future enacted rate) = $52,500 DTL
  {
    topic_id: "TAX_007",
    category: "Income Taxes",
    topic_name: "Deferred Tax Liability — Enacted Future Tax Rate (Depreciation)",
    rule: "① F/S basis > Tax basis → 현재 세금 덜 냄 → 미래에 더 냄 → DTL ② DTL 계산 = temporary difference × enacted FUTURE tax rate ③ DTA = Tax basis > F/S basis (반대 방향)",
    trigger: '"financial reporting basis exceeded tax basis" → Tax dep > Book dep → DTL | "this difference will reverse in future years" → temporary difference → deferred tax 인식 | "enacted tax rate for future years = X%" → 이 세율로 DTL 계산, 현재 세율 무시',
    trap: "현재 세율(Year 1 rate) 사용 → $250,000 × 30% = $75,000 오답 | F/S > Tax basis를 반대로 해석 → DTA로 잘못 분류",
    context_background: "Deferred Tax는 일시적 차이(temporary difference)가 미래에 세금에 영향을 줄 때 인식한다. F/S basis > Tax basis → Tax depreciation이 더 큼 → 현재 세금을 덜 냄 → 미래에 더 낼 것 → DTL(Deferred Tax Liability). DTL 금액 계산 시 현재 세율이 아닌 차이가 reverse될 미래 시점의 enacted tax rate를 사용한다. 'sole depreciable asset' + 'no other temporary differences'는 계산 단순화 + 오답 방어용 조건.",
    speed: "F/S basis > Tax basis → DTL | $250,000 × 21%(future enacted rate) = $52,500 Liability",
  },

  // [TAX_008] Current Portion of Income Tax Expense — Taxable Income × Enacted Rate
  // RULE    : Current = Taxable income × 당기 enacted rate / Pretax financial income 사용 금지
  // TRIGGER : "current portion" → taxable income × 당기 세율 / 세율 두 개 → 당기 세율만
  // TRAP    : Pretax income 사용($31,500) / Year 1 세율 적용 / deferred 합산($27,550)
  {
    topic_id: "TAX_008",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'calculation',
    card_name: "Current vs Deferred Tax Expense — What goes into current portion?",
    rule: "Current portion of income tax expense = Taxable income × 당기 enacted rate. Pretax financial income 사용 금지. Cumulative temporary differences 잔액 → deferred tax 계산용. 세율 두 개 제시 시 current는 당기 세율만.",
    trigger: '"current portion of income tax expense" → taxable income × 당기 enacted rate\n"enacted rate was X% for Year 1, Y% for Year 2" → current는 Y% 사용\n"cumulative temporary differences" 표 → deferred tax용, current 무관\n"permanent difference" → deferred 계산 제외, taxable income 조정에만',
    trap: "Pretax financial income × 21% = $31,500 → taxable income 써야 함.\nYear 1 세율 34% 적용 → 당기(Year 2) 세율 21% 써야 함.\nDeferred tax 변동분을 current에 합산 → 별도 계산.\nCumulative 잔액 전체를 current에 포함 → 기말 누적 잔액은 deferred tax balance.",
    one_sentence: "Current portion = Taxable income × 당기 세율. Pretax income·누적잔액·과거세율 전부 함정.",
    speed: "Current = $129,000 × 21% = $27,090 | Pretax $150,000 쓰면 $31,500 오답 | 세율 34% 쓰면 오답",
    example: "Pretax financial income $150,000\n− Permanent difference (12,000) → $138,000\n− Temporary difference (9,000) → Taxable income $129,000\n\nCurrent portion = $129,000 × 21% = $27,090\nDeferred portion = ($20,000 − $11,000) × 21% = $1,890\nTotal tax expense = $28,980",
    key_formula: "Current portion = Taxable income × 당기 enacted rate\nDeferred portion = (기말 누적 temp diff − 기초 누적 temp diff) × 미래 enacted rate",
    context_background: "[Income Tax Expense 두 부분]\nCurrent portion: 실제 세무서에 납부할 세금. Taxable income × 당기 enacted rate.\nDeferred portion: 일시적 차이로 인한 미래 세금 효과의 당기 변동분.\n\n[Reconciliation 표 읽는 법]\nPretax financial income → 영구적 차이 조정 → 일시적 차이 조정 → Taxable income\n영구적 차이: deferred tax 계산 대상 아님\n일시적 차이: deferred tax 발생\n\n[세율 두 개 제시 시]\nCurrent portion → 당기(Year 2) 세율\nDeferred tax balance → 차이가 해소되는 미래 연도 enacted rate\n이 문제에서는 둘 다 21%(Year 2 and thereafter)로 동일",
  },

  // [TAX_009] Total Income Tax Expense — DTA + Valuation Allowance
  // RULE    : Total = Current − DTA benefit + Valuation allowance
  // TRIGGER : "more likely than not" + loss → VA 설정 / "income tax expense"(total) → 세 단계 전부
  // TRAP    : current만($225K) / DTA만($100K) / VA 누락($125K) / VA 전체 DTA에 적용
  {
    topic_id: "TAX_009",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'calculation',
    card_name: "Total Income Tax Expense — Current + DTA + Valuation Allowance 3-step",
    rule: "Total income tax expense = Current tax − DTA benefit + Valuation allowance.\n\n① Current = Taxable income × enacted rate\n② DTA = Deductible temp diff × rate → income tax expense 감소\n③ Valuation allowance = 'More likely than not' 회수 불가 DTA × rate → expense 증가\n\n'current portion'만 물으면 ①만 / 'income tax expense'(total) 물으면 ①②③ 전부.",
    trigger: '"more likely than not" + "incur a loss after Year X" → valuation allowance 트리거\n"warranty expense" + "only difference" → deductible temp diff → DTA\n"income tax expense" (수식어 없음) → total, 세 단계 전부\n"current portion" → taxable income × 세율만',
    trap: "$225,000: current tax만, DTA·VA 무시.\n$100,000: DTA만 계산.\n$125,000: current − DTA만, VA 미반영.\nVA를 전체 DTA $400,000에 적용 → 회수 가능 Year 2~3 제외, Year 4~5분($200,000)에만 적용.",
    one_sentence: "Total tax expense = Current − DTA + VA. 'more likely than not' 회수 불가 부분에만 VA 설정.",
    speed: "세율 동일 → 괄호 안 금액 먼저 정리 후 한 번에 곱하기\n(Taxable income − Temp diff + VA 조정) × 세율\n= ($900,000 − $400,000 + $200,000) × 25%\n= $700,000 × 25% = $175,000\n\nVA 조정 금액: 총 temp diff − 회수 가능분\n= $400,000 − $200,000(Year 2~3) = $200,000",
    example: "Current: $900,000 × 25% = $225,000\nDTA: $400,000 × 25% = $100,000\nVA: $200,000 × 25% = $50,000 (Year 4~5 회수 불가)\nTotal = $225,000 − $100,000 + $50,000 = $175,000",
    journal_entry: "① Dr. Income Tax Expense 225,000 / Cr. Income Tax Payable 225,000\n② Dr. Deferred Tax Asset 100,000 / Cr. Income Tax Expense 100,000\n③ Dr. Income Tax Expense 50,000 / Cr. Valuation Allowance 50,000\n→ Net Income Tax Expense = $175,000",
    key_formula: "Total Income Tax Expense = Current tax − DTA benefit + Valuation allowance\nValuation Allowance = 회수 불가 temp diff × enacted rate",
    context_background: "[Warranty — 재무회계 vs 세무회계]\n재무회계: 발생 시 expense 인식(보수주의)\n세무회계: 실제 지급 시 공제\n→ Year 1: 재무 $400K expense, 세무 $0 공제 → deductible temp diff $400K → DTA\n→ Year 2~5: 세무상 각 $100K 공제 → DTA 순차 소멸\n\n[Valuation Allowance 설정 기준]\n'More likely than not'(50% 초과 가능성)으로 DTA의 일부 또는 전부를 실현할 수 없을 것으로 판단되면 VA 설정.\nYear 2~3: 수익 충분 → $200K 회수 가능 → VA 불필요\nYear 4~5: 손실 예상 → $200K 회수 불가 → VA $50K 설정\n\n[분개 3개 구조]\nIncome Tax Expense에 세 번 들어가고 나와서 최종 $175K.\nB/S: Tax Payable $225K(부채) / DTA $100K − VA $50K = net $50K(자산)",
  },

  // [TAX_010] Total Income Tax Expense — Current + DTL/DTA Change
  // RULE    : Total = Current + DTL변동(+) + DTA변동(−)
  // TRIGGER : "total income tax expense" → current + deferred 전부
  // TRAP    : current만($42K) / DTL·DTA 방향 혼동($53K) / DTA 변동 누락($43K)
  {
    topic_id: "TAX_010",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_DEFTAX',
    sub_category_id: "U5_INCOME_TAX",
    card_type: 'calculation',
    card_name: "Total income tax expense — current + DTL change + DTA change",
    rule: "Total income tax expense = Current + Deferred\n\nCurrent = Taxable income × enacted rate\n\nDeferred:\nDTL 증가 → expense (+) 미래에 더 낼 세금\nDTL 감소 → benefit (−)\nDTA 증가 → benefit (−) 미래에 덜 낼 세금\nDTA 감소 → expense (+)\n\n변동분 = 기말 − 기초\n\n'current portion'만 물으면 Current만\n'total income tax expense' 물으면 전부",
    trigger: '"total income tax expense" → current + deferred 전부\n"beginning/end of year" DTL·DTA → 변동분(기말−기초)\nDTL 증가 → expense(+) / DTA 증가 → benefit(−)',
    trap: "Current만 계산($42K) → deferred 변동 무시.\nDTL·DTA 방향 혼동 → 둘 다 expense로 처리($53K).\nDTA 변동 누락($43K).\nDTA 증가를 expense로 처리 → benefit(차감)이어야 함.",
    one_sentence: "Total = Current + DTL↑(+) − DTA↑(−) | $42K+$5K−$6K=$41K",
    speed: "Current $42K + DTL↑$5K − DTA↑$6K = $41K",
    example: "Taxable income $120,000 × 35% = $42,000 (current)\nDTL: $55K − $50K = +$5,000 (expense)\nDTA: $16K − $10K = +$6,000 (benefit)\nTotal = $42,000 + $5,000 − $6,000 = $41,000",
    journal_entry: "Dr. Income Tax Expense—current $42,000\n  Cr. Income Tax Payable $42,000\nDr. Income Tax Expense—deferred $5,000\n  Cr. Deferred Tax Liability $5,000\nDr. Deferred Tax Asset $6,000\n  Cr. Income Tax Expense—deferred $6,000",
    key_formula: "Total income tax expense = Current + DTL변동 − DTA변동\nDTL변동 = DTL기말 − DTL기초\nDTA변동 = DTA기말 − DTA기초",
    context_background: "[Total vs Current portion 구분]\nCurrent portion = Taxable income × rate → TAX_008\nTotal = Current + Deferred → TAX_010\n\n[DTL/DTA 변동 방향]\nDTL 증가: 미래에 더 낼 세금 쌓임 → 당기 expense\nDTA 증가: 미래에 덜 낼 세금 혜택 쌓임 → 당기 benefit(차감)\n\n[검증]\nB/S: Tax Payable $42K / DTL $55K / DTA $16K\nI/S: Tax expense $41K",
  },

  // [LTL_001] Current Liabilities — Bond Discount 차감 + Deferred Tax 제외
  // RULE    : Current = AP + Bonds(next yr) − Discount / Deferred tax → Non-current 무조건
  // TRIGGER : 'bonds payable due Year X' → next yr → Current
  //           'discount on bonds payable' → 차감(−)
  //           'deferred income tax liability' → Non-current 무조건
  // TRAP    : Discount 가산(B) / Deferred tax 포함(C/D) / reversal Y2여도 Non-current
  {
    topic_id: "LTL_001",
    book_id: 'IA',
    chapter_id: 'IA_CH12',
    topic_group: 'IA_CH12_LTL',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Current Liabilities — Bond Discount Deduction + Deferred Tax Exclusion",
    rule: "Current liabilities = 보고일로부터 1년(또는 영업주기) 내 결제 의무. 항목별 분류:\n✅ Accounts payable → Current\n✅ Bonds payable(1년 내 만기) → Current\n✅ Discount on bonds payable → 차감(−) (contra-liability)\n✅ Premium on bonds payable → 가산(+) (adjunct-liability)\n✅ Dividends payable(선언된 현금배당, 1년 내 지급) → Current\n✅ Income tax payable → Current\n❌ Deferred income tax → 항상 Non-current (US GAAP, reversal 시점 무관)\n❌ Notes/Bonds payable(만기 1년 초과, 예: due Year 3) → Non-current\n[속도 룰] 이름에 'discount' → 차감 / 'premium' → 가산 / 'deferred tax' → 제외 / 'due [1년 초과]' → 제외 / 나머지 단기 → 가산",
    trigger: "'bonds payable, due Year 2(1년 내)' → Current 포함\n'notes/bonds payable, due Year 3(1년 초과)' → Non-current 제외\n'discount on bonds payable' → 차감(−), 더하면 오답 (이름에 discount 보이면 바로 contra-liability → 차감, 상각·분개 따질 필요 없음)\n'premium on bonds payable' → 가산(+) (거울상)\n'deferred income tax' → Non-current 무조건 (\"expected to reverse in Year X\"는 함정)\n'dividends payable, due [1년 내]' → 선언된 현금배당 = 법적 부채 → Current 포함\n'income tax payable' / 'accounts payable' → 단기 → Current 포함",
    trap: "Deferred tax를 'reversal이 1~2년 내'라 Current로 분류 → US GAAP에서 항상 Non-current (가장 흔한 함정)\nBond discount를 가산(+)하거나 차감 누락 → contra-liability라 반드시 차감. trial balance에 양수로 적혀 있어도 이름에 'discount'면 차변잔액 → 빼기\n만기 1년 초과 note(due Year 3)를 Current로 포함 → 1년 기준 초과면 Non-current\nDividends payable을 제외하는 오류 → 선언된 현금배당은 1년 내 지급이면 Current\n[혼동 주의] 상각 시 discount가 Cr로 등장하는 것은 '차변잔액을 줄이는 동작'일 뿐, 잔액은 발행~만기 내내 차변(차감 방향 고정). 시점별로 크기만 변하고 부호는 안 바뀜",
    one_sentence: "Current = AP + Bonds − Discount; Deferred tax → 항상 Non-current.",
    speed: "이름으로 부호 판단: discount(−)/premium(+) | deferred tax·1년 초과 만기 → 제외 | 나머지 단기 → 더하기\n① 1년 내 항목만: AP + Bonds(1년내) − Discount + Dividends(1년내) + Income tax\n② Deferred tax·Notes(1년 초과) 제외\n예) 19K + 34K − 2K + 5K + 9K = $65,000",
    example: "AP $120K + Bonds $450K − Discount $22.5K = $547,500 / Deferred tax $37.5K → 제외",
    context_background: "[유동부채 분류 기준]\nCurrent liabilities = 보고일(B/S date)로부터 1년 또는 영업주기 내에 결제될 의무. 분류의 1차 기준은 '만기·결제 시점이 1년 내인가'. 여기에 몇 가지 특수 규칙이 더해진다.\n\n[① Deferred income tax — 항상 Non-current]\nUS GAAP은 2015년 ASU 단순화 이후 이연법인세 자산·부채를 reversal 시점과 무관하게 전부 비유동으로 분류한다. 'Year 3·4에 reverse'라는 단서는 함정 — 여전히 Non-current.\n\n[② Bond discount/premium — 부채의 조정계정]\nDiscount on bonds payable: 사채를 액면보다 싸게 발행할 때 생기는 차변잔액 계정(contra-liability). 발행 분개: Dr.Cash + Dr.Discount / Cr.Bonds Payable(액면). Bonds Payable(대변)을 상쇄하여 장부금액(carrying value) = 실제 순부채를 만든다. → B/S에서 항상 차감(−).\n  · 상각: Dr.Interest Expense / Cr.Discount → discount(차변잔액)를 줄이는 동작. 잔액 위치는 내내 차변, 크기만 0으로 감소 → 장부금액이 액면으로 차오름. 부호는 안 바뀜.\nPremium on bonds payable: 거울상. 대변잔액(adjunct-liability) → 항상 가산(+), 상각 시 Dr로 감소.\n[속도 룰] 이름에 'discount' 보이면 즉시 차감, 'premium'이면 가산. 상각표·발행가 떠올릴 필요 없이 이름만으로 부호 확정.\n\n[③ Dividends payable — 선언되면 법적 부채]\n현금배당은 선언(declaration) 시점에 법적 부채가 된다. 지급일이 1년 내면 Current.\n\n[④ 만기 1년 초과 — Non-current]\nNotes/bonds payable이 B/S date로부터 1년을 초과해 만기(예: due Year 3)면 Non-current로 제외.\n\n[이 문제 적용 — Gar Inc.]\nAccounts payable $19,000 ✅\nBonds payable, due Year 2 $34,000 ✅\nDiscount on bonds payable ($2,000) ✅ 차감\nDividends payable, due 2/15/Year 2 $5,000 ✅\nIncome tax payable $9,000 ✅\nDeferred income tax payable $4,000 ❌ Non-current(reverse 시점 무관)\nNotes payable, due 1/19/Year 3 $6,000 ❌ 1년 초과 Non-current\n→ Current = 19,000 + 34,000 − 2,000 + 5,000 + 9,000 = $65,000 (정답 D)\n오답: B(69,000)=deferred tax 포함 / A(71,000)=note·deferred tax 혼입 / C(67,000)=discount 미차감",
  },

  // [PAY_001] Accrued Bonus — Bonus Based on Income After Deducting the Bonus (Circular Formula)
  // RULE    : B가 등호 양쪽에 등장(좌변 B, 우변 −B) → 순환식 / B = (Income − Threshold − B) × rate, 한쪽으로 모아 풀기
  // TRIGGER : "X% of income over $Y" → 초과분에만 율 / "after deducting the bonus" → 순환식 / "before income taxes" → 세금 제외
  // TRAP    : 보너스 차감 누락(단순 곱셈)(C) / threshold 무시 / 전체이익에 율 적용
  {
    topic_id: "PAY_001",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U4_PAYABLES",
    card_type: 'calculation',
    card_name: "Accrued Bonus — Bonus Based on Income After Deducting the Bonus (Circular Formula)",
    rule: "보너스가 '보너스를 차감한 후의 이익(after deducting the bonus)'에 연동되면 보너스 B가 등호 양쪽에 모두 들어가는 순환식(circular)이 된다. B = (Income − Threshold − B) × rate. 좌변의 B와 우변 괄호 안의 −B를 한쪽으로 모아 방정식으로 푼다. 'over $X'는 전체가 아니라 초과분(Income − X)에만 율 적용. 'before income taxes'면 세금은 식에서 제외.",
    trigger: "bonus of X% of income over $Y | after deducting the bonus | before income taxes | manager bonus | circular bonus\n'X% of income over $Y' → 초과분(Income − Y)에만 율 적용\n'after deducting the (manager's) bonus' → 순환식 → B를 양변에 두고 풀기\n'before income taxes' → 세금은 식에서 무시\n식: B = (Income − Threshold − B) × rate",
    trap: "C: ($160,000 − $100,000) × 25% = $15,000으로 끝냄 → 'after deducting the bonus'(자기참조) 누락. 보너스를 한 번 더 빼는 순환 처리 안 함\nB: $100,000 × 25% → 'over $100,000'(초과분만) 무시, 전체에 곱한 오류\nA: 전체 이익 $160,000에 잘못된 율 적용 / threshold·보너스 차감 모두 누락\n공통 함정: 'after deducting the bonus' 문구를 놓치고 단순 곱셈으로 처리. 핵심은 B가 등호 양쪽에 다 들어간다는 것",
    one_sentence: "보너스가 '보너스 차감 후 이익' 기준이면 B가 양변에 등장하는 순환식 → B = (Income − Threshold − B) × rate, 모아서 풀기.",
    example: "Dodd: income $160,000, threshold $100,000, rate 25%, after deducting bonus\nB = (160,000 − 100,000 − B) × 25% = (60,000 − B) × 0.25\nB = 15,000 − 0.25B → 1.25B = 15,000 → B = $12,000\n검산: (60,000 − 12,000) × 25% = 48,000 × 25% = $12,000 ✅ (순환 닫힘)",
    key_formula: "B = (Income − Threshold − B) × rate\n→ B(1 + rate) = (Income − Threshold) × rate\n→ B = (Income − Threshold) × rate ÷ (1 + rate)",
    speed: "초과분 = Income − Threshold = 160,000 − 100,000 = 60,000 | 'after deducting bonus' → 순환식 B = (60,000 − B) × 0.25 → 1.25B = 15,000 → B = $12,000 → 정답 D",
    context_background: "[보너스를 '보너스 차감 후 이익'에 연동하는 이유]\n경영자 보너스를 보너스까지 뺀 이익에 연동하는 것은 실무에서 흔한 인센티브 설계다. 보너스도 회사 입장에서는 비용이므로, '보너스를 지급하고 난 뒤 실제로 회사에 남는 이익'을 기준으로 보상해야 경영자와 주주의 이해가 일치한다. 회계에서는 이 보너스를 기말에 accrued liability(미지급 보너스)로 계상한다.\n\n[왜 순환식(circular)이 되는가]\n보너스를 계산하려면 '보너스를 뺀 이익'을 알아야 하는데, '보너스를 뺀 이익'을 알려면 보너스를 먼저 알아야 한다. 즉 구하려는 보너스 B가 자기 자신을 계산하는 식 안에 또 들어간다. 그 결과 같은 B가 등호 양쪽에 걸쳐 등장한다(좌변 B, 우변 괄호 안 −B). 이것이 circular의 정체이며, 단순 곱셈으로 풀 수 없고 방정식으로 모아서 풀어야 한다.\n\n[풀이 단계]\n① 초과분 산출: Income − Threshold (over $X → 초과분에만 율 적용)\n  $160,000 − $100,000 = $60,000\n② 순환식 세우기: B = (초과분 − B) × rate\n  B = (60,000 − B) × 0.25\n③ 전개: B = 15,000 − 0.25B\n④ B를 한쪽으로 모음: 1.25B = 15,000\n⑤ B = $12,000\n\n[검산]\n구한 B로 (초과분 − B) × rate가 다시 B와 같으면 순환이 닫힌 것:\n(60,000 − 12,000) × 25% = 48,000 × 25% = $12,000 = B ✅\n\n[세금 처리]\n'before income taxes'면 세금은 식에서 제외한다. 보너스가 '세후(after taxes)' 기준이거나 세금도 보너스에 연동되면 보너스와 세금 두 미지수의 연립식이 되어 더 복잡해진다. 이 문제는 세전 기준이라 보너스 한 개만 푸는 단일 순환식이다.",
  },

  // ── EPS ────────────────────────────────────────────────────────────────────
  {
    topic_id: "EPS_001",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Income available to common — preferred dividend deduction",
    rule: "Income Available to Common (IAC) = Net Income − preferred dividends declared (or accrued). This is the numerator in Basic EPS.",
    trigger: "EPS | income available to common | preferred dividend | numerator | basic EPS",
    trap: "Deduct preferred dividends from Net Income before dividing by shares. 주의: 이 규칙(선언 무관 차감)은 EPS 계산에만 적용 — 투자자 배당수익 인식에서는 선언 시점에만 인식(EPS_016 참조).",
    one_sentence: "Basic EPS numerator = net income minus preferred dividends.",
    example: "Net Income $100,000 / Preferred div $10,000 → IAC $90,000 / Weighted avg shares 45,000 → Basic EPS $2.00",
  },
  {
    topic_id: "EPS_002",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Cumulative preferred dividend — deduct declared or not",
    rule: "Cumulative preferred: 선언·지급 여부와 무관하게 당기 1년치 요구액(annual requirement)을 NI에서 차감. Noncumulative preferred: 실제 선언된 금액만 차감(선언 안 하면 0). 당기 요구액 = par × 우선주 주수 × 배당률 (= 총 par × 배당률, 시가·발행가 아님). 전기 미지급 체납(arrears)은 당기 BEPS에 영향 없음(전기에 이미 차감). 당기 실제 지급액도 무관(지급은 현금흐름, 발생귀속과 별개). BEPS = (NI − 당기 요구액) ÷ WACSO.",
    trigger: "'cumulative preferred' → 선언 여부 무관, 당기 1년치 요구액 차감\n당기 요구액 = par × 우선주 주수 × 배당률 (= 총 par × 배당률)\n'noncumulative' → 선언된 것만 차감\n'paid no dividends in prior year'(체납) → 당기 BEPS에 영향 없음\n'paid $X during current year' → 실제 지급액 X는 함정, 요구액만 사용\nBEPS = (NI − 당기 요구액) ÷ WACSO",
    trap: "D: 당기 실제 지급액(예: $16,000)을 차감 → cumulative는 요구액($10,000)을 빼야지 지급액이 아님 (지급액 차감은 noncumulative 접근)\nA: 우선주 배당을 아예 안 뺌 → cumulative는 무조건 당기분 차감\nC: 근거 없는 금액 차감\nYear 1 체납분을 당기에 또 더해 이중 차감(예: $20,000) → 전기에 이미 차감, 당기엔 당기분만\nNoncumulative인데 cumulative처럼 미선언분까지 차감하는 반대 오류\n배당률을 par 아닌 시가·발행가에 곱하는 오류 → 항상 par 기준",
    one_sentence: "Cumulative preferred dividends reduce EPS even in years they are not declared.",
    example: "Cumulative preferred $8/share / not declared → still deduct $8 × shares outstanding from IAC",
    speed: "cumulative → 당기 요구액 = par × 주수 × 배당률 = $10 × 25,000 × 4% = $10,000 (지급액·전기 체납 무시) | IAC = 500,000 − 10,000 = 490,000 | ÷ 200,000 = $2.45 → 정답 B",
    context_background: "[누적 우선주와 BEPS]\n누적 우선주(cumulative preferred)는 배당을 선언하지 않아도 회사가 언젠가 반드시 지급해야 할 의무가 매기 쌓인다. 따라서 BEPS의 분자(보통주 귀속 이익, IAC)를 구할 때 당기에 귀속되는 1년치 우선주 배당 요구액을 순이익에서 차감한다 — 선언·지급 여부와 무관하게.\n\n[핵심: '당기 발생분'만]\n- 전기 체납(arrears): 전기 EPS에서 이미 차감되었으므로 당기에 다시 빼지 않는다.\n- 당기 실제 지급액: 지급은 현금흐름일 뿐 발생 귀속과 별개. 당기 요구액과 다를 수 있으나 BEPS엔 요구액만 사용.\n\n[배당률은 par 기준]\n우선주 배당률은 액면가(par) 대비 비율이다. '$10 par, 4%'는 par $10당 매년 4%(주당 $0.40). 시가·발행가가 아니라 par에 곱한다.\n당기 요구액 = par × 우선주 주수 × 배당률 = $10 × 25,000 × 4% = $10,000 (= 총 par $250,000 × 4%, 동일).\n보통주 주식 수는 분모(WACSO)로만 쓰이고 배당 계산엔 들어가지 않는다.\n\n[cumulative vs noncumulative]\n- Cumulative: 선언 안 해도 당기 요구액 차감.\n- Noncumulative: 선언된 것만 차감(선언 안 하면 0).\n이 문제는 cumulative이므로 Year 2 선언·지급 내역과 무관하게 당기 요구액을 뺀다.\n\n[정답 도출 — Ute]\n당기 요구액 = $10 × 25,000 × 4% = $10,000\nIAC = $500,000 − $10,000 = $490,000\nBEPS = $490,000 ÷ 200,000 = $2.45 → 정답 B\n오답: D($2.42)=지급액 $16,000 차감 / A($2.50)=우선주 배당 미차감 / C($2.48)=근거 없는 $4,000 차감.\nYear 2 지급 $16,000은 사실상 (당기 $10,000 + Year 1 체납 $6,000) 구조지만, BEPS엔 당기 $10,000만 반영.",
  },
  {
    topic_id: "EPS_003",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_name: "Weighted average shares — how to calculate",
    rule: "Weight each share change by the fraction of the year outstanding. New issuances → months remaining ÷ 12. Repurchases → reduce by months held ÷ 12.",
    trigger: "weighted average | shares outstanding | issued | repurchased | months outstanding | stock split | stock dividend | reverse split",
    trap: "Stock dividends, splits, and reverse splits apply retroactively for the full year — never weight by months. Beginning shares always get full weight. Do not apply months/12 to the opening balance.",
    one_sentence: "WAC = Beginning + New × (m/12) − Repurchase × (m/12); splits/dividends/reverse splits → retroactive to Jan 1, no weighting.",
    speed: "WAC = Beginning shares (full weight)\n     + New issuances × (months remaining ÷ 12)\n     − Repurchases × (months held ÷ 12)\n\n소급 적용 3총사 (months/12 곱지 않음):\n① Stock split\n② Stock dividend\n③ Reverse stock split\n→ 발생 시점 무관, 1/1 소급 적용",
    example: "100,000 shares Jan 1 + 12,000 issued Jul 1 − 6,000 repurchased Oct 1\n→ WAC = 100,000 + 12,000 × 6/12 − 6,000 × 3/12 = 104,500\n\n2-for-1 split Dec 1 → multiply all shares × 2 retroactively from Jan 1",
  },
  {
    topic_id: "EPS_004",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Stock dividend and split — retroactive adjustment",
    rule: "Stock dividends and splits are applied retroactively as if they occurred at the beginning of the earliest period presented. No monthly weighting.",
    trigger: "stock dividend | stock split | retroactive | prior period | restate shares",
    trap: "Unlike new share issuances, stock dividends/splits are NOT weighted by portion of year.",
    one_sentence: "Stock dividends and splits restate the share count from the beginning of all periods shown.",
    example: "2-for-1 split on December 1 → double ALL shares for the full year, including prior comparative periods",
  },
  {
    topic_id: "EPS_005",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Diluted EPS — convertible bond effect",
    rule: "If-converted method: add back after-tax interest savings (beginning CV × effective rate × (1 − tax rate)) to numerator; add converted shares to denominator.",
    trigger: "diluted EPS | convertible bond | if-converted | interest add-back | diluted",
    trap: "Interest add-back must be after-tax. Use beginning carrying value × effective rate, not face × coupon.",
    one_sentence: "Diluted EPS assumes bond conversion → add back after-tax interest and add new shares.",
    example: "Bond CV $100,000 × 6% = $6,000 × (1 − 25%) = $4,500 add-back to numerator; + converted shares to denominator",
  },
  {
    topic_id: "EPS_006",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Anti-dilutive securities — include or exclude",
    rule: "If including a security would increase EPS (diluted EPS > basic EPS), it is anti-dilutive → exclude it from diluted EPS.",
    trigger: "anti-dilutive | diluted EPS | exclude | higher EPS | increase EPS",
    trap: "The test is simple: if inclusion raises EPS, exclude it.",
    one_sentence: "Anti-dilutive means the security would increase EPS if included, so it must be excluded.",
    example: "Convertible preferred with large dividend rate: including it raises EPS → anti-dilutive → exclude",
    speed: "【시험장 판별】선지에 이자율·주식수·세율 등 숫자 많음 → 나중에 풀기 / 선지가 Basic EPS 근처 좁은 범위 → 키워드만 픽업 후 바로 풀기 | 【antidilution rule】'reduced EPS' → dilutive → 포함 / 'increased EPS' → antidilutive → 제외 | Diluted EPS = Basic EPS − dilutive효과만",
  },

  // [EPS_007] Contingent Shares — Basic EPS Inclusion Date
  // RULE    : 조건 충족일부터 Basic EPS 가중평균 산입 / diluted only 아님
  // TRIGGER : 'agreed to issue X shares for each [조건]' → 충족일 기준 월할 계산
  // TRAP    : 총합산(D) / diluted only 착각(A) / 단순 평균(B)
  {
    topic_id: "EPS_007",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Contingent Shares — Basic EPS Inclusion Date",
    rule: "Contingent shares = 조건 충족일부터 Basic EPS 가중평균에 포함. 각 조건 충족일 기준으로 연말까지 월수 계산. Diluted EPS 전용이 아님.",
    trigger: "'agreed to issue X shares for each [조건]' → 조건 충족일(개점일·달성일)부터 weighted average 기산",
    trap: "D형 함정: 가중평균 없이 총 주식수만 합산 (2,000)\nA형 함정: contingent shares = diluted only라고 착각 → Basic EPS에도 조건 충족 시 포함\nB형 함정: 단순 평균 오류 (1,250)",
    one_sentence: "Contingent shares: 조건 충족일부터 연말까지 weighted average → Basic EPS 분모에 포함.",
    speed: "May 1: 1,000 × 8/12 = 333⅓ / Sep 1: 누적 2,000 × 4/12 = 666⅔ / 합계 = 1,000",
    context_background: "M&A 계약에서 특정 조건 달성 시 추가 주식을 약정하는 경우, 조건 충족일 이전에는 주주로서의 실질적 권리가 없으므로 충족일부터만 Basic EPS 가중평균에 산입한다.",
  },

  // [EPS_008] BEPS weighted average shares — stock dividend retroactive vs. cash issuance
  // RULE    : Stock dividend/split → 소급 적용(연초부터) / Cash issuance → 발행일부터 월할 가중
  // TRIGGER : "stock dividend" / "stock split" → 기존 주식 × 배수 소급 / "issued for cash" → 잔여월/12 가중
  // TRAP    : stock dividend를 발행월부터 가중 / Nov.1 발행을 3/12로 가중(→ 2/12가 정확) / 연말 주식수 그대로 사용
  {
    topic_id: "EPS_008",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'concept',
    card_name: "BEPS weighted average shares — stock dividend retroactive adjustment vs. cash issuance",
    rule: "BEPS 가중평균주식수 계산:\n① Stock dividend / Stock split → 소급 적용 — 연초(Jan.1)부터 있었던 것처럼 기존 주식에 배수 곱하기\n② Cash issuance(현금 발행) → 실제 발행일부터 잔여월/12 가중\n③ 잔여월 = 발행월 포함 ~ Dec.31까지",
    trigger: '"stock dividend" / "stock split" → 소급 적용 → Jan.1 기준 주식수 × (1 + %) \n"issued common stock for cash" / "issued common stock" → 발행일부터 월할 가중\n잔여월: Jan=12, Feb=11, Mar=10, Apr=9, May=8 ... Nov=2, Dec=1',
    trap: "① Stock dividend를 발행월(Mar.1)부터 월할 가중 → 소급 적용 규칙 위반\n② Nov.1 발행을 3/12 가중 → 잔여월은 Nov·Dec = 2개월 → 2/12\n③ Dec.1 연말 실제 주식수(117,000) 그대로 사용 → 가중 없음 오류",
    one_sentence: "Stock dividend → 소급(× 배수); Cash issuance → 발행일부터 월할; 잔여월 = 발행월 포함 ~12월",
    example: "Jan.1 90,000 / Mar.1 10% stock div → 99,000 소급 / May.1 13,500 → ×8/12 / Nov.1 4,500 → ×2/12 = 108,750",
    context_background: "BEPS 계산 시 가중평균주식수는 각 주식이 실제로 유통된 기간을 반영한다. Stock dividend와 stock split은 예외 — 주주 전체에게 동일 비율로 배분되므로 연초부터 존재했던 것처럼 소급 적용한다. 반면 현금 발행(cash issuance)은 실제 발행일부터 월할 가중한다.",
    speed: "① Stock dividend(Mar.1) → 소급 → Jan.1 × 1.10 = 99,000\n② May 1 → 8/12 → +9,000\n③ Nov 1 → 2/12 → +750\n④ 99,000 + 9,000 + 750 = 108,750 → 정답 A\n\n[실전 SPEED]\nRepurchase 보이면 → Treasury Stock = 유통주식 감소 → 빼기\nSplit + 신주 먼저 계산 → 대략값 파악 → Repurchase = 그보다 조금 작은 값 즉시 선택",
  },

  // [EPS_009] BEPS vs DEPS – Stock Options vs Contingent Shares Inclusion
  // RULE    : Stock options → BEPS 제외, DEPS만 / Contingent shares → 조건 충족 시 BEPS 포함
  // TRIGGER : "basic EPS" + "stock options" → 제외 / "contingent shares" → 조건 충족 시 BEPS
  // TRAP    : options dilutive → BEPS 착각 / contingent → DEPS만 착각
  {
    topic_id: "EPS_009",
    category: "EPS",
    topic_name: "BEPS vs DEPS – Stock Options vs Contingent Shares Inclusion",
    rule: "【BEPS 가중평균 주식수 포함 기준】\n실제 발행·유통 중인 주식만 포함\n\nStock Options\n→ 주식 아님 (살 수 있는 권리)\n→ BEPS 제외 ❌\n→ DEPS: dilutive 시 treasury stock method로 포함 ✅\n\nContingent Shares\n→ 특정 조건(EPS 목표, 주가 목표 등) 충족 시 발행 예정\n→ 조건 충족 시점 = 발행 확정으로 간주\n→ BEPS: 조건 충족일부터 가중평균에 포함 ✅\n→ DEPS: dilutive 조건도 충족해야 포함 ✅\n\n【BEPS vs DEPS 항목별 정리】\n실제 발행 주식 → BEPS ✅ / DEPS ✅\nStock options → BEPS ❌ / DEPS ✅(희석시)\nConvertible bonds → BEPS ❌ / DEPS ✅(희석시)\nContingent shares → BEPS ✅(조건충족시) / DEPS ✅(희석시)",
    trigger: '"basic EPS" + "stock options" → BEPS 제외\n"basic EPS" + "contingent shares" → 조건 충족 시 BEPS 포함\n"dilutive if conditions met" → contingent shares → BEPS도 해당\nI/II 선택 유형 → 각각 독립 판단',
    trap: "Stock options dilutive → BEPS 포함 착각(DEPS만).\nContingent shares → DEPS에만 포함 착각(조건 충족 시 BEPS도).\n둘 다 BEPS 포함(Both I and II) 선택.\n'dilutive' 조건만 보고 둘 다 DEPS에만 해당한다고 착각.",
    example: "Stock options 1,000개, 행사가 $10, 시장가 $15\n→ BEPS: 미포함\n→ DEPS: Treasury stock method\n   발행 가정 1,000주 − 재매입 가정 (1,000×$10/$15=667주) = 333주 추가\n\nContingent shares: EPS $3 달성 시 10,000주 발행 조건\n현재 EPS $3.5 → 조건 충족\n→ BEPS: 10,000주 포함 (조건 충족일부터 가중)\n→ DEPS: dilutive 여부 추가 확인",
    journal_entry: "",
    key_formula: "BEPS 분모 = 실제 발행 주식 + 조건 충족 contingent shares\nDEPS 분모 = BEPS 분모 + dilutive options(TSM) + dilutive convertibles",
    speed: "BEPS = 실제 발행 주식 | Stock options → DEPS만 | Contingent shares 조건 충족 → BEPS 포함",
  },

  // [EPS_016] Cumulative Preferred Dividend — EPS vs Investor Income Recognition (대비)
  // RULE    : EPS = 선언 무관 차감(보수적) / 투자자 수익 = 선언 시점에만 인식
  // TRIGGER : "cumulative preferred" + "dividend in arrears" + "received"
  // TRAP    : 전기 미수배당을 전기 receivable로 인식 / 두 맥락 혼동
  {
    topic_id: "EPS_016",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'conditional',
    card_name: "Cumulative preferred dividend — EPS deduction vs investor income recognition",
    rule: "같은 'cumulative preferred dividend'인데 맥락에 따라 처리가 완전히 다름:\n\n[EPS 계산 — 발행사/보통주 관점]\n누적적 우선주 배당 → 선언 여부 무관하게 차감\n이유: 보수적 EPS — '언젠가는 줘야 할 돈' 미리 반영\n\n[배당수익 인식 — 투자자 관점]\n누적적 우선주 배당 → 선언(declare)돼야만 수익 인식\n이유: 선언 전엔 법적 권리 없음 — receivable 인식 불가\n전기 미지급 배당을 당기에 수취 → 당기 continuing operations에 포함",
    trigger: "'cumulative preferred' + 'dividend in arrears' + 'received in Year X' → 선언 시점(Year X) 수익 인식 'declared and paid both Year X and Year X-1 dividend' → 전기분도 당기 수익 EPS 맥락 → 선언 무관 차감 / 투자자 수익 맥락 → 선언 시점 인식",
    trap: "전기 미지급 배당을 전기에 receivable 인식 → 누적적 우선주 배당은 선언 전 법적 권리 없음 retroactive 수정 → 회계원칙 변경·전기오류 아님, 소급 적용 불가 discontinued operation 처리 → 일반 배당수익은 continuing operations 포함 EPS 규칙(선언 무관 차감)을 투자자 수익 인식에 적용 → 맥락이 다름",
    one_sentence: "EPS: 누적 우선주 배당 선언 무관 차감 / 투자자: 선언 시점에만 수익 인식 — 같은 단어, 다른 처리.",
    speed: "맥락 판단 먼저: EPS 계산? → 선언 무관 차감 / 투자자 수익? → 선언 시점 당기 continuing operations",
    context_background: "[왜 처리가 다른가]\nEPS 계산(발행사 관점):\n보통주 주주 입장에서 '우선주에 줄 돈'을 미리 제외해야 보수적 EPS.\n선언 안 했어도 누적되므로 언젠가 줘야 함 → 미리 차감.\n\n투자자 수익 인식:\n배당은 이사회 선언으로 법적 의무가 확정됨.\n선언 전에는 투자자에게 법적 청구권 없음 → receivable 인식 불가.\n선언된 시점에 수익 인식 → 전기 미지급분도 당기 수익.\n\n[실전 대비표]\n구분         EPS 계산          투자자 수익\n입장         발행사(보통주)     투자자\n누적 우선주  선언 무관 차감     선언 시점 인식\n이유         보수적 EPS        법적 권리 확정\n분류         EPS 분자 조정     Continuing operations",
  },

  // [EPS_013] BEPS — Weighted Average Shares (Stock Split & Treasury Stock)
  // RULE    : Stock split → 전 구간 소급 ×배수 (comparative Year 1 포함) / Treasury stock → 거래일부터만
  // TRIGGER : "2-for-1 stock split" → 소급 / "treasury stock sold on [date]" → 거래일부터
  // TRAP    : Treasury stock 연초 소급($2.34) / Year 1 split 미적용($3.50)
  {
    topic_id: "EPS_013",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "WASO — Stock Split retroactive vs Treasury Stock from transaction date",
    rule: "Stock split → 발생 전 구간 전부 소급 ×배수. Comparative statements의 prior year도 동일 소급 적용(comparability). Treasury stock 매각 → 거래일부터만 가중(소급 없음). WASO = Σ(구간별 주식수 × 월수/12).",
    trigger: '"2-for-1 stock split" → 발생 전 구간 전부 ×2 소급 / Year 1 comparative도 소급\n"treasury stock sold on [date]" → 해당일부터만 주식수 증가\n"comparative income statements" → prior year EPS 재계산 필수\n"no securities convertible" → BEPS만, DEPS 불필요',
    trap: "Treasury stock 매각을 연초(1/1)부터 반영 → 거래일부터만 해야 함 ($2.34 오답).\nYear 1 EPS split 소급 미적용 → $3.50 오답. Comparative = 반드시 재계산.\nSplit을 발생일 이후 구간에만 ×2 → 이전 구간 소급 누락.",
    one_sentence: "Stock split → 전 기간 소급(Year 1 포함) | Treasury stock → 거래일부터 | 선지 $3.50 보이면 즉시 소거.",
    speed: "① Year 1 먼저: 100,000 × 2 = 200,000 → $350,000 ÷ 200,000 = $1.75 → $3.50 선지 소거\n② Year 2 구간: 1/1~4/1: 100,000×3/12×2=50,000 / 4/1~7/1: 120,000×3/12×2=60,000 / 7/1~12/31: 240,000×6/12=120,000 → WASO=230,000\n③ $410,000 ÷ 230,000 = $1.78",
    example: "Year 1: 100,000주 × 2(split 소급) = 200,000 → EPS $350,000÷200,000 = $1.75\nYear 2 WASO:\n1/1~4/1: 100,000×3/12×2 = 50,000\n4/1~7/1: 120,000×3/12×2 = 60,000\n7/1~12/31: 240,000×6/12 = 120,000\nWASO = 230,000 → EPS $410,000÷230,000 = $1.78",
    key_formula: "WASO = Σ(구간별 주식수 × 월수/12)\nSplit 소급: 발생 전 모든 구간 × split 배수\nTreasury stock: 매각일부터 주식수 증가",
    context_background: "[Stock Split 소급 원칙]\nStock split은 경제적 실질 변화 없이 주식 수만 늘어나므로, 발생 전 구간 전부 소급 적용. Comparative statements에서 prior year EPS도 split 반영해서 재계산(comparability 유지). 소급하지 않으면 Year 1 $3.50 vs Year 2 $1.78처럼 오해를 유발.\n\n[Treasury Stock 매각]\n실제 주식이 시장에 새로 풀리는 실질적 사건 → 거래일부터만 가중치 적용. 소급 없음.\n\n[시험장 전략]\n이 유형은 개념 난이도 낮지만 계산 시간 소요. 구간 3개 이상이면 flag하고 나중에 풀기. 선지 소거로 먼저 압축: Year 1 $3.50 → split 소급 미적용 오답으로 즉시 소거.",
  },

  // [EPS_014] DEPS — Dilutive vs Anti-dilutive Test (Incremental EPS)
  // RULE    : Incremental EPS = 이익증가 ÷ 주식증가 < BEPS → dilutive
  // TRIGGER : 채권 → Face×rate×(1-t)÷shares / 우선주 → Par×div%÷shares
  // TRAP    : (1-t) 누락 / convertible 없으면 소거 / anti-dilutive 혼동
  {
    topic_id: "EPS_014",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "DEPS dilutive test — incremental EPS vs BEPS",
    rule: "Dilutive 판단: Incremental EPS < BEPS → dilutive / > BEPS → anti-dilutive\n\n채권 전환:\nIncremental EPS = Face × rate × (1−t) ÷ new shares\n\n우선주 전환:\nIncremental EPS = Par × div rate ÷ new shares (세금 없음)\n\nConvertible 명시 없으면 즉시 소거.",
    trigger: '"dilutive" + BEPS 주어짐 → incremental EPS 계산 후 비교\n"convertible bonds" → Face × rate × (1−t) ÷ new shares\n"convertible preferred" → Par × div rate ÷ new shares\n"no indication convertible" → 즉시 소거',
    trap: "Convertible 아닌 증권을 계산하려는 실수 → 소거 대상.\nPreferred에 (1−t) 적용 → 배당은 세후 지급, 세금 효과 없음.\n채권 incremental EPS에서 (1−t) 누락.\nIncremental EPS > BEPS → dilutive로 착각 → anti-dilutive.",
    one_sentence: "Incremental EPS = 이익증가 ÷ 주식증가 < BEPS → dilutive | 채권: ×(1-t) | 우선주: 세금 없음",
    speed: "B: $1,000×7%×0.7÷40=$1.225<$1.29 ✓ | C: $6÷4=$1.50 anti | D: $70÷20=$3.50 anti",
    example: "BEPS $1.29, tax 30%\nB(7% bond, 40주): $49÷40=$1.225 < $1.29 → Dilutive ✓\nC(6% pref, 4주): $6÷4=$1.50 > $1.29 → Anti-dilutive\nD(10% bond, 20주): $70÷20=$3.50 > $1.29 → Anti-dilutive",
    key_formula: "채권 Incremental EPS = Face × coupon rate × (1−t) ÷ new shares\n우선주 Incremental EPS = Par × div rate ÷ new shares",
    context_background: "[Dilutive test 경제적 실질]\nDEPS는 희석성 증권이 전환됐을 때 EPS가 낮아지는지 테스트.\nIncremental EPS = 전환으로 추가되는 이익 ÷ 전환으로 추가되는 주식수\n이 값이 BEPS보다 낮으면 → EPS를 희석시킴 → dilutive\n이 값이 BEPS보다 높으면 → EPS를 높임 → anti-dilutive (DEPS 제외)\n\n[채권 vs 우선주 차이]\n채권 이자: 세전 비용 → 전환 시 이자절감 = 세전 × (1−t)\n우선주 배당: 세후 지급 → 배당 절감에 세금 효과 없음\n\n[소거 조건]\nConvertible 명시 없으면 보통주 전환 불가 → dilutive 판단 불가 → 즉시 소거",
  },

  // [EPS_010] EPS Disclosure — Report Requirement vs Location (Face vs Notes)
  // RULE    : 2축 분리 / report 여부: continuing·net income·discontinued 모두 Yes / 위치: continuing·net income=face 강제, discontinued=face or notes 선택
  // TRIGGER : "EPS data should be reported for" → report 여부(셋 다 Yes) / "on the face of I/S" → discontinued 제외
  // TRAP    : discontinued 주석 가능 → 보고 면제(No)로 착각 / continuing ops EPS 누락
  {
    topic_id: "EPS_010",
    category: "EPS",
    topic_name: "EPS Disclosure — Report Requirement vs Location (Face vs Notes)",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'concept',
    card_name: "EPS Disclosure — Report Requirement vs Location (Face vs Notes)",
    rule: "US GAAP EPS 공시는 2축으로 분리해 판단:\n[축1 — 보고 여부(report/should)] income from continuing operations · net income · discontinued operations(보고 시) → 모두 per-share(BEPS·DEPS) 공시 필수 → 전부 Yes.\n[축2 — 위치(where)] continuing operations·net income → 반드시 I/S 본문(face)에 equal prominence 표시(강제). discontinued operations → face 또는 notes 중 선택 허용.\n질문이 'report 여부'를 물으면 셋 다 Yes. '본문(face) 표시'를 물으면 discontinued 제외.",
    trigger: "EPS data should be reported for | per share amounts | basic and diluted | face of the income statement | discontinued operations | continuing operations | net income | equal prominence\n'EPS data should be reported for [항목]' → report 여부 → continuing·net income·discontinued 모두 Yes\n'income from continuing operations' / 'net income' → face 필수, Yes\n'discontinued operations' → per-share 공시 필수(Yes), 위치는 face or notes 선택\n'must be presented on the face of the I/S' → 위치 질문 → discontinued 제외(continuing·net income만)",
    trap: "discontinued operations EPS를 불필요(No)로 착각 → 주석에 둘 수 있다는 '위치 유연성'을 '보고 면제'로 혼동. 표시는 여전히 필수(Yes)\ncontinuing operations EPS를 누락 → continuing ops는 미래 예측 기준이라 오히려 가장 필수, face 강제\n위치(face vs notes)와 표시 여부(report)를 혼동 → 질문이 무엇을 묻는지 먼저 구분\n둘 다 No로 보는 오류",
    one_sentence: "report 여부는 continuing·net income·discontinued 모두 Yes; 위치만 continuing·net income은 face 강제, discontinued는 face/notes 선택.",
    example: "'EPS should be reported for discontinued ops? / continuing ops?' → Yes / Yes (정답 D)\n위치 변형: 'on the face of I/S?' → continuing ops Yes, net income Yes, discontinued ops는 face or notes(선택)",
    key_formula: "report 필수(Yes): continuing ops EPS, net income EPS, discontinued ops EPS\nface 강제: continuing ops, net income\nface or notes 선택: discontinued ops",
    speed: "US GAAP EPS 필수 공시 = continuing ops / net income / discontinued ops(있으면) 모두 per-share 표시 → report 여부면 전부 Yes → 정답 D | 위치를 물으면 discontinued만 face/notes 선택",
    context_background: "[EPS를 손익 항목별로 공시하는 이유]\nEPS는 투자자가 '주식 1주가 얼마를 벌었나'를 보는 핵심 지표다. US GAAP은 이익의 지속성(persistence)을 구분해 per-share로 보여주길 요구한다.\n- income from continuing operations: 앞으로도 반복될 이익 → 미래 예측의 기준 → 가장 중요 → face 필수\n- net income: 최종 성과 → face 필수\n- discontinued operations: 일회성, 미래 반복 안 됨 → 투자자가 '이 부분은 빼고 봐야겠다'고 판단하도록 per-share 공시하되, 본문/주석 위치는 선택 허용\n\n[2축 분리가 핵심]\n축1(보고 여부): 셋 다 필수(should) → Yes/Yes/Yes\n축2(위치): continuing ops·net income은 face 강제, discontinued ops는 face or notes 선택\n→ 이 문제처럼 'should be reported for'를 물으면 위치와 무관하게 셋 다 Yes. discontinued를 주석에 둘 수 있다는 것은 '안 해도 된다'가 아니라 '위치만 유연하다'는 의미.\n\n[정답 도출]\nDiscontinued operations: Yes / Income from continuing operations: Yes → 정답 D(Yes/Yes)\nA(No/Yes): discontinued를 보고 면제로 착각한 함정.",
  },

  // [EPS_011] Dilutive Test — Per-Unit Incremental Effect vs Basic EPS
  // RULE    : 증분효과 = (1단위 분자증가) ÷ (1단위 신주) vs basic EPS / 작으면 dilutive, 크면 anti
  // TRIGGER : "which security is dilutive" + basic EPS → 증권별 증분효과 비교 / CB 세후, PS 세전 / 전환조건 없으면 제외
  // TRAP    : 증분효과 > basic인데 dilutive로 착각 / CB에 (1−t) 누락 / PS에 (1−t) 잘못 곱함 / 이율과 전환비율 혼동
  {
    topic_id: "EPS_011",
    category: "EPS",
    topic_name: "Dilutive Test — Per-Unit Incremental Effect vs Basic EPS",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Dilutive Test — Per-Unit Incremental Effect vs Basic EPS",
    rule: "여러 증권의 dilutive 여부 판별: 각 증권의 1단위당 증분효과 = (1단위당 분자 증가액) ÷ (1단위당 신주수)를 basic EPS와 비교. 증분효과 < basic EPS → dilutive(EPS 끌어내림). 증분효과 > basic EPS → anti-dilutive(끌어올림) → 제외.\n[분자] CB(전환사채): 액면 × 이율 × (1−t) = 세후 이자절감(이자는 세금공제). CP(전환우선주): par × 배당률 = 세전 배당절감, (1−t) 곱하지 마라(배당은 세금공제 안 됨).\n[분모] 1단위당 전환 보통주 수(CB: $1,000당 N주 / CP: 우선주 1주당 N주).\n[제외] 전환 조건 없는 증권은 분모로 못 바뀌어 후보 아님.\n[포함 순서] dilutive한 것만 증분효과 작은 순서대로 sequential 추가, EPS가 더 내려갈 때까지.",
    trigger: "which security is dilutive | basic earnings per share | tax rate | convertible bonds | convertible preferred | shares per $1,000 bond | convertible into N shares\n'which security is dilutive' + basic EPS 주어짐 → 각 증권 증분효과 vs basic EPS 비교\n'X% convertible bonds ... N shares per $1,000' → ($1,000 × X% × (1−t)) ÷ N\n'Y%, $par convertible preferred ... N shares each' → ($par × Y%) ÷ N  (세금 무시)\n증분효과 < basic → dilutive / > basic → anti-dilutive\n전환 조건 없는 preferred/일반증권 → 후보 제외",
    trap: "증분효과가 basic EPS보다 큰데 dilutive로 착각 → 큰 값은 EPS를 올려 anti-dilutive\nCB 이자절감에 (1−t) 안 곱하는 오류 → 채권은 반드시 세후\nPS 배당절감에 (1−t) 잘못 곱하는 오류 → 우선주 배당은 세전(세금공제 안 됨)\n이율(%)과 전환비율(주수) 혼동 → 'X% bonds'의 %는 액면에 곱하는 이율(분자), 'N shares per $1,000'는 전환비율(분모). 서로 다른 자리\n전환 조건 없는 우선주를 후보로 포함 → 분모로 못 바뀌면 dilutive 판단 불가, 제외\n'전환하면 무조건 EPS 내려간다'는 착각 → 증분효과가 basic보다 크면 오히려 올라감",
    one_sentence: "각 증권의 (1단위 분자증가 ÷ 1단위 신주)를 basic EPS와 비교 → 작으면 dilutive; CB는 세후 이자절감, PS는 세전 배당절감.",
    example: "basic EPS $1.29, t=30%\nA: 전환조건 없음 → 제외\nB: $1,000×10%×0.7=$70 ÷ 20주 = $3.50 > 1.29 → anti\nC: $100×6%=$6 ÷ 4주 = $1.50 > 1.29 → anti (배당은 세금 X)\nD: $1,000×7%×0.7=$49 ÷ 40주 = $1.225 < 1.29 → dilutive ✅",
    key_formula: "증분효과 = (1단위 분자 증가액) ÷ (1단위 신주수)\nCB 분자 = 액면 × 이율 × (1 − t)   [세후]\nCP 분자 = par × 배당률            [세전, 세금 무시]\ndilutive ⇔ 증분효과 < basic EPS",
    speed: "각 증권 증분효과 = (CB: 액면×이율×(1−t) / PS: par×배당률) ÷ 1단위 신주수 → basic EPS와 비교 → < basic이면 dilutive | 예) $1,000×7%×0.7÷40 = $49÷40 = $1.225 < $1.29 → dilutive",
    context_background: "[Dilutive의 의미]\nDilutive = 그 증권을 보통주로 전환했다고 가정하면 EPS가 내려가는 것. 투자자에게 '최악의 경우 주당이익이 이만큼 희석될 수 있다'를 보여주기 위해 dilutive 증권만 포함해 diluted EPS를 만든다.\n\n[증분효과 = 1단위당 비율]\n각 증권을 '전환 시 분자에 더해지는 금액 ÷ 분모에 더해지는 주식수'로 환산. 새로 들어오는 주식들이 '평균보다 낮은 EPS'를 벌면 전체 평균이 내려간다(dilutive), 높으면 올라간다(anti-dilutive). 그래서 증분효과를 기존 basic EPS와 비교한다.\n\n[CB vs PS — 세금 처리만 다르고 절차는 동일]\n- CB(전환사채): 이자는 세금공제 대상 → 전환 시 사라지는 이자절감을 세후로 = 액면 × 이율 × (1−t)\n- CP(전환우선주): 배당은 세금공제 안 됨 → 배당절감을 세전 그대로 = par × 배당률\n두 경우 모두 분자는 'par(액면) × rate'의 곱셈 구조로 동일하며, CB만 (1−t)를 추가로 곱한다.\n\n[총량이 불필요한 이유 — 약분]\n증권 총량(채권 장수·우선주 주수)은 분자(총 절감액)와 분모(총 전환주) 양쪽에 똑같이 곱해져 약분된다. 따라서 1단위(채권 1장 또는 우선주 1주) 기준 비율만 있으면 충분하고, 문제도 총 발행수를 주지 않는다.\n예) 우선주 1,000주: $6,000÷4,000주=$1.50 = 5,000주: $30,000÷20,000주=$1.50 (동일).\n\n[이율 vs 전환비율 — 다른 자리]\n'10% bonds'의 10%는 액면 $1,000에 곱하는 이자율(분자). '$1,000당 20주'는 전환비율(분모). 같은 $1,000 채권을 '돈을 얼마 아끼나(이자)'와 '주식 몇 개 만드나(전환)' 두 각도로 본 것. 둘을 혼동하지 말 것.\n\n[전환 조건 없는 증권 제외]\n전환 가능(convertible) 단서가 없는 일반 우선주는 보통주(분모)로 바뀔 수 없어 dilutive 후보가 아니다. 문제에서 전환 비율이나 전환 가능 여부가 없으면 즉시 제외.\n\n[정답 도출 — 원문]\nbasic EPS $1.60, t=25%\nA(전환조건 없는 9% 우선주): 제외\nB(8% CB, 25주): $1,000×8%×0.75=$60÷25=$2.40 > 1.60 → anti\nC(5% 전환우선주, 3주): $100×5%=$5÷3=$1.67 > 1.60 → anti\nD(6% CB, 30주): $1,000×6%×0.75=$45÷30=$1.50 < 1.60 → dilutive → 정답 D\n(D가 dilutive인 직관: 이율 낮아 분자 작고 전환주 많아 분모 큼 → 주당 효과가 basic보다 작아짐)\n\n[포함 순서]\n실제 diluted EPS 계산 시에는 dilutive 증권만, 증분효과가 작은 것부터 순서대로 하나씩 추가하며 EPS가 더 내려가는지 확인(sequential ranking). anti-dilutive 증권을 넣으면 EPS가 도로 올라가므로 제외.",
  },

  // [EPS_012] Diluted EPS — Out-of-the-Money Options Are Anti-dilutive (Diluted = Basic)
  // RULE    : 행사가 > 시장가(out-of-money) → anti-dilutive → 제외 → diluted = basic / WACSO = Σ(주식수 × 개월/12)
  // TRIGGER : "exercise price $X, market price $Y" → X vs Y / X>Y → 제외 / X<Y → TSM 포함
  // TRAP    : 옵션 무조건 희석 착각 / out-of-money인데 분모에 포함 / 개월 가중치 오류
  {
    topic_id: "EPS_012",
    category: "EPS",
    topic_name: "Diluted EPS — Out-of-the-Money Options Are Anti-dilutive (Diluted = Basic)",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'calculation',
    card_name: "Diluted EPS — Out-of-the-Money Options Are Anti-dilutive (Diluted = Basic)",
    rule: "스톡옵션의 diluted EPS 포함 여부는 행사가 vs 시장가로 결정.\n· 행사가 < 시장가 (in-the-money): 행사 유인 있음 → treasury stock method로 순증주 분모에 포함 (dilutive 가능)\n· 행사가 > 시장가 (out-of-the-money): 아무도 행사 안 함 → anti-dilutive → 제외 → diluted EPS = basic EPS\n(TSM으로 억지로 넣어도 순증주가 음수 → EPS를 올림 → anti-dilutive로 동일 결론)\nWACSO = Σ(주식수 × 유통 개월 ÷ 12). 개월 합은 항상 12.\nBasic(=diluted) EPS = 보통주 귀속 순이익 ÷ WACSO.",
    trigger: "stock options | incentive stock options | exercise price | market price | diluted EPS | out of the money | anti-dilutive\n'options, exercise price $X, market price $Y' → X vs Y 비교\n행사가 > 시장가 (out-of-the-money) → anti-dilutive → 제외 → diluted = basic\n행사가 < 시장가 (in-the-money) → treasury stock method로 순증주 포함\n'diluted EPS'인데 옵션 out-of-money → basic만 계산하면 끝\nWACSO = Σ(주식수 × 보유 개월 ÷ 12)",
    trap: "옵션을 '있으면 무조건 희석'으로 착각 → 행사가 > 시장가면 오히려 anti-dilutive(제외)\nout-of-the-money 옵션을 분모에 포함해 EPS를 낮추는 오류 → 제외해야 diluted = basic\n행사가 vs 시장가 방향 혼동 → 행사가가 높으면 out-of-money\nWACSO 개월 가중치 오류 → 각 구간 실제 유통 개월(예: 3/2/7)로 배분, 개월 합 = 12 확인(누적개월·역산 금지)\nincentive 여부에 현혹 → incentive든 아니든 판단은 행사가 vs 시장가",
    one_sentence: "행사가 > 시장가면 옵션은 out-of-the-money → anti-dilutive → 제외 → diluted EPS = basic EPS.",
    example: "Ian: NI $125,000, 옵션 10,000주 행사가 $30 > 시장가 $25 → out-of-money → 제외\nWACSO = 15,000×3/12 + 12,500×2/12 + 17,000×7/12 = 3,750 + 2,083 + 9,917 = 15,750\nbasic(=diluted) EPS = 125,000 ÷ 15,750 = $7.94",
    key_formula: "WACSO = Σ (주식수 × 유통 개월 / 12)   [개월 합 = 12]\nBasic EPS = 보통주 귀속 NI / WACSO\n옵션 out-of-money(행사가>시장가) → 제외 → Diluted EPS = Basic EPS",
    speed: "행사가 $30 > 시장가 $25 → out-of-the-money → anti-dilutive → diluted = basic | WACSO = 15,000×3/12 + 12,500×2/12 + 17,000×7/12 = 15,750 | 125,000 ÷ 15,750 = $7.94 → 정답 C",
    context_background: "[Diluted EPS의 목적]\nDiluted EPS는 희석 가능 증권을 전환·행사했다고 가정해 '최악의 주당이익'을 보여준다. 단, 실제로 희석시키는(EPS를 낮추는) 증권만 포함한다.\n\n[옵션의 in/out-of-the-money]\n스톡옵션은 행사가로 회사 주식을 살 권리다.\n· in-the-money (행사가 < 시장가): 싼값에 사서 비싸게 팔 수 있어 행사 유인 있음 → treasury stock method로 순증주를 분모에 더함(희석).\n· out-of-the-money (행사가 > 시장가): 시장에서 더 싸게 살 수 있는데 굳이 비싼 행사가로 살 이유 없음 → 아무도 행사 안 함.\n이 문제는 행사가 $30 > 시장가 $25 → out-of-the-money.\n\n[왜 out-of-money가 anti-dilutive인가]\nTreasury stock method로 억지로 계산해도, 행사가가 시장가보다 높으면 행사 현금으로 되사는 주식수가 신규 발행 주식수보다 많아져 순증주가 음수가 된다. 분모가 줄면 EPS가 올라가므로 anti-dilutive → diluted EPS 계산에서 제외. 따라서 분모에 더할 것이 없어 diluted EPS = basic EPS.\n\n[WACSO 계산]\n각 구간이 실제 유통된 개월수로 가중:\nJan 1~Mar 31: 15,000 × 3/12 = 3,750\nApr 1~May 31: 12,500 × 2/12 = 2,083\nJun 1~Dec 31: 17,000 × 7/12 = 9,917\n합 = 15,750 (개월 합 3+2+7 = 12 확인)\n\n[정답 도출]\nNI $125,000 ÷ 15,750 = $7.94 (basic = diluted)\n→ 정답 C $7.94. A($4.63)·B($7.35)·D($4.85)는 out-of-money 옵션을 분모에 포함하거나 가중치를 잘못 배분한 값.\n\n[반대 방향]\n행사가 < 시장가였다면 in-the-money → TSM 순증주 = n × (시장가 − 행사가)/시장가를 분모에 더해 diluted EPS < basic EPS가 된다.",
  },

  // ── EQUITY ─────────────────────────────────────────────────────────────────
  {
    topic_id: "EQUITY_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Small stock dividend — market value basis",
    rule: "Small stock dividend (<20–25%): debit Retained Earnings at market value per share; credit Common Stock at par; credit APIC for the remainder.",
    trigger: "small stock dividend | less than 20% | market value | retained earnings",
    trap: "Small dividend → market value basis; large dividend → par value basis. Opposite.",
    one_sentence: "Small stock dividend: debit Retained Earnings at market price per share.",
    example: "10% dividend / 10,000 shares / market $15 / par $1 → Dr. RE $15,000, Cr. CS $1,000, Cr. APIC $14,000",
  },
  {
    topic_id: "EQUITY_002",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Large stock dividend — par value basis",
    rule: "Large stock dividend (≥20–25%): debit Retained Earnings at par value only; credit Common Stock at par.",
    trigger: "large stock dividend | more than 25% | par value | retained earnings",
    trap: "Large dividend uses par value, NOT market value — reversed from small dividend treatment.",
    one_sentence: "Large stock dividend: debit Retained Earnings only at par value per new share.",
    example: "50% stock dividend / 10,000 shares / par $1 → Dr. RE $5,000, Cr. Common Stock $5,000",
  },
  {
    topic_id: "EQUITY_003",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Stock split — journal entry or not",
    rule: "Stock split: 주식 수 × split 배수 증가 / 주당 par ÷ split 배수 감소 / 총 par·총 equity 불변 / 분개 없음(memo only)\nReverse stock split: 주식 수 ÷ 배수 감소 / 주당 par × 배수 증가 / 총 par·총 equity 불변 / 분개 없음\n\n【New par 공식】\nStock split: New par = Old par ÷ split 배수\nReverse split: New par = Old par × reverse 배수\n\n【불변 항목】\n총 Par(= 주식 수 × 주당 par) / 총 Equity / B/S 금액\n\n【공시】\n분개 없음(memo only) ≠ 공시 없음\n→ 주석(note)에 split 사실·EPS 소급 조정 공시 필요",
    trigger: '"X for 1 stock split" + "par value" → new par = old par ÷ X\n"reverse stock split" → new par = old par × X\nFV 제시 → 함정, par value 계산 무관\n"no journal entry required" → memo only 확인',
    trap: "FV를 par value 계산에 사용 → 완전 무관\nPar value 그대로 유지 → total par가 배수로 늘어나는 오류\nOld par에서 빼는 오류 (나눠야 함)\nMemo only = 공시도 없다는 오해 → 주석 공시는 별도로 필요",
    one_sentence: "Stock splits require only a memo note; no balance sheet amounts change.",
    example: "4-for-1 split: 20,000주 × $8 par → 80,000주 × $2 par\n총 par: $160,000 → $160,000 (불변)\nNew par = $8 ÷ 4 = $2\n\nReverse 1-for-4 split: 80,000주 × $2 par → 20,000주 × $8 par\n총 par: $160,000 → $160,000 (불변)",
    speed: "New par = Old par ÷ split 배수 | FV 무시 | 총 par 불변 확인",
  },
  {
    topic_id: "EQUITY_004",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Treasury stock reissuance — where does the gain go",
    rule: "Reissue above cost: excess → APIC—Treasury Stock (not a gain). Reissue below cost: debit APIC—TS (to extent available), then Retained Earnings.",
    trigger: "treasury stock | reissued | above cost | below cost | gain | APIC",
    trap: "Gains on treasury stock NEVER go to income — always to APIC. Purchase/Repurchase는 그냥 원가로 기록 — APIC/RE 건드리지 않음. APIC—TS 잔액은 과거 reissue 초과분이 쌓인 것.",
    one_sentence: "Treasury stock reissuance gain → APIC; loss → APIC first, then Retained Earnings.",
    example: "① Reissue at $60 (cost $50): Dr. Cash 60 / Cr. T/S 50, Cr. APIC—TS 10\n② Reissue at $40 (cost $50, APIC—TS 잔액 $6): Dr. Cash 40, Dr. APIC—TS 6, Dr. RE 4 / Cr. T/S 50\n③ Repurchase at $70: Dr. T/S 70 / Cr. Cash 70 (차액 계산 없음)",
    context_background: "[Cost Method 자사주 4대 원칙]\n\n① Net income 절대 무관\n자사주 재발행 = owner transaction → I/S 통과 안 함\n재발행가 고가든 저가든 → Net income $0 영향\n\n② 재발행가 > 원가 → APIC-TS 증가\nDr. Cash / Cr. Treasury Stock(원가) + Cr. APIC-TS(초과분)\n→ RE 증가 불가 (자사주 거래에서 RE 증가 = 금지)\n\n③ 재발행가 < 원가 → APIC-TS 먼저 차감\nDr. Cash + Dr. APIC-TS(잔액 한도) / Cr. Treasury Stock(원가)\n→ APIC-TS 잔액 초과 시 → Dr. RE(나머지)\n→ 'All losses' 흡수 불가 — 잔액 부족하면 RE로 넘어감\n\n④ RE 변화 가능한 유일한 경우\n재발행가 < 원가 + APIC-TS 잔액 부족 시만 RE 감소\nRE 증가는 어떤 경우에도 불가",
  },
  {
    topic_id: "EQUITY_005",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Subscription receivable — asset or contra-equity",
    rule: "Subscription receivable (amounts owed by shareholders for stock subscriptions) is a contra-equity account, not an asset.",
    trigger: "subscription receivable | stock subscription | amount owed | contra-equity",
    trap: "Subscription receivable looks like a receivable but is a deduction from equity on the balance sheet.",
    one_sentence: "Subscription receivable reduces equity; it is not an asset.",
    example: "Subscription for $100,000 / $60,000 received → Dr. Cash $60,000, Dr. Subscription Receivable $40,000 (contra-equity), Cr. CS Subscribed $100,000",
  },
  {
    topic_id: "EQUITY_008",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Donated treasury stock — effect on total equity",
    rule: "주주 → 회사 자사주 기증: Dr.Treasury Stock(FV) / Cr.Donated Capital(FV). 둘 다 equity 계정 → 상쇄 → Total equity 변동 없음. 유통주식수 감소 → BV per share 상승. Donated Capital = APIC 유사 equity 계정(별도 또는 합산). 직접 매입(Dr.TS/Cr.Cash)은 Cash 유출 → Total equity 감소.",
    trigger: "donated treasury stock | shareholder donates | gift of stock | false statement | total equity | book value per share",
    trap: "'자사주 = equity 감소'라는 직관적 함정 → Donated Capital(+)이 Treasury Stock(−)을 상쇄. 직접 매입과 혼동 주의: 매입은 Cash 나가서 equity 감소 / 기증은 equity 내 재분류만.",
    one_sentence: "Donated treasury stock → Dr.TS / Cr.Donated Capital → equity 내부 상쇄 → Total equity 변동 없음.",
    example: "주주 기증 100주 FV $10 → Dr.Treasury Stock $1,000 / Cr.Donated Capital $1,000 / Total equity 변동 $0 / 유통주식수 −100 / BV per share ↑",
    speed: "① Donated → Dr.TS / Cr.Donated Capital ② 둘 다 equity → net $0 ③ 'Total equity decreases' = FALSE → 정답 A",
  },

  // [EQUITY_006] Appropriation of RE — No Mandatory Requirement
  // RULE    : RE Appropriation = 자발적 라벨링. US GAAP 강제 의무 없음 → 항상 $0
  // TRIGGER : "should be appropriated" → $0
  // TRAP    : 미선언 누적배당→RE 적립 착각 / Treasury stock 손실→RE appropriation 착각
  {
    topic_id: "EQUITY_006",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_name: "Appropriation of Retained Earnings — No Mandatory Requirement",
    rule: "RE Appropriation = RE 총액 변화 없이 '배당 제한' 라벨만 붙이는 것. US GAAP에서 강제 의무 없음. 미선언 누적 우선주 배당: 부채 아님(선언해야 부채) → RE 적립 의무 없음. 단 disclosure 필수(arrears 금액 주석 공시). Treasury stock 재발행 손실: APIC-TS에서 차감 → RE appropriation 무관. 어떤 상황도 강제 적립 요건 없다 → 항상 $0.",
    trigger: "'should be appropriated' | 'retained earnings appropriated' | cumulative preferred arrears | treasury stock loss\n→ US GAAP 강제 의무 없음 → $0",
    trap: "미선언 누적배당 → RE 적립 착각(1,000×$10×6%×3=$1,800). 선언해야 부채. 미선언은 JE 없음. Disclosure만 필요.\nTreasury stock 손실 → RE appropriation 착각($7,000). APIC-TS 차감이지 RE 적립 아님.\nA+D 합산($8,800) 오답.",
    one_sentence: "RE Appropriation = 자발적 라벨링. US GAAP 강제 의무 없음 → 항상 $0.",
    speed: "① 미선언 배당 → JE 없음, disclosure만\n② TS 손실 → APIC-TS 차감\n③ RE appropriation 강제 의무 없음\n→ $0 / 답 C",
    context_background: "[RE Appropriation이란]\nRE를 'Appropriated(적립)'와 'Unappropriated(미적립)'으로 구분 표시하는 것. RE 총액은 변하지 않고 라벨만 바뀐다. 배당 제한 의사를 표시하는 자발적 공시 수단.\n\n[미선언 누적 우선주 배당]\n선언(declare) 전까지는 부채 아님. JE 없음. 단, 투자자에게 잠재적 현금 유출 정보를 알려야 하므로 주석 공시 필수.\n\n[Treasury Stock 손실 처리]\nCost Method: 재발행가 < 취득원가 → Dr.APIC-TS (잔액 부족 시 RE 차감). 이는 RE 감소이지 RE appropriation 아님. Par Value Method: APIC-TS 계정 불필요. 취득 시 이미 자본 구성요소로 분해 완료.\n\n[배당 현금흐름 분류 — US GAAP]\n배당 지급 → CFF / 이자 수취·지급·배당 수취 → CFO.",
  },

  // [EQUITY_009] Property dividend — recorded at FV, retained earnings decreased
  // RULE    : Property dividend = FV 기준 기록 / RE = FV 기준 감소 / FV−원가 차액 = Gain on disposal(I/S)
  // TRIGGER : property dividend | fair value exceeded carrying amount | dividend declared | retained earnings | recorded at
  // TRAP    : D(Cost/Decreased): RE 감소는 맞지만 원가 기준 오류 / A·B(Increased): 배당은 항상 RE 감소
  {
    topic_id: "EQUITY_009",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Property dividend — recorded at FV, retained earnings decreased",
    rule: "Property dividend 2단계: ①선언 시: Dr.Investment(FV조정) / Cr.Gain on disposal + Dr.RE(FV기준) / Cr.Property Div Payable ②배분 시: Dr.Property Div Payable / Cr.Investment. 기록 기준 = FV(원가 아님). RE = FV 기준 감소(항상).",
    trigger: "property dividend | fair value exceeded carrying amount | dividend declared | retained earnings | recorded at",
    trap: "D(Cost/Decreased): RE 감소는 맞지만 원가 기준 오류 → 반드시 FV. A·B(Increased): 배당은 항상 RE 감소 — increased 절대 불가. Gain on disposal은 I/S 통해 RE로 오지만 배당 선언과 별개 거래.",
    one_sentence: "Property dividend = FV 기준 기록 + RE 감소; 차액(FV−원가)은 Gain on disposal(I/S).",
    example: "원가 $60K / FV $100K → Gain $40K(I/S) / RE −$100K(FV 기준) / 최종 Investment $0",
    speed: "① Property dividend → FV 기준 ② RE → 선언 시 감소 ③ FV / Decreased → 정답 C",
  },

  // [EQUITY_007] Stock issued for noncash consideration — common stock account
  {
    topic_id: "EQUITY_007",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Stock issued for noncash consideration — common stock account",
    rule: "Common stock account = par × shares (고정). 총 발행가액은 FV 측정 우선순위로 결정: 비상장 주식 → 서비스 FV 사용. 질문이 Common Stock이면 par × shares만, APIC면 서비스 FV − par × shares, 총 발행가액이면 서비스 FV.",
    trigger: '"common stock account increase" → par × shares만 | "not publicly traded" → 서비스 FV가 총 발행가액 기준 | "APIC" or "total equity" → 서비스 FV 기준',
    trap: "B ($6,000): 서비스 FV는 총 발행가액이지 Common Stock 계정 증가액 아님 | C ($4,000): book value → 어디에도 안 쓰이는 완전한 함정 | A ($1,000): (par−book) × shares → 의미 없는 계산",
    one_sentence: "질문 주체는 발행자(Cedar) B/S — 질문이 Common Stock이면 par × shares만; APIC면 서비스 FV − par; 총액이면 서비스 FV.",
    example: "비상장 주식 1,000주 × $5 par / 서비스 FV $6,000 → CS +$5,000 / APIC +$1,000 / Dr. Expense $6,000",
    context_background: "[질문의 주체 확인 — 필수]\n이 문제의 주체는 신주를 발행한 Cedar다. Morgan이 아니다.\nCedar 입장: 서비스를 받고 주식을 발행 → Cedar B/S equity 섹션에서 Common Stock이 얼마 증가하냐가 질문.\nMorgan 입장: 서비스를 제공하고 주식을 받음 → Morgan 장부는 이 문제와 무관.\n주체를 Morgan으로 혼동하면 질문 자체를 잘못 읽게 된다.\n\n[FV 측정 우선순위]\n비현금 대가로 주식 발행 시: ① 주식 FV 신뢰 가능 → 주식 FV 사용 ② 대가 FV 신뢰 가능 → 대가 FV 사용.\nCedar 주식은 비상장 → 시장가 없음 → 서비스 FV(48hrs × $125 = $6,000)가 총 발행가액 기준.\n\n[질문 유형별 계산 — 핵심]\nCommon Stock 증가액 → par × shares = $5,000 (이 문제의 질문)\nAPIC 증가액 → 서비스 FV − par × shares = $1,000\n총 발행가액(equity 증가) → 서비스 FV = $6,000\nbook value $4 → 어디에도 안 쓰임, 완전한 함정",
    context_trigger: "\"Cedar's common stock account increase\" → 발행자(Cedar) B/S 기준 → par × shares만 계산",
    rule_title: "Stock Issued for Noncash Consideration — 질문 유형별 계산",
    rule_items: [
      "[주체 확인] 질문은 발행자(Cedar) B/S 기준 — 서비스 제공자(Morgan) 장부와 무관",
      "[FV 측정] 비상장 주식 → 서비스 FV(48hrs × $125 = $6,000)가 총 발행가액 기준",
      "[질문별] Common Stock 증가액 → par × shares = $5,000 (이 문제의 질문)",
      "[질문별] APIC 증가액 → 서비스 FV − par × shares = $1,000",
      "[질문별] 총 발행가액 → 서비스 FV = $6,000",
      "JE: Dr. Service Expense $6,000 / Cr. Common Stock $5,000 / Cr. APIC $1,000",
    ],
    speed: "① 주체 확인 → Cedar(발행자) B/S ② 항목 확인 → common stock → par × shares ③ $5 × 1,000 = $5,000",
  },

  // [EQUITY_010] Retained earnings — constructive retirement + stock dividend + net income
  // RULE    : below par → APIC 적립, RE $0 / above par → APIC 차감 후 부족 시 RE 차감 / Small stock div → FV 기준 RE 감소
  // TRIGGER : constructive retirement | repurchased | par value | stock dividend fair value | retained earnings | below par | above par
  // TRAP    : B($1,020,000): stock dividend 누락 + APIC 차액 RE 가산 오류 / C($1,000,000): stock dividend 무시 / D($870,000): below par 차액을 RE 감소로 오산
  {
    topic_id: "EQUITY_010",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Retained earnings — constructive retirement + stock dividend + net income",
    rule: "Constructive retirement RE 영향: ①매입가 < par → 차액 APIC 적립 → RE $0 ②매입가 > par → APIC 먼저 차감 → 부족 시 RE 차감. Small stock dividend → FV 기준 RE 감소. RE = 시작 + NI − 배당.",
    trigger: "constructive retirement | repurchased | par value | stock dividend fair value | retained earnings | below par | above par",
    trap: "B($1,020,000): stock dividend 누락 + APIC 차액 $20K를 RE 증가로 오산. C($1,000,000): stock dividend 무시. D($870,000): below par 차액 $20K를 RE 감소로 오산 → below par는 APIC 적립, RE 무관.",
    one_sentence: "Constructive retirement below par → APIC 적립, RE $0 / above par → APIC 차감 후 부족 시 RE 차감.",
    example: "RE $600K + NI $400K − Stock div $150K = $850K / 자사주 $90<par$100 → APIC +$20K, RE 영향 없음",
    speed: "① 매입가 $90 < par $100 → RE $0(APIC 적립) ② Stock div FV $150K → RE −$150K ③ NI → RE +$400K ④ $600K+$400K−$150K = $850K → 정답 A",
  },

  // [EQUITY_011] Stock Retirement — Direct Retirement (Cost < Original Issue Price)
  // RULE    : 취득가 < 발행가 → Dr.Par + Dr.APIC / Cr.Cash (RE 무관)
  //           취득가 > 발행가 → Dr.Par + Dr.APIC(전액) + Dr.RE(초과분) / Cr.Cash
  // TRIGGER : 'acquired and retired' → owner transaction → Net income 즉시 탈락
  //           취득가 vs 발행가 비교 → APIC or RE 감소 결정
  // TRAP    : Net income 영향 있다는 선지(A/B) → owner transaction이라 항상 탈락
  //           RE 증가(D) → 자본 거래에서 RE 증가는 불가
  {
    topic_id: "EQUITY_011",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_EQUITY',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'conditional',
    card_name: "Stock Retirement — Direct Retirement (Cost vs Original Issue Price)",
    rule: "주식 직접 소각 분개:\n취득가 < 발행가: Dr. Common Stock(par) + Dr. APIC(차액) / Cr. Cash\n취득가 > 발행가: Dr. Common Stock(par) + Dr. APIC(전액) + Dr. RE(초과분) / Cr. Cash\nNet income: 항상 무관 (owner transaction → I/S 통과 안 함)\nRE 증가: 불가",
    trigger: "'acquired shares and retired' → Direct Retirement → Net income 선지 즉시 탈락\n취득가 < 발행가 → APIC 감소\n취득가 > 발행가 → APIC 전액 소진 후 RE 감소",
    trap: "Net income 증가/감소 선지 → owner transaction이라 항상 오답\nRE 증가 선지 → 자본 거래에서 RE 증가 불가\n취득가 < 발행가인데 RE 감소로 착각",
    one_sentence: "주식 소각 = owner transaction → Net income 무관 / 취득가 < 발행가 → APIC 감소.",
    speed: "'acquired and retired' 보이면 → Net income 선지 즉시 소거\n→ 취득가 vs 발행가 비교: 낮으면 APIC↓ / 높으면 RE↓",
    example: "발행 $18 / 소각 $12 → Dr. CS(par$5) $5 + Dr. APIC $7 / Cr. Cash $12 → APIC 감소",
  },

  // [EQUITY_012] Stock Warrants — APIC at Exercise Date, No Net Income Effect
  // RULE    : Warrant 발행 → APIC 변화 없음 / 행사 → APIC 증가(행사 시점) / NI = 항상 무관
  // TRIGGER : "exercised warrants" → APIC 행사 시점 인식 / 시장가 → 즉시 무시
  // TRAP    : Year 1 APIC 증가(A/C) / NI 감소(A/B) / 시장가 사용
  {
    topic_id: "EQUITY_012",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Stock Warrants — APIC at Exercise Date, No Net Income Effect",
    rule: "Stock Warrant 회계 처리:\n\n[발행 시점 (Issuance)]\n→ APIC 변화 없음\n→ Net income 변화 없음\n→ 메모 기록 또는 별도 APIC-Warrants 계정 (문제에서 단순 처리 시 무시)\n\n[행사 시점 (Exercise)]\nDr. Cash (exercise price × shares)\nCr. Common Stock (par × shares)\nCr. APIC (차액)\n→ APIC 증가 = 행사 시점 연도\n→ Net income 무관\n\n[시장가 정보]\n→ Exercise price와 무관. 항상 함정 데이터\n→ Exercise price(행사가)만 사용",
    trigger: '"exercised warrants on [date]" → APIC 증가 = 행사 시점 연도\n"issued warrants" → 발행 시점 → APIC 변화 없음\n시장가($X/$Y/$Z) 여러 개 제시 → 즉시 무시\nNet income 선지 등장 → equity transaction이라 즉시 소거',
    trap: "Year 1 APIC 증가: Warrant가 발행된 Year 1이지만 APIC는 행사 시점(Year 2)에 기록\nNI 감소: 주식 발행·행사 = owner transaction → I/S 통과 안 함 → Net income 무관\n시장가 사용: market price는 함정 데이터 — exercise price만 JE에 사용\n공통 함정: '발행했으니까 Year 1에 APIC 인식' 착각",
    one_sentence: "Warrant APIC = 행사 시점 인식 (발행 시점 아님); Net income = 항상 무관; 시장가 = 함정.",
    speed: "발행(Y1) → APIC 변화 없음\n행사(Y2) → APIC increased / NI No effect\n시장가 → 즉시 무시",
    context_background: "[Stock Warrant란]\n주주 등에게 일정 기간 내에 정해진 가격(exercise price)으로 주식을 살 수 있는 권리. 옵션과 유사.\n\n[발행 시점 회계]\n권리만 부여, 아직 현금 수령 없음 → APIC 변화 없음.\n\n[행사 시점 회계]\nDr. Cash (exercise price × 주수)\n    Cr. Common Stock (par × 주수)\n    Cr. APIC (차액)\n예: Exercise price $30 / par $20 → Cash $30 수령 / CS $20 / APIC $10\n\n[왜 Net income 무관인가]\n주식 발행·행사는 회사와 주주 간의 owner transaction.\nI/S는 외부 거래에서 발생하는 수익·비용만 기록.\nOwner transaction → equity 계정에만 영향, I/S 통과 안 함.\n\n[왜 시장가가 무관한가]\n시장가는 주식의 현재 거래 가격.\n행사가(exercise price)는 warrant 계약에서 정한 고정 가격.\nJE는 실제 현금 수령액(exercise price)을 기준으로 작성.\n시장가 $40이어도 exercise price $30만 Cash로 받음.",
    example: "Nov 2 Y1: Warrant 발행 → APIC 변화 없음\nMar 1 Y2: Warrant 행사 → Dr.Cash $30 / Cr.CS $20 / Cr.APIC $10 (per share)\nNet income Y1·Y2 → No effect\n시장가 $33/$35/$40 → 완전 무시",
  },

  // [EQUITY_013] APIC Increase Conditions – At Par vs Noncash Issuance
  // RULE    : APIC = 발행가 > par일 때만 / at par → APIC 없음 / FV > par → 초과분 APIC
  // TRIGGER : "issued at par" → APIC 없음 / "issued for services + FV" → APIC 발생
  // TRAP    : at par 발행에서 APIC 착각 / FV 전액 CS 처리
  {
    topic_id: "EQUITY_013",
    category: "Stockholders Equity",
    topic_name: "APIC Increase Conditions – At Par vs Noncash Issuance",
    rule: "【APIC 발생 조건】\nAPIC = 발행가 − par value (발행가 > par일 때만 발생)\n\n【발행 유형별 판단】\n① At par 발행 (현금)\n발행가 = par → 초과분 없음 → APIC 증가 ❌\nJE: Dr. Cash / Cr. Common Stock (par)\n\n② 비현금(서비스 등) FV 기준 발행\n총 발행가액 = FV of services\nCS = par × shares\nAPIC = FV − (par × shares) → 초과분 → APIC 증가 ✅\nJE: Dr. Expense(FV) / Cr. CS(par×sh) / Cr. APIC(초과분)\n\n【FV 측정 우선순위】\n비현금 대가 발행 시:\n① 주식 FV 신뢰 가능 → 주식 FV 사용\n② 대가(서비스) FV 신뢰 가능 → 대가 FV 사용",
    trigger: '"issued at par" → 발행가 = par → APIC 증가 없음\n"issued for services/noncash" + "fair value of $X" → FV > par → APIC 발생\n표 형식 두 날짜 비교 → 각각 독립 판단',
    trap: '"at par" 발행에서 APIC 있다고 착각 — par 초과분이 없으면 APIC 없음.\n서비스 수령 발행에서 APIC 없다고 착각 — FV > par → 초과분 → APIC 발생.\nFV 전액을 Common Stock으로 처리 — CS = par × shares만, 초과분은 APIC.',
    example: "Feb 1: at par 발행 → Dr. Cash $X / Cr. CS $X → APIC 없음\nMar 1: 서비스 FV $45,000, par $5 × 3,000sh = $15,000\nDr. Organization Cost $45,000\nCr. Common Stock $15,000\nCr. APIC $30,000 → APIC 증가 ✅",
    journal_entry: "Feb 1 (at par):\nDr. Cash [$par × shares]\nCr. Common Stock [$par × shares]\n\nMar 1 (noncash FV):\nDr. Organization Cost $45,000\nCr. Common Stock $15,000  (par $5 × 3,000sh)\nCr. APIC $30,000  (FV $45,000 − CS $15,000)",
    key_formula: "APIC = 발행가(or FV) − par × shares\nAt par → APIC = 0\nFV 기준 → APIC = FV − (par × shares)",
    speed: "APIC 발생 = 발행가 > par | at par → APIC 없음 | noncash FV > par → 초과분 APIC",
  },

  // [EQUITY_016] Cash Dividend — 3-Date Structure (Declaration / Record / Payment)
  // RULE    : RE 감소 = Declaration date / Record = 분개 없음 / Payment = Dr.Div Payable / Cr.Cash
  // TRIGGER : "retained earnings decreased on the date of" → Declaration
  // TRAP    : Record(D) → 주주 명부 확정, 분개 없음 / Payment(C) → Dividends Payable 제거만
  {
    topic_id: "EQUITY_016",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Cash Dividend — 3-Date Structure: When Does RE Decrease",
    rule: "Cash Dividend 3일 구조:\n\n① Declaration date (선언일) → RE 감소\n   Dr. Retained Earnings\n   Cr. Dividends Payable (부채 인식)\n\n② Record date (기준일) → 분개 없음\n   주주 명부만 확정 (누가 받을지 결정)\n\n③ Payment date (지급일) → 부채 소멸\n   Dr. Dividends Payable\n   Cr. Cash",
    trigger: '"retained earnings is decreased on the date of" → Declaration\n"date of record" → 분개 없음\n"date of payment" → Dr.Dividends Payable / Cr.Cash (RE는 이미 선언일에 감소)',
    trap: "C(Payment): 지급일에 RE 감소한다는 착각 → RE는 선언일에 이미 감소, 지급일은 부채 제거만\nD(Record): 기준일에 RE 감소한다는 착각 → Record date는 회계 분개 없음\nA(Declaration or record, whichever is earlier): Declaration이 항상 Record보다 먼저 → 논리 오류",
    one_sentence: "Cash dividend → RE 감소 = Declaration date; Record = 분개 없음; Payment = Dividends Payable 제거.",
    speed: "RE 감소 시점 = Declaration date 단 하나\nRecord → No JE / Payment → Dr.Div Payable / Cr.Cash",
    example: "Jan 15 선언: Dr.RE $100,000 / Cr.Dividends Payable $100,000\nFeb 1 기준일: 분개 없음\nFeb 28 지급: Dr.Dividends Payable $100,000 / Cr.Cash $100,000",
    context_background: "[3일 각각의 역할]\n\n① Declaration date (선언일)\n이사회 결의일. 배당 지급 의무 확정.\n→ 부채(Dividends Payable) 인식 + RE 감소.\n\n② Record date (기준일)\n배당금을 받을 주주 명부 확정일.\n이 날 주식을 보유한 주주만 배당 수령 자격.\n→ 회계 분개 없음. 행정적 날짜만.\n\n③ Payment date (지급일)\n실제 배당금 지급일.\n→ 선언일에 인식한 부채(Dividends Payable) 소멸.\n→ RE는 이미 선언일에 감소했으므로 추가 RE 변화 없음.\n\n[날짜 순서]\nDeclaration → Record → Payment 항상 이 순서.\nDeclaration이 Record보다 먼저임은 불변.",
  },

  // [EQUITY_014] Stock Rights – Issuance vs Exercise Accounting
  // RULE    : 발행 시 JE 없음 / 행사 시 CS(par×sh) + APIC(초과분) 증가
  // TRIGGER : "when the rights are issued" → CS/APIC No / "exercised" → CS/APIC Yes
  // TRAP    : 발행↔행사 시점 혼동 / "excess of par" 보고 발행 시 APIC 착각
  {
    topic_id: "EQUITY_014",
    category: "Stockholders Equity",
    topic_name: "Stock Rights – Issuance vs Exercise Accounting",
    rule: "【Stock Rights 발행 vs 행사 비교】\n\n발행 시 (Issuance)\n→ 무상(without consideration) 발행\n→ 받은 것 없음, 주식 발행 없음\n→ JE 없음\n→ CS/APIC 변동 없음\n\n행사 시 (Exercise)\n→ 주주가 권리 행사 + 현금 납입\n→ 실제 주식 발행\n→ JE 발생:\n   Dr. Cash (행사가 × 주수)\n   Cr. Common Stock (par × 주수)\n   Cr. APIC (초과분)\n→ CS↑(par×shares) / APIC↑(초과분)\n\n실효 시 (Expiration)\n→ 권리 미행사로 소멸\n→ JE 없음 (원래 발행 시도 JE 없었으므로)",
    trigger: '"rights issued without consideration" → 무상 발행 → JE 없음\n"when the rights are issued" → 발행 시점 → CS/APIC 모두 No\n"when the rights are exercised" → 행사 시점 → CS/APIC 모두 Yes\n"excess of par value" → 행사 시 APIC 발생 (발행 시 아님)',
    trap: "Rights 행사 시점 처리(CS↑/APIC↑)를 발행 시점으로 혼동.\n'excess of par value' 표현 보고 발행 시 APIC 증가 착각.\n무상 발행이라도 주석 등 뭔가 기록해야 한다는 착각.\n발행 시점(issued)과 행사 시점(exercised) 영어 표현 혼동.",
    example: "발행 시: JE 없음 → CS No / APIC No\n\n행사 시 (1,000주, 행사가 $15, par $5):\nDr. Cash $15,000\nCr. Common Stock $5,000  (par $5 × 1,000sh)\nCr. APIC $10,000  ($15,000 − $5,000)\n→ CS Yes / APIC Yes",
    journal_entry: "발행 시: No entry\n\n행사 시:\nDr. Cash [행사가 × shares]\nCr. Common Stock [par × shares]\nCr. APIC [초과분]\n\n실효 시: No entry",
    key_formula: "Rights 발행 시 → JE 없음\nRights 행사 시 → CS = par × shares / APIC = 행사가 − par × shares",
    speed: "Rights 발행 시 → JE 없음 → CS/APIC 모두 No | 행사 시 → CS↑(par) / APIC↑(초과분)",
  },

  // [EQUITY_017] Shares Outstanding — Issued vs Outstanding, TS Resold, Stock Split
  // RULE    : Outstanding = Issued − Treasury / TS resold → Outstanding 복귀 / Split = Outstanding 기준
  // TRIGGER : "issued" + "outstanding" 동시 제시 → 차이 = Treasury / "resold treasury" → +outstanding
  // TRAP    : Split을 Issued 기준 적용(C=250K) / TS resold 누락(B=230K) / Split 전 그대로(A=117.5K)
  {
    topic_id: "EQUITY_017",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Shares Outstanding — Issued vs Outstanding, Treasury Stock Resold, Stock Split",
    rule: "Outstanding 주식수 계산 구조:\nOutstanding = Issued − Treasury\n\n① 신주 발행(Issued) → Outstanding +\n② 자사주 매입 → Outstanding − / Issued 변화 없음\n③ 자사주 재발행(Resold) → Outstanding + (issued 변화 없음)\n④ Stock split → Outstanding 기준으로만 배수 적용\n\n[Stock split 기준 확인]\nSplit = Outstanding shares 기준\n→ Issued 전체에 적용하면 오답 (Treasury 포함되어 과대 계산)",
    trigger: '"issued X shares" + "outstanding Y shares" → 차이 = Treasury 보유량\n"resold treasury stock" → Outstanding +N (Issued 변화 없음)\n"2-for-1 stock split" → Split 직전 Outstanding × 2\nSplit 기준 = Outstanding (Issued 전체 아님)',
    trap: "A(117,500): Split 미적용 → Split 전 outstanding 그대로\nB(230,000): TS resold 2,500주를 outstanding으로 복귀시키지 않고 115,000 × 2 계산\nC(250,000): Split을 Issued 기준(125,000 × 2) 적용 → Treasury 포함 오류\n공통 함정: 'Issued 125,000 × 2 = 250,000' → Split은 Outstanding 기준",
    one_sentence: "Outstanding = Issued − Treasury; TS resold → Outstanding 복귀; Split = Outstanding 기준 배수 적용.",
    speed: "① Jan 1 Outstanding: 100,000\n② Mar 1 +15,000 issued: 115,000\n③ Jun 1 +2,500 TS resold: 117,500\n④ Sep 1 × 2 split: 235,000",
    example: "Issued 110,000 / Outstanding 100,000 → Treasury 10,000\nMar +15K issued / Jun +2.5K resold → Outstanding 117,500\nSep 2-for-1 split → 117,500 × 2 = 235,000",
    context_background: "[Issued vs Outstanding 구분]\nIssued = 회사가 발행한 총 주식수 (자사주 포함)\nOutstanding = 외부 주주가 보유한 주식수 (= Issued − Treasury)\n\n[자사주 재발행(Resold) 효과]\n자사주를 시장에 다시 팔면:\n→ 주식이 외부 주주에게 이전\n→ Treasury 감소 / Outstanding 증가\n→ Issued는 변화 없음 (새로 발행한 게 아님)\n\n[Stock split 기준]\nSplit = 외부 주주 보유 주식을 나누는 것\n→ 기준 = Outstanding (외부 주주 보유분)\n→ Treasury는 외부에 없으므로 Outstanding에 미포함\n→ Issued 전체에 적용하면 Treasury까지 split → 과대 계산\n\n[C 오답 이유]\nIssued 110,000 + 15,000 = 125,000\n125,000 × 2 = 250,000 → Treasury 10,000도 split에 포함한 오류\n실제 Treasury는 split 대상 아님",
  },

  // [EQUITY_025] Cumulative Preferred Stock — Dividends in Arrears: Disclosure vs Liability vs EPS
  // RULE    : 미선언 → Disclosure(부채 아님) / 선언 후 → Dividends Payable / EPS → 선언 무관 차감
  // TRIGGER : "cumulative preferred" + "did not declare" → Disclosure / "in arrears" → 누적 계산
  // TRAP    : Accrued liability 선택 / EPS 논리를 B/S에 적용 / 지급액 차감 누락
  {
    topic_id: "EQUITY_025",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Cumulative preferred dividends in arrears — disclosure vs liability vs EPS",
    rule: "누적적 우선주 미선언 배당 처리:\n\n[B/S 처리]\n선언(declare) 전 → 법적 의무 미확정\n→ Dividends Payable (부채) 아님\n→ 주석(footnote) 공시만\n\n선언 후 → 법적 의무 확정\n→ Dr. Retained Earnings / Cr. Dividends Payable\n→ 부채 인식\n\n[공시 금액 계산]\n= 연간 배당 × 미배당 연수 - 실제 지급액\n= (par × 주수 × 배당률) × 연수 − 지급\n\n[EPS 처리 — 목적이 다름]\n누적 우선주 → 선언 여부 무관 NI에서 차감\n이유: 경제적 실질 (우선주 몫은 선언 전에도 확보됨)\n→ EPS = (NI − 누적 우선주 배당) ÷ 가중평균 보통주\n\n[핵심 구분]\nB/S 부채 = 법적 형식 기준 (선언 필요)\nEPS 차감 = 경제적 실질 기준 (선언 불필요)",
    trigger: '"cumulative preferred stock" + "did not declare" → 부채 아님 → Disclosure\n"dividends in arrears" → 선언 전 = disclosure / 선언 후 = liability\n"EPS" + "cumulative preferred" → 선언 무관 차감\n공시 금액 = 연간배당 × 미배당연수 − 지급액',
    trap: "미선언 arrears를 Accrued liability로 처리: 선언 전 → 부채 아님 → Disclosure\n누적 연도 계산 누락: 여러 해 미선언이면 전부 누적해서 공시\n지급액 차감 누락: 지급한 금액은 arrears에서 차감\nEPS 논리를 B/S에 적용: EPS와 B/S는 목적이 달라 처리 기준 다름",
    one_sentence: "누적 우선주 미선언 배당 → B/S 부채 아님(Disclosure) / EPS엔 선언 무관 차감 — 목적이 다름.",
    speed: "미선언 → Disclosure (부채 X) | 금액 = 누적 arrears − 지급액 | EPS는 선언 무관 차감",
    context_background: "[왜 EPS와 B/S 처리가 다른가]\n\nEPS 목적: '보통주 주주한테 돌아갈 이익이 얼마냐'\n→ 누적 우선주는 선언 여부와 무관하게 우선주 몫이 먼저 확보됨\n→ 그래야 보통주 EPS가 정확해짐\n→ 경제적 실질 반영\n\nB/S 부채 목적: '법적으로 지급 의무가 확정됐냐'\n→ 선언 전엔 회사가 공식 결의 안 함\n→ 법적 의무 없음 → 부채 인식 불가\n→ 법적 형식 반영\n\n[실전 함정]\n문제에 'did not declare'가 보이면\n→ 무조건 Disclosure (부채 아님)\n→ 금액만 제대로 계산하면 됨",
    example: "2,000주 × $50 par × 6% = $6,000/년\nY2 미선언: $6,000 누적\nY3 미선언 + $3,000 지급:\n공시 arrears = $6,000 + $6,000 − $3,000 = $9,000 Disclosure",
  },

  // [EQUITY_024] Treasury Stock — Par Value Method: Full Reacquisition JE (No Prior APIC-TS)
  // RULE    : 1주당 TS=par / APIC=(발행가-par) / RE=(재취득가-발행가) → × 주수 | 첫 재취득 → APIC-TS $0 → RE 직행
  // TRIGGER : "par value method" + "no prior stock repurchases" → APIC-TS $0 → RE 즉시 차감
  // TRAP    : TS를 재취득가로 기록 / APIC-TS 사용 / Cost method 혼용 / 총액 먼저 계산
  {
    topic_id: "EQUITY_024",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Par value method reacquisition — per-share structure vs cost method",
    rule: "Par Value Method 재취득 1주당 고정 구조:\n\nDr. Treasury Stock       = par\nDr. APIC — C/S          = 발행가 − par  (발행 취소)\nDr. RE (플러그)          = 재취득가 − 발행가\n    Cr. Cash             = 재취득가\n\n→ × 주수 = 총액\n\n[APIC-TS 없을 때 (첫 재취득)]\n재취득가 > 발행가 초과분 → APIC-TS 잔액 $0 → RE 즉시 차감\n\n[Cost method와 핵심 차이]\nPar method  → 1주당 구조 분해 / 발행가 필요 / 재취득 시 정산\nCost method → 취득원가 총액 묶어둠 / 재발행 시 정산\n\n[재발행 시 (Par method)]\n신규 발행처럼 처리 → Dr. Cash / Cr. TS(par) + Cr. APIC(재발행가-par)\n취득원가 기억 불필요",
    trigger: '"par value (legal) method" → 1주당 구조 분해: TS=par / APIC=발행가-par / RE=초과분\n"no prior stock repurchases" → APIC-TS = $0 → RE 즉시 차감\n"originally issued for $X per share" → 발행가 = APIC 계산 기준\n"what accounts are debited" → Dr. 3개: TS + APIC + RE',
    trap: "TS를 재취득가로 기록 — Par method에서 TS는 par만\nAPIC-TS에서 초과분 차감 — 첫 재취득 시 APIC-TS = $0, RE로 직행\nCost method 혼용 — TS에 취득원가 전액 묶는 것은 Cost method\n총액으로 먼저 계산 — 반드시 1주당 구조 분해 먼저, × 주수는 마지막",
    one_sentence: "Par method: 1주당 TS=par / APIC=발행가-par / RE=초과분 → × 주수 | 첫 재취득 → APIC-TS 없음 → RE 직행.",
    speed: "1주당: TS=par / APIC=(발행가-par) / RE=(재취득가-발행가) → × 주수\n첫 재취득 → APIC-TS $0 → RE 직행",
    example: "Grove 60,000주 재취득, par $4, 발행가 $22, 재취득가 $27 (첫 재취득):\n1주당: TS $4 / APIC $18 / RE $5 / Cash $27\n× 60,000: Dr.TS $240,000 / Dr.APIC $1,080,000 / Dr.RE $300,000 / Cr.Cash $1,620,000",
    context_background: "[Par method 철학: 재취득 = 발행 취소]\n발행 시: Dr.Cash $22 / Cr.CS(par) $4 / Cr.APIC $18\n재취득 시: 이를 역방향으로 되돌림\n→ TS $4(par 복원) + APIC $18(반환) + RE $5(초과분 플러그)\n\n[Cost method 철학: 재취득 = 임시 보관]\n재취득 시: Dr.TS $1,620,000 / Cr.Cash $1,620,000\n→ 취득원가 통째로 묶어두고 재발행 시 정산\n→ APIC-TS: 재발행가 > 원가 차익 / RE: 차손 (APIC-TS 소진 후)\n\n[1주당 구조가 핵심인 이유]\nPar method는 발행가를 기억해야 함\n→ APIC 제거액 = (발행가 − par) × 주수\n→ 발행가 모르면 계산 불가\nCost method는 취득원가만 기억\n→ 발행가 불필요\n\n[APIC-TS 없는 경우]\n첫 재취득 또는 누적 APIC-TS 잔액 $0\n→ 재취득가 > 발행가 초과분 전액 → RE 즉시 차감\n→ RE는 줄어들 수 있지만 증가는 불가 (owner transaction 원칙)",
    journal_entry: "Par method 재취득:\nDr. Treasury Stock     [par × N]\nDr. APIC — C/S         [(발행가−par) × N]\nDr. Retained Earnings  [(재취득가−발행가) × N]\n    Cr. Cash           [재취득가 × N]\n\nPar method 재발행:\nDr. Cash               [재발행가 × N]\n    Cr. Treasury Stock [par × N]\n    Cr. APIC — C/S     [(재발행가−par) × N]",
  },

  // [EQUITY_023] Treasury Stock — Par Value Method: APIC Decrease at Reacquisition
  // RULE    : APIC 감소 = (발행가 − par) × shares / RE 차감 = (재취득가 − 발행가) × shares / APIC-TS 계정 없음
  // TRIGGER : "par value method" + "originally issued for $X" → 발행 시 APIC 역산
  // TRAP    : RE 감소분을 APIC로 혼동 / cost method 로직 적용 / APIC-TS 계정 탐색
  {
    topic_id: "EQUITY_023",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Treasury stock reacquisition — par value method APIC decrease",
    rule: "Par value method 재취득 분개 구조:\nDr. Treasury Stock = par × shares\nDr. APIC (발행 시 APIC 전액 제거) = (발행가 − par) × shares\nDr. Retained Earnings (플러그) = (재취득가 − 발행가) × shares\nCr. Cash = 재취득가 × shares\n\n[Cost method와 핵심 차이]\nPar method: APIC-TS 계정 없음 / 재취득 시 RE 즉시 차감\nCost method: APIC-TS 계정 있음 / RE는 재매각 시에만 차감",
    trigger: '"par value method" + "originally issued for $X" → APIC 감소 = (발행가 − par) × shares\n"decrease in APIC" → APIC 항목만 분리 (RE 감소분과 혼동 금지)\n"APIC-TS" 계정 → par value method에는 존재하지 않음',
    trap: "RE 감소분(재취득가 − 발행가) × shares를 APIC 감소로 혼동\nCost method 로직 적용: 재취득 시 APIC 변동 없다고 착각\nAPIC + RE 합산 금액을 APIC만 묻는 문제에 답으로 제출\nAPIC-TS 계정 탐색 → par value method에는 없음",
    one_sentence: "Par method: APIC 감소 = 발행 시 APIC 역추적 / RE 감소 = 초과분 플러그 / APIC-TS 없음.",
    speed: "APIC 감소 = (발행가 − par) × shares | RE 감소 = (재취득가 − 발행가) × shares | APIC-TS 계정 없음",
    journal_entry: "재취득 시:\nDr. Treasury Stock (par × N)  \nDr. APIC [(발행가 − par) × N]  ← 이 금액이 APIC 감소\nDr. Retained Earnings [(재취득가 − 발행가) × N]  ← 플러그\nCr. Cash (재취득가 × N)",
    example: "100주, par $6, 발행가 $7, 재취득가 $10:\nDr. TS $600 / Dr. APIC $100 / Dr. RE $300 / Cr. Cash $1,000\nAPIC 감소 = $100 (정답) / RE 감소 = $300 (별도)",
    context_background: "[Par value method 핵심 개념]\n재취득 = 최초 발행 취소(reverse)처럼 처리\n→ TS는 par만 기록 (취득원가 전체 아님)\n→ 발행 시 받은 APIC 즉시 제거\n→ 재취득가 > 발행가 초과분 → RE 즉시 차감\n\n[Cost method와 비교]\n| 항목 | Par method | Cost method |\n| TS 기록 | par × 주수 | 취득원가 전액 |\n| APIC-TS | 없음 | 재매각 시 생성 |\n| RE 차감 | 재취득 시 | 재매각 시(손실 시만) |",
  },

  // [EQUITY_018] Ending Retained Earnings — Build-up from Income Since Incorporation Less Dividends
  // RULE    : RE = 누적 순이익 − 현금배당 − 현물배당 / 자사주(cost) 원가초과 재매각 이익 → APIC-TS, RE 무관
  // TRIGGER : "income since incorporation" → RE 시작점 / "cash + property dividends" → 둘 다 차감 / "excess over cost, cost method" → APIC, 제외
  // TRAP    : 현물배당 누락(C/D) / 자사주 초과분을 RE 가산(A/D)
  {
    topic_id: "EQUITY_018",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Ending Retained Earnings — Build-up from Income Since Incorporation Less Dividends",
    rule: "기말 Retained Earnings = (설립 이후 누적 순이익) − (현금배당) − (현물배당). 'Total income since incorporation'은 매년 closing(Income Summary → RE)을 통해 RE에 누적되어 온 금액 → RE 계산의 출발점. 현금배당·현물배당(declaration date FV) 모두 RE 직접 차감. Cost method 자사주를 원가 초과로 재매각한 차액 이익 → APIC-TS로 처리, RE 무관(owner transaction이라 손익 아님). 단 원가 미만 재매각 손실은 APIC-TS 잔액 먼저 차감 후 부족 시 RE 차감(비대칭).",
    trigger: "income since incorporation | cash dividends paid | property dividends distributed | excess of proceeds over cost | treasury stock cost method | retained earnings\n'Total income since incorporation' → RE 시작점(누적 NI 전체, 한 해 아님)\n'cash dividends paid' + 'property dividends distributed' → 둘 다 RE 차감\n'excess of proceeds over cost of treasury stock sold ... cost method' → APIC-TS, RE 무관(더하지도 빼지도 말 것)\n질문 'retained earnings' → 누적NI − 현금배당 − 현물배당",
    trap: "현물배당(property dividend)을 RE에서 빼먹음 → 현금배당만 차감하고 끝내는 오류(예: 420,000−130,000=290,000)\n자사주 원가초과 재매각 이익을 RE에 가산 → cost method에서 초과분은 APIC-TS, RE에 절대 안 닿음\n'income since incorporation'을 당해 1년치로 착각 → 설립 이후 누적치\n[비대칭 주의] 자사주 원가 미만 재매각 손실은 APIC-TS 잔액 소진 후 RE 차감 가능 → 이익 방향은 RE 무관이지만 손실 방향은 RE 닿을 수 있음",
    one_sentence: "RE = 누적 순이익 − 현금배당 − 현물배당; cost method 자사주 원가초과 재매각 이익은 APIC-TS라 RE 무관.",
    example: "Row: 누적NI $420,000 − 현금배당 $130,000 − 현물배당 $30,000 = RE $260,000\n자사주 원가초과 $110,000 → APIC-TS(RE 무관) → 제외\n(현금 미만 재매각이었다면: APIC-TS 먼저 차감 → 부족분만 RE 차감)",
    journal_entry: "자사주 원가초과 재매각(cost method):\nDr. Cash\n  Cr. Treasury Stock (취득 원가)\n  Cr. APIC — Treasury Stock (원가 초과분)\n\n원가 미만 재매각:\nDr. Cash\nDr. APIC — Treasury Stock (잔액 한도)\nDr. Retained Earnings (APIC-TS 부족 시)\n  Cr. Treasury Stock (취득 원가)",
    key_formula: "Ending RE = Total income since incorporation − Cash dividends − Property dividends(FV)\n(자사주 cost-method 원가초과 재매각 이익은 제외 → APIC-TS)",
    speed: "RE = 누적NI − 현금배당 − 현물배당 = 420,000 − 130,000 − 30,000 = $260,000 | 자사주 원가초과 110,000 → APIC-TS, 손대지 말 것 → 정답 C",
    context_background: "[Retained Earnings의 본질]\nRE(이익잉여금)는 회사가 설립 이후 벌어들인 누적 순이익 중 배당으로 주주에게 분배하지 않고 회사에 남긴 몫이다. 따라서 RE = 누적 순이익 − 누적 배당.\n\n[왜 'income since incorporation'이 출발점인가]\n매 회계연도 말 closing entry로 그 해 net income이 Income Summary를 거쳐 RE로 대체된다(Income Summary → Retained Earnings). 따라서 '설립 이후 누적 순이익'은 사실상 그동안 RE에 쌓여온 총액과 같다. 한 해 I/S 숫자가 아니라 설립부터 현재까지의 누적분이라는 점이 핵심.\n\n[각 항목의 RE 영향 판단]\n① Total income since incorporation $420,000 → RE 가산(출발점)\n② Cash dividends paid $130,000 → RE 차감 (배당 = 이익의 주주 분배)\n③ Property dividends distributed $30,000 → RE 차감 (현물배당도 declaration date FV로 RE 감소, 현금배당과 동일 취급)\n④ Excess of proceeds over cost of treasury stock sold (cost method) $110,000 → RE 무관\n   자사주 거래는 회사와 주주 간 자본거래(owner transaction)이지 영업성과가 아니다. 원가 초과 재매각 차액은 APIC — Treasury Stock으로 가감하며 손익(RE)에 영향 없다.\n\n[자사주 cost method 비대칭]\n- 원가 초과 재매각(이익 방향): 전액 APIC-TS → RE에 절대 안 닿음\n- 원가 미만 재매각(손실 방향): 먼저 APIC-TS 잔액에서 차감 → APIC-TS가 부족하면 그때 RE 차감\n이익은 RE 무관, 손실은 APIC 소진 후 RE 가능 — 방향에 따라 비대칭이라는 점이 함정.\n\n[정답 도출]\nRE = $420,000 − $130,000 − $30,000 = $260,000\n자사주 초과분 $110,000은 APIC-TS이므로 제외.",
  },

  // [EQUITY_019] Treasury Stock — Par Value Method: APIC Calculation
  // RULE    : par value method = 거래마다 par·APIC 즉시 분해 / 발행 +(발행가−par) / 취득 −(원발행가−par), 초과분 RE / 재발행 +(재발행가−par)
  // TRIGGER : "par value method" + treasury → 취득 시 원발행 APIC 제거, 초과분 RE, 재발행 신규 APIC
  // TRAP    : 취득 APIC 제거 누락(D) / cost method와 혼동 / 취득엔 원발행가·재발행엔 현재가 기준
  {
    topic_id: "EQUITY_019",
    category: "Stockholders' Equity",
    topic_name: "Treasury Stock — Par Value Method: APIC Calculation",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Treasury Stock — Par Value Method: APIC Calculation",
    rule: "Par value method = 자사주 취득을 부분 소각(constructive retirement)으로 보아 거래 시점마다 par·APIC를 즉시 분해(시간 무관, 월할 없음).\n· 발행: APIC += (발행가 − par) × 주수\n· 취득: 그 주식이 발행될 때 받았던 APIC만 제거 = (원발행가 − par) × 주수. 취득가가 (par + 원APIC)를 초과하면 다른 주식 APIC를 끌어오지 않고 즉시 RE 차감\n· 재발행: 신규 발행처럼 APIC += (재발행가 − par) × 주수\n취득은 '과거 발행가' 기준(되감기), 재발행은 '현재가' 기준(새 발행) → 곱하는 차액이 다름. cost method와 달리 APIC-TS 공용 완충계정 안 씀.",
    trigger: "par value method | treasury stock | reissued | additional paid-in capital | constructive retirement\n'par value method' + 자사주 → 취득 시 원발행 APIC 제거 + 초과분 RE, 재발행 시 신규 APIC\n발행: APIC += (발행가 − par) × 주수\n취득(par method): APIC −= (원발행가 − par) × 주수, 초과분 → RE\n재발행: APIC += (재발행가 − par) × 주수\nAPIC는 자본거래 → 월할 계산 없음, 거래 시점 전액",
    trap: "D: 취득 시 APIC 제거(−$25,000)를 누락 → par value method는 취득 시점에 반드시 APIC 차감\nB: 취득 차액 배분 오류(RE에 $10,000은 넣되 APIC $25,000 제거 안 함)\nA: Jan 5 발행 APIC만 보고 취득·재발행 변동 누락\n[cost method 혼동] cost method라면 취득 시 APIC 안 건드리고 재발행 차액만 APIC-TS로. par value method는 취득 시점부터 APIC 분해\n[기준 혼동] 취득은 원발행가($15) 기준 $5 제거, 재발행은 현재가($20) 기준 $10 신규 → 두 거래의 곱셈 기준이 다름\n[초과분] 취득 주식 본인 발행 APIC를 다 쓴 뒤 초과분은 다른 주식 APIC 안 끌어오고 즉시 RE (cost method는 APIC-TS 먼저 소진 후 RE)",
    one_sentence: "par value method APIC = 발행차액 + 재발행차액 − 취득 시 원발행 APIC; 취득 초과분은 즉시 RE, 월할 없음.",
    example: "Asp: par $10\nJan 5 발행 20,000@$15 → APIC +($15−10)×20,000 = +$100,000\nJul 14 취득 5,000@$17 → APIC −($15−10)×5,000 = −$25,000, 초과 ($17−15)×5,000=$10,000 → RE\nDec 27 재발행 5,000@$20 → APIC +($20−10)×5,000 = +$50,000\n누적 APIC = 100,000 − 25,000 + 50,000 = $125,000",
    journal_entry: "Jan 5 발행:\nDr. Cash 300,000 / Cr. Common stock 200,000 / Cr. APIC 100,000\n\nJul 14 취득 (par value method):\nDr. Treasury stock 50,000 (par×5,000)\nDr. APIC 25,000 (원발행 APIC 환원)\nDr. Retained earnings 10,000 (취득가 − 원발행가 초과분)\n  Cr. Cash 85,000\n\nDec 27 재발행 (신규 발행 취급):\nDr. Cash 100,000\n  Cr. Treasury stock 50,000\n  Cr. APIC 50,000",
    key_formula: "발행 APIC = (발행가 − par) × 주수\n취득 APIC 제거 = (원발행가 − par) × 주수 ; 초과분(취득가 − 원발행가)×주수 → RE\n재발행 APIC = (재발행가 − par) × 주수\n누적 APIC = Σ 위 항목",
    speed: "par value method APIC 누적 = 발행차액 + 재발행차액 − 취득 시 원발행 APIC = ($5×20,000) + ($10×5,000) − ($5×5,000) = 100,000 + 50,000 − 25,000 = $125,000 → 정답 C",
    context_background: "[Cost method vs Par value method]\nTreasury stock 회계엔 두 방법이 있다.\n· Cost method(더 흔함): 자사주를 원가 한 덩어리로 보고, APIC는 재발행 차액에서만 건드린다(APIC-TS 공용 완충계정 사용). 취득 시점엔 APIC를 건드리지 않음.\n· Par value method: 자사주 취득을 '그 주식의 부분 소각(constructive retirement)'으로 보아, 취득 즉시 그 주식이 원래 발행될 때 잡았던 par·APIC를 거꾸로 풀어낸다.\n\n[par value method 3거래 처리]\n① 발행: 정상 발행. APIC += (발행가 − par) × 주수.\n② 취득: 그 주식이 '발행 때 받은 APIC'만 제거 = (원발행가 − par) × 주수. 취득가가 (par + 원APIC)를 초과하면, 다른 주식이 가진 APIC를 끌어오지 않고 그 초과분을 즉시 RE에서 차감. (취득 주식 본인의 발행 APIC만 환원 가능 — 소각하는 건 그 주식이지 남의 주식이 아니므로)\n③ 재발행: 과거 발행가와 무관하게 신규 발행처럼 처리. APIC += (재발행가 − par) × 주수.\n\n[취득 vs 재발행의 기준이 다른 이유]\n취득은 '과거 발행을 되돌리는' 거래 → 기준 = 원발행가($15) → 제거 = ($15−$10)×5,000 = $25,000.\n재발행은 '완전히 새로운 발행' → 기준 = 재발행가($20) → 신규 = ($20−$10)×5,000 = $50,000.\n그래서 같은 5,000주인데 곱하는 차액이 $5와 $10으로 다르다. 과거는 취득 시점에 이미 청산되었으므로 재발행엔 $15가 끼어들지 않는다.\n\n[월할 없음 / APIC-CS 한 덩어리]\nAPIC는 자본거래라 시간에 걸쳐 발생하는 손익이 아니므로 월할(time apportionment) 없음 — 거래 시점에 전액 반영. 이 문제의 APIC는 본질적으로 APIC-CS(보통주 발행초과금) 한 덩어리이며, par value method엔 cost method의 APIC-TS 완충계정이 (AICPA 객관식 수준에선) 없다.\n\n[복수 발행단가 시 — 취득 대상 식별]\n취득 시 제거하는 APIC는 '그 주식이 발행될 때 받은 APIC'이므로, 발행 단가가 여러 종류면 어느 주식을 취득하는지가 중요하다. 자사주는 물리적으로 어느 묶음인지 식별이 어려워, 문제가 대상을 명시하지 않으면 가중평균 APIC 단가로 제거한다. (단일 발행가이거나 대상을 명시한 깔끔한 형태로 주로 출제됨)\n\n[정답 도출 — Asp]\nJan 5: +$100,000 / Jul 14: −$25,000 (초과 $10,000은 RE) / Dec 27: +$50,000\n→ 누적 APIC = $125,000 (정답 C)\nD($150,000)=취득 APIC 제거 누락 / B($140,000)=취득 배분 오류 / A($100,000)=발행분만",
  },

  // [EQUITY_020] Property Dividend — RE Effect After Nominal Accounts Closed
  // RULE    : RE 순효과 = −FV + Gain(FV−BV) = −BV / "after nominal closed" → Gain 포함
  // TRIGGER : "property dividend" + "after nominal accounts closed" → Gain도 RE 반영
  // TRAP    : Gain 무시 → $78,000 오답 / "after nominal closed" 조건 무시
  {
    topic_id: "EQUITY_020",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Property dividend RE effect — after nominal accounts closed",
    rule: "Property dividend RE 순효과:\n① 선언일 FV로 측정\n② FV > BV → Gain = FV − BV → I/S 인식\n③ 'After nominal accounts closed' → Gain이 RE로 마감\n④ RE 순변동 = −FV + Gain = −BV\n\n현금/주식 배당: Gain 없음 → RE = −배당금액만\nProperty dividend 전용: 외부 자산 처분 → 미실현이익 실현",
    trigger: '"property dividend" + "after nominal accounts closed" → Gain 포함 순효과\n"carrying amount $X / fair value $Y" → Gain = Y − X\n"after all nominal accounts are closed" → I/S 항목도 RE에 반영',
    trap: "$78,000 decrease: Gain 무시 → nominal 마감 전 숫자. 'after nominal closed' 조건 위반.\n$0: 배당은 항상 RE 감소.\n$18,000 increase: Gain만 계산, 배당 차감 누락.",
    one_sentence: "Property dividend RE 순효과 = −FV + Gain = −BV. 'After nominal closed' = Gain도 RE 포함.",
    speed: "RE 순효과 = −FV + (FV−BV) = −BV = −$60,000 | 'after nominal closed' → Gain 포함 필수",
    example: "BV $60,000 / FV $78,000\nGain = $78,000 − $60,000 = $18,000\nRE 순변동 = −$78,000 + $18,000 = −$60,000 (= −BV)",
    journal_entry: "① Dr. RE $78,000 / Cr. Property Dividend Payable $78,000\n② Dr. Marketable Securities $18,000 / Cr. Gain on disposal $18,000\n→ Gain $18,000 → I/S → nominal 마감 → RE +$18,000\n→ RE 순변동 = −$78,000 + $18,000 = −$60,000",
    key_formula: "RE 순변동 = −FV + Gain = −FV + (FV − BV) = −BV\nGain = FV − BV (FV > BV일 때)",
    context_background: "[배당 유형별 RE 효과]\n현금 배당: RE −현금 / Gain 없음\n주식 배당: RE −FV(small) or −par(large) / Gain 없음 (자기 주식 발행)\n현물 배당: RE −FV + Gain / 외부 자산 처분 → FV≠BV이면 Gain 실현\n\n[경제적 실질]\n배당은 형태 무관하게 RE 차감. Property dividend 추가 효과: BV로 갖고 있던 자산을 FV로 처분하는 것과 동일 → 미실현이익 실현 → Gain → I/S → RE.\n\n['After nominal accounts closed' 의미]\nNominal accounts = I/S 계정(Gain 포함). 마감 후 RE에 반영됨.\n이 조건이 없으면 Gain을 RE에 포함하지 않는 함정 가능.\n\n[핵심 공식]\nRE 순변동 = −FV + (FV−BV) = −BV\n→ Property dividend RE 감소 = 항상 BV",
  },

  // [EQUITY_021] Donated Treasury Stock — SE 불변 / BV per share 증가 / FV 기록
  // RULE    : 기증 자사주 → SE 총액 불변 / 유통주식수 감소 / BV per share 증가 / FV 기록
  // TRIGGER : "donated stock from shareholder" → Donated Capital 인식, SE 불변
  // TRAP    : SE 감소로 착각(일반 자사주 매입과 혼동) / BV per share 증가 False로 착각
  {
    topic_id: "EQUITY_021",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Donated treasury stock — total SE unchanged, BV per share increases",
    rule: "주주→회사 주식 기증(Donated treasury stock):\n① SE 총액 불변 (현금 유출 없음)\n② 유통주식수 감소\n③ BV per share 증가 (SE 동일 ÷ 주식수 감소)\n④ FV로 기록\n\n분개: Dr. Treasury Stock(FV) / Cr. Donated Capital\n\n일반 자사주 매입과 구분:\n일반: Dr. Treasury Stock / Cr. Cash → SE 감소\n기증: Dr. Treasury Stock / Cr. Donated Capital → SE 불변",
    trigger: '"donated stock" + "from shareholder to company" → SE 불변, Donated Capital\n"total SE reduced" → False (대가 없음)\n"book value per share" → 유통주식수 감소 + SE 동일 → 증가',
    trap: "SE 감소로 착각 → 일반 자사주 매입(현금 지출)과 혼동. 기증은 현금 유출 없음.\nBV per share higher를 False로 착각 → 유통주식수 감소 + SE 동일 = 증가 → True.",
    one_sentence: "Donated stock → SE 불변 | 유통주식수 감소 | BV per share 증가 | FV 기록 | 'SE reduced' = False",
    speed: "Donated stock → SE 불변 (대가 없음) → 'SE reduced' = False → D",
    journal_entry: "Dr. Treasury Stock (FV)   XX\n  Cr. Donated Capital         XX\n→ SE 내부 이동, 총액 불변",
    context_background: "[일반 자사주 매입 vs 기증 자사주]\n일반 매입: 현금 지출 → SE 감소\n기증: 대가 없음 → SE 불변 (Donated Capital 인식)\n\n[BV per share 증가 이유]\nBV per share = 총 SE ÷ 유통주식수\n기증 후: 총 SE 동일, 유통주식수 감소\n→ 분모 감소 → BV per share 증가\n\n[FV 기록 이유]\n무상으로 받은 자산도 FV로 기록 (자산 인식의 일반 원칙)",
  },

  // [EQUITY_022] Treasury Stock Par Value Method — Repurchase > Issue Price
  // RULE    : TS=par / APIC C/S=발행가−par / 초과=APIC T/S 먼저→없으면 RE
  // TRIGGER : "par value method" + "no prior repurchases" → APIC T/S=$0 → RE
  // TRAP    : TS를 발행가로(B) / cost method 혼동(C) / APIC T/S 잔액 있다고 가정(D)
  {
    topic_id: "EQUITY_022",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Treasury stock par value method — repurchase > issue price, no APIC T/S balance",
    rule: "Par value method 재매입가 분해:\n① Treasury Stock = par × shares\n② APIC C/S = (원발행가 − par) × shares (역전)\n③ 초과분 = (재매입가 − 원발행가) × shares\n   → APIC T/S 잔액 먼저 차감\n   → 잔액 없으면 RE 차감\n\n'No prior repurchases' → APIC T/S = $0 → 초과분 전액 RE\n\nCost method와 구분: cost method → Dr. Treasury Stock(전액 재매입가)",
    trigger: '"par value (legal) method" → 3계정 분해\n"no repurchases to date" → APIC T/S = $0 → 초과분 전액 RE\n"repurchase price > issue price" → 초과분 발생',
    trap: "TS를 발행가($28) 기준으로 기록 → par value method에서 par value만.\nCost method처럼 TS에 전액 → par method 아님.\nAPIK T/S 잔액 있다고 가정 → 'no prior repurchases' = APIC T/S $0.",
    one_sentence: "Par method: TS=par / APIC C/S=발행가−par / 초과→APIC T/S 먼저→없으면 RE",
    speed: "TS=$375K(75K×$5) / APIC C/S=$1,725K(75K×$23) / RE=$300K(75K×$4) | APIC T/S $0",
    example: "발행가 $28 (par $5 + APIC $23) / 재매입가 $32 / 주수 75,000\nTS: 75,000 × $5 = $375,000\nAPIC C/S: 75,000 × $23 = $1,725,000\n초과: 75,000 × $4 = $300,000 → APIC T/S $0 → RE\nCr. Cash: 75,000 × $32 = $2,400,000",
    journal_entry: "Dr. Treasury Stock        $375,000\nDr. APIC—C/S           $1,725,000\nDr. Retained Earnings     $300,000\n  Cr. Cash                        $2,400,000",
    key_formula: "초과분 = (재매입가 − 원발행가) × shares\nAPIK T/S 잔액 있으면 거기서 먼저 / 없으면 RE",
    context_background: "[Par value method vs Cost method]\nCost method: Dr. Treasury Stock(전액 재매입가). 간단.\nPar value method: 3계정 분해. 법정자본(par) 명확히 표시.\n\n[초과분 처리 우선순위]\n① APIC T/S 잔액 → 먼저 차감\n② 잔액 부족하면 → RE 차감\n이번 문제: 최초 매입 → APIC T/S = $0 → 전액 RE\n\n[재발행 시 반대 처리]\n재매입가 < 발행가 → 차이만큼 APIC T/S 증가\n이 잔액이 나중에 재매입가 > 발행가 시 사용됨",
  },

  // [EQUITY_015] Dividends — Three Key Dates (Declaration, Record, Payment)
  // RULE    : Declaration date → 부채 발생 / Date of record → 분개 없음 / Payment date → 부채 소멸
  // TRIGGER : "declared dividends" → Declaration date → Dividends Payable 계상
  // TRAP    : Date of record / Payment date / Year-end를 부채 발생일로 혼동
  {
    topic_id: "EQUITY_015",
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Dividends — Three Key Dates (Declaration, Record, Payment)",
    rule: "【배당 3대 날짜】\n\n① Declaration date (선언일)\n→ 이사회 공식 결의\n→ 법적 의무 발생\n→ Dr. Retained Earnings / Cr. Dividends Payable\n→ 부채 생성\n\n② Date of record (기준일)\n→ 배당 수령 주주 명단 확정\n→ 분개 없음\n\n③ Payment date (지급일)\n→ 현금 지급\n→ Dr. Dividends Payable / Cr. Cash\n→ 부채 소멸",
    trigger: '"declared dividends" → Declaration date → Dividends Payable 부채 발생\n"shareholders of record on [날짜]" → Date of record → 분개 없음\n"dividend was paid on [날짜]" → Payment date → 부채 소멸',
    trap: "Date of record → 분개 없음, 부채 발생 아님\nPayment date → 부채 소멸일, 생성일 아님\nYear-end(Dec 31) → 배당과 무관\n'liability created' 묻는 문제 → 반드시 Declaration date",
    example: "Mar 10 선언 → Dr. RE / Cr. Dividends Payable (부채 생성)\nApr 5 기준일 → 분개 없음\nMay 20 지급 → Dr. Dividends Payable / Cr. Cash (부채 소멸)",
    journal_entry: "Declaration date:\nDr. Retained Earnings [배당 총액]\nCr. Dividends Payable [배당 총액]\n\nPayment date:\nDr. Dividends Payable [배당 총액]\nCr. Cash [배당 총액]",
    speed: '"declared" → Declaration date → 그 날짜 = 정답\nRecord date / Payment date / Year-end → 모두 탈락',
  },

  // [EQUITY_008] Stock Split + Cash Dividend — Shares and Dividend Calculation
  // RULE    : Split 후 주식 수 기준으로 배당 계산 / FV는 cash dividend 무관
  // TRIGGER : "2-for-1 stock split" + "cash dividend per share" → split 후 주식 수 먼저
  // TRAP    : pre-split 주식 수($50K) / FV 포함($850K·$950K)
  {
    topic_id: "EQUITY_008",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Stock Split + Cash Dividend — Shares and Dividend Calculation",
    rule: "Stock split: 주식 수만 증가, 순자산 변화 없음, 분개 없음(memo only). Cash dividend = split 후 주식 수 × 주당 배당금. Split 시 FV → cash dividend 계산 무관 (small stock dividend용). EPS 계산 시 stock split·stock dividend는 소급 적용(retroactive) — 기초부터 전체 기간에 적용. 반면 신주 발행은 월할 적용(weighted average).",
    trigger: '"2-for-1 stock split" + "cash dividend per share" → split 후 주식 수 먼저 계산\nSplit 시 FV 제시 → cash dividend 계산에서 무시 (small stock dividend용 함정)\nEPS + stock split → 소급 적용 (기초부터 전체 기간 / 신주 발행과 반대)',
    trap: "TRAP 1: $50,000 (C) → pre-split 주식 수(100,000) × $0.50. Split 반영 누락\nTRAP 2: $850,000 (D) → FV $80을 계산에 포함. Split 시 FV는 cash dividend와 무관\nTRAP 3: $950,000 (A) → FV + cash dividend 혼합 계산. FV는 dividend 계산에 절대 불포함\n공통 함정: Split 시 FV를 보고 계산에 포함하려는 충동 → FV는 small stock dividend용, cash dividend와 무관",
    one_sentence: "Cash dividend = split 후 주식 수 × 주당 배당금; split 시 FV는 무관.",
    example: "100,000주 × 2-for-1 split = 200,000주 / $0.50 × 200,000 = $100,000 dividends",
    context_background: "Stock split(주식 분할)은 주식 수만 늘리고 주당 액면가를 낮추는 것으로, 주주의 총 지분 가치나 회사의 순자산에는 아무런 변화가 없다. 분개도 없고 재무제표 금액도 변하지 않는다 — memo entry만 한다.\n\n[Cash dividend 계산]\nSplit 이후 늘어난 주식 수를 기준으로 계산. Split 시점의 공정가치(FV)는 cash dividend 계산과 무관. FV는 small stock dividend(시가 기준 RE 차감)에서만 사용하는 개념이다.\n\n[소급 적용 — EPS에서 특히 중요]\nStock split과 stock dividend는 EPS 계산 시 소급 적용(retroactive)한다 — 기초(beginning of year)부터 전체 기간에 적용된 것처럼 처리. 비교 재무제표의 과거 EPS도 재계산 필요.\n\n반면 신주 발행은 소급 적용하지 않고 발행일부터 월할 계산(weighted average)한다.\n\n이벤트별 처리 방식:\n- Stock split / Stock dividend → 소급 적용 (기초부터 전체 기간)\n- 신주 발행 → 월할 적용 (발행일부터만)\n- 자사주 매입 → 월할 적용 (매입일부터 차감)",
    context_trigger: '"2-for-1 stock split" + "cash dividend" → split 후 주식 수 기준 / FV 무시\nEPS + stock split → 소급 적용 확인',
    rule_title: "Stock Split 처리 원칙",
    rule_items: [
      "Stock split: 주식 수 증가 / 순자산 불변 / 분개 없음(memo only)",
      "Cash dividend = split 후 주식 수 × 주당 배당금",
      "Split 시 FV → cash dividend 계산 무관 (small stock dividend용)",
      "EPS 계산: stock split·stock dividend → 소급 적용 (기초부터 전체 기간)",
      "EPS 계산: 신주 발행 → 월할 적용 (발행일부터만)",
      "EPS 계산: 자사주 매입 → 월할 적용 (매입일부터 차감)",
    ],
    speed: "① 2-for-1 split → 주식 수: 100,000 × 2 = 200,000주\n② Cash dividend: 200,000 × $0.50 = $100,000 → B\n③ FV $80 → 무시 (cash dividend 계산 무관)\n④ C 소거: pre-split 주식 수 / D·A 소거: FV 포함 오류",
  },

  {
    topic_id: "EQUITY_018",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Treasury Stock — Par Value Method vs Cost Method full comparison",
    rule: "【Par Value Method】\nT/S 장부가 = par × 주수 (항상 고정)\n\nBuy Back:\n  Dr. T/S (par × sh) / Dr. APIC–C/S (원래 issuance spread × sh) / Dr. RE (plug) / Cr. Cash\n  → APIC–C/S = 원래 발행 spread 기준 (재매입가 기준 아님)\n  → RE = Cash − T/S(par) − APIC–C/S = plug\n  → RE 조정 시점: Buy Back 때\n\nRe-sell / Reissue:\n  Dr. Cash / Cr. T/S (par × sh) / Cr. APIC–C/S (plug)\n  → 이익/손실 개념 없음 — 새로 발행하는 것처럼 처리\n  → APIC–T/S 계정 없음\n  → 손실이어도 RE 건드리지 않음\n\n【Cost Method】\nT/S 장부가 = 원가(재매입가) × 주수 (항상 고정)\n\nBuy Back:\n  Dr. T/S (원가 × sh) / Cr. Cash\n  → 전액 퉁 — APIC 개념 없음, RE 건드리지 않음\n\nRe-sell 이익 (재매도가 > 원가):\n  Dr. Cash / Cr. T/S (원가 × sh) / Cr. APIC–T/S (초과분)\n  → RE 증가 절대 불가\n\nRe-sell 손실 (재매도가 < 원가):\n  Dr. Cash + Dr. APIC–T/S (잔액 먼저) + Dr. RE (부족분 plug) / Cr. T/S (원가 × sh)\n  → RE 조정 시점: Re-sell 손실 때만",
    trigger: "par value method | cost method | treasury stock | repurchase | buyback | re-sell | reissue | APIC–T/S | two methods comparison",
    trap: "TRAP 1 (Par Buy Back): APIC–C/S = 재매입가 − par 아님 → 원래 issuance spread × 주수\nTRAP 2 (Par Re-sell): 손실이어도 RE 건드리지 않음 — 이익/손실 개념 자체 없음\nTRAP 3 (Cost Re-sell 이익): 초과분 → APIC–T/S (RE 증가 절대 불가)\nTRAP 4 (Cost Re-sell 손실): APIC–T/S 잔액 먼저 차감 → 부족분만 RE\nTRAP 5: 두 방법 Total Equity 항상 동일 — 계정 배분만 다름",
    one_sentence: "Par: T/S=par 기준, RE는 Buy Back 때 / Cost: T/S=원가 기준, RE는 Re-sell 손실 때만.",
    example: "25,000주 $5 par $8 발행 / 재매입 1,500주 @$12 / 재매도 500주 @$10, 500주 @$15\n\n[Par — Buy Back]\nDr. T/S 7,500 / Dr. APIC–C/S 4,500 / Dr. RE 6,000 / Cr. Cash 18,000\n  T/S = $5×1,500=7,500 / APIC = $3×1,500=4,500 / RE = 18,000−7,500−4,500=6,000\n\n[Par — Re-sell @$10]\nDr. Cash 5,000 / Cr. T/S 2,500 / Cr. APIC–C/S 2,500\n\n[Par — Re-sell @$15]\nDr. Cash 7,500 / Cr. T/S 2,500 / Cr. APIC–C/S 5,000\n\n[Cost — Buy Back]\nDr. T/S 18,000 / Cr. Cash 18,000\n\n[Cost — Re-sell @$10 손실]\nDr. Cash 5,000 / Dr. RE 1,000 / Cr. T/S 6,000\n  T/S = $12×500=6,000 / RE = 6,000−5,000=1,000\n\n[Cost — Re-sell @$15 이익]\nDr. Cash 7,500 / Cr. T/S 6,000 / Cr. APIC–T/S 1,500\n\n[기말 Equity 비교]\n                  Par      Cost\nCommon Stock    125,000  125,000\nTreasury Stock   (2,500)  (6,000)\nAPIC–C/S         78,000   75,000\nAPIC–T/S              —    1,500\nRE               (6,000)  (1,000)\nTotal           194,500  194,500",
    context_background: "[Par Value Method 철학]\n'자사주를 되사온 순간 일단 소각한 것처럼' 처리한다.\nBuy Back 시 원래 발행 구성요소(par + APIC + RE)로 완전 분해.\nRe-sell 시 새로 발행하는 것처럼 처리 → 이익/손실 개념 없음.\nAPIC–T/S 계정 자체가 존재하지 않음.\nRE 조정이 Buy Back 때 발생하는 이유: 재매입가 > par+APIC 초과분을 RE로 흡수.\n\n[Cost Method 철학]\n'자사주를 원가로 들고 있다가 판다'는 개념.\nBuy Back 시 원가 전액을 T/S 하나로 퉁 처리 — APIC 건드리지 않음.\nRe-sell 시 원가와 재매도가 차이가 실질 손익 → APIC–T/S 또는 RE 조정.\nRE 조정이 Re-sell 손실 때만 발생하는 이유: 원가보다 낮게 팔 때만 손실 확정.",
    context_trigger: "par value method vs cost method 비교 문제\nbuy back + re-sell 분개 동시 요구\nequity section 비교표 채우기",
    rule_title: "Treasury Stock 두 방법 핵심 분기",
    rule_items: [
      "Issuance: 두 방법 완전 동일 — Dr.Cash / Cr.CS(par) / Cr.APIC–C/S",
      "Par Buy Back: T/S=par / APIC–C/S=원래spread / RE=plug → RE조정=Buy Back 때",
      "Par Re-sell: Cash / T/S(par) / APIC–C/S(plug) — 이익손실 무관, APIC–T/S 없음",
      "Cost Buy Back: T/S=원가전액 / Cash — 단 2줄, RE 안 건드림",
      "Cost Re-sell 이익: Cash / T/S(원가) / APIC–T/S(초과) — RE 증가 불가",
      "Cost Re-sell 손실: Cash+APIC–T/S(먼저)+RE(부족분) / T/S(원가)",
      "Total Equity: 두 방법 항상 동일 — 계정 배분만 다름",
    ],
    journal_entry: "【Par — Buy Back】\nDr. Treasury Stock    par × sh\nDr. APIC–C/S          spread × sh\nDr. Retained Earnings plug\n    Cr. Cash          원가 × sh\n\n【Par — Re-sell】\nDr. Cash              재매도가 × sh\n    Cr. Treasury Stock par × sh\n    Cr. APIC–C/S      plug\n\n【Cost — Buy Back】\nDr. Treasury Stock    원가 × sh\n    Cr. Cash          원가 × sh\n\n【Cost — Re-sell 이익】\nDr. Cash              재매도가 × sh\n    Cr. Treasury Stock 원가 × sh\n    Cr. APIC–T/S      초과분\n\n【Cost — Re-sell 손실】\nDr. Cash              재매도가 × sh\nDr. APIC–T/S          잔액 한도\nDr. Retained Earnings 부족분\n    Cr. Treasury Stock 원가 × sh",
    key_formula: "Par T/S = par × sh\nPar APIC–C/S (Buy Back 차감) = (issuance price − par) × sh\nPar RE plug = Cash − T/S(par) − APIC–C/S(spread)\nCost T/S = cost(repurchase price) × sh\nCost APIC–T/S (Re-sell 이익) = 재매도가×sh − 원가×sh\nCost RE plug (Re-sell 손실) = 원가×sh − 재매도가×sh − APIC–T/S 잔액",
    speed: "① Par: T/S=par퉁 / APIC=원래spread / RE=plug → Buy Back 때 RE 정리\n② Par Re-sell: 무조건 Cash / T/S(par) / APIC–C/S(plug) — 손익 따지지 않음\n③ Cost: Buy Back은 T/S=원가 2줄 끝\n④ Cost Re-sell: 원가기준 T/S release → 차이가 APIC–T/S(이익) or RE(손실)\n⑤ Total Equity 검산: 두 방법 합계 동일",
  },

  // ── CF ─────────────────────────────────────────────────────────────────────
  {
    topic_id: "CF_001",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Gain on disposal — how to treat in operating activities",
    rule: "Gain on sale of assets: subtract the gain from CFO (non-cash operating adjustment). The actual cash proceeds go to Investing Activities separately.",
    trigger: "gain on sale | disposal | indirect method | cash flow from operations",
    trap: "Never double-count: remove the gain from CFO AND report full cash proceeds in CFI.",
    one_sentence: "Gain on disposal is backed out of CFO; the actual cash received shows up in CFI.",
    example: "NI includes $8,000 gain on sale → CFO: −$8,000 adjustment; CFI: +full proceeds separately",
  },
  {
    topic_id: "CF_002",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Equity method income — how to treat in operating activities",
    rule: "Equity method income is non-cash → deduct from CFO under indirect method. Actual dividends received from the investee = cash → add to CFO.",
    trigger: "equity method | investee income | operating activities | equity earnings",
    trap: "Equity income ≠ cash. Deduct equity income from CFO; add back dividends actually received.",
    one_sentence: "Equity method income is non-cash → subtract from CFO; dividends actually received are cash.",
    example: "Equity income $15,000 → CFO −$15,000; dividends from investee $6,000 → CFO +$6,000",
  },
  {
    topic_id: "CF_003",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Unrealized gain/loss — adjust or not",
    rule: "AFS unrealized G/L goes to OCI (not NI) → no cash flow adjustment needed. Trading security unrealized G/L goes to NI → it is non-cash → adjust in CFO.",
    trigger: "unrealized gain | unrealized loss | AFS | trading | indirect method | OCI",
    trap: "AFS unrealized items bypass net income, so no CFO adjustment; trading items are in NI so must adjust.",
    one_sentence: "Trading unrealized G/L in NI → adjust in CFO; AFS unrealized in OCI → no CFO adjustment.",
    example: "Trading security unrealized gain $5,000 included in NI → subtract $5,000 in CFO (non-cash item)",
  },
  {
    topic_id: "CF_004",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Loan receipts and payments — can you net them",
    rule: "Loan receipts and loan repayments cannot be netted — each must be reported gross.",
    trigger: "loan | netting | gross | cash flow | borrow | repay",
    trap: "Netting loan inflows and outflows is prohibited regardless of how frequent the transactions are.",
    one_sentence: "Loan activity must be shown gross — no netting of receipts and repayments.",
    example: "Borrowed $200,000 + repaid $150,000 → show $200,000 inflow and $150,000 outflow separately, not $50,000 net",
  },

  // [CF_005] Investing Activities — Gross Proceeds Rule + Loan to Affiliate
  // RULE    : CFI = gross proceeds (gain 아님) / loan to affiliate = CFI outflow
  // TRIGGER : "gain on sale" → proceeds 전액 / "loan to affiliate" → CFI outflow
  // TRAP    : gain만 CFI 반영($50K 과소) / loan 누락 / patent proceeds 누락
  {
    topic_id: "CF_005",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'calculation',
    card_name: "Investing Activities — Gross Proceeds Rule and Loan to Affiliate",
    rule: "CFI 원칙 2가지: ① Gross proceeds rule — 자산 매각 시 gain/loss 무관하게 현금 수령액 전액을 CFI inflow로 보고. Gain은 CFO indirect에서 제거. ② Loan to affiliate — 남에게 빌려주는 것 = 투자 행위 = CFI outflow. 원금 회수 = CFI inflow. 이자 수취는 별도로 CFO.",
    trigger: "gain on sale | proceeds | investing activities | loan to affiliate | patent sale | equipment purchase | gross proceeds",
    trap: "gain만 CFI에 넣으면 proceeds 전액 대비 $50K 과소계상\nloan to affiliate 누락 → ($15,000) 함정\npatent proceeds 누락 → ($85,000) 함정\n공통: 4개 항목 전부 체크하지 않고 일부만 합산",
    one_sentence: "CFI = gross proceeds(gain 아님) + 장기자산 취득·처분 + 대출 원금 지급·회수; 이자는 CFO.",
    speed: "$75,000(proceeds) − $120,000(equip) + $30,000(patent) − $40,000(loan) = ($55,000)",
    context_background: "[Investing Activities 분류 원칙]\n장기자산 사고팔기 + 남에게 빌려주고 돌려받기 = 이 두 카테고리만 CFI.\n\n항목별 논리:\n① 투자 매각 proceeds $75,000 → CFI inflow 전액. Gain $25,000은 NI에 포함 → CFO에서 제거. CFI에 gain만 넣으면 이중 오류.\n② 장비 구입 $120,000 → CFI outflow. 장기자산 취득.\n③ 특허 매각 $30,000 → CFI inflow. 장기자산 처분.\n④ 계열사 대출 $40,000 → CFI outflow. 빌려주는 것 = 투자 행위. 이자 수취는 US GAAP상 CFO.",
  },

  // [CF_006] Interest and Dividends — CFO vs CFF (US GAAP)
  // RULE    : 이자 수취·지급·배당 수취 = CFO / 배당 지급만 CFF
  // TRIGGER : "interest received/paid" / "dividends received/paid" → 분류 확인
  // TRAP    : 배당 지급을 CFO로 혼동 / 이자 지급을 CFF로 혼동 / IFRS와 혼동
  {
    topic_id: "CF_006",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Interest and Dividends — CFO vs CFF Classification (US GAAP)",
    rule: "US GAAP 이자·배당 분류:\n- 이자 수취(Interest received) → CFO\n- 이자 지급(Interest paid) → CFO\n- 배당 수취(Dividends received) → CFO\n- 배당 지급(Dividends paid) → CFF\n배당 지급만 CFF. 나머지 셋은 전부 CFO.",
    trigger: "interest received | interest paid | dividends received | dividends paid | cash flow classification | US GAAP",
    trap: "배당 지급을 CFO로 혼동 → CFF outflow\n이자 지급을 CFF로 혼동 → CFO outflow\nIFRS는 선택권 있음 → US GAAP 문제에서 IFRS 논리 적용 금지\n대출 원금 지급·회수 = CFI / 그 이자만 CFO로 분리",
    one_sentence: "US GAAP: 이자(수취·지급)·배당 수취 = CFO / 배당 지급만 CFF.",
    speed: "CFO: 이자 수취 ✓ / 이자 지급 ✓ / 배당 수취 ✓\nCFF: 배당 지급 ✓ (유일한 예외)",
    context_background: "[왜 배당 지급만 CFF인가]\n이자와 배당 수취는 내 투자·영업의 수익 → CFO.\n이자 지급은 영업 관련 비용 → CFO.\n배당 지급은 주주에게 자본을 돌려주는 행위 → 자본 조달·환원 = CFF.\n\n[대출 원금 vs 이자 분리]\n남에게 빌려준 원금 지급 → CFI outflow\n그 대출의 이자 수취 → CFO inflow\n원금과 이자가 다른 섹션으로 분리되는 것이 핵심.\n\n[IFRS와의 차이]\nIFRS는 이자·배당 수취·지급 모두 선택권 부여(CFO 또는 CFI/CFF).\nUS GAAP은 위 분류가 고정. 시험에서 별도 언급 없으면 US GAAP 적용.",
  },

  // [CF_007] SCF Indirect Method — Supplemental Disclosure Requirements
  // RULE    : Supplemental = Interest paid + Income taxes paid 2개만 / 나머지는 본문 line item
  // TRIGGER : "indirect method" + "supplemental disclosure" → Interest + Tax만
  // TRAP    : Capital exp(A) / 전체 합산(C) / Dividends 포함(D)
  {
    topic_id: "CF_007",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "SCF Indirect Method — Supplemental Disclosure Requirements",
    rule: "간접법(indirect method) SCF에서 supplemental disclosure 필수 항목 = Interest paid + Income taxes paid 2개만. 이유: 간접법 본문은 변동분(delta)만 보여줘서 실제 납부액이 불명확 → GAAP이 별도 공시 요구. Capital expenditures(CFI line item) / lease payments(CFF line item) / dividends paid(CFF line item)는 이미 본문에 표시 → supplemental 불필요.",
    trigger: '"indirect method" + "supplemental disclosure" → Interest paid + Income taxes paid 합산\n나머지 항목(capital expenditures / lease payments / dividends paid) → 본문 line item → 공시 불필요\n직접법(direct method)은 본문에 직접 표시 → supplemental disclosure 불필요',
    trap: "TRAP 1: $1,125,000 (A) → Capital expenditures + Capital lease payments 포함. 둘 다 CFI·CFF 본문 line item — supplemental 불필요\nTRAP 2: $1,870,000 (C) → 5개 항목 전부 합산. Supplemental은 오직 Interest + Tax 2개만\nTRAP 3: $745,000 (D) → Dividends paid $200,000 포함. Dividends paid = CFF 본문 line item → supplemental 불필요\n공통 함정: '현금 지출이면 다 공시해야 한다'는 착각 → 간접법 본문에 이미 나오는 항목은 추가 공시 불필요",
    one_sentence: "Indirect method supplemental disclosure = Interest paid + Income taxes paid 2개만; 나머지는 본문 line item.",
    example: "Income taxes paid $325,000 + Net interest payments $220,000 = $545,000 / Capital exp·lease payments·dividends → 본문 line item → 제외",
    context_background: "간접법(indirect method)으로 SCF를 작성할 때, 본문에 직접 나타나지 않는 두 가지 현금 지출이 있다 — 이자 지급(interest paid)과 법인세 납부(income taxes paid). 간접법 본문은 순이익에서 시작해 변동분(delta)으로 조정하는 구조라 실제 납부액이 얼마인지 본문만 봐서는 알 수 없다. 예: Accrued Tax BI $50K → EI $30K이면 변동분 $20K만 보일 뿐, 실제 납부액은 역산해야 함. GAAP은 이 정보를 반드시 제공하도록 별도 supplemental disclosure를 요구한다. 반면 직접법(direct method)은 본문에 'Cash paid for interest $220,000' 형태로 직접 표시되므로 추가 공시 불필요.",
    context_trigger: '"indirect method" + "supplemental disclosure" → Interest paid + Income taxes paid만 해당 / 나머지 항목은 본문 확인',
    rule_title: "Indirect Method Supplemental Disclosure — 포함 vs 제외",
    rule_items: [
      "필수 공시: Cash paid for interest (이자 실제 납부액)",
      "필수 공시: Cash paid for income taxes (법인세 실제 납부액)",
      "제외: Capital expenditures → CFI 본문 line item으로 이미 표시",
      "제외: Capital/finance lease payments → CFF 본문 line item으로 이미 표시",
      "제외: Dividends paid → CFF 본문 line item으로 이미 표시",
      "직접법은 본문에 직접 표시 → supplemental disclosure 자체가 불필요",
    ],
    speed: "① 'indirect method' + 'supplemental disclosure' 확인\n② 공식: Interest paid + Income taxes paid만\n③ $325,000 + $220,000 = $545,000 → B\n④ 나머지 3개 항목 전부 소거: 본문 line item",
  },

  // [CF_008] Indirect Method CFO — Three-Category Adjustment
  // RULE    : ①비현금 +가산 ②투자재무손익 제거 ③운전자본 증감 / Capital exp → CFI 무시
  // TRIGGER : net income + depreciation + gain on sale + operating activities
  // TRAP    : gain 차감 누락($33K) / fixed asset decrease 차감($29K) / depreciation 차감($19K)
  {
    topic_id: "CF_008",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'calculation',
    card_name: "Indirect Method CFO — Three-Category Adjustment",
    rule: "간접법 CFO 3가지 조정: ①비현금(Depreciation·Amortization → +가산) ②투자재무손익(Gain → −차감 / Loss → +가산, CFI·CFF에서 처리) ③운전자본(AR↑→−, AP↑→+, Inventory↑→−). Capital expenditures·고정자산 증감 → CFI 항목 → CFO 완전 제외.",
    trigger: '"net income" + depreciation + gain on sale + "operating activities" → 간접법 CFO 3가지 조정\nDepreciation → ①비현금 → +가산\nGain on sale → ②투자손익 → −차감 (CFI에서 처리)\nCapital expenditures / fixed asset changes → CFI → 무시',
    trap: "TRAP 1: $33,000 (A) → gain 차감 누락. Depreciation만 더하고 끝낸 오류\nTRAP 2: $29,250 (C) → gain 대신 fixed asset decrease $3,750 차감. 고정자산 증감은 CFI 항목 — CFO 무관\nTRAP 3: $19,500 (D) → depreciation을 차감. 비현금 비용은 반드시 가산\n공통 함정: Capital expenditures를 CFO에 포함하는 실수 → CFI 전용",
    one_sentence: "CFO = NI + Depreciation − Gain on sale ± 운전자본변동; capital exp·자산증감은 CFI.",
    example: "NI $20,000 + Dep $13,000 − Gain $1,250 = CFO $31,750 / Capital exp $12,500 → CFI (CFO 무관)",
    context_background: "간접법(indirect method) CFO는 순이익에서 시작해 3가지 유형을 조정한다.\n\n① 비현금 항목(Non-cash items)\n현금 유출 없이 비용 처리된 항목 → 다시 더하기\n- Depreciation / Amortization → +가산\n- Stock compensation expense → +가산\n\n② 투자·재무 활동 손익(Gain/Loss on investing or financing)\nCFI·CFF에서 처리되는 손익이 NI에 포함돼 있으면 → CFO에서 제거\n- Gain on sale of assets → −차감 (실제 현금은 CFI에)\n- Loss on sale of assets → +가산 (실제 현금은 CFI에)\n\n③ 운전자본 변동(Working capital changes)\nAR·AP·Inventory 등 유동자산·유동부채 증감\n- AR 증가 → −차감 (팔았지만 현금 못 받음)\n- AP 증가 → +가산 (비용 인식했지만 현금 안 냄)\n- Inventory 증가 → −차감 (현금 나갔지만 비용 아직 아님)\n\n이 문제에서는 ①②만 적용. Capital expenditures·fixed asset changes는 CFI 항목이라 CFO 계산에서 완전히 제외.",
    context_trigger: '"net income" + depreciation + gain/loss + operating activities → 3가지 조정 카테고리 적용',
    rule_title: "간접법 CFO 3가지 조정 카테고리",
    rule_items: [
      "① 비현금: Depreciation·Amortization·Stock comp → +가산",
      "② 투자재무손익: Gain → −차감 / Loss → +가산 (CFI에서 별도 처리)",
      "③ 운전자본: AR↑→− / AP↑→+ / Inventory↑→−",
      "Capital expenditures·고정자산 증감 → CFI 전용 → CFO 계산 완전 제외",
    ],
    speed: "① NI $20,000 시작\n② Depreciation $13,000 → 비현금 → +$13,000\n③ Gain $1,250 → CFI 처리 → −$1,250\n④ Fixed assets·Capital exp → CFI → 무시\n⑤ CFO = $20,000 + $13,000 − $1,250 = $31,750 → B",
  },
  // [CF_009] CFO Indirect Method — Gain Removal & Financing Item Exclusion
  // RULE    : Gain → CFO 차감 / Nontrade NP → Financing 제외 / 자산증가− / 부채증가+
  // TRIGGER : 'gain on sale' → − / 'nontrade notes payable' → 제외
  // TRAP    : Gain 미차감(A) / 운전자본 미조정(C) / Dep·AP 누락(D)
  {
    topic_id: "CF_009",
    book_id: 'IA',
    chapter_id: 'IA_CH10',
    topic_group: 'IA_CH10_CF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'calculation',
    card_name: "CFO Indirect Method — Gain Removal & Financing Item Exclusion",
    rule: "Indirect Method CFO: ① Depreciation + ② Gain on sale − (Investing 제거) ③ Nontrade notes payable → Financing, CFO 제외 ④ 자산 증가 − ⑤ 부채 증가 +",
    trigger: "'gain on sale of equipment' → CFO 차감 (Investing)\n'nontrade notes payable' → Financing, CFO 제외\nA/R·Prepaid 증가 → −\nA/P 증가 → +\nDepreciation → +",
    trap: "$50,000(A): Gain 차감 누락\n$100,000(C): A/R·Prepaid 조정 누락\n$0(D): Depreciation·A/P 조정 누락\n공통 함정 ①: Nontrade NP $50,000 → CFO 포함 오류 (Financing)\n공통 함정 ②: Gain을 CFO에 가산 → 반드시 차감",
    one_sentence: "CFO = NI + Dep − Gain − 자산증가 + 부채증가; Nontrade NP는 Financing 제외.",
    speed: "$70,000+$10,000−$10,000−$20,000−$40,000+$30,000 = $40,000\nNontrade NP $50,000 → 제외",
    context_background: "[Indirect Method CFO 조정 3가지 유형]\n\n① 비현금 항목 가산\n- Depreciation/Amortization: 비용이지만 현금 유출 없음 → 가산\n- Loss on sale: 비용이지만 Investing → 가산 후 Investing에서 처리\n\n② 비영업 손익 제거\n- Gain on sale of asset: Net Income에 포함됐지만 Investing 영역\n→ CFO에서 차감, Investing에서 전액 인식\n- Loss on sale: CFO에서 가산, Investing에서 처리\n\n③ 운전자본 변동\n- 자산 증가 → 현금 덜 들어옴 → −\n- 자산 감소 → 현금 더 들어옴 → +\n- 부채 증가 → 현금 덜 나감 → +\n- 부채 감소 → 현금 더 나감 → −\n\n[Nontrade notes payable 주의]\n영업 외 목적의 차입금(Nontrade) → Financing 활동\nTrade A/P(영업 매입채무) → Operating 활동\n'Nontrade' 문구가 보이면 즉시 Financing으로 분류, CFO 제외",
  },

  // [CF_010] SCF — Noncash Transaction Error Correction (Investing)
  // RULE    : 현금분만 Investing / noncash(note) → 별도 공시 / 오류 수정 = noncash만큼 증가
  // TRIGGER : 'paying $X cash and issuing $Y note' → $X만 Investing
  //           'incorrectly reported the full $Z' → 수정 = $Y(noncash)만큼 Investing 증가
  // TRAP    : 전액 수정(B) / No effect(C) / 방향 반대(D) / 나머지 거래 항목 혼동
  {
    topic_id: "CF_010",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'calculation',
    card_name: "SCF — Noncash Transaction Error Correction (Investing Activities)",
    rule: "자산 취득 = 현금 + note payable 혼합:\n→ 현금분만 Investing outflow\n→ note 발행분 = noncash → SCF 별도 공시(supplemental)\n오류 수정: 전액 포함 → noncash 금액만큼 Investing 다시 증가",
    trigger: "'paying $X cash and issuing $Y note payable' → $X만 Investing, $Y는 noncash\n'incorrectly reported the full $Z' → 수정 효과 = noncash($Y)만큼 Investing 증가\n나머지 거래 항목(principal/dividend/interest) → 오류와 무관, 무시",
    trap: "전액($300,000)을 수정 대상으로 착각 → 현금분은 원래 맞게 처리됨\n'noncash라 영향 없다' → 잘못 포함된 금액 제거해야 하므로 영향 있음\n방향 반대(Decrease) → 잘못 뺀 금액을 되돌리므로 증가\n여러 거래 항목에 혼동 → 'incorrectly reported' 문구 있는 거래만 집중",
    one_sentence: "혼합 취득 오류 수정 = noncash(note) 금액만큼 Investing 증가.",
    speed: "'incorrectly reported the full $X' 보이면 → 나머지 거래 무시\n수정 효과 = note(noncash) 금액만큼 Investing 증가",
    example: "기계 $300,000 = 현금 $75,000 + note $225,000 / 전액 Investing 오류 → 수정: +$225,000 증가",
  },

  // [CF_011] SCF — Investing vs Financing Classification (Mixed Transactions)
  // RULE    : 현금+mortgage → 현금분만 Investing / proceeds 전액 Investing
  //           Notes receivable 회수 → Investing / Interest paid → Operating
  //           Dividends + Principal → Financing
  // TRIGGER : 'paying $X cash and issuing $Y mortgage' → $X만 Investing
  //           'sold for $Z with gain' → $Z 전액 Investing
  //           'interest paid' → Operating (Financing 아님)
  //           'notes receivable' 회수 → Investing (내가 빌려준 돈 받기)
  // TRAP    : mortgage 포함 전액 Investing(C/D) / interest를 Financing 포함(B/C)
  {
    topic_id: "CF_011",
    book_id: 'IA',
    chapter_id: 'IA_CH10',
    topic_group: 'IA_CH10_CF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'conditional',
    card_name: "SCF — Investing vs Financing Classification (Mixed Transactions)",
    rule: "Investing:\n① 혼합 취득: 현금분만 (mortgage/note 제외)\n② 자산 매각 proceeds 전액 (gain/loss 무관)\n③ Notes receivable 회수 (내가 빌려준 돈 = 투자 회수)\n\nFinancing:\n① Dividends paid\n② Notes/Bonds payable 원금 상환\n③ 주식 발행/자사주 매입\n\nOperating:\n① Interest paid (US GAAP)\n② Interest/Dividends received (US GAAP)",
    trigger: "'paying $X cash and issuing $Y mortgage' → $X만 Investing\n'sold for $Z with $W gain' → $Z 전액 Investing\n'collection of notes receivable' → Investing (내가 빌려준 돈 받기)\n'interest paid' → Operating, Financing 아님\n'principal paid' → Financing / 'dividends paid' → Financing",
    trap: "Mortgage 포함 자산 전액을 Investing에 넣는 오류\nInterest paid를 Financing으로 분류 → US GAAP: Operating\nNotes receivable 회수를 Financing으로 착각 → 내가 빌려준 것 = Investing\n'Notes payable'(내가 빌린 것) vs 'Notes receivable'(내가 빌려준 것) 혼동",
    one_sentence: "내가 빌린 것 = Financing / 내가 빌려준 것 = Investing / Interest paid = Operating.",
    speed: "① 혼합 취득 → 현금분만\n② 매각 proceeds → 전액 Investing\n③ Notes receivable → Investing\n④ Interest paid → Operating (Financing에서 빼기)\n⑤ Dividends + Principal → Financing",
    example: "Building $450K(현금$150K+mortgage$300K) → Investing ($150K)\nMachinery 매각 $120K → Investing +$120K\nNotes receivable 회수 $60K → Investing +$60K\nInterest paid $15K → Operating (제외)\nDividends $90K + Principal $75K → Financing ($165K)",
  },

  // [CF_012] SCF financing activities — stock/bond issuance, borrowings, dividends, asset sale
  // RULE    : Financing = 자본·부채 조달·상환 / 장기자산 매각 = Investing (Financing 아님)
  // TRIGGER : "proceeds from issuance of stock/bonds" → Financing / "borrowings" → Financing / "dividends paid" → Financing outflow / "proceeds from sale of [자산]" → Investing
  // TRAP    : Building 매각을 Financing 포함 / Dividends paid 누락 / Line of credit 누락
  {
    topic_id: "CF_012",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "SCF financing activities — stock/bond issuance, borrowings, dividends vs. asset sale",
    rule: "SCF Financing Activities 포함 항목:\n✅ Proceeds from issuance of stock → Financing inflow\n✅ Proceeds from issuance of bonds → Financing inflow\n✅ Borrowings (line of credit, loans) → Financing inflow\n✅ Dividends paid → Financing outflow\n✅ Repayment of debt → Financing outflow\n❌ Proceeds from sale of assets (building, equipment) → Investing (장기자산 처분)",
    trigger: '"proceeds from issuance of stock/bonds" → Financing inflow\n"borrowings under line of credit" → Financing inflow\n"dividends paid" → Financing outflow\n"proceeds from sale of [자산명]" → Investing inflow (Financing 아님)',
    trap: "① Building/장기자산 매각 → Investing, Financing 아님\n② Dividends paid 누락 → 현금 유출(-) 반드시 포함\n③ Line of credit 차입 누락 → 차입 = Financing inflow\n④ Convertible bonds → 전환사채도 채권 발행 = Financing\n⑤ Gain($20,000)을 Financing에 포함 → Gain은 간접법 Operating 조정항목(차감)\n⑥ 장부가($80,000)를 Financing에 포함 → 장부가는 SCF에 직접 사용 안 함\n⑦ 현금 유입 전액($100,000)을 Financing에 포함 → 전액 Investing inflow",
    one_sentence: "Financing = 주식·채권 발행 + 차입 - 배당 - 상환; 자산 매각은 Investing.",
    example: "Stock $375 + Line of credit $300 + Bonds $150 - Dividends $450 = $375 / Building 매각 $225 → Investing",
    context_background: "SCF Financing Activities는 자본(equity) 및 부채(debt) 조달·상환과 관련된 현금흐름이다. 주식 발행, 채권 발행, 차입은 유입(+). 배당금 지급, 차입금 상환은 유출(-). 장기자산 매각은 Investing — 아무리 현금이 들어와도 자금 조달 활동이 아니다.",
    speed: "① 항목별 섹션 분류\n② Building 매각 → Investing → 제외\n③ -$450 + $375 + $300 + $150 = $375 → 정답 C\n\n[건물 매각 SCF 전체 처리]\n현금 유입 $100,000 → Investing inflow\nGain $20,000 → 간접법 Operating에서 차감(조정)\n장부가 $80,000 → SCF 직접 사용 안 함\nFinancing → $0",
  },

  // [CF_013] Finance Lease SCF — Principal to Financing, Interest to Operating
  // RULE    : 원금 → Financing outflow / 이자 → Operating outflow / Inflow 없음
  // TRIGGER : "finance/capital lease" + "financing activities" → 원금만 Financing
  // TRAP    : Inflow(A) / 원금+이자 Financing(B) / Financing 없음(D)
  {
    topic_id: "CF_013",
    book_id: 'IA',
    chapter_id: 'IA_CH10',
    topic_group: 'IA_CH10_CF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "Finance Lease SCF — Principal to Financing, Interest to Operating",
    rule: "Finance Lease 납부액 SCF 분류:\n\n① 원금(Principal) → Financing outflow\n→ 이유: 부채(Lease Liability) 상환 = 자금 조달 구조 변경\n\n② 이자(Interest) → Operating outflow\n→ 이유: US GAAP에서 이자 지급 = 영업 활동\n→ (IFRS는 Financing 선택 허용)\n\n③ 리스 개시 시 Lessee에게 cash inflow 없음\n→ 이유: 리스는 자산 사용권을 얻는 것이지 현금을 빌리는 것이 아님",
    trigger: '"capital lease / finance lease" + "financing activities" → 원금만 Financing outflow\n"interest payments on lease" → Operating outflow (US GAAP)\n"inflow at lease inception" → 없음, 리스는 현금 수령 아님\n"principal payments only" → Financing 정답 신호',
    trap: "A(Inflow): 리스는 자산 사용권 취득이지 현금 수령 아님 → Lessee에게 inflow 없음\nB(원금+이자 Financing): 이자는 US GAAP Operating → 이자까지 Financing 포함 오류\nD(Financing 없음): 원금 상환은 반드시 Financing → 완전히 없다는 오답\n공통 함정: 원금+이자 합산 Financing 처리 / 리스 시작 시 inflow 착각",
    one_sentence: "Finance lease: 원금 → Financing outflow / 이자 → Operating outflow; Lessee에게 inflow 없음.",
    speed: "Finance lease 납부 → 원금만 Financing / 이자는 Operating\nInflow 없음 → A 즉시 소거\n이자 포함 → B 소거\nFinancing 없음 → D 소거 → C",
    context_background: "[Finance Lease 납부액 SCF 분리 원칙]\n\n납부액 = 원금 + 이자 혼합\n→ SCF에서 목적별로 분리 보고:\n\n원금 분리:\nDr. Lease Liability (원금) → 부채 상환\n→ 자금 조달 구조 변경 = Financing outflow\n\n이자 분리:\nDr. Interest Expense (이자) → 영업 비용\n→ US GAAP: Operating outflow\n→ IFRS: Financing 또는 Operating 선택 가능\n\n[왜 Lessee에게 inflow가 없는가]\n리스는 자산 사용권(ROU Asset)을 얻는 거래.\n현금을 빌리는 것(차입)과 다르다.\n차입: Dr. Cash / Cr. Loan Payable → 현금 유입 있음\n리스: Dr. ROU Asset / Cr. Lease Liability → 현금 유입 없음\n→ Financing section에 inflow 없음\n\n[SCF 표시 요약]\nFinancing: −원금 (outflow)\nOperating: −이자 (outflow)\nInflow: 없음\n\n[주택담보대출 비유]\n집 살 때 은행 대출 → 현금 들어옴 (inflow)\n매달 원금·이자 상환 → 원금: Financing / 이자: Operating\n리스도 동일 구조. 단, 대출과 달리 리스 시작 시 현금 유입 없음.",
    example: "Finance lease / 월 납부 $5,000 (원금 $4,000 + 이자 $1,000)\n→ Financing outflow: −$4,000 (원금)\n→ Operating outflow: −$1,000 (이자)\n→ Financing inflow: $0",
  },

  // [CF_014] SCF Investing — Note Receivable Collection vs Note Payable, AR, Tax Refund
  // RULE    : Note receivable → Investing / Note payable → Financing / AR·Tax refund → Operating
  // TRIGGER : "note receivable" → Investing / "note payable" → Financing
  // TRAP    : Tax refund(A) / Note payable(B) / AR(D) / "related party" 수식어 함정
  {
    topic_id: "CF_014",
    book_id: 'IA',
    chapter_id: 'IA_CH10',
    topic_group: 'IA_CH10_CF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "SCF Investing — Note Receivable Collection vs Note Payable, AR, Tax Refund",
    rule: "SCF 분류 핵심 구분:\n\n✅ Investing\n- Note receivable 회수: 내가 다른 주체에게 빌려준 돈 → 투자 회수\n- 장기자산 취득·처분\n\n✅ Financing\n- Note payable 수령: 내가 빌린 돈 → 자금 조달\n- 주식·채권 발행, 배당 지급\n\n✅ Operating\n- AR 회수: 영업 매출채권 (판매 활동에서 발생)\n- Tax refund: 세금 = 영업 활동 관련\n- Interest paid, dividends received (US GAAP)\n\n[핵심 구분 공식]\n내가 빌려준 것 → Investing\n내가 빌린 것 → Financing",
    trigger: '"collection of note receivable" → Investing (내가 빌려준 돈 돌려받기)\n"note payable proceeds" → Financing (내가 빌린 돈)\n"accounts receivable" → Operating (영업 매출채권)\n"tax refund" → Operating\n"related party" 수식어 → 분류에 영향 없음, 즉시 무시',
    trap: "Tax refund → Operating: 세금은 영업 활동 관련, Investing 아님\nNote payable → Financing: 내가 빌린 돈 수령 = 자금 조달\nAR → Operating: 영업 매출채권, 판매에서 발생\n'related party' 수식어: 분류에 영향 없음 → 함정 수식어\nNote receivable vs Note payable 혼동 주의",
    one_sentence: "Note receivable(내가 빌려준) → Investing / Note payable(내가 빌린) → Financing / AR·Tax refund → Operating.",
    speed: "Note receivable → Investing\nNote payable → Financing\nAR·Tax refund → Operating\n'related party' → 무시",
    context_background: "[내가 빌려준 vs 내가 빌린 — 핵심 구분]\n\nNote receivable (내가 빌려준 돈)\n→ 회사가 다른 주체(개인, 다른 회사)에게 대출해준 것\n→ 그 돈을 돌려받는 것 = 투자 회수 = Investing\n→ 예: 자회사에 대여금, 임직원 대출, 관계사 대여\n\nNote payable (내가 빌린 돈)\n→ 회사가 다른 주체에게 빌린 것\n→ 그 돈을 받는 것 = 자금 조달 = Financing\n→ 예: 은행 차입, 사채 발행\n\n[AR vs Note receivable 구분]\nAR (Accounts Receivable)\n→ 물건 팔고 못 받은 돈 = 영업 활동에서 발생\n→ Operating\n\nNote receivable\n→ 돈을 빌려준 것 = 투자 활동에서 발생\n→ Investing\n\n['related party' 수식어]\nNote receivable from a related party (계열사, 임원 등)\n→ 누구에게 빌려줬든 상관없음\n→ 내가 빌려준 돈 회수 = Investing\n→ 'related party'는 단순 수식어, 분류 변경 없음\n\n[Tax refund]\n세금 과납 환급 → 세금은 영업 손익 계산의 일부\n→ Operating",
    example: "Note receivable 회수 → Investing ✅\nNote payable 수령 → Financing\nAR 회수 → Operating\nTax refund → Operating",
  },

  // [CF_015] SCF Investing – Noncash Portion of Mixed Asset Purchase
  // RULE    : 혼합 취득 시 investing = 현금분만 / noncash = 주석 공시
  // TRIGGER : "paying X cash and issuing Y note" → cash portion only
  // TRAP    : 전체 금액 수정 착각 / Decrease로 착각 / Note payable 상환 → financing
  {
    topic_id: "CF_015",
    category: "Statement of Cash Flows",
    topic_name: "SCF Investing – Noncash Portion of Mixed Asset Purchase",
    rule: "【혼합 취득(Mixed Purchase) SCF 처리 원칙】\n현금 + 어음 혼합으로 자산 취득 시:\n① 현금 지급분 → Investing outflow (SCF 본문)\n② 어음 발행분 → Noncash transaction → 별도 주석 공시\n\n【오류 수정 방향】\n전체 금액을 investing에 포함한 경우:\n→ noncash portion이 investing outflow에 잘못 포함됨\n→ 수정: noncash portion 제거\n→ 효과: investing outflow 감소 = investing cash flow Increase\n\n【관련 항목 SCF 분류】\nNote payable 원금 상환 → Financing activity (investing 아님)\n투자자산 매각 proceeds → Investing inflow (gain 제외, 전체 proceeds)\n특허권 매각 proceeds → Investing inflow",
    trigger: '"paying X cash and issuing Y note payable" → investing = cash portion only\n"incorrectly reported full amount in investing" → noncash portion 잘못 포함\n"net effect after correcting" → noncash 제거 → Increase',
    trap: "전체 금액($180,000) 수정이라고 착각 — 현금분($60,000)은 원래 맞고 noncash분($120,000)만 수정.\nDecrease로 착각 — 잘못 차감된 금액을 되돌리므로 Increase.\nNote payable 상환을 investing으로 분류 — financing activity.\n투자자산 매각 gain만 investing inflow로 처리 — proceeds 전액이 inflow.",
    example: "장비 $180,000 취득: 현금 $60,000 + 어음 $120,000\n\n오류: Investing outflow $180,000 계상\n수정: Investing outflow $60,000만 남김\n수정 효과: +$120,000 (Increase)\n\n어음 $120,000 → supplemental noncash disclosure로 이동",
    journal_entry: "Dr. Equipment $180,000\nCr. Cash $60,000          → Investing outflow\nCr. Notes Payable $120,000 → Noncash (주석 공시)",
    key_formula: "Investing outflow = 현금 지급분만\nNoncash portion = 별도 주석 공시\n오류 수정 효과 = +noncash portion (Increase)",
    speed: "혼합 취득 오류 수정 = noncash portion 제거 → investing outflow 감소 → Increase",
  },

  // [CF_016] SCF Investing – AFS Securities vs Cash Equivalents
  // RULE    : AFS → Investing / Cash equivalent → SCF 미표시 (현금의 일부)
  // TRIGGER : "available-for-sale" → investing / "cash equivalents" → 제외
  // TRAP    : T-bills를 investing으로 포함 / AFS를 제외로 착각
  {
    topic_id: "CF_016",
    category: "Statement of Cash Flows",
    topic_name: "SCF Investing – AFS Securities vs Cash Equivalents",
    rule: "【AFS 증권 vs Cash Equivalent SCF 분류】\n\nAFS (Available-for-Sale) 증권\n→ 매수/매도 모두 Investing activity\n→ SCF investing section에 표시\n\nCash Equivalent\n→ 만기 3개월 이내 단기 금융상품 (T-bills, CP 등)\n→ B/S상 현금 잔액의 일부로 포함\n→ SCF operating/investing/financing 어디에도 미표시\n→ '현금으로 현금을 산 것' = 현금 형태 변환에 불과\n\n【증권 분류별 SCF 처리】\nTrading securities → Operating activity\nAFS securities → Investing activity\nHTM securities → Investing activity\nCash equivalents → SCF 미표시",
    trigger: '"available-for-sale" → investing activity\n"cash equivalents" → SCF 미표시 (현금 잔액의 일부)\n두 항목 동시 제시 → cash equivalent 제외 후 investing 계산\n"Treasury bills / T-bills / money market" → cash equivalent 가능성 확인',
    trap: "Treasury bills를 investing outflow로 포함 → cash equivalent는 SCF 미표시.\nAFS 전체를 SCF 제외로 착각 → AFS는 investing outflow.\n두 금액 합산($250,000) → cash equivalent 제외 필요.\nTrading securities를 investing으로 착각 → operating activity.",
    example: "Grove Co.:\nMaple Corp. bonds (AFS) $200,000 → Investing outflow ✅\nU.S. Treasury bills (cash equiv) $50,000 → SCF 미표시 ❌\nNet cash used in investing = $200,000",
    journal_entry: "AFS 매입:\nDr. AFS Securities $200,000\nCr. Cash $200,000 → Investing outflow\n\nT-bills 매입:\nDr. Cash Equivalents $50,000\nCr. Cash $50,000 → SCF 미표시 (현금 내부 이동)",
    key_formula: "SCF Investing = AFS/HTM 매매금액\n(Cash equivalent 제외 | Trading → Operating)",
    speed: "AFS → Investing | Cash equivalent → SCF 미표시 | Trading → Operating",
  },

  // [CF_017] SCF – Ending Cash Balance Calculation & Distractors
  // RULE    : 기말 Cash = 기초 + Op − Inv + Fin / 별도 제시 매각대금 → 이미 포함, 무시
  // TRIGGER : "ending cash balance" → 3개 섹션 합산 / 별도 proceeds/gain → 이중계산 주의
  // TRAP    : 자산매각 proceeds 별도 가산 / Investing 부호 오류
  {
    topic_id: "CF_017",
    category: "Statement of Cash Flows",
    topic_name: "SCF – Ending Cash Balance Calculation & Distractors",
    rule: "【기말 현금잔액 공식】\n기말 Cash = 기초 Cash\n           + Net Cash from Operating\n           − Net Cash used in Investing (or + provided)\n           + Net Cash from Financing\n\n【함정 정보 처리 원칙】\n문제 내 자산매각 proceeds/gain 별도 제시\n→ 이미 Investing CF 섹션 합계에 포함된 금액\n→ 별도로 더하면 이중계산 오류\n→ 무시하고 3개 섹션 합산만으로 계산\n\n【부호 방향 주의】\n'net cash provided by ~' → 가산(+)\n'net cash used in ~' → 차감(−)",
    trigger: '"ending cash balance" 계산 → 기초 + 3개 섹션 합산\n별도 자산매각 proceeds/gain 제시 → 이미 Investing에 포함 → 무시\n"net cash used" → 차감 / "net cash provided" → 가산',
    trap: "자산매각 proceeds를 별도 가산(이중계산).\nGain을 별도 가산(이미 Investing에 포함).\nInvesting CF 부호 오류(used=차감인데 가산).\n기초잔액을 기말잔액으로 선택.",
    example: "Grove Co.:\n기초 $40,500\n+ Operating $526,500\n− Investing $630,000\n+ Financing $375,000\n= 기말 $312,000\n\n토지 proceeds $60,000 → 이미 Investing $630,000 안에 포함 → 별도 계산 금지",
    journal_entry: "",
    key_formula: "기말 Cash = 기초 + Operating ± Investing ± Financing",
    speed: "기말 Cash = 기초 + Op − Inv + Fin | 별도 제시 매각대금 → 이미 포함, 무시",
  },

  // [CF_018] Indirect Method CFO — Net Adjustment: Loss + Working Capital Changes
  // RULE    : Loss → 가산 / Gain → 차감 / 자산↓·부채↑ → 가산 / Land변동 → Investing
  // TRIGGER : "loss on sale" → 가산 / Prepaid↓ → 가산 / AP↑ → 가산
  // TRAP    : loss 차감 오류 / loss 누락 / Land 변동 CFO 포함 오류
  {
    topic_id: "CF_018",
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'calculation',
    card_name: "Indirect Method CFO — Net Adjustment: Loss + Working Capital Changes",
    rule: "【간접법 CFO 순조정 3가지 유형】\n\n① 비현금 손익\nLoss → 가산(+): NI를 낮췄지만 현금 아님 → 되돌리기\nGain → 차감(−): NI를 높였지만 현금 아님 → 되돌리기\n\n② 운전자본 변동\n자산↓ → 가산(+)\n자산↑ → 차감(−)\n부채↑ → 가산(+)\n부채↓ → 차감(−)\n\n③ 장기자산 변동 → Investing 섹션\n→ CFO 조정 없음 (Land, PPE 등)",
    trigger: '"loss on sale" → 가산(+)\n"gain on sale" → 차감(−)\n자산(Prepaid 등) 감소 → 가산(+)\n부채(AP 등) 증가 → 가산(+)\nLand/PPE 변동 → Investing → CFO 무관',
    trap: "Loss를 차감으로 처리 → loss는 NI 낮춘 항목 → CFO에서 가산\nLoss 조정 누락 → 비현금 손익 반드시 포함\nLand 장부금액 변동을 CFO에 포함 → Investing 전용\nGain/Loss 방향 혼동 → gain=차감 / loss=가산",
    example: "Cedar Corp:\n① Loss on land sale $60,000 → +$60,000\n② Prepaid↓ ($30K→$15K) → +$15,000\n③ AP↑ ($25K→$40K) → +$15,000\n④ Land 변동 → Investing → 무시\n합계 = +$90,000",
    key_formula: "CFO 순조정 = Σ 비현금손익 조정 + Σ 운전자본 변동\nLoss(+) / Gain(−) / 자산↓(+) / 자산↑(−) / 부채↑(+) / 부채↓(−)",
    speed: "Loss+$60K / Prepaid↓+$15K / AP↑+$15K / Land→무시 = +$90,000",
  },

  // [CF_019] SCF Investing Activities — AFS Securities vs Cash Equivalents Classification
  // RULE    : AFS → Investing outflow / Cash equivalents → SCF 활동 없음 (Cash 내부 이동)
  // TRIGGER : "available-for-sale" → Investing / "classified as cash equivalents" → SCF 활동 없음
  // TRAP    : T-bills를 Investing에 포함 / AFS를 Operating에 포함 / 둘 다 합산
  {
    topic_id: "CF_019",
    book_id: 'AA',
    chapter_id: 'AA_CH7',
    topic_group: 'AA_CH7_SCF',
    sub_category_id: "U5_CASH_FLOWS",
    card_type: 'concept',
    card_name: "SCF investing — AFS securities vs cash equivalents: which goes in investing",
    rule: "SCF Investing 분류 기준:\n\nAFS / HTM / Trading securities 매입·매도\n→ Investing activities (현금 유출·유입)\n\nCash equivalents (T-bills, MMF 등) 매입\n→ Cash and Cash Equivalents 구성 요소 변동\n→ SCF 어느 섹션에도 포함 안 됨\n→ B/S Cash 잔액 변동으로만 반영\n\n[핵심 원칙]\n'Cash equivalents = Cash의 일부'\n→ Cash ↔ Cash equivalents 이동 = 현금 내부 이동\n→ SCF 활동 분류 없음",
    trigger: '"available-for-sale securities" 매입 → Investing outflow\n"classified as cash equivalents" → SCF 활동 없음\n"Treasury bills / T-bills" → 만기 3개월 이내 = cash equivalent → Investing 제외\n"net cash used in investing" → AFS/HTM만 포함',
    trap: "T-bills를 Investing에 포함: Cash equivalent → SCF 활동 없음\nAFS를 Operating에 포함: 유가증권 매입 = Investing\n둘 다 합산: Cash equivalent 제외 필수",
    one_sentence: "AFS → Investing / Cash equivalents → SCF 활동 없음 (Cash 내부 이동).",
    speed: "AFS → Investing outflow | Cash equivalents → SCF 활동 없음",
    context_background: "[Cash Equivalents를 SCF에서 제외하는 이유]\nSCF의 목적 = 현금(+현금성자산) 증감 원인 설명.\nCash equivalents는 이미 'Cash and Cash Equivalents' 잔액의 일부.\n→ T-bills 매입 = 현금을 현금성 형태로 바꾸는 것\n→ 전체 잔액 변동 없음\n→ SCF 활동으로 분류할 필요 없음\n\n[AFS를 Investing으로 분류하는 이유]\nAFS는 Cash equivalent가 아님 (만기 3개월 초과 or 시장성 증권)\n→ 현금 투자 = Investing outflow\n→ 매각 시 Investing inflow",
  },

  // ── CHANGE ─────────────────────────────────────────────────────────────────
  {
    topic_id: "CHANGE_001",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Change in accounting principle — retrospective",
    rule: "A change in accounting principle is applied retrospectively: restate all prior periods as if the new principle was always used. Adjust beginning retained earnings of the earliest period presented.",
    trigger: "accounting principle | retrospective | restate | prior period | principle change",
    trap: "LIFO → another method may be impractical to apply retrospectively (use prospective if impractical).",
    one_sentence: "Principle changes restate all prior periods as if the new method was always used.",
    example: "Switch FIFO → weighted average → restate prior years; adjust beginning RE of earliest period shown",
  },
  {
    topic_id: "CHANGE_002",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Change in estimate — prospective",
    rule: "A change in accounting estimate is applied prospectively: adjust current and future periods only. No restatement of prior periods.",
    trigger: "change in estimate | prospective | useful life | residual value | estimate change",
    trap: "Do not restate prior years for estimate changes — only current and future periods are affected.",
    one_sentence: "Estimate changes apply going forward only; prior periods are untouched.",
    example: "Useful life changed from 10 to 8 years → recalculate depreciation from current year using remaining BV ÷ remaining life",
  },
  {
    topic_id: "CHANGE_003",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Error correction — prior period retained earnings",
    rule: "Prior period errors are corrected by restating prior financial statements and adjusting beginning retained earnings of the earliest period presented.",
    trigger: "error correction | prior period | restatement | retained earnings | correction",
    trap: "Error correction requires full restatement — it is not the same as a change in estimate.",
    one_sentence: "Prior period errors require restatement and an adjustment to opening retained earnings.",
    example: "Revenue understated $20,000 in Year 2 → restate Year 2; adjust beginning RE of earliest comparative period",
  },
  {
    topic_id: "CHANGE_004",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Ending inventory error — does it self-correct",
    rule: "Ending inventory errors are counterbalancing (self-correcting): the error reverses in the following year. Depreciation errors are non-counterbalancing and require explicit correction.",
    trigger: "inventory error | self-correcting | counterbalancing | depreciation error | automatic",
    trap: "Counterbalancing errors can look correct in the two-year aggregate — but each individual year is still misstated.",
    one_sentence: "Inventory errors self-correct after one year; depreciation errors do not.",
    example: "2024 ending inventory overstated $5,000 → 2024 NI overstated $5,000; 2025 NI understated $5,000 (nets to zero)",
  },
  // [CHANGE_005] Accounting Changes — Depreciation Method vs Inventory Method: RE Adjustment
  // RULE    : 감가상각 방법 변경 → Change in Estimate → Prospective → RE $0
  //           재고 방법 변경(LIFO→FIFO) → Change in Principle → Retrospective → RE 조정
  // TRIGGER : 감가상각 방법 변경 → $0 / 재고 방법 변경 → RE 조정
  // TRAP    : 둘 다 $0(A) / 감가상각 소급(B) / 둘 다 소급(D)
  {
    topic_id: "CHANGE_005",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'conditional',
    card_name: "Accounting Changes — Depreciation Method vs Inventory Method: RE Adjustment",
    rule: "감가상각 방법 변경 → Change in Estimate → Prospective → RE 조정 없음. 재고 방법 변경(LIFO→FIFO 등) → Change in Principle → Retrospective → RE 기초잔액 조정. US GAAP 예외: 감가상각 방법 변경은 Change in Estimate.",
    trigger: "감가상각 방법 변경(SYD→SL, DDB→SL 등) → Change in Estimate → RE $0\nLIFO→FIFO / 재고 방법 변경 → Change in Principle → RE 조정\n'adjustment to beginning balance' → 소급법 항목만 포함",
    trap: "$0(A): 둘 다 RE 조정 없다고 착각\n$30,000(B): 감가상각 방법 변경 소급 적용 오류\n$128,000(D): 둘 다 소급 적용 오류\n공통 함정: 감가상각 방법 변경 = Change in Principle 착각 → US GAAP에서 Change in Estimate",
    one_sentence: "감가상각 방법 변경 → Estimate(RE $0) / 재고 방법 변경 → Principle(RE 조정); US GAAP 핵심 예외.",
    speed: "SYD→SL → Estimate → $0\nLIFO→FIFO → Principle → $98,000\nRE 조정 = $98,000",
    context_background: "[회계변경 유형 분류]\n\n① Change in Accounting Principle\n- 정의: 일반적으로 인정된 회계원칙 간 변경\n- 처리: Retrospective(소급법) → RE 기초잔액 조정\n- 예: LIFO→FIFO, FIFO→Weighted Average\n\n② Change in Accounting Estimate\n- 정의: 미래 사건에 대한 추정치 변경\n- 처리: Prospective(전진법) → RE 조정 없음\n- 예: 내용연수 변경, 잔존가치 변경\n\n[US GAAP 핵심 예외]\n감가상각 방법 변경(SYD→SL, DDB→SL 등)\n→ 직관적으로는 Principle 변경처럼 보이지만\n→ US GAAP에서 Change in Estimate로 분류\n→ Prospective 적용, RE 조정 없음\n→ 변경 시점의 장부금액을 기준으로 새 방법 적용\n\n[이 문제 적용]\nSYD→SL: Change in Estimate → RE $0\nLIFO→FIFO: Change in Principle → RE $98,000\n→ RE 조정 = $98,000",
  },
  // [CHANGE_006] Change in Estimate — Useful Life (Prospective)
  // RULE    : 내용연수 변경 → Prospective / BV ÷ 잔여연수 = 새 감가상각비
  // TRIGGER : 'determines will last only X more years' / 'changes the depreciable life'
  // TRAP    : 기존 상각액 그대로(B) / 처음부터 단축연수 가정 소급(C)
  {
    topic_id: "CHANGE_006",
    book_id: 'IA',
    chapter_id: 'IA_CH11',
    topic_group: 'IA_CH11_CHANGES',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'calculation',
    card_name: "Change in Estimate — Useful Life (Prospective)",
    rule: "내용연수·잔존가치 변경 = Change in Accounting Estimate → Prospective 처리. 변경 시점 장부금액(BV) ÷ 잔여 내용연수 = 새 연간 감가상각비. 과거 재무제표 수정 없음.",
    trigger: "'determines will last only X more years' → Change in Estimate → Prospective\n'changes the depreciable life' → BV ÷ 잔여연수로 재계산",
    trap: "기존 상각액 그대로 사용(Prospective 처리 망각) / 처음부터 단축연수였다고 가정해 소급 적용하는 오류 / Change in Principle(Retrospective)과 혼동 주의",
    one_sentence: "내용연수 변경은 전진법 — 변경 시점 BV를 잔여연수로 나눈다.",
    speed: "'determines will last only X more years' → BV ÷ 잔여연수 / 과거 수정 없음\n계산: BV = 취득원가 − 누적상각 → ÷ 잔여연수",
    example: "취득 $105,000 / Y1~2 상각 $30,000 → BV $75,000 / 잔여 3년 → $75,000 ÷ 3 = $25,000",
  },

  // [CHANGE_007] Change in useful life — prospective BV ÷ remaining life
  // RULE    : Change in estimate → Prospective / BV at change date ÷ remaining life
  // TRIGGER : "determined that useful life is X years from date acquired" → 잔여연수 = X - 경과연수
  // TRAP    : 새 총연수로 나눔 / 원래 연수 그대로 / Retrospective 처리
  {
    topic_id: "CHANGE_007",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ACCCHG',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Change in useful life estimate — prospective depreciation using BV and remaining life",
    rule: "내용연수 변경 = Change in Accounting Estimate → Prospective 처리:\n① 과거 재무제표 수정 없음\n② 변경 시점 BV 계산\n③ 잔여 내용연수 = 새 총연수 - 경과연수\n④ 당기부터 BV ÷ 잔여연수로 감가상각\n\n[잔여연수 계산]\n'useful life of X years from date acquired' → 잔여 = X - 경과연수",
    trigger: '"determined that useful life is X years from date acquired" → 잔여연수 = X - 경과연수\n"change in estimate" → Prospective → BV ÷ 잔여연수\n변경일 BV = 취득원가 - 누적상각액\n누적상각 = 원래 연간상각 × 경과연수',
    trap: "① 새 총연수(9년)로 전액 나눔 → 잔여연수(6년) 사용\n② 원래 연간상각액 그대로 사용 → 변경 후 재계산 필요\n③ Retrospective 처리 → Change in estimate는 Prospective\n④ 새 연간상각 = BV ÷ 잔여연수 (취득원가 ÷ 새 총연수 아님)",
    one_sentence: "내용연수 변경 → Prospective; Year 4 감가상각 = 변경일 BV ÷ (새 총연수 - 경과연수).",
    example: "취득 $2,400,000 / 원래 6년 / 3년 경과 후 9년으로 변경\n→ BV $1,200,000 / 잔여 6년 → Year 4 Dep $200,000\n\n[Salvage value 추가 동시 변경]\n취득 $264,000 / 원래 8년·잔존가치$0 / 3년 경과 후 총6년·잔존가치$24,000으로 변경\n① Year 1~3 누적: $264K÷8×3 = $99,000 / BV $165,000\n② 잔여연수: 6−3 = 3년\n③ Depreciable cost: $165,000−$24,000 = $141,000\n④ Year 4 Dep: $141,000÷3 = $47,000\n⑤ 누적: $99,000+$47,000 = $146,000",
    context_background: "내용연수 변경은 회계 추정 변경(Change in Accounting Estimate)으로 Prospective(전진법) 처리한다. 과거 재무제표를 수정하지 않고, 변경 시점의 장부금액을 남은 내용연수로 나누어 앞으로의 감가상각비를 재계산한다. 잔여 내용연수는 '새 총연수 - 경과연수'로 계산한다.",
    speed: "① Year 1~3 누적상각 = $2,400,000 ÷ 6 × 3 = $1,200,000\n② BV Jan.1 Y4 = $1,200,000\n③ 잔여연수 = 9 - 3 = 6년\n④ $1,200,000 ÷ 6 = $200,000 → 정답 C",
  },
  // [ERR_001] Error Correction — Pretax Income Adjustment for Multiple Errors
  // RULE    : EI overstated → income 차감 / Dep understated → income 차감 → 둘 다 차감
  // TRIGGER : "overstated" EI + "understated" dep → 둘 다 같은 방향(차감)
  // TRAP    : 어느 하나를 가산으로 처리 → C 또는 D 오답
  {
    topic_id: "ERR_001",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ERR',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'calculation',
    card_name: "Error Correction — Pretax Income Adjustment for Multiple Errors",
    rule: "EI overstated → COGS understated → income overstated → 차감. Depreciation understated → expense 부족 → income overstated → 차감. 두 오류 모두 income을 부풀리므로 둘 다 차감.\n\n[B/S vs I/S 수정 프레임]\nI/S 계정 수정 (Revenue, Expense) → I/S → 세금 → RE → net of tax 처리\nB/S 계정 수정 (Acc. Dep., Prepaid, Inventory) → B/S 직접 → 세금 무관 → 전액 처리",
    trigger: "'overstated' EI → pretax income 차감\n'understated' depreciation → pretax income 차감\n두 항목 동시 등장 → 둘 다 같은 방향(차감)",
    trap: "EI 과대를 가산하는 오류: EI↑ = COGS↓ = income↑ → 수정 시 차감\nDep 과소를 가산하는 오류: Dep↓ = income↑ → 수정 시 차감\n둘 중 하나를 반대 방향으로 적용하면 C 또는 D 오답",
    one_sentence: "EI overstated + Dep understated → 둘 다 income 과대 → reported income에서 둘 다 차감.",
    speed: "EI overstated → −$45,000 / Dep understated → −$96,000\n$228,000 − $45,000 − $96,000 = $87,000",
    context_background: "EI 과대계상과 감가상각비 과소계상은 모두 pretax income을 부풀린다. 수정 시 둘 다 차감.",
  },

  // [ERR_002] Prior Period Adjustment — Error Correction vs Change in Depreciation Method
  // RULE    : Error correction → 소급, Prior period adjustment / 감가상각 방법 변경 → Prospective
  // TRIGGER : 'failed to accrue' → error correction / 'change from SL to accelerated' → Change in Estimate
  // TRAP    : 두 항목 합산(D) / 감가상각 변경만(A) / error correction을 전진법으로 혼동(C)
  {
    topic_id: "ERR_002",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ERR',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'conditional',
    card_name: "Prior Period Adjustment — Error Correction vs Change in Depreciation Method",
    rule: "Prior period adjustment 해당 여부:\nError correction(오류 수정) → 소급 적용 → Prior period adjustment ✅\n감가상각 방법 변경 → Change in Estimate effected by Change in Method → Prospective ❌\n\n감가상각 방법 변경은 과거 US GAAP에서 Change in Principle(소급)이었으나\n현재는 Change in Estimate로 분류 → 전진법, RE 조정 없음.",
    trigger: "'failed to accrue/record' → error correction → 소급, prior period adjustment\n'change from SL to accelerated/double-declining' → Change in Estimate → prospective\n'prior period adjustments' 금액 → error correction 항목만 합산",
    trap: "D($80,000): 두 항목 합산. 감가상각 변경은 prospective → prior period adjustment 아님\nA($30,000): 감가상각 변경만 포함. 전진법이라 RE 조정 없음\nC($0): error correction(warranty 미계상)을 prospective로 혼동. 오류는 반드시 소급",
    one_sentence: "Error correction → 소급(Prior period adj.) / 감가상각 방법 변경 → Prospective; RE 조정은 error만.",
    speed: "① warranty 미계상 → error correction → prior period adjustment $50,000\n② SL→가속 변경 → Change in Estimate → prospective → $0\n③ 답: B ($50,000)",
    context_background: "[Accounting Changes 3가지 분류]\n\n① Change in Accounting Principle (회계원칙 변경)\n→ 소급 적용 (Retrospective)\n→ 비교 재무제표 재작성 + RE 기초잔액 조정\n예: FIFO → LIFO, Revenue recognition method 변경\n\n② Change in Accounting Estimate (추정 변경)\n→ 전진 적용 (Prospective)\n→ RE 조정 없음, 당기부터 새 추정치 적용\n예: 내용연수 변경, 잔존가치 변경\n★ 감가상각 방법 변경 = Change in Estimate (전진법)\n\n③ Error Correction (오류 수정)\n→ 소급 적용 (Retrospective)\n→ Prior period adjustment: RE 기초잔액 직접 수정\n예: warranty 미계상, 재고 오류, 수익 누락\n\n[이 문제 적용]\nWarranty 미계상 $50,000\n→ Error correction → 소급 → Prior period adjustment ✅\n\n감가상각 방법 SL→가속 변경 $30,000\n→ Change in Estimate effected by Change in Method → Prospective ❌\n→ RE 조정 없음, 당기부터 새 방법 적용\n\n[왜 감가상각 방법 변경이 전진법인가]\n과거 US GAAP: Change in Principle → 소급\n현재 US GAAP: Change in Estimate → 전진\n이유: 감가상각 방법 선택은 자산의 경제적 효익 소비 패턴에 대한 추정이므로\n추정 변경으로 분류. 새 방법은 변경 시점 현재 BV부터 적용.",
  },

  // [ERR_003] Change in Accounting Principle — Retrospective Adjustment on RE Statement
  // RULE    : Change in Principle → Retrospective → RE statement 기초잔액 조정 + 별도 공시
  // TRIGGER : LCM 방식 변경 → Change in Principle / 'cumulative effect' → RE 소급
  // TRAP    : I/S 반영(B/C/D) / 구 GAAP 방식(D) / 공시 불필요(C)
  {
    topic_id: "ERR_003",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ERR',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Change in Accounting Principle — Retrospective Adjustment on RE Statement",
    rule: "Change in Accounting Principle 누적효과 처리:\n→ Retrospective 적용\n→ RE statement 기초잔액 조정 (I/S 반영 아님)\n→ 별도 공시 필수\n\n[3가지 변경 유형 비교]\nChange in Principle → Retrospective → RE 기초잔액\nChange in Estimate  → Prospective  → 당기 I/S\nError Correction    → Retrospective → RE 기초잔액",
    trigger: "'changed from X to Y approach' + inventory/LCM → Change in Principle\n'cumulative effect of this change' → retrospective → RE 기초잔액 조정\nI/S 선지(income from operations 등) → 모두 오답 (Change in Principle은 RE statement)",
    trap: "B/C(income from continuing operations): I/S 반영 → Change in Principle은 RE statement\nD(income after continuing operations): 구 GAAP 방식. 현재 US GAAP은 RE statement 소급\nC(without separate disclosure): Change in Principle은 항상 별도 공시 필요",
    one_sentence: "Change in Principle 누적효과 = RE statement 기초잔액 소급 조정 + 별도 공시; I/S 반영 아님.",
    speed: "① LCM 방식 변경 → Change in Principle 확인\n② Change in Principle → Retrospective → RE 기초잔액\n③ 별도 공시 필수\n④ 답: A",
    context_background: "[Change in Accounting Principle이란]\n회계 원칙 자체를 바꾸는 것. 원가 흐름 가정(FIFO→LIFO), LCM 적용 방식(개별→집합), 수익인식 방법 등이 해당.\n\n[왜 I/S가 아닌 RE statement인가]\n과거: Change in Principle 누적효과 → I/S에 별도 항목으로 표시 (구 GAAP)\n현재: Change in Principle 누적효과 → RE statement 기초잔액 직접 조정 (현행 US GAAP)\n이유: 과거 재무제표를 새 원칙으로 재작성하는 것이 더 비교 가능성을 높임\n\n[RE statement 표시 방법]\nRetained Earnings, beginning (as reported):   $XXX\nCumulative effect of change in principle:      ±$XX\nRetained Earnings, beginning (as adjusted):    $XXX\n\n[별도 공시 내용]\n- 변경 이유\n- 새 원칙이 더 선호되는 이유\n- 각 기간 영향 금액\n- 누적 효과\n\n[LCM 개별항목 → 집합법 변경]\n개별항목법: 품목별로 각각 cost vs NRV 비교\n집합법: 카테고리 전체로 cost vs NRV 비교\n→ 원가 구성요소 결정 방법 변경 = Change in Accounting Principle\n→ Retrospective 적용, RE statement 기초잔액 조정",
  },

  // [ERR_004] Error correction — cash to accrual: RE + current expense + prepaid restoration
  // RULE    : Cash→Accrual = Error correction / RE = 전기 과대 expense 수정 / 당기분 = expense / 잔여 = Prepaid
  // TRIGGER : "cash basis to accrual basis" → Error correction → RE 소급 조정
  // TRAP    : Prepaid Cr(A) / Insurance expense $180K(C) / RE 조정 누락(D)
  {
    topic_id: "ERR_004",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ERR',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'calculation',
    card_name: "Error correction — cash to accrual basis: RE adjustment + current year expense + prepaid restoration",
    rule: "Cash basis → Accrual basis 전환 = Error correction (non-GAAP → GAAP)\n수정 분개 3요소:\n① 당기 expense = $240,000 ÷ 4 = $60,000 (Year 2 당기분)\n② Prepaid = 잔여연수 × $60,000 = 2 × $60,000 = $120,000 (Year 3, 4)\n③ RE = 전기 과대 expense 수정 = $240,000 − $60,000 = $180,000 (Cr)\n\nJE: Dr.Insurance Expense $60K / Dr.Prepaid $120K / Cr.RE $180K\n\n[B/S vs I/S 수정 프레임]\nPrepaid = B/S 계정 → I/S 경로 밖 → 세금 무관 → 전액 복원\nInsurance Expense = I/S 계정 → 세금 영향 → net of tax 가능\nPrepaid 복원 시 세율 적용 안 하는 이유: B/S 직접 수정이라 세금과 연결고리 없음",
    trigger: "'cash basis to accrual basis' → Error correction → RE 소급 조정\n'year not presented' → RE 기초잔액 직접 조정\nRE = 전기 전액 expense − 전기 정상 expense = $240K − $60K = $180K",
    trap: "A: Prepaid Cr → 방향 반대. 잔여 보험료는 자산(Dr) 복원\nC: Insurance expense $180K → 당기분 $60K만. 잔여 $120K는 Prepaid\nD: RE 조정 없음 → Error correction에서 RE 소급 조정 필수\n공통 함정: 3개 계정(expense, prepaid, RE) 동시 처리 필요 → 하나라도 누락하거나 방향 틀리면 오답",
    one_sentence: "Cash→Accrual error correction: Dr.Expense(당기) + Dr.Prepaid(잔여) / Cr.RE(전기 오류); 3계정 동시.",
    speed: "① 연간 expense: $240K ÷ 4 = $60K\n② 당기(Year 2): Dr.Insurance Expense $60K\n③ 잔여(Year 3,4): Dr.Prepaid $120K\n④ 전기 오류 수정: Cr.RE $180K ($240K − $60K)\n→ 정답 B",
    context_background: "[왜 Cash→Accrual이 Error Correction인가]\nGAAP은 발생주의(accrual basis)를 요구한다. 현금주의(cash basis)는 non-GAAP이므로 이를 사용한 것 자체가 오류(error). Change in Accounting Principle이 아님 — 원칙 간 변경이 아니라 잘못된 방법에서 올바른 방법으로 수정하는 것.\n\n[3계정 수정 논리]\nYear 1에 했어야 할 올바른 분개:\nDr. Prepaid $240,000 / Cr. Cash $240,000\nDr. Insurance Expense $60,000 / Cr. Prepaid $60,000 (Year 1 분)\n→ Year 1 말 Prepaid 잔액: $180,000 / Insurance Expense: $60,000\n\n실제로 한 잘못된 분개:\nDr. Insurance Expense $240,000 / Cr. Cash $240,000\n→ Year 1 expense 과대 $180,000 / Prepaid $0\n\nYear 2 수정:\n과대 expense $180,000 → RE 복원(Cr)\nYear 2 당기분 $60,000 → expense(Dr)\n잔여 2년치 $120,000 → Prepaid(Dr)\n\n[과거 연도가 표시 안 된 경우]\nYear 1이 비교 재무제표에 없으면 → RE 기초잔액 직접 조정\n이 문제의 케이스: Year 1 수정 대신 Year 2 기초 RE 조정",
  },

  // [ERR_005] Prior Period Error — Depreciation Omission with Tax Correctly Handled
  // RULE    : "correctly for tax purposes" → DTA/DTL 없음 → Acc. Dep. 전액 증가 (세율 적용 안 함)
  // TRIGGER : "failed to record depreciation" + "correctly for tax" → 세율 무시, 전액
  // TRAP    : 세율 적용 → net of tax / Depreciation expense 처리 / 세무도 틀렸다고 가정
  {
    topic_id: "ERR_005",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_ERR',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Prior period depreciation error — tax already correct, no DTA/DTL",
    rule: "Prior period error 수정 원칙:\n① I/S 통과 안 함 → Acc. Dep. 직접 증가 + RE 소급 차감\n② 세금 효과 판단:\n   - 세무도 같이 틀림 → net of tax → RE = 오류금액 × (1 − 세율)\n   - 세무는 올바름 → tax effect 없음 → RE = 오류금액 전액\n\n[Acc. Dep.이 세율 무관한 이유]\nDep. Expense → I/S 통과 → 세금 계산 → RE 영향\nAcc. Dep.    → B/S 직접 → 세금과 연결고리 없음\n둘은 항상 세트로 잡히지만 Acc. Dep.은 I/S 경로 밖\n→ 오류 수정 시 Acc. Dep.은 무조건 전액 (세율 적용 불가)\n\n[B/S vs I/S 수정 프레임 — 전체 error correction 적용]\nI/S 계정 수정 → 세금 관여 → net of tax\nB/S 계정 수정 → 세금 무관 → 전액\n\n['correctly for tax purposes' 의미]\n세무에서 이미 비용 인식 완료 → 세금 추가 납부 완료\n→ DTA/DTL 없음 → 세율 적용 안 함\n\n[DTA vs DTL 구분]\nDTA = 세금 미리 냄 → 나중에 돌려받을 자산\nDTL = 세금 나중에 냄 → 나중에 낼 부채",
    trigger: '"failed to report / omitted depreciation" → prior period error → 소급수정\n"computed correctly for tax purposes" → DTA/DTL 없음 → 세율 무시, 오류금액 전액\n"how should report the correction" → Acc. Dep. 증가 (I/S 아님) + 금액',
    trap: "세율 적용 → net of tax 계산: 'correctly for tax' = 세금 정산 완료 → 세율 무관\nDepreciation expense로 처리: prior period error는 I/S 통과 안 함\n세무도 같이 틀렸다고 가정: 문제에 'correctly for tax purposes' 명시 확인 필수\n세율이 주어지면 무조건 사용: 세율은 트랩 재료일 수 있음",
    one_sentence: "'Correctly for tax' → 세율 무시, Acc. Dep. 전액 증가 / 세무도 틀렸으면 net of tax.",
    speed: '"correctly for tax purposes" 확인 → YES → 세율 무시, 전액\n→ NO (세무도 틀림) → ×(1−세율) net of tax\nAcc. Dep. 직접 증가 — Depreciation expense 아님',
    example: "Dep. 누락 $60,000 / 세율 25% / 세무 올바름:\nDr. RE $60,000 / Cr. Acc. Dep. $60,000\n(세율 25% 무시 — 세금 $15,000 이미 납부 완료)\n\n세무도 틀렸다면:\nDr. RE $45,000 / Dr. DTA $15,000 / Cr. Acc. Dep. $60,000",
    context_background: "[세무와 회계의 Timing 차이]\n\n일반 감가상각 (DTL 발생 케이스):\n세무 가속상각 > 회계 감가상각\n→ 세무 비용 더 많음 → 세금 덜 냄 → 나중에 더 낼 예정 → DTL\n\n이 오류 케이스 (DTA 발생 케이스):\n회계 $60,000 누락 / 세무 $60,000 정상 처리\n→ 세무 비용 더 많음 → 세금 더 냄 → 나중에 돌려받을 예정 → DTA\n\n[이 문제의 특수성]\n세무가 맞았다 = 세금 정산 끝\n→ DTA가 이미 해소된 상태로 오류 수정 시작\n→ 추가 세금 조정 불필요\n→ Acc. Dep. 전액, RE 전액\n\n[Acc. Dep.은 왜 세후로 줄이지 않나]\nAcc. Dep.은 자산의 실제 감모를 반영 — 세금과 별개\n건물은 $60,000만큼 더 닳았던 것이 사실\n세후로 줄이면 자산 과대계상 → 오류 수정의 목적에 반함",
    journal_entry: "세무 올바름 케이스:\nDr. Retained Earnings    $60,000\n    Cr. Accum. Dep.      $60,000\n\n세무도 틀린 케이스:\nDr. Retained Earnings    $45,000\nDr. Deferred Tax Asset   $15,000\n    Cr. Accum. Dep.      $60,000",
  },

  // ── CONSOL ─────────────────────────────────────────────────────────────────
  {
    topic_id: "CONSOL_001",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Intercompany transaction — eliminate 100% regardless of ownership",
    rule: "All intercompany transactions (sales, loans, dividends) are eliminated 100% in consolidation, regardless of the parent's ownership percentage.",
    trigger: "intercompany | eliminate | consolidation | related party | parent-subsidiary",
    trap: "Even a 60% parent must eliminate 100% of the intercompany transaction, not just 60%.",
    one_sentence: "Intercompany transactions are fully eliminated regardless of NCI percentage.",
    example: "Parent owns 70% / subsidiary sells to parent $50,000 → eliminate $50,000 (100%), not $35,000",
  },
  {
    topic_id: "CONSOL_002",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Downstream sale — does NCI get affected",
    rule: "Downstream sale (parent sells to subsidiary): unrealized profit is attributed entirely to the parent. NCI is not affected.",
    trigger: "downstream | parent to subsidiary | NCI | intercompany profit | downstream sale",
    trap: "NCI retains its full share of subsidiary net income — the parent absorbs all downstream unrealized profit.",
    one_sentence: "Downstream unrealized profit reduces only the parent's equity; NCI is unaffected.",
    example: "Parent sells inventory to sub (profit $5,000, unsold) → parent absorbs $5,000 elimination; NCI unchanged",
  },
  {
    topic_id: "CONSOL_003",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Upstream sale — does NCI get affected",
    rule: "Upstream sale (subsidiary sells to parent): unrealized profit elimination is shared proportionally between parent and NCI based on NCI's ownership percentage.",
    trigger: "upstream | subsidiary to parent | NCI | proportional | upstream sale",
    trap: "Unlike downstream, NCI shares proportionally in the upstream elimination.",
    one_sentence: "Upstream unrealized profit is split: parent absorbs its share, NCI absorbs its share.",
    example: "Sub (40% NCI) sells inventory with $5,000 unrealized profit → NCI absorbs $2,000, parent absorbs $3,000",
  },
  {
    topic_id: "CONSOL_009",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Intercompany inventory sale — COGS elimination amount",
    rule: "COGS 제거액 = 내부 판매금액 전액 (원가 × 마진율). 연결 관점: 내부 판매가 = 그룹 내부 이동 → 전액 제거. 연결 COGS = 최초 원가만 남김. 외부 판매 완료 여부 무관.",
    trigger: "combined financial statements | disregarded common ownership | intercompany sale | 140% of cost | eliminate from COGS | upstream sale",
    trap: "B(markup만): COGS 제거는 markup이 아닌 내부 판매가 전액. D(원가만): 원가 + markup 합산 = 내부 판매가 전액 제거 필수. 외부 판매가($121,800)는 계산에 무관.",
    one_sentence: "COGS 제거액 = 내부 판매가 전액(원가 × 마진율); 원가만 or markup만 제거하면 오답.",
    example: "Grove 원가 $60,000 × 140% = $84,000(내부판매가) → COGS 제거 $84,000 / 연결 COGS = $60,000(원가만)",
    speed: "① 내부판매가: $60,000 × 140% = $84,000 ② COGS 제거 = 내부판매가 전액 $84,000 → 정답 A",
  },

  // [CONSOL_010] Consolidated Dividends Paid — Parent Only
  // RULE    : 연결 dividends paid = Parent 외부 배당만 / Sub 배당 100% 제거
  // TRIGGER : 'consolidated statement of retained earnings' + 'dividends paid'
  //           → Parent 배당 숫자만 찾으면 끝 / B/S 데이터·지분율 무시
  // TRAP    : Sub 배당 포함(D) / NCI 몫 포함(B) / Sub 배당만(A)
  {
    topic_id: "CONSOL_010",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Consolidated Dividends Paid — Parent Only (Sub Dividends Eliminated)",
    rule: "연결 dividends paid = Parent가 외부주주에게 지급한 배당만\nSub 배당 100% 제거:\n→ Parent 수취분: 내부거래 제거\n→ NCI 수취분: NCI interest 감소로 처리 (dividends paid 아님)\nB/S 데이터·지분율은 이 계산에 불필요",
    trigger: "'consolidated statement of retained earnings' + 'dividends paid'\n→ Parent 배당 숫자만 찾으면 즉시 정답\nB/S 데이터(총자산·부채·RE) → 무시\n지분율(75%, 80%) → 무시",
    trap: "Sub 배당 전액 포함 → 연결에서 100% 제거 대상\nNCI 몫(Sub 배당 × NCI%) 포함 → NCI interest 감소이지 dividends paid 아님\nParent + Sub 단순 합산 → 제거 누락",
    one_sentence: "연결 dividends paid = Parent 외부 배당만; Sub 배당은 100% 제거.",
    speed: "Parent 배당 숫자 찾으면 끝\nSub 배당·B/S·지분율 → 전부 노이즈",
    example: "Parent $40,000 / Sub $10,000(80% 소유)\n→ 연결 dividends paid = $40,000 / Sub $10,000 전액 제거",
  },

  // [CONSOL_010] Consolidation — Intercompany Accrual Omission: Correcting Adjustment
  // RULE    : Intercompany accrual 미제거 → 양방향(자산·부채) 동시 감소
  // TRIGGER : 'intercompany accrual omitted' → Dr.Payable / Cr.Receivable → 양쪽 감소
  // TRAP    : No adjustment(A) / 부채 증가(B) / 양쪽 증가(C) — 모두 제거 방향 오류
  {
    topic_id: "CONSOL_010",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Consolidation — Intercompany Accrual Omission: Correcting Adjustment",
    rule: "연결 시 Parent-Sub 간 intercompany accrual(이자 수취·지급, 배당 미수·미지급 등) 미제거 → 연결 B/S에 내부 자산·부채 동시 과대계상. 수정: Dr. Interest Payable(부채 감소) / Cr. Interest Receivable(자산 감소) → Current Liability↓ + Current Asset↓ 동시.",
    trigger: "'intercompany accrual omitted from consolidation' → 양쪽 동시 감소\nParent: payable to Sub → Current Liability 감소\nSub: receivable from Parent → Current Asset 감소\n수정 분개: Dr.Payable / Cr.Receivable",
    trap: "A(No adjustment): 미제거 자체가 오류 → 반드시 수정 필요\nB(Asset↓ / Liability↑): 부채 방향 반대. 과대계상된 부채는 감소시켜야 함\nC(Asset↑ / Liability↑): 제거가 아니라 추가 계상 → 완전히 반대 방향\n공통 함정: 연결 조정 = 없었던 거래 되돌리기 → 잡혀있는 항목 제거(감소) 방향",
    one_sentence: "내부 이자 미제거 → 부채·자산 양쪽 과대 → Dr.Payable / Cr.Receivable → 둘 다 감소.",
    speed: "① Parent Interest Payable 잡혀 있음 → 없애야 함 → Liability 감소\n② Sub Interest Receivable 잡혀 있음 → 없애야 함 → Asset 감소\n③ 수정 분개: Dr.Interest Payable / Cr.Interest Receivable\n→ 정답 D",
    context_background: "[연결 제거 원칙]\n연결 재무제표 = 그룹 전체를 하나의 실체로 표시. Parent-Sub 간 내부거래는 외부 관점에서 존재하지 않으므로 전액 제거. Intercompany accrual을 누락하면 실재하지 않는 자산(Sub의 이자 수취채권)과 부채(Parent의 이자 지급채무)가 연결 B/S에 동시에 과대계상된다.\n\n[수정 방향 논리]\nIntercompany accrual이 잡혀 있다 = 과대계상 상태\n수정 = 과대계상 항목 제거 = 감소 방향\nDr. Interest Payable(부채 제거) / Cr. Interest Receivable(자산 제거)\n→ Current Liability↓ / Current Asset↓\n\n[CONSOL_006 Bond 매입과의 차이]\nCONSOL_006: Sub가 Parent 채권을 시장에서 매입 → CV와 매입가 차이 → Gain 발생 → 복잡한 계산\n이 케이스: 기말 이자 accrual 단순 미제거 → 차익 없음 → 양쪽 동일 금액 제거만",
  },

  // [CONSOL_004] Intercompany Equipment Sale — Excess Depreciation Elimination
  // RULE    : 연결 기준 BV = 원래 Sub BV → 감가상각도 원래 BV 기준 / 초과분 Dr.AccDep / Cr.Dep.Expense
  // TRIGGER : intercompany sale + excess depreciation → 원래 BV 기준 수정
  // TRAP    : B(방향 반대) / C(내부이익과 혼동) / D($30,000 전액 오답)
  {
    topic_id: "CONSOL_004",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_name: "Intercompany Equipment Sale — Excess Depreciation Elimination Entry",
    rule: "연결 철학: 그룹 = 하나의 회사. 내부거래 = 없었던 것. 자산 BV = 원래 Sub BV로 복원. 감가상각 = 원래 BV 기준으로 수정. 초과 감가상각 수정: Dr.Accumulated Depreciation / Cr.Depreciation Expense. 내부이익 제거와 감가상각 수정은 별도 entry.",
    trigger: "'intercompany sale' + 'excess depreciation' → 원래 Sub BV 기준으로 감가상각 수정\n초과분 → Dep.Expense 줄임(Cr.) / AccDep 줄임(Dr.)",
    trap: "B: 방향 반대(Dr.Dep.Expense/Cr.AccDep) → 감가상각 늘리는 오답\nC: 내부이익 $30,000을 감가상각 수정에 사용 → 별도 entry 혼동\nD: $30,000 전액을 감가상각으로 수정 → 연간 초과분 $3,750만 수정해야 함",
    one_sentence: "연결 = 내부거래 제거 → 원래 Sub BV $120,000 기준 감가상각 → 초과분 $3,750 Dr.AccDep/Cr.Dep.Expense.",
    speed: "① 연결 기준: $120,000÷8=$15,000\n② Parent 기록: $150,000÷8=$18,750\n③ 초과: $3,750 → Dr.AccDep/Cr.Dep.Expense\n답: A",
    context_background: "[연결에서 내부거래 자산의 BV가 핵심인 이유]\n연결 재무제표는 그룹 전체를 하나의 회사로 표시한다. Sub→Parent 장비 매각은 그룹 내부의 오른손→왼손 거래이므로 외부 관점에서는 존재하지 않는다. 따라서 매각으로 발생한 내부이익($30,000)을 제거하고, 자산 BV를 원래 Sub 장부가($120,000)로 되돌린다.\n\n[감가상각 수정 흐름]\nParent는 매입가 $150,000 기준으로 $18,750/년을 기록했지만, 연결에서는 원래 BV $120,000 기준 $15,000/년이 맞다. 초과분 $3,750을 매년 수정해야 한다.\n\n[내부이익 제거 vs 감가상각 수정 — 별도 entry]\n내부이익 제거: Dr.Gain on Sale $30,000 / Cr.Equipment $30,000 (별도)\n감가상각 수정: Dr.AccDep $3,750 / Cr.Dep.Expense $3,750 (이 문제)\n두 entry를 혼동하지 말 것.",
  },
  // [CONSOL_005] Consolidation — Subsidiary RE Eliminated at Acquisition Date
  // RULE    : 취득일 Subsidiary equity 100% elimination / 지분율 무관 / Consolidated RE = Parent only
  // TRIGGER : 'consolidated RE on acquisition date' → Subsidiary RE = $0
  // TRAP    : 100% 포함(A) / NCI 25%(C) / Parent 75%(D) — 셋 다 elimination 원칙 위반
  {
    topic_id: "CONSOL_005",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Consolidation — Subsidiary RE Eliminated at Acquisition Date",
    rule: "Acquisition method: 취득일에 Subsidiary 전체 자본(Common Stock + APIC + RE) 100% elimination. 지분율(Parent% or NCI%) 무관. Consolidated RE = Parent RE only. 취득 이후 Sub 이익만 연결 RE에 반영.",
    trigger: "'consolidated retained earnings on [취득일]' → Subsidiary RE = $0\n'acquisition method' + Sub equity → 전액 elimination\n취득일 이후 Sub 순이익 → 연결 RE 반영 가능",
    trap: "$600,000(A): Sub RE 전액 포함 → elimination 원칙 무시\n$150,000(C): NCI 25% × RE → NCI 몫도 elimination됨\n$450,000(D): Parent 75% × RE → 지분율 무관, 전액 제거\n공통 함정: '75% 취득했으니 75%는 포함' → Acquisition method에서 Sub RE는 지분율 관계없이 전액 제거",
    one_sentence: "취득일 기준 Subsidiary RE → 지분율 무관 100% elimination; Consolidated RE = Parent RE only.",
    speed: "Acquisition method → Sub equity 전액 elimination\nSub RE $600,000 → Consolidated RE 포함 = $0",
    context_background: "[Acquisition Method — Subsidiary Equity 처리]\n취득일에 Parent는 Subsidiary의 식별 가능한 순자산을 공정가치로 재측정하고, 초과분은 Goodwill로 인식한다. 이 과정에서 Subsidiary의 장부상 자본(Book Value Equity)은 전액 제거된다.\n\n[왜 RE가 $0인가]\nSub의 RE는 Sub가 과거에 벌어들인 이익의 누적이다. 연결 과정에서 이 금액은 Parent가 지불한 취득 대가(Investment 계정)와 상계(elimination)된다. 따라서 취득일 기준 Consolidated RE = Parent RE만 남는다.\n\n[지분율이 무관한 이유]\n75%든 100%든, Sub의 전체 자본이 elimination 대상이다. NCI(25%)에 해당하는 RE도 elimination되며, NCI는 별도로 연결 B/S의 자본 섹션에 표시된다.\n\n[취득일 이후]\n취득일 이후 Sub가 벌어들인 순이익은 지분율(75%)만큼 Parent의 연결 RE에 반영된다. 하지만 이 문제는 취득일 당일이므로 해당 없음.",
  },
  // [CONSOL_006] Consolidation — Intercompany Bond: Sub Buys Parent Bond (Constructive Retirement)
  // RULE    : Gain = Parent CV − 매입가 → Parent 발행 → 전액 RE / NCI = $0
  // TRIGGER : 'Sub purchased Parent bond' → Constructive Retirement / 발행 주체 확인
  // TRAP    : NCI $100,000(A) / NCI 25%(B) / Premium만 RE(C) — 발행주체 혼동
  {
    topic_id: "CONSOL_006",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Consolidation — Intercompany Bond: Sub Buys Parent Bond (Constructive Retirement)",
    rule: "Sub가 Parent 발행 채권 매입 → Constructive Retirement. Gain = Parent CV − 매입가. 발행 주체가 Parent → Gain 전액 Consolidated RE / NCI = $0. Sub 발행이었다면 → 지분율로 RE/NCI 배분.",
    trigger: "'Subsidiary purchased Parent bond' → Constructive Retirement\nGain = 발행자 CV − 매입가\nParent 발행 → RE 전액 / NCI = $0\nSub 발행 → RE(Parent%) + NCI(NCI%)",
    trap: "NCI $100,000(A): Gain 전액 NCI 귀속 → Parent 발행이면 NCI 무관\nNCI $25,000(B): 25% × $100,000 → Sub 발행 로직 혼용\nRE $75,000 / NCI $25,000(C): Premium만 RE, 분개 구조 혼동\n공통 함정: NCI 지분율 무조건 적용 → 발행 주체가 Parent이면 NCI = $0",
    one_sentence: "Sub가 Parent 채권 매입 → Gain = CV − 매입가 → Parent 발행이면 전액 RE, NCI = $0.",
    speed: "Gain = $1,075,000 − $975,000 = $100,000\nParent 발행 → RE $100,000 / NCI $0",
    context_background: "[Intercompany Bond — Constructive Retirement 개념]\n연결 관점에서 계열사 간 채권 거래는 외부와의 거래가 아니다. Sub가 Parent 채권을 매입하면, 연결 실체 내부에서 채권-채무가 동시에 존재하므로 상계(elimination)하고 차액을 손익으로 인식한다.\n\n[Gain 귀속 — 발행 주체 기준]\n핵심: 누가 채권을 발행했는가?\n\n① Parent 발행 채권을 Sub가 매입\n→ 채권 상환 주체 = Parent\n→ Gain 전액 Consolidated RE\n→ NCI = $0\n\n② Sub 발행 채권을 Parent가 매입\n→ 채권 상환 주체 = Sub\n→ Gain을 지분율로 배분\n→ RE = Gain × Parent% / NCI = Gain × NCI%\n\n[이 문제 분개]\nDr. Bond Premium (Ridgewood)     75,000\nDr. Bond Payable (Ridgewood)  1,000,000\n    Cr. Bond Investment (Cedarbrook)   975,000\n    Cr. Retained Earnings              100,000\n    Cr. NCI                                  0",
  },

  // [CONSOL_007] NCI Calculation After Subsidiary Issues Additional Shares to Outside Party
  // RULE    : 신주 발행 후 NCI = 신 equity × 신 NCI% / 두 가지 동시 업데이트 필수
  // TRIGGER : 자회사 신주 발행 → equity += 발행금액 / NCI% = NCI주식수 ÷ 신 총주식수
  // TRAP    : equity 업데이트 누락(C) / NCI% 구 기준 사용(D) / 둘 다 누락(C)
  {
    topic_id: "CONSOL_007",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "NCI Calculation After Subsidiary Issues Additional Shares to Outside Party",
    rule: "자회사 신주 발행 후 NCI 계산 — 두 가지 동시 업데이트:\n① Equity 업데이트: 기존 equity + 신주 발행금액 (현금 유입)\n② NCI% 재계산: NCI 보유주식수 ÷ 신 총주식수\nNCI = 신 Equity × 신 NCI%",
    trigger: "자회사 신주 발행 → equity += 발행금액 / NCI% = NCI주식수 ÷ 신 총주식수\n외부인에게 발행 → 모회사 보유주식 변동 없음, 총주식수만 증가\n신주 발행 후 NCI 계산 → 반드시 두 가지 동시 업데이트",
    trap: "D($140,000): equity $700,000은 맞지만 NCI%를 구 기준(20%) 적용. $700,000 × 20% = $140,000. NCI% 업데이트 누락.\nC($172,000): equity도 틀리고 NCI%도 구 기준. 둘 다 업데이트 안 함.\nA($300,000): equity를 업데이트하지 않고 이상한 계산.",
    one_sentence: "신주 발행 후 NCI = (기존 equity + 발행금액) × (NCI주식수 ÷ 신 총주식수); 두 가지 동시 업데이트.",
    speed: "① 신 총주식수: 20,000 + 5,000 = 25,000주\n② 신 equity: $500,000 + $200,000 = $700,000\n③ NCI주식수: 25,000 - 16,000 = 9,000주\n④ NCI% = 9,000/25,000 = 36%\n⑤ NCI = $700,000 × 36% = $252,000 → 답: B",
    context_background: "[자회사 신주 발행이 NCI에 미치는 영향]\n\n[Before issuance]\nThyme 보유: 16,000주 / 총주식: 20,000주\nThyme 지분율: 80% / NCI: 20%\nSage equity: $500,000\n\n[After issuance (5,000주 외부인에게 $200,000에 발행)]\nThyme 보유: 16,000주 (변동 없음)\n총주식: 25,000주 (20,000 + 5,000)\nThyme 지분율: 16,000/25,000 = 64% (희석됨)\nNCI: 9,000/25,000 = 36% (증가)\nSage equity: $700,000 ($500,000 + $200,000 현금 유입)\n\n[NCI 계산]\nNCI = $700,000 × 36% = $252,000\n\n[왜 두 가지 모두 업데이트해야 하는가]\n신주 발행 → 현금이 Sage로 유입 → equity 파이가 커짐\n동시에 Thyme 지분율이 희석 → NCI 비율 증가\n파이(equity)도 커지고 NCI 조각(%)도 커짐\n→ 둘 다 반영해야 정확한 NCI 계산\n\n[D 오답의 직관]\n$700,000 × 20% = $140,000\n→ equity는 맞게 업데이트했지만\n→ NCI%를 신주 발행 전 기준(20%)으로 그대로 사용\n→ 신주를 외부인이 가져갔으니 NCI 비율이 올라갔다는 것을 놓침",
  },

  // [CONSOL_008] Intercompany Fixed Asset Sale — Depreciation Adjustment in Consolidation
  // RULE    : 연결 감가상각 감소 = Gain × (1 ÷ Sub 내용연수) / 항상 매입한 쪽(Sub) 기준
  // TRIGGER : Parent→Sub 자산 매각 + Gain → Sub 내용연수 역수 = 조정 %
  // TRAP    : Parent 내용연수 사용(D=20%) / Gain 전액 제거(C=100%)
  {
    topic_id: "CONSOL_008",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Intercompany Fixed Asset Sale — Depreciation Adjustment in Consolidation",
    rule: "Parent→Sub 내부거래 자산 매각 시 연결 감가상각 조정:\n당기 감가상각 감소액 = Gain × (1 ÷ Sub 내용연수)\n\nMCQ: 조정 % = 1 ÷ Sub(매입한 쪽) 내용연수\nTBS: Gain 금액 계산 후 × (1 ÷ Sub 내용연수) = 당기 제거액\n\n항상 Sub(매입한 쪽) 내용연수 기준. Parent 내용연수 사용 금지.",
    trigger: "Parent→Sub 자산 매각 + Gain 발생 → 연결 감가상각 조정 필요\nSub 내용연수 확인 → 역수 = MCQ 조정 %\n'decreased by X% of the gain' → 1 ÷ Sub 내용연수\n금액 질문: 매수사 감가상각 − 원래 감가상각 = 조정액\n대안1: (매각가 − BV) ÷ 매수사 내용연수\n대안2: Gain × (1 ÷ 매수사 내용연수)\n'by what amount should depreciation expense be decreased?' → 부풀려진 매각가 상각 − 원래 BV 기준 상각 = 차이가 제거대상",
    trap: "매수사(Sub) 감가상각 전액을 조정액으로 착각(예: $72,000÷3=$24,000) → 원래 감가상각($48,000÷3=$16,000)과의 차이만 조정\n'$0' 조정 불필요 오류 → 감가성 자산 내부거래도 반드시 매년 조정\n매도사(Parent) 매각 전 연 상각액(예: $80,000÷5=$16,000)을 조정액으로 착각 → 매각 전 금액일 뿐 조정액 아님\n매도사(Parent) 내용연수로 계산 → 항상 매수사(Sub) 내용연수 기준\n핵심: 부풀려진 매각가 기준 상각 − 매각 없었을 때(원래 BV) 기준 상각, 그 '차이'만 제거",
    one_sentence: "연결 감가상각 조정 % = 1 ÷ Sub(매입한 쪽) 내용연수; Parent 내용연수 쓰면 오답.",
    speed: "% 질문: Sub 내용연수 확인 → 역수(1÷n)\n금액 질문:\n① 매수사 감가상각 = 매각가 ÷ 매수사 내용연수\n② 원래 감가상각 = 원가 ÷ 원래 내용연수\n③ 차이 = 조정액\n또는: (매각가 − BV) ÷ 매수사 내용연수",
    context_background: "[내부거래 감가상각 조정 구조]\n\n[왜 조정이 필요한가]\nParent가 Gain 붙여 Sub에 매각\n→ Sub는 높은 매입가 기준으로 감가상각\n→ 연결에서는 원래 원가 기준이어야 함\n→ 초과 감가상각분 제거 필요\n\n[숫자 예시]\nPort 취득가: $100 / 5년 상각 / 2년 경과\n누적감가: $100÷5×2 = $40\nBV: $60\nSalem 매입가: $75 → Gain $15\n\nSalem 감가상각: $75 ÷ 3년 = $25\n연결 감가상각: $100 ÷ 5년 = $20\n초과분(제거): $25 − $20 = $5\n\n검증: $15 × 1/3 = $5 ✅\n\n[MCQ 전략]\nSub 내용연수만 보고 역수 계산\nSalem 3년 → 1/3 = 33 1/3%\nSalem 5년이었다면 → 1/5 = 20%\nSalem 2년이었다면 → 1/2 = 50%\n\n[D 함정]\nPort 5년 → 1/5 = 20%\n→ Parent 내용연수 사용 오류\n→ 항상 매입한 쪽(Sub) 기준",
  },

  // [CONSOL_011] Consolidated Total Liabilities — Intercompany Note Payable Elimination
  // RULE    : 연결 부채 = Parent + Sub − Intercompany 부채 100% / 지분율 무관
  // TRIGGER : "note payable to [Parent]" → 100% 제거 / 지분율로 부분 제거 금지
  // TRAP    : 70% 제거(A) / 단순 합산(D) / 30% NCI 몫만 제거(B)
  {
    topic_id: "CONSOL_011",
    book_id: 'GN',
    chapter_id: 'GN_CH4',
    topic_group: 'GN_CH4_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Consolidated Total Liabilities — Intercompany Note Payable Elimination",
    rule: "연결 총부채 계산:\n① Parent 부채 + Sub 부채 합산\n② Intercompany 부채 100% 차감\n   → Sub의 'note payable to Parent' = 내부거래 → 전액 제거\n   → 지분율(70% or 30%) 무관\n③ 연결 총부채 = 합산 − Intercompany 부채\n\n[왜 100% 제거인가]\n연결 = 그룹 전체를 하나의 회사로 표시\n자기 자신에게 빚질 수 없음 (A company cannot owe itself)\n→ 내부 채권·채무 전액 상계",
    trigger: '"note payable to [Parent company]" → intercompany 부채 → 100% 제거\n"included in [Sub]\'s liabilities" → Sub 합산 후 차감\n지분율(70%, 30%) → 부채 제거와 무관 → 무시\n단순 합산 선지 → intercompany 미제거 오답',
    trap: "A($590,000): $450K + 70%×$100K → 지분율 적용 오류. 내부거래는 100% 제거\nB($520,000): $450K + 30%×$100K → NCI% 적용 오류. 역시 100% 제거\nD($650,000): $450K + $200K 단순 합산 → intercompany $100K 미제거\n공통 함정: 지분율로 부분 제거 → 내부거래는 지분율 관계없이 전액 제거",
    one_sentence: "연결 부채 = Parent + Sub − Intercompany 100%; 지분율로 부분 제거하면 오답.",
    speed: "① $450,000 + $200,000 = $650,000\n② Intercompany $100,000 → 100% 제거\n③ $650,000 − $100,000 = $550,000",
    example: "King $450,000 + Simmon $200,000 = $650,000\nSimmon→King note $100,000 → 100% 제거\n연결 부채 = $550,000",
    context_background: "[연결의 핵심 철학]\n연결 재무제표 = 그룹 전체를 하나의 단일 회사로 표시.\nParent-Sub 간 거래 = 왼손→오른손 거래 → 외부에서 보면 존재하지 않음.\n\n[Intercompany 부채 제거 구조]\nSub 장부: Note Payable to King $100,000 (부채)\nKing 장부: Note Receivable from Simmon $100,000 (자산)\n연결 시: 양쪽 동시 제거 → 부채↓ + 자산↓\n\n[왜 지분율 무관인가]\n70% 소유이든 51% 소유이든,\nParent-Sub 간 내부거래는 그룹 관점에서 없었던 것.\n지분율로 부분 제거하면 나머지가 연결 B/S에 남게 됨\n→ 실재하지 않는 부채·자산 과대계상\n\n[연결 총부채 계산 공식]\nParent 부채 + Sub 부채 전액 합산\n− Intercompany 부채 100%\n= 연결 총부채\n\n[Simmon의 비-intercompany 부채]\nSimmon 총부채 $200,000 − Intercompany $100,000 = $100,000\n이 $100,000은 외부 제3자에 대한 부채 → 연결에 포함\n→ $450,000 + $100,000 = $550,000",
  },

  // [CONSOL_013] Consolidated SCF — Dividends Paid (External Cash Outflow Only)
  // RULE    : 연결 SCF 배당 = 연결 경계선 밖으로 나간 현금만
  //           Parent 배당(전액) + Sub 배당 × NCI% / Sub→Parent 내부거래 제거
  // TRIGGER : 'consolidated statement of cash flows' + 'dividends paid'
  // TRAP    : Sub 배당 전액 포함 / NCI 몫 누락 / Parent + Sub 단순 합산
  {
    topic_id: "CONSOL_013",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Consolidated SCF — Dividends Paid (External Cash Outflow Only)",
    rule: "연결 SCF 배당 지급액 = 연결 실체 경계선 밖으로 나간 현금의 합\n① Parent 배당 → 전액 외부 유출 포함\n② Sub 배당 × Parent% → 내부거래(경계선 안) → 제거\n③ Sub 배당 × NCI% → 외부 유출 포함\n공식: Parent 배당 + Sub 배당 × NCI%\n\n[CONSOL_010과의 차이]\nCONSOL_010 (연결 RE 기준): Sub 배당 100% 제거 → Parent 배당만\nCONSOL_013 (연결 SCF 기준): Sub→NCI 배당은 실제 외부 현금 유출 → 포함",
    trigger: "'consolidated statement of cash flows' + 'dividends paid'\n→ 경계선 밖 유출 집계 모드\n'Parent paid dividends of $X' → 전액 포함\n'Subsidiary paid dividends of $Y' → × NCI%만 포함\n지분율 정보 → NCI% 계산에 사용 (무시하면 안 됨)",
    trap: "Sub 배당 전액($8,000) 포함 → 75%는 내부거래, 제거 대상\nNCI 몫($2,000) 누락 → 실제 외부 현금 유출이므로 반드시 포함\nParent + Sub 단순 합산($23,000) → 내부거래 제거 누락\nParent 배당만($15,000) → NCI 외부 유출 누락\n핵심 함정: 문제가 길고 숫자가 많아서 압도당함 → 마지막 질문 먼저 읽고 배당 숫자 두 개만 추출",
    one_sentence: "연결 SCF 배당 = 경계선 밖 유출만: Parent 배당(전액) + Sub 배당 × NCI%.",
    key_formula: "Consolidated dividends paid = Parent dividends + (Sub dividends × NCI%)",
    example: "Peace $15,000 + Surge $8,000 × 25% = $15,000 + $2,000 = $17,000",
    speed: "① 마지막 질문: consolidated SCF + dividends → 공식 발동\n② Parent 배당 $15,000 → 전액\n③ Sub 배당 $8,000 × NCI 25% = $2,000\n④ $15,000 + $2,000 = $17,000",
    context_background: "[핵심 직관: 경계선 밖으로 나간 현금]\n연결 실체(Parent + Sub)를 하나의 박스로 보면, 배당은 그 박스 밖으로 나간 돈만 SCF에 잡힌다.\nSub→Parent 배당 = 박스 안 오른쪽 주머니→왼쪽 주머니 이동 → 외부 유출 아님 → 제거\nSub→NCI 배당 = 박스 밖 소수주주에게 나간 돈 → 실제 외부 유출 → 포함\nParent→주주 배당 = 박스 밖으로 나간 돈 → 전액 포함\n\n[CONSOL_010 RE 기준과 헷갈리는 이유]\nRE 계산: Sub 배당은 RE에서 차감되지 않음 (Parent 몫은 내부 수취 상계, NCI 몫은 NCI interest 감소)\n→ 연결 RE 기준: Sub 배당 100% 제거, Parent 배당만 반영\nSCF 계산: NCI 몫은 실제 현금이 연결 범위 밖으로 나간 것\n→ 연결 SCF 기준: Sub 배당 × NCI%는 포함\n\n[긴 문제 대응 루틴]\n① 마지막 문장 먼저 → 'consolidated SCF + dividends' 확인\n② 필요한 숫자: Parent 배당 + Sub 배당 + 지분율\n③ 나머지(취득가, BV, RE, purchase differential) → 전부 노이즈, 읽지 마",
  },

  // [CONSOL_012] Consolidated Inventory — Interco Sale: Carrying Amount After Unrealized Profit Elimination
  // RULE    : 연결재고 = Interco COGS × 보유비율 / COGS% = 1−GP% / 판매가 기준 아님
  // TRIGGER : "sold goods at markup" + "still held X% in inventory" → 3단계 계산
  // TRAP    : 판매가 기준($32K×37.5%) / 미실현이익만($3K) / GP% 직접 적용
  {
    topic_id: "CONSOL_012",
    book_id: 'AA',
    chapter_id: 'AA_CH2',
    topic_group: 'AA_CH2_CONSOL',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Consolidated inventory — intercompany sale carrying amount: 3-step calculation",
    rule: "연결 B/S 재고 carrying amount — 3단계:\n\n① Interco revenue 역산\n   = 합산매출(Parent + Sub) − 연결매출\n\n② COGS% 계산\n   = 1 − GP%\n   (GP% = Parent gross profit ÷ Parent revenue)\n\n③ 연결 재고\n   = Interco revenue × COGS% × 보유비율\n   = Interco COGS × 보유비율\n\n[핵심 원칙]\n연결 재고 = 원가(COGS) 기준\n→ 판매가 기준 아님\n→ 미실현이익 제거\n→ Interco revenue × COGS% = 원가로 환원",
    trigger: '"sold goods to subsidiary at markup" → GP% → COGS% 계산\n"still held X% in inventory" → × 보유비율\n합산매출 − 연결매출 = Interco revenue\n"carrying amount on consolidated B/S" → 원가 기준',
    trap: "판매가 기준($32K × 37.5% = $12K): 원가 기준 필수 → × COGS% 먼저\n미실현이익만 계산: 재고 전체 carrying amount 구해야 함\nGP% 직접 적용: COGS%(= 1 − GP%) 적용해야 함\nGP% 역산 누락: 표에서 Parent GP% 직접 계산 필요",
    one_sentence: "연결 재고 = (합산−연결 매출) × COGS% × 보유비율; 판매가 아닌 원가 기준.",
    speed: "① 합산−연결 = Interco rev\n② × COGS% = Interco COGS\n③ × 보유비율 = 연결 재고",
    context_background: "[왜 원가(COGS) 기준인가]\n연결 재무제표 = 그룹을 하나의 회사로 표시.\nParent→Sub 판매 = 내부거래 → 외부에 판 게 아님.\n따라서 Sub 재고는 Parent가 처음 취득한 원가로 표시해야 함.\n판매가로 표시하면 실현 안 된 이익이 재고에 포함 → 과대계상.\n\n[3단계 공식 설명]\n① Interco revenue 역산:\n   합산하면 내부거래가 양쪽 다 잡힘\n   연결에서 제거된 차이 = 내부거래 금액\n\n② COGS% 계산:\n   GP% = $50,000 / $200,000 = 25%\n   COGS% = 75%\n   → Interco $32,000 중 $24,000이 원가\n\n③ 보유비율 적용:\n   Sub이 37.5% 보유 → $24,000 × 37.5% = $9,000\n\n[오답 D ($12,000) 분석]\n$32,000 × 37.5% = $12,000\n→ 판매가($32K) 기준으로 보유비율 적용\n→ 미실현이익 $3,000($12K − $9K) 포함\n→ 연결 재고 과대계상",
    example: "GP% = $50K/$200K = 25% → COGS% = 75%\nInterco rev = $340K − $308K = $32,000\nInterco COGS = $32,000 × 75% = $24,000\n연결 재고 = $24,000 × 37.5% = $9,000\n\n제거 분개:\nDr. COGS $3,000 (미실현이익)\n    Cr. Inventory $3,000",
  },

  // ── NFP ────────────────────────────────────────────────────────────────────
  {
    topic_id: "NFP_001",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Board-designated funds — with or without restriction",
    rule: "Board-designated (quasi-endowment) funds are self-imposed restrictions. They remain 'without donor restriction' because the board can reverse the designation at any time.",
    trigger: "board designated | quasi-endowment | self-imposed | board restriction",
    trap: "Only external donor restrictions create 'with restriction' classification.",
    one_sentence: "Board designations do not create donor restrictions — the funds stay 'without donor restriction.'",
    example: "Board sets aside $100,000 for future building → without donor restriction (board can reverse it)",
  },
  {
    topic_id: "NFP_002",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Long-term restricted donation — which cash flow category",
    rule: "Cash received from long-term restricted contributions (endowments) goes to Cash from Financing Activities (CFF), not Operating Activities.",
    trigger: "restricted donation | long-term | endowment | financing activities | NFP cash flow",
    trap: "Most donations look like operating cash, but long-term restricted gifts are Financing per GAAP.",
    one_sentence: "Long-term restricted donations → Financing Activities, not Operating Activities.",
    example: "$500,000 permanent endowment gift → Cash from Financing Activities",
  },
  {
    topic_id: "NFP_003",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'conditional',
    card_name: "Net asset classification — with vs without restriction",
    rule: "NFP net assets have two classes: (1) with donor restriction (time or purpose restrictions imposed by donors), (2) without donor restriction. Both appear on the Statement of Financial Position.",
    trigger: "net assets | with restriction | without restriction | donor | NFP balance sheet",
    trap: "Board designations stay without restriction — only external donor conditions create 'with restriction.'",
    one_sentence: "NFP balance sheet shows net assets in two buckets: with and without donor restriction.",
    example: "Donor gives $50,000 'for scholarships' → with donor restriction; board sets aside $50,000 → without",
  },
  {
    topic_id: "NFP_004",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Contributed services — when to recognize",
    rule: "Recognize contributed services if: (1) they create or enhance a nonfinancial asset, OR (2) require specialized skills, provided by professionals with those skills, and would otherwise be purchased.",
    trigger: "contributed services | volunteer | donated services | recognize | specialized skills",
    trap: "① 'replacing last year\\'s secretary who earned $10,000' → 차감이 아니라 포지션 가치 증명 → 인식 근거\n② 'special events' ≠ specialized skills — special(일회성 행사) vs specialized(전문직 기술) 혼동\n③ 'other volunteers'로 주어 전환 신호 → ③번과 ④번 봉사자는 다른 사람들\n④ 'In addition' + 'last year\\'s' → $10,000이 $150,000에 미포함임을 확인하는 시제 단서",
    speed: "① 유급 직원 $150,000 → 무조건 포함\n② 'In addition' + 'last year\\'s' → $10,000은 $150,000 밖, 별도 포지션\n③ 비서 대체 자원봉사 → specialized + would otherwise be purchased → 인식 O → +$10,000\n④ 'other volunteers' + 'special events' → 일상 운영 아님 → 인식 X → $15,000 제외\n⑤ $150,000 + $10,000 = $160,000 → 정답 D",
    one_sentence: "Recognize contributed services only when specialized/professional skills are provided that the NFP would otherwise pay for.",
    example: "CPA donates audit services → recognize (specialized); volunteer greeter → do not recognize",
  },
  {
    topic_id: "NFP_005",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Conditional vs unconditional promise to give",
    rule: "Unconditional promise: recognize as revenue when pledge is received. Conditional promise: recognize only when the condition is substantially met.",
    trigger: "pledge | promise to give | conditional | unconditional | contribution",
    trap: "Distinguish conditions (must happen before pledge is binding) from restrictions (how money is used).",
    one_sentence: "Unconditional pledges → revenue immediately; conditional pledges → wait until condition is met.",
    example: "Pledge $100,000 unconditionally → Revenue $100,000 now; 'if we raise matching funds' → conditional, no revenue yet",
  },
  {
    topic_id: "NFP_006",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Underwater endowment — how to present",
    rule: "Underwater endowment (fair value < original gift amount) is presented within net assets with donor restriction. The deficiency stays in 'with restriction' unless donor permits otherwise.",
    trigger: "underwater | endowment | fair value below | original gift | deficiency",
    trap: "The loss does not move the deficiency to 'without restriction' — it stays with donor restriction.",
    one_sentence: "Underwater endowments remain in net assets with donor restriction; disclose the deficiency.",
    example: "Original gift $1,000,000 / current FV $900,000 → present $900,000 in with restriction; disclose $100,000 deficiency",
  },
  {
    topic_id: "NFP_007",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'conditional',
    card_name: "Statement of functional expenses — when required",
    rule: "Voluntary health and welfare organizations must present a separate statement of functional expenses (program vs. management vs. fundraising). All other NFPs must present expense information by nature and function (in statements or notes).",
    trigger: "functional expenses | program services | management | fundraising | VHW | voluntary health",
    trap: "All NFPs must disclose expense info by function, but only VHW must use a separate statement.",
    one_sentence: "All NFPs: functional expense disclosure required; voluntary health and welfare: must use a separate statement.",
    example: "Meals-on-Wheels (VHW): separate statement showing program $800K / G&A $100K / Fundraising $50K",
  },
  {
    topic_id: "NFP_011",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "Endowment — principal and income both with donor restriction",
    rule: "Donor가 사용 목적 지정한 endowment: ①원금 → with donor restriction ②투자수익 → 동일 목적 제한 → with donor restriction. Without donor restriction = $0. Board-designated(이사회 지정)만 without restriction.",
    trigger: "endowment | donor stipulated | income must be used for | nongovernmental NFP | without donor restriction | contribution revenue",
    trap: "B($12,000): 수익만 without restriction 오분류 → endowment 수익도 donor restriction 따름. C($150,000): 원금만 without restriction 오분류. A($162,000): 전액 without restriction 오분류. 공통 함정: endowment 수익 = without restriction으로 보는 오류.",
    one_sentence: "Donor 목적 지정 endowment = 원금+수익 모두 with donor restriction → without restriction $0.",
    example: "$150,000 endowment(목적 지정) + $12,000 수익 → 전액 with donor restriction / Without restriction = $0",
    speed: "① 'stipulated that income must be used for' → donor restriction 확인 ② 원금 with restriction ③ 수익도 동일 목적 → with restriction ④ Without restriction = $0 → 정답 D",
  },
  {
    topic_id: "NFP_008",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP Financial Statements — Statement of Activities",
    rule: "The statement of activities is the NFP equivalent of a commercial income statement. It reports revenues, expenses, gains, and losses by net asset class (with vs. without donor restriction). NFPs do NOT prepare a statement of comprehensive income.",
    trigger: '"revenues and expenses" + NFP/voluntary health and welfare → Statement of Activities\n"ongoing revenues and expenses" = 기간 손익 = 상업 I/S의 NFP 버전',
    trap: "TRAP 1: Statement of Financial Position → NFP의 B/S(자산·부채·순자산 시점 보고) — revenues/expenses와 무관\nTRAP 2: Statement of Cash Flows → 현금 유입·유출만 보고, 수익·비용 개념 아님\nTRAP 3: Statement of Comprehensive Income → NFP는 이 재무제표 자체를 작성하지 않음 (영리기업 전용)",
    one_sentence: "NFP의 수익·비용 = Statement of Activities (상업 I/S와 동일 역할).",
    example: "Voluntary health org revenues $2M / expenses $1.8M → Statement of Activities shows $200K increase in net assets",
    context_background: "NFP(비영리조직)도 상업 기업처럼 한 기간 동안 얼마를 벌고 얼마를 썼는지 보여주는 재무제표가 필요하다. 상업 기업에서는 이 역할을 Income Statement(손익계산서)가 담당하지만, NFP에는 I/S가 없다. 대신 Statement of Activities가 동일한 역할을 수행한다 — 수익(revenues), 비용(expenses), 이익/손실(gains/losses)을 보고하며, 순자산(net assets)이 기간 중 얼마나 변동했는지를 보여준다. 특히 Voluntary Health and Welfare Organization(자발적 보건복지단체)은 별도의 Statement of Functional Expenses도 요구되는 만큼, 재무제표 구조를 명확히 아는 것이 시험에서 핵심이다.",
    context_trigger: '"revenues and expenses" + voluntary health and welfare / NFP → Statement of Activities',
    rule_title: "NFP 재무제표 — 수익·비용 보고",
    rule_items: [
      "Statement of Activities = NFP의 I/S 역할: revenues, expenses, gains, losses 보고",
      "순자산 변동(change in net assets)을 with/without donor restriction으로 구분 표시",
      "Statement of Financial Position = NFP의 B/S: 자산·부채·순자산 시점 보고 (수익·비용 아님)",
      "Statement of Cash Flows = 현금 유입·유출 보고 (수익·비용 아님)",
      "Statement of Comprehensive Income = NFP는 작성하지 않음 (영리기업 전용)",
      "Voluntary Health and Welfare org 추가 요구: Statement of Functional Expenses 별도 작성",
    ],
    speed: "① 'revenues and expenses' 키워드 확인\n② NFP 맥락 → I/S 역할을 하는 재무제표 찾기\n③ NFP I/S = Statement of Activities → 정답 B\n④ D 소거: NFP는 Comprehensive Income 없음 → 1초 컷",
  },
  {
    topic_id: "NFP_012",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP donated goods — other operating revenue at fair value",
    rule: "NFP 기증 물품 인식: FV로 Other Operating Revenue 인식. 분류 기준: 핵심 운영 관련 물품(의약품·식품 등) → Other Operating Revenue / 운영 무관 기부 → Nonoperating Revenue. Gross presentation 필수 — 비용 차감(net) 불가.",
    trigger: "donated goods | medicines donated | invoice canceled | NFP hospital | other operating revenue | fair value | contribution",
    trap: "A(credit to operating expenses): Net presentation 오류 → GAAP Gross presentation 요구, 비용 상계 불가. B(memorandum only): 실물 자산 기증은 반드시 장부 기록 필수. D(nonoperating): 병원에서 의약품 = 핵심 운영 자산 → Operating.",
    one_sentence: "NFP 기증 물품 = FV로 Other Operating Revenue; 비용 차감 아닌 수익 별도 인식(Gross).",
    example: "의약품 $7,500 기증 → Dr. Inventory $7,500 / Cr. Other Operating Revenue $7,500 (병원 핵심 운영 관련)",
    speed: "① 기증 물품 → FV 수익 인식 ② 의약품 = 병원 핵심 운영 → Operating ③ 주된 수익(진료비) 아님 → Other Operating Revenue → 정답 C",
  },
  // [NFP_009] NFP Donated Assets — Initial Recognition at Fair Value
  // RULE    : 기부 자산 최초 인식 = 기부일 공정가치 / Donor's basis 수령자와 무관
  // TRIGGER : "shares of stock received" + NFP → 기부일 FV / Donor's basis → 즉시 소거
  // TRAP    : Donor's basis(B) / Average(C) / End of year FV(D) — 후속 측정과 최초 인식 혼동
  {
    topic_id: "NFP_009",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP Donated Assets — Initial Recognition at Fair Value",
    rule: "NFP가 주식 등 자산을 기부받을 때 최초 인식 = 기부일 공정가치(fair value on date of donation). Donor's basis(기부자 취득원가)는 수령 NFP와 무관 — 기부자 세무신고용 개념. 이후 시장성 유가증권은 매 결산일 공정가치로 재평가하지만, 최초 인식은 반드시 기부일 FV.",
    trigger: '"shares of stock" + "received" + NFP → fair value on the date of donation\n"donated assets" / "contributed assets" + NFP → 기부일 공정가치로 인식\nDonor\'s basis 언급 → 수령자 입장에서 무관 → 즉시 소거',
    trap: "TRAP 1: Donor's basis (B) → 기부자의 취득원가. 수령 NFP 입장에서 완전히 무관. 기부자 세무신고용 개념\nTRAP 2: Average of donor's basis and FV (C) → 존재하지 않는 규칙. Donor's basis 자체가 irrelevant\nTRAP 3: Fair value at end of year (D) → 후속 측정(subsequent measurement)과 최초 인식 혼동. 초기 인식 = 기부일 FV / 결산일 재평가는 별개",
    one_sentence: "NFP 기부 자산 최초 인식 = 기부일 공정가치; Donor's basis는 수령자와 무관.",
    example: "기부자가 $10에 취득한 주식을 기부일 시가 $100에 기부 → NFP 장부: $100 (donor's basis $10 무시)",
    context_background: "NFP가 주식이나 자산을 기부받을 때 얼마로 장부에 올려야 할까? 기부자 입장에서는 오래 전에 $10에 산 주식을 기부할 수 있고, 기부 시점 시가는 $100일 수 있다. NFP는 기부받은 시점의 공정가치(fair value on date of donation)로 기록한다. 기부자의 원가(donor's basis)는 기부자의 세무 신고에 관련된 개념이지, 수령 기관의 장부 금액과는 무관하다. 이후 시장성 있는 유가증권은 매 결산일마다 공정가치로 재평가되지만, 최초 인식은 반드시 기부일 기준 공정가치다.",
    context_trigger: '"shares of stock received as donation" + NFP → 기부일 FV 인식 / Donor\'s basis → 수령자 무관',
    rule_title: "NFP 기부 자산 최초 인식 기준",
    rule_items: [
      "기부 자산 최초 인식 = 기부일 공정가치(fair value on date of donation)",
      "Donor's basis(기부자 취득원가)는 수령 NFP 장부와 무관 — 기부자 세무신고용",
      "최초 인식 이후: 시장성 유가증권 → 매 결산일 공정가치로 후속 재평가",
      "최초 인식(기부일 FV)과 후속 측정(결산일 FV)은 별개 개념",
    ],
    speed: "① NFP + 기부 자산 수령 → 기부일 공정가치\n② Donor's basis 언급 → 수령자와 무관 → B·C 즉시 소거\n③ End of year → 후속 측정 개념 혼동 → D 소거\n④ 정답 A",
  },

  // [NFP_013] NFP statement of cash flows — activity classification
  // RULE    : NFP SCF = 영리기업과 동일(ASC 230) / Operating = employees·suppliers·service recipients·grants / Financing = 차입 + 장기제한기부금
  // TRIGGER : nongovernmental not-for-profit | statement of cash flows | operating activity | investing activity | financing activity | grants paid | service recipients | contributions receivable
  // TRAP    : employees→investing(A) / service recipients→financing(B) / contributions receivable→investing(C) / 장기제한기부금만 Financing, 일반기부금은 Operating
  {
    topic_id: "NFP_013",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP statement of cash flows — activity classification",
    rule: "NFP SCF = 영리기업과 동일 기준(ASC 230). Operating = employees·suppliers 지급 / service recipients 수령 / contributions receivable 회수 / grants 지급. Financing = 차입·상환 + 장기제한기부금(endowment)만. Investing = 장기자산 취득·처분.",
    trigger: "nongovernmental not-for-profit | statement of cash flows | operating activity | investing activity | financing activity | grants paid | service recipients | contributions receivable",
    trap: "A(employees→investing): 직원·공급업체 지급 = Operating. B(service recipients→financing): 서비스 수혜자 수령 = Operating. C(contributions receivable→investing): 기부금 회수 = Operating. Financing 함정: 장기제한기부금만 Financing, 일반 기부금은 Operating.",
    one_sentence: "NFP SCF = 영리기업 동일 기준 / Grants·Employees·Service recipients·Contributions = 모두 Operating.",
    example: "Grants paid $50K → Operating outflow / Endowment received $500K → Financing inflow / Equipment purchased $200K → Investing outflow",
    speed: "① NFP SCF = 영리기업 동일 ② A·B·C = 모두 Operating ③ Grants paid = Operating disbursement → 정답 D",
  },

  // [NFP_010] NFP Statement of Cash Flows — Primary Purpose
  // RULE    : NFP SCF 목적 = 현금 수입·지출 정보 제공 (영리기업과 동일)
  // TRIGGER : 'primary purpose of SCF' → 현금 수입·지출 / donor-restricted 강조 아님
  // TRAP    : donor-restricted 강조(A) / 간접법 조정을 목적으로 혼동(B) / Operating만(D)
  {
    topic_id: "NFP_010",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP Statement of Cash Flows — Primary Purpose",
    rule: "NFP SCF primary purpose = 현금 수입·지출에 관한 정보 제공 (영리기업과 동일).\nDonor-restricted contributions 강조 아님.\nSCF 구성: Operating + Investing + Financing 3섹션 (영리기업과 동일 구조).\n간접법 사용 시 net assets → operating CF 조정 표시는 부수적 방법, primary purpose 아님.",
    trigger: "'primary purpose of statement of cash flows' → 현금 수입·지출 정보 제공\nNFP + SCF → 영리기업과 동일 목적\n'reconcile net assets to operating CF' → 간접법 부수 표시, 목적 아님\n'donor-restricted' + SCF → 강조 대상 아님, SCF는 모든 현금흐름 보고",
    trap: "A: NFP = donor-restricted 강조가 primary purpose라는 혼동. SCF는 모든 현금흐름 보고.\nB: 간접법 조정 표시를 primary purpose로 혼동. 부수적 표시 방법일 뿐.\nD: Operating만 표시한다는 오해. NFP SCF = Operating + Investing + Financing 전부 포함.",
    one_sentence: "NFP SCF primary purpose = 현금 수입·지출 정보 제공; 영리기업과 동일, donor-restricted 강조 아님.",
    speed: "① 'primary purpose' → 현금 수입·지출 정보 제공\n② NFP도 영리기업 SCF와 동일 목적·구조\n③ 답: C",
    context_background: "[NFP SCF — 영리기업과 같은 목적]\nASC 958(NFP 회계기준)에서도 SCF의 primary purpose는 일반 기업과 동일:\n→ 한 기간의 현금 수입(receipts)과 현금 지출(payments)에 관한 유용한 정보 제공\n\n[흔한 오해 3가지]\n① 'NFP니까 donor-restricted가 핵심'\n→ 아님. SCF는 restricted·unrestricted 구분 없이 모든 현금흐름 보고\n→ Donor-restricted는 Statement of Activities나 주석에서 다룸\n\n② '간접법 조정(net assets → operating CF)이 primary purpose'\n→ 아님. 간접법은 operating 섹션 표시 방법일 뿐\n→ 직접법을 써도 SCF의 목적은 동일\n\n③ 'Operating 섹션만 있다'\n→ 아님. NFP SCF = Operating + Investing + Financing 3섹션\n→ 영리기업 SCF와 구조 동일\n\n[NFP SCF와 영리기업 SCF 차이]\n거의 없음. 단, donor-restricted contributions 중 장기 투자 목적 수령분은\nFinancing 섹션으로 분류 (일반 기부금과 구분).",
  },

  // [NFP_014] NFP contribution revenue — cash + unconditional pledge, exclude net assets released
  // RULE    : Contribution revenue = cash 수령 + unconditional pledge / 지출액(net assets released) = reclassification → 제외
  // TRIGGER : contribution revenue | cash collected | unconditional pledge | spent on | net assets released | statement of activities
  // TRAP    : A($12K): 지출액을 contribution으로 오인 / B($15K): pledge 누락 / C($57K): 지출액+pledge 혼합
  {
    topic_id: "NFP_014",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP contribution revenue — cash + unconditional pledge, exclude net assets released",
    rule: "Contribution revenue = ①cash 수령액 + ②unconditional pledge 약정액. 지출액(spent) = net assets released from restrictions = reclassification → contribution revenue 제외. 사용 목적 제한(with restriction)이 있어도 수령·약정 시 수익 인식.",
    trigger: "contribution revenue | cash collected | unconditional pledge | spent on | net assets released | statement of activities",
    trap: "A($12K): 지출액을 contribution으로 오인 → net assets released는 reclassification. B($15K): pledge 누락 → unconditional pledge도 당기 수익. C($57K): 지출액 + pledge 혼합 오류.",
    one_sentence: "Contribution revenue = cash 수령 + unconditional pledge / 지출액(net assets released)은 reclassification → 제외.",
    example: "Cash $15K 수령 + Pledge $45K 약정 = $60K / $12K 지출 → net assets released(별도 라인), contribution 아님",
    speed: "① Cash $15K → contribution ② Pledge $45K → contribution ③ $12K spent → net assets released(제외) ④ $15K+$45K = $60K → 정답 D",
  },

  // [NFP_015] NFP joint costs — allocation between fund-raising and program services
  // RULE    : Fund-raising + Program services 결합 활동 → 적절한 배분 기준으로 양쪽에 분리 배분
  // TRIGGER : "combines fund-raising with educational materials/program services" → Joint costs → 배분
  // TRAP    : 전액 fund-raising / 전액 program services / 전액 M&G 처리 → 모두 오류
  {
    topic_id: "NFP_015",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP joint costs — allocation between fund-raising and program services",
    rule: "NFP가 fund-raising과 program services(교육자료 배포 포함)를 결합해 수행할 때 발생하는 Joint costs → 적절한 배분 기준(appropriate allocation basis)을 사용해 Fund-raising / Program Services 양쪽에 분리 배분. 한 항목으로 전액 처리 불가.",
    trigger: '"combines fund-raising with educational materials / program services" → Joint costs → 배분 필요\n"total combined costs" → 전액 처리 아님 → allocation\n"educational materials" → Program Services 카테고리',
    trap: "① 전액 Fund-raising → Program Services 기능 무시 → 오류\n② 전액 Program Services → Fund-raising 기능 무시 → 오류\n③ 전액 Management & General → 두 기능 모두와 무관한 별개 카테고리 → 오류\n④ 'educational materials' = Program Services (NFP 핵심 미션 수행) — 별도 카테고리 아님",
    one_sentence: "NFP Joint costs(fund-raising + program services 결합) → 적절한 기준으로 양쪽 배분; 전액 처리 불가.",
    example: "모금 편지에 교육 자료 포함 → 인쇄비를 fund-raising / program services 비율로 배분",
    context_background: "NFP의 비용은 기능별로 분류된다: Program Services / Management & General / Fund-raising. 하나의 활동이 두 가지 기능을 동시에 수행할 때(예: 모금 편지에 교육 자료 포함), 비용을 한쪽으로 전액 배분하면 재무제표가 왜곡된다. GAAP은 이런 Joint costs(결합원가)를 적절한 배분 기준을 사용해 각 기능에 분리 배분하도록 요구한다.",
    speed: "① 'combines' 키워드 → 두 기능 동시 존재\n② 두 기능 → 전액 처리 불가 → B·C·D 소거\n③ Appropriate allocation basis → 정답 A",
  },

  // [NFP_016] NFP equity securities — FV remeasurement + unrealized gain + dividend income
  // RULE    : Equity securities → 연말 FV 재평가 / FV 변동 + 배당금 모두 net assets 증가
  // TRIGGER : "equity securities" → FV 재평가 신호 / "dividends received" → investment income → net assets 증가 / "fair market value at year-end" → FV 변동 계산
  // TRAP    : 배당금 누락 / FV 변동 누락 / 연말 FV 그대로 사용
  {
    topic_id: "NFP_016",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP equity securities — FV remeasurement, unrealized gain, and dividend income in net assets",
    rule: "NFP 유가증권 처리:\n① Equity securities(시장성 있음) → 매 결산일 FV 재평가\n② FV 변동(unrealized gain/loss) → Statement of Activities → net assets 변동\n③ 배당금·이자(investment income) → 당기 수익 → net assets 증가\n④ 둘 다 net assets 증가에 포함 — 어느 하나도 제외 불가\n\nNFP Net Assets 증가 5가지:\n① Contributions(기부) ② Investment income(배당·이자) ③ Gains(FV변동·처분익) ④ Program service revenue ⑤ Other revenue",
    trigger: '"equity securities" → FV 재평가 신호 → 연말 FV 변동 계산 필요\n"dividends received" → investment income → net assets 증가\n"fair market value at year-end" → 기부일 FV와 차이 = unrealized gain/loss\n"without donor restrictions" → net assets without restriction 증가',
    trap: "① 배당금 누락 → investment income도 net assets 증가 포함\n② FV 변동 누락 → equity securities = 연말 FV 재평가 강제\n③ 연말 FV($165,000) 그대로 사용 → 기부일 FV + FV변동 + 배당 3개 합산 필요\n④ Donated inventory/PPE → 기부일 FV 고정 (재평가 없음) — equity securities와 구분",
    one_sentence: "NFP equity securities: 기부일 FV 인식 + 연말 FV 변동 + 배당금 = 모두 net assets 증가.",
    example: "기부 $150,000 + FV변동 +$15,000 + 배당 $7,500 = net assets +$172,500",
    context_background: "NFP가 시장성 있는 유가증권을 기부받으면 기부일 공정가치로 인식한다. 이후 결산일까지 시장가치가 변동하면 그 차이(unrealized gain/loss)를 Statement of Activities에 반영해 net assets를 조정한다. 배당금·이자 등 투자수익도 당기 수익으로 net assets를 증가시킨다. NFP net assets를 증가시키는 5가지: ①Contributions ②Investment income ③Gains ④Program service revenue ⑤Other revenue.",
    speed: "① 기부 FV $150,000\n② 연말 FV $165,000 - $150,000 = +$15,000 (unrealized gain)\n③ 배당 +$7,500 (investment income)\n④ $150,000 + $15,000 + $7,500 = $172,500 → 정답 B",
  },

  // [NFP_018] NFP contribution revenue — exchange transaction split
  // RULE    : Contribution revenue = 총액 - FMV of benefits received / Exchange portion = benefit FMV
  // TRIGGER : "donor receives tickets/goods/benefits" → FMV 차감 / "acknowledgment only" → 차감 불필요
  // TRAP    : 전액 contribution / $0 / ticket FMV를 contribution으로 오인
  {
    topic_id: "NFP_018",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "NFP contribution revenue — exchange transaction split when donor receives benefits",
    rule: "NFP 기부금 수령 시 기부자가 대가(benefit)를 받는 경우:\n① Contribution revenue = 총 수령액 - FMV of benefits received\n② Exchange portion = FMV of benefits (티켓, 물품 등)\n③ Acknowledgment(이름 게재 등) → 경제적 가치 없음 → 차감 불필요\n\n[Contribution 정의 4요건]\n① Unconditional ② Nonreciprocal ③ Voluntary ④ Not ownership investment",
    trigger: '"donor receives tickets / goods / benefits" + NFP → FMV 차감 후 contribution\n"FMV of tickets = $X" → $X = exchange portion → 차감\n"acknowledgment in program" → 경제적 가치 없음 → 차감 불필요\n총액 그대로 contribution → benefit 유무 확인 필수',
    trap: "① 전액($225) contribution → 티켓 FMV 차감 필요\n② $0 → 일부는 순수 기부 가능\n③ 티켓 FMV를 contribution으로 오인 → exchange portion\n④ Acknowledgment를 benefit으로 차감 → 경제적 가치 없음, 차감 불가",
    one_sentence: "NFP contribution revenue = 총액 - FMV of benefits; 대가 없는 순수 기부분만 contribution.",
    example: "$225 수령 / 티켓 FMV $150 → Exchange $150 / Contribution $75 / 이름 게재 → 차감 없음",
    context_background: "NFP가 기부금을 수령할 때 기부자가 아무런 대가 없이 주면 전액 contribution revenue다. 그러나 기부자가 티켓, 물품 등 경제적 가치 있는 대가(benefit)를 받으면 그 FMV만큼은 exchange transaction이다. Contribution revenue는 순수하게 대가 없이 준 금액만 해당한다.",
    speed: "① 기부자 benefit FMV 확인 ($150)\n② Acknowledgment → 경제적 가치 없음 → 무시\n③ $225 - $150 = $75 → 정답 D",
  },

  // [NFP_019] NFP Fundraising vs Management & General — Expense Classification
  // RULE    : Fundraising = 기부 유도 목적 비용만 / Annual report·Audit → M&G
  // TRIGGER : "sent to encourage contributions" → Fundraising / "annual report"·"audit" → M&G
  // TRAP    : Annual report를 Fundraising으로 착각(C) / 전액 합산(B) / $0(D)
  {
    topic_id: "NFP_019",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP Fundraising vs Management & General — Expense Classification",
    rule: "NFP 비용 3대 분류:\n\n① Program Services\n미션 수행 직접 비용 (환경보호단체: 환경교육, 캠페인 등)\n\n② Fundraising\n기부를 유도하기 위한 비용\n→ 기준: 목적이 기부 유도인가?\n→ 예: Unsolicited merchandise, Direct mail appeals, 모금 행사\n\n③ Management & General (M&G)\n행정·감독·법적 비용 (Fundraising 아닌 모든 지원 서비스)\n→ Annual report 인쇄: 조직 전체 보고 목적 → M&G\n→ Audit: 재무 감독·행정 → M&G\n→ Accounting, legal, executive management → M&G",
    trigger: '"sent to encourage contributions" → Fundraising 즉시 확정\n"annual report" → M&G (기부 유도 아닌 행정 활동)\n"audit by CPA firm" → M&G (재무 감독)\n목적이 기부 유도인지 확인 → Yes → Fundraising / No → M&G',
    trap: "Annual report를 Fundraising으로 착각: 기부자에게 배포하더라도 목적이 행정 보고 → M&G\nAudit을 Fundraising으로 착각: 재무 감독·신뢰성 제고 → M&G, 기부 유도 목적 아님\n전액 합산: 목적별 분류 필수, 일괄 처리 불가\n$0: merchandise는 명확히 기부 유도 목적",
    one_sentence: "Fundraising = 기부 유도 목적만; Annual report·Audit = M&G; '기부 유도인가?'가 분류 기준.",
    speed: '"encourage contributions" → Fundraising\nAnnual report / Audit → M&G → 즉시 소거\n→ Merchandise 금액만',
    context_background: "[NFP 비용 분류 핵심 판단 기준]\n\n■ Fundraising\n질문: 이 비용의 목적이 기부를 유도(induce contributions)하는 것인가?\nYes → Fundraising\n\n대표 항목:\n- Unsolicited merchandise(무상 상품 발송): 기부를 유도하기 위해 보내는 물품 → Fundraising ✅\n- Direct mail appeal: 기부 요청 우편물 → Fundraising ✅\n- 모금 이벤트·갈라 행사 비용 → Fundraising ✅\n\n■ Management & General\n질문: 이 비용이 기부 유도 목적인가? → No\n→ 조직 운영·행정·감독 지원 비용 → M&G\n\n대표 항목:\n- Annual report 인쇄: 조직 전체 현황 보고(기부자·일반 공중) → 행정 목적 → M&G ✅\n- CPA 감사: 재무제표 신뢰성 확보 → 행정·감독 → M&G ✅\n- Accounting, legal, executive management → M&G ✅\n\n[함정 주의]\n'Annual report를 기부자에게 보내니까 Fundraising?'\n→ 아님. 보내는 대상이 아니라 목적이 기준.\n→ Annual report = 조직 전반 정보 제공 목적 → M&G\n\n'Audit이 기부자 신뢰 제고에 도움이 되니까 Fundraising?'\n→ 아님. 간접적 효과가 있어도 직접 목적이 기부 유도가 아니면 → M&G",
    example: "Merchandise $37,500('encourage contributions') → Fundraising\nAnnual report $18,000 → M&G\nAudit $4,500 → M&G\n→ Fundraising = $37,500만",
  },

  // [NFP_020] Conditional Promise to Give — Contributions Receivable Recognition
  // RULE    : 조건부 약속 → 조건 충족 전 인식 불가 / 충족 후 현금 미수취 → Contributions Receivable
  // TRIGGER : "promised to give if" → 조건부 → 조건 충족 여부 확인
  // TRAP    : Cash 오답(현금 미수취) / Deferred Revenue 오답(NFP에 해당 없음) / 미보고 오답(조건 충족 후)
  // EXAMPLE : 20,000 meals 조건 Year 1 말 충족, 현금 미수취 → Contributions Receivable $100,000
  {
    topic_id: "NFP_020",
    category: "NFP Revenue Recognition",
    topic_name: "Conditional Promise to Give — Contributions Receivable Recognition",
    summary: "조건부 기부 약속은 measurable barrier 충족 시 인식. 현금 미수취 시 Contributions Receivable 계상.",
    rule: "조건부 약속 → 조건 충족 전: 인식 불가. 조건 충족 후 현금 미수취: Contributions Receivable. 조건 충족 후 현금 수취: Cash.",
    trigger: '"promised to give if" → 조건부 약속 → 조건 충족 여부 확인. 조건 충족 + 현금 미수취 → Contributions Receivable.',
    trap: "Cash 오답 → 현금 미수취. Deferred Revenue 오답 → NFP에 해당 없음. 조건 충족 후 미보고 오답.",
    example: "20,000 meals 조건 Year 1 말 충족, 현금 미수취 → Contributions Receivable $100,000",
    speed: "조건부 약속 + 조건 충족 + 현금 미수취 → Contributions Receivable (무조건 반사)",
  },

  // [NFP_021] NFP Contribution Revenue Recognition — Based on Satisfying Conditions
  // RULE    : NFP 기부금 인식 기준 = Satisfying conditions / Unconditional → 즉시 / Conditional → 조건 충족 시
  // TRIGGER : "contribution revenue recognition" + NFP → Satisfying conditions
  // TRAP    : Time requirements(A) → Governmental fund / Restrictions(B) → 분류 기준, 인식 아님 / Performance obligations(D) → 상업 기업
  {
    topic_id: "NFP_021",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "NFP Contribution Revenue Recognition — Satisfying Conditions",
    rule: "NFP 기부금 수익 인식 기준 = Satisfying conditions (조건 충족)\n\nUnconditional contribution → 즉시 수익 인식\n   (with or without donor restriction으로 분류)\n\nConditional contribution → 조건 충족 시 수익 인식\n   조건 충족 전: Refundable advance(부채) 처리\n   조건 충족 후: Revenue 인식\n\n[Conditions vs Restrictions 구분]\nConditions = 수익 인식 여부 결정 (언제 인식하나)\nRestrictions = 인식 후 분류 방법 (어디에 분류하나)",
    trigger: '"contribution revenue recognition" + NFP → Satisfying conditions\n"unconditional" → 즉시 revenue\n"conditional" + "if/when [조건]" → 조건 충족 전 Refundable advance\n"time requirements" → Governmental fund 기준 (NFP 아님)\n"performance obligations" → ASC 606 상업 기업 기준 (NFP 아님)',
    trap: "A(Time requirements): Modified accrual 정부 회계 수익 인식 기준 → NFP 기부금과 무관\nB(Satisfying restrictions): Restrictions = 분류 기준(with/without donor restriction) → 수익 인식 기준 아님. 수익은 이미 인식된 후 분류만 다름\nD(Performance obligations): ASC 606 상업 기업 기준 → NFP 기부금은 exchange transaction 아니므로 적용 안 됨\n공통 함정: Restrictions와 Conditions 혼동 → Restrictions는 보고 목적, Conditions는 인식 기준",
    one_sentence: "NFP 기부금 인식 기준 = Satisfying conditions; Unconditional → 즉시 / Conditional → 조건 충족 시.",
    speed: "① Time requirements → Governmental fund → 소거\n② Restrictions → 분류 기준, 인식 아님 → 소거\n③ Performance obligations → 상업 기업 → 소거\n④ Satisfying conditions → 정답 C",
    context_background: "[Conditions vs Restrictions — 가장 중요한 구분]\n\nConditions (조건) = 수익 인식 '여부' 결정\n예: '매칭펀드 $100K 모으면 기부하겠다'\n→ 매칭펀드 달성 전: 수익 인식 불가 → Refundable advance(부채)\n→ 달성 후: 수익 인식\n\nRestrictions (제한) = 수익 인식 '분류' 결정\n예: '장학금 목적으로만 사용하라'\n→ 수령 즉시 수익 인식 (Unconditional이므로)\n→ With donor restriction으로 분류\n→ 장학금 지급 시: Net assets released from restrictions\n\n[다른 수익 인식 기준과 비교]\nGovernmental fund (Modified accrual)\n→ Measurable + Available (60일 이내 회수 가능)\n→ NFP 기부금과 완전히 다른 기준\n\nASC 606 (상업 기업)\n→ Performance obligations 충족 시 인식\n→ NFP 기부금은 교환거래(exchange)가 아니므로 ASC 606 미적용\n→ NFP 기부금 = 비호혜적 이전(nonreciprocal transfer)\n\n[NFP 기부금 처리 흐름]\nUnconditional → Dr. Cash(or Receivable) / Cr. Contribution Revenue\n   → With restriction or Without restriction 분류\n\nConditional (조건 미충족) → Dr. Cash / Cr. Refundable Advance(부채)\nConditional (조건 충족) → Dr. Refundable Advance / Cr. Contribution Revenue",
  },

  // [NFP_023] NFP Collections — Contribution Recognition Exception (3 Conditions)
  // RULE    : 3조건 모두 충족 시 비인식 가능 / 매각수익→컬렉션 재투자가 핵심
  // TRIGGER : "proceeds used to acquire other items for collections" → 비인식 OK
  // TRAP    : 일반활동 지원 / 전시 후원 / 건물 구입 → 조건 미충족 → 인식 필요
  {
    topic_id: "NFP_023",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_REVENUE_RECOGNITION",
    card_type: 'concept',
    card_name: "NFP collections — contribution non-recognition exception: 3 conditions",
    rule: "NFP Collections 기부 비인식 예외 — 3가지 조건 모두 충족 시 수익 인식 불필요:\n\n① 공공 전시·교육·연구 목적 보유\n   (투자·재정적 이익 목적 아님)\n\n② 관리·보존·보호 정책 존재\n\n③ 매각 수익 → 반드시 다른 컬렉션 구입\n   또는 기존 컬렉션 직접 관리에 재투자\n   (일반 활동·전시·건물 등 다른 용도 → 조건 미충족 → 인식 필요)\n\n→ 3가지 모두 충족 → 비인식 선택 가능\n→ 하나라도 미충족 → 기부금 수익 인식 필수",
    trigger: '"historical artifacts / works of art / collections" + NFP → 3가지 조건 확인\n"proceeds used to acquire other collection items" → 조건 ③ 충족 → 비인식 가능\n"proceeds used for general activities / exhibits / buildings" → 조건 ③ 미충족 → 인식 필요',
    trap: "일반 활동 지원(general activities)에 매각 수익 사용: 조건 ③ 미충족 → 인식 필요\n전시 후원(sponsor exhibits): 컬렉션 재투자 아님 → 인식 필요\n건물 구입(purchase buildings): 컬렉션 직접 관리 아님 → 인식 필요\n조건 1~2만 충족: 3가지 모두 충족해야 비인식 가능",
    one_sentence: "NFP collections 비인식 = 3조건 모두 충족 / 매각수익 컬렉션 재투자가 핵심 조건.",
    speed: "매각수익 → 컬렉션 구입 or 직접관리 → 비인식 OK\n그 외 용도 → 인식 필요",
    context_background: "[왜 이 예외가 존재하는가]\n박물관·미술관 등 NFP가 기증받은 예술품·유물을 수익으로 잡으면 재무제표가 왜곡될 수 있음. 특히 팔 의도 없이 순수 전시·보존 목적으로 받은 경우. 단, 매각 후 일반 영업에 쓰면 실질적으로 자산을 현금화한 것이므로 인식 필요.\n\n[핵심 조건 ③ 적용 판단]\n컬렉션 구입 → OK\n기존 컬렉션 보존·복원 비용 → OK\n일반 운영비 → NG\n새 전시관 건물 → NG (컬렉션 직접 관리 아님)",
  },

  // [NFP_022] NFP Contributed Services — Specialized Skill Recognition Criteria
  // RULE    : Specialized skill 보유 + specialized 역할 수행 + otherwise 구매 → revenue 인식
  // TRIGGER : "volunteers as [역할]" → 역할이 specialized인지 판단 기준
  // TRAP    : 간호사→receptionist = non-specialized role / board member CPA → 역할 specialized이면 인식 가능
  {
    topic_id: "NFP_022",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_REVENUE_RECOGNITION",
    card_type: 'conditional',
    card_name: "NFP Contributed Services — Specialized skill person doing non-specialized role?",
    rule: "Contributed services revenue 인식 조건 (동시 충족):\n① 제공자가 specialized skill 보유\n② NFP가 otherwise 해당 서비스를 구매했어야 함\n\n판단 기준: 사람의 직업이 아닌 실제 수행 역할이 specialized인지.\n간호사→receptionist = 불인식 (역할 non-specialized)\n수의사→동물 진료 = 인식\nCPA→감사 장부 작성 = 인식\n교사→dog walking = 불인식",
    trigger: '"provides volunteer [전문 역할]" → 수의사 진료, CPA 감사 → 인식\n"volunteers as an extra [비전문 역할]" → receptionist, dog walking → 불인식\n"board member" + specialized skill → 역할 specialized이면 인식 가능\n"normal billing rate" → fair value 측정 기준',
    trap: "간호사(specialized person) → receptionist(non-specialized role) 구분 실패 → $3,000 포함 오답.\nBoard member = 이해충돌로 제외해야 한다는 착각 → 역할이 specialized이면 인식 가능.\nSpecialized person이면 무조건 인식 → role 기준 무시 오류.",
    one_sentence: "Contributed services: 사람이 아닌 역할 기준. Specialized skill + specialized 역할 + otherwise 구매 → 인식.",
    speed: "수의사 진료 ✅ + CPA 감사 ✅ = $12,500 | 간호사→접수원 ❌ | 교사→dog walking ❌",
    example: "수의사 동물 진료 $8,000 ✅\nCPA 감사 장부 $4,500 ✅\n간호사→receptionist $3,000 ❌ (역할 non-specialized)\n교사 dog walking $2,000 ❌\n→ Revenue = $12,500",
    context_background: "[Contributed Services 인식 원칙]\nNFP는 봉사 서비스를 받아도 무조건 수익으로 인식하지 않는다. 두 조건 동시 충족 시에만 인식.\n\n[왜 역할 기준인가]\n수익 인식의 핵심은 'NFP가 그 서비스에 경제적 가치를 지불했어야 하는가'. 간호사가 접수 업무를 하면 NFP는 전문 간호 서비스가 아닌 일반 접수 업무를 받은 것 → 전문 간호사를 고용할 필요가 없었던 역할 → otherwise 구매 조건 미충족 가능성.\n\n[Otherwise 구매 조건]\n봉사자가 없었다면 NFP가 그 서비스를 돈 주고 샀어야 하는가?\n수의사 진료 → Yes (보호소는 수의사 고용 필요)\nCPA 감사 장부 → Yes (외부 회계사 고용 필요)\nReceptionist 역할 → 기존 인력으로 커버 가능 → No일 수 있음\nDog walking → No (volunteer 없어도 직원이 할 수 있는 업무)\n\n[측정]\nFair value = normal billing rate (제공자의 정상 청구 요율)",
  },

  // [NFP_024] NFP SCF — Contribution Classification: Operating vs Financing
  // RULE    : 일반·단기 목적 → Operating / Endowment·long-lived assets → Financing
  // TRIGGER : "restricted for endowment" / "restricted for long-lived assets" → Financing
  // TRAP    : "Endowment activity" 선지 → SCF에 존재하지 않는 분류 / Operating 과잉 적용
  {
    topic_id: "NFP_024",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'conditional',
    card_name: "NFP SCF — contribution classified as financing when restricted for endowment or long-lived assets",
    rule: "NFP SCF 기부금 분류:\n\nOperating:\n- Unrestricted contributions\n- 단기 프로그램 목적 제한 기부금\n\nFinancing:\n- Endowment fund 설립/증가 목적\n- Long-lived assets 취득 목적\n→ 장기 자본 = 기업 자본 조달과 동일 성격\n\nSCF 3섹션만 존재: Operating / Investing / Financing\n→ 'Endowment activity' 섹션 없음",
    trigger: "'restricted for establishing an endowment fund' → Financing\n'restricted for long-lived assets' → Financing\n'contributions without donor restrictions' → Operating\n'donor-restricted' → 목적 확인: 장기 목적 → Financing / 단기 → Operating",
    trap: "A(Endowment activity): SCF에 존재하지 않는 분류 → 즉시 소거\nB(Operating): 일반 기부금은 Operating이지만 endowment 제한이면 Financing\nD(Investing): 기부금 자체는 Investing 아님\n'restricted = Financing' 과잉 적용: 단기 프로그램 제한은 Operating 유지",
    one_sentence: "일반 기부금 → Operating / endowment·장기자산 목적 제한 → Financing / Endowment activity 선지 → 즉시 소거.",
    speed: "'restricted for endowment' or 'long-lived assets' → Financing / 그 외 → Operating",
    example: "기부금 $100,000 (제한 없음) → Operating\n기부금 $50,000 (endowment 설립) → Financing\n기부금 $30,000 (특정 프로그램 운영) → Operating\n기부금 $80,000 (건물 취득 목적) → Financing",
    context_background: "[Endowment 기부금이 Financing인 이유]\nEndowment = 원금 영구 보존 장기 자본 → 기업 주식 발행·차입과 동일 성격 → Financing\n\n[NFP SCF = 영리기업 동일 기준]\n3섹션: Operating / Investing / Financing\n'Endowment activity' 섹션 존재하지 않음 → 시험 트랩",
  },

  // [NFP_025] NFP Overview — Revenue, Condition vs Restriction, Functional Expense, Reclassification
  // RULE    : Revenue 5가지 / Condition=인식여부 / Restriction=인식후분류 / Reclass=total 불변
  // TRIGGER : NFP 전반적 구조 문제 / Statement of Activities 구성 문제
  // TRAP    : Condition과 Restriction 혼동 / Reclassification이 total net assets 변화시킨다고 착각
  {
    topic_id: "NFP_025",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_FINANCIAL_REPORTING",
    card_type: 'concept',
    card_name: "NFP overview — revenue types, condition vs restriction, functional expense, reclassification",
    rule: "【Revenue — 5가지 종류】\n① Contributions — 일방적 기부 (ASC 958)\n② Exchange transactions — 대가 있는 거래 (ASC 606)\n③ Investment income — 배당·이자·자본이득\n④ Program service revenue — 수강료, 입장료\n⑤ Special events — 갈라 디너, 경매\n\nSupport = 반대급부 없는 것 (Contributions, Grants)\nRevenue = 서비스 대가 (Exchange, Program, Special events)\n\n【Condition vs Restriction — 핵심 구분】\nCondition = Revenue Recognition 판단 (인식 여부)\n→ 조건 충족 전: no revenue / 충족 후: 인식 가능\n\nRestriction = 인식 후 Net Asset 분류\n→ With donor restriction: 목적·기간 제한\n→ Without donor restriction: 자유 사용\n\n【Functional vs Nature Expense】\nNature (성격): Salaries / Rent / Depreciation\nFunctional (기능): Program services / M&G / Fundraising\n→ ASC 958: 두 방식 모두 공시 필수 (Matrix 표)\n\n【Reclassification — 제한 해제】\nWith DR↓ + Without DR↑ → Total net assets 불변\nDr. Net assets with DR\nCr. Net assets without DR\n→ Statement of Activities 두 컬럼에 반대 부호 표시",
    trigger: "'net assets released from restriction' → Reclassification → total 불변\n'statement of activities' 구성 → Revenue·Support·Expense·Reclassification 구조\n'functional expense' → 3가지 분류 + Nature 교차 공시\n'conditional' contribution → 조건 충족 전 인식 금지",
    trap: "Condition과 Restriction 혼동:\n→ Condition = 인식 여부 / Restriction = 인식 후 분류\n→ Conditional contribution은 조건 충족 전 어느 Net Asset에도 없음\n\nReclassification = total net assets 변화:\n→ With DR↓ = Without DR↑ → Total 불변\n→ 두 컬럼 합계 항상 $0\n\nExpense = With DR 컬럼에도 표시:\n→ Expense는 Without DR 컬럼에만 표시\n\nSpecial events = revenue만 인식:\n→ Revenue + Expense 동시 인식 (Gross 또는 Net 표시)",
    one_sentence: "Condition=인식여부 / Restriction=인식후분류 / Reclass=total불변 / Expense=Without DR만 / Special events=Revenue+Expense 동시.",
    speed: "Reclassification → total net assets 불변 확인\nConditional → 충족 전 어느 컬럼에도 없음\nExpense → Without DR 컬럼만",
    context_background: "[Statement of Activities 구조]\nWithout DR | With DR | Total\n─────────────────────────────\nRevenue & Support\n  Contributions    500  200  700\n  Exchange trans   150   —   150\n  Program svc rev   80   —    80\n  Investment inc    30   —    30\n  Special events    40   —    40\n  Released from restriction +50 (50)   —  ← Reclass\n─────────────────────────────\nTotal revenue     850  150 1,000\nExpenses\n  Program svc    (600)  —  (600)\n  M&G            (150)  —  (150)\n  Fundraising     (50)  —   (50)\n─────────────────────────────\nChange in NA       50  150   200\n\n[Exchange transaction = With DR 없음]\nDonor restriction은 contribution 개념\nExchange transaction은 대가 받고 서비스 제공 → DR 없음\n\n[Special events 동시 인식]\nGala dinner 티켓 $100 (원가 $30)\n→ Revenue $100 + Expense $30 동시 인식\nGross 또는 Net 표시 모두 허용",
  },

  // [NFP_015] NFP hospital — net patient service revenue
  // RULE    : Net = Gross − charity care − contractual adj / Provision for credit losses → expense (차감 아님)
  // TRIGGER : 'net patient service revenue' → Gross − charity care − contractual adj
  // TRAP    : credit loss provision을 contra-revenue로 차감(B) / charity care 미차감(C)
  {
    topic_id: "NFP_015",
    book_id: 'GN',
    chapter_id: 'GN_CH2',
    topic_group: 'GN_CH2_NFP',
    sub_category_id: "U6_NFP_REVENUE_RECOGNITION",
    card_type: 'calculation',
    card_name: "NFP hospital — net patient service revenue: charity care and contractual adjustments are contra-revenue",
    rule: "NFP 병원 Net patient service revenue 계산:\nGross patient service revenue\n− Charity care (contra-revenue)\n− Contractual adjustments (contra-revenue)\n= Net patient service revenue\n\nProvision for credit losses → Expense (수익에서 차감 아님)\n\n[항목별 성격]\n① Charity care: 처음부터 받을 의도 없음 → 수익 자체가 아님 → contra-revenue\n② Contractual adjustments: 보험사 협상 할인 → 받기로 계약 안 된 금액 → contra-revenue\n③ Provision for credit losses: 청구했지만 못 받을 것 같은 금액 → 수익 인식 후 별도 expense",
    trigger: "'net patient service revenue' → Gross − charity care − contractual adjustments\n'provision for credit losses' → expense 처리, 수익 차감 아님\n'established billing rates' + 'charity care included' → Gross에서 charity care 먼저 차감",
    trap: "B($828,000): provision for credit losses를 contra-revenue로 차감 → expense 처리해야 함\nC($846,000): charity care 미차감 → charity care는 반드시 차감\nA($882,000): contractual adjustments 누락 또는 잘못된 조합\n공통 함정: provision for credit losses = 대손충당금 설정 → contra-revenue 아닌 expense",
    one_sentence: "Net patient service revenue = Gross − charity care − contractual adj; credit loss provision은 expense.",
    speed: "① Gross $930,000\n② − Charity care $30,000\n③ − Contractual adj $84,000\n④ = $816,000\n⑤ Credit loss $18,000 → expense(별도), 수익 차감 아님",
    context_background: "[왜 charity care는 contra-revenue인가]\n병원이 처음부터 받을 생각이 없이 무료로 제공한 서비스. 청구서 자체를 발행하지 않거나 발행해도 수금 의도가 없다. 수익으로 인식할 수 없는 금액 → Gross에서 차감.\n\n[왜 contractual adjustments는 contra-revenue인가]\nMedicare/Medicaid 등 보험사와 사전에 협상된 할인율. 예: $100 청구 but 보험사와 $70에 합의 → $30은 애초에 받기로 계약된 금액이 아님 → contra-revenue.\n\n[왜 provision for credit losses는 expense인가]\n청구는 했고 받기로 되어 있는데, 환자·보험사가 실제로 못 갚을 것 같은 금액. 수익은 먼저 인식(기준: 서비스 제공 완료) → 이후 대손 예상분을 expense로 처리. Credit loss expense는 수익의 성격을 바꾸지 않는다.\n\n[실무 흐름]\n청구 $930,000 → charity care $30K 차감 → contractual adj $84K 차감 → Net revenue $816,000 인식\n→ 이 중 $18,000은 못 받을 것 같음 → Provision for credit losses $18,000 (expense)\n→ Net realizable revenue ≈ $798,000 (재무제표에는 별도 표시)",
  },

  // ── CONT ───────────────────────────────────────────────────────────────────
  {
    topic_id: "CONT_001",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'concept',
    card_name: "Gain contingency — how much to accrue",
    rule: "Gain contingencies are never accrued regardless of probability or estimability. Recognition timing = When realized only. Disclose in notes if probable. Accrual answer = $0. Loss contingency 비교: Probable + Estimable → accrue. Remote + Guarantee → disclose (예외).",
    trigger: '"plaintiff" + "favorable outcome" + "probable" → Gain contingency → accrual 불가, notes disclosure만\n"high probability" + "reasonably estimate" 조합이 나와도 → gain이면 accrual $0\nLoss contingency 규칙(probable + estimable → accrue)과 반드시 구분',
    trap: "TRAP 1: 금액 추정 가능 + probable → gain accrual 가능 착각. Loss contingency 규칙을 gain에 적용하는 오류\nTRAP 2: 세후 금액 계산(× (1−30%)) → tax rate 제시 = 함정. Gain 인식 자체가 $0이므로 세후 계산 무의미\nTRAP 3: 법률비용 차감($5M − $100K) → 법률비용도 함정 데이터. Gain 인식 불가이므로 차감 계산 무의미\nTRAP 4: probable이면 note disclosure → 공시는 하지만 I/S 인식은 $0\n공통 함정: probable + estimable 조건 충족 → gain accrual 가능 착각. 이 조건은 Loss에만 적용",
    one_sentence: "Gain contingency accrual = $0 always; probable이면 notes disclosure 필수.",
    example: "Lawsuit outcome likely favorable, potential gain $500,000 → accrue $0 / probable → disclose in notes",
    context_background: "회계의 보수주의(conservatism) 원칙은 이익은 실현될 때까지 인식하지 말고, 손실은 가능성이 보이는 즉시 인식하라는 비대칭 원칙이다. Gain contingency(이익 우발상황)는 이 원칙의 대표적 적용 사례다 — 승소 가능성이 아무리 높고 금액 추정이 가능해도 실제로 판결이 나기 전까지는 이익을 장부에 올릴 수 없다.\n\n단, 공시(disclosure) 규칙은 별도로 적용된다. Probable이면 notes에 disclosure 의무가 있다 — 금액과 성격을 주석에 기재해야 한다. Reasonably possible이면 disclosure 선택, Remote이면 원칙적으로 불필요하다.\n\n정리하면: Gain contingency = accrual 절대 불가 + probable이면 notes disclosure 필수.\n\n반면 Loss contingency는 accrual·disclosure 기준이 다르다:\nProbable + Estimable → Accrual ✅ / Disclosure ✅\nProbable + Not Estimable → Accrual ❌ / Disclosure ✅\nReasonably Possible → Accrual ❌ / Disclosure ✅\nRemote → Accrual ❌ / Disclosure ❌ (원칙)\nRemote + Guarantee → Accrual ❌ / Disclosure ✅ (예외)\n\n특히 Guarantee(타인 채무 보증)는 Remote여도 공시 의무가 있다 — 보증 규모가 재무제표 이용자에게 중요한 정보이기 때문이다.",
    context_trigger: '"plaintiff" + "favorable outcome" → Gain contingency 확인 → accrual $0 / probable → notes disclosure',
    rule_title: "Gain vs Loss Contingency 처리 기준",
    rule_items: [
      "Gain contingency 인식 시점 = When realized (실현 시점) — 유일한 인식 조건",
      "Gain contingency: 확률·금액 무관 accrual 절대 불가 → $0",
      "Gain contingency: Probable → notes disclosure 필수",
      "Loss contingency: Probable + Estimable → accrual + disclosure",
      "Loss contingency: Probable + Not Estimable → disclosure만",
      "Loss contingency: Reasonably Possible → disclosure만",
      "Loss contingency: Remote → 원칙적 불필요",
      "Loss contingency: Remote + Guarantee → disclosure 필수 (예외)",
    ],
    speed: "① 'plaintiff' + 'favorable outcome' → Gain contingency 확인\n② Gain contingency → accrual 무조건 $0, 보수주의 원칙\n③ Probable → note disclosure 의무 → A\n④ B·D 소거: accrual 형태는 모두 불가 / C 소거: probable이면 disclosure 필요",
  },
  {
    topic_id: "CONT_002",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'conditional',
    card_name: "Loss contingency — when to accrue",
    rule: "Accrue a loss contingency when BOTH: (1) probable that a liability has been incurred, AND (2) amount can be reasonably estimated.",
    trigger: "loss contingency | probable | estimable | accrue | contingent liability",
    trap: "Both conditions must be met — probable alone or estimable alone is not enough to accrue.",
    one_sentence: "Accrue a loss contingency only when it is both probable and reasonably estimable.",
    example: "Pending lawsuit — probable outcome $200,000 and estimable → Dr. Loss $200,000, Cr. Liability $200,000",
  },
  {
    topic_id: "CONT_007",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'calculation',
    card_name: "Warranty rate change — change in estimate, prospective application",
    rule: "Warranty % 변경 = Change in Estimate → Prospective. 당기 Sales × 신 비율만 계산. 과거 연도 소급 없음. Warranty Expense vs Liability 구분: Expense = 판매 시 전액 한 방 인식(I/S) / Warranty Liability = 실제 수리 시 차감(B/S 누적잔액).",
    trigger: "previously estimated | now believes X% to be a better estimate | warranty | change in estimate | prospective | Year 3 expense",
    trap: "B($200,000): 구 비율 2% 계속 적용 오류. C($176,000): 과거 두 연도 평균 사용 오류 → Change in Estimate는 평균 내지 않음. D($276,000): 과거 평균 + 당기 합산 오류. Warranty Liability 잔액(B/S)과 Warranty Expense(I/S) 혼동 주의.",
    one_sentence: "Warranty % 변경 → Prospective → 당기 Sales × 신 비율만 / 과거 소급 없음.",
    example: "Year 3 Sales $10M × 1%(신 비율) = $100,000 / Year 1·2 비용 무관 / JE: Dr.Warranty Expense $100K / Cr.Warranty Liability $100K → 수리 시 Dr.Liability / Cr.Cash",
    speed: "① 'now believes 1% better estimate' → Change in Estimate → Prospective ② Year 3 expense = $10,000,000 × 1% = $100,000 ③ Year 1·2 비용 무관 → 정답 A",
  },
  {
    topic_id: "CONT_003",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'calculation',
    card_name: "Warranty liability — balance sheet carrying amount calculation",
    rule: "Warranty Liability 잔액 = 총 추정 warranty(모든 연도 판매분 합산) − 실제 지출 누계. 판매 시 전액 부채 인식, 실제 수리 시 부채 감소. 2년 warranty = 판매액 × (year1 % + year2 %).",
    trigger: "'warranty liability on balance sheet' → 총 추정 − 실제 누계\n여러 연도 판매분 → 모두 합산 후 차감\n'2% first year + 4% second year' → 판매액 × 6% = 총 추정",
    trap: "B ($4,250) → Y2 판매분만 계산. Y1 판매분 추정 누락\nA ($2,500) → 특정 연도 미지급분만 계산\nC ($11,250) → 실제 지출 Y2분($7,500)만 차감. Y1분($2,250) 누락\n공통 함정: ① 특정 연도 판매분만 계산 ② 실제 지출 누계 전체가 아닌 당기분만 차감",
    one_sentence: "Warranty Liability 잔액 = 전체 연도 총 추정액 − 실제 지출 누계.",
    speed: "① Y1 추정: $150,000 × 6% = $9,000\n② Y2 추정: $250,000 × 6% = $15,000\n③ 총 추정: $24,000\n④ 실제 누계: $9,750\n⑤ 잔액: $24,000 − $9,750 = $14,250",
    context_background: "[Warranty Liability T/A 구조]\n\nWarranty Liability\n─────────────────────────\n실제지출 $9,750 | Y1 추정  $9,000\n                | Y2 추정 $15,000\n─────────────────────────\n잔액    $14,250 |\n\n[판매 시 JE]\nDr. Warranty Expense XX\n  Cr. Warranty Liability XX\n→ 추정 비용 전액을 판매 시점에 인식 (matching principle)\n\n[실제 수리 시 JE]\nDr. Warranty Liability XX\n  Cr. Cash / Parts / Labor XX\n→ 부채 감소, P&L 영향 없음\n\n[2년 warranty 추정 구조]\n판매액 × 2% = 판매 후 1년 내 예상 수리비\n판매액 × 4% = 판매 후 2년 내 예상 수리비\n→ 판매 시점에 판매액 × 6% 전액 부채 인식\n\n[B/S 잔액 계산 원칙]\n모든 연도 판매분의 추정액을 합산한 후 실제 지출 누계 전액을 차감.\n당기분만 계산하거나 실제 지출 당기분만 차감하는 것은 오류.",
  },
  {
    topic_id: "CONT_008",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'calculation',
    card_name: "Loss contingency — range with best estimate vs minimum",
    rule: "Loss contingency range 제시 시 accrual 금액 결정: ① best estimate(most likely) 명시 → best estimate 금액 accrual ② range만 있고 best estimate 없음 → minimum 금액 accrual ③ maximum은 절대 사용 안 함. 기본 조건: probable + estimable 둘 다 충족 필수.",
    trigger: "probably receive | range of X to Y | most likely amount | best estimate | loss contingency | lawsuit | wrongful termination",
    trap: "A(maximum): GAAP는 최대값 사용 안 함. C($0): probable + estimable 충족 → 반드시 accrual. D(minimum): 'most likely' 명시된 경우 minimum 사용 불가 → best estimate 우선. minimum은 best estimate가 없을 때만.",
    one_sentence: "Range + most likely → best estimate accrual / Range만 → minimum accrual / Maximum은 절대 사용 안 함.",
    example: "Range $1.5M~$2.25M + most likely $1.95M → accrual $1.95M / Range $1.5M~$2.25M + no best estimate → accrual $1.5M(minimum)",
    speed: "① 'probably' → probable 충족 ② 'most likely $1,950,000' → best estimate 있음 ③ accrual = $1,950,000 → 정답 B",
  },
  {
    topic_id: "CONT_004",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'conditional',
    card_name: "Loss contingency — likelihood tiers and proper treatment",
    rule: "Probable + estimable → Accrue & Disclose. Reasonably possible → Disclose only (accrual 금지). Remote → Nothing. Accrual 시 항상 disclosure 동반 필수.",
    trigger: "'reasonably possible' → Disclosure only\n'probable' + 금액 추정 가능 → Accrual & Disclosure\n'remote' → No action\n'substantial amount' 단독 → 금액 불확실 → accrual 불가",
    trap: "A (No disclosure) → Remote일 때만. Reasonably possible은 반드시 공시\nC (Accrued but not disclosed) → 존재 불가 조합. Accrual은 항상 disclosure 동반\nD (Accrued and disclosed) → Probable + estimable 조건 필요. Reasonably possible로는 accrual 불가\n공통 함정: 'reasonably possible'을 'probable'로 혼동하여 accrual 처리",
    one_sentence: "Reasonably possible = Disclose only; Probable + estimable = Accrue & Disclose; Remote = Nothing.",
    speed: "키워드 → 3단계 매핑\nProbable → Accrue + Disclose\nReasonably possible → Disclose only\nRemote → Nothing",
    context_background: "[Loss Contingency 3단계 처리 기준]\n\n① Probable + reasonably estimable\n→ Accrual (Dr. Loss / Cr. Liability) + Disclosure\n→ 금액 범위만 알면 최솟값 accrual\n\n② Reasonably possible (= possible but not probable)\n→ Disclosure only (footnote)\n→ Accrual 금지\n→ 이 문제의 케이스\n\n③ Remote\n→ No accrual, No disclosure\n→ 예외: 특정 보증(guarantee)은 remote여도 공시\n\n[Accrual + Disclosure 조합 규칙]\n- Accrual만: 불가 (accrual하면 반드시 disclosure)\n- Disclosure만: 가능 (reasonably possible)\n- 둘 다 없음: 가능 (remote)\n- 둘 다 있음: 가능 (probable + estimable)\n\n[Gain Contingency 비교]\nGain contingency는 accrual 금지 → 실현 가능성 높아도 공시만 허용\n보수주의 원칙(conservatism) 적용",
  },
  // [CONT_005] Loss Contingency — Probable with Range, No Best Estimate → Lower Bound
  // RULE    : Probable + 범위 + No best estimate → Lower bound accrual
  // TRIGGER : 'no amount within that range is more likely' → Lower bound
  // TRAP    : Upper bound(A) / 평균값(B) / $0(D)
  {
    topic_id: "CONT_005",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'conditional',
    card_name: "Loss Contingency — Probable with Range, No Best Estimate → Lower Bound",
    rule: "Loss Contingency accrual 금액 결정: ① Best estimate 있음 → best estimate 금액 ② Best estimate 없음 + 범위 제시 → Lower bound(하한선) ③ Reasonably possible → 공시만 ④ Remote → 아무것도 안 함.",
    trigger: "'probable' + 금액 범위 → accrual 필수\n'no amount within that range is more likely' → best estimate 없음 → Lower bound\n'reasonably possible' → accrual 금지, 공시만\n'remote' → 아무것도 안 함",
    trap: "Upper bound(A): 상한선 사용 오류\n평균값(B): 범위 평균 사용 오류 — US GAAP은 하한선\n$0(D): Probable → 반드시 accrual\n공통 함정: best estimate 없으면 accrual 못 한다고 착각 → 범위 하한선으로 accrual",
    one_sentence: "Probable + 범위 + No best estimate → Lower bound accrual; 상한선·평균값 아님.",
    speed: "Probable + $225,000~$300,000 + No best estimate\n→ $225,000 accrual",
    context_background: "[Loss Contingency 3단계 판단]\n\n① 발생 가능성 판단\n- Probable → accrual 필수\n- Reasonably possible → 공시만\n- Remote → 아무것도 안 함\n\n② accrual 금액 결정 (Probable인 경우)\n- Best estimate 있음: 해당 금액으로 accrual\n- Best estimate 없음 + 범위 제시: Lower bound(하한선)으로 accrual\n  → '특정 금액이 더 가능성 높다'는 근거 없으면 보수주의(Conservatism) 원칙에 따라 최솟값\n\n[왜 하한선인가]\nUS GAAP(ASC 450)은 추정 범위 내에서 best estimate가 없을 때 가장 낮은 금액을 사용하도록 규정. IFRS는 중간값(Mid-point)을 사용하므로 US GAAP과 차이 있음.\n\n[이 문제 적용]\nProbable ✓ / 범위 $225,000~$300,000 / No best estimate\n→ Lower bound $225,000 accrual",
  },

  // [CONT_006] Loss Contingency — Reasonably Possible → Disclose Only
  // RULE    : Probable + Estimable → accrual + 공시 / Reasonably Possible → 공시만 / Remote → 아무것도 안 함
  // TRIGGER : 'reasonably possible' → accrual 금지, 공시만
  // TRAP    : 추정 가능해도 accrual 오답(C) / Probable 논리 적용 오답(B) / Remote 논리 적용 오답(A)
  {
    topic_id: "CONT_006",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'conditional',
    card_name: "Loss Contingency — Reasonably Possible → Disclose Only",
    rule: "Loss Contingency 3단계 판단:\nProbable + Estimable → accrual + 공시\nReasonably Possible → 공시만 (accrual 금지, 금액 추정 가능해도 동일)\nRemote → 아무것도 안 함",
    trigger: "'reasonably possible' → accrual 금지, 공시만\n'can estimate' + 'reasonably possible' → 추정 가능해도 accrual 불가\n가능성 수준 확인 즉시 3단계 판단표 적용",
    trap: "B(Disclosed + Accrued): Probable일 때만 accrual. Reasonably possible → accrual 금지\nC(Accrued only): 추정 가능해도 reasonably possible이면 accrual 불가\nA(Neither): Remote일 때만 해당. Reasonably possible → 반드시 공시 필요",
    one_sentence: "Reasonably Possible = 공시만; accrual은 Probable + Estimable일 때만 / Remote = 아무것도 안 함.",
    speed: "① 'reasonably possible' 확인\n② Probable 아님 → accrual 불가\n③ Remote 아님 → 공시 필요\n④ 답: D (Disclosed but not accrued)",
    context_background: "[Loss Contingency 3단계 판단표]\n\nProbable + Estimable  → Accrual ✅ Disclose ✅\nReasonably Possible   → Accrual ❌ Disclose ✅\nRemote                → Accrual ❌ Disclose ❌\n\n[핵심 포인트]\n금액 추정 가능 여부는 Reasonably Possible 단계에서 accrual 여부에 영향 없음.\n→ 추정 가능해도 Reasonably Possible이면 공시만.\n→ accrual은 오직 Probable + Estimable 조합에서만 가능.\n\n[왜 Reasonably Possible은 공시만 하는가]\n아직 손실 발생이 확정되지 않은 상황에서 부채를 인식하면 재무제표 이용자에게 오해를 줄 수 있음.\n그러나 투자자·채권자가 알아야 할 중요한 위험이므로 주석 공시는 필수.\n\n[Remote와의 차이]\nRemote = 발생 가능성이 매우 낮음 → 공시도 불필요\nReasonably Possible = 발생 가능성이 어느 정도 있음 → 공시 필수",
  },

  // [CONT_009] Remote contingency — guarantee and related party disclosure exceptions
  // RULE    : Remote → 일반적으로 accrual X / disclosure X
  //           예외 ①: Guarantee → Remote여도 disclosure 필수
  //           예외 ②: Related party transaction → 항상 disclosure 필수
  // TRIGGER : "remote" + "guarantee/cosigned" → disclosure 필수 / "president/CEO/officer" 관련 보증 → related party → disclosure
  // TRAP    : Remote = 아무것도 안 해도 된다 / Accrual까지 한다
  {
    topic_id: "CONT_009",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'conditional',
    card_name: "Remote contingency — guarantee and related party exceptions require disclosure",
    rule: "Contingency 처리 규칙:\n① Probable + Estimable → Accrue + Disclose\n② Probable + Not estimable → Disclose only\n③ Reasonably possible → Disclose only\n④ Remote → 아무것도 안 함\n\n[Remote 예외 — 반드시 Disclosure]\n예외①: Guarantee(보증) → Remote여도 항상 disclosure\n예외②: Related party transaction → 항상 disclosure\n→ 둘 중 하나만 해당해도 disclosure 필수",
    trigger: '"remote" + "guarantee / cosigned" → disclosure 필수 (accrual X)\n"president / CEO / officer / director" 관련 보증 → related party → disclosure 필수\n"remote" 단독 (보증·related party 없음) → accrual X, disclosure X',
    trap: "① Remote = 아무것도 안 해도 된다 → Guarantee·Related party 예외 확인 필수\n② Guarantee니까 accrual도 한다 → Remote는 accrual 불가, disclosure만\n③ Neither → Related party·Guarantee disclosure 의무 누락\n④ Related party이면 accrual도 한다 → Related party는 disclosure만 추가, accrual 기준은 별도",
    one_sentence: "Remote여도 Guarantee·Related party이면 Disclosure 필수; Accrual은 Remote이면 항상 불가.",
    example: "임원 주택 보증(remote) → ①Guarantee 예외 ②Related party 예외 → Disclosed only / 일반 고객 보증(remote) → ①Guarantee 예외 → Disclosed only",
    context_background: "Contingent liability는 발생 가능성에 따라 처리가 달라진다. Remote이면 일반적으로 accrual도 disclosure도 불필요하다. 그러나 두 가지 예외가 있다: ①Guarantee(보증)는 remote여도 항상 공시 ②Related party transaction은 항상 공시. 이 문제는 임원 주택 보증으로 두 가지 예외가 동시에 적용된다.",
    speed: "① Remote → accrual X\n② Guarantee → disclosure 예외 ✅\n③ CEO 관련 → Related party → disclosure 예외 ✅\n④ Accrual X + Disclosure O → Disclosed only → 정답 C",
  },

  // [CONT_010] Loss Contingency in Business Combination — Fair Value Recognition
  // RULE    : 피인수 기업 우발부채 → 인수 시점 fair value로 인식 (claim 금액 아님)
  // TRIGGER : "acquired" + "lawsuit against 피인수 기업" → fair value 찾기
  // TRAP    : claim 금액 사용 / $0 처리 / 중간값 사용
  {
    topic_id: "CONT_010",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_CONT',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'concept',
    card_name: "Loss Contingency in Business Combination — Fair Value Recognition",
    rule: "Business Combination에서 피인수 기업의 우발부채 인식:\n→ 인수 시점 fair value로 계상\n→ Claim 금액(원고 요구액) 아님\n→ Probable + fair value 제시 → fair value = accrual 금액\n\n[소송 구조]\n제3자(원고) → 소송 → 피인수 기업(피고)\n→ 인수 후 인수자가 부채 승계\n→ Fair value로 인식",
    trigger: '"acquired [회사]" + "lawsuit filed against [피인수 기업]" → Business Combination contingency\n"fair value of the liability was $X" → 인식 금액 = $X\n"seeking $Y in damages" → claim 금액 = 함정, 무시',
    trap: "claim 금액(seeking $X) 그대로 사용 → 원고 요구액이지 fair value 아님\n$0 처리 → probable이면 반드시 accrual\n중간값 사용 → 근거 없음\n소송 당사자 오해 → 제3자 vs 피인수 기업 구도, 인수자↔피인수 기업 간 소송 아님",
    example: "Grove Corp.이 Maple Inc. 인수\n→ 인수 전 제3자가 Maple에 $8M 소송 제기\n→ 인수 시점 fair value = $3M\n→ Grove 장부: Dr. Net Assets $3M / Cr. Contingent Liability $3M",
    speed: "Business combination + 피인수 기업 lawsuit → 'fair value of the liability' 찾기 → 그 금액이 답\n'seeking $X' 보이면 → 함정, 무시",
  },

  // ── INTANG ─────────────────────────────────────────────────────────────────
  {
    topic_id: "INTANG_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Patent defense — win the lawsuit",
    rule: "Successfully defending a patent: capitalize defense costs by adding to the existing Patent account. Amortize over the remaining life of the patent.",
    trigger: "patent | successfully defended | win | legal defense | patent lawsuit",
    trap: "Do NOT create a new intangible — add to the existing Patent account.",
    one_sentence: "Winning a patent lawsuit → capitalize costs into the existing patent account; amortize over remaining life.",
    example: "Defense costs $30,000 / won → Dr. Patent $30,000, Cr. Cash $30,000; amortize over remaining 7 years",
  },
  {
    topic_id: "INTANG_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Patent defense — lose the lawsuit",
    rule: "Losing a patent defense: expense all legal defense costs immediately. The patent itself may also require write-off if its value is impaired.",
    trigger: "patent | lost | lose lawsuit | defense costs | expense",
    trap: "No capitalization if you lose — all defense costs are immediate expense.",
    one_sentence: "Losing a patent lawsuit → expense all defense costs immediately.",
    example: "Defense costs $30,000 / lost → Dr. Legal Expense $30,000, Cr. Cash $30,000; consider patent write-off",
  },
  {
    topic_id: "INTANG_003",
    sub_category_id: "U3_INTANGIBLES",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    card_type: 'conditional',
    card_name: "Trademark — indefinite vs definite life classification",
    one_sentence: "Legal life is finite but renewable at minimal cost → indefinite-lived → no amortization, annual impairment test.",
    rule: "A trademark has a finite legal life (e.g. 10 years) but may be classified as indefinite-lived if it can be renewed at minimal or very little cost. Indefinite-lived → no amortization, annual FV vs BV impairment test. Definite-lived → amortize over useful life, indicator-based impairment test only. Key question: is renewal cost minimal/insignificant?",
    trigger: "trademark | renewable | minimal cost | very little cost | legal life | indefinite | definite | registration | renewal",
    trap: "'Legal life 10 years' alone does not mean definite-lived. If the problem states 'renewable at minimal cost' or 'very little cost' → indefinite-lived → no amortization. Missing the renewal cost language is the most common mistake.",
    speed: "Trademark renewal cost?\n├── Minimal / very little → Indefinite-lived\n│   → No amortization\n│   → Annual FV vs BV test (무조건)\n│\n└── Significant / uncertain → Definite-lived\n    → Amortize over useful life\n    → Indicator-based test only",
    example: "Trademark purchased $200,000 / legal life 10 years / renewable every 10 years at minimal cost\n→ Indefinite-lived → No amortization\n→ Annual impairment test: FV $180,000 < BV $200,000\n→ Impairment Loss $20,000\n\nTrademark legal life 10 years / renewal cost significant\n→ Definite-lived → Amortize $20,000/year\n→ Test only when indicator present",
    context_background: "Indefinite는 무한(infinite)이 아니라 예측 가능한 수명 한계가 없다는 의미. Legal life가 유한해도 갱신 비용이 아주 작다면 실질적으로 영구 사용 가능 → indefinite 분류. 상각 없는 대신 매년 FV test로 가치 감소 여부를 감시하는 구조.",
  },

  // [INT_006] Cloud computing arrangement — capitalize vs expense by stage
  // RULE    : Preliminary(system analysis)→expense / App development(implementation)→capitalize / Post(training)→expense
  // TRIGGER : "cloud computing" + "system analysis" + "implementation" + "training" + amortization
  // TRAP    : system analysis·training capitalize 착각 / 전체 합산 상각 → implementation만
  // [INT_CCA_001] Cloud Computing Arrangement — Capitalize vs Expense by Stage
  // RULE    : System analysis → expense / Implementation → capitalize / Training → expense
  // TRIGGER : 세 항목 동시 제시 → Implementation만 골라서 ÷ 계약기간
  // TRAP    : Training·System analysis 포함 합산 상각 / useful life 아닌 계약기간으로 상각
  {
    topic_id: "INT_CCA_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'calculation',
    card_name: "Cloud Computing Arrangement — Capitalize vs Expense by Stage",
    rule: "CCA 3단계 비용 처리:\n① Preliminary (System analysis) → 즉시 expense\n   어떤 솔루션 쓸지 리서치·비교 단계. 자산 가치 없음.\n② Application development (Implementation) → capitalize\n   우리 환경에 맞게 코딩·설정·통합·테스트. 없으면 시스템 작동 불가.\n③ Post-implementation (Training / Maintenance) → 즉시 expense\n   시스템은 이미 완성. 사람의 능력 향상 비용.\n\n상각 = Implementation ÷ 계약기간 (useful life 아님)",
    trigger: "'system analysis' + 'implementation' + 'training' 동시 제시 → Implementation만 capitalize\n'five-year term' → 상각 기간 = 계약기간\n'annual amortization' → capitalize 금액만 ÷ 계약기간",
    trap: "Training capitalize 착각 → 시스템 작동과 무관, 사람 교육비\nSystem analysis capitalize 착각 → 결정 전 리서치, 자산 가치 없음\n전체 합산 상각 → Implementation만\n계약기간 아닌 useful life 사용 → CCA는 계약 끝나면 사용 불가",
    one_sentence: "CCA: Implementation만 capitalize → 계약기간 상각; System analysis·Training은 즉시 expense.",
    speed: "① System analysis → expense (제외)\n② Implementation → capitalize ✅\n③ Training → expense (제외)\n④ Implementation ÷ 계약기간 = 연간 상각액",
    example: "System analysis $100K(expense) + Implementation $600K(capitalize) + Training $50K(expense)\n연간 상각 = $600K ÷ 5년 = $120,000",
    context_background: "[CCA capitalize 판단의 핵심 질문]\n'이 비용 없이도 시스템이 우리 회사에서 작동하는가?'\n→ YES(작동함) → expense\n→ NO(없으면 못 씀) → capitalize\n\n[자동차 비유]\n자동차 구매가 → capitalize (자산 취득)\n내비 초기 세팅 → capitalize (작동 가능 상태)\n운전 학원 등록비 → expense (차는 완성, 내 실력 문제)\n→ CCA도 동일: 시스템 작동 = 자산의 문제 / 잘 쓰는 것 = 사람의 문제\n\n[기존 소프트웨어 vs CCA 차이]\n기존 소프트웨어: 자산을 직접 소유 → 개발 과정 전체가 자산 가치 형성\nCCA(SaaS/IaaS/PaaS): 플랫폼은 이미 준비됨, 빌려서 사용\n→ 내가 만드는 게 아니라 우리 환경에 맞게 세팅하는 것만 내 자산\n→ 계약 끝나면 사용 불가 → useful life 아닌 계약기간으로 상각\n\n[3단계 각 항목 본질]\nSystem analysis: '어떤 SaaS 쓸까 비교·검토' → 결정 전, 자산 없음 → expense\nImplementation: '우리 데이터·프로세스에 맞게 코딩·설정·통합' → 없으면 못 씀 → capitalize\nTraining: '직원 사용법 교육' → 시스템 완성 후, 사람 능력 향상 → expense\n\n[FAR 전반의 일관된 자산화 원칙]\n자산이 의도한 상태로 작동하는가 → capitalize\n그 이후 사람·운영·유지에 쓰이는 돈 → expense\nPPE도 동일: 기계 설치비(capitalize) vs 조작 직원 교육비(expense)",
  },

  // [INTANG_004] Patent Capitalization — R&D Expense vs Legal Fees Capitalize
  // RULE    : R&D → 전액 즉시 expense(US GAAP) / Legal fees → capitalize / 특허 취득해도 R&D 자본화 불가
  // TRIGGER : 'research and development costs' → expense / 'legal fees for patent' → capitalize
  // TRAP    : R&D + Legal fees 합산 자본화(D) / R&D만 자본화(C) / Legal fees도 expense(A)
  {
    topic_id: "INTANG_004",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'conditional',
    card_name: "Patent Capitalization — R&D Expense vs Legal Fees Capitalize",
    rule: "US GAAP Patent 자본화 기준:\nR&D 비용 → 전액 즉시 expense (특허 취득 여부 무관)\nLegal fees (특허 등록·취득 관련) → capitalize\n자본화 금액 = Legal fees only (R&D 포함 불가)",
    trigger: "'research and development costs' → US GAAP = 전액 즉시 expense\n'legal fees associated with obtaining/registering the patent' → capitalize\n'patent was granted' + R&D 언급 → R&D는 expense, legal fees만 자본화",
    trap: "D($723,000): R&D + legal fees 합산 자본화 → R&D는 expense 대상, 포함 불가\nC($600,000): R&D만 자본화 → R&D는 전액 즉시 expense\nA($0): legal fees도 expense 처리 오류 → 특허 취득 법적비용은 반드시 capitalize",
    one_sentence: "US GAAP: R&D → 즉시 expense / Patent legal fees → capitalize; 특허 취득해도 R&D 자본화 불가.",
    speed: "① R&D $600,000 → 즉시 expense\n② Legal fees $123,000 → capitalize\n③ 자본화 금액 = $123,000 → 답: B",
    context_background: "[왜 R&D는 자본화 못 하는가]\nUS GAAP(ASC 730): R&D 비용은 미래 경제적 효익의 실현이 불확실하므로 발생 즉시 전액 expense. 특허라는 결과물이 나왔더라도 소급 자본화 불가. 연구 단계에서 발생한 비용은 이미 비용 처리된 것.\n\n[왜 Legal fees는 자본화하는가]\n특허 등록을 위한 법적 비용(filing fees, attorney fees)은 특허라는 무형자산을 취득하기 위해 직접 발생한 비용. 자산 취득 부대비용 → capitalize 원칙 적용.\n\n[자본화 후 처리]\nDr. Patent (Intangible Asset)   123,000\n    Cr. Cash                        123,000\n→ 경제적 내용연수(10년) 또는 법적 수명 중 짧은 기간에 걸쳐 상각\n연간 상각: $123,000 ÷ 10년 = $12,300\n\n[R&D JE]\nDr. R&D Expense   600,000\n    Cr. Cash          600,000\n→ 특허 취득 여부와 무관하게 발생 즉시 전액 expense",
  },

  // [INTANG_005] Intangibles — Asset vs Expense: R&D / Patent Defense / Goodwill / Trademark
  // RULE    : R&D → expense / 패소 → expense / 내부창출 goodwill → 인식불가 / 외부구매 → capitalize
  // TRIGGER : "debit to asset account" → purchase/외부취득 항목 / R&D·패소·내부창출 → 즉시 소거
  // TRAP    : R&D 자본화(A) / 패소 capitalize(B) / internally generated goodwill = 자산 착각(C)
  {
    topic_id: "INTANG_005",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Intangibles — Asset vs Expense: R&D / Patent Defense / Goodwill / Trademark",
    rule: "US GAAP 무형자산 자본화 vs 즉시 비용 처리:\n\n✅ Capitalize (Dr. Asset)\n- 외부 구매 intangible: trademark, patent 취득\n- 특허 승소 방어비용\n- M&A로 취득한 goodwill\n\n❌ Expense (즉시 비용)\n- R&D costs: 미래 효익 불확실 → 전액 즉시 expense\n- 특허 패소 방어비용: 자산 가치 입증 실패\n- Internally generated goodwill: 외부 거래 없어 원가 측정 불가 → 인식 불가",
    trigger: '"debit to an asset account" → capitalize 가능한 항목 찾기\n"purchase of [intangible]" → 외부 거래 → 원가 측정 가능 → 자산\n"research and development" → US GAAP 즉시 expense → 소거\n"unsuccessful defense" → 패소 → 즉시 expense → 소거\n"internally generated goodwill" → 인식 불가 → 소거',
    trap: "R&D 자본화: 특허로 이어졌어도 US GAAP에서 R&D는 전액 즉시 expense. 소급 자본화 불가\n패소 방어비 capitalize: 패소 = 자산 가치 입증 실패 → 즉시 expense. 승소(successfully defend)만 capitalize\nInternally generated goodwill = 자산 착각: 외부 거래 없어 원가 측정 불가 → 인식 불가. M&A에서만 goodwill 자산 인식\n공통: goodwill 단어 자체에 끌리거나 R&D 결과(특허)를 자산과 혼동",
    one_sentence: "Purchase(외부취득) → capitalize; R&D·패소·내부창출 goodwill → expense or 인식불가.",
    speed: "Purchased → Dr. Asset / R&D → expense / 패소 → expense / internally generated goodwill → 인식불가",
    context_background: "[US GAAP 무형자산 자본화 4대 케이스]\n\n① R&D (Research & Development)\n→ 전액 즉시 expense (ASC 730)\n→ 이유: 미래 경제적 효익 실현 불확실\n→ 특허로 이어졌더라도 R&D 단계 비용은 소급 자본화 불가\n\n② Patent Defense\n승소(successfully defend) → capitalize: 기존 자산 가치 입증·유지 → 기존 Patent 계정에 가산\n패소(unsuccessfully defend) → 즉시 expense: 자산 가치 입증 실패\n\n③ Goodwill\n내부창출(internally generated) → 인식 불가: 외부 거래 없어 원가 측정 불가\nM&A 취득 → capitalize: 지급 대가 − 순자산 FV = Goodwill\n\n④ 외부 구매 Intangible (trademark, patent 구매)\n→ capitalize at cost\n→ 이유: 외부 거래로 원가 측정 가능 → 자산 인식 요건 충족\n\n[자본화 핵심 요건]\n원가(cost)를 신뢰성 있게 측정할 수 있어야 함\n외부 구매 → 거래가격 = 원가 → 측정 가능\n내부 창출 → 원가 구분 불명확 → 측정 불가",
    example: "R&D $500K → Expense / Trademark purchased $80K → Dr. Trademark $80K / Patent defense won $30K → Dr. Patent $30K / Internally generated goodwill → $0 (not recognized)",
  },

  // [INTANG_006] Organization Costs — Expensed Immediately Under US GAAP
  // RULE    : Organization costs → GAAP: 즉시 expense / Tax: 60개월 amortize (혼동 주의)
  // TRIGGER : "organization costs" + "first year of operations" → 즉시 expense
  // TRAP    : 60개월(C) = 세무목적 / 40년(B) = 구 GAAP / never amortized(D) = indefinite-life
  {
    topic_id: "INTANG_006",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Organization Costs — Expensed Immediately Under US GAAP",
    rule: "Organization costs (법인 설립비용):\nGAAP 재무보고: 전액 즉시 expense (자산 인식 없음)\nTax purpose: 60개월(5년) amortize 허용\n\n→ GAAP ≠ Tax: 이 차이가 핵심 함정\n\n[Organization costs 예시]\n법인 설립 법률비용, 주주총회 비용, 인가 취득 비용, 초기 주식 발행 관련 비용",
    trigger: '"organization costs" + "first year of operations" → GAAP: 즉시 expense\n60개월 선지 → 세무목적, GAAP 재무보고 불가\n"beginning of its first year" → 설립 초기 비용 확인',
    trap: "C(60개월 상각): 세무목적 amortization 기간 → GAAP 재무보고 목적에 적용 불가\nB(40년 상각): 구 GAAP의 무형자산 최대 상각기간 → 현재 폐지, 무관\nD(never amortized): indefinite-life 무형자산 처리 방법 → organization costs는 자산이 아님\n공통 함정: 세무상 60개월 규정을 GAAP 재무보고에도 적용하는 혼동",
    one_sentence: "Organization costs → GAAP: 즉시 expense; 60개월은 세무목적 규정으로 GAAP 재무보고와 무관.",
    speed: "Organization costs → GAAP = 즉시 expense\nTax = 60개월 amortize (이 둘 혼동 → C 오답)",
    context_background: "[Organization Costs란]\n회사 설립 시 발생하는 법적·행정적 비용.\n예: 법인 설립 법률비용, 주주총회 운영비용, 사업 인가 취득 비용, 초기 조직 구성 비용\n\n[US GAAP 처리 — ASC 720-15]\n전액 즉시 expense. 자산으로 인식하지 않음.\nDr. Organization Expense $9,000\n    Cr. Cash $9,000\n\n[세무 처리]\nIRS는 조직 설립비용을 60개월(5년)에 걸쳐 amortize 허용.\n→ GAAP과 세무 처리가 다름 → 일시적 차이(temporary difference) → Deferred Tax 발생 가능\n\n[왜 C(60개월)이 단골 함정인가]\n①과거 GAAP: organization costs를 40년 이내로 상각하던 시절이 있었음\n②세무 규정: 현재도 세무상 60개월 상각 허용\n→ 이 두 가지 기억이 혼재하여 수험생이 60개월을 GAAP으로 착각\n→ 현행 US GAAP = 즉시 expense",
    example: "법인 설립비용 $9,000 → Dr. Organization Expense $9,000 / Cr. Cash $9,000\n세무신고 시: $9,000 ÷ 60개월 = $150/월 amortize (세무목적만)",
  },

  // [INTANG_008] Intangible Asset Amortization — MIN(legal life, economic life)
  // RULE    : 상각 기간 = MIN(법적 내용연수, 경제적 내용연수) / 보수주의
  // TRIGGER : "legal life X years" + "economic life Y years" → 짧은 것 선택
  // TRAP    : 법적 내용연수(긴 것) 사용 / 두 연수 평균 / 차이로 계산
  {
    topic_id: "INTANG_008",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'calculation',
    card_name: "Intangible asset amortization — shorter of legal life or economic life",
    rule: "무형자산 상각 기간 = MIN(법적 내용연수, 경제적/유용 내용연수)\n\n이유(보수주의): 경제적으로 더 빨리 가치 소멸되면 그 기간에 맞춰 비용 인식\n\n적용 범위:\n소프트웨어(internal use) → MIN(법적 보호기간, 경제적 유용기간)\n특허권 → MIN(법적 20년, 경제적 유용기간)\n프랜차이즈 → MIN(계약 기간, 경제적 유용기간)\n\n단, 두 가지 내용연수가 동시에 주어질 때만 MIN 적용\n하나만 주어지면 그 기간으로 상각",
    trigger: "'legal life X years' + 'economic/useful life Y years' → MIN(X, Y) 선택 'software for internal use' + 두 개 연수 제시 → 짧은 것 'shorter of legal or economic life' → MIN 공식 확정",
    trap: "법적 내용연수(긴 것) 사용 → 보수주의 위반, 경제적으로 먼저 소멸되는 기간 사용 두 연수 평균 → 존재하지 않는 방법 두 연수 차이(8−6=2년) 사용 → 오답 'for internal use' 소프트웨어를 즉시 비용처리 → 무형자산으로 자본화 후 상각",
    one_sentence: "상각 기간 = MIN(법적 내용연수, 경제적 내용연수) — 짧은 것이 보수적.",
    key_formula: "Annual amortization = Cost ÷ MIN(legal life, economic life)",
    example: "소프트웨어 $600,000 / 법적 8년 / 경제적 6년 MIN(8, 6) = 6년 → $600,000 ÷ 6 = $100,000/년",
    speed: "① legal life vs economic life → MIN 선택 ② 취득원가 ÷ MIN 연수 = 연간 상각비",
    context_background: "[왜 MIN인가]\n법적으로 8년 보호받아도 경제적으로 6년 후 쓸모없어지면 6년에 걸쳐 비용화.\n보수주의: 자산 가치 소멸을 보수적(이르게)으로 인식.\n\n[무한 내용연수 vs 유한 내용연수]\n유한 내용연수: 상각 O → MIN(legal, economic) 적용\n무한 내용연수(goodwill 등): 상각 X → 매년 손상 검사(impairment test)\n\n[다른 MIN 원칙과 비교]\n리스자산 감가상각: MIN(리스 기간, 유용 내용연수)\nLeasehold improvements: MIN(잔여 리스 기간, 개량 유용 내용연수)\n→ 모두 같은 보수주의 원칙에서 나온 것",
  },

  // [INTANG_007] Crypto Assets — Indefinite-Lived Intangible, FV Through NI (ASU 2023-08)
  // RULE    : Indefinite-lived / 상각 없음 / FV 매기 / 변동 → NI / 상승도 NI
  // TRIGGER : "crypto assets" → indefinite intangible + FV + NI | "indefinite life" → 상각 없음
  // TRAP    : Finite-lived / Acquisition cost / OCI / 일반 무형자산과 동일 처리
  {
    topic_id: "INTANG_007",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Crypto assets — indefinite-lived intangible, fair value through net income (ASU 2023-08)",
    rule: "Crypto Assets 회계처리 (ASU 2023-08):\n\n분류: Indefinite-lived intangible asset\n→ 내용연수 추정 불가 → finite 아님\n→ 상각 없음\n\n측정: 매 보고기간 Fair Value\n→ FV 변동 → 당기 Net income 반영\n→ 상승·하락 모두 NI 인식\n→ OCI 아님\n\n[일반 무형자산과 비교]\n일반 indefinite (Goodwill 등):\n→ 취득원가 / impairment only / 상승 인식 불가\n\nCrypto:\n→ FV 매기 / 상승·하락 모두 NI\n→ 측정 방식은 Trading securities와 유사",
    trigger: '"crypto assets" → indefinite-lived intangible + FV 매기 + 변동 NI\n"fair value each reporting period" + crypto → Net income\n"indefinite life" + crypto → 상각 없음\n"changes reflected in net income" → OCI 아님',
    trap: "Finite-lived 분류: 내용연수 추정 불가 → indefinite\nAcquisition cost 측정: FV 측정 필수 (일반 무형자산과 다름)\nOCI 반영: Net income 반영 (Trading securities처럼)\n일반 무형자산과 동일 처리: Crypto는 FV 상승도 NI 인식하는 특수 케이스",
    one_sentence: "Crypto = Indefinite intangible / FV 매기 재측정 / 변동 → NI / 상각 없음.",
    speed: "Crypto → Indefinite intangible / FV / NI | 상각 X | 상승도 NI (일반 무형자산과 다름)",
    context_background: "[왜 Crypto만 특별한 FV 측정인가]\n\n일반 무형자산: 실물·권리 기반 → 취득원가가 의미 있음\nCrypto: 분산원장(distributed ledger) 디지털 자산 → 가격 변동성 극심 → FV가 가장 relevant\n\n내용연수 없음: 언제 만료될지 알 수 없음 → indefinite\n상각 불가: indefinite → 상각 기간 설정 불가\n\n[Trading securities와 비교]\nTrading securities: 금융자산 / FV / 변동 NI\nCrypto: 무형자산 / FV / 변동 NI\n→ 측정 방식은 동일, 분류만 다름\n\n[ASU 2023-08 배경]\nFASB가 Crypto를 기존 어느 카테고리에도 딱 맞지 않아 별도 기준 제정\n현금도 아님 / 금융자산도 아님 / 일반 재고도 아님\n→ Indefinite-lived intangible + FV through NI라는 독특한 조합",
    example: "Year 1: Crypto 취득 $50,000\nYear 1 말: FV $65,000 → Gain $15,000 → Net income\nYear 2 말: FV $40,000 → Loss $25,000 → Net income\n상각: 없음 / Impairment test: 불필요 (FV 매기 측정)",
  },

  // ── SW ─────────────────────────────────────────────────────────────────────
  {
    topic_id: "SW_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG_SW',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Software to be sold — amortization amount",
    rule: "Amortize at MAX of: (1) ratio method = current revenues ÷ total projected revenues × carrying value; (2) straight-line over remaining economic life.",
    trigger: "software to be sold | amortization | ratio method | economic life | MAX",
    trap: "Always use the MAX of the two methods — never the lower.",
    one_sentence: "Software-to-sell amortization = MAX(revenue ratio method, straight-line).",
    example: "CV $1,200,000 / 4-yr life / year 1 revenue $1M / total projected $3M → MAX($400,000, $300,000) = $400,000",
  },
  {
    topic_id: "SW_002",
    sub_category_id: "U3_INTANGIBLES",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG_SW',
    card_type: 'conditional',
    card_name: "Software to be sold — capitalize vs expense by phase",
    one_sentence: "Technological feasibility 달성 전 → expense; 달성 후 출시 전 → capitalize; 출시 후 → amortize.",
    rule: "Phase 1 — Before technological feasibility: ALL costs expensed as R&D (planning, design, coding, testing prior to feasibility). Phase 2 — After technological feasibility, before product release: capitalize (coding, testing). Phase 3 — After product release: amortize using MAX rule (SW_001). Technological feasibility = completion of a detailed program design OR a working model.",
    trigger: "software to be sold | technological feasibility | capitalize | expense | R&D | working model | detailed program design | before release | after release",
    trap: "Technological feasibility is the dividing line — not product release. Costs before feasibility are always R&D expense even if the software is eventually capitalized. Do not confuse with internal-use software (which uses different phases: preliminary → application development → post-implementation).",
    speed: "Before Technological Feasibility → R&D Expense\n          ↓\nTechnological Feasibility 달성\n(detailed program design 완성 OR working model 완성)\n          ↓\nAfter Feasibility, Before Release → Capitalize\n          ↓\nProduct Release\n          ↓\nAmortize → MAX(revenue ratio, straight-line) ← SW_001",
    example: "Year 1: Planning & design before feasibility $200K → R&D Expense\nYear 1: Coding after feasibility $500K → Capitalize (Intangible Asset)\nYear 2: Product released → begin amortization\nAmortization = MAX(revenue ratio, SL over economic life)",
  },

  // ── PART ───────────────────────────────────────────────────────────────────
  {
    topic_id: "PART_001",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Partnership liquidation — order of payments",
    rule: "Order: (1) settle liabilities to outside creditors, (2) repay partner loans/advances, (3) distribute remaining capital to partners per capital balances.",
    trigger: "partnership | liquidation | dissolution | creditors | capital | order",
    trap: "Partners receive nothing before all creditors are paid in full.",
    one_sentence: "Liquidation priority: creditors first, then partner loans, then partner capital.",
    example: "Assets $100K / Creditors $60K / Partner loans $15K → pay creditors $60K, loans $15K, distribute remaining $25K",
  },
  {
    topic_id: "PART_004",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Partnership formation — initial capital account balance",
    rule: "파트너십 설립 시 Capital Account = FV of assets contributed − liabilities assumed. 장부금액(carrying amount)·원가(original cost) 무관. 이익 배분 비율(equal)과 초기 자본 잔액은 완전히 별개.",
    trigger: "formed a partnership | combining proprietorships | capital account balance | carrying amount | original cost | fair value | mortgage | largest capital",
    trap: "A(Brent): FV $120,000만 보고 최대 착각 → mortgage $52,500 차감 필수 = $67,500. B(equal): 이익 배분 equal ≠ 자본 잔액 equal. D(Aldee): 현금 기여 단순하지만 금액 비교 필수.",
    one_sentence: "Partnership 초기 Capital = FV − 부채; 장부금액·원가·이익배분비율 모두 무관.",
    example: "Aldee $75,000 / Brent $120,000−$52,500=$67,500 / Calla $82,500 → Calla 최대",
    speed: "① Aldee: $75,000 ② Brent: $120,000−$52,500=$67,500 ③ Calla: $82,500 ④ Calla 최대 → 정답 C",
    context_background: "[파트너십 초기 Capital Account 핵심 원칙]\n\n① 자산 기여 = FV 기준\n취득원가·장부금액 무관. 파트너십은 설립 시 각 자산을 공정가치(FV)로 기록.\n\n② 부채 인수 → Capital에서 차감\nChattel mortgage(동산 담보), Mortgage payable 등 파트너십이 인수한 부채는 기여자의 Capital에서 차감.\n→ Capital = FV of assets contributed − Liabilities assumed\n\n③ 이익 배분 비율 ≠ Capital 잔액\n'share profits and losses equally' = 이익/손실 배분 약정\n= 초기 Capital Account 금액과 완전히 별개\n→ 이 문구 보이면 즉시 Capital 계산과 분리\n\n[이 문제 적용]\nGow: Cash $80,000 → Capital $80,000 (부채 없음)\nCubb: Equipment FV $50,000 − Chattel mortgage $10,000 = Capital $40,000\n총 파트너십 자본 = $120,000\n\n[B 오답 분석]\n$60,000 = ($80,000 + $40,000) ÷ 2\n→ 'equally'를 Capital도 동등하게라고 착각\n→ 이익 배분 equally ≠ Capital 잔액 equally",
  },
  {
    topic_id: "PART_002",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Partnership income allocation — priority order with tiered percentages",
    rule: "파트너십 소득 배분 = 약정 순서대로 단계적 처리. 각 단계 후 잔여 소득 업데이트. 'over $X' = 초과분에만 적용. 최종 잔여분 = 균등 배분(또는 약정 비율).",
    trigger: "배분 조건이 순서대로 나열됨 → 단계별 순차 처리\n'up to $X' → 해당 금액까지만 적용\n'over $X' → 초과분에만 적용\n'remaining income' → 이전 단계 차감 후 잔여액 기준",
    trap: "C ($110,000) → 20% 구간을 $150,000 전체에 적용. 'over $100,000'이므로 $100,000 초과분($150,000)에만 적용\nB/D → 'remaining income over $150,000' 구간을 잔여 소득 기준이 아닌 총소득 기준으로 계산\n공통 함정: ① 각 단계 후 잔여 소득 업데이트 누락 ② 'over $X' 구간 기준액 혼동",
    one_sentence: "파트너십 배분 = 약정 순서대로 단계 처리 → 각 단계 후 잔여 업데이트 → 최종 잔여 균등 배분.",
    speed: "① Grove: $100,000 × 10% = $10,000 → 잔여 $240,000\n② Grove: $150,000 × 20% = $30,000 → 잔여 $210,000\n③ Hart·Ivey: ($210,000 − $150,000) × 5% = $3,000씩 → 잔여 $204,000\n④ 균등: $204,000 ÷ 3 = $68,000씩\n⑤ Grove: $10,000 + $30,000 + $68,000 = $108,000",
    context_background: "[파트너십 소득 배분 구조]\n파트너십은 법인세를 내지 않고 소득을 파트너에게 직접 배분. 배분 방식은 파트너십 약정(partnership agreement)에 따름.\n\n[단계별 배분 계산]\nNet Income: $250,000\n\nStep 1. Grove 10% × $100,000 = $10,000\n잔여: $250,000 − $10,000 = $240,000\n\nStep 2. Grove 20% × ($250,000 − $100,000) = 20% × $150,000 = $30,000\n잔여: $240,000 − $30,000 = $210,000\n\nStep 3. Hart·Ivey 각 5% × ($210,000 − $150,000)\n= 5% × $60,000 = $3,000씩\n잔여: $210,000 − $6,000 = $204,000\n\nStep 4. 균등 배분: $204,000 ÷ 3 = $68,000씩\n\n[최종 배분]\nGrove: $10,000 + $30,000 + $68,000 = $108,000\nHart: $3,000 + $68,000 = $71,000\nIvey: $3,000 + $68,000 = $71,000\n합계: $250,000 ✓\n\n[Step 3 함정 주의]\n'remaining income over $150,000' = 잔여 소득($210,000) 중 $150,000 초과분\n= $210,000 − $150,000 = $60,000이 기준\n총소득 $250,000 기준이 아님",
  },

  // [PART_003] Partnership Withdrawal — Bonus Method vs Goodwill Method
  // RULE    : Bonus Method = 잔류 파트너 자본 차감(P&L 비율) / Goodwill Method = Goodwill 인식
  // TRIGGER : 'bonus method' + 초과 지급 → 잔류 파트너 자본 감소 / Goodwill·Expense 인식 없음
  // TRAP    : No effect 오답(A) / Goodwill 인식 오답(C) / Expense 인식 오답(D)
  {
    topic_id: "PART_003",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'concept',
    card_name: "Partnership Withdrawal — Bonus Method vs Goodwill Method",
    rule: "파트너 탈퇴 시 초과 지급분 처리:\nBonus Method: 초과분 → 잔류 파트너 자본계정에서 P&L 비율로 직접 차감. Goodwill·Expense 인식 없음.\nGoodwill Method: 초과분 → Goodwill 자산 인식. 잔류 파트너 자본 유지.",
    trigger: "'bonus method' + 탈퇴 파트너 초과 지급 → 잔류 파트너 자본 감소\n'settlement exceeded capital balance' → 초과분 = bonus to retiring partner\n'bonus method' 명시 → goodwill 인식 없음, expense 인식 없음",
    trap: "A(No effect): Bonus Method에서 잔류 파트너 자본은 반드시 조정됨\nC(Goodwill): Goodwill은 Goodwill Method에서만 인식 — Bonus Method에서는 $0\nD(Expense): 파트너 자본 조정은 expense 아님 — 자본계정 직접 차감",
    one_sentence: "Bonus Method 초과 지급 = 잔류 파트너 자본 차감(P&L 비율); Goodwill·Expense 인식 없음.",
    speed: "① 'bonus method' 확인\n② 탈퇴자 초과 지급 → bonus to retiring partner\n③ 초과분 → 잔류 파트너 자본에서 P&L 비율로 차감\n④ 답: B",
    context_background: "[파트너 탈퇴 시 두 가지 방법]\n\n[Bonus Method]\n초과분을 잔류 파트너 자본계정에서 직접 차감. Goodwill 인식 없음.\n총자산 변화 없음 — 현금이 나가고 자본계정이 줄어드는 것뿐.\n\n[Goodwill Method]\n초과분만큼 Goodwill(무형자산)을 인식. 잔류 파트너 자본 유지.\n총자산 증가.\n\n[Bonus Method JE 예시]\nReed 자본 $100,000 / 실제 지급 $130,000 / 초과분 $30,000\nStone·Lane P&L 비율 50:50\n\nDr. Reed, Capital    100,000\nDr. Stone, Capital    15,000  ← $30,000 × 50%\nDr. Lane, Capital     15,000  ← $30,000 × 50%\n    Cr. Cash              130,000\n\n결과:\nStone 자본 감소: −$15,000\nLane  자본 감소: −$15,000\nGoodwill 인식:  $0\nExpense 인식:   $0\n\n[Goodwill Method JE 예시 (비교용)]\nDr. Goodwill          30,000\nDr. Reed, Capital    100,000\n    Cr. Cash              130,000\n\n→ 잔류 파트너 자본 변동 없음, 대신 Goodwill $30,000 B/S 인식",
  },

  // [PART_006] Partnership Withdrawal — Bonus Method vs Goodwill Method
  // RULE    : 나머지 파트너 자본 감소 → Bonus only
  //           나머지 파트너 자본 증가 → Bonus or Goodwill 둘 다 가능
  // TRIGGER : 'capital accounts of remaining partners were decreased' → Bonus: Yes / Goodwill: No
  //           'capital accounts increased' → 둘 다 가능
  // TRAP    : Goodwill method도 자본 감소 가능하다고 착각
  {
    topic_id: "PART_006",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'conditional',
    card_name: "Partnership Withdrawal — Bonus Method vs Goodwill Method",
    rule: "파트너 탈퇴 시 지급액 > 자본계정:\n\nBonus method:\n→ 초과분을 나머지 파트너 자본에서 차감\n→ 나머지 파트너 자본 감소\n→ 총 순자산 변화 없음\n\nGoodwill method:\n→ 초과분을 Goodwill(자산)로 인식\n→ 나머지 파트너 자본 증가\n→ 총 순자산 증가\n\n나머지 자본 감소 → Bonus method만 가능\n나머지 자본 증가 → 둘 다 가능",
    trigger: "'capital accounts of remaining partners were decreased' → Bonus: Yes / Goodwill: No\n'capital accounts increased' → Bonus or Goodwill 둘 다 가능 → C\n지급액 > 자본계정 → 두 방법 중 하나",
    trap: "Goodwill method가 나머지 파트너 자본을 감소시킨다고 착각\n→ Goodwill method는 Goodwill 자산 인식 → 나머지 파트너 자본 반드시 증가\nBonus method가 총자산을 변화시킨다고 착각 → 총자산 불변",
    one_sentence: "나머지 파트너 자본 감소 → Bonus method만 / 증가 → 둘 다 가능.",
    speed: "'remaining partners decreased' → D(Bonus: Yes / Goodwill: No)\n'remaining partners increased' → C(둘 다 Yes)",
    example: "Morgan 탈퇴 / 지급액 > 자본계정\n→ Nash·Ortega 자본 감소 → Bonus method만 해당\n→ Goodwill method였다면 Nash·Ortega 자본 증가했을 것",
  },

  // [PART_005] Partnership — Asset Recording, Bonus Method, Salary Allocation
  // RULE    : ①자산 = FV / ②Bonus: 자본계정 = 지분율×총자본 / ③Salary: 손실이어도 먼저
  // TRIGGER : 'lower of cost or FMV' → False / 'always credited for investment' + bonus → False
  //           'net loss' + 'salary allocation' → True (손실이어도 salary 먼저)
  // TRAP    : I 'lower of' 표현이 보수적으로 보여 맞는 것 같지만 → FV만
  //           II 투자금액 = 자본계정으로 착각 → 지분율×총자본
  {
    topic_id: "PART_005",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'conditional',
    card_name: "Partnership — Asset Recording, Bonus Method, Salary Allocation",
    rule: "① 파트너십 설립 시 자산 기록: 공정가치(FV) — lower of cost/FMV 아님\n② Bonus method 신규 파트너 자본계정:\n   = 가입 후 총자본 × 지분율\n   ≠ 투자금액 (차이가 bonus — 기존↔신규 파트너 간 이전)\n③ Salary allocation: 순손실이어도 먼저 배분\n   → 잔여 손실(더 커진)을 지분율로 나눔",
    trigger: "'lower of cost or FMV' → 즉시 False (FV만)\n'always credited for the amount of investment' + bonus → False\n'net loss' + 'salary allocation' → True (손실이어도 salary 먼저)",
    trap: "'lower of' 표현이 보수적으로 맞아 보이지만 → 파트너십은 FV만\nBonus method에서 투자금액 = 자본계정으로 착각\n순손실 시 salary 배분 안 한다고 착각 → 손실이어도 salary 먼저",
    one_sentence: "파트너십: 자산=FV / Bonus자본=지분율×총자본 / Salary=손실이어도 먼저.",
    speed: "I → 'lower of cost or FMV' → 즉시 False\nII → 'always credited for investment amount' + bonus → False\nIII → salary + net loss → True → D(III only)",
    example: "기존자본 $100K + C투자 $40K = 총자본 $140K / C 30% 지분\n→ C 자본계정 = $140K × 30% = $42K (투자금 $40K와 다름)\n→ 차이 $2K = 기존 파트너에서 C로 bonus 이전",
  },

  // [PART_007] Partnership allocation — salary allowance > earnings → residual loss by loss ratio
  // RULE    : ① Salary allowance 먼저 / ② 잔여 이익→이익비율 / 잔여 손실→손실비율
  // TRIGGER : Salary 합계 > Earnings → 잔여 = Loss → 손실 비율 적용
  //           "share profits equally and losses in 60/40" → 이익/손실 비율 구분
  // TRAP    : 잔여를 이익비율로 배분 / Salary만 배분 / 이익=손실 비율 동일 가정
  {
    topic_id: "PART_007",
    book_id: 'AA',
    chapter_id: 'AA_CH9',
    topic_group: 'AA_CH9_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'concept',
    card_name: "Partnership profit allocation — salary allowance exceeds earnings, loss distributed by loss ratio",
    rule: "파트너십 이익 배분 순서:\n① Salary allowance 먼저 각 파트너에 배분\n② 잔여 계산: Earnings - Salary 합계\n  - 잔여 > 0 (이익) → 이익 배분 비율 적용\n  - 잔여 < 0 (손실) → 손실 배분 비율 적용\n③ 각 파트너 최종: Salary + 잔여배분(±)\n\n[주의] 이익 비율 ≠ 손실 비율일 수 있음 → 문제에서 명시 확인",
    trigger: 'Salary 합계 > Earnings → 잔여 = Loss → 손실 비율 적용\n"share profits equally and losses in 60/40" → 이익(50/50) ≠ 손실(60/40) 구분\n각 파트너 최종 합산 = 총 Earnings 검증',
    trap: "① 잔여 손실을 이익 비율(50/50)로 배분 → 손실은 손실 비율(60/40) 적용\n② Salary만 배분하고 잔여 무시 → 잔여 반드시 배분\n③ 이익·손실 비율 동일하다고 가정 → 문제에서 항상 구분 확인\n④ 총합 검증: 두 파트너 합 = 총 Earnings여야 함",
    one_sentence: "Salary > Earnings → 잔여 Loss → 손실 비율로 배분; 이익/손실 비율 구분 필수.",
    example: "Salary $150,000 / Earnings $120,000 → Loss $(30,000) / 60/40 분배\n→ Cedar $82,500-$18,000=$64,500 / Grove $67,500-$12,000=$55,500",
    context_background: "파트너십에서 이익 배분 순서는 ①Salary allowance 먼저 ②잔여를 약정 비율로 배분이다. Salary allowance 합계가 실제 이익을 초과하면 초과분은 손실로 처리되어 손실 배분 비율로 나눈다. 이익과 손실 배분 비율이 다를 수 있으므로 문제에서 항상 구분해서 확인해야 한다.",
    speed: "① Salary 합계 $150,000 > Earnings $120,000 → 잔여 $(30,000) = Loss\n② Loss → 60/40 비율\n③ Cedar $82,500 - $18,000 = $64,500\n④ Grove $67,500 - $12,000 = $55,500 → 정답 C",
  },

  // [PART_008] Partnership Formation — Capital Account Initial Measurement
  // RULE    : Capital Account = FMV of contributed assets - assumed liabilities / Book value 사용 금지
  // TRIGGER : "partnership was formed" + "contributed property" → FMV 기준
  // TRAP    : Book value 사용 오답 / Mortgage 미차감 오답 / FMV 그대로(부채 미차감) 오답
  // EXAMPLE : 출자 부동산 FMV $500,000, mortgage $200,000 인수 → Capital Account = $300,000
  {
    topic_id: "PART_008",
    category: "Partnerships",
    topic_name: "Partnership Formation — Capital Account Initial Measurement",
    summary: "파트너십 설립 시 출자 자산은 FMV 기준 계상. 인수 부채 있으면 FMV에서 차감.",
    rule: "Capital Account = FMV of contributed assets - assumed liabilities. Book value 사용 금지.",
    trigger: '"partnership was formed" + "contributed property" → FMV 기준. "mortgage assumed by the partnership" → FMV에서 차감.',
    trap: "Book value 사용 오답. Mortgage 미차감 오답. FMV 그대로(부채 미차감) 오답.",
    example: "출자 부동산 FMV $500,000, mortgage $200,000 파트너십 인수 → Capital Account = $300,000",
    speed: "파트너십 출자 → Capital Account = FMV - 인수 부채 (무조건 반사)",
  },

  // [PART_009] Partnership Interest Allocation — Weighted Average Capital Balance
  // RULE    : Weighted Avg = Σ(기간별 잔액 × 월수) ÷ 12 × 이자율 / 기말·기초 잔액 단순 적용 금지
  // TRIGGER : "weighted average capital balances" → 기간 분리 계산
  // TRAP    : 기말 잔액 그대로 사용 오답 / 기초 잔액 그대로 사용 오답 / 단순 평균 오답
  // EXAMPLE : $140,000×6 + $180,000×1 + $165,000×5 = $1,845,000 ÷ 12 = $153,750 × 10% = $15,375
  {
    topic_id: "PART_009",
    category: "Partnerships",
    topic_name: "Partnership Interest Allocation — Weighted Average Capital Balance",
    summary: "연중 자본 변동 시 기간별 잔액 × 월수 → 합계 ÷ 12 × 이자율로 파트너 이자 계산",
    rule: "Weighted Avg Capital = Σ(기간별 잔액 × 월수) ÷ 12. 이자 = 가중평균 × 이자율. 기말/기초 잔액 단순 적용 금지.",
    trigger: '"weighted average capital balances" → 기간 분리 계산. "additional investment" / "withdrawal" → 해당 시점부터 잔액 변경.',
    trap: "기말 잔액 그대로 사용 오답. 기초 잔액 그대로 사용 오답. 단순 평균 오답.",
    example: "$140,000×6 + $180,000×1 + $165,000×5 = $1,845,000 ÷ 12 = $153,750 × 10% = $15,375",
    speed: '"weighted average capital" → 기간별 잔액 × 월수 → 합계 ÷ 12 × 이자율',
  },

  // [PART_011] Partnership Distribution — Salary Allowance Exceeds Earnings (Loss Ratio Applied)
  // RULE    : Salary 먼저 → 잔여 음수 → loss ratio 적용 (profit ratio 아님)
  // TRIGGER : "salary allowances" + 이익 < salary 합계 → 잔여 음수 → loss ratio
  // TRAP    : 잔여 음수인데 profit ratio 적용 / salary 무시 균등 배분 / 잔여 양수로 착각
  {
    topic_id: "PART_011",
    book_id: 'AA',
    chapter_id: 'AA_CH9',
    topic_group: 'AA_CH9_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Partnership distribution — salary exceeds earnings, loss ratio applied to deficit",
    rule: "Partnership 배분 순서:\n① Salary allowance 먼저 (이익 크기 무관하게 항상 우선)\n② Interest on capital (있는 경우)\n③ 잔여 = 총이익 − (salary + interest)\n\n[잔여가 음수일 때]\n잔여 < 0 → 손실(deficit) → loss ratio 적용\n잔여 > 0 → 이익 → profit ratio 적용\n\n[핵심 트랩]\nProfit ratio ≠ Loss ratio인 경우:\n→ 잔여 양수 → profit ratio\n→ 잔여 음수 → loss ratio (반드시 확인)\n\n최종 배분 = salary ± 잔여 배분액\n검증: 전체 합산 = 총이익 (= $0 남아야 함)",
    trigger: '"salary allowances" + earnings < salary 합계 → 잔여 음수 → loss ratio\n"share profits X and losses Y" → profit/loss ratio 별도 확인\n"before any allowance" → 배분 전 총이익 기준\n잔여 계산 후 음수 확인 → loss ratio 자동 전환',
    trap: "잔여 음수인데 profit ratio 적용: 반드시 loss ratio 전환\nSalary를 이익 범위 내에서만 지급: salary는 이익 크기 무관, 항상 전액 먼저\n이익 균등 배분(salary 무시): salary → interest → remainder 순서 필수\n합산 검증 생략: 두 파트너 합계 ≠ 총이익이면 계산 오류",
    one_sentence: "Salary > 이익 → 잔여 음수 → loss ratio로 배분; profit ratio는 잔여 양수일 때만.",
    speed: "① Salary 먼저 ② 잔여 = 이익 − salary 합계 ③ 음수 → loss ratio / 양수 → profit ratio ④ 합산 검증",
    example: "Cedar $110K / Grove $90K salary / 이익 $160K / loss 60/40:\n잔여 $160K−$200K = −$40K\nLoss: Cedar −$24K / Grove −$16K\n합산: Cedar $86K / Grove $74K ✓",
    context_background: "[왜 salary가 이익보다 많아도 전액 지급하는가]\nSalary allowance는 파트너가 업무에 기여한 대가로 약정된 금액. 이익이 부족해도 약정대로 먼저 배분하고, 부족분은 손실로 간주해 loss ratio로 나눔. 결국 이익이 적은 파트너는 salary는 받되, 손실 배분으로 일부를 돌려주는 구조.\n\n[Profit ratio vs Loss ratio 구분]\n동업 계약에서 이익 배분 비율과 손실 배분 비율을 다르게 정할 수 있음. 문제에서 'share profits equally and losses in 60/40'처럼 명시되면 잔여의 부호에 따라 적용 비율이 달라짐.\n\n[검증 방법]\n두 파트너 최종 배분액 합계 = 총이익 (잔여 $0 확인)",
  },

  // [PART_010] Partnership Income Allocation — Tiered Distribution
  // RULE    : 약정 순서대로 배분 + 각 단계 잔액 추적
  // TRIGGER : "remaining income over $X" → 해당 시점 잔액 기준 (NI 원래 금액 아님)
  // TRAP    : remaining 기준 혼동 / "over $X" 전체 NI에 적용 / 잔액 추적 누락
  {
    topic_id: "PART_010",
    book_id: 'AA',
    chapter_id: 'AA_CH9',
    topic_group: 'AA_CH9_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Partnership tiered income allocation — track remaining balance at each step",
    rule: "단계별 배분 원칙:\n① 약정 순서대로 각 단계 배분\n② 각 단계 후 잔액(remaining) 반드시 추적\n③ 'remaining income over $X' = 해당 시점 잔액 기준 (NI 원래 금액 아님)\n④ 'balance equally' = 최종 잔액 ÷ 파트너 수\n⑤ 전체 합계 = NI로 검증",
    trigger: '"in the following order" → 단계별 순서, 잔액 차감\n"remaining income over $X" → 해당 시점 잔액 기준\n"up to $X / over $X" → 구간별 다른 비율\n"balance allocated equally" → 최종 잔액 균등',
    trap: '"remaining income over $150,000"을 NI $250,000 기준 계산 → 오답. 해당 시점 잔액 기준.\n"20% over $100,000"을 NI 전체에 적용 → $100,000 초과분에만.\n잔액 추적 누락 → 이중 배분 오류.',
    one_sentence: "단계별 배분 = 약정 순서 + 잔액 추적 | 'remaining over $X' = 그 시점 잔액 기준 | 마지막은 균등",
    speed: "① Cedar: $10K+$30K=$40K / 잔액$210K\n② Grove·Maple: ($210K−$150K)×5%=$3K씩 / 잔액$204K\n③ 균등: $68K씩 → Cedar=$108K",
    example: "NI $250,000\nStep1: Cedar 10%×$100K=$10K + 20%×$150K=$30K → 잔액$210K\nStep2: ($210K−$150K)×5%=$3K(Grove) + $3K(Maple) → 잔액$204K\nStep3: $204K÷3=$68K씩\nCedar = $40K + $68K = $108K",
    key_formula: "각 단계 잔액 = 전 단계 잔액 − 해당 단계 배분 합계\n'remaining over $X' 기준 = 해당 시점 잔액 − $X",
    context_background: "[Tiered allocation 구조]\n약정서에 명시된 순서대로 배분. 각 단계마다 잔액이 줄어들고, 그 잔액을 다음 단계의 기준으로 사용.\n\n['remaining income over $X' 트랩]\n이 표현이 나오면 반드시 '해당 시점 잔액'을 기준으로 $X 초과분 계산.\nNI 원래 금액을 기준으로 계산하면 오답.\n\n[검증]\n모든 파트너 배분 합계 = NI 총액이 되어야 함.\n$108,000 + $71,000 + $71,000 = $250,000 ✓",
  },

  // [PART_012] Partnership — 5 Lifecycle Stages + Bonus vs Goodwill
  // RULE    : Formation=FMV / Income=Salary먼저→잔여P&L / Admission·Withdrawal=Bonus or Goodwill / Liquidation=채권자→loans→Capital
  // TRIGGER : "partnership formed" / "admitted" / "withdrew" / "liquidation" → 단계 확인 후 해당 로직
  // TRAP    : Formation 장부가 사용 / Salary 범위 내에서만 지급 / Goodwill이 나머지 자본 감소시킨다고 착각
  {
    topic_id: "PART_012",
    book_id: 'AA',
    chapter_id: 'AA_CH9',
    topic_group: 'AA_CH9_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'concept',
    card_name: "Partnership lifecycle — formation, income allocation, admission, withdrawal, liquidation",
    rule: "【① Formation (설립)】\nCapital = FMV of assets contributed − liabilities assumed\n장부가·원가 무관 / 이익배분비율 ≠ Capital 잔액\n\nDr. Cash / Dr. Equipment(FMV)\n    Cr. Mortgage Payable\n    Cr. Capital-Reed\n    Cr. Capital-Stone\n\n【② Income Allocation (이익 배분)】\n순서: Salary → Interest on capital → 잔여(P&L ratio)\n잔여 > 0 → profit ratio / 잔여 < 0 → loss ratio\n각 파트너 최종 = Salary ± 잔여배분 / 합계 = NI 검증\n\n【③ Admission (신규 영입) — Bonus Method】\nLane 취득 자본 = (기존총자본 + 납입액) × 약정지분율\n납입 < 취득자본 → 차액을 기존 파트너에서 P&L 비율로 차감\n총자산 변화 없음\n\n【③ Admission — Goodwill Method】\nimplied FMV = 납입액 ÷ 약정지분율\nGoodwill = implied FMV − 기존 장부 총자본\nGoodwill을 기존 파트너 P&L 비율로 배분\n총자산 증가\n\n【④ Withdrawal (탈퇴) — Bonus Method】\n초과 지급분 = 잔류 파트너 자본에서 P&L 비율로 차감\n총자산 변화 없음 / 나머지 자본 감소\n\n【④ Withdrawal — Goodwill Method】\n초과 지급분 = Goodwill 자산 인식\n나머지 파트너 자본 변동 없음 / 총자산 증가\n\n【⑤ Liquidation (해체)】\n지급 우선순위:\n1순위: 외부 채권자 전액\n2순위: 파트너 대여금(loans)\n3순위: 파트너 자본계정 잔액",
    trigger: "'partnership was formed' → Formation: Capital = FMV − 부채\n'admitted as a partner' → Admission: Bonus or Goodwill\n'withdrew from the partnership' → Withdrawal: Bonus or Goodwill\n'partnership was liquidated' → 1순위 채권자\n'salary allowance' → Income Allocation: Salary 먼저\n'capital accounts of remaining partners decreased' → Bonus method만",
    trap: "Formation: 장부가 사용 오답 → 반드시 FMV\nIncome Allocation: Salary > NI → 잔여 음수 → loss ratio (profit ratio 아님)\nAdmission Bonus: 납입액을 그대로 Capital-Lane으로 기록 오답\nWithdrawal: Goodwill method가 나머지 자본 감소시킨다고 착각\n→ Goodwill method = 나머지 자본 불변 / Bonus method = 나머지 자본 감소\nLiquidation: 파트너에게 먼저 분배 오답 → 채권자 전액 상환이 무조건 1순위",
    one_sentence: "Formation=FMV / Income=Salary먼저 / Admission·Withdrawal=Bonus(자산불변)or Goodwill(자산증가) / Liquidation=채권자우선.",
    speed: "Formation → FMV − 부채\nIncome → Salary 먼저 → 잔여 부호 확인 → P&L ratio\nAdmission Bonus → (총자본+납입) × % = 취득자본\nWithdrawal → 나머지 자본 감소 = Bonus only\nLiquidation → 채권자 → loans → Capital",
    example: "【Formation】\nReed: Cash $80,000 → Capital $80,000\nStone: Equipment FMV $120,000 − Mortgage $50,000 → Capital $70,000\n\n【Income Allocation】\nNI $80,000 / Reed salary $60,000 / Stone salary $40,000\n잔여 = $80,000 − $100,000 = −$20,000 (Loss)\nReed: $60,000 − $12,000 = $48,000\nStone: $40,000 − $8,000 = $32,000\n\n【Admission — Bonus Method】\nReed $100,000 / Stone $100,000 / Lane $70,000 납입 → 30% 약정\nLane 취득자본 = $270,000 × 30% = $81,000\n차액 $11,000 → Reed·Stone 각 $5,500 차감\n\n【Admission — Goodwill Method】\nimplied FMV = $70,000 ÷ 30% = $233,333\nGoodwill = $33,333 → Reed·Stone 각 $16,667 가산\n\n【Withdrawal — Bonus】\nReed 자본 $100,000 / 지급 $130,000\nStone·Lane 각 $15,000 차감\n\n【Withdrawal — Goodwill】\nGoodwill $30,000 인식 / Stone·Lane 자본 불변\n\n【Liquidation】\n채권자 $80,000 → Partner loans $40,000 → Capital $80,000 (Reed 60%/Stone 40%)",
    context_background: "[Bonus vs Goodwill 한눈에]\n항목              Bonus Method     Goodwill Method\n총자산 변화         없음              Goodwill만큼 증가\n나머지 파트너 자본   조정됨(±)         변동 없음\nGoodwill 인식      없음              있음\n나머지 자본 감소    가능              불가\n\n[Income Allocation 핵심]\nSalary allowance = 실제 급여 아님, 배분 우선순위 도구\nSalary > NI → 잔여 음수 → loss ratio 자동 전환\nprofit ratio ≠ loss ratio일 수 있으므로 항상 구분 확인\n\n[Liquidation 우선순위 이유]\n채권자는 계약상 청구권 보유 → 파트너보다 법적 우선\n파트너 loans = 파트너가 파트너십에 빌려준 돈 → 자본보다 먼저\nCapital = 잔여 청구권 → 마지막",
  },

  // [PART_013] Sole Proprietorship — Capital Account Calculation
  // RULE    : Capital = 매입가 + 순이익 − 인출 / 장부가·시장가 무관
  // TRIGGER : "sole proprietorship" + "capital account" → 매입가 기준 시작
  // TRAP    : 장부가·시장가를 시작 잔액으로 사용 / Drawings를 가산
  {
    topic_id: "PART_013",
    book_id: 'AA',
    chapter_id: 'AA_CH9',
    topic_group: 'AA_CH9_PART',
    sub_category_id: "U5_PARTNERSHIPS",
    card_type: 'calculation',
    card_name: "Sole proprietorship — capital account = purchase price + net income − drawings",
    rule: "Capital Account = 매입가(purchase price) + 순이익 − 인출(drawings)\n\n매입가 = 실제 지불한 금액 → 시작 잔액\n장부가(carrying amount) / 시장가(market value) → 무관, 사용 금지\nDrawings = 사업주 인출 = 법인의 배당과 동일 구조 → 자본 직접 차감\n\n분개:\nDr. Capital-Smith   $20,000\n    Cr. Cash                   $20,000",
    trigger: "'purchased net assets for $X' → Capital 시작 = $X (매입가)\n'revenues in excess of expenses' → 순이익 → Capital 가산\n'drawings during the year' → Capital 차감\n'sole proprietorship' + 'capital account' → 매입가 기준",
    trap: "장부가 $375,000 사용 → 오답 / 시장가 $360,000 사용 → 오답\nDrawings $20,000 가산 → 반대 방향, 반드시 차감\nDrawings = Expense로 혼동 → 자본 직접 차감, I/S 항목 아님",
    one_sentence: "Sole Prop Capital = 매입가 + 순이익 − Drawings / 장부가·시장가 절대 사용 금지.",
    key_formula: "Capital(기말) = 매입가 + 순이익 − Drawings",
    example: "Smith가 Jones' Cleaning을 $350,000에 매입\n순이익 $60,000 / Drawings $20,000\nCapital-Smith = $350,000 + $60,000 − $20,000 = $390,000\n(장부가 $375,000, 시장가 $360,000 → 둘 다 무관)",
    speed: "매입가 시작 → +순이익 → −Drawings → 끝 / 다른 숫자 전부 무시",
    context_background: "[Sole Proprietorship이란]\n미국 개인사업자 = 소유자와 사업체가 법적으로 분리되지 않음\n한국 개인사업자와 동일 구조\n자본계정 = Capital-[소유자 이름]\n\n[Drawings vs Dividends]\nDrawings(개인사업자·파트너십) = Dividends(법인)\n둘 다 자본 직접 차감 / I/S 항목 아님\n\n[매입가 기준 이유]\n새 소유자 Smith가 $350,000을 지불 → 그 금액이 Smith의 투자원금\n이전 소유자 Jones의 장부가·시장가는 Smith와 무관\n새 출발 = 매입가 기준",
  },

  // ── TBS ────────────────────────────────────────────────────────────────────
  {
    topic_id: "TBS_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ_TS',
    sub_category_id: "U1_BALANCE_SHEET",
    card_type: 'calculation',
    card_name: "TBS strategy — how to approach simulation questions",
    rule: "Enter account names first (secures partial credit even if amounts are wrong). Do easy items first (par bonds, FV > amortized cost on AFS). Enter 0 only when instructed. Budget 20–25 minutes per TBS.",
    trigger: "TBS | simulation | task-based | journal entry | enter | zero",
    trap: "Subsequent events are heavily tested — always study before exam.",
    one_sentence: "In TBS: accounts first, easy items first, watch for 0-entry instructions, pace yourself.",
    example: "Bond TBS: enter 'Bond Payable' before calculating exact amount → secures partial credit",
  },

  // ── RATIO ──────────────────────────────────────────────────────────────────
  {
    topic_id: "RATIO_001",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Current ratio — what goes in numerator and denominator",
    rule: "Current Ratio = Current Assets ÷ Current Liabilities.",
    trigger: "current ratio | liquidity | current assets | current liabilities",
    trap: "Do not include noncurrent assets or liabilities in this calculation.",
    one_sentence: "Current ratio = current assets divided by current liabilities.",
    example: "CA $300,000 / CL $150,000 → Current Ratio = 2.0",
  },
  {
    topic_id: "RATIO_002",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Quick ratio — what to exclude from current assets",
    rule: "Quick Ratio = (Cash + Short-term investments + Net receivables) ÷ Current Liabilities. Excludes inventory and prepaid expenses.",
    trigger: "quick ratio | acid-test | inventory excluded | liquid assets | prepaid",
    trap: "Inventory and prepaid expenses are excluded — they are the least liquid current assets.",
    one_sentence: "Quick ratio uses only the most liquid current assets; exclude inventory and prepaid.",
    example: "CA $300K − Inventory $80K − Prepaid $10K = Quick Assets $210K / CL $150K → Quick Ratio 1.40",
  },
  {
    topic_id: "RATIO_003",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'concept',
    card_name: "Debt-to-equity ratio — how to calculate",
    rule: "Debt-to-Equity = Total Liabilities ÷ Total Stockholders' Equity.",
    trigger: "debt-to-equity | leverage | financial risk | total liabilities | equity",
    trap: "Use total liabilities (current + noncurrent), not just long-term debt.",
    one_sentence: "Debt-to-equity = total liabilities divided by total stockholders' equity.",
    example: "Total liabilities $400,000 / Equity $200,000 → D/E ratio = 2.0",
  },
  // [RATIO_004] Return on Assets (ROA) — Net Income ÷ Average Total Assets
  // RULE    : ROA = Net Income ÷ Avg Total Assets / Net Sales 혼동 금지 / Ending 단독 사용 금지
  // TRIGGER : "return on assets" → Net Income / Beg+End÷2
  // TRAP    : Net Sales 사용(A) / Ending만 사용(B) / Beginning만 사용(D)
  {
    topic_id: "RATIO_004",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Return on Assets (ROA) — Net Income ÷ Average Total Assets",
    rule: "ROA = Net Income ÷ Average Total Assets\nAverage Total Assets = (Beginning + Ending) ÷ 2\n\n분자: Net Income (Net Sales 아님)\n분모: Average (기초 또는 기말 단독 사용 금지)",
    trigger: '"return on assets" → Net Income ÷ Average Total Assets\n기초·기말 자산 둘 다 제시 → 무조건 평균\nNet Sales + Net Income 동시 제시 → 분자는 Net Income만',
    trap: "Net Sales를 분자로 사용 → ROA는 순이익 기준, Net Sales 아님\nEnding Assets 단독 사용 → 반드시 평균 (기초+기말)÷2\nBeginning Assets 단독 사용 → 기말 자산 무시 오류\n공통 함정: Net Sales가 더 큰 숫자이므로 써야 할 것 같은 착각",
    one_sentence: "ROA = Net Income ÷ Average Total Assets; Net Sales 아님, Ending 단독 아님.",
    speed: "Net Income ÷ [(Beg + End) ÷ 2]\n$225,000 ÷ $3,750,000 = 6%",
    context_background: "[ROA 계산 2대 함정]\n\n① 분자: Net Income vs Net Sales\nROA = '자산으로 얼마나 순이익을 냈는가'\n→ 분자는 반드시 Net Income\nNet Sales는 매출 규모 지표 → Asset Turnover에서 사용\n\n② 분모: Average vs Ending(또는 Beginning)\n기간 중 자산 수준 대표값 = 기초와 기말의 평균\n→ (Beg + End) ÷ 2\n기말만 쓰면 당기 자산 증가분을 이중 불리하게 반영\n기초만 쓰면 당기 취득 자산 무시\n\n[ROA vs 관련 비율 비교]\nROA = Net Income ÷ Avg Total Assets (수익성)\nROE = Net Income ÷ Avg Stockholders' Equity (자기자본 수익성)\nAsset Turnover = Net Sales ÷ Avg Total Assets (효율성)",
    example: "Net Income $225,000 / Beg Assets $3,000,000 / End Assets $4,500,000\nAvg Assets = ($3,000,000+$4,500,000)÷2 = $3,750,000\nROA = $225,000 ÷ $3,750,000 = 6%",
  },
  // [RATIO_005] Return on Equity (ROE) — Net Income After Tax ÷ Average Common Equity
  // RULE    : ROE = (NI − Pref.Div) ÷ Avg Common Equity / After tax / Ending 단독 사용 금지
  // TRIGGER : "return on equity" → After tax NI / Avg equity
  // TRAP    : Gross profit(A) / Ending equity(C) / Before tax(D)
  {
    topic_id: "RATIO_005",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Return on Equity (ROE) — Net Income After Tax ÷ Average Common Equity",
    rule: "ROE = (Net Income − Preferred Dividends) ÷ Average Common Stockholders' Equity\n\nAverage Common Equity = (Beginning + Ending) ÷ 2\n\n분자: Net Income AFTER tax − Preferred Dividends\n→ Preferred stock 없으면 → 분자 = Net income after tax\n→ Gross profit 사용 금지 / Before tax 사용 금지\n\n분모: Average (기초+기말)÷2\n→ Ending 단독 사용 금지",
    trigger: '"return on equity" → Net income after tax ÷ Average common equity\nPreferred stock 없음 → Preferred dividends = $0, 분자 조정 불필요\n기초·기말 equity 둘 다 제시 → 무조건 평균',
    trap: "Gross profit을 분자로 사용 → ROE 분자는 반드시 Net income after tax\nEnding equity 단독 사용 → 반드시 (Beg+End)÷2 평균\nBefore tax income 사용 → 세후 순이익만 가능\n공통 함정: Gross profit·Before tax·Ending equity 3가지가 선지에 동시 등장",
    one_sentence: "ROE = (NI after tax − Preferred Div) ÷ Average Common Equity; Gross profit·Before tax·Ending equity 모두 오답.",
    speed: "Average equity = (Y1 + Y2) ÷ 2\nROE = NI after tax ÷ Average equity\nPreferred stock 없으면 분자 = NI 그대로",
    context_background: "[ROE 3대 함정]\n\n① Gross profit vs Net income\nROE = '자기자본으로 최종 순이익을 얼마나 냈는가'\n→ 분자는 반드시 Net income AFTER tax\n→ Gross profit = COGS만 차감한 중간 단계 → 오답\n\n② Before tax vs After tax\nNet income = 영업비용·이자·세금까지 전부 차감한 최종 순이익\n→ 세전(before tax) income은 세금 차감 전 → 오답\n\n③ Ending equity vs Average equity\n기간 중 자본 수준 대표값 = 기초와 기말의 평균\n→ Ending equity만 쓰면 당기 자본 증가분 왜곡\n\n[Preferred Dividends 차감 이유]\nROE = Common stockholders에 귀속되는 순이익\n→ Preferred 배당금은 Preferred stock에 먼저 귀속 → 차감 후 Common 몫만 분자에",
    example: "Y1 equity $1,435,000 / Y2 equity $1,610,000 / NI after tax $350,000 / No preferred stock\nAvg equity = ($1,435,000+$1,610,000)÷2 = $1,522,500\nROE = $350,000÷$1,522,500 = 22.99%",
  },
  {
    topic_id: "RATIO_006",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Inventory turnover — and days in inventory",
    rule: "Inventory Turnover = COGS ÷ Average Inventory. Days in Inventory = 365 ÷ Inventory Turnover.",
    trigger: "inventory turnover | days in inventory | COGS | average inventory",
    trap: "Use COGS in the numerator, not revenue.",
    one_sentence: "Inventory turns = COGS over average inventory; days = 365 divided by the turns.",
    example: "COGS $480,000 / Avg Inventory $40,000 → Turnover 12× → Days = 30",
  },
  {
    topic_id: "RATIO_007",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Receivables turnover — and days outstanding",
    rule: "Receivables Turnover = Net Credit Sales ÷ Average Accounts Receivable. Days Sales Outstanding = 365 ÷ Receivables Turnover.",
    trigger: "receivables turnover | days sales outstanding | DSO | collection period | AR",
    trap: "Use net credit sales (not total revenue) when the distinction is provided.",
    one_sentence: "Receivables turnover = credit sales over average AR; divide 365 to get days outstanding.",
    example: "Credit sales $730,000 / Avg AR $100,000 → Turnover 7.3× → DSO ≈ 50 days",
  },
  // [RATIO_008] Asset Turnover — Net Sales ÷ Average Total Assets
  // RULE    : Avg = (Beg + End) ÷ 2 / Ending 단독 사용 금지
  // TRIGGER : Beginning + Ending 둘 다 제시 → 무조건 평균
  // TRAP    : Ending만($87M) / Beginning만($93M) / ÷2 누락($180M)
  {
    topic_id: "RATIO_008",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Asset Turnover — Net Sales ÷ Average Total Assets",
    rule: "Asset Turnover = Net Sales ÷ Average Total Assets\nAverage Total Assets = (Beginning + Ending) ÷ 2\n\n분자: Net Sales\n분모: 평균 자산 (기초+기말 ÷ 2) — Ending 단독 사용 금지\nHigher = 자산을 더 효율적으로 활용",
    trigger: '"asset turnover" + beginning/ending assets 둘 다 제시 → 무조건 평균\nNet Sales + 기초기말 자산 모두 제공 → Average 계산',
    trap: "Ending assets만 사용 → 분자 과소 추정 (가장 흔한 오류)\nBeginning assets만 사용 → 기말 자산 무시\n합산을 ÷2 없이 분모로 사용 → 0.38 오답 (÷2 누락)",
    one_sentence: "Asset Turnover = Net Sales ÷ Avg Total Assets; Ending 단독 금지, 반드시 (Beg+End)÷2.",
    speed: "① Avg Assets = (Beg + End) ÷ 2\n② Net Sales ÷ Avg Assets\n③ 정답 B",
    example: "Net Sales $67.5M / Beg $93M / End $87M\nAvg = $90M → $67.5M ÷ $90M = 0.75×",
    context_background: "Asset Turnover는 자산 효율성 지표. 자산이 기간 중 변동하므로 기말 단독 사용 시 왜곡. 평균 사용이 원칙. ROA, ROE와 달리 이 비율은 수익성(profitability)이 아닌 효율성(efficiency) 지표임을 구분할 것.",
  },
  {
    topic_id: "RATIO_009",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Gross profit margin vs net profit margin",
    rule: "Gross Profit Margin = Gross Profit ÷ Net Sales. Net Profit Margin = Net Income ÷ Net Sales.",
    trigger: "gross margin | net margin | profit margin | gross profit | net income",
    trap: "Gross margin deducts only COGS; net margin deducts all expenses including operating, interest, and taxes.",
    one_sentence: "Gross margin = (sales − COGS) / sales; net margin = net income / sales.",
    example: "Sales $500K / COGS $300K / NI $50K → Gross margin 40% / Net margin 10%",
  },
  {
    topic_id: "RATIO_010",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Interest coverage ratio",
    rule: "Interest Coverage = EBIT ÷ Interest Expense. Measures ability to service debt.",
    trigger: "interest coverage | times interest earned | EBIT | interest expense",
    trap: "Use EBIT (before tax AND interest) — not net income.",
    one_sentence: "Interest coverage = EBIT divided by interest expense; higher is safer.",
    example: "EBIT $120,000 / Interest expense $30,000 → Coverage = 4.0×",
  },
  {
    topic_id: "RATIO_011",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'concept',
    card_name: "Profit margin — net income per dollar of sales",
    rule: "Profit margin = Net Income ÷ Net Sales. 매출 1달러당 최종 순이익. 영업비용·이자·세금 모두 반영한 최종 수익성 지표. Gross profit margin(= Gross Profit ÷ Sales)과 혼동 주의.",
    trigger: "'net profit from each dollar of sales' → Profit margin\n'net income ÷ sales' 구조 → Profit margin\n'profitability after all expenses' → Profit margin",
    trap: "A (Asset turnover) → 수익성 아님. 자산 효율성 지표: Net Sales ÷ Avg Total Assets\nB (Debt-to-equity) → 수익성 아님. 레버리지·부채 커버리지: Total Debt ÷ Total Equity\nC (Gross profit margin) → 순이익 아님. COGS만 차감한 중간 단계: Gross Profit ÷ Sales\n공통 함정: 'profit'이 들어간 Gross profit margin을 net profit 지표로 혼동",
    one_sentence: "net profit per sales dollar = Profit margin = Net Income ÷ Net Sales.",
    speed: "'net profit' + 'each dollar of sales' → Profit margin 즉시 선택",
    context_background: "[주요 비율 목적 비교]\n\n① Profit margin = Net Income ÷ Net Sales\n→ 수익성: 매출 1달러당 최종 순이익\n→ 영업비용·이자·세금 모두 반영\n\n② Gross profit margin = Gross Profit ÷ Net Sales\n→ 수익성(중간): COGS만 차감. 영업비용 미반영\n→ 제조·매입 효율성 측정\n\n③ Asset turnover = Net Sales ÷ Avg Total Assets\n→ 효율성: 자산 1달러당 매출 창출 능력\n→ 수익성 지표 아님\n\n④ Debt-to-equity = Total Debt ÷ Total Equity\n→ 레버리지: 부채 의존도·재무 안정성\n→ 수익성 지표 아님\n\n[Profit margin vs Gross profit margin 핵심 차이]\nGross profit margin: Sales − COGS만 반영\nProfit margin: Sales − COGS − Operating expenses − Interest − Tax 모두 반영\n→ 최종 순이익 기준은 반드시 Profit margin",
  },

  // [RATIO_012] Ratio Analysis — Price-to-Earnings (P/E) Ratio
  // RULE    : P/E = Market Price ÷ Basic EPS / 배당금 무관
  // TRIGGER : 'price-to-earnings' → Market Price ÷ EPS
  // TRAP    : 배당금으로 나눔(A) / 역전(B) / EPS에서 배당 차감(D)
  {
    topic_id: "RATIO_012",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Ratio Analysis — Price-to-Earnings (P/E) Ratio",
    rule: "P/E Ratio = Market Price per Share ÷ Basic EPS. 배당금(Cash Dividend per Share)은 P/E 계산과 무관. 분자·분모 역전 금지.",
    trigger: "'price-to-earnings ratio' → Market Price ÷ Basic EPS\n배당금 데이터 함께 제시 → 오답 유인, 무시",
    trap: "50(A): 배당금($1.80)으로 나눔 → Price-to-Dividend 오류\n0.07(B): 분자·분모 역전 → Earnings Yield\n21(D): EPS − 배당금으로 나눔 → 배당금 차감 오류\n공통 함정: 배당금이 제시되면 써야 할 것 같은 느낌 → P/E에는 완전히 무관",
    one_sentence: "P/E = Market Price ÷ Basic EPS; 배당금은 어디에도 들어가지 않는다.",
    speed: "$90 ÷ $6 = 15",
    context_background: "[P/E Ratio란]\n주가수익비율. 시장이 주당 순이익 $1에 대해 얼마를 지불할 의향이 있는지를 나타내는 밸류에이션 지표.\n\n[공식]\nP/E = Market Price per Share ÷ Basic EPS\n\n[배당금이 무관한 이유]\nCash Dividend per Share는 순이익 중 주주에게 배분된 금액이다. P/E는 시장가격과 이익 창출 능력의 관계를 보는 것이지, 배분 정책과는 무관하다.\n\n[오답 유형 정리]\n- Price ÷ Dividend = Price-to-Dividend ratio (P/E 아님)\n- EPS ÷ Price = Earnings Yield (P/E의 역수)\n- Price ÷ (EPS − Dividend) = 존재하지 않는 지표",
  },
  // [RATIO_013] Ratio Selection — Quick Ratio vs Current Ratio vs Solvency Ratios
  // RULE    : immediate + most liquid → Quick Ratio / Current = Inventory 포함 / D/E = 장기
  // TRIGGER : 'immediate' + 'most liquid' → Quick Ratio
  // TRAP    : Current Ratio(C) → Inventory 포함 / D/E(A) → 장기 지급능력
  {
    topic_id: "RATIO_013",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'concept',
    card_name: "Ratio Selection — Quick Ratio vs Current Ratio vs Solvency Ratios",
    rule: "Quick Ratio = (Cash + Mkt Securities + Net A/R) ÷ Current Liabilities → Inventory 제외, immediate 유동성. Current Ratio = 모든 Current Assets ÷ CL → Inventory 포함, 즉시성 낮음. Debt-to-Equity = 장기 지급능력(Solvency).",
    trigger: "'immediate short-term obligations' + 'most liquid assets' → Quick Ratio\n'short-term' 단독 → Current Ratio 가능성\n'long-term solvency' / 'leverage' → Debt-to-Equity",
    trap: "Current Ratio(C): Inventory 포함 → immediate에 부적합\nDebt-to-Equity(A): 장기 지급능력, 단기 유동성 아님\nOperating CF Ratio(D): 영업현금흐름 기반, liquid assets 아님\n공통 함정: 'short-term'만 보고 Current Ratio 선택 → 'immediate + most liquid' = Quick Ratio",
    one_sentence: "immediate + most liquid → Quick Ratio(Inventory 제외); short-term 전반 → Current Ratio; 장기 → D/E.",
    speed: "immediate + most liquid assets → Inventory 제외 → Quick Ratio",
    context_background: "[4대 비율 비교]\n\n① Quick Ratio (당좌비율)\n= (Cash + Marketable Securities + Net A/R) ÷ Current Liabilities\n- Inventory, Prepaid 제외\n- 즉시 현금화 가능한 자산만\n- 키워드: 'immediate', 'most liquid'\n\n② Current Ratio (유동비율)\n= Current Assets ÷ Current Liabilities\n- Inventory 포함\n- 단기 지급능력 전반 측정\n- Quick Ratio보다 넓은 개념\n\n③ Debt-to-Equity Ratio\n= Total Debt ÷ Total Equity\n- 장기 지급능력(Solvency) / 레버리지 측정\n- 단기 유동성과 무관\n\n④ Operating Cash Flow Ratio\n= Operating Cash Flow ÷ Current Liabilities\n- 영업활동 현금으로 유동부채 커버 능력\n- liquid assets 기반이 아님",
  },

  // [RATIO_014] Ratio Chain — AR Turnover + Asset Turnover → Average Total Assets
  // RULE    : AR Turnover → Net Sales 역산 → Asset Turnover 대입 → Avg Total Assets
  // TRIGGER : 두 ratio 동시 제공 → 공통 분모 Net Sales 연결
  // TRAP    : Net Sales 역산 생략(A) / Net Sales = Total Assets 착각(C) / AR 그대로 사용(D)
  {
    topic_id: "RATIO_014",
    book_id: 'GN',
    chapter_id: 'GN_CH8',
    topic_group: 'GN_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Ratio Chain — AR Turnover + Asset Turnover → Average Total Assets",
    rule: "두 ratio 연결 공식:\nAR Turnover = Net Sales ÷ Average AR\n→ Net Sales = AR Turnover × Average AR\n\nAsset Turnover = Net Sales ÷ Average Total Assets\n→ Average Total Assets = Net Sales ÷ Asset Turnover\n\n공통 분모 Net Sales를 역산해서 두 ratio 연결.",
    trigger: "AR Turnover + Asset Turnover 동시 제공 → Net Sales가 공통 분모\n'average receivables' 제공 → AR Turnover로 Net Sales 먼저 역산\n'average total assets' 질문 → Asset Turnover 분모 역산",
    trap: "A($400,000): Net Sales 역산 생략. Avg AR × Asset Turnover = $200,000 × 2\nC($2,000,000): Net Sales를 Average Total Assets로 착각\nD($200,000): Average AR 그대로 답으로 사용",
    one_sentence: "AR Turnover → Net Sales 역산 → Asset Turnover 대입 → Avg Total Assets; Net Sales가 두 ratio의 연결고리.",
    speed: "① Net Sales = AR Turnover × Avg AR = 10 × $200,000 = $2,000,000\n② Avg Total Assets = Net Sales ÷ Asset Turnover = $2,000,000 ÷ 2 = $1,000,000\n③ 답: B",
    context_background: "[Ratio Chain 구조]\n\nAR Turnover = Net Sales ÷ Average AR\n→ 역산: Net Sales = AR Turnover × Average AR\n= 10 × $200,000 = $2,000,000\n\nAsset Turnover = Net Sales ÷ Average Total Assets\n→ 역산: Average Total Assets = Net Sales ÷ Asset Turnover\n= $2,000,000 ÷ 2 = $1,000,000\n\n[왜 Net Sales가 연결고리인가]\nAR Turnover 분자 = Net Sales\nAsset Turnover 분자 = Net Sales\n→ 두 ratio 모두 Net Sales를 공유\n→ 하나로 역산하면 다른 하나에 대입 가능\n\n[함정 방지]\nA($400,000): Net Sales 계산 없이 $200,000 × 2 직접 계산\n→ AR Turnover를 Asset Turnover에 직접 곱하는 오류\n\nC($2,000,000): Net Sales = Average Total Assets로 혼동\n→ Asset Turnover = 1일 때만 Net Sales = Avg Total Assets",
  },

  // [RATIO_015] Days in Inventory vs Days in AR — formula structure
  // RULE    : Days in Inventory = Ending Inventory ÷ (COGS ÷ 365) / Days in AR = Ending AR ÷ (Net Sales ÷ 365)
  // TRIGGER : "days in inventory" → Ending Inventory / COGS / "days in AR" → Ending AR / Net Sales
  // TRAP    : Average inventory 사용 / Sales 사용 / 분자·분모 역전 / AR 데이터를 inventory 공식에 혼용
  {
    topic_id: "RATIO_015",
    book_id: 'IA',
    chapter_id: 'IA_CH10',
    topic_group: 'IA_CH10_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'concept',
    card_name: "Days in inventory and days in AR — formula structure and denominator selection",
    rule: "Days 계산 공식 패턴:\nDays in X = Ending X ÷ (관련 연간금액 ÷ 365)\n\n① Days in Inventory = Ending Inventory ÷ (COGS ÷ 365)\n② Days in AR = Ending AR ÷ (Net Sales ÷ 365)\n\n[유도]\nInventory Turnover = COGS ÷ Ending Inventory\nDays in Inventory = 365 ÷ Inventory Turnover\n                  = Ending Inventory ÷ (COGS ÷ 365)",
    trigger: '"days in inventory" → Ending Inventory ÷ (COGS ÷ 365)\n"days in AR" / "days sales outstanding" → Ending AR ÷ (Net Sales ÷ 365)\n분모 선택: Inventory → COGS / AR → Net Sales\nAR 데이터 + Inventory 문제 → AR은 distractor',
    trap: "① Average inventory 사용 → Days in Inventory = Ending inventory\n② Sales 사용 → Days in Inventory는 COGS\n③ 365 ÷ Ending inventory → 분자·분모 역전\n④ AR 데이터(beginning/ending AR) → Days in Inventory 문제에서 distractor",
    one_sentence: "Days in Inventory = Ending Inventory ÷ (COGS÷365); Days in AR = Ending AR ÷ (Net Sales÷365).",
    example: "Ending Inventory $12,000 / COGS $36,000 → Days = $12,000 ÷ ($36,000÷365) = 121.7일",
    context_background: "Days in Inventory는 재고가 평균적으로 며칠 만에 판매되는지 나타낸다. Inventory Turnover(COGS÷Ending Inventory)의 역수에 365를 곱한 것과 동일하다. Days in AR은 동일한 구조로 Net Sales를 사용한다. 시험에서 AR 데이터를 함께 제시해 공식 혼동을 유도하는 함정이 자주 출제된다.",
    speed: "① Days in Inventory → Ending Inventory / COGS\n② Numerator = Ending Inventory\n③ Denominator = COGS ÷ 365\n④ 정답 C",
  },

  // [RATIO_016] Ratio Analysis — Gross Profit Margin (Pricing Strategy & Production Efficiency)
  // RULE    : Gross Profit Margin = (Sales − COGS) ÷ Sales → 가격 전략 + 생산 효율성 동시 포착
  // TRIGGER : "pricing strategy" + "production efficiency" → Gross profit margin
  // TRAP    : Debt-to-equity(A) / TIE(B) / P/E ratio(C) → COGS 레벨 효율성 미반영
  {
    topic_id: "RATIO_016",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'concept',
    card_name: "Gross Profit Margin — Pricing Strategy & Production Efficiency",
    rule: "Gross Profit Margin = (Sales − COGS) ÷ Sales. 가격 전략(얼마에 파냐)과 생산 효율성(얼마나 싸게 만드냐) 두 요소가 동시에 집약된 비율. 가격↑ → Gross Profit↑ / COGS↓ → Gross Profit↑.",
    trigger: '"pricing strategy" + "production efficiency" → Gross (profit) margin 즉시 선택\nSales − COGS 구조에서 두 요소를 동시에 포착하는 유일한 비율',
    trap: "A(Debt-to-equity): 재무 레버리지 측정. 가격·생산 무관\nB(Times interest earned): EBIT ÷ Interest Expense. 이자 커버리지\nC(P/E ratio): Market Price ÷ EPS. 시장 성장 기대치. 내부 운영 효율 무관\n공통 함정: 'efficiency' 단어에 끌려 Asset Turnover(Net Sales÷Assets) 혼동 → COGS 레벨의 효율성은 Gross Profit Margin만 포착",
    one_sentence: "pricing strategy + production efficiency → Gross Profit Margin = (Sales−COGS)÷Sales.",
    speed: '"pricing strategy + production efficiency" → Gross profit margin 즉시 선택',
    context_background: "[비율 목적별 분류]\n\n① Gross Profit Margin = (Sales − COGS) ÷ Sales\n→ 가격 전략 + 생산 효율성 (COGS 레벨)\n→ 영업비용·이자·세금 미포함\n\n② Debt-to-equity = Total Debt ÷ Total Equity\n→ 재무 레버리지. 부채 의존도\n→ 수익성·효율성 지표 아님\n\n③ Times interest earned = EBIT ÷ Interest Expense\n→ 이자 커버리지. 부채 상환 능력\n→ 가격·생산과 무관\n\n④ P/E ratio = Market Price ÷ EPS\n→ 시장 밸류에이션. 투자자 성장 기대치\n→ 내부 운영 효율과 무관\n\n[핵심 논리]\n가격을 올리면 Revenue↑ → Gross Profit↑\n생산비를 낮추면 COGS↓ → Gross Profit↑\n→ 두 경영 판단 모두 (Sales − COGS) 구조에서만 포착",
  },

  // [RATIO_017] Dividend Payout Ratio – Formula & Common Traps
  // RULE    : Dividend Payout = 배당금 ÷ Net Income / Operating income·주식수 → Fake
  // TRIGGER : "dividend payout ratio" → 배당금÷Net Income / 분자분모 방향 확인
  // TRAP    : 분자/분모 뒤집기(400%) / Operating income 분모(31%) / 주식수 분모(90%)
  {
    topic_id: "RATIO_017",
    category: "Ratio Analysis",
    topic_name: "Dividend Payout Ratio – Formula & Common Traps",
    rule: "【Dividend Payout Ratio】\n= 총 배당금 ÷ Net Income\n= 순이익 중 배당으로 지급한 비율\n\n【분모 주의】\nNet Income ✅\nOperating income ❌ (영업이익 아님)\nCommon shares outstanding ❌ (주식수 아님)\n\n【관련 비율 구분】\nDividend Payout Ratio = 배당금 ÷ Net Income\nDividend Yield = 주당배당금 ÷ 주가\nDPS(주당배당금) = 배당금 ÷ 주식수",
    trigger: '"dividend payout ratio" → 배당금 ÷ Net Income\nOperating income 제시 → Fake 데이터\n주식수 제시 → Fake 데이터\n분자/분모 방향 확인 필수',
    trap: "분자/분모 뒤집기 → Net Income ÷ 배당금 = 400%.\nOperating income을 분모로 사용 → 31%.\n주식수를 분모로 사용 → DPS 개념 혼동 → 90%.\nOperating income과 주식수는 이 문제에서 전형적인 Fake 데이터.",
    example: "Cedar Manufacturing:\n배당금 $1,350,000 ÷ Net Income $5,400,000 = 25%\n\nFake 데이터:\nOperating income $4,350,000 → 사용 안 함\n주식수 1,500,000 → 사용 안 함",
    journal_entry: "",
    key_formula: "Dividend Payout Ratio = 총 배당금 ÷ Net Income",
    speed: "Dividend Payout = 배당금 ÷ Net Income | Operating income·주식수 → Fake",
  },

  // [RATIO_018] Dividend Payout Ratio — Quarterly Dividend Annual Conversion
  // RULE    : Payout = 연간 배당 ÷ 연간 EPS / quarterly dividend → ×4 환산 필수
  // TRIGGER : "quarterly dividend" → ×4 / "annual EPS" → 분모
  // TRAP    : 분기 배당 그대로 사용 / EPS ÷ 주가 역전 / P/E와 혼동
  {
    topic_id: "RATIO_018",
    book_id: 'AA',
    chapter_id: 'AA_CH8',
    topic_group: 'AA_CH8_RATIO',
    sub_category_id: "U2_RATIO_ANALYSIS",
    card_type: 'calculation',
    card_name: "Dividend payout ratio — quarterly dividend must be annualized",
    rule: "Dividend Payout Ratio = 연간 배당 ÷ 연간 EPS\n\n핵심: quarterly dividend가 주어지면 반드시 ×4 환산\n연간 배당 = 분기 배당 × 4\n\nP/E ratio와 세트로 출제 시:\nP/E = 주가 ÷ 연간 EPS\nPayout = (분기 배당 × 4) ÷ 연간 EPS\n→ 두 공식 모두 연간 EPS를 분모로 사용",
    trigger: "'quarterly dividend' → 즉시 ×4 환산 → 연간 배당 계산 'dividend payout ratio' → 연간 배당 ÷ 연간 EPS 'price-to-earnings' + 'dividend payout' 동시 → P/E = 주가÷EPS / Payout = 연간배당÷EPS",
    trap: "분기 배당 그대로 사용 → $0.50 ÷ $3.20 = 15.6% (연간 환산 누락) EPS ÷ 주가 → Earnings yield (payout 아님) 주가 ÷ 분기 배당 → P/E 계산 오류 P/E와 payout 공식 혼동 → P/E는 주가 관련, payout은 배당 관련",
    one_sentence: "Payout = 연간배당 ÷ EPS / quarterly → ×4 환산 필수 / P/E = 주가 ÷ EPS.",
    key_formula: "P/E = Stock price ÷ Annual EPS / Dividend payout = (Quarterly dividend × 4) ÷ Annual EPS",
    example: "주가 $40 / 분기 배당 $0.50 / 연간 EPS $3.20 P/E = $40 ÷ $3.20 = 12.5 연간 배당 = $0.50 × 4 = $2.00 Payout = $2.00 ÷ $3.20 = 62.5%",
    speed: "① P/E = 주가 ÷ EPS ② quarterly → ×4 → 연간 배당 ③ Payout = 연간배당 ÷ EPS",
    context_background: "[Dividend Payout Ratio 의미]\n순이익 중 배당으로 지급하는 비율.\nPayout 높음 → 이익 대부분을 주주에게 배분 (성숙 기업)\nPayout 낮음 → 이익을 재투자 (성장 기업)\n\n[Quarterly → Annual 환산이 핵심인 이유]\n미국 기업은 보통 분기(quarterly)마다 배당 지급.\n연간 EPS와 비교하려면 배당도 연간 기준으로 맞춰야 함.\n'quarterly dividend'가 보이면 → 즉시 ×4.\n\n[P/E vs Payout 혼동 방지]\nP/E: 주가와 이익의 관계 → 주가 ÷ EPS (배당 무관)\nPayout: 이익 대비 배당 비율 → 연간배당 ÷ EPS (주가 무관)\n두 비율 모두 분모 = 연간 EPS지만 분자가 다름.",
  },

  // ── DISC ───────────────────────────────────────────────────────────────────
  {
    topic_id: "DISC_001",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Subsequent events — recognize or disclose only",
    rule: "Recognized: condition existed at balance sheet date → adjust the financial statements. Disclosure-only: new condition arose after the balance sheet date → note disclosure only.",
    trigger: "subsequent event | after balance sheet date | recognize | disclose | type 1 | type 2",
    trap: "Only conditions that existed at year-end warrant recognition; genuinely new post-year-end events are disclosure only.",
    one_sentence: "If the condition existed at year-end → recognize it; arose after → disclose only.",
    example: "Customer bankrupt before year-end (discovered after) → recognize; new natural disaster after year-end → disclose only",
  },
  {
    topic_id: "DISC_002",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Related party transactions — what must be disclosed",
    rule: "Disclose: nature of relationship, description of transactions, dollar amounts, amounts due to/from related parties, and any terms that differ from arm's length.",
    trigger: "related party | disclosure | transactions | arm's length | related party note",
    trap: "Related party transactions must be disclosed even if they are priced at arm's length.",
    one_sentence: "All related party transactions must be disclosed regardless of pricing.",
    example: "Sale to CEO's family company → disclose: relationship, amount $50,000, and payment terms",
  },
  {
    topic_id: "DISC_003",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Segment reporting — when is a segment reportable",
    rule: "Reportable if any ONE of: (1) revenue ≥ 10% of combined revenue; (2) profit/loss ≥ 10% of larger of total profit or total loss; (3) assets ≥ 10% of total assets. Additionally, disclosed segments must cover ≥ 75% of external revenue.",
    trigger: "segment reporting | reportable segment | 10% | 75% | operating segment",
    trap: "Any ONE of the three 10% tests triggers reportability — not all three.",
    one_sentence: "A segment is reportable if it crosses any one of the three 10% thresholds.",
    example: "Segment revenue $110K / total company $1,000K → 11% → reportable",
  },
  {
    topic_id: "DISC_004",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Going concern — when to disclose",
    rule: "Disclose substantial doubt when conditions raise significant doubt about the entity's ability to continue for 12 months from the financial statement issuance date. Describe conditions and management's plans.",
    trigger: "going concern | substantial doubt | 12 months | doubt | mitigation",
    trap: "The 12-month window runs from the issuance date — not the balance sheet date.",
    one_sentence: "Disclose going concern doubt when conditions raise significant doubt about survival within 12 months of issuance.",
    example: "Recurring losses + negative cash flows → substantial doubt → disclose conditions and mitigation plans",
  },
  {
    topic_id: "DISC_005",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Commitments and contingencies — disclosure threshold",
    rule: "Disclose loss contingencies when loss is at least reasonably possible (even without accrual). Accrual requires probable + estimable.",
    trigger: "reasonably possible | commitment | contingency | disclosure threshold | possible",
    trap: "'Reasonably possible' triggers disclosure even without accrual — accrual threshold is higher (probable).",
    one_sentence: "Disclose if reasonably possible; accrue only if probable and estimable.",
    example: "Lawsuit reasonably possible loss $100,000 → disclose in notes; probable + estimable → also accrue",
  },
  {
    topic_id: "DISC_006",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Fair value disclosure — what levels require description",
    rule: "Level 3 disclosures require: quantitative info about unobservable inputs, valuation techniques, beginning-to-ending balance reconciliation, and transfers between levels.",
    trigger: "Level 3 | fair value disclosure | unobservable | valuation technique | roll-forward",
    trap: "Level 1 and 2 disclosures are simpler — Level 3 requires the most extensive note disclosure.",
    one_sentence: "Level 3 measurements require the most disclosure, including inputs and a balance roll-forward.",
    example: "Level 3 investment: disclose DCF inputs (growth rate, discount rate), roll-forward $100K → $115K",
  },
  {
    topic_id: "DISC_007",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Earnings per share — what must appear on face of income statement",
    rule: "Basic and diluted EPS must appear on the face of the income statement (not just notes) for public companies. Required for: income from continuing operations and net income at minimum.",
    trigger: "EPS disclosure | face of income statement | basic EPS | diluted EPS | public company",
    trap: "EPS for discontinued operations may be in notes, but continuing operations and net income EPS must be on the face.",
    one_sentence: "Basic and diluted EPS for continuing operations must appear on the face of the income statement.",
    example: "Public company income statement must show: Basic EPS $2.00 / Diluted EPS $1.85 on the face",
  },
  // [DISC_009] Summary of significant accounting policies — what belongs here
  {
    topic_id: "DISC_009",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Summary of significant accounting policies — what belongs here",
    rule: "Significant Accounting Policies note = 회계처리 방법 자체만. 후속사건·연금·우발채무는 각각 전용 note로 분리.",
    trigger: "- **\"summary of significant accounting policies\"** → 회계처리 **방법** 인지 확인\n- **\"after the balance sheet date\"** → subsequent event note\n- **pension, guarantee, commitment** → 각각 전용 note",
    trap: "- **B**: \"after the balance sheet date\" → **Subsequent Event Type 2** (B/S일 이후 새로 발생 → disclosure only) → subsequent event note\n- **C**: pension note\n- **D**: C&C note\n- **\"short-term investments\"** → securities로 혼동 주의 → MMF·T-bills 등 **cash equivalents 후보**를 의미\n- **공통 함정**: notes 공시 여부가 아니라 **어느 note**냐가 핵심",
    one_sentence: "Significant Accounting Policies = 회계처리 방법 자체; 나머지는 전용 note.",
    example: "Cash equivalents 기준 → policy ✓ / debt refinancing after B/S date → subsequent event note / pension assets → pension note / guarantees → C&C note",
    context_background: "## 왜 Significant Accounting Policies가 따로 있나\n재무제표는 숫자만으로는 의미를 알 수 없다. **같은 숫자라도 어떤 방법으로 측정했느냐**에 따라 해석이 달라진다.\n예: 재고자산을 FIFO로 했는지 LIFO로 했는지, 감가상각을 정액법으로 했는지 가속상각법으로 했는지.\nGAAP은 재무제표 이용자가 회사의 회계처리 방법을 이해할 수 있도록 **첫 번째 주석**에 중요한 회계정책을 요약하도록 요구한다.\n\n## Note 분류 원칙\n- **Significant Accounting Policies** → 회계처리 방법 자체\n- **Subsequent Events note** → B/S일 이후 발생한 사건\n- **Pension note** → 연금 자산·부채·비용 상세\n- **Commitments & Contingencies note** → 보증·소송·약정 등",
    context_trigger: '"summary of significant accounting policies" + 선지에 다양한 note 항목 혼재 → 회계처리 방법인지 확인',
    rule_title: "Summary of Significant Accounting Policies — 포함 항목 vs 전용 note",
    rule_items: [
      "Significant Accounting Policies = 회계처리 방법 자체만 포함",
      "Cash equivalents 판단 기준 → 분류 방법 → policy ✓",
      "B/S일 이후 사건 → Subsequent Events note",
      "연금 자산·부채 정보 → Pension note",
      "보증·약정 → Commitments & Contingencies note",
    ],
    speed: "① **\"Significant Accounting Policy = 회계처리 방법\"** 확인\n② A → cash equivalents **분류 기준** = 방법 ✓\n③ B·C·D → 전용 note 소속 → 탈락",
  },
  // [DISC_008] Discontinued Operations — Period of Reporting + 사후적 재분류
  // RULE    : 발생 연도 기준 / 처분 결정일 이전 손실도 사후적 재분류로 전액 포함
  // TRIGGER : "discontinued operations" + 여러 기간 손익 → 발생 연도 분류
  // TRAP    : B=gain 상계 / C=미래 손실 합산 / D=결정일 이후만 계상
  {
    topic_id: "DISC_008",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'conditional',
    card_name: "Discontinued Operations — Period of Reporting Rule",
    rule: "Discontinued operations 손익 = 발생 연도 I/S에 보고. 미래 예상손실·처분 gain → 실제 발생 연도 인식. 처분 결정일 이전 손실 → 사후적 재분류(reclassification)로 해당 연도 전액 포함. 소급 적용 아님 — 분류만 변경(일반 영업손실 → discontinued operations).",
    trigger: "discontinued operations | loss from discontinued | disposal | held for sale | operating segment | gain on disposal | period of reporting | reclassification",
    trap: "B: 미래 gain을 당기에서 상계 → gain은 실제 처분 연도에 인식\nC: 미래 손실까지 당기에 합산 → 발생 연도에 보고\nD: 처분 결정일 이후 손실만 계상 → 결정일 이전도 사후적 재분류로 전액 포함\n공통: 발생 연도 무시하고 금액만 합산하는 것",
    one_sentence: "Discontinued = 발생 연도 기준. 결정일 이전 손실도 사후적 재분류로 전액 포함. 미래 손익·gain은 실제 발생 연도 I/S.",
    speed: "당기 실제 발생분만 합산 / 미래 기간 전부 제외 / 결정일 이전·이후 구분 없음",
    context_background: "[핵심: 투자자 보호]\n투자자 목적 = '이 회사가 앞으로도 이 정도 벌 수 있나?' 판단.\nContinuing Operations = 앞으로 계속될 손익 → 미래 예측에 사용.\nDiscontinued Operations = 없어질 사업부 → 투자자가 분리해서 볼 일회성.\n중단 사업부 손실을 Continuing에 섞으면 → 투자자 오해 → 잘못된 투자 판단.\n\n[발생 연도 기준]\n20X4 포함: 1/1~9/30 $300K + 10/1~12/31 $200K = $500K\n20X5 이연: 1/1~3/31 손실 $400K + 처분 gain $350K → X5 I/S\n\n[왜 결정일 이전 손실도 포함하는가 — 사후적 재분류]\n10/1 결정 순간: '이 사업부는 올해 내내 중단될 사업이었던 거야 → 1/1부터 전부 재분류'\n결정 전: $300K → 일반 Operating Loss\n결정 후: $300K → Discontinued Operations Loss (사후적 재분류)\n이유: Continuing에 남기면 투자자가 '이 손실은 앞으로도 계속날 것'으로 오해\n→ Continuing 수익성 왜곡 방지를 위해 연초부터 전부 Discontinued로 분리\n\n[GAAP 전반의 공통 논리]\n투자자 보호 = FAR 회계처리 원칙의 근본 이유\nAFS 미실현손익→OCI(NI 변동성 방지) / Gain contingency 인식 금지 / M&A 거래비용 즉시 expense\n모두 '투자자가 합리적 판단을 내릴 수 있도록 정보를 왜곡 없이 제공'으로 수렴",
  },

  // [DISC_010] Subsequent Events — Evaluation Period (SEC filer vs Non-SEC filer)
  // RULE    : SEC filer = 실제 발행일, 공시 불필요 / Non-SEC filer = available to be issued, 공시 필수
  // TRIGGER : 'does not file with SEC' → Non-SEC / 승인 완료일 → available to be issued
  // TRAP    : 공시 불필요(A) / 기말일(B) / 실제 배포일=SEC 기준(D)
  {
    topic_id: "DISC_010",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_SUBSEQUENT_EVENTS",
    card_type: 'conditional',
    card_name: "Subsequent Events — Evaluation Period (SEC filer vs Non-SEC filer)",
    rule: "Subsequent Event 평가 기간 종료일:\nSEC filer → 실제 발행일(date FS issued) / 공시 불필요\nNon-SEC filer → available to be issued일(GAAP 준수 + 모든 승인 완료) / 공시 필수\n\nAvailable to be issued = GAAP 형식 준수 + 발행 승인 완료 시점 (실제 배포일 아님)",
    trigger: "'does not file with SEC' → Non-SEC filer → available to be issued 기준\n'all approvals necessary for issuance' 완료일 → available to be issued\n'distributed to interested parties' → 실제 배포일 → SEC filer 기준, Non-SEC 무관\nNon-SEC filer → 평가 종료일 공시 필수",
    trap: "A(No disclosure): Non-SEC filer는 반드시 공시 의무\nB(결산일 12/31): 평가 시작점이지 종료일 아님\nD(배포일 Feb 5): 실제 배포일 = SEC filer 기준. Non-SEC filer는 available to be issued 기준",
    one_sentence: "Non-SEC filer: available to be issued(승인 완료일)까지 평가 + 공시 필수 / SEC filer: 실제 발행일, 공시 불필요.",
    speed: "① SEC filer 여부 확인\n② Non-SEC → available to be issued = 승인 완료일\n③ 공시 필수 → 해당 날짜\n④ 답: C",
    context_background: "[Subsequent Events 평가 기간 — 두 기준]\n\n■ SEC filer (상장사 등)\n- 평가 기간: 결산일 ~ 실제 FS 발행일\n- 공시: 불필요 (SEC filing 자체가 공개 기록)\n- 이유: SEC에 제출 = 공개적으로 이미 알려짐\n\n■ Non-SEC filer (비공개 기업 등)\n- 평가 기간: 결산일 ~ available to be issued일\n- 공시: 필수 (이 날짜를 재무제표에 명시)\n- 이유: 외부에서 언제까지 평가했는지 알 수 없으므로 공시 필요\n\n[Available to be issued 정의]\n= GAAP 준수 형식 완성 + 모든 발행 승인 완료\n≠ 실제 배포일 (배포는 그 이후에 이루어질 수 있음)\n\n[이 문제 날짜 구조]\n12/31/Y1 → 결산일 (평가 시작점)\n1/27/Y2  → 승인 완료 = available to be issued\n           → Non-SEC filer(Birchwood) 평가 종료일 ✅\n2/5/Y2   → 실제 배포일\n           → SEC filer 기준, Non-SEC와 무관\n\n[공시 내용]\nNon-SEC filer는 다음 두 가지를 공시:\n① 평가 종료일 (available to be issued일)\n② 해당 날짜가 발행일인지 발행가능일인지 여부",
  },

  // [DISC_011] Discontinued Operations — Year 1 Loss: Full Operating Loss + Impairment
  // RULE    : Year 1 = 월손실×12(소급) + Impairment(BV−FMV) / Year 2 항목 제외
  // TRIGGER : "held for sale" + BV>FMV → Impairment Year 1 / 소급 재분류 → 12개월
  // TRAP    : Year 2 항목 합산(A/C) / Impairment 누락(D) / committed 시점부터만 계산 / committed=처분 착각
  {
    topic_id: "DISC_011",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Discontinued Operations — Year 1 Loss: Full Operating Loss + Impairment",
    rule: "Year 1 Discontinued Operations Loss:\n① 운영손실 = 월손실 × 12개월\n   → Plan committed 시점(중간)이어도 Year 1 전체 소급 재분류\n   → 결정 이전 손실: 일반 Operating Loss → Discontinued Ops로 재분류\n② Impairment loss = BV − FMV (held for sale 분류 시점)\n   → Held for sale: Lower of CV or FV-costs to sell → write-down\n③ Year 1 합계 = 운영손실 + Impairment\n\n[핵심 구분]\n결정일(committed) = 회계 분류 시작점. 이날 판 게 아님.\n처분일(sold) = 처분 손익 인식 시점 (Year 2)\n→ 결정일과 처분일 사이: 운영 계속, 손실 계속 발생\n\nYear 2 항목:\n- Year 2 운영손실 = 월손실 × 실제 운영 개월\n- Loss on disposal = 판매가 − BV(Year 2 기준)\n→ 모두 Year 2 I/S에 별도 계상",
    trigger: '"held for sale criteria met" + BV > FMV → Year 1 Impairment 인식\nPlan committed 중간 → Year 1 전체 운영손실 소급 재분류 (12개월)\n"committed to a plan" ≠ "sold" → 결정 후에도 운영 계속, 손실 계속\nYear 2 판매·운영 항목 → Year 2 I/S',
    trap: "Plan committed 시점(예: 6월)부터만 계산 → 전체 Year 1 소급 재분류 원칙 위반\n'committed to a plan'을 처분 완료로 착각 → 결정일이지 처분일 아님. 그 사이 손실 계속 발생\nYear 2 운영손실·disposal loss를 Year 1에 합산 → 발생 연도 기준 위반\nImpairment 누락 → Held for sale 분류 시 BV > FMV이면 반드시 write-down",
    one_sentence: "Year 1 discontinued loss = 월손실×12(소급) + Impairment(BV−FMV); 결정일≠처분일, Year 2 항목은 Year 2 I/S.",
    speed: "Year 1: $75,000×12=$900,000 + ($1,200,000−$975,000)=$225,000 = $1,125,000\nYear 2 → 제외\n결정(June 1) ≠ 처분(Feb 28 Y2) → 갭 동안 손실 계속",
    context_background: "[결정일 vs 처분일 — 핵심 구분]\n\n결정일(June 1, Year 1)\n= management가 '팔겠다'고 committed한 날\n= 이날 팔린 게 아님\n= Held for sale 분류 시작점\n= Impairment 측정 시점(BV vs FMV)\n\n처분일(Feb 28, Year 2)\n= 실제로 매각 완료된 날\n= Loss on disposal 인식 시점\n= Year 2 I/S\n\n결정일과 처분일 사이 갭(June 1 Y1 ~ Feb 28 Y2)\n= 사업 계속 운영 중\n= 매월 $75,000 손실 계속 발생\n= 갭이 길수록 누적 운영손실 증가\n\n[소급 재분류 원칙]\nYear 1 연간 FS 작성 시(12/31):\n'이 사업부는 올해 내내 중단될 사업이었다'\n→ 1월부터 전부 Discontinued Ops로 재분류\n→ June 이전 손실($75K×5)도 소급하여 포함\n이유: 투자자가 Continuing Operations 수익성을 왜곡 없이 판단하도록\n\n[Year 1 vs Year 2 분리]\n\nYear 1 I/S:\n운영손실: $75,000 × 12개월 = $900,000\nImpairment: $1,200,000 − $975,000 = $225,000\n합계: $1,125,000\n\nYear 2 I/S:\n운영손실: $75,000 × 2개월 = $150,000\nLoss on disposal: $975,000 − $825,000 = $150,000\n합계: $300,000\n\n[Impairment 인식 논리]\nHeld for sale 분류 시점: Lower of CV or (FV − costs to sell)\nBV $1,200,000 > FMV $975,000 → 차액 $225,000 = Impairment loss → Year 1",
    example: "Year 1: $75K×12=$900K + $225K impairment = $1,125K\nYear 2: $75K×2=$150K + disposal loss($975K−$825K)=$150K = $300K",
  },

  // [DISC_015] Summary of Significant Accounting Policies — What Goes In vs What Does Not
  // RULE    : Note 1 = 방법론(How) 공시 / Depreciation method → 포함 / Composition → 별도 주석
  // TRIGGER : "summary of significant accounting policies" → method ✅ / "composition/breakdown" → ❌
  // TRAP    : Composition을 Note 1에 포함 / Depreciation method 불필요 착각
  {
    topic_id: "DISC_015",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Accounting policy summary — method (policy) vs composition (detail)",
    rule: "Summary of Significant Accounting Policies (Note 1) 공시 기준:\n\n포함 대상 (Policy = How):\n→ Depreciation method (SL / DDB / UOP)\n→ Inventory valuation method (FIFO / LIFO / Avg)\n→ Revenue recognition method\n→ Useful lives (추정 방법)\n→ Consolidation policy\n\n미포함 대상 (Detail = What / How much):\n→ Composition of fixed assets (토지/건물/장비 각 금액)\n→ 각 자산 취득원가·감가상각 누계액 세부 내역\n→ 거래 금액·잔액 → 별도 주석\n\n[구분 기준]\nPolicy = 어떻게 회계처리하는가 (방법론)\nDetail = 얼마나, 무엇으로 구성되는가 (내역)",
    trigger: '"summary of significant accounting policies" → 방법론(How) 공시\n"depreciation method" → Note 1 필수 포함\n"composition / breakdown" → 별도 주석, Note 1 아님\n"useful lives" → 추정 정책 → Note 1 포함',
    trap: "Composition이 중요하니 Note 1 포함: 내역은 별도 주석 / Note 1은 방법론만\nDepreciation method 불필요: 항상 필수 공시\n모든 세부 내역을 Note 1에 집어넣기: Note 1 = 정책 요약, 세부 내역 아님",
    one_sentence: "Note 1 = 방법론(How) 공시 / Composition·세부내역 → 별도 주석.",
    speed: "Policy(How) → Note 1 ✅ | Detail(What/How much) → 별도 주석 ❌",
    context_background: "[Note 1 역할]\n재무제표 이용자가 숫자를 올바르게 해석하려면 회사가 어떤 방법으로 그 숫자를 산출했는지 알아야 한다. Note 1은 그 방법론의 집합체.\n\n[Composition은 왜 별도 주석인가]\n고정자산 구성 내역(토지 $X, 건물 $Y 등)은 회사가 무엇을 얼마나 보유하는지에 대한 정보. 이는 정책이 아니라 상태(status) 공시 → PP&E 관련 별도 주석에서 처리.\n\n[시험 출제 포인트]\n'depreciation method' → Note 1 ✅\n'composition of fixed assets' → Note 1 ❌\n'useful lives' → Note 1 ✅ (추정 정책)\n'cost of each asset category' → Note 1 ❌ (금액 내역)",
  },

  // [DISC_014] Accounting Policy Disclosure — Integral Part of F/S, Scope, and Format Rules
  // RULE    : Integral part / 모든 중요 정책 / 중복 불필요 / 형식·위치 GAAP 미고정
  // TRIGGER : "integral part" ✓ / "industry peculiar only" ✗ / "format fixed by GAAP" ✗ / "duplicate" ✗
  // TRAP    : Note 1 = GAAP 강제 착각 / 업종 한정 공시 착각 / GAAP이 How도 강제 착각
  {
    topic_id: "DISC_014",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Accounting policy disclosure — integral part, scope, no duplication, format not fixed",
    rule: "회계정책 공시 4대 원칙:\n① Integral part: 주석 = 재무제표 필수 구성 요소 (선택 아님)\n② 범위: 모든 중요(material) 회계정책 공시 — 업종 특유에 한정 불가\n③ 중복 불필요: 다른 곳에 이미 공시된 내용 반복 금지\n④ 형식·위치: GAAP 강제 아님 — Note 1 배치는 관행(practice), 규정(rule) 아님\n\n[GAAP이 강제하는 것 vs 재량]\nGAAP 강제 = WHAT to present\n  → F/S 4개 필수, 최소 line items, 중요 정책 공시\nGAAP 재량 = HOW·WHERE to present\n  → 주석 순서, 형식, 계정과목 명칭, 레이아웃",
    trigger: '"integral part of the financial statements" → 주석 = 필수 구성 요소\n"all material accounting policies" → 업종 특유 한정 불가\n"format and location fixed by GAAP" → 틀린 선지\n"should duplicate" → 중복 불필요 → 틀린 선지',
    trap: "Note 1 위치 = GAAP 강제: 관행이지 규정 아님\n업종 특유만 공시: 모든 중요 정책 공시 필요\nGAAP이 형식까지 강제: What만 강제, How/Where는 재량\n중복 공시가 완전성을 높인다: 중복은 불필요, 오히려 간결성 훼손",
    one_sentence: "회계정책 공시 = integral part / 모든 중요 정책 / 중복 불필요 / 형식·위치 GAAP 미고정.",
    speed: "A ✓ integral part | B ✗ 중복 불필요 | C ✗ 모든 중요 정책 (업종 한정 아님) | D ✗ 형식·위치 GAAP 미고정",
    context_background: "[주석(Notes)이 재무제표의 integral part인 이유]\n재무제표 본문(4개 F/S)의 숫자만으로는 회사가 어떤 방법으로 그 숫자를 산출했는지 알 수 없다. 주석은 이용자가 재무정보를 올바르게 해석하는 데 필수적인 맥락을 제공한다.\n\n[Note 1 관행]\n거의 모든 기업이 Note 1에 'Summary of Significant Accounting Policies'를 배치한다. 이는 '왜(why) 이런 숫자인지'를 먼저 설명하고 '무엇(what)인지'를 뒤에 설명하는 관행적 순서. GAAP이 강제한 규정이 아님.\n\n[업종 특유 정책 한정이 틀린 이유]\n업종 특유 정책은 물론 공시해야 하지만, 재고 평가방법, 감가상각 방법, 수익인식 방법 등 일반적인 회계정책도 모두 공시 대상. 중요성(materiality) 기준으로 판단.\n\n[GAAP What vs How 구분]\nWhat: B/S에 유동/비유동 구분 표시, I/S에 영업손익 별도 표시 등 → 강제\nHow: 계정과목 순서, 주석 번호, 컬럼 형식 → 재량",
  },

  // [DISC_012] SEC Regulations — S-X vs S-K vs S-T vs S-B
  // RULE    : S-X = FS 형식·공시 / S-K = 비재무 공시(MD&A 등) / S-T = 전자제출 / S-B = 소규모기업(폐지)
  // TRIGGER : "financial statement presentation" → S-X / "MD&A" → S-K / "EDGAR" → S-T
  // TRAP    : S-K를 재무공시로 착각 / S-T·S-B는 혼란용 선지
  {
    topic_id: "DISC_012",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_DISC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "SEC Regulations — S-X vs S-K vs S-T vs S-B",
    rule: "SEC Regulation 4종 구분:\nS-X → 재무제표 형식·내용·공시 요건 (FS presentation & disclosure)\nS-K → 비재무 공시 (MD&A, 사업개요, 임원정보 등)\nS-T → 전자제출 방식 (EDGAR electronic filing rules)\nS-B → 소규모 공개기업 공시 (현재 폐지)\n\n실전 이분법: financial statement → S-X / 나머지 → S-K",
    trigger: '"financial statement presentation" or "disclosure requirements" → S-X\n"MD&A" or "non-financial" or "business description" → S-K\n"electronic filing" or "EDGAR" → S-T\n"small business issuers" → S-B',
    trap: "S-K를 재무공시로 착각 → S-K는 비재무(MD&A·사업개요) 전담\nS-T·S-B는 선지 혼란용 — 답이 될 가능성 거의 없음\n실전에서는 S-X vs S-K 이분법으로 충분",
    one_sentence: "financial statement 키워드 → S-X / 비재무(MD&A 등) → S-K",
    speed: '"financial statement" 보이면 → S-X 즉시 선택',
    context_background: "SEC는 공개기업 공시를 Regulation별로 분리 관리.\nS-X: FS의 형식·내용 규정 (interim·annual 모두 포함)\nS-K: 숫자 외 공시 — MD&A, 사업 설명, 임원 보수, 위험요소 등\nS-T: EDGAR 전자 제출 방식·기술 규정\nS-B: 소규모 기업 간소화 공시 (현재 폐지, 통합됨)\n암기팁: S-X → eXact financial statements / S-K → non-financial Key info",
  },

  // [DISC_013] SEC Regulations — S-X / S-K / S-T / S-B Classification
  // RULE    : S-X=재무제표 / S-K=비재무 / S-T=전자제출 / S-B=소규모기업
  // TRIGGER : "financial statement presentation+disclosure" → S-X
  // TRAP    : S-K(비재무)와 S-X(재무) 혼동 / S-T(전자) 혼동
  {
    topic_id: "DISC_013",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_SPF',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "SEC Regulations — S-X vs S-K vs S-T vs S-B (detailed)",
    rule: "S-X: 재무제표 형식·내용·공시 요건 (annual + interim)\nS-K: 비재무 공시 요건 (MD&A, 임원보수, 위험요소)\nS-T: 전자 제출 규정 (EDGAR)\nS-B: 소규모 기업 공시 요건\n\n'financial statement presentation + disclosure' → S-X",
    trigger: '"financial statement presentation" + "disclosure requirements" → S-X\n"non-financial reporting" → S-K\n"electronic filings" / "EDGAR" → S-T\n"small business issuers" → S-B',
    trap: "S-K 혼동: 비재무 공시(MD&A)와 재무제표 공시 혼동 → 재무제표 형식은 S-X.\nS-T 혼동: 'SEC filings' 키워드에 전자 제출 규정으로 착각.",
    one_sentence: "S-X=재무제표 형식·공시 | S-K=비재무 | S-T=전자제출 | S-B=소규모기업",
    speed: "재무제표 형식·공시 = S-X | 비재무 = S-K | 전자 = S-T | 소규모 = S-B",
    context_background: "[각 Regulation 역할]\nS-X: Form and content of financial statements filed with SEC. Annual + interim 모두 적용.\nS-K: Non-financial disclosures — MD&A, executive compensation, risk factors, legal proceedings 등.\nS-T: Electronic filing rules — EDGAR 시스템 제출 규정.\nS-B: Small business issuers 전용 공시 요건.\n\n[암기 팁]\nS-X = eXact financial statements (재무제표 정확한 형식)\nS-K = non-financial (K는 비재무 공시)\nS-T = Technology/electronic\nS-B = small Business",
  },

  // ── FC ─────────────────────────────────────────────────────────────────────
  {
    topic_id: "FC_001",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Foreign currency transaction — which rate to use at transaction date",
    rule: "Record foreign currency transactions at the spot rate on the transaction date.",
    trigger: "foreign currency | transaction date | spot rate | initial recording | purchase foreign",
    trap: "Use the spot rate on the transaction date — not the forward rate or an estimate.",
    one_sentence: "Record the transaction at the spot rate on the date it occurs.",
    example: "Purchase from foreign vendor Dec 1 / 1 EUR = $1.10 → record at $1.10/EUR",
  },
  {
    topic_id: "FC_002",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "Foreign currency transaction — which rate to use at year end",
    rule: "Monetary items (receivables, payables, cash) remeasure at the current spot rate at each balance sheet date. Nonmonetary items (inventory, PP&E) stay at the historical rate.",
    trigger: "year-end | balance sheet date | remeasure | current rate | monetary items",
    trap: "Nonmonetary items do NOT remeasure at year-end — they keep their historical rate.",
    one_sentence: "Monetary items remeasure at year-end spot rate; nonmonetary items stay at historical rate.",
    example: "EUR payable €100,000 / recorded at $1.10 / year-end rate $1.15 → remeasure to $115,000",
  },
  {
    topic_id: "FC_003",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "Foreign currency gain/loss — where does it go",
    rule: "Foreign currency transaction gains and losses (from remeasuring monetary items) go to Net Income, not OCI.",
    trigger: "foreign currency gain | foreign currency loss | transaction gain | transaction loss",
    trap: "Transaction G/L → net income; translation adjustment (for foreign subsidiaries) → OCI. Different treatment.",
    one_sentence: "Foreign currency transaction gains/losses flow through net income.",
    example: "AP rose from $110,000 to $115,000 at year-end → Dr. Foreign Exchange Loss $5,000, Cr. AP $5,000 (I/S)",
  },
  {
    topic_id: "FC_004",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Functional currency — how to determine",
    rule: "The functional currency is the currency of the primary economic environment where the entity operates — generally where it generates and spends cash.",
    trigger: "functional currency | primary economic environment | cash flows | local currency",
    trap: "The functional currency may differ from the local currency if operations are primarily in another currency.",
    one_sentence: "Functional currency = wherever the entity primarily earns and spends money.",
    example: "US subsidiary in Mexico that prices, sells, and pays in USD → functional currency = USD",
  },
  {
    topic_id: "FC_005",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "Translation vs remeasurement — when to use which",
    rule: "【방법 선택 기준】\nFunctional currency = Local currency → Translation (Current Rate Method)\nFunctional currency = Reporting currency → Remeasurement (Temporal Method)\n\n【손익 귀속처 — 핵심 암기】\nRemeasurement → Net Income\n이유: 자회사 = 본사 연장선 / 개별 화폐성 항목 직접 노출 / 실질적 실현\n\nTranslation → OCI (Cumulative Translation Adjustment)\n이유: 자회사 독립 운영 / 순자산 가치 변동 / 미실현 → 자회사 매각 시 NI로 reclassify",
    trigger: '"remeasurement" → Net income\n"translation" → OCI (CTA)\n두 방법 동시 비교 표 → Remeasurement=NI / Translation=OCI = C 패턴',
    trap: "둘 다 OCI → Remeasurement는 NI\n둘 다 NI → Translation은 OCI\nRemeasurement→OCI / Translation→NI → 완전히 반대\n공통 함정: 두 방법 손익 귀속처 뒤바꾸기",
    one_sentence: "Translate if functional = local currency; remeasure if functional = reporting currency.",
    example: "프랑스 자회사, functional = EUR → Translation → OCI\n프랑스 자회사, functional = USD(본사통화) → Remeasurement → Net Income",
    speed: "Remeasurement → NI | Translation → OCI → C",
  },
  {
    topic_id: "FC_006",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Translation adjustment — where does it go",
    rule: "Translation adjustment (from current rate method for foreign subsidiaries) goes to Other Comprehensive Income (OCI) as Cumulative Translation Adjustment (CTA).",
    trigger: "translation adjustment | CTA | OCI | foreign subsidiary | current rate method",
    trap: "Translation adjustment → OCI (not income); recognized in income only when the subsidiary is sold.",
    one_sentence: "Translation adjustment from the current rate method → OCI, not net income.",
    example: "Net translation adjustment $30,000 → Cr. Cumulative Translation Adjustment (OCI) $30,000",
  },
  {
    topic_id: "FC_007",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Remeasurement gain/loss — where does it go",
    rule: "Remeasurement gain or loss (from the temporal method) goes directly to Net Income, not OCI.",
    trigger: "remeasurement | temporal method | gain/loss | net income | remeasurement gain",
    trap: "Remeasurement G/L → income; translation adjustment → OCI. These are opposite treatments.",
    one_sentence: "Remeasurement gain/loss flows through net income, unlike translation adjustment which goes to OCI.",
    example: "Temporal method produces $15,000 remeasurement gain → included in Net Income",
  },

  // [FC_008] Foreign currency — Translation vs Transaction in consolidated I/S
  // RULE    : Translation → OCI(unrealized) / Transaction → NI(realized)
  // TRIGGER : "realized foreign exchange loss" → Transaction만 / translation → OCI 제외
  // TRAP    : B($19K) translation 합산 / D($15K) AP gain 차감 누락
  {
    topic_id: "FC_008",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Foreign currency — Translation vs Transaction in consolidated I/S",
    rule: "Translation loss → OCI(unrealized), NI 포함 안 됨. Transaction G/L → NI(realized). 'realized foreign exchange loss' 질문 → Transaction만 포함. AP 외화 약세 → gain(NI) / AR 외화 약세 → loss(NI).",
    trigger: "- **\"realized foreign exchange loss\"** → Transaction G/L만, Translation 제외\n- **\"translation of accounts of wholly owned subsidiary\"** → OCI, NI 포함 안 됨\n- **AP + 달러 환산액 감소** → gain → realized loss에서 차감\n- **\"payable on [미래날짜]\"** → 미결제 → 연말 재평가 대상",
    trap: "- **B ($19,000)**: translation loss 합산 → OCI 항목, NI 포함 불가\n- **D ($15,000)**: AP gain $4,000 차감 누락\n- **공통 함정**: \"realized\" 흘려읽고 translation까지 합산",
    one_sentence: "realized FX loss 질문 → Translation(OCI) 제외, Transaction G/L만 NI 반영.",
    example: "FX loss $15,000 / Translation loss $8,000(OCI 제외) / AP $64,000→$60,000 gain $4,000 → Realized FX loss = $15,000 − $4,000 = $11,000",
    context_background: "## Translation vs Transaction — 왜 처리가 다른가\n\n**Translation (외국 자회사 재무제표 환산)**\n외국 자회사 재무제표를 본사 통화로 변환할 때 환율 차이로 발생.\n실제 현금 거래 없음 → **Unrealized** → **OCI(CTA)** 처리.\n자회사 매각 시 비로소 실현 → 그때 NI로 reclassify.\n\n**Transaction (실제 외화 거래)**\nAP·AR 등 외화 표시 채권·채무는 B/S date에 현재 환율로 재평가.\n실제 현금 흐름 영향 → **Realized** → **Net Income** 반영.\n\n## AP vs AR 방향\n- **AP**: 외화 강세 → 갚을 금액 증가 → **Loss** / 외화 약세 → 갚을 금액 감소 → **Gain**\n- **AR**: 외화 강세 → 받을 금액 증가 → **Gain** / 외화 약세 → 받을 금액 감소 → **Loss**\n\n## 실생활 예시 — 한국 수입·수출업체\n우리가 매일 보는 **\"1,500원/달러\"** 는 **직접법(Direct)** 이다.\n달러 1단위를 사는 데 원화 1,500원 필요 = 자국 통화로 외화 1단위 가격 표시.\n\n**수입업체 (달러 AP 보유):**\n- 환율 1,500원 → 1,600원 상승 = **달러 강세(원화 약세)**\n- 갚아야 할 원화: $100 × 1,600 = 160,000원 (기존 150,000원보다 증가)\n- → **Foreign Exchange Loss 10,000원** (NI 반영)\n\n**수출업체 (달러 AR 보유):**\n- 환율 1,500원 → 1,400원 하락 = **달러 약세(원화 강세)**\n- 받을 원화: $100 × 1,400 = 140,000원 (기존 150,000원보다 감소)\n- → **Foreign Exchange Loss 10,000원** (NI 반영)\n\n## 이 문제에서의 적용\n달러 환산값이 직접 주어짐: AP $64,000 → $60,000\n외화 약세 → 갚아야 할 달러 감소 → **AP Gain $4,000** (NI 반영)\n\n## 환율 표시 방식 — 달러 환산값이 안 주어졌다면\n- **직접법(Direct)**: $1.10/EUR → 환율 상승 = 외화 강세\n- **간접법(Indirect)**: EUR 0.91/$ → 환율 상승 = 외화 약세\n- 표시 방식 먼저 확인 후 AP/AR 방향 판단",
    context_trigger: '"realized foreign exchange loss" + translation loss + AP 재평가 혼재 → Translation은 OCI 제외, Transaction AP gain만 NI 반영',
    rule_title: "Foreign Currency — Translation(OCI) vs Transaction(NI) 구분",
    rule_items: [
      "Translation loss → Unrealized → OCI(CTA) → realized FX loss에 포함 안 됨",
      "Transaction G/L → Realized → Net Income 반영",
      "AP 외화 약세 → 갚을 금액 감소 → Gain(NI)",
      "AR 외화 약세 → 받을 금액 감소 → Loss(NI)",
      "직접법: 환율 상승 = 외화 강세 / 간접법: 환율 상승 = 외화 약세",
      "Realized FX loss = $15,000 − AP gain $4,000 = $11,000",
    ],
    speed: "**① Translation loss $8,000 → OCI → 제외**\n**② AP gain**: $64,000 − $60,000 = **$4,000**\n**③ Realized FX loss**: $15,000 − $4,000 = **$11,000**",
  },

  // [FC_009] Foreign Currency Transaction — Multi-Item Exchange Loss
  // RULE    : AP(결제일 차이) + 원금(기말 재측정) + 이자(기말 재측정) 각각 계산 후 합산
  // TRIGGER : 'paid at USD equivalent of $X' / 'USD equivalent on Dec 31' / 'payable in lender's local currency'
  // TRAP    : AP만 계산(A) / 이자 누락(B) / 미실현이라 $0 처리(D)
  {
    topic_id: "FC_009",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Foreign Currency Transaction — Multi-Item Exchange Loss Calculation",
    rule: "외화거래 환차손 3항목 각각 계산:\n① AP: 결제일 USD − 매입일 USD = 환차손\n② 차입금 원금: 기말 USD − 차입일 USD = 환차손\n③ 미지급이자: 기말 USD − 차입일 환율 기준 이자액 = 환차손\n→ 세 항목 합산 = 당기 외화환산손실(I/S 인식)",
    trigger: "'paid at the U.S. dollar equivalent of $X' → AP 결제일 환율 차이\n'U.S. dollar equivalent on December 31' → 기말 재측정\n'payable in the lender''s local currency' → 외화부채 → 기말 재측정 필요\n이자도 외화 표시 → 별도 재측정",
    trap: "AP 환차손만 계산하고 차입금·이자 누락\n미지급이자 재측정 빠뜨리고 원금만 합산\n'미실현이라 인식 안 한다' → 외화거래 손익은 미실현이어도 당기 I/S 인식",
    one_sentence: "외화거래 환차손 = AP손실 + 원금재측정손실 + 이자재측정손실 합산.",
    speed: "⚠️ 계산 3번 필요 — 시험장에서 시간 부족하면 flag 걸고 나중에 풀기\n빠른 소거: D($0) 즉시 탈락(미실현도 인식) / A = AP만 계산한 값 → 차입금 있으면 무조건 더 큼\n→ B or C로 좁히고 시간 있을 때 복귀",
    example: "AP: $144K−$135K=$9K / 원금: $780K−$750K=$30K / 이자: $20,250−$18,750=$1,500 → 합계 $40,500",
  },

  // [FC_010] Foreign currency — title transfer date, A/P remeasurement, gain/loss I/S classification
  // RULE    : 기록 시점 = Title 이전일 / 결제 조건(payment term)과 무관 / Dec.31 A/P 재평가 / 달러 강세 → Gain / Continuing operations 포함
  // TRIGGER : "title passed on [date]" → 기록 시점 / "still in transit" → 무관, title이 기준 / "one dollar to X euros" 증가 → 달러 강세 → Gain
  // TRAP    : 계약일 환율 사용 / "in transit" = 미기록으로 오인 / Gain을 Loss로 / discontinued operations 분류
  {
    topic_id: "FC_010",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Foreign currency transaction — title transfer date, A/P remeasurement, gain/loss classification",
    rule: "외화 거래 3단계:\n① 기록 시점 = Title 이전일 (계약일·결제일 아님)\n② Dec.31 A/P 재평가 = 결산일 spot rate (Monetary item)\n③ 달러 강세($1=유로 증가) → A/P 부담 감소 → Gain\n   달러 약세($1=유로 감소) → A/P 부담 증가 → Loss\n④ 외환손익 → Continuing operations 포함 (net of tax/discontinued 아님)\n⑤ 결제 조건(payment term) = Title 이전과 별개 개념",
    trigger: '"title passed on [date]" → 기록 시점 확정, 계약일 무시\n"still in transit on Dec.31" → 무관, title이 기준\n"one dollar to X euros" 결산일 증가 → 달러 강세 → A/P Gain\n"payment in euros" → 외화 A/P → 재평가 대상(monetary)',
    trap: "① 계약일(Oct.1) 환율 사용 → title 미이전, 기록 없음\n② 'still in transit' = 미기록으로 오인 → title이 넘어갔으면 내 재고·부채\n③ 달러 강세를 Loss로 오인 → A/P 관점: 갚을 부담 감소 = Gain\n④ 'net of tax after discontinued operations' → 외환손익 = continuing operations",
    one_sentence: "외화 거래 기록 = Title 이전일; 달러 강세 → A/P Gain → Continuing operations 포함.",
    example: "Dec.15 Title 이전($1=20euros) → A/P 인식 / Dec.31($1=21euros) → 달러 강세 → Gain → Continuing ops",
    context_background: "외화 거래에서 장부 기록 시점은 title 이전일이다. 계약일도, 결제일도 아니다. 결제 조건(payment term)은 '언제 돈을 내느냐'의 문제이고, title 이전은 '언제 소유권이 넘어오느냐'의 문제로 완전히 별개다. 집을 살 때 등기(title)는 넘어왔지만 잔금(payment)은 나중에 내는 것과 같은 구조다. 결산일에 A/P가 미결제 상태이면 환율 재평가가 필요하고, 달러 강세(같은 달러로 더 많은 유로 구매 가능)면 부채 부담이 줄어 Gain이 발생한다.",
    speed: "① Title 이전 = Dec.15 → A/P 인식($1=20euros)\n② 'still in transit' → 무시, title이 기준\n③ Dec.31: $1=21euros → 달러 강세 → Gain\n④ Continuing operations → 정답 B",
  },

  // [FC_011] Foreign Currency AP – Unrealized Gain/Loss at Year-End
  // RULE    : 미실현손익 = 거래일 AP − 결산일 AP / 결산일 환율 재측정 / 지급일 환율 Fake
  // TRIGGER : "unrealized gain/loss at Dec 31" → 거래일 vs 결산일 환율 / €/$ → 역수 변환
  // TRAP    : 지급일 환율 사용 / 환율 차이를 €금액에 직접 곱함 / 달러 강세 → Loss로 오인
  {
    topic_id: "FC_011",
    category: "Foreign Currency",
    topic_name: "Foreign Currency AP – Unrealized Gain/Loss at Year-End",
    rule: "【외화 AP 회계처리 흐름】\n거래일: AP = €금액 × 거래일 $/€ 환율\n결산일: AP 재측정 = €금액 × 결산일 $/€ 환율\n미실현손익 = 거래일 AP − 결산일 AP\n\n【환율 방향과 손익】\n달러 강세(€당 $ 감소) → AP 감소 → Gain\n달러 약세(€당 $ 증가) → AP 증가 → Loss\n\n【환율 표시 변환】\n€/$ 표시 → $/€로 변환: 1 ÷ €율\nDec 10: 1/0.79 = $1.2658/€\nDec 31: 1/0.82 = $1.2195/€\n\n【지급일 환율】\n미실현손익 계산 무관 (Fake)\n지급일에 실현손익 별도 계산",
    trigger: '"unrealized gain/loss at Dec 31" → 거래일 vs 결산일 환율만 사용\n"paid on [미래일]" → 지급일 환율 → 미실현손익 Fake\n€/$ 환율 표시 → 역수 취해서 $/€ 변환\n달러 강세(€당 $ 감소) → AP 감소 → Gain',
    trap: "지급일 환율 사용(미실현손익은 결산일 기준).\n환율 차이(0.82−0.79=0.03)를 €금액에 직접 곱하는 오류.\nGain/Loss 방향 혼동 — 달러 강세 = AP 감소 = Gain.\n€/$ 환율을 $/€로 변환 안 하고 직접 사용.",
    example: "Cedar Inc.:\nDec 10: €75,000 × (1/0.79) = $94,937 AP 계상\nDec 31: €75,000 × (1/0.82) = $91,463 재측정\nGain = $94,937 − $91,463 = $3,750\n\nJan 10 환율(0.75) → 미실현손익 계산에 사용 안 함",
    journal_entry: "Dec 10 (매입):\nDr. Inventory $94,937\nCr. AP $94,937\n\nDec 31 (재측정):\nDr. AP $3,474\nCr. FX Gain $3,474\n\nJan 10 (지급):\nDr. AP $91,463\nDr. FX Loss [환율 변동분]\nCr. Cash [지급일 환율 기준]",
    key_formula: "미실현 FX Gain/Loss = 거래일 AP − 결산일 AP\n$/€ = 1 ÷ (€/$율)\nDollar 강세 → AP↓ → Gain",
    speed: "미실현 FX = 거래일 AP − 결산일 AP | 지급일 환율 → Fake | 달러 강세 → Gain",
  },

  // [FC_014] Foreign Currency Transaction — USD-Denominated Deals Are NOT FC Transactions
  // RULE    : 기능통화(USD)로 표시된 거래 = 외화거래 아님 → 손익 계산 제외
  // TRIGGER : "purchased for $X" ($ 표시) → 즉시 제외 / "euros/yen/GBP" → 포함
  // TRAP    : 외국 회사와 거래했어도 USD 표시면 외화거래 아님 / 방향 혼동(환율 하락 = AR loss)
  {
    topic_id: "FC_014",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "Foreign currency G/L — USD-denominated deals are NOT foreign currency transactions",
    rule: "외화거래 손익 계산 2단계 필터:\n① 외화거래 여부 판단: 거래 금액이 외화(euros/yen 등)로 표시 → 대상 / USD 표시 → 즉시 제외\n② 기말 미결제 여부: 결제 완료 → 손익 없음 / 미결제 → 기말 환율로 재측정\n손익 = (기말 환율 − 거래일 환율) × 외화 금액\nAR: 환율 하락 → Loss / 환율 상승 → Gain\nAP: 환율 하락 → Gain / 환율 상승 → Loss",
    trigger: "'purchased for $X less than fair value' → $ 표시 → 외화거래 아님, 즉시 제외 'sale for [euros/yen]' + 'payment in Year 2' → 미결제 외화 AR → 재측정 대상 'spot rate at end of year' → 재측정 환율",
    trap: "외국 회사와 거래 = 외화거래 아님 — 계약이 USD면 환율 리스크 없음. 즉시 제외 AR 환율 하락 → Gain 착각 — 환율 하락이면 euros AR의 USD 가치 감소 → Loss USD 표시 거래의 FV 차이($5,000 등) → 외화손익 아님, 별도 처리",
    one_sentence: "숫자 앞에 $ → 제외 / euros·yen 등 → 포함 후 (기말율 − 거래일율) × 외화금액.",
    example: "거래1: 'purchased for $5,000 less than FV' → $ 표시 → 제외 거래2: 'sold 100,000 euros at $1.01 / year-end $0.98' → ($0.98−$1.01) × 100,000 = ($3,000) loss",
    speed: "① $ 표시 거래 → 즉시 제외 ② 외화 미결제 → (기말율 − 거래일율) × 외화금액 ③ AR + 환율 하락 → Loss",
    context_background: "[외화거래의 본질]\n미국 회사(기능통화 USD) 입장에서 외화거래란 '받을 돈 또는 낼 돈이 외화로 확정된 거래'.\nUSD로 계약하면 환율이 어떻게 바뀌든 내가 받을 달러는 고정 → 외화 리스크 없음.\neuros로 계약하면 기말에 환율이 달라질 때마다 내 AR의 달러 가치가 달라짐 → 외화 리스크 있음 → 손익 인식.\n\n[방향 직관]\nAR(받을 돈)이 euros로 잡혀 있을 때:\n환율 하락($1.01→$0.98) = euros 가치 하락 = 내가 받을 달러 줄어듦 → Loss\n환율 상승($0.98→$1.01) = euros 가치 상승 = 내가 받을 달러 늘어남 → Gain\n\n[이 문제의 함정 구조]\n거래 1이 '외국 제조사에서 구매'라고 해서 외화거래처럼 보이지만\n'for $5,000 less than fair value' → $ 표시 → USD 계약 → 외화거래 아님.\n시험에서 '외국 회사' 언급은 함정 포장지일 뿐 — 통화 표시만 봐야 함.",
  },

  // [FC_013] Foreign Currency — Remeasurement vs Translation: Where Gains/Losses Are Reported
  // RULE    : Remeasurement → Net income / Translation → OCI(CTA) | Re→I/S / Tr→OCI
  // TRIGGER : "remeasurement" → NI / "translation" → OCI / "functional currency" → 방법 결정
  // TRAP    : Remeasurement를 OCI로 / Translation을 NI로 / 둘 다 동일 처리
  {
    topic_id: "FC_013",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Remeasurement vs translation — where gains and losses are reported",
    rule: "외화 재무제표 환산 두 가지 방법:\n\n[Remeasurement (재측정)]\n적용: 기능통화 ≠ 현지통화 (본사가 기능통화 결정)\n손익 인식: Net income (I/S 직행)\n계정명: Remeasurement gain/loss\n\n[Translation (환산)]\n적용: 기능통화 = 현지통화 (자회사가 독립적 운영)\n손익 인식: OCI → AOCI (Cumulative Translation Adjustment)\n계정명: CTA (Cumulative Translation Adjustment)\n→ 자회사 매각 시 Net income으로 reclassify\n\n[암기]\nRe(measurement) → I/S (Net income)\nTr(anslation) → OCI (Translation adjustment)",
    trigger: '"remeasurement" → Net income\n"translation" → OCI (CTA)\n"functional currency ≠ local currency" → Remeasurement → Net income\n"functional currency = local currency" → Translation → OCI',
    trap: "Remeasurement를 OCI로: Net income에 인식\nTranslation을 Net income으로: OCI(CTA)에 인식\n두 방법 모두 동일하게 처리: 인식 위치가 정반대",
    one_sentence: "Remeasurement → Net income / Translation → OCI(CTA); Re→I/S / Tr→OCI.",
    speed: "Re → Net income | Tr → OCI(CTA) | 자회사 매각 시 CTA → Net income reclassify",
    context_background: "[두 방법 구분 기준]\n기능통화(Functional Currency): 주로 영업이 이루어지는 경제환경의 통화\n\nRemeasurement 사용 시:\n→ 자회사 기능통화 = 본사 보고통화 (예: 미국 본사, 해외 자회사지만 USD로 운영)\n→ 또는 초인플레이션 경제\n→ 재측정 손익 = 당기 손익에 즉시 반영\n\nTranslation 사용 시:\n→ 자회사 기능통화 = 현지통화 (예: 독일 자회사, EUR로 독립 운영)\n→ 자산·부채: 기말 환율 / I/S: 평균 환율\n→ 환산 차이 = OCI에 누적 (CTA)\n→ 자회사 매각 시 AOCI에서 Net income으로 reclassify\n\n[실전 암기]\nRe → Revenue/Expense (I/S)\nTr → Translation (OCI)",
  },

  // [FC_016] FX Rate Direction — AR/AP Gain/Loss → 달러당 외화 단위수 증감 역산
  // RULE    : Gain/Loss → 외화 강세/약세 역산 → 달러당 외화 수 방향 판단
  // TRIGGER : "units of foreign currency per dollar" + AR Gain + AP Loss
  // TRAP    : AP Loss 보고 반대 방향 적용 → Loss 자체가 이미 반대 반영
  {
    topic_id: "FC_016",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "FX rate direction — reverse-engineer gain/loss to find rate movement",
    rule: "환율 표시 방식: 달러당 외화 단위수 (units of foreign currency per $1)\n이 숫자 감소 = 외화 강세 / 증가 = 외화 약세\n\n손익 → 환율 방향 역산:\nGain → 외화 강세 → 달러당 외화 수 감소(Decrease)\nLoss → 외화 강세 → 달러당 외화 수 감소(Decrease)\n\n핵심 원리:\nAR + Gain = 외화 강세 (받을 돈 가치 상승)\nAP + Loss = 외화 강세 (줄 돈 부담 증가)\n→ 포지션(AR/AP)이 반대라 같은 환율 변동에 손익이 반대로 나옴\n→ 손익(Gain/Loss)이 반대로 주어지면 환율 방향은 같음",
    trigger: "'units of foreign currency per dollar' → 달러당 외화 단위수 표시 방식 확정 AR + Gain → 외화 강세 → Decrease AP + Loss → 외화 강세 → Decrease (Loss 자체가 이미 AP 반대 포지션 반영) Gain/Loss → 역산: 어떤 환율 변동이 이 결과를 만들었나",
    trap: "AP + Loss 보고 '반대니까 Increase' → 오답. Loss 자체가 이미 AP 포지션의 반대를 반영. 환율 방향 역산 시 AR/AP 구분 다시 적용 불필요 AR + Gain → Increase 착각 → Gain = 외화 강세 = 달러당 외화 수 감소 = Decrease 환율 표시 방식 혼동: '달러당 외화' vs '외화당 달러' 반대로 읽으면 방향 반전",
    one_sentence: "Gain/Loss → 외화 강세/약세 역산 → 달러당 외화 수 방향 / AR·AP 구분은 손익에 이미 반영됨.",
    speed: "① Gain → 외화 강세 → Decrease / Loss → 외화 강세 → Decrease ② AR/AP 다시 고려 불필요 — 손익이 이미 반영",
    context_background: "[AR vs AP 포지션 원리]\nAR(받을 돈): 외화 강세 → 더 많은 달러 수취 → Gain\nAP(줄 돈): 외화 강세 → 더 많은 달러 지급 → Loss\n→ 같은 '외화 강세'에 AR은 Gain, AP는 Loss로 반대 결과.\n\n[역산 논리]\n이 문제처럼 Gain/Loss가 주어지고 환율 방향을 물으면:\nGain → '이 결과가 나오려면 외화 강세였어야 함' → Decrease\nLoss → '이 결과가 나오려면 외화 강세였어야 함' → Decrease\n\n[함정 패턴]\nAP + Loss 보고 'AP니까 반대로 Increase'로 착각.\nLoss라는 결과 자체가 이미 AP 포지션을 반영한 것.\n환율 방향 역산 단계에서 AR/AP를 다시 고려하면 이중 반영 오류.\n\n[달러당 외화 단위수 표시 방식]\n$1 = 130엔 → 130이 작아지면(120) → 엔화 강세 → 달러당 엔 수 Decrease\n$1 = 1.1유로 → 0.9로 작아지면 → 유로 강세 → 달러당 유로 수 Decrease",
  },

  // [FC_012] Foreign Currency Transaction — Gain/Loss by Settlement Currency
  // RULE    : 결제통화 = 외화인 쪽이 리스크 / USD강세 → 달러사용자 gain / 자기통화 결제 → 무관
  // TRIGGER : "settled in [외화]" → 달러사용자 리스크 / "USD appreciates" → gain
  // TRAP    : 강세/약세 방향 혼동 / 자기통화 수령자에게 gain 배정
  {
    topic_id: "FC_012",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "FX transaction gain/loss — who bears risk depends on settlement currency",
    rule: "결제 통화 = 외화인 쪽 → 환율 리스크 부담\n결제 통화 = 자기 통화인 쪽 → gain/loss 없음\n\n유로 결제 시:\nCedar(달러) → 달러→유로 환전 필요 → 리스크 부담\nMilano(유로) → 항상 유로 수령 → 무관\n\nUSD 강세 → 같은 외화 더 적은 달러로 구입 → Cedar gain\nUSD 약세 → 같은 외화 더 많은 달러 필요 → Cedar loss",
    trigger: '"settled in [외화]" → 달러 사용자가 환율 리스크 부담\n"USD appreciates vs [외화]" → 달러 사용자 gain\n"USD depreciates vs [외화]" → 달러 사용자 loss\n결제 통화 = 자기 통화 → gain/loss 없음',
    trap: "USD 강세 = 외화 약세 방향 혼동 → USD 강세면 외화 싸게 삼 → 달러 사용자 gain.\n자기 통화 수령자(Milano)에게 gain/loss 배정 → 유로 수령자는 환율 무관.\nUSD 강세 시 수출자(Milano)에게 gain → 오답.",
    one_sentence: "결제통화 외화 → 달러사용자 리스크 | USD강세 → gain | USD약세 → loss",
    speed: "결제통화 유로 → Cedar 리스크 | USD강세 → Cedar gain → A",
    example: "유로 결제, Cedar(USD), Milano(EUR)\nUSD 강세: $1 = €1.2 → $1 = €1.3 (달러 강해짐)\n→ 같은 €1,000을 더 적은 달러로 구입 가능\n→ Cedar gain\n\nUSD 약세: $1 = €1.2 → $1 = €1.1\n→ 같은 €1,000에 더 많은 달러 필요\n→ Cedar loss",
    context_background: "[결제 통화 = 리스크 배분 기준]\n외화로 결제해야 하는 쪽 = 환전 필요 = 환율 변동 리스크 부담\n자기 통화로 받는 쪽 = 환전 불필요 = 리스크 없음\n\n[결제 통화 변경 시 리스크 이전]\n유로 결제 → Cedar 리스크\n달러 결제 → Milano 리스크\n→ 결제 통화 협상이 곧 리스크 배분 협상\n\n[USD 강세/약세 직관]\nUSD 강세 = 달러의 구매력 증가 = 외화 싸게 살 수 있음\n→ 외화 구매자(달러 사용자) gain\nUSD 약세 = 달러의 구매력 감소 = 외화 비싸게 사야 함\n→ 외화 구매자(달러 사용자) loss",
  },

  // [FC_017] Foreign Currency AR — Initial Recognition at Spot Rate on Transaction Date
  // RULE    : AR 최초 인식 = 거래일 spot rate × 외화금액 / Forward rate 사용 금지 / 결제일 rate도 아님
  // TRIGGER : "sold on [date]" + spot rate 두 개 제공 → 거래일 spot rate만 사용
  // TRAP    : Forward rate 사용 / 결제일 spot rate 사용 / 환율 미적용 액면 외화금액 그대로 사용
  {
    topic_id: "FC_017",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Foreign currency AR initial recognition — transaction date spot rate only, never forward rate",
    rule: "AR 최초 인식 = 거래일 spot rate × 외화금액\n\n✅ 사용:\n- Transaction date spot rate (거래일 현물환율)\n\n❌ 사용 금지:\n- Forward rate (선물환율) → 헷지 계약용, AR 인식과 무관\n- Settlement date spot rate → 결제 시 FX gain/loss 계산에 사용\n- 외화 액면금액 그대로 → 환율 미적용\n\n[3시점 처리]\n① Transaction date: AR = FC × spot rate (거래일)\n② B/S date: AR remeasure at current spot rate → FX G/L\n③ Settlement date: Cash = FC × spot rate (결제일) / AR 제거 → FX G/L",
    trigger: "'sold and delivered on [date]' → 거래일 spot rate으로 AR 인식\n'spot rate' 두 개 제공 → 거래일 것만 사용 (결제일 spot rate = 트랩)\n'30-day forward rate' 제공 → 무시, AR 인식에 사용 금지\n'what amount should be recorded as AR' → transaction date spot rate × FC amount",
    trap: "A: forward rate 사용 → AR 인식에 절대 사용 금지\nB: settlement date spot rate 사용 → 결제 시 FX G/L 계산용\nC: 환율 미적용, 외화 액면금액 그대로 → 달러 환산 누락\n핵심: spot rate 두 개 중 거래일 것만 / forward rate은 항상 무시",
    one_sentence: "AR initial recognition = transaction date spot rate × FC amount / forward rate 절대 금지.",
    speed: "AR 인식일 spot rate × FC amount → 끝 / forward rate 보이면 즉시 무시",
    example: "June 19 sold 200,000 euros\nSpot rate June 19: $0.988 / July 19: $0.995\nForward rate: $0.990\n→ AR = 200,000 × $0.988 = $197,600 (June 19 spot rate만 사용)\n→ FX Gain on July 19: 200,000 × ($0.995 − $0.988) = $1,400",
    context_background: "[왜 거래일 spot rate인가]\nAR은 그 날 발생한 채권. 그 날 실제 시장에서 거래 가능한 환율(spot rate)로 환산.\nForward rate은 미래 특정일에 거래하기로 약속한 환율 → 오늘 AR 가치와 무관.\n\n[Forward rate vs Spot rate]\nSpot rate: 오늘 즉시 환전 시 환율 → AR/AP 인식·재측정에 사용\nForward rate: 미래 특정일 환전 약속 환율 → 헷지(hedge) 계약에만 사용\n\n[3시점 환율 요약]\n거래일: spot rate → AR 최초 인식\nB/S일: current spot rate → 재측정 → FX G/L\n결제일: spot rate → Cash 인식 / AR 제거 → FX G/L",
  },

  // [FC_018] FX Gain/Loss Matrix — AR/AP × FC Appreciate/Depreciate
  // RULE    : AR + FC 강세 = Gain / AR + FC 약세 = Loss / AP는 반대
  // TRIGGER : AR/AP 보유 + 환율 변동 → 4가지 조합으로 즉시 판단
  // TRAP    : 직접법(FC per $) 숫자 방향 반직관 / 간접법($ per FC) 방향 혼동
  {
    topic_id: "FC_018",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'conditional',
    card_name: "FX gain/loss matrix — AR/AP × FC appreciate/depreciate: 4-case decision grid",
    rule: "【AR/AP × 환율 변동 4가지 조합】\n\nAR (외화 받을 예정):\n  FC appreciate (달러 약세) → 받을 외화 가치↑ → FX Gain\n  FC depreciate (달러 강세) → 받을 외화 가치↓ → FX Loss\n\nAP (외화 줄 예정):\n  FC appreciate (달러 약세) → 줄 외화 가치↑ → FX Loss\n  FC depreciate (달러 강세) → 줄 외화 가치↓ → FX Gain\n\n【직관】\nAR: 받는 입장 → FC 강세 = 더 많이 받음 = Gain\nAP: 주는 입장 → FC 강세 = 더 많이 줘야 함 = Loss\n\n【직접법 / 간접법 대응】\n직접법 (FC per $1): 숫자↓ = FC 강세 (반직관 주의!)\n간접법 ($ per 1FC): 숫자↑ = FC 강세 (직관과 일치)\n→ 같은 현상, 표현 방향만 반대",
    trigger: "'accounts receivable' + 환율 변동 → AR + FC 방향 매칭\n'accounts payable' + 환율 변동 → AP + FC 방향 매칭\n'units of FC per dollar' 숫자↓ → FC 강세 (직접법 트랩)\n'dollars per FC' 숫자↑ → FC 강세 (간접법, 직관 일치)\n달러 강세 = FC 약세 = AR Loss / AP Gain",
    trap: "직접법 함정: 'FC per $' 숫자 증가 = FC 약세 (직관과 반대)\n→ 숫자가 커지면 $1로 더 많은 FC → 달러 강세 → FC 약세\n간접법 혼동: '$ per FC' 숫자 감소 = FC 약세\nAR/AP 방향 혼동: AR = 받는 입장 / AP = 주는 입장 항상 구분\n'달러 강세 = Gain' 과잉 일반화 → AR이면 Loss, AP이면 Gain",
    one_sentence: "AR: FC 강세 = Gain / FC 약세 = Loss / AP: 완전 반대 / 직접법 숫자↓ = FC 강세 (반직관).",
    speed: "AR → FC 강세(dollar 약세) = Gain / AP → FC 강세 = Loss\n직접법 숫자↓ = FC 강세 / 간접법 숫자↑ = FC 강세",
    example: "AR 보유, $1 = 80엔 → $1 = 78엔 (엔 강세, FC appreciate)\n→ 받을 800,000엔의 달러 가치↑ → FX Gain\n\nAP 보유, $1 = 80엔 → $1 = 82엔 (엔 약세, FC depreciate)\n→ 줄 800,000엔의 달러 비용↓ → FX Gain\n\nJE (AR + FC 강세):\nDr. Cash (new rate)         $10,256\n    Cr. AR (original rate)           $10,000\n    Cr. FX Gain                           $256",
    context_background: "[AR vs AP 직관]\nAR = 외화 받을 예정 = 외화 가치 오를수록 유리\nAP = 외화 줄 예정 = 외화 가치 내릴수록 유리\n→ 같은 FC 강세에 AR은 Gain, AP는 Loss\n\n[직접법 트랩 심화]\n직접법: $1 = X FC (달러 기준)\n$1 = 80엔 → $1 = 78엔: 숫자↓ = 달러로 살 수 있는 엔↓ = 달러 약세 = 엔 강세\n→ 숫자가 줄었는데 FC가 강해짐 → 반직관\n\n[간접법이 더 직관적]\n간접법: 1FC = $Y (외화 기준)\n1엔 = $0.0125 → 1엔 = $0.0128: 숫자↑ = 엔의 달러 가치↑ = 엔 강세\n→ 숫자 올라가면 FC 강세 → 직관과 일치",
  },

  // [FC_015] Foreign Currency AP — Remeasurement at Settlement Date
  // RULE    : 외화 AP 결제일 분개 = 재측정(FX Loss/Gain) + 실제 지급(Cash) 합산
  // TRIGGER : "purchased on account" + FCU + 두 개의 환율 + 결제일
  // TRAP    : 환율 상승 = AP Gain 착각 / Cash $850(원래 금액) / 재측정 누락
  {
    topic_id: "FC_015",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Foreign currency AP — remeasurement and settlement journal entry",
    rule: "외화 AP 결제일 분개 2단계:\n① 재측정: (결제일 환율 − 구매일 환율) × 외화금액\n   환율 상승 → AP 증가 → FX Loss (Dr. FX gains and losses / Cr. AP)\n   환율 하락 → AP 감소 → FX Gain (Dr. AP / Cr. FX gains and losses)\n② 실제 결제: Dr. AP(원래 잔액) + Dr. FX Loss(있으면) / Cr. Cash(결제일 환율 × 외화금액)\n발생주의: 결제 전이라도 환율 변동 시 즉시 손익 인식",
    trigger: "'purchased on account' + FCU/외화금액 + 구매일 환율 + 결제일 환율 → 재측정 모드 'to be paid on [결제일]' → 미결제 기간 환율 변동 → FX 손익 발생 결제일 환율 > 구매일 환율 → AP 증가 → Loss / 반대 → Gain",
    trap: "환율 상승 → AP Gain 착각 — AP(갚아야 할 돈)가 늘어난 거라 Loss Cash $850(구매일 금액) — 실제 지급은 결제일 환율 기준 $900 재측정 분개 누락 — 발생주의상 환율 변동 즉시 인식 필수 B선지(Cr. FX gains and losses $50) — 방향 반대, 환율 상승은 Gain 아닌 Loss",
    one_sentence: "외화 AP + 환율 상승 → FX Loss: Dr. FX gains and losses / Cr. AP / 결제 시 Cash = 결제일 환율 × 외화금액.",
    example: "구매일 $0.85 → 결제일 $0.90 / 1,000 FCU 재측정: ($0.90−$0.85)×1,000 = $50 Loss Dr. FX gains and losses $50 / Cr. AP $50 결제: Dr. AP $850 + Dr. FX Loss $50 / Cr. Cash $900",
    speed: "① (결제일율 − 구매일율) × FCU = 재측정액 ② 환율 상승 + AP → Loss(Dr. FX / Cr. AP) ③ Cash = 결제일율 × FCU",
    context_background: "[발생주의 적용]\n외화 AP는 결제 전이라도 환율이 바뀌면 그 변동분을 즉시 손익으로 인식.\n현금이 아직 안 나갔어도 경제적 손실(더 많은 달러를 줘야 함)이 발생했으므로 Loss 인식.\n\n[AP vs AR 방향 직관]\nAP(갚아야 할 돈): 환율 상승 → 더 많은 달러 필요 → Loss\nAP(갚아야 할 돈): 환율 하락 → 더 적은 달러 필요 → Gain\nAR(받을 돈): 환율 상승 → 더 많은 달러 수취 → Gain\nAR(받을 돈): 환율 하락 → 더 적은 달러 수취 → Loss\n\n[분개 구조]\n재측정 분개(결제일): Dr. FX gains and losses $50 / Cr. AP $50\n결제 분개: Dr. AP $850 / Cr. Cash $900 (+ Dr. FX Loss $50 통합 가능)\n→ 통합 시: Dr. AP $850 + Dr. FX Loss $50 / Cr. Cash $900",
  },

  // [FC_009] Foreign currency AP remeasurement — year-end gain when foreign currency weakens
  // RULE    : AP 외화 약세 → 달러 환산 부채 감소 → Gain / C$ face × Δrate = G/L
  // TRIGGER : AP + 환율 하락(US$/외화 감소) → Dr.AP / Cr.FX Gain
  // TRAP    : 환율 하락을 Loss로 착각(A) / AP 장부금액 기준 계산(D)
  {
    topic_id: "FC_009",
    book_id: 'GN',
    chapter_id: 'GN_CH7',
    topic_group: 'GN_CH7_FC',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'calculation',
    card_name: "Foreign currency AP remeasurement — year-end gain when foreign currency weakens",
    rule: "외화 AP 연말 재평가:\n① 외화 face amount × 연말 환율 = 연말 달러 환산액\n② 연말 − 기초 = 증감 → 증가면 Loss / 감소면 Gain\n③ JE: Dr.AP(감소분) / Cr.FX Transaction Gain → Net Income\n\n방향 암기:\nAP 보유 + 외화 약세(환율↓) → 갚을 달러 감소 → Gain\nAP 보유 + 외화 강세(환율↑) → 갚을 달러 증가 → Loss\nAR 보유 + 외화 약세(환율↓) → 받을 달러 감소 → Loss\nAR 보유 + 외화 강세(환율↑) → 받을 달러 증가 → Gain",
    trigger: "외화 AP + '환율 하락(US$/외화↓)' → Dr.AP / Cr.FX Transaction Gain\n계산 기준: C$ face amount × (구 환율 − 신 환율)\n'December 31' + 미결제 외화 payable → 연말 재평가 필수\nFX Transaction G/L → Net Income (OCI 아님)",
    trap: "A(Loss): 환율↓ = 외화 약세 = AP 감소 = Gain. 방향 반대\nD($11,250): AP 장부금액($270,000) × 뭔가 → C$ face $300,000 × Δrate 기준 사용 필수\nB(No entry): 외화 monetary item은 연말 반드시 재평가\n공통 함정: 환율이 내려가면 손해라는 직관 → AP 보유자는 반대(외화 약세 = 유리)",
    one_sentence: "AP + 외화 약세 → 갚을 달러 감소 → FX Transaction Gain; C$ face × Δrate로 계산.",
    speed: "① Oct 31: C$300,000 × $0.90 = $270,000\n② Dec 31: C$300,000 × $0.85 = $255,000\n③ 감소 $15,000 → Gain\n④ Dr.AP $15,000 / Cr.FX Gain $15,000\n→ 정답 C",
    context_background: "[왜 AP 보유자는 외화 약세가 유리한가]\n미국 회사가 캐나다 공급사에 C$300,000을 갚아야 하는 상황. 환율이 $0.90 → $0.85로 떨어지면, 같은 C$300,000을 구하는 데 달러가 덜 필요해진다. 즉 부채의 실질 부담이 줄어든 것 → Gain.\n\n반대로 AR 보유자(예: 수출업자)는 외화 약세가 불리하다. 받아야 할 C$300,000의 달러 환산액이 줄어들기 때문.\n\n[계산 기준: C$ face amount]\n반드시 외화 원금(C$300,000) × 환율 변동분으로 계산해야 한다.\n장부상 달러 금액($270,000)을 기준으로 재계산하면 오류.\nC$300,000 × ($0.90 − $0.85) = $15,000 Gain\n\n[FX Transaction G/L → Net Income]\n외화 AP/AR 재평가 손익은 Transaction G/L → Net Income 직행.\nOCI(CTA)는 외국 자회사 재무제표 환산(Translation)에서만 발생.\n\n[Jan 31 Y2 결제 시]\nC$300,000 × $0.93 = $279,000\nDec 31 AP 잔액 $255,000 vs 실제 지급 $279,000 → Loss $24,000 추가 인식",
  },

  // ── GOV ────────────────────────────────────────────────────────────────────
  {
    topic_id: "GOV_001",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Government funds — which basis of accounting",
    rule: "【펀드 유형별 회계 기준】\n\nGovernmental funds (GRaSPP) → Modified accrual\nG: General fund\nR: Special Revenue fund\na: (connector)\nS: Debt Service fund\nP: Permanent fund\nP: Capital Projects fund\n\nProprietary funds (SE) → Full accrual\nS: Internal Service fund\nE: Enterprise fund\n\nFiduciary funds (CIPPE) → Full accrual\nC: Custodial fund\nI: Investment trust fund\nP: Pension fund\nP: Private purpose trust fund\nE: Employee benefit fund\n\n→ Modified accrual = GRaSPP만 / 나머지 전부 Full accrual",
    trigger: '"same basis of accounting as [fund]" → 해당 fund 유형 파악 → 같은 유형 찾기\nGRaSPP 소속 fund → Modified accrual\nSE / CIPPE 소속 fund → Full accrual\n"internal service" → Proprietary(SE) → Full accrual (함정 주의)',
    trap: "Internal service fund → 'service'라는 단어 때문에 Governmental로 착각 → Proprietary(SE) → Full accrual\nEnterprise fund → Proprietary → Full accrual\nInvestment/Pension trust → Fiduciary → Full accrual\nModified accrual = GRaSPP만, 나머지는 모두 Full accrual",
    one_sentence: "Governmental funds = modified accrual; proprietary funds = full accrual.",
    example: "General Fund → GRaSPP → Modified accrual\nDebt Service Fund → GRaSPP → Modified accrual\nSpecial Revenue Fund → GRaSPP → Modified accrual\nEnterprise Fund → SE → Full accrual\nInternal Service Fund → SE → Full accrual\nPension Trust Fund → CIPPE → Full accrual",
    speed: "GRaSPP = Modified accrual | SE + CIPPE = Full accrual\n→ 같은 그룹 찾기",
  },
  {
    topic_id: "GOV_002",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Governmental vs proprietary funds — difference",
    rule: "Governmental funds: modified accrual + current financial resources focus. Proprietary funds: full accrual + economic resources focus.",
    trigger: "governmental fund | measurement focus | primary focus | current financial resources | modified accrual\nproprietary fund → economic resources (반대 방향 확인용)\n'budgetary accounts' → governmental funds only → proprietary funds에는 없음\n'internal service fund' + 'budgetary' → NOT a characteristic",
    trap: "TRAP 1: Cash flows and balances → Proprietary fund 측정 초점. Governmental fund는 current financial resources(단기 수취채권 포함) 대상\nTRAP 2: Capital maintenance → Proprietary fund. 기업처럼 자본 유지 여부 측정\nTRAP 3: Income determination → Proprietary fund. 순이익 계산은 기업형 펀드 목적\nTRAP 4: 'Budgetary accounts in internal service fund' → 함정 — Proprietary funds는 예산 계정 사용 안 함\n공통: Proprietary fund 특성(accrual / economic resources / fixed assets on B/S)은 오답",
    one_sentence: "Governmental fund = Current financial resources focus (modified accrual); Proprietary fund = Economic resources focus (full accrual).",
    example: "General Fund B/S: Cash + Tax Receivable + Due from Other Funds (장기 자산·부채 없음) / Enterprise Fund: 장기 자산·감가상각·장기 부채 모두 포함",
  },
  {
    topic_id: "GOV_003",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "General fund — what goes in here",
    rule: "The General Fund accounts for all financial resources not required to be reported in another fund. It is the primary operating fund. Only one General Fund per government.",
    trigger: "general fund | operating fund | primary fund | catch-all",
    trap: "Only one General Fund is allowed per government.",
    one_sentence: "The General Fund is the catch-all operating fund for all activities not in a specialized fund.",
    example: "City's general tax revenue and routine expenditures → General Fund; road construction bond → Capital Projects Fund",
  },
  {
    topic_id: "GOV_004",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Capital projects fund — when to use",
    rule: "Capital Projects Fund accounts for resources for major capital facility acquisition or construction. Bond proceeds for construction go here.",
    trigger: "capital projects | construction | major facilities | bond proceeds | infrastructure",
    trap: "Bond proceeds for capital projects go into Capital Projects Fund — not the General Fund.",
    one_sentence: "Capital Projects Fund holds resources for building or acquiring major capital facilities.",
    example: "$5M bond issued for new city hall → record proceeds in Capital Projects Fund",
  },
  {
    topic_id: "GOV_005",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Debt service fund — when to use",
    rule: "Debt Service Fund accumulates resources for payment of general long-term debt principal and interest.",
    trigger: "debt service | principal payment | interest payment | bond repayment | general long-term debt",
    trap: "The fund holds resources to pay debt — the debt itself is in government-wide statements, not this fund.",
    one_sentence: "Debt Service Fund accumulates resources to repay general long-term debt.",
    example: "Annual tax levy set aside for bond repayment → Debt Service Fund",
  },
  {
    topic_id: "GOV_006",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Enterprise fund — when to use",
    rule: "Enterprise Fund (proprietary) accounts for activities that charge fees to external users to cover costs — utilities, airports, toll roads.",
    trigger: "enterprise fund | fee for service | utility | user charges | proprietary fund",
    trap: "If the activity primarily serves other government departments, use Internal Service Fund instead.",
    one_sentence: "Enterprise Fund = government services that charge fees to outside users.",
    example: "City water utility billing residents → Enterprise Fund; motor pool serving city depts → Internal Service Fund",
  },
  {
    topic_id: "GOV_007",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Modified accrual — revenue recognition rule",
    rule: "Revenue recognized when measurable AND available. Available = collectible within the current period or soon enough after year-end to pay current liabilities (generally 60 days).",
    trigger: "modified accrual | revenue | measurable | available | 60 days | property tax",
    trap: "Must be both measurable AND available — not just one of them.",
    one_sentence: "Modified accrual revenue: must be measurable AND available (collectible within ~60 days of year-end).",
    example: "Property tax levy $1,000,000 / $900,000 collectible within 60 days → recognize $900,000; defer $100,000",
  },
  {
    topic_id: "GOV_008",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Modified accrual — expenditure recognition rule",
    rule: "Expenditures recognized when a current fund liability is incurred. No depreciation on capital assets in governmental funds.",
    trigger: "modified accrual | expenditure | liability incurred | current resources | depreciation",
    trap: "Governmental funds use 'expenditures,' not 'expenses.' No long-term asset depreciation is recorded.",
    one_sentence: "Governmental fund expenditures are recognized when the current-period liability is incurred.",
    example: "Supplies received in December → Expenditure recognized in December; no depreciation on equipment",
  },
  {
    topic_id: "GOV_009",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Encumbrance — what it is and when to record",
    rule: "Record an encumbrance when a purchase order is issued to reserve budget authority. Reverse when goods arrive and record the actual expenditure.",
    trigger: "encumbrance | purchase order | reserve | commitment | budget authority",
    trap: "Encumbrances are not expenditures — they are placeholders to prevent budget over-spending.",
    one_sentence: "Encumbrance: record at PO issuance to reserve budget; reverse and record actual when goods received.",
    example: "PO issued $10,000 → Dr. Encumbrances $10,000; on receipt → reverse encumbrance, record actual expenditure",
  },
  {
    topic_id: "GOV_010",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Budget entry — how to record at start of year",
    rule: "At year-start: Dr. Estimated Revenues, Cr. Appropriations, plug with Budgetary Fund Balance. Surplus budget → credit BFB; deficit budget → debit BFB. Reverse at year-end.",
    trigger: "budget entry | estimated revenues | appropriations | budgetary | year-start",
    trap: "Budget entries are unique to governmental funds and are reversed at year-end.",
    one_sentence: "The budget is formally journalized at year-start and reversed at year-end.",
    example: "Est. revenues $5M / Appropriations $4.8M → Dr. Est. Rev. $5M, Cr. Appropriations $4.8M, Cr. BFB $200K",
  },
  {
    topic_id: "GOV_011",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Government-wide statements vs fund statements",
    rule: "Government-wide: full accrual, include capital assets and long-term liabilities, aggregate by governmental and business-type activities. Fund statements: detail by individual fund with varied accounting basis.",
    trigger: "government-wide | fund statements | statement of net position | CAFR | aggregate",
    trap: "Government-wide statements do NOT show individual funds — they aggregate all governmental activities.",
    one_sentence: "Government-wide = full accrual big picture; fund statements = detail by fund type.",
    example: "Government-wide Statement of Net Position includes capital assets; General Fund Balance Sheet excludes them",
  },
  {
    topic_id: "GOV_012",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Reconciliation — why fund balance differs from net position",
    rule: "Differences arise from: (1) governmental funds exclude capital assets and long-term liabilities; (2) modified accrual defers items recognized under full accrual; (3) Internal Service Fund net assets may be added.",
    trigger: "reconciliation | fund balance | net position | difference | explain",
    trap: "Reconciliation is required — it explains every systematic difference between fund and government-wide statements.",
    one_sentence: "Capital assets + long-term liabilities + accrual timing differences explain the gap between fund balance and net position.",
    example: "Add capital assets $5M / deduct long-term debt $3M / adjust deferred revenue → reconcile to net position",
  },
  {
    topic_id: "GOV_013",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Infrastructure assets — modified approach",
    rule: "Governments may use the modified approach for infrastructure: maintain at a prescribed condition level, expense all maintenance as incurred, no depreciation recorded.",
    trigger: "infrastructure | modified approach | roads | bridges | condition level | no depreciation",
    trap: "Under the modified approach, no depreciation is recorded — only maintenance expenditures.",
    one_sentence: "Modified approach for infrastructure = maintain at condition level + expense maintenance; skip depreciation.",
    example: "Highway system at 70+ condition index → no depreciation; $2M annual maintenance → expense",
  },
  {
    topic_id: "GOV_014",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Special revenue fund — when to use",
    rule: "Special Revenue Fund accounts for proceeds from specific revenue sources restricted or committed to specific purposes other than capital projects or debt service.",
    trigger: "special revenue | restricted grant | specific purpose | dedicated tax | earmarked",
    trap: "Cannot use for capital construction (Capital Projects) or debt repayment (Debt Service).",
    one_sentence: "Special Revenue Fund holds dedicated revenue restricted for specific operating purposes.",
    example: "State gas tax earmarked for road maintenance → Special Revenue Fund",
  },
  {
    topic_id: "GOV_015",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Permanent fund — when to use",
    rule: "Permanent Fund accounts for resources legally restricted so that only earnings (not principal) may be used to support government programs.",
    trigger: "permanent fund | principal restricted | earnings only | endowment | government",
    trap: "The principal cannot be spent — only investment earnings flow out.",
    one_sentence: "Permanent Fund: preserve the principal; spend only the investment income.",
    example: "$2M donated with only interest to be used for library programs → Permanent Fund",
  },

  // ── BOND ───────────────────────────────────────────────────────────────────
  {
    topic_id: "BOND_001",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond issued at discount — carrying value over time",
    rule: "Discount bond carrying value starts below face value and increases each period as the discount is amortized, reaching face value at maturity.",
    trigger: "bond discount | issued below par | carrying value | amortize discount",
    trap: "Amortizing a discount increases carrying value AND increases interest expense above the coupon payment.",
    one_sentence: "Discount bonds: carrying value rises each period until it equals face value at maturity.",
    example: "Face $100,000 / issued $95,000 / 5-yr → CV increases $1,000/yr → $100,000 at maturity",
  },
  {
    topic_id: "BOND_PREM_001",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond issued at premium — carrying value over time",
    rule: "Premium bond carrying value starts above face value and decreases each period as the premium is amortized, reaching face value at maturity.",
    trigger: "bond premium | issued above par | carrying value | amortize premium",
    trap: "Amortizing a premium decreases carrying value AND decreases interest expense below the coupon payment.",
    one_sentence: "Premium bonds: carrying value falls each period until it equals face value at maturity.",
    example: "Face $100,000 / issued $104,000 / 5-yr → CV decreases $800/yr → $100,000 at maturity",
  },
  {
    topic_id: "BOND_010",
    sub_category_id: "U4_BONDS",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    card_type: 'calculation',
    card_name: "Discount vs Premium — Effective vs SL direction comparison",
    rule: "Under Effective method, I/Exp moves with BV (Discount→↑, Premium→↓). Under SL, I/Exp and Dis.A are constant. I/Rate under SL moves inversely to BV (Discount→↓, Premium→↑) because I/Exp is fixed but BV changes.",
    trigger: "discount | premium | effective interest | straight-line | carrying value | amortization direction",
    trap: "I/Rate is constant only under Effective method — not SL. Under SL, I/Rate decreases for discount bonds (BV rising, I/Exp fixed) and increases for premium bonds (BV falling, I/Exp fixed).",
    one_sentence: "Effective: I/Exp moves with BV. SL: I/Exp fixed, so I/Rate moves inversely with BV.",
    speed: "                Discount          Premium\n             Effective   SL    Effective   SL\nBV              ↑        ↑        ↓        ↓\nDis.A           ↑        C        ↑        C\nI/Exp           ↑        C        ↓        C\nI/Rate          C        ↓        C        ↑\nCoupon          C        C        C        C\n\nI/Rate SL 논리: I/Rate = I/Exp ÷ BV\n  SL Discount → C ÷ ↑BV = ↓\n  SL Premium  → C ÷ ↓BV = ↑",
  },
  {
    topic_id: "BOND_003",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond interest expense — effective interest method",
    rule: "Interest Expense = beginning carrying value × effective (market) rate. Cash paid = face value × coupon rate. Discount amortization = Interest Expense − Cash paid. Premium amortization = Cash paid − Interest Expense.",
    trigger: "effective interest | bond interest expense | carrying value | market rate | coupon rate",
    trap: "Use carrying value × market rate for interest expense — not face value × coupon rate.",
    one_sentence: "Bond interest expense = beginning carrying value × market rate; coupon cash uses face × coupon rate.",
    example: "CV $95,000 × 8% = $7,600 interest expense / coupon $100,000 × 7% = $7,000 cash → $600 discount amortized",
  },
  {
    topic_id: "BOND_004",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond retirement before maturity — gain or loss",
    rule: "Loss on extinguishment = Reacquisition Price − Net Carrying Value\n\n【Net Carrying Value 계산】\nNet CV = Face retired − pro rata unamortized discount − pro rata unamortized issuance cost\n         + pro rata unamortized premium\n→ 'issued at par' → discount/premium 없음 → issuance cost만 차감\n\n【Pro rata 기준】\n비율 = face retired ÷ total face (기간 비율 아닌 금액 비율)\n\n【Reacquisition Price】\n= Cash paid = Face retired + call premium\n\n【손익 처리】\nGain/Loss 모두 Net Income (I/S) 반영, OCI 아님",
    trigger: "early retirement | bond repurchase | extinguishment | gain on retirement | loss on retirement\n'retired $X of $Y bonds' → pro rata 비율 = $X ÷ $Y (금액 기준)\n'issued at par' → discount/premium 없음 → issuance cost만 pro rata 차감\n'unamortized issuance costs' → Net CV에서 pro rata 차감\n'call premium' → Reacquisition Price에 가산",
    trap: "함정 ①: 'issued at par' 무시하고 discount 계산 → par 발행 = discount/premium 없음\n함정 ②: pro rata를 기간 비율로 계산 → 반드시 금액 기준 (face retired ÷ total face)\n함정 ③: call premium만 loss 인식 → issuance cost pro rata분도 포함\n함정 ④: issuance cost 전액 차감 → 일부 상환 시 반드시 pro rata 적용\n함정 ⑤: G/L을 OCI로 처리 → 반드시 Net Income",
    one_sentence: "Early bond retirement G/L = carrying value minus retirement price; flows through net income.",
    example: "Cedar Corp: total face $6,000,000 / issuance cost $360,000 / retired $3,000,000 at par + $75,000 call premium\n→ 비율 = $3M ÷ $6M = 50%\n→ Net CV = $3,000,000 − ($360,000 × 50%) = $2,820,000\n→ Reacquisition = $3,000,000 + $75,000 = $3,075,000\n→ Loss = $3,075,000 − $2,820,000 = $255,000",
    speed: "① 비율 = face retired ÷ total face\n② Net CV = Face − issuance cost × 비율 (par 발행 시)\n③ Reacquisition = Face + call premium\n④ Loss = ③ − ②",
  },
  {
    topic_id: "BOND_005",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Debt issuance costs — where does it go",
    rule: "Debt issuance costs are a direct deduction from the face value of the debt (contra-liability), not a separate asset. Amortized over the debt's life using the effective interest method.",
    trigger: "debt issuance costs | underwriter fees | bond issue costs | contra-liability",
    trap: "Old rule was an asset; current rule is a contra-liability — deduction from the debt on the balance sheet.",
    one_sentence: "Debt issuance costs reduce the carrying value of the debt; they are not a separate asset.",
    example: "Bond face $1,000,000 / issuance costs $20,000 → present bond at $980,000 net on balance sheet",
  },
  {
    topic_id: "BOND_006",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Convertible bond — how to record at issuance",
    rule: "US GAAP: record entire proceeds as liability (no equity split). IFRS: bifurcate into debt component (at PV) and equity component (residual).",
    trigger: "convertible bond | issuance | equity component | debt component | bifurcate",
    trap: "US GAAP does NOT split convertible bonds at issuance; IFRS does.",
    one_sentence: "US GAAP: full convertible bond proceeds → liability; IFRS: split into liability and equity.",
    example: "US GAAP: $500,000 convertible bond → Cr. Bonds Payable $500,000 (no equity component)",
  },
  {
    topic_id: "BOND_007",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_TROUBLED_DEBT",
    card_type: 'concept',
    card_name: "Troubled debt restructuring — how to measure gain",
    rule: "If total future cash flows under new terms < carrying value → immediate gain = CV − total undiscounted future cash flows; new carrying value = total future cash flows; no interest expense going forward. If total future flows ≥ CV → no gain (reduce effective rate only).",
    trigger: "troubled debt restructuring | TDR | creditor | modification | restructure | gain",
    trap: "If total future cash flows exceed CV, no gain is recognized — just a lower interest rate going forward.",
    one_sentence: "TDR gain = carrying value minus total undiscounted future payments (only when future flows are less than CV).",
    example: "CV $100,000 / new total future payments $85,000 → Gain $15,000; new BV = $85,000; no interest after",
  },

  // [BOND_008] Bond Extinguishment — Discount Bond Redeemed at Premium: Loss Components
  // RULE    : CV = Par − Unamortized Discount − Unamortized Issuance Costs / Loss = Reacquisition Price − CV
  // TRIGGER : "discount bond redeemed at premium" → Loss 구조 / "bond payable debited" → par value 고정
  // TRAP    : D함정: Bond Payable을 premium price로 차변 처리 오답 / A함정: Gain→OCI 오답 / C함정: Discount↑→Loss↓ 오답
  {
    topic_id: "BOND_008",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_name: "Bond Extinguishment — Discount Bond Redeemed at Premium: Loss Components",
    rule: "CV = Par − Unamortized Discount − Unamortized Issuance Costs. Loss = Reacquisition Price − CV. JE: Dr.Bond Payable(par) + Dr.Loss / Cr.Cash(상환가격) + Cr.Unamortized Discount + Cr.Unamortized Issuance Costs. Bond Payable 차변은 항상 par value 고정 — 상환가격 아님. Gain/Loss 모두 I/S(NI), OCI 불가.",
    trigger: "'discount bond' + 'redeemed at premium/above par' → Loss = Reacquisition Price − CV\n'unamortized issuance costs' → CV 차감 → Loss 증가\n'bond payable debited at' → 항상 par value",
    trap: "D(핵심함정): Bond Payable을 premium price로 차변 → 오답. Bond Payable Dr.는 항상 par. 초과분은 Loss.\nA: Gain→OCI 오답. Bond gain/loss는 모두 I/S(continuing operations). OCI는 AFS·Cash Flow Hedge 등에만.\nC: Discount↑→Loss↓ 오답. Discount↑→CV↓→Loss↑. 반대 방향.\nB(정답): not fully amortized = 잔액 존재 = CV 차감 = 무조건 Loss 증가.\n★ Unamortized discount = CV에서 차감(subtract) — 가산(add) 아님. D선지 '가산' 표현은 항상 오답.\n★ Discount 발행채권 CV 흐름: 발행가(96) → 만기(100)로 서서히 상승 → 3년 후에도 CV < 100 → 102 상환 시 반드시 Loss.",
    one_sentence: "Loss = Reacquisition Price − CV; CV = Par − Unamortized Discount − Issuance Costs; Bond Payable Dr.는 항상 par.",
    speed: "① CV = $1,000,000 − $80,000 − $30,000 = $890,000\n② Loss = $1,050,000 − $890,000 = $160,000\n③ Bond Payable Dr. = par $1,000,000 (상환가격 아님)\n④ Gain/Loss → I/S (OCI 아님)\n답: B",
    context_background: "[왜 Bond Payable은 par로 차변 처리하는가]\nBond Payable은 발행 시 액면금액(par)으로 인식된 부채다. 상환 시 이 부채를 제거(derecognize)하므로 장부에 기록된 par value만큼 차변 처리한다. 상환가격(premium)은 부채 금액과 무관하며, 실제 지급한 Cash와 장부상 CV의 차이가 Loss로 확정된다.\n\n[Unamortized Issuance Costs의 역할]\n발행비용은 채권 발행 시 자산(Deferred Financing Cost)으로 인식 후 만기까지 상각한다. 조기 상환 시 미상각 잔액을 즉시 제거해야 하므로 CV에서 차감된다. 잔액이 클수록 CV가 낮아지고 Loss가 커진다. 이것은 '이렇든 저렇든' 잔액만 있으면 항상 성립하는 관계다.\n\n[Discount와 Loss의 관계]\nDiscount 잔액도 CV를 낮추는 항목이다. Discount가 클수록 CV가 낮아지고, 같은 상환가격 대비 Loss가 커진다. C선지(Discount↑→Loss↓)는 정반대 방향으로 헷갈리게 만드는 함정.",
  },

  // [BOND_009] Bond types — maturity structure classification
  // RULE    : Serial = 만기 분산 / Term = 만기 단일 / Sinking fund·Debenture = 만기 구조 아님
  // TRIGGER : 'not all mature on the same date' → Serial / 'single fixed maturity' → Term
  // TRAP    : Sinking fund(적립 방식)·Debenture(무담보)를 만기 구조로 혼동
  {
    topic_id: "BOND_009",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_name: "Bond types — maturity structure classification",
    rule: "Serial bonds: 단일 발행 내 만기일 분산 → 분할 상환. Term bonds: 단일 만기일에 전액 상환. Sinking fund: 만기 구조 아님, 매 기간 적립금 조성 방식. Debenture: 만기 구조 아님, 무담보 사채.",
    trigger: "'not all mature on the same date' → Serial bonds\n'single fixed maturity date' → Term bonds\n'unsecured' → Debenture bonds\n'fund set aside each period' → Sinking fund bonds",
    trap: "A (Sinking fund) → 만기 구조 분류 아님. 적립금 조성 방식\nC (Debenture) → 만기 구조 분류 아님. 담보 여부 분류\nD (Term) → 반대 개념. 단일 만기일에 전액 상환\n공통 함정: Sinking fund와 Debenture를 만기 구조 개념으로 혼동하는 것",
    one_sentence: "만기 분산 = Serial bonds; 만기 단일 = Term bonds; Sinking fund·Debenture는 만기 구조 분류 아님.",
    speed: "'not all same date' → Serial bonds 즉시 선택",
    context_background: "[채권 분류 체계]\n채권은 여러 기준으로 분류된다. 시험에서 자주 혼동되는 4가지:\n\n① Serial bonds (만기 분산)\n단일 발행이지만 만기일이 여러 개로 분산. 예: $1,000,000 발행 → 매년 $200,000씩 5년에 걸쳐 순차 상환. 발행자 입장에서 한꺼번에 큰 금액을 상환할 필요 없어 유동성 부담 감소.\n\n② Term bonds (만기 단일)\n발행된 채권 전체가 동일한 만기일에 일시 상환. 가장 일반적인 형태. 만기 시 큰 현금 유출 발생.\n\n③ Sinking fund bonds (적립 상환)\n만기 구조와 무관. 발행자가 매 기간 일정 금액을 적립 펀드에 넣어 만기 상환 재원을 마련하는 방식. Term bond에 sinking fund 조항이 붙는 형태가 일반적.\n\n④ Debenture bonds (무담보 사채)\n만기 구조와 무관. 특정 자산을 담보로 제공하지 않는 채권. 발행자의 신용도에만 의존. 반대 개념: Mortgage bond(담보 사채).",
  },

  // [BOND_010] Bond Discount — Interest Expense vs Cash Interest Paid
  // RULE    : Interest Expense = Cash paid + Discount 상각 / Premium이면 반대
  // TRIGGER : 'issued below face value' → Plus discount
  // TRAP    : Minus discount(C) → Premium 로직 혼동 / Par value 포함(A·B) → 무관
  {
    topic_id: "BOND_010",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond Discount — Interest Expense vs Cash Interest Paid",
    rule: "Discount 발행: Interest Expense = Cash Interest Paid + Discount 상각액. 분개: Dr.Interest Expense / Cr.Discount on Bonds / Cr.Cash. Premium 발행은 반대: Interest Expense = Cash paid − Premium 상각.",
    trigger: "'issued at a discount' / 'issued below face value' → Interest Expense = Cash paid + Discount 상각\n'issued at a premium' / 'issued above face value' → Interest Expense = Cash paid − Premium 상각",
    trap: "Minus discount(C): Premium 발행 로직을 Discount에 적용한 오류\nPlus/Minus par value(A·B): Par value는 이자비용 계산과 무관\n공통 함정: Discount·Premium 방향 혼동 — Discount 발행 시 이자비용 > 현금지급",
    one_sentence: "Discount 발행 → Interest Expense = Cash paid + Discount 상각; Premium이면 빼기.",
    speed: "Discount → Plus / Premium → Minus\nPar value는 항상 무관",
    context_background: "[Bond Discount 발행 구조]\n발행가 < 액면가 = Discount 발행. 이 차액은 만기까지 이자비용으로 상각된다.\n\n[분개 구조]\nDr. Interest Expense      XXX\n  Cr. Discount on Bonds       XXX  (상각 → CV 증가)\n  Cr. Cash                    XXX\n\n→ Interest Expense = Cash + Discount 상각\n\n[Discount가 Dr 잔액인 이유]\nDiscount on Bonds는 채권 액면가의 차감 계정(contra liability). 발행 시 Dr로 인식되고, 상각 시마다 Cr로 줄어들면서 Carrying Value가 액면가에 근접한다.\n\n[Premium 발행과 비교]\nDr. Interest Expense      XXX\nDr. Premium on Bonds      XXX  (상각 → CV 감소)\n  Cr. Cash                    XXX\n\n→ Interest Expense = Cash − Premium 상각\nPremium은 Cr 잔액 → 상각 시 Dr → 이자비용이 현금보다 작음",
  },

  // [BOND_011] Bond Classification — Serial vs Debenture
  // RULE    : Serial = 분할상환 / Debenture = 무담보 / 두 분류 독립적
  // TRIGGER : 'maturing annually' → Serial / 'Unsecured' → Debenture / 'guaranty security' → 둘 다 제외
  // TRAP    : registered 누락(A·C) / guaranty를 Serial 포함(D) / secured 전부 Debenture 포함(A)
  {
    topic_id: "BOND_011",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond Classification — Serial vs Debenture",
    rule: "Serial Bond = 분할 상환('maturing annually/periodically'). Debenture Bond = 무담보(Unsecured 캡션). 두 분류는 독립적 → 동일 채권이 둘 다 해당 가능. Guaranty Security = Secured → 두 분류 모두 해당 안 됨.",
    trigger: "'maturing annually' / 'maturing periodically' → Serial Bond\n'Unsecured' 캡션 → Debenture Bond\n'guaranty security' / 'secured' → Debenture 제외\n'due Year XX' 단독 표기(일시상환) → Serial 아님",
    trap: "Serial $200,000(A): asset-backed만 포함 → registered 'maturing annually' 누락\nDebenture $650,000(A): secured 포함 오류\nDebenture $125,000(C): convertible만 포함 → registered $275,000 누락\nSerial $450,000(D): guaranty security 포함 → secured는 Serial 아님\n공통 함정: Guaranty Security를 Serial로 착각 — 'due Year 21' = 일시상환",
    one_sentence: "Serial = 분할상환 여부 / Debenture = 무담보 여부; 두 기준 독립적, Guaranty Security는 둘 다 해당 안 됨.",
    speed: "Serial: 'maturing annually' 항목만 → $275,000 + $200,000 = $475,000\nDebenture: Unsecured 캡션만 → $275,000 + $125,000 = $400,000\nGuaranty $50,000 → 제외",
    context_background: "[Serial Bond vs Debenture Bond — 분류 기준이 다르다]\n두 분류는 서로 다른 기준을 사용하므로 독립적으로 판단해야 한다.\n\n[Serial Bond — 상환 방식 기준]\n만기가 여러 시점에 걸쳐 분산된 채권. 'maturing annually', 'maturing periodically', '$X,000 maturing beginning in Year N' 같은 문구가 신호.\n일시상환(Bullet): 'due Year XX' 단독 표기 → Serial 아님.\n\n[Debenture Bond — 담보 여부 기준]\n특정 자산 담보 없이 발행사의 신용만으로 발행된 무담보 채권. B/S에서 'Unsecured' 캡션 하의 항목이 해당.\n\n[Guaranty Security Bond]\n제3자(보증기관)가 원리금 상환을 보증 → Secured 채권.\n→ Debenture 아님(담보 있음)\n→ 이 문제에서 'due Year 21' = 일시상환 → Serial도 아님\n\n[같은 채권이 두 분류 동시 해당 가능]\n8.5% registered bonds: 'maturing annually' → Serial ✓ / Unsecured 캡션 → Debenture ✓\n→ $275,000이 Serial 합계와 Debenture 합계 양쪽에 모두 포함됨.",
  },

  // [BOND_012] Bond Amortization Concepts — Premium/Discount CV, Zero-Coupon, Coupon vs Market Rate
  // RULE    : 상각액 = 발행 시 rate 고정 / Premium CV 감소 / Zero-coupon Payable = $0 / coupon≈market → 상각액 소
  // TRIGGER : zero-coupon → Payable = FV×0% = $0 / Expense = BV×rate ≠ $0
  // TRAP    : 발행 후 금리 변동 → 상각액 변동 오답 / Premium CV 증가 오답 / Zero-coupon Expense = $0 오답
  {
    topic_id: "BOND_012",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond Amortization Concepts — Premium/Discount CV, Zero-Coupon, Coupon vs Market Rate",
    rule: "① 상각액 = 발행 시 market rate 기준 고정 — 이후 시장금리 변동 무관\n② Premium bond CV = 상각 시 감소 (액면가 방향으로 수렴)\n③ Zero-coupon: Interest Payable = FV × Coupon Rate(0%) = $0 / Interest Expense = BV × Market Rate ≠ $0\n④ Coupon rate ≈ Market rate → discount/premium 소 → 상각액 소",
    trigger: "'amortization per period' → 발행 시 rate 고정, 이후 변동 무관\n'premium bond' + 'carrying value' → 상각 시 감소(액면가 방향)\n'zero-coupon' → Payable = FV × 0% = $0 / Expense = BV × market rate ≠ $0\n'coupon rate closer to market rate' → discount/premium 소 → 상각액 소",
    trap: "A: 발행 후 시장금리 변동 → 상각액 바뀐다고 혼동. 발행 시 rate로 영구 고정.\nB: Premium CV → 상각되면 증가한다고 혼동. 액면가 방향으로 감소.\nC: Zero-coupon → interest expense도 $0이라고 혼동.\n  Interest Payable = FV × Coupon Rate(0%) = $0\n  Interest Expense = BV × Market Rate ≠ $0\n  현금이자 지급 약속이 없을 뿐, 이자비용은 시간 경과로 무조건 발생",
    one_sentence: "Zero-coupon: Payable = FV×0% = $0 / Expense = BV×rate ≠ $0; coupon≈market → 상각액 소.",
    speed: "① A → 발행 후 금리 변동 = 상각액 무관 → 오답\n② B → Premium CV = 상각 시 감소 → 오답\n③ C → Payable = FV×0% = $0 / Expense ≠ $0 → 오답\n④ D → coupon ≈ market → 상각액 소 → 정답",
    context_background: "[채권 상각 4대 개념]\n\n① 상각액은 발행 시 market rate 기준으로 계산 → 이후 시장금리 변동과 완전 무관\n발행 후 금리가 12%로 올라도 상각 계산에 쓰는 rate는 발행 시 rate(예: 10%) 그대로\n\n② Premium bond CV 변화 방향\nCV = 액면가 + 미상각 Premium. 상각될수록 Premium 소진 → CV 감소 → 만기에 액면가 수렴\nDr. Interest Expense(BV×market rate) + Dr. Bond Premium / Cr. Cash(FV×coupon rate)\n\n③ Zero-coupon bond 핵심\nInterest Payable = FV × Coupon Rate = FV × 0% = $0 (현금이자 지급 약속 없음)\nInterest Expense = BV × Market Rate ≠ $0 (시간 경과로 무조건 발생)\n→ Expense는 있는데 Payable은 없음 → 차이 전액이 Discount 상각\nDr. Interest Expense(BV×rate) / Cr. Bond Discount\n\n[Bond Expense vs Payable 비교]\nInterest Expense = BV × Market Rate → 시간 경과 기준, 항상 ≠ $0\nInterest Payable = FV × Coupon Rate → 현금이자 미지급분, zero-coupon이면 = $0\nBond 살아있는 한 Interest Expense = $0은 불가능\n\n④ Coupon rate vs Market rate 차이 → 상각액 크기 결정\ncoupon 0% vs market 10% → deep discount → 상각액 최대 (zero-coupon 극단 케이스)\ncoupon 10% vs market 10% → at par → discount/premium = $0 → 상각액 = $0\n→ 두 rate가 가까울수록 상각액 작아짐",
  },

  // [BOND_013] Bond Purchased Between Interest Dates at Discount — CV vs Cash Paid vs Face
  // RULE    : CV < Cash paid(+경과이자) < Face / CV = 세 숫자 중 항상 최소
  // TRIGGER : 'between interest dates' → Cash paid = CV + 경과이자 / 'at a discount' → CV < Face
  // TRAP    : CV > Cash paid 오류(B) / CV > Face 오류(C) / 둘 다 Yes 오류(A)
  {
    topic_id: "BOND_013",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond Purchased Between Interest Dates at Discount — CV vs Cash Paid vs Face",
    rule: "이자지급일 사이 할인채권 매입 시 크기 순서:\nCV = Face − Unamortized Discount (가장 작음)\nCash paid = CV + 경과이자 (중간)\nFace Amount = 만기 수령액 (가장 큼)\n→ CV < Cash paid < Face",
    trigger: "'between interest dates' → Cash paid = CV + 경과이자 → Cash paid > CV\n'at a discount' → CV = Face − Discount → CV < Face\n두 조건 동시 → CV가 세 숫자 중 최소 → 둘 다 No",
    trap: "A(Yes/Yes): CV가 둘 다보다 크다 → 불가\nB(Yes/No): CV > Cash paid 오류. 경과이자 때문에 Cash paid가 더 큼\nC(No/Yes): CV > Face 오류. Discount 채권은 만기까지 상각하면서 Face로 수렴 → 현재 CV < Face",
    one_sentence: "이자지급일 사이 할인채권: CV < Cash paid(+경과이자) < Face; CV가 항상 최소.",
    speed: "① 'at a discount' → CV < Face → No\n② 'between interest dates' → Cash paid = CV + 경과이자 → CV < Cash paid → No\n③ 답: D (No / No)",
    context_background: "[세 숫자 구조]\n\nCV (Carrying Value)\n= Face − Unamortized Discount\n= 아직 상각 안 된 할인액만큼 Face보다 작음\n= 만기까지 조금씩 상각 → Face로 수렴\n\nCash paid to seller\n= CV + Accrued Interest(경과이자)\n= 이자지급일 사이에 매입하면 직전 이자지급일부터 매입일까지의 이자를 seller에게 얹어서 지급\n= 나중에 이자 수령 시 전액 돌려받는 구조\n→ Cash paid > CV\n\nFace Amount\n= 만기에 수령하는 원금\n= Discount가 전부 상각된 최종 상태\n→ Face > CV\n\n[크기 순서]\nCV < Cash paid < Face\n\n[타임라인]\n발행일       매입일(중간)    이자지급일      만기\n  |_____________|_______________|_____________|\n  \n매입 시:\nDr. Investment in Bond  (CV)        ← 장부에 올리는 금액\nDr. Interest Receivable (경과이자)  ← ���중에 돌려받을 이자\n    Cr. Cash            (CV + 경과이자)\n\n[경과이자가 CV에 포함되지 않는 이유]\n경과이자는 채권의 원가가 아닌 '미수이자'로 별도 자산 처리.\n이자 수령 시 Dr. Cash / Cr. Interest Receivable로 상계.",
  },

  // [BOND_014] Bond type classification — serial vs debenture vs guaranty security
  // RULE    : Serial = 'maturing annually' 키워드 채권 합산 / Debenture = 'unsecured' 채권 합산 / Guaranty security = 둘 다 해당 없음
  // TRIGGER : serial bonds | debenture bonds | guaranty security | maturing annually | unsecured | bond classification
  // TRAP    : guaranty security를 serial에 포함(A) / secured 채권까지 debenture 포함(B) / convertible만 포함해 registered 누락(D)
  {
    topic_id: "BOND_014",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond type classification — serial vs debenture vs guaranty security",
    rule: "Serial bonds = 분할상환 채권 → 'maturing annually' or 'maturing beginning in Year X' 키워드. Debenture bonds = 무담보 채권 → 'unsecured' caption 항목 전체. Guaranty security bonds = 제3자 보증 담보 → serial도 debenture도 아님 → 둘 다 제외.",
    trigger: "serial bonds | debenture bonds | guaranty security | maturing annually | unsecured | secured | bond classification",
    trap: "A($450K serial): guaranty security $50K를 serial에 포함 오류 → guaranty는 분할상환 아님. B($650K debenture): secured 채권까지 debenture 포함 오류. D($125K debenture): convertible만 포함, registered bonds $275K 누락.",
    one_sentence: "Serial = maturing annually / Debenture = unsecured / Guaranty security = 둘 다 해당 없음.",
    example: "Serial: $275K(registered, maturing annually) + $200K(commodity, maturing annually) = $475K / Debenture: $275K + $125K = $400K / Guaranty $50K → 제외",
    speed: "① 'maturing annually' → Serial: $275K + $200K = $475K ② 'unsecured' → Debenture: $275K + $125K = $400K ③ Guaranty security → 둘 다 제외 → 정답 C",
  },

  // [BOND_015] Interest Expense — What Qualifies vs What Does Not
  // RULE    : Discount 상각 → Interest expense 직접 / 나머지는 다른 계정 흡수
  // TRIGGER : 'pension interest' → Pension cost / 'deferred comp interest' → Deferred comp expense
  //           'software development interest' → 자산(자본화) / 'discount amortization' → Interest expense
  // TRAP    : Pension/deferred comp이 '이자'라서 interest expense로 착각
  //           자본화 이자를 I/S로 처리하는 오류
  {
    topic_id: "BOND_015",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'conditional',
    card_name: "Interest Expense — What Qualifies vs What Does Not",
    rule: "Interest Expense(I/S 직접 보고):\n✅ Bond/Note discount 상각\n   Dr. Interest Expense / Cr. Discount on B/NP\n\n❌ Pension interest → Net periodic pension cost 구성요소\n   Dr. Pension Expense / Cr. Pension Liability\n❌ Deferred compensation interest → Deferred comp expense\n   Dr. Deferred Compensation Expense / Cr. Liability\n❌ 자본화 이자(건설·소프트웨어) → 자산원가\n   Dr. Asset / Cr. Cash",
    trigger: "'discount amortization' → Interest expense 직접 → Yes\n'pension interest' → Pension cost 구성요소 → No\n'deferred compensation interest' → Deferred comp expense → No\n'interest to finance software/construction' → 자본화 → No",
    trap: "Pension interest도 '이자'니까 Interest expense라고 착각\nDeferred comp interest도 '이자'니까 Interest expense라고 착각\n자본화 이자를 I/S Interest expense로 처리하는 오류\nPremium 상각 → Interest expense 감소 (discount와 방향 반대)",
    one_sentence: "Interest expense 계정 직접 사용 = Discount 상각뿐; 나머지는 다른 계정에 흡수.",
    speed: "소거법:\n① Pension → Pension cost → 탈락\n② Deferred comp → Deferred comp expense → 탈락\n③ 자본화 이자 → 자산 → 탈락\n→ Discount 상각 → Interest expense ✓",
    example: "Dr. Interest Expense $5,000 / Cr. Discount on BP $5,000 → Interest expense ✓\nDr. Pension Expense $8,000 / Cr. PBO $8,000 → Interest expense ✗",
  },

  // [BOND_016] Loan origination fee — creditor interest income on net amount loaned
  // RULE    : Origination fee → 즉시 수익 X → net amount 기준 유효이자율로 이자수익 인식
  // TRIGGER : "nonrefundable loan origination fee" → net loaned 기준 유효이자율 사용
  //           "effective rate at PV of $194,000" → 이 이율 사용 / Dec.1 대출 → × 1/12
  // TRAP    : Face amount × face rate 사용 / Fee 즉시 수익 인식 / 연간이자 그대로 사용(1/12 누락)
  {
    topic_id: "BOND_016",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Loan origination fee — creditor interest income using effective rate on net amount loaned",
    rule: "Nonrefundable loan origination fee 처리 (대출자 입장):\n① Fee → 즉시 수익 X → 대출 기간에 걸쳐 이자수익으로 인식\n② 기준금액 = Net amount loaned (face - fee)\n③ 이율 = Net amount 기준 유효이자율 (face rate 아님)\n④ 이자수익 = Net loaned × 유효이자율 × 기간/12\n\n[Bond discount와 동일 로직]\nBond: $94,000 조달 → 유효이자율로 이자비용\nLoan: $194,000 투자 → 유효이자율로 이자수익 (방향만 반대)",
    trigger: '"nonrefundable loan origination fee" → net loaned 기준 유효이자율 적용\n"effective rate at PV of $194,000" → 이 이율 사용 (net 기준)\n"effective rate at PV of $200,000" → face rate = 무시\n대출일이 연중 → 잔여월/12 기간 조정 필수',
    trap: "① Face amount × face rate(11%) × 1/12 = $1,833 → net loaned + 유효이자율 사용해야 함\n② $6,000 fee 즉시 수익 인식 → 대출 기간 배분 필수\n③ 연간 이자($24,056) 그대로 사용 → 1개월 조정(× 1/12) 누락\n④ $0 → origination fee 있어도 이자수익은 발생",
    one_sentence: "Origination fee → 즉시 수익 X; Net loaned × 유효이자율 × 기간/12 = 이자수익.",
    example: "Net loaned $194,000 × 12.4% = $24,056 / Dec.1 대출 → × 1/12 = $2,005 Year 1 이자수익",
    context_background: "대출자가 nonrefundable loan origination fee를 수취하면 즉시 수익으로 인식하지 않는다. 대신 net amount loaned($194,000)를 기준으로 유효이자율(12.4%)을 계산하고, 대출 기간에 걸쳐 이자수익으로 인식한다. 실제 투자금 $194,000으로 $200,000 기준 원리금을 받으니 실제 수익률(12.4%)이 표면이율(11%)보다 높다. Bond discount 상각과 방향만 반대인 동일 로직이다.",
    speed: "① Net loaned = $194,000\n② 유효이자율 = 12.4% (net 기준)\n③ $194,000 × 12.4% = $24,056\n④ Dec.1 → 1개월 → × 1/12\n⑤ $2,005 → 정답 D",
  },

  // [BOND_017] Bond investment sale gain — unamortized discount, face value cancels out
  // RULE    : Gain = Premium + Unamortized discount / Face value 없어도 X 상쇄로 계산 가능
  // TRIGGER : "purchased at discount" + "sold at premium" + "amortization" → Gain = Premium + Unamortized discount
  // TRAP    : Premium - Amortization / 상각 무시 / 상각이 BV 감소시킨다는 오류
  {
    topic_id: "BOND_017",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond investment sale gain — unamortized discount and premium without face value",
    rule: "Bond 투자 매각 Gain 계산:\n\n[기본 공식]\nGain = 매각금액 - 상각 후 BV\n     = (Face + Premium) - (Face - Unamortized discount)\n     = Premium + Unamortized discount\n→ Face value 상쇄 → 없어도 계산 가능\n\n[빠른 공식 (face 없을 때)]\nGain = Premium received + Unamortized discount\nUnamortized discount = Original discount - Amortized amount\n\n[핵심]\nDiscount 상각 → BV 증가 → Gain 감소\nDiscount 상각 많을수록 → Unamortized discount 감소 → Gain 감소",
    trigger: '"purchased at discount of $X" → Original discount = $X\n"amortization of discount = $Y" → Unamortized = $X - $Y\n"sold at premium of $Z" → Premium = $Z\nFace value 미제시 → X 상쇄 공식 사용\nGain = Premium + Unamortized discount',
    trap: "① Premium - Amortization = $12,000 → BV 개념 무시, 공식 오류\n② 상각 무시 → Unamortized discount ≠ Original discount\n③ 상각이 BV 감소시킨다 → 반대, discount 상각 = BV 증가\n④ Face value 없으면 못 푼다 → X 상쇄로 face 불필요",
    one_sentence: "Gain = Premium + Unamortized discount; Face value는 X로 놓으면 상쇄되어 불필요.",
    example: "Discount $10,000 / Amortized $2,000 / Premium $14,000\n→ Unamortized = $8,000\n→ Gain = $14,000 + $8,000 = $22,000",
    context_background: "채권 투자를 할인 매입한 경우, 보유 기간 중 discount를 상각하면 장부금액(BV)이 증가한다. 매각 시 gain/loss는 매각금액 - 상각 후 BV로 계산한다. Face value가 주어지지 않아도 양변에서 X로 상쇄되므로 계산 가능하다. 핵심 공식: Gain = Premium received + Unamortized discount.",
    speed: "① Unamortized discount = $10,000 - $2,000 = $8,000\n② Gain = Premium $14,000 + Unamortized $8,000\n③ $22,000 → 정답 B",
  },

  // [BOND_018] Bond Extinguishment – Loss Calculation with Unamortized Discount & Issuance Costs
  // RULE    : Loss = Reacquisition price − Net CV / Net CV = Face − Unamortized discount − Unamortized issuance cost
  // TRIGGER : "called at X%" → Reacquisition price / "issued at discount" + "issuance costs" → 둘 다 CV 차감
  // TRAP    : discount만 차감(issuance cost 누락) / 경과기간/총기간으로 미상각분 계산(잔여/총기간이 맞음)
  {
    topic_id: "BOND_018",
    category: "Bonds",
    topic_name: "Bond Extinguishment – Loss Calculation with Unamortized Discount & Issuance Costs",
    rule: "【채권 조기 상환 손익 계산 5단계】\nStep 1. Reacquisition price = Face × call price%\nStep 2. Unamortized discount = 원래 discount × 잔여기간/총기간\nStep 3. Unamortized issuance cost = 원래 issuance cost × 잔여기간/총기간\nStep 4. Net CV = Face − Unamortized discount − Unamortized issuance cost\nStep 5. Loss(Gain) = Reacquisition price − Net CV\n         양수 → Loss / 음수 → Gain\n\n【미상각분 계산 (SL법)】\n잔여기간 = 총기간 − 경과기간\nUnamortized = 원금액 × 잔여기간/총기간\n\n【Net CV 구성】\nFace value\n− Unamortized discount (할인 발행 시)\n+ Unamortized premium (할증 발행 시)\n− Unamortized issuance cost (항상 차감)",
    trigger: '"called at X%" → Reacquisition price = Face × X%\n"issued at discount/premium" → Unamortized discount/premium\n"bond issuance costs" → Unamortized portion → CV 차감\n"straight-line" → 미상각분 = 원금액 × 잔여/총기간',
    trap: "Unamortized discount만 계산하고 issuance cost 미포함.\nUnamortized issuance cost만 계산하고 discount 미포함.\n상각된 금액(amortized)을 CV에서 차감(미상각분만 차감).\n경과기간/총기간으로 미상각분 계산(잔여기간/총기간이 맞음).",
    example: "Riverside Corp:\nStep 1. $1,500,000 × 102% = $1,530,000\nStep 2. Discount: $30,000 × 20/30 = $20,000 unamortized\nStep 3. Issuance cost: $90,000 × 20/30 = $60,000 unamortized\nStep 4. Net CV: $1,500,000 − $20,000 − $60,000 = $1,420,000\nStep 5. Loss: $1,530,000 − $1,420,000 = $110,000",
    journal_entry: "Dr. Bonds Payable $1,500,000\nDr. Loss on Extinguishment $110,000\nCr. Discount on Bonds Payable $20,000\nCr. Bond Issuance Costs $60,000\nCr. Cash $1,530,000",
    key_formula: "Loss = Reacquisition price − Net CV\nNet CV = Face − Unamortized discount − Unamortized issuance cost\nUnamortized = 원금액 × 잔여기간/총기간",
    speed: "Loss = Reacquisition price − (Face − Unamortized discount − Unamortized issuance cost)",
  },

  // [BOND_019] Bond Issuance at Discount — Journal Entry
  // RULE    : Dr. Cash(실수령액) / Dr. Discount on Bonds Payable(차액) / Cr. Bonds Payable(face value 전액)
  // TRIGGER : "issued at 98/97/95" → Discount / "issued at 102/105" → Premium
  // TRAP    : Bonds Payable을 실수령액으로 Cr. 오답 / Discount를 Cr. 오답 / 98 → Premium 처리 오답
  // EXAMPLE : 발행가 98, face $50,000 → Dr. Cash $49,000 / Dr. Discount $1,000 / Cr. Bonds Payable $50,000
  {
    topic_id: "BOND_019",
    category: "Bonds",
    topic_name: "Bond Issuance at Discount — Journal Entry",
    summary: "채권 할인 발행 시 Bonds Payable은 항상 face value 전액. 차액은 Discount on Bonds Payable(Dr.)로 별도 기록.",
    rule: "Dr. Cash(실수령액) / Dr. Discount on Bonds Payable(차액) / Cr. Bonds Payable(face value 전액). 발행가 < 100 = discount / 발행가 > 100 = premium.",
    trigger: '"issued at 98/97/95" → Discount. "issued at 102/105" → Premium. Bonds Payable 항상 face value 전액 Cr.',
    trap: "Bonds Payable을 실수령액으로 Cr. 오답. Discount를 Cr. 오답 → 반드시 Dr. 98 < 100이므로 Premium 처리 오답.",
    example: "발행가 98, face value $50,000 → Dr. Cash $49,000 / Dr. Discount $1,000 / Cr. Bonds Payable $50,000",
    speed: "발행가 < 100 → Dr. Cash / Dr. Discount / Cr. Bonds Payable(face value) 무조건 반사",
  },

  // [BOND_020] Short-Term Debt Refinancing — Noncurrent Reclassification
  // RULE    : 재무제표 발행 전 장기차환 완료 → Noncurrent 재분류 가능 + Separate Disclosure 필수
  // TRIGGER : "before the issuance of financial statements" + "issued long-term bonds" → Noncurrent 재분류
  // TRAP    : Separate Disclosure 없이 Noncurrent 오답(D번 함정) / 차환 후 Current 유지 오답
  // EXAMPLE : Dec 31 Year 4 단기 note → Feb 15 Year 5 장기채권 발행(재무제표 발행 전) → Noncurrent + Separate Disclosure
  {
    topic_id: "BOND_020",
    category: "Long-Term Liabilities",
    topic_name: "Short-Term Debt Refinancing — Noncurrent Reclassification",
    summary: "재무제표 발행 전 장기차환 완료 시 Current → Noncurrent 재분류 가능. Separate Disclosure 필수.",
    rule: "단기부채 + 재무제표 발행 전 장기차환 완료 → Noncurrent 재분류 가능 + Separate Disclosure 필수. 재무제표 발행 후 차환 → Current 유지.",
    trigger: '"before the issuance of financial statements" + "issued long-term bonds" → Noncurrent 재분류. Noncurrent 재분류 → Separate Disclosure 항상 필수.',
    trap: "Separate Disclosure 없이 Noncurrent 오답(D번 함정). 차환 후에도 Current 유지 오답. 재무제표 발행 후 차환은 Current 유지.",
    example: "Dec 31 Year 4 기준 단기 note → Jan 28 Year 5 장기채권 발행(재무제표 발행 전) → Noncurrent + Separate Disclosure",
    speed: "단기부채 + 재무제표 발행 전 장기차환 → Noncurrent + Separate Disclosure 필수 (무조건 반사)",
  },

  // [BOND_021] Bond Issued Between Interest Dates — Cash Received at Issuance
  // RULE    : Cash = 발행가(Face × price%) + 경과이자(반기이자 × 경과월/6)
  // TRIGGER : "dated [date]" + "issued [later date]" → 경과이자 가산 필수
  // TRAP    : 경과이자 누락($970K) / 6개월 전체 계산 / 발행가 무시
  {
    topic_id: "BOND_021",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond Issued Between Interest Dates — Cash Received at Issuance",
    rule: "이자지급일 사이 발행 시 발행자 수령액:\nCash = 발행가(Face × price%) + 경과이자\n\n경과이자 = 반기이자 × 경과월수/6\n반기이자 = Face × coupon rate × 6/12\n경과월수 = 발행일 − dated일(또는 직전 이자지급일)\n\n[분개 — 발행자]\nDr. Cash                  (발행가 + 경과이자)\nDr. Bond Discount         (Face − 발행가)\n    Cr. Bonds Payable         (Face)\n    Cr. Interest Payable      (경과이자)\n\n[이자지급일 분개]\nDr. Interest Expense      (실제 보유기간 이자)\nDr. Interest Payable      (경과이자 상계)\n    Cr. Cash                  (반기이자 전액)",
    trigger: '"dated [date]" + "issued [later date]" → 두 날짜 차이 = 경과월수\n"pays interest semiannually on [date1] and [date2]" → 반기이자 = Face × rate ÷ 2\n발행일 ≠ 이자지급일 → 경과이자 가산 필수',
    trap: "경과이자 누락 → 발행가만 계산 ($970,000 오답)\n경과이자 6개월 전체 계산 → 경과분(3개월)만\nInterest Payable을 Interest Expense로 처리 → 경과이자는 비용 아님, 부채(상계 대기)\n발행가 무시하고 Face 그대로 → price% 적용 필수",
    one_sentence: "이자지급일 사이 발행: Cash = 발행가 + 경과이자; 경과이자는 Interest Payable로 인식 후 이자지급일에 상계.",
    speed: "① 발행가: Face × price%\n② 반기이자: Face × rate ÷ 2\n③ 경과월: dated일 → 발행일\n④ 경과이자: 반기이자 × 경과월/6\n⑤ Cash = ① + ④",
    example: "Face $1,000,000 / 10% / 97 발행 / Dated 1/1 / Issued 4/1\n① $1,000,000 × 97% = $970,000\n② $1,000,000 × 10% ÷ 2 = $50,000\n③ 1/1→4/1 = 3개월\n④ $50,000 × 3/6 = $25,000\n⑤ Cash = $995,000",
    context_background: "[왜 경과이자를 받는가 — 현금흐름 전체로 이해]\n\n채권 dated일(1/1)부터 이자 누적 시작.\n7/1 이자지급일에 Martin은 매수자에게 $50,000 전액 지급.\n그런데 1/1~4/1 사이 3개월은 매수자가 채권을 갖고 있지 않았던 기간.\n→ 그 3개월치 $25,000은 원래 Martin 몫.\n→ 7/1에 어차피 $50,000 전부 줄 건데,\n   발행 시 $25,000 미리 받아두고 → 7/1에 $50,000 전부 지급.\n→ Martin 실질 이자 부담 = $50,000 − $25,000 = $25,000 (3개월치만)\n\n[현금흐름]\n4/1: +$970,000(발행가) +$25,000(경과이자 회수) = +$995,000\n7/1: −$50,000(이자 전액 지급)\n실질: $25,000만 부담 (4/1~7/1 3개월치)\n\n[왜 dated일과 발행일이 다른가 — 운영적 이유]\nDated일 = 법적·계약상 이자 기산일 (서류 확정 날짜)\nIssued일 = 실제 시장에 팔린 날짜\n→ 서류 완성 → SEC 승인 → 인수업체 계약 → 투자자 모집 → 실제 판매\n→ 이 과정에 시간이 걸려 dated일과 발행일이 달라짐.\n\n[이자지급일을 굳이 발행일에 맞추지 않는 이유]\n같은 회사가 여러 번 채권을 발행해도 이자지급일을 1/1·7/1로 통일.\n→ 현금 유출 시점 예측 가능 → 잉여현금 운용 계획 수립 용이.\n→ 발행 때마다 이자지급일을 바꾸면 현금흐름 관리 복잡.\n\n[분개 전체]\n4/1 발행 시:\nDr. Cash             $995,000\nDr. Bond Discount     $30,000\n    Cr. Bonds Payable        $1,000,000\n    Cr. Interest Payable        $25,000\n\n7/1 이자 지급 시:\nDr. Interest Expense  $25,000  (4/1~7/1 실제 부담분)\nDr. Interest Payable  $25,000  (경과이자 상계)\n    Cr. Cash                  $50,000",
  },

  // [BOND_022] Bond with Detachable Stock Warrants — Allocation to Debt vs Equity
  // RULE    : 총 발행액 = Face × issue% / Warrant FV → APIC / 채권 CV = 총액 − Warrant FV
  // TRIGGER : "detachable stock warrants" → 총액에서 Warrant FV 차감 → 채권 배분
  // TRAP    : Warrant 무시 전액 부채 / Face 그대로 / Warrant 가산 오류
  {
    topic_id: "BOND_022",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond with Detachable Stock Warrants — Allocation to Debt vs Equity",
    rule: "Detachable warrant 포함 채권 발행 시:\n① 총 발행액 = Face × issue price%\n② Warrant FV = 개수 × FV per warrant → APIC-Warrants(자본)\n③ 채권 CV = 총 발행액 − Warrant FV → Long-term debt\n\n[행사가 무관한 이유]\n행사가($12) = 나중에 Warrant 행사 시 내는 돈\n발행 시점 = Warrant FV($1 × 개수)만 APIC에 배분, 행사가 무관\n\n[상각 기준]\n채권 CV = $3,840,000 (Warrant 배분 후)\nFace = $4,000,000\n→ 겉보기 Premium 발행이지만 실질 Discount 효과\n→ $3,840,000 → $4,000,000으로 만기까지 상각\n\n[Detachable vs Non-detachable]\nDetachable: 분리 가능 → 별도 FV → APIC 선인식 → 행사 시 C/S + APIC 재분류\nNon-detachable: 채권과 운명 공동체 → 분리 불가 → 전액 부채 → 행사 시 채권 → 자본 전환\n\n[Non-detachable 행사 시 분개]\n행사된 비율만큼 부채 제거:\nDr. Bonds Payable (행사 비율만큼)\n    Cr. Common Stock\n    Cr. APIC\n부분 행사 가능 → 행사된 워런트 비율만큼만 전환, 나머지는 만기까지 부채 유지\n\n[No par C/S 처리]\nPar value C/S: Dr. Cash → Cr. C/S(par) + Cr. APIC(초과분)\nNo par C/S: Dr. Cash → Cr. Common Stock 전액 (APIC 구분 없음)",
    trigger: '"detachable stock warrants" → 총 발행액에서 Warrant FV 차감\n"fair value of $X per warrant" × 개수 → APIC-Warrants\n"long-term debt increase" → 총액 − Warrant FV\n행사가($12) → 발행 시점 무관, 행사 시점에만 사용',
    trap: "전액 부채(C): Warrant $200K 배분 없이 $4,040,000 전액 → 가장 흔한 오류\nFace 그대로(A): 발행가 101% + Warrant 둘 다 무시\nWarrant 가산(D): $4M + $200K → 의미 없는 계산\n공통 함정: Convertible bond(전액 부채) 논리 적용 → Detachable은 반드시 분리 배분",
    one_sentence: "Detachable warrant = FV만큼 APIC 배분; 채권 CV = 총 발행액 − Warrant FV; 상각도 이 CV 기준.",
    speed: "① 총 발행액: $4M × 101% = $4,040,000\n② Warrant FV: 200,000 × $1 = $200,000 → APIC\n③ 채권 CV: $4,040,000 − $200,000 = $3,840,000\n④ 상각 기준: $3,840,000 → $4,000,000",
    example: "Face $4M / 101 발행 / Warrant 200,000개 × $1\n총액 $4,040,000 − $200,000 = $3,840,000\nDr. Cash $4,040,000\n    Cr. Bonds Payable $3,840,000\n    Cr. APIC-Warrants $200,000",
    context_background: "[왜 Warrant 붙여서 발행하는가 — 자금조달 전략]\nWarrant = 투자자에게 주는 인센티브(나중에 주식을 싸게 살 권리).\n덕분에 발행자는 더 낮은 쿠폰율로 자금 조달 가능.\n대신 Warrant 행사 시 기존 주주 지분 희석 위험 감수.\n→ 현재 이자 부담 ↓ vs 미래 지분 희석 위험 ↑ 트레이드오프.\n\n[받은 돈 안에서 나누는 구조]\n투자자는 $4,040,000 하나만 납입 (추가 납입 없음).\n그 안에 채권 값 + Warrant 값이 섞여있으므로 FV 기준 분리.\n편의점 세트 상품을 개별 원가로 나누는 것과 동일 논리.\n\n[겉보기 Premium vs 실질 Discount]\n발행가 101 = 표면상 Premium.\n그러나 Warrant $200K 배분 후 채권 CV = $3,840,000 < Face $4,000,000.\n→ 채권 자체로는 Discount 발행 효과.\n→ 낮은 금리로 조달한 대가가 여기서 나타남.\n\n[상각 기준 CV]\n만기까지 $3,840,000 → $4,000,000으로 Discount 상각.\nWarrant는 APIC-Warrants에서 별도 관리.\n행사 시: Dr. Cash(행사가 × 주수) / Cr. CS / Cr. APIC → Warrant 가치 추가 인식.\n\n[Warrant vs Stock Options — 구조 비교]\n공통점: 둘 다 TSM(Treasury Stock Method) 적용 / In the money → Dilutive → WASO 증가\n차이점:\n  Warrant    → 외부 투자자 대상 / 자금 조달 목적 / 발행 시 APIC 직접 인식(비용 아님)\n  Stock Option → 임직원 보상 목적 / 발행 시 Compensation Expense + APIC 인식\n\n[In the money 개념]\n시장가 > 행사가 → In the money → 행사하면 이득 → Dilutive\n시장가 < 행사가 → Out of the money → 행사하면 손해 → 아무도 안 함 → Antidilutive → 제외\n시장가 = 행사가 → At the money → TSM 순증가 = 0\n\n[TSM 적용 시 WASO 증가 이유]\n① 워런트 행사 가정 → 신주 발행 → WASO 증가\n② 받은 현금(행사가)으로 시장가에 자사주 매입 가정 → WASO 감소\n③ 순증가 = 발행 주식수 − 자사주 매입 주식수 = 항상 양수(In the money 조건)\n→ 시장가 > 행사가이면 받은 돈으로 살 수 있는 주식 < 새로 발행한 주식 → 순증가 항상 양수\n→ WASO 증가 → Diluted EPS 분모 증가 → EPS 감소",
  },

  // [BOND_026] Callable Bond — Issuer Option, Refinancing Logic, Rate Relationship
  // RULE    : callable = issuer 옵션 / 금리 하락 → call 가능성 ↑ / call price = premium to par
  // TRIGGER : "callable bond" + "interest rates" + "rate of return" + "call price"
  // TRAP    : bondholder 옵션 착각 / 금리 하락 = call 감소 착각 / call price = discount 착각
  {
    topic_id: "BOND_026",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Callable bond — issuer option, refinancing logic, and rate relationship",
    rule: "Callable bond 핵심 4가지:\n① 옵션 보유자: 발행사(issuer) — 채권자(bondholder) 아님\n② 금리 하락 → call 가능성 증가: 낮은 금리로 재발행(refinancing) 유리\n③ 채권자 요구수익률: callable은 채권자에게 불리 → 더 높은 yield 요구 (reinvestment risk 보상)\n④ Call price: 액면가보다 높게(premium to par) 설정 — 채권자 조기상환 보상",
    trigger: "'callable bond' → issuer 옵션 확정 / bondholder 옵션 → puttable bond 'interest rates move lower' → call 가능성 증가 → refinancing 논리 'rate of return' + callable → higher yield 요구 'call price' → premium to par",
    trap: "A(lower rate of return): callable = 채권자 불리 → higher yield 요구. lower는 반대 C(bondholder option): callable = issuer 옵션 / puttable = bondholder 옵션 D(discount to par): call price = premium to par. 채권자 보상이므로 액면가보다 높음 금리 하락 = bond 시장가격 상승과 혼동: 시장가격 반비례는 별개 개념",
    one_sentence: "금리 하락 → 발행사 call 가능성 ↑(refinancing 유리) / callable = issuer 옵션 / call price = premium.",
    speed: "금리 ↓ → 발행사 refinancing 유리 → call ↑ → B / callable = issuer 옵션(puttable 아님) / call price = premium",
    context_background: "[두 개념 분리]\n개념1 — 채권 시장가격 ↔ 금리 반비례:\n시장금리 ↓ → 기존 채권 시장가격 ↑ (투자자 입장)\n시장금리 ↑ → 기존 채권 시장가격 ↓\n이건 채권을 시장에서 사고팔 때 적용되는 가격 변동 원리.\n\n개념2 — Callable bond refinancing 논리:\n시장금리 ↓ → 발행사: '지금 3%로 새 채권 발행 가능한데 기존 채권 이자율 6% → 손해'\n→ 기존 채권 call(조기상환) → 낮은 금리로 재발행 → 이자 비용 절감\n이건 발행사가 채권을 운용할 때 적용되는 의사결정 원리.\n\n[두 개념의 관계]\n같은 '금리 하락' 사건에서:\n투자자 입장 → 보유 채권 가격 올라서 좋음\n발행사 입장 → call해서 싸게 재발행하고 싶음 → 투자자에겐 불리\n→ callable bond는 처음부터 투자자가 더 높은 yield를 요구하는 이유\n\n[Call price = premium 이유]\n발행사가 채권을 조기 상환하면 채권자는 예상보다 일찍 원금을 받고\n낮아진 금리로 재투자해야 함(reinvestment risk).\n이 불이익을 보상하기 위해 call price = 액면가 + premium으로 설정.",
  },

  // [BOND_025] Liability Borrowing Structures — Note, Bond, Zero Coupon, Lease: BV Direction
  // RULE    : ①③ 중간 현금 없음 → BV 상승 / ②④ 매기 지급 → BV 하락 / 이자 = 기초 BV × 이자율
  // TRIGGER : "zero coupon" → coupon 0% / 할인발행 / "compounded+at maturity" → 복리Note / BV↑
  // TRAP    : Zero coupon = 이자 없음 착각 / Discount 상각 = BV↓ 착각 / Operating lease 이자 분리
  {
    topic_id: "BOND_025",
    book_id: 'IA',
    chapter_id: 'IA_CH12',
    topic_group: 'IA_CH12_LTL',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Liability borrowing structures — Note / Bond / Zero Coupon / Lease: BV direction",
    rule: "4가지 차입 구조 비교:\n\n[공통 원리]\n이자 = 기초 BV × 이자율 (모두 동일)\nPV로 최초 인식\n\n[BV 상승 그룹 — 중간 현금 없음]\n① Note payable (복리)\n  → 이자 만기 일괄 지급\n  → 안 낸 이자 → 원금에 가산 → 다음 기 기준↑\n  → BV 상승\n\n③ Zero coupon bond\n  → coupon rate = 0% (중간 이자 현금 없음)\n  → 할인 발행 → discount 상각 → BV 상승\n  → 만기에 액면가 일괄 지급\n  → ① 복리 Note와 구조 동일\n\n[BV 하락 그룹 — 매기 지급]\n② Bond payable\n  → 매기 coupon 현금 지급\n  → Par: BV 변동 없음\n  → Discount: BV 상승 (만기 액면 수렴)\n  → Premium: BV 하락 (만기 액면 수렴)\n\n④ Lease liability\n  → Finance lease: 매기 리스료 = 원금+이자 / BV 하락\n  → Operating lease: 단순 임차료 expense / 이자/원금 구분 없음",
    trigger: '"zero coupon" → coupon 0% / 할인 발행 / 만기 액면가 / discount 상각 = 이자\n"compounded annually + payable at maturity" → 복리 Note → 이자 원금 가산 → BV 상승\n"bond discount/premium" → 매기 coupon 지급 / 만기 액면 수렴\n"finance lease" → 원금+이자 분리 / "operating lease" → 단순 임차료',
    trap: "Zero coupon을 이자 없는 채권으로 착각: 이자는 있음 — discount 상각이 이자 / 현금만 없음\n복리 Note를 단순이자와 혼동: 복리는 이자가 원금에 가산 → 다음 기 기준 증가\nBond discount 상각이 BV 감소: discount 상각 → BV 증가 (면가 수렴 방향)\nOperating lease에서 이자/원금 분리: operating lease는 단순 Lease expense",
    one_sentence: "①③ 중간 현금 없음 → BV 상승 / ②④ 매기 지급 → BV 하락 / 이자 = 기초 BV × 이자율 공통.",
    speed: "Zero coupon = coupon 0% + 할인발행 + 만기액면 = 복리Note 구조\nBond disc → BV↑(액면수렴) / prem → BV↓(액면수렴)\nFinance lease → 원금+이자 / Operating → 단순expense",
    context_background: "[Zero Coupon Bond 상세]\nCoupon(이자) = 0% → 중간에 현금 이자 지급 없음\n처음에 액면가보다 훨씬 싸게 발행 (그 할인액 = 사실상 이자)\n매기 discount 상각 → 이자수익/이자비용 인식 + BV 증가\n만기에 액면가 현금 지급\n\n예: 3년 만기 $1,000 zero coupon, 발행가 $750\nY1: BV $750 → 이자 인식 → BV 상승\nY2: BV 상승분 → 이자 인식 → BV 추가 상승\nY3: BV $1,000 → 만기 $1,000 지급\n\n[복리 Note와 비교]\n구조 완전 동일\n차이: Zero coupon은 채권(bond) 형태 / 복리 Note는 차용증(note) 형태\n\n[Bond Discount vs Premium BV 방향]\nDiscount 발행: 취득가 < 액면 → 매기 상각 → BV 상승 → 만기 액면 수렴\nPremium 발행: 취득가 > 액면 → 매기 상각 → BV 하락 → 만기 액면 수렴\n둘 다 결국 만기엔 액면가로 수렴\n\n[Finance vs Operating Lease]\nFinance: ROU 자산 감가상각 + 리스부채 이자/원금 분리\nOperating: ROU 자산 감가상각 없음 + 단순 Lease expense 인식",
    example: "Zero coupon: Face $1,000 / 발행가 $750 / 3년\nY1: BV $750 × 이자율 = 이자비용 / BV 상승\nY3: BV $1,000 → 만기 지급\n\nBond discount: Face $1,000 / 발행가 $950 / 5년\n매기 coupon 현금 지급 + discount 상각 → BV $950→$1,000",
  },

  // [BOND_023] Bond Investment Interest Income — Discount Amortization
  // RULE    : Interest income = Stated interest + Discount amortization
  //           Straight-line: 균등 / Effective interest: 장부가 × 유효이자율 (매년 증가)
  // TRIGGER : "straight-line" → 균등 / "effective interest" → 매년 증가
  // TRAP    : 취득가 × 쿠폰율(A) / Stated interest만(C) / FV변동 포함
  {
    topic_id: "BOND_023",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond investment interest income — straight-line vs effective interest discount amortization",
    rule: "Interest income = Stated interest + Discount amortization\n\nStated interest = Face × coupon rate (매년 현금 수령)\nDiscount amortization:\n  Straight-line: Discount ÷ 만기년수 → 매년 균등\n  Effective interest: 장부가 × 유효이자율 → 매년 증가 (GAAP 원칙)\n\nTrading security FV 변동 → Unrealized G/L, 이자수익 계산과 무관.",
    trigger: '"paid $X / face value $Y" → Discount = Y − X\n"straight-line method" → Discount ÷ 만기 = 균등\n"effective interest method" → 장부가 × 유효이자율, 매년 증가\n"trading security" + "fair value" → FV변동은 별도, 이자수익 무관',
    trap: "취득가 × 쿠폰율 → 쿠폰율은 액면(face value)에 적용.\nStated interest만 계산 → discount amortization 누락.\nStraight-line과 effective interest 혼동 → straight-line 명시 시 균등, effective 명시 시 매년 증가.\nFV 변동을 이자수익에 포함 → Trading FV변동은 Unrealized G/L.",
    one_sentence: "Interest income = Face × coupon rate + Discount amortization | Straight-line = 균등 | Effective = 장부가 × 유효이자율(매년 증가)",
    speed: "① Discount = Face − Purchase price\n② Straight-line: ÷ 만기년수 = 균등\n③ Interest income = Face × coupon% + amortization\n④ FV변동 → 무시",
    example: "Face $150,000 / 취득가 $138,000 / 쿠폰 5% / 10년 / Straight-line\nDiscount = $12,000 / 상각 = $1,200/년\nInterest income = $7,500 + $1,200 = $8,700\n\n[Effective interest 비교]\nYear 1: $138,000 × 유효율 = $8,700+α\nYear 2: $139,200 × 유효율 = 더 큰 값\n→ 매년 장부가 올라가면서 이자수익도 증가",
    key_formula: "Interest income = Face × coupon rate + Discount amortization\nStraight-line amortization = Discount ÷ 만기년수\nEffective interest amortization = 장부가 × 유효이자율 − Stated interest",
    context_background: "[할인 취득 채권 경제적 실질]\n쿠폰율 < 시장금리 → 채권가격 하락 → 할인 취득\nDiscount = 낮은 쿠폰을 만기 차익으로 보상하는 구조\n총 이자수익 = 쿠폰 합계 + Discount = 총 수령 − 투자금\n\n[상각 방법 비교]\nStraight-line: 균등 분할. 간단하지만 비정확. 중요하지 않을 때만 GAAP 허용.\nEffective interest: 장부가 × 유효이자율. 매년 증가(discount). 경제적 실질 반영. GAAP 원칙.\n\n[Trading security FV변동]\n이자수익과 완전히 별개.\nFV 변동 → Dr. Investment / Cr. Unrealized Gain (I/S)\n이자수익 계산에 FV 포함 시 오답.",
  },

  // [BOND_027] Bond Issuance Price — PV Calculation (Premium/Discount)
  // RULE    : 발행가 = 이자 PV(ordinary annuity) + 원금 PV(lump sum) / 시장금리 factor만 사용
  // TRIGGER : "sold to yield X%" + PV factor 두 컬럼 제공
  // TRAP    : 쿠폰금리 factor 사용 / 원금만 PV / annuity due factor 사용 / 액면가 그대로
  {
    topic_id: "BOND_027",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond issuance price — PV of interest (ordinary annuity) + PV of principal",
    rule: "발행가 = 이자 PV + 원금 PV\n① 이자 PV = 액면 × 쿠폰율 × ordinary annuity factor(시장금리)\n② 원금 PV = 액면 × PV of $1 factor(시장금리)\n③ 항상 시장금리(yield) factor 사용 — 쿠폰금리 factor는 함정\n\nPremium/Discount 판단 (선지 필터용):\nyield < coupon → premium → 발행가 > 액면가 → 액면가 선지 제거\nyield > coupon → discount → 발행가 < 액면가\nyield = coupon → 발행가 = 액면가\n\nOrdinary vs Annuity due:\n별도 언급 없음 → ordinary annuity (기간 말 지급, 디폴트)\n'in advance' / 'at the beginning' / 'annuity due' → annuity due",
    trigger: "'sold to yield X%' → PV 계산 시 X% factor만 사용 PV factor 두 컬럼(쿠폰율/시장금리) 제공 → 시장금리 컬럼만 선택 'pays interest annually/semi-annually' + 별도 언급 없음 → ordinary annuity yield < coupon → premium 확정 → 액면가 선지 즉시 제거",
    trap: "쿠폰금리(8%) factor 사용 → 시장금리(7%)로 할인해야 함 원금만 PV 계산 → 이자도 미래 현금흐름 → 둘 다 PV 필수 annuity due factor 사용 → 'pays annually' = 기간 말 = ordinary annuity 디폴트 D($500,000 액면가) → yield ≠ coupon이면 발행가 ≠ 액면가 premium 개념만으로 정확한 발행가 산출 불가 → 선지 필터링 용도, 정답은 PV 계산으로 확정",
    one_sentence: "발행가 = 이자×ordinary annuity factor(시장금리) + 원금×PV factor(시장금리); 쿠폰금리 factor는 함정.",
    key_formula: "Issue price = (Face × coupon%) × PV annuity factor(yield) + Face × PV factor(yield)",
    example: "$500,000 × 8% = $40,000 이자 / yield 7% $40,000 × 4.100197 + $500,000 × 0.712986 = $164,008 + $356,493 = $520,501",
    speed: "① yield < coupon → premium → 액면가 선지 제거 ② 시장금리 factor 선택 ③ 이자 × annuity factor + 원금 × PV factor",
    context_background: "[왜 이자와 원금 둘 다 PV 하는가]\n채권 투자자가 받게 되는 현금은 두 종류:\n매년 이자 $40,000 × 5회 → 연금(annuity) PV\n만기 원금 $500,000 × 1회 → 단일금액(lump sum) PV\n둘 다 미래에 받을 돈 → 둘 다 현재가치로 할인 필수.\n발행가 = 투자자가 지불할 의향이 있는 금액 = 미래 현금흐름 전체의 PV.\n\n[시장금리 factor를 쓰는 이유]\n발행가는 '시장 참여자들이 요구하는 수익률(yield)'로 할인.\n쿠폰금리는 이자 계산에만 사용 — PV 할인율 아님.\n\n[Ordinary annuity 디폴트 원칙]\n'별도 언급 없음 = 기간 말 지급 = ordinary annuity'\n실생활: 월급도 일한 달이 끝나고 받음 (선지급 아님)\n채권 이자도 동일 논리.\nin advance / at the beginning / annuity due 중 하나 명시 시에만 annuity due 사용.\n\n[Premium 개념의 역할]\nPremium = 선지 필터링 도구 (액면가 선지 제거)\n정확한 발행가 = PV 계산으로만 확정 가능.",
  },

  // [BOND_028] Premium Bond — Failure to Amortize: Effect on CV & Interest Expense
  // RULE    : 상각 누락 → Premium 잔액 유지 → CV Overstate → Interest Expense(=CV×market rate) Overstate
  // TRIGGER : "neglected to amortize" / "failure to record premium amortization" → CV + Interest Expense 둘 다 Overstate
  // TRAP    : 발행자(issuer) 시점 혼동 / Interest Expense만 Overstate라고 생각 / CV는 Understate라고 혼동
  {
    topic_id: "BOND_028",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Premium Bond: What happens if amortization is skipped?",
    rule: "Premium 상각 분개: Dr. Interest Expense + Dr. Premium on Bonds Payable / Cr. Cash\n상각을 하면: Premium 감소 → CV 감소 → Interest Expense 감소 (세 항목 동시)\n상각을 안 하면: Premium 잔액 유지 → CV Overstate → Interest Expense(= CV × market rate) Overstate\n→ CV와 Interest Expense는 항상 같은 방향으로 움직임",
    trigger: "'neglected to amortize' / 'failure to record premium amortization' → CV + Interest Expense 둘 다 Overstate\n'premium on bonds payable' + 'carrying value effect' → 상각 방향 확인\n'interest expense and carrying value, respectively' → 두 항목 동시 판단",
    trap: "① 발행자(issuer) 시점 혼동 — '프리미엄 = 비싸게 발행해서 더 받은 돈 = 부채' 시점 유지\n② Interest Expense만 Overstate, CV는 정상이라고 혼동\n③ CV는 Understate된다고 혼동 — 상각 안 하면 Premium 잔액이 그대로 → CV 높게 유지\n④ Overstate/Understate 방향: 상각 안 함 → 줄어야 할 게 안 줄음 → 둘 다 Overstate",
    one_sentence: "Premium 상각 누락 → CV Overstate → Interest Expense(=CV×market rate) Overstate → 둘 다 Overstate.",
    speed: "Premium 상각 안 함 → CV 못 줄임 → Interest Expense도 못 줄임 → 둘 다 Overstate → D",
    context_background: "[프리미엄 채권 발행자 구조]\n프리미엄 채권 = 쿠폰금리 > 시장금리 → 투자자들이 웃돈을 얹어 매입 → 발행자는 액면 초과금액 수령\n이 초과금액(Premium)은 부채(liability)로 인식 → 매기 상각해서 만기에 액면가로 수렴\n\n[상각 분개]\nDr. Interest Expense    (CV × market rate, 작은 금액)\nDr. Premium on Bonds Payable  (상각액)\n    Cr. Cash             (액면 × 쿠폰율, 큰 금액)\n\n상각액 = Cash - Interest Expense = 쿠폰이자 - 유효이자\n\n[상각 누락 시 연쇄 효과]\n① Premium 잔액 유지 → ② CV(= 액면 + 미상각 Premium) Overstate → ③ 다음 기 Interest Expense(= CV × market rate) Overstate\n→ CV와 Interest Expense는 항상 같은 방향\n\n[발행자 vs 투자자 시점 비교]\n발행자: 프리미엄 = 비싸게 팔아서 더 받은 돈 → 부채 증가 → 상각하면 CV 감소\n투자자: 프리미엄 = 비싸게 사서 더 준 돈 → 자산 감소 방향 (이 문제와 무관)",
  },

  // [BOND_029] Non-detachable Warrant — Full Liability, Conversion to Equity at Exercise
  // RULE    : Non-detachable → 전액 부채 / 행사 시 채권 → 자본 전환 / 부분 행사 가능
  // TRIGGER : "non-detachable" / "detachable" 없음 → 전액 Bonds Payable
  // TRAP    : Detachable 로직(APIC 선인식) 적용 오류 / 전액 전환 가정 — 부분 행사 가능
  {
    topic_id: "BOND_029",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Non-detachable Warrant vs Detachable — Liability Recognition and Conversion Timing",
    rule: "Detachable: 채권과 분리 거래 가능 → 발행 시 Warrant FV만큼 APIC 선인식\nNon-detachable: 채권과 항상 같이 움직임 → 분리 불가 → 전액 Bonds Payable\n\n[발행 시 비교]\nDetachable:     Dr. Cash / Cr. Bonds Payable(차감) + Cr. APIC-Warrants\nNon-detachable: Dr. Cash / Cr. Bonds Payable(전액)\n\n[행사 시 비교]\nDetachable:     Dr. Cash(행사가) + Dr. APIC-Warrants / Cr. C/S + Cr. APIC-C/S\nNon-detachable: Dr. Bonds Payable / Cr. C/S + Cr. APIC (부채 → 자본 전환)\n\n[부분 행사]\n전체 워런트 중 일부만 행사 가능\n→ 행사된 비율만큼 Bonds Payable 제거\n→ 나머지는 만기까지 부채 유지 후 현금 상환",
    trigger: "'detachable' 없음 → Non-detachable → 전액 Bonds Payable\n'non-detachable' 명시 → APIC 배분 없음\n행사 시 → Bonds Payable 제거 → C/S + APIC 인식\n'partial exercise' → 행사 비율만큼만 전환",
    trap: "Detachable 로직 적용 → APIC 선인식 오류 (Non-detachable은 전액 부채)\n전액 전환 가정 → 부분 행사 가능, 나머지는 만기 상환\n자본 인식 시점 혼동: Detachable = 발행 시 / Non-detachable = 행사 시",
    one_sentence: "Non-detachable = 채권과 운명 공동체 → 전액 부채 → 행사 시에만 자본 전환; 부분 행사 가능.",
    speed: "'detachable' 단어 없음 → 전액 Bonds Payable → 행사 시 Dr. Bonds Payable / Cr. C/S + APIC",
    context_background: "[이름에 답이 있다]\nDetachable = de(분리) + tachable(붙다) → 떼어낼 수 있다 → 독립 거래 가능 → 발행 시 분리 인식\nNon-detachable = 떼어낼 수 없다 → 채권 없으면 워런트도 없음 → 채권 전환 시 같이 자본으로\n\n[자본 인식 타이밍 차이]\nDetachable:     발행 시 APIC 선인식 → 행사 시 APIC-Warrants → C/S + APIC-C/S 재분류\nNon-detachable: 발행 시 전액 부채 → 행사 시 부채 → 자본 전환\n최종 결과는 동일, 인식 타이밍만 다름\n\n[No par C/S 행사 시]\nPar value: Dr. Bonds Payable / Cr. C/S(par) + Cr. APIC(초과분)\nNo par:    Dr. Bonds Payable / Cr. Common Stock 전액 (APIC 구분 없음)\n\n[EPS 연결]\n워런트(Detachable/Non-detachable 모두) → In the money → TSM 적용 → WASO 증가 → Dilutive\nIn the money = 시장가 > 행사가 → 행사하면 이득 → 행사 가정\nOut of the money = 시장가 < 행사가 → 아무도 안 함 → Antidilutive → 제외",
  },

  // [BOND_024] Bond Issuance Between Interest Dates — Accrued Interest
  // RULE    : 총 수령액 = 발행가 + 경과이자(액면×연이율×경과월/12)
  // TRIGGER : "bonds dated [date]" + "issued [later date]" → 경과이자 발생
  // TRAP    : 경과이자 누락($970K) / 6개월치 전액($1,050K)
  {
    topic_id: "BOND_024",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond issued between interest dates — total cash = issue price + accrued interest",
    rule: "이자 지급일 사이 발행:\n총 수령액 = 발행가 + 경과이자\n\n발행가 = 액면 × 발행가율(%)\n경과이자 = 액면 × 연이율 × 경과월/12\n경과월 = 채권 표시일(dated) ~ 실제 발행일\n\n다음 이자 지급일에 발행자가 전체 기간 이자 지급\n→ 경과이자는 발행 시 미리 수령 후 지급일에 돌려주는 구조",
    trigger: '"bonds dated [date]" + "issued [later date]" → 경과이자 발생\n"pays interest semiannually on [X] and [Y]" → 직전 지급일 확인\n총 수령액 = 발행가 + 경과이자',
    trap: "경과이자 누락 → 발행가만 계산($970K).\n6개월치 이자 전액 포함 → 경과월만큼만 계산.\n발행가율 미적용 → 액면가로 계산.",
    one_sentence: "총 수령액 = 발행가 + 경과이자 | 경과이자 = 액면×연이율×경과월/12",
    speed: "발행가 $970K + 경과이자 $25K(3/12) = $995K",
    example: "액면 $1,000,000 / 쿠폰 10% / 97 발행 / 표시일 1/1 / 발행일 4/1\n발행가: $1,000,000 × 97% = $970,000\n경과이자: $1,000,000 × 10% × 3/12 = $25,000\n총 수령액: $995,000",
    key_formula: "총 수령액 = 액면 × 발행가율 + 액면 × 연이율 × 경과월/12",
    context_background: "[경과이자 경제적 실질]\n7/1 이자 지급일에 발행자가 6개월치($50,000) 전액 지급.\n투자자는 4/1부터 보유(3개월)이므로 1/1~4/1 3개월치를 발행 시 미리 지급.\n발행자: 발행 시 $25,000 수령 → 7/1에 $50,000 지급 (순 이자비용 3개월치)\n\n[발행자 분개]\n4/1 발행 시:\nDr. Cash $995,000\n  Cr. Bonds Payable $970,000\n  Cr. Interest Payable $25,000\n\n7/1 이자 지급:\nDr. Interest Payable $25,000\nDr. Interest Expense $25,000\n  Cr. Cash $50,000",
  },

  // [BOND_030] Bond Discount CV at Interim Date — Effective Interest Method, m/12 Adjustment
  // RULE    : CV = 발행가 + 누적 상각액 / 연간 상각액 먼저 계산 → ×m/12 / B/S = CV (net), face value 아님
  // TRIGGER : "balance sheet" + discount bond → CV로 답 / interim date(6/30 등) → ×m/12
  // TRAP    : face value $500,000 그대로 = B/P 장부기록용 / B/S 표시는 CV / SL법 적용 오류
  {
    topic_id: "BOND_030",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond discount CV at interim date — effective interest method with m/12 adjustment",
    rule: "【풀이 순서 — 권장 방식】\n① 연간 상각액 계산\n   Interest Expense = 발행가(CV) × 유효이자율\n   Cash = 액면 × 쿠폰율\n   연간 상각액 = Interest Expense − Cash\n② interim date 조정\n   상각액 × m/12\n③ CV 계산\n   CV = 발행가 + 상각액(×m/12)\n\n【B/S 표시 원칙】\n분개 장부: Bonds Payable = $500,000 (face)\nB/S 표시: Bonds Payable = CV = face − unamortized discount\n→ 'on the balance sheet' 문구 보이면 항상 CV로 답",
    trigger: "'on the balance sheet' + discount bond → CV (face value 아님)\n'June 30 balance sheet' + 'interest payable annually on December 31' → ×½ 적용\n'effective interest method' → CV × 유효이자율로 이자비용 계산\n'bonds payable' 금액 질문 → 장부기록(face) vs B/S표시(CV) 구분",
    trap: "face value $500,000 그대로 → 장부기록용, B/S 표시 아님\nSL법 적용 → effective interest method 명시 시 사용 금지\n연간 상각액을 그대로 사용 → interim date면 반드시 ×m/12\n'Bonds Payable = face value' 혼동:\n→ 발행 시 분개에서 Bonds Payable = $500,000으로 기록하지만\n→ B/S 표시는 항상 CV = face − unamortized discount",
    one_sentence: "B/S Bonds Payable = CV = 발행가 + 누적상각액 / 연간상각액 먼저 계산 후 ×m/12.",
    key_formula: "연간상각액 = (발행가 × 유효이자율) − (액면 × 쿠폰율)\nCV = 발행가 + 상각액 × m/12",
    example: "액면 $500,000 / 발행가 $469,500 / 쿠폰 9% / 유효이자율 10% / 이자 연 1회(12/31)\nJune 30 B/S 기준:\n① 연간상각액 = ($469,500×10%) − ($500,000×9%) = $1,950\n② ×½ = $975\n③ CV = $469,500 + $975 = $470,475 → Bonds Payable on B/S",
    speed: "'on the balance sheet' → CV / interim date → ×m/12\n연간상각액 먼저 → ×m/12 → 발행가에 가산",
    context_background: "[Bonds Payable 두 가지 얼굴]\n발행 시 분개:\nDr. Cash              $469,500\nDr. Discount on B/P    $30,500\n    Cr. Bonds Payable            $500,000 ← 장부기록 = face value\n\nB/S 표시:\nBonds Payable (net)  $470,475 ← CV\n\n→ 장부에는 $500,000으로 기록하지만 B/S에는 CV만 표시\n\n[Discount 상각 방향]\nDiscount: CV 발행가 → 만기 face로 증가 (매기 +)\nPremium: CV 발행가 → 만기 face로 감소 (매기 −)\n\n[Interim date 주의]\n이자 지급 연 1회(12/31) + B/S 6/30 → ×½\n이자 지급 반기(6/30, 12/31) + B/S 6/30 → ×1",
  },

  // [BOND_031] Bond Question Type → Speed Guide (6 Types)
  // RULE    : 질문 유형 키워드 → 즉각 풀이 로직 발동
  // TRIGGER : "on the balance sheet" / "interest expense" / "cash paid" / "carrying value at" / "gain or loss" / issuer vs investor
  // TRAP    : B/S = face value / interest expense = face × coupon / CV 계산 없이 gain/loss 계산
  {
    topic_id: "BOND_031",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'concept',
    card_name: "Bond question type → speed guide: 6 question patterns and immediate solve logic",
    rule: "【질문 유형별 즉각 풀이 로직】\n\n① 'Bonds payable on the balance sheet'\n   → CV = Face ± unamortized prem/disc (never face value alone)\n\n② 'Interest expense for the period'\n   → Beginning CV × market rate × m/12\n\n③ 'Cash paid for interest'\n   → Face × coupon rate × m/12 (fixed, CV irrelevant)\n\n④ 'Carrying value at [interim date]'\n   → Step 1: annual amort = (CV × market rate) − (Face × coupon rate)\n   → Step 2: × m/12\n   → Step 3: CV = issue price + amort (discount) or − amort (premium)\n\n⑤ 'Gain or loss on early retirement'\n   → Step 1: CV at retirement date (issue price ± accumulated amort)\n   → Step 2: Gain/Loss = CV − reacquisition price\n   → Loss if reacquisition > CV / Gain if reacquisition < CV\n\n⑥ 'Issuer vs investor?'\n   → Issuer: Bonds Payable / Interest Expense / Gain/Loss on retirement\n   → Investor: Bond Investment / Interest Income / Gain/Loss on sale",
    trigger: "'on the balance sheet' → ① CV 계산\n'interest expense' → ② Beginning CV × market rate\n'cash paid' / 'cash interest' → ③ Face × coupon rate (CV 무관)\n'carrying value at June 30' / interim date → ④ 연간상각액 → ×m/12\n'gain' / 'loss' + 'retire' / 'redeem' → ⑤ CV 먼저 계산\n'issued' / 'borrowed' → issuer 관점 / 'purchased' / 'invested' → investor 관점",
    trap: "① B/S = face value → 절대 오답, 항상 CV\n② interest expense = face × coupon rate → SL 혼동, beginning CV × market rate\n③ cash paid를 CV 기준으로 계산 → face × coupon rate 고정\n④ interim date에 연간 상각액 그대로 사용 → 반드시 ×m/12\n⑤ gain/loss = reacquisition − face → CV 계산 생략 오류",
    one_sentence: "질문 첫 줄에서 유형 파악 → 해당 공식 즉시 발동 → 숫자 대입.",
    speed: "B/S → CV / Interest exp → BegCV×market / Cash → Face×coupon / Interim CV → 연간상각×m/12 / Retire → CV−재취득가",
    context_background: "[왜 6가지를 구분해야 하나]\nBond 문제는 동일한 숫자 세트(face, coupon, market, issue price)로\n전혀 다른 것을 물어볼 수 있음.\n\n같은 문제에서:\n'interest expense' → BegCV × market rate\n'cash paid' → Face × coupon rate\n'bonds payable on B/S' → CV (net)\n→ 질문 유형 파악이 계산보다 먼저\n\n[Issuer vs Investor 구분]\nIssuer(발행자): 돈을 빌린 쪽\n→ Bonds Payable(부채) / Interest Expense(비용) 인식\nInvestor(투자자): 돈을 빌려준 쪽\n→ Bond Investment(자산) / Interest Income(수익) 인식\n→ 문제에 'issued' → issuer / 'purchased' → investor",
  },

  // [TDR_001] TDR — Asset Transfer: two separate gains/losses (debtor perspective)
  // RULE    : ①자산 재평가 (Ordinary gain/loss) = 자산 CA − 자산 FV ②구조조정 이익 (Restructuring gain) = 부채 CA − 자산 FV
  // TRIGGER : 'gain on restructuring of payables' → 부채 CA − 자산 FV / 'loss on transfer of asset' → 자산 CA − 자산 FV
  // TRAP    : ② 계산 시 자산 FV 대신 자산 CA 사용 → 오답 / 두 손익 합산 금지 → 항상 별도 인식
  {
    topic_id: "TDR_001",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_TDR',
    sub_category_id: "U4_TROUBLED_DEBT",
    card_type: 'calculation',
    card_name: "TDR — Asset Transfer: two separate gains/losses (debtor perspective)",
    rule: "TDR Asset Transfer 시 채무자(debtor)는 두 가지 손익을 별도 인식:\n①자산 재평가 (Ordinary gain/loss) = 자산 CA − 자산 FV\n  CA > FV → ordinary loss / CA < FV → ordinary gain\n②구조조정 이익 (Restructuring gain) = 부채 CA − 자산 FV\n  시험에서 사실상 항상 gain\n문제가 'gain on restructuring'을 물으면 → ②만 계산\n'loss on transfer of asset'을 물으면 → ①만 계산",
    trigger: "'gain on restructuring of payables' / 'gain on extinguishment' → 부채 CA − 자산 FV\n'loss on transfer of real estate' / 'loss on disposal' → 자산 CA − 자산 FV\n'troubled debt restructuring' + 'full liquidation' + 자산 3개 숫자 → 두 손익 분리 계산",
    trap: "② 계산 시 자산 FV 대신 자산 CA 사용 → 오답\n두 손익 합산 금지 → I/S에 별도 항목\n채권자 관점 혼동 → 채권자는 gain 없음",
    one_sentence: "Restructuring gain = 부채 CA − 자산 FV / Ordinary loss = 자산 CA − 자산 FV → 항상 별도, 절대 합산 금지",
    example: "부채 CA $150K / 자산 CA $100K / 자산 FV $90K\n① Ordinary loss = $100K − $90K = $(10,000)\n② Restructuring gain = $150K − $90K = $60,000",
    speed: "'restructuring gain' → 부채 CA − 자산 FV\n'loss on transfer' → 자산 CA − 자산 FV\n숫자 3개 보이면 → 질문 방향 먼저 확인",
  },

  // ── IMP ────────────────────────────────────────────────────────────────────
  // [IMP_001] PP&E Impairment — 2-Step Test (Recoverability → Fair Value)
  // RULE    : Indicator → Step 1(Undiscounted CF) → Step 2(FV) 순서 고정
  // TRIGGER : "next step" + triggering indicator 확인 완료 → Step 1 Recoverability test
  // TRAP    : Replacement value(B) 없는 개념 / FV(C) Step 2로 건너뜀 / Undiscounted CF로 write-down(D)
  {
    topic_id: "IMP_001",
    sub_category_id: "U3_PPE",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    card_type: 'calculation',
    card_name: "PP&E Impairment — 2-Step Test: Recoverability → Fair Value",
    one_sentence: "Step 1 = Recoverability(Undiscounted CF vs CV); Step 2 = Measurement(FV vs CV); Loss = CV − FV.",
    rule: "PPE 손상 절차 (Triggering indicator 발생 후):\n\nStep 1 — Recoverability Test\nCV vs Undiscounted Future CF\nCV > Undiscounted CF → 손상 존재 → Step 2\nCV ≤ Undiscounted CF → 손상 없음 → 종료\n\nStep 2 — Measurement\nImpairment Loss = CV − Fair Value\n\n[각 단계 성격]\nStep 1: 내부 사용가치 스크리닝 — '우리 회사가 계속 쓰면 얼마 버나'\nStep 2: 외부 시장 가격 측정 — '시장에서 팔면 얼마나'\n\n[절대 사용 금지]\nReplacement value → PPE 손상에 없는 개념\nUndiscounted CF → Step 1 판단용, write-down 기준 아님",
    trigger: '"next step" + operating losses / triggering indicator 확인 완료 → Step 1 Recoverability test\n"lowest level of identifiable cash flows" → asset group 단위 확정 후 Step 1 시작\n"performing its impairment test" → 절차 순서 묻는 문제 → Step 1 선택',
    trap: "B(Replacement value): PPE 손상 절차에 존재하지 않는 개념\nC(Fair value): Step 2 기준 — Step 1 먼저 통과해야 도달 가능\nD(Expected cash flows로 write-down): Undiscounted CF는 판단용 — 손상액 기준 아님. 장부가를 이 금액으로 줄이면 오류\n공통 함정: Step 1 생략하고 바로 FV로 → PPE/유한 무형자산은 반드시 Step 1 먼저",
    speed: "Triggering indicator 발생?\n→ YES → Step 1: CV vs Undiscounted CF\n   CV > CF → Step 2: Loss = CV − FV\n   CV ≤ CF → 손상 없음\n\n'next step' 질문 + indicator 확인 완료 → 무조건 Step 1(Recoverability)",
    example: "CV $500,000 / Undiscounted CF $450,000 → CV > CF → Step 2\nFV $420,000 → Impairment Loss = $80,000\n\nStep 1: '계속 쓰면 $450K — BV보다 적음 → 못 쓰겠다'\nStep 2: '시장 가격 $420K → 차액 $80K 손실'",
    context_background: "[왜 2단계인가]\nStep 1(Undiscounted CF): 보수적 스크리닝. 할인 없는 명목 현금흐름과 비교 → 이것도 못 미치면 손상 확실. 불확실한 미래 CF에 할인까지 하면 과소 추정 위험 → 일부러 할인 안 함.\nStep 2(Fair Value): 실제 손상액 정밀 측정. 시장이 매기는 가격(observable inputs, principal market) 기준.\n\n[Replacement value가 없는 이유]\nUS GAAP PPE 손상은 '시장에서 팔면 얼마'(FV) 기준 — '새로 사면 얼마'(replacement) 기준 아님.\n\n[Undiscounted CF로 write-down 금지 이유]\nD 선택지 함정: Undiscounted CF = $450K → CV $500K를 $450K로 줄이는 것은 오류.\n손상액 = CV − FV(시장가). CF는 판단용 도구일 뿐.\n\n[indefinite-lived intangible과 차이]\nPPE·유한무형: Indicator → Step 1 → Step 2\nIndefinite-lived(상표권 등): Indicator 불필요, Step 1 생략 → 바로 FV vs CV",
  },
  {
    topic_id: "IMP_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "PP&E impairment — can you reverse under US GAAP",
    rule: "Under US GAAP, impairment losses on PP&E cannot be reversed. No write-up permitted even if fair value subsequently recovers.",
    trigger: "impairment reversal | write-up | US GAAP | recovery | restoration of carrying value\n'held for use' → write-up 절대 불가\n'held for disposal' → write-up 가능 (기존 write-down 한도 내)\n표 형태 문제 → Held for use = No 먼저 확정 → A or B → Held for disposal = Yes → B",
    trap: "Held for use write-up 가능하다고 착각(C/D) → US GAAP 절대 불가\nIFRS와 혼동 → IFRS는 held for use write-up 허용(goodwill 제외)\nHeld for disposal도 불가하다고 착각(A) → 기존 write-down 한도 내 허용",
    speed: "표 문제 → 'Held for use = No' 먼저 확정 → A or B\n→ 'Held for disposal = Yes' → B",
    one_sentence: "US GAAP: once PP&E is written down for impairment, no reversal is permitted.",
    example: "PP&E written down to $420,000 / FV recovers to $480,000 → US GAAP: remain at $420,000",
  },
  {
    topic_id: "IMP_003",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Goodwill impairment — one step test",
    rule: "Compare carrying value of reporting unit (including goodwill) to its fair value. If CV > FV → impairment loss = CV − FV, capped at carrying value of goodwill.",
    trigger: "goodwill impairment | reporting unit | fair value | one-step | carrying value",
    trap: "Impairment loss cannot exceed the carrying value of goodwill in the reporting unit.",
    one_sentence: "Goodwill impairment = reporting unit CV minus its FV, limited to goodwill balance.",
    example: "RU CV $800K (incl. goodwill $200K) / RU FV $700K → Impairment loss $100K (≤ $200K goodwill)",
  },
  {
    topic_id: "IMP_004",
    sub_category_id: "U3_PPE",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    card_type: 'conditional',
    card_name: "Intangible impairment — indefinite vs definite life test comparison",
    one_sentence: "Indefinite-life: annual FV vs BV directly (no Step 1). Definite-life/PPE: indicator-based 2-step test.",
    rule: "Indefinite-lived intangible (incl. Goodwill): tested at least annually regardless of indicators. No Step 1 recoverability test — compare FV vs BV directly. Reason: future cash flows too difficult to estimate. Impairment Loss = BV - FV. Definite-lived intangible / PPE: tested only when indicators present. Step 1: undiscounted future cash flow vs BV. If cash flow < BV → Step 2: FV vs BV → Impairment Loss = BV - FV.",
    trigger: "indefinite life | definite life | annual impairment | indicator | triggering event | intangible | goodwill | no amortization | trade name",
    trap: "Indefinite-life intangibles skip Step 1 entirely — go straight to FV vs BV. Definite-life/PPE requires indicator first, then 2-step. 'No amortization' does not mean 'no review' — annual test is mandatory for indefinite-life.",
    speed: "Indefinite-lived (incl. Goodwill)\n→ 매년 무조건 테스트 (indicator 불필요)\n→ Step 1 없음 → 바로 FV vs BV\n→ FV < BV: Impairment Loss = BV - FV\n이유: 미래 현금흐름 추정 어려움\n\nDefinite-lived / PPE\n→ Indicator 있을 때만 테스트\n→ Step 1: Undiscounted CF vs BV\n   CF < BV → Step 2: FV vs BV\n→ Impairment Loss = BV - FV",
    example: "Trade name (indefinite) BV $500,000 / FV $420,000\n→ Annual test → FV < BV → Impairment Loss $80,000\n\nPPE BV $300,000 / Undiscounted CF $280,000 / FV $250,000\n→ Indicator 발생 → Step 1: $280K < $300K → Step 2\n→ Impairment Loss = $300K - $250K = $50,000",
  },
  {
    topic_id: "IMP_005",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Asset held for sale — how to measure",
    rule: "Classify as held for sale → measure at lower of: (a) carrying value, or (b) fair value less costs to sell. Stop depreciating immediately upon classification.",
    trigger: "held for sale | fair value less costs | classify | stop depreciation | disposal group",
    trap: "Depreciation stops the moment the asset is classified as held for sale.",
    one_sentence: "Held-for-sale assets: lower of CV or (FV minus selling costs); stop depreciating immediately.",
    example: "CV $200,000 / FV $185,000 / selling costs $5,000 → lower of $200K vs $180K → report at $180,000",
  },
  {
    topic_id: "IMP_006",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "CCA impairment — two-step test",
    context_background: "기업이 ERP·HR·회계 같은 클라우드 소프트웨어 도입 시 implementation 비용을 자산으로 capitalize함. 계약 갱신 안 하거나 사업 축소되면 그 자산이 실제로 벌어올 현금이 장부금액보다 적어지는 상황 발생",
    context_trigger: "impairment test 필요",
    rule: "Step 1: Carrying amount > Undiscounted CF → impairment 존재 / Step 2: Fair Value로 write-down (ASC 350-40)",
    rule_title: "CCA impairment 2-step (ASC 350-40)",
    rule_items: [
      "① Carrying amount > Undiscounted CF → impairment 존재",
      "② Fair Value로 write-down",
    ],
    trigger: "'cloud computing arrangement' + 'impairment' 동시 등장",
    trap: "Undiscounted CF를 write-down 금액으로 착각\n→ Step 1 판단용일 뿐, 실제 write-down 기준은 Fair Value",
    speed: "Carrying > Undiscounted CF? → Yes → 정답은 Fair Value 숫자",
  },

  // [IMP_007] Undiscounted FCF vs PV — When to Use Each in FAR
  // RULE    : Undiscounted FCF = PPE Impairment Step 1 + TDR Modification / 나머지 전부 PV
  // TRIGGER : 'recoverability test' → Undiscounted FCF / 'TDR modification gain' → Total FCF(명목)
  // TRAP    : PPE Step 1에서 PV 사용 오류 / TDR에서 PV@modified rate 사용 오류
  {
    topic_id: "IMP_007",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Undiscounted FCF vs PV — When to Use Each in FAR",
    rule: "FAR에서 Undiscounted FCF(할인 없는 명목 총액) 사용 케이스:\n① PPE Impairment Step 1: CV vs Undiscounted FCF → 스크리닝 (Step 2에서 FV/PV 사용)\n② TDR Debt Modification: CA vs Total Future Cash Payments → Gain 인식 여부 판단 (끝까지 PV 없음)\n나머지(Lease, Bond, ARO, Pension, Note 등) → 모두 PV(할인) 사용",
    trigger: "'recoverability test' / 'PPE impairment step 1' → Undiscounted FCF\n'TDR modification' + 'gain on restructuring' → Total FCF 명목 총액 (PV 아님)\n'lease liability' / 'bond issuance' / 'ARO' / 'pension' → PV 사용",
    trap: "PPE Impairment Step 1에서 PV 사용 오류 → Step 1은 스크리닝, PV는 Step 2\nTDR Modification에서 PV@modified rate 사용 오류 → 비정상 rate로 할인하면 Gain 과대계상\nTDR Modification을 끝까지 PV 없이 처리해야 한다는 것 혼동",
    one_sentence: "Undiscounted FCF = PPE Step 1(스크리닝) + TDR Modification(Gain 판단); 나머지 FAR 전부 PV.",
    speed: "Undiscounted FCF 쓰는 경우:\n① PPE Impairment Step 1: CV > Undiscounted FCF? → Yes → Step 2(FV)\n② TDR Modification: CA > Total FCF? → Yes → Gain 인식 (끝)\n\n나머지 → 무조건 PV",
    context_background: "[왜 이 두 케이스만 Undiscounted FCF인가]\n\n■ PPE Impairment Step 1\n목적: 손상 존재 여부 스크리닝 (정밀 계산 전 필터링)\n이유: 미래 현금흐름 추정에 이미 불확실성이 큰데 할인까지 하면 과소 추정 위험\n→ 일단 명목 총액으로 회수 가능성 체크 → 통과하면 손상 없음으로 처리\n→ 실패하면 Step 2에서 FV(PV)로 정밀 계산\n\n■ TDR Debt Modification\n목적: 채무자 Gain 인식 여부 판단\n이유: TDR 조건은 시장 정상 이자율이 아님 → 그 rate로 PV 계산하면 Gain 과대계상\n→ 실제로 앞으로 낼 돈(명목 총액)과 지금 빚(CA)을 직접 비교하는 것이 가장 왜곡 없음\n→ PV 단계 없이 명목 총액 비교로 최종 판단\n\n[나머지 FAR은 왜 PV인가]\nLease/Bond/ARO/Pension 등은 모두 정상 시장 이자율로 협상된 계약\n→ 시장 rate로 할인하는 게 경제적 실질을 정확히 반영\n→ PV = 공정한 현재가치\n\n[비교표]\n항목                      방법              이유\nPPE Impairment Step 1    Undiscounted FCF  스크리닝 목적\nPPE Impairment Step 2    FV(PV)           실제 손상액 계산\nTDR Debt Modification    Total FCF(명목)   비정상 rate 왜곡 방지\nLease Liability          PV               정상 market rate\nBond Issuance            PV               정상 market rate\nARO                      PV               정상 market rate\nPension                  PV               정상 market rate",
  },

  // [IMP_008] Held for Sale — Subsequent Measurement (FV 하락 후 추가 write-down)
  // RULE    : 매 보고일 Lower of CV or (FV − Costs to Sell) 재측정 / FV 하락 → 추가 write-down
  // TRIGGER : "subsequent measurement" + FV 하락 → 직전 CV 기준으로 재비교
  // TRAP    : 초기 CV 기준 재비교 오류 / costs to sell 누락 / subsequent 하락 무시
  {
    topic_id: "IMP_008",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_IMPAIR',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Held for Sale — Subsequent Measurement: FV 하락 시 추가 write-down",
    rule: "매 보고일 재측정 = Lower of ① 직전 CV, ② 새 FV − Costs to Sell\n① 초기 분류: Lower of original CV or (initial FV − costs)\n② Subsequent: Lower of ①결과 or (new FV − costs)\n→ FV 하락 → 추가 write-down 필수\n→ FV 상승 → write-up 허용 (단, 과거 write-down 누계 한도 내)",
    trigger: '"subsequent measurement" + FV 하락 → 직전 장부가 기준 재비교\n"after two months / later" + new fair value → 즉시 재측정 적용\ninitial CV가 아닌 직전 write-down 후 CV로 비교',
    trap: "초기 original CV($525K)로 재비교 오류 → 직전 write-down 후 CV($510K) 기준\nNew FV만 보고 costs to sell 미차감($480K 선택) → FV−costs 계산 필수\nSubsequent 하락 무시하고 initial write-down 결과 유지 → 매 보고일 재측정 의무 위반",
    example: "CV $525K / FV $570K / Costs $60K\n초기: Lower of $525K vs $510K → $510K\nFV 하락 후 $480K: Lower of $510K vs $420K → $420K\nTotal write-down = $105K",
    speed: "① 초기: Lower of $525K vs ($570K−$60K=$510K) → $510K\n② Subsequent: Lower of $510K vs ($480K−$60K=$420K) → $420K\n정답 B",
    context_background: "Held-for-sale은 최초 분류 시뿐 아니라 매 보고일마다 Lower of CV or (FV − Costs to Sell) 재측정 의무. FV가 추가 하락하면 그 시점 기준으로 또 write-down. Held-for-use와의 차이: held-for-sale은 과거 write-down 범위 내에서 FV 회복 시 write-up 가능 (held-for-use는 write-up 절대 불가).",
  },

  // ── PEN ────────────────────────────────────────────────────────────────────
  {
    topic_id: "PEN_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Pension expense components — what is included",
    rule: "Net Periodic Pension Cost = service cost + interest cost − expected return on plan assets + amortization of prior service cost + amortization of net actuarial loss.",
    trigger: "pension expense | net periodic pension cost | NPPC | components",
    trap: "Expected return REDUCES pension expense — it is not a separate expense line.",
    one_sentence: "Pension expense = service cost + interest cost − expected return + amortizations.",
    example: "Service $50K + Interest $20K − Expected return $18K + PSC amort $5K = Net pension cost $57K",
  },
  {
    topic_id: "PEN_002",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Service cost — where does it go",
    rule: "Service cost is always classified as operating expense. All other pension components (interest, expected return, amortizations) are classified as non-operating.",
    trigger: "service cost | pension | operating | non-operating | component separation",
    trap: "Only service cost is operating — all other pension components are non-operating.",
    one_sentence: "Service cost = operating pension component; everything else = non-operating.",
    example: "Service cost $50,000 → Operating expense; interest cost $20,000 → Non-operating expense",
  },
  {
    topic_id: "PEN_003",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Interest cost — how to calculate",
    rule: "Pension interest cost = beginning Projected Benefit Obligation (PBO) × discount rate.",
    trigger: "interest cost | pension | PBO | discount rate | beginning PBO",
    trap: "Use beginning PBO × discount rate — not ending PBO.",
    one_sentence: "Pension interest cost = beginning PBO times the discount rate.",
    example: "Beginning PBO $400,000 × 5% discount rate = $20,000 interest cost",
  },
  {
    topic_id: "PEN_004",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Expected return on plan assets — effect on expense",
    rule: "Expected return on plan assets reduces net pension cost. Expected return = beginning fair value of plan assets × expected long-term rate of return.",
    trigger: "expected return | plan assets | reduce pension | long-term rate | expected",
    trap: "Use EXPECTED return (not actual return) in the pension expense calculation.",
    one_sentence: "Expected return reduces pension expense; use beginning plan assets × expected rate.",
    example: "Beginning plan assets $300,000 × 6% = $18,000 → reduces pension cost by $18,000",
  },
  {
    topic_id: "PEN_005",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Actuarial gain/loss — where does it go",
    rule: "Actuarial gains and losses are recorded in OCI initially. They are amortized into net pension cost in future periods using the corridor method (or faster if elected).",
    trigger: "actuarial gain | actuarial loss | OCI | corridor | amortization | experience",
    trap: "Actuarial G/L goes to OCI first — not immediately to pension expense.",
    one_sentence: "Actuarial gains/losses go to OCI initially; amortize into expense in future periods.",
    example: "Actuarial loss $40,000 → OCI this year; amortized into pension expense over future periods",
  },
  {
    topic_id: "PEN_006",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Prior service cost — where does it go",
    rule: "Prior service cost (from plan amendments) is initially recorded in OCI, then amortized into pension expense over the remaining service period of affected employees.",
    trigger: "prior service cost | plan amendment | OCI | amortization | PSC",
    trap: "Prior service cost goes to OCI first — not all to expense in the year of the amendment.",
    one_sentence: "Plan amendment prior service cost → OCI, then amortize over remaining employee service years.",
    example: "PSC $100,000 / 10-year remaining service → $10,000/yr amortized from OCI into pension expense",
  },
  {
    topic_id: "PEN_007",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "Funded status — how to present on balance sheet",
    rule: "Funded status = Fair value of plan assets − PBO. Overfunded → net pension asset. Underfunded → net pension liability. Report the net amount on the balance sheet.",
    trigger: "funded status | pension | balance sheet | plan assets | PBO | net pension",
    trap: "Report the funded status net on the balance sheet — not plan assets and PBO as separate line items.",
    one_sentence: "Net pension asset/liability = plan assets minus PBO; report the net on the balance sheet.",
    example: "Plan assets $350,000 / PBO $400,000 → Underfunded $50,000 → Net pension liability $50,000 on B/S",
  },
  {
    topic_id: "PEN_008",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_PENSION',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Projected benefit obligation — how it moves",
    rule: "PBO roll-forward: Beginning PBO + service cost + interest cost + actuarial losses − actuarial gains − benefits paid = Ending PBO.",
    trigger: "PBO | projected benefit obligation | roll-forward | beginning | ending | change",
    trap: "Benefits paid reduce PBO — they do not directly affect pension expense.",
    one_sentence: "PBO increases by service cost, interest, and actuarial losses; decreases by benefits paid and gains.",
    example: "Beginning $400K + service $50K + interest $20K + actuarial loss $10K − benefits paid $30K = Ending $450K",
  },

  // ── SBC ────────────────────────────────────────────────────────────────────
  {
    topic_id: "SBC_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_SBC',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'concept',
    card_name: "Stock option — when to measure fair value",
    rule: "Measure the fair value of employee stock options at the grant date. Do not remeasure after grant date for employee options.",
    trigger: "stock option | grant date | fair value | measurement date | option expense",
    trap: "Fair value is fixed at grant date for employees — do not update for stock price changes after grant.",
    one_sentence: "Employee stock option fair value is measured once at the grant date; never remeasured.",
    example: "Options granted Jan 1 when FV per option = $4 → use $4 for all future expense recognition",
  },
  {
    topic_id: "SBC_002",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_SBC',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Stock option — how to recognize expense over time",
    rule: "Total compensation = grant-date fair value × number of options expected to vest. Recognize ratably (straight-line) over the service/vesting period.",
    trigger: "stock option expense | vesting period | service period | compensation expense | straight-line",
    trap: "Expense over the vesting period — not at grant date or at exercise date.",
    one_sentence: "Stock option expense = grant-date FV × options expected to vest; spread evenly over vesting period.",
    example: "1,000 options × $4 FV × 90% expected to vest = $3,600 total / 3-year vesting = $1,200/year",
  },
  {
    topic_id: "SBC_003",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_SBC',
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: 'calculation',
    card_name: "Stock option forfeited — how to adjust expense",
    rule: "When options are forfeited (employee leaves before vesting), reverse the compensation expense previously recognized for those forfeited options.",
    trigger: "forfeiture | forfeit | options lapse | reverse expense | compensation",
    trap: "Forfeiture reversal reduces cumulative expense — it does not create a gain in income.",
    one_sentence: "Forfeited options reduce cumulative stock comp expense by reversing what was previously recorded.",
    example: "100 options forfeited / $4 FV / 1 of 3 years vested → reverse $400 × 1/3 ≈ $133 previously recognized",
  },

  // ── BC ─────────────────────────────────────────────────────────────────────
  {
    topic_id: "BC_001",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'calculation',
    card_name: "Goodwill — how to calculate at acquisition",
    rule: "Goodwill = Consideration transferred + FV of NCI + FV of previously held interest − FV of net identifiable assets (assets − liabilities).",
    trigger: "goodwill | acquisition | business combination | fair value of net assets",
    trap: "Use FV of net identifiable assets — not book value.",
    one_sentence: "Goodwill = total consideration + NCI FV + prior interest FV − FV of net identifiable assets.",
    example: "Price $800K + NCI FV $200K − Net identifiable assets FV $850K = Goodwill $150K",
    context_background: "[왜 FV 기준인가]\n취득자는 피취득자의 실제 경제적 가치에 돈을 지불. BV는 과거 원가로 현재 가치 반영 불가.\n예: 건물 BV $100K(감가 후) / FV $200K → 취득자는 $200K 가치를 산 것. BV 기준 시 Goodwill 과대계상.\n\n[취득가 3분해]\n취득가 $500,000\n├── Net Assets BV $400,000 → 그대로 인식\n├── FV Step-up   $50,000  → 개별 자산 배분 후 잔여내용연수 상각\n└── Goodwill     $50,000  → 상각 없음, 매년 impairment test\n\nFV Step-up = 피취득자가 장부에 반영 못한 가치를 공정하게 올려주는 것.\nGoodwill = Step-up으로도 설명 안 되는 초과 프리미엄(브랜드/고객관계/시너지 등 식별 불가 가치).\n\n[FV Step-up 후속 처리]\n건물·장비·특허·고객관계 → 잔여내용연수 추가 상각\n재고자산 → 판매 시 즉시 COGS / 토지·Goodwill → 상각 없음(Goodwill은 impairment test)\n\n[회계처리 순서]\nStep1: Dr. Investment $500K / Cr. Cash $500K\nStep2(올바른 연결): Dr. Net Assets BV $400K + FV Step-up $50K + Goodwill $50K / Cr. Investment $500K 전액소거\nStep3(오류): Goodwill 누락 → Investment $50K 덜 소거\nStep4(수정): Dr. Goodwill $50K / Cr. Investment $50K\n\n[왜 Investment 전액 소거하는가]\n연결 = 하나의 경제적 실체(single economic entity)로 봄.\n100% 인수 후 Cedar는 내부 → 지분 보유 개념 사라짐 → Cedar 자산부채가 직접 연결 B/S에 올라옴.\n비유: 백화점 상품권 보유 → 백화점 통째 인수 → 상품권 개념 사라지고 건물·재고·현금이 직접 내 것.\n\n[지분율별 회계처리]\n20% 미만 → 원가법/FV법 → Investment 소거 없음\n20~50% → 지분법 → 소거 없음(지분법 조정만)\n50% 초과 → 연결 → Investment 전액 소거 + 자산부채 100% 인식\n\n[80% 인수 시 NCI 개념]\n자산부채는 100% 연결 B/S에 올라옴(Grove가 Cedar 전체 지배).\nInvestment(80%분) 전액 소거 + 나머지 20% → NCI(비지배지분)로 B/S 표시.\nDr. Net Assets(100%) + FV Step-up(100%) + Goodwill / Cr. Investment(80%분) + NCI(20%)\n건물 전체를 Grove가 지배하되 20% 외부주주 몫을 NCI로 별도 표시 = 외부주주에게 빚진 개념.\nNCI 포함 시 Goodwill 계산 방식 달라짐(Full vs Partial Goodwill) → 별도 topic.",
  },
  {
    topic_id: "BC_002",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Bargain purchase — what happens when fair value exceeds price",
    rule: "Bargain purchase: FV of net identifiable assets > total consideration. Excess is recognized immediately as a gain in net income.",
    trigger: "bargain purchase | gain | net identifiable assets | excess | negative goodwill",
    trap: "Unlike goodwill (asset), a bargain purchase gain goes directly to income — not negative goodwill on balance sheet.",
    one_sentence: "Bargain purchase → FV of net assets exceeds price → recognize difference as gain in net income.",
    example: "Net assets FV $900K / paid $800K → Bargain purchase gain $100K recognized in income",
  },
  {
    topic_id: "BC_003",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Acquisition method — how to record identifiable assets",
    rule: "Under the acquisition method, all identifiable assets and liabilities are recorded at fair value at the acquisition date. Book values of the target are irrelevant.",
    trigger: "acquisition method | identifiable assets | fair value | purchase accounting | book value",
    trap: "Book value of target's assets is irrelevant — everything goes to fair value on acquisition.",
    one_sentence: "Acquisition method: every identifiable asset and liability is recorded at fair value.",
    example: "Target equipment BV $100K / FV $130K → record at $130K in consolidated statements",
  },
  {
    topic_id: "BC_004",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'concept',
    card_name: "Contingent consideration — how to record",
    rule: "Measure contingent consideration (earnout) at fair value at acquisition date; include in total consideration. Post-acquisition FV changes go to net income (not goodwill).",
    trigger: "contingent consideration | earnout | fair value | acquisition | post-acquisition change",
    trap: "Post-acquisition FV changes do NOT adjust goodwill — they go to income.",
    one_sentence: "Record contingent consideration at FV on acquisition date; update through income afterward.",
    example: "Earnout FV $50K at acquisition → in price; FV rises to $70K next year → $20K loss to income",
  },
  {
    topic_id: "BC_005",
    book_id: 'IA',
    chapter_id: 'IA_CH6',
    topic_group: 'IA_CH6_LIAB',
    sub_category_id: "U5_CONSOLIDATED_FS",
    card_type: 'conditional',
    card_name: "In-process research and development — capitalize or expense",
    rule: "IPR&D acquired in a business combination → capitalize as an intangible asset at FV. Internally developed R&D → expense as incurred.",
    trigger: "in-process R&D | IPR&D | acquired R&D | business combination | research development",
    trap: "Acquired IPR&D = capitalize; internally generated R&D = expense immediately.",
    one_sentence: "Acquired IPR&D in M&A is capitalized; internally developed R&D is expensed.",
    example: "Acquired biotech's in-process drug research FV $200K → Dr. IPR&D Intangible $200K (not expensed)",
  },

  // ── DER ────────────────────────────────────────────────────────────────────
  {
    topic_id: "DER_001",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_DERIV',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Fair value hedge — where does gain/loss go",
    rule: "Fair value hedge: both the derivative gain/loss AND the offsetting hedged item gain/loss go to current net income. The hedged item's carrying value is adjusted.",
    trigger: "fair value hedge | hedged item | derivative | gain/loss | income | offset",
    trap: "Both the derivative and the hedged item's changes go to income — they offset each other.",
    one_sentence: "Fair value hedge: derivative G/L and hedged item G/L both flow through net income.",
    example: "Swap gain $5,000 on fixed-rate debt hedge + debt FV loss $5,000 → net $0 in income",
  },
  {
    topic_id: "DER_002",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_DERIV',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Cash flow hedge — where does gain/loss go",
    rule: "Cash flow hedge: effective portion of derivative gain/loss → OCI (deferred). Ineffective portion → net income immediately.",
    trigger: "cash flow hedge | OCI | effective portion | ineffective | deferred hedge",
    trap: "The effective portion stays in OCI until the hedged transaction affects earnings.",
    one_sentence: "Cash flow hedge: effective portion → OCI; ineffective portion → net income.",
    example: "Forward contract: $8,000 effective gain → OCI; $500 ineffective → income immediately",
  },
  {
    topic_id: "DER_003",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_DERIV',
    sub_category_id: "U5_FINANCIAL_INSTRUMENTS",
    card_type: 'concept',
    card_name: "Hedge effectiveness — what happens if ineffective portion",
    rule: "Any ineffective portion of any hedge goes immediately to net income. Hedge must be 'highly effective' both prospectively and retrospectively to qualify for hedge accounting.",
    trigger: "ineffective | hedge effectiveness | income | testing | highly effective",
    trap: "Even a 'highly effective' hedge has an ineffective portion that must flow through income.",
    one_sentence: "Ineffective portion of any hedge is recognized in net income immediately.",
    example: "Cash flow hedge: total gain $10,000 / effective $9,000 → OCI; ineffective $1,000 → income",
  },

  // ── RE ─────────────────────────────────────────────────────────────────────
  {
    topic_id: "RE_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_RE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Investment property — cost model vs fair value model",
    rule: "US GAAP: investment property at cost less accumulated depreciation (no fair value option). IFRS: entities may elect the fair value model with changes through income.",
    trigger: "investment property | fair value model | cost model | IFRS | rental property",
    trap: "US GAAP does not allow the fair value model for investment property; IFRS does.",
    one_sentence: "IFRS allows investment property at fair value through income; US GAAP requires cost model.",
    example: "Rental building under IFRS with FV election → year-end FV change goes to income; US GAAP → depreciate at cost",
  },
  {
    topic_id: "RE_002",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_RE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Real estate sales — when to recognize revenue",
    rule: "Real estate revenue follows the standard five-step revenue model. For point-in-time sales, control typically passes at closing.",
    trigger: "real estate sales | revenue recognition | closing | control transfer | property sale",
    trap: "Real estate follows the general revenue standard — no special real estate rules under current US GAAP.",
    one_sentence: "Recognize real estate sale revenue when control transfers to the buyer, typically at closing.",
    example: "Property closes March 15 → recognize full sale proceeds on March 15 when title and control pass",
  },

  // ── INT_REP ────────────────────────────────────────────────────────────────
  {
    topic_id: "INT_REP_001",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U1_BALANCE_SHEET",
    card_type: 'concept',
    card_name: "Interim period — discrete vs integral view",
    rule: "US GAAP uses the integral view — each interim period is part of the annual period. Annual estimates (bonuses, taxes) are allocated proportionally across quarters.",
    trigger: "interim | quarterly | discrete | integral | quarterly report | allocation",
    trap: "The integral view means some items are estimated and spread across quarters — discrete view would not do this.",
    one_sentence: "Interim periods are part of the annual period — allocate annual items ratably across quarters.",
    example: "Annual bonus estimated $120,000 → accrue $30,000 per quarter even if year-end amount is uncertain",
  },
  {
    topic_id: "INT_REP_002",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U1_BALANCE_SHEET",
    card_type: 'concept',
    card_name: "Income tax expense — how to estimate each quarter",
    rule: "Estimate the annual effective tax rate (ETR) at the start of each quarter. Apply ETR to year-to-date income; record cumulative tax expense each quarter.",
    trigger: "interim income tax | effective tax rate | quarterly | ETR | estimate",
    trap: "Use the estimated annual ETR — not the statutory rate — applied to year-to-date income.",
    one_sentence: "Quarterly tax expense uses the estimated annual effective rate applied to cumulative year-to-date income.",
    example: "Q1 pre-tax income $100K / estimated annual ETR 30% → Q1 tax expense $30,000",
  },
  {
    topic_id: "INT_REP_003",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U1_BALANCE_SHEET",
    card_type: 'calculation',
    card_name: "Inventory loss — recognize in interim or defer",
    rule: "Permanent inventory write-downs to LCM must be recognized immediately in the interim period. Temporary declines expected to recover by year-end may be deferred.",
    trigger: "interim | inventory loss | LCM | temporary decline | permanent decline | defer",
    trap: "Permanent declines must be recognized immediately — only temporary recoverable declines can be deferred.",
    one_sentence: "Interim inventory: permanent declines recognize immediately; temporary recoverable declines may be deferred.",
    example: "Q1 FV below cost by $10K — expected to recover by Q4 → may defer; if permanent → recognize $10K in Q1",
  },

  // [INT_REP_004] Interim GAAP — apply most recent annual report principles
  // RULE    : Interim = most recent annual report GAAP / 단, 당해 원칙 변경 시 새 원칙 적용
  // TRIGGER : "interim financial statements" + "no changes in principle" → most recent annual
  // TRAP    : interim 전용 GAAP 존재(A) / 미래 예상 원칙(C/D) — 모두 오답
  {
    topic_id: "INT_REP_004",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "Interim financial statements — GAAP applied is from most recent annual report",
    rule: "Interim 재무제표 GAAP 적용 원칙:\n→ 가장 최근 연간보고서(most recent annual report)에서 사용한 GAAP 그대로 적용\n→ 단, 당해 연도에 회계원칙 변경(Change in Accounting Principle) 시 새 원칙 적용\n→ Interim 전용 별도 GAAP 없음",
    trigger: "'interim financial statements' + 'no changes in accounting principle' → most recent annual report GAAP\n'change in accounting principle adopted in current year' → 새 원칙 적용\nInterim GAAP 질문 → annual report 기준",
    trap: "A(applicable to interim): Interim 전용 별도 GAAP 없음 → annual report 기준\nC(projected future years): 미래 예상 원칙 → 확정 전 적용 불가\nD(projected current year): 아직 채택하지 않은 원칙 → 사용 불가\n공통 함정: Interim이니까 특별한 기준이 있을 것이라는 착각",
    one_sentence: "Interim GAAP = most recent annual report에서 사용한 원칙; 당해 원칙 변경 시에만 새 원칙 적용.",
    speed: "① 원칙 변경 있었나? → No\n② → most recent annual report GAAP 그대로\n→ 정답 B",
    context_background: "[왜 Annual report GAAP을 그대로 쓰는가]\nInterim 재무제표는 연간 재무제표의 일부(integral view). 원칙 일관성(Consistency)을 위해 연간보고서와 동일한 기준을 사용해야 비교 가능성이 유지된다.\n\n[예외: 당해 원칙 변경]\n당해 연도에 회계원칙 변경(예: FIFO→Weighted Average)을 채택했다면, 해당 분기부터 새 원칙 적용. 이 경우 변경 효과를 소급 반영하여 전기 비교 재무제표도 재작성.\n\n[Integral view와의 연결]\nUS GAAP Integral view: 각 분기는 연간 기간의 일부 → 연간 추정치(세금, 보너스 등)를 분기에 비례 배분 → 연간 원칙 그대로 유지가 논리적으로 일관됨.",
  },

  // [INT_REP_006] Interim Cost Allocation — Two Patterns + Remainder Keyword
  // RULE    : "for the calendar year" → 4분기 배분 / "remainder of the calendar year" → 발생 후 잔여 분기 배분
  // TRIGGER : property tax + repair cost 동시 출제 / "remainder" → 발생 시점부터 연말까지
  // TRAP    : 수선비를 4분기로 나눔 / 납부일 기준 배분 / 발생 전 분기 포함
  {
    topic_id: "INT_REP_006",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'conditional',
    card_name: "Interim cost allocation — calendar year vs remainder of year",
    rule: "중간보고 비용 배분 3가지 패턴:\n\n패턴 1 — 특정 시점 확정 손실:\nComponent disposal / 소송 손실 등\n→ 발생 중간기간 전액 인식, 배분 없음\n\n패턴 2 — 'for the calendar year':\n재산세 / 연간 보험료 등\n→ 1월~12월 전체 귀속 → 4분기 균등 배분\n→ 납부일 무관\n\n패턴 3 — 'for the remainder of the calendar year':\n예상치 못한 수선비(unanticipated repairs) 등\n→ 발생 시점부터 연말까지 귀속\n→ 발생 월 확인 → 잔여 분기 수 계산 → 균등 배분\n\n발생주의 원칙: 현금 납부 시점 무관, 효익 귀속 기간 기준",
    trigger: "'for the calendar year' → 4분기 균등 배분 'for the remainder of the calendar year' → 발생 시점 확인 → 잔여 분기 수 계산 → 균등 배분 'unanticipated repairs' + 'remainder' → 발생 월부터 12월까지 몇 분기인지 세기 'January 납부' + 'for the calendar year' → 납부일 무관, 4분기 배분",
    trap: "수선비를 4분기로 나눔 → 4월 발생이면 Q2~Q4 = 3분기만 배분 납부일 기준 배분 → 1월 16일 납부해도 'for the calendar year'면 4분기 균등 발생 전 분기 포함 → Q1 발생 전 수선비를 Q1에 배분 오류 'remainder' 무시 → 전체 연도로 잘못 배분",
    one_sentence: "'for the calendar year' → ÷4 / 'remainder of the year' → 발생 후 잔여 분기 수로 나눔 / 납부일 무관.",
    example: "재산세 $60K 'for the calendar year' → $60K ÷ 4 = $15K/분기 수선비 $240K 'remainder' April 발생 → Q2·Q3·Q4 = 3분기 → $240K ÷ 3 = $80K/분기 Q3 합계: $15K + $80K = $95K",
    speed: "① 'for the calendar year' → ÷4 ② 'remainder' + 발생월 → 잔여 분기 수 세기 → 나누기 ③ 해당 분기 합산",
    context_background: "['for the calendar year' vs 'remainder' 차이]\n'for the calendar year': 연간 단위 부과 비용\n→ 납부 시점과 무관하게 1~12월 전체 귀속\n→ Q1~Q4 균등 배분\n\n'for the remainder of the calendar year': 발생 시점 이후 효익\n→ 발생 월부터 12월까지만 귀속\n→ April 발생: Q2(Apr~Jun) + Q3(Jul~Sep) + Q4(Oct~Dec) = 3분기\n→ July 발생: Q3 + Q4 = 2분기\n\n[발생주의 원칙 재확인]\n비용 인식 기준 = '언제 납부했냐'가 아닌 '어느 기간에 효익이 귀속되냐'\n1월 16일 납부한 재산세도 연간 비용이므로 4분기 배분\n'remainder' 수선비도 납부일(4월 2일)이 아닌 효익 기간(4월~12월) 기준\n\n[함정 C 분석]\n$75,000 = $15,000 + $60,000\n수선비를 4분기로 나눈 것 → $240K ÷ 4 = $60K\n4월 발생이라 Q1 제외, 3분기만 배분해야 함",
  },

  // [INT_REP_005] Interim Reporting — Two-Pattern Expense Recognition
  // RULE    : 특정 시점 손실 → 전액 즉시 / 연간 단위 비용 → 기간 배분
  // TRIGGER : "for the calendar year" → 연간 비용 배분 / "incurred on [날짜]" → 전액
  // TRAP    : 재산세 전액 인식 / component loss 배분 / 납부일 기준 인식
  {
    topic_id: "INT_REP_005",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'conditional',
    card_name: "Interim expense recognition — point-in-time loss vs annual cost allocation",
    rule: "중간보고 비용 처리 2가지 패턴:\n\n패턴 1 — 특정 시점 확정 손실:\nComponent disposal / 소송 손실 / 자산 손상 등\n→ 발생한 중간기간에 전액 인식 / 배분 없음\n\n패턴 2 — 연간 단위 발생 비용:\n재산세 / 연간 보험료 / 연간 수선비 등\n→ 연도 전체에 걸쳐 균등 배분\n→ 'for the calendar/fiscal year' 표현이 신호\n→ 6개월 interim: ÷2 / 9개월: ×9/12",
    trigger: "'for the calendar year' / 'for the fiscal year' → 연간 비용 → 기간 수로 배분 'incurred on [날짜]' / 'net loss from disposal' → 특정 시점 손실 → 전액 즉시 'six-month interim period' → 연간 비용 ÷ 2 'nine-month interim period' → 연간 비용 × 9/12",
    trap: "재산세 납부일 기준 전액 인식 → 'for the calendar year' = 연간 비용, 반드시 배분 Component disposal loss 기간 배분 → 특정 시점 확정 손실, 전액 즉시 인식 두 항목 모두 전액 합산 → 연간 비용 배분 누락 'paid on June 30' → 납부 시점이 아닌 귀속 기간 기준으로 인식",
    one_sentence: "'for the calendar year' → 연간 비용 배분 / 'incurred on [날짜]' → 전액 즉시 — 납부 시점이 아닌 귀속 기간 기준.",
    example: "Component disposal loss $100,000 → 전액 인식 재산세 $40,000 'for the calendar year' → 6개월 interim: $40,000÷2 = $20,000 합계: $100,000 + $20,000 = $120,000",
    speed: "'for the calendar year' 보이면 → 연간 비용 → ÷기간수 'disposal/loss incurred on' 보이면 → 전액 → 합산",
    context_background: "[중간보고 적분법(Integral View)]\nUS GAAP 중간보고는 적분법 — 각 중간기간은 연간기간의 일부.\n연간 단위 비용은 연도 전체에 걸쳐 발생하므로 사용 기간에 배분.\n재산세는 1월~12월 전체 기간에 대한 세금 — 납부일이 6월이어도 연간 비용.\n\n[두 패턴 구분 직관]\n특정 시점 확정 손실: '오늘 이 사건이 발생해서 손실이 생겼다' → 그날 전액\n연간 단위 비용: '올해 1년에 대한 비용인데 이번에 납부했다' → 기간 배분\n\n['for the calendar year' 표현의 의미]\n재산세·보험료 등은 '연간 단위로 부과'되는 비용.\n납부 시점과 귀속 기간이 다를 수 있음.\n이 표현이 보이면 즉시 '연간 비용 → 기간 배분' 모드 발동.",
  },

  // ── VAL (continued) ────────────────────────────────────────────────────────
  {
    topic_id: "VAL_008",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Cost approach — when to use and how it works",
    rule: "Cost approach estimates fair value as the amount required to replace the asset's service capacity (replacement cost), adjusted for physical deterioration, functional obsolescence, and economic obsolescence.",
    trigger: "cost approach | replacement cost | reproduction cost | obsolescence | depreciated replacement",
    trap: "Replacement cost is not the same as historical cost — it reflects current cost to replace the asset at current prices.",
    one_sentence: "Cost approach = current replacement cost minus all forms of obsolescence and deterioration.",
    example: "Specialized machine replacement cost $500,000 − physical deterioration $80,000 − functional obsolescence $20,000 = FV $400,000",
  },
  {
    topic_id: "VAL_009",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Market approach — when to use and how it works",
    rule: "Market approach uses prices and other relevant information from actual market transactions involving identical or comparable assets/liabilities. Includes guideline public company method and comparable transaction method.",
    trigger: "market approach | comparable | guideline company | transaction multiples | market price",
    trap: "Comparability adjustments are required when the reference asset is similar but not identical — do not use unadjusted prices for non-identical assets.",
    one_sentence: "Market approach = price discovery from comparable real-world transactions, adjusted for differences.",
    example: "Private company valued at 8× EBITDA based on recent sales of comparable public companies → market approach",
  },
  {
    topic_id: "VAL_010",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Income approach — when to use and how it works",
    rule: "Income approach converts expected future cash flows (or income) to a single present value using a discount rate that reflects current market expectations and the risk of those cash flows. Includes DCF and capitalization of earnings methods.",
    trigger: "income approach | DCF | discounted cash flow | capitalization | discount rate | present value",
    trap: "Inputs such as growth rate and discount rate are unobservable → income approach typically produces Level 3 fair value.",
    one_sentence: "Income approach = PV of expected future cash flows discounted at a risk-appropriate rate.",
    example: "Business DCF: projected FCF $100K/yr growing at 3%, discount rate 10% → terminal value + PV of explicit period CFs = FV",
  },
  {
    topic_id: "VAL_011",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'conditional',
    card_name: "Which valuation approach to pick — principal market first",
    rule: "Fair value is measured in the principal market (highest volume and activity). If no principal market, use the most advantageous market. The valuation approach that maximizes observable inputs is preferred: Level 1 (market) > Level 2 (market/income) > Level 3 (income/cost). Multiple approaches may be used and weighted.",
    trigger: "principal market | most advantageous market | approach selection | which approach | observable inputs",
    trap: "The goal is to maximize observable inputs — do not default to the income approach simply because it is familiar if market data is available.",
    one_sentence: "Pick the approach that uses the most observable inputs; principal market takes priority over most advantageous market.",
    example: "Listed equity → market approach (Level 1) preferred over DCF; illiquid private asset with no comparables → income or cost approach (Level 3)",
  },

  // [VAL_012] Fair Value — Most Advantageous Market and Transaction Costs
  // RULE    : No principal market → Net 비교 → 최고 Net 시장 선택 → FV = quoted price (TC 미차감)
  // TRIGGER : 'no principal market' → Net 비교 → FV = quoted price
  // TRAP    : quoted price로 비교(TC 미차감) / Net을 FV로 보고
  {
    topic_id: "VAL_012",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'conditional',
    card_name: "Fair Value — Most Advantageous Market and Transaction Costs",
    rule: "Principal market 없을 때 → Most advantageous market = TC 차감 후 Net이 가장 높은 시장. Fair value = 해당 시장의 quoted price (TC 미차감). TC는 시장 선택 기준에만 사용, FV 보고에는 미포함.",
    trigger: "'no principal market' → Net 비교로 시장 선택 → FV = 선택된 시장의 quoted price",
    trap: "Quoted price 높은 시장 선택 함정: TC 차감 전 금액으로 비교 → 오류\nNet을 FV로 보고하는 함정: TC 차감한 값을 fair value로 사용 → 오류",
    one_sentence: "Most advantageous market = Net 최고 시장; FV = 그 시장의 quoted price (TC 빼지 않음).",
    speed: "각 시장 Net 계산 → Net 최고 시장 선택 → FV = 해당 시장 quoted price",
    context_background: "Principal market 없을 때 most advantageous market을 선택한다. 선택 기준은 TC 차감 후 Net이 가장 높은 시장이지만, 보고하는 fair value는 quoted price 그대로다.",
  },

  // [VAL_013] Fair Value — Nonfinancial Asset: Highest and Best Use
  // RULE    : FV = Highest and Best Use → 제시된 가치 중 최고값
  // TRIGGER : 'developer has offered' → Alternative Use 신호 / 복수 가치 제시 → MAX 선택
  // TRAP    : NBV(A) / 취득원가(B) / Current Use(D) — 셋 다 FV 아님
  {
    topic_id: "VAL_013",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Fair Value — Nonfinancial Asset: Highest and Best Use",
    rule: "비금융자산 FV = Highest and Best Use 기준. Current use vs Alternative use 중 더 높은 금액. 취득원가·NBV·현재 용도 가치는 FV와 무관.",
    trigger: "'nonfinancial asset' + 복수 가치 제시 → MAX 선택\n'developer has offered $X' → Alternative Use 가치 신호 → FV 후보\n취득원가·감가상각 제시 → 오답 유인, 무시",
    trap: "$375,000(A): 취득원가 − 누적감모 = NBV → FV 아님\n$500,000(B): 취득원가 → 역사적 원가, FV 아님\n$600,000(D): Current Use 가치 → Highest and Best Use 아님\n공통 함정: 'currently has a value of' 문구에 끌려 현재 용도 가치를 FV로 착각",
    one_sentence: "비금융자산 FV = Highest and Best Use = MAX(Current Use, Alternative Use); 취득원가·NBV는 무관.",
    speed: "MAX($600,000 current use, $850,000 alternative use) = $850,000",
    context_background: "[ASC 820 — Nonfinancial Asset Fair Value 원칙]\n비금융자산의 공정가치는 시장 참여자가 그 자산을 Highest and Best Use로 활용한다고 가정했을 때의 가격이다.\n\n[Highest and Best Use란]\n물리적으로 가능하고, 법적으로 허용되며, 재무적으로 실현 가능한 이용 방법 중 가장 높은 가치를 창출하는 용도. 현재 용도가 반드시 최선이 아닐 수 있다.\n\n[오답 유인 항목 정리]\n- 취득원가($500,000): 과거 지불 금액 → 역사적 원가, FV와 무관\n- NBV($375,000): 취득원가 − 누적감모 → 장부금액, FV와 무관\n- Current Use($600,000): 현재 용도 가치 → Highest and Best Use가 아닐 수 있음\n\n[결론]\nAlternative Use $850,000 > Current Use $600,000\n→ Fair Value = $850,000",
  },

  // [VAL_014] Fair Value — Three Valuation Techniques (Market / Income / Cost)
  // RULE    : ASC 820 인정 3가지: Market / Income / Cost / Exchange·Input·Price → 허구
  // TRIGGER : "three valuation techniques" → M-I-C 암기
  // TRAP    : Exchange approach(B) / Input approach(C) / Price approach(D)
  {
    topic_id: "VAL_014",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_FAIRVAL',
    sub_category_id: "U2_FAIR_VALUE",
    card_type: 'concept',
    card_name: "Fair Value — Three Valuation Techniques (Market / Income / Cost)",
    rule: "ASC 820 인정 Valuation Technique 3가지:\n① Market approach: 시장 거래 비교. Comparable transactions, guideline company multiples\n② Income approach: 미래 현금흐름 PV. DCF, 수익 자본화\n③ Cost approach: 현재 대체원가 − 물리적 감모·기능적 진부화·경제적 진부화\n\n조합 사용 가능 (둘 이상 동시 적용 후 가중 평균)\n\nASC 820 미인정 명칭:\nExchange approach / Input approach / Price approach → 모두 허구",
    trigger: '"three valuation techniques" + "fair value" → M-I-C 암기\nExchange / Input / Price approach → 즉시 소거\n선지 스캔 후 Market·Income·Cost 중 하나 있으면 정답',
    trap: "Exchange approach: 거래소(exchange)는 Market approach의 가격 정보 출처이지, approach 명칭 아님\nInput approach: Level 1/2/3 hierarchy는 Input 분류 기준 → Valuation technique 명칭 아님\nPrice approach: price는 Market approach 내 구성요소 → 'Price approach' 자체는 ASC 820 미인정\n공통 함정: exchange·input·price 모두 FV 맥락에서 실제로 사용되는 단어라 그럴듯하게 들림",
    one_sentence: "Fair value 3대 기법 = Market / Income / Cost (M-I-C); Exchange·Input·Price는 ASC 820 미인정.",
    speed: "M-I-C 암기: Market / Income / Cost\n선지에서 이 3개 중 하나 → 정답 / Exchange·Input·Price → 즉시 소거",
    context_background: "[ASC 820 — Fair Value 3가지 Valuation Technique]\n\n① Market approach\n유사 자산·부채의 실제 시장 거래 가격을 기반으로 FV 추정\n→ Comparable public company multiples, M&A transaction multiples\n→ 주로 Level 1~2 inputs 사용\n\n② Income approach\n미래 기대 현금흐름을 현재가치로 할인\n→ DCF(Discounted Cash Flow), 수익 자본화(Capitalization of Earnings)\n→ 주로 Level 2~3 inputs 사용\n→ 할인율·성장률 등 자체 가정 → Level 3 빈번\n\n③ Cost approach\n현재 대체원가(current replacement cost)에서 감모 차감\n→ 물리적 감모(physical deterioration)\n→ 기능적 진부화(functional obsolescence)\n→ 경제적 진부화(economic obsolescence)\n→ 특수 자산·무형자산에 많이 사용 → Level 3 빈번\n\n[왜 Exchange·Input·Price는 틀리는가]\nExchange → 거래소에서 Market approach의 가격 정보를 얻음 → 출처이지 기법명 아님\nInput → L1/L2/L3 hierarchy = Input의 관찰 가능성 분류 → 측정 투명성 기준이지 기법명 아님\nPrice → Market approach에서 시장 가격 사용 → 구성요소이지 기법명 아님",
    example: "상장주식 → Market approach(L1) / 사모펀드 → Income approach DCF(L3) / 특수기계 → Cost approach 대체원가(L3)",
  },

  // [VAL_015] Fair Value Hierarchy – Level 2 Inputs Identification (Except)
  // RULE    : L1=identical+active / L2=observable not L1 / L3=unobservable(internal)
  // TRIGGER : "except" + Level 2 → Level 2 아닌 것 / "internally generated" → Level 3
  // TRAP    : similar+active → L1 착각 / identical+inactive → L1 착각 / 내부추정 → L2 착각
  {
    topic_id: "VAL_015",
    category: "Fair Value",
    topic_name: "Fair Value Hierarchy – Level 2 Inputs Identification (Except)",
    rule: "【Fair Value Hierarchy 3단계】\n\nLevel 1\n= 활성시장(active market) × 동일자산(identical)\n= 가장 신뢰도 높음\n예) NYSE 상장주식 공시가격\n\nLevel 2\n= 관측가능(observable) but Level 1 아닌 것\n예) 유사자산 활성시장 가격\n    동일자산 비활성시장 가격\n    공시 금리·스프레드·환율\n\nLevel 3\n= 관측불가(unobservable) = 내부 가정\n예) 내부 현금흐름 추정\n    자체 할인율·성장률 가정\n    내부 DCF 모델\n\n【Level 1 vs Level 2 경계】\nLevel 1: identical + active (둘 다 필요)\nLevel 2: similar + active OR identical + inactive",
    trigger: '"except" + Level 2 → Level 2 아닌 것 찾기\n"internally generated / own assumptions" → Level 3\n"similar asset + active market" → Level 2 (not L1)\n"identical asset + inactive market" → Level 2 (not L1)\n공시 금리/스프레드 → Level 2',
    trap: '"similar + active" → Level 1로 착각 (identical 필요).\n"identical + inactive" → Level 1로 착각 (active market 필요).\n내부 현금흐름 추정 → Level 2로 착각 (unobservable → Level 3).\n복잡한 내부 모델 → Level 2로 착각 (복잡도와 무관, 관측가능성이 기준).',
    example: "Level 1: NYSE 삼성전자 공시가격 (identical + active)\nLevel 2: 유사채권 브로커 호가 (similar + active)\n         비활성시장 동일채권 가격 (identical + inactive)\n         LIBOR/SOFR 금리 (observable)\nLevel 3: 경영진 내부 DCF 추정 (own assumptions)\n         내부 현금흐름 프로젝션 (unobservable)",
    journal_entry: "",
    key_formula: "Level 1 = identical + active market\nLevel 2 = observable (similar or inactive)\nLevel 3 = unobservable (internal/own assumptions)",
    speed: "L1 = identical+active | L2 = observable not L1 | L3 = unobservable/internal → 내부추정 → L3",
  },

  {
    topic_id: "COMP_001",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U4_PAYABLES",
    card_type: 'concept',
    card_name: "Compensated absences — current rate method",
    rule: "Accrue vacation liability using the current-year wage rate for ALL days — both days earned this year and carryover days from prior years. Carryover balances are remeasured at the new rate each period.",
    trigger: "compensated absences | vacation accrual | current rate | sick leave | paid time off",
    trap: "Do not use last year's rate for carryover days — the current rate method requires all outstanding days to be valued at the current wage rate, not the rate when they were earned.",
    one_sentence: "Current rate method: every outstanding vacation day (new and carried over) is multiplied by this year's wage rate.",
    example: "Employee carries over 5 days from last year + earns 10 days this year; current rate $200/day → liability = 15 × $200 = $3,000 (carryover remeasured at new rate)",
  },
  {
    topic_id: "COMP_002",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U4_PAYABLES",
    card_type: 'concept',
    card_name: "Compensated absences — vested benefit method",
    rule: "Accrue only the incremental change in liability when wage rates change. Beginning liability stays at the old rate; only the rate increase is applied to the carryover balance. New days earned are accrued at the current rate.",
    trigger: "compensated absences | vested benefit method | vacation accrual | incremental | rate increase",
    trap: "Do not remeasure the entire carryover balance at the new rate — the vested benefit method adjusts only the increment caused by the rate change, not the full balance.",
    one_sentence: "Vested benefit method: keep prior liability as-is and add only the incremental adjustment for the rate increase on carryover days.",
    example: "Prior liability $1,000 (5 days × $200); rate rises to $220 → add $100 increment (5 × $20) + new days at $220; do NOT recalculate entire balance at $220",
  },
  {
    topic_id: "COMP_003",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U4_PAYABLES",
    card_type: 'calculation',
    card_name: "Termination benefits — future service required, ratable accrual",
    rule: "미래 용역 조건부 termination benefit = 총 추정 부채를 서비스 기간(announcement ~ termination date)에 균등 안분. 기말 부채 = 총 추정 부채 ÷ 총 서비스 개월 × 경과 개월. 예상 수혜자 기준으로 계산(전체 인원 아님).",
    trigger: "'must stay until [date] to receive benefit' / 'no benefit if leave voluntarily' → 조건부 termination benefit → 서비스 기간 안분 필수\n즉시 전액 인식 아님",
    trap: "B ($50,000) → 전체 인원(50명) 기준 계산. 예상 수혜자(40명) 기준이어야 함\nC ($400,000) → 총 추정 부채 전액 즉시 인식. 서비스 기간 안분 누락\nD ($0) → 1개월 경과 → 이미 accrual 필요. $0 불가\n공통 함정: ① 전체 인원 vs 예상 수혜자 혼동 ② 서비스 기간 안분 없이 전액 인식",
    one_sentence: "조건부 termination benefit = 예상 수혜자 기준 총액 ÷ 서비스 기간 × 경과 기간.",
    speed: "① 총 추정 부채: 40명 × $10,000 = $400,000\n② 서비스 기간: Nov 30 ~ Sep 30 = 10개월\n③ 경과: 1개월(Dec 31)\n④ 부채: $400,000 ÷ 10 × 1 = $40,000",
    context_background: "[Termination Benefit 2가지 유형]\n\n① 즉시 지급형 (one-time termination benefit)\n- 용역 제공 조건 없음 → 공표일(announcement date)에 전액 즉시 인식\n- 예: '오늘 퇴직하면 $10,000 지급'\n\n② 미래 용역 조건부형 (future service required)\n- 특정 날짜까지 근무해야 수령 가능 → 서비스 기간에 걸쳐 균등 안분\n- 예: '9월 30일까지 근무하면 $10,000 지급'\n- 이 문제의 케이스\n\n[이 문제 계산 구조]\n공표일: Nov 30, Y1\n종료일: Sep 30, Y2\n서비스 기간: 10개월\n예상 수혜자: 40명 (50명 중 자발적 퇴직자 제외)\n총 추정 부채: 40 × $10,000 = $400,000\n\nY1말(Dec 31) 경과 기간: 1개월\nY1말 인식 부채: $400,000 × 1/10 = $40,000\n\nY2말(Sep 30) 누적 부채: $400,000 × 10/10 = $400,000 (전액)\n\n[왜 50명이 아닌 40명인가]\n회사 추정 기준 실제 수혜 예상 인원을 사용. 자발적 퇴직 예상자는 benefit을 받지 않으므로 제외.",
  },
  // [COMP_004] Compensated Absences — Accrual Criteria: Vested vs Non-Vested
  // RULE    : 4가지 요건 ALL 충족 시 accrual 필수 / ③ vested or accumulated 미충족 → accrual 불가
  // TRIGGER : 'vacation rights vest or accumulate = No' → accrual 불가 / Yes → 전액 accrual
  // TRAP    : 두 직원 모두 accrual(D) / 전원 미accrual(A) — vested 조건 무시
  {
    topic_id: "COMP_004",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U4_PAYABLES",
    card_type: 'conditional',
    card_name: "Compensated Absences — Accrual Criteria: Vested vs Non-Vested",
    rule: "Vacation pay accrual 4가지 요건 (ASC 710) — 전부 충족 시 필수:\n① Services already rendered\n② Amount can be reasonably estimated\n③ Vested or accumulated rights (핵심 판단 기준)\n④ Payment is probable\n\n③ 판단:\nVested = 퇴직 시에도 지급 → accrual 필수\nAccumulated = 이월 가능 → accrual 필수\nNeither → accrual 불가\n\n[Vacation vs Sick leave 비교]\nVacation: accumulated만 돼도 accrual 필수\nSick leave: vested여야 accrual 필수 / accumulated only → 선택적",
    trigger: "'vacation rights vest or accumulate = Yes' → 4가지 요건 충족 → accrual 필수\n'vest or accumulate = No' → ③ 미충족 → accrual 불가\n금액 = 해당 직원 weekly salary × vacation weeks",
    trap: "D(두 직원 모두): vested 조건 무시 → No인 직원도 accrual 오류\nA($0): vested 직원도 accrual 안 함 → ③ 충족 무시\n공통 함정: 두 직원 중 조건 충족 여부를 개별 확인하지 않고 일괄 처리",
    one_sentence: "Vacation accrual 4요건 ALL 충족 시 필수; ③ vested or accumulated = No → accrual 불가.",
    speed: "① Kim: vested = Yes → $1,200 × 2 = $2,400 accrual\n② Lee: vest or accumulate = No → $0\n③ Total = $2,400 → 정답 C",
    context_background: "[Compensated Absences accrual 원칙 — ASC 710]\n유급 휴가(vacation)·유급 병가(sick leave) 등 보상 결근에 대한 accrual 기준.\n\n[4가지 요건]\n① Services rendered: 직원이 이미 용역 제공\n② Estimable: 금액 합리적 추정 가능\n③ Vested or accumulated: 퇴직 시 지급(vested) 또는 이월 가능(accumulated)\n④ Probable: 지급 가능성 높음\n\n[③번 요건 — 핵심 판단]\nVested: 퇴직·해고 시에도 미사용 휴가 현금 지급 → accrual 필수\nAccumulated: 당해 미사용분 다음 연도 이월 가능 → accrual 필수\nNeither: 당해 미사용 시 소멸 + 퇴직 시 지급 없음 → accrual 불가\n\n[Vacation vs Sick leave 비교]\nVacation: vested OR accumulated → 둘 중 하나만 해당해도 accrual 필수\nSick leave: vested여야 accrual 필수 / accumulated only → 선택적 (지급 가능성 판단 어려움)\n\n[이 문제]\nKim: vested = Yes → 4요건 ALL 충족 → $1,200 × 2주 = $2,400\nLee: neither → ③ 미충족 → accrual 불가 → $0\n합계 $2,400",
  },

  // [COMP_005] Post-Employment Benefits — Four Liability Reporting Criteria
  // RULE    : 4가지 ALL 충족 시 accrual 필수 / 기준 외 항목 → "not one of criteria" 정답
  // TRIGGER : "not one of the criteria" → 4가지 외 항목 찾기
  // TRAP    : vest/probable/estimable → 모두 4가지 요건 중 하나 → 오답
  {
    topic_id: "COMP_005",
    sub_category_id: "U4_PAYABLES",
    card_type: 'concept',
    card_name: "Post-Employment Benefits — Four Liability Reporting Criteria (ASC 710)",
    rule: "【Post-Employment Benefits 부채 인식 4가지 요건 — ALL 충족 시 accrual 필수】\n\n① Services already rendered\n   → 직원이 이미 용역 제공\n\n② Rights vest or accumulate\n   → 퇴직 시 지급(vested) 또는 이월 가능(accumulated)\n\n③ Payment is probable\n   → 지급 가능성 높음\n\n④ Amount reasonably estimable\n   → 금액 합리적 추정 가능\n\n→ 4가지 외 항목(예: '퇴직 후 가용성') = NOT a criterion",
    trigger: '"not one of the criteria" + post-employment → 4가지 외 항목 찾기\n"remains available after employment" → 기준 없음 → 정답\n"vest or accumulate / probable / estimable" → 4가지 요건 중 하나 → 오답',
    trap: "그럴싸하게 들리는 선지 → 기준서 4가지와 반드시 대조\nvest or accumulate(D) / probable(C) / estimable(A) → 모두 요건 중 하나 → 오답\n'퇴직 후 지속 가용성' → GAAP 어디에도 없는 조건",
    example: "4가지 요건 체크리스트:\n① Services rendered? ✅\n② Vest or accumulate? ✅\n③ Probable? ✅\n④ Estimable? ✅\n→ 전부 해당 → accrual 필수\n\n'continues to be available after employment' → 체크리스트 없음 → NOT a criterion",
    speed: "① Services rendered ② Vest or accumulate ③ Probable ④ Estimable\n→ 4가지 외 항목 보이면 → 정답",
  },
  // [COMP_006] Comprehensive Income Presentation — Combined vs Separate Statement, Tax Effect Disclosure
  // RULE    : Combined(face) 또는 Separate(별도 문서) 둘 다 허용 / OCI 세금 효과 공시는 항상 필수
  // TRIGGER : "must CI appear on separate" → No / "face 필수" → No / "tax effects OCI" → Yes
  // TRAP    : Separate 필수 착각 / Face 필수 착각 / 세금 효과 공시 선택 착각
  {
    topic_id: "COMP_006",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_RE',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'concept',
    card_name: "Comprehensive income presentation — combined vs separate, tax effect required",
    rule: "CI 표시 방법 2가지 (둘 다 허용):\n① Combined statement\n   I/S face에 Net income 다음 OCI 이어서 작성\n   → CI까지 하나의 문서\n\n② Separate Statement of Comprehensive Income\n   I/S는 Net income에서 끝\n   → 별도 문서에 Net income + OCI + CI 표시\n\n[필수 공시]\nOCI 각 항목의 세금 효과 → 반드시 공시\n→ 본문(face) 또는 주석(notes) 중 선택\n→ 어느 표시 방법이든 세금 효과 공시는 mandatory\n\n[Single/Multi-step과 구분]\nSingle vs Multi-step → Net income 계산 방식 (단계 구분)\nCombined vs Separate → CI 위치 (문서 구조)\n→ 완전히 다른 차원, 독립적 선택",
    trigger: '"must be shown on face of I/S" → No (Separate도 허용)\n"must appear on separate statement" → No (Combined도 허용)\n"tax effects for OCI components" → Yes (본문 또는 주석 필수)\n"comprehensive income presentation" → 2가지 옵션 확인',
    trap: "I/S face 표시 필수: Separate statement로 대체 가능 → No\nSeparate statement 필수: Combined도 허용 → No\nOCI 세금 효과 공시 선택: 항상 필수 → Yes\nSingle/Multi-step과 혼동: Net income 계산 방식 ≠ CI 위치 선택",
    one_sentence: "CI = Combined(I/S face) 또는 Separate statement 중 선택 / 세금 효과 공시는 항상 필수.",
    speed: "Face 필수? No | Separate 필수? No | 세금 효과 공시? Yes → 정답 No/Yes",
    context_background: "[Combined vs Separate 구조 비교]\n\nCombined (하나의 문서):\nStatement of Income and Comprehensive Income\n  Revenue → COGS → Operating exp → Tax\n  Net income $96,000\n  ───────────────────\n  OCI: Unrealized gain $12,000 / Tax ($2,400) / FX ($5,000)\n  Comprehensive income $100,600\n\nSeparate (두 개의 문서):\n[문서1] Income Statement\n  Revenue → ... → Net income $96,000 ← 끝\n\n[문서2] Statement of Comprehensive Income\n  Net income (from I/S) $96,000\n  OCI: ...\n  Comprehensive income $100,600\n\n[Single/Multi-step과의 차이]\nSingle-step: Revenue − All expenses = Net income (한 번에)\nMulti-step: Revenue → Gross profit → Operating income → Net income (단계별)\n→ 이건 Net income 계산 방식의 차이\n→ Combined/Separate는 그 다음 CI를 어디에 담냐의 차이\n→ 4가지 조합 모두 가능 (Multi-step + Combined이 실무 가장 흔함)",
    example: "문제 유형 1: 'Must CI appear on I/S face?' → No\n문제 유형 2: 'Which is NOT acceptable?' → 주석에만 표시(face/separate 둘 다 안 씀) → 불가\n문제 유형 3: 'What appears on separate CI statement but not I/S?' → OCI 항목들",
  },
  {
    topic_id: "FASB_001",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U2_NOTES_TO_FS",
    card_type: 'concept',
    card_name: "How FASB communicates changes to existing GAAP",
    rule: "FASB issues Accounting Standards Updates (ASUs) to amend the Accounting Standards Codification (ASC). ASUs are the only mechanism for changing US GAAP since the Codification became authoritative in 2009. They apply to nonissuer, nongovernmental entities.",
    trigger: "FASB | Accounting Standards Update | ASU | Codification | ASC | GAAP update | FASB statement",
    trap: "Terms like 'FASB Statements,' 'FASB Pronouncements,' or 'FASB Interpretations' refer to pre-2009 standards that are no longer issued. Since 2009, all GAAP changes come through ASUs only.",
    one_sentence: "FASB changes GAAP exclusively through Accounting Standards Updates (ASUs), which amend the Codification — no other form of FASB pronouncement has been issued since 2009.",
    example: "FASB wants to change lease accounting → issues ASU 2016-02 → amends ASC 842 in the Codification → entities adopt by the effective date",
  },
  {
    topic_id: "FASB_002",
    sub_category_id: "U1_BALANCE_SHEET",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    card_type: 'concept',
    card_name: "Qualitative characteristics — Fundamental vs Enhancing",
    one_sentence: "Fundamental (R + FR) = must-have; Enhancing (CVTU) = nice-to-have.",
    rule: "Fundamental: Relevance (Predictive value / Confirmatory value / Materiality) + Faithful Representation (Complete / Neutral / Free from error). Enhancing: Comparability / Verifiability / Timeliness / Understandability. Constraint: Cost-benefit.",
    trigger: "qualitative characteristics | relevance | faithful representation | comparability | verifiability | timeliness | understandability | conservatism",
    trap: "Conservatism is NOT a standalone principle — it sits inside Faithful Representation → Neutral. Enhancing characteristics improve usefulness but do not make information useful on their own.",
    speed: "Fundamental → R + FR (없으면 유용하지 않음)\nEnhancing   → C V T U (있으면 더 좋아짐)\nConstraint  → Cost-benefit\n\nMemory: CVTU = Come Visit The University",
  },

  // ── Migration 030 ──────────────────────────────────────────────────────────
  // ── CASH ───────────────────────────────────────────────────────────────────
  {
    topic_id: "CASH_BANK_001",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_CASH',
    sub_category_id: "U3_CASH",
    card_type: 'calculation',
    card_name: "Bank Reconciliation — balance test at one point in time",
    rule: "Bank Reconciliation reconciles Book balance and Bank balance to a single Adjusted balance at one date. Book side: add DIT, deduct OC, adjust NSF/service charges/errors. Bank side: add DIT, deduct OC, adjust bank errors. Both sides must arrive at the same Adjusted balance.",
    trigger: "bank reconciliation | book balance | bank balance | outstanding checks | deposits in transit | NSF | service charge",
    trap: "DIT and OC appear on opposite sides: DIT is added to Book (not yet recorded by bank) and deducted from Bank (not yet cleared); OC is deducted from Book (already recorded) and deducted from Bank (not yet cleared). Do not mix up which side each adjustment belongs to.",
    one_sentence: "Bank Rec = reconcile Book and Bank to one Adjusted balance at a single date.",
    example: "Book $22,100 + DIT $5,150 − OC $6,300 = Adjusted $20,950 | Bank $23,250 + DIT $5,150 − OC $6,300 = Adjusted $20,950 ✓ (single date)",
  },
  {
    topic_id: "CASH_002",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_CASH',
    sub_category_id: "U3_CASH",
    card_type: 'conditional',
    card_name: "Proof of Cash — 4-column test of transactions between two dates",
    rule: "Proof of Cash extends Bank Rec to 4 columns: Beg Balance / Receipts / Disbursements / End Balance. Each column is reconciled independently. Prior-period DIT clears in current Receipts column; prior-period OC clears in current Disbursements column. Current-period DIT/OC appear as reconciling items in their respective columns and carry into End Balance column. Solve order: ① sketch Beg and End Bank Rec first → ② fill in middle Receipts/Disbursements columns.",
    trigger: "proof of cash | 4-column | two-period | test of transactions | beginning and ending reconciliation",
    trap: "Prior-period OC does not clear in full automatically — only the portion actually paid in the current period clears in Disbursements; the remaining unpaid balance carries into End OC. Do not assume all prior OC is paid. Always build both endpoint Bank Recs first before filling the middle columns — skipping this step causes placement errors.",
    one_sentence: "Proof of Cash = 4-column Bank Rec that tracks how DIT and OC flow between two dates; build endpoint Recs first, then fill the middle.",
    example: "Given: Bank 3/31 23,250 | Receipts 29,200 | Disbursements 24,800 | Bank 4/30 27,650 / Prior DIT 5,150 (cleared Apr) / Prior OC 6,300 (3,200 cleared Apr; 3,100 remain) / Current OC 6,300\n\n| | Beg (3/31) | Receipts | Disbursements | End (4/30) |\n|---|---|---|---|---|\n| Bank | 23,250 | 29,200 | 24,800 | 27,650 |\n| DIT prior | +5,150 | (5,150) | | |\n| OC prior | (6,300) | | +3,200 | (3,100) |\n| OC current | | | (6,300) | (3,200) |\n| Adjusted | 22,100 | 24,050 | 21,700 | 24,450 |\n| Book | 22,100 | 24,050 | 21,700 | 24,450 |",
  },

  // [CASH_003] Cash and Cash Equivalents — Classification and Bank Offset
  // RULE    : Cash Equivalent = original maturity 3개월 이하 / 180-day CD 제외 / 음수 당좌예금 = 같은 은행 offset 가능
  // TRIGGER : original maturity 3개월 이하 기준 / CD 만기 확인 / 음수 잔액 offset
  // TRAP    : 180-day CD 포함 오답 / 음수 잔액 별도 부채 처리 오답
  {
    topic_id: "CASH_003",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_CASH',
    sub_category_id: "U3_CASH",
    card_name: "Cash and Cash Equivalents — Classification and Bank Offset",
    rule: "Cash Equivalent = original maturity 3개월(90일) 이하. CD는 만기 확인 필수: 90일 이하 → 포함 / 90일 초과 → 제외. 음수 당좌예금(overdraft): 같은 은행 내 양수 계정과 offset 가능(legal right of offset). 다른 은행이면 별도 부채로 분류.",
    trigger: "'original maturities of three months or less' → Cash Equivalent 분류 기준\nCD 항목 → 만기 90일 이하만 포함\n음수 당좌예금 → 같은 은행 여부 확인 → offset 가능",
    trap: "180-day CD → Cash Equivalent 포함 오답. 6개월 > 3개월 기준 초과.\n음수 당좌예금 → 별도 부채로 처리 오답. 같은 은행이면 offset.\n전부 포함($480,000) 또는 일부 누락 오답.",
    one_sentence: "Cash Equivalent = original maturity 90일 이하. 180-day CD 제외. 같은 은행 음수 잔액 = offset.",
    speed: "① 180-day CD → 제외\n② Checking 음수 → 같은 은행 → offset\n③ $262,500−$15,000+$37,500+$75,000=$360,000\n답: C",
    context_background: "[Cash Equivalent 분류 기준]\noriginal maturity(최초 만기) 기준 3개월 이하. 취득 시점 만기 기준이므로 남은 만기가 아닌 발행 시 만기로 판단.\n\n[CD 분류]\n90-day CD: 3개월 = 경계값 → 포함\n180-day CD: 6개월 > 3개월 → 제외\n\n[음수 당좌예금(Bank Overdraft)]\n같은 은행 내 다른 계정과 legal right of offset이 있으면 상계하여 순액으로 표시. 다른 은행이면 별도 Current Liability로 분류.",
    context: "Cash equivalent 분류는 취득 시점의 original maturity(최초 만기)가 기준. 남은 잔여 만기가 아니라, 발행일 기준 만기가 3개월(90일) 이하여야 포함. Bank draft는 수취 즉시 현금화 가능한 확정 지급 지시서로 cash에 해당. T-bill과 CD는 발행 시 만기가 각각 6개월, 1년이므로 90일 기준 초과 → 제외.",
  },

  // [CASH_004] Bank Overdraft — Multi-Bank B/S Presentation
  // RULE    : 같은 은행 내 → net 가능 / 다른 은행 음수 → 별도 Liability
  // TRIGGER : 다중 은행 + 음수 잔액 → 은행별 분리 후 처리
  // TRAP    : 같은 은행 음수 → 별도 Liability 착각(B) / 다른 은행 합산(C) / 일부 누락(D)
  {
    topic_id: "CASH_004",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_CASH',
    sub_category_id: "U3_CASH",
    card_type: 'calculation',
    card_name: "Bank Overdraft — Multi-Bank B/S Presentation (Same Bank Net vs Different Bank Liability)",
    rule: "같은 은행 내 계정 → legal right of offset 존재 → 전 계정 순액 합산 → Cash(양수) or Liability(음수) 표시\n다른 은행 음수 잔액 → legal right of offset 없음 → 별도 Current Liability로 분류\n\n판단 순서:\n① 은행별로 계정 분리\n② 같은 은행: 전부 합산 → 양수면 Cash / 음수면 Liability\n③ 다른 은행: 음수이면 무조건 별도 Liability",
    trigger: "다중 은행 계정 + 일부 음수 잔액 제시 → 은행별 분리 후 처리\n음수 잔액 발견 → 즉시 '같은 은행인가?' 확인\n같은 은행: net 합산 / 다른 은행: 별도 분리",
    trap: "같은 은행 내 음수 계정을 별도 Liability로 처리 → legal right of offset으로 상계 가능\n다른 은행 음수 잔액을 같은 은행과 합산 net → 다른 은행은 offset 불가\n일부 계정(Savings 등) 누락 → 같은 은행 내 전 계정 합산 필수\n공통 함정: '음수 = 무조건 별도 Liability' 착각",
    one_sentence: "같은 은행 내 → 전 계정 net / 다른 은행 음수 → 별도 Liability; 은행 구분이 핵심.",
    speed: "Step1: Granite Bank: −$600K+$450K+$75K+$750K = $675K → Cash\nStep2: Riverside Bank: −$562.5K → 다른 은행 → Liability $562,500\n→ Cash $675,000 / Liability $562,500",
    context_background: "[Bank Overdraft B/S 표시 원칙]\n\n① 같은 은행 내 계정\n법적으로 상계 권리(legal right of offset) 존재\n→ 음수 계정도 양수 계정과 합산하여 순액 표시\n\n예: Granite Bank\nLakewood −$600,000\nMillford +$450,000\nClearview +$75,000\nSavings +$750,000\n→ 순액 $675,000 → Cash (B/S 자산)\n\n② 다른 은행 음수 잔액\nlegal right of offset 없음\n→ 별도 Current Liability로 분류\n\n예: Riverside Bank Checking −$562,500\n→ 별도 Liability $562,500 (B/S 부채)\n\n[왜 offset이 중요한가]\n가령 모든 음수를 무조건 Liability로 처리하면:\nGranite Bank Lakewood −$600K도 별도 Liability\n→ 실제로는 같은 은행 내에서 상계 가능한 금액을 부채로 과다 계상\n→ B/S 왜곡\n\n[실무 맥락]\n대기업은 여러 은행·여러 지점 계정을 운용. 운영 계정이 일시적으로 음수가 되어도 같은 은행 내 다른 계정(Savings 등)으로 커버 가능 → offset 처리.",
    example: "Granite Bank net: −$600K+$450K+$75K+$750K = $675K → Cash\nRiverside Bank: −$562.5K → Liability\nB/S: Cash $675,000 / Short-term liability $562,500",
  },

  // [CASH_005] Bank Account Netting – Same Bank vs Different Banks
  // RULE    : 같은 은행 → netting / 다른 은행 음수 → 별도 Liability
  // TRIGGER : 복수 은행 + 음수 잔액 → 은행별 구분 처리
  // TRAP    : 전 계좌 합산 / 다른 은행 간 상계 / 양수만 Cash 처리
  {
    topic_id: "CASH_005",
    category: "Cash",
    topic_name: "Bank Account Netting – Same Bank vs Different Banks",
    rule: "【은행 계좌 B/S 표시 원칙】\n\n같은 은행 내 계좌\n→ 상계(netting) 가능\n→ 합계 양수 → Cash로 표시\n→ 합계 음수 → Liability(overdraft)로 표시\n\n다른 은행 간 계좌\n→ 상계 절대 불가\n→ 음수 잔액 → 무조건 별도 Liability\n→ 이유: 법적으로 다른 은행에 상계 청구 불가\n\n【계산 순서】\n① 은행별로 그룹화\n② 각 은행 내에서 netting\n③ 양수 → Cash 합산\n④ 음수 → Liability 별도 표시",
    trigger: '복수 은행 계좌 + 음수 잔액 → 은행별 구분 netting\n"같은 은행" → netting 가능\n"다른 은행" 음수 → 별도 Liability\n음수 계좌 표시 → 먼저 같은 은행인지 확인',
    trap: "모든 계좌 합산 → 단일 Cash 표시(은행 구분 필요).\n다른 은행 음수를 양수 은행과 상계(법적 상계 불가).\n양수만 Cash, 음수 전부 Liability(같은 은행 내 음수는 netting으로 상쇄).\n같은 은행 내 음수 계좌를 별도 Liability로 표시(netting 가능).",
    example: "First National: ($600K) + $450K + $75K + $750K = $675K → Cash\nHarbor Bank: ($562.5K) → Liability (다른 은행, 상계 불가)\n\nB/S 표시:\nCash: $675,000\nBank overdraft liability: $562,500",
    journal_entry: "",
    key_formula: "같은 은행 Net = 각 계좌 합산 → 양수=Cash / 음수=Liability\n다른 은행 음수 → 무조건 별도 Liability",
    speed: "같은 은행 → netting | 다른 은행 음수 → 별도 Liability | 은행별 구분이 핵심",
  },

  // [CASH_006] Investing Activities — Equipment Sale Proceeds vs Gain
  // RULE    : 투자활동 유입 = Sale Proceeds 전액 / Gain은 영업활동 간접법에서만 차감
  // TRIGGER : "gain on sale (sale price $X)" → 괄호 안 sale price 전액 투자활동 유입
  // TRAP    : Gain만 투자활동 포함 오답 / 매각 유입 무시 오답 / Gain 투자활동 차감 오답
  // EXAMPLE : Sale price $100,000 / Gain $10,000 → 투자활동 유입 $100,000 (Gain 무시)
  {
    topic_id: "CASH_006",
    category: "Statement of Cash Flows",
    topic_name: "Investing Activities — Equipment Sale Proceeds vs Gain",
    summary: "투자활동 유입 = Sale Proceeds 전액. Gain은 영업활동 간접법 조정용. Sale price는 괄호 안에 숨겨져 있는 경우 많음.",
    rule: "투자활동 유입 = Sale Proceeds 전액(Gain 포함). Gain은 영업활동 간접법에서만 차감. AR/AP → 영업. Nontrade NP → 재무.",
    trigger: '"gain on sale (sale price $X)" → 괄호 안 sale price 전액 투자활동 유입. "equipment purchases" → 투자활동 유출.',
    trap: "Gain만 투자활동 포함 오답. 매각 유입 무시하고 매입만 오답. Gain을 투자활동에서 차감 오답 → 영업활동에서만 조정.",
    example: "Sale price $100,000 / Gain $10,000 → 투자활동 유입 $100,000. 영업활동 간접법: Net Income에서 Gain $10,000 차감.",
    speed: "투자활동 = Sale Proceeds 전액 - 장기자산 취득액 (Gain/Loss 무시)",
  },

  // [CASH_007] Cash Reporting — Postdated Checks and Compensating Balance Exclusions
  // RULE    : 현금 제외: Postdated checks / Compensating balance(restricted) / MMA = unrestricted만
  // TRIGGER : "postdated checks" → 제외 / "compensating balance for a loan" → restricted → 제외
  // TRAP    : Postdated checks 포함 오답 / MMA 전액 포함 오답 / Compensating balance 추가 현금 오답
  // EXAMPLE : Cash $3,000 + Petty cash $120 + MMA unrestricted $5,000 = $8,120
  {
    topic_id: "CASH_007",
    category: "Cash and Cash Equivalents",
    topic_name: "Cash Reporting — Postdated Checks and Compensating Balance Exclusions",
    summary: "Postdated checks = 미래 날짜 수표 → 현금 제외. Compensating balance = 대출 조건 묶인 예금(꺾기) → 현금 제외.",
    rule: "현금 포함: Cash in bank, Petty cash, MMA/MMF unrestricted 부분. 현금 제외: Postdated checks, Compensating balance(장기대출→장기자산, 단기대출→Current별도표시).",
    trigger: '"postdated checks" → 현금 제외. "compensating balance" → restricted → 현금 제외. MMA 전액 아닌 unrestricted만.',
    trap: "Postdated checks 현금 포함 오답. MMA 전액 포함 오답. Compensating balance 추가 현금 오답.",
    example: "Cash $3,000 + Petty cash $120 + MMA unrestricted $5,000 = $8,120. Postdated $500 제외. Compensating $5,000 제외.",
    speed: "Postdated checks → 제외. Compensating balance → 제외. MMA = unrestricted만 현금.",
  },

  {
    topic_id: "IS_001",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Net Income vs OCI 구분",
    rule: "Net Income = Revenues - Operating expenses - Income tax expense. OCI 항목(Foreign currency translation adjustment, unrealized G/L on AFS, pension adjustments 등)은 Net income 계산에서 제외. Net income → retained earnings. OCI → Accumulated OCI (equity).",
    trigger: "net income | OCI | other comprehensive income | foreign currency translation | comprehensive income",
    trap: "Foreign currency translation adjustment는 'net of tax'라고 표시되어 있어도 Net income 항목이 아님 → OCI로 처리. OCI는 Net income에 가산도 차감도 하지 않음 — 계산 자체에서 제외.",
    one_sentence: "OCI 항목은 Net income 계산에서 완전히 제외 — Comprehensive income에만 포함.",
    example: "Revenues $120,000 − Operating exp $75,000 − Tax $15,000 = Net Income $30,000 / Foreign currency adj $6,000 → OCI only (not in Net Income)",
  },
  {
    topic_id: "IS_006",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'concept',
    card_name: "Comprehensive income — what is excluded (owner transactions)",
    rule: "Comprehensive Income = Net Income + OCI(PUFI). 제외 항목 = Owner transactions(자사주 거래·배당·주식발행). Treasury stock reissuance gain → APIC(equity 내부 재분류) → NI도 OCI도 아님 → Comprehensive Income 제외. PUFI: Pension / Unrealized AFS G/L / Foreign currency translation / Interest rate hedge.",
    trigger: "comprehensive income | not used | not included | owner transaction | treasury stock | PUFI | OCI | purpose of comprehensive income | nonowner sources | all changes in equity",
    trap: "D(realized loss on trading): Trading 실현손실 → Net Income → Comprehensive Income 포함. 'realized'라서 제외라고 착각 주의. B(foreign currency translation): OCI(PUFI F항목) → 포함. C(unrealized AFS): OCI(PUFI U항목) → 포함. [정의형 함정] 'segment'(부문 이익 연결/부문별 정보) → Segment reporting과 혼동, CI 아님. 'reconcile NI to operating cash flow' → 현금흐름표 간접법, CI 아님. 정답 단서 = 'nonowner sources' + 'all changes in equity'.",
    one_sentence: "Comprehensive Income 제외 = Owner transactions(자사주·배당); PUFI 4가지 + NI는 모두 포함.",
    example: "Treasury stock reissuance $10K gain → Cr.APIC $10K (equity 내부) → Comprehensive Income $0 영향 / AFS unrealized gain $5K → OCI → Comprehensive Income +$5K",
    speed: "① Comprehensive Income = NI + OCI(PUFI) ② Owner transaction → 제외 ③ Treasury stock reissuance → APIC → 제외 → 정답 A",
  },
  {
    topic_id: "IS_004",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Discontinued operations — after-tax gain/loss on disposal",
    rule: "처분 손익 = Sale price − Net assets BV (assets − liabilities). 반드시 세후(after-tax)로 보고. After-tax = Pre-tax × (1 − tax rate). Accumulated depreciation은 건물에서 차감 후 net BV 사용.",
    trigger: "'sell a division' + 'buyer assumes all assets and liabilities' → 순자산 BV 계산 필요\n자산 목록에 Accumulated depreciation 있으면 → net BV(= 취득원가 − 감가상각누계) 사용\nAfter-tax 명시 → Pre-tax × (1 − tax rate) 마무리",
    trap: "A ($2,200,000) → 총자산 gross 기준 계산 오류. Accumulated depreciation 차감 및 부채 제거 누락\nB ($1,540,000) → 총자산 기준 Pre-tax loss에 세후 처리한 오류\nD ($200,000) → Pre-tax loss 그대로 보고. after-tax 처리 누락\n공통 함정: ① Accum. dep. 차감 누락 ② 부채 제거 누락 ③ 세후 처리 누락",
    one_sentence: "처분 손익 = Sale price − (Assets net BV − Liabilities); After-tax = Pre-tax × (1 − t).",
    speed: "① Net assets BV = (건물 net + Inventory + AR) − (Mortgage + AP)\n= (2,000,000 + 500,000 + 200,000) − (1,100,000 + 600,000) = $1,000,000\n② Pre-tax loss = $800,000 − $1,000,000 = ($200,000)\n③ After-tax loss = $200,000 × 70% = $140,000",
    context_background: "[Discontinued Operations 처분 손익 계산 구조]\n\nStep 1. 자산 Net BV 계산\n- Buildings net: $5,000,000 − $3,000,000 = $2,000,000\n- Inventory: $500,000\n- AR: $200,000\n- Total assets net BV: $2,700,000\n\nStep 2. 부채 BV 계산\n- Mortgage: $1,100,000\n- AP: $600,000\n- Total liabilities: $1,700,000\n\nStep 3. 순자산 BV\n$2,700,000 − $1,700,000 = $1,000,000\n\nStep 4. Pre-tax loss\n$800,000 (sale price) − $1,000,000 (net assets BV) = ($200,000)\n\nStep 5. After-tax loss\n$200,000 × (1 − 30%) = $140,000\n\n[I/S 표시]\nDiscontinued operations는 continuing operations와 분리하여 I/S 하단에 별도 표시. 세후 금액으로 단일 라인 보고.\n\n[Buyer assumes liabilities의 의미]\n매수자가 부채를 인수한다는 것은 회사 입장에서 그 부채가 사라지는 것. 따라서 순자산(net assets) 기준으로 BV를 계산해야 함.",
  },

  // [IS_005] Net Income Calculation — Prior Period Adj / OCI / Discontinued Ops Exclusion
  // RULE    : Prior Period → RE 조정 / Unrealized AFS → OCI / Discontinued → 세후 별도
  // TRIGGER : 'prior-year understatement' → RE / 'unrealized' → OCI / 'discontinued' → 세후
  // TRAP    : Prior period 비용 처리(A) / Discontinued 세전(B) / 복합 오류(C)
  {
    topic_id: "IS_005",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_IS',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Net Income Calculation — Prior Period Adj / OCI / Discontinued Ops Exclusion",
    rule: "Net Income 계산 시 I/S 제외 항목: ① Prior Period Adjustment → RE 기초 조정(I/S 제외) ② Unrealized G/L on AFS → OCI(I/S 제외) ③ Discontinued Ops → 세후(×(1−t)) 별도 표시. 실현 AFS 이익은 Other Income으로 I/S 포함.",
    trigger: "'prior-year understatement/overstatement' → RE 조정, I/S 제외\n'unrealized gain/loss on AFS' → OCI, I/S 제외\n'discontinued segment disposal' → 세후 별도 표시\n'gain on sale of AFS' (실현) → Other Income, I/S 포함",
    trap: "$1,273,300(A): Prior period $59,000 당기 비용 처리 오류\n$1,316,000(B): Discontinued gain 세전 그대로 포함\n$1,267,700(C): Prior period + Discontinued 세전 복합 오류\n공통 함정 ①: Prior period adjustment ≠ 당기 비용 → RE 기초 직접 조정\n공통 함정 ②: Unrealized AFS → OCI, Net Income 아님\n공통 함정 ③: Discontinued gain 세전 사용 → 반드시 × (1−tax rate)",
    one_sentence: "Net Income 제외 3종: Prior Period(RE) / Unrealized AFS(OCI) / Discontinued는 세후 별도; 실현 AFS는 Other Income 포함.",
    speed: "Net Sales $3,566,000 − COGS − S&A = $1,866,000\n+ AFS실현 $8,000 → Pretax $1,874,000 × 70% = $1,311,800\n+ Discontinued $4,000 × 70% = $2,800\n= $1,314,600",
    context_background: "[I/S 포함 vs 제외 3대 함정]\n\n① Prior Period Adjustment\n전기에 발생한 오류를 당기에 발견한 경우. I/S가 아닌 RE 기초잔액을 직접 수정한다. 당기 비용/수익이 아님.\n\n② Unrealized G/L on AFS\nAFS 유가증권의 미실현 손익은 OCI로 처리. 매각(실현)되어야 비로소 I/S의 Other Income/Loss로 reclassify.\n\n③ Discontinued Operations\nI/S에는 포함되지만 Continuing Operations와 분리하여 세후 금액으로 별도 표시.\nGain $4,000 × (1−30%) = $2,800 (after tax)\n\n[I/S 구조]\nNet Sales (Gross Sales − Returns)\n− COGS\n= Gross Profit\n− S&A\n= Operating Income\n+ Other Income (실현 AFS gain)\n= Pretax Income from Continuing Ops\n− Income Tax\n= Income from Continuing Ops\n+ Discontinued Ops (after tax)\n= Net Income",
  },

  // [IS_002] Comprehensive Income — OCI vs NI Items (PUFI)
  // RULE    : CI = NI + OCI / Trading → NI(이미포함) / AFS → OCI / HTM → 인식없음
  // TRIGGER : "comprehensive income" + 항목 나열 → Trading 별도처리 금지
  // TRAP    : Trading loss 이중차감(A) / PSC 가산(B) / 복합오류(C)
  {
    topic_id: "IS_002",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Comprehensive Income — OCI vs Net Income Items",
    rule: "Comprehensive Income = Net Income + OCI. 증권 유형별 미실현손익: Trading → NI(이미포함, CI별도처리금지) / AFS → OCI(가감) / HTM → 인식없음. PUFI = Pension adjustments / Unrealized AFS G·L / Foreign currency translation / cash flow hedge effective portion.",
    trigger: "comprehensive income | OCI | AFS unrealized | trading securities unrealized | prior service cost | PUFI | pension adjustment | foreign currency translation",
    trap: "Trading 미실현손익을 OCI로 착각 → CI에서 별도 차감하면 이중 반영\nPrior service cost를 가산으로 처리 → PSC는 OCI 차감 항목\nHTM 미실현손익을 CI에 포함 → HTM은 인식 자체 없음\n공통: PUFI 외 항목을 OCI로 혼동하는 것",
    one_sentence: "CI = NI + OCI(PUFI). Trading 미실현손익은 이미 NI 안에 있음 → CI에서 절대 별도 처리 금지.",
    speed: "NI + AFS unrealized(OCI) ± Pension adj(OCI) ± FX translation(OCI) / Trading → 손대지 말 것",
    context_background: "[CI 표시 방법 2가지 — 둘 다 허용]\n① Single Statement: NI와 OCI를 하나의 statement에 연속 표시. OCI 항목 적고 단순한 기업에 적합.\n  Revenue $500K / Expenses ($400K) / Net Income $100K → OCI: AFS gain $10K / FX ($3K) → CI $107K\n\n② Two-Statement: I/S는 NI에서 종료, 바로 다음에 별도 CI statement 시작.\n  [Statement 1 — I/S] Net Income $100K ← 여기서 끝\n  [Statement 2 — CI] Net Income $100K + OCI $7K = CI $107K\n\n[실무 관습]\nUS GAAP 둘 다 허용이나 two-statement가 더 일반적.\n이유: NI가 독립적으로 강조 → 애널리스트 NI만 따로 보기 편함.\n특히 은행·보험은 two-statement 강하게 선호:\n- 은행: 예금 운용용 국채·회사채(AFS) 대규모 보유 → 금리 변동 시 AFS 미실현손익 급변 → OCI 크다\n  (2023 SVB 붕괴: AFS 미실현손실이 OCI에 쌓이다 뱅크런 시 실현손실 전환)\n- 보험: 보험료 운용용 장기채권(AFS) 대규모 보유 → 금리·시장 변동마다 OCI 크게 반영\n\n[절대 불가]\n- Footnote 표시 불가 → full FS와 동일 prominence 필요\n- Per share 보고 없음 (EPS는 NI 기준)\n- OCI 항목 없는 회사 → CI statement 불필요",
  },
  // [IS_003] Net Income — Prior Period Adjustment, OCI, and Discontinued Operations
  // RULE    : 제외 3종: Prior period adj → RE / AFS unrealized → OCI / Discontinued → after-tax 별도
  // TRIGGER : "prior-year adjustment" → RE / "unrealized gain on AFS" → OCI / "discontinued segment" → ×(1−t)
  // TRAP    : AFS realized gain 세후 처리 오류 → 세전으로 continuing ops 포함
  {
    topic_id: "IS_003",
    book_id: 'AA',
    chapter_id: 'AA_CH1',
    topic_group: 'AA_CH1_BASIC',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'calculation',
    card_name: "Net Income — Prior Period Adjustment, OCI, and Discontinued Operations",
    rule: "Net income 계산 제외 항목 3가지: ① Prior period adjustment → beginning RE 조정, I/S 미포함 ② AFS unrealized G/L → OCI only ③ Discontinued operations → after-tax 별도 표시. AFS realized gain → 세전으로 continuing operations 포함.",
    trigger: "'prior-year adjustment' → RE 조정, I/S 제외\n'unrealized gain on AFS' → OCI, net income 제외\n'discontinued segment' → after-tax × (1−tax rate)로 별도 표시",
    trap: "AFS realized gain을 세후 처리하는 오류 → 세전으로 continuing operations에 포함\nPrior period adjustment를 당기 비용으로 처리하는 오류 → RE 조정\nUnrealized gain을 net income에 포함하는 오류 → OCI only",
    one_sentence: "Net income = continuing ops after-tax + discontinued ops after-tax; prior period adj와 OCI는 완전 제외.",
    speed: "제외 3종 확인 → Net sales − COGS − S&A + realized gains = before-tax → ×(1−t) → + discontinued ×(1−t)",
    context_background: "Prior period adj는 RE 조정, AFS unrealized은 OCI, discontinued는 after-tax 별도 — 세 항목 모두 net income 계산에서 제외 또는 별도 처리.",
  },

  // [IS_007] Multiple-Step I/S – G&A vs Selling vs Other Expense Classification
  // RULE    : G&A = 관리부서 직접비 + 공용비 × admin% / Interest → Other / Loss on disposal → Other
  // TRIGGER : "multiple-step I/S" + "G&A" → 세 bucket 분류 / 공용비 사용비율 배분
  // TRAP    : 임차료 전액 G&A / Interest를 G&A로 분류 / Loss on disposal → operating 오류
  {
    topic_id: "IS_007",
    category: "Income Statement",
    topic_name: "Multiple-Step I/S – G&A vs Selling vs Other Expense Classification",
    rule: "【Multiple-Step I/S 구조】\nSales\n- COGS\n= Gross Profit\n- Selling Expenses   ← 판매부서 관련\n- G&A Expenses      ← 관리부서 관련\n= Operating Income\n- Other Expenses    ← interest, loss on disposal 등\n= Net Income\n\n【항목별 분류 기준】\nLegal/audit fees → 100% G&A\n공용 임차료 → 사용 부서 비율대로 배분 (sales 50% → Selling / accounting 50% → G&A)\nInterest on inventory floorplan → financing cost → Other expense (below operating)\nLoss on abandoned equipment → 비반복적·비영업적 → Other loss (below operating)\n\n【SCF 관점 (간접법)】\nLoss on abandoned equipment:\n- I/S: Other loss (below operating income)\n- SCF indirect: Operating section add-back (현금 없는 손실이므로 가산)\n- 현금 수취 있었다면: Investing inflow로 표시\n\n【SG&A vs G&A 혼동 주의】\nSG&A = Selling + G&A 합산 (단순 I/S, 실무)\nG&A = 관리비용만 (multiple-step I/S에서 별도 표시)",
    trigger: '"multiple-step I/S" + "G&A" → Selling / G&A / Other 세 bucket 분류\n"used equally by sales and accounting" → 공용비용 비율 배분\n"interest on floorplan/loan" → Other expense, G&A 제외\n"loss on abandoned equipment" → Other loss, G&A 제외',
    trap: "SG&A로 무의식적으로 읽어서 Selling 몫까지 G&A에 포함하는 실수.\n공용 임차료 전액을 G&A에 포함 (사용 비율 배분 필요).\nInterest on floorplan → G&A 아닌 Other expense.\nLoss on abandoned equipment → operating expense 아닌 Other loss.\nI/S의 Other loss를 SCF의 Investing과 혼동 (SCF 간접법에선 operating add-back).",
    example: "Grove Co. G&A 계산:\nLegal & audit fees $255,000 → 전액 G&A ✅\nRent $360,000 × 50% = $180,000 → G&A (나머지 50% → Selling) ✅\nInterest on floorplan $315,000 → Other expense ❌\nLoss on equipment $52,500 → Other loss ❌\nTotal G&A = $255,000 + $180,000 = $435,000",
    journal_entry: "",
    key_formula: "G&A = 관리부서 직접비용 + 공용비용 × 관리부서 사용비율\n(Interest expense · 비영업손실 제외)",
    speed: "Selling = Advertising + Freight out + Rent×sales% + Sales salaries | G&A = Legal/audit + Rent×admin% + Officers' salaries | Interest·처분손실 → Other expense | SCF 간접법: add-back",
  },

  // [IS_010] Unusual and Infrequent Items — US GAAP Classification (Post-ASU 2015-01)
  // RULE    : Extraordinary item 폐지 → Continuing operations 내 pretax / Net of tax ❌ / Discontinued 이후 ❌
  // TRIGGER : "unusual and infrequent" → continuing ops / "net of tax" → 틀린 선지 / "after discontinued" → 틀린 선지
  // TRAP    : Net of tax 표시 / Discontinued 이후 배치 / OCI로 분류
  {
    topic_id: "IS_010",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'concept',
    card_name: "Unusual and infrequent items — continuing operations pretax, not extraordinary",
    rule: "US GAAP ASU 2015-01 (2016년 적용) — Extraordinary item 폐지\n\nUnusual + Infrequent 항목 현재 처리:\n① 위치: Income from continuing operations 안에 포함\n② 금액: Pretax (gross) — net of tax 표시 불가\n③ 표시: 중요하면 별도 line item\n④ 공시: 주석에 성격·금액 공시\n\n[I/S 구조]\nIncome from continuing operations\n  Operating income\n  Other income/expense\n  Unusual & infrequent items  ← pretax로 여기\nIncome tax expense\nNet income (continuing)\n─────────────────────\nDiscontinued operations (net of tax)  ← 여기 아님\n─────────────────────\nNet income\n\n[구 GAAP vs 현재 비교]\n구 GAAP: Unusual + Infrequent → Extraordinary item → Discontinued 아래 net of tax\n현재: Extraordinary item 폐지 → Continuing operations 내 pretax",
    trigger: '"unusual and infrequent" → continuing operations 내 pretax 포함\n"net of tax" + unusual/infrequent → 틀린 선지\n"after discontinued operations" → 틀린 선지 (구 GAAP)\n"extraordinary" → US GAAP에서 2016년 이후 폐지',
    trap: "Net of tax 표시: Pretax(gross)가 맞음 — net of tax는 Discontinued operations에만\nDiscontinued 이후 표시: Extraordinary item 폐지 → Continuing 안으로\nOCI로 분류: OCI는 AFS unrealized·FX translation 등 — unusual/infrequent와 다른 범주\n구/현재 GAAP 혼동: 2016년 이후 Extraordinary item 없음",
    one_sentence: "Unusual + infrequent → Continuing operations 내 pretax(gross); Extraordinary item은 US GAAP에서 폐지.",
    speed: "Unusual + infrequent → Continuing operations / Pretax(gross) | Net of tax ❌ | Discontinued 이후 ❌",
    context_background: "[ASU 2015-01 배경]\n2015년 FASB는 Extraordinary item 개념을 폐지했다. 이유: '비경상·비반복적'의 정의가 너무 주관적이고 적용이 일관되지 않아 재무제표 비교가능성을 해쳤기 때문.\n\n[폐지 전 구 GAAP]\nExtraordinary item = Unusual + Infrequent\n→ I/S 맨 아래 (Discontinued operations 다음)\n→ Net of tax 표시\n→ 별도 EPS 공시 필요\n\n[폐지 후 현재 GAAP]\n→ Continuing operations 안에 포함 (pretax)\n→ 중요하면 별도 line item + 주석\n→ Discontinued operations는 여전히 net of tax (변경 없음)\n\n[Net of tax가 허용되는 것]\nDiscontinued operations → net of tax ✅\nOCI 항목 → net of tax ✅\nUnusual/infrequent → pretax ❌ (gross만)",
  },

  // [IS_008] Comprehensive Income — I/S Structure with Discontinued Operations and OCI
  // RULE    : ① Comprehensive Income = Net Income + OCI ② I/S 순서: Operating → 이자비용 → 세전 → 세금 → 계속영업 → 중단영업(net of tax) ③ Discontinued ops 'net of tax' = 세금 재계산 불필요
  // TRIGGER : "comprehensive income" → Net Income + OCI | "discontinued operations, net of tax" → 세금 재계산 금지 | net sales/gross profit 제공 → 함정 숫자
  // TRAP    : Net sales / gross profit을 출발점으로 사용 | discontinued ops에 세금 재적용 | OCI 누락 또는 OCI에 세금 적용
  // EXAMPLE : Operating $135M − interest $45M = $90M → ×60% = $54M → −$20M(discontinued) = $34M → +$3.5M(OCI) = $37,500,000
  {
    topic_id: "IS_008",
    category: "Income Statement",
    topic_name: "Comprehensive Income — I/S Structure with Discontinued Operations and OCI",
    rule: "① Comprehensive Income = Net Income + OCI ② I/S 순서: Operating → 이자비용 → 세전 → 세금 → 계속영업 → 중단영업(net of tax) ③ Discontinued ops 'net of tax' = 세금 재계산 불필요",
    trigger: '"comprehensive income" 요구 → Net Income + OCI | "discontinued operations, net of tax" → 세후 금액 그대로 사용, 세금 재계산 금지 | "tax rate X%" → 계속영업이익(continuing ops)에만 적용 | net sales / gross profit 제공 → 함정용 숫자',
    trap: "Net sales나 gross profit을 출발점으로 사용하면 오답 | discontinued ops에 세금 재적용하면 오답(이미 net of tax) | OCI 누락 또는 OCI에 세금 적용하면 오답",
    context_background: "Comprehensive Income = Net Income + OCI. Net Income은 I/S 구조를 따라 순서대로 계산해야 한다: Operating Income → 이자비용 차감 → 세전이익 → 세금 차감 → 계속영업이익 → 중단영업손익(net of tax) 가산/차감 = Net Income. 여기에 OCI를 더하면 Comprehensive Income. 문제에서 net sales / gross profit 등 불필요한 숫자가 많이 주어질수록 출발점(Operating Income)을 고정하는 훈련이 핵심.",
    speed: "Operating $135M − interest $45M = $90M → ×60% = $54M → −$20M(discontinued) = $34M → +$3.5M(OCI) = $37,500,000",
  },

  // [IS_009] Unusual/Infrequent Loss — Continuing Operations & Separate Disclosure
  // RULE    : Frequent → not unusual → continuing ops, no disclosure / 금액 = actual (expected 아님)
  // TRIGGER : "frequently caused" → no disclosure / "sold for less" → actual 보고
  // TRAP    : expected average 사용 / frequent인데 separate disclosure 추가
  {
    topic_id: "IS_009",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'conditional',
    card_name: "Frequent loss reporting — actual vs expected, separate disclosure required?",
    rule: "두 가지 판단:\n① 금액: Actual loss 보고 (실제 발생 사건) / Expected average 금지\n② 공시: Unusual AND infrequent 둘 다 충족 → 별도 공시\n   Frequent → not unusual → 별도 공시 불필요\n\n→ Frequent 손실 = Actual + No separate disclosure + Continuing operations",
    trigger: '"frequently caused similar damage" → not unusual → no separate disclosure\n"sold for less than carrying amount" → actual loss 발생 → actual 보고\n"expected average" 선지 → 즉시 소거 (미실현 항목 선인식 불허)',
    trap: "Expected average 사용 → 미래 예상치, GAAP 불허. 반드시 actual.\nFrequent인데 separate disclosure 추가 → 불필요.\nUnusual OR infrequent 하나만 충족해도 공시 필요라고 착각 → AND 조건.",
    one_sentence: "Frequent → not unusual → continuing ops, no disclosure | 금액 = actual (expected 아님)",
    speed: "Frequent → no disclosure / Actual 발생 → actual 보고 → C",
    context_background: "[Unusual/Infrequent 판단 기준]\nUnusual: 기업의 일반적 영업활동과 무관한 성격\nInfrequent: 가까운 미래에 재발 가능성 낮음\n→ 둘 다 충족 시만 별도 공시 필요\n\n[Frequent = Ordinary business risk]\n자주 발생하는 손실은 일반 영업비용과 동일 → continuing operations 포함\n별도 공시 불필요\n\n[Actual vs Expected average]\n발생주의: 실제로 일어난 사건을 기록\nExpected average = 미래 예상치 → 미실현 항목 선인식 → GAAP 불허\n매년 우박/홍수 피해 예상된다고 평균치로 평탄화 불가\n반드시 actual Year 10 loss 보고",
  },

  {
    topic_id: "ARO_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_ARO',
    sub_category_id: "U4_CONTINGENCIES",
    card_type: 'concept',
    card_name: "ARO 변동 인식 — 자산 완전 감가상각 후",
    rule: "감가상각 중: ARO 변동 → 자산 carrying amount 조정 (Dr. Asset / Cr. ARO). 완전 감가상각 후: carrying amount = $0 → 자산에 얹을 곳 없음 → 전액 P&L 직행 (Dr. Loss / Cr. ARO). 실제 철거 시: ARO vs 실제 비용 차이 → gain/loss. decommissioning liability = ARO (동일 개념).",
    trigger: "asset retirement obligation | ARO | decommissioning | dismantling | fully depreciated | retirement obligation revised",
    trap: "완전 감가상각 후 ARO 증가를 자산 조정으로 처리하는 실수. carrying amount = $0이면 무조건 P&L. 증가/감소 구분 없이 모두 profit or loss.",
    one_sentence: "완전 감가상각 후 ARO 변동은 자산 조정 불가 → 전액 P&L.",
    example: "Asset fully depreciated / ARO revised up $20,000 → Dr. Loss $20,000 / Cr. ARO $20,000 (not asset adjustment)",
  },
  // [ARO_003] ARO accretion expense — beginning ARO × credit-adjusted risk-free rate
  // RULE    : Accretion = 기초 ARO × credit-adjusted rate (risk-free rate 아님)
  // TRIGGER : "accretion expense" + ARO → 기초 ARO × credit-adjusted rate
  // TRAP    : risk-free rate 사용(4%) / 자산 CV 기준 계산 / ARO 전액 = expense
  {
    topic_id: "ARO_003",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_ARO',
    sub_category_id: "U4_PAYABLES",
    card_type: 'calculation',
    card_name: "ARO accretion expense — beginning ARO × credit-adjusted risk-free rate",
    rule: "Accretion Expense = 기초 ARO Liability × credit-adjusted risk-free rate\n\n[왜 credit-adjusted rate인가]\n ARO는 최초 인식 시 credit-adjusted rate로 PV 계산 → 매년 동일 rate로 unwinding\nRisk-free rate(국채) + 회사 신용위험 가산 = credit-adjusted rate\n\n[왜 자산 CV와 무관한가]\nAccretion = ARO 부채의 시간 경과에 따른 증가분. 자산 감가상각과 별개.",
    trigger: "'accretion expense' + 'asset retirement obligation' → 기초 ARO × credit-adjusted rate\n'risk-free rate X%' + 'credit-adjusted rate Y%' 동시 제시 → Y% 사용, X% 무시\n기초 ARO 확인 → × credit-adjusted rate = accretion",
    trap: "risk-free rate(4%) 사용 오류 → credit-adjusted rate(8%) 사용\n자산 연초/연말 CV × rate 오류 → 자산 금액 전혀 무관\nARO 전액을 accretion으로 착각 → ARO × rate가 accretion\n공통 함정: risk-free rate와 credit-adjusted rate 두 개 주면 credit-adjusted 선택",
    one_sentence: "Accretion = 기초 ARO × credit-adjusted risk-free rate; risk-free rate·자산 CV 무관.",
    speed: "① 기초 ARO: $150,000\n② Credit-adjusted rate: 8% (risk-free 4% 무시)\n③ Accretion: $150,000 × 8% = $12,000\n→ 정답 C",
    context_background: "[ARO 전체 회계 흐름]\n\n① Day 1 취득 시:\nDr. Asset $X / Cr. ARO Liability $X (PV of future retirement cost)\nPV 계산 시 credit-adjusted risk-free rate 사용\n\n② 매년 (두 가지 별개 entry):\n감가상각: Dr. Depreciation Expense / Cr. Accumulated Depreciation\nAccretion: Dr. Accretion Expense / Cr. ARO Liability\n\n③ 실제 철거 시:\nDr. ARO Liability / Cr. Cash (실제 비용)\n차액 → Gain or Loss\n\n[Accretion의 경제적 의미]\n미래 철거비용을 현재 PV로 할인해서 부채 인식 → 시간이 지날수록 만기에 가까워짐\n→ PV가 커지는 것 = unwinding of discount = Accretion Expense\n복리 이자처럼 매년 잔액이 증가하다가 만기(철거 시점)에 명목금액에 도달\n\n[Credit-adjusted vs Risk-free rate]\nRisk-free rate: 국채 기준, 신용위험 없는 순수 시간가치\nCredit-adjusted: Risk-free + 회사 부도 위험 가산\nARO는 '이 회사'가 실제로 지불하는 비용 → 회사 신용위험 반영 → credit-adjusted 사용",
  },
  // [ARO_002] ARO — initial recognition: liability PV vs expense
  // RULE    : Liability = PV of future cost (명목금액 아님) / Expense at inception = $0
  // TRIGGER : "federal regulations" + "decommissioned" + "discounted value" + "placed into service"
  // TRAP    : 명목금액 $40M 사용 / inception expense $18M 인식 / 법적 의무 있어도 Liability $0
  {
    topic_id: "ARO_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_ARO',
    sub_category_id: "U4_PAYABLES",
    card_type: 'concept',
    card_name: "ARO — initial recognition: liability PV vs expense",
    rule: "ARO 인식 시점 = 자산 서비스 투입일. Liability = PV of future retirement cost(명목금액 아님). PV 계산 시 credit-adjusted risk-free rate 사용 — 무위험이자율(국채 기준) + 회사 신용위험 가산. Expense at inception = $0 → 감가상각비로 내용연수에 걸쳐 분산. 분개: Dr.Asset(+ARO) / Cr.ARO Liability.",
    trigger: "state law/federal regulations requires dismantled/decommissioned | discounted value | asset retirement | placed into service → ARO Liability = PV / Expense = $0",
    trap: "미래 명목금액(future cost) → PV로 할인한 값 사용 / inception 시점 expense 인식 → $0, 감가상각으로 분산 / 법적 의무 있으면 Liability $0 불가",
    one_sentence: "ARO = 법적 의무 있을 때 서비스 투입 시점에 PV로 즉시 부채 인식, expense는 $0.",
    example: "해체비용 $40M / PV $18M → Dr.Platform $18M / Cr.ARO Liability $18M. Expense $0. 이후 10년간 감가상각비에 ARO 포함 분산.",
  },
  {
    topic_id: "ACE_001",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ACCRUAL',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Accounting Changes & Error Corrections — 4가지 구분",
    rule: "① Change in Estimate → Prospective (당기+미래, 소급X) — 예: warranty, 감가상각 내용연수. ② Change in Accounting Principle → Retrospective (net of tax, 소급) — 예: FIFO→LIFO. ③ Change in Reporting Entity → Retrospective (모든 과거 재무제표 재작성). ④ Error Correction → Restatement (소급+재무제표 재작성) — 예: 계산 실수, 현금주의→발생주의.",
    trigger: "change in estimate | change in principle | error correction | restatement | retrospective | prospective | warranty estimate | depreciation method",
    trap: "감가상각법·내용연수 변경 = Change in Estimate (Prospective) — Change in Principle 아님. 현금주의→발생주의 = Error Correction (Restatement) — GAAP 의무사항 위반이므로. net of tax 처리는 Change in Principle만 해당.",
    one_sentence: "새 정보로 추정치 업데이트 = Prospective / 회계원칙 변경 = Retrospective / 과거 잘못 = Restatement.",
    example: "Warranty $150→$165 per unit (new experience) → Change in Estimate → Year 2 continuing operations, no restatement",
  },
  {
    topic_id: "ACE_002",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ACCRUAL',
    sub_category_id: "U2_ACCOUNTING_CHANGES",
    card_type: 'concept',
    card_name: "Omission error — balance sheet effect (Assets vs Liabilities)",
    rule: "매입 미기록 오류 분개 = Dr.Inventory / Cr.A/P. 실사(physical count)로 재고가 올바르게 반영된 경우 → Assets: No effect. A/P 미기록 → Liabilities: Understated.",
    trigger: "failed to record a credit purchase | physical inventory correctly included | omission | balance sheet effect | understated",
    trap: "재고가 실사로 정확하다고 해서 Assets도 정확한 게 아니라고 혼동하지 말 것 → 실사로 Inventory는 correct, Assets는 No effect. B(Understated/Understated)가 유혹적이나 Assets은 영향 없음.",
    one_sentence: "매입 미기록 + 실사로 재고 정확 → Assets: No effect / Liabilities: Understated(A/P 누락).",
    example: "Dr.Inventory / Cr.A/P 누락 → Inventory 실사로 correct → Assets 영향 없음 / A/P 장부 미반영 → Liabilities Understated",
    speed: "① 'failed to record credit purchase' 확인 → Dr.Inv / Cr.A/P 누락 ② 'physical inventory correctly included' → Inventory(자산) 정확 → Assets: No effect ③ A/P 미기록 → Liabilities: Understated → 정답 C",
  },
  {
    topic_id: "PPE_006",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "DDB to SL switch — depreciation method change",
    rule: "DDB 기간: 2 × (1/내용연수) × Book Value. SL 전환 시: (Book Value at switch − Salvage Value) ÷ 잔여내용연수. DDB는 salvage value 무시, SL 전환 후에는 반드시 차감.",
    trigger: "double-declining balance | DDB | switch to straight-line | SL | depreciation method change | remaining life",
    trap: "SL 전환 시 original cost나 original useful life 사용하는 실수 — 반드시 전환 시점 Book Value ÷ 잔여내용연수 사용. DDB 기간에는 salvage value 무시하지만 SL 전환 후에는 (BV − Salvage) 사용.",
    one_sentence: "DDB→SL 전환 시: original cost 아닌 전환 시점 Book Value ÷ 잔여내용연수.",
    example: "Equipment $200,000 / 5yr / no salvage | Yr1 DDB: 2/5×$200K=$80K (BV $120K) | Yr2 DDB: 2/5×$120K=$48K (BV $72K) | Yr3 SL: $72K÷3=$24K | Accum. Dep. = $152,000",
  },
  // [PPE_008] PP&E expenditure — capitalize vs expense
  // RULE    : Capitalize 조건 3가지 중 하나만 OK — Addition / Benefit several periods / Improve efficiency
  // TRIGGER : "capitalize" + modify/rearrange + "reduction in costs" + "should ~ costs be capitalized"
  // TRAP    : market value↑ 없음 + useful life↑ 없음 → No/No 함정 — efficiency improvement만으로 capitalize 가능
  {
    topic_id: "PPE_008",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "PP&E expenditure — capitalize vs expense",
    rule: "Capitalize 조건 3가지 중 하나만 해당되면 OK: ①Addition(새로운 것 추가) ②Benefit several periods(여러 기간 효익) ③Improve efficiency(효율성 향상). Expense = Ordinary repair/maintenance(현상 유지만, 아무 효익 없음).",
    trigger: "capitalize | modify | rearrange | install | replace | reduction in costs | should ~ costs be capitalized",
    trap: "market value↑ 안 됐다 + useful life↑ 안 됐다 → No/No 고르게 만드는 함정. Capitalize 조건은 셋 중 하나만 충족하면 되고, reduction in production costs expected = efficiency improvement → capitalize 가능.",
    one_sentence: "modify/rearrange 후 비용 절감 예상되면 → efficiency improvement → capitalize.",
    example: "건물 수선 후 생산비용 감소 예상 → market value↑ 없어도 capitalize O / 단순 파이프 교체로 현상 유지만 → expense.",
  },
  {
    topic_id: "PPE_011",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Land cost vs Land Improvements — calculation",
    rule: "Land 원가 = 구매가 + 중개수수료 + 체납재산세 + 철거비 − 고철수익 + 측량/소유권이전비용. Land Improvements(주차장포장·울타리·조경·스프링클러·진입로·보도·외부조명) = 별도 유형자산 계상 + 감가상각 대상. Land = 감가상각 없음.",
    trigger: "purchased land | demolished | tore down | salvage proceeds | paving | parking lot | land improvements | commission | delinquent property taxes",
    trap: "C($92,200): paving을 Land에 포함 오류 → paving = Land Improvements(별도 자산, 감가상각). A($80,200): 철거 net비용($4,000) 누락. B($85,200): 고철수익 $1,000 차감 누락. 구분 기준: 토지 준비 과정(철거·정지·측량) → Land / 토지 위 교체 가능 구조물(포장·울타리·조경) → Land Improvements.",
    one_sentence: "Land = 준비 과정 전체 비용 − 고철수익 / Land Improvements = 교체 가능 구조물 → 별도 감가상각.",
    example: "Purchase $70,000 + Commission $4,200 + Tax $6,000 + Demo $5,000 − Salvage $1,000 = Land $84,200 / Paving $8,000 → Dr. Land Improvements $8,000 (감가상각 대상)",
    speed: "① Purchase $70,000 + Commission $4,200 + Tax $6,000 = $80,200 ② + Demo $5,000 − Salvage $1,000 = $84,200 ③ Paving $8,000 → Land Improvements 제외 → 정답 D $84,200",
  },

  // [PPE_012] Held for Sale — All Six Criteria Required (M-A-A-1-R-N)
  // RULE    : 6개 기준 ALL 충족 시에만 Held for Sale / 하나라도 미충족 → Held and Used 유지
  // TRIGGER : held for sale 분류 질문 → 6가지 체크리스트 / 미충족 항목 찾기
  // TRAP    : "hopes to sell" → probable 아님 / active marketing 없으면 ③ 미충족
  {
    topic_id: "PPE_012",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "Held for sale — all six criteria required: partial compliance keeps asset as held and used",
    rule: "Held for Sale 분류 = 6가지 기준 ALL 충족 (ALL or NOTHING)\n\nM — Management commits to a plan\nA — Asset available for immediate sale in present condition\nA — Active program to locate a buyer initiated\n1 — Sale probable within 1 year\nR — Reasonable price relative to fair value\nN — No likelihood of plan withdrawal\n\n하나라도 미충족 → Held and Used 유지\n측정: Lower of CV or (FV − Costs to Sell)",
    trigger: "'held for sale' 분류 질문 → 6기준 체크리스트 적용\n'listing agent not hired' / 'not advertised' → ③ Active program 미충족\n'fair value not determined' → ⑤ Reasonable price 미충족\n'hopes to sell' → ④ Probable 아님 (hope ≠ probable)\n미충족 항목 1개라도 → Held and Used",
    trap: "A: Held for sale 오분류 + write-down까지 → 6기준 미충족 시 분류 자체 불가\nC: 'management plans/hopes' → ④ probable 충족으로 착각. hope/plan ≠ probable\nD: Held for sale 오분류 (write-down 없이) → 분류 자체 불가\n공통 함정: 6기준 중 일부만 충족해도 held for sale 가능하다는 착각 → ALL OR NOTHING",
    one_sentence: "Held for sale = 6기준 전부 충족 필수; 하나라도 미충족이면 Held and Used 유지.",
    speed: "① 6기준 체크리스트 순서대로 확인\n② 미충족 항목 발견 즉시 → Held and Used\n③ 이 문제: ③ Active program ✗ + ⑤ Reasonable price ✗ → B",
    context_background: "[왜 ALL or NOTHING인가]\nHeld for Sale 분류는 자산 측정 방식을 감가상각 중단 + Lower of CV/FV 기준으로 바꾸는 중대한 전환. 섣부른 분류는 자산 과소평가로 이어질 수 있으므로 6가지 조건을 모두 갖춰야만 전환을 허용한다.\n\n[M-A-A-1-R-N 각 기준 해설]\nM: 경영진이 매각 계획을 승인하고 변경 예정 없음\nA: 현재 상태에서 즉시 매각 가능 (수리·개조 불필요)\nA: 구매자 찾기 위한 적극적 마케팅 프로그램 시작 (listing agent 고용, 광고 등)\n1: 1년 이내 매각 가능성 높음 (probable) — 단순 hope/plan은 부족\nR: 공정가치 대비 합리적 가격으로 적극 마케팅 중\nN: 계획 철회 가능성 없음\n\n[이 문제 분석]\n충족: M(이사회 승인) / A(수리 불필요) / N(철회 없음)\n미충족: A(listing agent 미고용, 광고 없음) / R(FV 미확정)\n불확실: 1('hopes'는 probable 아님)\n→ 최소 2개 미충족 → Held and Used 유지",
  },

  // [PPE_009] Held for Sale — Measurement: Lower of CV or FV Less Costs to Sell
  // RULE    : Lower of CV or (FV − Costs to Sell). FV > CV여도 costs to sell 차감 후 재비교.
  // TRIGGER : "held for sale" + "costs to sell" → FV − costs to sell 먼저 계산 → Lower of 비교
  // TRAP    : FV만 사용 / costs to sell 무시 / FV > CV라서 write-down 불필요 착각
  {
    topic_id: "PPE_009",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_name: "Held for Sale — Measurement: Lower of CV or FV Less Costs to Sell",
    rule: "Held for sale 측정 = Lower of ① CV or ② FV − Costs to Sell. FV > CV여도 costs to sell 차감 후 ②가 더 낮으면 write-down. Held for use: write-up 불가. Held for sale: write-up 가능(단, 과거 write-down 금액 한도 내).",
    trigger: "'held for sale criteria' → Lower of CV or (FV − Costs to Sell)\n'costs to sell' → FV에서 반드시 차감 후 비교\nFV > CV여도 costs to sell 차감 후 재비교 필수",
    trap: "FV만 사용 → costs to sell 무시 오답\nCV 그대로 유지 → write-down 불필요 착각\nFV + costs to sell → 말이 안 되는 계산\n공통 함정: FV > CV이므로 write-down 없다는 착각 → costs to sell 차감 후 역전 가능",
    one_sentence: "Held for sale = Lower of CV or (FV − Costs to Sell). FV > CV여도 costs to sell 차감 후 역전 가능.",
    speed: "① FV − costs = $1,200,000 − $90,000 = $1,110,000\n② Lower of $1,125,000 or $1,110,000 = $1,110,000\n③ Write-down $15,000\n답: A",
    context_background: "[Held for Sale 측정 원칙]\nHeld for sale로 분류된 자산은 더 이상 영업에 사용되지 않고 매각될 예정이므로, 실제 매각 시 받을 순수령액(NRV = FV − Costs to Sell)과 현재 장부가치 중 낮은 값으로 측정한다.\n\n[FV > CV인데도 write-down하는 경우]\n이 문제의 핵심 함정. FV $1,200,000 > CV $1,125,000이므로 write-down이 필요 없다고 착각하기 쉽다. 그러나 costs to sell $90,000을 차감하면 NRV = $1,110,000 < CV $1,125,000이 되어 write-down 필요.\n\n[Held for use vs Held for sale 비교]\nHeld for use: write-up 절대 불가(US GAAP 보수주의)\nHeld for sale: write-up 가능(단, 과거 write-down 금액 한도 내)\n→ 분류가 바뀌면 측정 기준도 바뀐다.",
  },

  // [PPE_010] Land cost — proceeds from sale of existing structure
  // RULE    : 기존 건물·scrap 매각수익 → Land cost 차감 / 철거비용 → Land cost 가산
  // TRIGGER : 'proceeds from sale of existing building/structure/timber/scrap' → deduct from Land cost
  // TRAP    : other income 인식 / clearing costs와 상계 후 expense·amortize 처리
  {
    topic_id: "PPE_010",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_name: "Land cost — proceeds from sale of existing structure",
    rule: "토지 취득 시 기존 건물·구조물 매각수익과 고철(scrap) 매각수익은 Land cost에서 차감. 철거비용은 Land cost에 가산. Land cost = Purchase price + Clearing/demolition costs − Proceeds from sale.",
    trigger: "'proceeds from sale of existing building/structure/timber/scrap' → Land cost에서 차감\n'costs to clear the land' → capitalize into Land, expense/amortize 불가",
    trap: "A/C (netted against clearing costs + expensed or amortized) → clearing costs 자체가 capitalize 대상. expense·amortize 처리 불가\nD (other income) → 별도 수익 인식 불가. Land cost 차감 항목\n공통 함정: 매각수익을 수익(income)으로 인식하거나 clearing costs와 상계 후 비용 처리하는 오류",
    one_sentence: "기존 건물·scrap 매각수익은 Land cost에서 차감; clearing costs는 Land cost에 가산.",
    speed: "Proceeds from sale → Land cost 차감\nLand cost = Purchase price + Demolition/Clearing costs − Proceeds from sale",
    context_background: "[Land cost 구성 원칙]\n토지를 건설 용도로 사용 가능한 상태로 만들기까지의 순비용(net cost)이 Land cost.\n\n[항목별 처리]\n✅ Land cost 가산:\n- Purchase price\n- Title fees, legal fees, survey costs\n- Demolition/clearing costs (철거·정지 비용)\n- Grading, back-filling\n\n➖ Land cost 차감:\n- Proceeds from sale of existing structure (기존 건물 매각수익)\n- Scrap proceeds from demolition (고철 매각수익)\n- Proceeds from sale of timber/soil\n\n[이 문제의 케이스]\n기존 건물을 매수자가 직접 구매 후 철거 → 회사 입장에서는 건물 매각대금 수령 → Land cost 차감\n\n[왜 other income이 아닌가]\n매각수익은 토지를 취득하는 과정에서 발생한 부수적 수입으로, 토지 취득의 순비용을 줄여주는 항목이다. 별도 수익으로 인식하면 Land cost가 과대계상된다.",
  },
  {
    topic_id: "PPE_011",
    sub_category_id: "U3_PPE",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    card_type: 'conditional',
    card_name: "Exchange of nonmonetary assets — gain/loss recognition",
    one_sentence: "Commercial substance → FV basis, full gain/loss. Lacks CS → BV basis, loss always recognized, gain deferred unless cash received.",
    rule: "Has Commercial Substance: record at FV of asset given up, recognize full gain/loss. Lacks Commercial Substance: Loss → always recognize immediately. Gain → defer unless (①) cash received > 25% of FV of asset given up → recognize full gain, or (②) cash received ≤ 25% → recognize partial gain = Total Gain × Cash received ÷ FV of asset given up.",
    trigger: "exchange | nonmonetary | commercial substance | boot | cash received | lacks commercial substance | similar assets",
    trap: "Loss is always recognized immediately regardless of commercial substance. Cash payer never recognizes gain — only cash receiver applies the partial/full gain rules. Lacks CS + no cash = full gain defer.",
    speed: "Commercial Substance?\n├── YES → FV basis / Full Gain or Loss\n└── NO  → Loss: 즉시 인식\n         Gain: defer (원칙)\n         예외①: Cash > 25% of FV → Full Gain 인식\n         예외②: Cash ≤ 25% of FV → Partial Gain\n                = Total Gain × Cash ÷ FV of asset given up",
    example: "BV $60,000 / AccDep $64,000 / FV $80,000 / Cash received $5,000\nTotal Gain = FV - BV net = $80,000 - ($80,000 - $64,000 + ... ) \nCash ÷ FV = $5,000 ÷ $80,000 = 6.25% → Partial Gain\nRecognized Gain = $20,000 × $5,000 ÷ $80,000 = $1,250\n\nJE:\nDr. Cash                  5,000\nDr. Acc. Depreciation    64,000\nDr. New PPE              ???\n    Cr. PPE (old)                 80,000\n    Cr. Gain                       1,800\n→ New PPE = 80,000 + 1,800 - 5,000 - 64,000 = 12,800\n(Deferred gain 흡수 → New PPE BV 감소)",
    context_background: "상업적 실질(Commercial Substance)이 없는 거래란 교환 전후로 미래 현금흐름이 실질적으로 바뀌지 않는 거래. 예: 트럭A → 트럭B (같은 용도). 실질 없는 거래에서 Gain 인식 허용 시 이익 조작 가능성 → GAAP이 원칙적으로 Gain defer. 단 현금 수수가 있으면 그만큼 실현된 부분이 있으므로 비율만큼 인식 허용.",
  },

  // [PPE_012] Cost of Land — acquisition vs building construction costs
  // RULE    : Land = 취득원가 + 취득 부대비용 + 토지 사용 준비 비용 (철거 net of salvage 포함)
  // TRIGGER : "removal of old building" + land → Land cost / "excavation" → Building cost
  // TRAP    : 문제 나열 순서 함정 — Excavation 다음에 Removal이 나와도 Removal은 Land
  {
    topic_id: "PPE_012",
    book_id: 'IA',
    chapter_id: 'IA_CH1',
    topic_group: 'IA_CH1_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Cost of Land — acquisition costs vs building construction costs",
    rule: "토지(Land) 원가 = ①취득원가(cash paid) + ②취득 부대비용(title search, legal fees) + ③토지 사용 준비 비용(county assessments, removal of existing building net of salvage). 굴착(Excavation) = 새 건물 기초 공사 시작 → Building 원가.",
    trigger: '"removal of old building" → Land (토지 사용 준비)\n"excavation for basement/construction" → Building (새 건물 착공)\n"salvage" → 철거비용에서 차감 후 net금액만 Land\n"county assessment" → Land (토지 관련 공공 부담금)',
    trap: "① 문제 나열 순서 함정: Excavation 뒤에 Removal이 나와도 Removal은 Land — 순서가 아니라 목적으로 판단\n② Excavation을 Land로 오분류 — 굴착은 새 건물 건설 시작, Building 원가\n③ Salvage 차감 전 금액을 Land에 포함 — net(철거비 - salvage)만 Land",
    one_sentence: "Land = 취득원가 + 부대비용 + 철거(net); Excavation은 Building — 순서 아닌 목적으로 판단.",
    example: "철거비 $21,000 - salvage $5,000 = $16,000 → Land / Excavation $21,000 → Building",
    speed: "① 항목별 목적 판단 (순서 무시)\n② Removal net of salvage → Land ✅\n③ Excavation → Building ❌ 제외\n④ Cash + Title + Assessment + Removal(net) 합산 → 정답",
  },

  // [PPE_013] Interest capitalization — average accumulated expenditures
  // RULE    : 자본화 이자 = 가중평균지출액 기준 / 특정차입금 먼저 → 초과분 일반차입금 이율
  // TRIGGER : "borrowed $X for construction at Y%" → 특정차입금 우선 / "other outstanding debt at Z%" → 초과분
  // TRAP    : 실제 지출 합계 사용 / 특정차입금 이자만 자본화 / 연말 잔액 × 건설이율
  {
    topic_id: "PPE_013",
    book_id: 'IA',
    chapter_id: 'IA_CH1',
    topic_group: 'IA_CH1_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Interest capitalization — average accumulated expenditures and specific vs. general borrowing rate",
    rule: "건설이자 자본화 2단계:\n① Average Accumulated Expenditures = 각 지출액 × 잔여월/12 합산\n② 자본화 이자 계산:\n  - 특정차입금(specific borrowing) 한도까지 → 특정 이율 적용\n  - 초과분 → 일반차입금(general borrowing) 이율 적용\n  - 자본화 이자 ≤ 실제 발생 총이자 (초과 불가)",
    trigger: '"borrowed $X for construction at Y%" → 특정차입금 → 먼저 적용\n"other outstanding debt at Z%" → 일반차입금 → 초과분에 적용\n지출일 + 금액 나열 → 가중평균 계산 신호\nJan.2 지출 → 12/12 (연초 = 전체 기간)',
    trap: "① 실제 지출 합계($1,650,000)를 그대로 사용 → 가중평균 적용 필요\n② 특정차입금 이자만 자본화 → 초과분 일반차입금 이자 누락\n③ 연말 잔액 × 건설이율 → 가중평균 아님\n④ Dec.1 지출을 12/12 가중 → 잔여월 1개월 → 1/12",
    one_sentence: "자본화 이자 = 가중평균지출액 기준; 특정차입금 이율 먼저, 초과분은 일반차입금 이율.",
    example: "Jan.2 $300K×12/12 + May.1 $900K×8/12 + Dec.1 $450K×1/12 = $937,500 / $750K×12% + $187,500×10% = $108,750",
    context_background: "건설 중인 자산에 대해 GAAP은 건설기간 중 발생한 이자를 자산 원가에 포함(자본화)하도록 요구한다. 자본화 기준은 실제 지출 잔액이 아닌 가중평균 지출액(Average Accumulated Expenditures)이다. 특정 건설목적 차입금의 이율을 먼저 적용하고, 가중평균 지출액이 특정차입금을 초과하면 초과분에 일반차입금 이율을 적용한다.",
    speed: "① 지출일별 × 잔여월/12 → 가중평균 $937,500\n② 특정차입금 $750,000 × 12% = $90,000\n③ 초과 $187,500 × 10% = $18,750\n④ $90,000 + $18,750 = $108,750 → 정답 C",
  },

  // [PPE_014] Interest capitalization — Dec.31 expenditure 0/12 and ceiling rule
  // RULE    : Dec.31 지출 = 0/12 → 당기 기여 없음 / 자본화 이자 ≤ 실제 발생 이자(상한선)
  // TRIGGER : "December 31" 지출 → 0/12 / "January 2" → 12/12 / 자본화 후 실제이자와 비교
  // TRAP    : Dec.31 포함 가중평균 / 차입금 전액 × 이율 / 상한선을 자본화 금액으로 오인
  {
    topic_id: "PPE_014",
    book_id: 'IA',
    chapter_id: 'IA_CH1',
    topic_group: 'IA_CH1_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Interest capitalization — Dec.31 expenditure 0/12 weighting and capitalization ceiling",
    rule: "이자 자본화 추가 규칙:\n① Dec.31 지출 → 잔여월 0개월 → 0/12 → 당기 가중평균 기여 없음 (내년부터 반영)\n② Jan.2 지출 → 12/12 → 전액 반영\n③ 상한선: 자본화 이자 ≤ 실제 발생 총이자\n④ 자본화 기준 = 가중평균 지출액 (차입금 잔액 아님)",
    trigger: '"December 31" 지출 → 0/12 → 당기 자본화 기여 없음\n"January 2" 지출 → 12/12 → 전액 반영\n자본화 이자 계산 후 → 실제 발생 이자(차입금 × 이율)와 비교 → 상한선 확인',
    trap: "① Dec.31 지출을 1/12 또는 전액 가중 → 0/12가 정확\n② 차입금 전액 × 이율 = 자본화 이자로 오인 → 가중평균 지출액 기준\n③ 자본화 = $0 → 공사 중이고 이자 발생하면 자본화 가능\n④ 상한선(실제이자)을 자본화 금액으로 오인",
    one_sentence: "Dec.31 지출 = 0/12; 자본화 이자 = 가중평균지출액 × 이율, 실제 발생이자 초과 불가.",
    example: "Jan.2 $1,500,000×12/12 + Dec.31 $1,500,000×0/12 = $1,500,000 / ×8% = $120,000 / 상한 $360,000 → OK",
    context_background: "이자 자본화는 가중평균 지출액 기준이다. 연말(Dec.31) 지출은 잔여월이 0개월이므로 당기 가중평균에 기여하지 않는다 — 내년부터 반영된다. 또한 자본화 이자는 실제 발생 이자를 초과할 수 없다. 차입금 전체에 대한 이자가 발생해도 자본화는 가중평균 지출액 기준으로만 계산한다.",
    speed: "① Jan.2 $1,500,000 × 12/12 = $1,500,000\n② Dec.31 → 0/12 → $0\n③ $1,500,000 × 8% = $120,000\n④ 상한 $360,000 > $120,000 → OK → 정답 A",
  },

  // [PPE_015] Leasehold improvements — lesser of useful life or remaining lease term
  // RULE    : 상각 기간 = Lesser of ① useful life ② remaining lease term / 예외 없음
  // TRIGGER : "leasehold improvement" → 자본화 후 lesser of two로 상각
  // TRAP    : lease term(더 긴 것) 사용 / expense as incurred / 리스 만료 시 일시 expense
  {
    topic_id: "PPE_015",
    book_id: 'IA',
    chapter_id: 'IA_CH1',
    topic_group: 'IA_CH1_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Leasehold improvements — amortization over lesser of useful life or remaining lease term",
    rule: "Leasehold improvements 처리:\n① 자본화(capitalize) — expense as incurred 아님\n② 상각 기간 = Lesser of:\n   - Useful life of improvements\n   - Remaining lease term\n③ 예외 없이 항상 짧은 쪽 선택\n④ 이유: 리스 종료 후 혜택은 다른 사람에게 귀속 → 내가 혜택받는 기간만 상각",
    trigger: '"leasehold improvement" → 자본화 후 lesser of two로 상각\n"useful life X years / remaining lease term Y years" → 두 개 비교 → 짧은 것 선택\n"nonrenewable lease" → 갱신 없음 → 리스 잔여기간 그대로',
    trap: "① Lease term(더 긴 것)으로 상각 → lesser 아님\n② Expense as incurred → leasehold improvement = 자본화 대상\n③ 리스 만료 시 일시 expense → 상각, 일시 비용처리 아님\n④ Useful life만 보고 lease term 비교 생략 → 반드시 두 개 비교",
    one_sentence: "Leasehold improvements = 자본화 후 lesser of(useful life, remaining lease term)로 상각; 예외 없음.",
    example: "Useful life 15년 / Lease term 20년 → 15년 상각 / Useful life 20년 / Lease term 15년 → 15년 상각",
    context_background: "임차인이 임차 공간을 개량할 때 발생하는 leasehold improvement 비용은 자산으로 자본화한다. 상각 기간은 개량물의 실제 수명과 리스 잔여기간 중 짧은 것으로 한다. 리스가 먼저 끝나면 그 이후 혜택은 임대인 또는 다음 임차인에게 돌아가므로 내가 혜택받는 기간은 리스 기간까지다. 반대로 개량물이 먼저 닳으면 내용연수가 기준이 된다. 어느 경우든 항상 두 개 비교 후 짧은 것 선택.",
    speed: "① Leasehold improvement → 자본화\n② Useful life vs. Remaining lease term → 두 개 비교\n③ Lesser = 짧은 것 선택 → 정답",
  },

  // [PPE_016] PPE Capitalize — Attachment + Overhaul: Both Capitalized Despite No Useful Life Increase
  // RULE    : ①ready for use(attachment+installation) ②생산능력향상(overhaul) → 전액 capitalize
  // TRIGGER : "significant increase in production" → capitalize / "no useful life increase" → 함정 무시
  // TRAP    : Overhaul expense(A) / Installation 제외(B) / useful life 기준 착각(C)
  {
    topic_id: "PPE_016",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "PPE Capitalize — Attachment + Overhaul: Both Capitalized Despite No Useful Life Increase",
    rule: "PPE 자본화 2가지 기준:\n\n① Ready for intended use 원칙\n자산을 사용 가능 상태로 만드는 모든 비용\n→ 새 attachment 구매 + installation 비용\n\n② 생산능력·효율성 향상 원칙\n품질·효율·생산능력을 향상시키는 비용\n→ Overhaul parts + Overhaul labor\n→ Useful life 증가 불필요 — 생산성 향상만으로 충분\n\n❌ Expense (단순 유지보수)\n현상 유지만, 어떤 향상도 없는 수리비",
    trigger: '"significant increase in production" → 생산능력 향상 → capitalize\n"installation" → ready for use 직접비용 → capitalize\n"did not increase useful life" → 함정 문구 → 무시\n전 항목 자본화 여부 체크 → 유지보수가 아닌 이상 전액 capitalize',
    trap: "Useful life 증가 없음 → Overhaul expense 처리: 생산능력 향상만으로 capitalize 가능 → 오류\nInstallation 제외: Installation은 attachment를 사용 가능 상태로 만드는 직접비용 → capitalize\n전액 $0: useful life 기준이 자본화 유일 조건이라는 착각 → 생산성 향상 기준도 존재\n공통 함정: 'useful life 증가 없음' 문구 = expense 신호로 오인",
    one_sentence: "Attachment(구매+설치) → ready for use capitalize / Overhaul → 생산성 향상 capitalize; useful life 미증가는 함정.",
    speed: "$126K + $54K + $39K + $21K = $240,000 전액\n'useful life 미증가' → 무시 / 'significant increase in production' → capitalize 확정",
    context_background: "[PPE 자본화 vs Expense 판단 기준]\n\n■ Capitalize (자본화)\n① 취득 비용: 구매가 + 부대비용(운송·설치·시험가동)\n② 개량(Improvement): 자산 품질·효율·생산능력 향상\n③ 교체(Replacement): 자산 일부를 더 좋은 것으로 교체\n\n■ Expense (즉시 비용)\n일상적 수리·유지보수: 현상 유지만, 어떤 향상도 없음\n→ 예: 기계 오일 교환, 단순 부품 교체(성능 동일)\n\n[Useful Life 증가 ≠ 자본화 유일 조건]\nUS GAAP 자본화 기준은 useful life 증가에만 국한되지 않음\n- Useful life 증가 → capitalize ✅\n- 생산능력·효율 향상 → capitalize ✅ (useful life 무관)\n- 자산 가치 향상 → capitalize ✅\n- 단순 유지보수 → expense ❌\n\n[이 문제 적용]\nAttachment 구매 $126K → 새 자산 취득 → capitalize ✅\nInstallation $54K → ready for use 직접비용 → capitalize ✅\nOverhaul parts $39K → 'significant increase in production' → capitalize ✅\nOverhaul labor $21K → 동일 → capitalize ✅\n\n합계 $240,000 전액 자본화 — useful life 증가 여부와 무관",
    example: "Attachment $126K + Installation $54K + Overhaul parts $39K + Labor $21K = $240,000 전액 capitalize\n'significant increase in production' = 생산성 향상 기준 충족 / useful life 미증가 = 무관",
  },

  // [PPE_017] Held for Sale Classification – Available for Immediate Sale Condition
  // RULE    : 6가지 조건 ALL 충족 필요 / "renovations required" → ② 조건 미충족 → held and used
  // TRIGGER : "requires work before sale" → 즉시 매각 불가 → held for sale ❌
  // TRAP    : 나머지 조건 충족해도 1개 미충족 → 전체 실패 / write-up 금지
  {
    topic_id: "PPE_017",
    category: "PPE",
    topic_name: "Held for Sale Classification – Available for Immediate Sale Condition",
    rule: "【Held for Sale 6가지 기준 (모두 충족 필요)】\n① 경영진 매각 계획 확정\n② 현재 상태로 즉시 매각 가능 ← 핵심 함정\n③ 적극적 매수자 탐색 프로그램 개시\n④ 매각 가능성 높고 1년 내 완료 예상\n⑤ 적극적 마케팅 진행 중\n⑥ 계획 변경/철회 가능성 낮음\n\n【미충족 시 처리】\n1개라도 미충족 → 전체 기준 미충족 → Held and Used 유지\n금액 = Carrying value 그대로 (write-up 금지)\n\n【Held and Used write-up 금지】\nUS GAAP: held-and-used 자산은 공정가치로 올리는 write-up 절대 불가\n시장가·NRV·예상매각가 모두 무시 → carrying value 유지",
    trigger: '"requires renovations/updates before marketable/sale" → ② 조건 미충족 → held for sale ❌\n나머지 조건 다 충족해도 1개 미충족 → 전체 기준 미충족\n"carrying value" vs "market value" → held and used → carrying value 선택',
    trap: "나머지 5개 조건 충족 → held for sale로 착각 (6개 모두 충족 필요).\n시장가·NRV·예상매각가로 write-up 시도 → held and used write-up 금지.\n공사가 'minor'라서 괜찮다고 착각 → 규모 무관, 즉시 매각 불가하면 기준 미충족.",
    example: "Riverside Tower: 6개 조건 중 ② '즉시 매각 가능' 미충족 (인테리어 공사 필요)\n→ Held and used 유지\n→ 장부금액 $6.3M 그대로\n→ 시장가 $6.6~6.9M, 예상 NRV 무시\n→ Write-up 불가",
    journal_entry: "Held and used 유지 시 추가 JE 없음\n(기존 carrying value $6.3M 그대로 유지)",
    key_formula: "Held for sale = 6가지 조건 ALL 충족\n미충족 시 → Held and used @ carrying value (write-up 금지)",
    speed: '"renovations required" → 즉시 매각 불가 → held for sale ❌ → held and used @ carrying value',
  },

  // [PPE_018] Interest Capitalization — Weighted Average Accumulated Expenditures
  // RULE    : Step 1: 각 지출 × 잔여월/12 합산 = 가중평균 누적지출액 / Step 2: × 이자율 = Avoidable / Step 3: MIN(Actual, Avoidable)
  // TRIGGER : "construction for its own use" + 연중 여러 시점 지출 → 가중평균 누적지출액 계산
  // TRAP    : 단순 합계에 이자율 적용 오답 / Actual Interest 전액 자본화 오답 → MIN rule 필수
  // EXAMPLE : Jan 1 $120,000×12/12 + Sep 1 $150,000×4/12 = $170,000 × 10% = $17,000 → MIN($30,000, $17,000) = $17,000
  {
    topic_id: "PPE_018",
    category: "PP&E",
    topic_name: "Interest Capitalization — Weighted Average Accumulated Expenditures",
    summary: "연중 여러 시점 지출 시 각 지출 × 잔여월/12로 가중평균 누적지출액 계산 후 MIN(Actual, Avoidable) 적용",
    rule: "Step 1: 각 지출 × 잔여월/12 합산 = 가중평균 누적지출액. Step 2: × 이자율 = Avoidable Interest. Step 3: MIN(Actual Interest, Avoidable Interest) = 자본화 금액.",
    trigger: '"construction for its own use" + 연중 여러 시점 지출 → 가중평균 누적지출액 계산. 지출 날짜별 잔여월/12 적용.',
    trap: "단순 합계에 이자율 적용 오답. 마지막 지출액만 사용 오답. Actual Interest 전액 자본화 오답 → MIN rule 필수.",
    example: "Jan 1 $120,000 × 12/12 + Sep 1 $150,000 × 4/12 = $170,000. $170,000 × 10% = $17,000. MIN($30,000, $17,000) = $17,000",
    speed: "연중 여러 시점 지출 → 각 지출 × 잔여월/12 → 합계 × 이자율 → MIN(Actual, Avoidable)",
  },

  // [PPE_019] Impairment Test — US GAAP 2-Step Recoverability Test
  // RULE    : Step 1: Undiscounted CF vs CV → CF > CV = 손상 없음 종료 / CF < CV → Step 2: CV - FV = 손상차손
  // TRIGGER : "expected future cash flows" + "present value" + "market value" → 2단계 손상 검사
  // TRAP    : PV < CV → 손상 인식 오답 / FV < CV → 손상 인식 오답 — Step 1 통과하면 Step 2 없음
  // EXAMPLE : Undiscounted CF $130,000 > CV $120,000 → Step 1 통과 → 손상 $0 (PV $100,000 / FV $105,000 무관)
  {
    topic_id: "PPE_019",
    category: "PP&E",
    topic_name: "Impairment Test — US GAAP 2-Step Recoverability Test",
    summary: "Step 1: Undiscounted CF > Carrying Value → 손상 없음($0). PV나 Fair Value가 낮아도 Step 1 통과하면 손상 인식 불가.",
    rule: "Step 1: Undiscounted CF vs Carrying Value. CF > CV → 손상 없음 종료. CF < CV → Step 2: 손상차손 = Carrying Value - Fair Value.",
    trigger: '"expected future cash flows" + "present value" + "market value" → 2단계 손상 검사. Step 1 Undiscounted CF 먼저 비교.',
    trap: "PV < CV → 손상 인식 오답. Fair Value < CV → 손상 인식 오답. Step 1 통과하면 Step 2 없음.",
    example: "Undiscounted CF $130,000 > CV $120,000 → Step 1 통과 → 손상 $0. PV $100,000 / FV $105,000 무관.",
    speed: "US GAAP 손상 → Step 1: Undiscounted CF > CV? YES → $0 (Step 2 불필요)",
  },

  // [PPE_020] Change in Estimated Useful Life — Prospective Treatment
  // RULE    : 내용연수 변경 → 전진법 / 새 감가상각비 = 변경 시점 NBV ÷ 잔여내용연수
  // TRIGGER : "estimated useful life extended/changed" → NBV 계산 후 잔여연수로 나누기
  // TRAP    : 원가 ÷ 새 총내용연수 오답(소급 금지) / 기존 상각비 그대로 오답 / NBV ÷ 새 총연수 오답
  // EXAMPLE : NBV $28,000 ÷ 잔여 10년 = $2,800 / $48,000 ÷ 15년 = $3,200 오답
  {
    topic_id: "PPE_020",
    category: "PP&E",
    topic_name: "Change in Estimated Useful Life — Prospective Treatment",
    summary: "내용연수 변경 = 회계추정변경 → 전진법. 변경 시점 NBV ÷ 잔여내용연수 = 새 감가상각비.",
    rule: "내용연수 변경 → 전진법. 새 감가상각비 = 변경 시점 NBV ÷ 잔여내용연수. 원가 ÷ 새 총내용연수 금지.",
    trigger: '"useful life extended/changed" → 전진법. NBV 먼저 계산 → 잔여연수로 나누기.',
    trap: "원가 ÷ 새 총내용연수 오답 → 과거 소급 금지. 기존 상각비 그대로 오답. NBV ÷ 새 총내용연수 오답 → 잔여연수 사용.",
    example: "NBV $28,000 ÷ 잔여 10년 = $2,800. $48,000 ÷ 15년 = $3,200 오답.",
    speed: "내용연수 변경 → NBV ÷ 잔여내용연수 (전진법, 소급 금지)",
  },

  // [PPE_021] Depreciation Method — Loss on Disposal Reverse Engineering
  // RULE    : Loss on disposal → 정액법(상각 느림 → NBV 높음) / Gain → DDB/SYD(상각 빠름 → NBV 낮음)
  // TRIGGER : "resulted in a loss" → NBV > Sale Price → 정액법
  // TRAP    : DDB/SYD = 가속상각 → NBV 낮음 → loss 아닌 gain / Composite = 유사 자산 그룹용
  // EXAMPLE : 원가 $100, SV 20%, 10년, 5년 후 $50 매각. 정액법 NBV $60 > $50 → Loss
  {
    topic_id: "PPE_021",
    category: "PP&E",
    topic_name: "Depreciation Method — Loss on Disposal Reverse Engineering",
    summary: "Loss on disposal → NBV > Sale Price → 상각 느린 방법 → 정액법. 가속상각(DDB/SYD)은 NBV 낮아서 gain 발생.",
    rule: "Loss on disposal → 정액법(상각 느림 → NBV 높음). Gain on disposal → DDB/SYD(상각 빠름 → NBV 낮음).",
    trigger: '"resulted in a loss" → NBV > Sale Price → 정액법. "resulted in a gain" → NBV < Sale Price → 가속상각.',
    trap: "DDB/SYD = 가속상각 → NBV 낮음 → loss 아닌 gain. Composite = 유사 자산 그룹용 → 개별 자산 문제 부적합.",
    example: "원가 $100, SV 20%, 10년, 5년 후 $50 매각. 정액법 NBV $60 > $50 → Loss. DDB NBV $32.8 < $50 → Gain.",
    speed: "Loss on disposal → 정액법. Gain on disposal → 가속상각(DDB/SYD).",
  },

  // [PPE_023] Land Cost Capitalization vs. Land Improvement
  // RULE    : Land = Purchase + Commission + Back taxes + (Demolition − Salvage) / Paving·Fencing → Land improvement 별도
  // TRIGGER : "delinquent taxes" → Land / "demolition + salvage" → net → Land / "paving/fencing/lighting" → Land improvement
  // TRAP    : Fencing을 Land에 포함 / Salvage 차감 누락 / 미납세금 누락
  {
    topic_id: "PPE_023",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Land cost capitalization vs. land improvement — what goes in Land",
    rule: "Land 취득원가 구성:\n① Purchase price\n② Commission / closing costs\n③ Delinquent property taxes (취득 시 인수)\n④ Demolition cost − salvage proceeds (net)\n⑤ Grading / clearing / draining\n\nLand improvement (별도 감가상각 자산):\n- Paving (포장)\n- Fencing (울타리)\n- Lighting (조명)\n- Parking lot surface\n- Sprinkler systems\n\n[핵심 구분 기준]\nLand → 토지 자체를 사용 가능 상태로 만드는 비용\nLand improvement → 토지 위에 추가 설치하는 구조물 (수명 有 → 상각)",
    trigger: '"delinquent / back taxes" → Land 포함 (취득 시 인수)\n"demolished / tore down / removed" + "salvage" → net cost → Land\n"paving / fencing / lighting" → Land improvement 별도 자산\n"parking lot" → surface는 Land improvement / 토지 자체는 Land',
    trap: "Paving·Fencing을 Land에 포함 — 주차장 목적이어도 Land improvement는 별도\nSalvage proceeds 차감 누락 — 철거비 gross 포함 실수\n미납세금을 expense 처리 — 취득 시 인수한 부채성 비용 → Land capitalize\n철거비 전체 누락 — intended use 준비 비용임을 놓침",
    one_sentence: "Land = 취득원가 + 부대비용 + 인수세금 + 철거net | Paving·Fencing → Land improvement 별도.",
    speed: "Land = Purchase + Commission + Back taxes + (Demolition − Salvage) | Paving·Fencing·Lighting → Land improvement",
    example: "Purchase $52,500 + Commission $3,150 + Back taxes $4,500 + Demolition $3,750 − Salvage $750 = Land $63,150\nFence $6,000 → Land improvement (별도 자산, 감가상각 대상)",
    context_background: "[Land vs Land improvement 구분의 경제적 실질]\n\nLand는 비상각 자산 — 영구적으로 사용 가능하므로 감가상각 없음.\nLand improvement는 상각 자산 — 포장, 울타리, 조명 등은 시간이 지나면 닳거나 노후화되므로 내용연수에 걸쳐 감가상각.\n\n철거비를 Land에 포함하는 이유:\n→ 기존 구조물을 제거하는 것은 토지 자체를 사용 가능 상태로 만드는 과정\n→ 새 건물 건설 목적의 철거 → 건물 취득원가에 포함 (토지 아님)\n→ 토지 사용 목적의 철거 → Land에 포함\n\n미납세금(delinquent taxes)을 Land에 포함하는 이유:\n→ 취득 시 매도인 대신 인수하는 부채 → 취득원가의 일부\n→ 취득 후 발생하는 재산세 → 기간비용(expense)",
    journal_entry: "취득 시:\nDr. Land [purchase + commission + taxes + demolition net]\nDr. Land Improvement [paving + fencing]\nCr. Cash [총 지출액]",
  },

  // [PPE_024] PPE Installation Costs — Direct Costs to Get Asset Ready: Capitalize Regardless of Useful Life
  // RULE    : 설치 목적 직접비용 전액 자본화 — "내용연수 증가 없음"은 함정, intended use 기준이 올바른 판단 기준
  // TRIGGER : "to install the equipment" + rearrangement / removal / wall → 전액 자본화
  // TRAP    : "did not increase the life" → expense 처리 함정 — 효율성 향상만으로도 자본화 충족
  {
    topic_id: "PPE_024",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "PPE Installation Costs — all direct costs to get asset to intended use are capitalized",
    rule: "자산 원가(Cost of Asset) = 자산을 의도한 장소에, 의도한 상태로 만들기 위한 모든 직접비용 포함\n\n✅ Capitalize:\n① Equipment invoice price\n② Rearrangement cost (to install the equipment)\n③ Removal / demolition cost (to install the equipment)\n\n❌ Expense:\n- Ordinary maintenance (현상 유지만, 자산 향상 없음)\n\n[핵심 원칙]\n'내용연수 증가 없음'은 자본화 배제 사유가 아님\n→ 효율성 향상(efficiency improvement)만으로도 자본화 요건 충족\n→ 설치 목적 직접비용 = 전액 자본화",
    trigger: "'to install the equipment' → 설치 목적 비용 → 전액 자본화\n'rearrangement cost' / 'wall removal' / 'removal cost' → 설치 직접비 → capitalize\n'did not increase the life but made it more efficient' → 효율성 향상 → capitalize (내용연수 함정 무시)\n'What amount should be capitalized' → equipment cost + 모든 설치 직접비 합산",
    trap: "'did not increase the useful life' → expense 처리해야 한다고 혼동\n→ 자본화 기준은 useful life 증가가 아니라 intended use 상태로 만드는 직접비용 여부\n'rearrangement / removal'을 기간비용으로 처리 → 설치 목적이면 전액 자본화\n장비 invoice만 포함, 설치 부대비용 누락 → $175,000만 선택하는 함정(D)",
    one_sentence: "설치 목적 직접비용 전액 자본화 — useful life 증가 불필요, intended use 상태 달성이 기준.",
    key_formula: "Capitalized cost = Equipment cost + Rearrangement cost + Removal cost",
    example: "Equipment $175,000 + Rearrangement $12,000 + Wall removal $3,000 = $190,000 자본화\n내용연수 증가 없어도 효율성 향상 → 전액 capitalize",
    speed: "'to install' 목적 비용 전부 합산 → $175,000 + $12,000 + $3,000 = $190,000 → B",
    context_background: "[intended use 원칙]\nUS GAAP PPE 자산 원가 = '자산을 의도한 장소에, 의도한 상태(condition for intended use)로 만들기 위한 모든 비용'. 설치를 위해 불가피하게 발생한 비용은 자산 없이는 발생하지 않았을 직접비용 → 자본화.\n\n[useful life 증가 ≠ 자본화 유일 요건]\nUS GAAP 자본화 기준 3가지 중 하나만 충족하면 됨:\n① Useful life 증가\n② 효율성·생산성 향상 (efficiency/productivity improvement)\n③ 새로운 기능 추가 (new capability)\n→ 이 문제: 효율성 향상 → ② 충족 → 전액 자본화\n\n[오답 해부]\nA $178,000: wall removal $3,000 누락\nC $187,000: rearrangement $12,000 누락, wall removal만 포함\nD $175,000: 설치 부대비용 전액 누락 → equipment invoice만 계상\n→ 정답 B $190,000",
  },

  // [PPE_025] PPE Cost Capitalization — In Transit Insurance & Testing: Both Capitalized
  // RULE    : 취득 완성 전 발생 비용 전부 자본화 — 필수 여부 무관, "취득 과정 중" 여부가 기준
  // TRIGGER : "while in transit" → 자본화 / "testing and preparation for use" → 자본화
  // TRAP    : "보험 없이도 운송 가능 → 비필수 → No" 함정 — 필수 여부 아니라 취득 과정 중 발생 여부가 기준
  {
    topic_id: "PPE_025",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "PPE Cost Capitalization — In-Transit Insurance and Testing: Both Capitalized",
    rule: "PPE 자산 원가 = 자산을 의도한 장소에, 의도한 상태(ready for intended use)로 만들기까지의 모든 직접비용\n\n✅ Capitalize (취득 완성 전 발생):\n① Insurance while in transit → 운송 과정 직접비용\n② Testing and preparation for use → ready for use 직접비용\n③ Freight / delivery charges → 운송 직접비용\n\n❌ Expense (취득 완성 후 발생):\n- Annual insurance premium → 기간비용\n- Routine maintenance → 현상 유지\n\n[판단 기준]\n필수 여부(mandatory/optional) → 무관\n취득 완성 전이냐 후이냐 → 이것만 본다",
    trigger: "'while in transit' → 운송 과정 = 취득 완성 전 → 자본화\n'testing and preparation for use' → ready for use = 취득 완성 전 → 자본화\n두 항목 모두 취득 완성 전 → Yes / Yes → B",
    trap: "'insurance는 없어도 운송 가능 → 비필수 → expense' 함정\n→ 자본화 기준은 필수 여부가 아니라 취득 과정 중 발생 여부\n→ 운송비도 없이 운송 가능하지만 자본화 — 보험료도 동일 논리\n'testing만 자본화, insurance는 expense' → D 선택 함정\n'취득 후 보험료'와 '운송 중 보험료' 혼동 → 취득 후 = expense / 취득 중 = capitalize",
    one_sentence: "취득 완성 전 발생 비용 전부 자본화 — 필수 여부 무관, in transit + for use = 둘 다 Yes.",
    speed: "'in transit' + 'for use' → 둘 다 취득 완성 전 직접비용 → Yes / Yes → B",
    context_background: "[취득 완성 전 vs 후 — 자본화 경계선]\n\n자산 취득 타임라인:\n발주 → 운송 중(in transit) → 도착 → 설치·테스트 → Ready for use → 사용 시작\n                                                                          ↑\n                                              이 선 이전 = 자본화 / 이후 = expense\n\n[Insurance while in transit 자본화 이유]\n보험료가 법적으로 필수냐 아니냐는 무관.\n운송 중 보험료는 자산이 회사에 안전하게 도착하기까지의 과정에서 발생한 비용 → 취득원가의 일부.\n운송비(freight)도 없이 운송 가능하지만 자본화하는 것과 동일한 논리.\n\n[Testing and preparation 자본화 이유]\n'preparation for use' = 자산을 실제 사용 가능 상태로 만드는 직접 행위.\n테스트 없이 가동할 수도 있지만, 이 비용은 ready for use를 달성하기 위한 직접비용 → 자본화.\n\n[취득 후 발생하면 expense로 전환]\n동일한 보험이라도:\n운송 중 보험료 → 자본화 ✅\n사용 시작 후 연간 보험료 → 기간비용 ❌\n→ 같은 항목이라도 '언제 발생했냐'가 자본화 여부를 결정",
    example: "Insurance while in transit $500 → Dr. Equipment $500 (자본화)\nTesting and preparation $2,000 → Dr. Equipment $2,000 (자본화)\n사용 시작 후 연간 보험료 $1,200 → Dr. Insurance Expense $1,200 (expense)",
  },

  // [PPE_022] Sum-of-the-Years'-Digits Depreciation — Accumulated Depreciation Calculation
  // RULE    : SYD 분모 N(N+1)/2, 분자=잔여연수 / 베이스=원가−잔존가 / 누적=매년 상각액 전부 합산
  // TRIGGER : "sum-of-the-years'-digits" → 분모 N(N+1)/2 / "accumulated as of Year N" → Y1~N 합산
  // TRAP    : 누적 vs 당기/일부연도 혼동 / 잔존가 차감 누락 / NBV를 누적상각으로 오독
  {
    topic_id: "PPE_022",
    category: "PP&E",
    topic_name: "Sum-of-the-Years'-Digits Depreciation — Accumulated Depreciation Calculation",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Sum-of-the-Years'-Digits Depreciation — Accumulated Depreciation Calculation",
    rule: "SYD(Sum-of-the-Years'-Digits) = 가속상각. 분모 = N(N+1)/2 (= N+...+1). 분자 = 매년 잔여 내용연수(Year1=N, Year2=N−1, ... 첫 해가 가장 큼). 감가상각 베이스 = 원가 − 잔존가(DDB와 달리 잔존가를 먼저 차감). 당기 감가상각 = 베이스 × (잔여연수/분모). 누적 감가상각(accumulated depreciation, as of Year N) = 베이스 × (Year1~N 잔여연수 분자들의 합)/분모 = 매년 상각액 전부 합산.",
    trigger: "sum-of-the-years'-digits | SYD | accelerated depreciation | salvage value | accumulated depreciation as of | depreciable base\n'sum-of-the-years'-digits' → 분모 N(N+1)/2, 분자 잔여 내용연수\n'salvage value' + SYD → 베이스 = 원가 − 잔존가에 분수 적용 (DDB는 잔존가 무시)\n'accumulated depreciation as of [Year N]' → Year 1~N 상각액 전부 합산(누적)\n'depreciation expense for [Year N]' → 그 해 한 해분만",
    trap: "A(누적-당기 혼동): Year 1+2만 합산하고 Year 3 당기분을 누락 → 누적은 해당 연도까지 전부 합. (이 값은 정액 3년치 $150,000/5×3와도 우연히 일치하는 함정)\nC: Year 3 당기 감가상각만 → 'expense' vs 'accumulated' 혼동\nD: Year 2 말 장부가액(NBV) = 원가 − 누적상각 → 누적상각이 아니라 잔존 장부가, 질문 오독\n잔존가 차감 누락 → SYD는 (원가−잔존가)에 분수 적용\nSYD 분자/분모 거꾸로 → 분모는 N(N+1)/2, 분자는 잔여연수(첫 해 최대)",
    one_sentence: "SYD 누적상각 = (원가−잔존가) × (해당 연도까지 잔여연수 분자합)/[N(N+1)/2]; 누적은 매년 다 더한 값.",
    example: "원가 $170,000, 잔존 $20,000, N=5, SYD\n분모 = 5×6/2 = 15, 베이스 = $150,000\nY1: 150,000×5/15 = $50,000\nY2: 150,000×4/15 = $40,000\nY3: 150,000×3/15 = $30,000\n누적(Y3 말) = 50,000+40,000+30,000 = $120,000 (= 150,000×12/15)",
    key_formula: "분모 = N(N+1)/2\n당기 = (원가 − 잔존가) × (잔여연수 / 분모)\n누적(as of Year N) = (원가 − 잔존가) × (Σ Year1~N 잔여연수) / 분모",
    speed: "분모 = N(N+1)/2 = 5×6/2 = 15 | 베이스 = 170,000−20,000 = 150,000 | 누적 Y1~Y3 분자합 = 5+4+3 = 12 → 150,000 × 12/15 = $120,000 → 정답 B",
    context_background: "[SYD가 가속상각인 이유]\nSYD(연수합계법)는 자산이 초기에 더 많은 효익을 내고 후기로 갈수록 효익이 줄어든다는 가정(또는 후기에 늘어나는 수선비와 비용을 균형 맞추려는 목적)을 반영한 가속상각법이다. 초기에 많이, 후기에 적게 상각한다.\n\n[분모와 분자]\n분모 = 내용연수 숫자들의 합 = 5+4+3+2+1 = 15. 빠른 공식 N(N+1)/2 = 5×6/2 = 15.\n분자 = 매년 '남은' 내용연수. Year 1 = 5, Year 2 = 4, Year 3 = 3 ... 그래서 첫 해(5/15)가 가장 크다.\n\n[잔존가 차감 — DDB와의 핵심 차이]\nSYD는 감가상각 베이스에서 잔존가를 먼저 뺀 뒤 분수를 적용한다. 베이스 = $170,000 − $20,000 = $150,000.\n(반면 DDB는 매년 NBV에 정률을 곱하고 잔존가는 베이스 차감에 쓰지 않으며, 마지막에 잔존가 밑으로 내려가지 않도록 멈춘다. 이 차이를 혼동하지 말 것.)\n\n[누적(accumulated) vs 당기(expense)]\n'Accumulated depreciation as of December 31, Year N'은 B/S의 차감계정 잔액으로, 그 해까지 매년 상각액을 전부 합산한 값이다. 당기 한 해분(depreciation expense for Year N)이나 일부 연도 합과 혼동하면 안 된다. 이 문제의 핵심 함정이 바로 이 독해.\n\n[연도별 계산]\nY1: $150,000 × 5/15 = $50,000\nY2: $150,000 × 4/15 = $40,000\nY3: $150,000 × 3/15 = $30,000\n누적(Year 3 말) = $50,000 + $40,000 + $30,000 = $120,000 = $150,000 × (5+4+3)/15 = $150,000 × 12/15\n\n[오답 해부]\nA $90,000: Y1+Y2만 더하고 Y3 누락. 동시에 정액 3년치($150,000/5×3)와 일치해 '그럴듯한' 함정.\nC $30,000: Y3 당기 감가상각만 → 누적 아님.\nD $80,000: Y2 말 NBV($170,000−$50,000−$40,000) → 누적상각이 아니라 장부가.\n→ 정답 B $120,000.",
  },

  // [PPE_DEP_001] Units-of-Production Depreciation — Required Condition
  // RULE    : UOP 필수 요건 = total units estimable / constant→SL / obsolescence→가속상각
  // TRIGGER : "units-of-production" + "required condition" → total units can be estimated
  // TRAP    : constant output(A)·obsolescence(B)·repair costs(D) 모두 UOP 요건 아님
  {
    topic_id: "PPE_DEP_001",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'concept',
    card_name: "Units-of-Production Depreciation — Required Condition",
    rule: "UOP method 적용 필수 요건: 자산의 총 생산 가능 단위수(total units)를 합리적으로 추정할 수 있어야 함. UOP rate = (Cost − Salvage) ÷ Total estimated units → 총 단위수 추정 불가 시 rate 계산 자체 불가.",
    trigger: "units-of-production | activity method | required condition | which condition | must exist | total units | estimable",
    trap: "A (constant output) → SL과 결과 동일, UOP 요건 아님\nB (obsolescence expected) → 가속상각법(DDB 등) 선택 이유, UOP와 무관\nD (repair costs increase) → 수선비 증가 패턴, UOP 선택과 무관\n공통 함정: UOP = 사용량 기반으로만 기억하고 총 생산량 추정 가능성이라는 전제조건을 놓치는 것",
    one_sentence: "UOP 사용 조건 = total units over asset life를 합리적으로 추정 가능해야 함; 추정 불가 시 rate 계산 불가.",
    speed: "UOP rate = (Cost − Salvage) ÷ Total estimated units → 분모 추정 불가 = 방법 자체 불가 → C 정답",
    context_background: "UOP method는 시간이 아닌 실제 사용량(생산량)에 비례해 감가상각비를 배분. 연도별 가동량이 불규칙한 공장 기계에 적합. 핵심 전제: 자산 수명 동안 생산할 총 단위수를 미리 추정할 수 있어야 rate 계산이 가능함.\n\n[감가상각법 선택 논리 비교]\n- Straight-Line: 시간 경과에 따라 균등 배분 → 생산량 일정하거나 사용 패턴 무관\n- DDB/가속상각: 초기에 많이 배분 → 기술적 진부화(obsolescence) 예상 시\n- UOP/Activity: 실제 사용량 비례 배분 → 생산량 변동 크고 총 생산량 추정 가능 시",
  },

  // [PPE_DEP_002] Depreciation — Half-Year Convention + Appreciation Ignored
  // RULE    : Half-year → Year 1·마지막연도 × 0.5 / Appreciation → 무시(Historical Cost)
  // TRIGGER : 'half-year convention' + 'appreciated' → 스케줄 변경 없음
  // TRAP    : Remaining basis 재계산(B) / Appreciated value로 상각(C) / Year 1 반년치(D)
  {
    topic_id: "PPE_DEP_002",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Depreciation — Half-Year Convention + Appreciation Ignored",
    rule: "Half-year convention: Year 1 = 연간액 × 0.5 / Year 2~(n) = 정상 / 마지막 연도 = × 0.5. Appreciation 발생 시 → US GAAP Historical Cost Principle → 장부금액 상향 조정 불가 → 상각 스케줄 변경 없음.",
    trigger: "'half-year convention' → Year 1 반년, 마지막 연도 반년\n'appreciated' / 시장가치 상승 정보 → 무시, 취득원가 기준 유지\nYear N 상각액 질문 → 스케줄 표 작성 후 해당 연도 확인",
    trap: "$15,000(B): 상승분 반영 remaining basis 재계산 → US GAAP 불가\n$13,000(C): Appreciated value $65,000 ÷ 5년 → 취득원가 대신 시장가치 사용 오류\n$6,000(D): Year 1 반년치 → Year 3는 정상 구간\n공통 함정: Appreciation 정보가 주어지면 사용해야 할 것 같은 느낌 → US GAAP에서 완전히 무시",
    one_sentence: "Half-year convention → Year 1·마지막 연도 반년치; Appreciation → 취득원가 기준 스케줄 유지, 무시.",
    speed: "$60,000 ÷ 5 = $12,000/yr\nY1: $6,000 / Y2~5: $12,000 / Y6: $6,000\nY3 = $12,000 (Appreciation 무시)",
    context_background: "[Half-Year Convention이란]\n자산 취득·처분 연도에 관계없이 해당 연도를 반년으로 간주하는 규칙. 5년 내용연수 자산은 실제로 Year 1~6의 6개 과세연도에 걸쳐 상각된다.\n\n[상각 스케줄]\nYear 1: $60,000 ÷ 5 × 0.5 = $6,000\nYear 2~5: $60,000 ÷ 5 = $12,000\nYear 6: $6,000\n\n[Appreciation과 Historical Cost Principle]\nUS GAAP은 자산을 취득원가(Historical Cost)로 기록하고, 이후 가치 상승은 장부에 반영하지 않는다. IFRS의 Revaluation Model과 달리 US GAAP에는 PPE 재평가 모델이 없다. 따라서 Year 3에 자산 가치가 $65,000으로 올랐더라도 감가상각 기준은 여전히 취득원가 $60,000이다.",
  },

  // [PPE_DEP_004] Depreciation — DDB Specific Year Expense
  // RULE    : DDB율 = 2/n / 기초 BV × 율 / 잔존가치 = 하한선만
  // TRIGGER : 'double-declining-balance' → 율 = 2/n / Y1부터 스케줄
  //           'salvage value' → 율 계산 무시 / BV 하한선
  //           'Year X expense' → Y1부터 표 작성
  // TRAP    : 잔존가치 포함 depreciable base 계산(A) / 율 오류(C) / 연도 혼동(D)
  {
    topic_id: "PPE_DEP_004",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Depreciation — Double-Declining Balance (DDB) Specific Year Expense",
    rule: "DDB 공식: 기초 BV × (2/n)\n① 율 = 2 × SL율 = 2/n (잔존가치 무시)\n② 매년 기초 BV에 율 곱함 (SYD·SL과 달리 base 매년 감소)\n③ 잔존가치 = 하한선만 — BV가 잔존가치 이하로 내려가면 중단\n④ Y1부터 스케줄 작성 후 해당 연도 확인",
    trigger: "'double-declining-balance' → 율 = 2/n\n'salvage value X%' → 율 계산 무시, 하한선($원가×X%)만\n'for $X' → 취득원가 = $X (salvage value 아님)\n'Year N expense' → Y1부터 스케줄 작성",
    trap: "잔존가치를 depreciable base에서 차감 후 율 적용 → DDB는 잔존가치 무시\n'for $X' + 'X% salvage' → $X를 잔존가치로 혼동 주의\n율을 SL율(1/n)로 계산 → 반드시 2/n\n전년도 감가상각비를 당기로 혼동",
    one_sentence: "DDB = 기초BV × 2/n; 잔존가치는 하한선만, 율 계산 무시.",
    speed: "① 율 = 2/n\n② Y1부터: 기초BV × 율 반복\n③ 잔존가치 → 하한선 체크만",
    example: "취득 $120,000 / 4년 / SV 10%\n율 = 50% / SV하한 = $12,000\nY1 $60,000 / Y2 $30,000 / Y3 $15,000(BV $15,000 > $12,000 → 계속)",
  },

  // [PPE_DEP_003] Depreciation — SYD Accumulated Balance
  // RULE    : Base = Cost−Salvage (고정) × (잔여연수/분모) / 분모 = N×(N+1)/2
  // TRIGGER : 'sum-of-the-years-digits' / 'accumulated depreciation as of Year X' → 누적합산
  // TRAP    : 당기분만(A) / Y1+Y2만(B) / BV 혼동(C)
  {
    topic_id: "PPE_DEP_003",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Depreciation — Sum-of-the-Years-Digits (SYD) Accumulated Balance",
    rule: "SYD 공식: (Cost − Salvage) × (잔여연수 / 분모)\n분모 = N×(N+1)/2\nBase(Cost−Salvage)는 매년 고정 — DDB와 달리 BV 사용 안 함\nAccumulated depreciation = Y1~Yn 각각 계산 후 누적합산",
    trigger: "'sum-of-the-years''-digits' → 분모 = N×(N+1)/2 / Base 고정\n'accumulated depreciation as of Year X' → Y1~YX 누적합산\n'balance of accumulated' = 누적 / 'depreciation expense' = 당기분",
    trap: "당기분(YX)만 답으로 착각 → 'accumulated' 무시\nY1+Y2만 합산하고 마지막 연도 누락\nBV(순장부금액)와 누적상각 혼동\nDDB처럼 BV에 율 곱하는 오류 → SYD는 Base 고정",
    one_sentence: "SYD = (Cost−Salvage) × (잔여연수/분모); Base 고정, 누적합산.",
    speed: "① 분모 = N×(N+1)/2\n② Base = Cost−Salvage (매년 동일)\n③ Y1~YX 각각 곱한 후 합산 → Accumulated",
    example: "Cost $255,000 / Salvage $30,000 / N=5 → Base $225,000 / 분모 15\nY1 $75,000 + Y2 $60,000 + Y3 $45,000 = 누적 $180,000",
  },

  // [PPE_DEP_005] Depreciation Patterns – SL vs SYD vs DDB Graph Recognition
  // RULE    : SL=수평 / SYD=직선하락(감소폭 일정) / DDB=곡선하락(감소폭 자체 감소)
  // TRIGGER : 그래프 패턴 매칭 → 감소 속도 특성 구분
  // TRAP    : SYD↔DDB 혼동 / SYD를 곡선으로 착각
  {
    topic_id: "PPE_DEP_005",
    category: "PPE",
    topic_name: "Depreciation Patterns – SL vs SYD vs DDB Graph Recognition",
    rule: "【3가지 방법 그래프 특성】\n\nStraight-Line (SL)\n→ 매년 동일 금액\n→ 수평선 (Pattern I)\n\nSum-of-Years-Digits (SYD)\n→ 분자: n, n-1, n-2... (매년 1씩 감소)\n→ 감소폭 일정 → 직선으로 하락\n→ SL보다 높게 시작, 일정한 속도로 감소 (Pattern II)\n\nDouble-Declining Balance (DDB)\n→ 장부가치 × 고정률(2/n)\n→ 장부가치가 줄수록 상각액도 감소\n→ 감소폭 자체가 줄어드는 구조\n→ SYD보다 높게 시작, 초기 급락 후 점점 완만 (Pattern III)\n\n【높이 순서 (초기 상각액)】\nDDB > SYD > SL",
    trigger: '그래프 패턴 매칭 → 각 방법 감소 속도 특성 적용\nSYD: "일정한 속도로 감소" → 직선 하락 (Pattern II)\nDDB: "비일정한 속도로 감소" → 곡선 하락 (Pattern III)\n"constant rate of decline" → SYD | "not at constant rate" → DDB',
    trap: "SYD를 곡선(Pattern III)으로, DDB를 직선 하락(Pattern II)으로 혼동.\nSYD 분자가 줄어드니까 '감소 속도가 빨라진다'고 착각 — 감소폭은 일정, 속도 변화 없음.\nDDB가 SYD보다 초기에 더 높게 시작한다는 점 간과.",
    example: "5년 자산, 원가 $10,000, 잔존가치 $0\nSYD 분모 = 1+2+3+4+5 = 15\nYear 1: 5/15 × $10,000 = $3,333\nYear 2: 4/15 × $10,000 = $2,667 (감소폭 $666 일정)\nYear 3: 3/15 × $10,000 = $2,000 (감소폭 $667 일정) → 직선 하락\n\nDDB율 = 2/5 = 40%\nYear 1: $10,000 × 40% = $4,000\nYear 2: $6,000 × 40% = $2,400 (감소폭 $1,600)\nYear 3: $3,600 × 40% = $1,440 (감소폭 $960) → 감소폭 자체가 줄어듦 → 곡선",
    journal_entry: "",
    key_formula: "SYD: 상각액 = (잔여연수/SYD분모) × 상각대상액\nDDB: 상각액 = 기초장부가치 × (2/내용연수)\n초기 상각액 크기: DDB > SYD > SL",
    speed: "SL=수평 | SYD=일정속도 직선하락(Pattern II) | DDB=비일정속도 곡선하락(Pattern III)",
  },

  // [PPE_DEP_006] Accumulated Depreciation — Retirement Amount via T-Account Plug
  // RULE    : Retirement AD 제거액 = 기초 AD + 당기 감가상각비 − 기말 AD
  // TRIGGER : "debited to accumulated depreciation" + "retirements" → T-account 역산
  // TRAP    : PPE 총액 변동 사용 / Y1 감가상각 사용 / Machinery 변동 직접 사용
  {
    topic_id: "PPE_DEP_006",
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "Accumulated Depreciation — Retirement Amount via T-Account Plug",
    rule: "【핵심 공식】\nRetirement로 제거된 AD = 기초 AD + 당기 감가상각비 − 기말 AD\n\n【AD T-account 구조】\nDr(감소)               │ Cr(증가)\n─────────────────────────────────\nRetirement 제거  ?    │ 기초잔액\n                      │ + 당기 감가상각비\n─────────────────────────────────\n기말잔액               │\n\n【왜 retirement 때 AD를 Dr하나】\n자산 처분 시 해당 자산에 쌓인 AD도 함께 제거\nDr. AD / Dr. Loss / Cr. PPE\n→ AD 장부에서 사라짐 → T-account Dr쪽에 기록",
    trigger: '"debited to accumulated depreciation" + "retirements" → T-account 역산\n기초 AD + 당기 dep − 기말 AD = retirement 제거액\nPPE 총액 변동 → 신규 구입 포함 → 사용 금지',
    trap: "PPE 총액 변동을 retirement 금액으로 착각 → 신규 구입과 처분 동시 발생 가능 → 직접 사용 불가\n전년도 감가상각비 사용 → 반드시 당기(Year 2) 감가상각비 사용\nLand 변동 없음 → 감가상각 없음, 무시",
    example: "Grove Corp. Year 2:\n기초 AD $370,000\n+ Y2 감가상각 $55,000\n= 처분 전 $425,000\n− 기말 AD $400,000\n= Retirement 제거액 $25,000",
    key_formula: "Retirement AD 제거액 = 기초 AD + 당기 감가상각비 − 기말 AD",
    speed: "$370,000 + $55,000 − $400,000 = $25,000",
  },

  // [PPE_DEP_007] PPE Depreciation — Cash Equivalent Price as Cost Basis (Installment Purchase)
  // RULE    : 감가상각 기준 = cash equivalent price (FMV), 총 납부액 아님. 초과분 = Interest Expense.
  // TRIGGER : "cash equivalent price" → 이 금액이 감가상각 기준 / 총 납부액 > FMV → 이자 포함 신호
  // TRAP    : 총 납부액 기준 감가상각 / 잔존가치 미차감 / 총 납부액 − SV 계산
  // EXAMPLE : 총 $130K / FMV $110K / SV $5K / 10년 → SL = ($110K−$5K)÷10 = $10,500
  {
    topic_id: "PPE_DEP_007",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'calculation',
    card_name: "PPE Depreciation — Cash Equivalent Price as Cost Basis (Installment Purchase)",
    rule: "할부 구매 시 감가상각 기준:\n① 총 납부액 ≠ 취득원가 (이자 포함)\n② 감가상각 기준 = cash equivalent price (FMV)\n③ 이자 부분 = Interest Expense (별도 처리)\n\nSL = (Cash equivalent price − Salvage value) ÷ Useful life\n\n[핵심 원칙]\n얼마를 냈냐가 아니라 얼마짜리 자산을 샀냐가 감가상각 기준",
    trigger: '"cash equivalent price" or "fair market value" → 감가상각 기준 = 이 금액\n총 납부액 > FMV → 이자 포함 신호 → FMV만 사용\n"down payment + monthly payments" → 총액에 이자 포함 가능성 확인',
    trap: "총 납부액($130,000) 기준 감가상각 → 이자 포함 오류\n잔존가치 미차감 → SL 기준에서 반드시 차감\n총 납부액 − 잔존가치로 계산 → 이자 포함 오류\n공통 함정: '총액이 클수록 더 비싼 자산' 착각 → FMV가 자산 가치 기준",
    one_sentence: "할부 구매 감가상각 기준 = FMV(cash equivalent price); 총 납부액의 초과분은 이자(Interest Expense).",
    example: "총 납부액 $130,000 / FMV $110,000 / SV $5,000 / 10년\n이자 = $130,000 − $110,000 = $20,000 (Interest Expense)\n감가상각 = ($110,000 − $5,000) ÷ 10 = $10,500",
    speed: "① FMV(cash equivalent price) 확인 → 이것이 감가상각 기준\n② (FMV − SV) ÷ useful life = SL 감가상각비\n총 납부액 → 무시",
    context_background: "[왜 FMV가 감가상각 기준인가]\n할부 구매 시 총 납부액 = 자산 가격 + 이자(할부 이용료). 이자는 기계를 사용하는 비용이 아니라 돈을 나중에 내는 대가(금융비용).\n감가상각 = 자산 가치의 소모 → 자산 실제 가치(FMV) 기준.\n이자 = Interest Expense로 별도 인식.",
  },

  // [PPE_012] Held for Sale — Classification: All Six Criteria Required
  // RULE    : 6가지 기준 전부 충족 필요 / 하나라도 미충족 → held and used 유지
  // TRIGGER : "requires repairs/renovations before listing" → 즉시 매각 불가 → held and used
  // TRAP    : 가격>CV(A) / buyer 미확보(B) / 8개월→6개월 초과(D) / 5/6 충족해도 분류 불가
  {
    topic_id: "PPE_012",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_PPE',
    sub_category_id: "U3_PPE",
    card_type: 'conditional',
    card_name: "Held for Sale — Classification: All Six Criteria Required",
    rule: "Held for sale 분류 6가지 기준 (ASC 360) — 전부 충족 필요:\n① Management commitment (경영진 승인)\n② Available for immediate sale in present condition (현재 상태로 즉시 매각 가능)\n③ Active program to locate a buyer (매수자 탐색 활동 — 실제 매수자 불필요)\n④ Probable sale within ONE year (1년 이내 매각 예상 — 6개월 아님)\n⑤ Reasonable price relative to FV (합리적 가격 — CV 대비 아님)\n⑥ No expected significant changes to plan (계획 변경 불예상)\n하나라도 미충족 → held and used 유지.",
    trigger: '"requires extensive repairs/renovations before listing" → ② 미충족 → held and used\n"committed to plan" → ① 충족 / "no modifications" → ② 충족\n"agent hired / actively marketing" → ③ 충족 (실제 buyer 불필요)\n"X months" → 12개월 이내? → ④ 충족 여부 판단\n"consistent with market" → ⑤ 충족\n6가지 체크리스트 전부 통과해야만 분류 가능',
    trap: "A(가격>CV → 불가): ⑤는 FV 대비 합리성. 매각가가 CV보다 높아도 분류 가능\nB(buyer 미확보 → held and used): ③은 active program 존재만 충족. 실제 매수자 발견 불필요\nD(8개월 → 6개월 초과 불가): ④ 기준은 1년(12개월). 8개월은 충족\n수리 필요(A) → ② 미충족 → 분류 불가 (대표 오답 패턴)\n5/6 충족 → 분류 가능 착각 → ALL or NOTHING",
    one_sentence: "Held for sale = 6가지 ALL 충족; ③은 active program으로 충족(buyer 불필요) / ④는 1년 기준(6개월 아님) / ⑤는 FV 대비 합리성(CV 초과 무관).",
    speed: "① 수리 필요? → Yes → ② 미충족 → held and used\n② 6가지 체크리스트 순서대로 확인\n③ 전부 ✅ → Held for sale\n암기: M-A-A-1-R-N (Commitment/Available/Active/1yr/Reasonable/No change)\n\n오답 함정 3종:\n- 가격>CV → 무관 (FV 대비 합리성이 기준)\n- buyer 미확보 → 무관 (active program으로 충족)\n- 8개월 → 충족 (1년 기준, 6개월 아님)",
    context_background: "[Held for Sale 분류 원칙]\n매각 예정 자산은 더 이상 영업에 사용되지 않으므로 감가상각 중단 + Lower of CV or (FV-costs to sell)로 측정. 그러나 이 측정 규칙은 분류가 완료된 후의 이야기다.\n\n[기준별 세부 설명]\n② Available: '현재 상태(present condition)로 즉시 매각 가능'. 수리·개조 필요 → 현재 상태로 매각 불가 → 미충족\n③ Active program: 실제 매수자를 찾을 필요 없음. 부동산 중개인 고용, 매물 등록 등으로 충족\n④ 1년 이내: 6개월이 아닌 12개월. 8개월·9개월도 충족\n⑤ Reasonable price: CV가 아닌 FV(공정가치) 대비 합리적이어야 함. 매각가 > CV여도 FMV 기준으로 합리적이면 충족\n\n[Lease 분류와의 비교]\nLease(T-B-75-90-S): 하나라도 충족 → Finance Lease\nHeld for Sale: 하나라도 미충족 → 분류 불가\n→ 방향이 정반대. 시험에서 혼동 주의.",
    example: "CV $3.75M / 매각가 $4.5M(시장 일치) / 중개인 고용 / 8개월 내 예상 / 수리 불필요 / 계획 변경 없음\n→ 6가지 ALL ✅ → Held for sale",
  },

  // [PPE_013] Interest Capitalization — MIN Rule
  // RULE    : Capitalized Interest = MIN(Total Interest Incurred, Avoidable Interest)
  // TRIGGER : "constructing for its own use" + "specific construction debt" + "weighted-average accumulated expenditures"
  // TRAP    : Specific debt 이자 그대로 자본화 오답 / Total interest 전액 자본화 오답 — MIN 적용 필수
  // EXAMPLE : Total $70,000 vs Avoidable $40,000 → MIN = $40,000 자본화
  {
    topic_id: "PPE_013",
    category: "PP&E",
    topic_name: "Interest Capitalization — MIN Rule",
    summary: "자산 직접 건설 시 자본화 이자 = MIN(Total Interest Incurred, Avoidable Interest)",
    rule: "Capitalized Interest = MIN(Total Interest Incurred, Avoidable Interest). Total Interest = Specific debt 이자 + Other borrowings 이자. Avoidable Interest = 가중평균 누적지출액 × 이자율.",
    trigger: '"constructing for its own use" → Interest Capitalization. "specific construction debt" + "weighted-average accumulated expenditures" → MIN rule 계산.',
    trap: "Specific debt 이자 그대로 자본화 오답. Total interest 전액 자본화 오답. 반드시 MIN(Total, Avoidable) 적용.",
    example: "Total Interest $70,000 vs Avoidable $40,000 → MIN = $40,000 자본화",
    speed: "Interest Capitalization = MIN(Total Interest Incurred, Avoidable Interest) 무조건 반사",
  },

  // [REC_001] CECL — aging of receivables vs other methods
  // RULE    : asset valuation = B/S 중심 = Aging / income measurement = I/S 중심 = % of sales
  // TRIGGER : "CECL" + "asset valuation" + "aging" + "credit loss"
  // TRAP    : income measurement 강조로 착각 — 문제는 asset valuation 강조 방법 찾는 것
  {
    topic_id: "REC_001",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'concept',
    card_name: "CECL — aging of receivables vs other methods",
    rule: "CECL = B/S 중심(asset valuation) → Aging of receivables. % of Sales = I/S 중심(income measurement). Direct write-off = GAAP 불인정, 세무목적만. Credit Loss = 예측 가능한 영업비용 → Expense(Loss 아님).",
    trigger: "CECL | current expected credit loss | asset valuation | aging of receivables | credit loss | bad debt",
    trap: "asset valuation vs income measurement 혼동 → asset valuation = B/S = Aging / income measurement = I/S = % of sales / Direct write-off = GAAP 불인정",
    one_sentence: "CECL = asset valuation 강조 = B/S 중심 = Aging of receivables.",
    example: "Aging: 30일 이하 $10,000×1% + 90일 이상 $2,000×20% = Allowance 목표잔액 / % of Sales: $100,000×2% = $2,000 당기 expense / Direct write-off: 파산 확정 시 Dr.Credit Loss Exp / Cr.A/R",
  },

  // [REC_014] Allowance for Credit Losses — Direction of Change by Transaction (CECL)
  // RULE    : Allowance = 대변잔액(contra-asset) / 증가=Cr., 감소=Dr. / 감소시키는 건 write-off뿐(+드물게 과대적립 환입)
  // TRIGGER : "allowance decrease" → Dr.Allowance 거래 = write-off / "recovery/collectible/provision" → Cr.Allowance = 증가
  // TRAP    : recovery를 감소로 착각(직관 함정, 실제는 복원→증가) / good news=감소 의미로 풀기
  {
    topic_id: "REC_014",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'concept',
    card_name: "Allowance for Credit Losses — Direction of Change by Transaction (CECL)",
    rule: "Allowance for Credit Losses = AR의 차감계정(contra-asset), 대변잔액(credit balance) 계정. 증가 = 대변(Cr.) 분개, 감소 = 차변(Dr.) 분개. 분개 방향으로만 판단(거래의 'good news/bad news' 의미로 풀면 틀림).\n[감소 = Dr.Allowance] ① Write-off: Dr.Allowance / Cr.AR (미리 쌓은 쿠션에서 확정손실 꺼내 씀) ② 연말 과대적립 환입: Dr.Allowance / Cr.Credit Loss Expense (aging 목표 < 조정 전 잔액일 때, 드묾)\n[증가 = Cr.Allowance] · Provision/추정 인식: Dr.Expense/Cr.Allowance · Recovery(회수): Dr.AR/Cr.Allowance로 write-off 복원 · 회수가능 전환: Dr.AR/Cr.Allowance",
    trigger: "allowance increase | allowance decrease | written off | collected | becomes collectible | recovery | adjustment to credit losses | CECL\n'allowance would decrease' → Allowance를 차변(Dr.)으로 건드리는 거래 → write-off\n'written off' (실제 제각) → Dr.Allowance / Cr.AR → 감소\n'recovery' / 'previously written off ... collected' / 'becomes collectible' → Dr.AR(or Cash) / Cr.Allowance → 증가\n'adjustment/provision for credit losses' → Dr.Expense / Cr.Allowance → 증가\n'collection on normal account' / 'reclassification' → Allowance 무관",
    trap: "Recovery(전에 떼인 계정 회수)를 감소로 착각 → 직관('회수=손실 회복=쿠션 줄어듦')의 함정. 실제는 write-off를 먼저 복원(Dr.AR/Cr.Allowance)하므로 오히려 증가\n'becomes collectible'도 동일하게 Cr.Allowance → 증가\nProvision 인식을 감소로 착각 → 쿠션을 키우는 것이라 증가\n정상 채권 현금회수(Dr.Cash/Cr.AR)·재분류를 Allowance 변동으로 착각 → 무관\n공통 함정: 'good news=감소, bad news=증가'라는 의미 기준으로 푸는 것. 반드시 Dr./Cr. 분개 방향으로 판단",
    one_sentence: "Allowance(대변잔액)는 Cr.이면 증가·Dr.이면 감소 → 감소시키는 건 write-off뿐(+드물게 과대적립 환입); recovery는 복원이라 오히려 증가.",
    example: "Write-off: Dr.Allowance $46,000 / Cr.AR $46,000 → 감소\nRecovery: ①Dr.AR/Cr.Allowance(복원→증가) ②Dr.Cash/Cr.AR → 순효과 Allowance 증가\nProvision: Dr.Credit Loss Expense / Cr.Allowance → 증가\n과대적립 환입: Dr.Allowance / Cr.Credit Loss Expense → 감소(aging 목표<현재잔액)",
    journal_entry: "[감소]\nWrite-off: Dr. Allowance / Cr. Accounts Receivable\n과대적립 환입: Dr. Allowance / Cr. Credit Loss Expense\n\n[증가]\nProvision: Dr. Credit Loss Expense / Cr. Allowance\nRecovery 1단계(복원): Dr. Accounts Receivable / Cr. Allowance\nRecovery 2단계: Dr. Cash / Cr. Accounts Receivable",
    speed: "Allowance = 대변잔액 → 감소하려면 Dr.Allowance 분개 → 그게 일어나는 건 write-off뿐 → 정답은 write-off | 회수·회수가능·provision은 전부 Cr.Allowance → 증가 (recovery 감소 착각 주의)",
    context_background: "[Allowance는 왜 대변잔액 계정인가]\nAllowance for Credit Losses는 Accounts Receivable의 차감계정(contra-asset). AR(차변잔액 자산)을 깎아 Net AR을 만든다. 그래서 자산과 반대로 대변잔액(credit balance)을 가지며, 증가하면 대변(Cr.), 감소하면 차변(Dr.) 분개가 된다.\n\n[왜 헷갈리는가 — 의미 vs 분개 방향]\n일상 직관은 '회수=좋은 일=쿠션 줄어듦', '떼임=나쁜 일=쿠션 늘어남'으로 생각하기 쉽지만, 회계 처리는 분개 방향(Dr./Cr.)으로 결정된다. 의미로 풀면 recovery 같은 함정에 걸린다.\n\n[Allowance를 직접 헐어 줄이는 유일한 본질 거래 = Write-off]\nWrite-off는 미리 쌓아둔 쿠션(allowance)에서 확정된 손실을 꺼내 쓰는 것. Dr.Allowance / Cr.AR. AR(받을 권리)과 Allowance(쿠션)를 동시에 제거하므로 Net AR은 그 순간 불변, expense도 안 건드림(이미 쿠션 만들 때 비용 처리).\n\n[엄밀히는 감소 거래가 하나 더 — 과대적립 환입]\n연말 aging 재측정에서 목표잔액 < 조정 전 잔액이면 과잉분을 줄이며 expense를 거꾸로 깎는다(Dr.Allowance / Cr.Credit Loss Expense). 이것도 allowance를 줄이지만 write-off보다 드물고, 보기 구성상 잘 나오지 않는다.\n\n[Recovery는 증가 — 핵심 함정]\n전에 write-off한 계정이 회수되면, 먼저 그 write-off를 복원한다:\n① Dr. Accounts Receivable / Cr. Allowance  ← allowance 증가(복원)\n② Dr. Cash / Cr. Accounts Receivable        ← allowance 무관\n순효과로 allowance는 증가한다. 'becomes collectible(회수가능 전환)'도 ①만 일어나 증가.\n\n[증가/감소 요약]\n증가(Cr.Allowance): Provision 인식 / Recovery(복원) / 회수가능 전환\n감소(Dr.Allowance): Write-off / (드물게) 과대적립 환입\n무관: 정상 채권 현금회수(Dr.Cash/Cr.AR) / 재분류",
  },

  // [REC_002] Allowance vs Direct Write-off — Accrual Accounting Consistency
  // RULE    : Allowance(CECL) = Matching Principle 충족 → accrual Yes / Direct Write-off = 시점 불일치 → accrual No
  // TRIGGER : "consistent with accrual accounting" → Allowance Yes / Direct Write-off No
  // TRAP    : Direct write-off를 accrual 일치로 착각 / Allowance를 accrual 불일치로 착각
  {
    topic_id: "REC_002",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_name: "Allowance vs Direct Write-off — Accrual Accounting Consistency",
    rule: "Allowance Method(CECL): 매출 발생 시점에 예상 손실 인식 → Matching Principle → accrual accounting 일치. Direct Write-off: 대손 확정 시점에 비용 인식 → 매출-비용 시점 불일치 → accrual 위반. US GAAP 재무보고 목적: Allowance만 허용. Direct Write-off는 세무목적만.",
    trigger: "'consistent with accrual accounting' → Allowance Yes / Direct Write-off No\n'direct write-off' → accrual 위반, 세무목적만 허용\n'allowance method' or 'CECL' → Matching Principle 충족 → Yes",
    trap: "B (No / Yes) → Direct write-off가 accrual 일치라는 오답. 확정 시점 인식 = 시점 불일치 = accrual 위반\nC (No / No) → Allowance도 accrual 불일치로 착각. Allowance는 당기에 예상 손실 인식 → 정확히 accrual\nD (Yes / Yes) → Direct write-off도 accrual 일치라는 오답\n공통 함정: Direct write-off = 현금주의에 가까운 방식. US GAAP 재무보고 목적 불인정",
    one_sentence: "Accrual = 매출 시점 손실 인식 = Allowance(Yes); Direct Write-off = 확정 시점 인식 = accrual 위반(No).",
    speed: "Allowance = 매출 시점 예상 손실 인식 = Matching = accrual → Yes\nDirect Write-off = 확정 시점 인식 = 시점 불일치 → No\n답: A (Yes / No)",
    context_background: "[왜 대손 회계처리 방법이 accrual과 연결되는가]\n발생주의(accrual accounting)의 핵심은 Matching Principle: 수익과 관련 비용을 같은 기간에 인식한다. 매출채권(A/R)에서 대손이 예상된다면, 매출을 인식한 그 기간에 예상 손실도 함께 인식해야 한다.\n\n[Allowance Method (CECL)]\n매출 발생 시점에 미래 예상 대손을 추정하여 당기 비용으로 인식.\nDr. Credit Loss Expense / Cr. Allowance for Credit Losses\n→ 매출과 비용 시점 일치 → Matching Principle 충족 → accrual accounting 일치\n\n[Direct Write-off Method]\n실제로 특정 거래처가 파산하거나 회수 불가가 확정된 시점에 비용 인식.\nDr. Credit Loss Expense / Cr. Accounts Receivable\n→ 매출 인식(예: 1월)과 비용 인식(예: 6월) 시점 불일치 → accrual 위반\n→ US GAAP 재무보고 목적 불인정. 세무목적(tax purpose)으로만 허용.\n\n[실무 맥락]\nCECL(Current Expected Credit Loss)은 2016년 FASB가 도입한 기준으로, 과거 손실 데이터가 아닌 미래 예상 손실을 forward-looking하게 추정한다. 은행·금융기관에서 대출채권 대손충당금 설정에 핵심적으로 사용된다.",
  },
  {
    topic_id: "REC_003",
    sub_category_id: "U3_TRADE_RECEIVABLES",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    card_type: 'conditional',
    card_name: "AR financing — control transfer test (Pledge / Assignment / Factoring)",
    one_sentence: "If lender cannot sell or repledge the AR → control stays → no entry. If control transfers → remove AR.",
    rule: "Control transfer test (ASC 860): ALL 3 conditions must be met to treat as sale (remove AR). ① Transferred assets are isolated from transferor (even in bankruptcy). ② Transferee has the right to pledge or exchange the transferred assets. ③ Transferor does not maintain effective control (no right or obligation to repurchase before maturity). If ANY condition fails → Secured Borrowing (AR stays on B/S, record liability). If all 3 met → Sale (remove AR). Pledge/Assignment: lender does NOT have right to sell or repledge → condition ② fails → No entry (Pledge: footnote only / Assignment: AR-Assigned reclassify).",
    trigger: "pledge | assignment | factoring | discounting | right to sell | right to repledge | collateral | AR financing | recourse | without recourse | isolated | effective control | ASC 860",
    trap: "The label (pledge vs factoring) doesn't matter — what matters is whether the lender has the right to sell or repledge. If the problem states 'lender does NOT have the right to sell or repledge' → condition ② fails → Secured Borrowing → no entry, regardless of how the transaction is labeled. All 3 ASC 860 conditions must be met for Sale treatment — one failure = Secured Borrowing.",
    speed: "ASC 860 — Control Surrender 3조건 (전부 충족 → Sale)\n① Isolated from transferor (파산해도 보호)\n② Transferee can pledge or exchange (재매각 권리)\n③ Transferor has no effective control (환매 권리/의무 없음)\n\n하나라도 미충족 → Secured Borrowing (AR 유지)\n\nLender can sell or repledge?\n├── NO  → ②번 미충족 → Secured Borrowing → No JE\n│        Pledge     → Footnote only\n│        Assignment → Dr. AR-Assigned / Cr. AR\n│\n└── YES → 3조건 모두 확인 후 Sale or Secured Borrowing\n         Without recourse → AR 완전 제거\n         With recourse    → AR 제거 + Recourse liability",
    example: "① Pledge $100,000 AR as collateral:\n   Loan JE: Dr. Cash 70,000 / Cr. Notes Payable 70,000\n   Pledge 자체: No JE → footnote only\n\n② Assignment $100,000 AR:\n   Dr. AR-Assigned 100,000 / Cr. AR 100,000\n   (ownership 유지, B/S reclassify만)\n\n③ Factoring without recourse (3조건 충족):\n   Dr. Cash / Dr. Loss on Sale / Cr. AR (완전 제거)\n\n④ 문제에 'lender does not have the right to sell or repledge' 명시\n   → ②번 미충족 → Secured Borrowing → No entry",
    context_background: "AR을 담보로 자금을 조달할 때 회계처리의 핵심은 AR에 대한 통제권이 넘어갔느냐 여부(ASC 860). 통제권 판단은 label(pledge/factoring)이 아니라 3가지 조건으로 판단. 특히 lender가 해당 AR을 재매각하거나 재담보로 제공할 권리가 없으면 조건 ②번 미충족 → Secured Borrowing → AR B/S 유지.",
  },
  // [REC_006] Factoring without recourse — factor JE: gross AR + own credit loss estimate
  // RULE    : Factor = gross(face) AR 기록 / Fee → Gain / Credit loss = factor 자체 추정치
  // TRIGGER : 'factor purchases receivables' → Dr.AR(face) / Dr.CLE / Cr.Gain / Cr.Cash / Cr.Allowance
  // TRAP    : AR을 매입가(net) 기록 / Seller allowance 사용 / Fee → Loss 처리
  {
    topic_id: "REC_006",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Factoring without recourse — factor journal entry (gross AR, own credit loss estimate)",
    rule: "Factor(매입자) 입장 분개 — without recourse:\nDr. Trade Receivables (face amount — gross)\nDr. Credit Loss Expense (factor 자체 추정률 × face)\n  Cr. Gain on purchase of trade receivables (factoring fee)\n  Cr. Cash (face − fee)\n  Cr. Allowance for credit losses (factor 자체 추정률 × face)\n\n핵심 3가지:\n① AR = face(gross) amount. 매입가(net) 아님\n② Fee = Gain on purchase. Loss 아님\n③ Credit loss = factor 자체 추정치. Seller prior allowance 무관",
    trigger: "'factor purchases receivables' + '% factoring fee' → 분개 구조 확인\n'estimates allowance based on X%' → factor 자체 추정 → Seller allowance 무시\nAR 금액 = face amount (매입가 아님)\nFactoring fee = Gain (수익)",
    trap: "AR을 매입가(Cash paid)로 기록 → Face amount 사용 필수\nSeller prior allowance 사용 → Factor는 자체 추정치(X% × face) 사용\nFee를 Loss로 처리 → Factor 입장에서 fee는 Gain(spread 수익)\nA/B 오답: AR $40,000 → gross $50,000이어야 함\nD 오답: credit loss $4,000(seller) → Beech 자체 추정 $3,500이어야 함",
    one_sentence: "Factor JE: Dr.AR(face) + Dr.CLE(자체율) / Cr.Gain(fee) + Cr.Cash(net) + Cr.Allowance(자체율).",
    speed: "① AR = face $50,000\n② Fee = $50,000 × 20% = $10,000 → Gain\n③ Cash = $50,000 − $10,000 = $40,000\n④ CLE = $50,000 × 7% = $3,500 (Seller $4,000 무시)\n→ 정답 C",
    context_background: "[Factoring 비즈니스 구조]\nFactor(팩토링 회사)는 중소기업(Seller)의 외상매출채권을 할인된 가격에 매입해 만기에 Customer로부터 전액 회수하는 금융 서비스다.\n\nBeech 수익 구조:\n매입가 $40,000 투자 → 만기 $50,000 회수 → Spread $10,000 = Gain on purchase\n단, without recourse이므로 Customer 대손 위험은 Beech 부담 → Credit loss $3,500(7%) 설정\n\n순수익 개념: $10,000 Gain − $3,500 CLE = $6,500 기대 수익\n\n[왜 AR = Face amount인가]\nBeech는 만기에 Customer로부터 $50,000 전액을 회수할 권리를 취득했다. 회수 대상 금액이 $50,000이므로 AR도 $50,000으로 기록. 매입가($40,000)는 취득 원가이며 그 차이가 Gain.\n\n[왜 Seller allowance를 쓰면 안 되는가]\nSeller가 설정한 $4,000 allowance는 Seller의 역사적 대손 경험에 기반한 추정치. Beech는 자신의 역사적 write-off 데이터로 독립적으로 대손을 추정해야 한다(7%). Seller와 Beech의 고객 포트폴리오·회수 능력이 다를 수 있으므로 반드시 자체 추정치 사용.\n\n[Without recourse vs With recourse]\nWithout recourse: 대손 위험 전부 Factor 부담 → Allowance 설정\nWith recourse: 대손 위험 일부 Seller 부담 → Recourse liability 별도 기록",
  },

  // [REC_004] Allowance — Aging Method: Total Credit Loss Expense Calculation
  // RULE    : Total Expense = 연중 추정 + 연말 조정액 / Write-off → Allowance 차감, Expense 아님
  // TRIGGER : 'aging per 12/31' → 목표잔액 / 잔액 추적 후 차액 = 추가 expense
  // TRAP    : Aging잔액=Expense(C) / Write-off=Expense(A) / 계산오류(B)
  {
    topic_id: "REC_004",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Allowance — Aging Method: Total Credit Loss Expense Calculation",
    rule: "Aging Method: ① Allowance 잔액 추적(기초 + 추정 − Write-offs) ② 조정 전 잔액 vs Aging 필요잔액 차액 = 추가 Expense ③ Total Expense = 연중 추정액 + 연말 조정액. Write-off → Allowance 차감, Expense 아님.",
    trigger: "'aging of accounts receivable' → Balance Sheet Approach, Allowance 목표잔액 설정\n'write-offs' → Allowance 차감, Expense 아님\n'estimated credit losses per aging 12/31' → 연말 필요잔액\nTotal Expense = 연중 추정 + 조정액",
    trap: "$52,000(C): Aging 필요잔액을 그대로 expense로 착각 → 이건 기말 Allowance 목표잔액(B/S)이지 당기 expense가 아님\n$46,000(A): Write-off를 expense로 착각 → write-off는 Allowance·AR 동시 제거일 뿐 expense 아님\n$48,000(B): 계산 오류\n공통 함정 ①: Write-off → Allowance 차감이지 expense 아님 (이미 과거에 expense로 쿠션을 쌓아둠 → 실제 떼이면 쿠션에서 차감, 새 비용 아님)\n공통 함정 ②: Aging 잔액 ≠ 당기 expense → 목표잔액과 조정 전 잔액의 '차이'만 추가 expense\n공통 함정 ③: 연중 추정 $40,000을 빼먹고 조정액 $16,000만 답 → Total Expense는 연중(I/S 접근) + 연말 조정(B/S 접근) 둘 다 합산\n[방향 주의] 조정 전 잔액 > aging 목표면 expense를 거꾸로 감소(Dr.Allowance/Cr.Expense) → 부등호만 보고 방향 결정",
    one_sentence: "Total Credit Loss Expense = 연중 추정($40K) + 연말 Aging 조정($16K) = $56K; Write-off는 expense 아님.",
    speed: "$42,000+$40,000−$46,000=$36,000(조정전)\n$52,000−$36,000=$16,000(추가)\nTotal=$40,000+$16,000=$56,000",
    context_background: "[Allowance 잔액 vs Credit Loss Expense — 다른 계정]\nAllowance for Credit Losses = B/S 계정, 누적 잔액('지금 쿠션이 얼마나 쌓였나'). Credit Loss Expense = I/S 계정, 당기 발생분만('올해 비용으로 얼마 잡았나'). expense를 잡을 때마다 allowance가 그만큼 쌓인다(Dr.Expense/Cr.Allowance).\n\n[Aging Method = Balance Sheet Approach]\nAging이 직접 정하는 것은 expense가 아니라 '기말에 있어야 할 Allowance 목표잔액'이다. 채권을 나이별로 분류 → 오래될수록 높은 부도율 적용 → 필요 잔액 산출($52,000). expense는 이 목표를 맞추는 과정에서 차이(plug)로 역산되어 나온다.\n반대로 % of sales method = Income Statement Approach: expense를 먼저 정하고(매출×%) allowance는 결과로 쌓임.\n이 문제는 두 방법이 섞여 있다: 연중 $40,000(매출 2% = I/S 접근) + 연말 aging $52,000(B/S 접근). 회사가 연중엔 간편하게 매출%로 잡다가 연말에 aging으로 정밀 재측정하는 구조.\n\n[Step 1. Allowance 잔액 추적]\n기초 $42,000\n+ 연중 추정 expense $40,000  (Dr.Credit Loss Expense / Cr.Allowance — 이미 올해 I/S에 잡힌 1차 expense)\n− Write-offs $46,000\n= 조정 전 잔액 $36,000\n\n[Step 2. 연말 목표잔액 재측정]\nAging 필요잔액 = $52,000\n차이 = $52,000 − $36,000 = $16,000 부족\n→ 추가 Credit Loss Expense $16,000 인식 (2차 expense)\n\n[Step 3. 당기 Total Expense]\n$40,000(연중 1차) + $16,000(연말 조정 2차) = $56,000\n\n[Write-off 처리 — AR·Allowance 동시 제거, net AR 불변]\nDr. Allowance for Credit Losses $46,000\n    Cr. Accounts Receivable $46,000\n→ 못 받음 확정 → AR(받을 권리)와 미리 쌓아둔 Allowance(쿠션)를 동시에 제거. expense 안 건드림(이미 쿠션 만들 때 비용 처리했으므로 이중계상 방지).\n→ AR도 $46,000↓, Allowance(차감계정)도 $46,000↓ → 상쇄되어 Net AR(순실현가능액)은 그 순간 불변.\n\n[연말 조정 분개]\nDr. Credit Loss Expense $16,000\n    Cr. Allowance for Credit Losses $16,000\n\n[방향: 보통 expense 추가, 드물게 감소]\naging 목표 > 조정 전 잔액 → 부족 → expense 추가 (Dr.Expense). write-off가 쿠션을 헐고 새 매출이 새 부실을 만들기 때문에 보통 이 방향.\naging 목표 < 조정 전 잔액 → 과잉 → expense 감소 (Cr.Expense / Dr.Allowance). 경기 호전·과대적립 시.\n\n[conservatism 방향 & big bath]\n회계 보수주의(conservatism) = 손실/비용을 빨리·충분히, 이익은 낮게 → 대손에서는 allowance를 충분히 쌓는 방향. 단 '의도적 과대적립'은 보수주의가 아니라 부정. 경영진이 이익을 부풀리려 allowance를 적게 잡으면 aggressive. 반대로 big bath = 나쁜 해에 allowance를 과대적립해 손실을 몰아 털고, 다음 해 그 과잉 쿠션을 풀어(Dr.Allowance/Cr.Expense) 이익을 부풀림 → 이익의 시점 이동 조작. 과소든 과대든 추정의 의도적 왜곡은 모두 GAAP 위반.",
  },

  // [REC_005] Cash to Accrual Revenue Conversion — AR + Unearned Fees
  // RULE    : Accrual Revenue = Cash − ΔUnearned + ΔAR / AR(자산) 부호 그대로 / Unearned(부채) 부호 반대
  // TRIGGER : Cash revenue + AR/Unearned 잔액 → 변환 공식 / ADJ_006 expense 버전과 대칭
  // TRAP    : Unearned 조정 누락(B) / 부호 반대(A) / AR 조정 누락(D)
  {
    topic_id: "REC_005",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Cash to Accrual Revenue Conversion — AR + Unearned Fees",
    rule: "Cash→Accrual Revenue 변환:\nAccrual Revenue = Cash collected − ΔUnearned + ΔAR\n\nAR (자산): 수익 먼저, 현금 나중 → 부호 그대로\n  증가 → Accrual 가산 (+)\n  감소 → Accrual 차감 (-)\n\nUnearned Revenue (부채): 현금 먼저, 수익 나중 → 부호 반대\n  증가 → Accrual 차감 (-)\n  감소 → Accrual 가산 (+)",
    trigger: "Cash basis revenue + AR/Unearned 잔액 → 변환 공식 적용\nAR 증가 → Accrual 가산 (자산: 부호 그대로)\nUnearned 증가 → Accrual 차감 (부채: 부호 반대)\nADJ_006(expense 변환)과 대칭 구조",
    trap: "B($225,000): Unearned 조정 누락. $200,000 + $20,000 = $220,000 오류.\nA($175,000): 부호 전부 반대. Accrual→Cash 방향으로 잘못 변환.\nD($180,000): AR 조정 누락. $200,000 − $5,000 = $195,000 오류.",
    one_sentence: "Accrual Revenue = Cash − ΔUnearned(부채: 반대) + ΔAR(자산: 그대로).",
    speed: "① ΔAR = $60,000 − $40,000 = +$20,000 → +$20,000\n② ΔUnearned = +$5,000 → −$5,000\n③ $200,000 + $20,000 − $5,000 = $215,000 → 답: C",
    context_background: "[Cash→Accrual Revenue 변환 구조]\n\nAR (자산): 서비스 제공했지만 아직 현금 못 받은 것\n→ Cash에 반영 안 됨 → Accrual에 더해야 함 → 부호 그대로\n→ AR 증가 = 올해 서비스 제공, 아직 미수 → Accrual 가산\n\nUnearned Revenue (부채): 현금 받았지만 아직 서비스 안 한 것\n→ Cash에 이미 반영됨 → Accrual에서 빼야 함 → 부호 반대\n→ Unearned 증가 = 올해 현금 받았지만 내년 서비스 → Accrual 차감\n\n[AR T-account 검증법]\n기초 AR:           $40,000\n+ Accrual Revenue: $215,000\n소계:              $255,000\n− Collections:    ($195,000) ← $200,000 − $5,000(unearned)\n기말 AR:           $60,000 ✅\n\n[왜 Collections = $195,000인가]\n현금 수령 $200,000 중 $5,000은 아직 서비스 안 한 선수금\n→ AR 회수분 아님 → Collections에서 제외\n→ AR T-account에서 차감하는 Collections = $195,000\n\n[ADJ_006 Expense 버전과 비교]\nExpense: Accrual = Cash − ΔPrepaid + ΔAccrued\nRevenue: Accrual = Cash − ΔUnearned + ΔAR\n→ 자산 항목은 부호 그대로, 부채 항목은 부호 반대 — 동일 원칙",
  },

  // [REC_007] Allowance for Expected Credit Losses — T-account Squeeze
  // RULE    : ①기말잔액 = AR(gross) − Net AR ②Expense = plug(역산)
  //           차변(Write-offs + 기말) = 대변(기초 + Recoveries + Expense)
  // TRIGGER : allowance + write-offs + recoveries + AR/Net AR → T-account squeeze
  //           'AR at Dec 31' + 'Net AR' → 기말잔액 역산
  // TRAP    : Recoveries 차감(B) / Write-offs = expense(C) / Recoveries 무시(D)
  {
    topic_id: "REC_007",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Allowance for Expected Credit Losses — T-account Squeeze for Expense",
    rule: "T-account 구조 (Allowance = 대변잔액 계정):\n차변: Write-offs + 기말잔액\n대변: 기초잔액 + Recoveries + Credit Loss Expense\n\nExpense(plug) = 기말잔액 − 기초잔액 − Recoveries + Write-offs\n\n기말잔액 역산:\nAR(gross) − Net AR = 기말 Allowance",
    trigger: "'allowance for expected credit losses' + write-offs + recoveries\n→ T-account squeeze로 Expense 역산\n'AR at Dec 31' + 'Net AR at Dec 31' → 기말잔액 = AR − Net AR\n기말잔액 직접 제공 시 → Step 1 생략",
    trap: "Recoveries를 차감하는 오류 → 대변 항목이라 가산\nWrite-offs를 expense로 착각 → direct write-off(현금주의) 오류\nRecoveries 완전 무시\n기말잔액을 AR(gross)로 혼동",
    one_sentence: "Expense = 기말잔액 − 기초 − Recoveries + Write-offs; 기말잔액 = AR − Net AR.",
    speed: "① 기말잔액 = AR(gross) − Net AR\n② 차변합계 = 대변합계 → Expense plug\n   Expense = (Write-offs + 기말) − (기초 + Recoveries)",
    example: "기초 $180K / Write-offs $48K / Recoveries $20K / AR $560K / Net AR $350K\n기말잔액 = $560K − $350K = $210K\nExpense = $48K + $210K − $180K − $20K = $58K",
  },

  // [REC_008] Net Sales Revenue — Allowance for Sales Returns (Current Period Only)
  // RULE    : Net Sales = Gross Sales − (Sales × 추정반품률) / Prior months returns → 무시
  // TRIGGER : "net sales for new sales made during the month" → 당월 × 추정률만
  // TRAP    : Prior months returns 차감(A) / 추정 allowance 누락(B) / 무조정(D)
  {
    topic_id: "REC_008",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Net Sales Revenue — Allowance for Sales Returns (Current Period Only)",
    rule: "Net Sales = Gross Sales − Allowance for estimated returns on current period sales\n= Gross Sales − (Gross Sales × 추정반품률)\n\nPrior months actual returns → 당월 신규 매출 계산에서 제외\n→ 이미 이전 기간 매출에서 처리된 금액\n\nMatching Principle: 당월 매출에는 당월 매출에서 예상되는 반품만 매칭",
    trigger: '"net sales revenue for new sales made during the month" → 당월 Gross Sales × 추정반품률만 차감\nPrior months returns 금액 별도 제시 → 즉시 무시\n추정반품률(%) 제시 → Allowance for Sales Returns 설정',
    trap: "A($277,500): Prior months returns $7,500을 추가 차감 → 이중 차감. 이미 이전 달 처리된 금액\nB($292,500): 추정 allowance 누락. 실제 반품만 차감하면 Matching 위반\nD($300,000): 추정 반품 allowance 전혀 미인식\n공통 함정: prior months returns가 당월 net sales에 영향을 줄 것 같은 착각 → 다른 기간 매출, 완전 무관",
    one_sentence: "Net Sales = Gross Sales − (Sales × 추정반품률); prior months 실제 반품은 당월 계산과 무관.",
    speed: "$300,000 − ($300,000 × 5%) = $285,000\nPrior months $7,500 → 즉시 무시",
    context_background: "[Sales Returns 회계처리 구조]\n\n① 매출 인식 시점 (당월)\nDr. Accounts Receivable $300,000\n    Cr. Sales Revenue $300,000\n\nDr. Sales Returns & Allowances $15,000  (5% 추정)\n    Cr. Allowance for Sales Returns $15,000\n\n→ Net Sales = $300,000 − $15,000 = $285,000\n\n② 실제 반품 발생 시 (차월 이후)\nDr. Allowance for Sales Returns $X\n    Cr. Accounts Receivable $X\n→ 이미 Allowance에서 차감 → Revenue 추가 조정 불필요\n\n[왜 Prior months returns를 차감하면 안 되는가]\nPrior months의 $7,500 반품은:\n- 이전 달 매출에서 발생한 반품\n- 이미 이전 달에 Allowance for Sales Returns로 예상 처리됨\n- 당월 신규 매출($300,000)과 인과관계 없음\n\n[문제가 묻는 것]\n'new sales made during the month'의 net sales revenue\n→ 당월 $300,000에서 당월 예상 반품 $15,000만 차감\n→ Prior months $7,500은 다른 매출에서 발생, 무관",
    example: "Sales $300,000 / 추정반품률 5% / Prior months returns $7,500\n→ Net Sales = $300,000 − $15,000 = $285,000",
  },

  // [REC_009] Gross AR Rollforward — Before Allowances (Estimated Items Excluded)
  // RULE    : Gross AR = 기초 + Credit sales − Collections − Write-offs − Actual returns
  //           "before allowances" → Estimated future returns·Credit losses 제외
  // TRIGGER : "before allowances" → Gross AR / Estimated → 즉시 제외
  // TRAP    : Estimated credit losses 차감(C) / Write-offs·Returns 미차감(D)
  {
    topic_id: "REC_009",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Gross AR Rollforward — Before Allowances (Estimated Items Excluded)",
    rule: "Gross AR (before allowances) Rollforward:\n기초 AR\n+ Credit sales\n− Collections\n− Write-offs (실제 대손 확정)\n− Actual sales returns (실제 반품)\n= Gross AR\n\n[제외 항목 — 'before allowances' 조건]\n- Estimated future sales returns → Allowance for sales returns (contra-AR)\n- Estimated credit losses → Allowance for credit losses (contra-AR)\n→ 둘 다 allowance 계정 = Gross AR 계산에서 제외\n\n[포함 항목]\n- Actual sales returns $75,000 → 이미 반품된 것 → AR 실제 감소 → 포함\n- Write-offs $40,000 → 대손 확정 → AR 실제 감소 → 포함",
    trigger: '"before allowances for sales returns and expected credit losses" → Gross AR만 계산\nEstimated future returns → Allowance → 즉시 제외\nEstimated credit losses → Allowance → 즉시 제외\nActual sales returns → 실제 발생 → AR 차감 포함\nWrite-offs → 실제 대손 확정 → AR 차감 포함',
    trap: "Estimated credit losses를 Gross AR에서 차감: allowance를 gross에서 빼는 오류. 'before allowances' = allowance 차감 전\nEstimated future returns를 AR 차감: 미래 추정값 → allowance 계정, Gross AR 무관\nWrite-offs·Sales returns 미차감: 실제 발생한 것 → Gross AR 차감 필요\n공통 함정: Actual(실제) vs Estimated(추정) 혼동",
    one_sentence: "Gross AR = 기초 + Credit sales − Collections − Write-offs − Actual returns; Estimated 항목 = allowance → 제외.",
    speed: "$650K + $2,700K − $2,150K − $40K − $75K = $1,085K\nEstimated $50K·$110K → 즉시 제외",
    context_background: "[Gross AR vs Net AR]\n\nGross AR (before allowances)\n= 실제로 고객에게 청구한 금액의 잔액\n= 기초 + Credit sales − Collections − Write-offs − Actual returns\n\nNet AR (after allowances)\n= Gross AR − Allowance for sales returns − Allowance for credit losses\n= B/S에 표시되는 최종 값\n\n[Actual vs Estimated 구분]\n\nActual(실제 발생) → Gross AR 직접 조정\n- Collections: 실제 현금 수령 → AR 감소\n- Write-offs: 대손 확정 → AR 감소 (allowance도 동시 감소)\n- Sales returns: 실제 반품 → AR 감소\n\nEstimated(미래 추정) → Allowance 계정 조정\n- Estimated future returns: Allowance for sales returns 설정\n- Estimated credit losses: Allowance for credit losses 설정\n→ Gross AR에는 영향 없음\n\n['before allowances' 조건의 의미]\n문제가 'before allowances'를 명시하면\n→ Allowance 항목(Estimated)을 모두 제외하고\n→ Gross AR만 계산하라는 뜻",
    example: "기초 $650K + Credit sales $2,700K − Collections $2,150K − Write-offs $40K − Returns $75K = Gross AR $1,085K\nEstimated future returns $50K → 제외 / Estimated credit losses $110K → 제외",
  },

  // [REC_010] Note Receivable Discounting – Proceeds Calculation
  // RULE    : Proceeds = MV − (MV × Bank Rate × 잔여일/360) / Note rate → MV 계산에만
  // TRIGGER : "discounted at bank at X%" → MV 기준 / note rate ≠ bank discount rate
  // TRAP    : Face value를 할인 기준 착각 / note rate와 bank rate 혼동
  {
    topic_id: "REC_010",
    category: "Trade Receivables",
    topic_name: "Note Receivable Discounting – Proceeds Calculation",
    rule: "【거래 구조 (3자 관계)】\n발행인 ──만기에 MV 지급──▶ 은행\n나(보유자) ──어음 양도──▶ 은행 / 은행 ──Proceeds──▶ 나\n\n나는 발행 시점에 Face를 지급하고 어음 취득\nNote rate = Coupon rate = 발행인이 나에게 약속한 이자율\n\n【Proceeds 계산 공식】\n① MV = Face × (1 + Note Rate × 어음전체기간/360)\n② Discount = MV × Bank Discount Rate × 잔여일수/360\n③ Proceeds = MV − Discount\n\n【연이율 → 기간 비례 적용 원리】\n연이자율은 1년(360일) 기준 → 실제 보유기간/360 비례 적용\n은행은 잔여일수만 보유 → 잔여일수/360만큼만 할인\n\n【은행의 수익 구조】\n은행 수익 = MV − Proceeds = MV × Bank Rate × 잔여일/360\nNote rate는 은행 계산식에 등장하지 않음",
    trigger: '"discounted at a bank at X%" → proceeds = MV − (MV × bank rate × 잔여일/360)\n"interest-bearing note" + "discounted at bank" → face value 기준 ❌, MV 기준 ✅\nnote rate ≠ discount rate → 두 이율 혼동 주의',
    trap: "【함정 ①】Face value를 할인 기준으로 사용\nMV = Face + 이자 → 은행은 MV 기준으로 할인\n\n【함정 ②】Note rate와 bank discount rate 혼동\nNote rate(= coupon rate) → MV 계산에만 사용\nBank rate → proceeds 할인 계산에만 사용\n\n【함정 ③】스프레드 단순 차감\n두 이율의 기간(잔여일 vs 전체기간)과 기준금액(MV vs Face)이 달라서 단순 비교 불가",
    example: "90일 만기, Face $10,000, note rate 10%, 30일 보유 후 bank rate 18%로 할인\n① MV = $10,000 × (1 + 10% × 90/360) = $10,250\n② Discount = $10,250 × 18% × 60/360 = $307.50\n③ Proceeds = $10,250 − $307.50 = $9,942.50",
    journal_entry: "Dr. Cash $9,942.50\nDr. Loss on Discounting [차액 발생 시]\nCr. Notes Receivable $10,000\nCr. Interest Revenue (보유 30일치) [차액]",
    key_formula: "MV = Face × (1 + Note Rate × 전체기간/360)\nProceeds = MV − (MV × Bank Rate × 잔여일/360)",
    speed: "Proceeds 기준 = MV | 이율 = Bank Rate | Note rate는 MV 계산에만 | 기간 = 잔여일/360",
  },

  // [REC_011] Current Net Receivables – AR Inclusion vs Exclusion
  // RULE    : Net AR = Trade AR − Allowance + Claim against shipper
  // TRIGGER : "claim against shipper" → 포함 / "consignment" → inventory / "security deposit" → other asset
  // TRAP    : Consignment 미판매 AR 포함 / Security deposit AR 포함 / 합계 그대로 사용
  {
    topic_id: "REC_011",
    category: "Trade Receivables",
    topic_name: "Current Net Receivables – AR Inclusion vs Exclusion",
    rule: "【AR 포함 기준】\n고객 또는 제3자에 대한 현금 청구권만 포함\n\n【항목별 판단】\nTrade AR → 포함 ✅\nAllowance for credit losses → 차감 (contra asset)\nClaim against shipper → 운송사에 대한 현금청구권 → 포함 ✅\n\nConsignment 미판매분 → 제외 ❌\n: 수탁자가 판매 완료 전까지 위탁자(보내는 쪽) 재고로 남음\n: AR이 아닌 Inventory\n\nSecurity deposit → 제외 ❌\n: 리스/임차 보증금 = other asset (일반적으로 non-current)\n: AR 아님\n\n【Net AR 공식】\nNet AR = Trade AR − Allowance + Claim against shipper",
    trigger: '"claim against shipper" → 제3자 현금청구권 → AR 포함\n"consignment" + "not included in ending inventory" → 여전히 위탁자 inventory → AR 제외\n"security deposit" → other asset → AR 제외\n"net receivables" → Trade AR − Allowance + 기타 현금청구권',
    trap: "Consignment 미판매분을 AR로 포함 (판매 완료 전 → inventory).\nSecurity deposit을 current AR로 포함 (other asset, non-current).\n문제에 나열된 합계를 그대로 정답으로 사용.\nConsignment 금액이 selling price(원가 130%)로 표시되어도 재고 성격 불변.",
    example: "Cedar Co. Net AR 계산:\nTrade AR $139,500\n− Allowance ($3,000)\n+ Claim against shipper $4,500\n= Net AR $141,000\n\nConsignment $39,000 → Inventory (제외)\nSecurity deposit $45,000 → Other asset (제외)",
    journal_entry: "",
    key_formula: "Net AR = Trade AR − Allowance for Credit Losses + Claim against Shipper",
    speed: "Net AR = Trade AR − Allowance + Claim against shipper | Consignment → Inventory | Security deposit → Other asset",
  },

  // [REC_012] Pledge of Accounts Receivable — No Entry to AR
  // RULE    : Pledge = 담보 제공 (소유권 유지) → AR 분개 없음 / Dr.Cash / Cr.Notes Payable만
  // TRIGGER : "pledged as collateral" → Pledge → AR 무관
  // TRAP    : 차액·차입액·담보액을 AR에서 차감하는 오류 (Factoring 혼동)
  {
    topic_id: "REC_012",
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'concept',
    card_name: "Pledge of Accounts Receivable — No Entry to AR",
    rule: "【Pledge vs Factoring 핵심 차이】\n\nPledge (질권 설정)\n→ AR을 담보로 제공, 소유권은 회사 유지\n→ AR 분개 없음\n→ Dr. Cash / Cr. Notes Payable\n→ Pledge 사실은 주석 공시만\n\nFactoring (매각)\n→ AR 소유권 이전\n→ AR 제거\n→ Dr. Cash / Dr. Loss(or Cr. Gain) / Cr. AR\n\n【핵심 판단】\n'lender does not have right to sell or repledge' → Pledge 확정\n→ AR에 아무 분개 없음",
    trigger: '"pledged AR as collateral" → Pledge → AR 변동 없음\n"lender does not have the right to sell or repledge" → Pledge 확정\n"loan proceeds received" → Dr. Cash / Cr. Notes Payable만',
    trap: "차액($30K) → Pledge를 부분 매각으로 오해\n차입액($150K) → AR 매각 대금으로 오해 (Factoring 혼동)\n담보액($180K) → AR 전액 제거 오류 (Factoring 혼동)\nPledge ≠ Factoring — AR 소유권 이전 없으면 AR 절대 건드리지 않음",
    example: "Cedar: 차입 $150,000 / 담보 AR $180,000\n→ Dr. Cash $150,000\n→ Cr. Notes Payable $150,000\n→ AR: No entry (주석 공시만)",
    journal_entry: "차입 시:\nDr. Cash $150,000\nCr. Notes Payable $150,000\n\n(AR 분개 없음 — 주석 공시만)",
    speed: '"pledged as collateral" → AR 그대로 → No entry to AR\n"factored / sold" 없으면 → AR 절대 건드리지 않음',
  },

  // [REC_013] Non-Interest-Bearing Note — PV Recognition and Remaining Payments
  // RULE    : Non-interest-bearing note = PV로 인식 / 첫 지급이 발행일이면 잔여 기간 = 총기간 - 1
  // TRIGGER : "non-interest-bearing" → PV 할인 / "first payment on [발행일]" → 잔여 기간 -1
  // TRAP    : 총 기간 factor 사용 오답 / 액면가 합계 사용 오답
  // EXAMPLE : 10회, 첫 지급 발행일 완료 → 잔여 9회. $10,000 × 6.25(9기간 8%) = $62,500
  {
    topic_id: "REC_013",
    category: "Long-Term Liabilities",
    topic_name: "Non-Interest-Bearing Note — PV Recognition and Remaining Payments",
    summary: "무이자부 어음 = 이자가 숨겨진 것. PV로 인식 필수. 첫 지급일 확인 후 잔여 기간으로 PV factor 적용.",
    rule: "Non-interest-bearing note = PV로 인식. Note Receivable = 잔여 지급액 × PV annuity factor. 첫 지급이 발행일이면 B/S 기준 잔여 기간 = 총기간 - 1.",
    trigger: '"non-interest-bearing" → PV 할인. "first payment on [발행일]" → 잔여 기간 -1. B/S 날짜 기준 잔여 횟수 확인.',
    trap: "총 기간 factor 사용 오답 → 첫 지급 완료 후 잔여 기간 사용. 액면가 합계 사용 오답 → PV 할인 필수.",
    example: "10회 지급, 첫 지급 발행일 완료 → 잔여 9회. $10,000 × 6.25(9기간 8%) = $62,500",
    speed: "Non-interest-bearing note → 잔여 지급 횟수 확인 → × PV annuity factor",
  },

  // [REC_015] CECL Write-off vs Recovery — Direction and Net Income Effect
  // RULE    : Write-off = Dr.Allowance/Cr.AR (Allowance 감소) / Recovery = 반대 (Allowance 증가)
  // TRIGGER : "write-off" → Allowance 감소 / "recovery" → Allowance 증가
  // TRAP    : write-off = Allowance 증가 착각 / write-off = net income 감소 착각
  {
    topic_id: "REC_015",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'concept',
    card_name: "CECL write-off vs recovery — direction and net income effect",
    rule: "Write-off (대손 확정): Dr. Allowance for credit losses / Cr. AR → Allowance 감소 / AR 감소 / net income 무관\n\nRecovery (대손 회수): 2단계\n① Dr. AR / Cr. Allowance → Allowance 증가 (write-off 되돌리기)\n② Dr. Cash / Cr. AR → 실제 현금 수취\n→ net income 무관\n\n공통: 비용/수익은 Allowance 설정/환입 시점에 인식 → write-off·recovery 자체는 net income 영향 없음",
    trigger: "'write-off' + CECL → Dr. Allowance / Cr. AR → Allowance 감소 'recovery' → 2단계: AR 복원 후 Cash 수취 → Allowance 증가 'no effect on net income' → write-off·recovery 둘 다 해당",
    trap: "Write-off = Allowance 증가 착각 → 반대. write-off는 Dr. Allowance → 감소 Write-off = net income 감소 착각 → 비용은 Allowance 설정 시 이미 인식 Recovery = net income 증가 착각 → Allowance 환입이지 수익 아님 Write-off = No effect on Allowance 착각 → 반드시 Allowance 감소",
    one_sentence: "Write-off = Allowance↓(Dr.) / Recovery = Allowance↑(Cr.) / 둘 다 net income 무관.",
    journal_entry: "Write-off: Dr. Allowance for credit losses $700 / Cr. AR $700\nRecovery 1단계: Dr. AR $700 / Cr. Allowance $700\nRecovery 2단계: Dr. Cash $700 / Cr. AR $700",
    speed: "Write-off → Dr. Allowance(감소) / Cr. AR → net income 무관 Recovery → Allowance 증가 → net income 무관",
    context_background: "[2단계 구조 이해]\nCECL(allowance method)은 손실을 두 단계로 처리:\n1단계 — 예상 손실 인식: Dr. Credit Loss Expense / Cr. Allowance → I/S 비용 인식\n2단계 — 실제 write-off: Dr. Allowance / Cr. AR → B/S만 변동, I/S 무관\n\n비용은 1단계에서 이미 잡혔으므로 write-off 시 추가 I/S 영향 없음.\n\n[Write-off vs Recovery 직관]\nWrite-off = AR을 장부에서 지우는 것 → Allowance 소진(감소)\nRecovery = 지웠던 AR 되살리는 것 → Allowance 복원(증가)\n둘 다 net income 무관 — B/S 내 자산 계정끼리 이동.\n\n[혼동 포인트]\nWrite-off 시 Allowance가 '증가'한다고 착각하기 쉬움.\nAllowance는 대손 '쿠션' 역할 → write-off 시 쿠션 소진 → 감소.\nRecovery 시 쿠션 보충 → 증가.",
  },

  // [REC_006] Allowance for Discounts — Gross Method
  // RULE    : 할인 기간 내 AR만 × 할인 사용 % × 할인율 / Collectible % = 무관
  // TRIGGER : 'gross method' + 'X/Y, net Z' → Allowance for discounts
  //           Y일 이내 AR만 추출 / collectible % → 무시
  // TRAP    : 전체 AR 적용 / collectible % 곱하는 오류 / 할인 사용 % 누락 / 회수가능성 혼동
  {
    topic_id: "REC_006",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_REC',
    sub_category_id: "U3_TRADE_RECEIVABLES",
    card_type: 'calculation',
    card_name: "Allowance for Discounts — Gross Method (Discount Period AR Only)",
    rule: "Allowance for discounts = 할인 기간(Y일) 이내 AR × 할인 사용 고객 % × 할인율\n→ 기간 지난 AR 구간 완전 제외 (이미 할인 불가)\n→ Collectible % = 대손충당금 계산용 → 할인충당금과 완전히 별개\n두 충당금은 교차하지 않음",
    trigger: "'gross method' + 'X/Y, net Z' → Allowance for discounts 설정\n할인 기간(Y일) 이내 AR 구간만 추출\n'collectible %' → 무시 (대손충당금용)",
    trap: "전체 AR에 할인율 적용 → 기간 지난 구간 포함 오류\nCollectible %를 곱하는 오류 → 대손충당금과 혼동\n할인 사용 고객 % 누락 → 전액 기준으로 계산\n'Over 60 days $X' collectible → 대손충당금용, 할인충당금 아님\n회수 가능성(collectible)과 할인충당금은 별개 — 0-10일 AR이 95% collectible이어도 $150,000 전액 기준으로 할인충당금 계산 (회수 여부와 무관)",
    one_sentence: "Allowance for discounts = 할인 기간 내 AR × 사용 % × 할인율; Collectible %는 무관.",
    speed: "① 할인 기간(Y일) 이내 AR만 추출\n② × 할인 사용 고객 % × 할인율\n③ Collectible % → 무시",
    example: "3/10 net 45 / 0-10일 AR $150,000 / 40% 사용\n→ $150,000 × 40% × 3% = $1,800",
  },

  // [VAR_001] Variance Analysis — Operating Income Variance from Budget
  // RULE    : Budgeted OI vs Actual OI → Variance = Actual − Budgeted
  // TRIGGER : "master budget" + "operating income variance" + budgeted/actual units·costs 혼합
  // TRAP    : Revenue variance만 계산하면 $45,000 함정 — 비용까지 전부 반영해야 OI variance
  {
    topic_id: "VAR_001",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_RATIO_VARIANCE",
    card_type: 'calculation',
    card_name: "Variance Analysis — Operating Income Variance from Budget",
    rule: "Budgeted OI = Budgeted Revenue − Budgeted Variable Costs − Budgeted Fixed Costs. Actual OI = Actual Revenue − Actual Variable Costs − Actual Fixed Costs. Variance = Actual OI − Budgeted OI. Actual < Budgeted → Unfavorable.",
    trigger: "master budget | operating income variance | budgeted vs actual | variable costs | fixed costs | units sold",
    trap: "TRAP 1: Revenue variance만 계산($315K−$360K=−$45K)하면 A·B 오답 — Operating Income Variance는 수익·비용 전부 반영. TRAP 2: Actual OI $21K < Budgeted OI $51K이므로 반드시 Unfavorable.",
    one_sentence: "OI Variance = (Actual OI) − (Budgeted OI) — 비용 무시하고 Revenue variance만 보면 $45K 함정.",
    example: "Budget: $360K rev − $264K VC − $45K FC = $51K OI | Actual: $315K rev − $250K VC − $44K FC = $21K OI | Variance: $21K − $51K = ($30K) Unfavorable",
    context_background: "예산 대비 실제 영업이익 차이(Operating Income Variance)는 경영진이 예산 달성 여부를 평가하는 핵심 지표. 매출·변동비·고정비 전부를 반영한 종합 성과 측정치.",
    context_trigger: '"master budget" + "operating income variance" + budgeted vs actual 비교',
    rule_title: "Operating Income Variance 계산",
    rule_items: [
      "Budgeted Operating Income = Budgeted Revenue - Budgeted Variable Costs - Budgeted Fixed Costs",
      "Actual Operating Income = Actual Revenue - Actual Variable Costs - Actual Fixed Costs",
      "Variance = Actual OI - Budgeted OI",
      "Actual < Budgeted → Unfavorable",
      "Budgeted OI: $360,000-$264,000-$45,000=$51,000",
      "Actual OI: $315,000-$250,000-$44,000=$21,000",
      "Variance: $21,000-$51,000=($30,000) Unfavorable",
    ],
    speed: "① Budgeted OI: $360,000-$264,000-$45,000=$51,000 ② Actual OI: $315,000-$250,000-$44,000=$21,000 ③ $21,000-$51,000=($30,000) Unfavorable → Revenue variance $45,000 함정 절대 주의",
  },
  // [SPF_002] Tax Basis Financial Statements — SCF is optional
  // RULE    : Tax basis = 현금 기준 → SCF 중복 → optional / GAAP SCF 필수
  // TRIGGER : "income tax basis" + "optional" + financial statements 목록
  // TRAP    : GAAP 기준 혼동 → SCF 필수로 오답 / C·D(BS·IS)는 둘 다 필수
  {
    topic_id: "SPF_002",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_SPF',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'concept',
    card_name: "Tax Basis Financial Statements — SCF optional",
    rule: "Tax Basis 필수: ① Statement of Assets & Liabilities and Equity, ② Statement of Revenues & Expenses. 선택(optional): Statement of Cash Flows. 이유: Tax basis = 현금 기준 → I/S 자체가 현금 반영 → SCF 중복. GAAP(발생주의)는 SCF 필수.",
    trigger: "income tax basis | tax basis of accounting | special purpose framework | SPF | optional financial statements | complete set",
    trap: "TRAP 1: SCF를 GAAP처럼 필수로 혼동 → Tax basis에서는 optional. TRAP 2: C(Statement of Assets & Liabilities)·D(Statement of Revenues & Expenses)를 optional로 혼동 → 둘 다 필수.",
    one_sentence: "Tax basis = 현금 기준이라 SCF 중복 → optional. GAAP SCF 필수와 반대.",
    example: "Tax Basis Complete Set: Assets & Liabilities ✓ (required) | Revenues & Expenses ✓ (required) | Statement of Cash Flows ○ (optional)",
    context_background: "[Tax Basis FS란]\nGAAP이 아닌 세법 기준 사용하는 Special Purpose Framework(SPF). OCBOA(Other Comprehensive Basis of Accounting) 일종.\n실무 사용처: ①소규모 비공개 기업(GAAP 비용 부담 → 은행 대출 시 허용) ②Partnership/S-Corp(K-1 연동) ③특정 대출 계약 명시 시\nSPF 종류: Tax basis / Cash basis / Regulatory basis(보험사) / Contractual basis\n\n[Tax Basis I/S 구조 — GAAP과 차이]\nGAAP: Revenue → COGS → Gross Profit → SG&A → Operating Income → NI\nTax Basis: Gross Income(수입 총계) − Expenses(전부) = NI\n\n핵심 용어 구분:\n- Gross Profit(GAAP): Revenue − COGS = 매출총이익(이익 개념)\n- Gross Income(Tax): Revenue + Gains = 수입 항목 합계(원가 차감 전 수입 총계)\nTax basis는 COGS/판관비/영업이익 단계 구분 없음. Expense를 한 덩어리로 표시.\n\n[Nondeductible Expense 처리]\n세법상 공제 불가(nondeductible) ≠ FS에서 제외\n실제 지출이므로 Expense category에 반드시 포함.\n표시: 별도 line item or 기존 line 합산(둘 다 허용) → accounting policies footnote 공시 필요\n흐름: Nondeductible → Expense 포함 → NI 감소 → RE 간접 감소(직접 반영 아님)\nGross Income(수입 총계)에는 영향 없음",
    context_trigger: '"income tax basis of accounting" + "optional" + complete set of financial statements',
    rule_title: "Tax Basis 재무제표 — 필수 vs 선택",
    rule_items: [
      "Tax Basis 필수: Statement of Assets & Liabilities and Equity (income tax basis)",
      "Tax Basis 필수: Statement of Revenues & Expenses (income tax basis)",
      "Tax Basis 선택(optional): Statement of Cash Flows",
      "이유: Tax basis = 현금 기준 → I/S 자체가 현금 반영 → SCF 중복",
      "GAAP: 발생주의 → 현금흐름 별도 추적 필요 → SCF 필수",
      "별칭 허용: Balance Sheet = Statement of Financial Position (income tax basis)",
      "별칭 허용: Income Statement = Statement of Operations (income tax basis)",
    ],
    speed: "① 'income tax basis' 확인 → SPF 적용 ② Tax basis = 현금 기준 → SCF 중복 → optional ③ C·D = 필수 → 정답 B",
  },

  // [SPF_003] OCBOA — income tax basis financial statement titles
  // RULE    : OCBOA 재무제표 제목 = GAAP 표준 제목 + '— income tax basis' 명시 필수
  // TRIGGER : 'income tax basis' + 재무제표 제목 → basis 명시 포함 여부 확인
  // TRAP    : GAAP/NFP 표준 제목 단독 사용(Statement of operations, financial position, net assets)
  {
    topic_id: "SPF_003",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_SPF',
    sub_category_id: "U2_SPECIAL_PURPOSE_FRAMEWORKS",
    card_name: "OCBOA — income tax basis financial statement titles",
    rule: "OCBOA(income tax basis, cash basis 등) 재무제표는 제목에 반드시 해당 기준을 명시해야 함. GAAP 표준 제목 단독 사용 불가. B/S → 'Statement of assets, liabilities, and equity — income tax basis' / I/S → 'Statement of revenues and expenses — income tax basis'",
    trigger: "'income tax basis' + 재무제표 제목 → 제목에 basis 명시 포함 여부 확인\n선지 중 'income tax basis' 또는 'cash basis' 등이 제목에 포함된 것이 정답",
    trap: "A (Statement of operations) → NFP I/S 명칭. income tax basis 명시 없음\nC (Statement of financial position) → GAAP accrual basis B/S 명칭. income tax basis 명시 없음\nD (Statement of net assets) → NFP B/S 명칭. income tax basis 명시 없음\n공통 함정: GAAP/NFP 표준 제목을 OCBOA에도 그대로 쓸 수 있다고 착각하는 것",
    one_sentence: "OCBOA 재무제표 제목 = GAAP 표준 제목 + '— income tax basis' 명시 필수.",
    speed: "선지 스캔 → 'income tax basis' 문구 포함된 제목 = 정답",
    context_background: "[OCBOA(Other Comprehensive Basis of Accounting)란]\nUS GAAP이 아닌 다른 회계 기준으로 작성된 재무제표. 주요 유형:\n① Income tax basis: 세무신고 기준\n② Cash basis: 현금 수수 기준\n③ Regulatory basis: 규제기관 요구 기준\n④ Contractual basis: 계약 조건 기준\n\n[왜 제목에 basis를 명시해야 하는가]\nOCBOA 재무제표는 GAAP 재무제표와 다른 기준으로 작성되므로, 이용자가 혼동하지 않도록 제목에 반드시 해당 기준을 명시해야 한다.\n\n[Income tax basis 재무제표 제목]\n- B/S 대응: Statement of assets, liabilities, and equity — income tax basis\n- I/S 대응: Statement of revenues and expenses and retained earnings — income tax basis (또는 Statement of income — income tax basis)\n\n[GAAP vs NFP vs OCBOA 제목 비교]\nGAAP B/S: Balance sheet 또는 Statement of financial position\nNFP B/S: Statement of financial position 또는 Statement of net assets\nOCBOA B/S: Statement of assets, liabilities, and equity — income tax basis\n\nGAAP I/S: Income statement 또는 Statement of operations\nNFP I/S: Statement of activities 또는 Statement of operations\nOCBOA I/S: Statement of revenues and expenses — income tax basis",
  },

  // [SPF_004] Modified Cash Basis — Common Modifications vs Full Accrual
  // RULE    : Modified cash basis 수정 항목 = 장기부채·소득세 발생주의·재고 자본화 등
  //           "revenues when earned" = full accrual basis 원칙 → modification 아님
  // TRIGGER : "not a common modification" → 수정 항목 외 찾기 / "when earned" → full accrual 신호
  // TRAP    : B·C·D 모두 흔한 수정 항목 → 오답
  {
    topic_id: "SPF_004",
    sub_category_id: "U2_SPECIAL_PURPOSE_FRAMEWORKS",
    card_type: 'concept',
    card_name: "Modified Cash Basis — Common Modifications vs Full Accrual",
    rule: "【Modified Cash Basis란】\nCash basis + 일부 발생주의 요소 추가 = Modified cash basis\n\n【흔한 수정 항목 (common modifications)】\n① 장기부채(Long-term liabilities) 기록\n② 소득세 발생주의(Accrual of income taxes)\n③ 재고 자본화(Capitalizing inventory)\n④ 유형자산 자본화(Capitalizing PP&E)\n\n【NOT a modification — Full Accrual 원칙】\n'Recognizing revenues when earned'\n→ 발생주의 핵심 원칙 자체\n→ 추가하면 full accrual basis로 전환\n→ modified cash basis 수정 항목 아님",
    trigger: '"not a common modification" + modified cash basis → 수정 항목 외 항목 찾기\n"recognizing revenues when earned" → full accrual basis 신호 → 정답\n"long-term liabilities / income taxes / capitalizing" → 흔한 수정 항목 → 오답',
    trap: "Capitalizing inventory·Long-term liabilities·Accrual of income taxes → 모두 흔한 수정 항목 → 오답\n'when earned' 표현을 그럴싸한 수정 항목으로 착각 → full accrual basis 전환 신호임",
    example: "Cash basis → Modified cash basis 수정:\n① 장기부채 $500,000 기록 ✅\n② 법인세 발생주의 $80,000 ✅\n③ 재고 $200,000 자본화 ✅\n④ 매출 earned 시 인식 ❌ → full accrual basis 전환",
    speed: '"when earned" → full accrual 신호 → modification 아님 → 정답\nB·C·D → 흔한 수정 항목 → 오답',
  },

  // [SPF_005] Tax-Basis Revenue — Taxable + Nontaxable 모두 포함 / Penalties = 비용
  // RULE    : Tax-basis revenue = taxable + nontaxable 전부 / penalties·fines = 비용, 수익 아님
  // TRIGGER : "income tax basis" + "nontaxable" + "tax-exempt" + "penalties"
  // TRAP    : taxable만 포함 / penalties를 수익에 포함 / nontaxable 누락
  {
    topic_id: "SPF_005",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_SPF',
    sub_category_id: "U2_SPECIAL_PURPOSE_FRAMEWORKS",
    card_type: 'calculation',
    card_name: "Tax-basis revenue — include taxable and nontaxable / exclude penalties",
    rule: "Tax-basis accounting 수익 계산:\n수익 포함 항목 (taxable 여부 무관):\n① Taxable revenue → 포함\n② Nontaxable 수익(생명보험금 등) → 포함\n③ Tax-exempt 수익(지방채 이자 등) → 포함\n\n수익 제외 항목:\n✗ Nondeductible penalties/fines → 비용 항목, 수익 아님\n\n핵심: 문제가 'revenues'만 물으면 → 비용 항목 차감 없이 수익만 합산",
    trigger: "'income tax basis of accounting' + 'revenues' 질문 → taxable + nontaxable 전부 합산 'nontaxable' 수익 → 포함 (과세 여부 ≠ 수익 여부) 'tax-exempt' 수익 → 포함 'penalties' / 'fines' → 비용 항목 → 수익에서 제외 (빼는 게 아니라 처음부터 안 넣음)",
    trap: "Taxable만 포함 → nontaxable·tax-exempt도 수령한 수익이므로 포함 Penalties를 수익에 포함 → penalties는 비용 항목, 수익 아님 Nondeductible penalties를 차감 → 차감하는 게 아니라 처음부터 수익에 넣지 않음 Net income 계산으로 혼동 → 'revenues'만 물으면 비용 차감 없음",
    one_sentence: "Tax-basis 수익 = taxable + nontaxable 전부 / penalties = 비용이라 수익에 처음부터 미포함.",
    example: "Taxable $500K + Life insurance $100K + Municipal bond $30K = $630K Penalties $20K → 비용 항목 → 수익 계산에 포함 안 함",
    speed: "① 항목 분류: 수익 vs 비용 ② penalties/fines → 즉시 제외 ③ 나머지 수익 전부 합산 (taxable 여부 무관)",
    context_background: "[Tax-basis accounting 수익 원칙]\n세금기준 회계에서 수익은 과세 여부와 무관하게 수령한 모든 수익을 포함.\nnontaxable이어도 실제로 받은 돈이면 수익.\ntax-exempt 이자도 실제로 받은 이자 수익.\n\n[Penalties 처리]\nPenalties/fines = 비용 항목.\nnondeductible이어도 비용으로 분류 — 세금에서 공제 안 될 뿐.\n수익이 아니므로 revenues 계산에 포함하지 않음.\n\n['revenues'와 'net income' 질문의 차이]\nrevenues만 묻는 경우: 수익 항목만 합산, 비용 차감 없음\nnet income 묻는 경우: 수익 − 비용(penalties 포함) = net income\n→ 문제가 무엇을 묻는지 먼저 확인",
  },
  {
    topic_id: "ADJ_001",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Prepaid Rent — adjusting entry (quarterly basis)",
    rule: "월 임차료 = 총액 ÷ 계약개월수. 분기 기장 시 이미 처리된 금액 확인 후 제외. 경과 기간 × 월 임차료 = adjusting entry 금액. Dr. Rent Expense / Cr. Prepaid Rent.",
    trigger: "prepaid rent | adjusting entry | quarterly | calendar year-end | rent expense | journal entries posted quarterly",
    trap: "Sep 30 분기 기장(0.5개월)을 무시하고 전체 경과 기간 계상하는 실수 → 중복 계상. Prepaid(자산) 감소 = Credit. 계약 시작일이 분기 중간이면 첫 분기 처리 기간 반드시 확인.",
    one_sentence: "Prepaid 조정 = 경과 기간 × 월 임차료 — 분기 기장분 이미 처리된 것 빼고 계산.",
    example: "$54,000 / 18개월 = $3,000/월 | Sep 15~Sep 30 분기 기장: 0.5개월 $1,500 처리됨 | Dec 31 조정: 3개월 × $3,000 = $9,000 → Dr. Rent Expense $9,000 / Cr. Prepaid Rent $9,000",
    context_background: "[왜 \"paying $36,000\"이 Prepaid인가]\n\n\"paying the full amount\" = 선납(advance payment)\n→ 서비스는 앞으로 18개월에 걸쳐 받는 것\n→ 지금 당장 소비한 게 아님 → 자산(Prepaid) 먼저\n→ Dr. Prepaid Rent $36,000 / Cr. Cash $36,000\n\n반대로 \"expensed the entire amount\"라고 나오면 → 전액 Expense로 잡은 것\n\"paying\" 단독 표현 = 자산법(Prepaid 먼저)으로 처리한 것으로 봄",
  },
  // [ADJ_002] Prepaid insurance — error correction + adjusting entry
  // RULE    : renew = 구 보험 만료 → 기존 잔액 전액 expense / 신규 납부액 경과월만 expense, 나머지 Prepaid 환원
  // TRIGGER : "renew" + sole/only policy + unadjusted trial balance prepaid 잔액 + 납부액 전액 expense 기록
  // TRAP    : 기존 prepaid 유지 착각 / 신규 납부액 전액 expense 유지 / only = 다른 보험과 섞임 없음
  {
    topic_id: "ADJ_002",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Prepaid insurance — error correction + adjusting entry",
    rule: "보험료 납부 시 전액 expense로 잘못 기록한 경우 결산일에 두 가지 동시 수정: ①기존 Prepaid 잔액 → renew(갱신) 확인 시 전액 expense 처리 ②신규 납부액 → 경과월만 expense, 나머지는 Prepaid로 환원. Insurance Expense = 기존 잔액 + 신규 경과분 / Prepaid = 신규 납부액 × 잔여월/총월.",
    trigger: "renew | sole/only insurance policy | unadjusted trial balance prepaid 잔액 존재 | 납부액 전액 expense 기록 | adjusting entry | error correction",
    trap: "기존 prepaid 잔액 그대로 남아있다고 착각 → renew = 구 보험 만료, 전액 expense / 신규 납부액 전액 expense 유지 → 경과월만 expense, 나머지 Prepaid로 수정 / only/sole = 보험이 하나뿐 → 기존 잔액이 다른 보험과 섞일 가능성 없음.",
    one_sentence: "renew 보이면 → 기존 prepaid 전액 expense 확정 + 신규 납부액은 경과월만 expense / 나머지 Prepaid.",
    example: "신규 $14,400(36개월) 납부 시 전액 expense 오류 → 수정: 기존 잔액 $600 전액 expense + $14,400÷36=$400 expense + $14,000 Prepaid 환원. 최종: Expense $1,000 / Prepaid $14,000.",
  },
  // [ADJ_003] Cash Paid for Operating Expenses — Accrual to Cash Conversion
  // RULE    : Cash Paid = Expense − ΔAccrued Liability + ΔPrepaid
  // TRIGGER : "debits to operating expenses" + prepaid/accrued 잔액 → 역산 공식
  // TRAP    : Prepaid↑ 빼기($83K) / Accrued↑ 더하기($117K) / 둘 다 반대($107K)
  {
    topic_id: "ADJ_003",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Cash Paid for Operating Expenses — Accrual to Cash Conversion",
    rule: "Cash Paid = Operating Expense − ΔAccrued Liability + ΔPrepaid. Accrued Liability ↑ = 비용 인식했지만 현금 미지출 → 빼기. Prepaid ↑ = 현금 먼저 냈지만 비용 미인식 → 더하기. SCF indirect method 조정과 동일 구조.",
    trigger: '"debits to operating expenses" + prepaid / accrued liabilities 잔액 → 역산 공식 적용\nCash Paid = Expense − ΔAccrued Liability + ΔPrepaid\nAccrued Liability ↑ → 비용은 인식됐지만 현금 미지출 → 빼기\nPrepaid ↑ → 현금은 나갔지만 비용 미인식 → 더하기',
    trap: "TRAP 1: $83,000 (A) → Prepaid 증가를 빼기로 처리. Prepaid ↑ = 현금 먼저 냈다 → 더해야 함\nTRAP 2: $117,000 (C) → Accrued Liability 증가를 더하기로 처리. Accrued ↑ = 현금 아직 안 냈다 → 빼야 함\nTRAP 3: $107,000 (D) → 두 항목 부호 완전히 반대 적용. 각 항목의 경제적 의미 혼동\n공통 함정: Prepaid와 Accrued의 방향 혼동 → T/A로 확인: Prepaid Dr증가=현금 지출 / Accrued Cr증가=현금 미지출",
    one_sentence: "Cash Paid = Expense − ΔAccrued Liability + ΔPrepaid; Accrued↑ 빼고 Prepaid↑ 더하기.",
    example: "Expense $100K / Accrued +$12K / Prepaid +$5K → Cash Paid = $100K − $12K + $5K = $93K",
    context_background: "발생주의(accrual basis) 회계에서 비용은 현금 지급 시점과 다를 수 있다. Operating Expense(I/S)는 발생주의 기준이므로 실제 현금 지급액을 구하려면 두 가지 계정을 조정해야 한다. Accrued Liability(미지급비용)가 증가했다는 것은 비용을 I/S에 이미 올렸지만 현금은 아직 내지 않았다는 뜻이고, Prepaid Expense(선급비용)가 증가했다는 것은 현금을 먼저 냈지만 아직 비용으로 인식하지 않은 금액이 늘었다는 뜻이다. 이 역산 로직은 SCF(간접법) indirect method에서 Operating Activities 조정과 동일한 사고 구조다.",
    context_trigger: '"debits to operating expenses" + prepaid/accrued 잔액 변동 → Cash Paid 역산 공식',
    rule_title: "발생주의 비용 → 현금 지급액 역산 공식",
    rule_items: [
      "Cash Paid = Operating Expense − ΔAccrued Liability + ΔPrepaid",
      "Accrued Liability ↑: I/S 비용 인식 but 현금 미지출 → 실제 현금 지급은 그만큼 적음 → 빼기",
      "Accrued Liability ↓: 과거 인식 비용을 이번에 현금으로 냄 → 실제 지급은 그만큼 많음 → 더하기",
      "Prepaid ↑: 현금 먼저 지급 but I/S 비용 미인식 → 실제 현금 지급은 그만큼 많음 → 더하기",
      "Prepaid ↓: 과거 선급액이 이번에 비용화 → 현금 추가 지출 없음 → 빼기",
      "이 조정 구조는 SCF indirect method Operating Activities 조정과 완전히 동일",
    ],
    speed: "① Operating Expense $100,000 확인\n② Accrued Liability $8K→$20K = +$12K → 현금 안 냈으니 빼기 → $100K − $12K = $88K\n③ Prepaid $5K→$10K = +$5K → 현금 먼저 냈으니 더하기 → $88K + $5K = $93K → B\n④ 오답 체크: A=$83K(prepaid 빼기), C=$117K(accrued 더하기), D=$107K(둘 다 반대)",
  },

  // [ADJ_004] Prepaid expense — AJE when fully expensed at payment
  // RULE    : 전액 expense 처리 후 기말 AJE = Dr. Prepaid / Cr. Expense (미래 기간 해당분)
  // TRIGGER : 'expensed the entire payment' + 기말 결산 → expense 과대계상 → 미래분 Prepaid 환원
  // TRAP    : AJE 방향 반대(Dr. Expense / Cr. Prepaid) / 당기분·미래분 개월 수 혼동
  {
    topic_id: "ADJ_004",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_name: "Prepaid expense — AJE when fully expensed at payment",
    rule: "현금 지급 시 전액 expense 처리 → 기말 AJE: 미래 기간 해당분을 Dr. Prepaid / Cr. Expense로 환원. 당기 인식분 = 지급일~기말, 미래분 = 기말 다음날~용역 종료일.",
    trigger: "'expensed the entire payment' + 기말 결산 → expense 과대계상 상태\n→ Dr. Prepaid / Cr. Services Expense (미래 기간 해당분)\nAJE 금액 = 월할 금액 × 미래 잔여 개월 수",
    trap: "A/D (Dr. Services Expense / Cr. Prepaid) → 방향 반대. 이미 전액 expense 처리했으므로 expense를 줄이는 방향이어야 함\nB ($30,000) → Year 1 인식분(2개월)을 Prepaid로 환원하는 오류. 미래분(4개월) $60,000이 Prepaid\n공통 함정: 당기분과 미래분 개월 수를 혼동하는 것. 기말(12/31) 기준으로 아직 안 온 기간만 Prepaid",
    one_sentence: "전액 expense 처리 후 AJE = Dr. Prepaid / Cr. Expense (미래 기간 해당분); 당기분은 expense 그대로 유지.",
    speed: "$90,000 ÷ 6개월 = $15,000/월\nYear 1 인식: Nov~Dec 2개월 × $15,000 = $30,000 (expense 유지)\nYear 2 해당: Jan~Apr 4개월 × $15,000 = $60,000 → AJE 금액",
    context_background: "[이 문제의 상황]\nOct 31에 $90,000 지급 → 전액 Dr. Services Expense. 실제 용역은 Nov 1 ~ Apr 30 (6개월).\nYear 1 기말(Dec 31) 시점: Nov~Dec 2개월치만 당기 비용, Jan~Apr 4개월치는 아직 용역 미제공 → Prepaid로 환원 필요.\n\n[AJE 방향 결정 로직]\n① 현재 장부 상태: Services Expense $90,000 (과대계상)\n② 올바른 상태: Services Expense $30,000 + Prepaid $60,000\n③ 차이 조정: Dr. Prepaid $60,000 / Cr. Services Expense $60,000\n\n[Matching Principle]\n비용은 관련 수익이 인식되는 기간에 인식. 용역이 제공되지 않은 기간의 비용은 자산(Prepaid)으로 이연.\n\n[반대 케이스 — 전액 Prepaid로 처리했을 때]\n지급 시: Dr. Prepaid $90,000 / Cr. Cash $90,000\nAJE: Dr. Services Expense $30,000 / Cr. Prepaid $30,000 (당기분 인식)",
  },

  // [ADJ_006] Cash to Accrual Conversion — Expense (Prepaid + Accrued)
  // RULE    : Accrual = Cash − ΔPrepaid + ΔAccrued / Prepaid(자산) 부호 반대 / Accrued(부채) 부호 그대로
  // TRIGGER : Cash basis expense + Prepaid/Accrued 잔액 → 변환 공식 적용
  // TRAP    : 부호 전부 반대(A) / Accrued 부호 반대(B) / Accrued 조정 누락(C)
  {
    topic_id: "ADJ_006",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Cash to Accrual Conversion — Expense (Prepaid + Accrued)",
    rule: "Cash→Accrual Expense 변환:\nAccrual = Cash − ΔPrepaid + ΔAccrued\n\nPrepaid (자산): 현금이 먼저 나간 것 → 부호 반대\n  증가 → Accrual 감소 (-)\n  감소 → Accrual 증가 (+)\n\nAccrued Expense (부채): 비용이 먼저 잡힌 것 → 부호 그대로\n  증가 → Accrual 증가 (+)\n  감소 → Accrual 감소 (-)",
    trigger: "Cash basis expense 주어짐 + Prepaid/Accrued 잔액 → 변환 공식 적용\nPrepaid 증가 → Accrual 감소 (자산: 부호 반대)\nAccrued 감소 → Accrual 감소 (부채: 부호 그대로)\n'cash basis' + 'accrual basis' 동시 언급 → 변환 문제 확정",
    trap: "A: 부호 전부 반대 적용 → Accrual→Cash 방향으로 잘못 변환\nB: Accrued 부호 반대 적용 오류. Accrued는 부채라 부호 그대로\nC: Prepaid만 조정, Accrued 조정 누락",
    one_sentence: "Accrual = Cash − ΔPrepaid(자산: 부호 반대) + ΔAccrued(부채: 부호 그대로)",
    speed: "① ΔPrepaid = $1,800−$1,300 = +$500 증가 → −$500\n② ΔAccrued = $1,200−$1,650 = −$450 감소 → −$450\n③ $35,200 − $500 − $450 = $34,250 → 답: D",
    context_background: "[왜 Prepaid는 부호가 반대인가]\nPrepaid = 자산. 현금이 먼저 나간 것.\nCash basis에는 이미 현금 지출로 반영돼 있음.\nPrepaid 증가 = 올해 현금이 더 나갔지만 비용은 내년 것\n→ Cash가 과대계상 → Accrual에서 빼야 함 → 부호 반대\n\n[왜 Accrued는 부호가 그대로인가]\nAccrued Expense = 부채. 비용이 먼저 잡힌 것. 현금은 아직.\nCash basis에는 반영 안 됨.\nAccrued 증가 = 올해 비용 발생했지만 현금은 아직 안 냄\n→ Cash에 없는 비용 → Accrual에 더해야 함 → 부호 그대로\n이름 자체가 'Accrued(발생주의)'라서 Accrual basis와 방향이 같음.\n\n[공식 유도]\nAccrual Expense\n= 올해 실제 발생한 비용\n= (현금 지출) − (내년 비용으로 이월된 것) + (올해 발생했지만 아직 안 낸 것)\n= Cash − ΔPrepaid + ΔAccrued\n\n[이 문제 적용]\nΔPrepaid  = $1,800 − $1,300 = +$500 증가 → −$500\nΔAccrued  = $1,200 − $1,650 = −$450 감소 → −$450\n$35,200 − $500 − $450 = $34,250",
  },

  // [ADJ_005] Prepaid Expense — Multi-item Proration (Insurance + Property Tax)
  // RULE    : 항목별 납부일~기말 경과분 = expense / 잔여분 = Prepaid / 연간 보험료 = 12개월 단위
  // TRIGGER : 복수 항목 → 각각 월할 계산 후 합산 / annual premium → 12개월 기준(3년 전체 아님)
  // TRAP    : 보험 3년 전체 1/3 계산 오류(B) / Tax 전액 Prepaid(C) / Tax 전액 제외(D)
  {
    topic_id: "ADJ_005",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Prepaid Expense — Multi-item Proration (Insurance + Property Tax)",
    rule: "Prepaid 월할 계산 원칙:\n① 납부일~기말(12/31) = 경과 기간 → expense\n② 기말 이후 잔여 기간 → Prepaid\n③ 연간 보험료: 3년 계약이어도 연간 납부 → 12개월 단위로 계산\n④ 복수 항목: 각각 따로 계산 후 합산",
    trigger: "'annual premium payable on [date]' → 12개월 단위 계산 (계약기간 전체 아님)\n복수 항목(보험 + 세금 등) → 항목별 각각 월할 계산 후 합산\n납부일~12/31 개월 수 → expense 비율 / 12/31 이후 개월 수 → Prepaid 비율",
    trap: "B($48,000): 보험을 3년 전체 기준 1/3로 계산 오류. 연간 납부이므로 12개월 기준\nC($60,000): Tax $24,000 전액 Prepaid 처리. Oct~Dec 3개월($6,000) expense 누락\nD($36,000): Tax 전액 제외. $18,000 Prepaid 누락",
    one_sentence: "복수 항목 Prepaid = 항목별 월할 계산 합산; 연간 보험료는 12개월 기준, tax는 납부일부터 월할.",
    speed: "① Insurance: $72,000 ÷ 12 × 6개월(Jul~Dec 경과) = $36,000 expense → Prepaid $36,000\n② Tax: $24,000 ÷ 12 × 3개월(Oct~Dec 경과) = $6,000 expense → Prepaid $18,000\n③ 합계: $36,000 + $18,000 = $54,000 → 답: A",
    context_background: "[Prepaid Expense 기본 원칙]\n현금을 지급했지만 아직 용역이 제공되지 않은 미래 기간 해당분을 자산(Prepaid)으로 인식.\n기말(12/31) 기준 경과분 → expense / 미경과분 → Prepaid.\n\n[항목별 계산]\n\n■ Property Insurance $72,000\n- 납부일: July 1, Year 1\n- 커버 기간: July 1, Y1 ~ June 30, Y2 (12개월, 연간 납부)\n- 경과(Jul~Dec): 6개월 → $72,000 × 6/12 = $36,000 expense\n- Prepaid(Jan~Jun Y2): 6개월 → $36,000\n※ 3년 계약이어도 연간 납부이므로 12개월 단위로 계산. 1/3로 나누면 오답.\n\n■ Business Property Tax $24,000\n- 납부일: October 1, Year 1\n- 커버 기간: Oct 1, Y1 ~ Sep 30, Y2 (12개월)\n- 경과(Oct~Dec): 3개월 → $24,000 × 3/12 = $6,000 expense\n- Prepaid(Jan~Sep Y2): 9개월 → $18,000\n\n[합계]\nPrepaid Insurance:     $36,000\nPrepaid Property Tax:  $18,000\nTotal Prepaid:         $54,000\n\n[타임라인]\n7/1/Y1  납부 보험료 $72K → Prepaid $72K\n10/1/Y1 납부 세금 $24K → Prepaid $24K\n12/31/Y1 보험 상각 $36K → expense\n12/31/Y1 세금 상각 $6K → expense\n잔액: $36K + $18K = $54K",
  },

  // [ADJ_007] AJE — Prepaid Rent Correction (Full Expense → Prepaid Split)
  // RULE    : 전액 Expense 처리 후 AJE = Dr. Prepaid(미경과분) / Cr. Expense
  // TRIGGER : 전액 expense + 결산일 전 일부 경과 → 미경과분 Prepaid 환원
  // TRAP    : expense 감소 선지 금액 오류(C) / 자산 증가 금액 오류(D) / 방향 반대(A)
  {
    topic_id: "ADJ_007",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "AJE — Prepaid Rent Correction (Full Expense → Prepaid Split)",
    rule: "전액 Expense 처리 후 수정 AJE:\nDr. Prepaid (미경과분) / Cr. Expense (미경과분)\n\n미경과분 = 월 금액 × 결산일 이후 잔여 개월\n경과분 = 월 금액 × 납부일~결산일 개월 → Expense 그대로",
    trigger: "전액 Expense 처리 + 결산일 전 일부만 경과 → 미경과분 Prepaid 환원\n선지에서 Dr. 쪽(자산 증가) 먼저 확인\nAJE 선지 = Dr./Cr. 중 하나만 표현",
    trap: "A($9,000 expense 증가): 방향 반대. Expense는 감소해야 함.\nC($4,500 expense 감소): 금액 오류. 경과분과 미경과분 혼동. $13,500 감소가 맞음.\nD($4,500 asset 증가): 금액 오류. 미경과 9개월 = $13,500.",
    one_sentence: "전액 Expense 처리 수정 AJE = Dr. Prepaid(미경과분) / Cr. Expense; 선지는 Dr. 쪽(자산 증가) 확인.",
    speed: "① 경과: 3개월(Jul~Sep) × $1,500 = $4,500 → Expense 유지\n② 미경과: 9개월(Oct~Jun) × $1,500 = $13,500 → Prepaid\n③ AJE: Dr. Prepaid $13,500 = 'increase in assets $13,500'\n④ 답: B",
    context_background: "[전액 Expense 처리 수정 흐름]\n\n잘못된 분개 (Gibbs가 한 것):\nDr. Rent Expense  18,000\n    Cr. Cash          18,000\n\n올바른 분개 (했어야 할 것):\nDr. Prepaid Rent   13,500  ← 미경과 9개월\nDr. Rent Expense    4,500  ← 경과 3개월\n    Cr. Cash           18,000\n\n수정 AJE:\nDr. Prepaid Rent   13,500\n    Cr. Rent Expense    13,500\n\n[선지 독해 전략]\nAJE 선지는 항상 Dr./Cr. 중 하나만 표현.\n둘 다 나오면 AJE 전체를 설명하는 것 → 선지 설계상 불가.\n\nDr. Prepaid Rent $13,500\n→ '자산 증가 $13,500' = 선지 B ✅\n\nCr. Rent Expense $13,500\n→ '비용 감소 $13,500' → 선지에 없음\n→ C는 '$4,500 감소'로 금액 함정\n\n[함정 설계 의도]\n수험생이 찾는 것: '비용 감소 $13,500'\n→ 선지에 없음 → 혼란\n→ C($4,500 감소)로 유도\n→ Dr. 쪽 '자산 증가 $13,500'을 놓침\n\n해결: Dr. 항목 먼저 확인 → 자산 증가 → B 선택",
  },
  {
    topic_id: "ADJ_008",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'concept',
    card_name: "Consignment revenue — 90-day period and date counting",
    rule: "Consignment 수익인식 2가지 조건 동시 충족 필요: ① 90일 반품기간 만료(91일째부터) ② 실제 판매 확정분(대금 수령 or 반품 소멸분)만 인식. 날짜 기산점 = 발송일 아닌 수령일. Consignor 수익 기준 = wholesale가 (소매가 아님).",
    trigger: "consignment | 90 days on consignment | shipment | delivery terms | two business days | adjusting entry | December 31",
    trap: "발송일(Oct 2) 기준으로 날짜 계산하면 90일 경과처럼 보임 → 반드시 수령일(Oct 4)부터 기산. 소매가($225K)로 수익 인식 오류 → consignor 수익 = wholesale가($150K). 기간 만료됐어도 반품분 제외한 확정분만 인식.",
    one_sentence: "Consignment 수익 = 90일 만료 후 + 반품 미확정분만 / 날짜 기산 = 수령일 기준.",
    example: "Oct 2 발송 + 2 business days → Oct 4 수령 / Oct 28 + Nov 30 + Dec 31 = 89일 → 90일 미만료 → No entry / 만약 대금 일부 수령 시 → 그 금액만 수익 인식 가능",
    speed: "① 'two business days' → 수령일 = Oct 4 ② Oct 28 + Nov 30 + Dec 31 = 89일 → 90일 미만료 ③ 수익인식 조건 미충족 → No journal entry → 정답 A",
  },

  // [ADJ_009] Escrow Liability Balance — Monthly Deposits vs Quarterly Payments
  // RULE    : 잔액 = 기초 + (월납입×개월수) − (분기납부×횟수)
  // TRIGGER : 'escrow deposit' + 'payable on first day of each calendar quarter'
  //           기준일까지 완료된 납부 횟수 파악 (9/30 → 1/1,4/1,7/1 = 3회)
  // TRAP    : 개월수 오류 / 납부 횟수 오류 (4회 vs 3회) / 기초잔액 누락
  {
    topic_id: "ADJ_009",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Escrow Liability Balance — Monthly Deposits vs Quarterly Tax Payments",
    rule: "에스크로 잔액 = 기초잔액 + (월납입 × 개월수) − (분기납부 × 완료 횟수)\n분기납부일: 1/1, 4/1, 7/1, 10/1\n기준일 9/30 → 완료 납부: 1/1, 4/1, 7/1 = 3회 (10/1 미포함)\n기준일 12/31 → 완료 납부: 4회 전부",
    trigger: "'escrow deposit' + 'payable in equal installments on the first day of each calendar quarter'\n→ 기초 + 월납입×개월수 − 분기납부×횟수\n9/30 기준 → Jan~Sep = 9개월 / 납부 3회\n6/30 기준 → Jan~Jun = 6개월 / 납부 2회",
    trap: "개월수 오류: 9/30이면 10월 포함 착각 → Jan~Sep = 9개월\n납부 횟수 오류: 10/1 납부를 포함해 4회 차감\n기초잔액 누락\n연간 세금 전액을 한 번에 차감하는 오류",
    one_sentence: "에스크로 잔액 = 기초 + 월납입×개월수 − 분기납부×완료횟수.",
    speed: "① 개월수: 기준월까지 (9/30 → 9개월)\n② 납부횟수: 기준일 이전 분기 첫날 카운트 (9/30 → 3회)\n③ 기초 + 입금 − 납부 = 잔액",
    example: "기초 $6,000 + $3,000×9 = $33,000 − $9,000×3 = **$6,000**",
  },

  // [ADJ_010] Supplies AJE — Expense Method: Restore Unused Supplies to Asset
  // RULE    : 초기 전액 Expense → AJE: Dr. Asset / Cr. Expense (미사용분) / Cash·AP → AJE 무관
  // TRIGGER : "expensing the entire amount" + "not used" → 미사용분 자산 복원
  // TRAP    : Cash AJE(B) / 반대 방향 Expense(C) / AP 사용(D)
  {
    topic_id: "ADJ_010",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Supplies AJE — Expense Method: Restore Unused Supplies to Asset",
    rule: "초기 처리 방법에 따라 AJE 방향이 반대:\n\n[이 문제 — Expense Method]\n초기: Dr. Supplies Expense / Cr. Cash (전액)\nAJE: Dr. Supplies (asset) / Cr. Supplies Expense (미사용분)\n→ expense 과대계상 → 미사용분 자산 복원\n\n[반대 케이스 — Asset Method]\n초기: Dr. Supplies (asset) / Cr. Cash (전액)\nAJE: Dr. Supplies Expense / Cr. Supplies (asset) (사용분)\n→ 사용분 비용화",
    trigger: '"expensing the entire amount on that day" → Expense Method 확인\n"not used" + 미사용 금액 → 자산 복원 방향\n→ Dr. Supplies (asset) / Cr. Supplies Expense\nCash 등장 선지 → AJE와 무관 (Jan 1 이미 지출)',
    trap: "Cash AJE: Cash는 Jan 1에 이미 지출. 기말 AJE에 현금 거래 없음\n반대 방향(Dr. Expense / Cr. Asset): 초기 Asset 처리였을 때 맞는 방향. 이미 Expense 처리 → 반대로 해야 함\nAP 사용: 현금 구매이므로 AP 없음\n사용분($19,800)으로 AJE: Expense Method에서 사용분은 이미 expense → AJE 필요 없음",
    one_sentence: "전액 Expense 처리 후 AJE = Dr. Asset / Cr. Expense (미사용분); Cash·AP는 AJE와 무관.",
    speed: "① 초기: 전액 Expense 확인\n② 미사용분 = expense 과대 → 자산 복원\n③ Dr. Cleaning Supplies $2,700 / Cr. Supplies Expense $2,700",
    context_background: "[초기 처리 방법 2가지와 AJE 비교]\n\n■ Expense Method (이 문제)\n초기 Jan 1: Dr. Supplies Expense $22,500 / Cr. Cash $22,500\n기말 Dec 31 AJE: Dr. Cleaning Supplies (asset) $2,700 / Cr. Supplies Expense $2,700\n결과: Expense $19,800 / Asset $2,700 ← 경제적 실질 반영\n\n■ Asset Method (반대 케이스)\n초기 Jan 1: Dr. Supplies (asset) $22,500 / Cr. Cash $22,500\n기말 Dec 31 AJE: Dr. Supplies Expense $19,800 / Cr. Supplies (asset) $19,800\n결과: Expense $19,800 / Asset $2,700 ← 동일한 결과\n\n두 방법 모두 기말 재무제표 결과는 동일.\n초기 처리 방법만 다르고, AJE는 그 방향을 보정.\n\n[AJE 핵심 원칙]\n기말 재무제표 목표: 사용분 = Expense / 미사용분 = Asset\n초기 처리가 이 목표에서 벗어나 있으면 AJE로 보정\nExpense Method: 미사용분만큼 expense 줄이고 asset 복원\nAsset Method: 사용분만큼 asset 줄이고 expense 인식",
    example: "Jan 1: $22,500 전액 Expense / Dec 31 미사용 $2,700\n→ AJE: Dr. Cleaning Supplies $2,700 / Cr. Supplies Expense $2,700\n최종: Expense $19,800 / Asset $2,700",
  },

  // [ADJ_011] Commission Expense — Net Sales × Rate (Advances and Unadjusted Balance Are Distractors)
  // RULE    : Commission Expense = Net Sales × % / Advances·Unadjusted·지급일 → 함정
  // TRIGGER : "commissions at X% of net sales" → Net Sales × %
  // TRAP    : Unadjusted balance 그대로(A) / advance 가산(B/D)
  {
    topic_id: "ADJ_011",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Commission Expense — Net Sales × Rate (Advances and Unadjusted Balance Are Distractors)",
    rule: "Commission Expense (Accrual Basis) = Net Sales × Commission Rate\n\n[Accrual Basis 핵심 원칙]\n'얼마를 현금으로 줬냐(advances)'가 아니라\n'매출이 발생했을 때 대응하는 비용이 얼마냐'\n\n매출 $15,000,000 확정 → 커미션 비용 = 3% = $450,000\n→ advances를 $15,000씩 줬든 $20,000씩 줬든 아직 안 줬든\n→ 비용 금액 자체는 변하지 않음\n\n[함정 데이터 3종 — 모두 무시]\n① Advances: 현금 전달 방식. expense 금액과 무관\n② Unadjusted balance: AJE 전 잔액. 내부 조정 후 Net Sales × Rate로 수렴\n③ 지급일: 현금 시점. accrual expense와 무관",
    trigger: '"commissions at X% of net sales" → Commission Expense = Net Sales × %\nAdvances 금액 제시 → 즉시 무시\nUnadjusted balance 제시 → 즉시 무시\n지급일 제시 → 즉시 무시\n핵심 질문: "매출 발생 시 대응하는 비용이 얼마냐" → Net Sales × Rate',
    trap: "Unadjusted balance($400,000) 그대로: AJE 미반영. 내부 조정 후 $450,000으로 수렴\nAdvance($15,000) 가산: advances는 현금 전달 방식, 비용 증가 아님\nAdvance를 정답에 추가: 이중 가산 오류\n공통 함정: '얼마를 현금으로 줬냐'에 집착 → accrual은 '매출에 대응하는 비용'이 기준",
    one_sentence: "Commission expense = Net Sales × Rate; 현금 방식(advances)·unadjusted·지급일 = 모두 함정.",
    speed: "$15,000,000 × 3% = $450,000\nAdvances·Unadjusted·지급일 → 즉시 전부 무시\n숫자 많아도 Net Sales × Rate 하나만",
    context_background: "[문제 구조 한 줄씩 해석]\n\n'3% of net sales' → 커미션 계산식 확정\n'monthly advances of $15,000' → 현금을 매달 미리 주는 방식 (함정)\n'advances charged to commission expense' → 임시로 비용 계정에 기록 (함정)\n'reconciliations prepared quarterly' → 분기 정산 과정 설명 (계산 불필요)\n'Net sales $15,000,000' → 유일하게 쓸 숫자 ✅\n'unadjusted balance $400,000' → AJE 전 잔액 (함정)\n'March advances paid April 3' → 현금 지급 시점 (완전한 함정)\n\n[Accrual vs 현금주의 차이]\nAccrual: 매출 발생 기간에 대응 비용 인식\n→ Net Sales × Rate = 비용 (현금 지급과 무관)\n\n현금주의: 현금 나간 날 비용 인식\n→ Advances 지급 시 비용 (매출과 무관)\n\n[내부 AJE 흐름 (참고용)]\nUnadjusted $400,000 + AJE $50,000 = $450,000\nDr. Commission Expense $50,000\n    Cr. Accrued Commission Payable $50,000\n→ 문제는 최종 I/S 금액만 묻는 것 → Net Sales × Rate로 바로 계산\n\n[핵심 암기]\n매출 × 요율 = 커미션 비용\n얼마를 현금으로 줬냐 → 무관\n숫자가 아무리 많아도 Net Sales × Rate 하나만 찾으면 끝",
    example: "Net Sales $15,000,000 × 3% = $450,000\nUnadjusted $400K → 무시 / Advances $15K/월 → 무시 / April 3 → 무시",
  },

  // [ADJ_012] Real Estate Tax Payable – Closing Credit + Monthly Accrual + Payment Allocation
  // RULE    : 클로징 크레딧 → Cr.Payable / 매월 accrual → Cr.Payable / 납부 시 payable 잔액 차감, 초과→Prepaid
  // TRIGGER : "credit for accrued realty taxes at closing" / "records tax at end of each month"
  // TRAP    : 납부액 전액 payable 차감 / 클로징 크레딧 payable 누락
  {
    topic_id: "ADJ_012",
    category: "Adjusting Entries",
    topic_name: "Real Estate Tax Payable – Closing Credit + Monthly Accrual + Payment Allocation",
    rule: "【재산세 매입 시 클로징 처리】\n매입일 이전 기간(매도인 부담분)\n→ 클로징 크레딧으로 수령\n→ Cr. Real estate taxes payable\n\n【매월 accrual】\n매월 말: 1/12 × 연간 세액\n→ Cr. Real estate taxes payable\n\n【납부 시 배분】\n납부액 전체를 payable로 차감 금지\n① Dr. RE taxes payable = 누적 payable 잔액\n② Dr. Prepaid RE taxes = 납부액 − payable 잔액\n③ Cr. Cash = 납부액\n\n이유: payable = 이미 발생한 기간의 의무\n     Prepaid = 아직 발생하지 않은 미래 기간 선납",
    trigger: '"credit for accrued realty taxes at closing" → payable 크레딧\n"records tax at end of each month" → 매월 accrual\n"first installment" → payable 누적액 vs 납부액 비교\n납부액 > payable → 초과분 Prepaid',
    trap: "납부액 전액을 payable 차감으로 처리(누적 payable만 차감).\n클로징 크레딧을 payable 계산에서 누락.\n매도인 부담 기간(July~Aug) 계산 오류.\n매월 accrual 시작 시점 혼동(매입월부터 시작).",
    example: "연간 세액 $24,000 / 월 $2,000\n9/1 매입: July+Aug 크레딧 $4,000 → Cr.Payable\n9/30: Sept accrual $2,000 → Cr.Payable\n10/31: Oct accrual $2,000 → Cr.Payable\n누적 Payable = $8,000\n\n11/1 $12,000 납부:\nDr. RE taxes payable  $8,000\nDr. Prepaid RE taxes  $4,000  ← Nov~Dec 선납\nCr. Cash             $12,000",
    journal_entry: "9/1 클로징:\nDr. Cash (매입가 감소) $4,000\nCr. RE taxes payable  $4,000\n\n매월 말:\nDr. RE tax expense $2,000\nCr. RE taxes payable $2,000\n\n11/1 납부:\nDr. RE taxes payable $8,000\nDr. Prepaid RE taxes $4,000\nCr. Cash $12,000",
    key_formula: "누적 Payable = 클로징 크레딧 + 매월 accrual 합계\n납부 시 Dr.Payable = 누적 잔액 / 초과분 = Prepaid",
    speed: "납부 시 Dr.Payable = 누적 payable 잔액 | 초과분 → Prepaid | 클로징 크레딧도 payable에 포함",
  },

  // [ADJ_013] Accrued Interest — Period-End Recognition
  // RULE    : 이자 지급일이 기말 이후 → Dr. Interest Expense / Cr. Accrued Interest (원금 계정과 분리)
  // TRIGGER : "interest payment made in January / next year" + "December 31"
  // TRAP    : Loans Payable에 이자를 섞으면 오답 — 원금과 이자는 반드시 분리
  // EXAMPLE : Q4 이자 $11,250 발생, 지급일 1/20 Year 2 → Dr. Interest Expense $11,250 / Cr. Accrued Interest $11,250
  {
    topic_id: "ADJ_013",
    category: "Adjusting Entries",
    topic_name: "Accrued Interest — Period-End Recognition",
    summary: "기말 미지급 이자 발생 시 원금 계정과 분리하여 Accrued Interest로 계상",
    rule: "이자 지급일이 기말 이후인 경우, 발생한 이자비용을 Dr. Interest Expense / Cr. Accrued Interest로 인식. 원금 계정(Loans/Notes/Bonds Payable)에 이자를 포함하면 안 됨.",
    trigger: "interest payment made after year-end / quarterly interest charges at December 31",
    trap: "Loans Payable에 이자를 섞으면 오답 — 원금과 이자는 반드시 분리",
    example: "Q4 이자 $11,250 발생, 지급일 1/20 Year 2 → Dr. Interest Expense $11,250 / Cr. Accrued Interest $11,250",
    speed: "이자 지급일이 기말 이후 → Dr. Interest Expense / Cr. Accrued Interest (무조건 반사)",
  },

  // [ADJ_014] Prior Period Error Correction — Depreciation Omission
  // RULE    : 전기 오류 수정 = Accumulated Depreciation gross 금액으로 직접 조정 / Depreciation Expense 절대 금지
  // TRIGGER : "failed to record depreciation in the prior year" / "depreciation computed correctly for tax purposes"
  // TRAP    : Depreciation Expense 사용 오답 / Acc. Dep을 세후 금액으로 쓰면 오답 — 항상 gross
  // EXAMPLE : 전기 누락 $60,000, 세율 20% → Dr. RE $48,000 / Dr. DTA $12,000 / Cr. Acc. Dep $60,000
  {
    topic_id: "ADJ_014",
    category: "Accounting Changes and Error Corrections",
    topic_name: "Prior Period Error Correction — Depreciation Omission",
    summary: "전기 감가상각 누락 오류 수정 시 Depreciation Expense가 아닌 Accumulated Depreciation을 gross 금액으로 직접 조정",
    rule: "전기 오류 수정 = Accumulated Depreciation을 gross 금액으로 직접 조정. Depreciation Expense 절대 사용 금지. 세후 금액은 Retained Earnings 조정에만 사용.",
    trigger: '"failed to report/record depreciation in the prior year" → Accumulated Depreciation 직접 조정. "depreciation computed correctly for tax purposes" → DTA 발생 신호.',
    trap: "Depreciation Expense로 수정하면 오답. Accumulated Depreciation을 세후 금액으로 쓰면 오답 — 항상 gross.",
    example: "전기 감가상각 누락 $60,000, 세율 20% → Dr. RE $48,000 / Dr. DTA $12,000 / Cr. Acc. Dep $60,000",
    speed: '"prior period error" + "depreciation" → Acc. Dep gross 금액으로 직접 수정 (Depreciation Expense 절대 금지)',
  },

  // [ADJ_015] Accrued Interest Payable — Post-Payment Balance Calculation
  // RULE    : Accrued Interest = 상환 후 잔액 × 이자율 × 경과월/12 / 원금 상환 전 전액 기준 계산 금지
  // TRIGGER : "three equal annual payments" + "first payment made on [중간 날짜]" → 상환 후 잔액 확인
  // TRAP    : 원금 상환 전 전액으로 계산 오답 / 연간 이자 그대로 쓰면 오답 — 경과 기간 안분 필수
  // EXAMPLE : $1,200,000 - $400,000 = $800,000 잔액 × 15% × 3/12 = $30,000
  {
    topic_id: "ADJ_015",
    category: "Adjusting Entries",
    topic_name: "Accrued Interest Payable — Post-Payment Balance Calculation",
    summary: "원금 일부 상환 후 잔액 기준으로 기간 안분하여 Accrued Interest Payable 계산",
    rule: "Accrued Interest = 상환 후 잔액 × 이자율 × 경과월/12. 원금 상환 전 전액 기준 계산 금지.",
    trigger: '"three equal annual payments" + "first payment made on [중간 날짜]" → 원금 상환 후 잔액 확인 필수. "December 31 balance sheet" + "payment made October 1" → 3개월 안분.',
    trap: "원금 상환 전 전액으로 이자 계산하면 오답. 연간 이자를 그대로 쓰면 오답 — 경과 기간(3/12) 안분 필수.",
    example: "$1,200,000 - $400,000 = $800,000 잔액 × 15% × 3/12 = $30,000",
    speed: '"first payment made" 확인 → 잔액 재계산 → 잔액 × 이자율 × 경과월/12',
  },

  // [ADJ_016] Loss Reporting — Ordinary vs Unusual / Actual vs Expected
  // RULE    : Actual loss만 인식 (Expected average 금지) / Frequent 손실 = Ordinary = No separate disclosure
  // TRIGGER : "frequently caused similar damage" → ordinary → no separate disclosure
  // TRAP    : Expected average loss 인식 오답 / Frequent에 separate disclosure 오답
  // EXAMPLE : 홍수 피해 매년 반복 → Actual flood loss / Continuing Operations / No separate disclosure
  {
    topic_id: "ADJ_016",
    category: "Income Statement",
    topic_name: "Loss Reporting — Ordinary vs Unusual / Actual vs Expected",
    summary: "자주 발생하는 손실 = Actual loss / Continuing Operations / No separate disclosure. 예상 평균 손실 인식 불가.",
    rule: "① Actual loss만 인식 (Expected average 금지). ② Frequent 손실 = Ordinary = No separate disclosure. Unusual = 비반복적·비정상적일 때만 별도 공시.",
    trigger: '"frequently caused similar damage" → ordinary → no separate disclosure. "sold for less than carrying amount" → actual loss 인식.',
    trap: "Expected average loss 인식 오답. Frequent 손실에 separate disclosure 추가 오답. Frequent = not unusual.",
    example: "홍수 피해 매년 반복 → Actual flood loss / Continuing Operations / No separate disclosure",
    speed: "frequent 손실 → Actual / Continuing Ops / No separate disclosure (무조건 반사)",
  },

  // [ADJ_017] OCI Required Disclosures — Reclassification Adjustments
  // RULE    : Reclassification adjustments → 재무제표 본문 필수 (footnotes 불가)
  // TRIGGER : "except" + "reported in the footnotes" + "reclassification" → footnotes 불가 → 오답(정답)
  // TRAP    : 세금 효과 공시 오답 금지 / 누적잔액 변동 오답 금지 — Reclassification만 footnotes 불가
  // EXAMPLE : Reclassification adjustments → 반드시 I/S 또는 OCI statement 본문 표시. Footnotes 불가.
  {
    topic_id: "ADJ_017",
    category: "Income Statement",
    topic_name: "OCI Required Disclosures — Reclassification Adjustments",
    summary: "Reclassification adjustments는 재무제표 본문 필수. 나머지 OCI 공시는 본문 or footnotes 모두 가능.",
    rule: "Reclassification adjustments → 재무제표 본문 필수 (footnotes 불가). 누적잔액 변동 / 세금 효과 → 본문 or footnotes 모두 가능. AOCI 총액 → B/S 자본 항목 필수.",
    trigger: '"except" 문제 + "reported in the footnotes" + "reclassification" → footnotes 불가 → 오답(정답).',
    trap: "세금 효과 공시 오답 생각 금지 → required. 누적잔액 변동 오답 생각 금지 → required. Reclassification만 footnotes only 불가 (본문 필수 + 주석 추가는 허용 / 주석만 → 불가). 정확한 표현: footnotes only 불가, footnotes 추가는 OK.",
    example: "Reclassification adjustments → 반드시 I/S 또는 별도 OCI statement 본문에 표시. Footnotes 불가.",
    speed: "Reclassification adjustments → 재무제표 본문 필수, footnotes 불가 (무조건 반사)",
  },

  // [ADJ_018] Financial Instruments — Liability vs Equity Classification
  // RULE    : Liability = 발행자가 피할 수 없는 현금 지급 의무 / Unconditional redemption → Liability
  // TRIGGER : "unconditional redemption" → Liability / "convertible to common stock" → Equity
  // TRAP    : Cumulative preferred = 배당 누적이지 상환 의무 아님 → Equity / Convertible = 주식 전환 → Equity
  // EXAMPLE : RCPS — unconditional redemption 조항 있으면 발행사 B/S에서 Liability 계상
  {
    topic_id: "ADJ_018",
    category: "Stockholders Equity",
    topic_name: "Financial Instruments — Liability vs Equity Classification",
    summary: "Unconditional redemption 조항 있는 주식 = Liability. 현금 상환 의무 없으면 Equity.",
    rule: "Liability = 발행자가 피할 수 없는 현금 지급 의무. Unconditional redemption → Liability. Convertible(주식전환) → Equity. Cumulative(누적배당) → Equity.",
    trigger: '"unconditional redemption" → Liability. "convertible to common stock" → Equity. "cumulative preferred" → Equity.',
    trap: "Cumulative preferred = 배당 누적이지 상환 의무 아님 → Equity. Convertible = 주식 전환 → 현금 유출 없음 → Equity. 할인 발행 = 발행 방식이지 상환 의무 아님 → Equity.",
    example: "RCPS(Redeemable Convertible Preferred Stock): IPO 시 주식 전환, 미상장 시 현금 상환 → unconditional redemption 조항 있으면 발행사 B/S에서 Liability 계상. 한국 스타트업 투자 계약서에서 자주 등장.",
    speed: "unconditional redemption → 현금 상환 의무 → Liability (무조건 반사)",
  },

  // [ADJ_019] Accrued Salaries — "Week Ended Friday" Calendar Reverse-Count
  // RULE    : "week ended Friday [date]" → 그 금요일로 끝나는 한 주 역산
  //           → 12/31이 몇 번째 날인지 세기 → 일당 × 발생일수
  // TRIGGER : "pays each Friday" + "week ended [Year 2 date]" + "December 31"
  // TRAP    : 주급 전액 / Year 2 날짜 수 / Cr. Cash
  {
    topic_id: "ADJ_019",
    book_id: 'AA',
    chapter_id: 'AA_CH6',
    topic_group: 'AA_CH6_ADJ',
    sub_category_id: "U2_ADJUSTING_ENTRIES",
    card_type: 'calculation',
    card_name: "Accrued salaries — week ended Friday: reverse-count days in Year 1",
    rule: "'week ended Friday [Year 2 date]' 읽는 법:\n① 그 금요일이 한 주의 마지막 날\n② 월요일 = 금요일 − 4일 역산\n③ 12/31이 그 주 몇 번째 날인지 세기 → Year 1 발생 일수\n④ 일당 = 주급 ÷ 5\n⑤ AJE = 일당 × Year 1 발생일수\nDr. Salaries expense / Cr. Accrued salaries (현금 지급은 Year 2 → Cr. Cash 금지)",
    trigger: "'pays employees each Friday' + 'week ended Friday [Year 2 날짜]' + 'December 31 Year 1'\n→ 달력 역산 모드 발동\n'daily wages always the same' → 일당 = 주급 ÷ 5\n'if any' → No entry 함정 포함 신호",
    trap: "주급 전액($125,750) accrual → Year 1 귀속분(2일치)만 인식해야 함 Cr. Cash → 현금 지급은 Year 2 금요일, 기말엔 Cr. Accrued salaries No entry → 발생주의 위반, 반드시 AJE 필요 Year 2 날짜 수(3일) accrual → Year 2분은 Year 2에 인식",
    one_sentence: "'week ended Friday' → 역산으로 12/31 요일 확정 → 일당 × Year 1 발생일수 → Accrued salaries.",
    example: "'week ended Friday, Jan 3 Y2' → 그 주: 12/30(월)~1/3(금) → 12/31 = 화요일 → Year 1 발생 2일 $125,750 ÷ 5 × 2 = $50,300 Dr. Salaries expense $50,300 / Cr. Accrued salaries $50,300",
    speed: "① 금요일 날짜 확인 → 그 주 월요일 역산 → 12/31 = 몇 번째 날 ② 주급 ÷ 5 × Year 1 발생일수 ③ Cr. Accrued salaries (Cash 아님)",
    context_background: "[발생주의 적용 원칙]\n직원이 일한 기간에 급여 비용 인식 — 현금 지급 시점 무관.\n12/31까지 일했으면 그날까지의 급여는 Year 1 비용 + 부채(Accrued salaries).\n현금은 Year 2 금요일에 지급되므로 기말 AJE는 Cr. Accrued salaries.\n\n['week ended Friday' 달력 역산 예시]\nJan 3(금) 마감 → 역산:\n  Jan 3 (금) - 4일 = Dec 30 (월) ← 그 주 시작\n  그 주: 12/30(월) 12/31(화) 1/1(수) 1/2(목) 1/3(금)\n  12/31 = 화요일 = 그 주 2번째 날 → Year 1 발생 2일\n\n[함정 구조]\n'January 3, Year 2'라는 날짜가 Year 2 소속처럼 보여서\n그 주 전체가 Year 2인 것처럼 착각하기 쉬움.\n실제로는 그 주의 12/30~12/31이 Year 1 귀속.\n'week ended'가 보이면 반드시 달력 역산으로 Year 1 발생일수 직접 세기.",
  },

  // [GOV_016] Fund accounting — definition and scope
  // RULE    : Fund = 목적별 자기완결적 회계단위 / 물리적 분리 불필요 / Equity 없음 → Fund Balance
  // TRIGGER : "fund accounting" + "self-balancing" + "segregated for the purpose" + "Fund Balance"
  // TRAP    : Fund = 현금만 / 물리적 분리 필요 / Combined statements가 전제조건 — 셋 다 오답
  {
    topic_id: "GOV_016",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Fund accounting — definition and scope",
    rule: "Fund = 자기완결적 회계단위(self-balancing set of accounts). 분리 기준 = 목적(specific activities or objectives), 물리적 분리 불필요. Equity 개념 없음 → Fund Balance(or Net Position) 사용. Fund 유형별 자산 범위: Governmental funds(General/Special Revenue) → 유동자산만 / Proprietary funds(Enterprise/Internal Service) → 유동+비유동 / Fiduciary funds(Pension Trust/Agency) → 유동+비유동.",
    trigger: "fund accounting | self-balancing | segregated for the purpose | governmental unit | Fund Balance",
    trap: "Fund = 현금만이라고 착각(→ 모든 금융자산 포함) / 물리적 분리 필요하다고 착각(→ 회계상 분리만으로 충분) / Combined statements가 전제조건이라고 착각(→ 결과물임).",
    one_sentence: "Fund = 목적별로 분리된 자기완결적 회계단위, Equity 없고 Fund Balance 사용.",
    example: "General Fund(유동자산만) / Enterprise Fund-수도·전기(유동+비유동) / Pension Trust Fund-공무원연금(유동+비유동) — 셋 다 물리적 혼합 가능, 회계상만 분리.",
  },
  {
    topic_id: "GOV_017",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_FUND",
    card_type: 'concept',
    card_name: "Trust funds — Permanent vs Special revenue fund classification",
    rule: "Permanent fund: 원금(principal) 지출 불가, 수익(earnings)만 지출 가능. Special revenue fund: 원금·수익 모두 지출 가능한 제한 재원. 분류 기준 = 원금 지출 가능 여부.",
    trigger: "'only earnings can be expended' → Permanent fund\n'both principal and interest can be expended' / 'fully expendable' → Special revenue fund",
    trap: "B (둘 다 Special revenue) → 원금 보존 조건인 Trust fund A는 반드시 Permanent\nC (A=Special, B=Permanent) → 완전히 반대. 원금 못 쓰는 쪽이 Permanent\nD (둘 다 Permanent) → 원금도 쓸 수 있는 Trust fund B는 Special revenue\n공통 함정: Permanent = '영구적으로 존재'로 오해. 실제 기준은 원금 지출 가능 여부",
    one_sentence: "원금 보존(earnings only) = Permanent fund; 원금+수익 모두 지출 = Special revenue fund.",
    speed: "원금 못 씀 → Permanent / 원금도 씀 → Special revenue\n즉시 매핑 후 선지 확인",
    context_background: "[Governmental Fund 유형 중 Trust fund 관련]\n\n① Permanent Fund\n- 원금(principal)은 법적으로 지출 불가\n- 운용수익(earnings/interest)만 특정 공공 목적에 지출 가능\n- 예: 도서관 기금, 묘지 관리 기금 등\n- 핵심: nonexpendable principal\n\n② Special Revenue Fund\n- 특정 목적에 제한(restricted/committed)된 재원\n- 원금·수익 모두 지출 가능 (fully expendable)\n- 예: 연방 보조금, 특별세 수입 등\n- 핵심: expendable but restricted to specific purpose\n\n[혼동 주의]\n'Permanent'라는 이름 때문에 '영구히 존재하는 기금'으로 오해하기 쉬움.\n실제 의미는 '원금이 영구히 보존되어야 하는 기금'.\n\n[이 문제 적용]\nTrust fund A: only earnings → 원금 보존 → Permanent fund\nTrust fund B: principal + interest → 전액 지출 가능 → Special revenue fund",
  },
  {
    topic_id: "GOV_018",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Governmental Accounting — All Fund Types Overview",
    rule: "Fund 3대 분류: Governmental(modified accrual) / Proprietary(full accrual) / Fiduciary(full accrual). Fiduciary는 Government-wide F/S 포함 안 됨. General Fund는 다른 fund에 해당 안 되면 기본 귀속.",
    trigger: "fund 분류 문제 → 먼저 3대 그룹 확인\n외부 시민 서비스+이용료 → Enterprise\n내부 부서 서비스 → Internal Service\n원금 보존 신탁 → Permanent\n타인 자산 보관·전달 → Fiduciary(Custodial)\n장기부채 상환 재원 → Debt Service\n자본자산 건설·취득 → Capital Projects",
    trap: "Permanent vs Private-Purpose Trust 혼동: Permanent = 공공 목적 + 원금 보존 / Private-Purpose = 개인·민간 목적\nEnterprise vs Internal Service: 서비스 대상이 외부 시민 → Enterprise / 내부 부서 → Internal Service\nFiduciary → Government-wide F/S 미포함 (타인 자산이므로)\nGeneral Fund는 딱 하나만 존재",
    one_sentence: "Governmental 5종(modified accrual) + Proprietary 2종 + Fiduciary 4종; Fiduciary는 Government-wide F/S 제외.",
    speed: "① 외부/내부/신탁/보관 중 어디? → 3대 그룹 결정\n② 그룹 내 세부 키워드로 fund 확정",
    context_background: "[전체 Fund 구조]\n\n■ Governmental Funds (5종) — Modified accrual / Current financial resources\n① General Fund: 정부 일반 운영. 유일하게 하나만 존재. 다른 fund에 해당 안 되면 여기\n② Special Revenue Fund: restricted/committed to specific purpose. 원금·수익 모두 지출 가능\n③ Capital Projects Fund: 자본자산 건설·취득 목적. 완료 시 fund 종료\n④ Debt Service Fund: 장기부채 원리금 상환 재원 적립\n⑤ Permanent Fund: 원금 보존 필수. earnings만 공공 목적 지출 가능\n\n■ Proprietary Funds (2종) — Full accrual / Economic resources\n① Enterprise Fund: 외부 시민에게 서비스 제공 + 이용료 징수 (상하수도, 공항, 주차장 등)\n② Internal Service Fund: 정부 내부 부서 간 서비스 제공 (차량 관리, IT 지원 등)\n\n■ Fiduciary Funds (4종) — Full accrual / Economic resources\n① Pension (and other employee benefit) Trust Fund: 직원 연금·퇴직급여\n② Investment Trust Fund: 외부 정부단체 투자 풀 관리\n③ Private-Purpose Trust Fund: 원금·수익 모두 개인·민간 목적\n④ Custodial Fund: 타인 자산 일시 보관·전달 (세금 징수 후 배분 등)\n→ Fiduciary는 정부 자산이 아니므로 Government-wide F/S 미포함\n\n[회계 기준 비교]\nGovernmental Funds: Modified accrual — 현재 재무자원(current financial resources) 측정\nProprietary/Fiduciary: Full accrual — 경제적 자원(economic resources) 측정",
  },
  // [GOV_019] Governmental Fund — Permanent Fund vs Special Revenue Fund
  // RULE    : 원금 사용 불가(이익만) → Permanent / 원금+이익 전액 → Special Revenue
  // TRIGGER : 'only earnings' → Permanent / 'principal and interest' → Special Revenue
  // TRAP    : A↔B 뒤집음 / 둘 다 Special / 둘 다 Permanent
  {
    topic_id: "GOV_019",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_GOVFUND',
    sub_category_id: "U6_GOVERNMENTAL_FUND",
    card_type: 'concept',
    card_name: "Governmental Fund — Permanent Fund vs Special Revenue Fund",
    rule: "Permanent Fund: 원금(Principal) 사용 불가, 이익(Earnings)만 특정 목적 사용 가능. Special Revenue Fund: 특정 목적으로 원금+이익 전액 사용 가능. 판단 기준 = 원금 사용 가능 여부.",
    trigger: "'only earnings can be expended' → Permanent Fund\n'principal and interest can be expended' → Special Revenue Fund\n원금 사용 불가 → Permanent / 원금 사용 가능 → Special Revenue",
    trap: "A↔B 뒤집음: Permanent/Special Revenue 혼동\n둘 다 Special Revenue(C): Permanent Fund 개념 무시\n둘 다 Permanent(D): Special Revenue 개념 무시\n공통 함정: 'trust fund = permanent' 선입견 → 사용 가능 범위로 판단",
    one_sentence: "원금 못 쓰면 Permanent / 원금도 쓸 수 있으면 Special Revenue.",
    speed: "'only earnings' → Permanent\n'principal AND interest' → Special Revenue",
    context_background: "[Governmental Fund — Trust Fund 분류]\n\n[Permanent Fund]\n- 원금(Principal): 법적으로 보존 의무\n- 이익(Earnings/Interest)만 특정 공공 목적에 사용\n- 예: 도서관, 공원 유지를 위한 기부금 → 이자만 사용\n- 핵심 문구: 'only earnings can be expended'\n\n[Special Revenue Fund]\n- 특정 목적으로 지정된 자원\n- 원금 + 이익 전액 사용 가능\n- 예: 특정 프로그램 운영을 위한 지정 기부금\n- 핵심 문구: 'principal and interest can be expended'\n\n[공통점]\n둘 다 Restricted(제한된) 자원\n특정 목적 외 사용 불가\n\n[차이점]\nPermanent: 원금 영구 보존 → 이익만 소비\nSpecial Revenue: 전액 소비 가능 → 소진 후 종료",
  },
  {
    topic_id: "GOV_020",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "SEA reporting — most difficult characteristic to demonstrate",
    rule: "SEA 4가지 특성: Relevance / Consistency / Comparability / Timeliness. 가장 입증 어려운 것 = Relevance — 정보와 의사결정 목적 간 논리적 연관성 증명이 구조적으로 어렵기 때문. 나머지 3개는 절차적으로 쉽게 확인 가능.",
    trigger: "service efforts and accomplishments | SEA | most difficult | governmental reporting | relevance | consistency | comparability | timeliness",
    trap: "Consistency(연도별 동일 원칙) / Comparability(타 정부와 동일 원칙) / Timeliness(적시 발행) → 셋 다 절차적 확인 가능 → 쉬움. Relevance만 인과관계 입증 필요 → 어려움.",
    one_sentence: "SEA most difficult = Relevance; 나머지 3개(Consistency·Comparability·Timeliness)는 절차적으로 입증 쉬움.",
    example: "Consistency: 매년 동일 측정 기준 사용 → 확인 쉬움 / Relevance: 서비스 산출물이 사회적 성과에 기여한다는 논리적 연결 → 입증 어려움",
    speed: "① 'most difficult' → 절차적 확인 불가능한 것 ② Consistency·Comparability·Timeliness = 모두 확인 쉬움 ③ Relevance = 논리적 연관성 입증 필요 → 정답 A",
  },

  // [GOV_021] Governmental fund measurement focus — current financial resources + financial position
  // RULE    : Governmental fund = current financial resources + financial position / Income = No
  //           Proprietary/Fiduciary = income determination
  // TRIGGER : "governmental fund" + measurement focus → current financial resources + financial position
  // TRAP    : Income = Yes 오분류 / Current financial resources = No 오분류
  {
    topic_id: "GOV_021",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_FUND",
    card_type: 'concept',
    card_name: "Governmental fund measurement focus — current financial resources and financial position",
    rule: "펀드별 Measurement Focus:\n\n[Governmental funds]\n① Current financial resources → Yes (당기 유동자원 흐름)\n② Financial position → Yes (재무상태)\n③ Income → No (손익 측정 안 함)\n\n[Proprietary / Fiduciary funds]\n① Income determination → Yes (영리기업과 유사)\n② Economic resources 기준 (장기자산·부채 포함)",
    trigger: '"governmental fund" + measurement focus → current financial resources + financial position\n"income determination" → Proprietary / Fiduciary fund\n"flow of current financial resources" → Governmental fund 핵심 키워드\n"General Fund / Special Revenue / Capital Projects / Debt Service" → 모두 Governmental fund',
    trap: "① Income = Yes → Governmental fund는 income 측정 안 함 (Proprietary 혼동)\n② Financial Position = No → Governmental fund는 재무상태 보고\n③ Current Financial Resources = No → Governmental fund의 핵심 측정 대상",
    one_sentence: "Governmental fund = Current financial resources + Financial position; Income 측정은 Proprietary/Fiduciary.",
    example: "General Fund: revenues & expenditures(current financial resources) + balance sheet(financial position) / Enterprise Fund: income statement(income determination)",
    context_background: "정부 회계에서 Measurement Focus는 무엇을 측정·보고하느냐를 결정한다. Governmental funds(General Fund, Special Revenue 등)는 당기에 사용 가능한 유동 자원의 흐름(current financial resources)과 그 결과인 재무상태(financial position)에 초점을 맞춘다. 손익(income)은 측정 대상이 아니다 — 영리기업처럼 운영되는 Proprietary fund의 관심사다.",
    speed: "① Governmental fund → income 측정 X → Income = No\n② Current financial resources = Yes\n③ Financial Position = Yes\n④ 정답 C",
  },

  // [GOV_021] Governmental external financial reports — three primary user groups
  // RULE    : 3대 user = Citizens(관할) + Legislative/oversight + Investors/creditors
  // TRIGGER : 'primary user groups of governmental external reports' → 3개 암기
  // TRAP    : 이웃 주 시민(A) / 보고서 작성자(B) / 내부 관리자(C) — 모두 제외
  {
    topic_id: "GOV_021",
    book_id: 'GN',
    chapter_id: 'GN_CH1',
    topic_group: 'GN_CH1_GOV',
    sub_category_id: "U6_GOVERNMENTAL_OVERVIEW",
    card_type: 'concept',
    card_name: "Governmental external financial reports — three primary user groups",
    rule: "주정부 외부 재무보고서 3대 primary user group:\n① Citizens of the jurisdiction (해당 관할 구역 시민)\n② Legislative and oversight bodies (입법·감독 기관)\n③ Investors and creditors (투자자·채권자)\n\n제외 대상:\n- 이웃 주 시민 → 관할 구역 밖\n- 보고서 작성자 → user 아님\n- 내부 관리자 → internal user",
    trigger: "'primary user groups of governmental external financial reports' → Citizens + Legislative/oversight + Investors/creditors\n'advocate groups within the state' → Citizens 카테고리 포함 → primary user ✓\n'neighboring state' → 관할 구역 밖 → 제외",
    trap: "A(이웃 주 시민): 관할 구역 밖 → 3대 그룹 해당 없음\nB(보고서 작성자): Producer이지 User 아님\nC(내부 관리자): Internal user → External report 대상 아님. Executive branch도 internal\n공통 함정: 정부와 관련된 모든 사람이 external report user라는 착각",
    one_sentence: "정부 외부 재무보고서 3대 user: ① 관할 시민 ② 입법·감독 기관 ③ 투자자·채권자.",
    speed: "① 관할 구역 내 시민/시민단체 → ✓\n② 입법·감독 기관 → ✓\n③ 투자자·채권자 → ✓\n이웃 주 시민 / 작성자 / 내부관리자 → 전부 ✗",
    context_background: "[왜 이 3개가 primary user인가]\n\n① Citizens: 세금을 내는 주체로서 정부가 자원을 효율적으로 사용했는지 알 권리가 있다. 선거권자이기도 하므로 정부 책임성(accountability) 평가의 핵심 주체.\n\n② Legislative/oversight bodies: 예산 편성·승인 권한을 가진 입법부와 감독 기관은 재무정보를 바탕으로 정책 결정과 감독을 수행한다.\n\n③ Investors/creditors: 지방채(municipal bonds)를 매입하거나 대출을 제공하는 투자자·채권자는 정부의 채무 상환 능력을 평가하기 위해 재무보고서를 사용한다.\n\n[제외 대상 논리]\n이웃 주 시민: 해당 정부의 세금을 내지 않고 서비스를 받지도 않으므로 직접적 이해관계 없음\n보고서 작성자: 정보를 생산하는 주체이지 소비하는 주체가 아님\n내부 관리자: 예산 집행·운영 정보를 별도로 접근 가능한 내부 주체 → external report의 타겟이 아님",
  },

  // [GOV_022] Government Fund Types — Real-World Examples by Fund
  // RULE    : 11개 기금 유형 각각 실제 사업 예시 1~2개로 기억
  // TRIGGER : "which fund" + 사업 설명 → 기금 유형 매칭
  // TRAP    : Enterprise vs Internal Service 혼동 (외부 이용자 vs 내부 부서)
  {
    topic_id: "GOV_022",
    book_id: 'GN',
    chapter_id: 'GN_CH3',
    topic_group: 'GN_CH3_GOVFUND',
    sub_category_id: "U6_GOVERNMENTAL_FUND",
    card_type: 'concept',
    card_name: "Government fund types — real-world examples for each of the 11 funds",
    rule: "【Governmental Funds — Modified Accrual (GRaSPP)】\n① General Fund\n   Police & Fire Dept. — core government operations funded by general taxes\n   Public School Operations — day-to-day instructional costs\n② Special Revenue Fund\n   Federal Highway Grant — gas tax proceeds restricted to road maintenance\n   Housing Development Grant — federal funds restricted to affordable housing\n③ Debt Service Fund\n   Municipal Bond Repayment — principal & interest on city bonds\n   G.O. Bond Debt Service — general obligation bond annual payments\n④ Capital Projects Fund\n   New City Hall Construction — long-term capital facility project\n   Bridge & Road Expansion — infrastructure capital project funded by bond proceeds\n⑤ Permanent Fund\n   Park Maintenance Endowment — principal preserved forever; only investment income spent\n   Cemetery Perpetual Care Fund — earnings used for ongoing maintenance\n\n【Proprietary Funds — Full Accrual (SE)】\n⑥ Enterprise Fund\n   Municipal Water & Sewer — city utility charging residents usage fees\n   City Airport — charges airlines and passengers landing/terminal fees\n   Public Transit (Bus/Rail) — fare-based city transportation system\n⑦ Internal Service Fund\n   Fleet Management — maintains city vehicles; charges other departments\n   Central IT Services — provides tech support to city departments internally\n   Central Print Shop — printing services billed to city departments\n\n【Fiduciary Funds — Full Accrual (CIPPE)】\n⑧ Pension Trust Fund\n   Public Employee Retirement System — manages pension assets for city employees\n⑨ Investment Trust Fund\n   Multi-Government Investment Pool — pooled investment fund for several local governments\n⑩ Private-Purpose Trust Fund\n   Scholarship Trust for Specific Family — benefits designated private individuals\n   Cemetery Trust (private) — for the benefit of specific private parties\n⑪ Custodial Fund\n   Property Tax Collection — collects taxes then remits to school districts & other entities",
    trigger: "'water & sewer / airport / public transit' → Enterprise Fund (외부 이용자 요금)\n'fleet / IT / print shop' → Internal Service Fund (내부 부서 간)\n'bond principal & interest' → Debt Service Fund\n'construction / infrastructure project' → Capital Projects Fund\n'federal grant restricted to specific purpose' → Special Revenue Fund\n'pension assets / retirement system' → Pension Trust Fund\n'collects and remits to other governments' → Custodial Fund\n'principal preserved / earnings only' → Permanent Fund",
    trap: "Enterprise vs Internal Service:\n→ Enterprise: charges EXTERNAL users (citizens, airlines, passengers)\n→ Internal Service: charges INTERNAL government departments only\n\nGeneral Fund scope:\n→ Only one General Fund per government\n→ All activities NOT required to be in another fund\n→ Special-purpose funds (grants, bond repayment) → separate fund\n\nPermanent Fund vs Private-Purpose Trust:\n→ Permanent Fund: benefits the PUBLIC (parks, cemeteries open to all)\n→ Private-Purpose Trust: benefits specific PRIVATE individuals or organizations",
    one_sentence: "Match fund name to real activity: Enterprise=airport/utility / Internal Service=city IT/fleet / Debt Service=bond repayment / Capital Projects=construction.",
    speed: "External fee → Enterprise / Internal dept → Internal Service / Construction → Capital Projects / Bond repayment → Debt Service / General taxes → General Fund",
    example: "Municipal water utility charging residents → Enterprise Fund\nCity IT department billing police dept → Internal Service Fund\nG.O. bond interest payment → Debt Service Fund\nNew library construction → Capital Projects Fund\nPolice & fire operations → General Fund\nPublic employee pension assets → Pension Trust Fund\nCounty collecting property tax for school district → Custodial Fund",
    context_background: "[Why different accounting bases per fund]\nGovernmental Funds: tax-funded → budget control is the goal → Modified Accrual\nProprietary Funds: fee-for-service → profitability tracking needed → Full Accrual\nFiduciary Funds: managing others' assets → Full Accrual (no net position reported)\n\n[Enterprise vs Internal Service — the key cut]\nEnterprise: citizen or business pays directly → external transaction\nInternal Service: Police Dept. orders copies from City Print Shop → internal transaction\n\n[General Fund = the catch-all]\nOne per government. Everything not legally required to be elsewhere goes here.",
  },

  // ── EQM ────────────────────────────────────────────────────────────────────
  // [EQM_001] Equity Method — Investment Account Change
  // RULE    : 순이익 지분 → 투자계정+ / 배당 지분 → 투자계정− / 주가 변동 무시
  // TRIGGER : 'owns X of Y outstanding shares' → 지분율 먼저 / 20~50% → 지분법
  // TRAP    : 주가 상승분($6K) / 배당 차감 누락($50K) / 순이익 가산 누락($20K)
  {
    topic_id: "EQM_001",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity Method — Investment Account Change",
    rule: "지분법 3단계: ①순이익 지분 → 투자계정 + (지분율×순이익) ②배당 지분 → 투자계정 − (지분율×배당) ③초과취득가액 상각 → 투자계정−. 주가 변동 무시.",
    trigger: "'owns X of Y outstanding shares' → 지분율 계산 먼저\n지분율 20~50% or 유의적 영향력 명시 → 지분법, 주가 변동은 무시\n'increase as a result of this year's transactions' → 이익 지분 − 배당 지분 − 상각액",
    trap: "$6,000 (A) → 주가 상승분 $2 × 3,000주 = 미실현이익. 지분법에서 주가 변동은 투자계정에 반영 안 함\n$50,000 (C) → 순이익 지분만 계산($200K × 25%). 배당 지분 차감 누락\n$20,000 (D) → 배당 지분만 계산($80K × 25%). 순이익 지분 가산 누락\n공통 함정: 지분법 vs 원가법 혼동. 원가법이면 주가 상승분만 인식. 유의적 영향력(또는 20~50% 지분율) 확인 즉시 지분법으로 전환",
    one_sentence: "지분법 투자계정 증감 = 순이익 지분 − 배당 지분 − 상각액; 주가 변동은 무시.",
    speed: "지분율 = 3,000 ÷ 12,000 = 25%\n+ 200,000 × 25% = +50,000 (이익 지분)\n- 80,000 × 25% = -20,000 (배당 지분)\nNet increase = 50,000 - 20,000 = $30,000\n※ 상각 정보 없으므로 ③ 생략",
    context_background: "[왜 20~50% 지분을 사는가]\n단순 투자(5% 이하)는 배당만 받고 끝이지만, 20~50% 지분을 매입하는 건 전략적 목적이 있다:\n- 공급망 통제: 핵심 부품 공급사 지분을 사서 안정적 공급 확보 (예: 완성차 → 배터리 제조사)\n- 기술 접근: 유망 스타트업 지분을 사서 기술력·인재 활용\n- 시장 진입: 해외 현지 기업 지분 매입으로 규제·유통망 확보\n- M&A 전 단계: 나중에 100% 인수하기 전 우선 지분 확보\n\n[유의적 영향력(Significant Influence)이 핵심]\n지분법 적용의 진짜 핵심 조건은 유의적 영향력의 존재다. 지분율 20~50%는 유의적 영향력을 추정하는 기준일 뿐 절대 조건이 아니다. 실제로는 지분율이 낮더라도 이사회 참여, 경영 정책 결정 개입, 핵심 인사 파견 등이 있으면 지분법을 적용한다. 반대로 지분율이 25%여도 유의적 영향력이 없다면 지분법 대상이 아니다.\n이 문제에서는 유의적 영향력이 명시되지 않았지만, 그렇다고 가정하고 지분법을 적용해야 문제가 풀린다. 지분율 25%가 주어진 것은 그 가정을 뒷받침하는 근거로 읽으면 된다.\n\n[Equity Method 3단계 회계처리]\n피투자회사와 투자자를 하나의 경제적 실체처럼 본다.\n① 피투자사 순이익 발생 → 투자계정 + (지분율 × 순이익) / 이유: 내 몫의 이익이 쌓인 것 / 회계처리: Dr. Investment in Grove / Cr. Equity in Earnings\n② 피투자사 배당 지급 → 투자계정 - (지분율 × 배당) / 이유: 이익이 현금으로 빠져나온 것 (이중계산 방지) / 회계처리: Dr. Cash / Cr. Investment in Grove\n③ 초과취득가액 상각 → 투자계정 - 상각액 / 이유: 취득 시 프리미엄의 기간 배분 / 회계처리: Dr. Equity in Earnings / Cr. Investment in Grove\n— 주가 변동 → 무시 / 이유: 지분법은 시장가치 반영 안 함 / 회계처리: 분개 없음\n\n[③ 상각이 발생하는 이유]\n지분법 투자 시 피투자사 순자산 장부금액보다 더 비싸게 사는 경우가 대부분이다. 그 초과분이 어디서 왔는지에 따라:\n- 피투자사 자산 저평가분 (예: 건물 FV > BV) → 해당 자산 내용연수에 걸쳐 상각 → 투자계정 감소\n- 설명 안 되는 나머지 → Goodwill → 상각 없음 (손상검토만)\n이 문제에서는 상각 정보가 주어지지 않아 ③은 적용하지 않는다. 지분율 = 3,000 ÷ 12,000 = 25% → 유의적 영향력 있다고 가정, 지분법 적용.",
  },
  {
    topic_id: "EQM_002",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity Method to Fair Value Method — mid-year transition income calculation",
    rule: "연중 지분 매각 → significant influence 상실 시점부터 Fair Value Method 전환. 전환 전: Equity Method(순이익 지분 인식, 배당은 투자자산 감소). 전환 후: Fair Value Method(배당만 수익 인식). 전환은 소급 조정 없이 전진법(prospective) 적용.",
    trigger: "'sold all but X shares' + 중간 매각 → 기간 분리 필수\nEquity Method 기간: 배당 수령 → Dr. Cash / Cr. Investment (Income 아님)\nFair Value Method 기간: 배당 수령 → Dr. Cash / Cr. Dividend Income",
    trap: "A ($31,000) → H2 배당을 50,000주 기준으로 계산 오류. 매각 후 보유주식(500주) 기준이어야 함\nB ($15,750) → H1 적용 기간을 2분기가 아닌 1분기로 계산\nC ($15,250) → H1 1분기 + H2 배당 오계산 이중 오류\n공통 함정: ① Equity Method 기간 배당을 Income으로 인식 ② H1 기간(2분기) vs H2 기간(2분기) 혼동 ③ 매각 후 잔여 보유주식 수 혼동",
    one_sentence: "Equity→FV 전환: 전환 전 = 순이익 지분 인식(배당 제외), 전환 후 = 배당만 인식; 소급 조정 없음.",
    speed: "① H1(Jan~Jun) Equity income: $50,000 × 2Q × 30% = $30,000\n② H1 배당(Mar 31): Equity Method → $0 (투자자산 감소)\n③ H2(Jul~Dec) Fair Value: 배당만 인식\n④ Sep 30 배당: 500주 × $1.50 = $750\n⑤ 합계: $30,000 + $750 = $30,750",
    context_background: "[Equity Method → Fair Value Method 전환 구조]\n\n전환 트리거: 지분 매각 등으로 significant influence 상실\n전환 방법: 소급 조정 없이 전환 시점부터 Fair Value Method 적용 (prospective)\n\n[기간별 회계처리]\n■ H1 (Jan 1 ~ Jun 30): Equity Method\n- 순이익 지분: $50,000 × Q1 + $50,000 × Q2 = $100,000 × 30% = $30,000 → Investment Income\n- Mar 31 배당($1/주): Dr. Cash / Cr. Investment → Income 아님\n\n■ H2 (Jul 1 ~ Dec 31): Fair Value Method\n- 순이익 지분 인식 없음\n- Sep 30 배당($1.50/주): 500주 × $1.50 = $750 → Dividend Income\n\n[Year 1 총 Income]\n$30,000 (Equity income) + $750 (Dividend income) = $30,750\n\n[왜 H1 배당은 Income이 아닌가]\nEquity Method에서 배당은 투자자산의 회수로 처리.\nDr. Cash / Cr. Investment in Salt\n→ P&L 영향 없음\n\n[왜 H2에서 순이익 지분을 인식 안 하는가]\nJul 1 이후 500주만 보유 → significant influence 상실 → Equity Method 적용 불가\nFair Value Method = 배당 수령 시만 Income 인식",
  },

  // [EQM_003] Liquidating Dividend — Fair Value Method vs Equity Method
  // RULE    : 누적 이익 초과 배당 = Liquidating Dividend → 두 방법 모두 투자계정 감소
  // TRIGGER : 'dividends in excess of earnings' → Liquidating Dividend / FV Method도 투자계정 감소
  // TRAP    : FV Method = 무조건 Income 오답 / Equity Method = No effect 오답
  {
    topic_id: "EQM_003",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'concept',
    card_name: "Liquidating Dividend — Fair Value Method vs Equity Method",
    rule: "Liquidating Dividend = 취득일 이후 누적 이익을 초과하는 배당. Fair Value Method: 일반 배당 → Dividend Income / 초과 배당(Liquidating) → 투자계정 감소(원가 회수). Equity Method: 배당은 항상 투자계정 감소.",
    trigger: "'dividends in excess of the investor's share of investee's earnings' → Liquidating Dividend 확인\n'subsequent to the date of the investment' → 취득일 이후 누적 이익 기준\nFair Value Method + 초과 배당 → 투자계정 감소 (Income 아님)",
    trap: "A 선택(FV = No effect) → 일반 배당 논리 적용 오류. 초과 배당은 FV Method에서도 투자계정 감소\nC 선택(Equity = No effect) → Equity Method에서 배당이 투자계정에 영향 없다고 혼동\nFV Method 배당 → 무조건 Income으로 처리하는 습관 주의",
    one_sentence: "Liquidating Dividend = 두 방법 모두 투자계정 감소; FV Method도 초과분은 원가 회수로 처리.",
    speed: "① 'dividends in excess of earnings' → Liquidating Dividend\n② FV Method: 초과분 → 투자계정 감소 (원가 회수)\n③ Equity Method: 배당 항상 → 투자계정 감소\n④ 둘 다 Decrease → 답: B",
    context_background: "[Liquidating Dividend란]\n투자 이후 investee가 벌어들인 누적 이익(RE)보다 더 많은 배당을 지급하는 것. 이익으로 번 돈이 아니라 투자 원금 자체가 돌아오는 구조.\n\n배당 = 누적 이익 범위 내 → 정상 배당 (이익의 분배)\n배당 > 누적 이익 → 초과분 = Liquidating Dividend (원금 회수)\n\n[방법별 처리 비교]\nFair Value Method:\n- 일반 배당: Dr. Cash / Cr. Dividend Income (P&L 인식)\n- Liquidating Dividend: Dr. Cash / Cr. Investment (투자계정 감소, 원가 회수)\n\nEquity Method:\n- 모든 배당: Dr. Cash / Cr. Investment (항상 투자계정 감소)\n- 이유: 이익 지분으로 이미 계정을 불렸으므로(Dr. Investment / Cr. Equity in Earnings), 현금 받으면 다시 줄이는 구조\n\n[핵심 직관]\n'번 돈보다 많이 받았다 → 원금이 나온 것 → 투자자산 줄어야 논리가 맞다'\nFair Value Method에서도 이 예외만큼은 Income이 아닌 투자계정 감소로 처리.",
  },

  // [EQM_004] Equity Method — Acquisition % (Goodwill 역산)
  // RULE    : % = (매입가 − Goodwill) ÷ 피투자회사 전체 FV of net assets
  // TRIGGER : 'goodwill is equal to $X' → 역산 필요 / 'book value' → 함정
  // TRAP    : 매입가 전체 분자(C) / Goodwill 분자(A) / BV 분자(D)
  {
    topic_id: "EQM_004",
    book_id: 'IA',
    chapter_id: 'IA_CH1',
    topic_group: 'IA_CH1_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity Method — Acquisition Percentage (Goodwill Back-calculation)",
    rule: "취득 % = FV of net assets acquired ÷ 피투자회사 전체 FV of net assets\nFV of net assets acquired = 매입가 − Goodwill\n→ BV of net assets는 분자에 절대 사용 안 함",
    trigger: "'goodwill is equal to $X' → 역산: FV acquired = 매입가 − goodwill\n'fair value of net assets' → 분모 확정\n'book value of net assets acquired' → 함정 숫자, 분자 아님",
    trap: "매입가 전체를 분자로 사용 → goodwill 차감 누락\nGoodwill을 분자로 사용 → goodwill은 초과지불액, 취득 자산 아님\nBook value를 분자로 사용 → FV와 BV 혼동 (문제에서 BV는 항상 함정)",
    one_sentence: "취득 % = (매입가 − Goodwill) ÷ 전체 FV; BV는 함정.",
    speed: "① FV acquired = 매입가 − goodwill\n② % = FV acquired ÷ 전체 FV of net assets\n'book value' 보이면 → 함정, 무시",
    example: "매입가 $780,000 − goodwill $156,000 = FV acquired $624,000 / $624,000 ÷ $2,080,000 = 30%",
  },

  // [EQM_004] Equity method — goodwill: acquisition-date SE reverse-engineering
  // RULE    : Goodwill = 취득가 − (취득일 FV of net assets × 지분율) / 취득일 SE 역산 필수
  // TRIGGER : "goodwill associated with purchase" → 취득일 SE 역산 → + FV excess → × 지분율
  // TRAP    : 연말 SE 그대로 사용(C) / 지분율 미적용(B) / FV excess 누락(D)
  {
    topic_id: "EQM_004",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity method — goodwill calculation: acquisition-date SE reverse-engineering",
    rule: "Goodwill = 취득가 − (취득일 FV of net assets × 지분율)\n\n4단계:\n① 취득일 SE 역산: 기말 SE − NI + Dividends(총액)\n② FV of net assets = 취득일 SE + FV excess\n③ 투자자 몫 FV = FV of net assets × 지분율\n④ Goodwill = 취득가 − ③\n\n[핵심] 취득일 기준 계산 / 연말 SE 직접 사용 금지",
    trigger: "'goodwill associated with purchase' → 취득일 기준 계산\n연말 SE + NI + dividends 주어짐 → 취득일 SE 역산 필수\n기말 RE = 기초 RE + NI − Dividends → 역산: 기초 = 기말 − NI + Dividends\n배당 총액 = RAK 수령액 ÷ 지분율",
    trap: "C($175,000): 연말 SE $820,000 × 25% = $205,000 → 연말 기준 오류. 취득일이어야 함\nB($170,000): 다른 잘못된 기준\nD($93,750): FV excess 누락 또는 잘못된 산식\n공통 함정: year-end SE를 그대로 goodwill 계산에 사용 → 취득일 SE로 역산 필수",
    one_sentence: "Equity method goodwill = 취득가 − (취득일 FV × 지분율); 연말 SE → 취득일 SE 역산 후 FV excess 가산.",
    speed: "⚠️ 실전 팁: 4단계 계산 → 시간 소요 큼 → 첫 패스 플래그, 나중에 풀 것\n① 취득일 SE: $820,000 − $60,000 + $40,000 = $800,000\n   ($40,000 = $10,000 ÷ 25%)\n② FV of net assets: $800,000 + $200,000 = $1,000,000\n③ 지분 몫: $1,000,000 × 25% = $250,000\n④ Goodwill: $375,000 − $250,000 = $125,000",
    context_background: "[왜 취득일 기준인가]\nGoodwill은 취득 시점에 지불한 프리미엄이다. 연말 SE는 당해 경영 성과(NI)와 배당이 반영된 값이라 취득 시점과 다르다. 취득일로 돌아가야 '내가 샀을 때 얼마 가치가 있었나'를 정확히 알 수 있다.\n\n[역산 논리 — RE 항등식 활용]\n기말 SE = 기초 SE + NI − Dividends\n→ 기초 SE = 기말 SE − NI + Dividends\n\n배당 총액 주의: 문제에서 주는 배당은 RAK(투자자) 수령액(25%분)이므로 전체로 환산 필요.\n$10,000 ÷ 25% = $40,000 (Oakfield 전체 배당)\n\n[Goodwill 구조]\n취득가 $375,000\n= 피투자사 순자산 FV 중 내 몫 $250,000\n+ Goodwill $125,000\n\n→ $125,000은 순자산 FV로 설명 안 되는 초과 프리미엄(브랜드·시너지·고객관계 등)\n→ 상각 없음, 매년 손상검토",
  },

  // [EQM_005] Equity Method – I/S Recognition vs Dividend Treatment
  // RULE    : Equity in Earnings = 순이익 × 지분율 → I/S / 배당 → 투자계정 차감만
  // TRIGGER : "earned $X" → I/S = X × 지분율 / "paid dividends" → 투자계정 차감
  // TRAP    : 배당을 I/S 수익으로 포함 / 순이익 전액 인식 / 배당+지분법이익 합산
  {
    topic_id: "EQM_005",
    category: "Equity Method",
    topic_name: "Equity Method – I/S Recognition vs Dividend Treatment",
    rule: "【Equity Method 적용 조건】\n지분율 20~50% + 유의적 영향력(significant influence)\n\n【I/S 인식 항목】\nEquity in Earnings = 피투자회사 순이익 × 지분율\n→ 투자자 I/S에 수익으로 인식\n→ 동시에 투자계정 증가\n\n【배당 처리】\n배당 수령 → I/S 수익 아님\n→ 투자계정 차감만\nDr. Cash (or Dividend Receivable)\nCr. Investment in Investee\n이유: 이미 순이익으로 인식한 금액의 회수 → 이중계산 방지\n\n【Investment Account 흐름】\n취득원가\n+ Equity in Earnings (순이익 × 지분율)\n− Dividends received (배당 × 지분율)\n= 기말 Investment Account",
    trigger: '"significant influence" + 20~50% → Equity Method\n"earned $X" → I/S = X × 지분율\n"paid dividends $Y" → 투자계정 차감 (I/S 아님)\n"Year N income statement" → 해당 연도 지분법이익만',
    trap: "배당을 I/S 수익으로 포함(배당은 투자계정 차감만).\n피투자회사 순이익 전액을 I/S에 인식(지분율 곱해야 함).\n배당과 지분법이익 합산.\n다른 연도 정보 혼입(Year 2 매각·배당을 Year 1 I/S에 포함).\n★ Fair Value vs Equity 비교: Fair Value는 배당 = Dividend Income(I/S), investment 무관 / Equity는 배당 = investment 감소. 둘 다 배당으로 investment account increase 없음.",
    example: "Cedar 30% 취득 $300,000\nYear 1: Grove 순이익 $120,000 / 배당 $75,000\n\nI/S: Equity in Earnings = $120,000 × 30% = $36,000 ✅\n배당: $75,000 × 30% = $22,500 → 투자계정 차감 (I/S ❌)\n\nInvestment Account:\n$300,000 + $36,000 − $22,500 = $313,500",
    journal_entry: "순이익 인식:\nDr. Investment in Grove $36,000\nCr. Equity in Earnings $36,000\n\n배당 수령:\nDr. Cash $22,500\nCr. Investment in Grove $22,500",
    key_formula: "Equity in Earnings = 피투자회사 순이익 × 지분율\nInvestment 기말 = 취득원가 + Equity in Earnings − Dividends received",
    speed: "지분법이익 = NI × 지분율 − 초과FV × 지분율 ÷ 내용연수\n\n① NI × 지분율 → Straw 실적 따라 변동\n② 초과FV 상각 → 취득 시 확정, 매년 고정\n\n이 문제: $150,000 × 40% − $100,000 × 40% ÷ 5 = $60,000 − $8,000 = $52,000",
  },

  // [EQM_011] Equity Method Income — Purchase Differential + Excess FV Amortization
  // RULE    : Equity income = NI × 지분율 − 초과분 상각 / differential = 취득가 − 순자산 지분가치
  // TRIGGER : "acquired X%" + "fair values exceeded carrying amounts" + "X-year life"
  // TRAP    : 초과분 상각 누락 / differential 배분 누락 / income 용어 혼동
  {
    topic_id: "EQM_011",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity method income — purchase differential and excess fair value amortization",
    rule: "Equity method income 공식:\nEquity income = 피투자회사 NI × 지분율 − 초과분 상각\n\nPurchase differential 계산:\nDifferential = 취득가 − (피투자회사 순자산 BV × 지분율)\n\nDifferential 배분 및 상각:\n① FV > BV인 자산에 배분: FV 초과분 × 지분율 = 배분액\n② 상각: 배분액 ÷ 자산 내용연수 = 연간 상각액\n③ 매년 equity income에서 차감\n\n용어 정리 (전부 같은 개념):\n'Income from this investment'\n'Equity method investment income'\n'Equity in earnings of investee'\n'Share of investee's net income'\n→ 전부 동일 공식 적용",
    trigger: "'acquired X%' + 'fair values exceeded carrying amounts by $Y' + 'Z-year life' → 초과분 상각 계산 모드 'income from this investment' / 'equity in earnings' → 동일 공식 differential = 취득가 − 순자산 지분가치 → 양수면 초과 지급, 자산에 배분 후 상각",
    trap: "초과분 상각 누락 → NI × 지분율만 계산하면 오답 Differential 배분 누락 → FV 초과분 전액이 아닌 지분율 × FV 초과분이 배분액 'income from investment' 용어 혼동 → equity method 맥락이면 전부 같은 공식 순자산 전체가 아닌 지분율 적용 누락",
    one_sentence: "Equity income = NI × 지분율 − (FV초과분 × 지분율 ÷ 내용연수) / differential = 내가 더 준 돈, 자산 소멸에 따라 비용화.",
    key_formula: "Equity income = (Investee NI × ownership%) − (FV excess × ownership% ÷ asset life)",
    example: "취득가 $400K / 순자산 BV $900K × 40% = $360K → Differential $40K 장비 FV 초과 $100K × 40% = $40K → 5년 상각 $8K/년 Equity income = $150K × 40% − $8K = $60K − $8K = $52K",
    speed: "① NI × 지분율 = 기본 equity income ② FV 초과분 × 지분율 ÷ 내용연수 = 연간 상각 ③ ① − ② = 최종 equity income",
    context_background: "[왜 초과분을 상각하는가]\nPuff가 Straw 지분을 살 때 장부가보다 더 줬다 = 장비의 진짜 가치를 반영한 것.\n지분 취득 = 지분을 통해 그 자산을 간접적으로 산 것 → Matching principle 적용.\n그 장비는 5년 후 사라진다 → 내가 더 준 $40,000도 5년에 걸쳐 소멸.\n매년 $8,000씩 투자수익에서 차감 → 자산이 수익에 기여하는 기간에 비용 대응.\n\n[Purchase differential 흐름]\n① Differential 발생: 취득가 > 순자산 지분가치\n② 원인 파악: FV > BV인 자산에 배분 (지분율 적용)\n③ 상각: 배분액 ÷ 자산 내용연수\n④ 매년 equity income에서 차감\n\n여러 자산에 배분될 경우: 각 자산별로 따로 상각.\n\n[용어 혼동 방지]\n시험에서 equity method income을 다양하게 표현:\n'income from this investment' = 'equity in earnings of investee'\n= 'equity method investment income' = 'share of investee NI'\n→ 전부 동일: NI × 지분율 − 초과분 상각",
  },

  // [EQM_010] Equity Method — FV Excess Amortization (Equipment): Equity in Earnings Calculation
  // RULE    : Equity in earnings = NI × 지분율 − FV초과분 × 지분율 ÷ 내용연수
  // TRIGGER : "fair values exceeded carrying amounts by $X" + "N-year life" → 연간 상각액 계산
  // TRAP    : FV 초과분 상각 누락 / 전액 Year 1 차감 / Land 착각
  {
    topic_id: "EQM_010",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity method FV excess — equipment amortization and equity in earnings",
    rule: "Equity in Earnings (조정 후) 공식:\n\nEquity in earnings = (Investee NI × 지분율) − FV 초과분 상각액\nFV 초과분 상각액 = FV 초과분 × 지분율 ÷ 내용연수\n\n자산별 내용연수:\n① Inventory (FIFO) → 1년 (당기 전액 소멸)\n② Equipment / Building → 잔여내용연수 (매년 조금씩)\n③ Land → ∞ (소멸 없음 → No effect)\n\n[취득 프리미엄 검증]\n취득가 − (Investee BV × 지분율) = FV 초과분 × 지분율\n→ 이 등식으로 문제 조건 검증 가능",
    trigger: '"fair values exceeded carrying amounts by $X" + "N-year life" → 연간 상각 = FV초과분 × 지분율 ÷ N\n"voting common stock" + 20~50% → equity method 확정\n"net income $X" → 출발점: NI × 지분율\n취득가 > BV×지분율 → 차액 = 어느 자산의 FV 초과분인지 확인',
    trap: "FV 초과분 상각 조정 누락 → NI×지분율만 계산 (가장 흔한 오답)\nFV 초과분 전액을 Year 1에 한 번에 차감 → 내용연수로 나눠야 함\nLand FV 초과분 → No effect (비상각 자산, 소멸 없음)\n지분율을 초과분에 곱하지 않고 전체 초과분으로 상각하는 실수",
    one_sentence: "Equity in earnings = Investee NI × 지분율 − FV초과분 × 지분율 ÷ 내용연수",
    speed: "① NI × 지분율 ② − FV초과분 × 지분율 ÷ 내용연수 ③ = Equity in earnings\n자산 종류 → 내용연수 결정 → 연간 차감액 결정",
    key_formula: "Equity in earnings = (Investee NI × 지분율) − (FV 초과분 × 지분율 ÷ 내용연수)\n\n자산별 내용연수:\nInventory → 1년 / Equipment → N년 / Land → ∞(No effect)",
    context_background: "[FV 초과분 조정의 경제적 실질]\n\n투자자가 피투자자 지분을 BV보다 비싸게 사면, 그 차액(프리미엄)은 특정 자산의 FV 초과분에서 온다. 이 프리미엄은 해당 자산이 소멸될 때 투자자 장부에서 비용으로 채워져야 한다.\n\n예시 (이번 문제):\nCedar 취득가 $270,000 / BV 기준 30% = $210,000\n→ 차액 $60,000 = Equipment 초과분 $120,000 × 30%\n→ Equipment 4년 상각 → 연간 $9,000씩 equity in earnings 차감\n\n[세 자산 비교]\nInventory: 팔리면 소멸 → Year 1 전액 차감\nEquipment: 감가상각으로 소멸 → 매년 ÷ 내용연수\nLand: 소멸 없음 → No effect\n\n[공통 원리]\n'내가 더 낸 프리미엄은 그 자산의 소멸 방식으로 채워진다'\n소멸 방식이 내용연수를 결정하고, 내용연수가 연간 차감액을 결정한다.",
    example: "Cedar 30% 취득, Equipment FV초과 $120,000, 4년 잔존:\n① $200,000 × 30% = $60,000\n② $120,000 × 30% ÷ 4 = $9,000\n③ Equity in earnings = $60,000 − $9,000 = $51,000",
  },

  // [EQM_007] Equity Method — FV Excess Allocation (Inventory vs Land)
  // RULE    : Inventory(FIFO) excess → Year 1 COGS 전액 반영 → Decrease / Land → 비상각 → No effect
  // TRIGGER : "fair values exceeded carrying amounts" + equity method → 자산 성격별 처리
  // TRAP    : Inventory excess = Increase 착각 / Land 감가상각 착각 / Tun 장부 조정 착각
  {
    topic_id: "EQM_007",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'conditional',
    card_name: "Equity Method FV Excess — Inventory (FIFO) vs Land: which decreases equity in earnings?",
    rule: "Equity method 취득 시 FV > BV 초과분 처리:\n\nInventory(FIFO): Year 1 기초재고 전부 판매 → excess 전액 COGS 추가 반영\n→ Equity in Earnings = (Tun NI − excess) × 지분율 → Decrease\n\nLand: 비상각 자산 → 처분 전까지 excess 비용화 불가 → No effect\n\n조정은 Park(투자자) 장부에서만 — 피투자자(Tun) 장부 불변.",
    trigger: '"FIFO inventory" + equity method FV excess → Year 1 소진 → COGS → Decrease\n"land" + equity method FV excess → 비상각 → No effect\n"fair values exceeded carrying amounts" → 자산 성격 파악 후 처리\n"equity in earnings" → FV excess 조정 후 순액',
    trap: "Inventory FV > BV → 자산 가치 상승 = Increase 착각 → 더 높은 COGS → Decrease.\nLand excess → 감가상각 Decrease 착각 → 비상각, No effect.\nFV excess를 Tun 장부에서 조정 → Park 장부에서만 내부 조정.\nexcess 전액 차감 → 지분율 곱해야 함.",
    one_sentence: "FIFO inventory excess → COGS 추가 → Decrease | Land excess → 비상각 → No effect | 조정은 투자자 장부에서만.",
    speed: "FIFO inventory → Year 1 소진 → COGS 추가 → Decrease | Land → 비상각 → No effect → D",
    example: "Grove NI $150,000, Cedar 지분율 30%\nInventory excess $20,000 / Land excess $50,000\n\nInventory:\nCedar Equity in Earnings = ($150,000 − $20,000) × 30% = $39,000\n조정: $45,000 − $6,000 = $39,000 (Decrease)\n\nLand:\nCedar Equity in Earnings = $150,000 × 30% = $45,000 (No effect)",
    journal_entry: "Inventory excess 조정:\nDr. Equity in Earnings $6,000\nCr. Investment in Grove $6,000\n\nLand excess: 분개 없음",
    key_formula: "Equity in Earnings = (피투자자 NI − FV excess 소진분) × 지분율\nFV excess 조정 = excess × 지분율",
    context_background: "[핵심 철학]\n투자자(Park)가 피투자자(Tun)를 FV로 샀으니, Tun 이익을 Park 장부에 옮길 때는 FV 기준으로 재계산. Tun 장부는 BV 기준 그대로 — Park 장부에서만 내부 조정.\n\n예시:\nTun COGS(BV기준) $100,000 → 순이익 $100,000\nPark 관점 COGS(FV기준) $120,000 → 순이익 $80,000\n→ Park은 $80,000 기준으로 지분법이익 계산\n\n[자산 성격별 처리]\nInventory(FIFO): Year 1 기초재고 전부 판매 → excess 전액 COGS\n건물/설비: 내용연수 기간 상각 → 매년 조정\n특허: 잔여 내용연수 상각 → 매년 조정\n토지: 비상각 → 처분 시에만 반영\n\n[Consolidation과의 연결 — 확장 개념]\nEquity method(20~50%): FV excess × 지분율만큼 조정 (반조각)\nConsolidation(50%+): FV excess 전액 제거 → 잔액 = Goodwill\n지분율 100% → Equity method 조정이 그대로 Consolidation elimination으로 확장\n\n[Intercompany transactions와의 유사성]\nIntercompany: 내부거래 이익 전액 제거 → 우리끼리 거래는 이익 아님\nEquity method FV excess: 지분율만큼 차감 → 내가 비싸게 산 만큼 조정\n→ 둘 다 철학 동일: 외부에서 실제로 벌어들인 이익만 인식\n→ 지분율만 다를 뿐 연속선상의 개념",
  },

  // [EQM_006] Equity Method vs Fair Value — Common vs Preferred Stock Separate Treatment
  // RULE    : 주식 종류별 control 판단 분리 / 보통주(영향력)→equity method, 배당=투자계정차감 / 우선주(nonvoting)→fair value, 배당=revenue
  // TRIGGER : "owns X% common + Y% preferred" → 분리처리 / "nonvoting preferred" → fair value / "dividend revenue?" → equity method 배당 제외
  // TRAP    : 보통주 배당을 revenue로(A) / 보통주+우선주 합산(D) / 우선주까지 equity method로 묶음(C)
  {
    topic_id: "EQM_006",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'conditional',
    card_name: "Equity Method vs Fair Value — Common vs Preferred Stock Separate Treatment",
    rule: "같은 피투자회사의 보통주·우선주를 함께 보유할 때 주식 종류별로 control(유의적 영향력) 유무를 따로 판단한다. 보통주 + significant influence(의결권) → equity method → 받은 배당은 dividend revenue 아님, 투자계정 차감(이미 순이익 지분으로 인식 → 이중계산 방지). 우선주 nonvoting → 지분율 100%여도 영향력 없음 → fair value method → 배당 전액 dividend revenue. 영향력은 지분율 크기가 아니라 의결권(주식 성격)에서 나온다.",
    trigger: "owns X% common + Y% preferred | noncumulative nonvoting preferred | significant influence | dividend revenue | common stock dividend | preferred stock dividend\n'한 회사가 보통주+우선주 동시 보유' → 주식별 분리 처리 신호\n'significant influence' + 보통주 → equity method → 보통주 배당은 revenue 아님(투자계정 차감)\n'nonvoting preferred' → 영향력 없음 → fair value → 우선주 배당 = dividend revenue 전액\n질문이 'dividend revenue' → equity method 배당 제외, fair value 배당만 답",
    trap: "A: 보통주 배당 × 지분율을 dividend revenue로 착각 → equity method 배당은 revenue 아님(투자계정 차감)\nD: 보통주분 + 우선주분 합산 → 보통주분은 제외해야 함\nC($0): 우선주까지 equity method로 묶어 '배당 다 revenue 아님' 처리 → 우선주는 nonvoting이라 fair value → 배당이 revenue\n공통 함정: 우선주의 nonvoting(영향력 없음)을 놓치고 두 주식을 같은 방법으로 처리. 100% 지분이라 더 통제한다고 착각하는 것이 핵심 트랩",
    one_sentence: "보통주(영향력)는 equity method라 배당=투자계정 차감 / 우선주(nonvoting)는 fair value라 배당=dividend revenue. control은 지분율이 아니라 의결권에서 나온다.",
    example: "Green 보통주 30%(significant influence) + 우선주 100%(nonvoting) 보유\n보통주 배당 $100,000 × 30% = $30,000 → equity method → 투자계정 차감(revenue 아님)\n우선주 배당 $60,000 전액 → fair value → dividend revenue\n→ I/S dividend revenue = $60,000",
    journal_entry: "보통주 배당 수령(equity method):\nDr. Cash $30,000\nCr. Investment in Common Stock $30,000\n\n우선주 배당 수령(fair value):\nDr. Cash $60,000\nCr. Dividend Revenue $60,000",
    key_formula: "Dividend Revenue = 우선주(fair value 보유분) 배당 전액\n보통주(equity method) 배당 = 투자계정 차감 (revenue 제외)",
    speed: "보통주 + significant influence → equity method → 배당 revenue 아님(0) | 우선주 nonvoting → fair value → 배당 전액 revenue → dividend revenue = 우선주 배당 $70,000 → 정답 B",
    context_background: "[한 회사 주식을 종류별로 다르게 회계처리하는 이유]\n같은 피투자회사 주식이라도 보통주와 우선주는 성격이 다르므로 회계처리도 분리한다. 분기점은 지분율 크기가 아니라 'control(유의적 영향력)을 줄 수 있는 주식이냐'이다. 그리고 그 영향력은 의결권(voting)에서 나온다.\n\n[보통주 — equity method]\n보통주는 의결권이 있어 20~50% + 유의적 영향력 시 equity method를 적용한다. equity method에서는 피투자사 순이익 × 지분율을 이미 Equity in Earnings로 수익 인식했기 때문에, 이후 받는 배당은 '이미 잡은 이익의 현금 회수'일 뿐이다. 따라서 배당은 dividend revenue가 아니라 투자계정(Investment) 차감으로 처리한다(이중계산 방지).\n\n[우선주 — fair value method]\n우선주는 nonvoting이면 지분율이 100%여도 경영에 영향력을 행사할 수 없다. 따라서 equity method 자격이 없고 fair value method로 처리한다. fair value 보유 증권의 배당은 그대로 dividend revenue로 I/S에 인식한다.\n\n[흔한 함정]\n'우선주를 100% 가졌으니 더 강하게 통제하는 것 아닌가'라고 생각하면 틀린다. 비율이 아니라 의결권 유무가 핵심이다. nonvoting preferred는 비율과 무관하게 fair value로 떨어진다.\n\n[정답 도출]\n보통주 배당: equity method → revenue 아님 → $0\n우선주 배당: fair value → revenue → $70,000\nDividend revenue = $70,000",
  },

  // [EQM_008] Equity Method — Stock Dividend Received (Memorandum Entry)
  // RULE    : Stock dividend → memorandum entry / 총 투자금액 불변 / 주당 단가 감소
  // TRIGGER : "equity method" + "stock dividend received" → memorandum, 수익 없음
  // TRAP    : 수익 인식(A/B) / 총 투자금액 감소(C) / 현금 배당과 혼동
  {
    topic_id: "EQM_008",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'concept',
    card_name: "Equity method stock dividend — memorandum entry, unit cost decreases",
    rule: "Equity method + 피투자회사 주식 배당 수령:\n→ Memorandum entry only\n→ 총 투자금액 불변\n→ 주당 단가 감소 (총액 ÷ 늘어난 주식수)\n→ 수익 인식 없음\n\n현금 배당: Dr. Cash / Cr. Investment (총액 감소)\n주식 배당: Memorandum only (총액 불변)",
    trigger: '"equity method" + "stock dividend received" → memorandum, 총액 불변\n"cash dividend" → investment 감소 (다른 처리)\n"stock dividend" at market/carrying → 수익 아님',
    trap: "주식 배당을 dividend revenue로 인식 → 현금 자산 이전 없음, 수익 아님.\nTotal cost 감소(C) → 총액 불변, 주당 단가만 감소.\n현금 배당(investment 감소)과 혼동.",
    one_sentence: "Equity method + stock dividend → memorandum, 총액 불변, 주당 단가↓ | 수익 없음",
    speed: "Stock dividend → memorandum entry | 총액 불변 | 주당 단가↓ | 수익 없음 → D",
    context_background: "[Stock dividend 경제적 실질]\n같은 파이를 더 많은 조각으로 나눔\n총 자본 불변, 주식수 증가, 주당 가치 감소\n자산 회수 없음 → 수익 인식 없음\n\n[현금 배당 vs 주식 배당 비교]\n현금 배당: 자산 이전 → investment 감소 (return of investment)\n주식 배당: 자산 이전 없음 → memorandum only\n\n[Stock dividend vs Stock split vs 무상증자]\nStock split: 주식수↑, 액면가↓, RE 변동 없음\nStock dividend(small): RE → CS + APIC 대체\nStock dividend(large): 사실상 stock split과 동일\n무상증자(한국): RE/자본잉여금 → CS, stock dividend와 동일 경제적 실질\n→ 투자자(equity method) 입장: 셋 다 memorandum entry, 총액 불변",
  },

  // [EQM_009] Equity Method — Goodwill Calculation at Acquisition
  // RULE    : Goodwill = 취득가 − FV 순자산 × 지분율
  //           또는 3단계: Total excess → FV excess 배분 → Goodwill
  // TRIGGER : "purchased X%" + "stockholders equity" + "fair value identifiable net assets"
  // TRAP    : Total excess 전체를 Goodwill($50K) / FV excess를 Goodwill($30K) / Goodwill $0
  {
    topic_id: "EQM_009",
    book_id: 'AA',
    chapter_id: 'AA_CH5',
    topic_group: 'AA_CH5_EQM',
    sub_category_id: "U5_EQUITY_METHOD",
    card_type: 'calculation',
    card_name: "Equity method goodwill — 3-step: total excess → FV excess → goodwill",
    rule: "Goodwill 계산 3단계:\n① Total excess = 취득가 − NBV × 지분율\n② FV excess 배분 = (FV − NBV) × 지분율\n③ Goodwill = ① − ②\n\n단축 공식: Goodwill = 취득가 − FV 순자산 × 지분율\n\nEquity method: Goodwill → Investment account 안에 포함 (별도 계정 인식 없음)\nConsolidation과 달리 피인수회사 장부 직접 변경 없음",
    trigger: '"purchased X%" + "stockholders equity $Z" + "fair value identifiable net assets $W"\n→ Goodwill = 취득가 − FV × 지분율\n→ 또는 3단계 계산',
    trap: "D($50K): Total excess 전체를 Goodwill → FV excess 배분 누락.\nC($30K): FV excess를 Goodwill로 처리 → FV excess는 식별 자산 배분분.\nB($0): Goodwill 없다고 착각.\nConsolidation처럼 FV 전액 직접 차감 → Equity method는 지분율 곱해야 함.",
    one_sentence: "Goodwill = 취득가 − FV 순자산 × 지분율 | Investment account 안에 포함",
    speed: "$200K − $600K × 30% = $20K | 또는 Total $50K − FV excess $30K = $20K",
    example: "취득가 $200,000 / 지분율 30% / NBV $500,000 / FV $600,000\n①Total excess: $200K − $500K×30% = $50,000\n②FV excess 배분: ($600K−$500K)×30% = $30,000\n③Goodwill: $50K − $30K = $20,000\n\n단축: $200K − $600K×30% = $20,000",
    key_formula: "Goodwill = 취득가 − FV 순자산 × 지분율\nTotal excess = 취득가 − NBV × 지분율\nFV excess 배분 = (FV − NBV) × 지분율",
    context_background: "[Equity method vs Consolidation Goodwill 비교]\nConsolidation(100%):\n- 피인수회사 자산 전체를 FV로 재평가\n- 취득가 − FV 순자산 전액 = Goodwill\n- FV excess → 자산별 배분 → 매년 상각\n- Goodwill → 별도 계정 인식\n\nEquity method(30%):\n- 피인수회사 장부 그대로 유지\n- Goodwill → Investment account 안에 포함\n- FV excess → Investment account에서 내부 조정\n- 별도 Goodwill 계정 없음\n\n[경제적 실질]\n둘 다 'FV로 샀으니 FV 기준으로 Goodwill 계산' 철학은 동일\n차이는 지분율(100% vs 30%)과 처리 방식(연결 재무제표 vs Investment account)",
  },

  // [BOND_002] Bond Extinguishment — Loss on Early Redemption
  // RULE    : Loss = Reacquisition Price − Net CV / Net CV = Face − Unamortized Discount − Unamortized Issuance Cost
  // TRIGGER : 'called/retired at X' → Reacquisition Price = Face × X% / 조기상환 → 미상각 잔액 2개 모두 차감
  // TRAP    : Discount만 차감($50K) / Issuance Cost만 차감($90K) / 콜 프리미엄만($30K)
  {
    topic_id: "BOND_002",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_BOND',
    sub_category_id: "U4_BONDS",
    card_type: 'calculation',
    card_name: "Bond Extinguishment — Loss on Early Redemption",
    rule: "Loss on Extinguishment = Reacquisition Price − Net Carrying Value. Net CV = Face − Unamortized Discount − Unamortized Issuance Cost. 조기 상환 시 두 항목 미상각 잔액을 각각 따로 차감.",
    trigger: "'called at [X]' / 'retired at [X]' → Reacquisition Price = Face × X%\n'Ten years after the issue date' → 상각 비율 1/3 경과, 2/3 미상각 잔존\n'loss on extinguishment' → Reacquisition Price − Net Carrying Value\nDiscount + Issuance Cost 둘 다 언급 → Net Carrying Value에서 반드시 둘 다 따로 차감",
    trap: "$50,000 (A) → Unamortized Issuance Cost($60,000) 누락. Discount만 반영한 오류\n$90,000 (B) → Unamortized Discount($20,000) 누락. Issuance Cost만 반영한 오류\n$30,000 (D) → 두 항목 모두 누락. 콜 프리미엄($30,000)만 계산한 오류\n공통 함정: Discount와 Issuance Cost 중 하나를 빠뜨리는 것. 조기 상환 시 두 항목 모두 미상각 잔액을 Net Carrying Value에서 반드시 각각 따로 차감해야 함",
    one_sentence: "조기 상환 손실 = 콜 가격 − (액면가 − 미상각 할인액 − 미상각 발행비용); 두 항목 모두 차감 필수.",
    speed: "① Reacquisition Price: $1,500,000 × 102% = $1,530,000\n\n② Net Carrying Value ($1,500,000이 모든 계산의 anchor)\n- Discount 잔액: $1,500,000 × 2% × 2/3 = $20,000\n- Issuance Cost 잔액: $90,000 × 2/3 = $60,000\n- Net CV = $1,500,000 − $20,000 − $60,000 = $1,420,000\n\n③ Loss = $1,530,000 − $1,420,000 = $110,000",
    context_background: "[Bond Extinguishment(채무 조기 상환)이란]\n회사가 만기 전에 사채를 콜(call)하여 조기 상환하는 것. 발행 시 할인 발행하거나 발행비용이 있으면 이를 만기까지 상각하는데, 조기 상환 시 아직 상각되지 않은 잔액을 한꺼번에 정리해야 한다. 이때 콜 가격이 장부가치보다 높으면 손실, 낮으면 이익이 발생한다.\n\n실무에서는 금리가 하락했을 때 기존 고금리 채권을 콜하고 저금리로 재발행하는 리파이낸싱(refinancing) 상황에서 자주 발생한다. 이 경우 발행사는 콜 프리미엄을 지불하더라도 장기적으로 이자비용을 절감할 수 있다.\n\n[손익 계산 구조]\nLoss on Extinguishment = Reacquisition Price − Net Carrying Value\n\n[Net Carrying Value 구성]\n모든 계산의 출발점은 Face Value $1,500,000이다. 여기서 미상각 잔액 두 개를 각각 따로 차감한다:\n- Unamortized Discount: 차감 (아직 비용으로 안 털린 할인액)\n- Unamortized Issuance Cost: 차감 (아직 상각 안 된 발행비용)\n- Unamortized Premium: 가산 (아직 수익으로 안 털린 할증액)\n\n[왜 미상각 항목이 남아있는가]\n30년 만기 채권을 10년 만에 조기 상환했으므로, 전체 상각 기간의 1/3만 지났고 2/3가 아직 남아있다:\n- Discount 잔액: $1,500,000 × 2% = $30,000 → 그 중 2/3 미상각 → $20,000\n- Issuance Cost 잔액: $90,000 → 그 중 2/3 미상각 → $60,000\n\nNet Carrying Value:\nFace Value: $1,500,000\nLess Unamortized Discount: ($20,000)\nLess Unamortized Issuance Cost: ($60,000)\nNet Carrying Value: $1,420,000\n\nReacquisition Price = $1,500,000 × 102% = $1,530,000\nLoss = $1,530,000 − $1,420,000 = $110,000",
  },

  // ── INV ────────────────────────────────────────────────────────────────────
  // [INV_001] Inventory — FIFO to LIFO Change in Rising Prices
  // RULE    : 물가 상승기 FIFO→LIFO = COGS↑ → Net Income↓ / Ending Inventory↓
  // TRIGGER : 'rising prices' + 'FIFO to LIFO' → 둘 다 Decrease
  // TRAP    : Ending Inventory 증가 착각(A,C) / Net Income 증가 착각(D) / 물가 방향 무시
  {
    topic_id: "INV_001",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'conditional',
    card_name: "Inventory — FIFO to LIFO Change in Rising Prices",
    rule: "물가 상승기 FIFO→LIFO 전환: 최근 비싼 원가 → COGS로 배분 → COGS↑, Net Income↓. 오래된 싼 원가 → 재고에 잔류 → Ending Inventory↓. 물가 하락기는 방향 완전히 반대.",
    trigger: "'rising prices' + 'FIFO to LIFO' → Ending Inventory 감소, Net Income 감소\n'declining prices' + 'FIFO to LIFO' → Ending Inventory 증가, Net Income 증가\n물가 방향이 바뀌면 모든 부호가 반대",
    trap: "A (Increase / Decrease) → Ending Inventory는 LIFO 전환 시 감소. 최근 비싼 원가가 COGS로 가고 오래된 싼 원가만 재고에 남음\nC (Increase / Increase) → 둘 다 틀림. LIFO 전환은 COGS 증가 → Net Income 감소\nD (Decrease / Increase) → Ending Inventory 방향은 맞지만 Net Income은 반대. COGS가 높아지면 Net Income은 내려감\n공통 함정: 'rising prices' 조건을 놓치는 것. 물가 하락기면 방향이 완전히 반대",
    one_sentence: "Rising prices + FIFO→LIFO = Ending Inventory↓ + Net Income↓; 물가 하락기면 방향 완전히 반대.",
    speed: "물가 상승기 FIFO → LIFO 전환:\n최근 비싼 원가 → COGS ↑ → Net Income ↓\n오래된 싼 원가 → Ending Inventory ↓\n답: Decrease / Decrease",
    context_background: "[왜 FIFO vs LIFO가 중요한가]\n재고 원가 흐름 가정(cost flow assumption)은 실제 물건의 이동과 무관하게 원가를 어떻게 배분하느냐의 문제다. 물가 상승기에 이 선택은 재무제표에 큰 영향을 미친다.\n\n[물가 상승기 FIFO vs LIFO 비교]\n- COGS에 배분되는 원가: FIFO=오래된(싼) 원가 / LIFO=최근(비싼) 원가\n- Ending Inventory: FIFO=최근(비싼) 원가→높음 / LIFO=오래된(싼) 원가→낮음\n- COGS: FIFO=낮음 / LIFO=높음\n- Net Income: FIFO=높음 / LIFO=낮음\n- 세금 부담: FIFO=높음 / LIFO=낮음(절세 효과)\n\n[실무에서 LIFO로 바꾸는 이유]\n물가 상승기에 LIFO를 선택하면 COGS가 높아져 과세소득이 줄어들고 세금을 절감할 수 있다. US GAAP에서는 상장기업 포함 모두 LIFO 사용이 허용되며, 실제로 ExxonMobil, Walmart 같은 대형 상장기업도 인플레이션 시기 절세 목적으로 LIFO를 유지해왔다. 단, LIFO를 사용하는 기업은 LIFO Reserve(FIFO 기준 재고와의 차이)를 공시해야 하며, 이를 통해 재무제표 이용자가 FIFO 기준으로 재환산할 수 있다.\n\n[FIFO → LIFO 전환 시 변화]\n- Ending Inventory: FIFO(비싼 재고) → LIFO(싼 재고) → 감소\n- COGS: 싼 원가 → 비싼 원가 → 증가 → Net Income 감소\n\n[물가 하락기라면 방향이 완전히 반대]\n- Ending Inventory: 감소 → 증가\n- COGS: 증가 → 감소\n- Net Income: 감소 → 증가",
  },

  // [INV_005] LIFO Perpetual vs Periodic — COGS Calculation
  // RULE    : Perpetual = 판매 시점 재고 스냅샷 기준 / Periodic = 기간 전체 매입 합산 후 기말 LIFO
  // TRIGGER : 'LIFO' + 'perpetual' → 판매일별 독립 계산 / $910 = Periodic 오답
  // TRAP    : Mar 30 매입분 COGS 포함(Periodic 혼동) / Mar 27 판매 시 $55 층 재사용(이미 소진)
  {
    topic_id: "INV_005",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "LIFO Perpetual vs Periodic — COGS Calculation",
    rule: "LIFO Perpetual: 판매가 발생하는 그 시점의 재고 구성 기준으로 COGS 확정. 판매 이후 매입분은 해당 판매의 COGS에 절대 포함 안 됨. LIFO Periodic: 기간 전체 매입을 합산한 뒤 기말에 한꺼번에 LIFO 적용 → 미래 매입분까지 COGS에 반영됨.",
    trigger: "'LIFO' + 'perpetual' → 판매 시점별 재고 스냅샷 기준으로 층별 독립 계산\n날짜가 있는 거래 표 + 'perpetual' → 판매일 기준 그 시점 재고만 보기\n오답 $910 = LIFO Periodic → 물가 상승 시 Perpetual < Periodic 검증 포인트",
    trap: "TRAP 1: $910 (A) → LIFO Periodic 결과. Mar 30 매입($65) 판매 이후임에도 전체 풀에 포함. Perpetual에서는 판매 이후 매입은 해당 판매 COGS에 절대 불포함\nTRAP 2: Mar 27 판매 시 Mar 4 매입분($55) 재사용 오류. Mar 12 판매로 $55 재고 전량 소진됨 — 판매 시점 재고 스냅샷 별도 추적 필수\nTRAP 3: 각 판매일 층 순서 혼동. 판매마다 독립적으로 그 시점 재고를 재구성해야 함",
    one_sentence: "LIFO Perpetual = 판매 시점 재고만 보고 COGS 확정; 판매 후 매입분은 그 판매의 COGS에 포함 불가.",
    example: "Mar 12 판매: BI $50(10) + Mar4 $55(6) → LIFO: 6×$55+2×$50 = $430\nMar 27 판매: BI $50(8) + Mar20 $60(9) → LIFO: 7×$60 = $420\nTotal COGS = $850",
    context_background: "재고 원가 계산에서 Perpetual(계속기록법)과 Periodic(실지재고조사법)의 결과가 달라지는 이유는 '언제 LIFO를 적용하느냐'에 있다. Perpetual은 판매가 발생하는 그 시점의 재고 구성을 기준으로 COGS를 확정한다 — 즉 그 순간까지 들어온 물건 중 가장 나중에 매입한 것부터 판다. 반면 Periodic은 기간 전체의 매입을 합산한 뒤 기말에 한꺼번에 LIFO를 적용하므로, 아직 일어나지 않은 미래 매입까지 COGS에 반영된다. 실무에서 Perpetual은 POS 시스템·바코드 스캔으로 판매 즉시 재고를 차감하는 대형 유통사(Walmart, Home Depot 등)가 채택한다. 이 차이를 시험에서는 같은 데이터로 두 방법을 비교하는 형태로 출제한다.",
    context_trigger: "'LIFO' + 'perpetual inventory system' → 판매 시점별 독립 계산 / 오답 $910 = Periodic 혼동 검증",
    rule_title: "LIFO Perpetual COGS 계산 순서",
    rule_items: [
      "판매 시점마다 그 시점까지의 재고 구성을 별도로 파악",
      "각 판매에서 가장 최근 매입층부터 COGS 배분 (LIFO 순서)",
      "판매 이후 발생한 매입분은 해당 판매의 COGS에 포함 불가",
      "각 판매별 COGS 합산 = Total COGS",
      "LIFO Periodic: 기간 전체 매입 합산 → 기말 일괄 LIFO → 물가 상승 시 Perpetual보다 높게 나옴",
    ],
    speed: "① 'LIFO + perpetual' 확인 → 판매 시점별 독립 계산\n② Mar 12 판매: 직전 재고 = BI $50(10) + Mar4 $55(6) → LIFO: 6×$55 + 2×$50 = $430\n③ Mar 27 판매: 직전 재고 = BI $50(8) + Mar20 $60(9) → LIFO: 7×$60 = $420\n④ Total COGS = $430 + $420 = $850 → B\n⑤ $910 보이면 Periodic 오답 — Perpetual은 물가 상승 시 항상 이보다 낮음",
  },
  // [INV_006] LCNRV — NRV Calculation for FIFO Inventory
  // RULE    : FIFO → NRV = SP − processing costs / LIFO → RC 기준 LCM (Ceiling·Floor)
  // TRIGGER : "FIFO" + "lower of cost and NRV" → NRV = SP − processing costs
  // TRAP    : Cost 그대로($70K) / SP+costs($83K) / SP만($75K) / RC·profit margin 포함
  {
    topic_id: "INV_006",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "LCNRV — NRV Calculation for FIFO Inventory",
    rule: "FIFO/Average cost → LCNRV: NRV = SP − Further processing costs. Cost vs NRV 비교 → 낮은 쪽 보고. LIFO/Average cost → LCM: Market = RC (단 Ceiling=NRV / Floor=NRV−Normal profit 범위 내). RC·Normal profit margin → FIFO LCNRV에서 함정 데이터.",
    trigger: '"FIFO" + "lower of cost and net realizable value" → NRV = SP − further processing costs\nReplacement cost 제시 → FIFO이므로 무시 (LIFO였으면 사용)\nNormal profit margin 제시 → FIFO LCNRV에서 무시 (LIFO LCM floor 계산용)',
    trap: "TRAP 1: $70,000 (A) → Cost 그대로 보고. NRV < Cost이므로 write-down 필요\nTRAP 2: $83,000 (B) → SP + processing costs로 잘못 계산. NRV는 SP 빼기 processing costs\nTRAP 3: $75,000 (C) → SP를 NRV로 사용. Further processing costs $8,000 차감 누락\n공통 함정: RC($65,000)·profit margin(30%) 계산 포함 → LIFO였으면 쓸 숫자를 FIFO 문제에 넣은 함정",
    one_sentence: "FIFO LCNRV: NRV = SP − processing costs; RC·profit margin은 LIFO용 함정 데이터.",
    example: "Cost $70,000 / SP $75,000 / processing $8,000 → NRV $67,000 / LCNRV = MIN($70K, $67K) = $67,000",
    context_background: "재고 자산은 원가(cost)보다 실제로 받을 수 있는 금액이 낮아지면 낮은 쪽으로 write-down해야 한다. 단, 어떤 재고 방법을 쓰느냐에 따라 비교 대상 자체가 달라진다.\n\n[FIFO / Average cost → LCNRV 적용]\n- NRV = Selling Price − Further processing costs\n- 비교: Cost vs NRV → 낮은 쪽 보고\n- Replacement cost / Normal profit margin → 무관, 함정 데이터\n\n[LIFO / Average cost → LCM 적용 (구 GAAP)]\n- Market = Replacement Cost (단, Ceiling·Floor 범위 내)\n- Ceiling = NRV / Floor = NRV − Normal profit margin\n- Market이 Ceiling 초과 → Ceiling 사용 / Floor 미만 → Floor 사용\n- 비교: Cost vs Market → 낮은 쪽 보고\n\n이 문제는 FIFO이므로 NRV = $75,000 − $8,000 = $67,000만 비교하면 끝. $65,000(RC)과 30%(profit margin)은 LIFO였으면 쓸 숫자를 집어넣은 함정이다.",
    context_trigger: '"FIFO" + "lower of cost and NRV" + replacement cost + normal profit margin 동시 제시 → RC·margin 둘 다 LIFO용 함정',
    rule_title: "재고 방법별 valuation 비교 기준",
    rule_items: [
      "FIFO/Average cost → LCNRV: NRV = SP − Further processing costs",
      "LIFO/Average cost → LCM: Market = RC (Ceiling·Floor 범위 내)",
      "LIFO LCM Ceiling = NRV / Floor = NRV − Normal profit margin",
      "Replacement cost → FIFO 문제에서 함정 데이터, LIFO에서만 사용",
      "Normal profit margin → FIFO 문제에서 함정 데이터, LIFO floor 계산에서만 사용",
    ],
    speed: "① FIFO + LCNRV 확인 → NRV = SP − processing costs\n② NRV = $75,000 − $8,000 = $67,000\n③ LCNRV = MIN($70,000, $67,000) = $67,000 → D\n④ RC $65,000·profit margin 30% → 즉시 무시 (LIFO용 함정)",
  },
  // [INV_007] Inventory — Gross Profit Method + Insurance Loss Calculation
  // RULE    : COGS = Sales×(1−GP%) → Lost inv = GAFS−COGS → Net Loss = Lost−Salvage−Insurance
  // TRIGGER : 'explosion/fire' + GP% → GP Method / 'reimburse X%' → 보험 차감
  // TRAP    : 보험수령액=loss(B) / gross loss(C) / salvage 가산(D)
  {
    topic_id: "INV_007",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Inventory — Gross Profit Method + Insurance Loss Calculation",
    rule: "재고 소실 시 3단계: ① COGS = Sales × (1−GP%) ② Lost inventory = GAFS − COGS ③ Net Loss = Lost inventory − Salvage − Insurance reimbursement. 보험 수령액은 손실 상쇄 항목.",
    trigger: "'explosion/fire destroyed inventory' + GP% 제시 → Gross Profit Method\n'insurance will reimburse X%' → Net loss before insurance × X% = 보험 수령액\n'can sell damaged inventory for $X' → Salvage → 차감",
    trap: "$35,000(B): 보험 수령액을 loss로 착각\n$50,000(C): 보험 차감 전 gross loss 그대로 사용\n$18,000(D): Salvage를 가산 후 30% 적용 → Salvage는 차감 항목\n공통 함정: 보험 수령액 = loss가 아님 / Salvage = 손실 감소 항목",
    one_sentence: "Lost inventory(GP Method) − Salvage − Insurance = Net Loss; 보험은 차감이지 loss가 아님.",
    speed: "COGS = $620,000×75% = $465,000\nLost = $520,000−$465,000 = $55,000\nNet = $55,000−$5,000−$35,000 = $15,000",
    context_background: "[Gross Profit Method — 재고 소실 시 적용]\n실사가 불가능한 경우 역산법으로 소실 재고 원가를 추정한다.\n\n[3단계 계산]\n① COGS 추정\nGP% = Gross Profit ÷ Sales\nCOGS% = 1 − GP% = 75%\nCOGS = $620,000 × 75% = $465,000\n\n② 소실 재고 원가\nGAFS = BI + Purchases = $40,000 + $480,000 = $520,000\nLost inventory = GAFS − COGS = $520,000 − $465,000 = $55,000\n\n③ Net Loss 계산\nLost inventory:          $55,000\n− Salvage (damaged):      (5,000)  ← 손실 감소\nNet loss before ins:     $50,000\n− Insurance (70%):       (35,000)  ← 손실 상쇄\nNet loss reported:       $15,000\n\n[보험 수령액 처리]\n보험금은 손실을 줄여주는 것이지 손실 자체가 아니다. Salvage도 마찬가지로 회수 가능한 금액이므로 차감.",
  },

  // [INV_008] Dollar-Value LIFO — Layer Calculation with Price Index
  // RULE    : Base layer = 채택 시점 가격 고정 / 증가분만 price index 적용 / market > cost → LCM 불필요
  // TRIGGER : 'dollar-value LIFO' → layer 분리 / 'base-year prices' → 증가분에만 index 곱함
  // TRAP    : 전체에 index 적용(A,C) / index 미적용(D) / market > cost → market으로 올리는 혼동
  {
    topic_id: "INV_008",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Dollar-Value LIFO — Layer Calculation with Price Index",
    rule: "Dollar-Value LIFO 계산 2단계:\n① Base layer: 채택 시점 가격 × 1.00 (고정, index 미적용)\n② New layer(증가분): base-year 증가분 × 해당 연도 price index\n③ 합계 = Base layer + New layer\n④ market > cost → LCM 조정 불필요, cost 그대로 보고",
    trigger: "'dollar-value LIFO' → base layer + new layer 분리\n'increased $X using base-year prices' → 증가분에만 price index 적용\n'prices increased X%' → new layer = 증가분 × (1 + X%)\n'market exceeded cost' → LCM 불필요, cost로 보고",
    trap: "A($85,000): base layer에도 10% 적용 오류. Base layer는 채택 시점 가격으로 영구 고정.\nC($88,000): 전체 합산 후 10% 적용 오류. $80,000 × 1.10.\nD($80,000): price index 전혀 미적용. $50,000 + $30,000 단순 합산.\n'market > cost' → market으로 올려야 한다는 혼동. LCM은 cost > market일 때만 write-down.",
    one_sentence: "Dollar-Value LIFO: Base layer 고정 + 증가분만 × price index; market > cost → cost 그대로.",
    speed: "① Base layer: $50,000 × 1.00 = $50,000\n② Y1 new layer: $30,000 × 1.10 = $33,000\n③ 합계: $83,000\n④ market > cost → cost 그대로\n⑤ 답: B",
    context_background: "[Dollar-Value LIFO란]\n개별 품목 단위가 아닌 달러 총액 기준으로 재고 층(layer)을 쌓는 방식. 물가 변동을 price index로 반영.\n\n[핵심 원칙: 새로 쌓인 층만 이번 연도 물가로 환산]\nBase layer: 채택 시점에 확정된 가격 → 이후 물가 변동과 무관하게 고정\nNew layer: 해당 연도에 새로 증가한 재고 → 그 연도 price index 적용\n\n[계산 구조]\nLayer           Base-year $    Price Index    Current-year $\nBase(채택시)    $50,000        × 1.00         $50,000\nY1 증가분       $30,000        × 1.10         $33,000\n합계                                           $83,000\n\n[왜 Base layer에 index를 적용하지 않는가]\nBase layer는 채택 시점에 이미 현재가치로 인식된 것. 이후 물가가 올라도 그 층의 원가는 채택 당시 가격으로 영구 고정. 이것이 LIFO의 핵심 — 나중에 들어온 것(new layer)이 먼저 나간다는 개념의 달러 버전.\n\n[LCM 처리]\nmarket > cost → write-up 불가 (US GAAP held-for-use 자산 write-up 금지)\ncost > market → write-down 필요 (LCM 적용)\n이 문제에서 market > cost → LCM 조정 없이 cost $83,000 그대로 보고",
  },

  // [INV_009] Inventory cost inclusion — usual, necessary, ready for sale
  // RULE    : Inventory 포함 = usual + necessary + ready for sale / unusual 비용·freight out → Expense
  // TRIGGER : "usually stores" → 기준선 / "due to [재해]" → unusual → Expense / "normally purchased" → usual → Inventory / "on product sold" → freight out → Expense
  // TRAP    : off-site storage를 필요비용으로 오분류 / freight out을 freight in으로 혼동
  {
    topic_id: "INV_009",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'concept',
    card_name: "Inventory cost inclusion — usual, necessary, ready for sale",
    rule: "Inventory 원가 포함 3요건: ① usual(정상적) ② necessary(필수적) ③ ready for sale(판매 준비). 3요건 미충족 → 즉시 Expense. Import duty → Inventory(취득 부대비용). Freight in → Inventory / Freight out → Selling Expense. 비정상 사건(화재·홍수 등)으로 발생한 비용 → unusual → Expense.",
    trigger: '"usually stores" → 정상 기준선 설정 → 이후 예외 = unusual\n"due to [재해/사고]" → unusual cost → Expense\n"normally purchased from [국가]" → usual + necessary → Inventory\n"freight charges on product sold" → freight out → Expense\n"import duty" → 취득 부대비용 → Inventory',
    trap: "① Off-site storage(비정상 보관비) → unusual이므로 Expense. 보관비라도 unusual이면 제외\n② Freight out을 freight in으로 혼동 → 'on product sold' = 출고 운임 = Expense\n③ 'usually'를 그냥 지나치면 unusual 판단 기준 상실 → 반드시 기준선으로 인식",
    one_sentence: "Inventory = usual + necessary + ready for sale; unusual 비용·freight out → Expense.",
    example: "Import duty $2,000 → Inventory / 화재로 인한 외부창고 $3,000 → Expense / Freight out $4,000 → Expense",
    speed: "① 'usually' 확인 → 기준선 설정\n② 'due to fire' → unusual → Expense\n③ 'normally purchased' + import duty → Inventory\n④ 'on product sold' → freight out → Expense\n⑤ Inventory $2,000 / Expense $7,000 → 정답 A",
  },

  // [INV_010] Dollar-Value LIFO — Layer Price Index Application
  // RULE    : 기초 plug = Y1 ending − Y1 layer / 각 Layer × 해당 연도 index
  // TRIGGER : 'dollar-value LIFO' + 'price index for Year X was Y'
  //           → 각 layer × 해당 연도 index / 기초 × 1.0
  // TRAP    : Y1 index를 기초에 적용(A) / 평균 index(B) / Y1 layer 누락(D)
  {
    topic_id: "INV_010",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Dollar-Value LIFO — Layer Price Index Application",
    rule: "Dollar-Value LIFO 계산:\n① 기초(plug) = Y1 ending base-year cost − Y1 layer added\n   → 기초 × 1.0 (base year index)\n② 각 Layer × 해당 연도 price index (섞지 말 것)\n③ 전체 합산 = 기말 Dollar-Value LIFO\n\n| Date | Base-Year Cost | × Index | Dollar-Value |\n| 기초 | plug | 1.0 | plug |\n| Y1 Layer | given | Y1 index | × |\n| Y2 Layer | given | Y2 index | × |",
    trigger: "'dollar-value LIFO' + 'price index for Year X was Y'\n→ 각 layer × 해당 연도 index만\n기초 plug = Y1 ending − Y1 layer added\n'base-year cost of $X' → 그 연도 index만 적용",
    trap: "Y1 index를 기초잔액에도 적용 → 기초는 base-year(1.0)\n평균 index 사용 → 각 연도 개별 적용\nY1 layer 누락 → 모든 layer 포함\nY2 ending base-year cost를 Y2 index로만 계산",
    one_sentence: "Dollar-Value LIFO: 기초 plug(×1.0) + 각 Layer × 해당연도 index = 기말잔액.",
    speed: "① 기초 = Y1 ending − Y1 layer (plug)\n② 각 layer × 해당 연도 index (섞지 말 것)\n③ 합산",
    example: "Y1 ending $900K / Y1 layer $200K → 기초 $700K\n$700K×1.0 + $200K×1.4 + $250K×1.5 = $700K+$280K+$375K = $1,355K",
  },

  // [INV_009] Gross Profit Method — Estimating Inventory Loss
  // RULE    : GAFS − (Sales × (1−GP%)) = 추정 EI → 추정 EI − undamaged = 손실액
  // TRIGGER : flood/fire + gross profit % / 'inventory not damaged' → undamaged 차감
  // TRAP    : undamaged 차감 누락(A) / COGS값 그대로(B) / 순서 오류(C)
  {
    topic_id: "INV_009",
    book_id: 'IA',
    chapter_id: 'IA_CH9',
    topic_group: 'IA_CH9_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Gross Profit Method — Estimating Inventory Loss",
    rule: "① GAFS = BI + Purchases\n② 추정 COGS = Sales × (1 − GP%)\n③ 추정 EI = GAFS − 추정 COGS\n④ 손실액 = 추정 EI − Undamaged inventory",
    trigger: "'flood / fire / disaster' + 'gross profit percentage' → Gross Profit Method 적용\n'inventory not damaged' → 추정 EI에서 차감해야 최종 손실액",
    trap: "추정 EI 전체를 손실액으로 착각 → undamaged 차감 누락\nCOGS 추정값을 손실액으로 혼동\nUndamaged를 GAFS에서 직접 차감하는 순서 오류",
    one_sentence: "Gross Profit Method: 추정 EI − undamaged = 재난 손실액.",
    speed: "① GAFS = BI + Purchase\n② 추정 EI = GAFS − (Sales × (1−GP%))\n③ 손실 = 추정 EI − undamaged",
    example: "BI $52,500 + Purchase $300,000 = GAFS $352,500 / COGS $225,000 / 추정 EI $127,500 / 손실 = $127,500 − $45,000 = $82,500",
  },

  // [INV_009] LCNRV — application unit: each item gives lowest, total gives highest
  // RULE    : Each item → 가장 낮음 / Groups → 중간 / Total → 가장 높음
  // TRIGGER : "which application results in lowest?" → each item
  // TRAP    : Groups 선택(중간값) / Total 선택(가장 높음) / 모두 동일 착각
  {
    topic_id: "INV_009",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'concept',
    card_name: "LCNRV — application unit: each item gives lowest, total gives highest",
    rule: "LCNRV 적용 단위별 재고 금액 크기:\nEach item < Groups < Total inventory\n\nEach item: 개별 품목마다 독립적으로 write-down → NRV 높은 품목이 낮은 품목 보전 불가 → 재고 가장 낮음\nGroups: 그룹 내에서만 상쇄 → 중간값\nTotal: 전체 재고에서 상쇄 → write-down 최소화 → 재고 가장 높음",
    trigger: "'which application results in lowest inventory?' → each item\n'which results in highest?' → total inventory\n각 방식 비교 문제 → Each item < Groups < Total 순서 암기",
    trap: "Groups(A): 중간값. Each item보다 높고 Total보다 낮음\nTotal(C): 가장 높음. NRV 높은 품목이 손실 품목 상쇄\nAll same(D): 세 방식은 항상 다른 값 → 동일 불가\n핵심 함정: 직관적으로 '전체를 보면 더 보수적'이라 착각 → 실제로는 상쇄 효과로 가장 높아짐",
    one_sentence: "LCNRV 적용 단위: Each item(최저) < Groups(중간) < Total(최고); lowest = each item.",
    speed: "Lowest → Each item\nHighest → Total inventory\n이유: 적용 단위 넓을수록 상쇄 효과 ↑ → 재고 금액 ↑",
    context_background: "[왜 Each item이 가장 낮은가]\n개별 적용 시 NRV > Cost인 품목(예: Item A)은 Cost로 기록하고 끝. NRV 초과분이 다른 품목의 손실을 메워주지 못한다. 반면 Total 방식에서는 Item A의 NRV 초과분($20)이 Item B, C의 NRV 부족분과 상쇄되어 write-down 폭이 줄어든다.\n\n[숫자 예시]\nItem A: Cost $100 / NRV $120\nItem B: Cost $200 / NRV $150\nItem C: Cost $300 / NRV $240\n\nEach item: $100 + $150 + $240 = $490\nTotal: Lower of $600 vs $510 = $510\n차이 $20 = Item A의 NRV 초과분이 Total에서만 상쇄됨\n\n[실무 의미]\nEach item → 가장 보수적(conservative) → US GAAP 권장\nTotal → 가장 관대 → 재고 과대계상 위험",
  },

  // [INV_010] LIFO vs FIFO — current cost approximation for COGS vs Ending Inventory
  // RULE    : COGS current cost → LIFO / Ending Inventory current cost → FIFO
  // TRIGGER : "approximates current cost" + COGS → LIFO / + EI → FIFO
  // TRAP    : LIFO/LIFO(C) — EI도 LIFO라 착각 / FIFO/FIFO(A) — COGS도 FIFO라 착각
  {
    topic_id: "INV_010",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'concept',
    card_name: "LIFO vs FIFO — which approximates current cost for COGS and ending inventory",
    rule: "Current cost 근사치:\nCOGS → LIFO: 최근 매입분이 먼저 COGS → 현재 시장가격 반영\nEnding Inventory → FIFO: 최근 매입분이 재고에 잔류 → 현재 시장가격 반영\n\n암기: COGS=LIFO / EI=FIFO → 서로 반대 방향",
    trigger: "'approximates current cost' + 'COGS' → LIFO\n'approximates current cost' + 'ending inventory' → FIFO\n두 항목 동시 질문 → LIFO/FIFO (D)",
    trap: "C(LIFO/LIFO): EI도 LIFO라 착각 → LIFO EI = 가장 오래된 층(old cost)\nA(FIFO/FIFO): COGS도 FIFO라 착각 → FIFO COGS = 가장 오래된 원가\nB(FIFO/LIFO): 완전히 반대. FIFO COGS = old cost / LIFO EI = old cost\n공통 함정: LIFO = '최근 것 먼저 out' → COGS만 current cost, EI는 오히려 old cost",
    one_sentence: "Current cost: COGS → LIFO(최근 out) / EI → FIFO(최근 재고 잔류); 방향 반대.",
    speed: "LIFO → 최근 것 먼저 COGS → COGS = current\nFIFO → 오래된 것 먼저 COGS → 최근 것 재고 잔류 → EI = current\n답: D (LIFO / FIFO)",
    context_background: "[왜 방향이 반대인가]\nLIFO: Last-In, First-Out → 마지막에 들어온(최근/비싼) 것이 먼저 나감\n→ COGS에 현재 가격 반영 ✓\n→ Ending Inventory에는 오래된(싼) 것만 남음 ✗\n\nFIFO: First-In, First-Out → 먼저 들어온(오래된/싼) 것이 먼저 나감\n→ COGS에 과거 가격 반영 ✗\n→ Ending Inventory에는 최근(비싼) 것이 남음 ✓\n\n[물가 상승기 예시]\n1월 매입 $100 / 2월 매입 $120 / 3월 매입 $150\n\nLIFO COGS: $150(3월분) → current cost ✓\nLIFO EI: $100(1월분) → old cost ✗\n\nFIFO COGS: $100(1월분) → old cost ✗\nFIFO EI: $150(3월분) → current cost ✓\n\n[B/S vs I/S 관점]\nLIFO: I/S(COGS) 현실적 / B/S(EI) 왜곡\nFIFO: B/S(EI) 현실적 / I/S(COGS) 왜곡\n→ 어떤 재무제표를 더 신뢰하느냐에 따라 방법 선택이 달라짐",
  },

  // [INV_011] Purchase Commitment Loss — Remaining Years × Minimum Units × Unit Loss
  // RULE    : 잔여 의무 = 잔여 계약기간 × 최소 구매 (당기 충족분 제외) × (계약가 − 처분가)
  // TRIGGER : "noncancelable contract" + "obsolete/scrap" → commitment loss
  // TRAP    : 전체 3년 사용(A) / 보유 재고 포함(B) / 잔여 1년만(C)
  {
    topic_id: "INV_011",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Purchase Commitment Loss — Remaining Years × Minimum Units × Unit Loss",
    rule: "Purchase Commitment Loss 계산 3단계:\n\n① 단위당 손실 = 계약가 − 처분가(scrap value 또는 NRV)\n\n② 잔여 의무 단위 수\n= 잔여 계약기간 × 연간 최소 구매 의무\n→ 당기 이미 구매분이 최소 의무를 초과하면 당기 의무 충족\n→ 잔여 연수만 계산\n\n③ Loss = ② × ①\n\n[보유 재고 처리]\n이미 구매한 재고 → Purchase commitment loss 무관\n→ 별도 LCNRV(Lower of Cost or NRV) 처리",
    trigger: '"noncancelable purchase contract" + "obsolete / scrap value" → Purchase commitment loss\n"obsolete" → 시장 자체 소멸 → scrap value = 최종 NRV (단순 가격 하락과 구분)\n"minimum annual purchase" → 잔여 계약기간 × 최소 단위가 손실 기준\n당기 구매량 확인 → 최소 의무 충족 여부 → 잔여 연수 결정\n보유 재고 금액 제시 → commitment loss와 무관, LCNRV용 정보',
    trap: "전체 계약기간(3년) 사용: Year 1 이미 충족 → 잔여 2년만\n보유 재고 포함: 이미 구매한 재고 = commitment 아님 → LCNRV 별도\n잔여 1년만 계산: 잔여 계약기간(2년) 전부 포함해야 함\n공통 함정: 당기 구매량과 최소 의무를 비교하지 않고 전체 연수 그대로 사용",
    one_sentence: "Commitment loss = 잔여기간 × 최소의무 × (계약가−처분가); 보유재고는 LCNRV 별도; obsolete = 회복 불가.",
    speed: "① $0.10 − $0.02 = $0.08\n② Year 1 충족(250K > 100K) → 잔여 2년 × 100K = 200K\n③ 200K × $0.08 = $16,000\n보유 재고 250K → 제외",
    context_background: "[Purchase Commitment란]\n미래 일정 기간 동안 특정 수량을 특정 가격에 구매하겠다는 취소 불가 계약(noncancelable).\n계약 시점에는 손실 없음. 구매 대상 품목의 시장가치가 계약가 이하로 하락하면 손실 인식 필요.\n\n[왜 Year 1에 미리 인식하는가]\n① 보수주의(Conservatism): 손실은 확실하면 즉시 인식\n② Matching Principle: 손실의 원인(obsolete)이 Year 1에 발생 → Year 1에 인식\n③ Noncancelable: 피할 수 없는 미래 손실 → 결산일 기준 전액 인식\n\n[Obsolete vs 단순 가격 하락 — 핵심 구분]\nObsolete(진부화)\n→ 시장 가치 자체가 소멸\n→ 그 물건을 원하는 시장이 없어진 것\n→ 회복 가능성 없음\n→ Scrap value = 최종 NRV (고철·재활용 소재로만 처분)\n→ 예: 플로피디스크 부품, VHS 테이프, 단종 컴퓨터 부품\n\n단순 가격 하락(Price decline)\n→ 시장은 존재하나 일시적으로 가격 낮아진 것\n→ 회복 가능성 있음\n→ 결산일 NRV로 손실 인식, 추후 reversal 가능\n\n[잔여 의무 계산 핵심]\n당기 이미 구매분이 당기 최소 의무를 초과하면 → 당기 의무 충족\n→ 잔여 연수 × 연간 최소 의무만이 손실 계산 대상\n\n이 문제:\nYear 1 최소 의무: 100,000단위\nYear 1 실제 구매: 250,000단위 (최소 초과 → 충족)\n잔여: Year 2 + Year 3 = 2년 × 100,000 = 200,000단위\n\n[보유 재고와의 구분]\n250,000단위는 이미 구매 완료 → 창고에 있는 재고\n→ Purchase commitment(미래 구매 의무)와 무관\n→ LCNRV 기준으로 별도 평가 (Cost $0.10 vs NRV $0.02 → write-down)\n\n[JE]\nDr. Estimated Loss on Purchase Commitments $16,000\n    Cr. Estimated Liability on Purchase Commitments $16,000",
    example: "계약가 $0.10 / scrap $0.02 → $0.08 손실\n잔여 2년 × 100K = 200K단위\nLoss = $16,000\nObsolete → 시장 소멸 → scrap = 최종값\nJE: Dr. Loss $16,000 / Cr. Liability $16,000",
  },

  // [INV_012] Dollar-Value LIFO – Price Index & Deflation Effect
  // RULE    : Price Index = EI(current) ÷ EI(base) / 신규 Layer(current) = Layer(base) × Index
  // TRIGGER : "false statement" + "DV LIFO" / "declining price" → deflation → index < 1.0
  // TRAP    : Deflation 시 DV LIFO 재고 higher 착각 / 분자분모 뒤집기
  {
    topic_id: "INV_012",
    category: "Inventory",
    topic_name: "Dollar-Value LIFO – Price Index & Deflation Effect",
    rule: "【탄생 배경】\nRegular LIFO는 품목별 layer 관리 → 품목 단종/변경 시 저가 layer 노출 → LIFO Liquidation 발생\nDV LIFO는 dollar pool 단위 관리 → 품목 변경과 무관하게 pool 총액 기준 유지\n\n【핵심 공식】\n① Price Index = 기말재고(current-year cost) ÷ 기말재고(base-year cost)\n② 신규 Layer(current) = 신규 Layer(base-year) × Price Index\n\n【계산 흐름】\nStep 1. 기말재고를 current-year 원가로 측정 → A\nStep 2. 기말재고를 base-year 원가로 측정 → B\nStep 3. Price Index = A ÷ B\nStep 4. A ÷ Price Index = 기말 pool(base-year 기준)\nStep 5. 전기 pool(base)과 비교 → 증가분 = 신규 layer(base)\nStep 6. 신규 layer(base) × Price Index = 신규 layer(current)\n\n【Regular LIFO vs DV LIFO 본질 차이】\nRegular LIFO: 각 layer 단가 취득 시점에 영구 고정 → 물가 변화는 신규 layer에만 반영\nDV LIFO: 매년 price index로 pool 전체 재측정 → 물가 변화가 기존 layer 소멸에도 영향",
    trigger: '"false statement" + "dollar-value LIFO" → 각 선지 true/false 분류\n"falling/declining price environment" → deflation → price index < 1.0 → pool 전체 축소\n"higher than regular LIFO" → deflation 시 반드시 false',
    trap: "【함정 ①】분자/분모 뒤집기\nprice index = base ÷ current ❌\nprice index = current ÷ base ✅\n\n【함정 ②】Deflation 방향 혼동\nDeflation → DV LIFO 재고 높아짐 ❌\nDeflation → pool 전체 축소 → regular LIFO보다 낮아짐 ✅\n예시) base layer $100,000 / 단가 $10→$8 하락\nRegular LIFO: $100,000 (layer 단가 고정)\nDV LIFO: $100,000 × (8/10) = $80,000",
    example: "Year 1 layer: base $10,000 × index 1.00 = $10,000 (고정)\nYear 2 layer: base $5,000  × index 1.20 = $6,000\nYear 3 deflation → pool(base) 축소 → Year 2 layer부터 소멸\n→ 물가 하락이 pool 크기 자체에 반영됨 (regular LIFO와 달리)",
    journal_entry: "",
    key_formula: "Price Index = EI(current-year cost) ÷ EI(base-year cost)\n신규 Layer(current) = 신규 Layer(base-year) × Price Index",
    speed: "DV LIFO = pool 단위 관리 → LIFO liquidation 방지\nDeflation → price index < 1.0 → pool 전체 축소 → regular LIFO보다 낮아짐 → 'higher' = false",
  },

  // [INV_013] Inventory Cost Inclusions – Freight In vs Interest on Loan
  // RULE    : Freight in → capitalize / Interest on loan → period expense (재고 목적이어도)
  // TRIGGER : "freight in" → Inventory ↑ / "interest on inventory loan" → No effect
  // TRAP    : 차입 목적이 재고여도 이자 capitalize 불가 / Freight in vs out 혼동
  {
    topic_id: "INV_013",
    category: "Inventory",
    topic_name: "Inventory Cost Inclusions – Freight In vs Interest on Loan",
    rule: "【재고 원가 포함 기준】\n재고를 '현재 위치·상태'로 만드는 데 직접 필요한 비용만 capitalize\n\n【항목별 판단】\nFreight In (매입 운임)\n→ 재고를 가져오는 데 필요한 비용 → Inventory 원가 포함 ✅\n\nInterest on Inventory Loan (재고 구입 차입금 이자)\n→ 자금조달 비용 = Period expense → Inventory 원가 불포함 ❌\n→ 차입 목적이 재고 구입이어도 동일\n→ 재고는 interest capitalization qualifying asset 아님\n(qualifying asset = 건설 중인 PPE 등 완성까지 상당 기간 필요한 자산)\n\nFreight Out (판매 운임)\n→ Selling expense → Inventory 원가 불포함 ❌",
    trigger: '"freight in" → inventory 원가 포함 → Increase\n"interest on loan" + inventory 관련 → period expense → No effect\n표 형식 두 항목 동시 비교 → 각각 독립적으로 판단',
    trap: "Interest on inventory loan: 재고 구입 목적이어도 capitalize 불가 — 자금조달 비용은 항상 period expense.\nFreight in(매입운임) vs Freight out(판매운임) 혼동 주의.\n재고는 US GAAP interest capitalization qualifying asset 아님.",
    example: "Wholesaler가 $50,000 재고 구입:\n- Freight in $500 → Inventory $50,500 (capitalize)\n- 구입 차입금 이자 $300 → Interest Expense $300 (period expense)\n→ 재고 장부금액: $50,500 (이자 불포함)",
    journal_entry: "Dr. Inventory $500 (freight in)\nCr. Cash $500\n\nDr. Interest Expense $300 (loan interest)\nCr. Cash $300",
    key_formula: "Inventory Cost = Purchase Price + Freight In + 직접부대비용\n(Interest on loan 제외)",
    speed: "Freight in → Inventory ↑ | Interest on inventory loan → Period expense → No effect",
  },

  // [INV_014] Dollar-Value LIFO – Layer Calculation with Price Index
  // RULE    : DV LIFO = 전기 DV LIFO + 신규 layer(base) × 당기 price index
  // TRIGGER : "dollar-value LIFO" + 표 → 4단계 계산 / Price Index = current ÷ base
  // TRAP    : current-year cost 그대로 사용 / 전기 layer에 새 index 재적용
  {
    topic_id: "INV_014",
    category: "Inventory",
    topic_name: "Dollar-Value LIFO – Layer Calculation with Price Index",
    rule: "【DV LIFO 계산 4단계】\nStep 1. Price Index = 기말재고(current-year cost) ÷ 기말재고(base-year cost)\nStep 2. 신규 layer(base) = 당기 pool(base) − 전기 pool(base)\nStep 3. 신규 layer(current) = 신규 layer(base) × 당기 Price Index\nStep 4. DV LIFO 기말 = 전기 DV LIFO + 신규 layer(current)\n\n【핵심 원칙】\n- 기존 layer에는 새 price index 재적용 안 함\n- 각 layer는 생성 당시 price index로 영구 고정\n- Pool 감소 시 → 최신 layer부터 제거(LIFO 순서)",
    trigger: '"dollar-value LIFO" + 표 형식 → 4단계 계산\nPrice Index = current ÷ base (분자=current, 분모=base)\n신규 layer = 당기 pool(base) − 전기 pool(base)\n신규 layer(current) = 신규 layer(base) × 당기 index',
    trap: "Current-year cost 합계를 DV LIFO로 사용($120,000 오답).\nPrice index 분자분모 뒤집기(base÷current).\n전기 DV LIFO에 새 price index 재적용 — 기존 layer는 고정.\n신규 layer에 price index 미적용.",
    example: "Grove Co. Year 2:\nStep 1. Price Index = $120,000 ÷ $90,000 = 1.333\nStep 2. 신규 layer(base) = $90,000 − $67,500 = $22,500\nStep 3. 신규 layer(current) = $22,500 × 1.333 = $30,000\nStep 4. DV LIFO = $69,000 + $30,000 = $99,000",
    journal_entry: "",
    key_formula: "Price Index = EI(current) ÷ EI(base)\n신규 Layer(current) = 신규 Layer(base) × Price Index\nDV LIFO 기말 = 전기 DV LIFO + 신규 Layer(current)",
    speed: "DV LIFO = 전기 DV LIFO + 신규 layer(base) × 당기 price index",
  },

  // [INV_015] Inventory Physical Count Adjustment — FOB Destination vs Consignment
  // RULE    : FOB destination + shipped → 소유권 판매자 → 포함 정당
  //           Consignment for supplier → Consignee → 남의 물건 → 제외 정당
  // TRIGGER : "shipped + FOB destination" → 조정 없음 / "for supplier" → Consignee → 조정 없음
  // TRAP    : shipped를 delivered로 오해 / consignment 방향 혼동
  {
    topic_id: "INV_015",
    sub_category_id: "U3_INVENTORY",
    card_type: 'conditional',
    card_name: "Inventory Physical Count Adjustment — FOB Destination vs Consignment",
    rule: "【FOB 조건 판단】\nFOB destination + shipped(발송) → 목적지 미도착 → 소유권 판매자 → 포함 정당\nFOB destination + delivered(도착) → 소유권 구매자 → 제외\nFOB shipping point + shipped → 소유권 즉시 구매자 → 제외\n\n【Consignment 방향 판단】\n'held on consignment for supplier' → Grove = Consignee(수탁자) → 소유권 Supplier → 제외 정당\n'sent on consignment to customer/dealer' → Grove = Consignor(위탁자) → 소유권 Grove → 포함\n\n【핵심 동사 구분】\nshipped(발송) ≠ delivered(도착)\n→ FOB destination에서 shipped = 아직 소유권 판매자",
    trigger: '"shipped + FOB destination" → 운송 중 → 소유권 판매자 → included 정당 → 조정 없음\n"held on consignment for supplier" → Grove = Consignee → 남의 물건 → excluded 정당 → 조정 없음\n두 조정 모두 상쇄 → physical count 그대로',
    trap: "'shipped'를 'delivered'로 오해 → FOB destination + shipped = 아직 소유권 Grove → 빼면 안 됨\n'for supplier' 방향 오해 → Grove = Consignee(수탁자), 남의 물건 → 더하면 안 됨\nFOB shipping point였다면 → shipped 시점 소유권 이전 → 제외해야 함",
    example: "Physical count $600,000\n① 800units × $15 = $12,000 (FOB destination + shipped) → included 맞음 → 조정 없음\n② 4,000units × $8 = $32,000 (consignment for supplier) → excluded 맞음 → 조정 없음\n→ 정답: $600,000",
    speed: "FOB destination + shipped → 조정 없음 | Consignment for supplier → Consignee → 조정 없음\n→ physical count 그대로",
  },

  // [INV_016] Consignment Inventory — Consignor vs Consignee Title Rule
  // RULE    : Consignor = title 보유 → 재고 포함 + freight 포함
  //           Consignee = title 없음 → 재고 제외
  // TRIGGER : "shipped on consignment to" → Consignor → 포함
  //           "received on consignment from" → Consignee → 제외
  // TRAP    : Freight 누락($36K만) / Consignee 재고 포함($24K)
  {
    topic_id: "INV_016",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "Consignment Inventory — Consignor vs Consignee Title Rule",
    rule: "Consignment 재고 귀속 원칙:\n\n[Consignor(위탁자)]\n→ 판매 완료 전까지 title 보유\n→ 자신의 재고에 포함\n→ freight paid by consignor = 재고 원가에 포함\n\n[Consignee(수탁자)]\n→ title 없음\n→ 자신의 재고에 포함 안 함\n→ freight paid by consignor도 수탁자 재고와 무관\n\n[재고 금액]\nConsignor 재고 = 위탁 상품 원가 + Consignor 부담 freight",
    trigger: '"shipped on consignment to [회사명]" → 나 = Consignor → 내 재고 포함\n"received on consignment from [회사명]" → 나 = Consignee → 내 재고 제외\n"freight paid by [나]" + consignor인 경우 → 재고 원가 포함\n"freight paid by [상대방]" + 내가 consignee → 무관',
    trap: "Freight $1,800 누락: Consignor 부담 freight → 재고 원가 포함 필수 → $36,000만 답하면 오답\nConsignee 재고 포함: received on consignment = 내가 수탁자 → title 없음 → 제외\nConsignee freight 포함: Gamma가 낸 $1,000 → Gamma 재고, Stone 무관\n공통 함정: 두 거래에서 내 역할(Consignor vs Consignee) 구분 없이 합산",
    one_sentence: "Consignor = title 보유 → 재고+freight 포함 / Consignee = title 없음 → 재고 제외.",
    speed: "① Omega에 발송 → Stone = Consignor → $36,000 + $1,800 = $37,800 포함\n② Gamma로부터 수령 → Stone = Consignee → $24,000 + $1,000 → 전액 제외\n③ Stone 재고 = $37,800",
    example: "Stone → Omega (consignor): $36,000 + freight $1,800 = $37,800 → Stone 재고\nGamma → Stone (consignee): $24,000 + freight $1,000 = Gamma 재고 → Stone 제외",
    context_background: "[Consignment(위탁판매) 구조]\n\nConsignor(위탁자): 상품을 보내는 쪽. 판매될 때까지 title(소유권) 보유.\nConsignee(수탁자): 상품을 받아 판매하는 쪽. Title 없음.\n\n[왜 판매 전까지 Consignor 재고인가]\nTitle이 넘어가지 않았으므로 법적 소유자는 여전히 Consignor.\n재고 인식 = 소유권 기준.\n수탁자 창고에 물리적으로 있어도 발송한 회사(consignor)의 재고.\n\n[Freight 처리]\nConsignor가 부담한 발송 운임 = 재고를 현재 위치로 가져오는 비용 → 원가 포함.\nConsignee가 부담한 운임 = Consignee의 비용 (consignor 재고와 무관).\n\n[역할 파악 키워드]\n'shipped to' → 보낸 쪽 = Consignor\n'received from' → 받은 쪽 = Consignee",
  },

  // [INV_017] LIFO Inventory — LCM Ceiling / Floor / Market Calculation
  // RULE    : Market = MEDIAN(RC, NRV, NRV−GP). LCM = MIN(Cost, Market). Cost는 STEP 2 비교 대상.
  // TRIGGER : "LIFO" + "lower of cost or market" + replacement cost + normal profit margin → LCM 3단계
  // TRAP    : NRV(Ceiling) 그대로 Market 사용 / RC 그대로 Market 사용 / Cost를 STEP 1 계산 재료로 끌어다 씀
  // EXAMPLE : RC $20K / NRV $28K / Floor $24K → Market = $24K → LCM = MIN($26K, $24K) = $24K
  {
    topic_id: "INV_017",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'calculation',
    card_name: "LIFO LCM — Market = Median(RC, NRV, NRV−GP)",
    rule: "LCM = MIN(Historical Cost, Market)\nMarket = MEDIAN(RC, NRV, NRV−GP)\n\nSTEP 1 — Market 계산 (Cost 사용 안 함):\n  NRV(Ceiling) = Selling Price − Further processing costs\n  Floor = NRV − Normal profit\n  Market = MEDIAN(RC, NRV, Floor)\n\nSTEP 2 — LCM:\n  MIN(Historical Cost, Market)\n\nCost는 STEP 1 계산 재료 아님 — STEP 2 비교 대상으로만 등장.",
    trigger: '"LIFO" + "lower of cost or market" → LCM 구조\n"replacement cost" → RC 확인, MEDIAN 계산 재료\n"normal profit margin" → Floor 계산 재료 (LIFO LCM 전용)\n"further processing costs" → NRV(Ceiling) 계산 재료',
    trap: "A: NRV(Ceiling) 그대로 Market 사용 → Median 체크 누락\nC: RC 그대로 Market 사용 → Floor 체크 누락\nD: Cost 그대로 보고 → LCM 비교 누락\n핵심 함정: Cost($26,000)를 Market 계산에 끌어다 쓰는 것 — Cost는 계산 재료 아님",
    one_sentence: "LCM = MIN(Cost, Market); Market = MEDIAN(RC, NRV, NRV−GP); Cost는 STEP 2에서만 등장.",
    example: "RC $20K / SP $40K / processing $12K / GP 10%\nNRV $28K / Floor $24K / Market = MEDIAN = $24K\nLCM = MIN($26K, $24K) = $24K",
    speed: "STEP 1: MEDIAN(RC, NRV, NRV−GP) = Market\nSTEP 2: MIN(Cost, Market) = LCM\nCost는 STEP 1에 절대 등장 안 함",
    context_background: "LIFO 재고는 US GAAP에서 구(舊) LCM 규칙 적용. Market의 핵심은 RC가 Ceiling(NRV)와 Floor(NRV−GP) 사이에 있어야 한다는 것 — 이를 직관적으로 표현하면 세 값의 Median.\n\n[왜 Floor가 존재하는가]\nRC가 지나치게 낮을 때 Market을 Floor로 제한하는 이유: 재고를 너무 낮게 평가하면 미래 판매 시 이익이 과대 계상됨. Floor = 정상 이익을 남길 수 있는 최소 평가액.\n\n[FIFO vs LIFO 비교]\nFIFO/Average → LCNRV: NRV = SP − processing costs만 사용. RC·GP margin 무시.\nLIFO → LCM: RC/NRV/Floor 세 값 모두 사용. Median = Market.",
  },

  // [INV_018] Inventory Physical Count — FOB, Consignment, Bill and Hold, Freight
  // RULE    : 실사 = 창고 기준 → FOB 조건·Consignment 방향·Bill and Hold 조건으로 소유권 판단 후 조정
  // TRIGGER : "in transit" → FOB 조건 확인 / "consignment" → to/by/for 방향 확인 / "bill and hold" → 조건 충족 여부
  // TRAP    : "purchased by customer" FOB s.p. = Widget 재고 아님 / Consignment IN = 타사 소유 / Bill and Hold 조건 미충족 = 포함
  {
    topic_id: "INV_018",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INV',
    sub_category_id: "U3_INVENTORY",
    card_type: 'conditional',
    card_name: "Inventory physical count adjustments — FOB, consignment direction, bill and hold, freight",
    rule: "【FOB 조건 — 소유권 이전 시점】\nFOB Shipping Point → 선적 시 소유권 이전 → 매입자 부담\n  매입 운송 중 → 매입자 재고 ✅\n  판매 후 운송 중 → 고객 재고 ❌\n\nFOB Destination → 도착 시 소유권 이전 → 판매자 부담\n  매입 운송 중 → 판매자 재고 ❌\n  판매 후 운송 중 → 판매자 재고 유지 ✅\n\n【문장 해석】\n'purchased by Widget' + FOB s.p. → Widget이 산 것 → Widget 재고\n'purchased by a customer' + FOB s.p. → 고객이 산 것 → 고객 재고 (Widget 제외)\n\n【Consignment 방향】\nConsignment TO another company (OUT)\n→ Widget이 타사에 맡긴 것 → Widget 소유 ✅ 포함\n\nConsignment BY / FOR another company (IN)\n→ 타사가 Widget에 맡긴 것 → 타사 소유 ❌ 제외\n\n기억: TO = 내가 보낸 것 → 내 것 / BY·FOR = 남이 보낸 것 → 남의 것\n\n【Bill and Hold】\n조건 충족 시 (구매자 요청·별도 보관·즉시 인도 가능·일정 확정)\n→ 소유권 이전 완료 → 판매자 재고 ❌ 제외\n조건 미충족 시\n→ 소유권 미이전 → 판매자 재고 ✅ 포함\n\n【Freight In vs Out】\nFreight In (매입 운임) → 재고 원가 포함 (capitalize)\n  Dr. Inventory / Cr. Cash\nFreight Out (판매 운임) → 판매비용 즉시 처리\n  Dr. Delivery Expense / Cr. Cash\n\n【기타 항목】\nPledged inventory (담보 재고) → 소유권 있음 ✅ 포함\nPublic warehouse (외부 창고) → 소유권 있음 ✅ 포함\nPurchase commitment (미수취 주문) → 재고 아님 ❌",
    trigger: "'in transit' → FOB 조건 즉시 확인\n'FOB shipping point' + 매입 운송 중 → ✅ 포함\n'FOB shipping point' + 판매 운송 중 → ❌ 제외\n'consignment TO' → OUT → 포함\n'consignment BY / FOR' → IN → 제외\n'held on consignment by another company' → OUT → ✅ 포함\n'bill and hold' → 조건 4가지 충족 여부 확인",
    trap: "'purchased by a customer' + FOB s.p. → 고객 소유 → Widget 재고 아님 (가장 빈번한 트랩)\n'held on consignment by another company' → Widget이 맡긴 것(OUT) → 포함 (타사 보관이라도 Widget 소유)\nFreight In → 비용 처리 오류 → 반드시 재고 원가 포함\nBill and Hold 조건 미확인 → 조건 미충족이면 판매자 재고 유지",
    one_sentence: "Physical count 조정: FOB 조건으로 소유권 판단 / Consignment OUT=포함·IN=제외 / Bill and Hold 조건 확인 / Freight In=재고원가.",
    key_formula: "조정 후 재고 = 실사 금액 + FOB s.p. 매입 운송 중 + Consignment OUT ± 기타",
    example: "실사 $435,875\n+$55,000: FOB s.p. 매입 운송 중 → Widget 소유 ✅\n+$0: FOB s.p. 판매 운송 중 $35,000 → 고객 소유 ❌\n+$27,000: Consignment OUT → Widget 소유 ✅\n= $517,875",
    speed: "FOB s.p. 매입 중 → + / FOB s.p. 판매 중 → 0\nConsignment TO(OUT) → + / BY·FOR(IN) → −\nFreight In → 원가 포함 / Freight Out → 비용",
    context_background: "[재고 실사(Physical Count)가 누락하는 항목]\n창고 기준 실사 → 운송 중·외부 위탁·외부 판매 재고 누락 가능\n→ 소유권 기준으로 재조정 필수\n\n[FOB 직관]\nFOB Shipping Point: '출발하면 네 거'\nFOB Destination: '도착해야 네 거'\n\n[Consignment 방향 기억법]\nTO = 내가 상대방에게 보낸 것 → 내 소유\nBY = 상대방이 나에게 보낸 것 → 상대방 소유\nFOR = 상대방을 위해 내가 보관 → 상대방 소유\n\n[전체 조정 요약]\nFOB s.p. 매입 운송 중 → ✅ 포함\nFOB s.p. 판매 운송 중 → ❌ 제외\nFOB dest 매입 운송 중 → ❌ 제외\nFOB dest 판매 운송 중 → ✅ 포함\nConsignment OUT → ✅ 포함\nConsignment IN → ❌ 제외\nBill and Hold (조건 충족) → ❌ 제외\nBill and Hold (조건 미충족) → ✅ 포함\nPledged inventory → ✅ 포함\nPublic warehouse → ✅ 포함\nPurchase commitment → ❌ 재고 아님\nFreight In → ✅ 원가 포함\nFreight Out → ❌ 판매비용",
  },

  // ── CASH (Cash & Cash Equivalents) ─────────────────────────────────────────
  // [CASH_001] Cash and Cash Equivalents — Balance Sheet Classification
  // RULE    : Petty cash + Checking + Depository + Savings + MMF + 만기 3개월 이내 T-bills/CD만 포함
  // TRIGGER : Marketable equity/debt security → 무조건 제외 / 즉시 사용 불가 항목 → 제외
  // TRAP    : Marketable debt security를 현금성으로 착각 / Petty cash 제외 / 만기 조건 무시
  {
    topic_id: "CASH_001",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_CASH',
    sub_category_id: "U3_CASH",
    card_type: 'concept',
    card_name: "Cash and Cash Equivalents — Balance Sheet Classification",
    rule: "Cash & Cash Equivalents = 즉시 사용 가능 자산 + 취득 시점 만기 3개월 이내 단기 금융상품. Petty cash·Checking·Depository·Savings·MMF 포함. Marketable securities(주식·채권)는 시장 매각 필요 + 가격 변동 리스크로 무조건 제외.",
    trigger: "'cash and cash equivalents' → Petty cash + Checking + Depository + Savings + MMF + 만기 3개월 이내 T-bills/CD만 합산\nMarketable equity/debt security → 무조건 제외, Investments로 분류\n취득 시점 만기 3개월 초과 CD/T-bills → 제외",
    trap: "$63,750 (A) → Marketable securities 전부 포함한 오류\n$52,500 (C) → Petty cash 제외 + Marketable equity security 포함한 오류\n$37,500 (D) → Petty cash 제외한 오류. Petty cash는 현금 그 자체\n공통 함정 ①: Marketable debt security를 '만기 짧으니 현금성'으로 착각. 만기와 무관하게 시장성 유가증권은 Investments\n공통 함정 ②: NSF checks나 Postdated checks를 현금으로 포함하는 오류. 둘 다 즉시 사용 불가",
    one_sentence: "Cash & CE = 즉시 사용 가능 + 취득 시 만기 3개월 이내; Marketable securities는 만기·금액 무관하게 전부 제외.",
    speed: "Petty cash + Checking + Depository = 750 + 30,000 + 7,500 = $38,250\nMarketable securities 두 개는 계산에서 제외",
    context_background: "[Cash and Cash Equivalents(현금 및 현금성 자산)이란]\n기업이 즉시 사용 가능한 유동성 자산으로, B/S에서 가장 유동성이 높은 항목이다. 실무에서는 회사 운영자금, 급여 지급, 거래처 결제 등에 즉각 사용되는 자금이 여기에 해당한다.\n\n[분류 핵심 기준 두 가지]\n① 즉시 사용 가능한가?\n② 취득 시점 만기 3개월 이내인가? (T-bills, CD 등 단기 금융상품 해당)\n\n[항목별 분류 기준]\n✅ Cash & Cash Equivalents 해당:\n- Petty cash (소액현금): 현금 그 자체\n- Checking account (당좌예금): 즉시 인출 가능\n- Depository account (예치금): 즉시 인출 가능\n- Savings account (보통예금): 즉시 인출 가능\n- Money Market Fund (MMF): 원금 보존 + 즉시 환매 가능 → 현금성 자산\n- Treasury bills (T-bills): 취득 시점 만기 3개월 이내만 해당\n- Certificate of Deposit (CD): 취득 시점 만기 3개월 이내만 해당\n\n❌ Cash & Cash Equivalents 해당 안 됨:\n- Marketable equity security: 시장 매각 필요 + 가격 변동 리스크 → Investments\n- Marketable debt security: 시장 매각 필요 + 가격 변동 리스크 → Investments\n- CD (만기 3개월 초과): Short-term investment로 분류\n- Restricted cash: 사용 제한 있으면 별도 표시\n- Postdated checks (선일자 수표): 아직 현금화 불가\n- NSF checks (부도수표): 회수 불확실 → Receivable로 재분류\n\n[Marketable securities가 제외되는 이유]\n주식·채권은 시장에서 매각해야 현금화되며, 가격 변동 리스크가 있다. 즉시 확정된 금액으로 사용할 수 없으므로 Cash가 아닌 Investments 항목으로 분류한다.",
  },

  // ── TDR (continued) ────────────────────────────────────────────────────────
  // [TDR_002] Troubled Debt Restructuring — Debt Modification Gain Recognition
  // RULE    : Gain 여부 = Carrying Amount vs Total Future Cash Payments (PV 없음, 명목 총액)
  // TRIGGER : 'solely modification' → Debt Modification TDR / 'gain on restructuring' → Total FCF 비교
  // TRAP    : PV at modified rate(A) / Principal only(B) / PV at original rate(D) — 셋 다 PV 또는 부분 금액
  {
    topic_id: "TDR_002",
    book_id: 'IA',
    chapter_id: 'IA_CH8',
    topic_group: 'IA_CH8_TDR',
    sub_category_id: "U4_TROUBLED_DEBT",
    card_type: 'conditional',
    card_name: "TDR — Debt Modification: Gain Recognition Threshold",
    rule: "Debt Modification TDR: Carrying Amount vs Total Future Cash Payments (원금+이자 합산, 할인 없음). CA > Total FCF → Gain 즉시 인식. CA ≤ Total FCF → Gain 없음, 새 조건으로 이자 재계산.",
    trigger: "'solely modification of terms' → Asset Transfer 아님, 순수 Debt Modification TDR\n'gain on restructuring' → Carrying Amount vs Total Future Cash Payments (PV 아님)\nTotal Future Cash Payments = 앞으로 낼 이자 + 원금 전부 합산 (할인 없음)",
    trap: "A (PV at modified rate) → 일반 부채 재측정 방식. TDR Modification에서는 PV 사용 안 함\nB (Principal only) → 이자 지급액 누락. Total future cash = 원금 + 이자 전부\nD (PV at original rate) → 원래 이자율로 할인하는 것도 TDR Modification 규칙이 아님\n공통 함정 ①: TDR Modification을 일반 부채 재측정과 혼동. TDR에서는 할인 없이 명목 총액 비교\n공통 함정 ②: 'solely'를 놓치는 것. Asset Transfer가 섞이면 계산 방식이 완전히 달라짐",
    one_sentence: "TDR Debt Modification Gain = CA − Total Future Cash Payments(원금+이자, 할인 없음); 양수일 때만 Gain 인식.",
    speed: "Gain 여부 = Carrying Amount - Total Future Cash Payments\n양수 → Gain 인식\n0 이하 → Gain 없음, 새 조건으로 이자 재계산",
    context_background: "[이 문제가 묻는 것]\nDebt Modification TDR에서 Debtor가 Gain을 인식해야 하는지 판단할 때, Carrying Amount와 무엇을 비교해야 하는가?\n\n[왜 'solely modification'이 중요한가]\nTDR에서 Gain/Loss 계산 방식은 유형별로 완전히 다르다:\n① Asset Transfer only: 자산 FV vs 자산 CA → Loss/Gain on Transfer + 부채 CA vs 자산 FV → Gain on Restructuring\n② Debt Modification only: Carrying Amount vs Total Future Cash Payments (PV 없음)\n③ 혼합 (Asset + Modification): Asset Transfer 처리 먼저 → 남은 부채에 Modification 규칙 적용\n\n문제에서 'solely modification'이라고 못 박은 이유: Asset Transfer가 섞이면 계산 방식이 달라지므로 순수한 조건 변경 케이스임을 명확히 한 것이다.\n\n[Debtor vs Creditor 정리]\n- Debtor (채무자): 돈 빌린 쪽. 조건 완화 받는 쪽. Gain 인식 주체.\n- Creditor (채권자): 돈 빌려준 쪽. 손해 감수하는 쪽.\n\n[Gain 인식 판단 기준]\nCarrying Amount of Debt vs Total Future Cash Payments (이자 + 원금 전부, 할인 없음)\n① CA > Total FCF → Gain 인식 (차액을 즉시 I/S에 인식)\n② CA ≤ Total FCF → Gain 없음 (새 조건으로 이자비용 재계산)\n\n[숫자 예시 — Gain 발생]\nCA $100,000 / 조건 변경 후 원금 $80,000 + 이자 $7,200 = Total FCF $87,200\nGain = $100,000 - $87,200 = $12,800 → 즉시 I/S 인식\n\n[숫자 예시 — Gain 없음]\nCA $100,000 / 원금 $95,000 + 이자 $8,550 = Total FCF $103,550\n$100,000 - $103,550 = -$3,550 → Gain 없음, 새 조건으로 이자 재계산\n\n[왜 PV가 아니라 Total Future Cash Payments인가]\nTDR Debt Modification에서는 할인(discounting) 없이 명목 금액(nominal amount)을 비교한다. Creditor가 이미 손해를 감수한 상황에서 추가로 할인까지 적용하면 Gain이 과대계상될 수 있기 때문이다.",
  },

  // [TDR_003] Loan impairment measurement — foreclosure not probable vs. probable
  // RULE    : Foreclosure NOT probable → PV법 또는 실무간편법(market price / collateral FV) 선택 가능
  //           Foreclosure probable → FV of collateral만
  // TRIGGER : "loan impaired" + "foreclosure not probable" → Either I or II / "foreclosure probable" → collateral FV only
  // TRAP    : not probable을 probable로 혼동 / I 또는 II만 허용으로 오인 / PV법만 유일한 방법으로 오인
  {
    topic_id: "TDR_003",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_TDR',
    sub_category_id: "U4_TROUBLED_DEBT",
    card_type: 'conditional',
    card_name: "Loan impairment measurement — foreclosure not probable vs. probable",
    rule: "Loan Impairment 측정 방법 (foreclosure 여부 기준):\n\n[Foreclosure NOT probable]\n① PV of expected future cash flows (주된 방법)\n② Observable market price of the loan (실무 간편법)\n③ FV of collateral — collateral dependent 대출인 경우 (실무 간편법)\n→ 3가지 중 선택 가능\n\n[Foreclosure IS probable]\n→ FV of collateral만 사용 (선택 없음)",
    trigger: '"loan impaired" + "foreclosure not probable" → I or II 모두 허용 → Either I or II\n"loan impaired" + "foreclosure probable" → FV of collateral만\n"collateral dependent" → FV of collateral 사용 가능\n"observable market price" → 실무 간편법 → not probable일 때 허용',
    trap: "① 'not probable'을 'probable'로 혼동 → foreclosure probable이면 collateral FV만\n② I만 허용 → II(collateral FV)도 실무 간편법으로 허용\n③ II만 허용 → I(market price)도 실무 간편법으로 허용\n④ PV법만 유일한 방법으로 오인 → 실무 간편법 2가지도 허용",
    one_sentence: "Foreclosure NOT probable → market price or collateral FV 둘 다 허용; Foreclosure probable → collateral FV만.",
    example: "대출 손상 + foreclosure 불확실 → ①PV법 ②시장가격 ③담보FV 중 선택 / foreclosure 확실 → 담보FV만",
    context_background: "채권자 입장에서 대출채권이 손상되었을 때, foreclosure(담보물 강제취득) 가능성에 따라 측정 방법이 달라진다. Foreclosure가 probable하지 않으면 PV법이 원칙이지만 observable market price나 담보 FV도 실무 간편법으로 허용된다. 반면 foreclosure가 probable하면 담보 FV만 사용해야 한다.",
    speed: "① 'foreclosure NOT probable' 확인\n② I(observable market price) ✅ 실무 간편법\n③ II(FV of collateral) ✅ 실무 간편법\n④ 둘 다 허용 → 정답 C: Either I or II",
  },

  // [INT_007] Crypto Assets — Classification and Measurement
  // RULE    : Crypto = indefinite-lived intangible (ASC 350-60) / FV each period / ΔFV → net income
  // TRIGGER : 'crypto assets' → indefinite-lived intangible + FV each period + changes to net income
  // TRAP    : indefinite life + acquisition cost only (B) / finite life 자체 불가 (A, C)
  {
    topic_id: "INT_007",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Crypto Assets — Classification and Measurement",
    rule: "Crypto assets = indefinite-lived intangible asset (ASC 350-60). 매 보고기간 말 fair value로 측정. FV 변동액 → current period net income. Useful life 추정 불가 → finite life 분류 불가.",
    trigger: "'crypto assets' 등장 → indefinite-lived intangible + fair value each reporting period + changes to net income",
    trap: "B형 함정: indefinite life는 맞지만 acquisition cost only라고 착각 — ASC 350-60은 FV remeasurement 요구\nA/C형 함정: useful life 추정 불가 → finite life 분류 자체 불성립",
    one_sentence: "Crypto = indefinite-lived intangible; FV each period; changes → net income.",
    speed: "Crypto → indefinite-lived / FV each period / ΔFV → net income (not OCI)",
    context_background: "암호화폐는 유형자산도 금융상품도 아닌 무형자산으로 분류(ASC 350-60). Useful life 추정 불가 → indefinite-lived. 매 보고기간 말 FV 측정 후 변동액을 당기 net income에 인식.",
  },

  // [INT_006] Intangibles — Patent Capitalization vs Expense
  // RULE    : R&D → expense / Registration legal fees → capitalize / Successfully defend → capitalize / Unsuccessfully defend → expense
  // TRIGGER : 'successfully defend' → capitalize / 'research and development' → expense (특허 나왔어도)
  // TRAP    : 승소 방어비용 expense 처리 / R&D 자본화 / D($145,500) R&D+등록비 합산
  {
    topic_id: "INT_006",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'calculation',
    card_name: "Intangibles — Patent Capitalization vs Expense",
    rule: "Patent 자본화 기준: R&D → 즉시 expense(불확실). 등록 법률비용 → capitalize(취득 직접비용). 승소 방어비용 → capitalize(자산 가치 확정). 패소 방어비용 → expense(입증 실패).",
    trigger: "'research and development costs' → 무조건 expense, 자본화 불가\n'legal fees to register' → capitalize\n'successfully defend' → capitalize (승소만 해당)\n'unsuccessfully defend' → expense (패소는 자산 가치 입증 실패)",
    trap: "$18,000 (A) → 등록비용만 포함. 승소 방어비용($27,000) 누락\n$172,500 (C) → R&D($127,500) 포함 오류. R&D는 전액 즉시 expense\n$145,500 (D) → R&D($127,500) + 등록비용($18,000) 포함. R&D 자본화 오류\n공통 함정 ①: 승소 방어비용을 비용으로 처리하는 오류. 'successfully defend'가 보이면 capitalize\n공통 함정 ②: R&D를 자본화하려는 오류. 특허로 이어졌더라도 R&D 자체는 전액 expense",
    one_sentence: "Patent 자본화 = 등록비 + 승소 방어비만; R&D와 패소 방어비는 즉시 expense.",
    speed: "R&D $127,500 → expense (제외)\nRegistration $18,000 + Successful Defense $27,000 = $45,000",
    context_background: "[Patent 자본화 기준이란]\n특허권은 무형자산(Intangible Asset)으로, 취득 관련 비용 중 자본화(capitalize)할 수 있는 항목과 즉시 비용(expense) 처리해야 하는 항목이 엄격히 구분된다.\n\n[항목별 처리 기준]\n- R&D costs (연구개발비): 즉시 expense. US GAAP: R&D는 미래 경제적 효익 불확실 → 전액 비용\n- Legal fees to register patent (등록 법률비용): capitalize. 특허권 취득의 직접비용\n- Legal fees to successfully defend patent (승소 방어비용): capitalize. 기존 특허 가치를 입증·유지한 비용 → 자산에 가산\n- Legal fees to unsuccessfully defend patent (패소 방어비용): 즉시 expense. 자산 가치 입증 실패\n\n[핵심 원칙: 불확실 → 확실 전환점이 자본화 시작점]\nUS GAAP 전반에 걸쳐 일관된 논리: 미래 경제적 효익이 확실해지기 전까지는 비용 처리한다.\n\n① R&D → Patent:\n[R&D 단계] → expense → [특허 등록] → capitalize\n불확실(특허가 날지 모름) → 확실(등록 완료)\n\n② Software (판매 목적):\n[개발 시작] → expense → [Technological Feasibility] → capitalize → [출시]\n불확실(팔릴지 모름) → 확실(기술적 실현 가능성 입증)\n\n③ Software (내부 사용):\n[Preliminary 단계] → expense → [Application Development] → capitalize → [Post-Implementation] → expense\n뭘 만들지 구상 중 → 실제 개발 시작 → 유지보수 단계(다시 expense)\n\n세 케이스 모두 불확실→확실 전환점을 기준으로 그 전은 expense, 그 후는 capitalize라는 동일한 논리 구조를 따른다.\n\n[경제적 실질]\nR&D는 특허가 될지 안 될지 불확실한 단계의 비용이므로 US GAAP에서는 전액 비용 처리한다. 반면 등록비용과 승소 방어비용은 특허권이라는 자산의 존재와 가치를 확정짓는 직접비용이므로 자본화한다.",
  },

  // [INT_008] Non-interest bearing note — interest income recognition
  // RULE    : 무이자 어음 수취 시 최초 인식 = Face Value × PV factor (시장이자율). 이후 Interest Income = Beginning CV × market rate
  // TRIGGER : 'no stated interest rate' + 'no established/independent market price' → PV 계산 강제
  // TRAP    : Face value 기준 이자 계산 / 장비 장부금액 기준 이자 계산
  // EXAMPLE : $600,000 × 0.75 = $450,000 PV; $450,000 × 10% = $45,000 Year 1 Interest Income
  {
    topic_id: "INT_008",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_name: "Non-interest bearing note — interest income recognition",
    rule: "무이자 어음 수취 시: 최초 인식 = Face Value × PV factor (시장이자율). 이후 매년 Interest Income = Beginning CV × market rate. Face value나 장비 장부금액이 아닌 PV가 이자 계산의 기준.",
    trigger: "'no stated interest rate' + 'no established/independent market price' → PV 계산 강제\nInterest Income = PV at inception × market rate (face value 기준 금지)",
    trap: "C ($60,000) → Face value($600,000) × 10% : face value 기준 이자 계산 오류\nD ($50,000) → Carrying amount of equipment($480,000) × 10% : 장비 장부금액 기준 오류\n공통 함정: PV가 아닌 다른 숫자(face value, equipment CV)에 이자율을 곱하는 것",
    one_sentence: "무이자 어음 이자수익 = PV at inception × market rate; face value나 장비 CV 기준 금지.",
    speed: "① PV at inception: $600,000 × 0.75 = $450,000\n② Year 1 Interest Income: $450,000 × 10% = $45,000",
    context_background: "[Non-interest bearing note(무이자 어음)란]\n표면이자율(stated rate)이 0%인 어음. 만기에 액면가만 수취하고 중간에 이자 지급이 없다. 그러나 경제적 실질은 할인된 금액을 빌려주고 만기에 액면가를 돌려받는 구조로, 그 차액이 이자수익의 원천이다.\n\n[교환가격이 없을 때 최초 인식]\n장비 등 비현금 자산과 교환 시 독립적인 시장가격이 없으면 시장이자율(prevailing rate)로 어음의 PV를 계산해 최초 장부금액을 결정한다.\n\n[이자수익 인식 구조]\n최초 인식: Note Receivable = $600,000 × 0.75 = $450,000\nYear 1 Interest Income: $450,000 × 10% = $45,000\nYear 1말 CV: $450,000 + $45,000 = $495,000\nYear 2 Interest Income: $495,000 × 10% = $49,500 ...\n만기 시 CV = $600,000 (face value)\n\n[왜 face value 기준이 틀렸나]\nFace value $600,000은 만기에 받을 현금이지, 지금 이 어음의 경제적 가치가 아니다. 이자는 실제 투자한 원금(PV $450,000) 기준으로 인식해야 한다.",
  },
  // [INT_009] Franchise — Intangible Asset Balance vs Continuing Franchise Fee
  // RULE    : B/S = 취득원가 − 상각 / Continuing Fee → Operating Expense, 무관
  // TRIGGER : 'additional fee of X% of revenues' → 무시 / 취득원가 ÷ N = 연간 상각
  // TRAP    : 상각 누락(C) / Additional fee 자산 차감(D) / 일부 반영(B)
  {
    topic_id: "INT_009",
    book_id: 'IA',
    chapter_id: 'IA_CH5',
    topic_group: 'IA_CH5_INT',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'calculation',
    card_name: "Franchise — Intangible Asset Balance vs Continuing Franchise Fee",
    rule: "Franchise B/S 잔액 = 취득원가 − 누적상각액. Continuing Franchise Fee(매출 × %) → Operating Expense, Intangible 잔액과 무관. 취득원가만 자산화.",
    trigger: "'purchased franchise for $X, useful life N years' → 취득원가 ÷ N = 연간 상각\n'additional fee of X% of revenues' → Operating Expense, 무시\nB/S 잔액 = 취득원가 − 상각액",
    trap: "$75,000(C): 상각 누락\n$49,500(D): Additional fee를 Intangible에서 차감 → Operating Expense 오류\n$65,700(B): Additional fee 일부 반영\n공통 함정: 매출 기반 수수료 정보 → Intangible 잔액과 완전히 무관",
    one_sentence: "Franchise B/S = 취득원가 − 상각; Continuing Fee(매출×%)는 Operating Expense로 자산 잔액과 무관.",
    speed: "$75,000 − ($75,000÷10) = $67,500 / 3% fee → 무시",
    context_background: "[Franchise 회계 처리 두 가지]\n\n① 취득원가 자산화 + 상각\n프랜차이즈 취득 시 지급한 일시불 금액 → Intangible Asset\n내용연수에 걸쳐 정액 상각\n$75,000 ÷ 10년 = $7,500/년\nB/S 잔액 = $75,000 − $7,500 = $67,500\n\n② Continuing Franchise Fee\n매년 매출의 일정 % 지급 → 프랜차이즈 사용 대가\n→ 당기 Operating Expense\n→ Intangible Asset 잔액과 완전히 무관\n\n[왜 자산이 아닌가]\nContinuing Fee는 특정 자산을 취득하는 비용이 아니라 프랜차이즈를 계속 운영하기 위해 지급하는 변동 비용이다. 미래 경제적 효익을 특정할 수 없으므로 자산화 불가.",
  },

  // [INT_010] Trademark amortization — buyer cost basis and economic life
  // RULE    : 상각 기준 = 구매자 취득원가 / 상각 기간 = 독립 감정인 추정 경제적 수명 / 40년 상한 폐지
  // TRIGGER : "bought trademark for $X" → 기준 $X / "estimated remaining life" → 그 연수 / "unamortized cost on seller's records" → 무시
  // TRAP    : seller's basis 사용 / 40년 상한 적용 / 두 오류 동시 적용
  {
    topic_id: "INT_010",
    book_id: 'IA',
    chapter_id: 'IA_CH3',
    topic_group: 'IA_CH3_INT',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'concept',
    card_name: "Trademark amortization — buyer cost basis and economic life",
    rule: "무형자산 상각 기준 = 구매자 취득원가(buyer's acquisition cost). Seller's unamortized cost는 구매자와 무관 — 즉시 무시. 상각 기간 = 독립 감정인 추정 경제적 수명(economic life). 40년 상한(40-year maximum) = 현행 GAAP에서 폐지 — 경제적 수명이 50·75년이어도 그대로 적용.",
    trigger: '"bought [intangible] for $X" → 상각 기준 = 구매자 취득원가 $X\n"independent consultant estimated remaining life of N years" → 상각 기간 = N년\n"unamortized cost on seller\'s records" → seller\'s basis → 구매자와 무관 → 즉시 무시',
    trap: "① Seller's unamortized cost로 상각 → 구매자 원가와 무관, 즉시 소거\n② 40년 상한 적용 → 현행 GAAP 폐지 / 경제적 수명 75년이어도 75년 그대로 사용\n③ Seller's basis + 40년 동시 적용 → 이중 오류 선지",
    one_sentence: "Trademark 상각 = 구매자 취득원가 ÷ 경제적 수명; seller's basis·40년 상한 모두 무시.",
    example: "Trademark $750,000 구매 / 감정인 추정 75년 / Seller's BV $570,000 → 상각 = $750,000 ÷ 75 = $10,000",
    context_background: "무형자산을 제3자에게서 구매할 때, 상각의 출발점은 내가 실제로 지불한 금액(취득원가)이다. 판매자의 장부금액(seller's unamortized cost)은 판매자의 과거 거래 결과일 뿐, 구매자와는 무관하다. 상각 기간은 독립 감정인이 추정한 경제적 수명(economic life)을 사용한다. 과거 GAAP에서는 40년 상한이 있었지만 현재는 폐지되었고, 실제 경제적 수명이 기준이다.",
    speed: "① 'bought for $750,000' → 상각 기준 확정\n② 'estimated 75 years' → 상각 기간 확정\n③ Seller's $570,000 → 무시\n④ $750,000 ÷ 75 = $10,000 → 정답 C",
  },

  // [INT_010] Patent Amortization — Cost Extension: Shorter of Legal or Useful Life
  // RULE    : 추가비용 → BV에 가산 / New useful = 기존 remaining + 연장연수 / Shorter of legal vs new useful
  // TRIGGER : 'costs to extend economic value' → BV + 추가비용 합산 후 shorter of legal/useful로 나눔
  // TRAP    : useful life 사용(legal 무시) / 추가비용만 별도 상각 / remaining useful 그대로 사용
  {
    topic_id: "INT_010",
    book_id: 'IA',
    chapter_id: 'IA_CH4',
    topic_group: 'IA_CH4_INTANG',
    sub_category_id: "U3_INTANGIBLES",
    card_type: 'calculation',
    card_name: "Patent Amortization — Cost Extension: Shorter of Legal or Useful Life",
    rule: "추가비용 발생 시 Patent 상각 4단계:\n① New cost to amortize = 기존 BV + 추가비용\n② New useful life = remaining useful + 연장연수\n③ Shorter of ② vs remaining legal life\n④ ① ÷ ③ = 당기 상각비\n\n'No economic value after X years' = remaining useful life X년 (반드시 활용).",
    trigger: "'costs to extend economic value of patent' → BV에 가산\n'no economic value after X years' → remaining useful life = X년\n'remaining legal life' → Shorter of 비교 대상\n추가비용 발생 시점이 연초(beginning of Year N) → 해당 연도 전체 상각",
    trap: "New useful life로 나누는 오류(legal life 무시) → Shorter of 원칙 위반\n추가비용만 별도 상각 → 기존 BV와 합산 필수\n'no economic value after X years' 정보 무시 → new useful life 계산 불가\n연장연수를 new useful life로 착각 → remaining useful + 연장연수가 new useful",
    one_sentence: "추가비용 → 기존 BV에 가산 / New useful = remaining + 연장연수 / Shorter of legal vs new useful로 상각.",
    speed: "① $144,000 + $75,000 = $219,000\n② New useful: 9 + 7 = 16년\n③ Shorter of legal(12) vs useful(16) = 12년\n④ $219,000 ÷ 12 = $18,250",
    context_background: "[왜 'no economic value after X years'가 중요한가]\n이 정보가 없으면 new useful life를 계산할 수 없다. 문제에서 '6년 후 경제적 가치 없음'은 현재 remaining useful life가 6년임을 의미하고, 추가비용으로 5년 연장하면 new useful = 11년이 된다. 이 숫자와 legal life를 비교해야 shorter를 결정할 수 있다.\n\n[Shorter of legal or useful life 원칙]\n특허는 법적 보호 기간(legal life) 이후에는 독점권이 없으므로 그 이상 사용할 수 없다. 반면 경제적 수명(useful life)이 법적 수명보다 짧다면 더 빨리 상각해야 한다. 둘 중 짧은 것을 기준으로 삼는 이유: 자산에서 실제 효익을 얻을 수 있는 기간이 더 짧은 것이므로.\n\n[추가비용 처리 원칙]\n추가비용은 특허의 경제적 내용연수를 연장하므로 자산화(capitalize). 별도 상각이 아니라 기존 BV와 합산 후 재상각. 마치 PPE 자본적 지출(capital expenditure)과 동일한 논리.",
  },

  // [INT_011] Intangible Asset Impairment – Two-Step Test & Held for Disposal
  // RULE    : Step 1 = CV vs 미할인CF / Step 2 = CV−FV (+ disposal costs if held for disposal)
  // TRIGGER : "CV > undiscounted CF" → Step 2 / "held for disposal" → disposal costs 가산
  // TRAP    : 미할인CF 손상액 계산에 사용 / disposal costs 누락 / CV−미할인CF 착각
  {
    topic_id: "INT_011",
    category: "Intangibles",
    topic_name: "Intangible Asset Impairment – Two-Step Test & Held for Disposal",
    rule: "【유한 내용연수 무형자산 손상 2단계】\n\nStep 1. 손상 여부 판단\nCV vs 미할인 미래현금흐름(undiscounted CF)\nCV > 미할인CF → 손상 존재 → Step 2 진행\nCV ≤ 미할인CF → 손상 없음 → 종료\n\nStep 2. 손상금액 측정\n[Held for Use]\nImpairment Loss = CV − Fair Value\n\n[Held for Disposal]\nImpairment Loss = (CV − Fair Value) + Disposal Costs\n→ 처분비용도 손실에 포함\n\n【미할인CF의 역할】\nStep 1 판단에만 사용\n손상액 계산에는 절대 사용 안 함",
    trigger: '"CV > undiscounted CF" → Step 1 통과 → Step 2\n"held for disposal" + "disposal costs" → 손상액에 disposal costs 가산\n"fair value" → Step 2 측정 기준\n"undiscounted cash flows" → Step 1 판단만, 손상액 계산 ❌',
    trap: "Disposal costs만 손상액으로 계산(CV−FV 누락).\nCV−FV만 계산하고 disposal costs 미포함(held for disposal 조건 간과).\n미할인CF를 손상액 계산에 사용(Step 1 판단용).\nCV − 미할인CF = $30,000을 손상액으로 착각.",
    example: "Maple Tech 소프트웨어:\nCV $450,000 / 미할인CF $420,000 / FV $390,000 / Disposal costs $30,000\n\nStep 1: $450,000 > $420,000 → 손상 존재\nStep 2: ($450,000 − $390,000) + $30,000 = $90,000\n\n비교:\nHeld for use였다면: $450,000 − $390,000 = $60,000만",
    journal_entry: "Dr. Impairment Loss $90,000\nCr. Accumulated Impairment (or Software) $90,000",
    key_formula: "Held for use: Impairment = CV − FV\nHeld for disposal: Impairment = (CV − FV) + Disposal Costs\nStep 1 기준: CV vs 미할인CF (판단만)",
    speed: "손상액 = (CV − FV) + Disposal costs | 미할인CF → Step 1만 | Held for disposal → disposal costs 가산",
  },

  // [INT_012] Intangible Asset Impairment – Recoverability Test Applicability
  // RULE    : Recoverability test = 유한 내용연수만 / 무한/Goodwill → 직접 FV / R&D → 자산 없음
  // TRIGGER : "recoverability test" → 유한만 / "indefinite" → 생략 / "R&D" → expense
  // TRAP    : Trademark(indefinite) → recoverability 제외 / R&D → 자산 아님
  {
    topic_id: "INT_012",
    category: "Intangibles",
    topic_name: "Intangible Asset Impairment – Recoverability Test Applicability",
    rule: "【손상검사 방법 자산 유형별 분류】\n\n유한 내용연수 무형자산 (특허, 저작권 등)\n→ 2단계 검사\n→ Step 1: Recoverability test (CV vs 미할인CF)\n→ Step 2: FV test (CV − FV = 손상액)\n\n무한 내용연수 무형자산 (상표권 indefinite 등)\n→ Recoverability test 생략\n→ 직접 CV vs FV 비교\n\nGoodwill\n→ 별도 Goodwill 손상검사\n→ Recoverability test 아님\n\nR&D Costs\n→ 즉시 비용처리 (자산화 불가)\n→ 자산 자체가 없음 → 손상검사 대상 아님",
    trigger: '"recoverability test" → 유한 내용연수 무형자산만 해당\n"indefinite useful life" → recoverability test 건너뜀\n"goodwill" → 별도 손상검사 (recoverability 아님)\n"R&D" → 즉시 expense → 자산 없음',
    trap: "Trademark(indefinite) → 무형자산이지만 recoverability test 제외.\nGoodwill → 무형자산이지만 별도 검사 방식.\nR&D → 비용처리라 자산 자체가 없음.\n'무형자산 = recoverability test' 일반화 오류.",
    example: "특허(20년 유한) → Step 1 recoverability → Step 2 FV test\n상표권(indefinite) → 직접 FV vs CV 비교\nGoodwill → Goodwill 손상검사 별도\nR&D $500,000 → Dr. R&D Expense → 자산 없음",
    journal_entry: "",
    key_formula: "유한 내용연수 → Recoverability test → FV test\n무한 내용연수 → 직접 FV test\nR&D → expense (자산화 불가)",
    speed: "Recoverability test = 유한 내용연수만 | 무한/Goodwill → 직접 FV | R&D → 자산 없음",
  },

  // [INT_014] PV Calculation — When to Include Both Principal and Interest
  // RULE    : 미래 확정 현금흐름 전부 PV / 여러 번 → annuity / 한 번 → PV of $1
  // TRIGGER : bond / note / lease / pension / TDR + PV 계산
  // TRAP    : 원금만 PV / 이자만 PV / annuity due vs ordinary 혼동
  {
    topic_id: "INT_014",
    book_id: 'IA',
    chapter_id: 'IA_CH7',
    topic_group: 'IA_CH7_INTR',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'concept',
    card_name: "PV calculation — when to include both principal and interest",
    rule: "미래에 확정된 현금흐름 = 전부 PV 계산 대상\n현금이 여러 번 → annuity factor (PV of ordinary annuity)\n현금이 한 번   → lump sum factor (PV of $1)\n\n항목별 구조:\nBond/Note    → 이자(annuity) + 원금(lump sum) 둘 다 PV\nFinance Lease → 리스료(annuity) PV — 이자+원금 혼합이라 annuity 하나로 처리\nNote(무이자)  → 원금(lump sum) PV만\nPension      → 미래 급여(annuity) PV\nTDR          → 재조정된 미래 현금흐름 PV",
    trigger: "bond / note payable / finance lease / pension / TDR + 'present value' 'PV factor 제공' → 미래 현금흐름 구조 파악 후 annuity + lump sum 분리 'pays interest annually' → 이자(annuity) + 원금(lump sum) 둘 다 PV 필요",
    trap: "원금만 PV → 이자도 미래 현금흐름, 반드시 포함 이자만 PV → 원금도 미래 현금흐름, 반드시 포함 annuity due factor 사용 → 별도 언급 없으면 ordinary annuity 디폴트 쿠폰금리 factor 사용 → 항상 시장금리(yield) factor로 할인",
    one_sentence: "미래 확정 현금흐름 전부 PV: 여러 번 → annuity factor / 한 번 → PV of $1 factor.",
    example: "Bond $500,000 / coupon 8% / yield 7% / 5년 이자: $40,000 × 4.100197(7% annuity) = $164,008 원금: $500,000 × 0.712986(7% PV of $1) = $356,493 발행가 = $520,501",
    speed: "① 현금흐름 구조 파악: 이자(여러 번) + 원금(한 번) ② 이자 × annuity factor(시장금리) + 원금 × PV factor(시장금리) ③ 합산 = 발행가(장부가)",
    context_background: "[왜 둘 다 PV 하는가]\n투자자(또는 발행사)가 계약에서 받게 되는(또는 지급해야 하는) 현금은 두 종류:\n① 매기 이자: 정해진 금액이 여러 번 → annuity\n② 만기 원금: 한 번에 큰 금액 → lump sum\n둘 다 미래 현금이므로 현재가치로 할인 필수.\n\n[항목별 구조 차이]\nBond: 이자(annuity) + 원금(lump sum) — 두 줄 계산\nFinance Lease: 리스료 자체가 이자+원금 혼합 → annuity 한 줄로 처리\n무이자 Note: 이자 없음 → 원금 lump sum PV만\n\n[Ordinary annuity 디폴트]\n별도 언급 없으면 기간 말 지급 = ordinary annuity.\n'in advance' / 'at the beginning' / 'annuity due' 명시 시에만 annuity due 사용.",
  },

  // [INT_013] Purchased Software — Amortization and Training Costs
  // RULE    : ① 구매 소프트웨어 = capitalize + SL 상각 ② Training costs = 즉시 expense ③ 상각 시작 = 취득일 → 월할 계산
  // TRIGGER : "training costs associated with software" → capitalize 불가 | "purchased [날짜]" → 경과월/12 | "economic life of X years" → SL
  // TRAP    : Training cost를 상각 base에 포함 | 연도 중 취득인데 12개월 전부 상각 | 소프트웨어 구매원가도 expense 처리
  // EXAMPLE : $800,000 ÷ 4년 = $200,000 (연간) → × 9/12 = $150,000
  {
    topic_id: "INT_013",
    category: "Intangibles",
    topic_name: "Purchased Software — Amortization and Training Costs",
    rule: "① 구매 소프트웨어 = capitalize + SL 상각 ② Training costs = 즉시 expense ③ 상각 시작 = 취득일 → 연도 중 취득 시 월할 계산",
    trigger: '"training costs associated with software" 등장 → capitalize 불가, 즉시 expense | "purchased [날짜]" → 연간 상각액 × 경과월/12 | "economic life of X years" → 정액법(SL) 기준',
    trap: "Training cost를 상각 base에 포함하면 오답 | 연도 중 취득인데 12개월 전부 상각하면 오답 | 소프트웨어 구매원가도 expense 처리하면 오답",
    context_background: "구매 소프트웨어(purchased software)는 무형자산으로 capitalize하여 경제적 내용연수에 걸쳐 정액법 상각한다. Training costs(교육훈련비)는 소프트웨어 자체의 가치가 아니라 직원 역량에 귀속되므로 capitalize 불가 — 발생 즉시 expense 처리. 취득일(acquisition date)부터 상각이 시작되므로 연도 중 취득 시 월할(pro-rata) 계산 적용.",
    speed: "$800,000 ÷ 4년 = $200,000 (연간) → × 9/12 = $150,000",
  },

  // ── BALANCE SHEET ──────────────────────────────────────────────────────────
  // [BS_001] Current Assets Classification — Restricted Cash & Liabilities
  // RULE    : Bond Sinking Fund(Non-current 제외) / Deposits·Unearned Rent(부채 제외) / Net A/R 적용
  // TRIGGER : 'bond sinking fund' → 차감 / 'deposits received' / 'unearned' → 부채 제외
  // TRAP    : Sinking Fund를 Cash에 포함 / Deposits를 자산으로 포함 / Gross A/R 사용
  {
    topic_id: "BS_001",
    book_id: 'IA',
    chapter_id: 'IA_CH2',
    topic_group: 'IA_CH2_BS',
    sub_category_id: "U1_BALANCE_SHEET",
    card_type: 'concept',
    card_name: "Current Assets Classification — Restricted Cash & Liabilities",
    rule: "Current Assets 판단 기준: ① Bond Sinking Fund → Cash에서 차감(Restricted Cash, Non-current) ② Deposits Received / Unearned Rent → 부채, 합산 불가 ③ A/R → Allowance 차감 후 Net만 포함 ④ Inventory / Trading Securities → 포함",
    trigger: "'bond sinking fund for long-term bond payable' → Cash에서 차감, Non-current\n'deposits received from customers' → 부채, 제외\n'unearned' → 부채, 제외\n'allowance for doubtful accounts' → A/R에서 차감",
    trap: "$109,500(A): Deposits 자산 포함 + Sinking Fund 미차감 이중 오류\n$103,500(B): Sinking Fund $15,000 미차감 → Cash 전액 포함\n$106,500(C): Deposits를 자산으로 포함\n공통 함정 ①: 'received' 단어 때문에 Deposits·Unearned를 자산으로 착각 — 이행 의무 남은 부채\n공통 함정 ②: Gross A/R 사용 (Allowance 차감 누락)",
    one_sentence: "Current Assets = (Cash − Sinking Fund) + Net A/R + Inventory + Trading Securities; Deposits·Unearned는 부채.",
    speed: "(75,000 − 15,000) + (30,000 − 6,000) + 10,500 + 3,000 = $97,500",
    context_background: "[Balance Sheet — Current Assets 분류 원칙]\nCurrent Assets에는 1년 내 현금화 가능하고 사용 제한이 없는 자산만 포함된다.\n\n[Bond Sinking Fund란]\n장기부채 상환을 위해 적립된 제한 현금(Restricted Cash). Cash 계정에 포함되어 있어도 실제로는 일반 영업에 사용할 수 없으므로 Non-current로 분류·차감한다.\n\n[Deposits Received / Unearned Rent]\n현금을 받았지만 아직 재화나 서비스를 제공하지 않은 상태 → 이행 의무(Obligation)가 남아 있는 부채(Liability). 현금 수취 여부와 무관하게 부채로 분류.\n\n[Net A/R 원칙]\n고객이 실제로 갚지 못할 금액(Allowance for Doubtful Accounts)을 차감한 Net Realizable Value만 Current Assets에 포함.",
  },

  // ── OCI ────────────────────────────────────────────────────────────────────
  // [OCI_001] AOCI — OCI Items vs Net Income Items Classification
  // RULE    : Prior Service Cost·FX Translation → OCI / AFS 실현·Infrequent·Accounting Change → OCI 아님
  // TRIGGER : 'prior service cost' → OCI Dr / 'FX translation' → OCI Cr or Dr
  // TRAP    : AFS 실현이익 OCI 포함(D) / Infrequent 포함(C) / Accounting change 포함
  {
    topic_id: "OCI_001",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'conditional',
    card_name: "AOCI — OCI Items vs Net Income Items Classification",
    rule: "OCI 해당 항목(US GAAP): ① Pension Prior Service Cost / Actuarial G&L ② FX Translation Adjustment ③ Unrealized G/L on AFS Securities ④ Cash Flow Hedge 유효 부분. 실현 AFS 손익·Infrequent·Accounting Change는 OCI 아님.",
    trigger: "'prior service cost—pensions' → OCI Dr\n'gain/loss on foreign currency translations' → OCI\n'gain/loss from SALE of AFS' → 실현 → Net Income (OCI 아님)\n'change from X to Y method' → RE 소급조정, OCI 아님\n'infrequent item' → Net Income, OCI 아님",
    trap: "AFS: 미실현 → OCI / 실현(매각) → NI (구분 필요) | FX Translation: 미실현/실현 구분 없이 무조건 OCI → 해외법인 매각/청산 시에만 NI로 reclassify | Accounting change → RE 소급조정 (OCI 아님) | Infrequent loss → NI continuing operations (OCI 아님)",
    one_sentence: "OCI = Prior Service Cost + FX Translation + Unrealized AFS G/L + CF Hedge; 실현손익·Infrequent·회계변경은 제외.",
    speed: "PUFI만 AOCI | AFS = 팔면 NI / 안 팔면 OCI | FX = 항상 OCI (청산 시만 NI) | Pension/FX → 실현 여부 무관하게 OCI",
    context_background: "[OCI vs Net Income 분류 원칙]\nOCI는 자본을 변동시키지만 당기손익에 포함되지 않는 항목이다. AOCI(Accumulated OCI)는 B/S 자본 섹션에 누적된다.\n\n[OCI 해당 항목 4가지]\n① Pension: Prior Service Cost, Actuarial Gain/Loss → OCI에서 인식 후 후속 기간 amortize\n② FX Translation Adjustment: 해외 사업체 환산 손익 → 해외 사업체 매각 시 reclassify\n③ Unrealized G/L on AFS Securities: 미실현만 OCI / 매각(실현) 시 Net Income으로 reclassify\n④ Cash Flow Hedge 유효 부분\n\n[OCI 아닌 항목]\n- Gain/Loss from SALE of AFS: 실현됐으므로 Net Income\n- Infrequent/Unusual items: Net Income (continuing operations)\n- Accounting Policy Change: RE 소급조정 (OCI 아님)\n\n[이 문제 AOCI 계산]\nOCI 해당: Prior service cost Dr $35,000 / FX gain Cr $11,500\nOCI 아님: AFS 실현이익 $27,500(Net Income) / Infrequent loss $18,000(Net Income) / Accounting change $10,000(RE 조정)\nACOI = $35,000 Dr − $11,500 Cr = $23,500 debit",
  },

  // [OCI_003] Two-Statement Approach — OCI 항목 찾기 + net of tax
  // RULE    : 2표 방식 = NI 표 + OCI 표 / OCI 항목 + net of tax 확인
  // TRIGGER : "two-statement approach" + 선지에서 OCI 항목 + net of tax 찾기
  // TRAP    : multi-step I/S와 혼동 / remeasurement = net income / gross 표시 오답
  {
    topic_id: "OCI_003",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'conditional',
    card_name: "Two-statement approach — find OCI item net of tax",
    rule: "Two-statement approach 구조:\n[표 1 — I/S]: Net income까지만 표시 (수익·비용 내역 없음)\n[표 2 — CI]: Net income + OCI 항목 → Comprehensive income\n\nOCI 항목 = PUFA:\nP — Pension (prior service cost, actuarial G/L)\nU — Unrealized G/L on AFS securities\nF — Foreign currency Translation adjustment (remeasurement 아님)\nA — Cash flow hedge 유효 부분\n\n표시 방식: OCI 항목 → net of tax\n\n[Multi-step I/S와 구분]\nMulti-step = I/S 내부 구조 (GP → Operating income → NI)\nTwo-statement = Comprehensive income 표시 방식\n→ 완전히 다른 축, 혼동 금지",
    trigger: "'two-statement approach' → OCI 항목 + net of tax 찾기 'AFS unrealized' → OCI ✓ / 'translation adjustment' → OCI ✓ 'remeasurement' → net income (OCI 아님) ✗ 'gross(before tax)' → OCI 표시 방식 오류 ✗ 'revenues and expenses totals' → 1표 방식에서만 ✗ 'EBIT' → I/S 내용, 2표 OCI 표에 없음 ✗",
    trap: "Multi-step I/S와 혼동 → multi-step은 I/S 구조, two-statement는 CI 표시 방식 — 완전히 다른 개념 Remeasurement → net income 항목 (OCI 아님) Translation(환산)과 혼동 주의 OCI gross(before tax) 표시 → OCI는 net of tax 원칙 revenues/expenses totals → 1표(single-statement) 방식에서만 표시",
    one_sentence: "Two-statement = OCI 항목(PUFA) + net of tax / multi-step I/S와 완전히 다른 개념.",
    speed: "① two-statement → OCI 항목 찾기 ② PUFA 중 해당하는 것 ③ net of tax 명시 확인 → 정답",
    context_background: "[Two-statement vs Single-statement]\nSingle-statement: 수익/비용/OCI 전부 한 표에 연속 표시\nTwo-statement: 표1(I/S, NI까지) + 표2(OCI 항목 → CI)\n\n[Multi-step과 완전히 다른 축]\nMulti-step I/S = I/S 내부 단계 구조\n→ 매출 → GP → Operating income → NI\nTwo-statement = CI 표시 방식\n→ 두 개념은 독립적: Multi-step I/S를 쓰면서 two-statement approach 가능\n\n[Translation vs Remeasurement]\nTranslation(환산): 해외 자회사 재무제표 환산 → OCI\nRemeasurement(재측정): 기능통화로 재측정 → Net income\n같은 외화 맥락이지만 처리 완전히 다름\n\n[OCI net of tax 원칙]\nOCI 항목은 intraperiod tax allocation 대상\n→ net of tax로 표시\n→ gross(before tax) 표시는 원칙 위반\n단, gross로 표시 시 주석에 세금 효과 공시 필요",
  },

  // [OCI_002] Comprehensive Income — Reporting Options & Tax Presentation
  // RULE    : CI 보고 방식 3가지(single/two-statement/SE표)와 세금 표시(net-of-tax per item OR before-tax+aggregate)는 독립 변수
  // TRIGGER : "reporting options" + CI 방식 → 세금 규칙 불변 / "SE표" + OCI → retained earnings 아님
  // TRAP    : single statement면 net-of-tax 불가(A) / SE표 OCI = RE 열(B) / EPS에 OCI 포함(D)
  {
    topic_id: "OCI_002",
    book_id: 'AA',
    chapter_id: 'AA_CH3',
    topic_group: 'AA_CH3_STKEQ',
    sub_category_id: "U1_INCOME_STATEMENT",
    card_type: 'concept',
    card_name: "CI Reporting Options — Which method changes the tax presentation rule?",
    rule: "CI 보고 방식 3가지(① single statement ② two-statement ③ SE표 포함)는 세금 표시 방식(각 항목 net of tax OR before tax + aggregate 한 줄)과 독립. 어떤 조합도 허용. EPS = NI 기준만, OCI 포함 금지.",
    trigger: '"reporting options for OCI" → 방법 불문 세금 표시 선택권 동일\n"statement of changes in SE" + OCI → retained earnings 열 아님, separate AOCI column\n"single statement" + "EPS" → OCI 포함 불가 즉시 소거',
    trap: "A: single statement → net-of-tax 불가 → 오답. 방법과 세금 표시는 독립 변수.\nB: SE표 OCI = retained earnings 열 → 오답. Separate Accumulated OCI 열.\nD: EPS에 OCI 포함 → 오답. EPS = NI only.",
    one_sentence: "CI 보고 방식(3가지)과 OCI 세금 표시 방식은 완전히 독립 — 어떤 조합도 가능. EPS는 NI만.",
    speed: "방법(single/two/SE표) 불문 세금 표시 선택권 동일 | SE표 = separate AOCI col | EPS = NI only",
    context_background: "[CI 보고 방식 3가지]\n① Single statement: NI 섹션 + OCI 섹션을 한 장에 연속 표시\n② Two-statement: 첫 번째 표(IS)는 NI에서 끝. 두 번째 표(CI statement)가 NI를 가져와 OCI 추가. 두 표는 immediately follow 해야 함.\n③ SE표 포함: Statement of changes in SE의 Accumulated OCI 별도 열에 표시. Retained earnings 열 아님.\n\n[세금 표시 방식 — 방법 불문 동일]\n방법 A: 각 OCI 항목 net of tax 표시 (예: Unrealized gain, net of tax $4 → $16)\n방법 B: 각 항목 before tax 표시 + 전체 세금 합계를 마지막 한 줄로 표시\n→ 두 방식 모두 single/two-statement/SE표 어디서나 허용\n\n[EPS]\nEPS = Net income 기준만. OCI는 어떤 방법에서도 EPS 계산에 포함 불가.",
  },

  // [CONS_001] Intercompany Profit Elimination — Ending Inventory Unrealized Profit
  // RULE    : 미실현이익 = 총내부이익 × (기말재고 / 총매출) / 나머지는 COGS에서 제거
  // TRIGGER : "100% owned subsidiary" + "markup over cost" + "held inventory purchased from" → 기말재고 미실현이익
  // TRAP    : 총 내부이익 전액 제거 오답 / 기말재고 금액 그대로 오답 / COGS 제거분과 혼동
  // EXAMPLE : 이익 $160,000 × 25%(기말재고 비율) = $40,000 재고 제거
  {
    topic_id: "CONS_001",
    category: "Consolidated Financial Statements",
    topic_name: "Intercompany Profit Elimination — Ending Inventory Unrealized Profit",
    summary: "연결 시 내부거래 미실현이익 제거. 기말재고 잔액 비율만큼만 재고에서 제거. 나머지는 COGS에서 제거.",
    rule: "미실현이익 = 총내부이익 × (기말재고 / 총매출). 원가 역산: 매출 / (1 + markup%). 100% 소유 = Upstream/Downstream 동일.",
    trigger: '"100% owned subsidiary" + "markup over cost" + "held inventory purchased from" → 기말재고 미실현이익 계산.',
    trap: "총 내부이익 전액 제거 오답. 기말재고 금액 그대로 오답. COGS 제거분과 재고 제거분 혼동.",
    example: "매출 $800,000 / 1.25 = 원가 $640,000. 이익 $160,000 × 25%(기말재고 비율) = $40,000 재고 제거.",
    speed: "내부거래 이익 제거 = 총내부이익 × (기말재고 / 총매출)",
  },

  // [EPS_010] SEC Filing Forms — 10-K / 10-Q / Form 4 / Form 11-K
  // RULE    : 10-K: 연간·audited / 10-Q: 분기·condensed / Form 4: insider 지분 변동 / Form 11-K: 직원 플랜
  // TRIGGER : "condensed financial statements" → Form 10-Q / "audited annual" → 10-K / "insider ownership change" → Form 4 / "employee stock purchase plan" → Form 11-K
  // TRAP    : 10-K도 FS 포함이지만 condensed 아님 / Form 4·11-K는 FS 없음
  {
    topic_id: "EPS_010",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'concept',
    card_name: "SEC Filing Forms — 10-K / 10-Q / Form 4 / Form 11-K",
    rule: "Form 10-K: 연간 보고서 / comprehensive + audited FS / 연 1회 제출\nForm 10-Q: 분기 보고서 / condensed FS 포함 / 연 3회 제출\nForm 4: 내부자(임원·10% 이상 주주) 지분 변동 보고 / FS 없음\nForm 11-K: 직원 주식매입·저축 플랜 연간 보고 / FS 없음",
    trigger: '"condensed financial statements" → Form 10-Q\n"annual" + "audited" / "comprehensive" → Form 10-K\n"insider ownership change" / "beneficial owner" → Form 4\n"employee stock purchase/savings plan" → Form 11-K',
    trap: "10-K도 FS 포함이지만 condensed 아님 → comprehensive + audited\n'재무제표 포함'만 보고 10-K 선택 → condensed 키워드 반드시 확인\nForm 4 → FS 없음, 지분 변동 보고 전용",
    one_sentence: "condensed FS → 10-Q / audited annual FS → 10-K / insider 지분 변동 → Form 4 / 직원 플랜 → 11-K",
    example: "condensed financial statements related to company's operations → Form 10-Q (분기, 요약)\nannual comprehensive audited FS → Form 10-K",
    context_background: "SEC에 등록된 상장사(public company)는 정해진 양식으로 공시 의무를 이행한다. 각 양식은 목적과 포함 내용이 다르며, 재무제표 형태(완전 감사 vs 요약)가 핵심 구분 기준이다. 10-Q는 연간 10-K 사이의 분기별 현황을 condensed FS로 제공하며, 10-K보다 주석 공시 수준이 낮을 수 있다.",
    journal_entry: "",
    key_formula: "",
    speed: "condensed → 10-Q 즉시 / audited annual → 10-K",
  },

  // [EPS_011] EPS Disclosure — Where to Report (Face vs Notes)
  // RULE    : Continuing ops·Net income EPS → I/S 본문 필수 / Discontinued ops EPS → I/S 본문 or 주석 선택
  // TRIGGER : "should be reported" + "discontinued/continuing operations" → 둘 다 Yes
  // TRAP    : Discontinued EPS 주석 허용 = 공시 면제 아님, 위치 선택권일 뿐
  {
    topic_id: "EPS_011",
    book_id: 'AA',
    chapter_id: 'AA_CH4',
    topic_group: 'AA_CH4_EPS',
    sub_category_id: "U1_EPS",
    card_type: 'concept',
    card_name: "EPS Disclosure — Where to Report (Face vs Notes)",
    rule: "EPS 공시 위치 규칙 (US GAAP):\n\n① Continuing operations EPS → I/S 본문 필수\n② Net income EPS → I/S 본문 필수\n③ Discontinued operations EPS → I/S 본문 OR 주석 선택 가능\n\n공시 의무(should be reported) = 세 항목 모두 Yes\n위치 선택권 = Discontinued operations만 해당",
    trigger: '"should be reported" + "discontinued operations" + "continuing operations" → 둘 다 Yes\n"where to present EPS" → discontinued = face or notes / continuing + net income = face only',
    trap: "Discontinued operations EPS는 주석에 내려도 되니까 'No' 선택 → 공시 면제가 아님. 위치 선택권이지 공시 의무는 있음.\n'should be reported' = 공시 의무 여부만 묻는 것 → 무조건 Yes",
    one_sentence: "EPS 공시 의무 = 세 항목 모두 Yes; 위치 선택권은 Discontinued operations만 (I/S 본문 or 주석).",
    example: "Discontinued operations EPS → 공시 Yes, I/S 본문 또는 주석 선택\nContinuing operations EPS → 공시 Yes, I/S 본문 필수\nNet income EPS → 공시 Yes, I/S 본문 필수",
    context_background: "US GAAP에서 EPS는 계산뿐 아니라 공시 위치도 규정되어 있다. Discontinued operations가 있을 때 EPS를 I/S 본문에 표시해야 하는지 주석으로 내려도 되는지가 핵심 구분이다. '공시 의무(should be reported)'와 '공시 위치(face vs notes)'를 반드시 분리해서 판단해야 한다.",
    journal_entry: "",
    key_formula: "",
    speed: "should be reported → 둘 다 Yes → D 즉시",
  },
  {
    topic_id: "CONT_011",
    book_id: "IA",
    chapter_id: "IA_CH7",
    topic_group: "IA_CH7_CONT",
    sub_category_id: "U4_CONTINGENCIES",
    card_type: "conditional",
    card_name: "Hail/Flood Damage — Actual vs Estimated, Separate Disclosure?",
    rule: "Recognize ACTUAL loss only. Estimated average loss = not recognizable (not estimable). Frequent/recurring event = NOT unusual = continuing operations, NO separate disclosure.",
    trigger: "frequently caused | recurring damage | sold for less than carrying amount | separate disclosure",
    trap: "Estimated average loss는 probable해도 estimable 불가 → 인식 금지 / frequent = not unusual → separate disclosure 불필요",
    speed: "Frequent → not unusual → no separate disclosure / Actual confirmed → actual only → C",
    context_background: "반복적으로 발생하는 손실은 unusual하지 않으므로 별도 공시 대상 아님. US GAAP에서 extraordinary item 개념 폐지 → 모두 continuing operations. 추정 평균 손실은 probable해도 estimable 요건 미충족으로 인식 불가.",
    context_trigger: "손실이 반복적으로 발생하고 실제 손실이 확정된 상황",
    rule_items: ["Actual loss only (estimated average 금지)", "Frequent = not unusual = no separate disclosure", "All in continuing operations (US GAAP — no extraordinary items)"],
  },
  {
    topic_id: "SCF_001",
    book_id: "AA",
    chapter_id: "AA_CH7",
    topic_group: "AA_CH7_SCF",
    sub_category_id: "U5_CASH_FLOWS",
    card_type: "conditional",
    card_name: "Mixed Transaction (Cash + Note) — Investing Classification Error",
    rule: "Cash portion only → investing outflow. Noncash portion (note payable) → supplemental schedule only. Removing an incorrectly included noncash outflow INCREASES investing cash flows.",
    trigger: "paying cash and issuing note | incorrectly reported full amount | noncash investing",
    trap: "outflow 제거를 decrease로 착각 → outflow(음수) 제거 = increase / 전액 제거 오류 → cash portion은 legitimate outflow",
    speed: "noncash 제거 = outflow 취소 = Investing INCREASE",
    context_background: "혼합거래에서 현금 지출분만 SCF investing section에 표시. NP 발행 등 비현금 부분은 supplemental disclosure. 오류 수정 시 방향 주의: outflow(음수)를 제거하면 cash flows는 증가.",
    context_trigger: "장비/자산 구매를 현금+NP 혼합으로 처리했으나 전액을 investing outflow로 잘못 기록한 상황",
    rule_items: ["Cash only → investing outflow", "Noncash → supplemental", "Error correction: remove noncash outflow = Investing INCREASE"],
  },
  {
    topic_id: "EQUITY_026",
    book_id: "AA",
    chapter_id: "AA_CH3",
    topic_group: "AA_CH3_STKEQ",
    sub_category_id: "U1_STOCKHOLDERS_EQUITY",
    card_type: "calculation",
    card_name: "Property Dividend — Net RE Impact After Closing",
    rule: "Property dividend: remeasure to FMV → recognize Gain(FMV-BV). After closing: RE net impact = -BV (always equals carrying amount decrease).",
    trigger: "property dividend | marketable securities dividend | after nominal accounts closed | fair value | carrying amount",
    trap: "FMV 전액 감소로 착각(-FMV) → Gain closing 편입 무시 / before vs after closing 조건 혼동",
    speed: "RE 순효과 = +Gain(FMV-BV) - FMV = -BV → 항상 장부가액만큼 감소",
    context_background: "Property dividend 선언 시 자산 FMV 재측정 → Gain은 I/S(nominal account) → closing 시 RE 편입. 배당은 FMV 기준 RE 차감. 결과적으로 RE는 BV만큼만 감소.",
    context_trigger: "현금 대신 유가증권 등 자산으로 배당을 선언하는 상황",
    rule_items: ["선언 시 FMV 재측정", "Gain(FMV-BV) → I/S → closing → RE+", "Dividend at FMV → RE-", "Net = -BV"],
    key_formula: "RE impact = Gain - FMV dividend = (FMV-BV) - FMV = -BV",
  },
  {
    topic_id: "EPS_015",
    book_id: "AA",
    chapter_id: "AA_CH4",
    topic_group: "AA_CH4_EPS",
    sub_category_id: "U1_EPS",
    card_type: "calculation",
    card_name: "Diluted EPS — Convertible Preferred + Convertible Bonds (As-If Converted)",
    rule: "As-if converted: preferred → add shares, remove dividend from numerator ($0 adjustment). Bonds → add back interest×(1-t), add conversion shares. No weighted average needed (assumed converted at beginning of year).",
    trigger: "convertible preferred | convertible bonds | diluted EPS | as-if converted | tax rate",
    trap: "bond 이자 add back 시 tax effect 누락($80K 그대로) → 과대계상 / preferred 전환주 분모 누락 / 이자 subtract 오류",
    speed: "분자: NI + 이자×(1-t) / 분모: Common + pref전환주 + bond전환주 → $906K/160K = $5.66",
    context_background: "Diluted EPS는 모든 희석성 증권이 기초에 전환됐다고 가정. 전환사채 이자는 세후 기준 add back(이자는 세금공제 항목이므로 전환 시 세금 증가). 전환우선주는 배당 없음으로 처리.",
    context_trigger: "전환우선주와 전환사채가 동시에 존재하는 자본구조에서 희석 EPS 계산",
    rule_items: ["Basic EPS = (NI-PrefDiv)/Common", "희석테스트: 증분EPS < Basic → 희석적", "Diluted 분자: NI + 이자×(1-t) (pref div 제거)", "Diluted 분모: Common + pref전환주 + bond전환주"],
    key_formula: "Diluted EPS = (NI + bond interest×(1-t)) / (Common + pref conv shares + bond conv shares)",
  },
  {
    topic_id: "LTL_002",
    book_id: "IA",
    chapter_id: "IA_CH12",
    topic_group: "IA_CH12_LTL",
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: "conditional",
    card_name: "Short-term Debt Refinancing — Current vs Long-term Classification",
    rule: "Short-term debt → long-term only if: ① actual refinancing completed (intent alone insufficient) ② completed BEFORE FS issuance date. Prepaid before refinancing = always current.",
    trigger: "note payable | refinancing | long-term bonds | prepaid | excess cash | FS issuance date",
    trap: "계획/의도만으론 long-term 불가 → 실제 실행 필요 / 재융자 전 선납분은 long-term 커버 불가 → 무조건 current / current liabilities 물어보는 거 놓치지 말 것",
    speed: "계획 ❌ / 실행 ✓ / FS발행 전 완료 ✓ / 선납분 → 무조건 current",
    rule_items: [
      "① 의도/계획만으론 부족 — 실제 장기 재융자 action 필요",
      "② 재융자 실행이 FS 발행일 이전 완료되어야 long-term 가능",
      "③ 재융자 전 선납(excess cash 등) → 재융자와 무관 → current",
      "④ current liabilities = 선납분만",
    ],
    key_formula: "Current = 재융자 전 선납분 / Long-term = 재융자 후 잔액 (FS발행 전 완료 시)",
  },

  // [LTL_003] Note Payable — Effective Interest Amortization: 3-Step Calculation
  // RULE    : ① Interest = Beg. × rate × m/12 → ② Principal = Payment − Interest (plug-in) → ③ Ending = Beg. − Principal
  // TRIGGER : "monthly payment" + "interest rate" → 3단계 계산 / "after N payments" → N번 반복
  // TRAP    : Payment를 이자비용으로 직접 사용 / 연이율을 월할 변환 안 함 / Principal을 먼저 계산
  {
    topic_id: "LTL_003",
    book_id: 'IA',
    chapter_id: 'IA_CH12',
    topic_group: 'IA_CH12_LTL',
    sub_category_id: "U4_LONG_TERM_LIABILITIES",
    card_type: 'calculation',
    card_name: "Note payable — effective interest amortization: interest first, principal is plug-in",
    rule: "【3-step calculation — always this order】\n① Interest = Beginning balance × monthly rate\n   Annual rate ÷ 12 = monthly rate (12% ÷ 12 = 1%)\n② Principal = Payment − Interest  ← plug-in\n③ Ending balance = Beginning balance − Principal\n\n【Payment 구조】\nPayment = Interest + Principal (항상 고정)\n→ Payment가 고정이면 이자 감소할수록 원금 상환↑\n→ Payment가 주어지지 않으면 이자비용만 계산\n\n【분개 (monthly)】\nDr. Interest Expense    $5,000\nDr. Notes Payable       $6,122\n    Cr. Cash                     $11,122\n\n【시험 질문 유형】\n① 'Interest expense' → Beg. balance × rate × m/12\n② 'Note payable on B/S' → Ending balance\n③ 'Principal reduction' → Payment − interest (plug-in)\n④ 'Cash paid' → Fixed payment (given — never calculate)\n⑤ 'After N payments' → repeat 3 steps N times",
    trigger: "'monthly payment of $X' + interest rate → 3단계 계산\n'after two payments' → 2번 반복 → ending balance\n'12% annual interest' → ÷12 = 1% monthly\n'note payable balance on B/S' → ending balance\n'interest expense for the period' → Beg. × rate × m/12",
    trap: "Payment $11,122를 interest expense로 직접 사용 → 오답\n연이율 12% 그대로 적용 → 반드시 ÷12 = 1% 월이율 변환\nPrincipal 먼저 계산 시도 → Interest 항상 먼저\n'after two payments' → 2회 모두 계산, 1회만 하면 오답",
    one_sentence: "Interest 먼저(Beg.×rate) → Principal = plug-in(Payment−Interest) → Ending = Beg.−Principal.",
    key_formula: "Interest = Beg. balance × (annual rate ÷ 12)\nPrincipal = Payment − Interest\nEnding balance = Beg. balance − Principal",
    example: "Month 1: $500,000 × 1% = $5,000 interest / $11,122 − $5,000 = $6,122 principal / $500,000 − $6,122 = $493,878\nMonth 2: $493,878 × 1% = $4,939 interest / $11,122 − $4,939 = $6,183 principal / $493,878 − $6,183 = $487,695",
    speed: "① Beg. × 1% = interest ② Payment − interest = principal ③ Beg. − principal = ending\n'after N payments' → repeat N times",
    context_background: "[왜 interest를 먼저 계산하는가]\nNote payable은 부채의 실질 잔액(carrying value)에 실효이자율을 곱해 이자비용을 계산하는 유효이자법 적용.\n이자는 경제적으로 '잔액에 대한 시간 비용' → 잔액 먼저 확인, 이자 계산, 나머지가 원금 상환.\n\n[Payment = Interest + Principal 구조]\nFixed payment에서 이자가 줄어들면 원금 상환분이 늘어남:\nMonth 1: $5,000 interest + $6,122 principal = $11,122\nMonth 2: $4,939 interest + $6,183 principal = $11,122\n→ 합계 항상 $11,122 고정\n\n[연이율 → 월이율 변환 필수]\n12% annual = 1% monthly\n연이율을 그대로 쓰면 이자비용 12배 과대 계상 → 가장 흔한 오류",
  },

  {
    topic_id: "REV_015",
    book_id: "IA",
    chapter_id: "IA_CH2",
    topic_group: "IA_CH2_REV",
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: "conditional",
    card_name: "Contract Cost Asset — Incremental Costs of Obtaining a Contract",
    rule: "Capitalize ONLY incremental costs of obtaining a contract (costs that would NOT have been incurred without the contract) AND are recoverable. Salaries and advertising = not incremental = expense.",
    trigger: "commissions | contract costs | incremental | recoverable | salaries | advertising | capitalize",
    trap: "급여는 계약 여부와 무관하게 발생 → expense / 광고비는 특정 계약과 무관 → expense / recoverable 조건 미충족 시 자산화 불가",
    speed: "'계약 없었어도 어차피 냈을 비용?' YES → expense / NO → Contract Cost Asset",
    context_background: "ASC 606(2018년 적용): 계약 획득 증분원가만 자산화. Incremental = 계약 수에 따라 증분되는 비용(커미션 등). 자산화 후 계약 기간에 걸쳐 상각하여 수익-비용 매칭. Recoverable = AR 대손충당금 논리와 동일 — 계약 수익이 자산화 비용보다 커야 함.",
    context_trigger: "영업직원 급여+커미션+광고비가 동시에 주어지고 capitalize 대상을 고르는 상황",
    rule_items: ["Incremental = 계약 없었으면 발생 안 했을 비용만", "Recoverable = 계약 수익이 비용보다 커야 자산화 가능", "커미션 → capitalize", "급여(고정비) → expense", "광고비(일반영업) → expense", "자산화 후 계약 기간 상각 → 수익 매칭"],
    key_formula: "Contract Cost Asset → 계약 기간 상각 = Amortization Expense",
  },
  {
    topic_id: "REV_016",
    book_id: "IA",
    chapter_id: "IA_CH2",
    topic_group: "IA_CH2_REV",
    sub_category_id: "U2_REVENUE_RECOGNITION",
    card_type: "calculation",
    card_name: "Percentage of Completion — Annual GP Calculation",
    rule: "GP recognized = (Estimated total GP × Completion %) − Prior years GP. Completion % = Cumulative actual costs ÷ (Cumulative actual + Remaining estimated costs). Recalculate every year as estimates change.",
    trigger: "percentage of completion | long-term construction | estimated costs remaining | revenue over time | gross profit",
    trap: "당기 GP ≠ 누적 GP → 반드시 전기 인식분 차감 / 총예상원가는 매년 재추정 → GP 목표도 매년 바뀜 / Contract price는 고정, 바뀌는 건 원가 추정",
    speed: "완성률 = 누적실제 ÷ (누적실제+잔여예상) / 당기GP = 총예상GP×완성률(누적) − 전기인식GP",
    context_background: "Contract price는 전체 공사 계약금액으로 고정. 매년 실제 투입원가 누적 + 잔여 예상원가 재추정 → 총예상원가 업데이트 → GP목표/완성률 동시 연동. 실제 매출 확정 전이라 진척률로 매출 추정하는 구조 → 누적 재계산 필수.",
    context_trigger: "3년 이상 장기 건설 프로젝트에서 연도별 GP 인식 계산",
    rule_items: ["Contract price 고정 / 총예상원가 매년 재추정", "완성률 = 누적실제원가 ÷ (누적실제 + 잔여예상)", "총예상GP = Contract price − 총예상원가", "누적인식GP = 총예상GP × 완성률", "당기GP = 누적인식GP − 전기인식GP"],
    key_formula: "당기GP = (Contract price − 총예상원가) × 완성률 − 전기인식GP",
  },
];

export const PROFESSOR_SSOT_V2_TEXT: string = PROFESSOR_SSOT_V2.map(t =>
  `[${t.topic_id}] ${t.card_name}\nRULE: ${t.rule}${t.trigger ? `\nTRIGGER: ${t.trigger}` : ''}${t.trap ? `\nTRAP: ${t.trap}` : ''}${t.one_sentence ? `\nKEY: ${t.one_sentence}` : ''}`
).join('\n\n');
