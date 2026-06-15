// ─────────────────────────────────────────────────────────────────────────────
// FAR Study App — FS Transaction Groups
// 거래 분류 기준: "무슨 일이 일어났어?" (B/S 섹션 기준 아님)
// ─────────────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  account: string
  dr?: number
  cr?: number
}

// step은 9단계 회계 사이클의 어느 단계에 속하는지
export type StepId =
  | 'source'   // 원천 서류 / 거래 발생
  | 'aje'      // 조정 분개
  | 'tb'       // 수정후 시산표
  | 'is'       // 손익계산서 (NI)
  | 'oci'      // 기타포괄손익
  | 'bs'       // 재무상태표
  | 'se'       // 자본변동표
  | 'scf'      // 현금흐름표
  | 'notes'    // 주석

export interface TxStage {
  step: StepId
  label: string
  note: string
  entries?: JournalEntry[]
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
// TX_GROUPS — 7그룹
// ─────────────────────────────────────────────────────────────────────────────

export const TX_GROUPS: TxGroup[] = [
  {
    id: 'aje',
    label: '① 기말 조정 (AJE)',
    color: '#1D9E75',
    items: [
      {
        id: 'aje_accrued_expense',
        label: '미지급비용 (Accrued Expense)',
        topicId: 'INT_001',
        stages: [
          {
            step: 'source',
            label: 'Source',
            note: '회계기간 말 — 비용이 발생했으나 아직 현금 미지급 (e.g., 12월 임금을 1월에 지급)',
          },
          {
            step: 'aje',
            label: 'AJE',
            note: '발생주의: 현금 지급 전이라도 비용 발생 시점에 인식',
            entries: [
              { account: 'Salary Expense', dr: 10000 },
              { account: '  Salaries Payable', cr: 10000 },
            ],
          },
          {
            step: 'is',
            label: 'I/S',
            note: 'Salary Expense ↑ → Net Income ↓',
          },
          {
            step: 'bs',
            label: 'B/S',
            note: 'Salaries Payable (Current Liabilities) ↑',
          },
          {
            step: 'scf',
            label: 'SCF',
            note: '간접법 Operating: Accrued Liabilities 증가 → add back (+).\n실제 현금 지급 시 → Operating outflow (Cash paid for salaries)',
          },
        ],
        fsImpact: {
          is_ni: 'Accrued Expense ↑ → Net Income ↓',
          bs: 'Accrued Liabilities (Current) ↑',
          se: 'Retained Earnings ↓ (Net Income 감소 경유)',
          cfo: '간접법: Accrued Liabilities 증가 → add back (+). 현금 지급 시 Operating outflow',
        },
      },
      {
        id: 'aje_accrued_revenue',
        label: '미수수익 (Accrued Revenue)',
        topicId: 'ADJ_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_prepaid',
        label: '선급비용 소진 (Prepaid)',
        topicId: 'ADJ_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_unearned',
        label: '선수수익 인식 (Unearned)',
        topicId: 'ADJ_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_depreciation',
        label: '감가상각 (Depreciation)',
        topicId: 'PPE_DEP_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aje_allowance',
        label: '대손충당금 (Allowance)',
        topicId: 'REC_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'asset',
    label: '② 자산 취득·처분·손상',
    color: '#185FA5',
    items: [
      {
        id: 'ppe_buy',
        label: 'PP&E 취득 (현금)',
        topicId: 'PPE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ppe_sell_gain',
        label: 'PP&E 매각 (이익 발생)',
        topicId: 'PPE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ppe_sell_loss',
        label: 'PP&E 매각 (손실 발생)',
        topicId: 'PPE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'impairment',
        label: '손상차손 (Impairment)',
        topicId: 'IMP_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'cloud_impl',
        label: 'Cloud/SaaS 구현비용 자본화',
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
    label: '③ 금융부채 · 이자',
    color: '#534AB7',
    items: [
      {
        id: 'bond_issue_discount',
        label: '사채 발행 — 할인 (Discount)',
        topicId: 'BOND_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_issue_premium',
        label: '사채 발행 — 할증 (Premium)',
        topicId: 'BOND_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_interest',
        label: '사채 이자비용 (유효이자율법)',
        topicId: 'BOND_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'bond_retire_early',
        label: '사채 조기상환 G/L',
        topicId: 'BOND_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'lease_finance',
        label: '금융리스 이자비용',
        topicId: 'LEASE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'aro_accretion',
        label: '자산제거채무 이자 (ARO)',
        topicId: 'ARO_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'financial_asset',
    label: '④ 금융자산 평가',
    color: '#BA7517',
    items: [
      {
        id: 'afs_unrealized',
        label: 'AFS 미실현 Gain/Loss',
        topicId: 'INVEST_001',
        stages: [
          {
            step: 'source',
            label: 'Source',
            note: '기말 공정가치 평가 — AFS (Available-For-Sale) 유가증권 FV 변동 인식',
          },
          {
            step: 'aje',
            label: 'AJE',
            note: 'FV 상승 시: Dr FV Adjustment / Cr OCI — Unrealized Gain\nFV 하락 시: Dr OCI — Unrealized Loss / Cr FV Adjustment',
            entries: [
              { account: 'Fair Value Adjustment — AFS', dr: 5000 },
              { account: '  OCI — Unrealized Gain on AFS Securities', cr: 5000 },
            ],
          },
          {
            step: 'oci',
            label: 'OCI',
            note: 'Net Income 미포함 → OCI (기타포괄손익)에 기록.\nComprehensive Income = NI + OCI에 포함.',
          },
          {
            step: 'bs',
            label: 'B/S',
            note: 'Investment in AFS Securities → Fair Value로 표시\nAOCI (Accumulated OCI) → Stockholders\' Equity 구성요소 ↑',
          },
          {
            step: 'scf',
            label: 'SCF',
            note: '비현금 평가손익 → 현금 영향 없음.\n간접법에서도 OCI는 NI에 포함되지 않으므로 별도 조정 불필요.\n⚠ AFS 매각 시(실현 시) → Investing Activities inflow',
          },
        ],
        fsImpact: {
          is_ni: 'OCI 항목 — Net Income 영향 없음 (미실현 단계)',
          is_oci: 'Unrealized Gain/Loss on AFS → OCI (기타포괄손익)',
          bs: 'Investment in AFS at Fair Value ↑/↓\nAOCI (Stockholders\' Equity 내) ↑/↓',
          se: 'AOCI 구성요소 변동 — Retained Earnings 미변동',
          cfo: '비현금 거래 — Operating 조정 없음',
          cfi: 'AFS 매각(실현) 시 → Investing Activities inflow',
        },
      },
      {
        id: 'afs_sold',
        label: 'AFS 매각 (실현 + reclassify)',
        topicId: 'INVEST_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'trading_fv',
        label: 'Trading 공정가치 변동',
        topicId: 'INVEST_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'crypto_fv_up',
        label: 'Crypto 공정가치 변동 (ASU 2023-08)',
        topicId: 'FS_CRYPTO_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'equity_method',
        label: '지분법 손익 인식',
        topicId: 'EQM_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'equity',
    label: '⑤ 자본 거래',
    color: '#993C1D',
    items: [
      {
        id: 'stock_issue',
        label: '주식 발행',
        topicId: 'EQUITY_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ts_buy',
        label: '자기주식 매입',
        topicId: 'EQUITY_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'ts_reissue',
        label: '자기주식 재발행',
        topicId: 'EQUITY_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'cash_div',
        label: '현금배당 선언 · 지급',
        topicId: 'RE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'stock_div',
        label: '주식배당 선언',
        topicId: 'RE_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'sbc',
        label: '주식기준보상 (SBC)',
        topicId: 'SBC_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'special',
    label: '⑥ 세금 · 특수 항목',
    color: '#3B6D11',
    items: [
      {
        id: 'deferred_tax_create',
        label: '이연법인세 자산/부채 설정',
        topicId: 'TAX_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'error_correction',
        label: '전기오류 수정 (소급)',
        topicId: 'ERR_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'discontinued_ops',
        label: '중단사업 손익',
        topicId: 'DISC_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'pension_oci',
        label: '연금 계리손익 (OCI)',
        topicId: 'PEN_001',
        stages: [],
        fsImpact: {},
      },
    ],
  },
  {
    id: 'scf_pattern',
    label: '⑦ SCF 조정 패턴',
    color: '#5F5E5A',
    items: [
      {
        id: 'scf_noncash_addback',
        label: '비현금비용 → add back',
        topicId: 'SCF_001',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_working_capital',
        label: '운전자본 변동',
        topicId: 'SCF_002',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_proceeds',
        label: '매각 proceeds 분류',
        topicId: 'SCF_003',
        stages: [],
        fsImpact: {},
      },
      {
        id: 'scf_noncash_suppl',
        label: '비현금 거래 Supplemental 공시',
        topicId: 'SCF_004',
        stages: [],
        fsImpact: {},
      },
    ],
  },
]

// ── 헬퍼: topicId 프리픽스 → ConceptNotesPage category id 매핑 ──────────────
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

// ── 전체 아이템 플랫 목록 ────────────────────────────────────────────────────
export const ALL_TX_ITEMS: TxItem[] = TX_GROUPS.flatMap(g => g.items)
