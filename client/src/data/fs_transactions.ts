// ─────────────────────────────────────────────────────────────────────────────
// FAR Study App — FS Transaction Groups
// Classification basis: "What happened?" (not B/S section)
// ─────────────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  account: string
  type: 'dr' | 'cr'
  amount: number
}

// 10-step accounting cycle
export type StepId =
  | 'source'   // Source document / triggering event
  | 'journal'  // General Journal Entry
  | 'ledger'   // General Ledger / T-accounts
  | 'tb'       // Adjusted Trial Balance
  | 'is'       // Income Statement
  | 'oci'      // Other Comprehensive Income
  | 'se'       // Statement of Stockholders' Equity
  | 'bs'       // Balance Sheet
  | 'scf'      // Statement of Cash Flows
  | 'notes'    // Notes to Financial Statements

export interface DrillJeRow {
  acct: string
  type: 'dr' | 'cr'
  sign: string
  signClass: 'sign-positive' | 'sign-negative'
  reason: string
}

export interface DrillTAccount {
  name: string
  dr: string[]
  cr: string[]
}

export interface DrillTbRow {
  acct: string
  dr: string
  cr: string
  highlight?: boolean
}

export interface DrillContent {
  title?: string
  je?: DrillJeRow[]
  taccounts?: DrillTAccount[]
  tb?: DrillTbRow[]
  custom?: string
  trap?: string
  note?: string
}

export interface TxStage {
  step: StepId
  label: string
  note: string
  entries?: JournalEntry[]
  trap?: string
  drill?: DrillContent
}

export interface FsImpact {
  is_ni?: string
  is_oci?: string
  bs?: string
  se?: string
  cfo?: string
  cfi?: string
  cff?: string
  notes?: string
}

export interface TxItem {
  id: string
  label: string
  topicId: string
  stages: TxStage[]
  fsImpact: FsImpact
}

export interface TxGroup {
  id: string
  label: string
  color: string
  items: TxItem[]
}

// ─────────────────────────────────────────────────────────────────────────────
// TX_GROUPS — 7 groups
// ─────────────────────────────────────────────────────────────────────────────

export const TX_GROUPS: TxGroup[] = [
  {
    id: 'aje',
    label: '① Period-End Adjustments (AJE)',
    color: '#1D9E75',
    items: [
      {
        id: 'aje_accrued_expense',
        label: 'Accrued Expense',
        topicId: 'INT_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Year-end review: salaries earned by employees but not yet paid in cash.\n(e.g., December wages paid in January next year)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Accrual basis: recognize expense when incurred, regardless of cash payment.',
            entries: [
              { account: 'Salaries Expense', type: 'dr', amount: 10000 },
              { account: 'Salaries Payable', type: 'cr', amount: 10000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Salaries Expense', type: 'dr', sign: '+$10,000', signClass: 'sign-positive', reason: '비용 증가 → Debit → 양수' },
                { acct: 'Salaries Payable',  type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
              ],
              note: '$10,000 = December salaries earned but not yet paid in cash',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Salaries Expense (Dr balance increases)\n• Salaries Payable (Cr balance — new liability created)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Salaries Expense', dr: ['10,000 ★'], cr: [] },
                { name: 'Salaries Payable', dr: [], cr: ['10,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Salaries Expense   Dr  $10,000\n• Salaries Payable   Cr  $10,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Salaries Expense', dr: '$10,000', cr: '—', highlight: true },
                { acct: 'Salaries Payable', dr: '—', cr: '$10,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Salaries Expense $10,000 → Operating Expenses\nNet Income decreases by $10,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Salaries Expense</span><span style="color:#c2410c;font-weight:600">($10,000)</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Debit(Credit) 입력 시: Expense 증가 → 양수 +$10,000</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ → Retained Earnings ↓ $10,000\nAll other columns (Common Stock, APIC, AOCI, Treasury Stock): no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$10,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Salaries Payable (Current) +$10,000\nStockholders\' Equity: Retained Earnings −$10,000\nAssets: no change → Balance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Salaries Payable',  dr: '+$10,000', cr: '($10,000)', highlight: true },
                { acct: 'Retained Earnings', dr: '−$10,000', cr: '($10,000)', highlight: true },
              ],
              trap: 'Balance Sheet에서 Salaries Payable을 양수로 적으면 틀림. 부채 증가 = Credit = 음수(괄호).',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Accrued Liabilities increase +$10,000 (add back — cash not yet paid)\n⚠ When actually paid in January → Operating Activities outflow (Cash paid for salaries)',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 미지급 → Operating Activities 영향 없음<br><strong>내년 지급 시:</strong> Cash paid for salaries → Operating Activities outflow<br><strong>Supplemental:</strong> Cash paid for salaries 금액 공시 (필수)</div>`,
              trap: 'Operating Activities outflow는 현금 지급 시점 기준. AJE 시점 아님.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Accrued salaries payable balance, payment schedule.\nFAR TBS: Notes exhibit often shows accrued liability balances → use to verify AJE amounts.',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Accrued salaries payable balance: $10,000<br>② Payment schedule (January next year)<br>③ Accounting policy: accrual basis<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Notes exhibit에서 accrued liability 잔액 확인 → AJE 금액 검증용</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Salaries Expense +$10,000 → Net Income ↓',
          bs: 'Salaries Payable (Current Liabilities) +$10,000',
          se: 'Retained Earnings ↓ $10,000 (via Net Income)',
          cfo: 'Indirect method: Accrued Liabilities increase → add back (+). Cash payment → Operating outflow',
        },
      },
      {
        id: 'aje_accrued_revenue',
        label: 'Accrued Revenue',
        topicId: 'ADJ_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Year-end review: interest or service revenue earned but not yet received in cash.\n(e.g., December interest on a note receivable, collected in January)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Accrual basis: recognize revenue when earned, regardless of cash receipt.',
            entries: [
              { account: 'Interest Receivable', type: 'dr', amount: 10000 },
              { account: 'Interest Revenue', type: 'cr', amount: 10000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Interest Receivable', type: 'dr', sign: '+$10,000', signClass: 'sign-positive', reason: '자산 증가 → Debit → 양수' },
                { acct: 'Interest Revenue',    type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: '수익 증가 → Credit → 음수' },
              ],
              note: '$10,000 = December interest earned but not yet received in cash',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Interest Receivable (Dr balance — new asset created)\n• Interest Revenue (Cr balance — revenue recognized)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Interest Receivable', dr: ['10,000 ★'], cr: [] },
                { name: 'Interest Revenue',    dr: [],           cr: ['10,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Interest Receivable   Dr  $10,000\n• Interest Revenue      Cr  $10,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Interest Receivable', dr: '$10,000', cr: '—',       highlight: true },
                { acct: 'Interest Revenue',    dr: '—',       cr: '$10,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Interest Revenue +$10,000 → Other Income (below Operating Income)\nNet Income increases by $10,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Interest Revenue</span><span style="color:#0f6e56;font-weight:600">+$10,000</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Debit(Credit) 입력 시: Revenue 증가 → 음수 ($10,000)</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ → Retained Earnings ↑ $10,000\nAll other columns: no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$10,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Interest Receivable (Current) +$10,000\nStockholders\' Equity: Retained Earnings +$10,000\nLiabilities: no change → Balance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Interest Receivable', dr: '+$10,000', cr: '($10,000)', highlight: true },
                { acct: 'Retained Earnings',   dr: '+$10,000', cr: '($10,000)', highlight: true },
              ],
              trap: 'Interest Receivable = 자산 증가 = Debit = 양수. SCF indirect method에서 receivable 증가 → 차감(-)',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Interest Receivable increase −$10,000 (deduct — cash not yet received)\n⚠ When actually collected in January → Operating Activities inflow',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 미수취 → Receivable 증가 → CFO에서 차감(-)<br><strong>내년 수취 시:</strong> Cash received → Operating inflow<br><strong>Supplemental:</strong> Cash received for interest 공시</div>`,
              trap: 'Receivable 증가는 CFO indirect method에서 차감(-). Expense 항목과 반대 방향.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Accrued interest receivable balance, receipt schedule.\nFAR TBS: Notes exhibit에서 receivable 잔액 확인 → AJE 금액 검증용',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Interest receivable balance: $10,000<br>② Receipt schedule (January next year)<br>③ Accounting policy: accrual basis<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Notes exhibit에서 receivable 잔액 확인 → AJE 금액 검증용</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Interest Revenue +$10,000 → Net Income ↑',
          bs: 'Interest Receivable (Current Assets) +$10,000',
          se: 'Retained Earnings ↑ $10,000 (via Net Income)',
          cfo: 'Indirect method: Receivable increase → deduct (−). Cash receipt → Operating inflow',
        },
      },
      {
        id: 'aje_prepaid',
        label: 'Prepaid Expense Expiration',
        topicId: 'ADJ_002',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Prepaid insurance paid at beginning of year; portion has expired by year-end.\n(e.g., $12,000 annual premium paid Jan 1 → $3,000 expired by March 31)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Matching principle: allocate prepaid cost to expense as benefit is consumed.',
            entries: [
              { account: 'Insurance Expense', type: 'dr', amount: 3000 },
              { account: 'Prepaid Insurance', type: 'cr', amount: 3000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Insurance Expense', type: 'dr', sign: '+$3,000', signClass: 'sign-positive', reason: '비용 증가 → Debit → 양수' },
                { acct: 'Prepaid Insurance', type: 'cr', sign: '($3,000)', signClass: 'sign-negative', reason: '자산 감소 → Credit → 음수' },
              ],
              note: '$3,000 = portion of prepaid insurance expired this period',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Insurance Expense (Dr balance increases)\n• Prepaid Insurance (Cr balance — asset reduced)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Insurance Expense', dr: ['3,000 ★'], cr: [] },
                { name: 'Prepaid Insurance', dr: [],           cr: ['3,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Insurance Expense   Dr  $3,000\n• Prepaid Insurance   Cr  $3,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Insurance Expense', dr: '$3,000', cr: '—',      highlight: true },
                { acct: 'Prepaid Insurance', dr: '—',      cr: '$3,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Insurance Expense +$3,000 → Operating Expenses\nNet Income decreases by $3,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Insurance Expense</span><span style="color:#c2410c;font-weight:600">($3,000)</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Expense 증가 → 양수 입력 +$3,000</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ → Retained Earnings ↓ $3,000\nAll other columns: no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$3,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Prepaid Insurance (Current) −$3,000\nStockholders\' Equity: Retained Earnings −$3,000\nBalance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Prepaid Insurance',  dr: '−$3,000', cr: '($3,000)', highlight: true },
                { acct: 'Retained Earnings',  dr: '−$3,000', cr: '($3,000)', highlight: true },
              ],
              trap: 'Prepaid 감소 = 자산 감소 = SCF indirect method에서 가산(+). Receivable 증가와 반대.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Prepaid decrease +$3,000 (add back — non-cash allocation)\n⚠ Original cash payment was Operating outflow at time of payment (Jan 1)',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 이동 없음 (현금은 이미 연초에 나갔음)<br><strong>Indirect Method:</strong> Prepaid 감소 → add back (+$3,000)<br><strong>원래 현금 지급:</strong> Jan 1 → Operating Activities outflow</div>`,
              trap: 'Prepaid 감소 → add back(+). 현금은 이미 연초에 나갔음. AJE는 현금 흐름 없음.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Prepaid balance remaining, expiration schedule.',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Prepaid insurance balance remaining<br>② Expiration schedule<br>③ Accounting policy: matching principle<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Prepaid 잔액으로 남은 보험 기간 역산 가능</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Insurance Expense +$3,000 → Net Income ↓',
          bs: 'Prepaid Insurance (Current Assets) −$3,000',
          se: 'Retained Earnings ↓ $3,000 (via Net Income)',
          cfo: 'Indirect method: Prepaid decrease → add back (+)',
        },
      },
      {
        id: 'aje_unearned',
        label: 'Unearned Revenue Recognition',
        topicId: 'ADJ_003',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Customer paid $12,000 in advance for a 12-month service contract.\nBy year-end, 5 months of service have been performed → $5,000 earned.',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Revenue recognized as performance obligation is satisfied (ASC 606).',
            entries: [
              { account: 'Unearned Revenue', type: 'dr', amount: 5000 },
              { account: 'Service Revenue',  type: 'cr', amount: 5000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Unearned Revenue', type: 'dr', sign: '+$5,000', signClass: 'sign-positive', reason: '부채 감소 → Debit → 양수' },
                { acct: 'Service Revenue',  type: 'cr', sign: '($5,000)', signClass: 'sign-negative', reason: '수익 증가 → Credit → 음수' },
              ],
              note: '$5,000 = service revenue earned this period (5/12 × $12,000)',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Unearned Revenue (Dr — liability reduced)\n• Service Revenue (Cr — revenue recognized)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Unearned Revenue', dr: ['5,000 ★'], cr: [] },
                { name: 'Service Revenue',  dr: [],           cr: ['5,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Unearned Revenue   Dr  $5,000 (reduction)\n• Service Revenue    Cr  $5,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Unearned Revenue', dr: '$5,000', cr: '—',      highlight: true },
                { acct: 'Service Revenue',  dr: '—',      cr: '$5,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Service Revenue +$5,000 → Net Income increases',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Service Revenue</span><span style="color:#0f6e56;font-weight:600">+$5,000</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Debit(Credit) 입력 시: Revenue 증가 → 음수 ($5,000)</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ → Retained Earnings ↑ $5,000\nAll other columns: no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$5,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Unearned Revenue (Current) −$5,000\nStockholders\' Equity: Retained Earnings +$5,000\nAssets: no change → Balance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Unearned Revenue',  dr: '−$5,000', cr: '($5,000)', highlight: true },
                { acct: 'Retained Earnings', dr: '+$5,000', cr: '($5,000)', highlight: true },
              ],
              trap: 'Unearned Revenue 감소 = 부채 감소 = SCF indirect method에서 차감(-). 현금은 이미 수취했음.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Unearned Revenue decrease −$5,000 (deduct)\n⚠ Original cash receipt ($12,000) was already recorded as Operating inflow when customer paid',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> AJE는 현금 흐름 없음<br><strong>원래 현금 수취:</strong> 고객 선불 시 Operating inflow 이미 기록<br><strong>Indirect Method:</strong> Unearned Revenue 감소 → 차감(-)</div>`,
              trap: '현금은 고객이 선불 낼 때 이미 수취. AJE는 현금 흐름 없음. Unearned Revenue 감소 → CFO 차감(-).',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Remaining unearned balance $7,000 / Performance obligation: 7 months remaining',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Remaining unearned balance: $7,000<br>② Performance obligation: 7 months remaining<br>③ ASC 606: Revenue recognition policy<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Unearned Revenue 잔액 → 남은 이행 의무 기간 역산</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Service Revenue +$5,000 → Net Income ↑',
          bs: 'Unearned Revenue (Current Liabilities) −$5,000',
          se: 'Retained Earnings ↑ $5,000 (via Net Income)',
          cfo: 'Indirect method: Unearned Revenue decrease → deduct (−). Original cash already in CFO.',
        },
      },
      {
        id: 'aje_depreciation',
        label: 'Depreciation',
        topicId: 'PPE_DEP_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Year-end allocation of PP&E cost over useful life.\nStraight-line: (Cost $50,000 − Salvage $2,000) ÷ 6 years = $8,000/year',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Systematic and rational allocation of asset cost (matching principle).',
            entries: [
              { account: 'Depreciation Expense',     type: 'dr', amount: 8000 },
              { account: 'Accumulated Depreciation', type: 'cr', amount: 8000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Depreciation Expense',     type: 'dr', sign: '+$8,000', signClass: 'sign-positive', reason: '비용 증가 → Debit → 양수' },
                { acct: 'Accumulated Depreciation', type: 'cr', sign: '($8,000)', signClass: 'sign-negative', reason: 'Contra asset 증가 → Credit → 음수' },
              ],
              note: '$8,000 = ($50,000 − $2,000) ÷ 6 years',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Depreciation Expense (Dr balance increases)\n• Accumulated Depreciation (Cr balance — contra asset increases)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Depreciation Expense',     dr: ['8,000 ★'], cr: [] },
                { name: 'Accumulated Depreciation', dr: [],           cr: ['8,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Depreciation Expense       Dr  $8,000\n• Accumulated Depreciation   Cr  $8,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Depreciation Expense',     dr: '$8,000', cr: '—',      highlight: true },
                { acct: 'Accumulated Depreciation', dr: '—',      cr: '$8,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Depreciation Expense +$8,000 → Operating Expenses\nNet Income decreases by $8,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Depreciation Expense</span><span style="color:#c2410c;font-weight:600">($8,000)</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Expense 증가 → 양수 입력 +$8,000</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ → Retained Earnings ↓ $8,000\nAll other columns: no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$8,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Accumulated Depreciation +$8,000 → PP&E net book value −$8,000\nStockholders\' Equity: Retained Earnings −$8,000\nBalance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Accumulated Depreciation', dr: '+$8,000', cr: '($8,000)', highlight: true },
                { acct: 'Retained Earnings',        dr: '−$8,000', cr: '($8,000)', highlight: true },
              ],
              trap: 'Accumulated Depreciation = contra asset. PP&E gross 금액은 변동 없음. Net book value만 감소.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Depreciation Expense +$8,000 (add back — non-cash expense)\n⚠ No cash outflow — cash was paid when asset was originally purchased',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 이동 없음 (비현금 비용)<br><strong>Indirect Method:</strong> Depreciation → add back (+$8,000)<br><strong>원래 현금 지급:</strong> 자산 구매 시점 → Investing Activities outflow</div>`,
              trap: 'Depreciation = 비현금 비용 → 항상 add back(+). 현금 유출은 자산 구매 시점. 절대 현금 유출 아님.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Depreciation method (straight-line) / Useful life 6 years / Salvage value $2,000\nFAR: 감가상각 방법 변경 시 → Change in accounting estimate → 소급 없음',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Depreciation method: straight-line<br>② Useful life: 6 years / Salvage value: $2,000<br>③ Annual depreciation: $8,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR: 감가상각 방법 변경 → Change in accounting estimate → 소급 없음 (prospective)</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Depreciation Expense +$8,000 → Net Income ↓',
          bs: 'Accumulated Depreciation +$8,000 → PP&E net −$8,000',
          se: 'Retained Earnings ↓ $8,000 (via Net Income)',
          cfo: 'Non-cash expense → add back (+) to Net Income in indirect method',
        },
      },
      {
        id: 'aje_allowance',
        label: 'Allowance for Doubtful Accounts',
        topicId: 'REC_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Year-end estimate of uncollectible AR based on aging analysis.\n(e.g., AR aging shows $2,000 estimated uncollectible)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'CECL model (ASC 326): recognize expected credit losses upfront.',
            entries: [
              { account: 'Credit Loss Expense',         type: 'dr', amount: 2000 },
              { account: 'Allowance for Credit Losses', type: 'cr', amount: 2000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Credit Loss Expense',         type: 'dr', sign: '+$2,000', signClass: 'sign-positive', reason: '비용 증가 → Debit → 양수' },
                { acct: 'Allowance for Credit Losses', type: 'cr', sign: '($2,000)', signClass: 'sign-negative', reason: 'Contra asset 증가 → Credit → 음수' },
              ],
              note: '$2,000 = estimated uncollectible based on AR aging analysis',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Credit Loss Expense (Dr balance increases)\n• Allowance for Credit Losses (Cr balance — contra asset increases)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Credit Loss Expense',         dr: ['2,000 ★'], cr: [] },
                { name: 'Allowance for Credit Losses', dr: [],           cr: ['2,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Credit Loss Expense            Dr  $2,000\n• Allowance for Credit Losses    Cr  $2,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Credit Loss Expense',         dr: '$2,000', cr: '—',      highlight: true },
                { acct: 'Allowance for Credit Losses', dr: '—',      cr: '$2,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Credit Loss Expense +$2,000 → Operating Expenses\nNet Income decreases by $2,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Credit Loss Expense</span><span style="color:#c2410c;font-weight:600">($2,000)</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Expense 증가 → 양수 입력 +$2,000</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ → Retained Earnings ↓ $2,000\nAll other columns: no change',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$2,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Allowance for Credit Losses +$2,000 → AR net −$2,000\nStockholders\' Equity: Retained Earnings −$2,000\nBalance maintained ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Allowance for Credit Losses', dr: '+$2,000', cr: '($2,000)', highlight: true },
                { acct: 'Retained Earnings',           dr: '−$2,000', cr: '($2,000)', highlight: true },
              ],
              trap: 'Actual write-off (Dr Allowance / Cr AR) → NO income statement impact. AR net unchanged at write-off.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Allowance increase +$2,000 (add back — non-cash)\n⚠ Actual write-off has no cash impact either',
            drill: {
              title: 'Statement of Cash Flows — Operating Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 이동 없음 (비현금 추정 비용)<br><strong>Indirect Method:</strong> Allowance 증가 → add back (+$2,000)<br><strong>실제 Write-off:</strong> Dr Allowance / Cr AR → 현금 흐름 없음</div>`,
              trap: 'Allowance 증가 = 비현금 → add back(+). Write-off 자체도 현금 흐름 없음. 실제 현금 유출은 나중에 AR을 포기할 때도 아님.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: CECL methodology / Aging schedule / Allowance balance $2,000\nFAR TBS: Allowance 잔액으로 AJE 금액 역산 가능',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① CECL methodology (ASC 326)<br>② AR aging schedule<br>③ Allowance balance: $2,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Allowance 잔액으로 AJE 금액 역산 가능</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Credit Loss Expense +$2,000 → Net Income ↓',
          bs: 'Allowance for Credit Losses +$2,000 → AR net −$2,000',
          se: 'Retained Earnings ↓ $2,000 (via Net Income)',
          cfo: 'Non-cash (allowance increase) → add back (+) in indirect method',
        },
      },
    ],
  },
  {
    id: 'asset',
    label: '② Asset Acquisition · Disposal · Impairment',
    color: '#185FA5',
    items: [
      {
        id: 'ppe_buy',
        label: 'PP&E Acquisition (Cash)',
        topicId: 'PPE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company purchases equipment for cash.\n(e.g., $60,000 equipment purchased on January 1)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Capitalize cost: record asset at purchase price plus all costs to get asset ready for use.',
            entries: [
              { account: 'Equipment', type: 'dr', amount: 60000 },
              { account: 'Cash',      type: 'cr', amount: 60000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Equipment', type: 'dr', sign: '+$60,000', signClass: 'sign-positive', reason: '자산 증가 → Debit → 양수' },
                { acct: 'Cash',      type: 'cr', sign: '($60,000)', signClass: 'sign-negative', reason: '자산 감소 → Credit → 음수' },
              ],
              note: '$60,000 = purchase price. Include all costs to get asset ready for use (freight, installation, testing).',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Equipment (Dr balance — new asset)\n• Cash (Cr balance — decreases)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Equipment', dr: ['60,000 ★'], cr: [] },
                { name: 'Cash',      dr: [],           cr: ['60,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After entry posting:\n• Equipment   Dr  $60,000\n• Cash         Cr  $60,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Equipment', dr: '$60,000', cr: '—',       highlight: true },
                { acct: 'Cash',      dr: '—',       cr: '$60,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact at acquisition.\nDepreciation expense recognized over useful life.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact at acquisition.<br>Depreciation starts next period.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'No SE impact at acquisition.\nRetained Earnings affected later via Depreciation Expense.',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">No SE impact at acquisition.<br>Retained Earnings affected later via Depreciation Expense.</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Equipment (PP&E) +$60,000 / Cash −$60,000\nNet Assets unchanged at acquisition ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Equipment', dr: '+$60,000', cr: '($60,000)', highlight: true },
                { acct: 'Cash',      dr: '−$60,000', cr: '($60,000)', highlight: true },
              ],
              trap: 'Repairs & maintenance → expense immediately. Only capitalize costs that extend useful life or add capacity.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Investing Activities — outflow:\n• Payment for equipment ($60,000)\n⚠ If financed with Note Payable → non-cash supplemental disclosure required',
            drill: {
              title: 'Statement of Cash Flows — Investing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Investing Activities:</strong> Payment for equipment → outflow ($60,000)<br><strong>Note Payable financing:</strong> Exclude from CFI → supplemental non-cash disclosure</div>`,
              trap: 'PP&E purchase = Investing Activities (NOT Operating). Note Payable financing → exclude from CFI, disclose separately.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Asset description / Cost / Useful life / Depreciation method / Salvage value',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Asset description and cost: $60,000<br>② Useful life / Depreciation method<br>③ Salvage value<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Notes exhibit에서 useful life, depreciation method 확인 → annual depreciation 역산</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No impact at acquisition',
          bs: 'Equipment (PP&E) +$60,000 / Cash −$60,000',
          se: 'No SE impact at acquisition',
          cfi: 'Cash paid for equipment → Investing Activities outflow ($60,000)',
        },
      },
      {
        id: 'ppe_sell_gain',
        label: 'PP&E Disposal — Gain',
        topicId: 'PPE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company sells equipment for more than book value.\nCost $50,000 / Acc. Dep. $32,000 / Book Value $18,000 / Cash received $25,000 → Gain $7,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Remove asset and accumulated depreciation; record cash received; recognize gain.',
            entries: [
              { account: 'Cash',                     type: 'dr', amount: 25000 },
              { account: 'Accumulated Depreciation', type: 'dr', amount: 32000 },
              { account: 'Equipment',                type: 'cr', amount: 50000 },
              { account: 'Gain on Disposal',         type: 'cr', amount:  7000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                     type: 'dr', sign: '+$25,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Accumulated Depreciation', type: 'dr', sign: '+$32,000', signClass: 'sign-positive', reason: 'Contra asset 제거 → Debit → 양수' },
                { acct: 'Equipment',                type: 'cr', sign: '($50,000)', signClass: 'sign-negative', reason: '자산 제거 → Credit → 음수' },
                { acct: 'Gain on Disposal',         type: 'cr', sign: '($7,000)', signClass: 'sign-negative', reason: '이익 발생 → Credit → 음수' },
              ],
              note: 'Book Value = $50,000 − $32,000 = $18,000 / Gain = $25,000 − $18,000 = $7,000',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Remove Equipment & Acc. Dep.; add Cash; recognize Gain.',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                     dr: ['25,000 ★'], cr: [] },
                { name: 'Acc. Depreciation',        dr: ['32,000 ★'], cr: [] },
                { name: 'Equipment',                dr: [],           cr: ['50,000 ★'] },
                { name: 'Gain on Disposal',         dr: [],           cr: ['7,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After disposal:\n• Cash +$25,000 Dr / Acc. Dep. $32,000 Dr / Equipment $50,000 Cr / Gain $7,000 Cr\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                     dr: '$25,000', cr: '—',      highlight: true },
                { acct: 'Accumulated Depreciation', dr: '$32,000', cr: '—',      highlight: true },
                { acct: 'Equipment',                dr: '—',       cr: '$50,000', highlight: true },
                { acct: 'Gain on Disposal',         dr: '—',       cr: '$7,000',  highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Gain on Disposal +$7,000 → Other Income (below Operating Income)\nNet Income increases by $7,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Gain on Disposal</span><span style="color:#0f6e56;font-weight:600">+$7,000</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">Other Income (영업외수익) — Operating income 아님</div></div>`,
              trap: 'Gain on sale = Other income (영업외수익). Operating income 아님.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ $7,000 → Retained Earnings ↑ $7,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$7,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash +$25,000 / Equipment −$50,000 / Acc. Dep. −$32,000\nNet asset change = +$25,000 − $18,000 = +$7,000 (= Gain)\nSE: Retained Earnings +$7,000 ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',                     dr: '+$25,000', cr: '($25,000)', highlight: true },
                { acct: 'Equipment (net)',           dr: '−$18,000', cr: '($18,000)', highlight: true },
                { acct: 'Retained Earnings',        dr: '+$7,000',  cr: '($7,000)',  highlight: true },
              ],
              trap: 'Gain on sale = Other income (영업외수익). Operating income 아님.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Remove Gain from Net Income → deduct ($7,000) from CFO\n• Cash proceeds $25,000 → Investing Activities inflow\n⚠ Double counting 방지: Gain은 CFO에서 제거, 현금 전액은 CFI',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Gain on Disposal → 제거 (−$7,000)<br><strong>CFI:</strong> Proceeds from sale → inflow (+$25,000)<br>이 둘이 합산되면 이중 계산 → 반드시 분리</div>`,
              trap: 'Gain을 CFO에서 제거(−)하는 이유: 실제 현금은 CFI에 전액 포함. Net Income에 이미 반영된 Gain을 제거해야 이중 계산 방지.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Asset description / Gain amount / Proceeds',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Asset disposed: Equipment / Cost $50,000 / Acc. Dep. $32,000<br>② Gain on disposal: $7,000<br>③ Cash proceeds: $25,000</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Gain on Disposal +$7,000 → Net Income ↑',
          bs: 'Cash +$25,000 / Equipment −$50,000 / Acc. Dep. −$32,000',
          se: 'Retained Earnings ↑ $7,000 (via Net Income)',
          cfo: 'Indirect: Gain removed from CFO (−$7,000)',
          cfi: 'Cash proceeds from sale → Investing Activities inflow (+$25,000)',
        },
      },
      {
        id: 'ppe_sell_loss',
        label: 'PP&E Disposal — Loss',
        topicId: 'PPE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company sells equipment for less than book value.\nCost $50,000 / Acc. Dep. $20,000 / Book Value $30,000 / Cash received $22,000 → Loss $8,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Remove asset; record cash received; recognize loss.',
            entries: [
              { account: 'Cash',                     type: 'dr', amount: 22000 },
              { account: 'Accumulated Depreciation', type: 'dr', amount: 20000 },
              { account: 'Loss on Disposal',         type: 'dr', amount:  8000 },
              { account: 'Equipment',                type: 'cr', amount: 50000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                     type: 'dr', sign: '+$22,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Accumulated Depreciation', type: 'dr', sign: '+$20,000', signClass: 'sign-positive', reason: 'Contra asset 제거 → Debit → 양수' },
                { acct: 'Loss on Disposal',         type: 'dr', sign: '+$8,000',  signClass: 'sign-positive', reason: '손실 발생 → Debit → 양수' },
                { acct: 'Equipment',                type: 'cr', sign: '($50,000)', signClass: 'sign-negative', reason: '자산 제거 → Credit → 음수' },
              ],
              note: 'Book Value = $50,000 − $20,000 = $30,000 / Loss = $22,000 − $30,000 = ($8,000)',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Remove Equipment & Acc. Dep.; add Cash; recognize Loss.',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                     dr: ['22,000 ★'], cr: [] },
                { name: 'Acc. Depreciation',        dr: ['20,000 ★'], cr: [] },
                { name: 'Loss on Disposal',         dr: ['8,000 ★'],  cr: [] },
                { name: 'Equipment',                dr: [],           cr: ['50,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After disposal:\n• Cash $22,000 Dr / Acc. Dep. $20,000 Dr / Loss $8,000 Dr / Equipment $50,000 Cr\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                     dr: '$22,000', cr: '—',       highlight: true },
                { acct: 'Accumulated Depreciation', dr: '$20,000', cr: '—',       highlight: true },
                { acct: 'Loss on Disposal',         dr: '$8,000',  cr: '—',       highlight: true },
                { acct: 'Equipment',                dr: '—',       cr: '$50,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Loss on Disposal ($8,000) → Other Expense\nNet Income decreases by $8,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Loss on Disposal</span><span style="color:#c2410c;font-weight:600">($8,000)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Other Expense (영업외비용) — Operating expense 아님</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $8,000 → Retained Earnings ↓ $8,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$8,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash +$22,000 / Equipment −$50,000 / Acc. Dep. −$20,000\nNet asset change = +$22,000 − $30,000 = −$8,000 (= Loss)\nSE: Retained Earnings −$8,000 ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',              dr: '+$22,000', cr: '($22,000)', highlight: true },
                { acct: 'Equipment (net)',   dr: '−$30,000', cr: '($30,000)', highlight: true },
                { acct: 'Retained Earnings', dr: '−$8,000',  cr: '($8,000)',  highlight: true },
              ],
              trap: 'Loss on disposal = Other expense. Net asset decrease = Loss amount.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Add back Loss to Net Income → +$8,000 to CFO\n• Cash proceeds $22,000 → Investing Activities inflow',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Loss on Disposal → add back (+$8,000)<br><strong>CFI:</strong> Proceeds from sale → inflow (+$22,000)<br>Loss는 비현금 손실 → add back 후 현금은 CFI에</div>`,
              trap: 'Loss를 CFO에서 가산(+)하는 이유: 현금은 CFI에 전액. Net Income에서 차감된 Loss를 되돌려야 이중 계산 방지.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Asset description / Loss amount / Proceeds',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Asset disposed: Equipment / Cost $50,000 / Acc. Dep. $20,000<br>② Loss on disposal: $8,000<br>③ Cash proceeds: $22,000</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Loss on Disposal ($8,000) → Net Income ↓',
          bs: 'Cash +$22,000 / Equipment −$50,000 / Acc. Dep. −$20,000',
          se: 'Retained Earnings ↓ $8,000 (via Net Income)',
          cfo: 'Indirect: Loss added back to CFO (+$8,000)',
          cfi: 'Cash proceeds from sale → Investing Activities inflow (+$22,000)',
        },
      },
      {
        id: 'impairment',
        label: 'Impairment Loss',
        topicId: 'IMP_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Triggering event identified (e.g., significant market value decline).\nStep 1: Undiscounted CF $80,000 < BV $100,000 → impaired\nStep 2: FV $75,000 → Impairment Loss = $25,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Write down asset to Fair Value. US GAAP: no reversal permitted.',
            entries: [
              { account: 'Impairment Loss',       type: 'dr', amount: 25000 },
              { account: 'Accumulated Impairment', type: 'cr', amount: 25000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Impairment Loss',        type: 'dr', sign: '+$25,000', signClass: 'sign-positive', reason: '손실 → Debit → 양수' },
                { acct: 'Accumulated Impairment', type: 'cr', sign: '($25,000)', signClass: 'sign-negative', reason: 'Contra asset 증가 → Credit → 음수' },
              ],
              note: 'BV $100,000 − FV $75,000 = Impairment Loss $25,000',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Impairment Loss (Dr — operating expense)\n• Accumulated Impairment (Cr — contra asset, reduces PP&E net)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Impairment Loss',        dr: ['25,000 ★'], cr: [] },
                { name: 'Accumulated Impairment', dr: [],           cr: ['25,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After impairment:\n• Impairment Loss   Dr  $25,000\n• Acc. Impairment   Cr  $25,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Impairment Loss',        dr: '$25,000', cr: '—',       highlight: true },
                { acct: 'Accumulated Impairment', dr: '—',       cr: '$25,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Impairment Loss ($25,000) → Operating Expenses\nNet Income decreases by $25,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Impairment Loss</span><span style="color:#c2410c;font-weight:600">($25,000)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Operating Expense — Net Income ↓ $25,000</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $25,000 → Retained Earnings ↓ $25,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$25,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: PP&E net −$25,000\nSE: Retained Earnings −$25,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Accumulated Impairment', dr: '+$25,000', cr: '($25,000)', highlight: true },
                { acct: 'Retained Earnings',      dr: '−$25,000', cr: '($25,000)', highlight: true },
              ],
              trap: 'US GAAP: impairment reversal 절대 불가 (Held for use). IFRS는 허용. Step 1 = Undiscounted CF, Step 2 = FV.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Impairment Loss = non-cash → add back (+$25,000)',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> Impairment Loss → add back (+$25,000)<br>비현금 손실 → Depreciation과 동일 처리</div>`,
              trap: 'Impairment = 비현금 손실 → add back. Depreciation과 동일 처리.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Triggering event / Impairment method / Amount / Remaining BV',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Triggering event description<br>② Two-step test: Undiscounted CF vs BV / FV measurement<br>③ Impairment loss: $25,000 / Remaining BV: $75,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">US GAAP: 감액 후 회복 불가. IFRS와 구분 필수.</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Impairment Loss ($25,000) → Net Income ↓',
          bs: 'PP&E net −$25,000',
          se: 'Retained Earnings ↓ $25,000 (via Net Income)',
          cfo: 'Non-cash loss → add back (+) in indirect method',
        },
      },
      {
        id: 'cloud_impl',
        label: 'Cloud/SaaS Implementation Costs',
        topicId: 'INTANG_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company implements a SaaS platform. Implementation costs incurred.\nPreliminary: $5,000 / Application development: $30,000 / Post-implementation: $8,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'ASC 350-40: Only application development stage costs capitalized.\nPreliminary + Post-implementation → expense immediately.',
            entries: [
              { account: 'Capitalized Implementation Cost',    type: 'dr', amount: 30000 },
              { account: 'IT Expense',                         type: 'dr', amount: 13000 },
              { account: 'Cash',                               type: 'cr', amount: 43000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Capitalized Impl. Cost', type: 'dr', sign: '+$30,000', signClass: 'sign-positive', reason: '자산화 → Debit → 양수 (App dev stage)' },
                { acct: 'IT Expense',             type: 'dr', sign: '+$13,000', signClass: 'sign-positive', reason: '즉시 비용 → Debit → 양수 (Preliminary + Post)' },
                { acct: 'Cash',                   type: 'cr', sign: '($43,000)', signClass: 'sign-negative', reason: '현금 유출 → Credit → 음수' },
              ],
              note: 'Application development stage only → capitalize. Preliminary ($5K) + post-implementation ($8K) → expense.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Capitalized cost → asset (amortized over useful life)\n• IT Expense → immediate P&L\n• Cash → outflow',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Capitalized Impl. Cost', dr: ['30,000 ★'], cr: [] },
                { name: 'IT Expense',             dr: ['13,000 ★'], cr: [] },
                { name: 'Cash',                   dr: [],           cr: ['43,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Capitalized Impl. Cost   Dr  $30,000\n• IT Expense               Dr  $13,000\n• Cash                     Cr  $43,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Capitalized Impl. Cost', dr: '$30,000', cr: '—',       highlight: true },
                { acct: 'IT Expense',             dr: '$13,000', cr: '—',       highlight: true },
                { acct: 'Cash',                   dr: '—',       cr: '$43,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'IT Expense $13,000 → Operating Expenses immediately\nCapitalized $30,000 → amortized over useful life (future periods)',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">IT Expense (expensed)</span><span style="color:#c2410c;font-weight:600">($13,000)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Capitalized $30,000 → future amortization expense</div></div>`,
              trap: '3단계 구분 필수: Preliminary → expense / Application development → capitalize / Post-implementation → expense',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $13,000 (expense portion only)',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$13,000 (즉시 비용 처리 분만)<br>Capitalized 30,000은 미래 상각 시 영향</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Capitalized Implementation Cost +$30,000 / Cash −$43,000\nSE: Retained Earnings −$13,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Capitalized Impl. Cost', dr: '+$30,000', cr: '($30,000)', highlight: true },
                { acct: 'Cash',                   dr: '−$43,000', cr: '($43,000)', highlight: true },
                { acct: 'Retained Earnings',      dr: '−$13,000', cr: '($13,000)', highlight: true },
              ],
              trap: '3단계 구분 필수: Preliminary → expense / Application development → capitalize / Post-implementation → expense',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Operating Activities: IT Expense $13,000 already in Net Income\nInvesting Activities: Capitalized cost $30,000 → outflow',
            drill: {
              title: 'Statement of Cash Flows',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO:</strong> IT Expense in Net Income (already included)<br><strong>CFI:</strong> Capitalized impl. cost → outflow ($30,000)</div>`,
              trap: '자본화된 구현 비용은 CFI. 즉시 비용은 CFO (Net Income에 포함).',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Capitalization policy / Stage breakdown / Amortization period',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Capitalization policy: ASC 350-40<br>② Stage breakdown: Preliminary $5K / App dev $30K / Post $8K<br>③ Amortization period (useful life)<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Stage 분류 → capitalize vs expense 판단이 핵심</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'IT Expense $13,000 → Net Income ↓ / Capitalized $30,000 → future amortization',
          bs: 'Capitalized Impl. Cost +$30,000 / Cash −$43,000',
          se: 'Retained Earnings ↓ $13,000',
          cfo: 'Expense portion in Net Income',
          cfi: 'Capitalized costs → Investing Activities outflow ($30,000)',
        },
      },
      {
        id: 'purchase_commit',
        label: 'Purchase Commitment Loss',
        topicId: 'INV_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company has a non-cancelable purchase commitment for inventory at $50,000.\nMarket price has fallen to $42,000 → Loss on commitment $8,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Recognize loss when market price falls below commitment price (conservatism).',
            entries: [
              { account: 'Loss on Purchase Commitment', type: 'dr', amount: 8000 },
              { account: 'Estimated Liability',         type: 'cr', amount: 8000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Loss on Purchase Commitment', type: 'dr', sign: '+$8,000', signClass: 'sign-positive', reason: '손실 인식 → Debit → 양수' },
                { acct: 'Estimated Liability',         type: 'cr', sign: '($8,000)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
              ],
              note: 'Loss = Commitment price $50,000 − Market price $42,000 = $8,000',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Loss on Purchase Commitment (Dr — operating expense)\n• Estimated Liability (Cr — current liability)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Loss on Purchase Commitment', dr: ['8,000 ★'], cr: [] },
                { name: 'Estimated Liability',         dr: [],           cr: ['8,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE:\n• Loss on Purchase Commitment   Dr  $8,000\n• Estimated Liability            Cr  $8,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Loss on Purchase Commitment', dr: '$8,000', cr: '—',      highlight: true },
                { acct: 'Estimated Liability',         dr: '—',      cr: '$8,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Loss on Purchase Commitment ($8,000) → Operating Expenses\nNet Income decreases by $8,000',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Loss on Purchase Commitment</span><span style="color:#c2410c;font-weight:600">($8,000)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Conservatism: 시장가 하락 시 즉시 손실 인식</div></div>`,
              trap: 'Loss 인식은 시장가격이 commitment 가격 아래로 떨어질 때. 반대(시장가 상승) → gain 인식 불가.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $8,000 → Retained Earnings ↓ $8,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$8,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Estimated Liability +$8,000\nSE: Retained Earnings −$8,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Estimated Liability', dr: '+$8,000', cr: '($8,000)', highlight: true },
                { acct: 'Retained Earnings',   dr: '−$8,000', cr: '($8,000)', highlight: true },
              ],
              trap: 'Loss 인식은 시장가격이 commitment 가격 아래로 떨어질 때. 반대(시장가 상승) → gain 인식 불가.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Estimated Liability increase → add back (+$8,000)\n• Non-cash accrual → no cash impact yet',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> Estimated Liability 증가 → add back (+$8,000)<br>비현금 발생 → 현금 지출은 실제 구매 시점</div>`,
              trap: 'Estimated Liability 증가 = 비현금 부채 → add back(+). 실제 구매 시 현금 지출.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Commitment terms / Market price decline / Estimated loss',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Commitment: non-cancelable $50,000 purchase<br>② Market price decline: $42,000<br>③ Estimated loss recognized: $8,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Commitment 공시 → 시장가 하락 시 손실 인식 여부 확인</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Loss on Purchase Commitment ($8,000) → Net Income ↓',
          bs: 'Estimated Liability +$8,000',
          se: 'Retained Earnings ↓ $8,000',
          cfo: 'Non-cash accrual → add back (+) in indirect method',
        },
      },
    ],
  },
  {
    id: 'debt',
    label: '③ Financial Liabilities · Interest',
    color: '#534AB7',
    items: [
      {
        id: 'bond_issue_discount',
        label: 'Bond Issuance — Discount',
        topicId: 'BOND_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company issues $100,000 face value bonds at discount.\nMarket rate > Stated rate → issued below face → proceeds $95,000\nDiscount = $5,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Record proceeds received; Discount = contra liability (reduces carrying value).',
            entries: [
              { account: 'Cash',                    type: 'dr', amount:  95000 },
              { account: 'Discount on Bonds Payable', type: 'dr', amount:   5000 },
              { account: 'Bonds Payable',           type: 'cr', amount: 100000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                      type: 'dr', sign: '+$95,000',  signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Discount on Bonds Payable', type: 'dr', sign: '+$5,000',   signClass: 'sign-positive', reason: 'Contra liability → Debit → 양수' },
                { acct: 'Bonds Payable',             type: 'cr', sign: '($100,000)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
              ],
              note: 'Carrying value = $100,000 − $5,000 = $95,000. Market rate > Stated rate → Discount.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Discount on BP (Dr balance — contra liability)\n• Bonds Payable (Cr balance — face value)\n• Net carrying value = $95,000',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                      dr: ['95,000 ★'], cr: [] },
                { name: 'Discount on Bonds Payable', dr: ['5,000 ★'],  cr: [] },
                { name: 'Bonds Payable',             dr: [],           cr: ['100,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Cash   Dr  $95,000\n• Discount on BP   Dr  $5,000\n• Bonds Payable   Cr  $100,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                      dr: '$95,000', cr: '—',        highlight: true },
                { acct: 'Discount on Bonds Payable', dr: '$5,000',  cr: '—',        highlight: true },
                { acct: 'Bonds Payable',             dr: '—',       cr: '$100,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No I/S impact at issuance.\nInterest expense recognized each period using effective interest method.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact at issuance.<br>Interest expense recognized each period (effective interest method).</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'No SE impact at issuance.',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">No SE impact at issuance.<br>Retained Earnings affected each period via Interest Expense.</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Bonds Payable $100,000 / Less: Discount ($5,000) = Carrying Value $95,000\nAssets: Cash +$95,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',                      dr: '+$95,000', cr: '($95,000)',  highlight: true },
                { acct: 'Bonds Payable (net)',        dr: '+$95,000', cr: '($95,000)', highlight: true },
              ],
              trap: 'Discount = contra liability (Dr balance). Carrying value = Face − Discount. Increases to face over time.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities inflow: Cash proceeds $95,000\n⚠ Face value $100,000 repaid at maturity → Financing outflow',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFF inflow:</strong> Cash proceeds from bond issuance +$95,000<br><strong>Maturity:</strong> Repay face $100,000 → CFF outflow ($100,000)</div>`,
              trap: 'Bond proceeds → CFF (not CFO). Discount 상각은 비현금 → Interest expense add back 시 포함.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Face value / Stated rate / Effective rate / Maturity / Carrying value',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Face value: $100,000 / Stated rate / Effective rate<br>② Maturity date<br>③ Carrying value: $95,000 (Face − Unamortized Discount)</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No impact at issuance',
          bs: 'Bonds Payable $100,000 / Discount ($5,000) / Carrying value $95,000 / Cash +$95,000',
          se: 'No SE impact at issuance',
          cff: 'Cash proceeds → Financing Activities inflow (+$95,000)',
        },
      },
      {
        id: 'bond_issue_premium',
        label: 'Bond Issuance — Premium',
        topicId: 'BOND_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company issues $100,000 face value bonds at premium.\nMarket rate < Stated rate → issued above face → proceeds $105,000\nPremium = $5,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Record proceeds; Premium = adjunct liability (increases carrying value).',
            entries: [
              { account: 'Cash',                       type: 'dr', amount: 105000 },
              { account: 'Bonds Payable',              type: 'cr', amount: 100000 },
              { account: 'Premium on Bonds Payable',   type: 'cr', amount:   5000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                     type: 'dr', sign: '+$105,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Bonds Payable',            type: 'cr', sign: '($100,000)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
                { acct: 'Premium on Bonds Payable', type: 'cr', sign: '($5,000)',  signClass: 'sign-negative', reason: 'Adjunct liability → Credit → 음수' },
              ],
              note: 'Carrying value = $100,000 + $5,000 = $105,000. Market rate < Stated rate → Premium.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Premium on BP (Cr balance — adjunct liability)\n• Bonds Payable (Cr balance — face value)\n• Net carrying value = $105,000',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                     dr: ['105,000 ★'], cr: [] },
                { name: 'Bonds Payable',            dr: [],            cr: ['100,000 ★'] },
                { name: 'Premium on Bonds Payable', dr: [],            cr: ['5,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Cash   Dr  $105,000\n• Bonds Payable   Cr  $100,000\n• Premium on BP   Cr  $5,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                     dr: '$105,000', cr: '—',        highlight: true },
                { acct: 'Bonds Payable',            dr: '—',        cr: '$100,000', highlight: true },
                { acct: 'Premium on Bonds Payable', dr: '—',        cr: '$5,000',   highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No I/S impact at issuance.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact at issuance.<br>Interest expense recognized each period (effective interest method).</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'No SE impact at issuance.',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">No SE impact at issuance.<br>Retained Earnings affected each period via Interest Expense.</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Bonds Payable $100,000 + Premium $5,000 = Carrying Value $105,000\nAssets: Cash +$105,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',               dr: '+$105,000', cr: '($105,000)', highlight: true },
                { acct: 'Bonds Payable (net)', dr: '+$105,000', cr: '($105,000)', highlight: true },
              ],
              trap: 'Premium = adjunct liability (Cr balance). Carrying value = Face + Premium. Decreases to face over time.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities inflow: Cash proceeds $105,000',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFF inflow:</strong> Cash proceeds from bond issuance +$105,000<br><strong>Maturity:</strong> Repay face $100,000 → CFF outflow ($100,000)<br>Premium 상각 → Interest expense 감소 (비현금)</div>`,
              trap: 'Premium 상각 → Interest Expense 감소 → Cash paid > Interest Expense. 비현금 차감(-) 조정.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Face value / Stated rate / Effective rate / Maturity / Carrying value',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Face value: $100,000 / Stated rate / Effective rate<br>② Maturity date<br>③ Carrying value: $105,000 (Face + Unamortized Premium)</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No impact at issuance',
          bs: 'Bonds Payable $100,000 / Premium $5,000 / Carrying value $105,000 / Cash +$105,000',
          se: 'No SE impact at issuance',
          cff: 'Cash proceeds → Financing Activities inflow (+$105,000)',
        },
      },
      {
        id: 'bond_interest',
        label: 'Bond Interest Expense (Effective Method)',
        topicId: 'BOND_002',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Annual interest payment on discount bond.\nCarrying value $95,000 / Effective rate 8% / Stated rate 7% / Face $100,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Effective interest method: Interest expense = Carrying value × Effective rate\nCash paid = Face × Stated rate / Difference = Discount amortization',
            entries: [
              { account: 'Interest Expense',        type: 'dr', amount: 7600 },
              { account: 'Cash',                    type: 'cr', amount: 7000 },
              { account: 'Discount on Bonds Payable', type: 'cr', amount:  600 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Interest Expense',          type: 'dr', sign: '+$7,600', signClass: 'sign-positive', reason: '이자비용 → Debit → 양수 ($95,000 × 8%)' },
                { acct: 'Cash',                      type: 'cr', sign: '($7,000)', signClass: 'sign-negative', reason: '현금 지급 → Credit → 음수 ($100,000 × 7%)' },
                { acct: 'Discount on Bonds Payable', type: 'cr', sign: '($600)',   signClass: 'sign-negative', reason: 'Discount 상각 → Credit → 음수' },
              ],
              note: 'Interest Expense $7,600 > Cash $7,000 → Discount 상각 $600 → Carrying value 증가',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Interest Expense Dr balance increases\n• Cash Cr — cash paid\n• Discount on BP Cr — contra liability shrinks → carrying value rises',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Interest Expense',          dr: ['7,600 ★'], cr: [] },
                { name: 'Cash',                      dr: [],           cr: ['7,000 ★'] },
                { name: 'Discount on Bonds Payable', dr: [],           cr: ['600 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Interest Expense   Dr  $7,600\n• Cash               Cr  $7,000\n• Discount on BP     Cr  $600\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Interest Expense',          dr: '$7,600', cr: '—',      highlight: true },
                { acct: 'Cash',                      dr: '—',      cr: '$7,000', highlight: true },
                { acct: 'Discount on Bonds Payable', dr: '—',      cr: '$600',   highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Interest Expense $7,600 → Other Expense\nNet Income decreases by $7,600',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Interest Expense</span><span style="color:#c2410c;font-weight:600">($7,600)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Effective Interest = Carrying value × Market rate</div></div>`,
              trap: 'Discount bond: Interest Expense > Cash paid. Premium bond: Interest Expense < Cash paid. Carrying value converges to face at maturity.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $7,600 → Retained Earnings ↓ $7,600',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$7,600 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Cash −$7,000 / Discount −$600 → Carrying value +$600\nRetained Earnings −$7,600',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',                 dr: '−$7,000',  cr: '($7,000)',  highlight: true },
                { acct: 'Bonds Payable (net)',   dr: '+$600',    cr: '($600)',    highlight: true },
                { acct: 'Retained Earnings',    dr: '−$7,600',  cr: '($7,600)',  highlight: true },
              ],
              trap: 'Discount bond: Interest Expense > Cash paid. Premium bond: Interest Expense < Cash paid. Carrying value converges to face at maturity.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Discount amortization +$600 → add back (non-cash portion)\n• Cash interest paid $7,000 → Operating outflow\n⚠ Total Interest Expense $7,600 in Net Income; only $7,000 cash → add back $600',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Discount 상각 → add back (+$600)<br><strong>Cash interest paid:</strong> $7,000 → Operating outflow<br><strong>Net Interest Expense:</strong> $7,600 in NI; $600 non-cash add back</div>`,
              trap: 'Discount 상각 = 비현금 → add back (+). 현금 지급은 $7,000만. 합계 check: −7,600 NI + 600 add back = −7,000 CFO net.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Effective interest rate / Amortization schedule / Carrying value',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Effective interest rate: 8% / Stated rate: 7%<br>② Amortization schedule (annual Discount reduction)<br>③ Carrying value after amortization: $95,600<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Amortization schedule → carrying value, interest expense 계산 기준</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Interest Expense $7,600 → Net Income ↓',
          bs: 'Cash −$7,000 / Discount on BP −$600 → Carrying value ↑$600',
          se: 'Retained Earnings ↓ $7,600',
          cfo: 'Indirect: Discount amortization add back (+$600). Cash interest → Operating outflow ($7,000)',
        },
      },
      {
        id: 'bond_retire_early',
        label: 'Bond Early Retirement G/L',
        topicId: 'BOND_003',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company retires bonds before maturity.\nCarrying value $97,000 / Cash paid $94,000 → Gain $3,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Remove carrying value; record cash paid; recognize gain or loss immediately.',
            entries: [
              { account: 'Bonds Payable',       type: 'dr', amount: 100000 },
              { account: 'Discount on BP',       type: 'cr', amount:   3000 },
              { account: 'Cash',                 type: 'cr', amount:  94000 },
              { account: 'Gain on Retirement',   type: 'cr', amount:   3000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Bonds Payable',     type: 'dr', sign: '+$100,000', signClass: 'sign-positive', reason: '부채 제거 → Debit → 양수' },
                { acct: 'Discount on BP',    type: 'cr', sign: '($3,000)',  signClass: 'sign-negative', reason: 'Contra liability 제거 → Credit → 음수' },
                { acct: 'Cash',              type: 'cr', sign: '($94,000)', signClass: 'sign-negative', reason: '현금 지급 → Credit → 음수' },
                { acct: 'Gain on Retirement', type: 'cr', sign: '($3,000)', signClass: 'sign-negative', reason: '이익 → Credit → 음수' },
              ],
              note: 'Carrying value $97,000 − Cash $94,000 = Gain $3,000 → Continuing operations (Other income)',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Remove Bonds Payable & Discount; record Cash paid; recognize Gain.',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Bonds Payable',     dr: ['100,000 ★'], cr: [] },
                { name: 'Discount on BP',    dr: [],            cr: ['3,000 ★'] },
                { name: 'Cash',              dr: [],            cr: ['94,000 ★'] },
                { name: 'Gain on Retirement', dr: [],           cr: ['3,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Bonds Payable Dr $100,000 / Discount Cr $3,000 / Cash Cr $94,000 / Gain Cr $3,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Bonds Payable',     dr: '$100,000', cr: '—',      highlight: true },
                { acct: 'Discount on BP',    dr: '—',        cr: '$3,000',  highlight: true },
                { acct: 'Cash',              dr: '—',        cr: '$94,000', highlight: true },
                { acct: 'Gain on Retirement', dr: '—',       cr: '$3,000',  highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Gain on Retirement +$3,000 → Other Income (Continuing Operations)\nNot extraordinary. Not net of tax.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Gain on Debt Retirement</span><span style="color:#0f6e56;font-weight:600">+$3,000</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Continuing Operations — Other Income</div></div>`,
              trap: 'Gain/Loss on debt extinguishment → Continuing operations. SFAS 145 이후 Extraordinary item 폐지. Net of tax 표시 불가.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ $3,000 → Retained Earnings ↑ $3,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$3,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Bonds Payable −$100,000 / Discount −$3,000 → Carrying value −$97,000\nAssets: Cash −$94,000\nSE: Retained Earnings +$3,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',               dr: '−$94,000', cr: '($94,000)', highlight: true },
                { acct: 'Bonds Payable (net)', dr: '−$97,000', cr: '($97,000)', highlight: true },
                { acct: 'Retained Earnings',  dr: '+$3,000',  cr: '($3,000)',  highlight: true },
              ],
              trap: 'Cash paid ($94K) ≠ Carrying value ($97K). Difference = Gain ($3K). Always remove carrying value, not face.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Remove Gain from CFO (−$3,000)\n• Cash paid $94,000 → Financing Activities outflow',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Gain on Retirement → 제거 (−$3,000)<br><strong>CFF:</strong> Cash paid to retire bonds → outflow ($94,000)</div>`,
              trap: 'Gain → CFO에서 제거(-). 실제 현금 $94,000은 CFF. Gain을 포함하면 이중 계산.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Retirement terms / Gain or Loss amount',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Bonds retired early: Face $100,000 / Carrying value $97,000<br>② Cash paid: $94,000<br>③ Gain on retirement: $3,000 (Continuing Operations)</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Gain on Retirement +$3,000 → Net Income ↑ (Continuing Operations)',
          bs: 'Bonds Payable −$100,000 / Discount −$3,000 / Cash −$94,000',
          se: 'Retained Earnings ↑ $3,000',
          cfo: 'Indirect: Gain removed from CFO (−$3,000)',
          cff: 'Cash paid to retire bonds → Financing Activities outflow ($94,000)',
        },
      },
      {
        id: 'lease_finance',
        label: 'Finance Lease Interest Expense',
        topicId: 'LEASE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Finance lease — lessee records interest on lease liability.\nLease liability $115,000 / Implicit rate 10% / Annual payment $20,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Effective interest method: Interest = Lease liability × Rate\nPayment reduces both interest and principal.',
            entries: [
              { account: 'Interest Expense', type: 'dr', amount: 11500 },
              { account: 'Lease Liability',  type: 'dr', amount:  8500 },
              { account: 'Cash',             type: 'cr', amount: 20000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Interest Expense', type: 'dr', sign: '+$11,500', signClass: 'sign-positive', reason: '이자비용 → Debit → 양수 ($115,000 × 10%)' },
                { acct: 'Lease Liability',  type: 'dr', sign: '+$8,500',  signClass: 'sign-positive', reason: '부채 감소 (원금 상환) → Debit → 양수' },
                { acct: 'Cash',             type: 'cr', sign: '($20,000)', signClass: 'sign-negative', reason: '현금 지급 → Credit → 음수' },
              ],
              note: 'Interest $11,500 + Principal $8,500 = Payment $20,000',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Interest Expense Dr → P&L\n• Lease Liability Dr → liability decreases\n• Cash Cr → outflow',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Interest Expense', dr: ['11,500 ★'], cr: [] },
                { name: 'Lease Liability',  dr: ['8,500 ★'],  cr: [] },
                { name: 'Cash',             dr: [],            cr: ['20,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Interest Expense   Dr  $11,500\n• Lease Liability     Dr  $8,500\n• Cash               Cr  $20,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Interest Expense', dr: '$11,500', cr: '—',       highlight: true },
                { acct: 'Lease Liability',  dr: '$8,500',  cr: '—',       highlight: true },
                { acct: 'Cash',             dr: '—',       cr: '$20,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Interest Expense $11,500 → Other Expense\nDepreciation on ROU Asset → separate Operating Expense',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Interest Expense (lease)</span><span style="color:#c2410c;font-weight:600">($11,500)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">ROU Asset Depreciation → separate Operating Expense</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ via Interest Expense + Depreciation on ROU',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: ↓ via Interest Expense + ROU Depreciation<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Lease Liability −$8,500 (principal)\nAssets: Cash −$20,000 / ROU Asset decreases via depreciation',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',           dr: '−$20,000', cr: '($20,000)', highlight: true },
                { acct: 'Lease Liability', dr: '−$8,500', cr: '($8,500)',  highlight: true },
                { acct: 'Retained Earnings', dr: '−$11,500', cr: '($11,500)', highlight: true },
              ],
              trap: 'Current portion of Lease Liability = next year principal payment only (not total payment). Interest is separate.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Operating Activities: Interest Expense in Net Income\nFinancing Activities: Principal repayment $8,500 outflow\n⚠ Interest paid classification: Operating (US GAAP default) or Financing (policy choice)',
            drill: {
              title: 'Statement of Cash Flows',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO:</strong> Interest expense in Net Income (Operating, US GAAP default)<br><strong>CFF:</strong> Principal repayment → outflow ($8,500)<br>Interest paid: CFO or CFF → disclose policy choice</div>`,
              trap: 'Finance lease: Principal → CFF / Interest → CFO (US GAAP default). Operating lease: Total payment → CFO.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Lease terms / Rate / Remaining liability / Maturity schedule',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Implicit rate: 10% / Annual payment: $20,000<br>② Remaining lease liability maturity schedule<br>③ ROU asset / Accumulated depreciation<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Finance vs Operating lease 분류 기준 확인 필수</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Interest Expense $11,500 → Net Income ↓',
          bs: 'Lease Liability −$8,500 / Cash −$20,000',
          se: 'Retained Earnings ↓ via Interest Expense',
          cfo: 'Interest expense in Net Income (Operating)',
          cff: 'Principal repayment → Financing Activities outflow ($8,500)',
        },
      },
      {
        id: 'aro_accretion',
        label: 'Asset Retirement Obligation Accretion',
        topicId: 'ARO_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'ARO liability increases over time as present value unwinds.\nARO balance $45,000 / Discount rate 6% → Accretion $2,700',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Accretion expense = ARO balance × discount rate (time value of money unwinding).',
            entries: [
              { account: 'Accretion Expense', type: 'dr', amount: 2700 },
              { account: 'ARO Liability',     type: 'cr', amount: 2700 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Accretion Expense', type: 'dr', sign: '+$2,700', signClass: 'sign-positive', reason: '비용 → Debit → 양수 ($45,000 × 6%)' },
                { acct: 'ARO Liability',     type: 'cr', sign: '($2,700)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
              ],
              note: 'Accretion = time value unwinding. ARO grows toward undiscounted settlement amount.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Accretion Expense (Dr — operating expense)\n• ARO Liability (Cr — non-current liability grows)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Accretion Expense', dr: ['2,700 ★'], cr: [] },
                { name: 'ARO Liability',     dr: [],           cr: ['2,700 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Accretion Expense   Dr  $2,700\n• ARO Liability       Cr  $2,700\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Accretion Expense', dr: '$2,700', cr: '—',      highlight: true },
                { acct: 'ARO Liability',     dr: '—',      cr: '$2,700', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Accretion Expense $2,700 → Operating Expense\nNet Income decreases by $2,700',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Accretion Expense</span><span style="color:#c2410c;font-weight:600">($2,700)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">ARO: PV unwinding → Accretion / PP&E cost allocated → Depreciation (separate)</div></div>`,
              trap: 'Accretion ≠ Depreciation. Accretion = ARO liability growing. Depreciation = ARO asset (included in PP&E cost) being expensed. Both recognized separately.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $2,700 → Retained Earnings ↓ $2,700',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$2,700 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: ARO Liability +$2,700\nSE: Retained Earnings −$2,700',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'ARO Liability',     dr: '+$2,700', cr: '($2,700)', highlight: true },
                { acct: 'Retained Earnings', dr: '−$2,700', cr: '($2,700)', highlight: true },
              ],
              trap: 'Accretion ≠ Depreciation. Accretion = ARO liability growing. Depreciation = ARO asset (included in PP&E cost) being expensed. Both recognized separately.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method:\n• Accretion Expense = non-cash → add back (+$2,700)',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> Accretion Expense → add back (+$2,700)<br>비현금 비용 → Depreciation과 동일 처리<br>실제 현금은 자산 폐기 시점에 지출</div>`,
              trap: 'Accretion은 현금 지출 없는 비용 → add back. 실제 현금은 자산 폐기 시점에 나감.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: ARO description / Discount rate / Settlement estimate / Carrying amount',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① ARO description (legal obligation to retire asset)<br>② Discount rate: 6% / Settlement estimate<br>③ ARO carrying amount: $47,700 (after accretion)<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: ARO 초기 인식 → PV of settlement cost. 매년 accretion으로 증가.</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Accretion Expense $2,700 → Net Income ↓',
          bs: 'ARO Liability +$2,700',
          se: 'Retained Earnings ↓ $2,700',
          cfo: 'Non-cash expense → add back (+) in indirect method',
        },
      },
    ],
  },
  {
    id: 'financial_asset',
    label: '④ Financial Asset Valuation',
    color: '#BA7517',
    items: [
      {
        id: 'afs_unrealized',
        label: 'AFS Unrealized Gain/Loss',
        topicId: 'INVEST_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Year-end fair value measurement — AFS (Available-For-Sale) securities price change observed on market.',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'FV increase: Dr Fair Value Adjustment / Cr OCI — Unrealized Gain\nFV decrease: Dr OCI — Unrealized Loss / Cr Fair Value Adjustment\n⚠ Goes to OCI — NOT Net Income. (Trading securities → Net Income.)',
            entries: [
              { account: 'Fair Value Adjustment — AFS', type: 'dr', amount: 5000 },
              { account: 'OCI — Unrealized Gain on AFS', type: 'cr', amount: 5000 },
            ],
            drill: {
              title: 'Journal Entry — AFS Fair Value Adjustment',
              je: [
                { acct: 'Fair Value Adjustment — AFS', type: 'dr', sign: '+$5,000', signClass: 'sign-positive', reason: '자산 증가 → Debit → 양수' },
                { acct: 'OCI — Unrealized Gain on AFS', type: 'cr', sign: '($5,000)', signClass: 'sign-negative', reason: 'OCI 계정 → Credit → 음수 (NI 아님!)' },
              ],
              trap: 'Trading이면 같은 미실현이익도 NI 직행. AFS만 OCI.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• AFS Securities: cost $100,000 + FV adjustment $5,000 = carrying $105,000\n• OCI — Unrealized Gain: Cr balance $5,000 (not an income account)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'AFS Securities (FV Adj)', dr: ['100,000 (cost)', '5,000 ★'], cr: [] },
                { name: 'OCI — Unrealized Gain', dr: [], cr: ['5,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'AFS Securities   Dr  $105,000\nOCI — Unrealized Gain   Cr  $5,000\n⚠ OCI does NOT flow through I/S closing entries → goes directly to AOCI on B/S',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'AFS Securities',         dr: '$105,000', cr: '—',      highlight: true },
                { acct: 'OCI — Unrealized Gain',  dr: '—',        cr: '$5,000', highlight: true },
              ],
              note: 'OCI does NOT flow through I/S closing entries → goes directly to AOCI on B/S',
            },
          },
          {
            step: 'is',
            label: 'Income Statement + Comprehensive Income',
            note: 'Net Income: NO IMPACT (unrealized, AFS)\nOther Comprehensive Income: +$5,000 Unrealized Gain on AFS\nTotal Comprehensive Income = Net Income + OCI $5,000',
            drill: {
              title: 'Income Statement + Comprehensive Income',
              custom: `<div style="font-size:11px;line-height:1.7"><div style="padding:4px 8px;background:#f3f4f6;border-radius:4px;margin-bottom:6px"><span style="color:#9aa3b0">Net Income</span> → <strong>No impact</strong> (unrealized AFS — stays in OCI)</div><div style="padding:4px 8px;background:#eeedfe;border-radius:4px;color:#3c3489"><strong>Other Comprehensive Income</strong><br>+ Unrealized Gain on AFS $5,000</div><div style="margin-top:6px;color:#4a5568">Total Comprehensive Income = Net Income + OCI $5,000</div></div>`,
              trap: '가장 많이 틀림: Trading이면 NI 직행, AFS만 OCI. 이 구분이 핵심.',
            },
          },
          {
            step: 'oci',
            label: 'Other Comprehensive Income',
            note: 'Unrealized Gain/Loss on AFS → OCI section of Comprehensive Income Statement\nTwo presentation methods:\n① One-statement: I/S extended with OCI section\n② Two-statement: separate Comprehensive Income Statement',
            drill: {
              title: 'OCI — two presentation methods',
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.8">① <strong>One-statement:</strong> I/S에 OCI 섹션 추가 (하단 연장)<br>② <strong>Two-statement:</strong> 별도 Comprehensive Income Statement 작성<div style="margin-top:8px;padding:5px 8px;background:#eeedfe;border-radius:4px;color:#3c3489;font-size:10px">AFS Unrealized Gain $5,000 → OCI → AOCI (B/S Stockholders' Equity 섹션)</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'AOCI column: +$5,000\nRetained Earnings column: NO CHANGE\n⚠ Common mistake: putting OCI into Retained Earnings instead of AOCI column',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">AOCI 열: <strong>+$5,000</strong><br>Retained Earnings 열: 변동 없음<br>Common Stock / APIC 열: 변동 없음</div>`,
              trap: 'AOCI와 Retained Earnings를 혼동하면 S/E Worksheet 전체가 틀림.',
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: AFS Securities at Fair Value $105,000 (+$5,000)\nStockholders\' Equity: AOCI +$5,000\nBalance check: Assets +5K = SE (AOCI) +5K ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'AFS Securities', dr: '+$5,000', cr: '+5,000',   highlight: true },
                { acct: 'AOCI (SE)',      dr: '+$5,000', cr: '($5,000)', highlight: true },
              ],
              note: 'Check: AFS +$5K = AOCI +$5K → Balance Sheet 균형 ✓',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'No cash movement → NO impact on SCF\nIndirect method: OCI not in Net Income → no add-back needed\n⚠ When AFS is SOLD (realized): Proceeds → Investing Activities inflow',
            drill: {
              title: 'Statement of Cash Flows — no impact',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>당기:</strong> 현금 이동 없음 → Operating / Investing / Financing 전부 영향 없음<br><strong>Indirect Method:</strong> OCI는 Net Income에 포함 안 됨 → add-back 조정도 없음</div>`,
              note: 'AFS 매각 시(realized): Proceeds → Investing Activities inflow',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Cost $100,000 / Fair Value $105,000 / Unrealized Gain $5,000 / AOCI balance\nClassification basis (intent to hold)',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Cost $100,000 / Fair Value $105,000 / Unrealized Gain $5,000<br>② AOCI 누적 잔액<br>③ 분류 기준 (AFS 보유 의도 확인)<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: AFS 보유 목적·분류 근거 공시 → INVEST_001 핵심 체크포인트</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No impact — unrealized AFS gain stays in OCI, not Net Income',
          is_oci: 'Unrealized Gain/Loss on AFS → OCI (Other Comprehensive Income)',
          bs: 'AFS Securities at Fair Value ↑/↓ | AOCI (Stockholders\' Equity) ↑/↓',
          se: 'AOCI column changes — Retained Earnings column: no change',
          cfo: 'No cash → no Operating Activities adjustment needed',
          cfi: 'When AFS sold (realized) → Investing Activities inflow (full proceeds)',
        },
      },
      {
        id: 'afs_sold',
        label: 'AFS Sale — Realized + Reclassify',
        topicId: 'INVEST_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'AFS securities sold. Cost $100,000 / AOCI (unrealized gain) $5,000 / FV $105,000 / Proceeds $108,000\nRealized Gain = Proceeds $108,000 − Cost $100,000 = $8,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Remove AFS at cost; remove AOCI; record proceeds; recognize realized gain in Net Income.',
            entries: [
              { account: 'Cash',                          type: 'dr', amount: 108000 },
              { account: 'OCI — Unrealized Gain (AOCI)',  type: 'dr', amount:   5000 },
              { account: 'AFS Securities',                type: 'cr', amount: 100000 },
              { account: 'Fair Value Adjustment',         type: 'cr', amount:   5000 },
              { account: 'Realized Gain on AFS',          type: 'cr', amount:   8000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                         type: 'dr', sign: '+$108,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'OCI reclassification (AOCI)',  type: 'dr', sign: '+$5,000',   signClass: 'sign-positive', reason: 'AOCI 제거 → Debit (reclassification adjustment)' },
                { acct: 'AFS Securities',               type: 'cr', sign: '($100,000)', signClass: 'sign-negative', reason: '원가 제거 → Credit → 음수' },
                { acct: 'Fair Value Adjustment',        type: 'cr', sign: '($5,000)',   signClass: 'sign-negative', reason: 'FV 조정 제거 → Credit → 음수' },
                { acct: 'Realized Gain on AFS',         type: 'cr', sign: '($8,000)',   signClass: 'sign-negative', reason: '실현이익 → Credit → NI 직행' },
              ],
              note: 'Realized Gain = Proceeds $108,000 − Cost $100,000 = $8,000. AOCI $5,000 reclassified to NI.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Remove AFS carrying value; reclassify AOCI; recognize Realized Gain in NI.',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                    dr: ['108,000 ★'], cr: [] },
                { name: 'OCI — Unrealized Gain',   dr: ['5,000 ★'],   cr: [] },
                { name: 'AFS Securities',          dr: [],            cr: ['100,000 ★'] },
                { name: 'Fair Value Adjustment',   dr: [],            cr: ['5,000 ★'] },
                { name: 'Realized Gain on AFS',    dr: [],            cr: ['8,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'Cash Dr $108,000 / OCI Dr $5,000 / AFS Cr $100,000 / FV Adj Cr $5,000 / Gain Cr $8,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                 dr: '$108,000', cr: '—',        highlight: true },
                { acct: 'AFS Securities',       dr: '—',        cr: '$100,000', highlight: true },
                { acct: 'Realized Gain on AFS', dr: '—',        cr: '$8,000',   highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Realized Gain on AFS +$8,000 → Other Income → Net Income ↑\n⚠ Previously in AOCI $5,000 now reclassified to NI',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Realized Gain on AFS</span><span style="color:#0f6e56;font-weight:600">+$8,000</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">AOCI $5,000 reclassified → NI 포함. 이중 계상 아님.</div></div>`,
              trap: 'AFS 매각 시 AOCI의 미실현이익 → NI로 reclassify. 이중 계상 아님.',
            },
          },
          {
            step: 'oci',
            label: 'Other Comprehensive Income',
            note: 'Reclassification adjustment: ($5,000) removed from AOCI\nOCI this period = ($5,000) reclassification out',
            drill: {
              title: 'OCI — Reclassification Adjustment',
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.8">OCI this period: <strong>−$5,000</strong> (reclassification out to NI)<br>AOCI balance decreases $5,000<div style="margin-top:8px;padding:5px 8px;background:#eeedfe;border-radius:4px;color:#3c3489;font-size:10px">매각 시: Previously recognized in AOCI → now flows through NI as Realized Gain</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'AOCI −$5,000 (reclassified to NI)\nRetained Earnings +$8,000 (via Net Income)\nNet SE change +$3,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">AOCI 열: −$5,000 (reclassification out)<br>Retained Earnings 열: +$8,000 (Net Income 경유)<br>Net SE change: +$3,000</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash +$108,000 / AFS Securities −$105,000 (cost + FV adj)\nSE: AOCI −$5,000 / RE +$8,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',              dr: '+$108,000',  cr: '($108,000)', highlight: true },
                { acct: 'AFS Securities',    dr: '−$105,000',  cr: '($105,000)', highlight: true },
                { acct: 'AOCI (SE)',         dr: '−$5,000',    cr: '($5,000)',   highlight: true },
                { acct: 'Retained Earnings', dr: '+$8,000',    cr: '($8,000)',   highlight: true },
              ],
              trap: 'Net asset change = +$3,000 = Net SE change ✓ (Cash +108K − AFS −105K = +3K)',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Investing Activities: Proceeds $108,000 → inflow\nIndirect CFO: Realized Gain ($8,000) → remove from Net Income',
            drill: {
              title: 'Statement of Cash Flows',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Realized Gain → 제거 (−$8,000)<br><strong>CFI:</strong> Proceeds from AFS sale → inflow (+$108,000)</div>`,
              trap: 'Realized Gain → CFO에서 제거(-). 현금 전액 $108,000은 CFI.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Cost / Proceeds / Realized gain / Reclassification from AOCI',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① AFS sold: Cost $100,000 / Proceeds $108,000<br>② Realized gain: $8,000<br>③ AOCI reclassification: $5,000 out<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: AOCI reclassification → Realized gain 계산 시 이중 계상 주의</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Realized Gain +$8,000 → Net Income ↑',
          is_oci: 'AOCI reclassification ($5,000) out',
          bs: 'AFS Securities −$105,000 / Cash +$108,000 / AOCI −$5,000',
          se: 'RE +$8,000 / AOCI −$5,000',
          cfo: 'Realized Gain removed from CFO (−$8,000)',
          cfi: 'Proceeds from AFS sale → Investing inflow (+$108,000)',
        },
      },
      {
        id: 'trading_fv',
        label: 'Trading Securities FV Change',
        topicId: 'INVEST_002',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Trading securities FV increases from $80,000 to $85,000.\nUnrealized Gain = $5,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Trading securities: FV changes go directly to Net Income (not OCI).',
            entries: [
              { account: 'Fair Value Adjustment — Trading', type: 'dr', amount: 5000 },
              { account: 'Unrealized Gain on Trading',      type: 'cr', amount: 5000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'FV Adjustment — Trading', type: 'dr', sign: '+$5,000', signClass: 'sign-positive', reason: '자산 증가 → Debit → 양수' },
                { acct: 'Unrealized Gain on Trading', type: 'cr', sign: '($5,000)', signClass: 'sign-negative', reason: 'NI 직행 → Credit → 음수' },
              ],
              note: 'Trading: unrealized gain/loss → Net Income immediately. AFS와 반대.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• FV Adjustment (Dr — increases asset carrying value)\n• Unrealized Gain on Trading (Cr — goes straight to NI)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'FV Adjustment — Trading',  dr: ['5,000 ★'], cr: [] },
                { name: 'Unrealized Gain on Trading', dr: [],         cr: ['5,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• FV Adjustment — Trading   Dr  $5,000\n• Unrealized Gain on Trading Cr  $5,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'FV Adjustment — Trading',   dr: '$5,000', cr: '—',      highlight: true },
                { acct: 'Unrealized Gain on Trading', dr: '—',      cr: '$5,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Unrealized Gain on Trading +$5,000 → Other Income → Net Income ↑\n⚠ Even though NOT sold yet — Trading goes to NI immediately',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Unrealized Gain on Trading</span><span style="color:#0f6e56;font-weight:600">+$5,000</span></div><div style="margin-top:6px;font-size:11px;color:#0f6e56">미매각이라도 NI 직행 — Trading의 핵심 특징</div></div>`,
              trap: 'Trading = NI 즉시. AFS = OCI. HTM = FV 측정 없음. 이 3가지 구분이 핵심.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ $5,000 → Retained Earnings ↑ $5,000\nNo AOCI impact (not OCI)',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$5,000 (Net Income 경유)<br>AOCI 열: 변동 없음 (Trading → NI, not OCI)</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Trading Securities +$5,000 (FV adjustment)\nSE: Retained Earnings +$5,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Trading Securities',  dr: '+$5,000', cr: '($5,000)', highlight: true },
                { acct: 'Retained Earnings',   dr: '+$5,000', cr: '($5,000)', highlight: true },
              ],
              trap: 'Trading: unrealized gain → NI → RE. AFS: unrealized gain → OCI → AOCI. B/S 표시 위치 다름.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method: Unrealized Gain → remove from CFO (−$5,000)\n⚠ Non-cash item: no actual cash received',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> Unrealized Gain (non-cash) → 제거 (−$5,000)<br>현금 없음 → CFI/CFF 영향 없음</div>`,
              trap: 'Unrealized gain = 비현금 → CFO에서 제거(-). AFS 미실현이익(OCI)은 NI에 없으므로 조정 없음.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: FV / Cost / Unrealized gain included in Net Income',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Trading securities: Cost $80,000 / FV $85,000<br>② Unrealized gain included in Net Income: $5,000<br>③ Classification basis (trading intent)<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Trading vs AFS 분류 → NI vs OCI 처리 결정</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Unrealized Gain +$5,000 → Net Income ↑ (even unsold)',
          bs: 'Trading Securities +$5,000',
          se: 'Retained Earnings +$5,000 (no AOCI)',
          cfo: 'Unrealized Gain removed from CFO indirect (−$5,000)',
        },
      },
      {
        id: 'crypto_fv_up',
        label: 'Crypto FV Change (ASU 2023-08)',
        topicId: 'FS_CRYPTO_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company holds Bitcoin. FV increases from $50,000 to $58,000.\nUnrealized Gain = $8,000 (ASU 2023-08 effective for fiscal years after Dec 15, 2024)',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'ASU 2023-08: Crypto assets measured at FV each period. Changes → Net Income directly.',
            entries: [
              { account: 'Crypto Asset (Bitcoin)',   type: 'dr', amount: 8000 },
              { account: 'Unrealized Gain — Crypto', type: 'cr', amount: 8000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Crypto Asset (Bitcoin)',   type: 'dr', sign: '+$8,000', signClass: 'sign-positive', reason: '자산 FV 증가 → Debit → 양수' },
                { acct: 'Unrealized Gain — Crypto', type: 'cr', sign: '($8,000)', signClass: 'sign-negative', reason: 'NI 직행 → Credit → 음수' },
              ],
              note: 'ASU 2023-08: Crypto = FV model, gains/losses → NI. No longer indefinite-lived intangible.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Crypto Asset (Dr — FV increases)\n• Unrealized Gain — Crypto (Cr — NI, not OCI)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Crypto Asset (Bitcoin)',   dr: ['8,000 ★'], cr: [] },
                { name: 'Unrealized Gain — Crypto', dr: [],          cr: ['8,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Crypto Asset   Dr  $8,000\n• Unrealized Gain — Crypto   Cr  $8,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Crypto Asset (Bitcoin)',   dr: '$8,000', cr: '—',      highlight: true },
                { acct: 'Unrealized Gain — Crypto', dr: '—',      cr: '$8,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Unrealized Gain — Crypto +$8,000 → Other Income → Net Income ↑',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Unrealized Gain — Crypto</span><span style="color:#0f6e56;font-weight:600">+$8,000</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">ASU 2023-08: FV model → NI 직행 (both gains and losses)</div></div>`,
              trap: 'ASU 2023-08 이전: Crypto = indefinite-lived intangible → impairment only, no write-up. 이후: FV model → 양방향.',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ $8,000 → Retained Earnings ↑ $8,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$8,000 (Net Income 경유)<br>AOCI 열: 변동 없음 (Crypto → NI, not OCI)</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Crypto Asset +$8,000\nSE: Retained Earnings +$8,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Crypto Asset (Bitcoin)', dr: '+$8,000', cr: '($8,000)', highlight: true },
                { acct: 'Retained Earnings',      dr: '+$8,000', cr: '($8,000)', highlight: true },
              ],
              trap: 'ASU 2023-08 이전: 하락만 인식 (impairment). 이후: 상승·하락 모두 NI 인식.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method: Unrealized Gain → remove from CFO (−$8,000)\nActual crypto purchase/sale → Investing Activities',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> Unrealized Gain (non-cash) → 제거 (−$8,000)<br><strong>Crypto 매수/매도:</strong> Investing Activities<br>현금 없는 FV 변동 → add back/remove 처리</div>`,
              trap: 'Crypto FV gain = 비현금 → CFO에서 제거(-). 실제 매수/매도 현금 → CFI.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Crypto type / Cost / FV / Unrealized gain / ASU 2023-08 adoption',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Bitcoin: Cost $50,000 / FV $58,000<br>② Unrealized gain: $8,000 (included in NI)<br>③ ASU 2023-08 adoption: FV model effective<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: ASU 2023-08 적용 전/후 비교 → impairment only vs FV양방향</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Unrealized Gain — Crypto +$8,000 → Net Income ↑',
          bs: 'Crypto Asset +$8,000',
          se: 'Retained Earnings +$8,000',
          cfo: 'Unrealized Gain removed from CFO (−$8,000)',
        },
      },
      {
        id: 'equity_method',
        label: 'Equity Method — Income Recognition',
        topicId: 'EQM_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Investor owns 30% of investee. Investee reports Net Income $40,000 / Dividends $10,000.\nInvestor recognizes: Income $12,000 / Dividend reduces investment $3,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Equity method: recognize proportionate share of investee NI; dividends reduce investment.',
            entries: [
              { account: 'Investment in Investee', type: 'dr', amount: 12000 },
              { account: 'Equity in Earnings',     type: 'cr', amount: 12000 },
            ],
            drill: {
              title: 'Journal Entry — NI recognition + Dividend',
              je: [
                { acct: 'Investment in Investee', type: 'dr', sign: '+$12,000', signClass: 'sign-positive', reason: '투자자산 증가 → Debit ($40,000 × 30%)' },
                { acct: 'Equity in Earnings',     type: 'cr', sign: '($12,000)', signClass: 'sign-negative', reason: '수익 → Credit → NI 직행' },
              ],
              note: 'Equity in Earnings = $40,000 × 30% = $12,000. Dividend entry separate: Dr Cash $3,000 / Cr Investment $3,000.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Investment: +$12,000 (NI share) −$3,000 (dividend) = net +$9,000\n• Cash +$3,000 (dividend received)\n• Equity in Earnings +$12,000 (NI)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Investment in Investee', dr: ['12,000 NI ★'], cr: ['3,000 div'] },
                { name: 'Equity in Earnings',     dr: [],             cr: ['12,000 ★'] },
                { name: 'Cash',                   dr: ['3,000 ★'],   cr: [] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Investment in Investee   Dr  $9,000 (net after dividend)\n• Equity in Earnings       Cr  $12,000\n• Cash                     Dr  $3,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Investment in Investee', dr: '$9,000',  cr: '—',       highlight: true },
                { acct: 'Equity in Earnings',     dr: '—',       cr: '$12,000', highlight: true },
                { acct: 'Cash (dividend)',         dr: '$3,000',  cr: '—',       highlight: true },
              ],
              note: 'Investment net: +$12,000 NI − $3,000 div = $9,000',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Equity in Earnings of Investee +$12,000 → Other Income → Net Income ↑',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Equity in Earnings of Investee</span><span style="color:#0f6e56;font-weight:600">+$12,000</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Dividend received → Investment 감소 (수익 아님)</div></div>`,
              trap: 'Equity method: NI 지분 → Investment 증가 + Income 인식. Dividend → Investment 감소 (수익 아님).',
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↑ $12,000 → Retained Earnings ↑ $12,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: +$12,000 (Net Income 경유)<br>AOCI, Common Stock, APIC 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Investment in Investee +$9,000 (NI $12,000 − Dividend $3,000)\nAssets: Cash +$3,000 (dividend received)\nSE: Retained Earnings +$12,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash (dividend)',        dr: '+$3,000',  cr: '($3,000)',  highlight: true },
                { acct: 'Investment in Investee', dr: '+$9,000',  cr: '($9,000)',  highlight: true },
                { acct: 'Retained Earnings',      dr: '+$12,000', cr: '($12,000)', highlight: true },
              ],
              trap: 'Dividend received → reduces Investment (not revenue). Investment 잔액 = Cost + NI share − Dividends.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method: Equity in Earnings ($12,000) → remove from CFO (non-cash)\nDividend received $3,000 → add to CFO\nNet CFO impact = ($9,000)',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFO (Indirect):</strong> Equity earnings → 제거 (−$12,000)<br><strong>CFO:</strong> Dividend received → +$3,000<br><strong>Net CFO impact:</strong> −$9,000</div>`,
              trap: 'Equity method income = 비현금 → CFO에서 제거. 실제 현금은 배당 수취액만.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Ownership % / Investee NI / Investment carrying amount / Equity in earnings',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Ownership: 30% / Investee NI: $40,000<br>② Equity in earnings: $12,000<br>③ Investment carrying amount: Cost + cumulative NI − cumulative dividends<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: Investment carrying amount 역산 → NI share + div 추적</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Equity in Earnings +$12,000 → Net Income ↑',
          bs: 'Investment +$9,000 / Cash +$3,000',
          se: 'Retained Earnings +$12,000',
          cfo: 'Equity earnings removed (−$12,000) / Dividend received +$3,000',
        },
      },
    ],
  },
  {
    id: 'equity',
    label: '⑤ Equity Transactions',
    color: '#993C1D',
    items: [
      {
        id: 'stock_issue',
        label: 'Stock Issuance',
        topicId: 'EQUITY_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company issues 1,000 shares of $5 par common stock at $18 per share.\nProceeds = $18,000 / Common Stock = $5,000 / APIC = $13,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Common Stock at par; excess over par → APIC.',
            entries: [
              { account: 'Cash',         type: 'dr', amount: 18000 },
              { account: 'Common Stock', type: 'cr', amount:  5000 },
              { account: 'APIC',         type: 'cr', amount: 13000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',         type: 'dr', sign: '+$18,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Common Stock', type: 'cr', sign: '($5,000)',  signClass: 'sign-negative', reason: 'Par value × shares → Credit → 음수' },
                { acct: 'APIC',        type: 'cr', sign: '($13,000)', signClass: 'sign-negative', reason: '초과분 → Credit → 음수' },
              ],
              note: 'Common Stock = 1,000 × $5 par = $5,000. APIC = ($18 − $5) × 1,000 = $13,000.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Cash (Dr — asset increases)\n• Common Stock (Cr — par value)\n• APIC (Cr — excess over par)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',         dr: ['18,000 ★'], cr: [] },
                { name: 'Common Stock', dr: [],           cr: ['5,000 ★'] },
                { name: 'APIC',        dr: [],           cr: ['13,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Cash   Dr  $18,000\n• Common Stock   Cr  $5,000\n• APIC   Cr  $13,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',         dr: '$18,000', cr: '—',       highlight: true },
                { acct: 'Common Stock', dr: '—',       cr: '$5,000',  highlight: true },
                { acct: 'APIC',        dr: '—',       cr: '$13,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact.\nStock issuance is a financing transaction.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact.<br>Stock issuance = financing transaction.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Common Stock +$5,000 / APIC +$13,000\nTotal SE +$18,000\nNo Retained Earnings impact',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Common Stock 열: +$5,000<br>APIC 열: +$13,000<br>Retained Earnings 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash +$18,000\nSE: Common Stock +$5,000 / APIC +$13,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',         dr: '+$18,000', cr: '($18,000)', highlight: true },
                { acct: 'Common Stock', dr: '+$5,000',  cr: '($5,000)',  highlight: true },
                { acct: 'APIC',        dr: '+$13,000', cr: '($13,000)', highlight: true },
              ],
              trap: 'Common stock account = par value only. FMV − par → APIC. No income effect.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities inflow: Cash received $18,000',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFF inflow:</strong> Proceeds from stock issuance +$18,000<br>CFO / CFI: 영향 없음</div>`,
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Shares issued / Par value / Proceeds',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Shares issued: 1,000 / Par value: $5<br>② Issue price: $18 / Total proceeds: $18,000<br>③ Common Stock $5,000 / APIC $13,000</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No income impact',
          bs: 'Cash +$18,000 / Common Stock +$5,000 / APIC +$13,000',
          se: 'Common Stock +$5,000 / APIC +$13,000',
          cff: 'Stock issuance proceeds → Financing Activities inflow (+$18,000)',
        },
      },
      {
        id: 'ts_buy',
        label: 'Treasury Stock Purchase',
        topicId: 'EQUITY_002',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company repurchases 500 shares of its own stock at $20/share.\nTreasury Stock cost = $10,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Cost method: record Treasury Stock at repurchase price.',
            entries: [
              { account: 'Treasury Stock', type: 'dr', amount: 10000 },
              { account: 'Cash',           type: 'cr', amount: 10000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Treasury Stock', type: 'dr', sign: '+$10,000', signClass: 'sign-positive', reason: 'Contra equity → Debit → SE 감소' },
                { acct: 'Cash',           type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: '현금 유출 → Credit → 음수' },
              ],
              note: 'Treasury Stock = contra equity (Dr balance reduces total SE). Not an asset.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Treasury Stock (Dr balance — contra equity)\n• Cash (Cr — decreases)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Treasury Stock', dr: ['10,000 ★'], cr: [] },
                { name: 'Cash',           dr: [],           cr: ['10,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Treasury Stock   Dr  $10,000\n• Cash              Cr  $10,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Treasury Stock', dr: '$10,000', cr: '—',       highlight: true },
                { acct: 'Cash',           dr: '—',       cr: '$10,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact.\nTreasury stock transactions never affect Net Income.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact.<br>Treasury stock transactions never affect Net Income.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Treasury Stock −$10,000 (contra equity)\nTotal SE decreases by $10,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Treasury Stock 열: −$10,000 (contra equity, shown as deduction)<br>Common Stock, APIC, RE, AOCI 열: 변동 없음</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash −$10,000\nSE: Treasury Stock −$10,000 (shown as deduction in SE section)',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',           dr: '−$10,000', cr: '($10,000)', highlight: true },
                { acct: 'Treasury Stock', dr: '−$10,000', cr: '($10,000)', highlight: true },
              ],
              trap: 'Treasury Stock = contra equity (not asset). Never affects NI. Shown as negative in SE.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities outflow: Cash paid $10,000',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFF outflow:</strong> Treasury stock purchase ($10,000)<br>CFO / CFI: 영향 없음</div>`,
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Shares repurchased / Cost / Treasury stock balance',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Shares repurchased: 500 / Cost: $20/share<br>② Total treasury stock: $10,000<br>③ Cost method applied</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No income impact',
          bs: 'Cash −$10,000 / Treasury Stock −$10,000 (contra equity)',
          se: 'Treasury Stock −$10,000',
          cff: 'Treasury stock purchase → Financing Activities outflow ($10,000)',
        },
      },
      {
        id: 'ts_reissue',
        label: 'Treasury Stock Reissuance',
        topicId: 'EQUITY_002',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company reissues 500 treasury shares (cost $10,000) at $22/share.\nProceeds = $11,000 / Cost = $10,000 / Excess = $1,000 → APIC',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Cost method reissuance: proceeds > cost → excess to APIC (never to NI).',
            entries: [
              { account: 'Cash',                   type: 'dr', amount: 11000 },
              { account: 'Treasury Stock',          type: 'cr', amount: 10000 },
              { account: 'APIC — Treasury Stock',   type: 'cr', amount:  1000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Cash',                 type: 'dr', sign: '+$11,000', signClass: 'sign-positive', reason: '현금 수취 → Debit → 양수' },
                { acct: 'Treasury Stock',       type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: 'Contra equity 제거 → Credit → 음수' },
                { acct: 'APIC — Treasury Stock', type: 'cr', sign: '($1,000)', signClass: 'sign-negative', reason: '초과분 → Credit (NI 아님)' },
              ],
              note: 'Excess $1,000 → APIC, never Net Income. If proceeds < cost → reduce APIC then RE.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Cash (Dr — proceeds received)\n• Treasury Stock (Cr — cost removed)\n• APIC — TS (Cr — excess)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Cash',                  dr: ['11,000 ★'], cr: [] },
                { name: 'Treasury Stock',        dr: [],           cr: ['10,000 ★'] },
                { name: 'APIC — Treasury Stock', dr: [],           cr: ['1,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Cash   Dr  $11,000\n• Treasury Stock   Cr  $10,000\n• APIC — TS   Cr  $1,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Cash',                  dr: '$11,000', cr: '—',       highlight: true },
                { acct: 'Treasury Stock',        dr: '—',       cr: '$10,000', highlight: true },
                { acct: 'APIC — Treasury Stock', dr: '—',       cr: '$1,000',  highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact.\nGain/Loss on treasury stock → never to NI.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact.<br>Excess → APIC, never Net Income.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Treasury Stock +$10,000 (removed) / APIC +$1,000\nTotal SE +$11,000',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Treasury Stock 열: +$10,000 (removed — contra equity 감소)<br>APIC 열: +$1,000<br>Total SE: +$11,000</div>`,
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: Cash +$11,000\nSE: Treasury Stock +$10,000 / APIC +$1,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Cash',                  dr: '+$11,000', cr: '($11,000)', highlight: true },
                { acct: 'Treasury Stock (removed)', dr: '+$10,000', cr: '($10,000)', highlight: true },
                { acct: 'APIC',                  dr: '+$1,000',  cr: '($1,000)',  highlight: true },
              ],
              trap: 'Proceeds > cost → APIC. Proceeds < cost → reduce APIC first, then RE. Never NI.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities inflow: Proceeds $11,000',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>CFF inflow:</strong> Treasury stock reissuance proceeds +$11,000<br>CFO / CFI: 영향 없음</div>`,
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Shares reissued / Proceeds / APIC impact',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Shares reissued: 500 / Proceeds: $22/share ($11,000 total)<br>② Cost: $10,000 / Excess to APIC: $1,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR: Proceeds &lt; cost → APIC 먼저 제거, 부족 시 RE 차감. NI 절대 불가.</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No income impact — never NI',
          bs: 'Cash +$11,000 / Treasury Stock −$10,000 removed / APIC +$1,000',
          se: 'Treasury Stock removed / APIC +$1,000',
          cff: 'Treasury stock reissuance proceeds → Financing inflow (+$11,000)',
        },
      },
      {
        id: 'cash_div',
        label: 'Cash Dividend — Declaration & Payment',
        topicId: 'RE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Board declares $0.50/share dividend on 20,000 shares = $10,000 total.\nDeclaration date → record liability. Payment date → pay cash.',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Declaration: Dr RE / Cr Dividends Payable. Payment: Dr Dividends Payable / Cr Cash.',
            entries: [
              { account: 'Retained Earnings',  type: 'dr', amount: 10000 },
              { account: 'Dividends Payable',  type: 'cr', amount: 10000 },
            ],
            drill: {
              title: 'Journal Entry — Declaration date',
              je: [
                { acct: 'Retained Earnings', type: 'dr', sign: '+$10,000', signClass: 'sign-positive', reason: 'RE 감소 → Debit → 양수' },
                { acct: 'Dividends Payable', type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: '부채 증가 → Credit → 음수' },
              ],
              note: 'Declaration date: liability created. Payment date: Dr Dividends Payable / Cr Cash $10,000.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Retained Earnings (Dr — direct reduction)\n• Dividends Payable (Cr — current liability)\nAt payment: Dividends Payable Dr / Cash Cr',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Retained Earnings', dr: ['10,000 ★'], cr: [] },
                { name: 'Dividends Payable', dr: [],           cr: ['10,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Retained Earnings   Dr  $10,000 (reduction)\n• Dividends Payable   Cr  $10,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Retained Earnings', dr: '$10,000', cr: '—',       highlight: true },
                { acct: 'Dividends Payable', dr: '—',       cr: '$10,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact.\nDividends reduce Retained Earnings directly — not an expense.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact.<br>Dividends = RE 직접 차감, not an expense.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Retained Earnings −$10,000 (direct reduction)\nNot via Net Income',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$10,000 (직접 차감)<br>Common Stock, APIC, AOCI 열: 변동 없음</div>`,
              trap: 'Dividends ≠ Expense. RE 직접 차감. I/S 영향 없음.',
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Dividends Payable +$10,000 (at declaration)\nSE: Retained Earnings −$10,000\nAt payment: Cash −$10,000 / Dividends Payable −$10,000',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Dividends Payable',  dr: '+$10,000', cr: '($10,000)', highlight: true },
                { acct: 'Retained Earnings',  dr: '−$10,000', cr: '($10,000)', highlight: true },
              ],
              trap: 'Declaration date: liability created (no cash yet). Payment date: Dividends Payable 제거 + Cash 감소.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Financing Activities outflow: Cash paid $10,000 (at payment date)\n⚠ Declaration creates liability but no cash flow yet',
            drill: {
              title: 'Statement of Cash Flows — Financing Activities',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Declaration date:</strong> 현금 없음 (liability만 생성)<br><strong>Payment date:</strong> CFF outflow ($10,000)</div>`,
              trap: 'Cash dividend payment → CFF outflow. Declaration date에는 현금 흐름 없음.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Dividend per share / Total amount / Record date / Payment date',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Dividend: $0.50/share × 20,000 shares = $10,000<br>② Record date / Payment date<br>③ Dividends payable balance at year-end</div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No income impact — dividends not an expense',
          bs: 'Dividends Payable +$10,000 / RE −$10,000 at declaration',
          se: 'Retained Earnings −$10,000 (direct)',
          cff: 'Cash dividend payment → Financing Activities outflow ($10,000)',
        },
      },
      {
        id: 'stock_div',
        label: 'Stock Dividend Declaration',
        topicId: 'RE_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: '10% stock dividend on 10,000 shares outstanding. FMV $15/share, Par $5.\nNew shares = 1,000 / FMV = $15,000 / Common Stock = $5,000 / APIC = $10,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Small stock dividend (<20-25%): at FMV. Large stock dividend: at par only.',
            entries: [
              { account: 'Retained Earnings', type: 'dr', amount: 15000 },
              { account: 'Common Stock',       type: 'cr', amount:  5000 },
              { account: 'APIC',              type: 'cr', amount: 10000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Retained Earnings', type: 'dr', sign: '+$15,000', signClass: 'sign-positive', reason: 'RE 감소 (FMV 기준) → Debit → 양수' },
                { acct: 'Common Stock',      type: 'cr', sign: '($5,000)',  signClass: 'sign-negative', reason: 'Par × new shares → Credit → 음수' },
                { acct: 'APIC',             type: 'cr', sign: '($10,000)', signClass: 'sign-negative', reason: 'FMV − par 초과분 → Credit → 음수' },
              ],
              note: 'Small stock div: FMV 기준 RE 차감. No cash. Total SE unchanged.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• RE reduced at FMV\n• Common Stock +par × new shares\n• APIC + excess\nTotal SE: no change',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Retained Earnings', dr: ['15,000 ★'], cr: [] },
                { name: 'Common Stock',      dr: [],           cr: ['5,000 ★'] },
                { name: 'APIC',             dr: [],           cr: ['10,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• RE   Dr  $15,000\n• Common Stock   Cr  $5,000\n• APIC   Cr  $10,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Retained Earnings', dr: '$15,000', cr: '—',       highlight: true },
                { acct: 'Common Stock',      dr: '—',       cr: '$5,000',  highlight: true },
                { acct: 'APIC',             dr: '—',       cr: '$10,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'No income statement impact.\nNo cash outflow.',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px;padding:6px 8px;background:#f3f4f6;border-radius:4px;color:#6b7280">No I/S impact.<br>No cash outflow — SE internal reclassification.</div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'RE −$15,000 / Common Stock +$5,000 / APIC +$10,000\nTotal SE unchanged (reclassification within SE)',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$15,000<br>Common Stock 열: +$5,000<br>APIC 열: +$10,000<br>Total SE: 변동 없음 (내부 재분류)</div>`,
              trap: 'Stock dividend = SE 내부 재분류. 총 SE 변동 없음. Cash dividend와 달리 현금 유출 없음.',
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'SE: RE −$15,000 / Common Stock +$5,000 / APIC +$10,000\nTotal SE unchanged ✓',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'Retained Earnings', dr: '−$15,000', cr: '($15,000)', highlight: true },
                { acct: 'Common Stock',      dr: '+$5,000',  cr: '($5,000)',  highlight: true },
                { acct: 'APIC',             dr: '+$10,000', cr: '($10,000)', highlight: true },
              ],
              trap: 'Total SE unchanged: −$15,000 RE + $5,000 CS + $10,000 APIC = $0 net change.',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'No cash flow impact.\nNon-cash transaction → supplemental disclosure if material.',
            drill: {
              title: 'Statement of Cash Flows',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>No cash flow impact.</strong><br>Non-cash transaction → supplemental disclosure if material</div>`,
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Shares issued / FMV used / RE reclassified',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Stock dividend: 10% / 1,000 new shares issued<br>② FMV $15/share / RE reclassified: $15,000<br>③ Common Stock +$5,000 / APIC +$10,000<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR: Small (&lt;20%) → FMV. Large (≥20-25%) → par only. 구분 기준 암기.</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'No income impact',
          bs: 'SE reclassification only — total SE unchanged',
          se: 'RE −$15,000 / Common Stock +$5,000 / APIC +$10,000',
          cfo: 'No cash impact',
        },
      },
      {
        id: 'sbc',
        label: 'Stock-Based Compensation (SBC)',
        topicId: 'SBC_001',
        stages: [
          {
            step: 'source',
            label: 'Source Document',
            note: 'Company grants stock options to employees. Total fair value = $12,000 / Vesting period 3 years.\nAnnual SBC expense = $4,000',
          },
          {
            step: 'journal',
            label: 'General Journal',
            note: 'Recognize SBC expense over vesting period; credit APIC (equity settled).',
            entries: [
              { account: 'Compensation Expense',   type: 'dr', amount: 4000 },
              { account: 'APIC — Stock Options',   type: 'cr', amount: 4000 },
            ],
            drill: {
              title: 'Journal Entry — Debit(Credit) format',
              je: [
                { acct: 'Compensation Expense',  type: 'dr', sign: '+$4,000', signClass: 'sign-positive', reason: '비용 → Debit → 양수' },
                { acct: 'APIC — Stock Options',  type: 'cr', sign: '($4,000)', signClass: 'sign-negative', reason: 'Equity → Credit (not liability)' },
              ],
              note: 'SBC = non-cash expense. Debit expense / Credit APIC. No cash outflow.',
            },
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• Compensation Expense (Dr — P&L impact)\n• APIC — Stock Options (Cr — equity account)',
            drill: {
              title: 'General Ledger — T-accounts',
              taccounts: [
                { name: 'Compensation Expense',  dr: ['4,000 ★'], cr: [] },
                { name: 'APIC — Stock Options',  dr: [],          cr: ['4,000 ★'] },
              ],
            },
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: '• Compensation Expense   Dr  $4,000\n• APIC — Stock Options   Cr  $4,000\nDebit total = Credit total ✓',
            drill: {
              title: 'Adjusted Trial Balance — related accounts',
              tb: [
                { acct: 'Compensation Expense',  dr: '$4,000', cr: '—',      highlight: true },
                { acct: 'APIC — Stock Options',  dr: '—',      cr: '$4,000', highlight: true },
              ],
              note: 'Debit total = Credit total ✓',
            },
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Compensation Expense $4,000 → Operating Expenses → Net Income ↓',
            drill: {
              title: 'Income Statement impact',
              custom: `<div style="font-size:11px"><div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #f3f4f6"><span style="color:#4a5568">Compensation Expense (SBC)</span><span style="color:#c2410c;font-weight:600">($4,000)</span></div><div style="margin-top:6px;font-size:11px;color:#6b7280">Non-cash expense → Net Income ↓, but APIC ↑ → net SE = $0</div></div>`,
            },
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ $4,000 → RE ↓ $4,000\nAPIС +$4,000\nNet SE change = $0 (expense offsets APIC increase)',
            drill: {
              title: "Statement of Stockholders' Equity impact",
              custom: `<div style="font-size:11px;color:#4a5568;line-height:1.7">Retained Earnings 열: −$4,000 (Net Income 경유)<br>APIC 열: +$4,000 (SBC grant)<br>Net SE change: $0</div>`,
              trap: 'SBC = 비현금 비용 → CFO indirect에서 add back. APIC 증가 = equity settled (부채 아님).',
            },
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'SE: APIC +$4,000 / RE −$4,000\nNet BS impact = $0 (no cash)',
            drill: {
              title: 'Balance Sheet — Debit(Credit) input',
              tb: [
                { acct: 'APIC — Stock Options',  dr: '+$4,000', cr: '($4,000)', highlight: true },
                { acct: 'Retained Earnings',     dr: '−$4,000', cr: '($4,000)', highlight: true },
              ],
              trap: 'SBC = 비현금 비용 → CFO indirect에서 add back. APIC 증가 = equity settled (부채 아님).',
            },
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method: SBC Expense $4,000 → add back (+) non-cash\n⚠ Cash paid at exercise → Financing Activities inflow',
            drill: {
              title: 'Statement of Cash Flows — Indirect Method',
              custom: `<div style="font-size:11px;line-height:1.7;color:#4a5568"><strong>Indirect Method:</strong> SBC Expense → add back (+$4,000)<br>비현금 비용 → Depreciation과 동일 처리<br><strong>Exercise 시:</strong> Cash received → CFF inflow</div>`,
              trap: 'SBC expense = 비현금 → add back(+). 행사 시 현금 수취는 CFF. 행사 전까지 현금 흐름 없음.',
            },
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Grant date FV / Vesting period / Shares / APIC balance',
            drill: {
              title: 'Notes to Financial Statements',
              custom: `<div style="font-size:11px;line-height:1.8;color:#4a5568">① Grant: options / Grant date FV: $12,000 total<br>② Vesting period: 3 years / Annual expense: $4,000<br>③ APIC — Stock Options balance<div style="margin-top:6px;padding:5px 8px;background:#faeeda;border-radius:4px;font-size:10px;color:#633806">FAR TBS: SBC expense = non-cash → CFO add back. APIC balance = cumulative SBC recognized.</div></div>`,
            },
          },
        ],
        fsImpact: {
          is_ni: 'Compensation Expense $4,000 → Net Income ↓',
          bs: 'APIC +$4,000 / RE −$4,000 (net $0)',
          se: 'APIC +$4,000 / RE −$4,000',
          cfo: 'Non-cash expense → add back (+$4,000) in indirect method',
        },
      },
    ],
  },
  {
    id: 'special',
    label: '⑥ Tax · Special Items',
    color: '#3B6D11',
    items: [
      {
        id: 'deferred_tax_create',
        label: 'Deferred Tax Asset/Liability',
        topicId: 'TAX_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'error_correction',
        label: 'Prior Period Error Correction',
        topicId: 'ERR_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'discontinued_ops',
        label: 'Discontinued Operations',
        topicId: 'DISC_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'pension_oci',
        label: 'Pension Actuarial G/L (OCI)',
        topicId: 'PEN_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'scf_pattern',
    label: '⑦ SCF Adjustment Patterns',
    color: '#5F5E5A',
    items: [
      {
        id: 'scf_noncash_addback',
        label: 'Non-cash Expense — Add Back',
        topicId: 'SCF_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_working_capital',
        label: 'Working Capital Changes',
        topicId: 'SCF_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_proceeds',
        label: 'Disposal Proceeds Classification',
        topicId: 'SCF_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_noncash_suppl',
        label: 'Non-cash Supplemental Disclosure',
        topicId: 'SCF_004',
        stages: [],
        fsImpact: {},
      },
    ],
  },
]

// ── Helper: topicId prefix → ConceptNotesPage category id ────────────────────
export function topicIdToCatId(topicId: string): string {
  if (topicId.startsWith('BOND')) return 'bond'
  if (topicId.startsWith('INT')) return 'note'
  if (topicId.startsWith('ADJ')) return 'bond'
  if (topicId.startsWith('PPE') || topicId.startsWith('IMP')) return 'ppe'
  if (topicId.startsWith('REC')) return 'receivables'
  if (topicId.startsWith('INVEST') || topicId.startsWith('EQM')) return 'finassets'
  if (topicId.startsWith('LEASE')) return 'lease'
  if (topicId.startsWith('ARO')) return 'aro'
  if (topicId.startsWith('TAX')) return 'tax'
  if (topicId.startsWith('EQUITY') || topicId.startsWith('RE_') || topicId.startsWith('SBC')) return 'equity'
  if (topicId.startsWith('SCF')) return 'scf'
  if (topicId.startsWith('ERR') || topicId.startsWith('CHANGE')) return 'changes'
  if (topicId.startsWith('DISC')) return 'scf'
  if (topicId.startsWith('PEN')) return 'equity'
  if (topicId.startsWith('INV')) return 'inventory'
  if (topicId.startsWith('INTANG')) return 'intangibles'
  if (topicId.startsWith('FS_CRYPTO')) return 'finassets'
  if (topicId.startsWith('FS_')) return 'bond'
  return 'bond'
}

// ── Flat item list ────────────────────────────────────────────────────────────
export const ALL_TX_ITEMS: TxItem[] = TX_GROUPS.flatMap(g => g.items)
