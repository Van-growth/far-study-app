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
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ppe_sell_gain',
        label: 'PP&E Disposal — Gain',
        topicId: 'PPE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ppe_sell_loss',
        label: 'PP&E Disposal — Loss',
        topicId: 'PPE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'impairment',
        label: 'Impairment Loss',
        topicId: 'IMP_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'cloud_impl',
        label: 'Cloud/SaaS Implementation Costs',
        topicId: 'INTANG_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'purchase_commit',
        label: 'Purchase Commitment Loss',
        topicId: 'INV_001',
        stages: [],
        fsImpact: {},
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
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_issue_premium',
        label: 'Bond Issuance — Premium',
        topicId: 'BOND_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_interest',
        label: 'Bond Interest Expense (Effective Method)',
        topicId: 'BOND_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_retire_early',
        label: 'Bond Early Retirement G/L',
        topicId: 'BOND_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'lease_finance',
        label: 'Finance Lease Interest Expense',
        topicId: 'LEASE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aro_accretion',
        label: 'Asset Retirement Obligation Accretion',
        topicId: 'ARO_001',
        stages: [],
        fsImpact: {},
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
        stages: [],
        fsImpact: {},
      },
      {
        id: 'trading_fv',
        label: 'Trading Securities FV Change',
        topicId: 'INVEST_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'crypto_fv_up',
        label: 'Crypto FV Change (ASU 2023-08)',
        topicId: 'FS_CRYPTO_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'equity_method',
        label: 'Equity Method — Income Recognition',
        topicId: 'EQM_001',
        stages: [],
        fsImpact: {},
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
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ts_buy',
        label: 'Treasury Stock Purchase',
        topicId: 'EQUITY_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ts_reissue',
        label: 'Treasury Stock Reissuance',
        topicId: 'EQUITY_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'cash_div',
        label: 'Cash Dividend — Declaration & Payment',
        topicId: 'RE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'stock_div',
        label: 'Stock Dividend Declaration',
        topicId: 'RE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'sbc',
        label: 'Stock-Based Compensation (SBC)',
        topicId: 'SBC_001',
        stages: [],
        fsImpact: {},
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
