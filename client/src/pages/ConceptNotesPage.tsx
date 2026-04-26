import { useState, useMemo, useCallback, useEffect } from 'react';
import useStudyStore from '../store/studyStore';
import { fetchJournalEnrichments, JournalEnrichment, fetchConceptCardsByTopic, ConceptCardRow } from '../lib/db';

interface ALItem {
  cat: string; item: string; std: string;
  rule: string; trigger: string; trap: string;
  situation_ko: string; situation_en: string;
  journal_entry?: string;
  formula?: string;
  related_concepts?: string[];
}
interface ValItem {
  cat: string; item: string; std: string;
  method: string; rule: string; trigger: string; trap: string;
  situation_ko: string; situation_en: string;
  journal_entry?: string;
  formula?: string;
  related_concepts?: string[];
}
type QuizItem = {
  cat: string; item: string; std: string; method?: string;
  rule: string; trigger: string; trap: string;
  situation_ko: string; situation_en: string;
  journal_entry?: string;
  formula?: string;
  related_concepts?: string[];
};
type TabKey = 'asset-liability' | 'valuation' | 'ratios' | 'misc';
type ViewMode = 'table' | 'quiz';
type LangKey = 'ko' | 'en';

// ─── Data ─────────────────────────────────────────────────────

const assetLiabilityData: ALItem[] = [
  { cat:"Receivables", item:"A/R Factoring — Sale", std:"gaap",
    situation_ko:"중소 제조업체가 외상매출금 5억 원을 팩터링사에 매각하고 즉시 현금을 수령했다.",
    situation_en:"A manufacturer sells $500K of A/R to a factor and receives immediate cash proceeds.",
    rule:"Control 이전 → A/R 제거. Cash + Loss 인식. Recourse 있으면 recourse liability 추가 인식.",
    trigger:"'sold receivables' / 'transferred A/R' / 'without recourse'",
    trap:"Recourse를 asset으로 착각. A/R 제거 vs 유지 혼동. With recourse → liability 인식 필수.",
    related_concepts:["A/R Pledged — Borrowing", "Notes Receivable (Long-term)"] },
  { cat:"Receivables", item:"A/R Pledged — Borrowing", std:"gaap",
    situation_ko:"회사가 외상매출금 3억 원을 담보로 제공하고 은행에서 2억 원을 차입했다.",
    situation_en:"Company pledges $300K of A/R as collateral and borrows $200K from a bank.",
    rule:"Control 유지 → A/R 제거하지 않음. Cash 수령 + Note payable 인식.",
    trigger:"'pledged as collateral' / 'assigned receivables' / 'borrowing against A/R'",
    trap:"담보 제공을 A/R 제거로 착각. A/R은 BS에 그대로 유지.",
    related_concepts:["A/R Factoring — Sale"] },
  { cat:"Receivables", item:"Notes Receivable (Long-term)", std:"gaap",
    situation_ko:"고객에게 3년 만기 무이자 어음 1억 원을 수령했고, 시장이자율은 연 8%이다.",
    situation_en:"Company receives a 3-year, non-interest-bearing note for $100K when the market rate is 8%.",
    rule:"PV로 인식(시장이자율 할인). 이자수익 = 유효이자율법. Non-interest-bearing → 할인 필수.",
    trigger:"'non-interest-bearing note' / 'below-market rate'",
    trap:"액면가로 인식하면 오답. 이자수익은 carrying value × market rate." },
  { cat:"Inventory", item:"FOB Shipping Point", std:"gaap",
    situation_ko:"12월 30일 FOB 선적 조건으로 출하된 재고가 연말 현재 운송 중이다.",
    situation_en:"Goods shipped FOB shipping point on Dec 30 are still in transit at year-end Dec 31.",
    rule:"선적 시점에 구매자가 title + risk 취득 → 구매자 inventory.",
    trigger:"'FOB shipping point' / '운송 중 재고 귀속'",
    trap:"물리적 점유 기준으로 판단. FOB destination과 혼동." },
  { cat:"Inventory", item:"Consignment", std:"gaap",
    situation_ko:"제조사가 소매점에 상품 100개를 위탁판매 목적으로 보냈고, 소매점이 물리적으로 보유 중이다.",
    situation_en:"Manufacturer ships 100 units to a retailer on consignment; retailer holds them physically.",
    rule:"Consignor가 판매 시까지 control 유지 → consignor inventory. Consignee BS에 포함 안 됨.",
    trigger:"'consignment' / 'goods on consignment'",
    trap:"Consignee가 physical possession → inventory로 착각. Control 기준으로 판단." },
  { cat:"Revenue", item:"Revenue Recognition (ASC 606)", std:"gaap",
    situation_ko:"소프트웨어 회사가 라이선스 + 1년 유지보수를 번들로 $120K에 판매했다.",
    situation_en:"Software firm sells a bundled license + 1-year maintenance contract for $120K total.",
    rule:"5-step: 계약식별 → 수행의무 → 거래가격 → SSP배분 → control 이전 시 인식.",
    trigger:"'performance obligation satisfied' / 'control transferred' / 'point in time vs over time'",
    trap:"현금 수령 시점 = 수익 인식으로 착각. Shipment vs delivery 혼동." },
  { cat:"Revenue", item:"Deferred Revenue (Unearned)", std:"gaap",
    situation_ko:"소매업체가 연말에 기프트카드 1천만 원어치를 판매했으나 아직 사용되지 않았다.",
    situation_en:"Retailer sells $10K of gift cards at year-end; none have been redeemed yet.",
    rule:"선수금 수령 → control 미이전 → liability. 수행의무 완료 시 revenue로 전환.",
    trigger:"'advance payment' / 'gift cards' / 'contract liability'",
    trap:"현금 받으면 바로 revenue 인식. Deferred revenue를 asset으로 착각." },
  { cat:"Revenue", item:"Long-term Contracts (POC)", std:"gaap",
    situation_ko:"건설사가 3년 계약(총 예상원가 $10M) 중 첫 해에 $4M을 집행했다.",
    situation_en:"Contractor incurs $4M in year 1 of a 3-year contract with total estimated costs of $10M.",
    rule:"진행률 = costs incurred ÷ total estimated costs. 손실 예상 시 전액 즉시 인식.",
    trigger:"'percentage of completion' / 'estimated total cost 변경'",
    trap:"Completed contract method와 혼동. 예상 손실 분할 인식하면 오답." },
  { cat:"Liabilities", item:"Contingent Liability", std:"gaap",
    situation_ko:"회사가 환경오염 소송에 걸렸고, 법무팀이 패소 가능성이 높고 손실액 추정이 가능하다고 판단했다.",
    situation_en:"Company faces an environmental lawsuit; counsel concludes loss is probable and estimable.",
    rule:"Probable + Estimable → accrual. Reasonably possible → disclosure only. Remote → nothing.",
    trigger:"'probable' / 'guarantee' / 'lawsuit' / 'warranty'",
    trap:"모든 가능성 accrual. Gain contingency를 수익 인식(실현 시까지 불가)." },
  { cat:"Liabilities", item:"Warranty Liability", std:"gaap",
    situation_ko:"전자제품 제조사가 올해 판매한 제품 전체에 2년 무상 보증을 제공했다.",
    situation_en:"Electronics maker offers a 2-year warranty on all products sold during the current year.",
    rule:"판매 시점에 예상 보증비용 전액 liability 인식(matching principle).",
    trigger:"'warranty expense' / 'estimated warranty costs'",
    trap:"실제 수리 발생 시 비용 인식. Warranty liability를 기간비용으로 처리." },
  { cat:"Liabilities", item:"Lease Liability", std:"gaap",
    situation_ko:"회사가 5년 사무실 임대계약을 체결하고 연간 리스료를 지급하기로 했다(ASC 842 적용).",
    situation_en:"Company signs a 5-year office lease with annual payments; ASC 842 requires balance sheet recognition.",
    rule:"Finance/Operating 모두 PV of lease payments로 liability 인식(ASC 842). ROU asset 동시 인식.",
    trigger:"'right of use' / 'lease term' / 'FL vs OL 분류'",
    trap:"Operating lease는 liability 없다고 착각(ASC 840 구기준). Asset만 또는 liability만 인식." },
  { cat:"PPE & Intangibles", item:"PP&E Capitalization", std:"gaap",
    situation_ko:"공장 신축 중 건설자금 이자, 설치비, 직원 교육비가 발생했다.",
    situation_en:"During factory construction, the company incurs interest on construction loans, installation, and employee training costs.",
    rule:"미래경제효익 + control → capitalize. 취득가 = 구입가 + 직접비용 + 설치비.",
    trigger:"'future benefit' / 'capitalized interest' / 'betterment vs repair'",
    trap:"Training비, R&D 자산화. 수선비(maintenance) 자산화. Repair vs betterment 혼동." },
  { cat:"PPE & Intangibles", item:"Impairment — GAAP (2-step)", std:"gaap",
    situation_ko:"기계장치 장부금액 $5M, 미할인 미래 현금흐름 합계 $4.5M, 공정가치 $3M.",
    situation_en:"Equipment: carrying value $5M, undiscounted future CF $4.5M, fair value $3M.",
    rule:"Step 1: undiscounted future CF < carrying value? → Step 2: FV로 write-down. Reversal 불가.",
    trigger:"'recoverability test' / '손상 여부 판단'",
    trap:"Step 1에서 discounted CF 사용(undiscounted 사용해야 함). Step 1 통과 시 손상 없음(FV 무관). Reversal 인식." },
  { cat:"PPE & Intangibles", item:"Goodwill", std:"gaap",
    situation_ko:"인수한 사업부의 공정가치가 장부가 이하로 하락해 goodwill 손상 가능성이 제기됐다.",
    situation_en:"An acquired reporting unit's fair value drops below its carrying value, triggering goodwill impairment review.",
    rule:"상각 없음. 연 1회 이상 impairment test. FV of reporting unit < carrying value → 손상.",
    trigger:"'goodwill impairment' / 'reporting unit FV'",
    trap:"Goodwill 상각 처리. Reversal 인식(절대 불가). Private company: amortization 선택 가능(예외)." },
  { cat:"PPE & Intangibles", item:"R&D Costs", std:"gaap",
    situation_ko:"제약사가 신약 개발에 $5M을 지출했으며 일부는 연구 단계, 일부는 개발 단계이다.",
    situation_en:"Pharmaceutical company spends $5M across research and development phases for a new drug.",
    rule:"연구개발비 전액 즉시 비용 처리(GAAP). 내부개발 무형자산 인식 불가.",
    trigger:"'research and development' / 'internally developed software'",
    trap:"R&D 자산화. Software 개발비: 기술적 실현가능성 이전은 expense, 이후는 capitalize." },
  { cat:"Equity", item:"Common Stock Issuance", std:"gaap",
    situation_ko:"회사가 par $1 보통주 10,000주를 주당 $15에 신규 발행했다.",
    situation_en:"Company issues 10,000 shares of $1 par common stock at $15 per share.",
    rule:"Common stock = par × shares issued. APIC = (issue price − par) × shares.",
    trigger:"'stock issuance' / 'par value vs issue price'",
    trap:"전액을 Common stock으로 처리. APIC 계산 누락." },
  { cat:"Equity", item:"Treasury Stock", std:"gaap",
    situation_ko:"회사가 자기주식 1,000주를 주당 $50에 취득한 후 500주를 $55에 재발행했다.",
    situation_en:"Company reacquires 1,000 shares at $50 each, then reissues 500 of them at $55 each.",
    rule:"Cost method: Dr. Treasury Stock(cost). 재발행 차익 → APIC. 차손 → APIC 소진 후 RE.",
    trigger:"'share buyback' / 'treasury stock reissued'",
    trap:"Treasury stock 보유 중 배당·의결권 있다고 착각. 재발행 차손을 loss로 인식." },
  { cat:"Equity", item:"Stock Dividend vs Stock Split", std:"gaap",
    situation_ko:"이사회가 FMV $20(par $1) 보통주에 대해 10% 주식배당을 선언했다.",
    situation_en:"Board declares a 10% stock dividend when FMV is $20 and par value is $1 per share.",
    rule:"Small stock div(<25%): FMV로 이전. Large stock div(≥25%): par value로 이전. Split: par 변경, equity 총액 불변.",
    trigger:"'stock dividend' / 'stock split' / '25% threshold'",
    trap:"Stock split 시 equity 총액 변한다고 착각. Large vs small dividend 처리 혼동." },
  { cat:"Tax", item:"Deferred Tax Asset (DTA)", std:"gaap",
    situation_ko:"당기에 세법상 비용 불인정된 보증충당금 $2M이 미래 실제 지급 시 공제될 예정이다.",
    situation_en:"Warranty accrual of $2M disallowed for tax this year will be deductible when actual cash payments occur.",
    rule:"Future deductible temporary difference → DTA. Valuation allowance: more-likely-than-not 실현 불가 시.",
    trigger:"'future deductible' / 'tax loss carryforward' / 'valuation allowance'",
    trap:"DTA/DTL 방향 반대로. 영구차이(permanent diff.)에 DTA 인식. 세율 변경 시 즉시 재측정 누락." },
  { cat:"Tax", item:"Deferred Tax Liability (DTL)", std:"gaap",
    situation_ko:"세무 가속상각으로 GAAP 감가상각보다 $500K 더 공제해 미래 과세소득이 증가한다.",
    situation_en:"Accelerated tax depreciation exceeds GAAP depreciation by $500K, creating future taxable income.",
    rule:"Future taxable temporary difference → DTL. 세율 변경 → 기존 잔액 즉시 재측정(enacted rate).",
    trigger:"'accelerated depreciation for tax' / 'installment sales'",
    trap:"Timing difference와 permanent difference 혼동. 세율 변경 효과를 다음 연도에 반영." },
  { cat:"NFP", item:"Contributions — Conditional vs Unconditional", std:"gaap",
    situation_ko:"기부자가 'NFP가 5년 내 인증을 받으면' 지급하는 $1M 조건부 기증 약정을 맺었다.",
    situation_en:"Donor pledges $1M contingent on the NFP obtaining accreditation within 5 years.",
    rule:"무조건부 → 즉시 FV로 인식. 조건부 → 조건 충족 시 인식. Restriction ≠ Condition.",
    trigger:"'conditional pledge' / 'donor restriction' / 'purpose restriction'",
    trap:"Restriction을 Condition으로 혼동. 조건부 pledge 즉시 인식." },
  { cat:"NFP", item:"Donated Services", std:"gaap",
    situation_ko:"공인 회계사가 NFP를 위해 감사 업무를 무상으로 수행했다.",
    situation_en:"A CPA volunteers to perform audit services for a nonprofit organization at no charge.",
    rule:"SOME test 4가지 모두 충족 시만 인식: Specialized skill / Otherwise purchased / Measurable / Entity controls.",
    trigger:"'volunteer services' / 'donated professional services'",
    trap:"일반 자원봉사 인식. SOME 4가지 중 하나만 충족해도 인식." },
  { cat:"Gov", item:"Modified Accrual — Revenue Recognition", std:"gaap",
    situation_ko:"지방정부가 12월 31일 기준으로 60일 내 수취 가능한 재산세 $3M을 계상하려 한다.",
    situation_en:"Local government determines $3M of property tax is measurable and collectible within 60 days of year-end.",
    rule:"Measurable + Available(60일 내 수취 가능) 충족 시 수익 인식.",
    trigger:"'governmental fund' / 'property tax' / 'available criterion'",
    trap:"Full accrual과 혼동. 60일 기준 초과 receivable을 당기수익 인식." },
];

const valuationData: ValItem[] = [
  { cat:"Assets", item:"Cash & Cash Equivalents", std:"gaap", method:"Face value / FMV",
    situation_ko:"회사가 외화 예금 $100K와 90일 만기 CD $50K를 보유하고 있으며 부채 약정을 위한 restricted cash도 있다.",
    situation_en:"Company holds $100K in foreign currency deposits, a $50K 90-day CD, and restricted cash for debt covenants.",
    rule:"외화 → 기말 spot rate. Restricted cash는 별도 분류(current or non-current). 90일 초과 T-bill은 CE 아님.",
    trigger:"외화 현금 환산 / restricted cash 분류",
    trap:"Restricted cash를 CE에 포함. 90일 초과 단기투자를 CE로 분류." },
  { cat:"Assets", item:"Accounts Receivable", std:"gaap", method:"NRV (Gross AR − Allowance)",
    situation_ko:"연말 A/R 잔액 $1M에 대해 CECL 모델 기반 기대손실을 추정해야 한다.",
    situation_en:"Year-end A/R balance of $1M requires an expected credit loss estimate under the CECL model.",
    rule:"CECL(ASC 326): 기대손실 모델. Direct write-off는 GAAP 불인정(tax only). Write-off 시 NRV 불변.",
    trigger:"Bad debt expense 계산 / allowance 잔액 변동",
    trap:"% of sales vs aging 방법 혼동. Write-off가 NRV를 바꾼다고 착각." },
  { cat:"Assets", item:"Inventory", std:"gaap", method:"Lower of Cost or NRV",
    situation_ko:"원재료 재고의 NRV가 원가 이하로 하락했고, 회사는 FIFO 방식을 사용하고 있다.",
    situation_en:"Raw materials inventory NRV has fallen below cost; the company uses FIFO costing.",
    rule:"FIFO·Avg → LCNRV. LIFO·Retail → LCM(replacement cost). GAAP: write-down reversal 불가.",
    trigger:"NRV 계산 / LIFO reserve / LIFO liquidation",
    trap:"LIFO layer 청산 시 오래된 원가 → 이익 급증. GAAP write-down reversal 불가." },
  { cat:"Assets", item:"Trading Securities", std:"gaap", method:"Fair Value → Net Income",
    situation_ko:"회사가 단기 차익 목적으로 보유하는 주식의 연말 공정가치가 취득원가보다 $30K 상승했다.",
    situation_en:"Trading securities held for short-term profit have a year-end FV $30K above original cost.",
    rule:"매 기말 FV 재측정. Unrealized G/L → Income statement.",
    trigger:"기말 FV 변동 → 당기손익 영향 계산",
    trap:"AFS와 혼동. Trading은 unrealized도 NI 반영." },
  { cat:"Assets", item:"AFS Securities", std:"gaap", method:"Fair Value → OCI",
    situation_ko:"AFS로 분류된 채권의 연말 FV가 상각후원가보다 $20K 하락했고, 처분도 고려 중이다.",
    situation_en:"AFS bond has a year-end FV $20K below amortized cost; company is also considering selling it.",
    rule:"Unrealized G/L → AOCI. 처분 시 OCI → NI reclassify. Impairment → NI(OCI 아님).",
    trigger:"처분 시 실현손익 + OCI reclassify 계산",
    trap:"처분 전 AOCI를 NI 반영 안 함. Impairment를 OCI로 처리." },
  { cat:"Assets", item:"HTM Securities", std:"gaap", method:"Amortized Cost",
    situation_ko:"만기보유 채권을 중도 매각해 전체 HTM 포트폴리오 재분류 여부를 검토해야 한다.",
    situation_en:"Company sells an HTM bond before maturity, potentially triggering reclassification of the entire HTM portfolio.",
    rule:"FV 변동 미반영. 이자수익 = carrying value × market rate. Tainting rule: 만기 전 매도 시 HTM 전체 재분류.",
    trigger:"Premium/discount 상각 / 이자수익 계산",
    trap:"이자수익에 쿠폰율 사용. Tainting rule 간과." },
  { cat:"Assets", item:"Equity Method Investment", std:"gaap", method:"Cost + Share of NI − Dividends",
    situation_ko:"A사가 B사 지분 30%를 보유하고 있으며, B사가 당기 배당금 $500K를 지급했다.",
    situation_en:"Investor holds 30% of an investee. Investee declares and pays $500K in dividends this year.",
    rule:"20–50% 또는 significant influence. 배당 수령 → 투자자산 감소(수익 X). Carrying value 0 이하 불가(원칙).",
    trigger:"지분법 손익 계산 / dividends 수령 처리",
    trap:"배당을 수익으로 인식. Investee 손실로 carrying value 마이너스." },
  { cat:"Assets", item:"PP&E — Initial", std:"gaap", method:"Historical Cost",
    situation_ko:"회사가 건물 신축 중이며 건설자금 차입이자 및 설치비를 취득원가에 포함해야 한다.",
    situation_en:"Company constructs a building and must determine which costs to capitalize: interest, installation, and startup costs.",
    rule:"구입가 + 직접비 + 설치비. Capitalized interest: 건설 중 자산에만 적용. 운영 후 이자는 자본화 불가.",
    trigger:"Capitalized interest 계산 (weighted-avg expenditure)",
    trap:"운영 시작 후 이자 자본화. Weighted-average accumulated expenditure 계산 실수." },
  { cat:"Assets", item:"PP&E — Impairment", std:"gaap", method:"2-step: Undiscounted CF → FV",
    situation_ko:"장치의 장부금액 $5M, 미할인 현금흐름 $4.5M, 공정가치 $3M으로 손상 검토 상황.",
    situation_en:"Equipment: carrying value $5M, undiscounted future CF $4.5M, fair value $3M — impairment review required.",
    rule:"Step 1: undiscounted future CF < carrying value? Step 2: FV로 write-down. Reversal 불가.",
    trigger:"손상차손 인식 여부 / 손상 금액 계산",
    trap:"Step 1에서 discounted CF 사용. Step 1 통과 시 손상 없음(FV 무관). Reversal 인식." },
  { cat:"Assets", item:"Goodwill", std:"gaap", method:"No amortization — Impairment only",
    situation_ko:"연례 goodwill 손상 테스트에서 보고 단위의 FV가 장부가 이하로 하락했다.",
    situation_en:"Annual goodwill impairment test reveals the reporting unit's FV is below its carrying value.",
    rule:"연 1회 이상 impairment test. Reversal 절대 불가. Private company: amortization 선택 예외.",
    trigger:"Goodwill impairment 금액 계산",
    trap:"Goodwill 상각 처리. Reversal 인식." },
  { cat:"Assets", item:"ROU Asset — Finance Lease", std:"gaap", method:"PV of lease payments → Amortization",
    situation_ko:"회사가 5년 설비 리스계약(finance lease 분류)을 체결해 ROU 자산을 인식했다.",
    situation_en:"Company enters a 5-year equipment lease classified as a finance lease, recognizing an ROU asset.",
    rule:"Amortization: lease term or useful life 중 짧은 기간. 비용 패턴: 초기 高(이자+감가상각).",
    trigger:"FL vs OL 분류 기준 / 비용 패턴 차이",
    trap:"OL과 비용 패턴 혼동. 분류 기준(ASC 842) 5가지 미체크." },
  { cat:"Assets", item:"ROU Asset — Operating Lease", std:"gaap", method:"PV of lease payments → Straight-line expense",
    situation_ko:"회사가 3년 사무실 임대계약(operating lease)을 체결했고 ASC 842에 따라 BS에 인식한다.",
    situation_en:"Company signs a 3-year office lease classified as operating; ASC 842 requires balance sheet recognition.",
    rule:"ROU asset 인식(ASC 842). 비용: straight-line. Amortization = lease expense − interest on liability.",
    trigger:"OL ROU amortization back-calculation",
    trap:"ASC 840(구기준)으로 판단 — OL은 BS 인식 없다고 착각." },
  { cat:"Liabilities", item:"Accounts Payable / Accrued Liabilities", std:"gaap", method:"Face value / Settlement amount",
    situation_ko:"연말에 아직 청구서가 도착하지 않은 서비스를 이미 제공받아 미지급비용을 계상해야 한다.",
    situation_en:"Services were received before year-end but no invoice has arrived yet — an accrual entry is required.",
    rule:"단기 → 할인 불필요. 기말 미지급 비용 accrual 처리.",
    trigger:"기말 accrual 분개",
    trap:"현금 지급 시점에만 비용 인식(cash basis 오류)." },
  { cat:"Liabilities", item:"Bonds Payable", std:"gaap", method:"Amortized Cost (유효이자율법)",
    situation_ko:"회사가 시장이자율 8%에 쿠폰율 6% 채권을 발행해 할인 발행됐다.",
    situation_en:"Company issues bonds with a 6% coupon when the market rate is 8%, resulting in a discount.",
    rule:"이자비용 = carrying value × market rate. Premium: 이자비용 < 현금지급. Discount: 반대.",
    trigger:"이자비용 / carrying value 계산 / 발행가격 산정",
    trap:"이자비용에 쿠폰율(stated rate) 사용. Face value와 carrying value 혼동." },
  { cat:"Liabilities", item:"Lease Liability", std:"gaap", method:"PV of remaining lease payments",
    situation_ko:"리스 부채 인식 후 매기 이자비용과 원금상환액을 구분해야 한다.",
    situation_en:"After recognizing a lease liability, the company must allocate each payment between interest and principal reduction.",
    rule:"매기 이자비용 = Beg. liability × discount rate. 원리금 지급 시 liability 감소.",
    trigger:"리스 부채 상각표 계산",
    trap:"리스료 전액을 비용 처리. Liability와 ROU asset 계산 혼동." },
  { cat:"Liabilities", item:"Deferred Tax Liability (DTL)", std:"gaap", method:"Enacted rate × future taxable temp. diff.",
    situation_ko:"세무 가속상각으로 GAAP 대비 세금 납부를 이연하고 DTL로 인식해야 한다.",
    situation_en:"Company uses accelerated depreciation for tax, deferring tax payments — DTL recognition required.",
    rule:"가속상각 등 future taxable amount → DTL. 세율 변경 시 즉시 재측정.",
    trigger:"Accelerated depreciation / installment sales",
    trap:"Permanent difference에 DTL 인식. 세율 변경 효과 다음 연도 반영." },
  { cat:"Liabilities", item:"Pension Obligation (PBO)", std:"gaap", method:"PV of projected benefit obligation",
    situation_ko:"회사의 확정급여형 연금의 funded status와 당기 연금비용을 계산해야 한다.",
    situation_en:"Company must calculate defined benefit pension funded status and current year pension expense components.",
    rule:"Funded status = Plan assets FV − PBO. Pension expense: service cost + interest − expected return ± amortization.",
    trigger:"Pension expense 구성요소 / funded status 계산",
    trap:"Expected return 대신 actual return 사용. Actuarial G/L을 즉시 NI 인식." },
  { cat:"Equity", item:"Common Stock / APIC", std:"gaap", method:"Historical issuance price",
    situation_ko:"회사가 par $1 보통주 10,000주를 주당 $20에 발행했다.",
    situation_en:"Company issues 10,000 shares of $1 par common stock at $20 per share.",
    rule:"Common stock = par × shares issued. APIC = (issue price − par) × shares.",
    trigger:"주식발행 분개",
    trap:"전액 Common stock 처리. Par value 없으면 전액 Common stock(no-par stock)." },
  { cat:"Equity", item:"Treasury Stock", std:"gaap", method:"Cost method",
    situation_ko:"자기주식 취득 후 재발행 시 차익·차손의 처리 방법을 판단해야 한다.",
    situation_en:"Company must account for gains and losses when reissuing previously reacquired treasury shares.",
    rule:"재취득: Dr. Treasury Stock(cost). 재발행 차익 → APIC. 차손 → APIC 소진 후 RE 차감.",
    trigger:"자기주식 취득·재발행 분개 / EPS 영향",
    trap:"TS 보유 중 배당·의결권 있다고 착각. 재발행 차손을 loss로 인식." },
  { cat:"Revenue", item:"ASC 606 — Transaction Price", std:"gaap", method:"SSP 기준 배분",
    situation_ko:"번들 계약에서 각 수행의무에 독립판매가격(SSP) 기준으로 거래가격을 배분해야 한다.",
    situation_en:"In a bundled contract, transaction price must be allocated to each performance obligation based on SSP.",
    rule:"Variable consideration: constraint 적용. SSP 없으면 추정(adjusted market / expected cost+margin).",
    trigger:"번들 계약 배분 / variable consideration",
    trap:"SSP 없으면 배분 불가라고 착각. Constraint 미적용." },
  { cat:"Revenue", item:"Long-term Contracts", std:"gaap", method:"Percentage of Completion",
    situation_ko:"총 계약금액 $10M 공사에서 원가 진행률 40%인 경우 당기 수익 인식액은 얼마인가.",
    situation_en:"On a $10M construction contract with 40% cost completion, how much revenue is recognized in the current period?",
    rule:"진행률 = costs incurred ÷ total est. costs. 손실 예상 → 즉시 전액 인식. Revised estimate → cumulative catch-up.",
    trigger:"당기 수익·손실 인식액 계산",
    trap:"Completed contract method 혼용. 예상 손실 분할 인식." },
  { cat:"NFP", item:"Contributions / Pledges", std:"gaap", method:"FV at date of gift",
    situation_ko:"기부자가 5년에 걸쳐 $500K를 납부하기로 약정했고, 할인율 5%를 적용해야 한다.",
    situation_en:"Donor pledges $500K payable over 5 years; the NFP must record the pledge at present value using a 5% rate.",
    rule:"무조건부 → 즉시 인식. 조건부 → 조건 충족 시. 다년도 pledge → PV 할인.",
    trigger:"조건부 vs 무조건부 기증 분류",
    trap:"Restriction과 Condition 혼동. 조건부 pledge 즉시 인식." },
  { cat:"NFP", item:"Net Assets Classification", std:"gaap", method:"With / Without Donor Restriction",
    situation_ko:"기부자가 '암 연구에만 사용하라'는 목적 제한이 있는 $1M 기부금을 납부했다.",
    situation_en:"Donor contributes $1M restricted for cancer research only — NFP must classify by restriction type.",
    rule:"With restriction(기간·목적) vs Without restriction. Purpose restriction: 목적 달성 시 reclassify.",
    trigger:"기부금 분류 / restriction 해제 시점",
    trap:"Time restriction을 purpose restriction으로 혼동." },
  { cat:"Gov", item:"Capital Assets (GASB)", std:"gaap", method:"Historical Cost",
    situation_ko:"지자체가 도로 인프라에 Modified Approach를 선택해 감가상각 대신 유지비를 처리한다.",
    situation_en:"Municipality elects the Modified Approach for infrastructure, expensing maintenance instead of recording depreciation.",
    rule:"Infrastructure 포함. Modified Approach: 감가상각 면제, 유지보수비 즉시 비용화.",
    trigger:"Gov vs Proprietary fund 처리 차이",
    trap:"Modified Approach 선택 시도 감가상각 인식." },
  { cat:"Gov", item:"Fund Accounting — Modified Accrual", std:"gaap", method:"Current financial resources focus",
    situation_ko:"지방정부 일반기금에서 장기부채 발행 수익과 자본자산 지출의 인식 방법을 결정해야 한다.",
    situation_en:"Local government's general fund must determine recognition of long-term debt proceeds and capital outlay expenditures.",
    rule:"수익 = measurable + available(60일). 장기부채는 governmental fund에서 인식 안 함.",
    trigger:"수익·지출 인식 시점 / fund 유형 분류",
    trap:"Full accrual과 혼동. 장기 debt를 governmental fund에서 인식." },
];

// ─── Constants ────────────────────────────────────────────────

const AL_CATS = ['All','Receivables','Inventory','Revenue','Liabilities','PPE & Intangibles','Equity','Tax','NFP','Gov'];
const VAL_CATS = ['All','Assets','Liabilities','Equity','Revenue','NFP','Gov'];
const RATIO_CATS = ['All','Liquidity Ratios','Activity Ratios','Profitability Ratios','Leverage Ratios'];

function conceptCardToQuizItem(card: ConceptCardRow): QuizItem {
  const eq = card.exampleQuestion;
  const cat = card.topicTags.find((t) =>
    t.includes('Liquidity') || t.includes('Activity') || t.includes('Profitability') || t.includes('Leverage')
  ) ?? 'Financial Ratios';
  return {
    cat,
    item: card.concepts[0] ?? 'Financial Ratio',
    std: 'gaap',
    situation_ko: (typeof eq?.explanation === 'object' ? eq.explanation?.memory : undefined) ?? card.trapPattern ?? '',
    situation_en: eq?.question ?? '',
    rule: card.formula ?? '',
    trigger: card.concepts.slice(0, 5).join(' / '),
    trap: card.trapPattern ?? '',
    formula: card.formula ?? undefined,
    related_concepts: card.relatedConcepts ?? undefined,
  };
}

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

function parseJournalEntry(text: string): { dr: string[]; cr: string[] } {
  const dr: string[] = [], cr: string[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('Dr.')) dr.push(t);
    else if (t.startsWith('Cr.')) cr.push(t);
  }
  return { dr, cr };
}

function GaapBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
      style={{ background:'#dbeafe', color:'#1d4ed8' }}>
      US GAAP
    </span>
  );
}

function QuizCard({
  item,
  lang,
  onLangChange,
  onConceptClick,
}: {
  item: QuizItem;
  lang: LangKey;
  onLangChange: (l: LangKey) => void;
  onConceptClick: (concept: string) => void;
}) {
  const je = item.journal_entry ? parseJournalEntry(item.journal_entry) : null;

  return (
    <div className="bg-white rounded-2xl flex flex-col gap-4 p-5"
      style={{ border: '1.5px solid #e2e8f0' }}>

      {/* Header: title + category badge */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-bold text-[#0f172a] leading-tight">{item.item}</p>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background:'#f1f5f9', color:'#475569' }}>
            {item.cat}
          </span>
          {item.std === 'gaap' && <GaapBadge />}
        </div>
      </div>

      {/* Situation */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#475569]">실제 상황</span>
          <div className="flex rounded-lg overflow-hidden" style={{ border:'1px solid #e2e8f0' }}>
            {(['ko', 'en'] as LangKey[]).map(l => (
              <button key={l}
                onClick={() => onLangChange(l)}
                className="px-2.5 py-0.5 text-[11px] font-semibold transition-colors"
                style={{
                  background: lang === l ? '#4f6ef7' : 'white',
                  color: lang === l ? 'white' : '#94a3b8',
                }}>
                {l === 'ko' ? '한국어' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg px-3 py-2.5 text-sm text-[#0f172a] leading-relaxed"
          style={{ borderLeft: '3px solid #4f6ef7', background: '#f8faff' }}>
          {lang === 'ko' ? item.situation_ko : item.situation_en}
        </div>
      </div>

      {/* Core rule */}
      <div className="rounded-xl px-3 py-2.5" style={{ background:'#f8fafc' }}>
        <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">핵심 기준</p>
        {item.method && (
          <p className="text-[11px] font-semibold text-[#4f6ef7] mb-1">{item.method}</p>
        )}
        <p className="text-sm text-[#0f172a] leading-relaxed">{item.rule}</p>
      </div>

      {/* Trigger + Trap */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3" style={{ background:'#E6F1FB' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color:'#185FA5' }}>Trigger</p>
          <p className="text-xs leading-relaxed" style={{ color:'#185FA5' }}>{item.trigger}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background:'#FCEBEB' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
            style={{ color:'#A32D2D' }}>Trap</p>
          <p className="text-xs leading-relaxed" style={{ color:'#A32D2D' }}>{item.trap}</p>
        </div>
      </div>

      {/* Journal Entry — Dr/Cr 2-column layout */}
      {je && (
        <div className="rounded-xl p-3" style={{ background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color:'#15803d' }}>
            분개 (Journal Entry)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg p-2.5" style={{ background:'#dcfce7', border:'1px solid #86efac' }}>
              <p className="text-[10px] font-bold text-[#166534] mb-1.5">Dr (차변)</p>
              {je.dr.map((line, i) => (
                <p key={i} className="font-mono text-sm text-[#15803d]">{line}</p>
              ))}
            </div>
            <div className="rounded-lg p-2.5" style={{ background:'#dbeafe', border:'1px solid #93c5fd' }}>
              <p className="text-[10px] font-bold text-[#1e40af] mb-1.5">Cr (대변)</p>
              {je.cr.map((line, i) => (
                <p key={i} className="font-mono text-sm text-[#1d4ed8]">{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Formula */}
      {item.formula && (
        <div className="rounded-xl p-3" style={{ background:'#fefce8', border:'1px solid #fde68a' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color:'#92400e' }}>
            계산 공식
          </p>
          <p className="font-mono text-sm text-[#92400e] leading-relaxed">{item.formula}</p>
        </div>
      )}

      {/* Related Concepts — clickable */}
      {item.related_concepts && item.related_concepts.length > 0 && (
        <div className="rounded-xl p-3" style={{ background:'#f5f3ff', border:'1px solid #ddd6fe' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color:'#6d28d9' }}>
            연결 개념
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.related_concepts.map((concept) => (
              <button key={concept}
                onClick={() => onConceptClick(concept)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70 active:opacity-50"
                style={{ background:'#ede9fe', color:'#6d28d9' }}>
                → {concept}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { key: 'asset-liability' as TabKey, label: 'Asset vs. Liability', icon: '⚖️' },
  { key: 'valuation' as TabKey, label: 'Valuation', icon: '💰' },
  { key: 'ratios' as TabKey, label: 'Financial Ratios', icon: '📊' },
  { key: 'misc' as TabKey, label: '기타', icon: '📦' },
];

// concept 태그와 item 이름 간 fuzzy match (3단계 우선순위)
function findEnrichment(itemName: string, enrichments: JournalEnrichment[]): JournalEnrichment | undefined {
  // —, –, /, & 등 특수문자를 공백으로 정규화 후 소문자 변환
  const norm = (s: string) =>
    s.toLowerCase()
      .replace(/[—–\-/&]/g, ' ')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normItem = norm(itemName);
  const itemWords = normItem.split(' ').filter((w) => w.length > 2);

  // 1순위: 완전 일치
  let match = enrichments.find((e) => e.concepts.some((c) => norm(c) === normItem));
  if (match) return match;

  // 2순위: 한쪽이 다른 쪽을 완전 포함
  match = enrichments.find((e) =>
    e.concepts.some((c) => {
      const nc = norm(c);
      return nc.length > 3 && (normItem.includes(nc) || nc.includes(normItem));
    })
  );
  if (match) return match;

  // 3순위: 의미 있는 단어 2개 이상 교집합
  return enrichments.find((e) =>
    e.concepts.some((c) => {
      const cWords = norm(c).split(' ').filter((w) => w.length > 2);
      return cWords.filter((w) => itemWords.includes(w)).length >= 2;
    })
  );
}

export default function ConceptNotesPage() {
  const userId = useStudyStore((s) => s.userId);
  const [activeTab, setActiveTab] = useState<TabKey>('asset-liability');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lang, setLang] = useState<LangKey>('ko');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [shuffledItems, setShuffledItems] = useState<QuizItem[] | null>(null);

  // DB enrichments: journal_entry / formula / related_concepts from concept_extractions
  const [enrichments, setEnrichments] = useState<JournalEnrichment[]>([]);
  useEffect(() => {
    if (!userId) return;
    fetchJournalEnrichments(userId).then((data) => {
      console.log('[ConceptNotes] enrichments from DB:', data.length, '건');
      console.log('[ConceptNotes] 첫 3개 샘플:', data.slice(0, 3));
      setEnrichments(data);
    });
  }, [userId]);

  // Financial Ratios: F1-M8 카드 DB에서 동적 로드
  const [ratioItems, setRatioItems] = useState<QuizItem[]>([]);
  const [ratioLoading, setRatioLoading] = useState(false);
  useEffect(() => {
    if (!userId || activeTab !== 'ratios' || ratioItems.length > 0) return;
    setRatioLoading(true);
    fetchConceptCardsByTopic(userId, 'F1-M8')
      .then((cards) => setRatioItems(cards.map(conceptCardToQuizItem)))
      .finally(() => setRatioLoading(false));
  }, [userId, activeTab, ratioItems.length]);

  // Misc (임시 저장) — persisted to localStorage
  const [miscConcepts, setMiscConcepts] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('concept-notes-misc') ?? '[]'); }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('concept-notes-misc', JSON.stringify(miscConcepts));
  }, [miscConcepts]);

  const cats = activeTab === 'asset-liability' ? AL_CATS : activeTab === 'valuation' ? VAL_CATS : activeTab === 'ratios' ? RATIO_CATS : [];

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setActiveCat('All');
    setQuery('');
    setExpandedRow(null);
    setQuizIndex(0);
    setShuffledItems(null);
  };

  const resetFilter = () => {
    setQuizIndex(0);
    setShuffledItems(null);
    setExpandedRow(null);
  };

  const allItems = useMemo<QuizItem[]>(() => {
    if (activeTab === 'ratios') return ratioItems;
    const base = activeTab === 'asset-liability'
      ? assetLiabilityData
      : activeTab === 'valuation'
        ? [...valuationData].sort((a, b) => (VAL_BS_ORDER[a.item] ?? 99) - (VAL_BS_ORDER[b.item] ?? 99))
        : [];
    if (enrichments.length === 0) return base;
    return base.map((item) => {
      const e = findEnrichment(item.item, enrichments);
      if (!e) return item;
      return {
        ...item,
        journal_entry: item.journal_entry ?? e.journal_entry ?? undefined,
        formula: item.formula ?? e.formula ?? undefined,
        related_concepts: item.related_concepts ?? e.related_concepts ?? undefined,
      };
    });
  }, [activeTab, enrichments, ratioItems]);

  const handleConceptClick = useCallback((conceptName: string) => {
    const idx = allItems.findIndex(it => it.item === conceptName);
    if (idx !== -1) {
      setViewMode('quiz');
      setQuizIndex(idx);
      setShuffledItems(null);
      return;
    }
    if (window.confirm(`"${conceptName}"은 아직 개념노트에 없어요.\n기타에 임시 저장할까요?`)) {
      setMiscConcepts(prev => prev.includes(conceptName) ? prev : [...prev, conceptName]);
    }
  }, [allItems]);

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
        it.situation_ko.toLowerCase().includes(q) ||
        it.situation_en.toLowerCase().includes(q) ||
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
          {SIDEBAR_TABS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors"
              style={{
                background: activeTab === tab.key ? '#eef2ff' : 'transparent',
                color: activeTab === tab.key ? '#4f6ef7' : '#475569',
                fontWeight: activeTab === tab.key ? 600 : 400,
              }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile tab toggle */}
        <div className="md:hidden flex gap-2 px-3 pt-3 pb-2 bg-white shrink-0"
          style={{ borderBottom: '1.5px solid #e2e8f0' }}>
          {SIDEBAR_TABS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: activeTab === tab.key ? '#4f6ef7' : '#f1f5f9',
                color: activeTab === tab.key ? 'white' : '#475569',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto flex flex-col gap-3">

            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-[#0f172a]">
                  {activeTab === 'asset-liability' ? '⚖️ Asset vs. Liability' : activeTab === 'valuation' ? '💰 Valuation' : activeTab === 'ratios' ? '📊 Financial Ratios' : '📦 기타 (임시 저장)'}
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  {activeTab === 'misc' ? `${miscConcepts.length}개 저장됨 · 나중에 탭으로 분류 정리` : `${filtered.length}개 항목`}
                </p>
              </div>
              {activeTab !== 'misc' && (
                <div className="flex rounded-xl overflow-hidden" style={{ border:'1.5px solid #e2e8f0' }}>
                  {(['table','quiz'] as ViewMode[]).map(mode => (
                    <button key={mode}
                      onClick={() => { setViewMode(mode); setQuizIndex(0); }}
                      className="px-4 py-1.5 text-sm font-medium transition-colors"
                      style={{
                        background: viewMode === mode ? '#4f6ef7' : 'white',
                        color: viewMode === mode ? 'white' : '#475569',
                      }}>
                      {mode === 'table' ? '📋 테이블' : '🃏 카드퀴즈'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search + Category pills — misc 탭에서는 숨김 */}
            {activeTab !== 'misc' && (
              <>
                <input value={query}
                  onChange={e => { setQuery(e.target.value); resetFilter(); }}
                  placeholder="항목명 / 핵심기준 / Trigger / Trap / 실제 상황 검색"
                  className="w-full text-sm rounded-xl px-4 py-2.5 bg-white"
                  style={{ border:'1.5px solid #e2e8f0', outline:'none' }} />
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
              </>
            )}

            {/* ── Misc View ── */}
            {activeTab === 'misc' && (
              <div className="flex flex-col gap-2">
                {miscConcepts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
                    <p className="text-sm text-muted">연결 개념 클릭 시 여기에 임시 저장됩니다.</p>
                  </div>
                ) : miscConcepts.map((name) => (
                  <div key={name} className="bg-white rounded-xl border border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#0f172a]">{name}</span>
                    <button
                      onClick={() => setMiscConcepts(prev => prev.filter(c => c !== name))}
                      className="text-xs text-muted hover:text-red-500 transition-colors">
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Ratios Loading ── */}
            {activeTab === 'ratios' && ratioLoading && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
                <p className="text-sm text-muted">Financial Ratio 카드 불러오는 중...</p>
              </div>
            )}

            {/* ── Table View ── */}
            {activeTab !== 'misc' && !ratioLoading && viewMode === 'table' && (
              <div className="bg-white rounded-2xl overflow-hidden"
                style={{ border:'1.5px solid #e2e8f0' }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr style={{ background:'#f8fafc', borderBottom:'1.5px solid #e2e8f0' }}>
                        {['항목명','실제 상황','핵심 기준','Trigger','Trap'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-sm text-muted text-center">
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
                            <td className="px-3 py-2.5" style={{ minWidth: 160 }}>
                              <p className="text-sm font-semibold text-[#0f172a]">{item.item}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted">{item.cat}</span>
                                {item.std === 'gaap' && <GaapBadge />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#475569]" style={{ minWidth: 180 }}>
                              <p style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.situation_ko}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#0f172a]" style={{ minWidth: 180 }}>
                              {item.method && (
                                <p className="text-[10px] font-semibold text-[#4f6ef7] mb-0.5">{item.method}</p>
                              )}
                              <p className="leading-relaxed"
                                style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.rule}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#0f172a]" style={{ minWidth: 160 }}>
                              <p style={isExpanded ? {} : { display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                                {item.trigger}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-xs" style={{ minWidth: 160, color:'#dc2626' }}>
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
            {activeTab !== 'misc' && !ratioLoading && viewMode === 'quiz' && (
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
                      <button onClick={toggleShuffle}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                        style={{
                          background: shuffledItems ? '#4f6ef7' : '#f1f5f9',
                          color: shuffledItems ? 'white' : '#475569',
                        }}>
                        🔀 셔플 {shuffledItems ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4f6ef7] rounded-full transition-all"
                        style={{ width:`${((quizIndex + 1) / quizItems.length) * 100}%` }} />
                    </div>

                    {/* Card */}
                    {currentCard && (
                      <QuizCard
                        item={currentCard}
                        lang={lang}
                        onLangChange={setLang}
                        onConceptClick={handleConceptClick}
                      />
                    )}

                    {/* Prev / index / Next */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setQuizIndex(i => Math.max(0, i - 1)); }}
                        disabled={quizIndex === 0}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                        style={{ background:'#f1f5f9', color:'#475569' }}>
                        ← 이전
                      </button>
                      <span className="text-sm text-muted font-medium shrink-0 min-w-[48px] text-center">
                        {quizIndex + 1}/{quizItems.length}
                      </span>
                      <button onClick={() => { setQuizIndex(i => Math.min(quizItems.length - 1, i + 1)); }}
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
