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
  { id: 'investments', label: 'Investments & Equity Method',  groups: ['IA_CH6_INVEST'] },
  { id: 'equity',      label: "Stockholders' Equity",         groups: ['IA_CH9_EQUITY'] },
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
    children: ['equity', 'eps', 'investments', 'consol'] as CategoryId[],
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
      <Section title="Key Rule">
        <p>Use <strong>Beginning Balance × rate × time fraction</strong>. Never use payment amount directly for interest calculation.</p>
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

      <Section title="3. Dollar-Value LIFO 3단계">
        <CodeBlock>{`Step1: Current year EI at base cost = Current EI $ ÷ Current index
Step2: Compare to prior year base cost → if increase, new layer = increase × current index
Step3: Add all layers = LIFO cost

예시: Y1 EI $55,000 / Index 1.10
  Base cost = $55,000 ÷ 1.10 = $50,000
  New layer = $50,000 × 1.10 = $55,000 (LIFO cost)`}</CodeBlock>
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

      <Section title="2. Contribution 인식">
        <CodeBlock>{`Unconditional → 즉시 인식 (조건 없음)
  Dr. Receivable / Cr. Contribution Revenue (without restriction)

Conditional → 조건 충족 시 인식
  조건 충족 전: no recognition

Restriction 해제:
  Dr. Net Assets with DR / Cr. Net Assets without DR`}</CodeBlock>
      </Section>

      <Section title="3. Endowment">
        <CodeBlock>{`원금 = 영구 보존 (지출 불가)
수익 = 지출 가능 (donor 지정 없으면 unrestricted)
Investment income → without restriction (별도 지정 없는 경우)`}</CodeBlock>
      </Section>

      <Section title="4. Functional Expense 분류">
        <CodeBlock>{`Program services (프로그램 비용)
Management & General (관리 운영)
Fundraising (모금 활동)
→ 3개 열로 분류 공시 필수`}</CodeBlock>
      </Section>

      <DefaultBox items={[
        { default: 'Contribution 분류: With donor restriction', changed: '"no strings attached" / "unrestricted" 명시 → Without donor restriction' },
        { default: 'Conditional contribution: 인식 안 함', changed: '조건 충족 시 인식' },
      ]} />
      <TrapBox items={[
        'Conditional contribution → 조건 충족 전 인식 금지',
        'Endowment 원금 지출 = 절대 불가',
        'Exchange transaction → ASC 606 적용 (contribution 아님)',
      ]} />
    </div>
  )
}

function GovContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
        <Table
          headers={['유형', 'Fund', '회계 기준']}
          rows={[
            ['Governmental', 'General / Special Revenue / Capital Projects / Debt Service / Permanent', 'Modified Accrual'],
            ['Proprietary', 'Enterprise / Internal Service', 'Full Accrual'],
            ['Fiduciary', 'Pension Trust / Investment Trust / Private-Purpose / Custodial', 'Full Accrual (no net position)'],
          ]}
        />
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
    case 'equity':      return <EquityContent />
    case 'nfp':         return <NfpContent />
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
                    background: msg.role === 'assistant' ? NAVY : '#f3f3f0',
                    color: msg.role === 'assistant' ? 'white' : '#111',
                    fontSize: 13, lineHeight: 1.65,
                    wordBreak: 'break-word',
                    ...(msg.role === 'user' ? { whiteSpace: 'pre-wrap' as const } : {}),
                  }}>
                    {msg.role === 'assistant' ? (
                      msg.content ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }: { children?: React.ReactNode }) => <p style={{ margin: '0 0 6px', color: 'inherit', lineHeight: 1.65 }}>{children}</p>,
                            strong: ({ children }: { children?: React.ReactNode }) => <strong style={{ fontWeight: 600, color: 'inherit' }}>{children}</strong>,
                            em: ({ children }: { children?: React.ReactNode }) => <em style={{ fontStyle: 'italic', color: 'inherit' }}>{children}</em>,
                            ul: ({ children }: { children?: React.ReactNode }) => <ul style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ul>,
                            ol: ({ children }: { children?: React.ReactNode }) => <ol style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ol>,
                            li: ({ children }: { children?: React.ReactNode }) => <li style={{ marginBottom: 2, color: 'inherit' }}>{children}</li>,
                            h3: ({ children }: { children?: React.ReactNode }) => <h3 style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 4px', color: 'inherit' }}>{children}</h3>,
                            h2: ({ children }: { children?: React.ReactNode }) => <h2 style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 4px', color: 'inherit' }}>{children}</h2>,
                            code: ({ children }: { children?: React.ReactNode }) => <code style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', fontSize: 12, color: 'inherit' }}>{children}</code>,
                            pre: ({ children }: { children?: React.ReactNode }) => <pre style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 6, overflow: 'auto', fontSize: 12, margin: '8px 0', color: 'inherit' }}>{children}</pre>,
                            blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote style={{ borderLeft: '3px solid rgba(255,255,255,0.4)', paddingLeft: 10, margin: '6px 0', color: 'inherit' }}>{children}</blockquote>,
                            table: ({ children }: { children?: React.ReactNode }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '8px 0', fontSize: 12 }}>{children}</table>,
                            th: ({ children }: { children?: React.ReactNode }) => <th style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', color: 'inherit' }}>{children}</th>,
                            td: ({ children }: { children?: React.ReactNode }) => <td style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', color: 'inherit' }}>{children}</td>,
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
            onClick={() => setSidebarCollapsed(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="9" width="16" height="2" rx="1" fill={NAVY} />
              <rect x="2" y="14" width="16" height="2" rx="1" fill={NAVY} />
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{displayLabel}</span>
        </div>

        {/* Header: title + tabs */}
        <div style={{ flexShrink: 0, padding: '24px 28px 0' }}>
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              style={{ flexShrink: 0, padding: '5px 9px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', fontSize: 16, color: '#374151', cursor: 'pointer', lineHeight: 1 }}
            >
              ≡
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{displayLabel}</h1>
          </div>
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
  const [openSupers, setOpenSupers] = useState<Set<SuperCategoryId>>(
    new Set(['interest4' as SuperCategoryId])
  )

  function toggleSuper(id: SuperCategoryId) {
    setOpenSupers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
          const isOpen = openSupers.has(superCat.id)
          const isSuperActive = activeId === superCat.id
          const superWrong = getSuperWrongCount(superCat)
          return (
            <div key={superCat.id}>
              {/* 상위 카테고리 헤더 */}
              <button
                onClick={() => {
                  onSelect(superCat.id)
                  toggleSuper(superCat.id)
                }}
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
