/**
 * WrongAnswerPage — Supabase-connected replacement for WrongAnswerPreviewPage (hardcoded mock).
 * Tables used: wrong_answer_sessions, wrong_answers
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import useStudyStore from '../store/studyStore';
import { parseWrongAnswerBlock, saveWrongAnswer, stripWrongAnswerJson } from '../lib/harryWrongAnswer';
import { computeQuestionId } from '../lib/questionId';
import { apiFetch } from '../lib/apiFetch';

// ── Constants ────────────────────────────────────────────────────
const NAVY = '#1a2744';
const TEXT = '#111111';
const BORDER = '1px solid #e0e0e0';
const MUTED = '#666666';

const TOPICS = [
  'Accounting Changes', 'ARO', 'Bond', 'Cash & Receivables',
  'Consolidation', 'Contingencies', 'Deferred Tax', 'EPS',
  'Equity Method', 'Error Correction', 'Fair Value', 'Foreign Currency',
  'Government', 'Intangibles', 'Inventory', 'Lease', 'NFP', 'Note Payable',
  'Partnerships', 'PPE', 'Ratio Analysis', 'Revenue', 'SCF',
  'Stockholders Equity', 'Subsequent Events', 'Other',
];
const PATTERNS = ['공식 불완전', '개념 혼동', '표현 변환 실수', '용어 혼동', '계산 실수'];

// trap_category: 1=개념선택 혼동 2=무관개념 적용 3=트리거문구 인식실패 4=계산절차 실수
const TRAP_CATEGORY_LABELS: Record<number, string> = {
  1: '개념선택 혼동',
  2: '무관개념 적용',
  3: '트리거문구 인식실패',
  4: '계산절차 실수',
};
// coral sequential ramp, light→dark (validated: dataviz skill, ordinal check vs #fff surface)
const CORAL_RAMP = ['#f4ece8', '#e0a58e', '#d88b6b', '#c96a41', '#b04a26', '#8f3417'];

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';
const SHOW_ME = ['show me', '비주얼로', '구조화해줘', '숫자로 보여줘', '그려줘'];

// ── Types ────────────────────────────────────────────────────────
type Tab = 'input' | 'history' | 'dashboard' | 'harry';
type MsgType = 'text' | 'svg';

interface ParsedCard {
  id: string;
  questionNum: string;
  questionText: string;
  myAnswer: string;
  correctAnswer: string;
  explanation: string;
  topicTag: string;
  errorPattern: string;
}

interface WrongAnswer {
  id: string;
  session_id: string | null;
  user_id: string | null;
  question_number: string | null;
  question_text: string;
  my_answer: string | null;
  correct_answer: string | null;
  explanation: string | null;
  topic_tag: string | null;
  error_pattern: string | null;
  trap_category: number | null;
  times_wrong: number;
  is_resolved: boolean;
  created_at: string;
}

interface TopicSummary {
  topic_tag: string;
  total_wrong: number;
}

interface Msg {
  role: 'user' | 'assistant';
  type: MsgType;
  content?: string;
  svgKey?: string;
}

// ── Parse Helpers ────────────────────────────────────────────────
function matchTopic(t: string): string | null {
  // Specific topics first to avoid partial false-matches
  if (/accounting change|change in principle|change in estimate/.test(t)) return 'Accounting Changes';
  if (/error correct|restatement/.test(t)) return 'Error Correction';
  if (/subsequent event/.test(t)) return 'Subsequent Events';
  if (/consolidat|\bnci\b/.test(t)) return 'Consolidation';
  if (/stockholders.equity|\bse\s+worksheet/.test(t)) return 'Stockholders Equity';
  if (/fair value|\blevel [123]\b/.test(t)) return 'Fair Value';
  if (/dupont|\broa\b|\broe\b|\bratio\b/.test(t)) return 'Ratio Analysis';
  if (/contingenc/.test(t)) return 'Contingencies';
  if (/intangible|patent|\br&d\b/.test(t)) return 'Intangibles';
  if (/receivable|cash equivalent/.test(t)) return 'Cash & Receivables';
  if (/partnership/.test(t)) return 'Partnerships';
  if (/governmental|gov fund|enterprise fund|general fund|modified accrual/.test(t)) return 'Government';
  if (/\bnfp\b|not-for-profit|nonprofit|nongovernmental/.test(t)) return 'NFP';
  // Existing topics
  if (/inventory|lifo|fifo|dollar.value/.test(t)) return 'Inventory';
  if (/bond|debenture|coupon/.test(t)) return 'Bond';
  if (/lease|lessee|lessor|rou asset/.test(t)) return 'Lease';
  if (/revenue|recognition|contract/.test(t)) return 'Revenue';
  if (/depreciation|pp&e|property,\s*plant|impairment/.test(t)) return 'PPE';
  if (/deferred tax|dta|dtl|temporary difference/.test(t)) return 'Deferred Tax';
  if (/\beps\b|earnings per share|diluted|basic earnings/.test(t)) return 'EPS';
  if (/cash flow|operating activities|\bscf\b|\bcfo\b|\bcfi\b/.test(t)) return 'SCF';
  if (/equity method|investee/.test(t)) return 'Equity Method';
  if (/foreign currency|exchange rate|\bfx\b/.test(t)) return 'Foreign Currency';
  if (/\baro\b|asset retirement|decommission/.test(t)) return 'ARO';
  if (/note payable|promissory note|balloon/.test(t)) return 'Note Payable';
  return null;
}

// Step 1: question_text 우선, Step 2: explanation 보조, Step 3: Other
function detectTopic(questionText: string, explanation: string): string {
  return matchTopic(questionText.toLowerCase())
    ?? matchTopic(explanation.toLowerCase())
    ?? 'Other';
}

function detectPattern(text: string): string {
  const t = text.toLowerCase();
  if (/표현|변환|단위|per dollar|units/.test(t)) return '표현 변환 실수';
  if (/공식|formula|누락|differential|amortization/.test(t)) return '공식 불완전';
  if (/용어|proceeds|premium|혼동/.test(t)) return '용어 혼동';
  if (/계산|calculation|실수|오타/.test(t)) return '계산 실수';
  return '개념 혼동';
}

function parseWrongAnswers(text: string): ParsedCard[] {
  const blocks = text.split(/(?=Q\d+[\.\s])/i).filter(Boolean);
  return blocks.map(block => {
    const questionNum = block.match(/Q(\d+)/i)?.[1] ?? '';
    const questionText =
      block.match(/문제[:\s]+(.+?)(?=내\s*답|정답|틀린\s*이유\s*:|풀이\s*:|이유\s*:|explanation\s*:|why\s*:|reason\s*:|$)/si)?.[1]?.trim()
      ?? block.match(/문제 원문[:\s]+(.+?)(?=내\s*답|정답|틀린\s*이유\s*:|풀이\s*:|이유\s*:|explanation\s*:|why\s*:|reason\s*:|$)/si)?.[1]?.trim()
      ?? block.split('\n')[0]?.trim()
      ?? '';
    const myAnswer = block.match(/내\s*답[:\s]+(.+?)(?=정답|틀린\s*이유\s*:|풀이\s*:|이유\s*:|explanation\s*:|why\s*:|reason\s*:|$)/si)?.[1]?.trim() ?? '';
    const correctAnswer = block.match(/정답[:\s]+(.+?)(?=틀린\s*이유\s*:|풀이\s*:|이유\s*:|explanation\s*:|why\s*:|reason\s*:|$)/si)?.[1]?.trim() ?? '';
    const explanation = block.match(/(?:틀린\s*이유|풀이|이유|explanation|why|reason)\s*:\s*(.+?)$/si)?.[1]?.trim() ?? '';
    const topicTag = detectTopic(questionText, explanation);
    const errorPattern = detectPattern(block);
    return {
      id: Math.random().toString(36).slice(2),
      questionNum,
      questionText,
      myAnswer,
      correctAnswer,
      explanation,
      topicTag,
      errorPattern,
    };
  });
}

// ── Harry System Prompt ──────────────────────────────────────────
function buildPrompt(summary: TopicSummary[]): string {
  const weakTopics = summary
    .sort((a, b) => b.total_wrong - a.total_wrong)
    .slice(0, 3)
    .map(w => `${w.topic_tag}(${w.total_wrong}회)`)
    .join(', ');
  return `학생 취약 토픽: ${weakTopics || '아직 데이터 부족'}. 취약 토픽 먼저 다뤄줘.
"show me" / 비주얼로 / 구조화해줘 요청 시: "Here's the visualization"으로만 답해 (프론트에서 SVG를 직접 렌더링함).`;
}

const isVisual = (text: string): boolean =>
  SHOW_ME.some(t => text.toLowerCase().includes(t));

// ── SVG Components ────────────────────────────────────────────────
function BondSVG() {
  return (
    <svg width="260" height="120" viewBox="0 0 260 120">
      <text x="10" y="14" fontSize="11" fill={NAVY} fontWeight="600">Premium Bond (CV 감소)</text>
      <line x1="10" y1="55" x2="250" y2="55" stroke="#e0e0e0" strokeWidth="1" />
      <polyline points="10,26 60,31 110,37 160,43 210,49 250,54" fill="none" stroke={NAVY} strokeWidth="2" />
      <text x="12" y="24" fontSize="9" fill={NAVY}>$108K</text>
      <text x="215" y="68" fontSize="9" fill={NAVY}>$100K</text>
      <text x="10" y="80" fontSize="11" fill="#334155" fontWeight="600">Discount Bond (CV 증가)</text>
      <polyline points="10,110 60,106 110,102 160,98 210,93 250,88" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4,2" />
      <text x="12" y="112" fontSize="9" fill="#334155">$92K</text>
      <text x="215" y="86" fontSize="9" fill="#334155">$100K</text>
    </svg>
  );
}

function LeaseSVG() {
  return (
    <svg width="260" height="120" viewBox="0 0 260 120">
      <text x="10" y="14" fontSize="11" fill={NAVY} fontWeight="600">Finance vs Operating Lease I/S</text>
      {/* Finance Lease bars */}
      <rect x="20" y="25" width="40" height="50" fill={NAVY} />
      <rect x="20" y="80" width="40" height="30" fill="#334155" opacity="0.6" />
      <text x="40" y="120" fontSize="9" fill={MUTED} textAnchor="middle">Year 1</text>
      <rect x="80" y="35" width="40" height="40" fill={NAVY} />
      <rect x="80" y="80" width="40" height="30" fill="#334155" opacity="0.6" />
      <text x="100" y="120" fontSize="9" fill={MUTED} textAnchor="middle">Year 2</text>
      {/* Operating Lease bars */}
      <rect x="150" y="45" width="40" height="35" fill="#64748b" />
      <text x="170" y="120" fontSize="9" fill={MUTED} textAnchor="middle">Year 1</text>
      <rect x="200" y="45" width="40" height="35" fill="#64748b" />
      <text x="220" y="120" fontSize="9" fill={MUTED} textAnchor="middle">Year 2</text>
      <text x="40" y="20" fontSize="9" fill={NAVY} textAnchor="middle">Finance</text>
      <text x="185" y="20" fontSize="9" fill="#64748b" textAnchor="middle">Operating (SL)</text>
    </svg>
  );
}

function EpsSVG() {
  return (
    <svg width="260" height="100" viewBox="0 0 260 100">
      <text x="10" y="14" fontSize="11" fill={NAVY} fontWeight="600">EPS 구조</text>
      <rect x="10" y="22" width="230" height="28" rx="4" fill="#e8edf5" />
      <text x="125" y="40" fontSize="11" fill={NAVY} textAnchor="middle" fontWeight="700">Basic EPS = NI ÷ WASO</text>
      <rect x="10" y="58" width="230" height="34" rx="4" fill="#f0fdf4" />
      <text x="125" y="72" fontSize="10" fill="#16a34a" textAnchor="middle">Diluted EPS = (NI + adj) ÷ (WASO + dilutive shares)</text>
      <text x="125" y="86" fontSize="9" fill={MUTED} textAnchor="middle">adj: convertible bond int (net of tax), option treasury stock</text>
    </svg>
  );
}

function FxSVG() {
  return (
    <svg width="260" height="110" viewBox="0 0 260 110">
      <text x="10" y="14" fontSize="11" fill={NAVY} fontWeight="600">Foreign Currency: AR + 강세 → FX Gain</text>
      <rect x="10" y="25" width="70" height="28" rx="4" fill="#e8edf5" />
      <text x="45" y="43" fontSize="10" fill={NAVY} textAnchor="middle">AR (FC)</text>
      <text x="105" y="43" fontSize="16" fill={NAVY}>→</text>
      <rect x="130" y="25" width="80" height="28" rx="4" fill="#f0fdf4" />
      <text x="170" y="43" fontSize="10" fill="#16a34a" textAnchor="middle">FC 강세 = $↑</text>
      <text x="230" y="43" fontSize="16" fill="#16a34a">→</text>
      <rect x="10" y="68" width="230" height="28" rx="4" fill="#fef2f2" />
      <text x="125" y="85" fontSize="10" fill="#dc2626" textAnchor="middle">AR 장부가 증가 → FX Gain 인식 (I/S)</text>
    </svg>
  );
}

const SVG_MAP: Record<string, React.FC | undefined> = {
  Bond: BondSVG,
  Lease: LeaseSVG,
  EPS: EpsSVG,
  'Foreign Currency': FxSVG,
};

// ── Shared UI Components ─────────────────────────────────────────
function Badge({ children, color = NAVY, bg = '' }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
      background: bg || color, color: bg ? color : '#fff',
      border: bg ? `1px solid ${color}` : 'none',
    }}>
      {children}
    </span>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      background: '#16a34a', color: '#fff', padding: '12px 20px',
      borderRadius: 8, fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {msg}
    </div>
  );
}

// ── Tab 1: 입력 ───────────────────────────────────────────────────
type EditCard = {
  question_text: string; my_answer: string; correct_answer: string;
  explanation: string; topic_tag: string; error_pattern: string;
};

function InputTab({ userId, editItem, onEditDone }: {
  userId: string | null;
  editItem?: WrongAnswer | null;
  onEditDone?: () => void;
}) {
  const [rawText, setRawText] = useState('');
  const [cards, setCards] = useState<ParsedCard[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editCard, setEditCard] = useState<EditCard | null>(null);

  useEffect(() => {
    if (editItem) {
      setEditCard({
        question_text: editItem.question_text ?? '',
        my_answer: editItem.my_answer ?? '',
        correct_answer: editItem.correct_answer ?? '',
        explanation: editItem.explanation ?? '',
        topic_tag: editItem.topic_tag ?? '',
        error_pattern: editItem.error_pattern ?? '',
      });
    } else {
      setEditCard(null);
    }
  }, [editItem]);

  const handleUpdate = async () => {
    if (!editItem || !editCard) return;
    setSaving(true);
    try {
      const questionId = await computeQuestionId(editCard.question_text);
      const { error } = await supabase
        .from('wrong_answers')
        .update({
          question_id: questionId,
          question_text: editCard.question_text,
          my_answer: editCard.my_answer,
          correct_answer: editCard.correct_answer,
          explanation: editCard.explanation,
          topic_tag: editCard.topic_tag,
          error_pattern: editCard.error_pattern,
        })
        .eq('id', editItem.id);
      if (error) throw error;
      setToast('수정 완료!');
      setEditCard(null);
      onEditDone?.();
    } catch (err) {
      console.error('[InputTab] update error:', err);
      setToast('저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleParse = () => {
    if (!rawText.trim()) return;
    setCards(parseWrongAnswers(rawText));
  };

  const updateCard = (id: string, field: keyof ParsedCard, value: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    if (!userId || cards.length === 0) return;
    setSaving(true);
    try {
      // 1. Insert session
      const { data: session, error: sessErr } = await supabase
        .from('wrong_answer_sessions')
        .insert({ user_id: userId, session_date: new Date().toISOString().slice(0, 10), total_wrong: cards.length })
        .select('id')
        .single();

      if (sessErr) throw sessErr;

      // 2. Insert wrong_answers + upsert times_wrong
      for (const card of cards) {
        // question_number("Q1" 등)는 세션마다 재사용되는 화면표시 라벨이라 식별자로 못 씀 —
        // 실제 동일 문제 판단은 question_text 정규화 해시(question_id) 기준.
        const questionId = await computeQuestionId(card.questionText);
        const { data: existing } = await supabase
          .from('wrong_answers')
          .select('id, times_wrong')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('wrong_answers')
            .update({ times_wrong: existing.times_wrong + 1, is_resolved: false })
            .eq('id', existing.id);
        } else {
          await supabase.from('wrong_answers').insert({
            session_id: session?.id ?? null,
            user_id: userId,
            question_id: questionId,
            question_number: `Q${card.questionNum}`,
            question_text: card.questionText,
            my_answer: card.myAnswer,
            correct_answer: card.correctAnswer,
            explanation: card.explanation,
            topic_tag: card.topicTag,
            error_pattern: card.errorPattern,
            times_wrong: 1,
            is_resolved: false,
          });
        }
      }

      setToast(`${cards.length}개 저장 완료!`);
      setCards([]);
      setRawText('');
    } catch (err) {
      console.error('[WrongAnswerPage] save error:', err);
      setToast('저장 실패 — 다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {editCard ? (
        /* ── 수정 모드 ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: MUTED }}>── 수정 모드 ({editItem?.question_number ?? '—'}) ──</div>
          <div style={{ border: BORDER, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: BORDER, background: '#fafafa', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{editItem?.question_number ?? '—'}</span>
              <select
                value={editCard.topic_tag}
                onChange={e => setEditCard(c => c ? { ...c, topic_tag: e.target.value } : c)}
                style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: NAVY, fontWeight: 600 }}
              >
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                value={editCard.error_pattern}
                onChange={e => setEditCard(c => c ? { ...c, error_pattern: e.target.value } : c)}
                style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: '#555' }}
              >
                {PATTERNS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {([
              { label: '문제', field: 'question_text' as const, rows: 3 },
              { label: '내 답', field: 'my_answer' as const, rows: 1 },
              { label: '정답', field: 'correct_answer' as const, rows: 1 },
              { label: '풀이', field: 'explanation' as const, rows: 3 },
            ] as const).map(({ label, field, rows }) => (
              <div key={field} style={{ padding: '10px 12px', borderBottom: BORDER }}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <textarea
                  value={editCard[field]}
                  onChange={e => setEditCard(c => c ? { ...c, [field]: e.target.value } : c)}
                  rows={rows}
                  style={{ width: '100%', fontSize: 13, border: BORDER, borderRadius: 4, padding: '4px 6px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditCard(null); onEditDone?.(); }}
              style={{ flex: 1, padding: 12, background: '#fff', color: TEXT, border: BORDER, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
            >
              취소
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving}
              style={{ flex: 2, padding: 12, background: saving ? '#94a3b8' : NAVY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? '저장 중...' : '수정 저장'}
            </button>
          </div>
        </div>
      ) : (
        /* ── 일반 입력 모드 ── */
        <>
          <textarea
            placeholder={'복습 내용 붙여넣기...\n\nQ7. 문제: quarterly payment...\n내 답: $90,000\n정답: $22,500\n풀이: payment = 이자 + 원금...'}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            style={{
              width: '100%', minHeight: 180, padding: 12, border: BORDER,
              borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box', color: TEXT,
            }}
          />
          <button
            onClick={handleParse}
            style={{
              alignSelf: 'flex-end', padding: '8px 20px', background: NAVY, color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            파싱하기 →
          </button>

          {cards.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>── 파싱 결과 ({cards.length}개) ──</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cards.map(card => (
                  <div key={card.id} style={{ border: BORDER, borderRadius: 8, overflow: 'hidden' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: BORDER, background: '#fafafa', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Q{card.questionNum}</span>
                      <select
                        value={card.topicTag}
                        onChange={e => updateCard(card.id, 'topicTag', e.target.value)}
                        style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: NAVY, fontWeight: 600 }}
                      >
                        {TOPICS.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <select
                        value={card.errorPattern}
                        onChange={e => updateCard(card.id, 'errorPattern', e.target.value)}
                        style={{ fontSize: 12, border: BORDER, borderRadius: 4, padding: '2px 6px', color: '#555' }}
                      >
                        {PATTERNS.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <button
                        onClick={() => removeCard(card.id)}
                        style={{ marginLeft: 'auto', color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
                      >
                        ×
                      </button>
                    </div>

                    {/* Question text */}
                    <div style={{ padding: '10px 12px', borderBottom: BORDER }}>
                      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>문제</div>
                      <div style={{ fontSize: 13 }}>{card.questionText || '(파싱 실패 — 직접 입력)'}</div>
                    </div>

                    {/* My answer */}
                    <div style={{ padding: '10px 12px', background: '#fef2f2', borderBottom: BORDER }}>
                      <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>내 답</div>
                      <div style={{ fontSize: 13 }}>{card.myAnswer || '—'}</div>
                    </div>

                    {/* Correct answer */}
                    <div style={{ padding: '10px 12px', background: '#f0fdf4', borderBottom: BORDER }}>
                      <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>정답</div>
                      <div style={{ fontSize: 13 }}>{card.correctAnswer || '—'}</div>
                    </div>

                    {/* Explanation */}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>풀이</div>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-line' }}>{card.explanation || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !userId}
                style={{
                  width: '100%', marginTop: 16, padding: 12,
                  background: saving ? '#94a3b8' : NAVY, color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '저장 중...' : `전체 저장 (${cards.length}개)`}
              </button>
            </div>
          )}
        </>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}

// ── Tab 2: 히스토리 ───────────────────────────────────────────────
function HistoryTab({ userId, onEditRequest }: {
  userId: string | null;
  onEditRequest: (item: WrongAnswer) => void;
}) {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterPattern, setFilterPattern] = useState('');
  const [filterUnresolved, setFilterUnresolved] = useState(false);
  const [modal, setModal] = useState<WrongAnswer | null>(null);
  const [toast, setToast] = useState('');

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wrong_answers')
      .select('id, session_id, user_id, question_number, question_text, my_answer, correct_answer, explanation, topic_tag, error_pattern, times_wrong, is_resolved, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HistoryTab] fetch error:', error);
      setToast('데이터 로드 실패');
    } else {
      setItems((data ?? []) as WrongAnswer[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [userId]);

  const toggleResolved = async (item: WrongAnswer) => {
    const next = !item.is_resolved;
    const { error } = await supabase
      .from('wrong_answers')
      .update({ is_resolved: next })
      .eq('id', item.id);
    if (error) {
      console.error('[HistoryTab] toggle error:', error);
      setToast('업데이트 실패');
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_resolved: next } : i));
    }
  };

  const handleDelete = async (item: WrongAnswer) => {
    if (!window.confirm('이 오답을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('wrong_answers').delete().eq('id', item.id);
    if (error) { setToast('삭제 실패'); return; }
    setItems(prev => prev.filter(i => i.id !== item.id));
    setToast('삭제되었습니다');
  };

  const filtered = items.filter(item => {
    if (filterTopic && item.topic_tag !== filterTopic) return false;
    if (filterPattern && item.error_pattern !== filterPattern) return false;
    if (filterUnresolved && item.is_resolved) return false;
    return true;
  });

  const repeated = filtered.filter(i => i.times_wrong >= 2);

  // Group by date
  const byDate: Record<string, WrongAnswer[]> = {};
  filtered.forEach(item => {
    const d = new Date(item.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    byDate[d] = byDate[d] ?? [];
    byDate[d].push(item);
  });

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 14 }}>불러오는 중...</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterTopic}
          onChange={e => setFilterTopic(e.target.value)}
          style={{ fontSize: 12, border: BORDER, borderRadius: 5, padding: '5px 8px' }}
        >
          <option value="">Topic ▾</option>
          {TOPICS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={filterPattern}
          onChange={e => setFilterPattern(e.target.value)}
          style={{ fontSize: 12, border: BORDER, borderRadius: 5, padding: '5px 8px' }}
        >
          <option value="">Pattern ▾</option>
          {PATTERNS.map(p => <option key={p}>{p}</option>)}
        </select>
        <button
          onClick={() => setFilterUnresolved(v => !v)}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 5,
            border: BORDER,
            background: filterUnresolved ? NAVY : '#fff',
            color: filterUnresolved ? '#fff' : TEXT,
            cursor: 'pointer',
          }}
        >
          미해결만
        </button>
        <button
          onClick={() => {
            const date = new Date();
            const yyyymmdd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
            const headers = ['문제번호','문제내용','내답','정답','풀이','토픽','오류패턴','날짜','해결여부'];
            const escape = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
            const rows = filtered.map(item => [
              escape(`Q${item.question_number ?? ''}`),
              escape(item.question_text),
              escape(item.my_answer),
              escape(item.correct_answer),
              escape(item.explanation),
              escape(item.topic_tag),
              escape(item.error_pattern),
              escape(item.created_at ? item.created_at.slice(0, 10) : ''),
              escape(item.is_resolved ? '해결' : '미해결'),
            ].join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wrong_answers_${yyyymmdd}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 5,
            border: BORDER,
            background: '#fff',
            color: TEXT,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          CSV 다운로드
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: MUTED, fontSize: 14 }}>
          아직 기록된 오답이 없습니다.
        </div>
      )}

      {/* Repeated section */}
      {repeated.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
            반복 오답 (2회 이상)
          </div>
          {repeated.map(item => (
            <div
              key={item.id}
              onClick={() => setModal(item)}
              style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: '#fff5f5', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{item.question_number ?? '—'}</span>
                <Badge color="#dc2626" bg="#fee2e2">{item.topic_tag ?? '—'}</Badge>
                <span style={{ fontSize: 12, color: MUTED }}>{item.error_pattern}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#dc2626', fontSize: 13 }}>×{item.times_wrong}회</span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.question_text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date groups */}
      {Object.entries(byDate).map(([date, dayItems]) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginBottom: 8 }}>
            {date} ({dayItems.length}개)
          </div>
          {dayItems.map(item => (
            <div
              key={item.id}
              style={{ border: BORDER, borderRadius: 8, marginBottom: 8, background: '#fff', overflow: 'hidden' }}
            >
              <div
                onClick={() => setModal(item)}
                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleResolved(item); }}
                  style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${item.is_resolved ? '#16a34a' : '#ccc'}`,
                    background: item.is_resolved ? '#16a34a' : '#fff',
                    color: '#fff', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {item.is_resolved ? '✓' : '○'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{item.question_number ?? '—'}</span>
                    <Badge color={NAVY} bg="#e8edf5">{item.topic_tag ?? '—'}</Badge>
                    <span style={{ fontSize: 12, color: MUTED }}>{item.error_pattern}</span>
                    {item.times_wrong >= 2 && (
                      <Badge color="#dc2626" bg="#fee2e2">×{item.times_wrong}</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.question_text}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); onEditRequest(item); }}
                    title="수정"
                    style={{ background: 'none', border: BORDER, borderRadius: 4, width: 26, height: 26, cursor: 'pointer', fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✏
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item); }}
                    title="삭제"
                    style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 4, width: 26, height: 26, cursor: 'pointer', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Slide-up modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxHeight: '75vh', overflowY: 'auto', borderRadius: '12px 12px 0 0', padding: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{modal.question_number ?? '—'}</span>
                <Badge color={NAVY}>{modal.topic_tag ?? '—'}</Badge>
                <span style={{ fontSize: 12, color: MUTED }}>{modal.error_pattern}</span>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: MUTED }}>×</button>
            </div>

            <div style={{ fontSize: 13, marginBottom: 12 }}>{modal.question_text}</div>

            <div style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>내 답</div>
              <div style={{ fontSize: 13 }}>{modal.my_answer ?? '—'}</div>
            </div>

            <div style={{ padding: '10px 12px', background: '#f0fdf4', borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>정답</div>
              <div style={{ fontSize: 13 }}>{modal.correct_answer ?? '—'}</div>
            </div>

            {modal.explanation && (
              <div style={{ padding: '10px 12px', border: BORDER, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>풀이</div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-line' }}>{modal.explanation}</div>
              </div>
            )}

            <div style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>
              {new Date(modal.created_at).toLocaleDateString('ko-KR')} · ×{modal.times_wrong}회 오답
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}

// ── Tab 3: 대시보드 ───────────────────────────────────────────────
function DashboardTab({ userId, onSendToHarry }: { userId: string | null; onSendToHarry: (msg: string) => void }) {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [matrixCell, setMatrixCell] = useState<{ topic: string; category: number } | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('wrong_answers')
        .select('id, topic_tag, error_pattern, trap_category, times_wrong, is_resolved, question_number, question_text, my_answer, correct_answer, created_at')
        .eq('user_id', userId);
      if (error) { console.error('[DashboardTab] fetch error:', error); }
      else { setItems((data ?? []) as WrongAnswer[]); }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 14 }}>불러오는 중...</div>;
  }
  if (items.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: MUTED, fontSize: 14 }}>저장된 오답이 없습니다.</div>;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekItems = items.filter(i => i.created_at >= sevenDaysAgo);
  const resolvedCount = items.filter(i => i.is_resolved).length;
  const repeatedCount = items.filter(i => i.times_wrong >= 2).length;

  // Topic bar chart data
  const topicCounts: Record<string, number> = {};
  items.forEach(i => { if (i.topic_tag) topicCounts[i.topic_tag] = (topicCounts[i.topic_tag] ?? 0) + 1; });
  const topicSorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = topicSorted[0]?.[1] ?? 1;

  // Pattern distribution
  const patternCounts: Record<string, number> = {};
  items.forEach(i => { if (i.error_pattern) patternCounts[i.error_pattern] = (patternCounts[i.error_pattern] ?? 0) + 1; });
  const total = items.length;
  const patternSorted = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);

  // Repeated alerts
  const repeatedList = items.filter(i => i.times_wrong >= 2);

  // Module × trap_category matrix (only rows with both fields set — no dummy zero-fill for unclassified items)
  const classified = items.filter(i => i.topic_tag && i.trap_category);
  const unclassifiedCount = items.filter(i => i.topic_tag && !i.trap_category).length;
  const matrix: Record<string, Record<number, WrongAnswer[]>> = {};
  classified.forEach(i => {
    const topic = i.topic_tag as string;
    matrix[topic] = matrix[topic] ?? { 1: [], 2: [], 3: [], 4: [] };
    matrix[topic][i.trap_category as number].push(i);
  });
  const matrixTopics = Object.entries(matrix)
    .map(([topic, byCat]) => [topic, Object.values(byCat).reduce((s, arr) => s + arr.length, 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
  const matrixMaxCell = Math.max(1, ...matrixTopics.flatMap(t => [1, 2, 3, 4].map(c => matrix[t][c].length)));
  const cellColor = (count: number) => {
    if (count === 0) return CORAL_RAMP[0];
    const step = Math.min(CORAL_RAMP.length - 1, Math.ceil((count / matrixMaxCell) * (CORAL_RAMP.length - 1)));
    return CORAL_RAMP[Math.max(1, step)];
  };

  // "가장 뚜렷한 패턴" summary — dominant category per topic, ranked by dominant count, min 2 to count as a real pattern
  const dominant = matrixTopics
    .map(topic => {
      const byCat = matrix[topic];
      const best = [1, 2, 3, 4].sort((a, b) => byCat[b].length - byCat[a].length)[0];
      const topicTotal = classified.filter(i => i.topic_tag === topic).length;
      return { topic, category: best, count: byCat[best].length, topicTotal };
    })
    .filter(d => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
  const matrixSummary = dominant.length > 0
    ? dominant.map(d => `${d.topic}은 ${TRAP_CATEGORY_LABELS[d.category]}(${d.count}/${d.topicTotal})에 집중`).join(', ')
    : null;

  return (
    <div style={{ padding: 16 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: '이번 주 오답', value: weekItems.length },
          { label: '해결됨', value: resolvedCount },
          { label: '반복 오답', value: repeatedCount },
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
        {topicSorted.map(([topic, count]) => (
          <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 100, fontSize: 12, color: TEXT, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic}</div>
            <div style={{ flex: 1, background: '#e0e0e0', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{ width: `${(count / maxCount) * 100}%`, background: NAVY, height: '100%', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, color: MUTED, width: 32, textAlign: 'right', flexShrink: 0 }}>{count}회</div>
          </div>
        ))}
      </div>

      {/* Module × Category matrix */}
      {matrixTopics.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 6 }}>모듈 × 카테고리 매트릭스</div>
          <div style={{ fontSize: 12, color: matrixSummary ? '#b04a26' : MUTED, marginBottom: 10, lineHeight: 1.4 }}>
            {matrixSummary ?? '아직 뚜렷한 패턴을 판단하기엔 데이터가 부족합니다.'}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: MUTED, fontWeight: 600, whiteSpace: 'nowrap' }}>모듈</th>
                  {[1, 2, 3, 4].map(c => (
                    <th key={c} style={{ padding: '4px 6px', color: MUTED, fontWeight: 600, minWidth: 68, whiteSpace: 'nowrap' }}>
                      {TRAP_CATEGORY_LABELS[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixTopics.map(topic => (
                  <tr key={topic}>
                    <td style={{ padding: '4px 8px', color: TEXT, fontWeight: 600, whiteSpace: 'nowrap' }}>{topic}</td>
                    {[1, 2, 3, 4].map(c => {
                      const count = matrix[topic][c].length;
                      const bg = cellColor(count);
                      const dark = count / matrixMaxCell > 0.6;
                      return (
                        <td
                          key={c}
                          onClick={() => count > 0 && setMatrixCell({ topic, category: c })}
                          style={{
                            padding: '8px 6px', textAlign: 'center', background: bg,
                            color: count === 0 ? MUTED : (dark ? '#fff' : NAVY),
                            fontWeight: count > 0 ? 700 : 400,
                            cursor: count > 0 ? 'pointer' : 'default',
                            border: '2px solid #fff',
                            borderRadius: 4,
                          }}
                        >
                          {count || '·'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unclassifiedCount > 0 && (
            <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
              카테고리 미분류 {unclassifiedCount}건은 매트릭스에서 제외됨
            </div>
          )}
        </div>
      )}

      {/* Pattern distribution */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>패턴별 분포</div>
        {patternSorted.map(([pattern, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={pattern} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 100, fontSize: 12, color: TEXT, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pattern}</div>
              <div style={{ flex: 1, background: '#e0e0e0', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, background: '#334155', height: '100%', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: MUTED, width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
            </div>
          );
        })}
      </div>

      {/* Repeated alerts */}
      {repeatedList.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>반복 오답 경보</div>
          {repeatedList.map(item => (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 8, background: '#fff5f5', flexWrap: 'wrap' }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>{item.question_number ?? '—'}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{item.topic_tag}</span>
              <span style={{ fontSize: 12, color: MUTED }}>{item.error_pattern}</span>
              <span style={{ fontWeight: 700, color: '#dc2626', fontSize: 12 }}>×{item.times_wrong}회</span>
              <button
                onClick={() => onSendToHarry(`${item.question_number} (${item.topic_tag}) 문제를 복습하고 싶어. 핵심 개념을 물어봐줘.`)}
                style={{ marginLeft: 'auto', padding: '4px 10px', background: NAVY, color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}
              >
                복습하기
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Matrix cell drill-down */}
      {matrixCell && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setMatrixCell(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxHeight: '75vh', overflowY: 'auto', borderRadius: '12px 12px 0 0', padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                {matrixCell.topic} · {TRAP_CATEGORY_LABELS[matrixCell.category]}
              </div>
              <button
                onClick={() => setMatrixCell(null)}
                style={{ marginLeft: 'auto', border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: MUTED }}
              >
                ×
              </button>
            </div>
            {matrix[matrixCell.topic][matrixCell.category].map(item => (
              <div key={item.id} style={{ border: BORDER, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{item.question_number ?? '—'}</span>
                  {item.times_wrong >= 2 && (
                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>×{item.times_wrong}회</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: TEXT, marginBottom: 6, whiteSpace: 'pre-line' }}>{item.question_text}</div>
                <div style={{ fontSize: 11, color: '#dc2626' }}>내 답: {item.my_answer ?? '—'}</div>
                <div style={{ fontSize: 11, color: '#16a34a' }}>정답: {item.correct_answer ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Harry ─────────────────────────────────────────────────
function HarryTab({ userId, pendingMsg, onPendingConsumed }: {
  userId: string | null;
  pendingMsg: string;
  onPendingConsumed: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [summary, setSummary] = useState<TopicSummary[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load topic summary for system prompt
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('wrong_answers')
        .select('topic_tag, times_wrong')
        .eq('user_id', userId);
      if (data) {
        const agg: Record<string, number> = {};
        (data as { topic_tag: string | null; times_wrong: number }[]).forEach(r => {
          if (r.topic_tag) agg[r.topic_tag] = (agg[r.topic_tag] ?? 0) + r.times_wrong;
        });
        setSummary(Object.entries(agg).map(([topic_tag, total_wrong]) => ({ topic_tag, total_wrong })));
      }
    })();
  }, [userId]);

  // Handle pending message from dashboard "복습하기"
  useEffect(() => {
    if (pendingMsg) {
      sendMessage(pendingMsg);
      onPendingConsumed();
    }
  }, [pendingMsg]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const detectTopicFromHistory = (): string => {
    const counts: Record<string, number> = {};
    msgs.forEach(m => {
      if (m.content) {
        TOPICS.forEach(t => {
          if (m.content!.toLowerCase().includes(t.toLowerCase())) {
            counts[t] = (counts[t] ?? 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      ?? summary.sort((a, b) => b.total_wrong - a.total_wrong)[0]?.topic_tag
      ?? '';
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Msg = { role: 'user', type: 'text', content: text };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput('');

    // Check for visual trigger
    if (isVisual(text)) {
      const topicKey = detectTopicFromHistory();
      const SvgComp = SVG_MAP[topicKey];
      if (SvgComp) {
        setMsgs(prev => [
          ...prev,
          { role: 'assistant', type: 'svg', svgKey: topicKey, content: `Here's the visualization for ${topicKey}.` },
        ]);
        return;
      }
    }

    // Build context: compress if > 6 turns
    let contextMsgs = history.map(m => ({ role: m.role, content: m.content ?? '' }));
    if (contextMsgs.length > 12) {
      const summary_text = `[이전 대화 요약: ${contextMsgs.slice(0, -6).length}턴의 FAR 튜터링 진행됨]`;
      contextMsgs = [
        { role: 'user', content: summary_text },
        ...contextMsgs.slice(-6),
      ];
    }

    setStreaming(true);
    const assistantPlaceholder: Msg = { role: 'assistant', type: 'text', content: '' };
    setMsgs(prev => [...prev, assistantPlaceholder]);

    try {
      const res = await apiFetch(`${API_URL}/api/claude/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: contextMsgs,
          dynamicContext: buildPrompt(summary),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw) as { text?: string };
            if (parsed.text) {
              fullContent += parsed.text;
              setMsgs(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: (last.content ?? '') + parsed.text };
                }
                return next;
              });
            }
          } catch {
            // ignore parse errors on partial chunks
          }
        }
      }

      const parsedWrongAnswer = parseWrongAnswerBlock(fullContent);
      if (parsedWrongAnswer && userId) {
        saveWrongAnswer(parsedWrongAnswer, userId, null).catch((e) =>
          console.warn('[harry] wrong_answers 자동저장 실패:', e),
        );
      }
      const cleanedContent = stripWrongAnswerJson(fullContent);
      setMsgs(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: cleanedContent };
        return next;
      });
    } catch (err) {
      console.error('[HarryTab] stream error:', err);
      setMsgs(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: '(연결 오류 — 다시 시도해주세요)' };
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  const quickBtns = [
    { label: '약점 개념 확인', text: 'Give me ONE concept check question on my weakest topic. Wait for my answer before showing the solution.' },
    { label: '분개 오류 찾기', text: 'Show me ONE journal entry with exactly one error for me to find. Wait for my answer before explaining.' },
    { label: '공식 빈칸 채우기', text: 'Give me ONE formula with ONE blank to fill in. Wait for my answer before showing the answer.' },
  ];

  const weakTop3 = [...summary].sort((a, b) => b.total_wrong - a.total_wrong).slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      {/* Weak topics bar */}
      <div style={{ padding: '10px 16px', background: '#f8f9fc', borderBottom: BORDER, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: MUTED }}>
          약점 Top 3:{' '}
          {weakTop3.length > 0
            ? weakTop3.map((w, i) => (
              <span key={w.topic_tag}>
                {i > 0 && ' · '}
                <strong style={{ color: NAVY }}>{w.topic_tag}({w.total_wrong})</strong>
              </span>
            ))
            : <span style={{ color: MUTED }}>데이터 없음</span>
          }
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', color: MUTED, fontSize: 13, marginTop: 24 }}>
            Harry에게 질문하거나 아래 버튼을 눌러 시작하세요.
          </div>
        )}
        {msgs.map((m, i) => {
          if (m.type === 'svg' && m.svgKey) {
            const SvgComp = SVG_MAP[m.svgKey];
            return (
              <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                <div style={{ background: NAVY, color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: '8px 8px 0 0' }}>
                  Harry — {m.svgKey} Visualization
                </div>
                <div style={{ border: BORDER, borderRadius: '0 8px 8px 8px', padding: 12, background: '#fff' }}>
                  {SvgComp && <SvgComp />}
                  {m.content && <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{m.content}</div>}
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6,
                background: m.role === 'assistant' ? NAVY : '#f1f5f9',
                color: m.role === 'assistant' ? '#fff' : TEXT,
                whiteSpace: 'pre-wrap',
                borderBottomLeftRadius: m.role === 'assistant' ? 2 : 10,
                borderBottomRightRadius: m.role === 'user' ? 2 : 10,
              }}>
                {(m.role === 'assistant' ? stripWrongAnswerJson(m.content ?? '') : m.content) || (streaming && m.role === 'assistant' ? '▍' : '')}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick buttons */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderTop: BORDER, flexWrap: 'wrap', flexShrink: 0 }}>
        {quickBtns.map(btn => (
          <button
            key={btn.label}
            onClick={() => sendMessage(btn.text)}
            onMouseEnter={() => setHovered(btn.label)}
            onMouseLeave={() => setHovered(null)}
            disabled={streaming}
            style={{
              fontSize: 12, padding: '5px 10px', border: `1px solid ${NAVY}`, borderRadius: 5,
              background: hovered === btn.label ? NAVY : '#fff',
              color: hovered === btn.label ? '#fff' : NAVY,
              cursor: streaming ? 'not-allowed' : 'pointer',
              transition: 'background 0.12s, color 0.12s', whiteSpace: 'nowrap',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: BORDER, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="답변 입력..."
          disabled={streaming}
          style={{ flex: 1, padding: '8px 12px', border: BORDER, borderRadius: 6, fontSize: 13, outline: 'none' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={streaming || !input.trim()}
          style={{
            padding: '8px 16px', background: NAVY, color: '#fff', border: 'none',
            borderRadius: 6, fontSize: 13, fontWeight: 600,
            cursor: streaming ? 'not-allowed' : 'pointer', opacity: streaming ? 0.6 : 1,
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function WrongAnswerPage() {
  const userId = useStudyStore(s => s.userId);
  const [tab, setTab] = useState<Tab>('input');
  const [harryPendingMsg, setHarryPendingMsg] = useState('');
  const [editItem, setEditItem] = useState<WrongAnswer | null>(null);

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'input', label: '입력' },
    { key: 'history', label: '히스토리' },
    { key: 'dashboard', label: '대시보드' },
    { key: 'harry', label: 'Harry' },
  ];

  const handleSendToHarry = (msg: string) => {
    setHarryPendingMsg(msg);
    setTab('harry');
  };

  const handleEditRequest = (item: WrongAnswer) => {
    setEditItem(item);
    setTab('input');
  };

  return (
    <div style={{ background: '#fff', minHeight: '100%', display: 'flex', flexDirection: 'column', color: TEXT, maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: BORDER, flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: NAVY }}>오답 노트</h1>
        <span style={{ fontSize: 12, color: MUTED }}>{today}</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${NAVY}`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 0', fontSize: 13,
              fontWeight: tab === t.key ? 700 : 400,
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
        {tab === 'input' && <InputTab userId={userId} editItem={editItem} onEditDone={() => setEditItem(null)} />}
        {tab === 'history' && <HistoryTab userId={userId} onEditRequest={handleEditRequest} />}
        {tab === 'dashboard' && <DashboardTab userId={userId} onSendToHarry={handleSendToHarry} />}
        {tab === 'harry' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <HarryTab
              userId={userId}
              pendingMsg={harryPendingMsg}
              onPendingConsumed={() => setHarryPendingMsg('')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
