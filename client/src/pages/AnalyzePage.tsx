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
import { saveConceptExtraction } from '../lib/db';

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
  const [card, setCard] = useState<ConceptCard | null>(null);
  const [extracted, setExtracted] = useState<ExtractedConcepts | null>(null);
  const [learned, setLearned] = useState<LearnedConcepts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        // Fire-and-forget Supabase save — 보정된 topicId 사용
        void saveConceptExtraction({
          userId: userId ?? null,
          topicId: corrected || topicId,
          concepts: extractRes.value.extracted.concepts,
          ascReferences: extractRes.value.extracted.asc_references,
          topicTags: extractRes.value.extracted.topic_tags,
          trapPattern: extractRes.value.extracted.trap_pattern,
          wasWrong: ua && ca ? ua !== ca : null,
        });
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
    setCard(null);
    setExtracted(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              ⚠️ {error}
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

        {/* Concept card result — same 6-type renderer used in QuizView */}
        {card && (
          <div
            className="p-4 rounded-xl"
            style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}
          >
            <p className="text-xs font-semibold text-[#92400e] mb-2">
              🧠 AI 구조화 해설 · {card.type}
            </p>
            <ConceptCardView card={card} />
          </div>
        )}

        {/* This run's extraction */}
        {extracted && (
          <div className="card p-4">
            <p className="text-xs font-semibold text-[#0f172a] mb-2">🔍 이 문제에서 추출된 개념</p>
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
            {extracted.trap_pattern && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted mb-1">trap_pattern</p>
                <div
                  className="text-xs p-2 rounded"
                  style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#991b1b' }}
                >
                  ⚠️ {extracted.trap_pattern}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accumulated learned concepts */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#0f172a]">📚 학습된 개념</p>
            {learned?.updated_at && (
              <p className="text-[10px] text-muted">
                업데이트 {new Date(learned.updated_at).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
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
                    {key} <span className="opacity-60">×{count}</span>
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
                        · {p}
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

function ChipList({
  label,
  items,
  tint,
  border,
  color,
}: {
  label: string;
  items: string[];
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
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
