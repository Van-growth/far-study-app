import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { PROFESSOR_SSOT_V2, TopicCard } from '../constants/professor_ssot_v2'
import useStudyStore from '../store/studyStore'
import { listConversations, deleteConversation } from '../lib/harryHistory'
import type { HarryConversation, HarryMessage } from '../lib/harryHistory'
import { SYSTEM_PROMPT } from '../hooks/useClaudeChat'
import {
  InterestFamilyViz,
  InventoryCostViz,
  EquityCapitalViz,
  TaxAdjustmentViz,
  RevenueRecognitionViz,
  FinancialAnalysisViz,
  PublicNonprofitViz,
} from './ConceptViz'

// ── Constants ──────────────────────────────────────────────────────────────────
const NAVY = '#1a2744'
const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001'

const CATEGORIES = [
  { id: 'bond',        label: 'Bond',                         groups: ['IA_CH8_BOND'] },
  { id: 'tdr',         label: 'TDR',                               groups: ['IA_CH8_TDR'] },
  { id: 'lease',       label: 'Lease',                        groups: ['IA_CH8_LEASE'] },
  { id: 'note',        label: 'Note Payable & Interest',      groups: ['IA_CH8_NOTE', 'IA_CH8_INT'] },
  { id: 'aro',         label: 'ARO',                          groups: ['IA_CH8_ARO'] },
  { id: 'inventory',   label: 'Inventory',                    groups: ['IA_CH5_INV'] },
  { id: 'ppe',         label: 'PP&E & Depreciation',          groups: ['IA_CH4_PPE', 'IA_CH4_DEPR', 'IA_CH4_IMPAIR'] },
  { id: 'intangibles', label: 'Intangibles',                  groups: ['IA_CH4_INTANG'] },
  { id: 'revenue',     label: 'Revenue Recognition',          groups: ['IA_CH2_REV'] },
  { id: 'tax',         label: 'Deferred Tax',                 groups: ['IA_CH10_TAX'] },
  { id: 'eps',         label: 'EPS',                          groups: ['IA_CH9_EPS'] },
  { id: 'scf',         label: 'SCF',                          groups: ['IA_CH7_SCF'] },
  { id: 'finassets',   label: '금융자산 & 투자',               groups: ['AA_CH5_INVEST'] },
  { id: 'investments', label: 'Investments & Equity Method',  groups: ['IA_CH6_INVEST'] },
  { id: 'equity',        label: "Stockholders' Equity",         groups: ['IA_CH9_EQUITY'] },
  { id: 'partnerships',  label: 'Partnerships',                  groups: ['AA_CH9_PART'] },
  { id: 'nfp',         label: 'NFP Accounting',               groups: ['IB_NFP'] },
  { id: 'gov',         label: 'Governmental Accounting',      groups: ['IB_GOV'] },
  { id: 'changes',     label: 'Accounting Changes & Errors',  groups: ['IA_CH11_CHANGE'] },
  { id: 'fv',          label: 'Fair Value',                   groups: ['IA_CH12_FV'] },
  { id: 'fx',          label: 'Foreign Currency',             groups: ['IA_CH12_FX'] },
  { id: 'ratio',       label: 'Ratio Analysis',               groups: [] },
  { id: 'consol',      label: 'Consolidation',                groups: ['IA_CH12_CONSOL'] },
  { id: 'subsequent',  label: 'Subsequent Events',            groups: [] },
  { id: 'bankrec',     label: 'Bank Reconciliation',          groups: [] },
  { id: 'other',       label: 'Other',                        groups: [] },
] as const

type CategoryId = typeof CATEGORIES[number]['id']
type TabKey = 'content' | 'cards' | 'harry'

// ── Super Categories ──────────────────────────────────────────────────────────
type SuperCategoryId =
  | 'interest4'
  | 'inventory-cost'
  | 'equity-capital'
  | 'tax-adjustment'
  | 'revenue-recognition'
  | 'financial-analysis'
  | 'public-nonprofit'

type ActiveId = CategoryId | SuperCategoryId

const SUPER_CATEGORIES = [
  {
    id: 'interest4' as SuperCategoryId,
    label: '이자비용',
    children: ['bond', 'tdr', 'lease', 'note', 'aro'] as CategoryId[],
  },
  {
    id: 'inventory-cost' as SuperCategoryId,
    label: '재고 & 원가',
    children: ['inventory', 'ppe', 'intangibles'] as CategoryId[],
  },
  {
    id: 'equity-capital' as SuperCategoryId,
    label: '지분 & 자본',
    children: ['equity', 'eps', 'investments', 'consol', 'partnerships'] as CategoryId[],
  },
  {
    id: 'tax-adjustment' as SuperCategoryId,
    label: '세금 & 조정',
    children: ['tax', 'changes'] as CategoryId[],
  },
  {
    id: 'revenue-recognition' as SuperCategoryId,
    label: '수익 & 비용 인식',
    children: ['revenue', 'subsequent', 'fx'] as CategoryId[],
  },
  {
    id: 'financial-analysis' as SuperCategoryId,
    label: '재무제표 & 분석',
    children: ['scf', 'ratio', 'fv', 'bankrec'] as CategoryId[],
  },
  {
    id: 'public-nonprofit' as SuperCategoryId,
    label: '공공 & 비영리',
    children: ['nfp', 'gov'] as CategoryId[],
  },
] as const

// ── Helpers ────────────────────────────────────────────────────────────────────
function getCardsForCategory(cat: typeof CATEGORIES[number]): TopicCard[] {
  if (cat.groups.length === 0) return []
  return PROFESSOR_SSOT_V2.filter(card =>
    cat.groups.some(g => (card as TopicCard & { topic_group?: string }).topic_group === g)
  )
}

// ── Structured Content Sections ────────────────────────────────────────────────

function BondContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is a Bond?</strong> A debt instrument — issuer borrows money, promises periodic Coupon payments + Face value at maturity.</p>
        <p style={{ color: '#555', marginTop: 6 }}>회사가 투자자에게 발행하는 차용증. 매년 이자 + 만기 원금 상환 약속.</p>
        <p style={{ marginTop: 12 }}><strong>Why does Issue Price differ from Face value?</strong></p>
        <p style={{ color: '#555' }}>투자자는 시장이자율(Market rate)로 돈을 굴릴 수 있어. Coupon rate와 Market rate 차이만큼 발행가가 조정됨.</p>
        <CodeBlock>{`Issue Price = PV of Coupons (Ordinary Annuity)
            + PV of Principal (PV of $1)

Discount example (Face $100,000 / Coupon 6% / Market 8% / 5yr):
  PV of Coupons   = $6,000 × 3.9927 = $23,956
  PV of Principal = $100,000 × 0.6806 = $68,060
  Issue Price = $92,016 → Discount $7,984`}</CodeBlock>
        <p style={{ color: '#555', marginTop: 8, fontStyle: 'italic' }}>Memory: "Coupon"은 옛날 채권에 달린 실제 쿠폰에서 유래. 만기마다 떼어내서 이자를 수령했음.</p>
      </Section>

      <Section title="Bond CV 흐름 — 한눈에">
        <div className="bond-diagram" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SVG 1 — Bond 구조도 */}
          <svg width="100%" viewBox="0 0 680 520" role="img">
            <title>Bond — Premium vs Discount structure</title>
            <desc>Bond 발행부터 만기까지 CV 흐름, 이자 계산 구조 시각화</desc>
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-gray">
              <rect x="240" y="20" width="200" height="44" rx="8" strokeWidth="0.5"/>
              <text className="th" x="340" y="38" textAnchor="middle" dominantBaseline="central">Bond issuance</text>
              <text className="ts" x="340" y="54" textAnchor="middle" dominantBaseline="central">Market rate vs Coupon rate</text>
            </g>
            <line x1="240" y1="42" x2="160" y2="90" stroke="#534AB7" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <line x1="440" y1="42" x2="520" y2="90" stroke="#993C1D" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <text className="ts" x="170" y="82" textAnchor="middle">Market &lt; Coupon</text>
            <text className="ts" x="510" y="82" textAnchor="middle">Market &gt; Coupon</text>
            <g className="c-purple">
              <rect x="40" y="100" width="200" height="56" rx="8" strokeWidth="0.5"/>
              <text className="th" x="140" y="122" textAnchor="middle" dominantBaseline="central">Premium</text>
              <text className="ts" x="140" y="140" textAnchor="middle" dominantBaseline="central">Issue price &gt; Face value</text>
            </g>
            <g className="c-purple">
              <rect x="40" y="190" width="200" height="44" rx="8" strokeWidth="0.5"/>
              <text className="th" x="140" y="206" textAnchor="middle" dominantBaseline="central">CV starts high</text>
              <text className="ts" x="140" y="222" textAnchor="middle" dominantBaseline="central">108,000 → 100,000</text>
            </g>
            <line x1="140" y1="156" x2="140" y2="188" stroke="#534AB7" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-purple">
              <rect x="40" y="268" width="200" height="56" rx="8" strokeWidth="0.5"/>
              <text className="th" x="140" y="287" textAnchor="middle" dominantBaseline="central">Interest expense</text>
              <text className="ts" x="140" y="303" textAnchor="middle" dominantBaseline="central">CV × Market rate</text>
              <text className="ts" x="140" y="317" textAnchor="middle" dominantBaseline="central">decreases each year</text>
            </g>
            <line x1="140" y1="234" x2="140" y2="266" stroke="#534AB7" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-gray">
              <rect x="30" y="358" width="220" height="76" rx="8" strokeWidth="0.5"/>
              <text className="ts" x="46" y="378">Dr. Interest Expense   4,320</text>
              <text className="ts" x="46" y="396">Dr. Premium on Bonds   1,680</text>
              <text className="ts" x="46" y="414">    Cr. Cash                   6,000</text>
            </g>
            <line x1="140" y1="324" x2="140" y2="356" stroke="#534AB7" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-coral">
              <rect x="440" y="100" width="200" height="56" rx="8" strokeWidth="0.5"/>
              <text className="th" x="540" y="122" textAnchor="middle" dominantBaseline="central">Discount</text>
              <text className="ts" x="540" y="140" textAnchor="middle" dominantBaseline="central">Issue price &lt; Face value</text>
            </g>
            <g className="c-coral">
              <rect x="440" y="190" width="200" height="44" rx="8" strokeWidth="0.5"/>
              <text className="th" x="540" y="206" textAnchor="middle" dominantBaseline="central">CV starts low</text>
              <text className="ts" x="540" y="222" textAnchor="middle" dominantBaseline="central">92,000 → 100,000</text>
            </g>
            <line x1="540" y1="156" x2="540" y2="188" stroke="#993C1D" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-coral">
              <rect x="440" y="268" width="200" height="56" rx="8" strokeWidth="0.5"/>
              <text className="th" x="540" y="287" textAnchor="middle" dominantBaseline="central">Interest expense</text>
              <text className="ts" x="540" y="303" textAnchor="middle" dominantBaseline="central">CV × Market rate</text>
              <text className="ts" x="540" y="317" textAnchor="middle" dominantBaseline="central">increases each year</text>
            </g>
            <line x1="540" y1="234" x2="540" y2="266" stroke="#993C1D" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-gray">
              <rect x="430" y="358" width="220" height="76" rx="8" strokeWidth="0.5"/>
              <text className="ts" x="446" y="378">Dr. Interest Expense   7,360</text>
              <text className="ts" x="446" y="396">    Cr. Discount on Bonds  1,360</text>
              <text className="ts" x="446" y="414">    Cr. Cash                   6,000</text>
            </g>
            <line x1="540" y1="324" x2="540" y2="356" stroke="#993C1D" strokeWidth="1" markerEnd="url(#arr)" fill="none"/>
            <g className="c-teal">
              <rect x="200" y="458" width="280" height="44" rx="8" strokeWidth="0.5"/>
              <text className="th" x="340" y="476" textAnchor="middle" dominantBaseline="central">At maturity: CV = Face value</text>
              <text className="ts" x="340" y="492" textAnchor="middle" dominantBaseline="central">Both converge to 100,000</text>
            </g>
            <line x1="140" y1="434" x2="280" y2="456" stroke="#534AB7" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#arr)" fill="none"/>
            <line x1="540" y1="434" x2="400" y2="456" stroke="#993C1D" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#arr)" fill="none"/>
          </svg>

          {/* SVG 2 — CV 수렴 그래프 */}
          <svg width="100%" viewBox="0 0 680 400" role="img">
            <title>Bond CV convergence to face value over 5 years</title>
            <desc>Premium bond CV decreases, Discount bond CV increases, both converge to face value at maturity</desc>
            <line x1="80" y1="30" x2="80" y2="320" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <line x1="80" y1="320" x2="620" y2="320" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <text className="ts" x="72" y="54" textAnchor="end">110,000</text>
            <text className="ts" x="72" y="124" textAnchor="end">108,000</text>
            <text className="ts" x="72" y="194" textAnchor="end">100,000</text>
            <text className="ts" x="72" y="264" textAnchor="end">92,000</text>
            <text className="ts" x="72" y="304" textAnchor="end">90,000</text>
            <line x1="80" y1="194" x2="620" y2="194" stroke="var(--color-text-tertiary)" strokeWidth="0.5" strokeDasharray="4,3" fill="none"/>
            <text className="ts" x="628" y="198" textAnchor="start">Face value</text>
            <text className="ts" x="80" y="338" textAnchor="middle">0</text>
            <text className="ts" x="184" y="338" textAnchor="middle">Y1</text>
            <text className="ts" x="288" y="338" textAnchor="middle">Y2</text>
            <text className="ts" x="392" y="338" textAnchor="middle">Y3</text>
            <text className="ts" x="496" y="338" textAnchor="middle">Y4</text>
            <text className="ts" x="600" y="338" textAnchor="middle">Y5</text>
            <line x1="184" y1="318" x2="184" y2="324" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <line x1="288" y1="318" x2="288" y2="324" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <line x1="392" y1="318" x2="392" y2="324" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <line x1="496" y1="318" x2="496" y2="324" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <line x1="600" y1="318" x2="600" y2="324" stroke="var(--color-text-tertiary)" strokeWidth="0.5" fill="none"/>
            <polyline points="80,82 184,106 288,130 392,155 496,182 600,194" fill="none" stroke="#534AB7" strokeWidth="2"/>
            <circle cx="80"  cy="82"  r="4" fill="#534AB7"/>
            <circle cx="184" cy="106" r="4" fill="#534AB7"/>
            <circle cx="288" cy="130" r="4" fill="#534AB7"/>
            <circle cx="392" cy="155" r="4" fill="#534AB7"/>
            <circle cx="496" cy="182" r="4" fill="#534AB7"/>
            <circle cx="600" cy="194" r="5" fill="#534AB7"/>
            <text className="ts" x="80"  y="74"  textAnchor="middle" fill="#534AB7">108,000</text>
            <text className="ts" x="184" y="98"  textAnchor="middle" fill="#534AB7">106,320</text>
            <text className="ts" x="288" y="122" textAnchor="middle" fill="#534AB7">104,573</text>
            <text className="ts" x="392" y="147" textAnchor="middle" fill="#534AB7">102,756</text>
            <text className="ts" x="496" y="174" textAnchor="middle" fill="#534AB7">100,866</text>
            <polyline points="80,306 184,287 288,266 392,244 496,220 600,194" fill="none" stroke="#993C1D" strokeWidth="2"/>
            <circle cx="80"  cy="306" r="4" fill="#993C1D"/>
            <circle cx="184" cy="287" r="4" fill="#993C1D"/>
            <circle cx="288" cy="266" r="4" fill="#993C1D"/>
            <circle cx="392" cy="244" r="4" fill="#993C1D"/>
            <circle cx="496" cy="220" r="4" fill="#993C1D"/>
            <circle cx="600" cy="194" r="5" fill="#993C1D"/>
            <text className="ts" x="80"  y="320" textAnchor="middle" fill="#993C1D">92,000</text>
            <text className="ts" x="184" y="302" textAnchor="middle" fill="#993C1D">93,360</text>
            <text className="ts" x="288" y="280" textAnchor="middle" fill="#993C1D">94,829</text>
            <text className="ts" x="392" y="258" textAnchor="middle" fill="#993C1D">96,415</text>
            <text className="ts" x="496" y="234" textAnchor="middle" fill="#993C1D">98,128</text>
            <text className="th" x="608" y="186" textAnchor="start" fill="#085041">100,000</text>
            <line x1="100" y1="360" x2="130" y2="360" stroke="#534AB7" strokeWidth="2" fill="none"/>
            <circle cx="115" cy="360" r="4" fill="#534AB7"/>
            <text className="ts" x="136" y="364">Premium bond (Coupon 6% / Market 4%): CV decreases</text>
            <line x1="100" y1="380" x2="130" y2="380" stroke="#993C1D" strokeWidth="2" fill="none"/>
            <circle cx="115" cy="380" r="4" fill="#993C1D"/>
            <text className="ts" x="136" y="384">Discount bond (Coupon 6% / Market 8%): CV increases</text>
            <text className="ts" x="350" y="356" textAnchor="middle">Year</text>
            <text className="ts" x="42" y="180" textAnchor="middle">CV ($)</text>
          </svg>
        </div>
      </Section>

      <hr style={{ border: 'none', borderTop: '2px solid #e0e0e0', margin: '8px 0' }} />

      <Section title="Bond 타임라인 다이어그램">
        <div className="bond-diagram" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* SVG 1 — Issuer Payment 타임라인 */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#993C1D' }}>Issuer 관점 — 발행 &amp; 상환</p>
            <svg width="100%" viewBox="0 0 680 420" role="img">
              <title>Bond payment timeline — Premium vs Discount</title>
              <desc>매년 coupon payment와 만기 원금 상환을 타임라인으로 비교</desc>
              <defs>
                <marker id="arr1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>
              <text className="th" x="40" y="36" fill="#534AB7">Premium Bond</text>
              <text className="ts" x="40" y="52" fill="#534AB7">Coupon 6% / Market 4% / Face $100,000 / Issue $108,901</text>
              <text className="th" x="40" y="230" fill="#993C1D">Discount Bond</text>
              <text className="ts" x="40" y="246" fill="#993C1D">Coupon 6% / Market 8% / Face $100,000 / Issue $92,016</text>
              <line x1="60" y1="110" x2="640" y2="110" stroke="#534AB7" strokeWidth="1.5" fill="none" markerEnd="url(#arr1)"/>
              <line x1="80" y1="100" x2="80" y2="120" stroke="#534AB7" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="80" y="135" textAnchor="middle">Y0</text>
              <line x1="80" y1="100" x2="80" y2="72" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-purple"><rect x="30" y="56" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="80" y="71" textAnchor="middle">+$108,901</text></g>
              <text className="ts" x="80" y="90" textAnchor="middle" fill="#534AB7">발행</text>
              <line x1="180" y1="100" x2="180" y2="120" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="180" y="135" textAnchor="middle">Y1</text>
              <line x1="180" y1="120" x2="180" y2="148" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="130" y="148" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="180" y="163" textAnchor="middle">−$6,000</text></g>
              <line x1="280" y1="100" x2="280" y2="120" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="280" y="135" textAnchor="middle">Y2</text>
              <line x1="280" y1="120" x2="280" y2="148" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="230" y="148" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="280" y="163" textAnchor="middle">−$6,000</text></g>
              <line x1="380" y1="100" x2="380" y2="120" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="380" y="135" textAnchor="middle">Y3</text>
              <line x1="380" y1="120" x2="380" y2="148" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="330" y="148" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="380" y="163" textAnchor="middle">−$6,000</text></g>
              <line x1="480" y1="100" x2="480" y2="120" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="480" y="135" textAnchor="middle">Y4</text>
              <line x1="480" y1="120" x2="480" y2="148" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="430" y="148" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="480" y="163" textAnchor="middle">−$6,000</text></g>
              <line x1="600" y1="100" x2="600" y2="120" stroke="#534AB7" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="600" y="135" textAnchor="middle">Y5 만기</text>
              <line x1="600" y1="120" x2="600" y2="148" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-purple"><rect x="543" y="148" width="114" height="36" rx="4" strokeWidth="0.5"/><text className="ts" x="600" y="163" textAnchor="middle">−$6,000 coupon</text><text className="th" x="600" y="178" textAnchor="middle">−$100,000 원금</text></g>
              <rect x="40" y="195" width="580" height="22" rx="4" fill="#EEEDFE" stroke="#534AB7" strokeWidth="0.5"/>
              <text className="ts" x="50" y="210" fill="#3C3489">총 지급: $6,000×5 + $100,000 = $130,000 | 총 수령: $108,901 | 총 이자비용: $21,099</text>
              <line x1="60" y1="300" x2="640" y2="300" stroke="#993C1D" strokeWidth="1.5" fill="none" markerEnd="url(#arr1)"/>
              <line x1="80" y1="290" x2="80" y2="310" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="80" y="325" textAnchor="middle">Y0</text>
              <line x1="80" y1="290" x2="80" y2="262" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="30" y="246" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="80" y="261" textAnchor="middle">+$92,016</text></g>
              <text className="ts" x="80" y="282" textAnchor="middle" fill="#993C1D">발행</text>
              <line x1="180" y1="290" x2="180" y2="310" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="180" y="325" textAnchor="middle">Y1</text>
              <line x1="180" y1="310" x2="180" y2="338" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="130" y="338" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="180" y="353" textAnchor="middle">−$6,000</text></g>
              <line x1="280" y1="290" x2="280" y2="310" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="280" y="325" textAnchor="middle">Y2</text>
              <line x1="280" y1="310" x2="280" y2="338" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="230" y="338" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="280" y="353" textAnchor="middle">−$6,000</text></g>
              <line x1="380" y1="290" x2="380" y2="310" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="380" y="325" textAnchor="middle">Y3</text>
              <line x1="380" y1="310" x2="380" y2="338" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="330" y="338" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="380" y="353" textAnchor="middle">−$6,000</text></g>
              <line x1="480" y1="290" x2="480" y2="310" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="480" y="325" textAnchor="middle">Y4</text>
              <line x1="480" y1="310" x2="480" y2="338" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="430" y="338" width="100" height="22" rx="4" strokeWidth="0.5"/><text className="ts" x="480" y="353" textAnchor="middle">−$6,000</text></g>
              <line x1="600" y1="290" x2="600" y2="310" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="600" y="325" textAnchor="middle">Y5 만기</text>
              <line x1="600" y1="310" x2="600" y2="338" stroke="#993C1D" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="543" y="338" width="114" height="36" rx="4" strokeWidth="0.5"/><text className="ts" x="600" y="353" textAnchor="middle">−$6,000 coupon</text><text className="th" x="600" y="368" textAnchor="middle">−$100,000 원금</text></g>
              <rect x="40" y="388" width="580" height="22" rx="4" fill="#FAECE7" stroke="#993C1D" strokeWidth="0.5"/>
              <text className="ts" x="50" y="403" fill="#712B13">총 지급: $6,000×5 + $100,000 = $130,000 | 총 수령: $92,016 | 총 이자비용: $37,984</text>
            </svg>
          </div>

          {/* SVG 2 — Issuer Early Retirement */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#993C1D' }}>Issuer 관점 — Early Retirement</p>
            <svg width="100%" viewBox="0 0 680 310" role="img">
              <title>Discount Bond — Early Retirement at Y3</title>
              <desc>Discount bond 조기 상환 타임라인 Y3 103으로 매입 소각</desc>
              <defs>
                <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>
              <g className="c-coral"><rect x="40" y="14" width="130" height="22" rx="11" strokeWidth="0.5"/><text className="ts" x="105" y="29" textAnchor="middle">Issuer 관점</text></g>
              <text className="th" x="182" y="28" fill="#993C1D">Early Retirement (Y3, price 103)</text>
              <text className="ts" x="182" y="44" fill="#993C1D">Issue $92,016 / Coupon 6% / Market 8% / Y3에 103으로 조기 상환</text>
              <line x1="60" y1="90" x2="430" y2="90" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <line x1="430" y1="90" x2="620" y2="90" stroke="#993C1D" strokeWidth="1" strokeDasharray="6,4" fill="none" opacity="0.3"/>
              <text className="ts" x="520" y="82" textAnchor="middle" fill="#888">만기까지 갔다면...</text>
              <line x1="80" y1="80" x2="80" y2="100" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="80" y="114" textAnchor="middle">Y0</text>
              <line x1="80" y1="80" x2="80" y2="58" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="34" y="44" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="80" y="58" textAnchor="middle">+$92,016</text></g>
              <text className="ts" x="80" y="74" textAnchor="middle" fill="#993C1D">발행</text>
              <line x1="180" y1="80" x2="180" y2="100" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="180" y="114" textAnchor="middle">Y1</text>
              <line x1="180" y1="100" x2="180" y2="122" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="134" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="180" y="136" textAnchor="middle">−$6,000</text></g>
              <line x1="300" y1="80" x2="300" y2="100" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="300" y="114" textAnchor="middle">Y2</text>
              <line x1="300" y1="100" x2="300" y2="122" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="254" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="300" y="136" textAnchor="middle">−$6,000</text></g>
              <line x1="420" y1="76" x2="420" y2="104" stroke="#993C1D" strokeWidth="2.5" fill="none"/>
              <text className="ts" x="420" y="118" textAnchor="middle" fill="#993C1D">Y3 조기상환</text>
              <line x1="420" y1="104" x2="420" y2="130" stroke="#993C1D" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="358" y="130" width="124" height="48" rx="4" strokeWidth="0.5"/><text className="ts" x="420" y="147" textAnchor="middle">−$6,000 coupon</text><text className="th" x="420" y="163" textAnchor="middle">−$103,000 매입가</text><text className="ts" x="420" y="177" textAnchor="middle">103 × $100,000</text></g>
              <rect x="40" y="200" width="290" height="44" rx="6" fill="#FAECE7" stroke="#993C1D" strokeWidth="0.5"/>
              <text className="ts" x="52" y="218" fill="#712B13">Y3 Net CV = $100,000 − $3,554 = $96,446</text>
              <text className="ts" x="52" y="236" fill="#712B13">Reacquisition price = $103,000</text>
              <rect x="344" y="200" width="296" height="44" rx="6" fill="#fef2f2" stroke="#dc2626" strokeWidth="0.5"/>
              <text className="ts" x="356" y="218" fill="#A32D2D">Loss = $103,000 − $96,446 = $6,554</text>
              <text className="ts" x="356" y="236" fill="#A32D2D">Dr. Loss $6,554 + Dr. BP $100,000</text>
              <rect x="40" y="256" width="600" height="44" rx="6" fill="#f8f9fa" stroke="#e8e8e4" strokeWidth="0.5"/>
              <text className="ts" x="52" y="274">Dr. Bonds Payable   100,000</text>
              <text className="ts" x="52" y="290">Dr. Loss on Retirement   6,554</text>
              <text className="ts" x="320" y="274">Cr. Discount on Bonds   3,554</text>
              <text className="ts" x="320" y="290">Cr. Cash   103,000</text>
            </svg>
          </div>

          {/* SVG 3 — Investor 초기 매입 */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F6E56' }}>Investor 관점 — 초기 매입</p>
            <svg width="100%" viewBox="0 0 680 440" role="img">
              <title>Bond — Investor perspective Premium vs Discount purchase</title>
              <desc>투자자 입장에서 Premium Discount 채권 매입 후 이자 수령 타임라인</desc>
              <defs>
                <marker id="arr3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>
              <g className="c-teal"><rect x="40" y="14" width="130" height="22" rx="11" strokeWidth="0.5"/><text className="ts" x="105" y="29" textAnchor="middle">Investor 관점</text></g>
              <text className="th" x="182" y="28" fill="#0F6E56">Premium Bond 매입</text>
              <text className="ts" x="182" y="44" fill="#0F6E56">Face $100,000 / Coupon 6% / Market 4% → 매입가 $108,901</text>
              <line x1="60" y1="90" x2="640" y2="90" stroke="#534AB7" strokeWidth="1.5" fill="none" markerEnd="url(#arr3)"/>
              <line x1="80" y1="80" x2="80" y2="100" stroke="#534AB7" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="80" y="114" textAnchor="middle">Y0</text>
              <line x1="80" y1="80" x2="80" y2="52" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-purple"><rect x="28" y="38" width="104" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="80" y="52" textAnchor="middle">−$108,901 매입</text></g>
              <text className="ts" x="80" y="74" textAnchor="middle" fill="#534AB7">비쌈</text>
              <line x1="184" y1="80" x2="184" y2="100" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="184" y="114" textAnchor="middle">Y1</text>
              <line x1="184" y1="100" x2="184" y2="122" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="138" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="184" y="136" textAnchor="middle">+$6,000</text></g>
              <line x1="288" y1="80" x2="288" y2="100" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="288" y="114" textAnchor="middle">Y2</text>
              <line x1="288" y1="100" x2="288" y2="122" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="242" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="288" y="136" textAnchor="middle">+$6,000</text></g>
              <line x1="392" y1="80" x2="392" y2="100" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="392" y="114" textAnchor="middle">Y3</text>
              <line x1="392" y1="100" x2="392" y2="122" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="346" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="392" y="136" textAnchor="middle">+$6,000</text></g>
              <line x1="496" y1="80" x2="496" y2="100" stroke="#534AB7" strokeWidth="1" fill="none"/>
              <text className="ts" x="496" y="114" textAnchor="middle">Y4</text>
              <line x1="496" y1="100" x2="496" y2="122" stroke="#534AB7" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="450" y="122" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="496" y="136" textAnchor="middle">+$6,000</text></g>
              <line x1="608" y1="80" x2="608" y2="100" stroke="#534AB7" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="608" y="114" textAnchor="middle">Y5 만기</text>
              <line x1="608" y1="100" x2="608" y2="122" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-purple"><rect x="546" y="122" width="124" height="34" rx="4" strokeWidth="0.5"/><text className="ts" x="608" y="139" textAnchor="middle">+$6,000 coupon</text><text className="th" x="608" y="153" textAnchor="middle">+$100,000 원금</text></g>
              <rect x="40" y="170" width="600" height="22" rx="4" fill="#EEEDFE" stroke="#534AB7" strokeWidth="0.5"/>
              <text className="ts" x="52" y="185" fill="#3C3489">총 수령: $130,000 — 매입가: $108,901 — 실제 수익: $21,099 → 실효수익률 = 4%</text>
              <text className="th" x="182" y="222" fill="#0F6E56">Discount Bond 매입</text>
              <text className="ts" x="182" y="238" fill="#0F6E56">Face $100,000 / Coupon 6% / Market 8% → 매입가 $92,016</text>
              <line x1="60" y1="280" x2="640" y2="280" stroke="#993C1D" strokeWidth="1.5" fill="none" markerEnd="url(#arr3)"/>
              <line x1="80" y1="270" x2="80" y2="290" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="80" y="304" textAnchor="middle">Y0</text>
              <line x1="80" y1="270" x2="80" y2="242" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="28" y="228" width="104" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="80" y="242" textAnchor="middle">−$92,016 매입</text></g>
              <text className="ts" x="80" y="264" textAnchor="middle" fill="#993C1D">쌈</text>
              <line x1="184" y1="270" x2="184" y2="290" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="184" y="304" textAnchor="middle">Y1</text>
              <line x1="184" y1="290" x2="184" y2="312" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="138" y="312" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="184" y="326" textAnchor="middle">+$6,000</text></g>
              <line x1="288" y1="270" x2="288" y2="290" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="288" y="304" textAnchor="middle">Y2</text>
              <line x1="288" y1="290" x2="288" y2="312" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="242" y="312" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="288" y="326" textAnchor="middle">+$6,000</text></g>
              <line x1="392" y1="270" x2="392" y2="290" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="392" y="304" textAnchor="middle">Y3</text>
              <line x1="392" y1="290" x2="392" y2="312" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="346" y="312" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="392" y="326" textAnchor="middle">+$6,000</text></g>
              <line x1="496" y1="270" x2="496" y2="290" stroke="#993C1D" strokeWidth="1" fill="none"/>
              <text className="ts" x="496" y="304" textAnchor="middle">Y4</text>
              <line x1="496" y1="290" x2="496" y2="312" stroke="#993C1D" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="450" y="312" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="496" y="326" textAnchor="middle">+$6,000</text></g>
              <line x1="608" y1="270" x2="608" y2="290" stroke="#993C1D" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="608" y="304" textAnchor="middle">Y5 만기</text>
              <line x1="608" y1="290" x2="608" y2="312" stroke="#993C1D" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-coral"><rect x="546" y="312" width="124" height="34" rx="4" strokeWidth="0.5"/><text className="ts" x="608" y="329" textAnchor="middle">+$6,000 coupon</text><text className="th" x="608" y="343" textAnchor="middle">+$100,000 원금</text></g>
              <rect x="40" y="360" width="600" height="22" rx="4" fill="#FAECE7" stroke="#993C1D" strokeWidth="0.5"/>
              <text className="ts" x="52" y="375" fill="#712B13">총 수령: $130,000 — 매입가: $92,016 — 실제 수익: $37,984 → 실효수익률 = 8%</text>
              <rect x="40" y="392" width="600" height="36" rx="6" fill="#E1F5EE" stroke="#0F6E56" strokeWidth="0.5"/>
              <text className="ts" x="52" y="407" fill="#085041">핵심: 매년 받는 Coupon은 동일 ($6,000) — 차이는 초기 매입가</text>
              <text className="ts" x="52" y="421" fill="#085041">Premium 비싸게 사서 수익률 낮음 (4%) / Discount 싸게 사서 수익률 높음 (8%)</text>
            </svg>
          </div>

          {/* SVG 4 — Investor Between-date Purchase */}
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F6E56' }}>Investor 관점 — Between-date Purchase</p>
            <svg width="100%" viewBox="0 0 680 360" role="img">
              <title>Discount Bond — Between-date Purchase Investor perspective</title>
              <desc>투자자가 Y2와 Y3 사이 10/31에 채권을 매입하는 타임라인</desc>
              <defs>
                <marker id="arr4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>
              <g className="c-teal"><rect x="40" y="14" width="130" height="22" rx="11" strokeWidth="0.5"/><text className="ts" x="105" y="29" textAnchor="middle">Investor 관점</text></g>
              <text className="th" x="182" y="28" fill="#0F6E56">Between-date Purchase</text>
              <text className="ts" x="182" y="44" fill="#0F6E56">Face $100,000 / Coupon 6% / Market 8% / 10/31에 매입 (Y2 6/30 이후)</text>
              <text className="ts" x="182" y="58" fill="#0F6E56">Coupon dates: 6/30 and 12/31 (반년 지급)</text>
              <line x1="60" y1="110" x2="630" y2="110" stroke="#0F6E56" strokeWidth="1.5" fill="none" markerEnd="url(#arr4)"/>
              <line x1="80" y1="100" x2="80" y2="120" stroke="#888" strokeWidth="1" fill="none"/>
              <text className="ts" x="80" y="134" textAnchor="middle" fill="#888">Y0</text>
              <text className="ts" x="80" y="146" textAnchor="middle" fill="#888">발행</text>
              <line x1="160" y1="100" x2="160" y2="120" stroke="#888" strokeWidth="1" fill="none"/>
              <text className="ts" x="160" y="134" textAnchor="middle" fill="#888">6/30 Y1</text>
              <line x1="240" y1="100" x2="240" y2="120" stroke="#888" strokeWidth="1" fill="none"/>
              <text className="ts" x="240" y="134" textAnchor="middle" fill="#888">12/31 Y1</text>
              <line x1="340" y1="100" x2="340" y2="120" stroke="#888" strokeWidth="1" fill="none"/>
              <text className="ts" x="340" y="134" textAnchor="middle" fill="#888">6/30 Y2</text>
              <line x1="340" y1="120" x2="340" y2="142" stroke="#888" strokeWidth="1" strokeDasharray="3,2" fill="none"/>
              <g className="c-gray"><rect x="294" y="142" width="92" height="20" rx="4" strokeWidth="0.5"/><text className="ts" x="340" y="156" textAnchor="middle">$3,000 지급</text></g>
              <rect x="340" y="86" width="130" height="14" rx="3" fill="#E1F5EE" stroke="#0F6E56" strokeWidth="0.5"/>
              <text className="ts" x="405" y="97" textAnchor="middle" fill="#0F6E56">Accrued: 4개월</text>
              <line x1="470" y1="76" x2="470" y2="124" stroke="#0F6E56" strokeWidth="2.5" fill="none"/>
              <text className="ts" x="470" y="138" textAnchor="middle" fill="#0F6E56">10/31</text>
              <text className="th" x="470" y="150" textAnchor="middle" fill="#0F6E56">매입</text>
              <line x1="470" y1="124" x2="470" y2="170" stroke="#0F6E56" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-teal"><rect x="390" y="170" width="160" height="48" rx="4" strokeWidth="0.5"/><text className="th" x="470" y="188" textAnchor="middle">매입가 (CV)</text><text className="ts" x="470" y="204" textAnchor="middle">+ Accrued Interest</text><text className="ts" x="470" y="218" textAnchor="middle">$3,000 × 4/6 = $2,000</text></g>
              <line x1="580" y1="100" x2="580" y2="120" stroke="#0F6E56" strokeWidth="1.5" fill="none"/>
              <text className="ts" x="580" y="134" textAnchor="middle" fill="#0F6E56">12/31</text>
              <line x1="580" y1="120" x2="580" y2="142" stroke="#0F6E56" strokeWidth="1.5" strokeDasharray="3,2" fill="none"/>
              <g className="c-teal"><rect x="524" y="142" width="112" height="34" rx="4" strokeWidth="0.5"/><text className="ts" x="580" y="158" textAnchor="middle">+$3,000 수령</text><text className="ts" x="580" y="172" textAnchor="middle">(전액 현금)</text></g>
              <rect x="40" y="240" width="600" height="100" rx="8" fill="#E1F5EE" stroke="#0F6E56" strokeWidth="0.5"/>
              <text className="th" x="56" y="260" fill="#085041">왜 Accrued Interest를 별도로 지급하나?</text>
              <text className="ts" x="56" y="278" fill="#0F6E56">6/30 이후 이자는 이미 발생 중 — 매입자가 6/30~10/31 (4개월) 이자를 전 보유자에게 보상</text>
              <text className="ts" x="56" y="296" fill="#0F6E56">12/31에 $3,000 전액 수령 → 그 중 $2,000은 매입 시 지급한 것 돌려받는 것</text>
              <text className="ts" x="56" y="314" fill="#0F6E56">실제 이자 수익 = $3,000 − $2,000 = $1,000 (보유 2개월, 10/31~12/31)</text>
              <text className="th" x="56" y="332" fill="#085041">매입가 = CV (장부가) / Accrued Interest = 별도 자산 계정</text>
            </svg>
          </div>

        </div>
      </Section>

      <Section title="1. Overview">
        <Table
          headers={['', 'Market Rate vs Coupon', 'Issue Price vs Face']}
          rows={[
            ['Premium', 'Market < Coupon', 'Issue > Face'],
            ['Discount', 'Market > Coupon', 'Issue < Face'],
          ]}
        />
      </Section>

      <Section title="2. PV Calculation — Factor Sources">
        <p style={{ marginBottom: 8 }}>
          <strong>Issue Price = PV of Coupons (Annuity factor) + PV of Principal (PV of $1 factor)</strong>
        </p>
        <CodeBlock>{`Step 1: Coupon = Face × Coupon rate (고정, 절대 안 바뀜)
  $100,000 × 6% = $6,000/yr

Step 2: PV of Coupons = Coupon × Annuity factor (Ordinary or Due — see table below)
  Factor source: rate = MARKET RATE (yield), n = lease term
  ⚠ Coupon rate 6%로 factor 찾으면 → 오답

Step 3: PV of Principal = Face × PV of $1 factor
  Factor source: rate = MARKET RATE (yield), n = years to maturity

Premium (Coupon 6% / Market 4% / 5yr):
  PV of Coupons   = $6,000 × 4.4518 = $26,711
                            ↑ Annuity factor (rate=4%, n=5)
  PV of Principal = $100,000 × 0.8219 = $82,190
                              ↑ PV of $1 factor (rate=4%, n=5)
  Issue Price = $108,901 → Premium $8,901

Discount (Coupon 6% / Market 8% / 5yr):
  PV of Coupons   = $6,000 × 3.9927 = $23,956
                            ↑ Annuity factor (rate=8%, n=5)
  PV of Principal = $100,000 × 0.6806 = $68,060
                              ↑ PV of $1 factor (rate=8%, n=5)
  Issue Price = $92,016 → Discount $7,984`}</CodeBlock>
        <Table
          headers={['조건', 'Factor', '신호 키워드']}
          rows={[
            ['기말 납부 (default)', 'Ordinary Annuity factor', '명시 없으면 항상 이것'],
            ['기초 납부', 'Annuity Due factor', '"first payment on issue date" / "beginning of period"'],
          ]}
        />
        <p style={{ fontSize: 12.5, marginTop: 8 }}>
          <strong>Annuity Due factor 계산 (PV table 제공 시):</strong>
        </p>
        <CodeBlock>{`Method 1 (권장): PV factor(n−1, rate) + 1.0000
Method 2:         PV factor(n, rate) × (1 + rate)
→ 두 방법 동일 결과, Method 1이 소수점 오차 없음`}</CodeBlock>
        <TrapBox items={[
          'Coupon $6,000 계산 → Coupon rate 6% 사용 ✓ (고정)',
          'PV factor 선택 → Market rate (yield) 기준 ✓',
          'PV factor를 Coupon rate 6%로 찾으면 → 오답 ✗',
          '"sold to yield X%" → X%가 PV factor 기준 (yield = market rate)',
        ]} />
      </Section>

      <Section title="3. Journal Entries — Issuance">
        <CodeBlock>{`Premium:
  Dr. Cash            108,000
    Cr. Bonds Payable          100,000
    Cr. Premium on Bonds         8,000

Discount:
  Dr. Cash             92,000
  Dr. Discount on Bonds  8,000
    Cr. Bonds Payable          100,000`}</CodeBlock>
      </Section>

      <Section title="4. Straight-Line Amortization (SL) — Premium Example">
        <Table
          headers={['Year', 'Int Exp', 'Cash Paid', 'Amort', 'Carrying Value']}
          rows={[
            ['1', '4,400', '6,000', '1,600', '106,400'],
            ['2', '4,400', '6,000', '1,600', '104,800'],
            ['3', '4,400', '6,000', '1,600', '103,200'],
            ['4', '4,400', '6,000', '1,600', '101,600'],
            ['5', '4,400', '6,000', '1,600', '100,000'],
          ]}
        />
        <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
          SL Amort = $8,000 premium ÷ 5 years = $1,600/yr
        </p>
      </Section>

      <Section title="5. Effective Interest (EI) — Premium (108,000 × 4%)">
        <Table
          headers={['Year', 'Int Exp (BV×4%)', 'Cash Paid', 'Amort', 'Ending BV']}
          rows={[
            ['1', '4,320', '6,000', '1,680', '106,320'],
            ['2', '4,253', '6,000', '1,747', '104,573'],
            ['3', '4,183', '6,000', '1,817', '102,756'],
            ['4', '4,110', '6,000', '1,890', '100,866'],
            ['5', '4,035*', '6,000', '1,965', '100,000'],
          ]}
        />
      </Section>

      <Section title="6. Effective Interest (EI) — Discount (92,000 × 8%)">
        <Table
          headers={['Year', 'Int Exp (BV×8%)', 'Cash Paid', 'Amort', 'Ending BV']}
          rows={[
            ['1', '7,360', '6,000', '1,360', '93,360'],
            ['2', '7,469', '6,000', '1,469', '94,829'],
            ['3', '7,586', '6,000', '1,586', '96,415'],
            ['4', '7,713', '6,000', '1,713', '98,128'],
            ['5', '7,872*', '6,000', '1,872', '100,000'],
          ]}
        />
      </Section>

      <Section title="7. Early Retirement">
        <CodeBlock>{`Net Carrying Value = Face ± Unamortized Premium/Discount
Gain/Loss = Net CV − Reacquisition Price
→ Reported on Income Statement (ordinary item)`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: '상각법: Effective Interest Method', changed: '"straight-line method" 명시 시만 SL 사용' },
        { default: '납부 시점: Ordinary Annuity / 기말', changed: '"first payment on issue date" → Annuity Due' },
      ]} />
      <TrapBox items={[
        '"sold to yield X%" → use X% as the discount factor only',
        'Never omit Principal PV from issue price calculation',
        'SL vs EI: BV differs at interim dates → early retirement produces different gain/loss',
      ]} />
      <Section title="Stock Warrants with Bonds">
        <Table
          headers={['구분', 'Detachable', 'Non-detachable']}
          rows={[
            ['분리 거래', '가능', '불가'],
            ['발행 시', 'Warrant FV → APIC 선인식', '전액 Bonds Payable'],
            ['행사 시', 'APIC-Warrants → C/S + APIC 재분류', 'Bonds Payable → C/S + APIC'],
            ['자본 인식 시점', '발행 시', '행사 시'],
            ['부분 행사', '가능', '가능'],
          ]}
        />
        <p style={{ fontWeight: 700, margin: '16px 0 6px' }}>[Detachable 발행 시 계산]</p>
        <CodeBlock>{`총 발행액 = Face × issue price%
Warrant FV = 개수 × FV per warrant → APIC
채권 CV = 총 발행액 − Warrant FV → Long-term debt

예시: Face $4M × 101% = $4,040,000 / Warrant 200,000개 × $1 = $200,000
→ 채권 CV = $4,040,000 − $200,000 = $3,840,000`}</CodeBlock>
        <p style={{ fontWeight: 700, margin: '16px 0 6px' }}>[분개]</p>
        <CodeBlock>{`발행 시 (Detachable):
Dr. Cash                 $4,040,000
    Cr. Bonds Payable    $3,840,000
    Cr. APIC-Warrants      $200,000

행사 시 (Detachable, no par C/S):
Dr. Cash (행사가 × 주수)
Dr. APIC-Warrants
    Cr. Common Stock (전액)

발행 시 (Non-detachable):
Dr. Cash                 $4,040,000
    Cr. Bonds Payable    $4,040,000

행사 시 (Non-detachable):
Dr. Bonds Payable (행사 비율)
    Cr. Common Stock
    Cr. APIC`}</CodeBlock>
        <p style={{ fontWeight: 700, margin: '16px 0 6px' }}>[Warrant &amp; EPS 연결]</p>
        <CodeBlock>{`In the money (시장가 > 행사가) → TSM 적용 → WASO 증가 → Dilutive
Out of the money (시장가 < 행사가) → 아무도 행사 안 함 → Antidilutive → 제외

TSM 순증가 주식수 = 발행 주식수 − (행사대금 / 시장가)`}</CodeBlock>
        <p style={{ fontWeight: 700, margin: '16px 0 6px' }}>[Warrant vs Stock Options]</p>
        <CodeBlock>{`공통: TSM 적용 / In the money → Dilutive / 행사 시 C/S + APIC
차이:
  Warrant      → 외부 투자자 / 자금 조달 / 발행 시 APIC 직접 인식 (비용 아님)
  Stock Option → 임직원 보상 / 발행 시 Compensation Expense + APIC`}</CodeBlock>
        <p style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px', color: '#0369a1', fontStyle: 'italic', marginTop: 12 }}>
          Memory: "detachable = 발행 시 분리 / non-detachable = 행사 시 같이 전환"
        </p>
      </Section>

      <Section title="Key Terms — Bond">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['Coupon rate', 'Stated rate / Nominal rate / Contract rate', '고정, 절대 안 바뀜'],
            ['Market rate', 'Yield / Effective rate / Required rate of return', 'PV factor 기준'],
            ['Face value', 'Par value / Maturity value / Principal / Stated value', '만기 상환 원금'],
            ['Carrying value', 'Carrying amount / Book value / Amortized cost', 'Face ± Unamortized prem/disc'],
            ['Premium on Bonds', 'Unamortized premium', 'B/S에서 Bonds Payable 가산'],
            ['Discount on Bonds', 'Unamortized discount', 'B/S에서 Bonds Payable 차감'],
            ['Early retirement', 'Extinguishment / Redemption before maturity', 'Gain/Loss → I/S'],
          ]}
        />
      </Section>

      <Section title="Question Type → Speed Guide">
        <p style={{ marginBottom: 12, color: '#555', fontSize: 13 }}>
          Bond 문제는 동일한 숫자 세트로 6가지 다른 것을 물어본다. 질문 첫 줄에서 유형을 파악하면 계산 로직이 즉시 결정된다.
        </p>
        <Table
          headers={['질문 키워드', '즉각 풀이 로직', '주의']}
          rows={[
            [
              '① "bonds payable on the balance sheet"',
              'CV = Face ± unamortized disc/prem',
              'face value 그대로 = 오답'
            ],
            [
              '② "interest expense for the period"',
              'Beginning CV × market rate × m/12',
              'face × coupon rate 혼동 금지'
            ],
            [
              '③ "cash paid for interest"',
              'Face × coupon rate × m/12',
              'CV와 무관 — 항상 face 기준'
            ],
            [
              '④ "carrying value at [interim date]"',
              '연간상각액 = (CV×market) − (Face×coupon) → ×m/12 → CV ± 상각액',
              'interim date → 반드시 ×m/12'
            ],
            [
              '⑤ "gain or loss on early retirement"',
              'CV at retirement date 먼저 계산 → Gain/Loss = CV − reacquisition price',
              'CV 계산 생략하면 틀림'
            ],
            [
              '⑥ issuer vs investor',
              'Issuer: Bonds Payable / Interest Expense | Investor: Bond Investment / Interest Income',
              '"issued" → issuer / "purchased" → investor'
            ],
          ]}
        />
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 16px', marginTop: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 6, color: '#92400e' }}>⚡ 1-line Speed Rule</p>
          <CodeBlock>{`B/S       → CV (never face alone)
Int Exp   → BegCV × market rate
Cash Int  → Face × coupon rate
Interim   → annual amort × m/12
Retire    → CV − reacquisition price
Issuer    → liability side / Investor → asset side`}</CodeBlock>
        </div>
      </Section>
    </div>
  )
}

function PartnershipContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <Section title="Overview — Partnership">
        <p><strong>Partnership</strong> = 2인 이상이 공동으로 영위하는 사업체. 법인세 없음, 손익은 파트너 자본계정으로 직접 배분.</p>
        <p style={{ color: '#555', marginTop: 6 }}>Pass-through entity: 세금은 각 파트너 개인 소득세로 과세됨.</p>
        <p style={{ marginTop: 12, fontWeight: 600 }}>5단계 Lifecycle:</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {['① Formation', '② Income Allocation', '③ Admission', '④ Withdrawal', '⑤ Liquidation'].map((s, i) => (
            <span key={i} style={{ background: '#eef0ff', color: '#4338ca', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 600 }}>{s}</span>
          ))}
        </div>
      </Section>

      <Section title="① Formation (설립)">
        <p><strong>Capital Account = FMV of assets contributed − liabilities assumed</strong></p>
        <p style={{ color: '#555', marginTop: 4 }}>장부가·원가 무관. 이익배분비율 ≠ Capital 잔액.</p>
        <p style={{ marginTop: 12, fontWeight: 600 }}>예시:</p>
        <Table
          headers={['파트너', '기여 자산', 'Capital']}
          rows={[
            ['Reed', 'Cash $80,000', '$80,000'],
            ['Stone', 'Equipment FMV $120,000 − Mortgage $50,000', '$70,000'],
          ]}
        />
        <CodeBlock>{`Dr. Cash               80,000
Dr. Equipment         120,000
    Cr. Mortgage Payable          50,000
    Cr. Capital-Reed              80,000
    Cr. Capital-Stone             70,000`}</CodeBlock>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Trap</p>
          <p style={{ fontSize: 13, color: '#555' }}>장부가 사용 → 오답 / Mortgage 미차감 → 오답 / 이익배분비율 = Capital 혼동 → 오답</p>
        </div>
      </Section>

      <Section title="② Income Allocation (이익 배분)">
        <p><strong>순서:</strong> ① Salary allowance → ② Interest on capital → ③ 잔여 P&L ratio</p>
        <p style={{ color: '#555', marginTop: 4 }}>잔여 {'>'} 0 → profit ratio / 잔여 {'<'} 0 → <strong>loss ratio</strong> (profit ratio 아님)</p>
        <p style={{ marginTop: 12, fontWeight: 600 }}>예시 — 잔여 음수 케이스:</p>
        <CodeBlock>{`NI $80,000 / Reed salary $60,000 / Stone salary $40,000
잔여 = $80,000 − $100,000 = −$20,000 (Loss)

Reed:  $60,000 − ($20,000 × 60%) = $48,000
Stone: $40,000 − ($20,000 × 40%) = $32,000
합계: $80,000 ✓`}</CodeBlock>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Trap</p>
          <p style={{ fontSize: 13, color: '#555' }}>잔여 음수인데 profit ratio 적용 → 오답 / Salary를 이익 내에서만 지급한다고 착각 → 오답</p>
        </div>
      </Section>

      <Section title="③ / ④ Admission & Withdrawal — Bonus vs Goodwill">
        <Table
          headers={['항목', 'Bonus Method', 'Goodwill Method']}
          rows={[
            ['총자산 변화', '없음', 'Goodwill만큼 증가'],
            ['나머지 파트너 자본', '조정됨 (±)', '변동 없음'],
            ['Goodwill 인식', '없음', '있음'],
            ['나머지 자본 감소 가능', 'Yes', 'No'],
          ]}
        />
        <p style={{ marginTop: 16, fontWeight: 600 }}>Admission — Bonus Method</p>
        <p style={{ color: '#555', fontSize: 13, marginBottom: 6 }}>Reed $100,000 / Stone $100,000 / Lane $70,000 납입 → 30% 약정</p>
        <CodeBlock>{`Lane 취득자본 = ($200,000 + $70,000) × 30% = $81,000
차액 $11,000 → Reed·Stone 각 $5,500 차감

Dr. Cash              70,000
Dr. Capital-Reed       5,500
Dr. Capital-Stone      5,500
    Cr. Capital-Lane          81,000`}</CodeBlock>
        <p style={{ marginTop: 12, fontWeight: 600 }}>Admission — Goodwill Method</p>
        <CodeBlock>{`implied FMV = $70,000 ÷ 30% = $233,333
Goodwill = $233,333 − $200,000 = $33,333

Dr. Cash              70,000
Dr. Goodwill          33,333
    Cr. Capital-Reed          16,667
    Cr. Capital-Stone         16,667
    Cr. Capital-Lane          70,000`}</CodeBlock>
        <p style={{ marginTop: 12, fontWeight: 600 }}>Withdrawal — Bonus Method</p>
        <p style={{ color: '#555', fontSize: 13, marginBottom: 6 }}>Reed 자본 $100,000 / 지급 $130,000 / 초과 $30,000</p>
        <CodeBlock>{`Dr. Capital-Reed     100,000
Dr. Capital-Stone     15,000
Dr. Capital-Lane      15,000
    Cr. Cash                  130,000
→ 나머지 자본 감소`}</CodeBlock>
        <p style={{ marginTop: 12, fontWeight: 600 }}>Withdrawal — Goodwill Method</p>
        <CodeBlock>{`Dr. Goodwill          30,000
Dr. Capital-Reed     100,000
    Cr. Cash                  130,000
→ 나머지 자본 변동 없음`}</CodeBlock>
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Key</p>
          <p style={{ fontSize: 13, color: '#555' }}>나머지 자본 <strong>감소</strong> → Bonus only / 나머지 자본 <strong>불변</strong> → Goodwill only</p>
        </div>
      </Section>

      <Section title="⑤ Liquidation (해체)">
        <p><strong>지급 우선순위:</strong></p>
        <Table
          headers={['순위', '대상', '비고']}
          rows={[
            ['1순위', '외부 채권자 (Creditors)', '전액 상환 후 다음 단계'],
            ['2순위', '파트너 대여금 (Partner loans)', '파트너가 파트너십에 빌려준 돈'],
            ['3순위', '파트너 자본계정 (Capital)', 'P&L 비율로 배분'],
          ]}
        />
        <p style={{ marginTop: 12, fontWeight: 600 }}>예시:</p>
        <CodeBlock>{`자산 $200,000 / 채권자 $80,000 / Partner loans $40,000
잔여 Capital $80,000 (Reed 60% / Stone 40%)

① Dr. Liabilities         80,000 / Cr. Cash  80,000
② Dr. Partner Loans       40,000 / Cr. Cash  40,000
③ Dr. Capital-Reed        48,000
   Dr. Capital-Stone       32,000
       Cr. Cash                    80,000`}</CodeBlock>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Trap</p>
          <p style={{ fontSize: 13, color: '#555' }}>채권자 미상환 후 파트너 분배 → 오답 / loans와 Capital 순서 바꿈 → 오답</p>
        </div>
      </Section>

      <Section title="Sole Proprietorship — Capital Account">
        <p><strong>Capital = 매입가 + 순이익 − Drawings</strong></p>
        <p style={{ color: '#555', marginTop: 4 }}>장부가(carrying amount)·시장가(market value) → 무관, 절대 사용 금지.</p>
        <p style={{ marginTop: 12, fontWeight: 600 }}>예시:</p>
        <CodeBlock>{`Smith가 Jones' Cleaning을 $350,000에 매입
순이익 $60,000 / Drawings $20,000

Capital-Smith = $350,000 + $60,000 − $20,000 = $390,000
(장부가 $375,000, 시장가 $360,000 → 둘 다 무관)`}</CodeBlock>
        <Table
          headers={['항목', '설명']}
          rows={[
            ['매입가 기준 이유', '새 소유자 Smith의 투자원금 = 실제 지불액 / 이전 소유자 장부가와 무관'],
            ['Drawings', '법인의 Dividends와 동일 구조 → 자본 직접 차감 / Expense 아님'],
          ]}
        />
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Speed Rule</p>
          <p style={{ fontSize: 13, color: '#555' }}>매입가 시작 → +순이익 → −Drawings → 끝 / 다른 숫자 전부 무시</p>
        </div>
      </Section>

    </div>
  )
}

function TdrContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is TDR?</strong> Troubled Debt Restructuring = 채무자 재정 어려움 시 채권자가 조건을 완화해주는 거래.</p>
        <p style={{ color: '#555', marginTop: 6 }}>(채권자 입장에서는 손해 감수, 채무자 입장에서는 이익)</p>
        <p style={{ marginTop: 12 }}><strong>Two types:</strong></p>
        <Table
          headers={['Type', '설명']}
          rows={[
            ['① Asset Transfer', '자산을 넘겨 부채 소멸'],
            ['② Debt Modification', '이자율/만기 조건 변경'],
          ]}
        />
      </Section>

      <Section title="1. Asset Transfer — Debtor 관점">
        <p>두 가지 손익 항상 별도 인식:</p>
        <Table
          headers={['손익', '공식', '방향']}
          rows={[
            ['① Ordinary gain/loss', '자산 CA − 자산 FV', 'CA > FV → loss'],
            ['② Restructuring gain', '부채 CA − 자산 FV', '시험에서 사실상 항상 gain'],
          ]}
        />
        <p style={{ marginTop: 12 }}><strong>예시:</strong> 부채 CA $150,000 / 자산 CA $100,000 / 자산 FV $90,000</p>
        <CodeBlock>{`① Ordinary loss    = $100,000 − $90,000 = $(10,000)
② Restructuring gain = $150,000 − $90,000 = $60,000

Journal Entry:
Dr. Liability                150,000
Dr. Loss on asset transfer    10,000
  Cr. Real Estate (at FV)              90,000
  Cr. Gain on restructuring            60,000
  Cr. Real Estate write-down           10,000`}</CodeBlock>
      </Section>

      <Section title="2. Debt Modification — Debtor 관점">
        <p>Future cash flows (이자 + 원금) 합계 vs 부채 장부가 비교:</p>
        <Table
          headers={['비교 결과', '처리']}
          rows={[
            ['Future CF > 부채 CV', 'No gain (이자율 조정만)'],
            ['Future CF < 부채 CV', 'Gain on restructuring 인식'],
          ]}
        />
      </Section>

      <Section title="3. Creditor 관점">
        <p>채권자는 gain 없음.</p>
        <p style={{ marginTop: 4 }}>FV of asset received − 채권 장부가 = Loss만 인식.</p>
      </Section>

      <DefaultBox items={[
        { default: 'Debtor 관점 (default)', changed: '"creditor" 명시 시 → loss만 인식' },
      ]} />

      <TrapBox items={[
        '"gain on restructuring" → ② 부채 CA − 자산 FV',
        '"loss on transfer" → ① 자산 CA − 자산 FV',
        '② 계산 시 자산 CA 사용 → 오답 (반드시 FV 기준)',
        '두 손익 합산 → 오답 (I/S에 별도 항목)',
        'Creditor gain 인식 → 오답',
      ]} />

      <Section title="⏱ SPEED">
        <CodeBlock>{`숫자 3개 (부채CA / 자산CA / 자산FV) 보이면:
→ 질문 방향 먼저 확인 (① or ②)
→ 항상 FV 기준으로 계산`}</CodeBlock>
      </Section>

      <Section title="Key Terms — TDR">
        <Table
          headers={['Term', 'Note']}
          rows={[
            ['TDR', 'Troubled Debt Restructuring'],
            ['Debtor', '채무자 — 두 가지 gain/loss 인식'],
            ['Creditor', '채권자 — loss만 인식'],
            ['Restructuring gain', '부채 CA − 자산 FV'],
            ['Ordinary loss', '자산 CA − 자산 FV'],
            ['Asset Transfer', '자산으로 부채 소멸'],
            ['Debt Modification', '조건 변경 (이자율/만기)'],
          ]}
        />
      </Section>
    </div>
  )
}

function LeaseContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is a Lease?</strong> A contract giving the lessee the right to use an asset for periodic payments.</p>
        <p style={{ color: '#555', marginTop: 6 }}>자산을 사지 않고 빌려 쓰는 계약. 경제적 실질로 "소유"와 같으면 B/S에 올려야 정직한 재무제표가 됨.</p>
        <p style={{ marginTop: 12 }}><strong>Finance vs Operating?</strong></p>
        <p style={{ color: '#555' }}>Finance Lease = 실질적 소유 / Operating = 단순 임차. 어느 쪽이든 ASC 842 이후 B/S에 ROU Asset + Lease Liability 계상.</p>
        <CodeBlock>{`Finance Lease Example:
  Payment $20,000 / Rate 6% / 5yr
  ROU Asset = Lease Liability = $84,248
  Year 1: Interest $5,055 / Principal $14,945`}</CodeBlock>
        <p style={{ color: '#555', marginTop: 8, fontStyle: 'italic' }}>Memory: Finance Lease = 할부로 사는 것. Operating Lease = 호텔방 — 쓰고 나면 내 것이 아님.</p>
      </Section>
      <Section title="Finance Lease — Classification (TBORTS)">
        <Table
          headers={['Criterion', 'Threshold']}
          rows={[
            ['T — Title Transfer', 'Ownership passes at end'],
            ['B — Bargain Purchase Option', 'BPO likely exercised'],
            ['O — Lease term ≥ 75%', '≥ 75% of economic life'],
            ['R — PV ≥ 90%', 'PV of payments ≥ 90% of FV'],
            ['S — Specialized asset', 'No alternative use to lessor'],
          ]}
        />
      </Section>

      <Section title="Finance Lease — Day 1 Entry">
        <CodeBlock>{`Dr. ROU Asset          84,248
  Cr. Lease Liability          84,248
  (= PV of future payments)`}</CodeBlock>
      </Section>

      <Section title="Finance Lease — Amortization Table ($20K/yr, 6%, 5yr, PV=84,248)">
        <Table
          headers={['Year', 'Int Exp (BV×6%)', 'Payment', 'Principal', 'Ending BV']}
          rows={[
            ['1', '5,055', '20,000', '14,945', '69,303'],
            ['2', '4,158', '20,000', '15,842', '53,461'],
            ['3', '3,208', '20,000', '16,792', '36,669'],
            ['4', '2,200', '20,000', '17,800', '18,869'],
            ['5', '1,131', '20,000', '18,869', '0'],
          ]}
        />
      </Section>

      <Section title="Annuity Due vs Ordinary Annuity">
        <CodeBlock>{`Ordinary Annuity  → payments at END of period
Annuity Due       → payments at BEGINNING of period
                   PV(Due) = PV(Ordinary) × (1 + r)
                   → Due is LARGER (first payment discounted 0 periods)`}</CodeBlock>
      </Section>

      <Section title="Rate Priority">
        <CodeBlock>{`1st choice: Implicit rate (if known to lessee)
2nd choice: Incremental Borrowing Rate (IBR)`}</CodeBlock>
      </Section>

      <Section title="Operating Lease (ASC 842)">
        <CodeBlock>{`I/S: Straight-line lease expense (uniform each period)
B/S: ROU Asset + Lease Liability (both recognized)

ROU Amortization (plug):
  ROU Amort = SL Expense − Interest Expense`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Rate: IBR', changed: '"rate implicit in the lease known to lessee" → Implicit rate 우선 (IBR 사용 불가)' },
        { default: '납부 시점: Ordinary Annuity / 기말', changed: '"first payment on commencement date" → Annuity Due (첫 납부 이자 없음)' },
        { default: 'ROU 상각 기간: Lease term', changed: 'T(title transfer) 또는 B(BPO) 충족 시 → Useful life로 상각' },
      ]} />
      <TrapBox items={[
        'Annuity Due vs Ordinary: Due → first payment today → higher PV',
        'Implicit rate available → must use it, not IBR',
        'Operating lease: I/S = SL expense; B/S liability = EI basis (different!)',
      ]} />
      <Section title="Key Terms — Lease">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['Implicit rate', 'Rate implicit in the lease', 'Lessee가 알면 반드시 사용'],
            ['IBR', 'Incremental Borrowing Rate', 'Implicit rate 모를 때만'],
            ['ROU Asset', 'Right-of-Use Asset', 'Finance Lease B/S 인식 자산'],
            ['Annuity Due', 'Payments in advance, beginning of period', '첫 납부 이자 없음'],
            ['Ordinary Annuity', 'Annuity in arrears, end of period', '디폴트 — 명시 없으면 기말'],
            ['BPO', 'Bargain Purchase Option', 'reasonably certain 행사 조건 필요'],
            ['RVG', 'Residual Value Guarantee', 'PV of $1 factor 적용 (Annuity 아님)'],
          ]}
        />
        <CodeBlock>{`Finance Lease Initial Liability / ROU Asset:
= PV of lease payments (using Implicit rate or IBR)
= Ordinary Annuity payments × PVA factor (rate, n)
  + RVG × PV of $1 factor (rate, n)

Rate precedence: Implicit rate > IBR
75% test: Lease term ÷ Economic useful life ≥ 75%
90% test: PV of payments ÷ Fair value ≥ 90%`}</CodeBlock>
      </Section>
    </div>
  )
}

function NoteContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is a Note Payable?</strong> A written promise to repay borrowed money with interest.</p>
        <p style={{ color: '#555', marginTop: 6 }}>차용증 — Payment에는 이자 + 원금이 섞여 있어. 이자비용만 따로 계산해야 정확한 I/S 반영 가능.</p>
        <CodeBlock>{`Interest Expense = Beginning balance × rate × m/12
Principal       = Payment − Interest (Plug-in)

Example (Borrowed Sep 30 / $1,000,000 / 9%):
  Interest (Oct–Dec) = $1,000,000 × 9% × 3/12 = $22,500
  ⚠ Payment $264,200 직접 사용 → 절대 금지`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Payment = 이자 + 원금 섞인 덩어리. 항상 이자 먼저 계산, 나머지가 원금.</p>
      </Section>
      <Section title="Interest Calculation">
        <CodeBlock>{`Interest = Beginning Principal × Rate × (months / 12)

Example: Borrowed $1,000,000 on Sep 30 @ 9%
  → 3 months remain in year
  → Interest = $1,000,000 × 9% × 3/12 = $22,500`}</CodeBlock>
      </Section>
      <Section title="3-Step Amortization — Visualization">
        <div className="note-diagram" style={{ marginTop: 8 }}>
          <svg width="100%" viewBox="0 0 680 580" role="img">
            <title>Note payable amortization — 3-step calculation and chart</title>
            <desc>3단계 계산 흐름, 분개, 시험 질문 유형, 미니 차트</desc>
            <defs>
              <marker id="arrow-np" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-purple"><rect x="20" y="10" width="640" height="36" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="22" textAnchor="middle" dominantBaseline="central">Note payable — $500,000 / 12% annual / payment $11,122 fixed</text><text className="ts" x="340" y="38" textAnchor="middle" dominantBaseline="central">12% ÷ 12 = 1% monthly rate</text></g>
            <text className="th" x="30" y="72" textAnchor="start">Calculation — always this order</text>
            <g className="c-teal"><rect x="20" y="82" width="300" height="64" rx="8" strokeWidth="0.5"/><text className="th" x="170" y="100" textAnchor="middle" dominantBaseline="central">① Interest first</text><text className="ts" x="170" y="118" textAnchor="middle" dominantBaseline="central">Beginning balance × 1%</text><text className="ts" x="170" y="136" textAnchor="middle" dominantBaseline="central">$500,000 × 1% = $5,000</text></g>
            <line x1="170" y1="146" x2="170" y2="168" stroke="#1D9E75" strokeWidth="1.5" markerEnd="url(#arrow-np)"/>
            <g className="c-blue"><rect x="20" y="170" width="300" height="64" rx="8" strokeWidth="0.5"/><text className="th" x="170" y="188" textAnchor="middle" dominantBaseline="central">② Principal (plug-in)</text><text className="ts" x="170" y="208" textAnchor="middle" dominantBaseline="central">Payment − Interest</text><text className="ts" x="170" y="224" textAnchor="middle" dominantBaseline="central">$11,122 − $5,000 = $6,122</text></g>
            <line x1="170" y1="234" x2="170" y2="256" stroke="#185FA5" strokeWidth="1.5" markerEnd="url(#arrow-np)"/>
            <g className="c-gray"><rect x="20" y="258" width="300" height="64" rx="8" strokeWidth="0.5"/><text className="th" x="170" y="276" textAnchor="middle" dominantBaseline="central">③ Ending balance</text><text className="ts" x="170" y="296" textAnchor="middle" dominantBaseline="central">Beginning − Principal</text><text className="ts" x="170" y="312" textAnchor="middle" dominantBaseline="central">$500,000 − $6,122 = $493,878</text></g>
            <g className="c-gray"><rect x="20" y="340" width="300" height="54" rx="8" strokeWidth="0.5"/><text className="th" x="170" y="358" textAnchor="middle" dominantBaseline="central">Month 2 — same steps</text><text className="ts" x="170" y="376" textAnchor="middle" dominantBaseline="central">$493,878 × 1% = $4,939 (interest ↓)</text><text className="ts" x="170" y="392" textAnchor="middle" dominantBaseline="central">$11,122 − $4,939 = $6,183 (principal ↑)</text></g>
            <text className="th" x="360" y="72" textAnchor="start">Journal entry (month 1)</text>
            <g className="c-amber"><rect x="350" y="82" width="310" height="82" rx="8" strokeWidth="0.5"/><text className="ts" x="420" y="108" textAnchor="start">Dr. Interest Expense   $5,000</text><text className="ts" x="420" y="126" textAnchor="start">Dr. Notes Payable      $6,122</text><text className="ts" x="440" y="144" textAnchor="start">Cr. Cash                      $11,122</text><text className="ts" x="610" y="118" textAnchor="middle">payment</text><text className="ts" x="610" y="134" textAnchor="middle">fixed</text></g>
            <text className="th" x="360" y="186" textAnchor="start">Exam question types</text>
            <g className="c-coral"><rect x="350" y="196" width="310" height="130" rx="8" strokeWidth="0.5"/><text className="ts" x="505" y="218" textAnchor="middle">"Interest expense"</text><text className="ts" x="505" y="234" textAnchor="middle">→ Beg. balance × rate × m/12</text><text className="ts" x="505" y="256" textAnchor="middle">"Note payable on B/S"</text><text className="ts" x="505" y="272" textAnchor="middle">→ Ending balance</text><text className="ts" x="505" y="294" textAnchor="middle">"Principal reduction"</text><text className="ts" x="505" y="310" textAnchor="middle">→ Payment − interest (plug-in)</text></g>
            <line x1="20" y1="416" x2="660" y2="416" stroke="#d0d0c8" strokeWidth="0.5" strokeDasharray="4 3"/>
            <text className="th" x="340" y="436" textAnchor="middle">Payment = Interest + Principal (always $11,122)</text>
            <line x1="65" y1="458" x2="610" y2="458" stroke="#555" strokeWidth="1" strokeDasharray="5 3"/>
            <text className="ts" x="618" y="462" textAnchor="start">$11,122</text>
            <rect x="80" y="498" width="52" height="32" rx="3" fill="#378ADD" opacity="0.85"/>
            <rect x="80" y="458" width="52" height="40" rx="3" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="106" y="544" textAnchor="middle">M1</text>
            <rect x="175" y="500" width="52" height="30" rx="3" fill="#378ADD" opacity="0.85"/>
            <rect x="175" y="458" width="52" height="42" rx="3" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="201" y="544" textAnchor="middle">M6</text>
            <rect x="270" y="502" width="52" height="28" rx="3" fill="#378ADD" opacity="0.85"/>
            <rect x="270" y="458" width="52" height="44" rx="3" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="296" y="544" textAnchor="middle">M12</text>
            <rect x="365" y="507" width="52" height="23" rx="3" fill="#378ADD" opacity="0.85"/>
            <rect x="365" y="458" width="52" height="49" rx="3" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="391" y="544" textAnchor="middle">M30</text>
            <rect x="460" y="529" width="52" height="1" rx="1" fill="#378ADD" opacity="0.85"/>
            <rect x="460" y="458" width="52" height="71" rx="3" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="486" y="544" textAnchor="middle">M60</text>
            <path d="M106 514 Q201 515 296 516 Q391 520 486 530" fill="none" stroke="#185FA5" strokeWidth="1" strokeDasharray="4 3" opacity="0.6"/>
            <rect x="80" y="556" width="12" height="12" rx="2" fill="#378ADD"/>
            <text className="ts" x="96" y="566" textAnchor="start">Interest (decreases)</text>
            <rect x="240" y="556" width="12" height="12" rx="2" fill="#1D9E75"/>
            <text className="ts" x="256" y="566" textAnchor="start">Principal (increases)</text>
            <line x1="400" y1="562" x2="428" y2="562" stroke="#555" strokeWidth="1" strokeDasharray="4 3"/>
            <text className="ts" x="434" y="566" textAnchor="start">Fixed payment total</text>
          </svg>
        </div>
      </Section>
      <Section title="Key Rule">
        <p>Use <strong>Beginning Balance × rate × time fraction</strong>. Never use payment amount directly for interest calculation.</p>
        <CodeBlock>{`3-step order (always):
① Interest    = Beginning balance × (annual rate ÷ 12)
② Principal   = Payment − Interest          ← plug-in
③ Ending bal. = Beginning balance − Principal

Payment = Interest + Principal (fixed total — never changes)
Annual rate ÷ 12 = monthly rate (never use annual rate directly)`}</CodeBlock>
      </Section>
      <TrapBox items={[
        'Accrued interest at year-end: use days/months outstanding, not full year',
        'Do NOT confuse payment amount with interest expense',
      ]} />
    </div>
  )
}

function AroContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is an ARO?</strong> A legal obligation to dismantle or restore an asset at retirement (e.g., oil rig, nuclear plant).</p>
        <p style={{ color: '#555', marginTop: 6 }}>법적 의무 — 자산 철거/복구 비용을 미리 부채로 인식. 비용이 나중에 발생해도 의무는 지금 존재함 → 발생주의 원칙.</p>
        <p style={{ color: '#555', marginTop: 8 }}>PV로 인식 (명목 금액 아님) / Credit-adjusted risk-free rate 사용.</p>
        <CodeBlock>{`Two annual tracks:
  Asset track:     Depreciation = $18M ÷ 10yr = $1.8M
  Liability track: Accretion    = $18M × 8%   = $1.44M`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: ARO Accretion = Bond Discount 상각과 동일 구조. 시간이 지날수록 부채가 만기 금액으로 수렴.</p>
      </Section>
      <Section title="Day 1 Recognition">
        <CodeBlock>{`Recognize at Present Value using credit-adjusted risk-free rate

Dr. PP&E (Asset)         60,000   ← ARO PV added to asset cost
  Cr. Cash / Cr. Payable              (acquisition cost)
  Cr. ARO Liability        60,000  ← PV of future dismantlement`}</CodeBlock>
      </Section>

      <Section title="Subsequent Measurement">
        <CodeBlock>{`Two parallel tracks:

Asset Track  → Depreciate ROU/PP&E (straight-line or units)
Liability Track → Accretion each year

Accretion = Beginning ARO Balance × credit-adjusted rate`}</CodeBlock>
      </Section>

      <Section title="Accretion Example (ARO=$60,000, Rate=5%)">
        <Table
          headers={['Year', 'Beg ARO', 'Accretion', 'End ARO']}
          rows={[
            ['1', '60,000', '3,000', '63,000'],
            ['2', '63,000', '3,150', '66,150'],
            ['3', '66,150', '3,308', '69,458'],
          ]}
        />
      </Section>

      <TrapBox items={[
        'ARO uses credit-adjusted risk-free rate (not plain risk-free)',
        'Accretion ≠ depreciation — they are separate expense lines',
        'Rate changes: new layer approach for revisions',
      ]} />
      <Section title="Key Terms — ARO">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['ARO', 'Decommissioning liability / Abandonment obligation', '법적 의무'],
            ['Accretion expense', 'Unwinding of discount', 'Beg ARO × credit-adj rate'],
            ['Credit-adjusted rate', 'Entity-specific rate', 'Risk-free + credit risk ≠ plain risk-free'],
          ]}
        />
        <CodeBlock>{`Day 1 PV:
= Future cost × PV of $1 factor
  rate = credit-adjusted risk-free rate
       = risk-free rate + company credit risk premium
         (≠ risk-free rate 단독)
  n = asset useful life

Annual Accretion = Beginning ARO × credit-adjusted rate`}</CodeBlock>
      </Section>
    </div>
  )
}

function EpsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is EPS?</strong> Earnings Per Share — profit attributable to each common share. 공개기업 필수 공시 항목.</p>
        <p style={{ marginTop: 8 }}><strong>Basic EPS</strong> = (NI − Preferred Dividends) ÷ WASO</p>
        <p style={{ marginTop: 8 }}><strong>Diluted EPS</strong> — 희석증권 전환 가정 시 "최악의 경우" EPS:</p>
        <Table
          headers={['Security', 'Numerator ↑', 'Denominator ↑']}
          rows={[
            ['Convertible bond', '+ Interest × (1−t)', '+ Converted shares'],
            ['Convertible preferred', '+ Dividend (pre-tax)', '+ Converted shares'],
            ['Stock options', 'None', '+ Net new shares (treasury method)'],
          ]}
        />
        <CodeBlock>{`Example:
  Basic:   ($500K − $20K) ÷ 100,000 shares = $4.80
  Diluted: $516,000 ÷ 120,000 shares = $4.30`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Diluted EPS = 항상 Basic EPS 이하 (dilutive). Antidilutive → 제외.</p>
      </Section>
      <Section title="Basic EPS">
        <CodeBlock>{`Basic EPS = (NI − Preferred Dividends) ÷ WASO

WASO = Σ(shares × months held ÷ 12)
Example:
  Jan 1:  100,000 shares × 12/12 = 100,000
  Apr 1:  +30,000 shares ×  9/12 =  22,500
  WASO =                           122,500

Basic EPS = ($500,000 − $20,000) ÷ 122,500 = $3.92`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Convertible Bonds">
        <CodeBlock>{`Add back: After-tax interest = Face × coupon rate × (1 − tax rate)
Add shares: # bonds × conversion ratio
→ Include only if DILUTIVE (decreases EPS)`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Convertible Preferred">
        <CodeBlock>{`Add back: Preferred dividends (no tax shield — already after-tax)
Add shares: # preferred × conversion ratio`}</CodeBlock>
      </Section>

      <Section title="Diluted EPS — Stock Options (Treasury Stock Method)">
        <CodeBlock>{`Proceeds = Options × Exercise Price
Shares repurchased = Proceeds ÷ Avg Market Price
Net new shares = Options issued − Shares repurchased

Example: 1,000 options @ $20 exercise, $25 avg market
  Proceeds = $20,000
  Repurchased = $20,000 ÷ $25 = 800
  Net dilutive shares = 200`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Antidilutive securities → EXCLUDE from diluted EPS',
        'Convertible bonds: interest add-back must be after-tax',
        'Convertible preferred: no tax shield → add back full dividend amount',
        'Options in-the-money → always dilutive; out-of-the-money → antidilutive',
      ]} />
      <Section title="Key Terms — EPS">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['WASO', 'Weighted Average Shares Outstanding', '보통주만 (우선주 제외)'],
            ['Basic EPS', 'Primary EPS (구 표현)', '(NI − Pref Div) ÷ WASO'],
            ['Diluted EPS', 'Fully diluted EPS', '희석증권 전환 가정 최악 EPS'],
            ['Antidilutive', 'Anti-dilutive', 'EPS 높이는 증권 → 제외'],
            ['Treasury stock method', 'Buy-back method', 'Net shares = Options × (1 − Ex/Market)'],
          ]}
        />
        <CodeBlock>{`Convertible bond numerator adjustment:
  + Interest expense × (1 − enacted tax rate)   ← after-tax (세금 절약 있음)

Convertible preferred numerator adjustment:
  + Preferred dividend (세전 금액 그대로)       ← no tax shield (배당 = 세후 처리)

Treasury stock method net new shares:
  = Options × (1 − Exercise price ÷ Average market price)
  Example: 1,000 options / Exercise $20 / Market $25
  = 1,000 × (1 − 20/25) = 200 net new shares`}</CodeBlock>
      </Section>
    </div>
  )
}

function TaxContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Deferred Tax?</strong> Book income (GAAP) ≠ Taxable income (IRS) → timing difference → future tax effect.</p>
        <p style={{ color: '#555', marginTop: 6 }}>회계이익과 과세소득의 차이로 생기는 미래 세금 효과.</p>
        <Table
          headers={['Difference', 'Future effect', 'Result']}
          rows={[
            ['Deductible temporary', '나중에 세금 덜 냄', 'DTA (asset)'],
            ['Taxable temporary', '나중에 세금 더 냄', 'DTL (liability)'],
            ['Permanent', '미래 효과 없음', '없음'],
          ]}
        />
        <p style={{ marginTop: 8 }}><strong>Key rules:</strong> All non-current (ASC 740) / Enacted rate 사용 / Valuation allowance = always Credit entry.</p>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Deductible → DTA (나중에 아낄 세금 = 자산). Taxable → DTL (나중에 낼 세금 = 부채).</p>
      </Section>
      <Section title="Temporary Differences">
        <Table
          headers={['Type', 'Direction', 'Balance Sheet Item']}
          rows={[
            ['Deductible temp diff', 'Tax deduction later', 'DTA (Deferred Tax Asset)'],
            ['Taxable temp diff', 'Taxable income later', 'DTL (Deferred Tax Liability)'],
          ]}
        />
      </Section>

      <Section title="Permanent Differences — No DTA/DTL">
        <CodeBlock>{`Meals & Entertainment (50% disallowed)
Tax-exempt municipal bond interest
Fines and penalties
Life insurance proceeds on key employees`}</CodeBlock>
      </Section>

      <Section title="Key Rules (ASC 740)">
        <CodeBlock>{`Rate: Use ENACTED tax rate at balance sheet date
Classification: ALL deferred taxes are NON-CURRENT (ASC 740)

Valuation Allowance:
  If DTA "more likely than not" NOT to be realized
  → Contra asset reduces DTA to expected realizable amount`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Tax rate: Enacted future rate (deferred 계산)', changed: '"current portion of tax expense"만 물을 때 → 당기 enacted rate 사용' },
      ]} />
      <TrapBox items={[
        'Use enacted rate (not proposed or current rate)',
        'Permanent differences never create DTA or DTL',
        'All deferred taxes = non-current (no current/non-current split under ASC 740)',
        'Valuation allowance: "more likely than not" = > 50% chance of non-realization',
      ]} />
      <Section title="Key Terms — Deferred Tax">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['Enacted rate', 'Legislatively enacted rate', '확정된 세율만 사용 (proposed 아님)'],
            ['Temporary difference', 'Timing difference (구 표현)', '미래에 해소 → DTA/DTL'],
            ['Permanent difference', 'Non-reversing difference', '해소 안 됨 → deferred tax 없음'],
            ['Valuation allowance', 'VA, Contra-DTA', '항상 Credit entry'],
            ['DTA', 'Deferred Tax Asset', 'Deductible × enacted rate'],
            ['DTL', 'Deferred Tax Liability', 'Taxable × enacted rate'],
          ]}
        />
        <CodeBlock>{`DTA = Deductible temporary difference × enacted rate
DTL = Taxable temporary difference × enacted rate

Enacted rate = 차이가 해소되는 미래 연도의 확정 세율
             ≠ 현재 적용 세율
             ≠ 제안 중인(proposed) 세율`}</CodeBlock>
      </Section>
    </div>
  )
}

// ── Reusable Sub-components ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10, borderBottom: '1px solid #e0e0e0', paddingBottom: 6 }}>
        {title}
      </h3>
      <div style={{ fontSize: 13, color: '#111', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#f7f8fa',
      border: '1px solid #e0e0e0',
      borderRadius: 6,
      padding: '12px 14px',
      fontSize: 12.5,
      lineHeight: 1.7,
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      margin: 0,
      fontFamily: '"Fira Mono", "Cascadia Code", monospace',
    }}>
      {children}
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: '#f0f3f8' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: 600, color: NAVY }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '5px 10px', border: '1px solid #e0e0e0', color: '#111' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrapBox({ items }: { items: string[] }) {
  return (
    <div style={{ background: '#fff8f8', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8, letterSpacing: 0.5 }}>
        TRAP
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12.5, color: '#7f1d1d', lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function DefaultBox({ items }: { items: { default: string; changed: string }[] }) {
  return (
    <div style={{
      background: '#eff6ff', border: '1px solid #1d4ed8',
      borderRadius: 8, padding: '12px 16px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
        ⚡ Default vs 명시 시 변경 (US GAAP)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ fontSize: 12.5 }}>
            <span style={{ color: '#1a2744', fontWeight: 600 }}>Default: </span>
            <span style={{ color: '#333' }}>{item.default}</span>
            <span style={{ color: '#1d4ed8', fontWeight: 700 }}> → </span>
            <span style={{ color: '#1a2744' }}>{item.changed}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '60px 24px', color: '#999', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36 }}>📚</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13 }}>상세 정리 콘텐츠 준비 중입니다.</div>
    </div>
  )
}

function InventoryContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Inventory valuation?</strong> The cost flow assumption determines which costs go to COGS vs Ending Inventory.</p>
        <p style={{ color: '#555', marginTop: 6 }}>같은 물건도 어떤 원가를 먼저 팔았다고 가정하느냐에 따라 COGS와 NI가 달라짐.</p>
        <Table
          headers={['Method', 'COGS (price rising)', 'Ending Inv', 'Net Income']}
          rows={[
            ['FIFO', 'Low', 'High', 'High'],
            ['LIFO', 'High', 'Low', 'Low'],
            ['Weighted Average', 'Middle', 'Middle', 'Middle'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: LIFO 가격 상승 = 높은 COGS = 낮은 세금. LIFO는 절세 목적으로 쓰임 (IFRS 금지).</p>
      </Section>
      <Section title="1. Overview">
        <p>FIFO / LIFO / Weighted Average / Periodic vs Perpetual / LCM(NRV) / Dollar-Value LIFO</p>
      </Section>

      <Section title="2. 가격 방향 비교 (가격 상승 시)">
        <Table
          headers={['Method', 'Ending Inventory', 'COGS', 'Net Income', 'Tax']}
          rows={[
            ['FIFO', '↑ 높음', '↓ 낮음', '↑ 높음', '↑ 높음'],
            ['LIFO', '↓ 낮음', '↑ 높음', '↓ 낮음', '↓ 낮음'],
            ['AVCO', '중간', '중간', '중간', '중간'],
          ]}
        />
      </Section>

      <Section title="3. Dollar-Value LIFO — Layer Calculation">
        <p><strong>Why DV LIFO?</strong> 일반 LIFO는 수량 단위 관리 → 제품 종류 변경 시 layer 붕괴 위험. DV LIFO = 달러 금액 기준 → 제품 mix 변경에도 안정적.</p>
        <p style={{ marginTop: 4 }}><strong>Index 효과:</strong> Without index = 수량 증가만 반영 / With index = 수량 + 물가 상승 동시 반영 → 물가 상승기 COGS 높게 측정 → LIFO 취지 유지</p>
        <CodeBlock>{`Base layer = Ending base-year cost − Σ added layers  (× 1.0, no index)
Each added layer × its own year index
DV LIFO = Σ (each layer × its year index)`}</CodeBlock>
        <div className="inv-diagram" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <svg width="100%" viewBox="0 0 680 320" role="img">
            <title>Dollar-value LIFO layer calculation table</title>
            <desc>DV LIFO 각 layer의 base-year cost, index, DV LIFO cost 계산 테이블</desc>
            <defs>
              <marker id="arrow-dvl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <text className="th" x="340" y="24" textAnchor="middle">DV LIFO — layer calculation</text>
            <text className="ts" x="340" y="42" textAnchor="middle">Ending base-year cost → added layers 차감 → base layer (plug-in) → × index</text>
            <g className="c-gray"><rect x="20" y="56" width="140" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="90" y="70" textAnchor="middle" dominantBaseline="central">Layer</text></g>
            <g className="c-gray"><rect x="172" y="56" width="160" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="252" y="70" textAnchor="middle" dominantBaseline="central">Base-year cost</text></g>
            <g className="c-gray"><rect x="344" y="56" width="100" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="394" y="70" textAnchor="middle" dominantBaseline="central">× Index</text></g>
            <g className="c-gray"><rect x="456" y="56" width="204" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="558" y="70" textAnchor="middle" dominantBaseline="central">= DV LIFO cost</text></g>
            <g className="c-gray"><rect x="20" y="94" width="140" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="90" y="112" textAnchor="middle" dominantBaseline="central">1/1/Y1 (base)</text><text className="ts" x="90" y="132" textAnchor="middle" dominantBaseline="central">plug-in</text></g>
            <g className="c-gray"><rect x="172" y="94" width="160" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="252" y="112" textAnchor="middle" dominantBaseline="central">$485,000</text><text className="ts" x="252" y="132" textAnchor="middle" dominantBaseline="central">$610K − $125K</text></g>
            <g className="c-gray"><rect x="344" y="94" width="100" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="394" y="118" textAnchor="middle" dominantBaseline="central">× 1.0</text></g>
            <g className="c-gray"><rect x="456" y="94" width="204" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="558" y="118" textAnchor="middle" dominantBaseline="central">$485,000</text></g>
            <g className="c-blue"><rect x="20" y="152" width="140" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="90" y="170" textAnchor="middle" dominantBaseline="central">Y1 added</text><text className="ts" x="90" y="190" textAnchor="middle" dominantBaseline="central">Y1 index</text></g>
            <g className="c-blue"><rect x="172" y="152" width="160" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="252" y="176" textAnchor="middle" dominantBaseline="central">$125,000</text></g>
            <g className="c-blue"><rect x="344" y="152" width="100" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="394" y="176" textAnchor="middle" dominantBaseline="central">× 1.3</text></g>
            <g className="c-blue"><rect x="456" y="152" width="204" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="558" y="176" textAnchor="middle" dominantBaseline="central">$162,500</text></g>
            <g className="c-teal"><rect x="20" y="210" width="140" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="90" y="228" textAnchor="middle" dominantBaseline="central">Y2 added</text><text className="ts" x="90" y="248" textAnchor="middle" dominantBaseline="central">Y2 index</text></g>
            <g className="c-teal"><rect x="172" y="210" width="160" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="252" y="234" textAnchor="middle" dominantBaseline="central">$175,000</text></g>
            <g className="c-teal"><rect x="344" y="210" width="100" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="394" y="234" textAnchor="middle" dominantBaseline="central">× 1.2</text></g>
            <g className="c-teal"><rect x="456" y="210" width="204" height="48" rx="6" strokeWidth="0.5"/><text className="th" x="558" y="234" textAnchor="middle" dominantBaseline="central">$210,000</text></g>
            <line x1="456" y1="268" x2="660" y2="268" stroke="#888" strokeWidth="1"/>
            <g className="c-amber"><rect x="456" y="276" width="204" height="36" rx="6" strokeWidth="0.5"/><text className="th" x="558" y="290" textAnchor="middle" dominantBaseline="central">$857,500</text><text className="ts" x="558" y="306" textAnchor="middle" dominantBaseline="central">Y2 DV LIFO</text></g>
          </svg>
          <svg width="100%" viewBox="0 0 680 440" role="img">
            <title>DV LIFO without vs with index comparison</title>
            <desc>Index 미적용과 DV LIFO 적용 비교 — 초기부터 누적 막대 그래프</desc>
            <defs>
              <marker id="arrow-dvc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-gray"><rect x="100" y="10" width="200" height="28" rx="8" strokeWidth="0.5"/><text className="th" x="200" y="24" textAnchor="middle" dominantBaseline="central">Without index</text></g>
            <g className="c-amber"><rect x="380" y="10" width="200" height="28" rx="8" strokeWidth="0.5"/><text className="th" x="480" y="24" textAnchor="middle" dominantBaseline="central">With index (DV LIFO)</text></g>
            <line x1="340" y1="10" x2="340" y2="400" stroke="#d0d0d0" strokeWidth="0.5" strokeDasharray="4 3"/>
            <line x1="60" y1="340" x2="60" y2="50" stroke="#888" strokeWidth="1" markerEnd="url(#arrow-dvc)"/>
            <line x1="60" y1="340" x2="320" y2="340" stroke="#888" strokeWidth="1"/>
            <text className="ts" x="56" y="54" textAnchor="end">$</text>
            <text className="ts" x="52" y="344" textAnchor="end">0</text>
            <text className="ts" x="52" y="278" textAnchor="end">200K</text>
            <line x1="56" y1="274" x2="64" y2="274" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="52" y="212" textAnchor="end">400K</text>
            <line x1="56" y1="208" x2="64" y2="208" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="52" y="146" textAnchor="end">600K</text>
            <line x1="56" y1="142" x2="64" y2="142" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="52" y="80" textAnchor="end">800K</text>
            <line x1="56" y1="76" x2="64" y2="76" stroke="#888" strokeWidth="0.5"/>
            <rect x="80" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.7"/>
            <text className="ts" x="115" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="115" y="358" textAnchor="middle">1/1/Y1</text>
            <text className="ts" x="115" y="372" textAnchor="middle">$485K</text>
            <rect x="165" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.7"/>
            <rect x="165" y="138" width="70" height="42" rx="4" fill="#378ADD" opacity="0.7"/>
            <text className="ts" x="200" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="200" y="156" textAnchor="middle" style={{fill:'#042C53'}}>$125K</text>
            <text className="ts" x="200" y="358" textAnchor="middle">Y1 end</text>
            <text className="ts" x="200" y="372" textAnchor="middle">$610K</text>
            <rect x="250" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.7"/>
            <rect x="250" y="138" width="70" height="42" rx="4" fill="#378ADD" opacity="0.7"/>
            <rect x="250" y="80" width="70" height="58" rx="4" fill="#1D9E75" opacity="0.7"/>
            <text className="ts" x="285" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="285" y="156" textAnchor="middle" style={{fill:'#042C53'}}>$125K</text>
            <text className="ts" x="285" y="107" textAnchor="middle" style={{fill:'#04342C'}}>$175K</text>
            <text className="ts" x="285" y="358" textAnchor="middle">Y2 end</text>
            <text className="ts" x="285" y="372" textAnchor="middle">$785K</text>
            <line x1="360" y1="340" x2="360" y2="50" stroke="#888" strokeWidth="1" markerEnd="url(#arrow-dvc)"/>
            <line x1="360" y1="340" x2="630" y2="340" stroke="#888" strokeWidth="1"/>
            <text className="ts" x="356" y="54" textAnchor="end">$</text>
            <text className="ts" x="352" y="344" textAnchor="end">0</text>
            <text className="ts" x="352" y="278" textAnchor="end">200K</text>
            <line x1="356" y1="274" x2="364" y2="274" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="352" y="212" textAnchor="end">400K</text>
            <line x1="356" y1="208" x2="364" y2="208" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="352" y="146" textAnchor="end">600K</text>
            <line x1="356" y1="142" x2="364" y2="142" stroke="#888" strokeWidth="0.5"/>
            <text className="ts" x="352" y="80" textAnchor="end">800K</text>
            <line x1="356" y1="76" x2="364" y2="76" stroke="#888" strokeWidth="0.5"/>
            <rect x="380" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.85"/>
            <text className="ts" x="415" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="415" y="358" textAnchor="middle">1/1/Y1</text>
            <text className="ts" x="415" y="372" textAnchor="middle">$485K</text>
            <rect x="465" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.85"/>
            <rect x="465" y="126" width="70" height="54" rx="4" fill="#378ADD" opacity="0.85"/>
            <text className="ts" x="500" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="500" y="150" textAnchor="middle" style={{fill:'#042C53'}}>$162.5K</text>
            <text className="ts" x="500" y="358" textAnchor="middle">Y1 end</text>
            <text className="ts" x="500" y="372" textAnchor="middle">$647.5K</text>
            <rect x="550" y="180" width="70" height="160" rx="4" fill="#888780" opacity="0.85"/>
            <rect x="550" y="126" width="70" height="54" rx="4" fill="#378ADD" opacity="0.85"/>
            <rect x="550" y="56" width="70" height="70" rx="4" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="585" y="264" textAnchor="middle" style={{fill:'#2C2C2A'}}>$485K</text>
            <text className="ts" x="585" y="150" textAnchor="middle" style={{fill:'#042C53'}}>$162.5K</text>
            <text className="ts" x="585" y="88" textAnchor="middle" style={{fill:'#04342C'}}>$210K</text>
            <text className="ts" x="585" y="358" textAnchor="middle">Y2 end</text>
            <text className="ts" x="585" y="372" textAnchor="middle">$857.5K</text>
            <path d="M320 80 L380 56" fill="none" stroke="#D85A30" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#arrow-dvc)"/>
            <g className="c-coral"><rect x="290" y="52" width="136" height="22" rx="11" strokeWidth="0.5"/><text className="ts" x="358" y="63" textAnchor="middle" dominantBaseline="central">+$72.5K index 효과</text></g>
            <rect x="80" y="400" width="12" height="12" rx="2" fill="#888780" opacity="0.8"/>
            <text className="ts" x="96" y="410" textAnchor="start">Base layer</text>
            <rect x="195" y="400" width="12" height="12" rx="2" fill="#378ADD" opacity="0.85"/>
            <text className="ts" x="211" y="410" textAnchor="start">Y1 added</text>
            <rect x="305" y="400" width="12" height="12" rx="2" fill="#1D9E75" opacity="0.85"/>
            <text className="ts" x="321" y="410" textAnchor="start">Y2 added</text>
            <text className="ts" x="460" y="410" textAnchor="start" style={{fill:'#993C1D'}}>index = 물가 상승 반영</text>
          </svg>
        </div>
      </Section>

      <Section title="4. LCM Write-down 분개">
        <CodeBlock>{`Dr. COGS (or Inventory Loss)   [write-down amount]
  Cr. Inventory                  [write-down amount]`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Cost flow: 문제 명시 방법 사용 (FIFO/LIFO/WA 모두 허용)', changed: '방법 변경 시 → Retrospective (Change in Accounting Principle)' },
      ]} />
      <TrapBox items={[
        'LIFO reserve = FIFO EI − LIFO EI',
        'Dollar-Value LIFO: index 방향 실수 주의 (나누기 vs 곱하기)',
        '"Before allowances" = estimates만 제외',
        'LIFO → FIFO 전환 시 방향 반전',
      ]} />
      <Section title="Key Terms — Inventory">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['NRV', 'Net Realizable Value', '예상 판매가 − 완성/판매 비용'],
            ['LCM', 'Lower of Cost or NRV (현행)', '구 표현: Lower of Cost or Market'],
            ['Price index', 'Deflator / Conversion factor', 'DV LIFO 계산 기준'],
            ['DV LIFO', 'Dollar-Value LIFO', '수량 아닌 달러 금액 기준 LIFO'],
          ]}
        />
        <CodeBlock>{`Dollar-Value LIFO price index:
= Current year cost ÷ Base year cost

Step 1: EI at base-year cost
= EI at current cost ÷ Current year price index

Step 3: New layer at LIFO cost
= New layer at base-year cost × Current year index`}</CodeBlock>
      </Section>

      <Section title="5. Physical Count — FOB & Consignment 조정">
        <p>재고 실사(physical count) = 창고 기준 → 운송 중·외부 위탁 재고 누락 가능<br/>→ FOB 조건 + Consignment 방향으로 실질 소유권 판단 후 조정</p>
        <div className="inv-diagram" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <svg width="100%" viewBox="0 0 680 340" role="img">
            <title>FOB shipping point vs destination</title>
            <desc>FOB 조건별 소유권 경계 간소화 버전</desc>
            <defs>
              <marker id="arrow-fob" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <text className="th" x="340" y="26" textAnchor="middle">FOB — 운송 중 소유권 경계</text>
            <text className="ts" x="80" y="50" textAnchor="middle">판매자</text>
            <text className="ts" x="340" y="50" textAnchor="middle">운송 중</text>
            <text className="ts" x="600" y="50" textAnchor="middle">구매자</text>
            <rect x="142" y="62" width="498" height="80" rx="8" fill="#E1F5EE" opacity="0.45"/>
            <g className="c-gray"><rect x="30" y="74" width="100" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="80" y="96" textAnchor="middle" dominantBaseline="central">판매자</text></g>
            <line x1="130" y1="96" x2="538" y2="96" stroke="#1D9E75" strokeWidth="2" markerEnd="url(#arrow-fob)"/>
            <line x1="142" y1="62" x2="142" y2="142" stroke="#1D9E75" strokeWidth="1.5" strokeDasharray="5 3"/>
            <g className="c-teal"><rect x="550" y="74" width="100" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="600" y="90" textAnchor="middle" dominantBaseline="central">구매자</text><text className="ts" x="600" y="108" textAnchor="middle" dominantBaseline="central">✅ 재고</text></g>
            <text className="th" x="330" y="82" textAnchor="middle" style={{ fill: '#0F6E56', fontSize: '12px' }}>FOB shipping point — 선적 시 이전</text>
            <text className="ts" x="330" y="100" textAnchor="middle" style={{ fill: '#0F6E56' }}>운송 중 = 구매자 소유 | Freight In → 재고 원가</text>
            <text className="ts" x="80" y="138" textAnchor="middle" style={{ fill: '#888780', fontSize: '11px' }}>판매자 소유</text>
            <text className="ts" x="360" y="138" textAnchor="middle" style={{ fill: '#0F6E56', fontSize: '11px' }}>구매자 소유 (운송 중에도)</text>
            <rect x="30" y="170" width="508" height="80" rx="8" fill="#EEEDFE" opacity="0.45"/>
            <g className="c-purple"><rect x="30" y="182" width="100" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="80" y="198" textAnchor="middle" dominantBaseline="central">판매자</text><text className="ts" x="80" y="216" textAnchor="middle" dominantBaseline="central">✅ 재고</text></g>
            <line x1="130" y1="204" x2="538" y2="204" stroke="#534AB7" strokeWidth="2" markerEnd="url(#arrow-fob)"/>
            <line x1="538" y1="170" x2="538" y2="250" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="5 3"/>
            <g className="c-gray"><rect x="550" y="182" width="100" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="600" y="204" textAnchor="middle" dominantBaseline="central">구매자</text></g>
            <text className="th" x="290" y="190" textAnchor="middle" style={{ fill: '#3C3489', fontSize: '12px' }}>FOB destination — 도착 시 이전</text>
            <text className="ts" x="290" y="208" textAnchor="middle" style={{ fill: '#3C3489' }}>운송 중 = 판매자 소유 | Freight Out → 판매비용</text>
            <text className="ts" x="270" y="246" textAnchor="middle" style={{ fill: '#534AB7', fontSize: '11px' }}>판매자 소유 (운송 중에도)</text>
            <text className="ts" x="600" y="246" textAnchor="middle" style={{ fill: '#888780', fontSize: '11px' }}>도착 후</text>
            <g className="c-amber"><rect x="30" y="268" width="620" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="284" textAnchor="middle" dominantBaseline="central">문장 해석</text><text className="ts" x="340" y="302" textAnchor="middle" dominantBaseline="central">"purchased by Widget" + FOB s.p. → ✅ | "purchased by a customer" + FOB s.p. → ❌</text></g>
          </svg>
          <svg width="100%" viewBox="0 0 680 380" role="img">
            <title>Consignment direction — Widget fixed left</title>
            <desc>Widget 왼쪽 고정, 화살표 방향으로 OUT/IN 구분</desc>
            <defs>
              <marker id="arrow-con" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <text className="th" x="340" y="26" textAnchor="middle">Consignment — 방향이 소유권</text>
            <g className="c-teal"><rect x="40" y="60" width="110" height="220" rx="8" strokeWidth="0.5"/><text className="th" x="95" y="165" textAnchor="middle" dominantBaseline="central">Widget</text><text className="ts" x="95" y="185" textAnchor="middle" dominantBaseline="central">(our company)</text></g>
            <rect x="168" y="60" width="472" height="96" rx="8" fill="#E1F5EE" opacity="0.4"/>
            <line x1="152" y1="100" x2="460" y2="100" stroke="#1D9E75" strokeWidth="2.5" markerEnd="url(#arrow-con)"/>
            <g className="c-gray"><rect x="464" y="72" width="120" height="56" rx="8" strokeWidth="0.5"/><text className="th" x="524" y="96" textAnchor="middle" dominantBaseline="central">타사 창고</text><text className="ts" x="524" y="114" textAnchor="middle" dominantBaseline="central">보관만 함</text></g>
            <text className="th" x="300" y="88" textAnchor="middle" style={{ fill: '#0F6E56' }}>TO — Consignment OUT</text>
            <text className="ts" x="300" y="106" textAnchor="middle" style={{ fill: '#0F6E56' }}>Widget 소유 유지</text>
            <text className="th" x="300" y="122" textAnchor="middle" style={{ fill: '#0F6E56' }}>✅ 재고 포함</text>
            <rect x="168" y="184" width="472" height="96" rx="8" fill="#F1EFE8" opacity="0.5"/>
            <line x1="460" y1="232" x2="152" y2="232" stroke="#888780" strokeWidth="2.5" markerEnd="url(#arrow-con)"/>
            <g className="c-gray"><rect x="464" y="204" width="120" height="56" rx="8" strokeWidth="0.5"/><text className="th" x="524" y="228" textAnchor="middle" dominantBaseline="central">타사</text><text className="ts" x="524" y="246" textAnchor="middle" dominantBaseline="central">소유 유지</text></g>
            <text className="th" x="300" y="220" textAnchor="middle" style={{ fill: '#5F5E5A' }}>BY / FOR — Consignment IN</text>
            <text className="ts" x="300" y="238" textAnchor="middle" style={{ fill: '#5F5E5A' }}>타사 소유</text>
            <text className="th" x="300" y="254" textAnchor="middle" style={{ fill: '#5F5E5A' }}>❌ 재고 제외</text>
            <g className="c-amber"><rect x="40" y="300" width="600" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="318" textAnchor="middle" dominantBaseline="central">기억법</text><text className="ts" x="340" y="336" textAnchor="middle" dominantBaseline="central">TO = 내가 보낸 것 → 내 것 ✅ | BY · FOR = 남이 보낸 것 → 남의 것 ❌</text></g>
          </svg>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#444' }}>
          <p><strong>Bill and Hold:</strong> 조건 4가지 충족(구매자 요청·별도 보관·즉시 인도·일정 확정) → 판매자 재고 제외 / 미충족 → 포함</p>
          <p><strong>Freight In</strong> (매입 운임) → 재고 원가 포함 / <strong>Freight Out</strong> (판매 운임) → 판매비용</p>
          <p><strong>Pledged inventory · Public warehouse</strong> → 소유권 있음 → 재고 포함</p>
          <p><strong>Purchase commitment</strong> → 아직 받지 않은 주문 → 재고 아님</p>
        </div>
      </Section>
    </div>
  )
}

function PpeContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is PP&E?</strong> Long-lived tangible assets used in operations. Historical cost − Accumulated Depreciation. No write-ups under US GAAP.</p>
        <p style={{ color: '#555', marginTop: 6 }}>유형자산 — 취득원가에서 감가상각 누계액 차감. 미국 GAAP 재평가 불가.</p>
        <Table
          headers={['Method', 'Formula', 'Year 1 (Cost $100K / Salvage $10K / 5yr)']}
          rows={[
            ['SL', '(Cost−Salvage) ÷ Life', '$18,000'],
            ['DDB', 'BV × 2/Life', '$40,000 (Salvage 무시)'],
            ['SYD', '(Cost−Salvage) × remaining/SYD', '$30,000'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: DDB는 Salvage value 무시하고 계산. 단, BV가 Salvage 아래로 내려가면 중단.</p>
      </Section>
      <Section title="1. Overview">
        <p>Capitalization vs Expense / Depreciation methods / Interest capitalization / Impairment</p>
      </Section>

      <Section title="2. 감가상각 비교 (Cost $100,000 / Salvage $10,000 / Life 5yr)">
        <Table
          headers={['Method', '공식', 'Y1', 'Y2', '특징']}
          rows={[
            ['SL', '(Cost−Salvage)÷Life', '$18,000', '$18,000', '균등'],
            ['DDB', 'BV × 2/Life', '$40,000', '$24,000', '초기 크고 후기 작음 / Salvage 무시'],
            ['SYD', '(Cost−Salvage)×remaining/SYD', '$30,000', '$24,000', 'Sum=15, 가속'],
          ]}
        />
      </Section>

      <Section title="3. Interest Capitalization">
        <CodeBlock>{`- 건설 중 자산에만 해당 (Qualifying asset)
- Avoidable interest = 자산 지출 × weighted average rate
- 12/31 지출 → 가중치 0/12 = $0 (연도 말 지출은 이자 없음)
- Capitalization period: 지출 시작 ~ 완공`}</CodeBlock>
      </Section>

      <Section title="4. Impairment 2-Step (US GAAP)">
        <CodeBlock>{`Step1 Recoverability Test (스크리닝):
  CV > Undiscounted Future CF → impaired (계속 진행)
  CV ≤ Undiscounted Future CF → not impaired (stop)

Step2 Measurement:
  Impairment Loss = CV − Fair Value

분개: Dr. Impairment Loss / Cr. Accumulated Impairment Loss`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: '감가상각법: SL (명시 없으면 가정)', changed: '"double declining balance" → DDB / "sum-of-years-digits" → SYD' },
        { default: 'Patent defense: Expense', changed: '"successfully defended" 명시 → Capitalize (기존 BV + 소송비용, 잔여내용연수 상각)' },
        { default: 'Software Preliminary → Expense', changed: '"application development stage" → Capitalize' },
        { default: 'Software Post-implementation → Expense', changed: '고정 (변경 없음)' },
      ]} />
      <TrapBox items={[
        'Land = 감가상각 없음',
        'DDB: Salvage 무시하지만 BV < Salvage 되면 감가상각 중단',
        'Step1 = Undiscounted CF (PV 아님!)',
        'US GAAP: impairment write-up 불가 (IFRS는 가능)',
        'Interest capitalization: 12/31 지출 = $0 (0/12 가중치)',
      ]} />
      <Section title="Key Terms — PP&E">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['Salvage value', 'Residual value / Scrap value', 'SL/SYD 차감 / DDB 무시'],
            ['Useful life', 'Service life / Economic life', '물리적 내용연수와 다를 수 있음'],
            ['DDB', 'Double Declining Balance / 200% DB', 'BV × 2/Life'],
            ['SYD', 'Sum-of-Years-Digits', 'SYD 합계 = n(n+1)÷2'],
          ]}
        />
        <CodeBlock>{`Impairment Step 1: CV vs Undiscounted future CF
  CV = Carrying value (장부금액, 감가상각 후)
  Undiscounted = PV factor 미적용 (PV 사용 → 오답, 스크리닝용)

Impairment Step 2: Loss = CV − Fair Value
  Fair Value = exit price

Interest Capitalization rate:
= Specific borrowing rate (특정 차입금 있으면 우선)
  or Weighted-avg interest rate (타 차입금 가중평균)
Note: Dec 31 지출 → 0/12 가중치`}</CodeBlock>
      </Section>
    </div>
  )
}

function IntangiblesContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is an Intangible?</strong> Non-physical long-term asset (patents, trademarks, goodwill). 핵심 질문: Finite life인가 Indefinite life인가?</p>
        <Table
          headers={['Type', 'Amortization', 'Impairment']}
          rows={[
            ['Finite life', 'Yes (SL, zero residual)', 'When indicator exists'],
            ['Indefinite life', 'No', 'Annual test'],
            ['Goodwill', 'No', 'Annual test'],
          ]}
        />
        <CodeBlock>{`Patent defense:
  승소 → Capitalize (기존 BV + 소송비용, 잔여내용연수 상각)
  패소 → Expense immediately

Software 3 stages:
  Preliminary         → Expense
  Application dev     → Capitalize
  Post-implementation → Expense`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Goodwill = 사업 인수 시 순자산 FV 초과 지급한 프리미엄. 상각 없음, 매년 손상 검사.</p>
      </Section>
      <Section title="1. Overview">
        <p>Definite vs Indefinite / Internally generated vs Purchased / R&D expense</p>
      </Section>

      <Section title="2. 자본화 기준">
        <Table
          headers={['항목', '처리', '비고']}
          rows={[
            ['Purchased intangible', 'Capitalize', 'Cost + legal fees'],
            ['Internally generated', 'Expense as incurred', 'R&D 전액 비용'],
            ['Software — Preliminary', 'Expense', ''],
            ['Software — Application dev', 'Capitalize', '개발 단계만'],
            ['Software — Post-implementation', 'Expense', ''],
            ['Patent defense — 승소', 'Capitalize', 'Dr. Patent / Cr. Cash'],
            ['Patent defense — 패소', 'Expense immediately', ''],
          ]}
        />
      </Section>

      <Section title="3. Goodwill">
        <CodeBlock>{`No amortization → Annual impairment test
Step1 (qualitative): any indicators of impairment?
Step2 (quantitative): if needed → FV of reporting unit vs CV
Impairment Loss = CV − FV of reporting unit`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'R&D = 항상 expense (자본화 금지)',
        'Goodwill = 상각 없음, impairment test만',
        'Trademark: 법적 10yr ≠ definite (renewal 가능하면 indefinite)',
        'Software 자본화: application development phase만',
      ]} />
    </div>
  )
}

function RevenueContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Revenue Recognition?</strong> Revenue recognized when (or as) a performance obligation is satisfied — not when cash is received.</p>
        <p style={{ color: '#555', marginTop: 6 }}>현금 수령 시점이 아닌 의무 이행 시점에 인식. ASC 606 = 수십 개 업종별 규정을 하나의 5단계로 통합 (2018년 시행).</p>
        <Table
          headers={['Step', 'Question']}
          rows={[
            ['1', 'Valid contract?'],
            ['2', 'What did we promise? (Performance Obligations)'],
            ['3', 'How much? (Transaction price)'],
            ['4', 'How much per PO? (Allocate to POs)'],
            ['5', 'When satisfied? (Recognize revenue)'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: PO 충족 = 고객이 통제권을 넘겨받는 시점. Over time 또는 Point in time.</p>
      </Section>
      <Section title="1. ASC 606 Five-Step Model">
        <Table
          headers={['Step', '내용', '핵심 판단']}
          rows={[
            ['Step 1', 'Identify the contract', 'Approved + committed + collectible'],
            ['Step 2', 'Identify performance obligations', 'Distinct goods/services'],
            ['Step 3', 'Determine transaction price', 'Variable consideration + constraint'],
            ['Step 4', 'Allocate to POs', 'Standalone selling price basis'],
            ['Step 5', 'Recognize revenue', 'When (or as) PO satisfied'],
          ]}
        />
      </Section>

      <Section title="2. Point in Time vs Over Time">
        <CodeBlock>{`Over Time 조건 (하나라도 해당):
  1) Customer controls asset as it is created
  2) Entity has enforceable right to payment for work done
  3) Asset has no alternative use to entity

Over Time → % completion method (input or output measure)
Point in Time → control transfer at a specific moment`}</CodeBlock>
      </Section>

      <Section title="3. Variable Consideration & Constraint">
        <CodeBlock>{`측정 방법: Expected value OR Most likely amount (중 더 예측력 높은 것)
Constraint: high probability (significant reversal 없는 경우에만 포함)`}</CodeBlock>
      </Section>

      <Section title="4. Contract Modification">
        <CodeBlock>{`Distinct + standalone price → 별도 계약 (prospective)
그 외 → modification
  - Remaining goods/services distinct → prospective (catch-up 없음)
  - 나머지 → cumulative catch-up adjustment`}</CodeBlock>
        <svg width="100%" viewBox="0 0 680 540" role="img" style={{ marginTop: 16 }}>
          <title>Contract modification — simplified exam version</title>
          <desc>시험 실전용 Contract Modification 단순화 흐름도</desc>
          <defs>
            <marker id="arrow-cm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          <g className="c-gray">
            <rect x="210" y="20" width="260" height="40" rx="20" strokeWidth="0.5"/>
            <text className="th" x="340" y="40" textAnchor="middle" dominantBaseline="central">Contract modification 발생</text>
          </g>
          <line x1="340" y1="60" x2="340" y2="100" stroke="var(--color-text-secondary)" strokeWidth="1.5" markerEnd="url(#arrow-cm)"/>

          <g className="c-gray">
            <rect x="110" y="100" width="460" height="60" rx="8" strokeWidth="0.5"/>
            <text className="th" x="340" y="122" textAnchor="middle" dominantBaseline="central">Distinct 재화/용역 추가 AND standalone price 충족?</text>
            <text className="ts" x="340" y="146" textAnchor="middle" dominantBaseline="central">둘 다 Yes여야 함 — 하나라도 No → Modification</text>
          </g>

          <path d="M110 130 L50 130 L50 290" fill="none" stroke="#1D9E75" strokeWidth="1.5" markerEnd="url(#arrow-cm)"/>
          <text className="ts" x="56" y="118">Yes</text>

          <path d="M570 130 L630 130 L630 270" fill="none" stroke="#D85A30" strokeWidth="1.5" markerEnd="url(#arrow-cm)"/>
          <text className="ts" x="576" y="118">No</text>

          <g className="c-teal">
            <rect x="20" y="290" width="190" height="80" rx="8" strokeWidth="0.5"/>
            <text className="th" x="115" y="312" textAnchor="middle" dominantBaseline="central">Separate contract</text>
            <text className="ts" x="115" y="330" textAnchor="middle">기존 계약 건드리지 않음</text>
            <text className="ts" x="115" y="346" textAnchor="middle">완전히 독립적 처리</text>
            <text className="ts" x="115" y="362" textAnchor="middle">새 PO 별도 인식</text>
          </g>

          <g className="c-gray">
            <rect x="450" y="270" width="210" height="56" rx="8" strokeWidth="0.5"/>
            <text className="th" x="555" y="290" textAnchor="middle" dominantBaseline="central">잔여 미이행분이 distinct?</text>
            <text className="ts" x="555" y="312" textAnchor="middle" dominantBaseline="central">remaining POs 구별 가능</text>
          </g>

          <line x1="450" y1="298" x2="380" y2="298" stroke="var(--color-text-secondary)" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1="380" y1="298" x2="380" y2="390" stroke="#185FA5" strokeWidth="1.5" markerEnd="url(#arrow-cm)"/>
          <text className="ts" x="384" y="290">Yes</text>

          <line x1="555" y1="326" x2="555" y2="390" stroke="#993C1D" strokeWidth="1.5" markerEnd="url(#arrow-cm)"/>
          <text className="ts" x="560" y="362">No</text>

          <g className="c-blue">
            <rect x="300" y="390" width="150" height="76" rx="8" strokeWidth="0.5"/>
            <text className="th" x="375" y="412" textAnchor="middle" dominantBaseline="central">Prospective</text>
            <text className="ts" x="375" y="430" textAnchor="middle">전진 적용</text>
            <text className="ts" x="375" y="446" textAnchor="middle">잔여분 새 단가 재계산</text>
            <text className="ts" x="375" y="462" textAnchor="middle">catch-up 없음</text>
          </g>

          <g className="c-coral">
            <rect x="470" y="390" width="180" height="76" rx="8" strokeWidth="0.5"/>
            <text className="th" x="560" y="412" textAnchor="middle" dominantBaseline="central">Cumulative catch-up</text>
            <text className="ts" x="560" y="430" textAnchor="middle">기존 계약 일부로 처리</text>
            <text className="ts" x="560" y="446" textAnchor="middle">변경 시점 소급 조정</text>
            <text className="ts" x="560" y="462" textAnchor="middle">누적 효과 반영</text>
          </g>

          <line x1="40" y1="488" x2="640" y2="488" stroke="var(--color-border-tertiary)" strokeWidth="0.5" strokeDasharray="4 4"/>
          <text className="th" x="340" y="512" textAnchor="middle" style={{ fontSize: 11 }}>Speed: distinct + standalone price 둘 다 Yes → Separate / 하나라도 No → Modification</text>
        </svg>
      </Section>

      <TrapBox items={[
        '"In addition" → 별도 PO 여부 주의',
        'Gain contingency = 인식 금지',
        'Significant financing component (>1yr) → PV 할인',
        'Principal vs Agent: control 이전 여부 판단',
      ]} />
    </div>
  )
}

function ScfContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is SCF?</strong> Shows actual cash movement — 발생주의 I/S와 실제 현금 흐름의 차이를 보여줌.</p>
        <Table
          headers={['Activity', 'Content', 'Key items']}
          rows={[
            ['Operating', '영업 관련 현금', 'AR, Inventory, AP, Interest paid'],
            ['Investing', '장기자산 취득/처분', 'PP&E, Notes receivable'],
            ['Financing', '부채/자본 거래', 'Debt, Stock, Dividends paid'],
          ]}
        />
        <CodeBlock>{`Indirect Method:
  Net Income
  + Depreciation / Amortization (non-cash)
  + Loss / − Gain on sale
  ± Working capital changes
  = Cash from Operations`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: SCF는 발생주의 조작이 불가능. 현금은 현금 — 숫자 조작 어려움.</p>
      </Section>
      <Section title="1. 활동 분류">
        <Table
          headers={['활동', '항목 예시']}
          rows={[
            ['Operating', '매출채권/재고/매입채무/이자지급(US)/세금지급'],
            ['Investing', '장기자산 취득·처분, 대출금 실행·회수'],
            ['Financing', '부채 차입·상환, 주식 발행·자사주, 배당지급'],
            ['Non-cash', '자산 취득 + Liability 직접 인수 (별도 공시)'],
          ]}
        />
      </Section>

      <Section title="2. Indirect Method 조정 순서">
        <CodeBlock>{`Net Income
+ Depreciation / Amortization        (non-cash add-back)
+ Loss on sale / − Gain on sale      (remove investing item)
− Increase in AR / + Decrease in AR
− Increase in Inventory / + Decrease
+ Increase in AP / − Decrease in AP
= Cash from Operations`}</CodeBlock>
      </Section>

      <Section title="3. Finance Lease SCF 처리">
        <CodeBlock>{`원금 상환 → Financing Activities
이자 지급 → Operating Activities`}</CodeBlock>
      </Section>

      <Section title="4. Non-cash Disclosures">
        <CodeBlock>{`SCF 본문 제외 → FS 말미에 별도 공시
예: 토지 취득 + Mortgage 직접 인수 ($500,000)`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Interest paid → Operating (US GAAP 고정)', changed: '선택 없음 (변경 불가)' },
        { default: 'Interest received → Operating (US GAAP 고정)', changed: '선택 없음 (변경 불가)' },
        { default: 'Dividends paid → Financing (US GAAP 고정)', changed: '선택 없음 (변경 불가)' },
        { default: 'Dividends received → Operating (US GAAP 고정)', changed: '선택 없음 (변경 불가)' },
      ]} />
      <TrapBox items={[
        'Notes receivable 회수 = Investing (AR과 혼동 금지)',
        '배당지급 = Financing / 배당수령 = Operating (US GAAP)',
        '이자비용 = Operating (US GAAP)',
        'Non-cash → SCF 본문 제외, 별도 공시만',
      ]} />
      <Section title="Key Terms — SCF">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['Indirect method', 'Reconciliation method', 'NI에서 시작해서 조정'],
            ['Direct method', 'Cash receipts/payments method', '실제 현금 항목 직접 나열'],
            ['Non-cash transactions', 'Non-cash investing/financing', '별도 공시 (SCF 본문 아님)'],
          ]}
        />
        <CodeBlock>{`Working capital 조정 방향 (Indirect method):
  자산↑ → Cash−   자산↓ → Cash+
  부채↑ → Cash+   부채↓ → Cash−

Key classification traps:
  Notes receivable collected → Investing (AR과 혼동 금지)
  Interest paid             → Operating (US GAAP)
  Finance lease principal   → Financing
  Dividends paid            → Financing
  Dividends received        → Operating (US GAAP)`}</CodeBlock>
      </Section>
    </div>
  )
}

function InvestmentsContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is the Equity Method?</strong> 20–50% ownership = significant influence → Investment account mirrors investee's net assets.</p>
        <p style={{ color: '#555', marginTop: 6 }}>투자자가 피투자자에 유의적 영향력 보유 시 사용.</p>
        <Table
          headers={['Ownership', 'Method', 'Key']}
          rows={[
            ['< 20%', 'Fair value (Trading/AFS/HTM)', 'Unrealized G/L'],
            ['20–50%', 'Equity Method', 'NI×% − Differential amort'],
            ['> 50%', 'Consolidation', 'Elimination'],
          ]}
        />
        <CodeBlock>{`Equity income = NI × % − Differential amortization

Example: $150K × 40% = $60K − $8K differential = $52K

Sale of AFS:
  Realized G/L = Proceeds − Prior year-end FV
  ⚠ 원가 기준 아님 — 가장 자주 틀리는 포인트`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Equity method = "1줄짜리 연결". 그들의 이익이 오르면 내 투자계정도 오름.</p>
      </Section>
      <Section title="1. 분류 기준">
        <Table
          headers={['분류', '측정', 'Unrealized G/L', '지분율']}
          rows={[
            ['Trading', 'Fair Value', 'Income Statement', '<20%'],
            ['AFS', 'Fair Value', 'OCI', '<20%'],
            ['HTM', 'Amortized Cost', '없음 (채권만)', '<20%'],
            ['Equity Method', 'Adjusted Cost', 'N/A', '20~50%'],
          ]}
        />
      </Section>

      <Section title="2. Equity Method 계산">
        <CodeBlock>{`취득: Dr. Investment / Cr. Cash

매년 Equity income 계산:
  NI × % − Differential amortization = Equity income
  예: NI $150,000 × 40% = $60,000 − Diff amort $8,000 = $52,000

분개: Dr. Investment $52,000 / Cr. Equity Income $52,000
배당: Dr. Cash / Cr. Investment (감액 — income 아님!)`}</CodeBlock>
      </Section>

      <Section title="3. AFS 매각 분개">
        <CodeBlock>{`Dr. Cash                   [proceeds]
Dr./Cr. OCI — AFS Unrealized  [제거]
  Cr. Investment             [amortized cost]
  Cr./Dr. Gain/Loss on Sale  [plug]

Realized G/L = 매각가 − amortized cost`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Equity income = NI×% − differential amortization',
        '배당 = Investment 감액 (income 아님)',
        'AFS unrealized → OCI (I/S 아님)',
        '매각 G/L = 매각가 vs amortized cost (FV 아님)',
      ]} />
    </div>
  )
}

function EquityContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Stockholders' Equity?</strong> Residual interest: Assets − Liabilities. SE = Paid-in capital + RE + AOCI − Treasury stock.</p>
        <p style={{ color: '#555', marginTop: 6 }}>자사주 매입 = 자본 감소 (자산 아님). Treasury stock = contra-equity.</p>
        <Table
          headers={['OCI Item', 'Treatment', 'Reclassify to I/S?']}
          rows={[
            ['AFS Unrealized G/L', 'OCI', '매각 시 reclassify'],
            ['Pension adjustment', 'OCI', '상각 시 (corridor)'],
            ['FX translation', 'OCI', '해외사업 처분 시'],
            ['Cash flow hedge', 'OCI', '헷지 거래 실현 시'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: AOCI = "아직 실현 안 된 손익 창고". 실현되면 I/S로 이동.</p>
      </Section>
      <Section title="1. Treasury Stock — Cost Method vs Par Value Method">
        <Table
          headers={['', 'Cost Method', 'Par Value Method']}
          rows={[
            ['매입', 'Dr. TS (cost) / Cr. Cash', 'Dr. CS(par)+APIC+RE / Cr. Cash'],
            ['재발행 > cost', 'Cr. APIC-TS', 'Cr. CS(par) + APIC'],
            ['재발행 < cost', 'Dr. APIC-TS → Dr. RE', 'Cr. CS(par) + APIC'],
          ]}
        />
      </Section>

      <Section title="2. Stock Dividend vs Stock Split">
        <Table
          headers={['구분', '기준', '분개']}
          rows={[
            ['Small stock div', '<20~25%', 'Dr. RE(FMV×sh) / Cr. CS(par×sh) + APIC'],
            ['Large stock div', '≥20~25%', 'Dr. RE(par×sh) / Cr. CS(par×sh)'],
            ['Stock split', 'any', 'No journal entry (메모만)'],
          ]}
        />
      </Section>

      <Section title="3. AOCI 구성 항목">
        <Table
          headers={['항목', '방향', '비고']}
          rows={[
            ['AFS Unrealized G/L', 'OCI (I/S 아님)', '매각 시 → reclassify to I/S'],
            ['Pension (OPEB)', 'OCI', 'Prior service cost / Actuarial G/L'],
            ['FX Translation', 'OCI', 'Foreign subsidiary 환산'],
            ['Derivatives — Cash flow hedge', 'OCI', 'Fair value hedge → I/S'],
          ]}
        />
      </Section>

      <Section title="4. OCI — 분개 예시">
        <CodeBlock>{`Pension Prior Service Cost:
  Dr. OCI — Prior Service Cost   XXX
    Cr. Pension Liability              XXX

Pension Actuarial Loss:
  Dr. OCI — Actuarial Loss   XXX
    Cr. Pension Liability          XXX

AFS 매각 시 reclassify (OCI → I/S):
  Dr. OCI (Unrealized G/L)   XXX
    Cr. Realized G/L (I/S)        XXX`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Cost Method 재발행 손실: APIC-TS 먼저 차감 → 부족 시 RE',
        'Stock split = 분개 없음 (memo entry만)',
        'Property dividend = FMV 기준 RE 차감 + G/L 인식',
        'Trading → Unrealized G/L → I/S (OCI 아님!)',
        'AFS → Unrealized → OCI / Realized (매각 시) → I/S',
        'Cash flow hedge → OCI / Fair value hedge → I/S',
      ]} />
      <Section title="5. Common Stock Issuance — Par Value vs Total Proceeds">
        <p><strong>Rule:</strong> Common stock account = shares × par value (항상, 발행 대가와 무관)</p>
        <p style={{ marginTop: 4 }}>Total proceeds (FMV) = Common stock (par) + APIC</p>
        <Table
          headers={['FMV 기준', '방법']}
          rows={[
            ['상장사', 'Stock market price 우선'],
            ['비상장사', '서비스/자산의 FMV (hours × billing rate, appraisal 등)'],
          ]}
        />
        <CodeBlock>{`Journal entry (1,000주 × $5 par / 서비스 FMV $6,000):
Dr. Legal Expense             $6,000
    Cr. Common Stock                  $5,000   ← shares × par only
    Cr. APIC                          $1,000   ← FMV − par`}</CodeBlock>
        <p style={{ marginTop: 8, color: '#dc2626', fontWeight: 600, fontSize: 13 }}>Trap:</p>
        <CodeBlock>{`Book value 사용 → Common stock과 무관 (par value만 사용)
Service FMV 전액 → Common stock 아님 (total proceeds)
Hours × rate → total proceeds이지 common stock 아님`}</CodeBlock>
        <p style={{ marginTop: 4, color: '#555', fontStyle: 'italic', fontSize: 13 }}>Speed: Common stock = shares × par → 끝 / 나머지는 APIC</p>
      </Section>
    </div>
  )
}

function NfpContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is NFP?</strong> No owners/shareholders — reports Net Assets (not equity). FASB ASC 958.</p>
        <p style={{ color: '#555', marginTop: 6 }}>영리 목적 없음 — 주주 대신 기부자와 이사회가 관리. NFP ≠ 면세 기관. 관련 없는 사업 소득엔 세금 부과됨.</p>
        <Table
          headers={['Net Asset Class', 'Condition', 'Example']}
          rows={[
            ['With donor restriction', '기부자가 목적/기간 제한', '특정 프로그램용 기부'],
            ['Without donor restriction', '조건 없음', '일반 기부금'],
            ['Endowment (permanent)', '원금 영구 보존', '장학재단 원금'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Endowment 원금 = 절대 사용 불가. 투자 수익만 지출 가능.</p>
      </Section>

      <Section title="0. Revenue — 5가지 종류">
        <Table
          headers={['종류', '설명', '예시']}
          rows={[
            ['① Contributions', '일방적 기부, 반대급부 없음', 'Donated cash, property'],
            ['② Exchange transactions', '서비스 대가 (ASC 606 적용)', '수강료, 컨설팅 대가'],
            ['③ Investment income', '배당·이자·자본이득', 'Endowment 투자수익'],
            ['④ Program service revenue', '사업 수행 대가', '입장료, 멤버십, 수강료'],
            ['⑤ Special events', '특별 행사 수익', '갈라 디너, 경매'],
          ]}
        />
        <p style={{ marginTop: 12, fontWeight: 600 }}>Support vs Revenue:</p>
        <Table
          headers={['구분', '해당 항목', '특징']}
          rows={[
            ['Support', 'Contributions, Grants', '반대급부 없음 (ASC 958)'],
            ['Revenue', 'Exchange, Program, Special events', '서비스·재화 대가'],
          ]}
        />
        <p style={{ color: '#555', marginTop: 8, fontSize: 13 }}>Special events: Revenue + Expense 동시 인식 (Gross 또는 Net 표시 모두 허용)</p>
      </Section>

      <Section title="1. Net Assets 분류">
        <Table
          headers={['분류', '설명', '예시']}
          rows={[
            ['Without donor restriction', '자유 사용 가능', '일반 기부금, 프로그램 수익'],
            ['With donor restriction — 일시적', '기간/목적 제한', '특정 프로그램용 기부'],
            ['With donor restriction — 영구', '원금 보존 필수', 'Endowment 원금'],
          ]}
        />
      </Section>

      <Section title="2. Contribution 인식 — Condition vs Restriction">
        <svg width="100%" viewBox="0 0 680 500" role="img" style={{ marginBottom: 16 }}>
          <title>NFP Condition vs Restriction</title>
          <desc>Condition과 Restriction 계층 구조</desc>
          <defs>
            <marker id="arrow-nfp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
            <marker id="arrow-dash-nfp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>
          <g className="c-amber"><rect x="20" y="20" width="290" height="36" rx="8" strokeWidth="0.5"/><text className="th" x="165" y="38" textAnchor="middle" dominantBaseline="central">Step 1 — Condition (인식 여부)</text></g>
          <line x1="165" y1="56" x2="165" y2="86" stroke="#BA7517" strokeWidth="1.5" markerEnd="url(#arrow-nfp)"/>
          <g className="c-amber"><rect x="20" y="86" width="128" height="72" rx="8" strokeWidth="0.5"/><text className="th" x="84" y="108" textAnchor="middle" dominantBaseline="central">Conditional</text><text className="ts" x="84" y="126" textAnchor="middle">조건 있음</text><text className="ts" x="84" y="142" textAnchor="middle">→ 충족 전 인식 금지</text></g>
          <g className="c-teal"><rect x="182" y="86" width="128" height="72" rx="8" strokeWidth="0.5"/><text className="th" x="246" y="108" textAnchor="middle" dominantBaseline="central">Unconditional</text><text className="ts" x="246" y="126" textAnchor="middle">조건 없음</text><text className="ts" x="246" y="142" textAnchor="middle">→ 즉시 인식 가능</text></g>
          <line x1="84" y1="158" x2="84" y2="190" stroke="#BA7517" strokeWidth="1.5" markerEnd="url(#arrow-nfp)"/>
          <g className="c-gray"><rect x="20" y="190" width="128" height="52" rx="8" strokeWidth="0.5"/><text className="th" x="84" y="208" textAnchor="middle" dominantBaseline="central">조건 충족 후</text><text className="ts" x="84" y="228" textAnchor="middle">→ Step 2로 이동</text></g>
          <line x1="246" y1="158" x2="246" y2="190" stroke="#1D9E75" strokeWidth="1.5" markerEnd="url(#arrow-nfp)"/>
          <g className="c-teal"><rect x="182" y="190" width="128" height="52" rx="8" strokeWidth="0.5"/><text className="th" x="246" y="208" textAnchor="middle" dominantBaseline="central">즉시 Step 2</text><text className="ts" x="246" y="228" textAnchor="middle">→ 바로 분류</text></g>
          <path d="M148 216 L340 216 L340 38" fill="none" stroke="#888780" strokeWidth="1" strokeDasharray="5 4" markerEnd="url(#arrow-dash-nfp)"/>
          <g className="c-gray"><rect x="20" y="264" width="290" height="80" rx="8" strokeWidth="0.5"/><text className="th" x="165" y="284" textAnchor="middle" dominantBaseline="central">예시</text><text className="ts" x="165" y="302" textAnchor="middle">Conditional: &quot;건물 완공 시 $100K 지급&quot;</text><text className="ts" x="165" y="318" textAnchor="middle">→ 완공 전: no revenue</text><text className="ts" x="165" y="334" textAnchor="middle">→ 완공 후: 인식 + Step 2 분류</text></g>
          <line x1="328" y1="20" x2="328" y2="468" stroke="var(--color-border-tertiary)" strokeWidth="0.5" strokeDasharray="4 4"/>
          <g className="c-teal"><rect x="342" y="20" width="318" height="36" rx="8" strokeWidth="0.5"/><text className="th" x="501" y="38" textAnchor="middle" dominantBaseline="central">Step 2 — Restriction (인식 후 분류)</text></g>
          <line x1="501" y1="56" x2="501" y2="86" stroke="#0F6E56" strokeWidth="1.5" markerEnd="url(#arrow-nfp)"/>
          <g className="c-purple"><rect x="342" y="86" width="148" height="118" rx="8" strokeWidth="0.5"/><text className="th" x="416" y="108" textAnchor="middle" dominantBaseline="central">With donor restriction</text><text className="ts" x="416" y="126" textAnchor="middle">목적·기간 제한 있음</text><text className="ts" x="416" y="142" textAnchor="middle">예: 장학금 기부</text><text className="ts" x="416" y="158" textAnchor="middle">예: endowment</text><text className="ts" x="416" y="176" textAnchor="middle">→ 해제 시 reclassify</text><text className="ts" x="416" y="196" textAnchor="middle">→ SCF: Financing</text></g>
          <g className="c-teal"><rect x="512" y="86" width="148" height="118" rx="8" strokeWidth="0.5"/><text className="th" x="586" y="108" textAnchor="middle" dominantBaseline="central">Without donor restriction</text><text className="ts" x="586" y="126" textAnchor="middle">제한 없음</text><text className="ts" x="586" y="142" textAnchor="middle">자유 사용 가능</text><text className="ts" x="586" y="158" textAnchor="middle">예: 일반 기부금</text><text className="ts" x="586" y="176" textAnchor="middle">→ 즉시 사용</text><text className="ts" x="586" y="196" textAnchor="middle">→ SCF: Operating</text></g>
          <g className="c-gray"><rect x="342" y="224" width="318" height="76" rx="8" strokeWidth="0.5"/><text className="th" x="501" y="244" textAnchor="middle" dominantBaseline="central">Reclassification — 제한 해제</text><text className="ts" x="501" y="262" textAnchor="middle">With DR↓ + Without DR↑ → Total net assets 불변</text><text className="ts" x="501" y="278" textAnchor="middle">Dr. Net assets with DR / Cr. Net assets without DR</text><text className="ts" x="501" y="294" textAnchor="middle">Statement of Activities 두 컬럼 반대 부호 표시</text></g>
          <g className="c-gray"><rect x="342" y="318" width="318" height="62" rx="8" strokeWidth="0.5"/><text className="th" x="501" y="338" textAnchor="middle" dominantBaseline="central">SCF — Contribution 분류</text><text className="ts" x="501" y="356" textAnchor="middle">일반·단기 목적 제한 → Operating</text><text className="ts" x="501" y="372" textAnchor="middle">Endowment·long-lived assets → Financing</text></g>
          <rect x="20" y="400" width="640" height="28" rx="6" stroke="var(--color-border-tertiary)" strokeWidth="0.5" fill="var(--color-background-secondary)"/><text className="ts" x="340" y="418" textAnchor="middle">Trap: Condition = 인식 여부 / Restriction = 인식 후 분류 — 완전히 다른 개념 / Reclassification = total net assets 불변</text>
          <rect x="20" y="436" width="640" height="24" rx="6" stroke="var(--color-border-tertiary)" strokeWidth="0.5" fill="var(--color-background-secondary)"/><text className="ts" x="340" y="452" textAnchor="middle">SCF Trap: &quot;Endowment activity&quot; 선지 → SCF에 존재하지 않는 분류 → 즉시 소거</text>
        </svg>
        <CodeBlock>{`Unconditional → 즉시 인식
  Dr. Receivable / Cr. Contribution Revenue (without restriction)

Conditional → 조건 충족 시 인식
  조건 충족 전: no recognition (어느 컬럼에도 없음)

Restriction 해제 (Reclassification):
  Dr. Net Assets with DR / Cr. Net Assets without DR
  → Total net assets 불변`}</CodeBlock>
      </Section>

      <Section title="3. Endowment">
        <CodeBlock>{`원금 = 영구 보존 (지출 불가)
수익 = 지출 가능 (donor 지정 없으면 unrestricted)
Investment income → without restriction (별도 지정 없는 경우)`}</CodeBlock>
      </Section>

      <Section title="3-1. Statement of Activities — 구조">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)', borderBottom: '1.5px solid var(--color-border-secondary)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}></th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Without DR</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>With DR</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={4} style={{ padding: '6px 12px', fontWeight: 600, color: '#444', borderBottom: '1px solid var(--color-border-tertiary)' }}>Revenue &amp; Support</td></tr>
              {[
                ['Contributions', '500,000', '200,000', '700,000'],
                ['Exchange transactions', '150,000', '—', '150,000'],
                ['Program service revenue', '80,000', '—', '80,000'],
                ['Investment income', '30,000', '—', '30,000'],
                ['Special events', '40,000', '—', '40,000'],
              ].map(([label, a, b, c]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '5px 12px', paddingLeft: 24 }}>{label}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{a}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{b}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{c}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)', color: '#185FA5' }}>
                <td style={{ padding: '5px 12px', paddingLeft: 24 }}>Net assets released from restriction</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>+50,000</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>(50,000)</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 600 }}>—</td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', fontWeight: 600, background: 'var(--color-background-secondary)' }}>
                <td style={{ padding: '6px 12px' }}>Total revenue</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>850,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>150,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>1,000,000</td>
              </tr>
              <tr><td colSpan={4} style={{ padding: '6px 12px', fontWeight: 600, color: '#444', borderBottom: '1px solid var(--color-border-tertiary)' }}>Expenses (Without DR 컬럼만)</td></tr>
              {[
                ['Program services', '(600,000)', '—', '(600,000)'],
                ['Management & General', '(150,000)', '—', '(150,000)'],
                ['Fundraising', '(50,000)', '—', '(50,000)'],
              ].map(([label, a, b, c]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '5px 12px', paddingLeft: 24 }}>{label}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{a}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{b}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{c}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', fontWeight: 600, background: 'var(--color-background-secondary)' }}>
                <td style={{ padding: '6px 12px' }}>Change in net assets</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>50,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>150,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>200,000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '5px 12px' }}>Net assets, beginning</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>400,000</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>100,000</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>500,000</td>
              </tr>
              <tr style={{ fontWeight: 700, background: 'var(--color-background-secondary)' }}>
                <td style={{ padding: '6px 12px' }}>Net assets, ending</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>450,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>250,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>700,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            'Reclassification Total = $0 → total net assets 불변',
            'Expense = Without DR 컬럼에만 표시',
            'Exchange transaction = With DR 없음',
            'Special events = Revenue + Expense 동시 인식',
          ].map((pt, i) => (
            <p key={i} style={{ fontSize: 13, color: '#555', paddingLeft: 12, borderLeft: '3px solid #c8c8c0' }}>{pt}</p>
          ))}
        </div>
      </Section>

      <Section title="4. Functional Expense 분류 — Nature × Function Matrix">
        <p style={{ marginBottom: 8 }}><strong>Functional (기능별):</strong> Program services / Management &amp; General / Fundraising</p>
        <p style={{ marginBottom: 12 }}><strong>Nature (성격별):</strong> Salaries / Rent / Depreciation / Supplies</p>
        <p style={{ marginBottom: 8, color: '#555', fontSize: 13 }}>ASC 958: Functional + Nature 두 방식 모두 공시 필수 (Matrix 표)</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
            <thead>
              <tr style={{ background: 'var(--color-background-secondary)', borderBottom: '1.5px solid var(--color-border-secondary)' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600 }}>Nature \\ Function</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Program</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>M&amp;G</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Fundraising</th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Salaries', '350,000', '100,000', '50,000', '500,000'],
                ['Rent', '60,000', '20,000', '10,000', '90,000'],
                ['Depreciation', '40,000', '15,000', '5,000', '60,000'],
              ].map(([label, a, b, c, d]) => (
                <tr key={label} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '5px 12px' }}>{label}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{a}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{b}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right' }}>{c}</td>
                  <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 600 }}>{d}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 700, background: 'var(--color-background-secondary)', borderTop: '1.5px solid var(--color-border-secondary)' }}>
                <td style={{ padding: '6px 12px' }}>Total</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>450,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>135,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>65,000</td>
                <td style={{ padding: '6px 12px', textAlign: 'right' }}>650,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="5. Statement of Cash Flows — Contribution 분류">
        <Table
          headers={['분류', '해당 기부금', '이유']}
          rows={[
            ['Operating', '제한 없는 기부금 / 단기 프로그램 목적', '단기 운영 관련'],
            ['Financing', 'Endowment 설립·증가 목적 / Long-lived assets 취득 목적', '장기 자본 조달 성격'],
          ]}
        />
        <p style={{ marginTop: 12, color: '#555', fontSize: 13 }}>SCF 3섹션: Operating / Investing / Financing — "Endowment activity" 섹션 없음.</p>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
          <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Trap</p>
          <p style={{ fontSize: 13, color: '#555' }}>"Endowment activity" 선지 → SCF에 존재하지 않는 분류 → 즉시 소거</p>
        </div>
      </Section>

      <DefaultBox items={[
        { default: 'Contribution 분류: With donor restriction', changed: '"no strings attached" / "unrestricted" 명시 → Without donor restriction' },
        { default: 'Conditional contribution: 인식 안 함', changed: '조건 충족 시 인식' },
      ]} />
      <TrapBox items={[
        'Conditional contribution → 조건 충족 전 어느 컬럼에도 없음',
        'Endowment 원금 지출 = 절대 불가',
        'Exchange transaction → ASC 606 적용 (contribution 아님)',
        'Reclassification → total net assets 불변 (With DR↓ = Without DR↑)',
        'Expense → Without DR 컬럼에만 표시',
        '"Endowment activity" SCF 선지 → 즉시 소거',
      ]} />
    </div>
  )
}

function GovContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Who pays? interactive tree */}
      <style>{`
        .gov-tree *{box-sizing:border-box}
        .gov-tree{padding:16px 0 24px;font-family:inherit}
        .gov-tree .who{font-size:13px;font-weight:500;color:var(--color-text-secondary,#888);margin:0 0 16px;padding:0 0 12px;border-bottom:0.5px solid var(--color-border-tertiary,#eee)}
        .gov-tree .card{border-radius:8px;border:0.5px solid var(--color-border-tertiary,#eee);padding:10px 14px;background:var(--color-background-secondary,#f9f9f9);min-width:160px}
        .gov-tree .card.root{background:var(--color-background-primary,#fff);border:1.5px solid var(--color-border-primary,#ccc);min-width:120px;text-align:center}
        .gov-tree .card.gov{border-left:3px solid #378ADD}
        .gov-tree .card.prop-ext{border-left:3px solid #1D9E75}
        .gov-tree .card.prop-int{border-left:3px solid #5DCAA5}
        .gov-tree .card.fid{border-left:3px solid #EF9F27}
        .gov-tree .card-title{font-size:13px;font-weight:500;margin:0 0 2px}
        .gov-tree .badge{display:inline-block;font-size:10px;padding:1px 7px;border-radius:20px;margin-bottom:6px}
        .gov-tree .badge.mod{background:#E6F1FB;color:#185FA5}
        .gov-tree .badge.full{background:#E1F5EE;color:#0F6E56}
        .gov-tree .badge.fid-b{background:#FAEEDA;color:#854F0B}
        .gov-tree .ex{font-size:11px;color:#888;line-height:1.6;padding-left:8px;position:relative}
        .gov-tree .ex::before{content:"·";position:absolute;left:1px}
        .gov-tree .payer-label{font-size:12px;font-weight:500;padding:6px 12px;border-radius:20px;border:0.5px solid var(--color-border-secondary,#ddd);background:var(--color-background-primary,#fff);white-space:nowrap;margin:6px 0;display:inline-block}
        .gov-tree .purpose{font-size:11px;padding:4px 10px;border-radius:6px;margin:2px 0 8px;display:inline-block}
        .gov-tree .purpose.gov-p{background:#E6F1FB;color:#185FA5}
        .gov-tree .purpose.ext-p{background:#E1F5EE;color:#0F6E56}
        .gov-tree .purpose.int-p{background:#E1F5EE;color:#0F6E56}
        .gov-tree .purpose.fid-p{background:#FAEEDA;color:#854F0B}
        .gov-tree .branch{display:flex;align-items:flex-start;gap:0;margin-bottom:24px}
        .gov-tree .hline{height:1.5px;width:36px;background:var(--color-border-secondary,#ddd);margin-top:20px;flex-shrink:0}
        .gov-tree .cards-wrap{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
        .gov-tree .vline{width:1.5px;background:var(--color-border-secondary,#ddd)}
      `}</style>
      <div className="gov-tree">
        <div className="who">Who pays? — 결제 주체 + 관리 목적으로 기금 이해하기</div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
          <div className="card root">
            <div className="card-title">Government funds</div>
            <div style={{fontSize:11,color:'#888',margin:0}}>11 fund types</div>
          </div>
          <div className="vline" style={{height:20}}></div>
        </div>
        <div style={{display:'flex',gap:0,alignItems:'flex-start'}}>
          <div className="vline" style={{alignSelf:'stretch'}}></div>
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            <div className="branch">
              <div className="hline"></div>
              <div>
                <div className="payer-label" style={{color:'#185FA5'}}>시민이 세금으로 납부</div>
                <div className="purpose gov-p">관리 포인트: 연간 예산을 목적에 맞게 잘 집행했는가? (current financial resources)</div>
                <div className="cards-wrap">
                  <div className="card gov"><div className="card-title">General fund</div><span className="badge mod">Modified accrual</span><div className="ex">Police &amp; fire dept.</div><div className="ex">Public school operations</div></div>
                  <div className="card gov"><div className="card-title">Special revenue fund</div><span className="badge mod">Modified accrual</span><div className="ex">Federal highway grant</div><div className="ex">Housing development grant</div></div>
                  <div className="card gov"><div className="card-title">Debt service fund</div><span className="badge mod">Modified accrual</span><div className="ex">Municipal bond repayment</div><div className="ex">G.O. bond debt service</div></div>
                  <div className="card gov"><div className="card-title">Capital projects fund</div><span className="badge mod">Modified accrual</span><div className="ex">New city hall construction</div><div className="ex">Bridge &amp; road expansion</div></div>
                  <div className="card gov"><div className="card-title">Permanent fund</div><span className="badge mod">Modified accrual</span><div className="ex">Park maintenance endowment</div><div className="ex">Cemetery perpetual care</div></div>
                </div>
              </div>
            </div>
            <div className="branch">
              <div className="hline"></div>
              <div>
                <div className="payer-label" style={{color:'#0F6E56'}}>시민이 요금으로 납부 (외부)</div>
                <div className="purpose ext-p">관리 포인트: 요금으로 원가를 회수하고 있는가? 수익성 파악 (economic resources)</div>
                <div className="cards-wrap">
                  <div className="card prop-ext"><div className="card-title">Enterprise fund</div><span className="badge full">Full accrual</span><div className="ex">Municipal water &amp; sewer</div><div className="ex">City airport</div><div className="ex">Public transit (bus/rail)</div></div>
                </div>
              </div>
            </div>
            <div className="branch">
              <div className="hline"></div>
              <div>
                <div className="payer-label" style={{color:'#0F6E56'}}>내부 정부 부서가 납부</div>
                <div className="purpose int-p">관리 포인트: 내부 서비스 원가를 부서별로 정확히 배분하고 있는가? (economic resources)</div>
                <div className="cards-wrap">
                  <div className="card prop-int"><div className="card-title">Internal service fund</div><span className="badge full">Full accrual</span><div className="ex">Fleet management</div><div className="ex">Central IT services</div><div className="ex">Central print shop</div></div>
                </div>
              </div>
            </div>
            <div className="branch">
              <div className="hline"></div>
              <div>
                <div className="payer-label" style={{color:'#854F0B'}}>남의 자산을 대신 관리</div>
                <div className="purpose fid-p">관리 포인트: 수탁 자산을 수익자를 위해 충실히 운용하고 있는가? (economic resources, no net position)</div>
                <div className="cards-wrap">
                  <div className="card fid"><div className="card-title">Pension trust fund</div><span className="badge fid-b">Full accrual</span><div className="ex">Public employee retirement</div></div>
                  <div className="card fid"><div className="card-title">Investment trust fund</div><span className="badge fid-b">Full accrual</span><div className="ex">Multi-govt investment pool</div></div>
                  <div className="card fid"><div className="card-title">Private-purpose trust</div><span className="badge fid-b">Full accrual</span><div className="ex">Scholarship for specific family</div></div>
                  <div className="card fid"><div className="card-title">Custodial fund</div><span className="badge fid-b">Full accrual</span><div className="ex">Property tax → remit to schools</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Section title="Concept & Context">
        <p><strong>What is Governmental Accounting?</strong> GASB governed (not FASB). Focus on stewardship of public resources, not profit.</p>
        <p style={{ color: '#555', marginTop: 6 }}>FASB 아닌 GASB 기준 / 이익 아닌 공공 자원 수탁 책임. Modified Accrual = Governmental funds / Full Accrual = Proprietary funds.</p>
        <Table
          headers={['Category', 'Fund types', 'Accrual basis']}
          rows={[
            ['Governmental', 'General, Special Revenue, Capital Projects, Debt Service', 'Modified Accrual'],
            ['Proprietary', 'Enterprise, Internal Service', 'Full Accrual'],
            ['Fiduciary', 'Pension Trust, Agency', 'Full Accrual'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Modified accrual = "거의 현금주의". Revenue available = 60일 내 수령 가능.</p>
      </Section>
      <Section title="1. Fund 유형 분류">
        <p style={{ fontWeight: 700, marginBottom: 6 }}>[Governmental Funds] — Modified Accrual</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#334155' }}>
          <li><strong>General Fund</strong> — Police, fire, public schools, general administration <span style={{ color: '#64748b' }}>// 특정 기금 불필요한 모든 일반 활동</span></li>
          <li><strong>Special Revenue Fund</strong> — Federal highway grants, housing development grants <span style={{ color: '#64748b' }}>// 특정 목적 지정 세입·보조금</span></li>
          <li><strong>Debt Service Fund</strong> — Municipal bond principal &amp; interest payments <span style={{ color: '#64748b' }}>// 지방채 원리금 상환 전용</span></li>
          <li><strong>Capital Projects Fund</strong> — City hall construction, bridge &amp; road projects, new school building <span style={{ color: '#64748b' }}>// 대규모 자본사업 한정</span></li>
          <li><strong>Permanent Fund</strong> — Park endowment fund (principal preserved; only earnings spent) <span style={{ color: '#64748b' }}>// 원금 영구 보존, 이자만 공공 목적</span></li>
        </ul>
        <p style={{ fontWeight: 700, margin: '14px 0 6px' }}>[Proprietary Funds] — Full Accrual</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#334155' }}>
          <li><strong>Enterprise Fund</strong> — Water/sewer utility, municipal airport, public transit, electric utility <span style={{ color: '#64748b' }}>// 외부 이용자에게 요금 부과</span></li>
          <li><strong>Internal Service Fund</strong> — Fleet management, IT services, central printing shop <span style={{ color: '#64748b' }}>// 내부 부서 간 서비스, 원가 회수</span></li>
        </ul>
        <p style={{ fontWeight: 700, margin: '14px 0 6px' }}>[Fiduciary Funds] — Full Accrual (no net position)</p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#334155' }}>
          <li><strong>Pension Trust Fund</strong> — Public employee pension assets <span style={{ color: '#64748b' }}>// 공무원 연금 자산 수탁</span></li>
          <li><strong>Investment Trust Fund</strong> — Multi-government investment pool <span style={{ color: '#64748b' }}>// 복수 지방정부 공동 투자 운영</span></li>
          <li><strong>Private-Purpose Trust Fund</strong> — Scholarship trust for specific individuals/orgs <span style={{ color: '#64748b' }}>// 특정 개인·단체 이익 목적 신탁</span></li>
          <li><strong>Custodial Fund</strong> — Property tax collected then distributed to school districts <span style={{ color: '#64748b' }}>// 대신 징수 후 타 기관 배분, 단순 보관</span></li>
        </ul>
      </Section>

      <Section title="Fund Types — Real-World Examples">
        {/* Governmental Funds */}
        <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', background: '#4f46e5', borderRadius: 6, padding: '3px 10px', display: 'inline-block', marginBottom: 10 }}>Governmental Funds — Modified Accrual</p>
        {[
          { fund: 'General Fund', items: ['Police & Fire Dept. — core government operations funded by general taxes', 'Public School Operations — day-to-day instructional costs'] },
          { fund: 'Special Revenue Fund', items: ['Federal Highway Grant — gas tax proceeds restricted to road maintenance', 'Housing Development Grant — federal funds restricted to affordable housing'] },
          { fund: 'Debt Service Fund', items: ['Municipal Bond Repayment — principal & interest on city bonds', 'G.O. Bond Debt Service — general obligation bond annual payments'] },
          { fund: 'Capital Projects Fund', items: ['New City Hall Construction — long-term capital facility project', 'Bridge & Road Expansion — infrastructure project funded by bond proceeds'] },
          { fund: 'Permanent Fund', items: ['Park Maintenance Endowment — principal preserved; only investment income spent', 'Cemetery Perpetual Care Fund — earnings used for ongoing maintenance'] },
        ].map(({ fund, items }) => (
          <div key={fund} style={{ marginBottom: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px' }}>
            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{fund}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {items.map(item => <li key={item} style={{ color: '#475569', fontSize: 13, lineHeight: 1.7 }}>{item}</li>)}
            </ul>
          </div>
        ))}

        {/* Proprietary Funds */}
        <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', background: '#0891b2', borderRadius: 6, padding: '3px 10px', display: 'inline-block', margin: '14px 0 10px' }}>Proprietary Funds — Full Accrual</p>
        {[
          { fund: 'Enterprise Fund', items: ['Municipal Water & Sewer — city utility charging residents usage fees', 'City Airport — charges airlines and passengers landing/terminal fees', 'Public Transit (Bus/Rail) — fare-based city transportation system'] },
          { fund: 'Internal Service Fund', items: ['Fleet Management — maintains city vehicles; charges other departments', 'Central IT Services — tech support billed to city departments internally', 'Central Print Shop — printing services billed to city departments'] },
        ].map(({ fund, items }) => (
          <div key={fund} style={{ marginBottom: 10, background: '#f0fdff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px' }}>
            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{fund}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {items.map(item => <li key={item} style={{ color: '#475569', fontSize: 13, lineHeight: 1.7 }}>{item}</li>)}
            </ul>
          </div>
        ))}

        {/* Fiduciary Funds */}
        <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', background: '#7c3aed', borderRadius: 6, padding: '3px 10px', display: 'inline-block', margin: '14px 0 10px' }}>Fiduciary Funds — Full Accrual</p>
        {[
          { fund: 'Pension Trust Fund', items: ['Public Employee Retirement System — manages pension assets for city employees'] },
          { fund: 'Investment Trust Fund', items: ['Multi-Government Investment Pool — pooled investment for several local governments'] },
          { fund: 'Private-Purpose Trust Fund', items: ['Scholarship Trust for Specific Family — benefits designated private individuals'] },
          { fund: 'Custodial Fund', items: ['Property Tax Collection — collects taxes then remits to school districts & other entities'] },
        ].map(({ fund, items }) => (
          <div key={fund} style={{ marginBottom: 10, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 14px' }}>
            <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{fund}</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {items.map(item => <li key={item} style={{ color: '#475569', fontSize: 13, lineHeight: 1.7 }}>{item}</li>)}
            </ul>
          </div>
        ))}

        {/* Key TIP */}
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginTop: 6 }}>
          <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 6px' }}>Key Distinction TIP</p>
          <p style={{ color: '#78350f', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            <strong>Enterprise vs Internal Service:</strong><br />
            → Enterprise = charges <strong>EXTERNAL</strong> users (citizens, airlines)<br />
            → Internal Service = charges <strong>INTERNAL</strong> government departments only<br /><br />
            <strong>Permanent Fund vs Private-Purpose Trust:</strong><br />
            → Permanent = benefits the <strong>PUBLIC</strong><br />
            → Private-Purpose = benefits specific <strong>PRIVATE</strong> individuals
          </p>
        </div>
      </Section>

      <Section title="왜 기금마다 회계 기준이 다른가?">
        <p style={{ fontWeight: 700, marginBottom: 4 }}>[Governmental Funds → Modified Accrual 이유]</p>
        <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: 8 }}>
          정부 세금으로 운영되는 기금의 핵심 질문은 <strong>"올해 예산을 적절히 사용했는가?"</strong>임.<br />
          수익성이 아니라 당해 연도 <strong>예산 통제(budgetary control)</strong>가 목적.<br />
          → 현금에 가까운 유동자원(current financial resources)만 추적하면 충분<br />
          → Modified Accrual: 수익은 available(60일 내 수령 가능)할 때만 인식, 지출은 부채 발생 시 인식
        </p>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>[Proprietary &amp; Fiduciary Funds → Full Accrual 이유]</p>
        <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: 10 }}>
          Enterprise Fund(상하수도 등)는 요금을 받고 서비스를 제공하는 비즈니스와 동일한 구조 → <strong>수익성·원가 파악</strong>이 필요<br />
          → 민간기업과 동일하게 Full Accrual + Economic resources measurement focus<br />
          → 장기 자산·부채(감가상각, 장기채무 등)까지 전부 인식
        </p>
        <p style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 14px', color: '#0369a1', fontStyle: 'italic' }}>
          Memory tip: "세금으로 예산 집행 → Modified / 요금 받고 장사 → Full Accrual"
        </p>
      </Section>

      <Section title="2. Modified Accrual 인식 기준">
        <CodeBlock>{`Revenue: available (60일 이내 수령) AND measurable
Expenditure: when liability incurred

Property tax:
  Measurable → levied 시점
  Available → 60일 이내 수령 가능한 금액만`}</CodeBlock>
      </Section>

      <Section title="3. Encumbrance 분개">
        <CodeBlock>{`주문/계약 시 (예약):
  Dr. Encumbrances              [예상금액]
    Cr. Fund Balance Reserved   [예상금액]

물품 수령 시 (예약 해제):
  Dr. Fund Balance Reserved     [예상금액]
    Cr. Encumbrances            [예상금액]

실제 지출 인식:
  Dr. Expenditure               [실제금액]
    Cr. Cash / Vouchers Payable [실제금액]`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Accrual basis: Modified accrual (Governmental funds)', changed: 'Proprietary funds (Enterprise/Internal Service) → Full accrual 적용' },
        { default: 'Revenue: available (60일) + measurable 동시 충족', changed: '조건 미충족 → 인식 불가' },
      ]} />
      <TrapBox items={[
        'Modified accrual = available (60일) + measurable 둘 다 필요',
        'Encumbrance = 예약 (실제 지출 아님)',
        'Proprietary fund = Full accrual (modified 아님)',
        'Property tax: measurable at levy, available = 60일',
      ]} />

      <Section title="용어 정리">
        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { term: 'GASB (Governmental Accounting Standards Board)', def: '미국 주·지방정부 회계기준 제정 기관. 민간기업의 FASB에 해당. 정부회계는 FASB가 아닌 GASB 기준 적용.' },
            { term: 'Modified Accrual', def: '수정발생주의. 수익은 measurable + available(60일 내 수령)할 때 인식. 지출은 부채 발생 시 인식. Governmental funds 적용.' },
            { term: 'Full Accrual', def: '완전발생주의. 민간기업 GAAP과 동일. 수익·비용 발생 기준 인식. Proprietary · Fiduciary funds 적용.' },
            { term: 'Measurement Focus', def: 'Current financial resources: 유동자원만 추적 (Governmental funds) / Economic resources: 장기 자산·부채 포함 전체 경제적 자원 추적 (Proprietary · Fiduciary)' },
            { term: 'Fund Accounting', def: '정부가 자원을 목적별로 분리해 관리하는 회계 방식. 각 fund는 독립된 회계 단위로 별도 재무제표 작성.' },
            { term: 'Available', def: 'Modified accrual에서 수익 인식 요건: 60일 이내 수령 가능한 상태.' },
          ].map(({ term, def }) => (
            <div key={term} style={{ borderLeft: '3px solid #6366f1', paddingLeft: 12 }}>
              <dt style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{term}</dt>
              <dd style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{def}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  )
}

function ChangesContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is an Accounting Change?</strong> Change in estimate, principle, entity, or correction of an error — each has different treatment.</p>
        <Table
          headers={['Type', 'Treatment', 'Example']}
          rows={[
            ['Change in Estimate', 'Prospective', '감가상각 내용연수 변경'],
            ['Change in Principle', 'Retrospective', 'FIFO → WA'],
            ['Change in Entity', 'Retrospective', '연결범위 변경'],
            ['Error Correction', 'Restatement', '잘못된 방법 사용'],
          ]}
        />
        <p style={{ marginTop: 8 }}><strong>Critical trap:</strong> 감가상각 방법 변경 = Change in <em>Estimate</em> (Prospective!) — 가장 자주 출제되는 함정.</p>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Estimate 변경 = 새로운 정보 반영. Principle 변경 = 다른 회계 방법 선택.</p>
      </Section>
      <Section title="1. 4가지 유형 비교">
        <Table
          headers={['유형', '처리 방법', '예시']}
          rows={[
            ['Change in Estimate', 'Prospective', '감가상각 내용연수 변경, 회수가능성'],
            ['Change in Accounting Principle', 'Retrospective', 'FIFO→LIFO, 수익인식 방법'],
            ['Change in Reporting Entity', 'Retrospective', '연결범위 변경'],
            ['Error Correction', 'Restatement (prior period)', '수익 이중 인식, 분류 오류'],
          ]}
        />
      </Section>

      <Section title="2. Error Correction 처리">
        <CodeBlock>{`Prior period error → Restatement
  Dr./Cr. Retained Earnings (net of tax)   [누적 효과]

공시 필수: 수정 내용, 영향 금액, 이유`}</CodeBlock>
      </Section>

      <Section title="3. 감가상각법 변경 (Estimate 취급)">
        <CodeBlock>{`감가상각법 변경 = Change in Estimate (Prospective)
  새 감가상각비 = 남은 BV ÷ 남은 내용연수
  (잔존가 차감 후 남은 연수로 나눔)

예시: BV $60,000 / 잔여 3년 / 잔존가 $0
  → 새 감가상각비 = $60,000 ÷ 3 = $20,000/yr`}</CodeBlock>
      </Section>

      <TrapBox items={[
        '감가상각법 변경 = Estimate 변경 (Principle 아님!)',
        'Retrospective = 과거 FS 재작성 (소급 적용)',
        'Error = Restatement + 공시 필수',
        '소급 적용 시 세금 효과(net of tax) 고려',
      ]} />
    </div>
  )
}

function FvContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Fair Value?</strong> Exit price — 팔 때 받을 가격 (사는 가격 아님). FASB ASC 820.</p>
        <Table
          headers={['Level', 'Input', 'Example']}
          rows={[
            ['L1', 'Identical + active market', 'NYSE 상장 주식'],
            ['L2', 'Observable, not L1', '유사 채권, 비활성 시장 identical 자산'],
            ['L3', 'Unobservable (내부 모델)', '비상장사 DCF 평가'],
          ]}
        />
        <p style={{ marginTop: 8 }}><strong>3 approaches:</strong> Market / Income (DCF) / Cost (replacement)</p>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: L1 = Bloomberg에서 바로 검색. L3 = 내가 직접 모델 만들어서 추정. Similar + active → L2 (L1 아님!).</p>
      </Section>
      <Section title="1. Fair Value Hierarchy">
        <Table
          headers={['Level', '정의', '예시']}
          rows={[
            ['Level 1', 'Identical asset/liability + Active market', 'NYSE 상장 주식'],
            ['Level 2', 'Similar + Active OR Identical + Inactive', 'OTC bond, 유사 자산'],
            ['Level 3', 'Unobservable / Internal assumptions', 'Internal DCF, 비상장 주식'],
          ]}
        />
      </Section>

      <Section title="2. 3가지 측정 방법">
        <Table
          headers={['방법', '설명', '적용']}
          rows={[
            ['Market approach', 'Comparable transactions/multiples', '유사 거래 가격 비교'],
            ['Income approach', 'PV of future cash flows (DCF)', '수익 창출 자산'],
            ['Cost approach', 'Replacement cost', '특수 자산, 구형 장비'],
          ]}
        />
      </Section>

      <Section title="3. Exit Price 원칙">
        <CodeBlock>{`Fair Value = Exit price (판매/이전 시 수령 금액)
           ≠ Entry price (취득 원가)

Principal market: 가장 거래량 많은 시장 우선
Most advantageous market: principal market 없을 때`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'Similar + Active market → L2 (L1 아님)',
        'Identical + Inactive market → L2 (L1 아님)',
        '내부 DCF → L3 (복잡해도 L3)',
        'FV = exit price (entry price 아님!)',
      ]} />
    </div>
  )
}

// ── New Category Content Functions ────────────────────────────────────────────

function FxContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is a Foreign Currency transaction?</strong> US company transacts in foreign currency → exchange rate changes create FX gains/losses.</p>
        <p style={{ color: '#555', marginTop: 6 }}>환율 변동으로 발생하는 손익. Record at spot rate on title transfer date.</p>
        <Table
          headers={['"Units of FC per dollar"', 'Meaning', 'AR effect']}
          rows={[
            ['↓ Decrease', '외화 강세 / 달러 약세', 'FX Gain (AR 가치 상승)'],
            ['↑ Increase', '외화 약세 / 달러 강세', 'FX Loss (AR 가치 하락)'],
          ]}
        />
        <CodeBlock>{`Timeline:
  Transaction date → record at spot rate
  B/S date         → remeasure at current rate → FX G/L
  Settlement date  → settle at spot rate → FX G/L`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: "달러당 외화 수"가 줄면 = 달러 약세 = 외화 강세. AR + 외화 강세 → FX Gain.</p>
      </Section>
      <Section title="1. Overview">
        <Table
          headers={['개념', '설명']}
          rows={[
            ['Foreign currency transaction', '거래 시점 spot rate으로 인식'],
            ['AR/AP + 환율 변동', '결제 시 FX Gain/Loss 인식'],
            ['JE 기준일', 'Title transfer 날짜 (계약일·지급일 아님)'],
            ['"units of FC per dollar"', '숫자↓ = 외화 강세 = dollar 약세'],
          ]}
        />
      </Section>

      <Section title="2. 출제 유형">
        <Table
          headers={['유형', '키워드', '로직']}
          rows={[
            ['AR + FX Gain', 'exchange rate direction', '외화강세 → units per $ Decrease'],
            ['AP + FX Loss', 'units of FC per dollar', '외화강세 → AP 상환 비용 증가'],
            ['JE timing', 'title transfer date', '계약일·지급일 기준 아님'],
          ]}
        />
      </Section>

      <Section title="3. Accounting Treatment">
        <CodeBlock>{`매출 인식 (title transfer 날짜):
  Dr. AR (spot rate)     XXX
    Cr. Sales                  XXX

결제 시 (환율 변동 — 외화 강세, FX Gain):
  Dr. Cash (new rate)    XXX
    Cr. AR (original rate)     XXX
    Cr. FX Gain                XXX

결제 시 (환율 변동 — 외화 약세, FX Loss):
  Dr. Cash (new rate)    XXX
  Dr. FX Loss            XXX
    Cr. AR (original rate)     XXX`}</CodeBlock>
      </Section>

      <Section title="4. AR & AP — FX Gain/Loss Visualization">
        <div className="fx-diagram" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <svg width="100%" viewBox="0 0 680 660" role="img">
            <title>FX AR visualization</title>
            <desc>AR 거래 숫자 설명과 간접법 그래프</desc>
            <defs>
              <marker id="arrow-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-purple"><rect x="20" y="10" width="640" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="26" textAnchor="middle" dominantBaseline="central">AR — Expecting to receive 800,000 yen (US company)</text></g>
            <g className="c-gray"><rect x="20" y="54" width="174" height="72" rx="8" strokeWidth="0.5"/><text className="th" x="107" y="72" textAnchor="middle" dominantBaseline="central">Transaction date</text><text className="ts" x="107" y="90" textAnchor="middle" dominantBaseline="central">$1 = 80 yen</text><text className="th" x="107" y="114" textAnchor="middle" dominantBaseline="central">AR = $10,000</text></g>
            <text className="ts" x="107" y="138" textAnchor="middle">800,000 ÷ 80 = $10,000</text>
            <line x1="194" y1="90" x2="226" y2="90" stroke="#888" strokeWidth="1.5" markerEnd="url(#arrow-ar)"/>
            <g className="c-coral"><rect x="230" y="54" width="200" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="330" y="70" textAnchor="middle" dominantBaseline="central">Case A: $1 = 82 yen</text></g>
            <g className="c-coral"><rect x="230" y="94" width="200" height="42" rx="8" strokeWidth="0.5"/><text className="th" x="330" y="112" textAnchor="middle" dominantBaseline="central">Received: $9,756</text><text className="ts" x="330" y="128" textAnchor="middle" dominantBaseline="central">800,000 ÷ 82</text></g>
            <g className="c-coral"><rect x="230" y="144" width="200" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="330" y="158" textAnchor="middle" dominantBaseline="central">FX Loss $244 — received less</text></g>
            <text className="ts" x="330" y="186" textAnchor="middle">Dr. Cash                $9,756</text>
            <text className="ts" x="330" y="202" textAnchor="middle">Dr. FX Loss               $244</text>
            <text className="ts" x="340" y="218" textAnchor="middle">Cr. AR                          $10,000</text>
            <g className="c-teal"><rect x="450" y="54" width="210" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="555" y="70" textAnchor="middle" dominantBaseline="central">Case B: $1 = 78 yen</text></g>
            <g className="c-teal"><rect x="450" y="94" width="210" height="42" rx="8" strokeWidth="0.5"/><text className="th" x="555" y="112" textAnchor="middle" dominantBaseline="central">Received: $10,256</text><text className="ts" x="555" y="128" textAnchor="middle" dominantBaseline="central">800,000 ÷ 78</text></g>
            <g className="c-teal"><rect x="450" y="144" width="210" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="555" y="158" textAnchor="middle" dominantBaseline="central">FX Gain $256 — received more</text></g>
            <text className="ts" x="555" y="186" textAnchor="middle">Dr. Cash               $10,256</text>
            <text className="ts" x="565" y="202" textAnchor="middle">Cr. AR                         $10,000</text>
            <text className="ts" x="565" y="218" textAnchor="middle">Cr. FX Gain                      $256</text>
            <line x1="20" y1="238" x2="660" y2="238" stroke="#d0d0c8" strokeWidth="0.5" strokeDasharray="4 3"/>
            <line x1="100" y1="256" x2="100" y2="500" stroke="#555" strokeWidth="1" markerEnd="url(#arrow-ar)"/>
            <line x1="100" y1="480" x2="640" y2="480" stroke="#555" strokeWidth="1" markerEnd="url(#arrow-ar)"/>
            <text className="ts" x="96" y="260" textAnchor="end">$ per FC</text>
            <text className="ts" x="96" y="274" textAnchor="end">(indirect)</text>
            <text className="ts" x="640" y="494" textAnchor="start">time</text>
            <text className="ts" x="92" y="308" textAnchor="end">$0.0128</text>
            <line x1="96" y1="308" x2="104" y2="308" stroke="#555" strokeWidth="0.5"/>
            <text className="ts" x="92" y="378" textAnchor="end">$0.0125</text>
            <line x1="96" y1="378" x2="104" y2="378" stroke="#555" strokeWidth="0.5"/>
            <text className="ts" x="92" y="448" textAnchor="end">$0.0122</text>
            <line x1="96" y1="448" x2="104" y2="448" stroke="#555" strokeWidth="0.5"/>
            <line x1="100" y1="378" x2="625" y2="378" stroke="#d0d0c8" strokeWidth="0.5" strokeDasharray="4 3"/>
            <text className="ts" x="627" y="375" textAnchor="start">base</text>
            <rect x="120" y="358" width="200" height="122" fill="#FAECE7" opacity="0.4"/>
            <line x1="120" y1="378" x2="300" y2="448" stroke="#D85A30" strokeWidth="2.5"/>
            <circle cx="120" cy="378" r="5" fill="#D85A30"/>
            <circle cx="300" cy="448" r="5" fill="#D85A30"/>
            <text className="ts" x="210" y="268" textAnchor="middle" style={{ fill: '#993C1D' }}>FC depreciates</text>
            <text className="ts" x="210" y="282" textAnchor="middle" style={{ fill: '#993C1D' }}>Dollar up</text>
            <g className="c-coral"><rect x="162" y="454" width="96" height="24" rx="12" strokeWidth="0.5"/><text className="th" x="210" y="466" textAnchor="middle" dominantBaseline="central">AR Loss</text></g>
            <rect x="360" y="258" width="240" height="222" fill="#E1F5EE" opacity="0.4"/>
            <line x1="360" y1="378" x2="560" y2="308" stroke="#1D9E75" strokeWidth="2.5"/>
            <circle cx="360" cy="378" r="5" fill="#1D9E75"/>
            <circle cx="560" cy="308" r="5" fill="#1D9E75"/>
            <text className="ts" x="480" y="268" textAnchor="middle" style={{ fill: '#0F6E56' }}>FC appreciates</text>
            <text className="ts" x="480" y="282" textAnchor="middle" style={{ fill: '#0F6E56' }}>Dollar down</text>
            <g className="c-teal"><rect x="432" y="294" width="96" height="24" rx="12" strokeWidth="0.5"/><text className="th" x="480" y="306" textAnchor="middle" dominantBaseline="central">AR Gain</text></g>
            <g className="c-amber"><rect x="20" y="510" width="640" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="526" textAnchor="middle" dominantBaseline="central">Speed — AR</text><text className="ts" x="340" y="544" textAnchor="middle" dominantBaseline="central">FC up (graph up) = receive more = Gain / FC down (graph down) = receive less = Loss</text></g>
            <g className="c-gray"><rect x="20" y="564" width="640" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="580" textAnchor="middle" dominantBaseline="central">Direct quote trap</text><text className="ts" x="340" y="598" textAnchor="middle" dominantBaseline="central">"units of FC per $" up = FC weakens (opposite of graph) — denominator is FC</text></g>
          </svg>
          <svg width="100%" viewBox="0 0 680 660" role="img">
            <title>FX AP visualization</title>
            <desc>AP 거래 숫자 설명과 간접법 그래프</desc>
            <defs>
              <marker id="arrow-ap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-blue"><rect x="20" y="10" width="640" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="26" textAnchor="middle" dominantBaseline="central">AP — Expecting to pay 800,000 yen (US company)</text></g>
            <g className="c-gray"><rect x="20" y="54" width="174" height="72" rx="8" strokeWidth="0.5"/><text className="th" x="107" y="72" textAnchor="middle" dominantBaseline="central">Transaction date</text><text className="ts" x="107" y="90" textAnchor="middle" dominantBaseline="central">$1 = 80 yen</text><text className="th" x="107" y="114" textAnchor="middle" dominantBaseline="central">AP = $10,000</text></g>
            <text className="ts" x="107" y="138" textAnchor="middle">800,000 ÷ 80 = $10,000</text>
            <line x1="194" y1="90" x2="226" y2="90" stroke="#888" strokeWidth="1.5" markerEnd="url(#arrow-ap)"/>
            <g className="c-teal"><rect x="230" y="54" width="200" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="330" y="70" textAnchor="middle" dominantBaseline="central">Case A: $1 = 82 yen</text></g>
            <g className="c-teal"><rect x="230" y="94" width="200" height="42" rx="8" strokeWidth="0.5"/><text className="th" x="330" y="112" textAnchor="middle" dominantBaseline="central">Paid: $9,756</text><text className="ts" x="330" y="128" textAnchor="middle" dominantBaseline="central">800,000 ÷ 82</text></g>
            <g className="c-teal"><rect x="230" y="144" width="200" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="330" y="158" textAnchor="middle" dominantBaseline="central">FX Gain $244 — paid less</text></g>
            <text className="ts" x="330" y="186" textAnchor="middle">Dr. AP                 $10,000</text>
            <text className="ts" x="340" y="202" textAnchor="middle">Cr. Cash                          $9,756</text>
            <text className="ts" x="340" y="218" textAnchor="middle">Cr. FX Gain                        $244</text>
            <g className="c-coral"><rect x="450" y="54" width="210" height="32" rx="8" strokeWidth="0.5"/><text className="th" x="555" y="70" textAnchor="middle" dominantBaseline="central">Case B: $1 = 78 yen</text></g>
            <g className="c-coral"><rect x="450" y="94" width="210" height="42" rx="8" strokeWidth="0.5"/><text className="th" x="555" y="112" textAnchor="middle" dominantBaseline="central">Paid: $10,256</text><text className="ts" x="555" y="128" textAnchor="middle" dominantBaseline="central">800,000 ÷ 78</text></g>
            <g className="c-coral"><rect x="450" y="144" width="210" height="28" rx="6" strokeWidth="0.5"/><text className="th" x="555" y="158" textAnchor="middle" dominantBaseline="central">FX Loss $256 — paid more</text></g>
            <text className="ts" x="555" y="186" textAnchor="middle">Dr. AP                 $10,000</text>
            <text className="ts" x="555" y="202" textAnchor="middle">Dr. FX Loss                $256</text>
            <text className="ts" x="565" y="218" textAnchor="middle">Cr. Cash                         $10,256</text>
            <line x1="20" y1="238" x2="660" y2="238" stroke="#d0d0c8" strokeWidth="0.5" strokeDasharray="4 3"/>
            <line x1="100" y1="256" x2="100" y2="500" stroke="#555" strokeWidth="1" markerEnd="url(#arrow-ap)"/>
            <line x1="100" y1="480" x2="640" y2="480" stroke="#555" strokeWidth="1" markerEnd="url(#arrow-ap)"/>
            <text className="ts" x="96" y="260" textAnchor="end">$ per FC</text>
            <text className="ts" x="96" y="274" textAnchor="end">(indirect)</text>
            <text className="ts" x="640" y="494" textAnchor="start">time</text>
            <text className="ts" x="92" y="308" textAnchor="end">$0.0128</text>
            <line x1="96" y1="308" x2="104" y2="308" stroke="#555" strokeWidth="0.5"/>
            <text className="ts" x="92" y="378" textAnchor="end">$0.0125</text>
            <line x1="96" y1="378" x2="104" y2="378" stroke="#555" strokeWidth="0.5"/>
            <text className="ts" x="92" y="448" textAnchor="end">$0.0122</text>
            <line x1="96" y1="448" x2="104" y2="448" stroke="#555" strokeWidth="0.5"/>
            <line x1="100" y1="378" x2="625" y2="378" stroke="#d0d0c8" strokeWidth="0.5" strokeDasharray="4 3"/>
            <text className="ts" x="627" y="375" textAnchor="start">base</text>
            <rect x="120" y="258" width="200" height="222" fill="#E1F5EE" opacity="0.4"/>
            <line x1="120" y1="378" x2="300" y2="308" stroke="#1D9E75" strokeWidth="2.5"/>
            <circle cx="120" cy="378" r="5" fill="#1D9E75"/>
            <circle cx="300" cy="308" r="5" fill="#1D9E75"/>
            <text className="ts" x="210" y="268" textAnchor="middle" style={{ fill: '#0F6E56' }}>FC depreciates</text>
            <text className="ts" x="210" y="282" textAnchor="middle" style={{ fill: '#0F6E56' }}>Dollar up</text>
            <g className="c-teal"><rect x="162" y="294" width="96" height="24" rx="12" strokeWidth="0.5"/><text className="th" x="210" y="306" textAnchor="middle" dominantBaseline="central">AP Gain</text></g>
            <rect x="360" y="358" width="240" height="122" fill="#FAECE7" opacity="0.4"/>
            <line x1="360" y1="378" x2="560" y2="448" stroke="#D85A30" strokeWidth="2.5"/>
            <circle cx="360" cy="378" r="5" fill="#D85A30"/>
            <circle cx="560" cy="448" r="5" fill="#D85A30"/>
            <text className="ts" x="480" y="268" textAnchor="middle" style={{ fill: '#993C1D' }}>FC appreciates</text>
            <text className="ts" x="480" y="282" textAnchor="middle" style={{ fill: '#993C1D' }}>Dollar down</text>
            <g className="c-coral"><rect x="432" y="454" width="96" height="24" rx="12" strokeWidth="0.5"/><text className="th" x="480" y="466" textAnchor="middle" dominantBaseline="central">AP Loss</text></g>
            <g className="c-amber"><rect x="20" y="510" width="640" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="526" textAnchor="middle" dominantBaseline="central">Speed — AP</text><text className="ts" x="340" y="544" textAnchor="middle" dominantBaseline="central">FC up (graph up) = pay more = Loss / FC down (graph down) = pay less = Gain</text></g>
            <g className="c-gray"><rect x="20" y="564" width="640" height="44" rx="8" strokeWidth="0.5"/><text className="th" x="340" y="580" textAnchor="middle" dominantBaseline="central">AR vs AP — opposite direction</text><text className="ts" x="340" y="598" textAnchor="middle" dominantBaseline="central">Same FC move → AR and AP always produce opposite gain/loss</text></g>
          </svg>
        </div>
      </Section>

      <Section title="4. 환율 방향 해석">
        <Table
          headers={['상황', '"units of FC per $" 변화', '결과']}
          rows={[
            ['외화 강세 / dollar 약세', '감소 (Decrease)', 'AR 보유 → FX Gain'],
            ['외화 약세 / dollar 강세', '증가 (Increase)', 'AR 보유 → FX Loss'],
            ['AP 보유 + 외화 강세', '감소', 'AP 상환 비용↑ → FX Loss'],
          ]}
        />
      </Section>

      <DefaultBox items={[
        { default: 'JE 시점: Title transfer date', changed: '"payment date" 또는 "contract date" 언급 → 함정 (오답) — title transfer 기준 유지' },
      ]} />
      <TrapBox items={[
        '"units of foreign currency per dollar" 숫자↓ = 외화 강세 (직관과 반대!)',
        'AR + 외화 강세 → FX Gain (외화로 더 받으니까)',
        'JE 기준 = title transfer 날짜 (계약서 서명일·대금 지급일 아님)',
        '결산일 미결제 AR/AP → spot rate으로 재평가 → FX Gain/Loss 인식',
      ]} />
    </div>
  )
}

function RatioContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Ratio Analysis?</strong> Financial ratios measure performance, liquidity, efficiency, and value from financial statements.</p>
        <p style={{ color: '#555', marginTop: 6 }}>재무제표 숫자로 기업 건강도 측정. 반드시 Average 사용 (ending 단독 금지).</p>
        <Table
          headers={['Category', 'Ratio', 'Formula']}
          rows={[
            ['Liquidity', 'Current ratio', 'CA ÷ CL'],
            ['Liquidity', 'Quick ratio', '(Cash+ST inv+AR) ÷ CL'],
            ['Profitability', 'ROA', 'NI ÷ Avg total assets'],
            ['Profitability', 'ROE', 'NI ÷ Avg SE'],
            ['Efficiency', 'Asset turnover', 'Net sales ÷ Avg total assets'],
            ['Efficiency', 'DSO', '365 ÷ AR turnover'],
            ['Market', 'P/E', 'Market price ÷ Basic EPS'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Quick ratio = 지금 당장 현금화 가능한 것만. 재고는 팔아야 현금 — 즉시 현금화 불가.</p>
      </Section>
      <Section title="1. Liquidity Ratios">
        <Table
          headers={['지표', '공식', '예시']}
          rows={[
            ['Current Ratio', 'Current Assets ÷ Current Liabilities', 'CA $300K ÷ CL $150K = 2.0'],
            ['Quick Ratio', '(Cash + ST Inv + AR) ÷ CL', '($300K−$80K−$10K) ÷ $150K = 1.4'],
          ]}
        />
      </Section>

      <Section title="2. Profitability Ratios">
        <Table
          headers={['지표', '공식', '주의']}
          rows={[
            ['Gross Margin %', '(Sales − COGS) ÷ Sales', ''],
            ['Net Profit Margin', 'NI ÷ Net Sales', ''],
            ['ROA', 'NI ÷ Avg Total Assets', 'Avg (기초+기말÷2) 필수'],
            ['ROE', 'NI ÷ Avg Stockholders\' Equity', 'Avg 필수'],
          ]}
        />
      </Section>

      <Section title="3. Efficiency & Market Ratios">
        <Table
          headers={['지표', '공식', '예시']}
          rows={[
            ['Asset Turnover', 'Net Sales ÷ Avg Total Assets', '$67.5M ÷ $90M = 0.75'],
            ['AR Turnover', 'Net Sales ÷ Avg AR', ''],
            ['DSO', '365 ÷ AR Turnover', ''],
            ['P/E Ratio', 'Market Price per Share ÷ Basic EPS', '$45 ÷ $3.00 = 15×'],
          ]}
        />
      </Section>

      <TrapBox items={[
        'Asset Turnover → Ending 단독 사용 금지 → 반드시 평균(Avg) 사용',
        'Quick Ratio → Inventory AND Prepaid 둘 다 제외',
        'ROA/ROE 분모 → 반드시 Average (Ending만 사용 시 오답)',
        'P/E 분모 = Basic EPS (Diluted EPS 사용 주의)',
        'DSO 공식: 365 ÷ AR Turnover (AR Turnover = Net Sales ÷ Avg AR)',
      ]} />
    </div>
  )
}

function ConsolContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Consolidation?</strong> Parent {`>`} 50% → present as single economic entity. All intercompany transactions eliminated.</p>
        <p style={{ color: '#555', marginTop: 6 }}>연결재무제표 = "하나의 회사인 척". 내부거래 흔적 전부 제거.</p>
        <CodeBlock>{`Goodwill = Acquisition price − FV of net assets × %

Key eliminations:
  Intercompany sales   → Dr. Sales / Cr. COGS
  Unrealized profit    → Dr. COGS / Cr. Inventory
  Intercompany dividends → 제거

Downstream (parent → sub): 100% parent NI 조정
Upstream (sub → parent): parent + NCI 비례 배분`}</CodeBlock>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Goodwill = 취득가 − FV 순자산 (BV 아님!). No amortization, annual impairment test.</p>
      </Section>
      <Section title="1. Overview">
        <Table
          headers={['개념', '설명']}
          rows={[
            ['연결 목적', 'Parent + Subsidiary → 단일 경제적 실체'],
            ['Intercompany 거래', '전부 제거 (Elimination)'],
            ['NCI', 'Non-controlling interest — minority 지분'],
            ['Goodwill', '취득가 − FV of net assets × 취득 %'],
          ]}
        />
      </Section>

      <Section title="2. 취득 분개 & 연결 제거 분개">
        <CodeBlock>{`취득:
  Dr. Investment in Sub   XXX
    Cr. Cash                    XXX

연결 제거 (elimination):
  Dr. Common Stock (Sub)   XXX
  Dr. Retained Earnings (Sub) XXX
  Dr. Goodwill             XXX
    Cr. Investment in Sub        XXX
    Cr. NCI                      XXX`}</CodeBlock>
      </Section>

      <Section title="3. Intercompany 거래 제거">
        <CodeBlock>{`Intercompany sale (미실현이익 포함):
  Dr. Sales (intercompany)   XXX
    Cr. COGS (intercompany)       XXX

미실현이익 제거 (재고 미판매 시):
  Dr. COGS (or Inv.)   XXX
    Cr. Inventory              XXX`}</CodeBlock>
      </Section>

      <Section title="4. Downstream vs Upstream">
        <Table
          headers={['유형', '판매 방향', '미실현이익 귀속']}
          rows={[
            ['Downstream', 'Parent → Sub', 'Parent NI 전액 조정'],
            ['Upstream', 'Sub → Parent', 'NCI에도 비례 배분'],
          ]}
        />
      </Section>

      <DefaultBox items={[
        { default: '>50% 지분 → Consolidation', changed: '"significant influence only" 명시 → Equity method (20~50%)' },
        { default: 'VIE: 지분율 무관', changed: 'Primary beneficiary → 무조건 연결' },
      ]} />
      <TrapBox items={[
        'Goodwill = 취득가 − FV of net assets (BV 아님!)',
        'Consolidated dividend = Parent 배당만 (Sub 배당은 제거)',
        'Downstream: Parent가 판매 → Parent NI에서 전액 제거',
        'Upstream: Sub가 판매 → NCI에도 미실현이익 배분',
        'Intercompany receivable/payable → 연결 B/S에서 상계 제거',
      ]} />
      <Section title="Key Terms — Consolidation">
        <Table
          headers={['Term', 'Also known as', 'Note']}
          rows={[
            ['NCI', 'Non-controlling interest / Minority interest (구)', '지배주주 외 나머지 지분'],
            ['Goodwill', 'Purchase price premium', '상각 없음, annual impairment'],
            ['Downstream', 'Parent → Sub 거래', '미실현이익 100% parent'],
            ['Upstream', 'Sub → Parent 거래', 'parent + NCI 비율 배분'],
          ]}
        />
        <CodeBlock>{`Goodwill = Acquisition price
         − FV of net identifiable assets × parent ownership %

NCI = FV of subsidiary × NCI %
    (NCI % = 1 − parent ownership %)

Upstream unrealized profit elimination:
  Parent NI → × parent ownership % 제거
  NCI       → × NCI % 제거`}</CodeBlock>
      </Section>
    </div>
  )
}

function SubsequentContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is a Subsequent Event?</strong> Event after B/S date but before financial statements are issued.</p>
        <p style={{ color: '#555', marginTop: 6 }}>결산일 이후 ~ 재무제표 발행 전 사이 사건. 발행 후 사건은 반영 불가.</p>
        <Table
          headers={['Type', 'Condition', 'Treatment']}
          rows={[
            ['Type 1 (Recognized)', 'B/S일 이전 조건 존재', 'FS 수정'],
            ['Type 2 (Disclosed)', 'B/S일 이후 새로운 조건', '주석 공시만'],
          ]}
        />
        <p style={{ marginTop: 8 }}>Type 1 예: 소송 (소송은 B/S일 전 제기, 판결은 이후) / Type 2 예: 자연재해, 주가 폭락</p>
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: Type 1 = "이미 알고 있던 문제의 확인". Type 2 = "완전히 새로운 사건".</p>
      </Section>
      <Section title="1. Overview — Type 1 vs Type 2">
        <Table
          headers={['유형', '조건', '처리', '예시']}
          rows={[
            ['Type 1 (Recognized)', 'BS일 이전 조건 존재', 'FS 수정', '소송 — BS일 전 발생, 판결은 이후'],
            ['Type 2 (Disclosed)', 'BS일 이후 새로운 조건', '주석 공시만', '자연재해, 주가 폭락'],
          ]}
        />
      </Section>

      <Section title="2. Accounting Treatment">
        <CodeBlock>{`Type 1 — 인식 (소송 패소, BS일 이전 조건 확인):
  Dr. Loss on Litigation   XXX
    Cr. Litigation Liability       XXX

Type 2 — 공시만 (분개 없음):
  → 재무제표 주석에 사건 내용 설명만
  → FS 본문 수정 없음`}</CodeBlock>
      </Section>

      <Section title="3. 기준일">
        <Table
          headers={['구간', '처리 가능 여부']}
          rows={[
            ['BS date 이전 조건', 'Type 1 or Type 2 판단 대상'],
            ['BS date ~ FS 발행일', '반영 가능 (Type 1/2 판단)'],
            ['FS 발행일 이후', '반영 불가 (고려 대상 아님)'],
          ]}
        />
      </Section>

      <DefaultBox items={[
        { default: 'FS issuance date 기준 (Public company)', changed: 'Private company → FS available to be issued date' },
        { default: 'Type 1: B/S일 이전 조건 존재 → 수정', changed: 'Type 2: B/S일 이후 새로운 조건 → 주석 공시만' },
      ]} />
      <TrapBox items={[
        'BS일 이후 주가 폭락 → Type 2 (새로운 조건, 수정 불필요)',
        'BS일 이전 소송 → 판결이 BS일 이후여도 → Type 1 (수정 필요)',
        'FS 발행일 이후 사건 → 반영 불가',
        '주식 추가 발행 (BS일 이후) → Type 2 공시만',
      ]} />
    </div>
  )
}

function BankRecContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Concept & Context">
        <p><strong>What is Bank Reconciliation?</strong> Reconciling Book balance vs Bank balance to find the true Adjusted balance. Both must equal.</p>
        <p style={{ color: '#555', marginTop: 6 }}>장부잔액과 은행잔액의 차이 원인을 파악하고 조정잔액을 일치시킴. 분개는 Book 조정 항목만.</p>
        <Table
          headers={['Side', 'Add (+)', 'Subtract (−)']}
          rows={[
            ['Book', 'Interest earned', 'NSF check / Bank charges'],
            ['Bank', 'Deposits in transit', 'Outstanding checks'],
          ]}
        />
        <p style={{ color: '#555', fontStyle: 'italic' }}>Memory: NSF(부도수표) → Book 차감. Outstanding checks → Bank 차감. 절대 혼동 금지.</p>
      </Section>
      <Section title="1. Overview — Book vs Bank">
        <Table
          headers={['조정 대상', '항목', '방향']}
          rows={[
            ['Book 조정', 'Interest earned (은행 적립)', '+ 가산'],
            ['Book 조정', 'NSF check (부도수표)', '− 차감'],
            ['Book 조정', 'Bank service charges', '− 차감'],
            ['Book 조정', 'Errors in book', '± 조정'],
            ['Bank 조정', 'Deposits in transit', '+ 가산'],
            ['Bank 조정', 'Outstanding checks', '− 차감'],
            ['Bank 조정', 'Errors by bank', '± 조정'],
          ]}
        />
      </Section>

      <Section title="2. Adjusted Balance 구조">
        <CodeBlock>{`Book Balance (장부)          XXX
  + Interest earned            XX
  − NSF check                  XX
  − Bank service charges        XX
  ± Book errors                 XX
= Adjusted Book Balance       XXX

Bank Balance (은행)           XXX
  + Deposits in transit         XX
  − Outstanding checks          XX
  ± Bank errors                 XX
= Adjusted Bank Balance       XXX

→ Adjusted Book = Adjusted Bank (반드시 일치)`}</CodeBlock>
      </Section>

      <Section title="3. 조정 후 분개 (Book 조정 항목만)">
        <CodeBlock>{`Interest earned:
  Dr. Cash / Cr. Interest Income

NSF check:
  Dr. AR (or Receivable) / Cr. Cash

Bank service charges:
  Dr. Bank Service Expense / Cr. Cash`}</CodeBlock>
      </Section>

      <TrapBox items={[
        'NSF check → Book 차감 (Bank 아님, 이미 Bank 반영됨)',
        'Outstanding checks → Bank 차감 (Book은 이미 기록됨)',
        'Deposits in transit → Bank 가산 (Book은 이미 기록됨)',
        '분개는 Book 조정 항목만 → Bank 조정 항목은 분개 없음',
        '조정 후 양쪽 잔액 불일치 → 오류 존재',
      ]} />
    </div>
  )
}

// ── Content Tab Dispatcher ─────────────────────────────────────────────────────
function ContentTab({ catId, catLabel }: { catId: CategoryId; catLabel: string }) {
  switch (catId) {
    case 'bond':        return <BondContent />
    case 'tdr':         return <TdrContent />
    case 'lease':       return <LeaseContent />
    case 'note':        return <NoteContent />
    case 'aro':         return <AroContent />
    case 'eps':         return <EpsContent />
    case 'tax':         return <TaxContent />
    case 'inventory':   return <InventoryContent />
    case 'ppe':         return <PpeContent />
    case 'intangibles': return <IntangiblesContent />
    case 'revenue':     return <RevenueContent />
    case 'scf':         return <ScfContent />
    case 'investments': return <InvestmentsContent />
    case 'equity':        return <EquityContent />
    case 'partnerships':  return <PartnershipContent />
    case 'nfp':           return <NfpContent />
    case 'gov':         return <GovContent />
    case 'changes':     return <ChangesContent />
    case 'fv':          return <FvContent />
    case 'fx':          return <FxContent />
    case 'ratio':       return <RatioContent />
    case 'consol':      return <ConsolContent />
    case 'subsequent':  return <SubsequentContent />
    case 'bankrec':     return <BankRecContent />
    default:            return <ComingSoon label={catLabel} />
  }
}

// ── Cards Tab ──────────────────────────────────────────────────────────────────
function CardsTab({ activeId }: { activeId: ActiveId }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const superCat = SUPER_CATEGORIES.find(s => s.id === activeId)
  const cat = CATEGORIES.find(c => c.id === activeId)

  const cards: TopicCard[] = superCat
    ? superCat.children.flatMap(childId => {
        const childCat = CATEGORIES.find(c => c.id === childId)
        return childCat ? getCardsForCategory(childCat) : []
      })
    : cat ? getCardsForCategory(cat) : []

  if (cards.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#999', fontSize: 14 }}>
        이 파트 카드 준비 중입니다
      </div>
    )
  }

  const openCard = cards.find(c => c.topic_id === openId) ?? null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map(card => (
          <button
            key={card.topic_id}
            onClick={() => setOpenId(card.topic_id)}
            style={{
              width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: 8, cursor: 'pointer', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: NAVY, background: '#e8edf5',
                  borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap',
                }}>
                  {card.topic_id}
                </span>
                {card.speed && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: card.speed === 'fast' ? '#dcfce7' : card.speed === 'slow' ? '#fee2e2' : '#fef9c3',
                    color: card.speed === 'fast' ? '#166534' : card.speed === 'slow' ? '#991b1b' : '#854d0e',
                  }}>
                    {card.speed}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                {card.card_name ?? card.topic_name ?? '—'}
              </span>
              {card.one_sentence && (
                <span style={{ fontSize: 12, color: '#555' }}>{card.one_sentence}</span>
              )}
            </div>
            <span style={{ fontSize: 14, color: '#bbb', flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>

      {openCard && (
        <div className="show-me-overlay" onClick={() => setOpenId(null)}>
          <div className="show-me-modal" onClick={e => e.stopPropagation()}>
            <button className="show-me-close" onClick={() => setOpenId(null)}>✕</button>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: NAVY, background: '#e8edf5',
                  borderRadius: 4, padding: '3px 8px',
                }}>
                  {openCard.topic_id}
                </span>
                {openCard.speed && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                    background: openCard.speed === 'fast' ? '#dcfce7' : openCard.speed === 'slow' ? '#fee2e2' : '#fef9c3',
                    color: openCard.speed === 'fast' ? '#166534' : openCard.speed === 'slow' ? '#991b1b' : '#854d0e',
                  }}>
                    {openCard.speed}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: 0 }}>
                {openCard.card_name ?? openCard.topic_name ?? '—'}
              </h2>
              {openCard.one_sentence && (
                <p style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{openCard.one_sentence}</p>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e8e8e4', marginBottom: 20 }} />

            {/* Body */}
            {openCard.rule && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: NAVY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rule</div>
                <div style={{ fontSize: 14, color: '#111', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{openCard.rule}</div>
              </div>
            )}
            {openCard.trigger && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trigger</div>
                <div style={{ fontSize: 14, color: '#111', lineHeight: 1.7 }}>{openCard.trigger}</div>
              </div>
            )}
            {openCard.trap && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trap</div>
                <div style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.7 }}>{openCard.trap}</div>
              </div>
            )}
            {openCard.example && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Example</div>
                <pre style={{ fontSize: 13, color: '#111', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f7f8fa', borderRadius: 8, padding: '12px 16px', border: '1px solid #e0e0e0', margin: 0, fontFamily: 'inherit' }}>{openCard.example}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Harry Tab — 2-panel embedded chat ─────────────────────────────────────────
function HarryTab({ catLabel }: { catLabel: string }) {
  const userId = useStudyStore((s) => s.userId)
  const [conversations, setConversations] = useState<HarryConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<HarryMessage[]>([])
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) return
    refreshList()
  }, [userId]) // eslint-disable-line

  useEffect(() => {
    if (!userId) return
    const t = setTimeout(() => refreshList(), 300)
    return () => clearTimeout(t)
  }, [search, userId]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function refreshList() {
    const list = await listConversations(userId!, 'concept', search || undefined, catLabel)
    setConversations(list)
  }

  function selectConv(conv: HarryConversation) {
    setSelectedId(conv.id)
    setMsgs(conv.messages ?? [])
  }

  async function createConv() {
    if (!userId) return
    const { data, error } = await supabase
      .from('harry_conversations')
      .insert({ user_id: userId, context_type: 'concept', context_id: null, context_name: catLabel, messages: [] })
      .select('*')
      .single()
    if (!error && data) {
      const newConv = data as HarryConversation
      setConversations(prev => [newConv, ...prev])
      setSelectedId(newConv.id)
      setMsgs([])
    }
  }

  async function deleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await deleteConversation(id)
    const remaining = conversations.filter(c => c.id !== id)
    setConversations(remaining)
    if (selectedId === id) {
      if (remaining.length > 0) { setSelectedId(remaining[0].id); setMsgs(remaining[0].messages ?? []) }
      else { setSelectedId(null); setMsgs([]) }
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    let convId = selectedId
    if (!convId) {
      const { data, error } = await supabase
        .from('harry_conversations')
        .insert({ user_id: userId!, context_type: 'concept', context_id: null, context_name: catLabel, messages: [] })
        .select('*').single()
      if (error || !data) return
      const newConv = data as HarryConversation
      setConversations(prev => [newConv, ...prev])
      setSelectedId(newConv.id)
      convId = newConv.id
    }

    const userMsg: HarryMessage = { role: 'user', content: trimmed, created_at: new Date().toISOString() }
    const prevMsgs = [...msgs, userMsg]
    setMsgs([...prevMsgs, { role: 'assistant', content: '', created_at: new Date().toISOString() }])
    setInput('')
    setStreaming(true)

    let fullContent = ''
    const abortCtrl = new AbortController()
    streamAbortRef.current = abortCtrl

    try {
      const resp = await fetch(`${API_URL}/api/claude/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: prevMsgs.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT + `\n\n현재 실습 중인 카테고리: ${catLabel}`,
        }),
        signal: abortCtrl.signal,
      })

      if (!resp.ok || !resp.body) throw new Error('API error')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6))
              if (d.text) {
                fullContent += d.text
                setMsgs(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent }
                  return updated
                })
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMsgs(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: '[오류가 발생했습니다]' }
          return updated
        })
      }
    }

    setStreaming(false)

    const finalMsgs: HarryMessage[] = [
      ...prevMsgs,
      { role: 'assistant', content: fullContent, created_at: new Date().toISOString() },
    ]

    await supabase
      .from('harry_conversations')
      .update({ messages: finalMsgs, updated_at: new Date().toISOString() })
      .eq('id', convId)

    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, messages: finalMsgs, updated_at: new Date().toISOString() } : c)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    )
  }

  function getTitle(conv: HarryConversation): string {
    const first = conv.messages?.find(m => m.role === 'user')
    return first ? first.content.slice(0, 20) : (conv.context_name ?? '새 대화')
  }

  const quickActions = [
    { label: '개념 확인', msg: `Give me ONE concept check question about ${catLabel}. Wait for my answer before showing the solution.` },
    { label: '분개 오류 찾기', msg: `Show me ONE journal entry with exactly one error related to ${catLabel}. Wait for my answer before explaining.` },
    { label: '공식 빈칸 채우기', msg: `Give me ONE formula with ONE blank to fill in for ${catLabel}. Wait for my answer before showing the answer.` },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f8f9fa' }}>

      {/* Left panel — conversation list */}
      <div style={{
        width: 240, flexShrink: 0,
        background: '#f8f9fa', borderRight: '1px solid #e8e8e4',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 12px 8px', flexShrink: 0 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="대화 검색..."
            style={{
              width: '100%', padding: '7px 10px', fontSize: 12,
              border: '1px solid #e0e0e0', borderRadius: 8, outline: 'none',
              background: 'white', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
          <button
            onClick={createConv}
            style={{
              width: '100%', padding: '8px 12px',
              background: NAVY, color: 'white',
              border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + 새 대화
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#999', fontSize: 12 }}>
              대화가 없어요
            </div>
          )}
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => selectConv(conv)}
              onMouseEnter={() => setHoverId(conv.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: selectedId === conv.id ? NAVY : 'transparent',
                borderBottom: '1px solid #e8e8e4',
                position: 'relative',
              }}
            >
              <div style={{
                fontSize: 12.5, fontWeight: selectedId === conv.id ? 600 : 400,
                color: selectedId === conv.id ? 'white' : '#111',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: 2, paddingRight: 18,
              }}>
                {getTitle(conv)}
              </div>
              <div style={{
                fontSize: 10.5,
                color: selectedId === conv.id ? 'rgba(255,255,255,0.65)' : '#999',
              }}>
                {new Date(conv.updated_at).toLocaleDateString('ko', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              {(hoverId === conv.id) && (
                <button
                  onClick={(e) => deleteConv(conv.id, e)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, color: selectedId === conv.id ? 'rgba(255,255,255,0.65)' : '#aaa',
                    padding: '2px 4px', lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'white' }}>
        {selectedId ? (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '48px 0', fontSize: 13 }}>
                  질문을 시작하세요
                </div>
              )}
              {msgs.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'assistant' ? 'var(--color-background-secondary, #f8f8f6)' : '#f3f3f0',
                    color: '#111',
                    fontSize: 13, lineHeight: 1.7,
                    wordBreak: 'break-word',
                    border: msg.role === 'assistant' ? '1px solid var(--color-border-tertiary, #e8e8e4)' : 'none',
                    ...(msg.role === 'user' ? { whiteSpace: 'pre-wrap' as const } : {}),
                  }}>
                    {msg.role === 'assistant' ? (
                      msg.content ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }: { children?: React.ReactNode }) => <p style={{ margin: '0 0 8px', color: '#111', lineHeight: 1.7 }}>{children}</p>,
                            strong: ({ children }: { children?: React.ReactNode }) => <strong style={{ fontWeight: 600, color: '#111' }}>{children}</strong>,
                            em: ({ children }: { children?: React.ReactNode }) => <em style={{ fontStyle: 'italic', color: '#111' }}>{children}</em>,
                            ul: ({ children }: { children?: React.ReactNode }) => <ul style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ul>,
                            ol: ({ children }: { children?: React.ReactNode }) => <ol style={{ paddingLeft: 18, margin: '4px 0 8px' }}>{children}</ol>,
                            li: ({ children }: { children?: React.ReactNode }) => <li style={{ marginBottom: 6, color: '#111', lineHeight: 1.7 }}>{children}</li>,
                            h3: ({ children }: { children?: React.ReactNode }) => <h3 style={{ fontSize: 13, fontWeight: 700, margin: '10px 0 4px', color: '#111' }}>{children}</h3>,
                            h2: ({ children }: { children?: React.ReactNode }) => <h2 style={{ fontSize: 14, fontWeight: 700, margin: '10px 0 4px', color: '#111' }}>{children}</h2>,
                            code: ({ children }: { children?: React.ReactNode }) => <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#333' }}>{children}</code>,
                            pre: ({ children }: { children?: React.ReactNode }) => <pre style={{ background: '#f1f1ee', border: '1px solid #e4e4e0', padding: 10, borderRadius: 6, overflow: 'auto', fontSize: 12, margin: '8px 0', color: '#222' }}>{children}</pre>,
                            blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote style={{ borderLeft: '3px solid #ccc', paddingLeft: 10, margin: '6px 0', color: '#555' }}>{children}</blockquote>,
                            table: ({ children }: { children?: React.ReactNode }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: 12 }}>{children}</table>,
                            th: ({ children }: { children?: React.ReactNode }) => <th style={{ border: '1px solid #ddd', padding: '4px 8px', background: '#f5f5f2', color: '#111' }}>{children}</th>,
                            td: ({ children }: { children?: React.ReactNode }) => <td style={{ border: '1px solid #e4e4e0', padding: '4px 8px', color: '#222' }}>{children}</td>,
                          } as never}
                        >{msg.content}</ReactMarkdown>
                      ) : (
                        streaming && i === msgs.length - 1
                          ? <span style={{ opacity: 0.4, fontSize: 18, letterSpacing: 2 }}>•••</span>
                          : null
                      )
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick action buttons */}
            <div style={{
              flexShrink: 0, padding: '8px 16px 4px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex', gap: 6, flexWrap: 'wrap',
            }}>
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={() => sendMessage(a.msg)}
                  disabled={streaming}
                  style={{
                    padding: '5px 11px', fontSize: 11.5, fontWeight: 600,
                    border: `1px solid ${NAVY}`,
                    borderRadius: 20, background: 'white', color: NAVY,
                    cursor: streaming ? 'not-allowed' : 'pointer',
                    opacity: streaming ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, padding: '8px 16px 16px', display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="메시지 입력..."
                disabled={streaming}
                style={{
                  flex: 1, padding: '9px 14px', fontSize: 13,
                  border: '1px solid #e0e0e0', borderRadius: 10, outline: 'none',
                  background: streaming ? '#f8f8f8' : 'white',
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={streaming || !input.trim()}
                style={{
                  padding: '9px 18px', background: NAVY, color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: streaming || !input.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                전송
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#999' }}>
            <div style={{ fontSize: 36 }}>🧙</div>
            <p style={{ fontSize: 14, margin: 0 }}>새 대화를 시작하세요</p>
            <button
              onClick={createConv}
              style={{
                padding: '10px 22px', background: NAVY, color: 'white',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + 새 대화
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Super Category Content Components ─────────────────────────────────────────

function Interest4Content() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}>
          <InterestFamilyViz />
        </div>
      </Section>
      <Section title="Bond / Note / Lease 연결도">
        <div className="int-diagram" style={{ marginTop: 8 }}>
          <svg width="100%" viewBox="0 0 680 740" role="img">
            <title>Bond Note Finance Lease connection map</title>
            <desc>Bond, Note, Finance Lease 세 개념의 공통 구조와 연결점</desc>
            <defs>
              <marker id="arrow-bnl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </marker>
            </defs>
            <g className="c-blue">
              <rect x="20" y="20" width="270" height="160" rx="12" strokeWidth="0.5"/>
              <text className="th" x="155" y="46" textAnchor="middle" dominantBaseline="central">Bond payable</text>
              <text className="ts" x="155" y="68" textAnchor="middle" dominantBaseline="central">초기 BV = PV of coupons (annuity)</text>
              <text className="ts" x="155" y="86" textAnchor="middle" dominantBaseline="central">+ PV of face value ($1 table)</text>
              <text className="ts" x="155" y="104" textAnchor="middle" dominantBaseline="central">Premium / Discount 상각</text>
              <text className="ts" x="155" y="122" textAnchor="middle" dominantBaseline="central">원금 만기 일시 상환</text>
              <text className="ts" x="155" y="140" textAnchor="middle" dominantBaseline="central">SL or Effective method</text>
              <text className="ts" x="155" y="158" textAnchor="middle" dominantBaseline="central">Coupon rate ≠ Market rate</text>
            </g>
            <g className="c-purple">
              <rect x="390" y="20" width="270" height="190" rx="12" strokeWidth="0.5"/>
              <text className="th" x="525" y="46" textAnchor="middle" dominantBaseline="central">Finance lease</text>
              <text className="ts" x="525" y="68" textAnchor="middle" dominantBaseline="central">초기 BV = PV of payments (annuity)</text>
              <text className="ts" x="525" y="86" textAnchor="middle" dominantBaseline="central">+ PV of purchase option ($1 table)</text>
              <text className="ts" x="525" y="104" textAnchor="middle" dominantBaseline="central">ROU asset → 별도 상각</text>
              <text className="ts" x="525" y="122" textAnchor="middle" dominantBaseline="central">useful life (option 행사 예상 시)</text>
              <text className="ts" x="525" y="140" textAnchor="middle" dominantBaseline="central">Lease liability → Note처럼 분해</text>
              <text className="ts" x="525" y="158" textAnchor="middle" dominantBaseline="central">I/S = Interest + Amortization</text>
              <text className="ts" x="525" y="176" textAnchor="middle" dominantBaseline="central">Implicit rate or IBR (낮은 것)</text>
            </g>
            <line x1="290" y1="80" x2="390" y2="80" stroke="#888780" strokeWidth="1" strokeDasharray="5 3"/>
            <g className="c-gray">
              <rect x="298" y="64" width="84" height="28" rx="14" strokeWidth="0.5"/>
              <text className="ts" x="340" y="78" textAnchor="middle" dominantBaseline="central">PV 구조 동일</text>
            </g>
            <g className="c-gray">
              <rect x="160" y="300" width="360" height="110" rx="12" strokeWidth="1"/>
              <text className="th" x="340" y="324" textAnchor="middle" dominantBaseline="central">공통 핵심 로직</text>
              <text className="ts" x="340" y="346" textAnchor="middle" dominantBaseline="central">Interest = Beginning CV × rate × m/12</text>
              <text className="ts" x="340" y="364" textAnchor="middle" dominantBaseline="central">Principal = Payment − Interest  ← plug-in</text>
              <text className="ts" x="340" y="382" textAnchor="middle" dominantBaseline="central">Ending balance = Beginning − Principal</text>
            </g>
            <path d="M155 180 L155 270 L260 300" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrow-bnl)"/>
            <g className="c-blue">
              <rect x="74" y="252" width="140" height="24" rx="12" strokeWidth="0.5"/>
              <text className="ts" x="144" y="264" textAnchor="middle" dominantBaseline="central">PV 계산 구조 공유</text>
            </g>
            <path d="M525 210 L525 270 L420 300" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrow-bnl)"/>
            <g className="c-purple">
              <rect x="466" y="252" width="140" height="24" rx="12" strokeWidth="0.5"/>
              <text className="ts" x="536" y="264" textAnchor="middle" dominantBaseline="central">Payment 분해 공유</text>
            </g>
            <g className="c-teal">
              <rect x="20" y="500" width="270" height="150" rx="12" strokeWidth="0.5"/>
              <text className="th" x="155" y="526" textAnchor="middle" dominantBaseline="central">Note payable</text>
              <text className="ts" x="155" y="548" textAnchor="middle" dominantBaseline="central">Payment 고정 (문제에서 주어짐)</text>
              <text className="ts" x="155" y="566" textAnchor="middle" dominantBaseline="central">Interest 먼저 → Principal plug-in</text>
              <text className="ts" x="155" y="584" textAnchor="middle" dominantBaseline="central">매 기간 원금 일부 상환</text>
              <text className="ts" x="155" y="602" textAnchor="middle" dominantBaseline="central">Effective method only</text>
              <text className="ts" x="155" y="620" textAnchor="middle" dominantBaseline="central">Interest Expense만 I/S</text>
            </g>
            <path d="M155 500 L155 440 L260 410" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrow-bnl)"/>
            <g className="c-teal">
              <rect x="74" y="430" width="140" height="24" rx="12" strokeWidth="0.5"/>
              <text className="ts" x="144" y="442" textAnchor="middle" dominantBaseline="central">Interest → plug-in 공유</text>
            </g>
            <g className="c-purple">
              <rect x="390" y="500" width="270" height="110" rx="12" strokeWidth="0.5"/>
              <text className="th" x="525" y="526" textAnchor="middle" dominantBaseline="central">Lease liability 상환</text>
              <text className="ts" x="525" y="548" textAnchor="middle" dominantBaseline="central">Payment = Interest + Principal</text>
              <text className="ts" x="525" y="566" textAnchor="middle" dominantBaseline="central">Interest 먼저 → plug-in</text>
              <text className="ts" x="525" y="584" textAnchor="middle" dominantBaseline="central">Effective only (SL 없음)</text>
              <text className="ts" x="525" y="602" textAnchor="middle" dominantBaseline="central">= Note payable과 완전히 동일</text>
            </g>
            <line x1="290" y1="590" x2="390" y2="590" stroke="#888780" strokeWidth="1" strokeDasharray="5 3"/>
            <g className="c-gray">
              <rect x="291" y="574" width="98" height="28" rx="14" strokeWidth="0.5"/>
              <text className="ts" x="340" y="588" textAnchor="middle" dominantBaseline="central">Payment 분해 동일</text>
            </g>
            <g className="c-amber">
              <rect x="20" y="688" width="640" height="36" rx="8" strokeWidth="0.5"/>
              <text className="th" x="340" y="702" textAnchor="middle" dominantBaseline="central">Finance Lease = Bond 자산 구조 + Note 부채 상환 구조</text>
              <text className="ts" x="340" y="718" textAnchor="middle" dominantBaseline="central">Interest 항상 먼저 / Lease는 Implicit rate or IBR / Payment = 이자비용으로 오답</text>
            </g>
          </svg>
        </div>
      </Section>

      <Section title="4형제 비교표">
        <Table
          headers={['항목', 'Bond', 'Finance Lease', 'Note Payable', 'ARO']}
          rows={[
            ['관점', 'Issuer', 'Lessee', 'Borrower', 'Legal obligation'],
            ['이자 계산', 'CV × 시장율', 'Beg Liab × rate', 'Beg × rate × m/12', 'Beg ARO × credit-adj'],
            ['CV/Liability', 'Disc↑/Prem↓', '↓ 감소', '↓ 감소', '↑ 증가'],
            ['I/S 비용', 'Interest Exp', 'Interest+Depr', 'Interest Exp', 'Accretion+Depr'],
            ['상각 방법', 'SL or Effective', 'Effective only', 'Effective only', 'Effective only'],
            ['SL 허용', '문제 명시 시', '불가', '불가', '불가'],
          ]}
        />
      </Section>
      <Section title="핵심 공통 로직">
        <CodeBlock>{`이자 먼저 계산 → 나머지 원금 (Plug-in)
SL 명시 없으면 → Effective Method
Payment 숫자 직접 = 이자비용 → 항상 오답`}</CodeBlock>
      </Section>
    </div>
  )
}

function InventoryCostContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><InventoryCostViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'Inventory', 'PP&E', 'Intangibles']}
          rows={[
            ['측정 기준', 'Lower of Cost/NRV', 'Historical cost−Accum Depr', 'Cost−Accum Amort'],
            ['방법', 'FIFO/LIFO/WA', 'SL/DDB/SYD', 'SL (정액)'],
            ['손상', 'NRV 이하 write-down', '2-Step test', 'Definite:indicator / Indef:annual'],
            ['회복', 'US GAAP 불가', 'US GAAP 불가', 'US GAAP 불가'],
            ['특수', 'Dollar-Value LIFO', 'Interest capitalization', 'Goodwill no amort'],
          ]}
        />
      </Section>
    </div>
  )
}

function EquityCapitalContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><EquityCapitalViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'SE', 'EPS', 'Equity Method', 'Consolidation']}
          rows={[
            ['핵심', 'TS Cost/Par', 'Basic/Diluted', 'NI×%−diff amort', 'Elimination'],
            ['배당 효과', 'RE 감소', '분자 영향 없음', 'Investment 감소', 'Sub 배당 제거'],
            ['OCI', 'AFS/Pension/FX', 'Excluded', 'Excluded', 'Included'],
          ]}
        />
      </Section>
    </div>
  )
}

function TaxAdjustmentContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><TaxAdjustmentViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'Deferred Tax', 'Accounting Changes']}
          rows={[
            ['처리 방향', '소급 불필요 (전진)', '유형별 다름'],
            ['핵심', 'Enacted rate / VA', 'Estimate=Prospective'],
            ['I/S 영향', 'Tax expense 조정', 'Cumulative effect or prospective'],
          ]}
        />
      </Section>
    </div>
  )
}

function RevenueRecContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><RevenueRecognitionViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'Revenue', 'Foreign Currency', 'Subsequent Events']}
          rows={[
            ['인식 기준', 'PO 충족 시', 'Title transfer', 'BS date 이전 조건'],
            ['시점', 'Over time / Point', '거래일 환율', '~ FS 발행일'],
            ['TRAP', 'Variable consideration constraint', 'units per $ 방향', 'Type1 vs Type2 혼동'],
          ]}
        />
      </Section>
    </div>
  )
}

function FinancialAnalysisContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><FinancialAnalysisViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'SCF', 'Ratio Analysis', 'Fair Value']}
          rows={[
            ['핵심', '활동 분류', '공식 암기', 'Level 분류'],
            ['함정', 'Notes rec=Investing', 'Avg 사용 필수', 'Similar≠Identical (L2)'],
            ['방법', 'Direct/Indirect', 'Liquidity/Profit/Eff', 'Market/Income/Cost'],
          ]}
        />
      </Section>
    </div>
  )
}

function PublicNonprofitContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="관계 시각화">
        <div style={{ overflowX: 'auto' }}><PublicNonprofitViz /></div>
      </Section>
      <Section title="비교표">
        <Table
          headers={['항목', 'NFP Accounting', 'Governmental']}
          rows={[
            ['기준', 'FASB ASC 958', 'GASB'],
            ['핵심', 'Donor restriction', 'Fund type + Accrual basis'],
            ['수익', 'Contribution vs Exchange', 'Available + Measurable'],
          ]}
        />
      </Section>
    </div>
  )
}

function SuperContentTab({ superId }: { superId: SuperCategoryId }) {
  switch (superId) {
    case 'interest4':          return <Interest4Content />
    case 'inventory-cost':     return <InventoryCostContent />
    case 'equity-capital':     return <EquityCapitalContent />
    case 'tax-adjustment':     return <TaxAdjustmentContent />
    case 'revenue-recognition': return <RevenueRecContent />
    case 'financial-analysis': return <FinancialAnalysisContent />
    case 'public-nonprofit':   return <PublicNonprofitContent />
  }
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ConceptNotesPage() {
  const userId = useStudyStore((s) => s.userId)
  const [searchParams] = useSearchParams()
  const initId = (searchParams.get('cat') ?? 'interest4') as ActiveId
  const [activeId, setActiveId] = useState<ActiveId>(
    CATEGORIES.some(c => c.id === initId) || SUPER_CATEGORIES.some(s => s.id === initId)
      ? initId : 'interest4'
  )
  const [activeTab, setActiveTab] = useState<TabKey>('content')
  const [wrongCounts, setWrongCounts] = useState<Record<string, number>>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const prevIdRef = useRef<ActiveId>(activeId)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('wrong_answers')
      .select('topic_tag, times_wrong')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const agg: Record<string, number> = {}
        ;(data as { topic_tag: string | null; times_wrong: number }[]).forEach(r => {
          if (r.topic_tag) agg[r.topic_tag] = (agg[r.topic_tag] ?? 0) + (r.times_wrong ?? 1)
        })
        setWrongCounts(agg)
      })
  }, [userId])

  useEffect(() => {
    if (prevIdRef.current !== activeId) {
      prevIdRef.current = activeId
      setActiveTab('content')
    }
  }, [activeId])

  useEffect(() => {
    try { localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed)) } catch { /* ignore */ }
  }, [sidebarCollapsed])

  const isSuper = SUPER_CATEGORIES.some(s => s.id === activeId)
  const activeSuperCat = isSuper ? SUPER_CATEGORIES.find(s => s.id === activeId) : null
  const activeCat = !isSuper ? (CATEGORIES.find(c => c.id === activeId) ?? CATEGORIES[0]) : null
  const displayLabel = isSuper ? (activeSuperCat?.label ?? '') : (activeCat?.label ?? '')

  function getWrongCountForCat(cat: typeof CATEGORIES[number]): number {
    const cards = getCardsForCategory(cat)
    const relevantTopicIds = new Set(cards.map(c => c.topic_id))
    return Object.entries(wrongCounts)
      .filter(([tag]) => relevantTopicIds.has(tag))
      .reduce((sum, [, cnt]) => sum + cnt, 0)
  }

  function getCardCountForCat(cat: typeof CATEGORIES[number]): number {
    return getCardsForCategory(cat).length
  }

  function getSuperWrongCount(superCat: typeof SUPER_CATEGORIES[number]): number {
    return superCat.children.reduce((sum, childId) => {
      const childCat = CATEGORIES.find(c => c.id === childId)
      return sum + (childCat ? getWrongCountForCat(childCat) : 0)
    }, 0)
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'content', label: '핵심 정리' },
    { key: 'cards',   label: '개념 카드' },
    ...(!isSuper ? [{ key: 'harry' as TabKey, label: 'Harry Practice' }] : []),
  ]

  useEffect(() => {
    if (isSuper && activeTab === 'harry') setActiveTab('content')
  }, [isSuper]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fafaf8' }}>

      {/* Sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: sidebarCollapsed ? 0 : 240,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexDirection: 'column',
        }}
      >
        <SidebarContent
          activeId={activeId}
          onSelect={id => { setActiveId(id); setActiveTab('content') }}
          getCardCount={getCardCountForCat}
          getWrongCount={getWrongCountForCat}
          getSuperWrongCount={getSuperWrongCount}
        />
      </aside>

      {/* Mobile sidebar — push layout (same canvas, no overlay) */}
      <aside
        className="flex md:hidden"
        style={{
          width: mobileSidebarOpen ? 240 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.22s ease',
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          flexDirection: 'column',
        }}
      >
        <div style={{ width: 240, height: '100%', overflowY: 'auto', flexShrink: 0 }}>
          <SidebarContent
            activeId={activeId}
            onSelect={id => { setActiveId(id); setActiveTab('content'); setMobileSidebarOpen(false) }}
            getCardCount={getCardCountForCat}
            getWrongCount={getWrongCountForCat}
            getSuperWrongCount={getSuperWrongCount}
          />
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile top bar */}
        <div
          className="flex md:hidden"
          style={{
            padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e0e0e0',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, zIndex: 30,
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, zIndex: 31 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="9" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="14" width="16" height="2" rx="1" fill={NAVY} />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{displayLabel}</span>
        </div>

        {/* Tabs */}
        <div style={{ flexShrink: 0, padding: '0 28px', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e0e0e0' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '9px 20px', fontSize: 13.5, fontWeight: 600,
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: activeTab === tab.key ? NAVY : '#888',
                  borderBottom: activeTab === tab.key ? `2px solid ${NAVY}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'harry' ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <HarryTab key={`harry-${activeId}`} catLabel={displayLabel} />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 860 }}>
            {activeTab === 'content' && isSuper && activeSuperCat && (
              <SuperContentTab superId={activeSuperCat.id} />
            )}
            {activeTab === 'content' && !isSuper && activeCat && (
              <ContentTab catId={activeCat.id as CategoryId} catLabel={activeCat.label} />
            )}
            {activeTab === 'cards' && (
              <CardsTab activeId={activeId} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Sidebar Content Component ──────────────────────────────────────────────────
function SidebarContent({
  activeId,
  onSelect,
  getCardCount,
  getWrongCount,
  getSuperWrongCount,
}: {
  activeId: ActiveId
  onSelect: (id: ActiveId) => void
  getCardCount: (cat: typeof CATEGORIES[number]) => number
  getWrongCount: (cat: typeof CATEGORIES[number]) => number
  getSuperWrongCount: (superCat: typeof SUPER_CATEGORIES[number]) => number
}) {
  const [expandedSuper, setExpandedSuper] = useState<SuperCategoryId | null>(null)

  function toggleSuper(id: SuperCategoryId) {
    setExpandedSuper(prev => prev === id ? null : id)
  }

  return (
    <>
      <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>
          Topics
        </span>
      </div>
      <nav style={{ flex: 1, padding: '4px 0' }}>
        {SUPER_CATEGORIES.map(superCat => {
          const isOpen = expandedSuper === superCat.id
          const isSuperActive = activeId === superCat.id
          const superWrong = getSuperWrongCount(superCat)
          return (
            <div key={superCat.id}>
              {/* 상위 카테고리 헤더 */}
              <button
                onClick={() => toggleSuper(superCat.id)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  background: isSuperActive ? '#162038' : NAVY,
                  color: 'white',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 12.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{superCat.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {superWrong > 0 && (
                    <span style={{
                      fontSize: 10, color: 'white', background: '#dc2626',
                      borderRadius: 10, padding: '1px 6px', fontWeight: 700,
                    }}>
                      {superWrong}
                    </span>
                  )}
                  <span style={{ fontSize: 14, color: 'white' }}>{isOpen ? '▾' : '▸'}</span>
                </div>
              </button>

              {/* 하위 카테고리 목록 */}
              {isOpen && superCat.children.map(childId => {
                const cat = CATEGORIES.find(c => c.id === childId)
                if (!cat) return null
                const isActive = activeId === cat.id
                const cardCount = getCardCount(cat)
                const wrongCount = getWrongCount(cat)
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id as CategoryId)}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      paddingLeft: 28, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
                      background: isActive ? '#eef1f8' : 'transparent',
                      borderLeft: isActive ? `3px solid ${NAVY}` : '3px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26,39,68,0.05)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    <span style={{
                      fontSize: 12.5, fontWeight: isActive ? 700 : 400,
                      color: isActive ? NAVY : '#333',
                      flex: 1, lineHeight: 1.35,
                    }}>
                      {cat.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {cardCount > 0 && (
                        <span style={{
                          fontSize: 10, color: '#888', background: '#f0f0f0',
                          borderRadius: 10, padding: '1px 6px',
                        }}>
                          {cardCount}
                        </span>
                      )}
                      {wrongCount > 0 && (
                        <span style={{
                          fontSize: 10, color: '#fff', background: '#dc2626',
                          borderRadius: 10, padding: '1px 6px', fontWeight: 700,
                        }}>
                          {wrongCount}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>
    </>
  )
}
