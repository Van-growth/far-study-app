import { useState } from 'react';

type SectionKey = 'bond' | 'finance-lease' | 'operating-lease' | 'note-payable' | 'aro' | 'comparison';

const TABS: { key: SectionKey; label: string }[] = [
  { key: 'bond', label: 'Bond' },
  { key: 'finance-lease', label: 'Finance Lease' },
  { key: 'operating-lease', label: 'Operating Lease' },
  { key: 'note-payable', label: 'Note Payable' },
  { key: 'aro', label: 'ARO' },
  { key: 'comparison', label: '4형제 비교' },
];

// ── Shared UI ────────────────────────────────────────────────────
const NAVY = '#1a2744';
const TEXT = '#111111';
const BORDER = '1px solid #e0e0e0';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16,
      borderBottom: `2px solid ${NAVY}`, paddingBottom: 8 }}>
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginTop: 24, marginBottom: 8 }}>
      {children}
    </h3>
  );
}

function Journal({ entries }: { entries: { account: string; dr?: number; cr?: number }[] }) {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13, border: BORDER, borderRadius: 6,
      padding: '12px 16px', background: '#fafafa', marginBottom: 16 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ paddingLeft: e.cr !== undefined && e.dr === undefined ? 28 : 0 }}>{e.account}</span>
          <span>{e.dr !== undefined ? `$${e.dr.toLocaleString()}` : ''}{e.cr !== undefined ? `$${e.cr.toLocaleString()}` : ''}</span>
        </div>
      ))}
    </div>
  );
}

function Trap({ items }: { items: string[] }) {
  return (
    <div style={{ border: BORDER, borderRadius: 6, padding: '12px 16px',
      background: '#f8f8f8', marginTop: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: NAVY }}>⚠️ 출제 TRAP</div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>• {item}</div>
      ))}
    </div>
  );
}

function Tbl({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, center, style }: { children: React.ReactNode; center?: boolean; style?: React.CSSProperties }) {
  return (
    <th style={{ padding: '8px 12px', border: BORDER, background: NAVY, color: '#fff',
      textAlign: center ? 'center' : 'left', whiteSpace: 'nowrap', ...style }}>
      {children}
    </th>
  );
}

function Td({ children, center, bold, style }: {
  children: React.ReactNode; center?: boolean; bold?: boolean; style?: React.CSSProperties;
}) {
  return (
    <td style={{ padding: '8px 12px', border: BORDER, textAlign: 'left',
      fontWeight: bold ? 700 : undefined, ...(center ? { textAlign: 'center' } : {}), ...style }}>
      {children}
    </td>
  );
}

// ── Section 1: Bond ──────────────────────────────────────────────
function BondSection() {
  return (
    <div>
      <H2>Bond — 사채 핵심 정리</H2>

      <H3>개요: Premium vs Discount</H3>
      <Tbl>
        <thead><tr><Th>구분</Th><Th>조건</Th><Th>발행가</Th><Th>I/S 이자비용 추세</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>Premium (할증)</Td>
            <Td>시장율 &lt; 액면율</Td>
            <Td>액면 초과 ($108,000)</Td>
            <Td>쿠폰보다 낮음, 매년 감소</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>Discount (할인)</Td>
            <Td>시장율 &gt; 액면율</Td>
            <Td>액면 이하 ($92,000)</Td>
            <Td>쿠폰보다 높음, 매년 증가</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>발행가 계산 (PV Calculation) — Issue Price</H3>
      <div style={{ fontFamily: 'monospace', fontSize: 14, background: '#f0f4f8', border: BORDER,
        borderRadius: 6, padding: 16, marginBottom: 16, color: NAVY, fontWeight: 700 }}>
        Issue Price = PV of Coupon Payments + PV of Principal
      </div>
      <Tbl>
        <thead>
          <tr>
            <Th>현금흐름 (Cash Flow)</Th>
            <Th>성격</Th>
            <Th>PV Factor</Th>
            <Th>비고</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>Coupon payment — 매기 반복 지급</Td>
            <Td>Annuity</Td>
            <Td>PV of Ordinary Annuity (yield, n)</Td>
            <Td>기말 지급 디폴트</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td>Principal / Face value — 만기 1회</Td>
            <Td>Lump sum</Td>
            <Td>PV of $1 (yield, n)</Td>
            <Td>반드시 별도 계산</Td>
          </tr>
          <tr>
            <Td>RVG — Lease 종료 1회 보증잔존가치</Td>
            <Td>Lump sum</Td>
            <Td>PV of $1 (lease term)</Td>
            <Td>Finance Lease 참고</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td>Coupon — 기초 지급 명시 시</Td>
            <Td>Annuity Due</Td>
            <Td>PV of Annuity Due (yield, n)</Td>
            <Td>= Ordinary × (1 + r)</Td>
          </tr>
        </tbody>
      </Tbl>

      <p style={{ fontSize: 13, marginBottom: 6, fontWeight: 600, color: NAVY }}>
        예시 ① — Premium (Face $100,000 / Coupon 6% / 5년 / Yield 4%)
      </p>
      <div style={{ fontFamily: 'monospace', fontSize: 13, border: BORDER, borderRadius: 6,
        padding: '12px 16px', background: '#fafafa', marginBottom: 16, lineHeight: 1.9 }}>
        <div>Coupon PV  : $6,000 × 4.4518  =  $26,711</div>
        <div>Principal PV: $100,000 × 0.8219 =  $82,190</div>
        <div style={{ borderTop: '1px solid #ccc', marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
          Issue Price = $108,901 → Premium $8,901 (발행가 &gt; 액면)
        </div>
      </div>

      <p style={{ fontSize: 13, marginBottom: 6, fontWeight: 600, color: NAVY }}>
        예시 ② — Discount (Face $100,000 / Coupon 6% / 5년 / Yield 8%)
      </p>
      <div style={{ fontFamily: 'monospace', fontSize: 13, border: BORDER, borderRadius: 6,
        padding: '12px 16px', background: '#fafafa', marginBottom: 16, lineHeight: 1.9 }}>
        <div>Coupon PV  : $6,000 × 3.9927  =  $23,956</div>
        <div>Principal PV: $100,000 × 0.6806 =  $68,060</div>
        <div style={{ borderTop: '1px solid #ccc', marginTop: 6, paddingTop: 6, fontWeight: 700 }}>
          Issue Price = $92,016 → Discount $7,984 (발행가 &lt; 액면)
        </div>
      </div>

      <div style={{ border: BORDER, borderRadius: 6, padding: '12px 16px',
        background: '#f8f8f8', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: NAVY }}>⚠️ PV 계산 TRAP</div>
        {[
          '"sold to yield X%" → X%(yield) factor만 사용. coupon rate factor 사용하면 오답',
          '원금(Principal)만 PV 계산 → coupon도 미래현금흐름 → 둘 다 필수',
          'Annuity Due 명시 없으면 → Ordinary Annuity 디폴트 (기말 지급)',
          'yield = coupon rate → Issue Price = Face Value (Premium/Discount 없음)',
        ].map((item, i) => (
          <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>• {item}</div>
        ))}
      </div>

      <H3>발행 분개 (액면 $100,000)</H3>
      <p style={{ fontSize: 13, marginBottom: 6 }}>Premium 발행 — Issue Price $108,000 (Coupon 6%, Market/Yield 4%)</p>
      <Journal entries={[
        { account: 'Dr. Cash', dr: 108000 },
        { account: '  Cr. Bonds Payable', cr: 100000 },
        { account: '  Cr. Premium on Bonds Payable', cr: 8000 },
      ]} />
      <p style={{ fontSize: 13, marginBottom: 6 }}>Discount 발행 — 발행가 $92,000 (쿠폰 6%, 시장 8%)</p>
      <Journal entries={[
        { account: 'Dr. Cash', dr: 92000 },
        { account: 'Dr. Discount on Bonds Payable', dr: 8000 },
        { account: '  Cr. Bonds Payable', cr: 100000 },
      ]} />

      <H3>상각표 ① Straight-Line — $8,000 ÷ 5년 = $1,600 균등</H3>
      <Tbl>
        <thead>
          <tr>
            <Th center>Year</Th>
            <Th style={{ textAlign: 'right' }}>Cash Paid</Th>
            <Th style={{ textAlign: 'right' }}>Amort</Th>
            <Th style={{ textAlign: 'right' }}>Int Exp (Premium)</Th>
            <Th style={{ textAlign: 'right' }}>CV (Premium)</Th>
            <Th style={{ textAlign: 'right' }}>Int Exp (Discount)</Th>
            <Th style={{ textAlign: 'right' }}>CV (Discount)</Th>
          </tr>
        </thead>
        <tbody>
          {[1,2,3,4,5].map((yr) => (
            <tr key={yr} style={{ background: yr % 2 === 0 ? '#f8f8f8' : '#fff' }}>
              <Td center>{yr}</Td>
              <Td style={{ textAlign: 'right' }}>$6,000</Td>
              <Td style={{ textAlign: 'right' }}>$1,600</Td>
              <Td style={{ textAlign: 'right' }}>$4,400</Td>
              <Td style={{ textAlign: 'right' }}>${(108000 - yr * 1600).toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>$7,600</Td>
              <Td style={{ textAlign: 'right' }}>${(92000 + yr * 1600).toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>상각표 ② Effective Interest — 기초 CV × 시장이자율</H3>
      <p style={{ fontSize: 13, marginBottom: 6, fontWeight: 600, color: NAVY }}>
        Premium Bond (시장 4%) — Cash $6,000/year
      </p>
      <Tbl>
        <thead>
          <tr>
            <Th center>Year</Th><Th style={{ textAlign: 'right' }}>Beg CV</Th><Th style={{ textAlign: 'right' }}>Int Exp (×4%)</Th>
            <Th style={{ textAlign: 'right' }}>Cash</Th><Th style={{ textAlign: 'right' }}>Prem Amort</Th><Th style={{ textAlign: 'right' }}>End CV</Th>
          </tr>
        </thead>
        <tbody>
          {[
            { yr:1, beg:108000, exp:4320, amort:1680, end:106320 },
            { yr:2, beg:106320, exp:4253, amort:1747, end:104573 },
            { yr:3, beg:104573, exp:4183, amort:1817, end:102756 },
            { yr:4, beg:102756, exp:4110, amort:1890, end:100866 },
            { yr:5, beg:100866, exp:4035, amort:1866, end:100000 },
          ].map((r) => (
            <tr key={r.yr} style={{ background: r.yr % 2 === 0 ? '#f8f8f8' : '#fff' }}>
              <Td center>{r.yr}</Td>
              <Td style={{ textAlign: 'right' }}>${r.beg.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.exp.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>$6,000</Td>
              <Td style={{ textAlign: 'right' }}>${r.amort.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.end.toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <p style={{ fontSize: 13, marginBottom: 6, fontWeight: 600, color: NAVY }}>
        Discount Bond (시장 8%) — Cash $6,000/year
      </p>
      <Tbl>
        <thead>
          <tr>
            <Th center>Year</Th><Th style={{ textAlign: 'right' }}>Beg CV</Th><Th style={{ textAlign: 'right' }}>Int Exp (×8%)</Th>
            <Th style={{ textAlign: 'right' }}>Cash</Th><Th style={{ textAlign: 'right' }}>Disc Amort</Th><Th style={{ textAlign: 'right' }}>End CV</Th>
          </tr>
        </thead>
        <tbody>
          {[
            { yr:1, beg:92000, exp:7360, amort:1360, end:93360 },
            { yr:2, beg:93360, exp:7469, amort:1469, end:94829 },
            { yr:3, beg:94829, exp:7586, amort:1586, end:96415 },
            { yr:4, beg:96415, exp:7713, amort:1713, end:98128 },
            { yr:5, beg:98128, exp:7872, amort:1872, end:100000 },
          ].map((r) => (
            <tr key={r.yr} style={{ background: r.yr % 2 === 0 ? '#f8f8f8' : '#fff' }}>
              <Td center>{r.yr}</Td>
              <Td style={{ textAlign: 'right' }}>${r.beg.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.exp.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>$6,000</Td>
              <Td style={{ textAlign: 'right' }}>${r.amort.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.end.toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>SL vs Effective Interest — 이자비용 방향 비교</H3>
      <Tbl>
        <thead><tr><Th>구분</Th><Th>SL</Th><Th>Effective Interest</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>Premium</Td>
            <Td>매년 동일 $4,400</Td>
            <Td>매년 감소 $4,320 → $4,035</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>Discount</Td>
            <Td>매년 동일 $7,600</Td>
            <Td>매년 증가 $7,360 → $7,872</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>Call Option & Early Retirement (조기 상환)</H3>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        <p>• <strong>Call option</strong>: Issuer(발행자) 옵션 / 금리 하락 시 call 행사 유리 / Call price = Par + Call premium</p>
        <p>• <strong>Early Retirement 5단계</strong>:</p>
        <ol style={{ marginLeft: 20, marginTop: 4 }}>
          <li>상환일까지 이자비용 인식 (SL 또는 EI)</li>
          <li>상환일 현재 장부가(Net CV) 확인</li>
          <li>Reacquisition price = 실제 지급액 (call price)</li>
          <li><strong>Gain/Loss = Net CV − Reacquisition price</strong></li>
          <li>I/S에 Gain/Loss on extinguishment 별도 표시 (extraordinary 아님)</li>
        </ol>
      </div>

      <Trap items={[
        'Premium 상각 누락 → Net CV 과대 → Gain 과소 / Loss 과대',
        'Discount 상각 누락 → Net CV 과소 → Gain 과대 / Loss 과소',
        'Call price ≠ face value — call premium을 별도로 고려해야 함',
        '쿠폰 < 시장 → Discount / 쿠폰 > 시장 → Premium 방향 혼동 주의',
        'SL vs EI: 조기 상환 시점의 BV는 어느 방법으로 상각했는지에 따라 다름',
      ]} />

      <H3>핵심 용어 정리 (Korean ↔ English)</H3>
      <Tbl>
        <thead><tr><Th>한국어</Th><Th>영어 (시험 표기)</Th></tr></thead>
        <tbody>
          {[
            ['발행가', 'Issue price / Issuance price'],
            ['액면가', 'Face value / Par value'],
            ['이자 지급 (매기)', 'Coupon payment'],
            ['원금 (만기 1회)', 'Principal repayment / Face value at maturity'],
            ['단일금액 현재가치', 'PV of $1 (lump sum)'],
            ['연금 현재가치', 'PV of Ordinary Annuity'],
            ['기초 납부 연금', 'PV of Annuity Due'],
            ['잔존가치 보증', 'Residual Value Guarantee (RVG)'],
            ['시장이자율 / 수익률', 'Market rate / Yield'],
            ['유효이자율', 'Effective interest rate'],
            ['할인 발행', 'Issued at a discount'],
            ['할증 발행', 'Issued at a premium'],
            ['액면 발행', 'Issued at par'],
          ].map(([ko, en], i) => (
            <tr key={ko} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8' }}>
              <Td>{ko}</Td>
              <Td bold>{en}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>
    </div>
  );
}

// ── Section 2: Finance Lease ─────────────────────────────────────
function FinanceLeaseSection() {
  const leaseRows = [
    { yr:1, beg:84248, int:5055, pay:20000, prin:14945, end:69303 },
    { yr:2, beg:69303, int:4158, pay:20000, prin:15842, end:53461 },
    { yr:3, beg:53461, int:3208, pay:20000, prin:16792, end:36669 },
    { yr:4, beg:36669, int:2200, pay:20000, prin:17800, end:18869 },
    { yr:5, beg:18869, int:1131, pay:20000, prin:18869, end:0 },
  ];
  return (
    <div>
      <H2>Finance Lease — 금융리스 핵심 정리</H2>

      <H3>TBORTS — 5가지 분류 기준 (하나라도 해당 시 Finance Lease)</H3>
      <Tbl>
        <thead><tr><Th center>약어</Th><Th>기준</Th><Th>내용</Th></tr></thead>
        <tbody>
          {[
            { a:'T', f:'Transfer of ownership', d:'리스 종료 시 소유권 이전' },
            { a:'B', f:'Bargain purchase option', d:'FV보다 유리한 가격으로 취득 옵션' },
            { a:'75%', f:'75% of economic life', d:'리스기간 ≥ 잔존 경제적 내용연수의 75%' },
            { a:'90%', f:'90% of fair value', d:'PV of payments ≥ 자산 FV의 90%' },
            { a:'S', f:'Specialized asset', d:'전용 자산 — 임차인 외 사용 불가' },
          ].map((r, i) => (
            <tr key={r.a} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8' }}>
              <Td center bold>{r.a}</Td>
              <Td bold>{r.f}</Td>
              <Td>{r.d}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>Day 1 분개</H3>
      <p style={{ fontSize: 13, marginBottom: 6 }}>Payment $20,000 / Rate 6% / 5년 Ordinary Annuity → PV = $84,248</p>
      <Journal entries={[
        { account: 'Dr. ROU Asset', dr: 84248 },
        { account: '  Cr. Lease Liability', cr: 84248 },
      ]} />

      <H3>Lease 상각표 (Ordinary Annuity, $20,000/year, 6%)</H3>
      <Tbl>
        <thead>
          <tr>
            <Th center>Year</Th><Th style={{ textAlign: 'right' }}>Beg Liability</Th><Th style={{ textAlign: 'right' }}>Int Exp (6%)</Th>
            <Th style={{ textAlign: 'right' }}>Payment</Th><Th style={{ textAlign: 'right' }}>Principal ↓</Th><Th style={{ textAlign: 'right' }}>End Liability</Th>
          </tr>
        </thead>
        <tbody>
          {leaseRows.map((r) => (
            <tr key={r.yr} style={{ background: r.yr % 2 === 0 ? '#f8f8f8' : '#fff' }}>
              <Td center>{r.yr}</Td>
              <Td style={{ textAlign: 'right' }}>${r.beg.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.int.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.pay.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.prin.toLocaleString()}</Td>
              <Td style={{ textAlign: 'right' }}>${r.end.toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>Annuity Due vs Ordinary Annuity</H3>
      <Tbl>
        <thead><tr><Th>구분</Th><Th>첫 납부</Th><Th>PV 비교</Th><Th>키워드</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>Ordinary Annuity</Td>
            <Td>기말 (end of period)</Td>
            <Td>기준</Td>
            <Td>"in arrears"</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>Annuity Due</Td>
            <Td>기초 (beginning of period)</Td>
            <Td>Ordinary × (1+r) → 더 크다</Td>
            <Td>"in advance", "beginning of year"</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>할인율 우선순위</H3>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        <p>1순위: <strong>Implicit rate</strong> (임대인 내재이자율) — 알 수 있으면 반드시 사용</p>
        <p>2순위: <strong>IBR</strong> (Incremental Borrowing Rate) — implicit rate 모를 때만 임차인 차입이자율 적용</p>
      </div>

      <Trap items={[
        'Annuity Due: 첫 지급 Day 1 → 바로 원금 감소, 이자 적음 → PV 더 크다',
        'Implicit rate 알 수 있는데 IBR 사용하면 오답',
        'ROU Asset ≠ Lease Liability (초기비용, 선급리스료 가산 가능)',
        'B/S 유동성 분류: Current Lease Liability = 1년치 Principal 감소액만 (이자 제외)',
        '임차인 B/S: ROU Asset 상각 + Lease Liability 별도 track → 두 금액 다름',
      ]} />
    </div>
  );
}

// ── Section 3: Operating Lease ───────────────────────────────────
function OperatingLeaseSection() {
  return (
    <div>
      <H2>Operating Lease — 운용리스 핵심 정리</H2>

      <H3>기본 원칙: I/S와 B/S 처리 방식이 다르다</H3>
      <Tbl>
        <thead><tr><Th>항목</Th><Th>방법</Th><Th>비고</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>I/S — Lease Expense</Td>
            <Td>항상 Straight-line (균등)</Td>
            <Td>총 리스료 ÷ 리스기간</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>B/S — Lease Liability</Td>
            <Td>Effective Interest 상각</Td>
            <Td>Finance Lease와 동일한 방법</Td>
          </tr>
          <tr>
            <Td bold>ROU Asset 상각 (plug)</Td>
            <Td>SL Expense − Int Exp</Td>
            <Td>역산 — 별도 상각 스케줄 없음</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>매 기간 분개 (SL Expense $10,000 / 현금 $9,000 / Int Exp $1,500 가정)</H3>
      <Journal entries={[
        { account: 'Dr. Operating Lease Expense (SL)', dr: 10000 },
        { account: '  Cr. Cash (실제 납부)', cr: 9000 },
        { account: '  Cr. Lease Liability (Int: $1,500 − payment diff)', cr: 500 },
        { account: '  Cr. ROU Asset (plug: Exp − Int)', cr: 500 },
      ]} />
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
        * 핵심 공식: ROU Asset Amortization = SL Lease Expense − Interest Expense on Liability
      </p>

      <H3>납부액 vs SL Expense 차이 효과</H3>
      <Tbl>
        <thead><tr><Th>상황</Th><Th>SL Expense 처리 안 할 경우</Th><Th>Lease Liability</Th></tr></thead>
        <tbody>
          <tr>
            <Td>납부액 &gt; SL Expense (초기 임대료 ↑)</Td>
            <Td>납부액 그대로 비용 → Expense Overstate</Td>
            <Td>Understate</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td>납부액 &lt; SL Expense (초기 임대료 ↓)</Td>
            <Td>납부액 그대로 비용 → Expense Understate</Td>
            <Td>Overstate</Td>
          </tr>
        </tbody>
      </Tbl>

      <Trap items={[
        'Operating Lease도 ASC 842 이후 B/S에 ROU Asset + Lease Liability 계상 (Off B/S 아님)',
        'I/S = SL 균등 — 실제 납부액 ≠ Expense. 납부 금액을 비용으로 쓰면 오답',
        'Finance Lease: I/S 초기 비용 크고 후기 작음 / Operating Lease: I/S 항상 동일',
        'Operating Lease Expense → 단일 항목 (이자비용 + 감가상각 분리 없음)',
      ]} />
    </div>
  );
}

// ── Section 4: Note Payable ──────────────────────────────────────
function NotePayableSection() {
  return (
    <div>
      <H2>Note Payable — 어음/차입금 이자 계산</H2>

      <H3>기본 공식</H3>
      <div style={{ fontFamily: 'monospace', fontSize: 15, background: '#f0f4f8', border: BORDER,
        borderRadius: 6, padding: 16, marginBottom: 16, color: NAVY, fontWeight: 700 }}>
        이자비용 = Beginning Balance × 연이자율 × 경과월수 / 12
      </div>

      <H3>예시 ①: 연중 차입</H3>
      <div style={{ fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
        <p>차입 조건: 9/30 차입 $1,000,000, 연이자율 9%, 결산일 12/31</p>
        <p>경과기간: 10월, 11월, 12월 = <strong>3개월</strong></p>
        <p style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>
          이자비용 = $1,000,000 × 9% × 3/12 = $22,500
        </p>
        <p style={{ fontSize: 12, color: '#555' }}>→ 미지급이자(Accrued Interest) $22,500 / B/S에 계상</p>
      </div>

      <H3>예시 ②: 다년도 — 7/1 차입 $500,000, 12%, 3년, 6/30 이자 납부</H3>
      <Tbl>
        <thead>
          <tr>
            <Th>회계연도</Th><Th>해당 기간</Th><Th style={{ textAlign: 'right' }}>이자비용</Th><Th style={{ textAlign: 'right' }}>12/31 미지급이자</Th>
          </tr>
        </thead>
        <tbody>
          {[
            { yr:'Year 1', period:'7/1~12/31 (6개월)', exp:'$30,000', accrual:'$30,000' },
            { yr:'Year 2', period:'1/1~12/31 (12개월)', exp:'$60,000', accrual:'$30,000' },
            { yr:'Year 3', period:'1/1~6/30 (6개월)', exp:'$30,000', accrual:'$0' },
          ].map((r, i) => (
            <tr key={r.yr} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8' }}>
              <Td bold>{r.yr}</Td>
              <Td>{r.period}</Td>
              <Td style={{ textAlign: 'right' }}>{r.exp}</Td>
              <Td style={{ textAlign: 'right' }}>{r.accrual}</Td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>Noninterest-Bearing Note</H3>
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        <p>• 발행가 = PV (미래 지급액의 현재가치), 액면 ≠ PV</p>
        <p>• Discount = 액면 − PV → 매년 EI 방법으로 상각 = Interest Expense</p>
        <p>• 분개 예시 (액면 $100,000, PV $79,383, 3년):</p>
      </div>
      <Journal entries={[
        { account: 'Dr. Cash', dr: 79383 },
        { account: 'Dr. Discount on Note Payable', dr: 20617 },
        { account: '  Cr. Note Payable', cr: 100000 },
      ]} />

      <Trap items={[
        '연간 Payment를 이자비용으로 직접 사용 금지 — payment에 원금 포함',
        '이자 납부일 ≠ 결산일: 경과월수 m/12 정확히 계산 (반드시 날짜 확인)',
        'Noninterest-bearing: PV로 인식, Discount amortization = Interest Expense',
        '단기차입금 연장(Roll-over): 결산일 현재 refinancing 약정 있으면 장기로 재분류 가능',
      ]} />
    </div>
  );
}

// ── Section 5: ARO ───────────────────────────────────────────────
function AROSection() {
  return (
    <div>
      <H2>ARO (Asset Retirement Obligation) 핵심 정리</H2>

      <H3>Day 1 인식 원칙</H3>
      <Tbl>
        <thead><tr><Th>항목</Th><Th>처리</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>ARO Liability 금액</Td>
            <Td>명목금액 아닌 PV로 인식 (credit-adjusted risk-free rate 사용)</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>자산 처리</Td>
            <Td>ARO PV를 관련 자산 원가에 가산 → PP&E 일부로 상각</Td>
          </tr>
          <tr>
            <Td bold>Day 1 비용</Td>
            <Td>$0 — 발생 즉시 비용 인식 아님. 자산화 후 상각</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>Day 1 분개</H3>
      <p style={{ fontSize: 13, marginBottom: 6 }}>자산 원가 $500,000 / ARO 명목금액 $100,000 / PV $60,000</p>
      <Journal entries={[
        { account: 'Dr. PP&E (자산 원가 + ARO PV)', dr: 560000 },
        { account: '  Cr. Cash', cr: 500000 },
        { account: '  Cr. ARO Liability', cr: 60000 },
      ]} />

      <H3>매년 처리 — 두 가지 트랙</H3>
      <Tbl>
        <thead><tr><Th>트랙</Th><Th>항목</Th><Th>분개</Th><Th>금액 기준</Th></tr></thead>
        <tbody>
          <tr>
            <Td bold>자산 트랙</Td>
            <Td>Depreciation Expense</Td>
            <Td>Dr. Depr Exp / Cr. Acc. Depr.</Td>
            <Td>(자산 원가 + ARO PV) ÷ 내용연수</Td>
          </tr>
          <tr style={{ background: '#f8f8f8' }}>
            <Td bold>부채 트랙</Td>
            <Td>Accretion Expense</Td>
            <Td>Dr. Accretion Exp / Cr. ARO</Td>
            <Td>기초 ARO × credit-adjusted rate</Td>
          </tr>
        </tbody>
      </Tbl>

      <H3>수치 예시 (ARO PV $60,000 / Rate 5% / 내용연수 10년)</H3>
      <div style={{ fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
        <p>• Year 1 Depreciation = $560,000 ÷ 10 = <strong>$56,000</strong></p>
        <p>• Year 1 Accretion = $60,000 × 5% = <strong>$3,000</strong> → Year-end ARO: $63,000</p>
        <p>• Year 2 Accretion = $63,000 × 5% = <strong>$3,150</strong> → 매년 증가 (복리)</p>
        <p>• 만기 시 실제 지출 $95,000 / ARO 잔액 $96,420 → Gain on settlement $1,420</p>
      </div>

      <Trap items={[
        'ARO = PV 인식 — 명목금액($100,000) 그대로 인식하면 오답',
        'Accretion rate = credit-adjusted risk-free rate (risk-free rate 단독 사용 오답)',
        'Day 1 expense $0 — "inception에 expense 인식" 선택지는 오답',
        'PP&E 상각: (원래 자산 + ARO PV) 전체 상각 — ARO만 따로 상각 아님',
        '실제 정산 vs ARO 잔액 차이 → Gain/Loss on settlement 인식',
      ]} />
    </div>
  );
}

// ── Section 6: 4형제 비교 ─────────────────────────────────────────
function ComparisonSection() {
  const rows = [
    { item:'이자 계산', bond:'Beg CV × 시장율', fl:'Beg Liability × rate', ol:'Beg Liability × rate', note:'Beg Balance × 연이율', aro:'Beg ARO × credit-adj rate' },
    { item:'I/S 항목', bond:'Interest Expense', fl:'Interest Exp + Depr. Exp', ol:'Operating Lease Expense (단일)', note:'Interest Expense', aro:'Depreciation + Accretion' },
    { item:'I/S 추세', bond:'P: 감소 / D: 증가', fl:'감소 (부채 따라감)', ol:'항상 균등 (SL)', note:'일정 (원금 불변)', aro:'증가 (복리)' },
    { item:'B/S 부채 방향', bond:'P: 감소→Face / D: 증가→Face', fl:'감소 → $0', ol:'감소 → $0', note:'일정 or 분할 감소', aro:'증가 → 명목금액' },
    { item:'상각 방법', bond:'SL or EI (선택)', fl:'EI 필수', ol:'I/S: SL / B/S: EI', note:'EI (NI-bearing)', aro:'EI (Accretion)' },
    { item:'SL 허용?', bond:'○', fl:'×', ol:'○ (Expense만)', note:'○', aro:'×' },
    { item:'조기 종료', bond:'Gain/Loss on extinguishment', fl:'ROU + Liability 제거', ol:'Gain/Loss on termination', note:'Gain/Loss on settlement', aro:'Gain/Loss (실제 vs 잔액)' },
  ];
  return (
    <div>
      <H2>Bond · Finance Lease · Operating Lease · Note Payable · ARO 비교표</H2>
      <Tbl>
        <thead>
          <tr>
            {['항목','Bond','Finance Lease','Operating Lease','Note Payable','ARO'].map((h) => (
              <Th key={h}>{h}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.item} style={{ background: i % 2 === 0 ? '#fff' : '#f8f8f8', verticalAlign: 'top' }}>
              <td style={{ padding: '8px 12px', border: BORDER, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' }}>{r.item}</td>
              <td style={{ padding: '8px 12px', border: BORDER, fontSize: 13 }}>{r.bond}</td>
              <td style={{ padding: '8px 12px', border: BORDER, fontSize: 13 }}>{r.fl}</td>
              <td style={{ padding: '8px 12px', border: BORDER, fontSize: 13 }}>{r.ol}</td>
              <td style={{ padding: '8px 12px', border: BORDER, fontSize: 13 }}>{r.note}</td>
              <td style={{ padding: '8px 12px', border: BORDER, fontSize: 13 }}>{r.aro}</td>
            </tr>
          ))}
        </tbody>
      </Tbl>

      <H3>핵심 암기 포인트</H3>
      <div style={{ fontSize: 13, lineHeight: 2 }}>
        <p>🔑 <strong>SL 허용</strong>: Bond(US GAAP 선택) + Operating Lease Expense만 / Finance Lease·ARO는 EI 필수</p>
        <p>🔑 <strong>I/S 균등</strong>: Operating Lease Expense만 — 나머지는 모두 변동</p>
        <p>🔑 <strong>B/S 부채 증가</strong>: ARO만 / Discount Bond도 증가하지만 만기 시 Face에 수렴</p>
        <p>🔑 <strong>Discount Bond ≈ ARO</strong>: B/S 부채 증가 + I/S 비용 증가 (방향 동일)</p>
        <p>🔑 <strong>Premium Bond ≈ Finance Lease</strong>: B/S 부채 감소 + I/S 비용 감소 (방향 동일)</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function BondMasterPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('bond');

  return (
    <div style={{ background: '#fff', minHeight: '100%', display: 'flex', flexDirection: 'column', color: TEXT }}>
      {/* Header */}
      <div style={{ background: NAVY, color: '#fff', padding: '16px 24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Bond · Lease · Note · ARO 마스터</h1>
        <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.8 }}>FAR 부채 파트 핵심 개념 완전 정리</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: `2px solid ${NAVY}`, overflowX: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            style={{
              display: 'inline-block',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: activeSection === tab.key ? 700 : 400,
              color: activeSection === tab.key ? '#fff' : NAVY,
              background: activeSection === tab.key ? NAVY : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div style={{ flex: 1, padding: '24px', paddingBottom: 48, maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {activeSection === 'bond' && <BondSection />}
        {activeSection === 'finance-lease' && <FinanceLeaseSection />}
        {activeSection === 'operating-lease' && <OperatingLeaseSection />}
        {activeSection === 'note-payable' && <NotePayableSection />}
        {activeSection === 'aro' && <AROSection />}
        {activeSection === 'comparison' && <ComparisonSection />}
      </div>
    </div>
  );
}
