import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';
import { allTopics } from '../data/far-topics';
import {
  fetchConceptCardFromText,
  extractConcepts,
  fetchLearnedConcepts,
  ConceptCard,
  LearnedConcepts,
  ExtractedConcepts,
} from '../hooks/useDynamicQuiz';
import { ConceptCardView } from '../components/quiz/QuizView';
import {
  saveConceptExtraction,
  checkConceptDuplication,
  DupCheckResult,
  DupMatchedRow,
  ConceptExtractionRow,
} from '../lib/db';

// ── Becker 텍스트에서 topic_id 자동 감지 ─────────────────────
// "F6 · M4 · Partnerships", "F5 M3", "F5-M3", "F5.M3" 등
const TOPIC_ID_RE = /F([1-6])\s*[·.\-\s]\s*M([0-9])/i;

function detectTopicId(rawText: string): string | null {
  const m = rawText.match(TOPIC_ID_RE);
  if (!m) return null;
  const candidate = `F${m[1]}-M${m[2]}`;
  // allTopics에 실제 존재하는 ID인지 확인
  return allTopics.some((t) => t.id === candidate) ? candidate : null;
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const userId = useStudyStore((s) => s.userId);

  const [text, setText] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [manualTopicId, setManualTopicId] = useState<string>('');
  const [topicCorrection, setTopicCorrection] = useState<{ original: string; corrected: string } | null>(null);
  const [dupResult, setDupResult] = useState<DupCheckResult | null>(null);
  // 중복 감지로 자동 저장을 보류한 payload. "그래도 저장" 클릭 시 사용.
  const [pendingExtraction, setPendingExtraction] = useState<ConceptExtractionRow | null>(null);
  const [manualSaved, setManualSaved] = useState(false);
  const [card, setCard] = useState<ConceptCard | null>(null);
  const [extracted, setExtracted] = useState<ExtractedConcepts | null>(null);
  const [learned, setLearned] = useState<LearnedConcepts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedOpen, setExtractedOpen] = useState(true);  // 추출된 개념: 기본 펼침
  const [cardOpen, setCardOpen] = useState(false);           // AI 해설: 기본 접힘
  const [learnedOpen, setLearnedOpen] = useState(false);     // 학습된 개념: 기본 접힘

  // 우선순위: 텍스트 자동 감지 > 수동 드롭다운 > 사이드바 선택 모듈
  const detectedTopicId = detectTopicId(text);
  const resolvedTopicId = detectedTopicId || manualTopicId || currentTopicId || null;
  const topicLabel = resolvedTopicId
    ? allTopics.find((t) => t.id === resolvedTopicId)?.label
    : null;

  useEffect(() => {
    // Prime the learned section on mount.
    fetchLearnedConcepts()
      .then(setLearned)
      .catch(() => setLearned(null));
  }, []);

  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('문제 원문을 입력하세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setCard(null);
    setExtracted(null);
    setTopicCorrection(null);
    setDupResult(null);
    setPendingExtraction(null);
    setManualSaved(false);

    const topicId = resolvedTopicId;
    const ua = userAnswer.trim() || null;
    const ca = correctAnswer.trim() || null;

    try {
      // Run in parallel — concept card for the user, extraction for the store.
      const [cardRes, extractRes] = await Promise.allSettled([
        fetchConceptCardFromText({ rawText: trimmed, userAnswer: ua, correctAnswer: ca, topicId }),
        extractConcepts({ questionText: trimmed, userAnswer: ua, correctAnswer: ca, topicId }),
      ]);

      if (cardRes.status === 'fulfilled') {
        setCard(cardRes.value);
      } else {
        setError((prev) => prev ?? `해설 생성 실패: ${cardRes.reason?.message ?? 'unknown'}`);
      }
      if (extractRes.status === 'fulfilled') {
        setExtracted(extractRes.value.extracted);
        setLearned(extractRes.value.learned);
        console.log('[AnalyzePage] extract-concepts OK, calling saveConceptExtraction', {
          userId: userId ? `${userId.slice(0, 8)}...` : null,
          topicId,
          extractedCounts: {
            concepts: extractRes.value.extracted.concepts.length,
            asc: extractRes.value.extracted.asc_references.length,
            tags: extractRes.value.extracted.topic_tags.length,
          },
        });
        // topic_id 보정 처리
        const corrected = extractRes.value.correctedTopicId;
        if (corrected && topicId) {
          setTopicCorrection({ original: topicId, corrected });
        }

        const finalTopicId = corrected || topicId;
        const ext = extractRes.value.extracted;

        // 중복 감지
        const dup = await checkConceptDuplication(finalTopicId, ext.concepts, ext.trap_pattern);
        setDupResult(dup);

        const payload: ConceptExtractionRow = {
          userId: userId ?? null,
          topicId: finalTopicId,
          concepts: ext.concepts,
          ascReferences: ext.asc_references,
          topicTags: ext.topic_tags,
          trapPattern: ext.trap_pattern,
          wasWrong: ua && ca ? ua !== ca : null,
        };

        const shouldAutoSave =
          dup.status === 'new' ||
          (dup.status === 'partial_dup' && dup.newTrap);

        if (shouldAutoSave) {
          void saveConceptExtraction(payload);
        } else {
          // full_dup / partial_dup+!newTrap → 저장 보류. 사용자가 배너의
          // "그래도 저장" 버튼으로 직접 판단할 때까지 대기.
          setPendingExtraction(payload);
        }
      } else {
        setError((prev) => prev ?? `개념 추출 실패: ${extractRes.reason?.message ?? 'unknown'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeWithConcept = (concept: string) => {
    navigate(`/quiz?mode=interleave&focusConcept=${encodeURIComponent(concept)}`);
  };

  const handleAnalyzeNext = () => {
    setText('');
    setUserAnswer('');
    setCorrectAnswer('');
    setManualTopicId('');
    setTopicCorrection(null);
    setDupResult(null);
    setPendingExtraction(null);
    setManualSaved(false);
    setCard(null);
    setExtracted(null);
    setError(null);
    setExtractedOpen(true);
    setCardOpen(false);
    setLearnedOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사용자가 배너에서 "그래도 저장"을 눌렀을 때.
  const handleForceSave = () => {
    if (!pendingExtraction || manualSaved) return;
    void saveConceptExtraction(pendingExtraction);
    setManualSaved(true);
  };

  const topConcepts = learned
    ? Object.entries(learned.concepts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">문제 분석</h1>
          <p className="text-xs text-muted mt-0.5">
            문제 원문을 붙여넣으면 AI가 구조화 해설을 생성하고, 개념 메타데이터만 학습 데이터에 누적합니다.
            {resolvedTopicId && (
              <span className="ml-2 text-[#4f6ef7]">
                모듈: {resolvedTopicId} · {topicLabel}
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            ⚠ 문제 원문은 서버에 저장되지 않습니다 — 키워드/패턴만 추출해 누적.
          </p>
        </div>

        {/* Input */}
        <div className="card p-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#0f172a] mb-1 block">문제 원문</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="FAR 문제 원문을 붙여넣으세요. 선택지가 포함되어 있어도 OK."
              className="w-full text-sm rounded-lg p-3 border border-border bg-white text-[#0f172a] resize-y"
              style={{ outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-muted block mb-0.5">내 답 (선택)</label>
              <input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="A / B / 숫자 등"
                className="w-full text-sm rounded-lg px-3 py-2 border border-border bg-white"
                style={{ outline: 'none' }}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-0.5">정답 (선택)</label>
              <input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="A / B / 숫자 등"
                className="w-full text-sm rounded-lg px-3 py-2 border border-border bg-white"
                style={{ outline: 'none' }}
              />
            </div>
          </div>
          {/* 모듈 감지/선택 */}
          <div>
            <label className="text-[11px] text-muted block mb-0.5">모듈</label>
            {detectedTopicId ? (
              <div
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
                style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
              >
                <span>자동 감지:</span>
                <span className="font-semibold">{detectedTopicId}</span>
                <span className="text-[#166534]/70">
                  — {allTopics.find((t) => t.id === detectedTopicId)?.label}
                </span>
              </div>
            ) : (
              <select
                value={manualTopicId}
                onChange={(e) => setManualTopicId(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 border border-border bg-white"
                style={{ outline: 'none' }}
              >
                <option value="">
                  {currentTopicId
                    ? `현재 모듈 사용 (${currentTopicId})`
                    : '모듈 선택 (선택사항)'}
                </option>
                {allTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#4f6ef7' }}
          >
            {loading ? '🤖 분석 중...' : '분석하기'}
          </button>
          {error && (
            <div
              className="p-2 rounded text-xs text-[#991b1b]"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              ⚠️ {safeStr(error)}
            </div>
          )}
        </div>

        {/* topic_id 보정 알림 */}
        {topicCorrection && (
          <div
            className="p-3 rounded-lg text-xs"
            style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}
          >
            모듈 자동 보정: <strong>{topicCorrection.original}</strong>
            {' → '}
            <strong>{topicCorrection.corrected}</strong>
            {' '}
            ({allTopics.find((t) => t.id === topicCorrection.corrected)?.label ?? topicCorrection.corrected})
            <span className="block mt-0.5 text-[#92400e]/70">
              추출된 개념이 다른 모듈과 더 일치하여 topic_id를 수정했습니다.
            </span>
          </div>
        )}

        {/* 중복 감지 알림 — 사용자 비교/결정용 */}
        {dupResult && dupResult.status !== 'new' && extracted && (
          <DupBanner
            dup={dupResult}
            extracted={extracted}
            canForceSave={!!pendingExtraction}
            manualSaved={manualSaved}
            onForceSave={handleForceSave}
          />
        )}

        {/* 추출된 개념 accordion */}
        {extracted && (
          <div className="card rounded-xl overflow-hidden">
            <button
              onClick={() => setExtractedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold text-[#0f172a]">🔍 이 문제에서 추출된 개념</span>
              <span className="text-xs text-muted">{extractedOpen ? '▲' : '▼'}</span>
            </button>
            {extractedOpen && (
              <div className="px-4 pb-4">
                <ChipList label="concepts" items={extracted.concepts} tint="#e0f2fe" border="#7dd3fc" color="#075985" />
                <ChipList
                  label="asc_references"
                  items={extracted.asc_references}
                  tint="#f0fdf4"
                  border="#86efac"
                  color="#166534"
                />
                <ChipList
                  label="topic_tags"
                  items={extracted.topic_tags}
                  tint="#fef3c7"
                  border="#fcd34d"
                  color="#78350f"
                />
                {extracted.trap_pattern != null && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-muted mb-1">trap_pattern</p>
                    <div
                      className="text-xs p-2 rounded"
                      style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#991b1b' }}
                    >
                      ⚠️ {safeStr(extracted.trap_pattern)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI 구조화 해설 accordion */}
        {(card || loading) && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #fde68a' }}>
            <button
              onClick={() => setCardOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{ background: '#fffbeb' }}
            >
              <span className="text-xs font-semibold text-[#92400e]">
                🧠 AI 구조화 해설
                {loading && !card && ' 🔄'}
                {card && ' ✅'}
                {card && ` · ${safeStr(card.type)}`}
              </span>
              <span className="text-xs text-[#92400e]">{cardOpen ? '▲' : '▼'}</span>
            </button>
            {cardOpen && (
              <div className="px-4 pb-4 pt-1" style={{ background: '#fffbeb' }}>
                {loading && !card ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <div className="w-3 h-3 border-2 border-[#92400e] border-t-transparent rounded-full animate-spin" />
                    <span>해설 생성 중...</span>
                  </div>
                ) : card ? (
                  <ConceptCardView card={card} />
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* 학습된 개념 accordion */}
        <div className="card rounded-xl overflow-hidden">
          <button
            onClick={() => setLearnedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0f172a]">📚 학습된 개념</span>
              {learned?.updated_at && (
                <span className="text-[10px] text-muted">
                  {new Date(learned.updated_at).toLocaleString('ko-KR')}
                </span>
              )}
            </div>
            <span className="text-xs text-muted">{learnedOpen ? '▲' : '▼'}</span>
          </button>
          {learnedOpen && (
            <div className="px-4 pb-4">
              {!learned || topConcepts.length === 0 ? (
                <p className="text-xs text-muted">
                  아직 학습 데이터가 없습니다. 위에서 문제를 분석하면 여기에 누적됩니다.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {topConcepts.map(([key, count]) => (
                      <button
                        key={key}
                        onClick={() => handlePracticeWithConcept(key)}
                        title={`"${key}" 개념으로 문제 풀기`}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
                        style={{
                          background: '#eef2ff',
                          border: '1px solid #c7d2fe',
                          color: '#4338ca',
                        }}
                      >
                        {safeStr(key)} <span className="opacity-60">×{safeStr(count)}</span>
                      </button>
                    ))}
                  </div>
                  {learned.trap_patterns.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-[#991b1b] mb-1">⚠️ 자주 틀린 패턴</p>
                      <ul className="flex flex-col gap-1">
                        {learned.trap_patterns.slice(0, 8).map((p, i) => (
                          <li
                            key={i}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#7f1d1d',
                            }}
                          >
                            · {safeStr(p)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => navigate('/quiz?mode=interleave')}
                      className="w-full py-2 rounded-lg text-xs font-medium text-white"
                      style={{ background: '#4f6ef7' }}
                    >
                      누적된 개념으로 전체 퀴즈 풀기 →
                    </button>
                    <p className="text-[10px] text-muted mt-1 text-center">
                      생성된 문제 프롬프트에 위 데이터가 자동 주입됩니다.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 다음 문제 분석하기 — 분석 결과가 있을 때만 노출 */}
        {(card || extracted) && (
          <button
            onClick={handleAnalyzeNext}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: '#4f6ef7' }}
          >
            ➕ 다음 문제 분석하기
          </button>
        )}
      </div>
    </div>
  );
}

/** 안전하게 문자열로 변환 — React Error #31 방지 */
function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v == null) return '';
  return JSON.stringify(v);
}

function ChipList({
  label,
  items,
  tint,
  border,
  color,
}: {
  label: string;
  items: unknown[];
  tint: string;
  border: string;
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[10px] font-semibold text-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[11px] px-2 py-0.5 rounded-full"
            style={{ background: tint, border: `1px solid ${border}`, color }}
          >
            {safeStr(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 중복 감지 배너 ───────────────────────────────────────────
// 현재 분석한 concepts/trap vs 기존 기록을 나란히 보여주고, full_dup /
// partial_dup+!newTrap 케이스에서 "그래도 저장"으로 사용자가 override 가능.
function ConceptChipsInline({
  items,
  tint,
  border,
  color,
}: {
  items: unknown[];
  tint: string;
  border: string;
  color: string;
}) {
  if (!items || items.length === 0) return <span className="text-[11px] text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: tint, border: `1px solid ${border}`, color }}
        >
          {safeStr(item)}
        </span>
      ))}
    </div>
  );
}

function DupBanner({
  dup,
  extracted,
  canForceSave,
  manualSaved,
  onForceSave,
}: {
  dup: DupCheckResult;
  extracted: ExtractedConcepts;
  canForceSave: boolean;
  manualSaved: boolean;
  onForceSave: () => void;
}) {
  if (dup.status === 'new') return null;

  const matchedRows: DupMatchedRow[] =
    dup.status === 'full_dup' || dup.status === 'partial_dup' ? dup.matchedRows : [];
  const topOverlap = matchedRows[0]?.overlap ?? 0;
  const topPct = Math.round(topOverlap * 100);

  const autoSaved = dup.status === 'partial_dup' && dup.newTrap;

  // 3-way 색상/문구
  let theme: { bg: string; border: string; text: string; accent: string };
  let title: string;
  let subtitle: string;
  if (autoSaved) {
    theme = { bg: '#f0fdf4', border: '#86efac', text: '#166534', accent: '#16a34a' };
    title = '새 함정 패턴 감지 — 자동 저장됨';
    subtitle = '기존 기록과 50~80% 유사하지만 함정 패턴이 새로워 저장했습니다.';
  } else if (dup.status === 'full_dup') {
    theme = { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', accent: '#dc2626' };
    title = '기존 기록과 매우 유사';
    subtitle = '아래 기존 기록과 비교 후 저장 여부를 결정하세요.';
  } else {
    theme = { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', accent: '#ea580c' };
    title = '부분 유사 · 함정 패턴 동일';
    subtitle = '기존 기록과 50~80% 유사하고 함정 패턴도 같습니다.';
  }

  const formatDate = (iso: string): string => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <div
      className="rounded-lg p-3 sm:p-4 flex flex-col gap-3"
      style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">⚠️</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: theme.text }}>
              {title}
            </p>
            <p className="text-[11px] leading-snug mt-0.5" style={{ color: theme.text, opacity: 0.8 }}>
              {subtitle}
            </p>
          </div>
        </div>
        {topPct > 0 && (
          <span
            className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0"
            style={{ background: theme.accent, color: 'white' }}
          >
            유사도 {topPct}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* 이번 분석 */}
        <div
          className="p-2.5 rounded-md bg-white/80"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <p className="text-[10px] font-bold mb-1.5 uppercase tracking-wide" style={{ color: theme.text }}>
            이번 분석
          </p>
          <ConceptChipsInline
            items={extracted.concepts}
            tint="#e0f2fe"
            border="#7dd3fc"
            color="#075985"
          />
          {extracted.trap_pattern && (
            <div className="mt-2 text-[11px] leading-snug" style={{ color: '#7f1d1d' }}>
              <span className="font-semibold">⚠ trap:</span> {safeStr(extracted.trap_pattern)}
            </div>
          )}
        </div>

        {/* 기존 기록 (top 1-2) */}
        <div className="flex flex-col gap-2">
          {matchedRows.length === 0 ? (
            <div
              className="p-2.5 rounded-md bg-white/80 text-[11px] text-muted"
              style={{ border: `1px solid ${theme.border}` }}
            >
              매치된 기존 기록 없음
            </div>
          ) : (
            matchedRows.map((row, i) => {
              const topicLabel = row.topicId
                ? allTopics.find((t) => t.id === row.topicId)?.label ?? row.topicId
                : '';
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-md bg-white/80"
                  style={{ border: `1px solid ${theme.border}` }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.text }}>
                      기존 기록 #{i + 1}
                    </p>
                    <span className="text-[10px] font-mono" style={{ color: theme.text, opacity: 0.7 }}>
                      {Math.round(row.overlap * 100)}% · {formatDate(row.createdAt)}
                    </span>
                  </div>
                  <ConceptChipsInline
                    items={row.concepts}
                    tint="#f1f5f9"
                    border="#cbd5e1"
                    color="#334155"
                  />
                  {row.trapPattern && (
                    <div className="mt-2 text-[11px] leading-snug text-[#475569]">
                      <span className="font-semibold">⚠ trap:</span> {safeStr(row.trapPattern)}
                    </div>
                  )}
                  {topicLabel && (
                    <p className="text-[10px] text-muted mt-1.5">{row.topicId} · {topicLabel}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer: "그래도 저장" (override) */}
      {canForceSave && !autoSaved && (
        <div className="flex items-center justify-end gap-2">
          {manualSaved ? (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-md"
              style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
            >
              ✓ 저장됨
            </span>
          ) : (
            <button
              onClick={onForceSave}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-white hover:opacity-90"
              style={{ background: theme.accent }}
            >
              그래도 저장
            </button>
          )}
        </div>
      )}
    </div>
  );
}
