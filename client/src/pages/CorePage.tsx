import { useState } from "react";

const COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
  recognition:    { color: "#534AB7", bg: "#EEEDFE", border: "#AFA9EC" },
  measurement:    { color: "#0F6E56", bg: "#E1F5EE", border: "#5DCAA5" },
  asset_liability:{ color: "#854F0B", bg: "#FAEEDA", border: "#EF9F27" },
  reporting:      { color: "#185FA5", bg: "#E6F1FB", border: "#85B7EB" },
};

// ── SVG diagrams per principle ─────────────────────────────────────────────

function SvgAccrual() {
  return (
    <svg viewBox="0 0 480 110" width="100%" aria-hidden="true">
      <defs>
        <marker id="a1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="22" width="130" height="66" rx="8" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
      <text x="75" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#3C3489">Economic Event</text>
      <text x="75" y="62" textAnchor="middle" fontSize="10" fill="#534AB7">발생 시점</text>
      <text x="75" y="78" textAnchor="middle" fontSize="10" fill="#534AB7">← 기록 기준</text>
      <line x1="140" y1="55" x2="180" y2="55" stroke="#534AB7" strokeWidth="1.2" markerEnd="url(#a1)"/>
      <rect x="182" y="22" width="140" height="66" rx="8" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
      <text x="252" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#3C3489">Journal Entry</text>
      <text x="252" y="62" textAnchor="middle" fontSize="10" fill="#534AB7">Dr. Receivable</text>
      <text x="252" y="78" textAnchor="middle" fontSize="10" fill="#534AB7">Cr. Revenue</text>
      <line x1="322" y1="55" x2="362" y2="55" stroke="#B4B2A9" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#a1)"/>
      <rect x="364" y="22" width="106" height="66" rx="8" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="417" y="50" textAnchor="middle" fontSize="11" fontWeight="500" fill="#5F5E5A">Cash Receipt</text>
      <text x="417" y="66" textAnchor="middle" fontSize="10" fill="#888780">later — separate</text>
      <text x="240" y="104" textAnchor="middle" fontSize="10" fill="#888780">Cash timing과 recognition timing은 분리된다</text>
    </svg>
  );
}

function SvgMatching() {
  return (
    <svg viewBox="0 0 480 130" width="100%" aria-hidden="true">
      <defs>
        <marker id="a2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
        <marker id="a2g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="15" width="110" height="42" rx="7" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
      <text x="65" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3C3489">Revenue</text>
      <text x="65" y="47" textAnchor="middle" fontSize="10" fill="#534AB7">판매 완료 시점</text>
      <rect x="10" y="65" width="110" height="42" rx="7" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="65" y="82" textAnchor="middle" fontSize="11" fontWeight="600" fill="#633806">COGS / Expense</text>
      <text x="65" y="97" textAnchor="middle" fontSize="10" fill="#854F0B">같은 기간 인식</text>
      <line x1="120" y1="36" x2="158" y2="36" stroke="#534AB7" strokeWidth="1"/>
      <line x1="120" y1="86" x2="158" y2="86" stroke="#854F0B" strokeWidth="1"/>
      <line x1="158" y1="36" x2="158" y2="86" stroke="#B4B2A9" strokeWidth="1" strokeDasharray="3 2"/>
      <text x="168" y="65" fontSize="10" fill="#888780">match</text>
      <rect x="240" y="15" width="120" height="42" rx="7" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="300" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="#444441">Advertising</text>
      <text x="300" y="47" textAnchor="middle" fontSize="10" fill="#888780">no direct revenue link</text>
      <line x1="300" y1="57" x2="300" y2="75" stroke="#888780" strokeWidth="1" markerEnd="url(#a2g)"/>
      <rect x="240" y="77" width="120" height="36" rx="7" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="300" y="92" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444441">Period Cost</text>
      <text x="300" y="106" textAnchor="middle" fontSize="10" fill="#888780">expense immediately</text>
      <text x="240" y="123" textAnchor="middle" fontSize="10" fill="#888780">Direct match → same period / No match → immediate</text>
    </svg>
  );
}

function SvgRevenue() {
  return (
    <svg viewBox="0 0 480 110" width="100%" aria-hidden="true">
      <defs>
        <marker id="a3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="25" width="100" height="55" rx="8" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="60" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="#444441">Cash Received</text>
      <text x="60" y="64" textAnchor="middle" fontSize="10" fill="#888780">≠ Revenue</text>
      <line x1="110" y1="52" x2="148" y2="52" stroke="#534AB7" strokeWidth="1.2" markerEnd="url(#a3)"/>
      <rect x="150" y="25" width="140" height="55" rx="8" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
      <text x="220" y="44" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3C3489">Performance</text>
      <text x="220" y="58" textAnchor="middle" fontSize="10" fill="#534AB7">Obligation 이행</text>
      <text x="220" y="72" textAnchor="middle" fontSize="10" fill="#534AB7">← 이 시점 = Revenue</text>
      <line x1="290" y1="52" x2="328" y2="52" stroke="#534AB7" strokeWidth="1.2" markerEnd="url(#a3)"/>
      <rect x="330" y="25" width="140" height="55" rx="8" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
      <text x="400" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3C3489">Revenue</text>
      <text x="400" y="64" textAnchor="middle" fontSize="10" fill="#534AB7">Cr. Revenue 인식</text>
      <text x="240" y="100" textAnchor="middle" fontSize="10" fill="#888780">Cash → Deferred Revenue (liability) → 이행 시 Revenue 전환</text>
    </svg>
  );
}

function SvgHistoricalCost() {
  return (
    <svg viewBox="0 0 480 110" width="100%" aria-hidden="true">
      <rect x="10" y="20" width="130" height="70" rx="8" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
      <text x="75" y="45" textAnchor="middle" fontSize="11" fontWeight="600" fill="#085041">Acquisition Cost</text>
      <text x="75" y="62" textAnchor="middle" fontSize="11" fill="#0F6E56">$500K</text>
      <text x="75" y="78" textAnchor="middle" fontSize="10" fill="#0F6E56">← Book value 출발점</text>
      <text x="168" y="60" textAnchor="middle" fontSize="16" fill="#888780">≠</text>
      <rect x="185" y="20" width="130" height="70" rx="8" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="250" y="45" textAnchor="middle" fontSize="11" fontWeight="600" fill="#444441">Fair Value</text>
      <text x="250" y="62" textAnchor="middle" fontSize="11" fill="#888780">$2M (10 yrs later)</text>
      <text x="250" y="78" textAnchor="middle" fontSize="10" fill="#888780">장부 반영 안 함</text>
      <rect x="340" y="20" width="130" height="70" rx="8" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
      <text x="405" y="38" textAnchor="middle" fontSize="10" fontWeight="600" fill="#085041">Exception: FV</text>
      <text x="405" y="54" textAnchor="middle" fontSize="9" fill="#0F6E56">Trading securities</text>
      <text x="405" y="68" textAnchor="middle" fontSize="9" fill="#0F6E56">Derivatives</text>
      <text x="405" y="82" textAnchor="middle" fontSize="9" fill="#0F6E56">Investment property</text>
      <text x="240" y="104" textAnchor="middle" fontSize="10" fill="#888780">원칙: Historical Cost / 예외: FV — 항상 어느 쪽인지 확인</text>
    </svg>
  );
}

function SvgConservatism() {
  return (
    <svg viewBox="0 0 480 120" width="100%" aria-hidden="true">
      <defs>
        <marker id="a4r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#993C1D" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
        <marker id="a4g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="20" width="110" height="80" rx="8" fill="#FAECE7" stroke="#F5C4B3" strokeWidth="0.5"/>
      <text x="65" y="50" textAnchor="middle" fontSize="12" fontWeight="600" fill="#712B13">Loss</text>
      <text x="65" y="67" textAnchor="middle" fontSize="10" fill="#993C1D">불확실해도</text>
      <text x="65" y="83" textAnchor="middle" fontSize="10" fill="#993C1D">인식 → 빠르게</text>
      <line x1="120" y1="60" x2="165" y2="60" stroke="#993C1D" strokeWidth="1.5" markerEnd="url(#a4r)"/>
      <text x="142" y="52" textAnchor="middle" fontSize="9" fill="#993C1D">즉시</text>
      <rect x="167" y="30" width="146" height="60" rx="8" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="240" y="57" textAnchor="middle" fontSize="12" fontWeight="600" fill="#444441">F/S</text>
      <text x="240" y="74" textAnchor="middle" fontSize="10" fill="#888780">보수적 표시</text>
      <line x1="313" y1="47" x2="358" y2="47" stroke="#0F6E56" strokeWidth="1.5" markerEnd="url(#a4g)"/>
      <text x="335" y="40" textAnchor="middle" fontSize="9" fill="#0F6E56">확실할 때</text>
      <rect x="360" y="20" width="110" height="80" rx="8" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
      <text x="415" y="50" textAnchor="middle" fontSize="12" fontWeight="600" fill="#085041">Gain</text>
      <text x="415" y="67" textAnchor="middle" fontSize="10" fill="#0F6E56">실현 확실 시</text>
      <text x="415" y="83" textAnchor="middle" fontSize="10" fill="#0F6E56">인식 → 늦게</text>
      <text x="240" y="112" textAnchor="middle" fontSize="10" fill="#888780">투자자 보호 — 나쁜 소식을 늦게 알수록 피해가 커진다</text>
    </svg>
  );
}

function SvgAssetExpense() {
  return (
    <svg viewBox="0 0 480 130" width="100%" aria-hidden="true">
      <defs>
        <marker id="a5" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#854F0B" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
        <marker id="a5g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="43" width="100" height="50" rx="8" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="60" y="64" textAnchor="middle" fontSize="12" fontWeight="600" fill="#633806">Asset</text>
      <text x="60" y="80" textAnchor="middle" fontSize="10" fill="#854F0B">Acquisition Cost</text>
      <line x1="110" y1="60" x2="148" y2="35" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a5)"/>
      <line x1="110" y1="68" x2="148" y2="68" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a5)"/>
      <line x1="110" y1="76" x2="148" y2="100" stroke="#888780" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#a5g)"/>
      <rect x="150" y="18" width="140" height="34" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="220" y="32" textAnchor="middle" fontSize="10" fontWeight="600" fill="#633806">Inventory → COGS</text>
      <text x="220" y="45" textAnchor="middle" fontSize="9" fill="#854F0B">when sold (immediate)</text>
      <rect x="150" y="58" width="140" height="34" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="220" y="72" textAnchor="middle" fontSize="10" fontWeight="600" fill="#633806">Building → Depreciation</text>
      <text x="220" y="85" textAnchor="middle" fontSize="9" fill="#854F0B">each year (gradual)</text>
      <rect x="150" y="98" width="140" height="34" rx="6" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="220" y="112" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444441">Land → Gain/Loss on sale</text>
      <text x="220" y="125" textAnchor="middle" fontSize="9" fill="#888780">only when disposed</text>
      <line x1="290" y1="35" x2="338" y2="68" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a5)"/>
      <line x1="290" y1="75" x2="338" y2="75" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a5)"/>
      <line x1="290" y1="115" x2="338" y2="82" stroke="#888780" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#a5g)"/>
      <rect x="340" y="52" width="130" height="46" rx="8" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="405" y="72" textAnchor="middle" fontSize="12" fontWeight="600" fill="#633806">Expense / P&L</text>
      <text x="405" y="88" textAnchor="middle" fontSize="10" fill="#854F0B">I/S 반영</text>
    </svg>
  );
}

function SvgLiability() {
  return (
    <svg viewBox="0 0 480 110" width="100%" aria-hidden="true">
      <defs>
        <marker id="a6" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#854F0B" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
        <marker id="a6g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="25" width="110" height="60" rx="8" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
      <text x="65" y="52" textAnchor="middle" fontSize="12" fontWeight="600" fill="#633806">Liability</text>
      <text x="65" y="68" textAnchor="middle" fontSize="10" fill="#854F0B">현재 의무 발생</text>
      <line x1="120" y1="46" x2="158" y2="32" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a6)"/>
      <line x1="120" y1="55" x2="158" y2="55" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a6)"/>
      <line x1="120" y1="64" x2="158" y2="78" stroke="#854F0B" strokeWidth="1" markerEnd="url(#a6)"/>
      <text x="196" y="28" textAnchor="middle" fontSize="10" fill="#633806">Cash repayment</text>
      <text x="196" y="52" textAnchor="middle" fontSize="10" fill="#633806">Service delivery</text>
      <text x="196" y="76" textAnchor="middle" fontSize="10" fill="#633806">Goods transfer</text>
      <line x1="248" y1="32" x2="286" y2="52" stroke="#0F6E56" strokeWidth="1" markerEnd="url(#a6g)"/>
      <line x1="248" y1="55" x2="286" y2="55" stroke="#0F6E56" strokeWidth="1" markerEnd="url(#a6g)"/>
      <line x1="248" y1="78" x2="286" y2="58" stroke="#0F6E56" strokeWidth="1" markerEnd="url(#a6g)"/>
      <rect x="288" y="25" width="180" height="60" rx="8" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
      <text x="378" y="52" textAnchor="middle" fontSize="12" fontWeight="600" fill="#085041">Liability Settled</text>
      <text x="378" y="68" textAnchor="middle" fontSize="10" fill="#0F6E56">의무 이행 완료</text>
      <text x="240" y="102" textAnchor="middle" fontSize="10" fill="#888780">형태만 다를 뿐 — 모든 Liability는 반드시 소멸된다</text>
    </svg>
  );
}

function SvgOwnerTransaction() {
  return (
    <svg viewBox="0 0 480 120" width="100%" aria-hidden="true">
      <defs>
        <marker id="a7" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="30" width="100" height="60" rx="8" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="60" y="57" textAnchor="middle" fontSize="12" fontWeight="600" fill="#0C447C">Shareholder</text>
      <text x="60" y="73" textAnchor="middle" fontSize="10" fill="#185FA5">(Owner)</text>
      <line x1="110" y1="60" x2="155" y2="60" stroke="#185FA5" strokeWidth="1.5" markerEnd="url(#a7)"/>
      <text x="132" y="52" textAnchor="middle" fontSize="9" fill="#185FA5">capital txn</text>
      <rect x="157" y="30" width="120" height="60" rx="8" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="217" y="54" textAnchor="middle" fontSize="12" fontWeight="600" fill="#0C447C">Company</text>
      <text x="217" y="70" textAnchor="middle" fontSize="10" fill="#185FA5">CS / APIC / RE</text>
      <line x1="277" y1="48" x2="320" y2="35" stroke="#B4B2A9" strokeWidth="1" strokeDasharray="3 2"/>
      <rect x="322" y="20" width="148" height="34" rx="6" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="396" y="42" textAnchor="middle" fontSize="10" fill="#888780">I/S — bypassed</text>
      <line x1="277" y1="72" x2="320" y2="78" stroke="#185FA5" strokeWidth="1.5" markerEnd="url(#a7)"/>
      <rect x="322" y="64" width="148" height="34" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="396" y="86" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0C447C">Equity accounts only</text>
      <text x="240" y="112" textAnchor="middle" fontSize="10" fill="#888780">Income only from third-party transactions — owner txns → equity only</text>
    </svg>
  );
}

function SvgConsistency() {
  return (
    <svg viewBox="0 0 480 100" width="100%" aria-hidden="true">
      <rect x="10" y="25" width="80" height="50" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="50" y="47" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0C447C">Year 1</text>
      <text x="50" y="63" textAnchor="middle" fontSize="10" fill="#185FA5">Policy A</text>
      <rect x="110" y="25" width="80" height="50" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="150" y="47" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0C447C">Year 2</text>
      <text x="150" y="63" textAnchor="middle" fontSize="10" fill="#185FA5">Policy A</text>
      <rect x="210" y="25" width="80" height="50" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="250" y="47" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0C447C">Year 3</text>
      <text x="250" y="63" textAnchor="middle" fontSize="10" fill="#185FA5">Policy A</text>
      <text x="310" y="55" textAnchor="middle" fontSize="16" fill="#0F6E56">→</text>
      <rect x="330" y="25" width="140" height="50" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
      <text x="400" y="47" textAnchor="middle" fontSize="11" fontWeight="600" fill="#085041">Comparability</text>
      <text x="400" y="63" textAnchor="middle" fontSize="10" fill="#0F6E56">기간 간 분석 가능</text>
      <text x="240" y="92" textAnchor="middle" fontSize="10" fill="#888780">Policy change → retrospective / Estimate change → prospective</text>
    </svg>
  );
}

function SvgMateriality() {
  return (
    <svg viewBox="0 0 480 110" width="100%" aria-hidden="true">
      <defs>
        <marker id="a8a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
        <marker id="a8b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#888780" strokeWidth="1.5" strokeLinecap="round"/>
        </marker>
      </defs>
      <rect x="10" y="28" width="120" height="54" rx="8" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="70" y="52" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0C447C">Transaction</text>
      <text x="70" y="68" textAnchor="middle" fontSize="10" fill="#185FA5">금액 판단 필요</text>
      <line x1="130" y1="44" x2="175" y2="28" stroke="#185FA5" strokeWidth="1" markerEnd="url(#a8a)"/>
      <line x1="130" y1="66" x2="175" y2="82" stroke="#888780" strokeWidth="1" markerEnd="url(#a8b)"/>
      <rect x="177" y="14" width="148" height="36" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
      <text x="251" y="29" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0C447C">Material</text>
      <text x="251" y="43" textAnchor="middle" fontSize="9" fill="#185FA5">precise treatment required</text>
      <rect x="177" y="68" width="148" height="36" rx="6" fill="#F1EFE8" stroke="#D3D1C7" strokeWidth="0.5"/>
      <text x="251" y="83" textAnchor="middle" fontSize="10" fontWeight="600" fill="#444441">Immaterial</text>
      <text x="251" y="97" textAnchor="middle" fontSize="9" fill="#888780">convenience treatment OK</text>
      <text x="240" y="104" textAnchor="middle" fontSize="10" fill="#888780">Does it affect user decisions? Yes → Material</text>
    </svg>
  );
}

const SVG_MAP: Record<string, React.ReactNode> = {
  REC_001: <SvgAccrual />,
  REC_002: <SvgMatching />,
  REC_003: <SvgRevenue />,
  MS_001:  <SvgHistoricalCost />,
  MS_002:  <SvgConservatism />,
  AL_001:  <SvgAssetExpense />,
  AL_002:  <SvgLiability />,
  RI_001:  <SvgOwnerTransaction />,
  RI_002:  <SvgConsistency />,
  RI_003:  <SvgMateriality />,
};

// ── Data (inline — import from JSON in real build) ──────────────────────────
import corePrinciples from "../data/core_principles.json";

type Principle = {
  id: string;
  title: string;
  one_liner: string;
  essence: string;
  examples: { q: string; a: string }[];
};

type Category = {
  category_id: string;
  category_name: string;
  category_ko: string;
  color: string;
  bg: string;
  border: string;
  principles: Principle[];
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function CorePage() {
  const categories = corePrinciples.categories as Category[];
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeItem, setActiveItem]   = useState(0);

  const group = categories[activeGroup];
  const { color, bg, border } = COLOR_MAP[group.category_id] ?? COLOR_MAP.recognition;
  const item  = group.principles[activeItem];

  return (
    <div style={{ display: "flex", height: "100%", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 224,
        flexShrink: 0,
        borderRight: "1px solid var(--color-border-tertiary, #e5e5e5)",
        overflowY: "auto",
      }}>
        {categories.map((g, gi) => {
          const c = COLOR_MAP[g.category_id] ?? COLOR_MAP.recognition;
          return (
            <div key={gi}>
              <div style={{
                padding: "10px 16px 5px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: c.color,
                borderTop: gi > 0 ? "1px solid var(--color-border-tertiary, #e5e5e5)" : "none",
                marginTop: gi > 0 ? 2 : 0,
              }}>
                {g.category_name}
                <span style={{ fontWeight: 400, marginLeft: 4, opacity: 0.7 }}>· {g.category_ko}</span>
              </div>
              {g.principles.map((p, pi) => {
                const active = activeGroup === gi && activeItem === pi;
                return (
                  <div
                    key={pi}
                    onClick={() => { setActiveGroup(gi); setActiveItem(pi); }}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? c.color : "var(--color-text-secondary, #666)",
                      background: active ? c.bg : "transparent",
                      borderLeft: `3px solid ${active ? c.color : "transparent"}`,
                      transition: "all 0.12s",
                      lineHeight: 1.35,
                    }}
                  >
                    {p.title}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>

        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: bg,
            color,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 12,
            marginBottom: 10,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            {group.category_name} · {group.category_ko}
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: "var(--color-text-primary, #111)" }}>
            {item.title}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color, fontWeight: 500, lineHeight: 1.5 }}>
            {item.one_liner}
          </p>
        </div>

        {/* Essence */}
        <div style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: "14px 18px",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            경제적 실질
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "var(--color-text-primary, #111)" }}>
            {item.essence}
          </p>
        </div>

        {/* SVG diagram */}
        <div style={{
          background: "var(--color-background-secondary, #f8f8f7)",
          border: "1px solid var(--color-border-tertiary, #e5e5e5)",
          borderRadius: 10,
          padding: "16px 20px 12px",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary, #aaa)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Structure
          </div>
          {SVG_MAP[item.id] ?? null}
        </div>

        {/* FAR Examples */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary, #aaa)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            FAR Examples
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.examples.map((ex, ei) => (
              <div key={ei} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--color-border-tertiary, #e5e5e5)",
              }}>
                <div style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: "var(--color-background-secondary, #f8f8f7)",
                  color: "var(--color-text-primary, #111)",
                  borderRight: "1px solid var(--color-border-tertiary, #e5e5e5)",
                }}>
                  {ex.q}
                </div>
                <div style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  lineHeight: 1.5,
                  background: bg,
                  color,
                  fontWeight: 500,
                }}>
                  {ex.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
