export const PROFESSOR_SSOT = `
너는 아래 교수님 SSOT(Single Source of Truth)를 모든 FAR 판단의 최우선 기준으로 사용해야 한다.
일반적인 FAR 지식보다 아래 교수님 기준이 항상 우선한다.

각 토픽 구조:
[topic_id] 토픽명 — 한 줄 핵심
RULE    : 판단 기준 또는 공식
TRIGGER : 이 단어 보이면 이 규칙 적용
TRAP    : 함정 포인트
EXAMPLE : 숫자 예시

==============================================================
// [TBS_001] TBS 전략 — 계정과목 먼저, 쉬운 항목 먼저
==============================================================
RULE    : "If an amount is zero, enter 0" 지시문 있을 때만 0 먼저
          계정과목 먼저 입력 → 숫자 틀려도 부분점수 확보
          쉬운 항목 먼저 (Par 발행 채권, Fair Value > Amortized Cost인 Available-for-Sale)
          1문제 20~25분 배분
          증감 먼저 구하고 → DR/CR 나중에 변환
TRIGGER : "TBS" "simulation" "journal entry"
TRAP    : Subsequent event 100% 출제 → 반드시 공부

==============================================================
// [PPE_001] PPE / Land — 경제적 목적(intent) 먼저 판단
==============================================================
RULE    : Land 원가 = 취득·준비·철거·grading·법률비 / Scrap proceeds → 차감
          Land Improvements = 프로젝트와 독립적이고 교체 가능 (주차장, 스프링클러)
          Demolition → Land 원가 (expense 아님)
TRIGGER : "land" "demolition" "grading" "improvements"
TRAP    : 교체 가능성만으로 판단 금지 → 경제적 목적과 무관한지가 기준
EXAMPLE : Land 취득 $100,000 + 철거비 $10,000 + Scrap proceeds $2,000
          → Land 원가 = $100,000 + $10,000 - $2,000 = $108,000

==============================================================
// [PPE_002] 부대비용(Transaction Costs) — 개별 자산 vs M&A
==============================================================
RULE    : 개별 자산 구매 → 부대비용 Capitalize (자산 원가에 가산)
          M&A (사업결합) → 부대비용 즉시 Expense
TRIGGER : "legal fee" "consulting fee" "finder's fee"
TRAP    : 같은 legal fee라도 거래 형태(개별자산 vs M&A)에 따라 처리 반대
EXAMPLE : 기계 $50,000 + 설치비 $3,000 → Asset $53,000 (Capitalize)
          M&A legal fee $5,000 → Acquisition Expense $5,000 (즉시 Expense)

==============================================================
// [INT_001] Interest Expense — Bond/Lease/Note 모두 동일 공식
==============================================================
RULE    : Beginning Obligation × Effective Rate × m/12 = Interest Expense
          Bond / Lease Liability / Note Payable 모두 동일하게 적용
TRIGGER : "interest expense" "beginning balance" "effective rate"
TRAP    : 빌린 돈의 형태가 달라 보여도 공식은 항상 동일
EXAMPLE : Beginning $100,000 × 6% × 12/12 = $6,000

==============================================================
// [INT_002] Payment 분개 — Note / Lease 구조 동일
==============================================================
RULE    : Dr. Interest Expense    xxx
          Dr. Note Payable (or Lease Liability)  xxx
              Cr. Cash                xxx
          Cash 지출 = 이자(Interest Expense) + 원금상환(Liability↓)
TRIGGER : "payment" "note payable" "lease liability" "cash paid"
TRAP    : 계정 이름만 다르고 구조 완전히 동일

==============================================================
// [INT_003] Interest Capitalization — Ready for Use까지만
==============================================================
RULE    : 자본화 기간 = Acquisition ~ Ready for Intended Use
          Ready for Use 이후 발생 비용 → 전액 즉시 Expense
          US GAAP : 직접 건설(construction) 중인 자산만
          IFRS    : qualifying asset이면 구입도 자본화 가능
TRIGGER : "interest capitalization" "ready for use" "construction"
TRAP    : 완성품 구입(machine 등) → US GAAP은 자본화 불가
EXAMPLE : Building $10,000 + Remodeling $2,000 → 자본화 $12,000
          3월 1일(Ready for Use) 이후 비용 → 즉시 Expense

==============================================================
// [LEASE_000] Lease Definition — Pre-conditions — 2 conditions required for a contract to contain a lease
==============================================================
RULE    : A contract contains a lease only if BOTH conditions are met:
          ① Identified Asset
             - Specific asset must be identified
             - Supplier must NOT have substantive substitution rights
          ② Right to Control (during period of use)
             - Right to obtain substantially all economic benefits
             - Right to direct how and for what purpose asset is used
TRIGGER : "lease or not" "identified asset" "right to control" "substitution rights" "contains a lease"
TRAP    : If supplier has substantive right to substitute
          the asset → NOT a lease (treated as service contract).
          Must check BOTH conditions — one alone is not enough.
EXAMPLE : ① Office suite 301 specifically identified → Lease ✓
             "Any available office" → NOT a lease ✗
          ② Lessee decides when/how to use equipment → Control ✓
             Supplier controls usage → NOT a lease ✗

==============================================================
// [LEASE_001] Finance vs Operating 구분 — T-B-75-90-S
==============================================================
RULE    : 아래 5가지 중 하나라도 해당 → Finance Lease
          T : Title transfer (소유권 이전)
          B : Bargain purchase option (염가매수선택권)
          75: Lease term이 경제적 내용연수의 75% 이상
          90: 리스료의 현재가치(Present Value of payments)가 자산 공정가치의 90% 이상
          S : Specialized nature (대체 용도 없는 특수 자산)
TRIGGER : "finance lease" "operating lease" "lease classification"
TRAP    : 5가지 중 하나만 해당해도 Finance Lease
EXAMPLE : Lease term 8년 / Economic life 10년 → 8/10 = 80% ≥ 75% → Finance Lease
          Present Value of payments $92,000 / Asset Fair Value $100,000 → 92% ≥ 90% → Finance Lease

==============================================================
// [LEASE_002] Finance Lease 분개 3단계
==============================================================
RULE    : 1단계 Inception: Dr. Right-of-Use (ROU) Asset / Cr. Lease Obligation
          Lease Obligation = Present Value of (Fixed Payment +/- Option / Guaranteed Residual Value)
          Initial Direct Cost → Cash 추가 + Right-of-Use Asset 가산
          2단계 Payment: Dr. Interest Expense + Dr. Lease Obligation / Cr. Cash
          Interest = Beginning Lease Obligation × 할인율
          Annuity Due 첫 해: Dr. Lease Obligation / Cr. Cash (이자 없음)
          3단계 Depreciation: Dr. Depreciation Expense / Cr. Accumulated Depreciation
          1~2번 조건 → Useful Life 기준 / 3~5번 조건 → Lease Term 기준 (Shorter)
TRIGGER : "finance lease" "ROU" "lease obligation" "depreciation"
TRAP    : 할인율 = Implicit rate 우선 / 모르면 Incremental Borrowing Rate (IBR)

==============================================================
// [LEASE_003] Operating Lease — 3가지 핵심 계산 (I/S 균등 / Liability / ROU)
==============================================================
RULE    : Operating Lease — 3가지 핵심 계산
          ① I/S Lease Expense (항상 균등)
             Dr. Lease Expense    xxx
                 Cr. Cash             xxx (or Cr. Lease Liability)
             → Straight-line으로 균등 인식
             → 주어진 Lease Expense 그대로 I/S에 반영
          ② Lease Liability 계산
             → Finance Lease와 동일하게 풀기
             → Beginning × Rate × m/12 = Interest
             → Payment - Interest = 원금 상환
             → Ending Liability = Beginning - 원금 상환
          ③ ROU 잔액
             → Lease Liability와 동일하게 움직임
             → 문제에서 별도 계산 없으면 Liability = ROU로 풀기
             → 별도 계산 주어지면 그걸 우선
TRIGGER : "operating lease" "rent expense" "straight-line" "even out" "lease expense"
TRAP    : Finance Lease와 달리 ROU 상각을 별도로 계산하지 않음.
          Lease Expense 하나로 I/S 처리 끝.
          ROU 감소 = Lease Expense - Interest 부분이지만
          시험에서는 Liability = ROU로 풀면 대부분 정답.
EXAMPLE : Annual lease payment $10,000 / 5년 / 이자율 6%
          Year 1 Lease Expense = $10,000 (균등, I/S 그대로)
          Year 1 Interest = Beginning Liability × 6%
          Year 1 원금 상환 = $10,000 - Interest
          ROU 잔액 = Lease Liability 잔액과 동일

==============================================================
// [LEASE_004] Lessee RVG — Commencement Date 기준
==============================================================
RULE    : Residual Value Guarantee (RVG) = Commencement Date 기준으로 Present Value 계산에 반영
          Lessee가 보증한 금액만 포함 / Unguaranteed → 포함 안 함
TRIGGER : "residual value guarantee" "RVG" "lessee"
TRAP    : Unguaranteed Residual Value Guarantee → Lessee 계산 제외 (2024~ Lessor 출제 없음)
EXAMPLE : Guaranteed RVG $10,000 → Lease Payment에 Present Value 포함
          Unguaranteed RVG $5,000 → Lessee 계산에서 제외

==============================================================
// [LEASE_005] Net of Current Portion / Leasehold Improvement
==============================================================
RULE    : Current portion = 다음 1년 내 상환될 원금 (이자 제외)
          Leasehold Improvement 상각 = Shorter of 잔여 Lease term / 경제적 내용연수
          갱신옵션 probable → 잔여기간에 포함
TRIGGER : "current portion" "leasehold improvement" "shorter of"
TRAP    : Current portion = 납입액 전체 X → 원금 부분만
EXAMPLE : Lease 잔여기간 3년 / Improvement 내용연수 5년
          → Shorter = 3년 기준 상각
          Current portion: 내년 원금 상환액 $8,000 (이자 $2,000 제외)

==============================================================
// [LEASE_006] Finance vs Operating 비용 패턴 비교
==============================================================
RULE    : Finance  : 초반 비용 高(이자↑), 후반 비용 低(이자↓)
          Operating: 전체 비용 Flat (균등)
          최종 총비용은 동일
TRIGGER : "total expense" "expense pattern" "compare lease"
TRAP    : Finance Lease가 초반에 비용 더 많이 인식
EXAMPLE : Finance Lease 연 납입 $10,000 / 4년
          1년차: Interest $3,170 + Depreciation $2,500 = $5,670
          4년차: Interest $794 + Depreciation $2,500 = $3,294 (비용 감소)
          Operating Lease: 매년 $10,000 균등 (Flat)

==============================================================
// [REV_001] Significant Financing Component — 1년 기준
==============================================================
RULE    : 1년 이하 → Practical Expedient: face value 그대로 Revenue
          1년 초과 → Present Value 할인 → Revenue / 차액 = Interest Revenue 기간 배분
          Dr. Note Receivable / Cr. Revenue(Present Value) / Cr. Discount on Note(차액)
TRIGGER : "payment due in X months/years" → 1년 기준 먼저 판단
TRAP    : 현가표 주어져도 1년 이하면 사용 X
          혼합문제: 6개월 note = face value / 2년 note만 Present Value 적용

==============================================================
// [REV_002] Contract Modification — 별도 계약 vs 기존 변경
==============================================================
RULE    : 둘 다 충족 → Separate Contract
          ① Scope 증가 ② Distinct goods/services 추가
          하나라도 미충족 → Modification
TRIGGER : "modification" "additional goods" "price change" "scope"
TRAP    : 가격만 바뀜 → Modification / 새것 추가 → Separate Contract
EXAMPLE : 공사비 인상 → Modification / 건물 1개 추가 → Separate Contract

==============================================================
// [REV_003] Premium Coupon — 경품 개수 기준
==============================================================
RULE    : 경품 개수를 기준으로 계산
TRIGGER : "premium coupon" "redemption" "prize"
TRAP    : 판매 개수 기준으로 풀면 오답
EXAMPLE : 쿠폰 1,000장 발행 / 경품 1개당 쿠폰 10장 필요
          → 예상 회수율 60% → 예상 경품 = 1,000 × 60% / 10 = 60개
          → Premium Expense = 60개 × 경품원가

==============================================================
// [REV_004] Warranty Assurance-type — Income Statement 접근법
==============================================================
RULE    : 총매출 × total warranty % = Warranty Expense (Income Statement 접근법)
          연도별 % 쪼개기 X → 총매출 기준 한번에
TRIGGER : "warranty" "assurance-type" "estimated warranty"
TRAP    : 연도별로 % 나눠 계산하면 오답
EXAMPLE : 총매출 $500,000 / Warranty % 2%
          → Warranty Expense = $500,000 × 2% = $10,000
          (1년차 1%, 2년차 1% 쪼개기 X → 총 2% 한번에)

==============================================================
// [INV_001] Inventory Periodic System — COGS & 방향성
==============================================================
RULE    : COGS = Beginning Inventory + Purchases - Ending Inventory
          Ending Inventory ↑ → COGS ↓ (반비례) → Net Income ↑ → Tax ↑ (비례)
          FIFO(Ending Inventory 높음→Net Income 높음) vs LIFO(Ending Inventory 낮음→Net Income 낮음→절세)
TRIGGER : "periodic system" "COGS" "ending inventory"
TRAP    : Ending Inventory와 COGS는 반비례 / Ending Inventory와 Net Income·Tax는 비례

==============================================================
// [TAX_001] Deferred Tax — Enacted rate 사용
==============================================================
RULE    : Enacted tax rate 사용 (current rate 아님)
          Permanent: Life insurance premium / Dividends Received Deduction (DRD) → 차이 = 0
          Net Operating Loss (NOL) Carryforward → Temporary difference로 처리
          Valuation Allowance (V/A) 감소 → Deferred Tax Asset (DTA) ↑ → Tax Expense ↓ → Net Income ↑
          Tax benefit = Deferred Tax Asset (DTA) - Valuation Allowance (V/A) (Balance Sheet 기준)
TRIGGER : "deferred tax" "enacted rate" "DTA" "DTL" "NOL"
TRAP    : Current rate 사용 금지 → 반드시 Enacted rate
EXAMPLE : Temporary difference $100,000 / Enacted rate 25%
          → Deferred Tax Liability = $100,000 × 25% = $25,000
          세율 30%→25% 변경: 기존 Deferred Tax Liability $30,000 × (5%/30%) = $5,000 감소

==============================================================
// [EPS_001] EPS — Income Available to Common 먼저 계산
==============================================================
RULE    : Income Available to Common (IAC) = Net Income - 우선주 배당
          Cumulative preferred → declared 무관 차감
          Noncumulative preferred → declared된 것만 차감
          주식배당 Weighted Average Outstanding shares (WAO) → 소급 적용 (월할 아님)
          Convertible Bond Interest expense → 기초 Book Value × 유효이자율
          Anti-dilutive → 포함 금지
TRIGGER : "EPS" "preferred dividend" "convertible bond" "diluted"
TRAP    : 우선주 배당 월할 계산 X / Pretax interest → After-tax
EXAMPLE : Net Income $100,000 / Cumulative preferred dividend $10,000
          → Income Available to Common = $90,000 / Weighted Average Outstanding = 45,000주
          → Basic EPS = $90,000 / 45,000 = $2.00

==============================================================
// [INVEST_001] Investments — 분류별 처리
==============================================================
RULE    : Fair Value Through Net Income (FVTNI): 연말 Fair Value → Net Income / 주식배당 → No entry
          지분법: Net Income(+) / 배당(-) / 상각(-) / Fair Value → No entry
          Available-for-Sale (AFS) Credit Loss = Min(Amortized Cost - PV of Expected Cash Flows, Amortized Cost - Fair Value) / Fair Value > Amortized Cost이면 0
          Held-to-Maturity (HTM): Fair Value 무시, Amortized Cost - PV of Expected Cash Flows 전액 Credit loss
          Par 발행 채권 → 상각 없음, 먼저 풀기
TRIGGER : "FVTNI" "equity method" "AFS" "HTM" "credit loss"
TRAP    : 주식 분류변경 불가 (채권만 가능)
EXAMPLE : 지분법: Net Income $50,000 × 30% = $15,000 (Dr. Investment)
                  배당 $10,000 × 30% = $3,000 (Cr. Investment)
          Available-for-Sale Credit Loss: Amortized Cost $100,000 / PV of Expected Cash Flows $85,000 / Fair Value $90,000
          → Min($15,000, $10,000) = $10,000

==============================================================
// [EQUITY_001] Equity — 주식수 카운팅 핵심
==============================================================
RULE    : Small dividend (<20~25%) → 시장가 / Large → par value / Stock split → No Journal Entry
          Par value method 재발행 이익 → Additional Paid-in Capital - Common Stock (APIC-CS) (Gain 아님)
          Subscription receivable → Contra-equity (Asset 아님)
          자사주 제외하고 cash dividend 계산
TRIGGER : "stock dividend" "treasury stock" "subscription" "warrant"
TRAP    : Subscription receivable → Asset 처리 금지
EXAMPLE : Small stock dividend 10% / 시장가 $15 / Par $1 / 발행주식 10,000주
          → Dr. Retained Earnings $15,000 / Cr. Common Stock(Par) $1,000 / Cr. Additional Paid-in Capital $14,000
          Stock split 2:1 → No Journal Entry (주석만)

==============================================================
// [CF_001] Cash Flow (간접법) — 조정 항목
==============================================================
RULE    : 이자비용 → 조정 없음 (Net Income에 이미 반영)
          Held-to-Maturity (HTM) Credit loss → 비현금 +조정
          Gain → Cash from Operations (CFO) 제거 / Cash proceeds → Cash from Investing (CFI) 별도
          Loan 입출금 → Netting 금지
          지분법 이익 → Cash from Operations (CFO) 차감
          Available-for-Sale (AFS) 미실현이익 → 조정 없음
TRIGGER : "cash flow" "indirect method" "operating" "investing"
TRAP    : Gain은 Cash from Operations 제거 후 Cash from Investing 별도 / 지분법이익 차감
EXAMPLE : Net Income $50,000 / Gain on sale $8,000 / Depreciation $5,000
          → Cash from Operations = $50,000 - $8,000 + $5,000 = $47,000
          → Cash from Investing: Proceeds from sale 별도 기재

==============================================================
// [CHANGE_001] Accounting Changes — 변경 유형별 처리
==============================================================
RULE    : Principle → Retrospective (예외: LIFO는 Prospective)
          Estimate → Prospective
          Error → Prior period Retained Earnings 수정
          Ending Inventory error → 자동조정 / 감가상각 error → 비자동조정
TRIGGER : "accounting change" "estimate" "error correction" "retrospective"
TRAP    : 회계변경 정당성 없으면 Auditor 적정의견 X
EXAMPLE : Principle 변경(FIFO→Weighted Average Cost) → 소급적용, 기초 Retained Earnings 수정
          Estimate 변경(내용연수 5년→8년) → 당기부터 Prospective

==============================================================
// [CONSOL_001] Consolidation — 내부거래 100% 제거
==============================================================
RULE    : Full Goodwill = 연결 / Partial Goodwill = 지분법
          내부거래 100% 제거 (지분율 무관)
          Downstream → Noncontrolling Interest (NCI) 영향 없음
          Upstream → Noncontrolling Interest (NCI)에 지분율만큼 영향
TRIGGER : "consolidation" "NCI" "intercompany" "goodwill"
TRAP    : 내부거래 제거는 지분율과 무관하게 100%
EXAMPLE : 내부 재고 거래 $20,000 (미실현이익 $5,000)
          → 지분율 무관 $5,000 전액 제거
          Downstream: Noncontrolling Interest 영향 없음
          Upstream: Noncontrolling Interest 지분율(40%)만큼 $2,000 영향

==============================================================
// [FV_001] Fair Value Hierarchy — Level 판단
==============================================================
RULE    : Level 1: Quoted + Active + Identical 3가지 모두
          Level 3: Unobservable (내부자료 = 무조건 Level 3)
          주된시장 없으면 → 유리한 시장 (Net Realizable Value max)
TRIGGER : "fair value" "level 1" "level 2" "level 3" "hierarchy"
TRAP    : 내부자료 → 무조건 Level 3
EXAMPLE : NYSE 상장주식 시가 $50 → Level 1
          비상장 채권 브로커 호가 → Level 2
          내부 Discounted Cash Flow (DCF) 모델 사용 → Level 3

==============================================================
// [NFP_001] NFP — 기부수익·비용 인식
==============================================================
RULE    : Board designation → quasi endowment (without restriction)
          기부수익 Long-term restricted → Cash from Financing Activities (CFF) (Cash from Operations 아님)
          "services provided" "used in operations" → Expense
TRIGGER : "NFP" "nonprofit" "endowment" "restricted" "donation"
TRAP    : Board designation → without restriction (외부 제약 없음)
EXAMPLE : Board가 $100,000 지정 → Without restriction 유지 (수익 영향 없음)
          외부 기부자 장기제한 $50,000 → Cash from Financing Activities (Cash from Operations 아님)

==============================================================
// [PART_001] Partnership Liquidation — 순서
==============================================================
RULE    : 자산매각/손실분배 → 채권자 → Advance → 파트너 순서
TRIGGER : "partnership" "liquidation" "dissolution"
TRAP    : 순서 틀리면 전체 오답
EXAMPLE : 자산 $100,000 매각 / 손실 $20,000 → A:B:C = 3:3:4 배분
          → 채권자 $60,000 → Advance 상환 → 잔여 파트너 배분

==============================================================
// [VAL_001] Valuation — 계정과목별 기준
==============================================================
RULE    :
  Cash: Face Value
  AR: Net Realizable Value (NRV) = AR잔액 - Allowance
  Inventory: Lower of Cost or Net Realizable Value (NRV)
    FIFO/Average: Net Realizable Value / LIFO: Replacement Cost
  Available-for-Sale (AFS): Fair Value, Unrealized G/L → Other Comprehensive Income (OCI)
  Held-to-Maturity (HTM): Amortized Cost
  Property, Plant & Equipment (PP&E): Historical Cost - Accumulated Depreciation
  Intangible: Cost - Amortization (잔존가치 0)
  Bond: PV of (Principal + Interest) × Market Rate at issuance
  Projected Benefit Obligation (PBO): Beginning Balance + Service Cost + Interest + Actuarial - Benefits Paid
  Stock Option: Fair Value at Grant Date, Service Period 동안 비용
TRIGGER : "valuation" "measurement" "lower of" "NRV" "amortized cost"
TRAP    : US GAAP Impairment → 손상 후 회복 불가
EXAMPLE : Inventory FIFO: Cost $100 / Net Realizable Value $90 → $90 (Lower of)
          Held-to-Maturity Bond: 취득가 $95,000 → Fair Value $98,000 변동 무시 → $95,000 유지
          Property, Plant & Equipment: 취득 $200,000 - Accumulated Depreciation $50,000 = Book Value $150,000

==============================================================
// [CONT_001] Gain Contingency — 항상 $0
==============================================================
RULE    : Gain Contingency accrual 금지 → 답 = $0
          보수주의 원칙 (이익은 실현 전 accrual 불가)
          Loss: Probable + Estimable → accrual 가능
TRIGGER : "gain contingency" "accrue" "contingent gain"
TRAP    : Loss와 반대 → 금액 불문 항상 $0
EXAMPLE : 소송 승소 예상 손해배상 $500,000
          → "What amount should accrue?" → $0
          (금액·확률 불문 항상 $0)

==============================================================
// [INTANG_001] Patent Legal Defense — 기존 계정에 가산
==============================================================
RULE    : 승소: Dr. Patent (기존 계정에 가산) / Cr. Cash
                잔여 내용연수로 상각
          패소: 방어 비용 전액 즉시 Expense
TRIGGER : "patent" "legal defense" "lawsuit" "successfully defended"
TRAP    : 별도 무형자산 계정 생성 X → 기존 Patent 계정에 가산
          정답: "Debit the patent account and amortize it"

==============================================================
// [SW_001] Software to be Sold — MAX(비율법, 정액법)
==============================================================
RULE    : MAX(①비율법, ②정액법)
          ① 비율법: 당기매출 / 총예상매출 × 장부금액
          ② 정액법: 장부금액 / 잔여내용연수
TRIGGER : "software to be sold" "amortization" "revenue ratio"
TRAP    : 항상 MAX 선택
EXAMPLE : 취득 $1,200,000 / 4년 / 총예상매출 $3,000,000 / 당기매출 $1,000,000
          ① 1,000,000/3,000,000 × 1,200,000 = $400,000
          ② 1,200,000/4 = $300,000 → MAX = $400,000

==============================================================
// [ANNUITY_001] Annuity Due — Ordinary Annuity에서 변환
==============================================================
RULE    : ① (n-1)년 방법 ← 시험장 권장
             PV of Ordinary Annuity for (n-1) years + $xxx(1회)
          ② (1+r) 방법
             PV of Ordinary Annuity for n years × (1+r)
          둘 다 주어지면 ①번 선택 (소수점 없음, 실수 방지)
TRIGGER : "annuity due" "beginning of period" "payments at beginning"
TRAP    : Ordinary factor 그대로 사용 금지 → 반드시 변환
EXAMPLE : PV(10%,3년) + $1 = 2.4869 + 1 = 3.4869
          또는 3.1699 × 1.1 = 3.4869
`
