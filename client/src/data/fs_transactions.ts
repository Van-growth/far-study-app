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

export interface TxStage {
  step: StepId
  label: string
  note: string
  entries?: JournalEntry[]
  trap?: string
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
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: 'Post to individual accounts:\n• Salaries Expense (Dr balance increases)\n• Salaries Payable (Cr balance — new liability created)',
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'After AJE posting:\n• Salaries Expense   Dr  $10,000\n• Salaries Payable   Cr  $10,000\nDebit total = Credit total ✓',
          },
          {
            step: 'is',
            label: 'Income Statement',
            note: 'Salaries Expense $10,000 → Operating Expenses\nNet Income decreases by $10,000',
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'Net Income ↓ → Retained Earnings ↓ $10,000\nAll other columns (Common Stock, APIC, AOCI, Treasury Stock): no change',
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Liabilities: Salaries Payable (Current) +$10,000\nStockholders\' Equity: Retained Earnings −$10,000\nAssets: no change → Balance maintained ✓',
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'Indirect Method — Operating Activities:\n• Accrued Liabilities increase +$10,000 (add back — cash not yet paid)\n⚠ When actually paid in January → Operating Activities outflow (Cash paid for salaries)',
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Accrued salaries payable balance, payment schedule.\nFAR TBS: Notes exhibit often shows accrued liability balances → use to verify AJE amounts.',
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
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_prepaid',
        label: 'Prepaid Expense Expiration',
        topicId: 'ADJ_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_unearned',
        label: 'Unearned Revenue Recognition',
        topicId: 'ADJ_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_depreciation',
        label: 'Depreciation',
        topicId: 'PPE_DEP_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_allowance',
        label: 'Allowance for Doubtful Accounts',
        topicId: 'REC_001',
        stages: [],
        fsImpact: {},
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
          },
          {
            step: 'ledger',
            label: 'General Ledger (T-accounts)',
            note: '• AFS Securities: cost $100,000 + FV adjustment $5,000 = carrying $105,000\n• OCI — Unrealized Gain: Cr balance $5,000 (not an income account)',
          },
          {
            step: 'tb',
            label: 'Adjusted Trial Balance',
            note: 'AFS Securities   Dr  $105,000\nOCI — Unrealized Gain   Cr  $5,000\n⚠ OCI does NOT flow through I/S closing entries → goes directly to AOCI on B/S',
          },
          {
            step: 'is',
            label: 'Income Statement + Comprehensive Income',
            note: 'Net Income: NO IMPACT (unrealized, AFS)\nOther Comprehensive Income: +$5,000 Unrealized Gain on AFS\nTotal Comprehensive Income = Net Income + OCI $5,000',
          },
          {
            step: 'oci',
            label: 'Other Comprehensive Income',
            note: 'Unrealized Gain/Loss on AFS → OCI section of Comprehensive Income Statement\nTwo presentation methods:\n① One-statement: I/S extended with OCI section\n② Two-statement: separate Comprehensive Income Statement',
          },
          {
            step: 'se',
            label: "Statement of Stockholders' Equity",
            note: 'AOCI column: +$5,000\nRetained Earnings column: NO CHANGE\n⚠ Common mistake: putting OCI into Retained Earnings instead of AOCI column',
          },
          {
            step: 'bs',
            label: 'Balance Sheet',
            note: 'Assets: AFS Securities at Fair Value $105,000 (+$5,000)\nStockholders\' Equity: AOCI +$5,000\nBalance check: Assets +5K = SE (AOCI) +5K ✓',
          },
          {
            step: 'scf',
            label: 'Statement of Cash Flows',
            note: 'No cash movement → NO impact on SCF\nIndirect method: OCI not in Net Income → no add-back needed\n⚠ When AFS is SOLD (realized): Proceeds → Investing Activities inflow',
          },
          {
            step: 'notes',
            label: 'Notes to Financial Statements',
            note: 'Disclosure: Cost $100,000 / Fair Value $105,000 / Unrealized Gain $5,000 / AOCI balance\nClassification basis (intent to hold)',
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
