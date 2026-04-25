import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';
import useClaudeStore from '../store/claudeStore';
import { allTopics } from '../data/far-topics';
import {
  fetchConceptCardFromText,
  extractConcepts,
  fetchLearnedConcepts,
  ConceptCard,
  LearnedConcepts,
  ExtractedConcepts,
  ConceptTrigger,
} from '../hooks/useDynamicQuiz';
import { ConceptCardView } from '../components/quiz/QuizView';
import ErrorTagSection from '../components/quiz/ErrorTagSection';
import {
  saveConceptExtraction,
  deleteConceptExtraction,
  checkConceptDuplication,
  checkQuestionHash,
  fetchExtractionByHash,
  fetchRecentExtractions,
  hashText,
  getAnalyzeCountByTopic,
  DupCheckResult,
  DupMatchedRow,
  ConceptExtractionRow,
  RecentExtractionItem,
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

// ── 뱃지 레벨 계산 ──────────────────────────────────────────
function computeBadge(
  count: number,
  accuracy: number,
): { emoji: string; label: string; level: number } | null {
  if (count <= 0) return null;
  if (count >= 10 && accuracy >= 70) return { emoji: '🏆', label: '마스터', level: 4 };
  if (count >= 10) return { emoji: '⭐', label: '숙련', level: 3 };
  if (count >= 5) return { emoji: '📖', label: '학습 중', level: 2 };
  return { emoji: '🌱', label: '입문', level: 1 };
}

export default function AnalyzePage() {
  const navigate = useNavigate();
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const userId = useStudyStore((s) => s.userId);
  const srsCards = useStudyStore((s) => s.srsCards);
  const setAnalyzeContext = useClaudeStore((s) => s.setAnalyzeContext);

  const [text, setText] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [manualTopicId, setManualTopicId] = useState<string>('');
  const [topicCorrection, setTopicCorrection] = useState<{ original: string; corrected: string } | null>(null);
  const [dupResult, setDupResult] = useState<DupCheckResult | null>(null);
  // 분석 후 저장 payload를 보류. 자동 저장 없음 — 사용자가 배너에서 결정.
  const [pendingExtraction, setPendingExtraction] = useState<ConceptExtractionRow | null>(null);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [card, setCard] = useState<ConceptCard | null>(null);
  const [extracted, setExtracted] = useState<ExtractedConcepts | null>(null);
  const [learned, setLearned] = useState<LearnedConcepts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 같은 문제 텍스트가 이미 분석된 경우 — 이전 분석의 created_at ISO.
  const [alreadyAnalyzedAt, setAlreadyAnalyzedAt] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [extractedOpen, setExtractedOpen] = useState(true);  // 추출된 개념: 기본 펼침
  const [cardOpen, setCardOpen] = useState(false);           // AI 해설: 기본 접힘
  const [learnedOpen, setLearnedOpen] = useState(false);     // 학습된 개념: 기본 접힘
  const [tagToast, setTagToast] = useState(false);
  const [badgeToast, setBadgeToast] = useState<string | null>(null);
  const [badgeCount, setBadgeCount] = useState<number>(-1);
  const [recentRefreshKey, setRecentRefreshKey] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('far_consecutive_correct_analyze') ?? '0', 10); } catch { return 0; }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // text 변경 시 textarea 높이를 내용에 맞게 자동 조절.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // 우선순위: 텍스트 자동 감지 > 수동 드롭다운 > 사이드바 선택 모듈
  const detectedTopicId = detectTopicId(text);
  const resolvedTopicId = detectedTopicId || manualTopicId || currentTopicId || null;
  const topicLabel = resolvedTopicId
    ? allTopics.find((t) => t.id === resolvedTopicId)?.label
    : null;

  // 현재 토픽의 퀴즈 정확도 (마스터 뱃지 판정용)
  const topicSrsCard = resolvedTopicId ? srsCards[resolvedTopicId] : null;
  const quizAccuracy =
    topicSrsCard && topicSrsCard.attempts >= 3
      ? Math.round((topicSrsCard.correct / topicSrsCard.attempts) * 100)
      : 0;
  const badge = badgeCount >= 0 ? computeBadge(badgeCount, quizAccuracy) : null;

  // 토픽 변경 시 뱃지 카운트 갱신
  useEffect(() => {
    if (!userId || !resolvedTopicId) { setBadgeCount(-1); return; }
    getAnalyzeCountByTopic(userId).then((map) => setBadgeCount(map[resolvedTopicId] ?? 0));
  }, [userId, resolvedTopicId]);

  // badgeToast 자동 사라짐
  useEffect(() => {
    if (!badgeToast) return;
    const id = window.setTimeout(() => setBadgeToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [badgeToast]);

  useEffect(() => {
    // Prime the learned section on mount.
    fetchLearnedConcepts()
      .then(setLearned)
      .catch(() => setLearned(null));
  }, []);

  // 분석 탭 컨텍스트를 Claude 튜터에 실시간 동기화.
  useEffect(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setAnalyzeContext(null);
      return;
    }
    setAnalyzeContext({
      questionText: trimmed,
      userAnswer: userAnswer.trim() || null,
      correctAnswer: correctAnswer.trim() || null,
      topicId: resolvedTopicId,
      topicLabel: topicLabel ?? null,
      concepts: extracted?.concepts ?? [],
      trapPattern: extracted?.trap_pattern ?? null,
    });
  }, [text, userAnswer, correctAnswer, resolvedTopicId, topicLabel, extracted, setAnalyzeContext]);

  // 페이지 언마운트 시 컨텍스트 해제.
  useEffect(() => {
    return () => setAnalyzeContext(null);
  }, [setAnalyzeContext]);

  // Auto-dismiss the Error Pattern save toast after ~2.6s.
  useEffect(() => {
    if (!tagToast) return;
    const id = window.setTimeout(() => setTagToast(false), 2600);
    return () => window.clearTimeout(id);
  }, [tagToast]);

  const handleAnalyze = async (force = false) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('문제 원문을 입력하세요.');
      return;
    }
    setError(null);
    setAlreadyAnalyzedAt(null);
    setCurrentHash(null);
    setShowExisting(false);
    setCard(null);
    setExtracted(null);
    setTopicCorrection(null);
    setDupResult(null);
    setPendingExtraction(null);
    setSavedRowId(null);
    setDismissed(false);
    setIsDeleted(false);

    const topicId = resolvedTopicId;
    const ua = userAnswer.trim() || null;
    const ca = correctAnswer.trim() || null;

    // ── 1차 차단: 같은 문제 원문 해시가 이미 저장돼 있으면 분석 진행 X ──
    // force=true(재분석 버튼)일 때는 이 블록을 건너뜀.
    let questionHash: string | null = null;
    if (userId) {
      try {
        questionHash = await hashText(trimmed);
        if (!force) {
          const existedAt = await checkQuestionHash(userId, questionHash);
          if (existedAt) {
            setAlreadyAnalyzedAt(existedAt);
            setCurrentHash(questionHash);
            return;
          }
        }
      } catch (e) {
        console.warn('[AnalyzePage] hash check failed:', e);
      }
    }

    setLoading(true);
    let cardSuccess = false;
    let extractedLocal: ExtractedConcepts | null = null;
    try {
      // Run in parallel — concept card for the user, extraction for the store.
      const [cardRes, extractRes] = await Promise.allSettled([
        fetchConceptCardFromText({ rawText: trimmed, userAnswer: ua, correctAnswer: ca, topicId }),
        extractConcepts({ questionText: trimmed, userAnswer: ua, correctAnswer: ca, topicId }),
      ]);

      if (cardRes.status === 'fulfilled') {
        cardSuccess = true;
        setCard(cardRes.value);
      } else {
        setError((prev) => prev ?? `해설 생성 실패: ${cardRes.reason?.message ?? 'unknown'}`);
      }
      if (extractRes.status === 'fulfilled') {
        extractedLocal = extractRes.value.extracted;
        setExtracted(extractedLocal);
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
          triggers: ext.triggers ?? [],
          questionHash,
          exampleQuestion: extractRes.value.exampleQuestion ?? null,
        };

        // 자동 저장 없음 — 사용자가 배너에서 "저장" / "저장 안 함"으로 결정.
        setPendingExtraction(payload);
      } else {
        setError((prev) => prev ?? `개념 추출 실패: ${extractRes.reason?.message ?? 'unknown'}`);
      }

      // ── C: 연속 정답 카운터 ──────────────────────────────────
      const analysisDone = cardSuccess || !!extractedLocal;
      if (analysisDone && ua !== null && ca !== null) {
        const isMatched = ua.toLowerCase() === ca.toLowerCase();
        const key = 'far_consecutive_correct_analyze';
        const prev = parseInt(localStorage.getItem(key) ?? '0', 10);
        const next = isMatched ? prev + 1 : 0;
        localStorage.setItem(key, String(next));
        setConsecutiveCorrect(next);
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
    setSavedRowId(null);
    setDismissed(false);
    setIsDeleted(false);
    setCard(null);
    setExtracted(null);
    setError(null);
    setAlreadyAnalyzedAt(null);
    setCurrentHash(null);
    setShowExisting(false);
    setAnalyzeContext(null);
    setExtractedOpen(true);
    setCardOpen(false);
    setLearnedOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShowExisting = async () => {
    if (!userId || !currentHash || loadingExisting) return;
    setLoadingExisting(true);
    try {
      const data = await fetchExtractionByHash(userId, currentHash);
      if (data) {
        setExtracted({
          concepts: data.concepts,
          asc_references: data.ascReferences,
          topic_tags: data.topicTags,
          trap_pattern: data.trapPattern,
          triggers: [],
        });
        setExtractedOpen(true);
        setShowExisting(true);
      } else {
        setError('저장된 해설 데이터를 불러오지 못했습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터 불러오기 실패');
    } finally {
      setLoadingExisting(false);
    }
  };

  // 배너에서 "저장" 선택 → concept_extractions INSERT.
  const handleSave = async () => {
    if (!pendingExtraction || isSaving) return;
    setIsSaving(true);
    try {
      const result = await saveConceptExtraction(pendingExtraction);
      if (result) {
        setSavedRowId(result.id);
        // ── B: 뱃지 업그레이드 체크 ──────────────────────────
        if (badgeCount >= 0 && resolvedTopicId) {
          const newCount = badgeCount + 1;
          const prevBadge = computeBadge(badgeCount, quizAccuracy);
          const nextBadge = computeBadge(newCount, quizAccuracy);
          setBadgeCount(newCount);
          if ((nextBadge?.level ?? 0) > (prevBadge?.level ?? 0)) {
            setBadgeToast(`🎉 ${resolvedTopicId} ${nextBadge!.label} 달성!`);
          }
        }
      }
      setPendingExtraction(null);
      setRecentRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  // 배너에서 "저장 안 함" 선택 → 저장 스킵, 배너만 해제.
  const handleDismissSave = () => {
    setPendingExtraction(null);
    setDismissed(true);
  };

  // 추출된 개념 섹션 하단의 "이 기록 삭제" — 이미 저장된 row를 되돌림.
  const handleDelete = async () => {
    if (!savedRowId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteConceptExtraction(savedRowId);
      setIsDeleted(true);
      setSavedRowId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setIsDeleting(false);
    }
  };

  const topConcepts = learned
    ? Object.entries(learned.concepts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const handleSelectRecent = (item: RecentExtractionItem) => {
    setExtracted({
      concepts: item.concepts,
      asc_references: item.ascReferences,
      topic_tags: item.topicTags,
      trap_pattern: item.trapPattern,
      triggers: item.triggers,
    });
    setExtractedOpen(true);
    setCard(null);
    setCardOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div
          className="rounded-xl px-4 py-2.5 text-[12px] sm:text-[13px] leading-relaxed"
          style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
        >
          💡 Becker 문제를 붙여넣으면 한국어 최적화 해설 + 도식화 + 핵심 트리거를 바로 확인할 수 있습니다.
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">문제 분석</h1>
          <p className="text-xs text-muted mt-0.5">
            문제 원문을 붙여넣으면 AI가 구조화 해설을 생성하고, 개념 메타데이터만 학습 데이터에 누적합니다.
          </p>
          {resolvedTopicId && (
            <p className="text-xs text-[#4f6ef7] mt-0.5">
              모듈: {resolvedTopicId} · {topicLabel}
              {badge && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                >
                  {badge.emoji} {badge.label}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Input */}
        <div className="card p-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#0f172a] mb-1 block">문제 원문</label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="FAR 문제 원문을 붙여넣으세요. 선택지가 포함되어 있어도 OK."
              className="w-full text-sm rounded-lg p-3 border border-border bg-white text-[#0f172a]"
              style={{ outline: 'none', fontFamily: 'inherit', minHeight: 200, resize: 'none', overflow: 'hidden' }}
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
            onClick={() => handleAnalyze()}
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

        {/* 이미 분석한 문제 알림 — 해시 완전 일치, LLM 호출 전 차단 */}
        {alreadyAnalyzedAt && !extracted && (
          <div
            className="p-3 rounded-lg text-xs flex items-start gap-2"
            style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3' }}
          >
            <span className="text-base leading-none">🔁</span>
            <div className="flex-1">
              <p className="font-semibold">이미 분석한 문제입니다.</p>
              <p className="mt-0.5 opacity-80">
                이전 분석:{' '}
                {(() => {
                  try {
                    return new Date(alreadyAnalyzedAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {
                    return alreadyAnalyzedAt.slice(0, 10);
                  }
                })()}
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <button
                  onClick={handleShowExisting}
                  disabled={loadingExisting || loading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#4f6ef7' }}
                >
                  {loadingExisting ? '불러오는 중...' : '📖 해설 보기'}
                </button>
                <button
                  onClick={() => handleAnalyze(true)}
                  disabled={loading || loadingExisting}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'white', border: '1px solid #c7d2fe', color: '#3730a3' }}
                >
                  {loading ? '분석 중...' : '🔄 다시 분석하기'}
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* 저장 확인 배너 — 모든 dup 상태에서 사용자 결정 대기 */}
        {dupResult && extracted && (
          <DupBanner
            dup={dupResult}
            extracted={extracted}
            saved={savedRowId !== null}
            dismissed={dismissed}
            isSaving={isSaving}
            onSave={handleSave}
            onDismiss={handleDismissSave}
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
                <TriggerSection triggers={extracted.triggers ?? []} />
                {(savedRowId || isDeleted) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                    {isDeleted ? (
                      <span className="text-[11px] text-muted">✓ 삭제됨</span>
                    ) : (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-[11px] text-[#dc2626] hover:underline disabled:opacity-50"
                      >
                        {isDeleting ? '삭제 중...' : '🗑 이 기록 삭제'}
                      </button>
                    )}
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

        {/* 정답 여부 피드백 — 내 답 · 정답 모두 입력됐고 분석이 끝났을 때만.
            - 다르면 Error Pattern 태깅 섹션
            - 같으면 간단한 성공 배너
            - 한쪽이라도 비어있거나 분석 전이면 아무것도 안 띄운다. */}
        {(() => {
          const ua = userAnswer.trim();
          const ca = correctAnswer.trim();

          // Guard 1: 정답은 반드시 있어야 한다.
          if (ca.length === 0) return null;

          // Guard 2: 분석 결과(card 또는 extracted)가 나와야 한다.
          const analysisDone = !!(card || extracted);
          if (!analysisDone) return null;

          // 내 답이 있고 정답과 일치하면 정답 배너만.
          const matched = ua.length > 0 && ua.toLowerCase() === ca.toLowerCase();

          if (matched) {
            const streakMsg =
              consecutiveCorrect >= 5
                ? '🏆 5연속 정답! 이 모듈 완벽 이해 중!'
                : consecutiveCorrect >= 3
                ? `🔥🔥 ${consecutiveCorrect}연속 정답! 집중력 최고!`
                : consecutiveCorrect >= 2
                ? `🔥 ${consecutiveCorrect}연속 정답!`
                : null;
            return (
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3 animate-correctBounce"
                style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
              >
                <span className="text-2xl shrink-0">✅</span>
                <div>
                  <p className="text-sm font-semibold">정답입니다!</p>
                  {streakMsg ? (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#f97316' }}>
                      {streakMsg}
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-80">같은 유형을 반복해서 확실히 굳혀보세요.</p>
                  )}
                </div>
              </div>
            );
          }

          // 오답 — Error Pattern 태깅. topic 이 특정되어야 RPC 호출이 의미 있음.
          if (!resolvedTopicId) return null;
          return (
            <ErrorTagSection
              key={`${resolvedTopicId}-${ua}-${ca}`}
              question={text}
              userAnswer={ua}
              correctAnswer={ca}
              topicId={resolvedTopicId}
              topicLabel={topicLabel ?? resolvedTopicId}
              quizLogId={null}
              extractionId={savedRowId}
              onSaved={() => setTagToast(true)}
            />
          );
        })()}

        {/* 학습된 개념 accordion */}
        <div className="card rounded-xl overflow-hidden">
          <button
            onClick={() => setLearnedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-[#0f172a]">📚 학습된 개념</span>
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

        {/* 다음 문제 분석하기 — 분석 결과가 있거나 기존 해설을 불러온 경우 노출 */}
        {(card || extracted || showExisting) && (
          <button
            onClick={handleAnalyzeNext}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: '#4f6ef7' }}
          >
            ➕ 다음 문제 분석하기
          </button>
        )}

        {/* ── 최근 분석 기록 아코디언 ── */}
        <RecentAnalysesPanel
          userId={userId ?? null}
          refreshKey={recentRefreshKey}
          onSelect={handleSelectRecent}
        />
      </div>
    </div>

    {/* Error Pattern 저장 완료 토스트 */}
    {tagToast && (
      <div
        className="fixed z-50 top-20 right-4 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slideUp"
        style={{ background: '#0f172a', color: 'white' }}
        role="status"
      >
        <span>✅</span>
        <span>오류 패턴이 기록되었습니다</span>
      </div>
    )}
    {/* B: 뱃지 업그레이드 토스트 */}
    {badgeToast && (
      <div
        className="fixed z-50 top-32 right-4 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-slideUp"
        style={{ background: '#4f6ef7', color: 'white' }}
        role="status"
      >
        {badgeToast}
      </div>
    )}
    </>
  );
}

function TriggerCard({ t }: { t: ConceptTrigger }) {
  const [open, setOpen] = useState(false);

  const bullets = [
    t.auto_rule && { icon: '⚡', text: t.auto_rule, color: '#15803d' },
    t.trap      && { icon: '⚠️', text: t.trap,      color: '#dc2626' },
    t.comparison && { icon: '🔄', text: t.comparison, color: '#1d4ed8' },
    t.irrelevant && { icon: '🚫', text: t.irrelevant, color: '#6b7280' },
  ].filter(Boolean) as { icon: string; text: string; color: string }[];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid #fed7aa', background: '#fff7ed' }}
    >
      {/* 헤더 — 항상 보임 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3 py-2 flex items-start justify-between gap-2"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-bold" style={{ color: '#9a3412' }}>
            ⚡ &quot;{t.keyword}&quot;
          </span>
          {/* 요약 한 줄씩 — 접힌 상태에서만 표시 */}
          {!open && (
            <div className="flex flex-col gap-0.5">
              {bullets.map((b, i) => (
                <p key={i} className="text-[11px] leading-snug truncate" style={{ color: b.color }}>
                  {b.icon} {b.text}
                </p>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-[#9a3412] opacity-60 shrink-0 mt-0.5">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* 펼쳐진 전문 */}
      {open && (
        <div
          className="px-3 pb-3 flex flex-col gap-2 border-t"
          style={{ borderColor: '#fed7aa' }}
        >
          {t.auto_rule && (
            <div className="pt-2">
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#15803d' }}>⚡ 자동 반응</p>
              <p className="text-xs leading-relaxed" style={{ color: '#15803d' }}>{t.auto_rule}</p>
            </div>
          )}
          {t.trap && (
            <div>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#dc2626' }}>⚠️ 함정</p>
              <p className="text-xs leading-relaxed" style={{ color: '#dc2626' }}>{t.trap}</p>
            </div>
          )}
          {t.comparison && (
            <div>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#1d4ed8' }}>🔄 비교</p>
              <p className="text-xs leading-relaxed" style={{ color: '#1d4ed8' }}>{t.comparison}</p>
            </div>
          )}
          {t.irrelevant && (
            <div>
              <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#6b7280' }}>🚫 무시할 데이터</p>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{t.irrelevant}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TriggerSection({ triggers }: { triggers: ConceptTrigger[] }) {
  if (!triggers || triggers.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold text-muted mb-1.5">⚡ 핵심 트리거</p>
      <div className="flex flex-col gap-2">
        {triggers.map((t, i) => (
          <TriggerCard key={i} t={t} />
        ))}
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

// ── 저장 확인 배너 ───────────────────────────────────────────
// 분석 후 사용자에게 저장 여부를 명시적으로 묻는다. 모든 dup 상태에서
// "저장" / "저장 안 함" 버튼을 제공하고, full_dup / partial_dup 케이스는
// 기존 기록(최대 2개)과 현재 분석을 나란히 비교해 보여준다.
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
  saved,
  dismissed,
  isSaving,
  onSave,
  onDismiss,
}: {
  dup: DupCheckResult;
  extracted: ExtractedConcepts;
  saved: boolean;
  dismissed: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const matchedRows: DupMatchedRow[] =
    dup.status === 'full_dup' || dup.status === 'partial_dup' ? dup.matchedRows : [];
  const topOverlap = matchedRows[0]?.overlap ?? 0;
  const topPct = Math.round(topOverlap * 100);

  // 4-way 테마/문구. 전부 사용자 결정 대기.
  let theme: { bg: string; border: string; text: string; accent: string };
  let title: string;
  let subtitle: string;
  let showComparison: boolean;
  if (dup.status === 'new') {
    theme = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#2563eb' };
    title = '새로운 개념 — 저장하시겠어요?';
    subtitle = '같은 모듈에 유사한 기록이 없습니다.';
    showComparison = false;
  } else if (dup.status === 'partial_dup' && dup.newTrap) {
    theme = { bg: '#f0fdf4', border: '#86efac', text: '#166534', accent: '#16a34a' };
    title = '새 함정 패턴 감지 — 저장하시겠어요?';
    subtitle = '기존 기록과 50~80% 유사하지만 함정 패턴이 새롭습니다.';
    showComparison = true;
  } else if (dup.status === 'full_dup') {
    theme = { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', accent: '#dc2626' };
    title = '매우 유사 — 그래도 저장하시겠어요?';
    subtitle = '아래 기존 기록과 80% 이상 겹칩니다.';
    showComparison = true;
  } else {
    theme = { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', accent: '#ea580c' };
    title = '부분 유사 · 함정 동일 — 그래도 저장하시겠어요?';
    subtitle = '기존 기록과 50~80% 유사하고 함정 패턴도 같습니다.';
    showComparison = true;
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
          <span className="text-base shrink-0">💾</span>
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

      {showComparison && (
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
      )}

      {/* Footer: 저장/스킵 버튼 또는 확정 라벨 */}
      <div className="flex items-center justify-end gap-2">
        {saved ? (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-md"
            style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
          >
            ✓ 저장됨
          </span>
        ) : dismissed ? (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-md"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
          >
            × 저장 안 함
          </span>
        ) : (
          <>
            <button
              onClick={onDismiss}
              disabled={isSaving}
              className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-white/50 disabled:opacity-50"
              style={{ color: theme.text, border: `1px solid ${theme.border}` }}
            >
              저장 안 함
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: theme.accent }}
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── 최근 분석 기록 패널 ───────────────────────────────────────
function RecentAnalysesPanel({
  userId,
  refreshKey,
  onSelect,
}: {
  userId: string | null;
  refreshKey: number;
  onSelect: (item: RecentExtractionItem) => void;
}) {
  const [items, setItems] = useState<RecentExtractionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !open) return;
    setLoading(true);
    fetchRecentExtractions(userId, 10)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId, refreshKey, open]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 86400000);
      const hhmm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      if (d >= todayStart) return `오늘 ${hhmm}`;
      if (d >= yesterdayStart) return `어제 ${hhmm}`;
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <div className="card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold text-[#0f172a]">🕐 최근 분석 기록</span>
        <div className="flex items-center gap-2">
          {loading && open && (
            <div className="w-3 h-3 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
          )}
          <span className="text-xs text-muted">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <>
      {!userId ? (
        <p className="text-[11px] text-muted px-4 pb-3">로그인 후 이용 가능합니다.</p>
      ) : !loading && items.length === 0 ? (
        <p className="text-[11px] text-muted px-4 pb-3">아직 분석 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-t border-border">
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setSelectedId(item.id);
                    onSelect(item);
                  }}
                  className="w-full text-left px-4 py-2.5 transition-colors hover:bg-[#f8fafc]"
                  style={{ background: isSelected ? '#eef2ff' : undefined }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    {item.topicId && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#e0f2fe', color: '#0369a1' }}
                      >
                        {item.topicId}
                      </span>
                    )}
                    <span className="text-[10px] text-muted ml-auto">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.concepts.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}
                      >
                        {c}
                      </span>
                    ))}
                    {item.concepts.length > 3 && (
                      <span className="text-[10px] text-muted">+{item.concepts.length - 3}</span>
                    )}
                  </div>
                  {item.trapPattern && (
                    <p className="text-[10px] text-[#991b1b] mt-1 truncate">⚠ {item.trapPattern}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
        </>
      )}
    </div>
  );
}
