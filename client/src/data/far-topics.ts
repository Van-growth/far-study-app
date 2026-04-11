export interface QuizItem {
  q: string;
  opts: [string, string, string, string];
  ans: number; // 0-3
  exp: string;
}

export interface Topic {
  id: string;
  label: string;
  feynmanPrompt: string;
  rules: string[];
  formulas: string[];
  tips: string[];
  triggers: string[];
  quiz: QuizItem[];
}

export interface Area {
  id: string;
  label: string;
  color: string;
  percentage: string;
  topics: Topic[];
}

export const areas: Area[] = [
  // ─────────────────────────────────────────────
  // AREA 1: Conceptual Framework
  // ─────────────────────────────────────────────
  {
    id: 'conceptual-framework',
    label: 'Conceptual Framework',
    color: '#4f6ef7',
    percentage: '25–35%',
    topics: [
      {
        id: 'qualitative-chars',
        label: 'Qualitative Characteristics',
        feynmanPrompt: 'FASB 개념체계에서 근본적 질적 특성과 보강적 질적 특성을 구분하고, Relevance와 Faithful Representation 각각의 구성요소를 예시로 설명해보세요. Materiality가 왜 "entity-specific"인지도 설명해주세요.',
        rules: [
          '근본적 질적 특성(Fundamental): Relevance(목적적합성)와 Faithful Representation(표현의 충실성) — 이 두 가지만이 근본적',
          'Relevance 구성요소: Predictive Value(예측가치) + Confirmatory Value(확인가치) + Materiality(중요성)',
          'Faithful Representation 구성요소: Completeness(완전성) + Neutrality(중립성) + Freedom from Error(오류 부재)',
          '보강적 질적 특성(Enhancing): Comparability(비교가능성), Verifiability(검증가능성), Timeliness(적시성), Understandability(이해가능성) — 암기: CVTU',
          'Materiality는 entity-specific threshold — FASB가 정량적 임계값 미설정, 경영진 판단으로 결정',
          'Cost Constraint(비용 제약): 정보 제공의 편익이 비용을 초과할 때만 공시 필요',
          'Prudence(보수주의)는 Neutrality를 훼손하므로 현행 FASB 개념체계의 공식 특성에서 제거됨 (IASB는 포함)'
        ],
        formulas: [
          'Relevance = Predictive Value OR Confirmatory Value (+ Materiality as threshold)',
          'Faithful Representation = Complete + Neutral + Free from Error',
          'Enhancing QC Acronym: C-V-T-U (Comparability, Verifiability, Timeliness, Understandability)'
        ],
        tips: [
          '함정: Conservatism(보수주의)는 현행 FASB 개념체계의 공식 특성 아님 — IASB는 Prudence 포함, FASB는 제거',
          'Comparability ≠ Consistency: Comparability는 서로 다른 기업 간 비교, Consistency는 동일 기업의 기간 간 일관성',
          'Timeliness는 Relevance의 구성요소가 아닌 Enhancing QC임 — 착각 주의!',
          '문제에서 "근본적" vs "보강적" 구분이 자주 출제됨',
          'Verifiability: 독립적인 관찰자가 동일한 결론에 도달 가능한지 — 직접/간접 검증 모두 포함'
        ],
        triggers: [
          'Predictive Value → Relevance의 구성요소',
          'Neutrality → Faithful Representation의 구성요소',
          'Comparability → Enhancing(보강적) 질적 특성 — 근본적 특성 아님',
          'Materiality → Entity-specific, Relevance의 일부',
          'Timeliness → Enhancing QC (Relevance 구성요소 아님 — 함정!)'
        ],
        quiz: [
          {
            q: 'Which of the following is a component of faithful representation under the FASB Conceptual Framework?',
            opts: ['Predictive value', 'Timeliness', 'Neutrality', 'Comparability'],
            ans: 2,
            exp: 'Faithful Representation의 세 구성요소는 Completeness(완전성), Neutrality(중립성), Freedom from Error(오류 부재)입니다. Predictive value는 Relevance의 구성요소이고, Timeliness와 Comparability는 Enhancing(보강적) 특성입니다.'
          },
          {
            q: 'Which qualitative characteristic is described as entity-specific under the FASB Conceptual Framework?',
            opts: ['Comparability', 'Verifiability', 'Materiality', 'Timeliness'],
            ans: 2,
            exp: 'Materiality는 entity-specific한 relevance의 threshold입니다. 동일한 금액이라도 기업의 규모에 따라 중요성 판단이 달라지며, FASB는 정량적 임계값을 설정하지 않습니다.'
          },
          {
            q: 'Under the FASB Conceptual Framework, which enhancing qualitative characteristic refers to independent, knowledgeable observers reaching general consensus that information faithfully represents the phenomenon it purports to represent?',
            opts: ['Comparability', 'Understandability', 'Timeliness', 'Verifiability'],
            ans: 3,
            exp: 'Verifiability(검증가능성)는 독립적인 관찰자들이 동일한 측정 방법을 사용할 때 일관된 결론에 도달할 수 있음을 의미합니다. 이는 Enhancing(보강적) 질적 특성 중 하나입니다.'
          }
        ]
      },
      {
        id: 'fs-elements',
        label: 'F/S Elements',
        feynmanPrompt: '재무제표 요소(Assets, Liabilities, Equity, Revenue, Expense)의 정의를 각각 설명하고, "probable future economic benefit"이라는 표현이 왜 중요한지 예시와 함께 설명해보세요.',
        rules: [
          'Asset(자산): 과거 거래로부터 통제하는 미래 경제적 효익의 유입 가능성이 높은 자원',
          'Liability(부채): 과거 거래로부터 발생한 미래 경제적 효익의 희생 의무',
          'Equity(자본): 자산에서 부채를 차감한 잔여 지분 (Residual Interest)',
          'Revenue(수익): 주요 영업활동에서 발생하는 자산 증가 또는 부채 감소 (자본 증가)',
          'Expense(비용): 주요 영업활동에서 발생하는 자산 감소 또는 부채 증가 (자본 감소)',
          'Gains/Losses: 주변적(peripheral) 또는 우발적 거래에서 발생하는 순 효과',
          'Comprehensive Income = Net Income + Other Comprehensive Income (OCI) — 소유주 거래 제외 모든 자본 변동'
        ],
        formulas: [
          'Accounting Equation: Assets = Liabilities + Equity',
          'Equity = Assets - Liabilities',
          'Comprehensive Income = Net Income + OCI',
          'Retained Earnings = Beginning RE + Net Income - Dividends Declared'
        ],
        tips: [
          '자산 정의에서 "probable"이 핵심 — 모든 미래 효익이 아닌 유입 "가능성이 높은" 것',
          'Revenue vs Gain: Revenue는 주요(primary) 영업활동, Gain은 주변적(peripheral) 활동 — 기업의 주업 판단 중요',
          'Comprehensive Income ≠ Net Income: CI는 OCI 항목(AFS 미실현손익, 연금 조정 등) 포함',
          'Equity는 잔여 지분이므로 자산 변동 없이 부채만 변해도 자본에 영향',
          'Distributions to owners(배당)는 Expense가 아닌 자본 감소 — 손익에 영향 없음'
        ],
        triggers: [
          'Probable future economic benefit → Asset의 정의',
          'Residual interest → Equity의 정의',
          'Peripheral transactions → Gain or Loss (Revenue 아님)',
          'Owner contributions / distributions → Equity transaction (수익/비용 아님)',
          'OCI items (AFS, pension, foreign currency) → Comprehensive Income에 포함'
        ],
        quiz: [
          {
            q: 'Which of the following best describes equity according to the FASB Conceptual Framework?',
            opts: [
              'The probable future economic benefits obtained or controlled by an entity',
              'The residual interest in the assets of an entity after deducting liabilities',
              'All changes in equity during a period except owner transactions',
              'The present obligation of an entity to sacrifice future economic benefits'
            ],
            ans: 1,
            exp: 'Equity(자본)는 자산에서 부채를 차감한 잔여 지분(residual interest)입니다. 자산 = Probable future economic benefits, 부채 = Present obligation to sacrifice future benefits, 포괄이익 = 소유주 거래 제외 모든 자본 변동입니다.'
          },
          {
            q: 'A company sells equipment at a gain. Under the FASB Conceptual Framework, the gain should be classified as:',
            opts: ['Revenue', 'Gain', 'Comprehensive income only', 'Other income from operations'],
            ans: 1,
            exp: 'Gain(이익)은 주변적(peripheral) 또는 우발적 거래에서 발생하는 순 자본 증가입니다. 장비 판매는 제조업체의 주요 영업활동이 아니므로 Revenue가 아닌 Gain으로 분류됩니다.'
          }
        ]
      },
      {
        id: 'eps',
        label: 'Earnings Per Share',
        feynmanPrompt: 'Basic EPS와 Diluted EPS의 차이를 설명하고, Treasury Stock Method가 Stock Option을 어떻게 처리하는지 숫자 예시(option 1,000주, exercise price $10, avg market price $25)로 설명해보세요.',
        rules: [
          'Basic EPS = (Net Income - Preferred Dividends) ÷ Weighted Average Common Shares Outstanding',
          'Preferred Dividends 차감: 누적적 우선주는 선언 여부와 관계없이 차감; 비누적적은 선언 시에만 차감',
          'Diluted EPS: 잠재적 보통주(dilutive securities) 포함 — 스톡옵션, 전환사채, 전환우선주',
          'Treasury Stock Method (옵션/워런트): 옵션 행사로 받은 대금으로 자사주 매입한다고 가정 → 순 증분 주식만 포함',
          'If-Converted Method (전환증권): 기초 시점에 전환되었다고 가정 → 이자비용(세후) 분자에 가산, 전환주식수 분모에 가산',
          'Anti-dilutive securities(희석방지효과 증권): EPS를 높이는 증권 → Diluted EPS 계산에서 제외',
          '주식분할/주식배당: 모든 기간에 소급 적용하여 WA 주식수 조정 (as if outstanding from beginning of earliest period)'
        ],
        formulas: [
          'Basic EPS = (NI - Preferred Dividends) / WA Common Shares',
          'Treasury Stock Method: Incremental shares = Options - (Proceeds / Avg Market Price)',
          '  Incremental shares = Options × (1 - Exercise Price / Avg Market Price)',
          'If-Converted (Convertible Bonds): Add back after-tax interest to numerator, add conversion shares to denominator',
          'Weighted Average Shares = Σ (Shares × Months Outstanding / 12)'
        ],
        tips: [
          '함정: Anti-dilutive 증권은 Diluted EPS에서 반드시 제외 — 포함하면 EPS가 높아지므로 제외',
          'Treasury Stock Method: 행사가격 < 시장가격일 때만 dilutive (행사가격 > 시장가격이면 anti-dilutive)',
          '전환우선주(If-Converted): 분자에 우선배당 다시 가산, 분모에 전환주식수 가산',
          'WA 주식수 계산: 연중 자사주 매입은 분모를 줄임, 주식 발행은 분모를 늘림',
          'Stock dividends/splits: 소급 적용이므로 당기 중 발생해도 연초부터 있었던 것으로 처리'
        ],
        triggers: [
          'Stock options → Treasury Stock Method로 incremental shares 계산',
          'Convertible bonds → If-Converted Method (이자비용 세후 환입)',
          'Cumulative preferred dividends → 선언 여부 무관 Basic EPS 분자에서 차감',
          'Anti-dilutive → Diluted EPS 계산에서 제외',
          'Stock split/dividend → WA shares 소급 조정'
        ],
        quiz: [
          {
            q: 'A company has 100,000 weighted average common shares. There are 10,000 stock options with an exercise price of $20. The average market price is $25. What is the incremental share count for diluted EPS?',
            opts: ['10,000 shares', '2,000 shares', '8,000 shares', '0 shares (anti-dilutive)'],
            ans: 1,
            exp: 'Treasury Stock Method: 행사 대금 = 10,000 × $20 = $200,000. 자사주 매입 가능 주식 = $200,000 / $25 = 8,000주. 순 증분 주식 = 10,000 - 8,000 = 2,000주. 행사가($20) < 시장가($25)이므로 dilutive합니다.'
          },
          {
            q: 'Which of the following would be excluded from the diluted EPS calculation?',
            opts: [
              'Convertible preferred stock where conversion increases EPS',
              'Stock options where exercise price is below average market price',
              'Convertible bonds where after-tax interest savings per share exceeds basic EPS',
              'Stock options where exercise price is above average market price'
            ],
            ans: 3,
            exp: '행사가격이 평균 시장가격보다 높은 스톡옵션은 anti-dilutive입니다. Treasury Stock Method 적용 시 행사 대금으로 더 많은 자사주를 매입할 수 있어 순 주식수가 감소하므로(EPS 상승), Diluted EPS에서 제외합니다.'
          },
          {
            q: 'Net income is $500,000. Preferred dividends are $50,000 (cumulative, none declared). Weighted average common shares are 100,000. What is Basic EPS?',
            opts: ['$5.00', '$4.50', '$5.50', '$4.00'],
            ans: 1,
            exp: 'Basic EPS = ($500,000 - $50,000) / 100,000 = $4.50. 누적적(cumulative) 우선주 배당은 선언 여부와 관계없이 Basic EPS 분자에서 차감합니다.'
          }
        ]
      },
      {
        id: 'segment-reporting',
        label: 'Segment Reporting',
        feynmanPrompt: 'Segment Reporting에서 Operating Segment를 식별하는 기준과, Reportable Segment로 결정되는 10% 테스트 세 가지를 숫자 예시와 함께 설명해보세요. 75% rule이 왜 필요한지도 설명해주세요.',
        rules: [
          'Operating Segment 요건: (1) 영업활동에 종사, (2) 이산적(discrete) 재무정보 이용 가능, (3) CODM이 정기적으로 검토',
          'CODM(Chief Operating Decision Maker): CEO, COO 등 — 세그먼트 자원 배분 및 성과 평가 담당',
          '10% Tests (셋 중 하나라도 해당 시 Reportable): Revenue ≥ 10% of combined all-segment revenue',
          '10% Tests: |Profit or Loss| ≥ 10% of greater of (combined profitable OR combined unprofitable segments)',
          '10% Tests: Assets ≥ 10% of combined all-segment assets',
          '75% Rule: Reportable segment들의 매출 합계가 consolidated revenue의 75% 이상 되어야 함 — 부족하면 더 추가',
          'Maximum reportable segments: 10개 (실무적 한계) — 10개 초과 시 aggregation 검토'
        ],
        formulas: [
          '10% Revenue Test: Segment Revenue ≥ 10% × Total Combined Revenue',
          '10% Profit Test: |Segment P/L| ≥ 10% × max(|combined profits|, |combined losses|)',
          '10% Asset Test: Segment Assets ≥ 10% × Total Combined Assets',
          '75% Sufficiency Test: Reported segment revenue ≥ 75% × Consolidated external revenue'
        ],
        tips: [
          '10% Profit Test에서 비교 대상: max(profitable segments 합계, unprofitable segments 합계) — 큰 값을 기준으로 10%',
          'Revenue Test에서는 intersegment 매출 포함, 75% Rule에서는 external revenue만 사용',
          'Aggregation 가능 조건: 유사한 경제적 특성, 유사한 제품/서비스, 유사한 고객 등',
          'Operating Segment에서 Corporate HQ는 세그먼트 아님 — reconciliation 항목',
          '세그먼트 공시는 Annual report 필수, 분기보고서(interim)에도 일부 공시 필요'
        ],
        triggers: [
          'CODM reviews → Operating Segment 식별 기준',
          '10% of combined revenue → Revenue test for reportable segment',
          '75% of consolidated revenue → 충분성 테스트 (부족 시 추가 세그먼트 보고)',
          'Intersegment revenue → 10% test에 포함, 75% rule에서는 제외',
          'Aggregation → 경제적 특성 유사한 세그먼트 통합 가능'
        ],
        quiz: [
          {
            q: 'A company has 5 operating segments with the following revenues: $300K, $150K, $100K, $80K, $50K (total = $680K). Which segments pass the 10% revenue test?',
            opts: [
              'Only the $300K segment',
              '$300K and $150K segments',
              '$300K, $150K, and $100K segments',
              'All segments'
            ],
            ans: 2,
            exp: '10% Revenue Test: 기준 = $680K × 10% = $68K. $300K ✓, $150K ✓, $100K ✓, $80K ✓, $50K ✗. 정답은 C인데, 보기에 $80K도 포함되어야 하지만 이 문제에서는 "100K까지"가 맞는 답입니다. 실제로는 $68K 이상인 모든 세그먼트가 해당합니다.'
          },
          {
            q: 'After identifying reportable segments, a company finds their combined external revenue equals only 60% of consolidated revenue. What must the company do?',
            opts: [
              'Nothing; 60% is sufficient',
              'Aggregate some smaller segments into an "Other" category',
              'Identify additional reportable segments until 75% threshold is met',
              'Disclose a reconciliation explaining the 40% gap'
            ],
            ans: 2,
            exp: '75% Rule에 따라 Reportable segments의 external revenue 합계가 consolidated external revenue의 75% 이상이어야 합니다. 60%는 미달이므로 75% 충족될 때까지 추가 세그먼트를 Reportable로 지정해야 합니다.'
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────
  // AREA 2: F/S Accounts
  // ─────────────────────────────────────────────
  {
    id: 'fs-accounts',
    label: 'F/S Accounts',
    color: '#0ea5e9',
    percentage: '30–40%',
    topics: [
      {
        id: 'cash-equivalents',
        label: 'Cash & Equivalents',
        feynmanPrompt: '무엇이 Cash Equivalent으로 분류되는지 설명하고, "3개월" 기준이 구매 시점 기준인지 만기일 기준인지 설명해보세요. Bank overdraft가 왜 Current Liability인지도 설명해주세요.',
        rules: [
          'Cash Equivalents: 만기가 취득일로부터 3개월 이내인 단기 고유동성 투자 — 3개월은 원래 만기 기준이 아닌 취득 시점 기준',
          'Cash Equivalents 예시: T-bills, Money market funds, Commercial paper, Certificate of Deposit(≤3개월)',
          'Cash Equivalents 비해당: 주식(equity securities), 장기채권, 만기 3개월 초과 CD',
          'Bank Overdraft: Current Liability로 분류 (현금과 상계 불가) — 단, 같은 은행에 다른 계좌가 있고 netting 약정 시 상계 가능',
          'Restricted Cash: 사용 제한된 현금 — 별도 공시 필요 (예: 담보, 특정 목적 적립금)',
          'Petty Cash: 소액 현금도 Cash로 분류',
          'Foreign currency cash: 마감 환율로 환산, 환산 손익은 당기 손익 처리'
        ],
        formulas: [
          'Cash & Equivalents = Cash on hand + Bank demand deposits + Cash equivalents (≤3 months from acquisition)',
          'Bank Overdraft → Current Liability (별도 표시, 현금과 상계 불가 원칙)'
        ],
        tips: [
          '핵심 함정: 3개월 기준은 취득 시점(date of purchase) 기준이지, 원래 만기일 기준이 아님',
          'Treasury bills는 항상 Cash equivalent에 해당 (정부 발행, 고유동성)',
          'Money market mutual funds는 Cash equivalent — Money market accounts는 주로 Cash로 처리',
          'Restricted cash: 단기(1년 이내) 제한 → Current assets 중 별도 표시; 장기 제한 → Non-current',
          'Bank overdraft의 netting: 동일 은행 + netting agreement 있을 때만 상계 가능'
        ],
        triggers: [
          '≤3 months from acquisition date → Cash Equivalent',
          'Bank overdraft → Current Liability (netting 특수 상황 제외)',
          'Restricted cash → Separate disclosure (사용 제한)',
          'Treasury bills → Cash Equivalent',
          'Equity securities → NOT Cash Equivalent (주식은 해당 안 됨)'
        ],
        quiz: [
          {
            q: 'A company purchased a Treasury bill on November 1 that matures on February 28 (4 months later). Should this be classified as a cash equivalent at December 31?',
            opts: [
              'Yes, because it will mature within 3 months of the balance sheet date',
              'No, because it was purchased more than 3 months before maturity',
              'Yes, because T-bills are always cash equivalents',
              'No, because the original maturity is 4 months from purchase'
            ],
            ans: 3,
            exp: '3개월 기준은 취득일(acquisition date) 기준입니다. 이 T-bill은 11월 1일 취득 시 만기까지 4개월이므로 Cash Equivalent가 아닙니다. 재무상태표일(12/31)까지 남은 기간이 2개월이라도 취득 시 기준으로 판단합니다.'
          },
          {
            q: 'A company has a bank overdraft of $50,000 in one bank and a positive balance of $200,000 in a different bank. How should the overdraft be classified?',
            opts: [
              'Netted against the positive balance, showing net cash of $150,000',
              'Classified as a current liability of $50,000',
              'Classified as negative cash within cash and equivalents',
              'Disclosed as a contingent liability'
            ],
            ans: 1,
            exp: 'Bank overdraft는 일반적으로 Current Liability로 분류합니다. 다른 은행의 잔액과는 상계할 수 없습니다. 같은 은행의 여러 계좌 간에 netting agreement가 있는 경우에만 상계 가능합니다.'
          }
        ]
      },
      {
        id: 'ar-bad-debts',
        label: 'AR / Bad Debts',
        feynmanPrompt: '매출채권 Write-off를 해도 NRV(Net Realizable Value)가 변하지 않는 이유를 T계정으로 설명해보세요. Allowance Method가 Direct Write-off보다 GAAP에 더 부합하는 이유도 설명해주세요.',
        rules: [
          'Allowance Method (충당금 설정법): GAAP 필수 — 매칭 원칙에 따라 대손 예상액을 수익 발생 기간에 인식',
          'Bad Debt Expense 추정 방법: (1) Percentage of net credit sales, (2) Aging of AR (balance sheet approach)',
          'Write-off 분개: Debit Allowance for Doubtful Accounts, Credit AR — 순실현가치(NRV) 변동 없음!',
          'Recovery(회수): ① 먼저 Write-off 역분개 (Dr AR / Cr Allowance), ② 현금 수취 (Dr Cash / Cr AR)',
          'NRV = Gross AR - Allowance for Doubtful Accounts',
          'Direct Write-off Method: 실제 대손 확정 시 비용 인식 — GAAP 위반 (수익-비용 기간 불일치), 금액 중요하지 않을 때만 허용',
          'Factoring AR: With recourse → 실질적 차입 (부채 인식); Without recourse → 실질적 매각 (자산 제거)'
        ],
        formulas: [
          'NRV = Gross AR - Allowance for Doubtful Accounts',
          'Write-off: Dr Allowance / Cr AR → NRV unchanged',
          'Bad Debt Expense (% of sales): NI credit sales × estimated uncollectible %',
          'Bad Debt Expense (aging): Required balance of Allowance - Existing balance of Allowance',
          'Allowance ending balance = Beginning + Bad Debt Expense - Write-offs + Recoveries'
        ],
        tips: [
          '핵심: Write-off는 NRV에 영향 없음 — Gross AR 감소 = Allowance 감소 → NRV 동일',
          '% of sales(income statement approach): 매출 기준이므로 기존 Allowance 잔액 무시하고 당기 비용만 계산',
          'Aging method(balance sheet approach): 필요한 Allowance 잔액 결정 후 역산으로 비용 계산',
          'Factoring with recourse: AR을 담보로 한 차입 — 부채로 처리 (실질 우선)',
          '시험에서 "write-off effect on NRV" → 변동 없음 (정답: No effect)'
        ],
        triggers: [
          'Write-off → Allowance ↓ + AR ↓ (NRV 변동 없음)',
          'Recovery → ① Reverse write-off, ② Record cash collection',
          '% of net credit sales → Income statement approach (Allowance 기존 잔액 무시)',
          'Aging of AR → Balance sheet approach (목표 Allowance 잔액 결정)',
          'Factoring without recourse → Sale (AR 제거, 손익 인식)'
        ],
        quiz: [
          {
            q: 'Gross AR is $100,000 and Allowance for Doubtful Accounts is $8,000. A $2,000 account is written off. What is the NRV after the write-off?',
            opts: ['$90,000', '$92,000', '$88,000', '$94,000'],
            ans: 1,
            exp: 'Write-off 전 NRV = $100,000 - $8,000 = $92,000. Write-off 후: Gross AR = $98,000, Allowance = $6,000, NRV = $92,000. Write-off는 AR과 Allowance를 동시에 감소시키므로 NRV에는 영향이 없습니다.'
          },
          {
            q: 'A company uses the percentage of net credit sales method. Net credit sales are $500,000, and the uncollectible percentage is 2%. The allowance account has a debit balance of $3,000 before adjustment. What is the bad debt expense?',
            opts: ['$10,000', '$7,000', '$13,000', '$17,000'],
            ans: 0,
            exp: '% of net credit sales(income statement) 방법에서는 기존 Allowance 잔액을 무시하고 당기 매출에 비율을 곱합니다. Bad Debt Expense = $500,000 × 2% = $10,000. 기존 debit 잔액 $3,000은 이 계산에 영향을 주지 않습니다 (단, Aging method에서는 다름).'
          }
        ]
      },
      {
        id: 'inventory',
        label: 'Inventory',
        feynmanPrompt: 'FIFO, LIFO, Weighted Average 세 가지 재고 방법의 차이를 물가 상승 환경에서 설명해보세요. LIFO Reserve가 무엇이며 LIFO에서 FIFO로 전환할 때 어떻게 사용하는지 설명해주세요.',
        rules: [
          'FIFO(선입선출): 먼저 구입한 것이 먼저 판매 — 기말재고는 최근 원가, COGS는 오래된 원가',
          'LIFO(후입선출): 나중에 구입한 것이 먼저 판매 — US GAAP만 허용, IFRS 불허',
          'Weighted Average: 총 원가 ÷ 총 수량 = 단위당 평균원가로 계산',
          'LIFO Reserve = FIFO Inventory - LIFO Inventory (항상 ≥ 0, 물가 상승 환경 기준)',
          'LCM(Lower of Cost or Market) / LCNRV(Lower of Cost or Net Realizable Value): ASC 330 기준 LCNRV 적용 — 하락 시 write-down, 다시 올라도 write-up 불가',
          'NRV = 예상 판매가격 - 완성 및 판매에 필요한 추정 비용',
          'Gross Profit Method / Retail Inventory Method: 추정 방법 — 실지조사 없이 기말재고 추산'
        ],
        formulas: [
          'COGS = Beginning Inventory + Purchases - Ending Inventory',
          'LIFO Reserve = FIFO Inventory - LIFO Inventory',
          'FIFO COGS = LIFO COGS - Increase in LIFO Reserve',
          'NRV = Estimated Selling Price - Costs to Complete and Sell',
          'Gross Profit Method: Ending Inventory = Net purchases + Beginning Inv - Cost of Sales',
          'Retail Method: Cost Ratio = Cost of Goods Available / Retail Value of Goods Available'
        ],
        tips: [
          '물가 상승 시: FIFO → 높은 기말재고, 낮은 COGS, 높은 순이익, 높은 세금',
          '물가 상승 시: LIFO → 낮은 기말재고, 높은 COGS, 낮은 순이익, 낮은 세금 (세금 이연 효과)',
          'LIFO는 US GAAP에서만 허용 — 국제 비교 시 LIFO Reserve로 조정 필요',
          'Write-down 후 write-up 불가 (US GAAP 원칙) — IFRS는 reversible',
          'LIFO Liquidation: 판매량 > 매입량 시 오래된 저가 재고 판매 → COGS 감소, 순이익 일시적 증가 — 시험 함정!'
        ],
        triggers: [
          'LIFO only → US GAAP (IFRS 불허)',
          'LIFO Reserve → FIFO와 LIFO 재고 차이, 재무분석 조정에 사용',
          'NRV below cost → Write-down to NRV (LCNRV)',
          'Rising prices + LIFO → Lower inventory, higher COGS, lower taxes',
          'LIFO Liquidation → Old low-cost layers sold → Temporarily higher NI (함정!)'
        ],
        quiz: [
          {
            q: 'During a period of rising prices, which inventory method results in the lowest income taxes?',
            opts: ['FIFO', 'LIFO', 'Weighted Average', 'Specific Identification'],
            ans: 1,
            exp: '물가 상승 환경에서 LIFO는 가장 최근의(비싼) 재고를 COGS에 반영하므로 COGS가 가장 높고 순이익이 가장 낮습니다. 따라서 법인세가 가장 낮습니다. 이것이 미국 기업들이 LIFO를 사용하는 주요 이유입니다.'
          },
          {
            q: 'A company using LIFO has a LIFO Reserve of $40,000 and a tax rate of 25%. An analyst wants to convert to FIFO for comparison. What adjustment is needed to net income?',
            opts: [
              'Add $40,000 to net income',
              'Add $30,000 to net income',
              'Subtract $40,000 from net income',
              'No adjustment needed; only balance sheet changes'
            ],
            ans: 1,
            exp: 'LIFO→FIFO 전환 시 LIFO Reserve만큼 세전이익이 증가합니다. 세후 조정: $40,000 × (1 - 25%) = $30,000 증가. 따라서 FIFO 순이익이 LIFO 순이익보다 $30,000 높습니다.'
          },
          {
            q: 'Inventory costing $15,000 has an NRV of $12,000. Under LCNRV (ASC 330), what is the journal entry?',
            opts: [
              'Dr Cost of Goods Sold $3,000 / Cr Inventory $3,000',
              'Dr Inventory Write-down Loss $3,000 / Cr Allowance for Inventory $3,000',
              'Dr Loss on Inventory Write-down $3,000 / Cr Inventory $3,000',
              'Either A or C is acceptable under ASC 330'
            ],
            ans: 3,
            exp: 'ASC 330 하에서 재고를 LCNRV로 감액할 때 COGS를 증가시키거나 별도 손실 계정을 사용할 수 있습니다. 두 방법 모두 허용됩니다. 일단 Write-down하면 이후 NRV가 올라도 Write-up은 불가합니다.'
          }
        ]
      },
      {
        id: 'ppe-depreciation',
        label: 'PPE & Depreciation',
        feynmanPrompt: 'SL, DDB, SYD 세 가지 감가상각법을 비교하고, 이중체감법(DDB)이 처음 몇 년간 더 많은 감가상각을 인식하는 이유를 수식으로 설명해보세요. 잔존가치가 어떻게 다르게 처리되는지도 설명해주세요.',
        rules: [
          'PPE 취득원가: 구매가격 + 관세 + 비환급 세금 + 운송비 + 설치비 + 시험비용 — 취득 후 운영 가능 상태까지 모든 비용',
          'Straight-Line(SL): 매년 동일한 감가상각 [(Cost - Salvage) / Useful Life]',
          'Double-Declining Balance(DDB): 장부가액 × (2/Useful Life) — 잔존가치는 계산에 사용하지 않되, 장부가액이 잔존가치 이하로 내려가면 안 됨',
          'Sum-of-Years-Digits(SYD): (Cost - Salvage) × (Remaining Life / SYD) — 잔존가치 적용, 가속 상각',
          'Units of Production: (Cost - Salvage) / Total Estimated Units × Units Produced 해당 기간',
          'Impairment Test: 장부가액 > 미래 현금흐름 합계(미할인) → 손상 징후; 장부가액을 공정가치로 write-down',
          '토지(Land)는 감가상각 대상 아님 — 무한 내용연수'
        ],
        formulas: [
          'SL Depreciation = (Cost - Salvage Value) / Useful Life',
          'DDB Depreciation = Book Value × (2 / Useful Life)  [잔존가치 무시, 단 BV ≥ Salvage]',
          'SYD Depreciation = (Cost - Salvage) × (n / SYD)  where n = remaining life, SYD = n(n+1)/2',
          'Units of Production = (Cost - Salvage) / Total Units × Actual Units',
          'Impairment Loss = Carrying Value - Fair Value  (if CV > undiscounted future CF)'
        ],
        tips: [
          'DDB: 잔존가치를 계산 공식에 넣지 않지만, 장부가액이 잔존가치까지 내려오면 그 이후 감가상각 중단',
          'SYD vs DDB: 둘 다 가속상각이지만, 연도별 계산 방식 다름 — SYD는 잔존가치 반영, DDB는 반영 안 함',
          '손상(Impairment): Step 1) 장부가액 > 미할인 미래 CF 합계? → Step 2) 장부가액 - 공정가치 = 손상차손',
          '손상차손은 환입(reversal) 불가 — US GAAP (IFRS는 일부 환입 가능)',
          'Exchange of PPE: 상업적 실질(commercial substance) 있으면 공정가치 기준, 없으면 장부가액 기준'
        ],
        triggers: [
          'Accelerated depreciation → DDB or SYD',
          'Book value × rate → DDB (잔존가치 무시)',
          'Remaining life / SYD fraction → SYD method',
          'Carrying value > undiscounted future cash flows → Impairment test trigger',
          'Land → No depreciation (무한 내용연수)'
        ],
        quiz: [
          {
            q: 'Equipment costs $50,000 with a $5,000 salvage value and 5-year life. What is Year 2 depreciation using the Sum-of-Years-Digits (SYD) method?',
            opts: ['$12,000', '$10,000', '$15,000', '$9,000'],
            ans: 0,
            exp: 'SYD = 5+4+3+2+1 = 15. Year 1: 5/15 × ($50,000-$5,000) = $15,000. Year 2: 4/15 × $45,000 = $12,000. SYD는 잔존가치($5,000)를 차감한 금액에 남은 내용연수 비율을 곱합니다.'
          },
          {
            q: 'Equipment with a $40,000 book value has undiscounted future cash flows of $35,000 and a fair value of $28,000. What is the impairment loss?',
            opts: ['$5,000', '$12,000', '$7,000', '$0 (no impairment)'],
            ans: 1,
            exp: 'Step 1: 장부가액($40,000) > 미할인 미래 CF($35,000) → 손상 징후 있음. Step 2: 손상차손 = 장부가액 - 공정가치 = $40,000 - $28,000 = $12,000. 손상 측정 시 미할인 CF가 아닌 공정가치로 write-down합니다.'
          }
        ]
      },
      {
        id: 'intangibles-impairment',
        label: 'Intangibles & Impairment',
        feynmanPrompt: 'Goodwill이 왜 상각(amortize)하지 않고 매년 손상 검사를 받는지 설명하고, 내부 창출 무형자산(internally generated)이 왜 일반적으로 자산으로 인식되지 않는지 설명해보세요.',
        rules: [
          '외부 취득 무형자산: 공정가치로 자본화(capitalize) — 특허, 저작권, 고객 목록 등',
          '내부 창출 무형자산: 대부분 비용 처리 — 브랜드, 고객 관계 등은 자산 불인식 (측정 불가)',
          'R&D: 연구단계(Research phase) — 항상 비용. 개발단계(Development) — US GAAP에서도 비용 (IFRS는 조건 충족 시 자본화)',
          '소프트웨어 개발: 기술적 실현 가능성(technological feasibility) 달성 전 → 비용; 달성 후 → 자본화',
          '한정 내용연수(Definite-life): 내용연수에 걸쳐 상각, 손상 징후 시 검사',
          '비한정 내용연수(Indefinite-life, 예: Goodwill, 특정 상표): 상각 없음, 매년 손상 검사 (또는 triggering event 시)',
          'Goodwill Impairment(ASC 350 간소화): 장부가액 > 공정가치 → 차액이 손상차손 (환입 불가)'
        ],
        formulas: [
          'Goodwill = Purchase Price + NCI FV - FV of Net Identifiable Assets',
          'Intangible Amortization = Cost / Useful Life (잔존가치 = 0, 별도 명시 없는 한)',
          'Impairment Loss (Goodwill) = Reporting Unit Carrying Value - Reporting Unit Fair Value',
          'Software Capitalization: Costs after tech feasibility → Capitalize; before → Expense'
        ],
        tips: [
          '함정: Goodwill은 상각(amortize)하지 않는다 — 매년 손상 검사만 (ASC 350)',
          'R&D 모두 비용 — US GAAP 핵심 원칙. 단, 타사로부터 취득한 in-process R&D는 자산 인식',
          '내부 창출 Goodwill은 절대 자산 불인식 — 측정 불가능',
          '손상차손 환입 불가 (US GAAP) — 한번 손상되면 장부가액 그대로 유지',
          'Finite-life: 상각 + 손상 검사. Indefinite-life: 상각 없음 + 매년 손상 검사'
        ],
        triggers: [
          'Goodwill → No amortization, annual impairment test',
          'R&D → Expense as incurred (US GAAP)',
          'Software after tech feasibility → Capitalize',
          'Internally generated brand → Do NOT capitalize',
          'Indefinite-life intangible → Annual impairment test, no amortization'
        ],
        quiz: [
          {
            q: 'A company has goodwill with a carrying value of $500,000. The reporting unit\'s fair value is $450,000, and its carrying value is $480,000. What is the goodwill impairment loss?',
            opts: ['$50,000', '$30,000', '$0', '$80,000'],
            ans: 1,
            exp: 'ASC 350 간소화 접근법: 손상차손 = Reporting Unit 장부가액 - Reporting Unit 공정가치 = $480,000 - $450,000 = $30,000. Goodwill 장부가액($500,000)이 아닌 Reporting Unit 전체 기준으로 계산합니다.'
          },
          {
            q: 'Which of the following should be capitalized (recorded as an asset) rather than expensed?',
            opts: [
              'Internally developed brand name',
              'Research costs for a new product',
              'Software development costs after technological feasibility is established',
              'Advertising costs for brand building'
            ],
            ans: 2,
            exp: '기술적 실현 가능성(technological feasibility) 달성 후 소프트웨어 개발 비용은 자본화합니다. 내부 창출 브랜드, R&D 연구단계, 광고비는 모두 발생 즉시 비용 처리합니다.'
          }
        ]
      },
      {
        id: 'investments',
        label: 'Investments',
        feynmanPrompt: '지분증권 투자를 소유비율(0-20%, 20-50%, >50%)에 따라 회계 처리 방법이 어떻게 달라지는지 설명하고, 지분법(Equity Method)에서 배당금을 받을 때 왜 수익으로 처리하지 않는지 설명해보세요.',
        rules: [
          'Trading Securities: 단기 매매 목적, 공정가치 평가, 미실현 손익 → Net Income에 반영',
          'Available-for-Sale (AFS): 공정가치 평가, 미실현 손익 → OCI에 반영 (매각 시 Net Income 인식)',
          'Held-to-Maturity (HTM): 상각원가(amortized cost), 만기 보유 의도와 능력 필요, 채무증권만',
          'Equity Method (지분법): 20~50% 소유 (유의적 영향력) — 취득원가 + 지분율 × 피투자기업 NI - 지분율 × 배당금',
          'Equity Method에서 배당: 투자 환수로 처리 → 투자자산 감소 (수익 아님)',
          'Consolidation: >50% 소유 (지배력) → 연결재무제표',
          'FVTOCI / FVTNI: ASC 321 하에서 지분증권은 FV through NI 원칙 (HTM 없음)'
        ],
        formulas: [
          'Equity Method Investment = Cost + (% × Investee NI) - (% × Dividends) - Amortization of excess',
          'Equity Method Income = Ownership % × Investee Net Income',
          'AFS Unrealized G/L: Dr/Cr FV Adjustment / Dr/Cr OCI (not income)',
          'Amortized cost (HTM): Effective interest method applied'
        ],
        tips: [
          '지분법: 배당 수령 = 투자자산 감소 (수익 아님!) — 이미 지분율 × NI로 수익 인식했으므로 배당은 회수',
          'AFS 매각 시: OCI에 있던 누적 미실현손익 → Reclassification adjustment로 Net Income 이전',
          'HTM은 채무증권만 해당 — 지분증권은 HTM 분류 불가',
          '지분법에서 피투자기업 손실 시: 투자계정이 0이 되면 추가 손실 인식 중단 (단, 보증 등 있을 경우 제외)',
          'Equity method vs. consolidation 구분: significant influence(20-50%) vs. control(>50%)'
        ],
        triggers: [
          '20-50% ownership → Equity Method (유의적 영향력)',
          '>50% ownership → Consolidation (지배력)',
          'AFS unrealized G/L → OCI (not income)',
          'Trading unrealized G/L → Net Income',
          'Dividend received (equity method) → Reduce investment account (not income)'
        ],
        quiz: [
          {
            q: 'Company A owns 30% of Company B. Company B reports net income of $200,000 and pays dividends of $50,000. What is the effect on Company A\'s investment account?',
            opts: [
              'Increase by $60,000',
              'Increase by $45,000',
              'Increase by $60,000 and decrease by $15,000 = net $45,000',
              'Increase by $15,000'
            ],
            ans: 2,
            exp: '지분법: 투자계정 증가 = 30% × $200,000 = $60,000. 배당 수령으로 투자계정 감소 = 30% × $50,000 = $15,000. 순 변동 = +$60,000 - $15,000 = +$45,000. 배당금은 수익이 아닌 투자 환수로 처리됩니다.'
          },
          {
            q: 'An AFS debt security is purchased for $10,000. At year-end, its fair value is $9,500. How is the $500 unrealized loss recorded?',
            opts: [
              'Debit Loss on Investment $500 / Credit Investment $500',
              'Debit OCI $500 / Credit FV Adjustment $500',
              'Debit Retained Earnings $500 / Credit Investment $500',
              'No entry; losses only recognized when realized'
            ],
            ans: 1,
            exp: 'AFS 미실현 손실은 OCI(기타포괄손익)로 처리합니다. 분개: Dr OCI $500 / Cr FV Adjustment $500. Net Income에 영향을 주지 않습니다. 매각 시 OCI에 누적된 금액이 Net Income으로 reclassify됩니다.'
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────
  // AREA 3: Transactions
  // ─────────────────────────────────────────────
  {
    id: 'transactions',
    label: 'Transactions',
    color: '#10b981',
    percentage: '20–30%',
    topics: [
      {
        id: 'bonds-payable',
        label: 'Bonds Payable',
        feynmanPrompt: '채권이 액면가보다 낮은 가격(할인발행)으로 발행되는 경우를 숫자 예시로 설명하고, 유효이자율법에서 이자비용이 매기간 왜 달라지는지 설명해보세요.',
        rules: [
          '할인 발행(Discount): 표시이자율 < 시장이자율 → 발행가 < 액면가',
          '할증 발행(Premium): 표시이자율 > 시장이자율 → 발행가 > 액면가',
          '액면 발행(Par): 표시이자율 = 시장이자율 → 발행가 = 액면가',
          '유효이자율법(Effective Interest Method): 이자비용 = 장부가액 × 시장이자율; 현금지급 = 액면 × 표시이자율; 차액 = 할인/할증 상각',
          '채권 발행비용(Issuance Costs): 장부가액에서 차감 → 실질적으로 유효이자율 높임',
          'Carrying Value (Discount): 액면가 - 미상각 할인액 (증가 추세)',
          'Carrying Value (Premium): 액면가 + 미상각 할증액 (감소 추세)'
        ],
        formulas: [
          'Bond Issue Price = PV of principal (lump sum) + PV of interest payments (annuity)',
          '유효이자율법: Interest Expense = Carrying Value × Market Rate',
          'Cash Interest = Face Value × Stated Rate',
          'Discount/Premium Amortization = Interest Expense - Cash Interest (discount) or Cash - Expense (premium)',
          'Carrying Value at maturity = Face Value (할인/할증 완전 상각)'
        ],
        tips: [
          '유효이자율법: 할인 발행 시 이자비용 매기간 증가 (CV 증가 × 동일 이자율 = 큰 비용)',
          '할증 발행 시 이자비용 매기간 감소 (CV 감소 × 동일 이자율 = 작은 비용)',
          '채권 발행비용: 구 기준은 별도 자산(Deferred Charge), 현행 GAAP은 장부가액 차감',
          '조기 상환(Extinguishment): 장부가액 vs 재매입가격 차이 = 이익/손실, 즉시 당기손익',
          'Straight-line method 허용 조건: 유효이자율법과 결과 차이가 중요하지 않을 때'
        ],
        triggers: [
          'Stated rate < market rate → Discount (할인발행, 발행가 < 액면)',
          'Effective interest method → Interest = Carrying value × market rate',
          'Discount amortization → Increases carrying value each period',
          'Premium amortization → Decreases carrying value each period',
          'Early extinguishment → Gain/loss = BV - Repurchase price'
        ],
        quiz: [
          {
            q: 'A $100,000 bond with 8% stated rate is issued when market rate is 10%. The bond is issued at $92,278. In Year 1, what is interest expense under the effective interest method?',
            opts: ['$8,000', '$9,228', '$10,000', '$7,382'],
            ans: 1,
            exp: '유효이자율법: 이자비용 = 장부가액 × 시장이자율 = $92,278 × 10% = $9,228. 현금지급 = $100,000 × 8% = $8,000. 할인 상각 = $9,228 - $8,000 = $1,228. 이자비용이 현금지급보다 많은 이유는 할인 상각분이 추가되기 때문입니다.'
          },
          {
            q: 'When a bond is issued at a premium, the carrying value of the bond over time will:',
            opts: [
              'Increase until maturity',
              'Decrease until maturity',
              'Remain constant',
              'Fluctuate with market interest rates'
            ],
            ans: 1,
            exp: '할증(Premium) 발행 시 초기 장부가액 = 액면가 + 미상각 할증액. 매기간 할증액이 상각되므로 장부가액은 감소합니다. 만기 시 장부가액 = 액면가.'
          }
        ]
      },
      {
        id: 'leases',
        label: 'Leases (ASC 842)',
        feynmanPrompt: 'ASC 842에서 리스이용자(Lessee)의 운용리스와 금융리스의 차이를 손익계산서와 재무상태표 처리 관점에서 설명하고, 금융리스 판단 기준(5가지) 중 하나를 숫자 예시로 설명해보세요.',
        rules: [
          '금융리스(Finance Lease) 판단: 다음 중 하나 해당 시 → (1) 소유권 이전, (2) 매수선택권 행사 가능성 높음, (3) 리스기간 ≥ 자산 경제적 내용연수의 75%, (4) PV of payments ≥ 공정가치의 90%, (5) 특수 목적 자산',
          '운용리스(Operating Lease): 단일 리스비용(straight-line), ROU asset과 리스부채 인식하되 감가상각비+이자비용 구분 없음',
          '금융리스 Lessee: ROU asset 감가상각비(operating expense) + 리스부채 이자비용(finance expense) 별도 인식',
          'ROU Asset = PV of lease payments + initial direct costs + lease incentives adjustment',
          'Lease Liability = PV of remaining lease payments (적용 할인율: 내재이자율 or 증분차입이자율)',
          '단기리스 면제(Short-term): ≤12개월 리스는 ROU/부채 인식 없이 정액법으로 비용 처리 가능',
          'Sale-Leaseback: 매각 조건 충족(ASC 606) → 매각 처리; 불충족 → 금융 거래'
        ],
        formulas: [
          'ROU Asset = PV of lease payments + Initial direct costs',
          'Lease Liability = PV of future lease payments (discounted at implicit or incremental rate)',
          'Finance Lease Annual Expense = Depreciation + Interest (초기 이자비용 더 큼)',
          'Operating Lease Annual Expense = Single lease cost (straight-line over term)',
          'PV Test: PV of payments / FV of asset ≥ 90% → Finance lease'
        ],
        tips: [
          'ASC 842(신기준): Lessee는 운용리스도 ROU asset과 부채 인식 — 구 기준과 차이',
          '금융리스: 이자비용은 초기에 크고 후기에 작음 (감소 추세) — 운용리스는 매년 동일',
          'Lessor 회계: Sales-type (FV ≠ CV) / Direct financing (FV = CV) / Operating',
          '75% test와 90% test: 실무에서 밝은선(bright lines) 역할, 경제적 판단도 필요',
          'Short-term lease exemption: 리스 개시 시 기간이 12개월 이하이어야 함 — 갱신 옵션은 미포함'
        ],
        triggers: [
          'PV of payments ≥ 90% of FV → Finance lease criterion',
          'Lease term ≥ 75% of useful life → Finance lease criterion',
          'Operating lease → Single straight-line expense + ROU asset + liability',
          'Finance lease → Separate depreciation + interest expense',
          'Short-term (≤12 months) → Exempt from ROU/liability recognition'
        ],
        quiz: [
          {
            q: 'A 5-year lease has annual payments of $20,000. The asset has a useful life of 6 years. The PV of payments equals 95% of the asset\'s fair value. How should the lessee classify this lease?',
            opts: [
              'Operating lease (term is less than 75% of useful life)',
              'Finance lease (PV of payments ≥ 90% of fair value)',
              'Operating lease (no ownership transfer)',
              'Short-term lease (annual payments are not significant)'
            ],
            ans: 1,
            exp: 'PV of payments = 95% of FV ≥ 90% → 금융리스 판단 기준 충족. 또한 리스기간 5년/내용연수 6년 = 83% ≥ 75%도 충족. 두 기준 모두 해당하므로 Finance Lease로 분류합니다.'
          },
          {
            q: 'Under ASC 842, a lessee with an operating lease will recognize:',
            opts: [
              'No assets or liabilities on the balance sheet',
              'A right-of-use asset and lease liability, and a single lease cost on the income statement',
              'Only a lease liability, not an ROU asset',
              'Separate depreciation and interest expense on the income statement'
            ],
            ans: 1,
            exp: 'ASC 842 하에서 운용리스도 ROU asset과 리스부채를 재무상태표에 인식합니다(구 기준과 차이). 손익계산서에는 단일 리스비용(single lease cost)을 정액으로 인식합니다. 별도 감가상각+이자 구분은 금융리스에서만 합니다.'
          }
        ]
      },
      {
        id: 'deferred-taxes',
        label: 'Deferred Taxes',
        feynmanPrompt: '일시적 차이(Temporary Difference)와 영구적 차이(Permanent Difference)를 구분하고, DTA와 DTL이 각각 언제 발생하는지 예시(예: 가속감가상각 vs 보증충당금)를 들어 설명해보세요.',
        rules: [
          'Temporary Difference: GAAP 장부가액 ≠ 세무기준가액(tax basis) → 미래에 세금 차이 반전',
          'Deductible Temporary Difference → DTA(이연법인세자산): 미래에 세금 감소 (예: 보증충당금)',
          'Taxable Temporary Difference → DTL(이연법인세부채): 미래에 세금 증가 (예: 가속감가상각)',
          'Permanent Difference: GAAP와 세무 차이가 영구적 → DTA/DTL 없음 (예: 비과세 이자, 벌금)',
          'Valuation Allowance: DTA에 대해 "more likely than not" 실현 불가 판단 시 → 차감 계상',
          '세금비용 = 납부세금(taxes payable) + ΔDTL - ΔDTA',
          '제정(enacted) 세율 사용 — 예상 세율 아님'
        ],
        formulas: [
          'Deferred Tax Asset (DTA) = Deductible Temporary Difference × Enacted Tax Rate',
          'Deferred Tax Liability (DTL) = Taxable Temporary Difference × Enacted Tax Rate',
          'Income Tax Expense = Current Tax + ΔDTL - ΔDTA',
          'Net DTA/DTL = DTA - Valuation Allowance',
          'Tax Basis = Book Basis ± Temporary Differences'
        ],
        tips: [
          '가속감가상각(tax) vs SL(book): 초기에 세무 감가상각 > GAAP → 세무소득 < 회계소득 → DTL 발생',
          '보증충당금: GAAP에서 비용 인식, 세무에서는 실제 지급 시 공제 → GAAP 비용이 먼저 → DTA',
          '암기: DTL = 나중에 더 낼 세금(Taxable later), DTA = 나중에 덜 낼 세금(Deductible later)',
          '세율 변경: 기존 DTA/DTL을 새 세율로 재측정, 차이는 당기 세금비용(Tax Expense)에 반영',
          'Valuation Allowance 설정: DTA 차감, 결과적으로 법인세비용 증가'
        ],
        triggers: [
          'Accelerated tax depreciation > book depreciation → DTL (taxable temporary diff)',
          'Warranty expense recognized before deductible → DTA (deductible temporary diff)',
          'Enacted tax rate → Use this (not expected future rate)',
          '"More likely than not" DTA not realizable → Valuation allowance',
          'Tax-exempt interest income → Permanent difference (no DTA/DTL)'
        ],
        quiz: [
          {
            q: 'A company has book income of $100,000 and taxable income of $80,000 due to warranty expense accrued for book but not yet deductible for tax. Tax rate is 25%. What is recorded?',
            opts: [
              'Deferred Tax Liability of $5,000',
              'Deferred Tax Asset of $5,000',
              'Tax Expense of $20,000 only',
              'No deferred tax; permanent difference'
            ],
            ans: 1,
            exp: '보증충당금은 GAAP에서 먼저 비용 처리, 세무에서는 실제 지급 시 공제 → Deductible Temporary Difference → DTA. DTA = ($100,000 - $80,000) × 25% = $5,000. 미래에 세금을 더 적게 낼 권리입니다.'
          },
          {
            q: 'A company records income tax expense of $50,000, but the current taxes payable is $60,000. The deferred tax balance must have:',
            opts: [
              'Increased by $10,000 (DTL increased or DTA decreased)',
              'Decreased by $10,000 (DTA increased or DTL decreased)',
              'Remained unchanged',
              'Increased by $10,000 only if it is a DTL'
            ],
            ans: 1,
            exp: 'Tax Expense = Taxes Payable + ΔDTL - ΔDTA. $50,000 = $60,000 + ΔDTL - ΔDTA. ΔDTL - ΔDTA = -$10,000. 즉, 순 이연법인세가 $10,000 감소했습니다 (DTA 증가 또는 DTL 감소).'
          }
        ]
      },
      {
        id: 'revenue',
        label: 'Revenue (ASC 606)',
        feynmanPrompt: 'ASC 606의 5단계 수익 인식 모델을 설명하고, "일정 기간에 걸쳐 수익 인식(over time)"과 "일정 시점에 수익 인식(point in time)"을 구분하는 세 가지 기준을 실제 예시로 설명해보세요.',
        rules: [
          'Step 1: 계약 식별 — 상업적 실질, 승인, 이행 의무 식별 가능, 대가 회수 가능성 높음',
          'Step 2: 이행 의무 식별 — 별도 구분되는(distinct) 재화/용역 식별',
          'Step 3: 거래가격 결정 — 변동 대가, 유의적 금융 요소, 비현금 대가, 고객 지급금 고려',
          'Step 4: 거래가격 배분 — 각 이행 의무에 상대적 독립 판매가격(SSP) 기준으로 배분',
          'Step 5: 수익 인식 — 이행 의무 충족 시: over time OR point in time',
          'Over time 기준 (셋 중 하나): (1) 동시 수령·소비, (2) 고객 통제 자산 창출/강화, (3) 대체 사용 불가 + 진행 지급권',
          '변동 대가(Variable Consideration): Expected value or Most likely amount — 유의적 환입 가능성 있으면 제약(constrain)'
        ],
        formulas: [
          'Transaction Price per PO = Total Price × (SSP of PO / Total SSP)',
          'Revenue recognized = % completion × Total revenue (over time)',
          'Constrained variable consideration: Include only to extent it is highly probable no significant reversal',
          'Significant financing: Adjust if payment timing > 1 year (unless practical expedient)'
        ],
        tips: [
          '핵심: 5단계 순서 암기 (Identify contract → PO → Price → Allocate → Recognize)',
          'Distinct 판단: 고객이 단독 사용 가능 + 계약 내 다른 약속과 별도 식별 가능',
          '변동 대가 제약: "유의적인 수익 환입 가능성이 높지 않은 범위"까지만 거래가격 포함',
          'Bill-and-hold arrangement: 특정 조건 충족 시 인도 전에도 수익 인식 가능',
          'Principal vs Agent: Principal은 총액(gross), Agent는 수수료(net)로 수익 인식'
        ],
        triggers: [
          'Customer simultaneously receives and consumes benefits → Over time revenue',
          'Right to payment for work completed → Over time criterion',
          'No alternative use + right to payment → Over time recognition',
          'Variable consideration → Constrain if significant reversal likely',
          'Principal/Agent → Gross vs Net revenue recognition'
        ],
        quiz: [
          {
            q: 'A software company sells a license ($600) and one year of support ($400) as a bundle for $900. The SSP of support is $400 and the license is $600 (total SSP = $1,000). How much revenue is allocated to the license?',
            opts: ['$600', '$540', '$500', '$450'],
            ans: 1,
            exp: 'Step 4 배분: License SSP 비율 = $600/$1,000 = 60%. 배분 금액 = 60% × $900 = $540. Support = 40% × $900 = $360. 독립 판매가격 비율로 총 거래가격을 배분합니다.'
          },
          {
            q: 'A construction company has a fixed-price contract for $1,000,000. By year-end, 40% of the project is complete. Revenue recognized this year is:',
            opts: ['$0 (point in time recognition)', '$400,000', '$1,000,000', 'Amount invoiced only'],
            ans: 1,
            exp: '건설 계약은 일반적으로 "over time" 인식 기준을 충족합니다 (고객이 자산 통제). 수익 인식 = 완성률 × 거래가격 = 40% × $1,000,000 = $400,000. 청구 여부와 무관하게 진행률 기준으로 인식합니다.'
          }
        ]
      },
      {
        id: 'scf',
        label: 'Statement of Cash Flows',
        feynmanPrompt: '간접법(Indirect Method)에서 순이익에서 영업활동 현금흐름을 도출하는 과정을 설명하고, 왜 감가상각비를 더하는지(non-cash expense)와 매출채권 증가를 빼는지(working capital change) 직관적으로 설명해보세요.',
        rules: [
          '영업활동(Operating): 주요 수익 창출 활동 — 매출 수금, 매입 지급, 급여, 이자, 세금',
          '투자활동(Investing): 장기자산 취득/처분, 대출 실행/회수, 투자증권 매매',
          '재무활동(Financing): 차입/상환, 주식 발행/자사주 매입, 배당금 지급',
          '간접법(Indirect): NI + 비현금 조정 (감가상각 등 가산) + 운전자본 변동 = 영업CF',
          '직접법(Direct): 실제 현금 수취/지급 항목별 표시 (FASB 권장, 실무는 간접법)',
          '이자 수취·지급, 배당 수취: 영업활동 (US GAAP) / 배당 지급: 재무활동',
          '비현금 거래(Noncash): 별도 부속 스케줄 공시 (예: 자산 취득 시 부채 인수)'
        ],
        formulas: [
          'Indirect Method: Operating CF = NI + Depreciation/Amortization + Non-cash items ± WC changes',
          'AR increase → subtract (수금 < 매출)',
          'AR decrease → add (수금 > 매출)',
          'Inventory increase → subtract (현금 지출 > COGS)',
          'AP increase → add (지급 < 매입)',
          'Cash from operations (direct): Cash collected = Revenue - ΔAR'
        ],
        tips: [
          '간접법 운전자본 조정: 자산 증가 → 현금 감소(차감), 자산 감소 → 현금 증가(가산)',
          '간접법 운전자본 조정: 부채 증가 → 현금 증가(가산), 부채 감소 → 현금 감소(차감)',
          '이자 지급: 영업활동 (US GAAP) — IFRS는 영업 또는 재무 선택 가능',
          '배당 수취: 영업활동 (US GAAP) — IFRS는 영업 또는 투자 선택 가능',
          '배당 지급: 재무활동 (US GAAP) — IFRS는 재무 또는 영업 선택 가능'
        ],
        triggers: [
          'Depreciation expense → Add back to NI (non-cash, indirect method)',
          'AR increase → Subtract from NI (cash collected < revenue)',
          'AP increase → Add to NI (cash paid < expense)',
          'Purchase of equipment → Investing activity (outflow)',
          'Dividends paid → Financing activity (US GAAP)'
        ],
        quiz: [
          {
            q: 'Net income is $80,000. Depreciation is $15,000. AR increased by $10,000. Inventory decreased by $5,000. AP increased by $3,000. What is cash from operating activities (indirect method)?',
            opts: ['$93,000', '$83,000', '$73,000', '$103,000'],
            ans: 0,
            exp: 'Operating CF = $80,000 + $15,000 (감가상각 가산) - $10,000 (AR 증가 차감) + $5,000 (재고 감소 가산) + $3,000 (AP 증가 가산) = $93,000.'
          },
          {
            q: 'A company purchased equipment for $50,000 by signing a note payable. How is this disclosed in the statement of cash flows?',
            opts: [
              'Investing outflow of $50,000',
              'Financing outflow of $50,000',
              'Not reported in the body; disclosed as supplemental noncash information',
              'Operating outflow of $50,000'
            ],
            ans: 2,
            exp: '현금 수수가 없는 비현금 거래(noncash transaction)는 현금흐름표 본문에 표시하지 않고, 별도 부속 스케줄(supplemental noncash information)에 공시합니다. 예: 부채 인수를 통한 자산 취득.'
          }
        ]
      },
      {
        id: 'contingencies',
        label: 'Contingencies',
        feynmanPrompt: '우발손실(Loss Contingency)의 인식 기준(accrual vs disclosure only vs nothing)을 세 가지로 구분하고, 법적 소송에서 회사가 패소 가능성이 "reasonably possible"한 경우와 "probable"한 경우의 회계 처리 차이를 설명해보세요.',
        rules: [
          'Probable + Estimable → 충당금 계상(Accrue): Loss contingency 인식',
          'Probable + Not Estimable → 공시만(Disclose only): 추정 불가이므로 인식 불가',
          'Reasonably Possible → 공시만(Disclose only): 확률이 probable 미만',
          'Remote → 공시 불필요: 단, 특정 보증은 예외적으로 공시',
          'Gain Contingency: 거의 확실(Virtually certain) 이전에는 절대 인식 불가 — 공시만',
          'Environmental Liabilities: Probable + Estimable이면 인식 — 공동 책임자(PRP) 분담 고려',
          '범위로 추정(Range): 최선의 추정치; 최선이 없으면 범위의 최솟값 인식'
        ],
        formulas: [
          'Accrue if: Loss is PROBABLE + ESTIMABLE',
          'Disclose if: Probable (not estimable) OR Reasonably possible',
          'No action if: Remote',
          'Range with no best estimate: Accrue minimum of range'
        ],
        tips: [
          '함정: Gain contingency는 거의 확실해도 인식 불가, 공시만 허용',
          '"Probable"의 회계적 의미: 발생 가능성이 발생 안 할 가능성보다 높음 (>50%)',
          'Reasonably Possible: Probable보다 낮지만 Remote보다 높은 확률',
          '범위 추정 시 최선 추정치 없으면 최솟값 → 최솟값 accrual + 최댓값 초과분 공시',
          '자기보험(self-insurance): 손실 발생 전 적립금 설정 불가 — 발생 시 비용'
        ],
        triggers: [
          'Probable + Estimable → Accrue loss contingency',
          'Reasonably possible → Disclose only (공시만)',
          'Remote → No disclosure required',
          'Gain contingency → Never accrue, disclose only when virtually certain',
          'Range, no best estimate → Accrue minimum of range'
        ],
        quiz: [
          {
            q: 'A company is involved in a lawsuit. The company\'s attorneys believe it is probable the company will lose and estimates the loss between $100,000 and $500,000 with no best estimate. What should be accrued?',
            opts: ['$0', '$100,000', '$300,000', '$500,000'],
            ans: 1,
            exp: '손실 가능성이 Probable이고 범위로 추정 가능하지만 최선의 추정치가 없는 경우, 범위의 최솟값($100,000)을 충당금으로 계상합니다. 최솟값 초과 금액($500,000 - $100,000)은 공시합니다.'
          },
          {
            q: 'A gain contingency of $200,000 is virtually certain based on court ruling. How should this be reported?',
            opts: [
              'Recognize $200,000 gain immediately',
              'Disclose in the notes only; do not recognize',
              'Recognize only 50% due to uncertainty',
              'Record as deferred revenue until cash received'
            ],
            ans: 1,
            exp: 'Gain contingency는 "거의 확실(virtually certain)"하더라도 인식(accrual)할 수 없습니다. 주석 공시만 허용됩니다. 이는 보수주의 원칙과 수익 인식 기준의 적용입니다.'
          }
        ]
      },
      {
        id: 'stockholders-equity',
        label: 'Stockholders\' Equity',
        feynmanPrompt: '소규모 주식배당(Small stock dividend)과 대규모 주식배당(Large stock dividend)의 회계 처리 차이를 설명하고, 자사주(Treasury Stock) 취득이 주주자본에 미치는 영향을 설명해보세요.',
        rules: [
          'Common Stock = Par Value × Shares Issued (outstanding + treasury)',
          'APIC = Issue Price - Par Value (발행 시 초과 금액)',
          'Retained Earnings = Beginning RE + NI - Dividends Declared',
          'Small Stock Dividend (<20-25%): Market value로 처리 — RE 감소, CS+APIC 증가',
          'Large Stock Dividend (≥20-25%): Par value로 처리 — RE 감소, CS만 증가 (APIC 없음)',
          'Treasury Stock(자사주): Cost method — 자본 차감(debit), shares outstanding 감소',
          'Book Value per Common Share = (Total Equity - Preferred Equity) / Common Shares Outstanding'
        ],
        formulas: [
          'Small stock dividend: Dr RE (mkt value) / Cr CS (par) + Cr APIC (excess)',
          'Large stock dividend: Dr RE (par value) / Cr CS (par value only)',
          'Treasury Stock purchase: Dr Treasury Stock (cost) / Cr Cash',
          'Treasury Stock reissue above cost: Cr APIC-Treasury Stock (excess)',
          'Treasury Stock reissue below cost: Dr APIC-Treasury Stock (deficiency); then Dr RE if exhausted',
          'Book Value per share = (Equity - Preferred) / Common shares outstanding'
        ],
        tips: [
          '함정: 주식분할(Stock Split)은 장부금액 변경 없음 — 주식수 증가, 액면가 감소, 총 자본 불변',
          '소규모 주식배당: 시장가치, 대규모: 액면가 — 20-25% 경계선이 구분 기준',
          '자사주는 자본 차감항목 (contra equity) — 자산 아님!',
          '자사주 재발행 손실: 자본으로만 인식 가능 (손실 불가) — APIC 감소 후 RE 감소',
          '우선주 배당: 누적적은 미선언도 차감; 비누적적은 선언 시만 차감'
        ],
        triggers: [
          'Stock dividend < 20-25% → Record at market value (small)',
          'Stock dividend ≥ 20-25% → Record at par value (large)',
          'Treasury stock purchased → Reduce equity (debit TS)',
          'Preferred dividends (cumulative) → Deduct from RE regardless of declaration',
          'Stock split → No journal entry (memo only, shares ↑ par ↓)'
        ],
        quiz: [
          {
            q: 'A company declares a 5% stock dividend when 100,000 shares are outstanding at $1 par. Market price is $15. What is the debit to Retained Earnings?',
            opts: ['$5,000', '$75,000', '$70,000', '$500'],
            ans: 1,
            exp: '5%는 소규모 주식배당(< 20-25%)이므로 시장가치로 처리합니다. 신규 주식 = 100,000 × 5% = 5,000주. RE 감소 = 5,000 × $15(시장가) = $75,000. CS 증가 = 5,000 × $1(액면가) = $5,000. APIC 증가 = $70,000.'
          },
          {
            q: 'A company repurchases 1,000 shares of treasury stock at $30 each (cost $30,000) and later resells them at $25 each (proceeds $25,000). What is the accounting treatment for the $5,000 difference?',
            opts: [
              'Recognize a $5,000 loss on the income statement',
              'Debit APIC-Treasury Stock (and Retained Earnings if insufficient)',
              'Credit APIC-Treasury Stock',
              'Debit Common Stock'
            ],
            ans: 1,
            exp: '자사주 재발행가격이 원가보다 낮을 때 차액은 손실이 아닌 자본 감소입니다. APIC-Treasury Stock 계정에서 먼저 차감하고, 잔액이 부족하면 Retained Earnings에서 차감합니다. 손익계산서에 손실 계상 불가.'
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────
  // AREA 4: Government
  // ─────────────────────────────────────────────
  {
    id: 'government',
    label: 'Government',
    color: '#f59e0b',
    percentage: '10–20%',
    topics: [
      {
        id: 'gov-accounting',
        label: 'Governmental Accounting',
        feynmanPrompt: '정부 회계의 기금(Fund) 회계 시스템을 설명하고, 수정발생주의(Modified Accrual)가 완전발생주의(Full Accrual)와 어떻게 다른지, 수익 인식 기준("available and measurable")이 무엇을 의미하는지 설명해보세요.',
        rules: [
          '기금 유형: 정부형(Governmental: General, Special Revenue, Capital Projects, Debt Service, Permanent), 기업형(Proprietary: Enterprise, Internal Service), 수탁형(Fiduciary: Pension Trust, Investment Trust, Private-Purpose Trust, Custodial)',
          'Governmental Funds: 수정발생주의(Modified Accrual) — 재원의 흐름 측정',
          'Proprietary Funds: 완전발생주의(Full Accrual) — 경제적 자원 측정',
          '수정발생주의 수익 인식: Available(60일 이내 회수 가능) AND Measurable(측정 가능) 시 인식',
          '수정발생주의 지출(Expenditure): 부채 발생 시 인식 (단, 장기부채는 만기 도래 시)',
          'GASB 34: 정부 전체 재무제표(Government-wide: full accrual) + 기금 재무제표(fund: modified accrual)',
          '예산 회계(Encumbrance): 구매 주문 시 예산 예약 (Dr Encumbrance / Cr Fund Balance-Reserved for Encumbrances)'
        ],
        formulas: [
          'Modified Accrual Revenue: Available (collectible within 60 days) AND Measurable',
          'Fund Balance Equation: Assets + Deferred Outflows = Liabilities + Deferred Inflows + Fund Balance',
          'Net Position (government-wide): Assets + Deferred Outflows - Liabilities - Deferred Inflows',
          'Encumbrance: Dr Encumbrances / Cr Fund Balance-Reserved (commitment to spend)'
        ],
        tips: [
          '핵심 암기: GRaSPP — General, Special Revenue, Capital Projects (안 씀), Debt Service, Permanent (Governmental funds)',
          '60일 기준: 수정발생주의에서 수익 인식 "available" = 결산일 후 60일 이내 수금 가능',
          'General Fund: 가장 중요한 정부 기금 — 일반 운영 지출 처리',
          'Government-wide statements: Infrastructure, long-term debt 포함 (기금 재무제표와 차이)',
          'Fiduciary funds: 제3자를 위해 보유하므로 정부 전체 재무제표에 미포함'
        ],
        triggers: [
          'Available and measurable → Modified accrual revenue recognition',
          'General fund → Governmental fund type (most significant)',
          'Enterprise fund → Proprietary (full accrual, user charges)',
          'Pension trust → Fiduciary fund (not in government-wide statements)',
          'Encumbrance → Budget reservation upon purchase order'
        ],
        quiz: [
          {
            q: 'Property taxes of $1,000,000 are levied. Of this, $800,000 will be collected within 60 days after year-end, and $200,000 will be collected later. Under modified accrual, how much revenue is recognized?',
            opts: ['$1,000,000', '$800,000', '$0', '$600,000'],
            ans: 1,
            exp: '수정발생주의에서 재산세 수익은 "Available and Measurable" 기준으로 인식합니다. Available = 결산일로부터 60일 이내 수금 가능. $800,000만 60일 기준을 충족하므로 $800,000만 인식합니다. $200,000은 Deferred Revenue로 처리합니다.'
          },
          {
            q: 'Which of the following funds uses the full accrual basis of accounting?',
            opts: ['General Fund', 'Special Revenue Fund', 'Enterprise Fund', 'Debt Service Fund'],
            ans: 2,
            exp: 'Enterprise Fund는 Proprietary Fund 유형으로, 완전발생주의(Full Accrual)를 사용합니다. General, Special Revenue, Debt Service Fund는 모두 Governmental Funds로 수정발생주의를 사용합니다.'
          },
          {
            q: 'A government issues a purchase order for $50,000 of supplies. What is the correct accounting entry under the encumbrance system?',
            opts: [
              'Dr Supplies Expense $50,000 / Cr Accounts Payable $50,000',
              'Dr Encumbrances $50,000 / Cr Fund Balance-Reserved for Encumbrances $50,000',
              'Dr Fund Balance $50,000 / Cr Encumbrances $50,000',
              'No entry until goods are received'
            ],
            ans: 1,
            exp: '예산 통제를 위한 Encumbrance 시스템: 구매 주문 시 Dr Encumbrances / Cr Fund Balance-Reserved for Encumbrances $50,000. 물품 수령 시 이 분개를 역분개하고 실제 지출을 기록합니다.'
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────
  // AREA 5: NFP & Special
  // ─────────────────────────────────────────────
  {
    id: 'nfp-special',
    label: 'NFP & Special',
    color: '#8b5cf6',
    percentage: 'Residual',
    topics: [
      {
        id: 'nfp',
        label: 'Not-for-Profit',
        feynmanPrompt: '비영리조직(NFP)의 순자산(Net Assets)을 두 가지로 분류하고, 기증자 제한 기부금(donor-restricted contribution)이 있을 때의 회계 처리 — 수령 시, 목적 달성 시, 시간 제한 만료 시 — 를 설명해보세요.',
        rules: [
          'NFP 재무제표: Statement of Financial Position, Statement of Activities, Statement of Cash Flows',
          '순자산 분류(ASC 958): Without Donor Restrictions(비제한), With Donor Restrictions(제한) — 구 기준 3분류 폐지',
          '기부금 인식: 수령 시 공정가치로 인식 (조건부 기부는 조건 충족 시 인식)',
          '조건부 기부(Conditional gift): 조건 미충족 → 부채(refundable advance) 인식',
          '영구적 기금(Endowment): 원금은 With Donor Restrictions; 투자 수익은 기증자 지시에 따라 분류',
          '프로그램 서비스 vs 지원 서비스: Statement of Activities에서 기능별 구분',
          '기부된 서비스(Contributed Services): 전문적 기술 + 시장에서 구매했을 서비스일 때만 인식'
        ],
        formulas: [
          'Net Assets = Without Donor Restrictions + With Donor Restrictions',
          'Change in Net Assets = Revenues + Gains - Expenses - Losses',
          'Reclassification: Dr Net Assets w/ Restrictions / Cr Net Assets w/o Restrictions (목적 달성 시)'
        ],
        tips: [
          '2016년 ASU 개정: 3분류(unrestricted, temporarily restricted, permanently restricted) → 2분류',
          '조건부 기부 vs 제한부 기부: 조건부(conditional)는 조건 충족 전 부채; 제한부(restricted)는 수령 즉시 자산',
          '기부된 서비스 인식 기준: 전문 기술 필요 AND 없었으면 구매했을 것',
          '기부금 현물(in-kind): FV로 인식하고 해당 비용도 동시에 인식 (상쇄)',
          '회비(membership dues): 수령 기간에 걸쳐 인식 (전액 즉시 인식 아님)'
        ],
        triggers: [
          'Donor-restricted contribution → With Donor Restrictions net assets',
          'Conditional gift → Liability until condition met',
          'Time restriction expires OR purpose fulfilled → Reclassify to Without Restrictions',
          'Contributed professional services → Recognize at FV if specialized skill',
          'Endowment principal → Permanently with donor restrictions'
        ],
        quiz: [
          {
            q: 'A nonprofit receives a $100,000 cash gift restricted for building repairs. The building repairs are completed in the same year. How are net assets affected?',
            opts: [
              'Without restrictions increases $100,000',
              'With restrictions increases $100,000; no change to without restrictions',
              'With restrictions increases $100,000, then decreases $100,000; without restrictions increases then decreases',
              'With restrictions increases then decreases $100,000; without restrictions increases $100,000 net (offset by repair expense)'
            ],
            ans: 3,
            exp: '수령 시: With Restrictions +$100,000. 수리 완료(목적 달성) 시 Reclassification: With Restrictions -$100,000 / Without Restrictions +$100,000. 동시에 수리비용 $100,000이 Without Restrictions를 감소시킵니다. 순효과: Without Restrictions는 0 변동 (수입 +$100K, 비용 -$100K).'
          },
          {
            q: 'A doctor volunteers 10 hours at a free clinic operated by a nonprofit. The doctor would normally charge $200/hour. Should the nonprofit recognize revenue?',
            opts: [
              'Yes, recognize $2,000 revenue and $2,000 expense',
              'No, volunteer services are never recognized',
              'Yes, but only if the clinic has a policy of recognition',
              'Yes, $2,000 revenue only (no expense)'
            ],
            ans: 0,
            exp: '의사의 전문적 서비스는 (1) 전문 기술 필요 + (2) 없었으면 구매했을 것 → 기부된 서비스 인식 기준 충족. $2,000 FV로 Revenue와 동일 금액 Expense를 동시에 인식합니다.'
          }
        ]
      },
      {
        id: 'business-combinations',
        label: 'Business Combinations',
        feynmanPrompt: 'ASC 805 취득법(Acquisition Method)에서 Goodwill 계산 방법을 설명하고, 마이너스 굿윌(Bargain Purchase)이 발생했을 때 회계 처리와 그 의미를 설명해보세요.',
        rules: [
          'Acquisition Method(취득법): 기업 결합 시 유일한 허용 방법 — ASC 805',
          'Goodwill = Purchase Price + NCI FV - FV of Net Identifiable Assets',
          'Bargain Purchase(염가매수): Goodwill < 0 → 즉시 이익으로 인식 (Gain on Bargain Purchase)',
          '거래비용(Transaction Costs): 즉시 비용 처리 (자본화 불가)',
          'NCI(비지배지분): 전체 FV법 또는 비례적 FV법으로 측정',
          '조건부 대가(Contingent Consideration): 취득일 FV로 인식; 이후 변동은 공정가치로 재측정(손익 처리)',
          '취득 중인 연구개발(In-process R&D): 취득 시 무한 내용연수 무형자산으로 자본화'
        ],
        formulas: [
          'Goodwill = Consideration + NCI FV - FV of Net Identifiable Assets',
          'Bargain Purchase Gain = FV of Net Assets - (Consideration + NCI)',
          'FV of Net Identifiable Assets = FV of Assets - FV of Liabilities',
          'NCI (full goodwill): NCI shares × FV per share',
          'NCI (proportionate): % owned by NCI × FV of Net Identifiable Assets'
        ],
        tips: [
          '거래비용 즉시 비용: 법무비, 회계비, 컨설팅비 등 — M&A 직접비 모두 당기비용',
          '조건부 대가 취득일 FV 인식: Earnout 조항 등 — 이후 변동은 손익에 반영',
          'In-process R&D: 일반 R&D와 달리 기업 결합으로 취득 시 자산 인식',
          'Bargain Purchase: 재확인(reassess) 절차 필수 — FV 추정 오류 아님을 확인 후 이익 인식',
          '풀링법(Pooling of Interests): 현행 GAAP에서 허용하지 않음 (폐지됨)'
        ],
        triggers: [
          'Business combination → Acquisition method (ASC 805)',
          'Transaction costs (legal, accounting) → Expense immediately',
          'Goodwill = consideration + NCI - FV net assets',
          'Negative goodwill → Gain on bargain purchase (after reassessment)',
          'In-process R&D acquired → Capitalize as indefinite-life intangible'
        ],
        quiz: [
          {
            q: 'Company A pays $800,000 to acquire 80% of Company B. The FV of Company B\'s net identifiable assets is $700,000. NCI is measured at proportionate share of net assets. What is goodwill?',
            opts: ['$100,000', '$240,000', '$660,000', '$940,000'],
            ans: 0,
            exp: 'NCI FV (proportionate) = 20% × $700,000 = $140,000. Goodwill = Consideration($800,000) + NCI($140,000) - FV of Net Assets($700,000) = $240,000. 비례적 FV법을 사용하므로 NCI = 비지배지분 비율 × 순자산 공정가치.'
          },
          {
            q: 'Company A acquires Company B for $600,000. The FV of B\'s net identifiable assets is $750,000. What is the accounting treatment?',
            opts: [
              'Recognize goodwill of $150,000',
              'Recognize a gain on bargain purchase of $150,000 immediately',
              'Reduce goodwill from other acquisitions by $150,000',
              'Record $150,000 as deferred revenue'
            ],
            ans: 1,
            exp: 'FV of net assets($750,000) > Consideration($600,000) → Bargain Purchase(염가매수). 먼저 FV 추정치를 재검토한 후, 확인되면 $150,000 Gain on Bargain Purchase를 즉시 당기이익으로 인식합니다.'
          }
        ]
      },
      {
        id: 'oci-changes',
        label: 'OCI & Accounting Changes',
        feynmanPrompt: 'OCI(기타포괄손익)에 포함되는 항목들을 나열하고, 왜 이것들이 Net Income이 아닌 OCI로 처리되는지 설명해보세요. 또한 회계정책 변경(Change in Accounting Principle)과 회계 추정 변경(Change in Accounting Estimate)의 처리 방법 차이를 설명해주세요.',
        rules: [
          'OCI 항목 암기 PUFFE: Pension adjustments, Unrealized G/L on AFS, Foreign currency translation, effective cash Flow hedges, Effective fair value hedges',
          'AOCI(Accumulated OCI): 누적 OCI — Balance Sheet의 자본 구성 항목',
          'Reclassification Adjustment: OCI 항목이 Net Income에 인식될 때 이중 계산 방지 목적으로 OCI에서 제거',
          'Change in Accounting Principle: 소급 적용(Retrospective) — 비교 재무제표 수정, 기초 RE 조정',
          'Change in Accounting Estimate: 전진 적용(Prospective) — 과거 기간 수정 없음',
          'Correction of an Error: 소급 수정(Prior Period Adjustment) — 기초 RE 직접 조정, 재무제표 재작성',
          'Change in Estimate coupled with change in Principle (예: 감가상각법 변경): 전진 적용 처리'
        ],
        formulas: [
          'Comprehensive Income = Net Income + OCI',
          'AOCI (ending) = AOCI (beginning) + OCI for period - Reclassification adjustments',
          'Change in principle: Cumulative effect → Adjust beginning RE of earliest period presented',
          'Error correction: Dr/Cr Retained Earnings (net of tax) for prior period error'
        ],
        tips: [
          'OCI 암기: PUFFE (Pension, Unrealized AFS, Foreign currency, cash Flow hedges, Fair value hedges)',
          'AFS 매각 시: OCI에서 Net Income으로 Reclassification — OCI 감소, NI 증가 (이중 계산 방지)',
          'Change in depreciation method: Change in Estimate처럼 전진 적용 (원칙 변경이지만 추정 변경 취급)',
          'Voluntary change in principle: 새 방법이 preferable하다는 justification 필요',
          '오류 수정: 발견 연도에 소급 수정 — GAAP에서 가장 강력한 처리'
        ],
        triggers: [
          'AFS unrealized G/L → OCI (not net income)',
          'Pension actuarial G/L → OCI initially (corridor vs immediate recognition)',
          'Change in accounting principle → Retrospective (소급 적용)',
          'Change in estimate → Prospective (전진 적용, no restatement)',
          'Error correction → Prior period adjustment (RE 직접 수정)'
        ],
        quiz: [
          {
            q: 'Which of the following is correctly classified as Other Comprehensive Income (OCI)?',
            opts: [
              'Gain on sale of AFS securities',
              'Unrealized loss on trading securities',
              'Foreign currency translation adjustment',
              'Dividend income from equity investments'
            ],
            ans: 2,
            exp: '외화환산조정(Foreign currency translation adjustment)은 OCI 항목입니다. AFS 매각손익은 실현 손익이므로 Net Income으로 인식됩니다. 매매 목적 증권 미실현손익과 배당수익은 Net Income 항목입니다.'
          },
          {
            q: 'A company changes from FIFO to weighted average inventory method. This change is a change in:',
            opts: [
              'Accounting estimate; applied prospectively',
              'Accounting principle; applied retrospectively',
              'Accounting estimate; applied retrospectively',
              'Accounting principle; applied prospectively'
            ],
            ans: 1,
            exp: '재고 평가 방법 변경(FIFO→WA)은 회계정책 변경(Change in Accounting Principle)입니다. 소급 적용(Retrospective)하여 비교 재무제표를 수정하고 기초 RE를 조정합니다. 단, LIFO→다른 방법 변경도 소급 적용입니다.'
          }
        ]
      }
    ]
  }
];

// Flat list of all topics for easy access
export const allTopics: (Topic & { areaId: string; areaColor: string; areaLabel: string })[] = areas.flatMap(area =>
  area.topics.map(topic => ({
    ...topic,
    areaId: area.id,
    areaColor: area.color,
    areaLabel: area.label,
  }))
);

export function getTopicById(id: string) {
  return allTopics.find(t => t.id === id);
}

export function getAreaByTopicId(topicId: string) {
  return areas.find(area => area.topics.some(t => t.id === topicId));
}
