/**
 * TASK 0 — UI Preview (hardcoded mock data)
 * Navigate to /wrong-preview to view all 4 screens.
 * Delete this file after design is confirmed.
 */
import { useState } from 'react';

const NAVY = '#1a2744';
const TEXT = '#111111';
const BORDER = '1px solid #e0e0e0';
const MUTED = '#666666';

type Tab = 'input' | 'history' | 'dashboard' | 'harry';

// ── Mock Data ────────────────────────────────────────────────────
const MOCK_PARSED = [
  {
    id: '1', qNum: 'Q7', topic: 'Note Payable', pattern: '공식 불완전',
    question: 'On Sep 30, a company borrowed $1,000,000 at 9% annual interest. What is the accrued interest expense at Dec 31?',
    myAnswer: '$90,000',
    correctAnswer: '$22,500',
    explanation: 'Interest = Beginning Balance × rate × months/12. $1,000,000 × 9% × 3/12 = $22,500. Payment amount ≠ interest expense.',
    modified: false,
  },
  {
    id: '2', qNum: 'Q9', topic: 'Foreign Currency', pattern: '표현 변환 실수',
    question: 'If the foreign currency strengthens, what happens to AR denominated in that currency?',
    myAnswer: 'Increase, FX gain',
    correctAnswer: 'AR increases + FX Gain recognized',
    explanation: 'Stronger foreign currency → more $ per unit → AR carrying value increases → FX gain. Units per $ decreases = same direction.',
    modified: false,
  },
];

const MOCK_HISTORY = [
  { id: 'h1', qNum: 'Q9', topic: 'Foreign Currency', pattern: '표현 변환', timesWrong: 2, isResolved: false, date: '2025.06.05', excerpt: 'AR + FX gain → Decrease (오답)' },
  { id: 'h2', qNum: 'Q31', topic: 'EPS', pattern: '공식 불완전', timesWrong: 2, isResolved: false, date: '2025.06.04', excerpt: 'Diluted EPS convertible bond adjustment' },
  { id: 'h3', qNum: 'Q7', topic: 'Note Payable', pattern: '공식 불완전', timesWrong: 1, isResolved: false, date: '2025.06.05', excerpt: 'Payment ≠ interest expense' },
  { id: 'h4', qNum: 'Q3', topic: 'Bond', pattern: '개념 혼동', timesWrong: 1, isResolved: true, date: '2025.06.04', excerpt: 'Premium bond CV direction — decreasing' },
  { id: 'h5', qNum: 'Q12', topic: 'Lease', pattern: '공식 불완전', timesWrong: 1, isResolved: false, date: '2025.06.03', excerpt: 'Annuity Due vs Ordinary — Day 1 payment' },
];

const MOCK_DASHBOARD = {
  weekWrong: 12,
  resolved: 7,
  repeated: 3,
  byTopic: [
    { topic: 'Bond', count: 8 },
    { topic: 'Lease', count: 6 },
    { topic: 'EPS', count: 5 },
    { topic: 'Foreign Currency', count: 4 },
    { topic: 'Note Payable', count: 2 },
  ],
  byPattern: [
    { pattern: '공식 불완전', pct: 40 },
    { pattern: '개념 혼동', pct: 25 },
    { pattern: '표현 변환', pct: 20 },
    { pattern: '용어 혼동', pct: 10 },
    { pattern: '계산 실수', pct: 5 },
  ],
  repeated_list: [
    { qNum: 'Q9', topic: 'FX', pattern: '표현 변환', times: 3 },
    { qNum: 'Q31', topic: 'EPS', pattern: '공식 불완전', times: 2 },
  ],
};

const MOCK_CHAT = [
  { role: 'assistant', content: '약점 Top 3: Bond(8) · FX(4) · EPS(5)\n\nLet\'s check Bond first. Premium bond의 CV(carrying value)는 시간이 지남에 따라 어떤 방향으로 움직여?' },
  { role: 'user', content: 'Down / decreases' },
  { role: 'assistant', content: '정확해! Premium bond는 발행가($108,000)에서 시작해서 만기 시 face value($100,000)로 수렴. CV 감소 방향.\n\n다음: Discount bond는?' },
];

// ── Shared UI ────────────────────────────────────────────────────
function Badge({ children, color = NAVY, bg = '' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
      background: bg || color, color: bg ? color : '#fff', border: bg ? `1px solid ${color}` : 'none',
    }}>
      {children}
    </span>
  );
}

function TopicSelect({ value }: { value: string }) {
  const topics = ['Bond', 'Lease', 'EPS', 'Note Payable', 'Foreign Currency', 'ARO', 'Deferred Tax', 'Inventory', 'Revenue', 'SCF', 'Other'];
  return (
    <select value={value} onChange={() => {}} style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: NAVY, fontWeight: 600 }}>
      {topics.map(t => <option key={t}>{t}</option>)}
    </select>
  );
}

function PatternSelect({ value }: { value: string }) {
  const patterns = ['공식 불완전', '개념 혼동', '표현 변환 실수', '용어 혼동', '계산 실수'];
  return (
    <select value={value} onChange={() => {}} style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: '#555' }}>
      {patterns.map(p => <option key={p}>{p}</option>)}
    </select>
  );
}

// ── Screen 1: 입력 탭 ────────────────────────────────────────────
function InputTab() {
  const [parsed, setParsed] = useState(MOCK_PARSED);
  const [text, setText] = useState('');
  const [showParsed, setShowParsed] = useState(true);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <textarea
        placeholder="복습 내용 붙여넣기...&#10;&#10;Q7. 문제: quarterly payment...&#10;내 답: $90,000&#10;정답: $22,500&#10;풀이: payment = 이자 + 원금..."
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          width: '100%', minHeight: 180, padding: '12px', border: BORDER,
          borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
          boxSizing: 'border-box', color: TEXT,
        }}
      />
      <button
        onClick={() => setShowParsed(true)}
        style={{
          alignSelf: 'flex-end', padding: '8px 20px', background: NAVY, color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        파싱하기 →
      </button>

      {showParsed && (
        <div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>── 파싱 결과 ({parsed.length}개) ──</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {parsed.map((card) => (
              <div key={card.id} style={{ border: BORDER, borderRadius: 8, overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: BORDER, background: '#fafafa', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{card.qNum}</span>
                  <TopicSelect value={card.topic} />
                  <PatternSelect value={card.pattern} />
                  {card.modified && <Badge color="#f59e0b" bg="#fef3c7">수정됨</Badge>}
                  <button
                    onClick={() => setParsed(prev => prev.filter(c => c.id !== card.id))}
                    style={{ marginLeft: 'auto', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                  >×</button>
                </div>

                {/* Question */}
                <div style={{ padding: '10px 12px', borderBottom: BORDER }}>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>문제</div>
                  <div style={{ fontSize: 13 }}>{card.question}</div>
                </div>

                {/* My answer */}
                <div style={{ padding: '10px 12px', background: '#fef2f2', borderBottom: BORDER }}>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>내 답</div>
                  <div style={{ fontSize: 13 }}>{card.myAnswer}</div>
                </div>

                {/* Correct answer */}
                <div style={{ padding: '10px 12px', background: '#f0fdf4', borderBottom: BORDER }}>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>정답</div>
                  <div style={{ fontSize: 13 }}>{card.correctAnswer}</div>
                </div>

                {/* Explanation */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>풀이</div>
                  <div style={{ fontSize: 13 }}>{card.explanation}</div>
                </div>
              </div>
            ))}
          </div>

          <button style={{
            width: '100%', marginTop: 16, padding: '12px',
            background: NAVY, color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            전체 저장 ({parsed.length}개)
          </button>
        </div>
      )}
    </div>
  );
}

// ── Screen 2: 히스토리 탭 ────────────────────────────────────────
function HistoryTab() {
  const [resolved, setResolved] = useState<Set<string>>(new Set(['h4']));
  const [modal, setModal] = useState<typeof MOCK_HISTORY[0] | null>(null);
  const [filterResolved, setFilterResolved] = useState(false);

  const toggleResolved = (id: string) => {
    setResolved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const repeated = MOCK_HISTORY.filter(h => h.timesWrong >= 2);
  const byDate: Record<string, typeof MOCK_HISTORY> = {};
  MOCK_HISTORY.filter(h => !filterResolved || !resolved.has(h.id))
    .forEach(h => {
      byDate[h.date] = byDate[h.date] || [];
      byDate[h.date].push(h);
    });

  return (
    <div style={{ padding: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select style={{ fontSize: 12, border: BORDER, borderRadius: 5, padding: '5px 8px' }}>
          <option>Topic ▾</option>
          <option>Bond</option><option>EPS</option><option>Foreign Currency</option>
        </select>
        <select style={{ fontSize: 12, border: BORDER, borderRadius: 5, padding: '5px 8px' }}>
          <option>Pattern ▾</option>
          <option>공식 불완전</option><option>표현 변환</option>
        </select>
        <button
          onClick={() => setFilterResolved(v => !v)}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 5,
            border: BORDER, background: filterResolved ? NAVY : '#fff',
            color: filterResolved ? '#fff' : TEXT, cursor: 'pointer',
          }}
        >
          미해결만
        </button>
      </div>

      {/* Repeated section */}
      {repeated.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
            ⚠ 반복 오답 (2회 이상)
          </div>
          {repeated.map(h => (
            <div
              key={h.id}
              onClick={() => setModal(h)}
              style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: '#fff5f5', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{h.qNum}</span>
                <Badge color="#dc2626" bg="#fee2e2">{h.topic}</Badge>
                <span style={{ fontSize: 12, color: MUTED }}>{h.pattern}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#dc2626', fontSize: 13 }}>×{h.timesWrong}회 🔴</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{h.excerpt}</div>
            </div>
          ))}
        </div>
      )}

      {/* Date groups */}
      {Object.entries(byDate).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 8 }}>
            {date} ({items.length}개)
          </div>
          {items.map(h => (
            <div
              key={h.id}
              onClick={() => setModal(h)}
              style={{ border: BORDER, borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <button
                onClick={e => { e.stopPropagation(); toggleResolved(h.id); }}
                style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', border: `2px solid ${resolved.has(h.id) ? '#16a34a' : '#ccc'}`, background: resolved.has(h.id) ? '#16a34a' : '#fff', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {resolved.has(h.id) ? '✓' : '○'}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{h.qNum}</span>
                  <Badge color={NAVY} bg="#e8edf5">{h.topic}</Badge>
                  <span style={{ fontSize: 12, color: MUTED }}>{h.pattern}</span>
                  {h.timesWrong >= 2 && <Badge color="#dc2626" bg="#fee2e2">×{h.timesWrong}</Badge>}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{h.excerpt}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxHeight: '70vh', overflowY: 'auto', borderRadius: '12px 12px 0 0', padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>{modal.qNum}</span>
                <Badge color={NAVY}>{modal.topic}</Badge>
                <span style={{ fontSize: 12, color: MUTED }}>{modal.pattern}</span>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: MUTED }}>×</button>
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>{modal.excerpt}</div>
            <div style={{ fontSize: 12, color: MUTED }}>날짜: {modal.date}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Screen 3: 대시보드 탭 ────────────────────────────────────────
function DashboardTab() {
  const d = MOCK_DASHBOARD;
  const maxCount = Math.max(...d.byTopic.map(t => t.count));

  return (
    <div style={{ padding: 16 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: '이번 주 오답', value: d.weekWrong },
          { label: '해결됨', value: d.resolved },
          { label: '반복 오답', value: d.repeated },
        ].map(c => (
          <div key={c.label} style={{ background: NAVY, color: '#fff', borderRadius: 10, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{c.value}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Topic bar chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>파트별 오답</div>
        {d.byTopic.map(t => (
          <div key={t.topic} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 90, fontSize: 12, color: TEXT, flexShrink: 0 }}>{t.topic}</div>
            <div style={{ flex: 1, background: '#e0e0e0', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{ width: `${(t.count / maxCount) * 100}%`, background: NAVY, height: '100%', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, color: MUTED, width: 28, textAlign: 'right', flexShrink: 0 }}>{t.count}회</div>
          </div>
        ))}
      </div>

      {/* Pattern bar chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>패턴별 분포</div>
        {d.byPattern.map(p => (
          <div key={p.pattern} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 90, fontSize: 12, color: TEXT, flexShrink: 0 }}>{p.pattern}</div>
            <div style={{ flex: 1, background: '#e0e0e0', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{ width: `${p.pct}%`, background: '#334155', height: '100%', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, color: MUTED, width: 32, textAlign: 'right', flexShrink: 0 }}>{p.pct}%</div>
          </div>
        ))}
      </div>

      {/* Repeated alerts */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>⚠ 반복 오답 경보</div>
        {d.repeated_list.map(r => (
          <div key={r.qNum} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 8, background: '#fff5f5' }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{r.qNum}</span>
            <span style={{ fontSize: 12, color: MUTED }}>{r.topic}</span>
            <span style={{ fontSize: 12, color: MUTED }}>{r.pattern}</span>
            <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 12 }}>×{r.times}회</span>
            <button style={{ marginLeft: 'auto', padding: '4px 10px', background: NAVY, color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>
              복습하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Screen 4: Harry 탭 ───────────────────────────────────────────
function HarryTab() {
  const [msgs, setMsgs] = useState(MOCK_CHAT);
  const [input, setInput] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  const quickBtns = [
    { label: '약점 개념 확인', text: 'Ask me a concept check on my weakest topic' },
    { label: '분개 오류 찾기', text: 'Show me a JE with one error to find' },
    { label: '공식 빈칸 채우기', text: 'Give me a formula completion question' },
  ];

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '(Harry 응답 예시) 정확해! 다음 개념은...' }]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Weak topics summary */}
      <div style={{ padding: '10px 16px', background: '#f8f9fc', borderBottom: BORDER }}>
        <div style={{ fontSize: 12, color: MUTED }}>
          약점 Top 3: <strong style={{ color: NAVY }}>Bond(8)</strong> · <strong style={{ color: NAVY }}>EPS(5)</strong> · <strong style={{ color: NAVY }}>FX(4)</strong>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6,
              background: m.role === 'assistant' ? NAVY : '#f1f5f9',
              color: m.role === 'assistant' ? '#fff' : TEXT,
              whiteSpace: 'pre-wrap',
              borderBottomLeftRadius: m.role === 'assistant' ? 2 : 10,
              borderBottomRightRadius: m.role === 'user' ? 2 : 10,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {/* Example SVG visualization inline */}
        <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
          <div style={{ background: NAVY, color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: '8px 8px 0 0' }}>Harry — Bond CV Visualization</div>
          <div style={{ border: BORDER, borderRadius: '0 8px 8px 8px', padding: 12, background: '#fff' }}>
            <svg width="260" height="110" viewBox="0 0 260 110">
              {/* Premium bond - decreasing */}
              <text x="10" y="15" fontSize="11" fill={NAVY} fontWeight="600">Premium Bond</text>
              <line x1="10" y1="55" x2="250" y2="55" stroke="#e0e0e0" strokeWidth="1" />
              <line x1="10" y1="55" x2="10" y2="25" stroke="#e0e0e0" strokeWidth="1" />
              <polyline points="10,28 60,33 110,38 160,43 210,48 250,53" fill="none" stroke={NAVY} strokeWidth="2" />
              <text x="12" y="27" fontSize="9" fill={NAVY}>$108K</text>
              <text x="215" y="67" fontSize="9" fill={NAVY}>$100K</text>
              <text x="120" y="72" fontSize="9" fill={MUTED}>→ decreasing to face</text>
              {/* Discount bond - increasing */}
              <text x="10" y="88" fontSize="11" fill="#334155" fontWeight="600">Discount Bond</text>
              <polyline points="10,98 60,95 110,92 160,89 210,86 250,82" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4,2" />
              <text x="12" y="100" fontSize="9" fill="#334155">$92K</text>
              <text x="215" y="80" fontSize="9" fill="#334155">$100K</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Quick buttons */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: BORDER, flexWrap: 'wrap' }}>
        {quickBtns.map(btn => (
          <button
            key={btn.label}
            onClick={() => send(btn.text)}
            onMouseEnter={() => setHovered(btn.label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              fontSize: 12, padding: '5px 10px', border: `1px solid ${NAVY}`, borderRadius: 5,
              background: hovered === btn.label ? NAVY : '#fff',
              color: hovered === btn.label ? '#fff' : NAVY,
              cursor: 'pointer', transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: BORDER }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="답변 입력..."
          style={{ flex: 1, padding: '8px 12px', border: BORDER, borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        <button
          onClick={() => send(input)}
          style={{ padding: '8px 16px', background: NAVY, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

// ── Main Preview Page ─────────────────────────────────────────────
export default function WrongAnswerPreviewPage() {
  const [tab, setTab] = useState<Tab>('input');
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'input', label: '입력' },
    { key: 'history', label: '히스토리' },
    { key: 'dashboard', label: '대시보드' },
    { key: 'harry', label: 'Harry' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100%', display: 'flex', flexDirection: 'column', color: TEXT, maxWidth: 600, margin: '0 auto' }}>
      {/* Preview banner */}
      <div style={{ background: '#fef3c7', padding: '6px 16px', fontSize: 12, color: '#92400e', textAlign: 'center', fontWeight: 600 }}>
        ⚡ TASK 0 — UI 프리뷰 (하드코딩 목업) · 디자인 확인 후 실제 구현 진행
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: BORDER }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: NAVY }}>오답 노트</h1>
        <span style={{ fontSize: 12, color: MUTED }}>{today}</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${NAVY}` }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 0', fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#fff' : NAVY,
              background: tab === t.key ? NAVY : 'transparent',
              border: 'none', cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tab === 'input' && <InputTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'harry' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 500 }}>
            <HarryTab />
          </div>
        )}
      </div>
    </div>
  );
}
