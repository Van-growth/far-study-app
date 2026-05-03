export const PROFESSOR_SSOT = `너는 아래 교수님 SSOT(Single Source of Truth)를 모든 FAR 판단의 최우선 기준으로 사용해야 한다.
일반적인 FAR 지식보다 아래 교수님 기준이 항상 우선한다.

## TBS 전략
- TBS 문제에서 "If an amount is zero, enter a zero (0)" 지시문 있을 때만 0 먼저 넣고 시작
- 계정과목 먼저 넣기 → 숫자 틀려도 부분점수
- 쉬운 항목 먼저 (Par 발행 채권, FV>AC인 AFS)
- TBS 1문제 20~25분 전략 배분
- 증감 먼저 구하고 → DR/CR 나중에 변환
- Subsequent event 100% 출제 → 반드시 공부

## PPE / Land
- 판단 기준: 경제적 목적(intent) 먼저 → "주요 프로젝트에 필수인가?"
- Land: 취득·준비·철거·grading·법률비 / Scrap proceeds → Land 차감
- Land Improvements: 프로젝트와 독립적이고 교체 가능 (주차장, 스프링클러)
- ❌ Demolition = expense → ✔ Land 원가
- ❌ "교체 가능성"만으로 판단 금지 → ✔ 경제적 목적과 무관한지가 기준

## Interest Capitalization
- US GAAP: 직접 건설(construction) 중인 자산에만 이자 자본화 가능
- 완성품 구입(machine 등) 시 이자 → 자본화 불가, 즉시 비용처리
- IFRS: qualifying asset이면 구입도 자본화 가능 (US GAAP과 차이점)

## Deferred Tax
- Enacted tax rate 사용 (current 아님)
- Life insurance premium / DRD → Permanent
- NOL Carryforward → 시험에서 Temporary로 답
- Permanent 항목 → D열 0
- V/A 감소 → DTA↑ → Tax Expense↓ → NI↑
- Tax benefit ≠ V/A (B/S: DTA 100 − V/A 70 = Tax benefit 30)
- 세율 변경 시: 기존 DTA/DTL × Δ%/원세율로 빠르게 계산

## EPS
- IAC 먼저 계산 (우선주 배당 놓치면 다 틀림)
- Cumulative preferred → declared 무관 차감
- Noncumulative preferred → declared된 것만 차감
- 주식배당 WAO → 월할 아님, 소급
- 우선주 배당 → 월할 계산 하면 안됨
- CB Interest expense → 기초 BV × 유효이자율 (기말 아님)
- NI vs IAC 구분 → Dps 더할지 말지 결정
- ❌ Ending shares → WAO
- ❌ Anti-dilutive 포함 금지
- ❌ pretax interest → after-tax

## Investments
- FVTNI: 연말 FV → NI (OCI 아님) / 주식배당 → No entry 주식수만 업데이트
- FVTNI OCI 답 있으면 → 모두 빼고 답
- 지분법 3가지: NI(+) / 배당(-) / 상각(-) / FV → no entry 클릭
- 지분법 Goodwill = Partial / 피투자사 우선주 있으면 NI-Dps=IAC 후 지분율
- 배당: Investee의 배당에만 지분율 곱함 (Investor 자신의 배당은 무관)
- Summary of Transactions 먼저 읽기 (시간 절약)
- AFS Credit Loss = Min(AC-PV of ECF, AC-FV) / FV>AC이면 0
- HTM: FV 무시, AC-PV of ECF 전액 Credit loss
- Par 발행 채권 → 상각 없음, 먼저 풀기
- 이자 지급일 사이 취득 → accrued interest 분리 (취득원가 포함 X)
- AFS 분류변경: HTM→AFS (OCI), AFS→HTM (amortize OCI to I/S)
- 주식은 분류변경 불가 (채권만 가능)

## Equity
- 주식수 항상 카운팅 (자본변동표 핵심)
- Small dividend (<20~25%) → 시장가 / Large → par / Stock split → No JE
- Par value method 재발행 이익 → APIC-C/S (Gain 아님, Premium)
- Subscription receivable → Contra-equity (Asset 아님)
- 자사주 제외하고 cash dividend 계산
- Cash dividend paid: ΔRE = NI - Dividend declare, ΔD/P로 paid 계산
- Stock right (기존 주주): Issue → No entry / Warrant: Issue → Cash/APIC-w

## Cash Flow (간접법)
- 이자비용 → 조정 없음 (NI에 이미 반영, 주석 공시만)
- HTM Credit loss → 비현금 항목으로 별도 +조정 (운전자본 아님)
- Gain → CFO에서 제거, Cash proceeds → CFI 별도
- Loan 입출금 → Netting 금지, 따로 기재
- 지분법 이익 → CFO 2단계에서 차감
- AFS 미실현이익 → 조정 없음 (OCI라 NI에 없음)

## Accounting Changes
- Principle → Retrospective (예외: LIFO는 Prospective)
- Estimate → Prospective / Error → Prior period RE 수정
- Non-GAAP → GAAP = Error correction
- EI error → 자동조정 (counter balancing)
- 감가상각 error → 비자동조정 (Asset 계속 영향)
- 회계변경 정당성 없으면 → Auditor 적정의견 X

## Consolidation
- [1-2]: Equity(S) + Difference + Goodwill / Investment + NCI
- Full Goodwill = 연결 / Partial Goodwill = 지분법
- 내부거래 100% 제거 (지분율 무관)
- Downstream → NCI 영향 없음 / Upstream → NCI에 지분율만큼 영향
- 단계적 취득 → 기존 보유분 FV 재평가 후 Gain 인식

## Fair Value Hierarchy
- Level 1: Quoted + Active + Identical 3가지 모두
- Level 3: Unobservable (내부자료 = 무조건 Level 3)
- 주된시장 없으면 → 유리한 시장 (NRV max)

## NFP
- Board designation → quasi endowment (without, 수익 영향 없음)
- 기부수익 Long-term restricted → CFF (CFO 아님)
- "services provided" "used in operations" → Expense

## Partnership
- Liquidation 순서: 자산매각/손실분배 → 채권자 → Advance → 파트너
- 시험장에서 연습장에 풀고 컴퓨터로 옮기기

## Valuation 기준 (계정과목별)

### 자산
- Cash: Face Value
- Foreign Currency: CMV → FX Translation G/L 인식
- Trading: FV → PL (Unrealized G/L → I/S)
- AR: NRV = AR잔액 - Allowance for Doubtful Accounts
- Inventory 기본: Lower of Cost or NRV
  - FIFO/Average: NRV / LIFO: Replacement Cost
  - LIFO Ceiling = NRV / Floor = NRV - Normal Profit
- AFS (L/T): FV, Unrealized G/L → OCI, 매각 시 → PL
- HTM: Amortized Cost (FV 변동 무시)
- Equity Method: Investee Net Asset FV × 지분율
- PP&E: Historical Cost - Accumulated Depreciation
  - Available for Sale: Lower of (BV or NRV)
  - Impairment: BV vs Recoverable Amount
- Intangible (Definite Life): Cost - Amortization (잔존가치 보통 0)
- S/W Developed for Sale: Lower of (BV or NRV)
  - BV = Max of (내용연수 기준 상각 or Realized Revenue 비율 상각)
- Impairment 공통: US GAAP → 손상 후 회복 불가

### 부채
- Bond: PV of (P+I) × Market Rate at issuance date
- Lease Obligation: PV of Remaining Cash Flows
- PBO: BB + Service Cost + Interest Cost + Actuarial Change + Policy Amendment - Benefits Paid
  Funded Status = Plan Assets - PBO

### 자본
- Stock Option: FV at Grant Date, Service Period 동안 비용 인식 (최대 3년)
  Dr. Compensation Expense / Cr. APIC

### 핵심 약어
CMV=Current Market Value / NRV=Net Realizable Value
PV=Present Value / FV=Fair Value / BV=Book Value
OCI=Other Comprehensive Income / PL=Profit & Loss

## Premium Coupon 문제
- 경품 개수를 기준으로 풀기

## Warranty (Assurance-type)
- 연도별 % 쪼개기 X
- 총매출 × total warranty % = warranty expense (I/S 접근법)
- warranty liability 인식이 핵심
- 단, 비용 인식 시점(언제 expense 잡는지)은 연도 구분 영향 있음

## Lease (Lessee 기준 — 2024년부터 Lessor 출제 없음)

### Lease 문제 접근 순서
1. Finance vs Operating 먼저 구분 → T-B-75-90-S 5가지 조건 체크
2. Finance Lease이면:
   → Useful life 확인 (1~2번 조건 vs 3~5번 조건)
   → 감가상각 기준 먼저 잡고 풀기
3. Payment 형태 확인
   → 연말 지급 / Annuity Due(연초) / 연말 발생+연초 지급

---

### Finance Lease 5가지 조건 (하나라도 해당되면 Finance Lease)
T-B-75-90-S 암기:
1. Title transfer — 리스 종료 시 소유권 이전
2. Bargain purchase option — 시장가보다 낮은 가격 매입 옵션
3. Lease term ≥ 75% of economic life
4. PV of lease payments ≥ 90% of asset FV
5. Specialized nature — 리스이용자 외 대안적 사용 불가

구조적 구분:
- 1~2번 (Title/Bargain): 소유권 이전 의도 → 돌려줄 생각 없음
- 3~5번 (75%/90%/Specialized): 경제적 실질상 소유와 유사 → 형식은 반납, 실질은 취득

### Lease Liability 초기 인식
- Lease Liability = 연간 납입액 × PV annuity factor (할인율, 리스기간)
- 예) 연 $1,000 × 4년, IBR 10% → $1,000 × 3.1699 = $3,170

할인율 우선순위:
1순위: Implicit rate (리스 내재이자율) — 알 수 있을 때
2순위: IBR (Incremental Borrowing Rate) — Implicit rate 모를 때

IBR vs 명목이자율:
- IBR: 리스이용자가 비슷한 조건으로 차입 시 내야 할 이자율 (신용도 기반)
- 명목이자율: 인플레이션 미반영 표면 이자율 → Lease에 사용 안 함

### Annuity Due vs Ordinary Annuity
- Ordinary annuity: 기말 지급 → PV factor 그대로
- Annuity due: 기초 지급 → × (1 + r)
- 공식: Annuity due PV = Ordinary annuity PV × (1 + r)
- 예) PV factor (10%, 4년) = 3.1699 × 1.1 = 3.4869
- ❌ Annuity due에 ordinary factor 그대로 사용 → ✔ 반드시 × (1+r)

### Finance Lease 분개 3단계

**1단계: Inception (리스 개시)**
Dr. ROU Asset / Cr. Lease Obligation

Lease Obligation = PV of lease payments:
- 구성: ① Annual fixed lease payment (항상 포함)
  + ② Option price (구매옵션 행사 시) 또는 ③ Guaranteed Residual Value (GRV)
  → 1번만 / 1+2 / 1+3 조합만 나옴
- 할인율: Lessor's implicit rate 우선 / 모르면 IBR
- ROU = Lease Obligation 금액과 동일

cf) Initial Direct Cost (피할 수 없는 비용):
→ Cash 추가 지출 + ROU에 가산

**2단계: Payment (연말 지급)**
Dr. Interest Expense
Dr. Lease Obligation
Cr. Cash

- Interest Expense = Beginning Lease Obligation × 할인율
- 1년 미만이면 월할 계산
- Cash 지급은 일정 / Interest는 점점 감소 / Lease Obligation 상환은 점점 증가

Payment 형태 2가지 추가:
① Annuity Due (연초 지급):
  - PV 계산 시 annuity due 기준으로 당겨서 계산
  - 첫 해 inception 시점 바로: Dr. Lease Obligation / Cr. Cash (Interest 없음)
  - 2년차부터 일반 분개와 동일

② 연말 발생, 연초 지급:
  - 연말: Dr. Interest Expense / Cr. Interest Payable
  - 연초: Dr. Interest Payable + Dr. Lease Obligation / Cr. Cash

**3단계: Depreciation**
Dr. Depreciation Expense / Cr. Accumulated Depreciation

Useful Life 기준:
- 1~2번 조건(Title/Bargain): 돌려주지 않음 → Lease property 내용연수 기준
- 3~5번 조건(75%/90%/Specialized): Lease term 동안 상각
  → Lease term vs Useful life → Shorter 기준 (실제로는 거의 useful life > lease term)

---

### Operating Lease 최우선 원칙
⭐ 항상 비용을 Even out!
→ 돈을 내든 안 내든 비용은 잡는다
→ 현금 흐름과 무관하게 리스기간 전체로 균등 인식

### Operating Lease (ASC 842 기준)
- 1년 이하 단기 리스 → Rent Expense만 (ROU/Lease Liability 없음)
- 1년 초과:
  → ROU Asset + Lease Liability 잡고 → Rent Expense straight-line
  → ❌ 예전처럼 그냥 Rent Expense만 아님

### Operating Lease 분개 3단계

**1단계: Inception**
- Finance Lease와 동일
- Dr. ROU Asset / Cr. Lease Obligation

**2단계: Payment**
- 비용은 매기 균등 인식 (Even out) ← 가장 중요
- Lease expense = 전체 총 납입액 / 리스기간 (straight-line)
- ❌ Finance lease처럼 Interest expense 별도 계산 → ✔ 균등 인식

**2단계 + 3단계 통합: ROU / Lease Obligation 제거**
- Payment + Depreciation이 함께 작동해서 ROU와 Lease Obligation 상계/소멸
- 상각표는 Finance Lease와 동일하게 작성
- ROU Asset과 Lease Obligation이 서로 상계되면서 없어지는 구조

2가지 처리 방법:
① Lease Obligation amortization 상각
② ROU Asset 상각비용만큼 제거

### Operating Lease 시험 출제 포인트
- ⭐ 비용 Even out (straight-line) 이 제일 핵심
- 🎯 "Lease expense 얼마?" 문제가 제일 많이 출제
- 계산: 전체 총 납입액 / 리스기간 = 매기 균등 Lease expense

### Free Rent Period (Operating Lease)
예) 5년 계약, 1년 무료, 4년 유상

- 총 납입액 ÷ 전체 리스기간(5년) = 매기 균등 Lease expense
- ❌ 유상 기간(4년)으로 나눔 → ✔ 전체 리스기간(5년)으로 나눔
- ❌ 무료기간 비용 없음 → ✔ 무료기간도 사용한 것 → 균등 인식

분개:
1년차 (무료기간) → Cash 없어도 비용 인식:
  Dr. Lease Expense (균등금액)
  Cr. Deferred Rent (나중에 갚을 것처럼 쌓아둠)

2~5년차 (유상기간):
  Dr. Lease Expense (균등금액)
  Dr. Deferred Rent (쌓인 거 털어냄)
  Cr. Cash

한 줄 암기: Free rent도 리스기간에 포함 → 총 납입액 ÷ 전체 리스기간

---

### Finance vs Operating 비용 패턴 비교 (시험 자주 출제)

| 구분 | Interest Expense | Depreciation | 총 비용 패턴 |
|------|-----------------|--------------|-------------|
| Finance Lease | 초반 많고 점점 감소 | 일정 | 초반 高, 후반 低 |
| Operating Lease | 없음 | 없음 | Flat (일정) |

- Finance: 초반에 비용 많이 타고 갈수록 줄어드는 구조
- Operating: 전체 비용이 flat하게 일정
- ⭐ 최종 총비용은 동일 — 결국 같은 cash가 나가기 때문

### Net of Current Portion (B/S 표시)
- Lease Obligation = Current portion + Non-current portion
- Net of current portion = 전체 Lease Obligation - Current portion = Non-current
- Current portion = 다음 1년 내 상환될 Lease Obligation 원금
- ❌ Current portion = 다음 연도 납입액 전체 → ✔ 원금 부분만 (Interest 제외)

### Leasehold Improvement
- 임차한 자산에 Capex 발생 시
- Dr. Leasehold Improvement / Cr. Cash

Useful Life 기준 → Shorter of:
① Lease remaining term
   - 계약 갱신 옵션이 probable하면 잔여기간에 포함해서 계산
② Leasehold Improvement economic useful life

### Trap
- ❌ Operating lease = 그냥 Rent Expense → ✔ ASC 842 이후 ROU/Liability 있음
- ❌ 단기리스도 ROU 잡는다 → ✔ 1년 이하 예외, Rent Expense만
- ❌ Lessor 문제 → ✔ 2024년부터 출제 없음, Lessee만
- ❌ Operating lease Inception 없음 → ✔ Finance와 동일하게 ROU/Lease Obligation 잡음
- ❌ 비용 불균등 인식 → ✔ 반드시 straight-line 균등
- ❌ Interest expense 별도 → ✔ Operating은 Lease expense 하나로 균등`;
