import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useStudyStore, { QuizLogPayload } from '../store/studyStore';
import { getAccuracy, SRCard } from '../lib/srs';
import QuizView, { QuizItemWithContext, QuizResult } from '../components/quiz/QuizView';
import { saveQuizLog, getTodayQuizStats } from '../lib/db';
import { supabase } from '../lib/supabase';

const SESSION_MAX = 20;

// ── Types ─────────────────────────────────────────────────────
interface BankQuestion {
  questionId: string
  topicId: string
  areaId: string | null
  questionText: string
  options: string[]
  correctIndex: number
  contextBackground: string | null
  contextTrigger: string | null
  ruleTitle: string | null
  ruleItems: string[] | null
  trigger: string | null
  trap: string | null
  speed: string | null
}

const AREA_COLORS: Record<string, string> = {
  IMP: '#ef4444',
  EPS: '#8b5cf6',
  INV: '#f59e0b',
  PPE: '#4f6ef7',
  INT: '#10b981',
  LEASE: '#06b6d4',
  REV: '#ec4899',
  TAX: '#f97316',
  INVEST: '#84cc16',
  EQUITY: '#a855f7',
  CF: '#14b8a6',
  CHANGE: '#6366f1',
  CONSOL: '#0ea5e9',
  FV: '#eab308',
  NFP: '#22c55e',
  CASH: '#64748b',
  SW: '#0284c7',
}

function getAreaColor(topicId: string, areaId: string | null): string {
  const key = areaId ?? topicId.split('_')[0]
  return AREA_COLORS[key] ?? '#4f6ef7'
}

// ── Data fetch ─────────────────────────────────────────────────
async function loadFromQuestionBank(topicId?: string | null): Promise<BankQuestion[]> {
  let query = supabase
    .from('question_bank')
    .select('question_id, topic_id, area_id, question_text, options, correct_index, context_background, context_trigger, rule_title, rule_items, trigger, trap, speed')
    .in('source', [1, 2])
    .eq('is_banned', false)
  if (topicId) query = query.eq('topic_id', topicId)
  const { data, error } = await query
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(r => ({
    questionId: String(r.question_id ?? ''),
    topicId: String(r.topic_id ?? ''),
    areaId: r.area_id ? String(r.area_id) : null,
    questionText: String(r.question_text ?? ''),
    options: Array.isArray(r.options) ? (r.options as unknown[]).map(String) : [],
    correctIndex: Number(r.correct_index ?? 0),
    contextBackground: r.context_background ? String(r.context_background) : null,
    contextTrigger: r.context_trigger ? String(r.context_trigger) : null,
    ruleTitle: r.rule_title ? String(r.rule_title) : null,
    ruleItems: Array.isArray(r.rule_items) ? (r.rule_items as unknown[]).map(String) : null,
    trigger: r.trigger ? String(r.trigger) : null,
    trap: r.trap ? String(r.trap) : null,
    speed: r.speed ? String(r.speed) : null,
  }))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function bankToQuizItem(b: BankQuestion): QuizItemWithContext {
  return {
    topicId: b.topicId,
    topicLabel: b.topicId,
    areaColor: getAreaColor(b.topicId, b.areaId),
    q: b.questionText,
    opts: b.options as [string, string, string, string],
    ans: b.correctIndex,
    exp: '',
    context_background: b.contextBackground,
    context_trigger: b.contextTrigger,
    rule_title: b.ruleTitle,
    rule_items: b.ruleItems,
    trigger: b.trigger,
    trap: b.trap,
    speed: b.speed,
  }
}

// ── Game sounds ───────────────────────────────────────────────
function getGameAudioCtx(): AudioContext | null {
  try { return new AudioContext() } catch { return null }
}
function playCorrectSoundGame() {
  const ctx = getGameAudioCtx(); if (!ctx) return
  ;([[880, 0], [1100, 0.13]] as [number, number][]).forEach(([freq, delay]) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = freq
    gain.gain.setValueAtTime(0.18, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35)
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.35)
  })
  setTimeout(() => { try { ctx.close() } catch { /* */ } }, 700)
}
function playWrongSoundGame() {
  const ctx = getGameAudioCtx(); if (!ctx) return
  const osc = ctx.createOscillator(), gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.type = 'sawtooth'; osc.frequency.value = 180
  gain.gain.setValueAtTime(0.18, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  osc.start(); osc.stop(ctx.currentTime + 0.4)
  setTimeout(() => { try { ctx.close() } catch { /* */ } }, 500)
}
function playComboSoundGame() {
  const ctx = getGameAudioCtx(); if (!ctx) return
  ;([[660, 0], [880, 0.1], [1100, 0.2], [1320, 0.3]] as [number, number][]).forEach(([freq, delay]) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25)
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.25)
  })
  setTimeout(() => { try { ctx.close() } catch { /* */ } }, 800)
}
function playLevelUpSoundGame() {
  const ctx = getGameAudioCtx(); if (!ctx) return
  ;([[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45]] as [number, number][]).forEach(([freq, delay]) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'; osc.frequency.value = freq
    gain.gain.setValueAtTime(0.2, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5)
    osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.5)
  })
  setTimeout(() => { try { ctx.close() } catch { /* */ } }, 1200)
}

// ─────────────────────────────────────────────────────────────
export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recordAnswer = useStudyStore((s) => s.recordAnswer);
  const addXpLocal = useStudyStore((s) => s.addXpLocal);
  const srsCards = useStudyStore((s) => s.srsCards);
  const userIdState = useStudyStore((s) => s.userId);

  // ── Game state ───────────────────────────────────────────────
  const comboRef = useRef(0);
  const [comboDisplay, setComboDisplay] = useState(0);
  const [showGreenFlash, setShowGreenFlash] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [xpFloatKey, setXpFloatKey] = useState(0);
  const [xpFloatLabel, setXpFloatLabel] = useState('+10 XP');
  const [showXpFloat, setShowXpFloat] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLabel, setLevelUpLabel] = useState('');

  // Accept both `topicId` (legacy) and `moduleId` for deep-links.
  const topicId = params.get('topicId') ?? params.get('moduleId');

  const [deck, setDeck] = useState<BankQuestion[]>([]);
  const [deckIdx, setDeckIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<{ count: number; correct: number } | null>(null);

  // Load question bank on mount; topicId filter applied at DB query level.
  useEffect(() => {
    setLoading(true);
    loadFromQuestionBank(topicId)
      .then(all => {
        setDeck(shuffle(all));
        setDeckIdx(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    if (!userIdState) return;
    let cancelled = false;
    getTodayQuizStats(userIdState)
      .then((s) => { if (!cancelled) setTodayStats(s); })
      .catch(() => { /* 네트워크 실패 시 조용히 */ });
    return () => { cancelled = true; };
  }, [userIdState]);

  const sessionMax = Math.min(SESSION_MAX, deck.length);
  const quizItems: QuizItemWithContext[] = deck.slice(0, deckIdx + 1).map(bankToQuizItem);

  // ── Answer handler ────────────────────────────────────────────
  const handleAnswer = useCallback((result: QuizResult) => {
    const log: QuizLogPayload = {
      topicId: result.topicId,
      topicLabel: result.topicLabel,
      question: result.question,
      options: result.options,
      correct: result.correct,
      selected: result.selected,
      answer: result.answer,
      elapsedSeconds: result.elapsedSeconds,
      sourceConcepts: result.sourceConcepts ?? null,
      sourceTrap: result.sourceTrap ?? null,
    };
    recordAnswer(result.topicId, result.correct, log);

    const levelBefore = useStudyStore.getState().level;
    if (result.correct) {
      comboRef.current += 1;
      const newCombo = comboRef.current;
      setComboDisplay(newCombo);
      let xpGain = 10;
      if (newCombo >= 5) { xpGain += 10; playComboSoundGame(); }
      else if (newCombo >= 3) { xpGain += 5; playCorrectSoundGame(); }
      else { playCorrectSoundGame(); }
      addXpLocal(xpGain);
      setXpFloatLabel(`+${xpGain} XP`);
      setXpFloatKey((k) => k + 1);
      setShowXpFloat(true);
      setTimeout(() => setShowXpFloat(false), 1000);
      setShowGreenFlash(true);
      setTimeout(() => setShowGreenFlash(false), 600);
    } else {
      comboRef.current = 0;
      setComboDisplay(0);
      playWrongSoundGame();
      setShowRedFlash(true);
      setTimeout(() => setShowRedFlash(false), 600);
    }
    const levelAfter = useStudyStore.getState().level;
    if (levelAfter !== levelBefore) {
      setLevelUpLabel(levelAfter);
      setShowLevelUp(true);
      playLevelUpSoundGame();
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setTodayStats((prev) =>
      prev
        ? { count: prev.count + 1, correct: prev.correct + (result.correct ? 1 : 0) }
        : prev,
    );
  }, [recordAnswer, addXpLocal]);

  // ── Next question handler ─────────────────────────────────────
  const handleRequestNext = useCallback(() => {
    if (deckIdx + 1 >= sessionMax) return;
    setDeckIdx(i => i + 1);
  }, [deckIdx, sessionMax]);

  // ── Skip handler ──────────────────────────────────────────────
  const handleSkip = (item: QuizItemWithContext) => {
    const uid = useStudyStore.getState().userId;
    if (!uid) return;
    void saveQuizLog(uid, {
      topicId: item.topicId,
      topicLabel: item.topicLabel,
      question: item.q,
      options: [...item.opts],
      correct: false,
      selected: -1,
      answer: item.ans,
      elapsedSeconds: null,
    }).catch(() => {/* background */});
  };

  const label = topicId ? `${topicId} 퀴즈` : '전체 퀴즈 (Interleaving)';
  const currentTopicId = deck[deckIdx]?.topicId ?? topicId ?? null;

  return (
    <>
      {/* Screen flash overlays */}
      {showGreenFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-greenFlash"
          style={{ boxShadow: 'inset 0 0 0 7px #22c55e' }} />
      )}
      {showRedFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-redFlash"
          style={{ boxShadow: 'inset 0 0 0 7px #ef4444' }} />
      )}

      {/* XP float */}
      {showXpFloat && (
        <div key={xpFloatKey} className="fixed top-24 right-6 pointer-events-none z-50 animate-xpFloat font-extrabold text-lg"
          style={{ color: '#4338ca' }}>
          {xpFloatLabel}
        </div>
      )}

      {/* Combo badge */}
      {comboDisplay >= 3 && (
        <div key={comboDisplay} className="fixed top-20 inset-x-0 flex justify-center pointer-events-none z-50">
          <div className="animate-comboAppear px-5 py-1.5 rounded-full text-white font-bold text-sm shadow-lg"
            style={{ background: comboDisplay >= 5 ? '#f59e0b' : '#ef4444' }}>
            {comboDisplay >= 5 ? '🔥🔥' : '🔥'} Combo ×{comboDisplay}
          </div>
        </div>
      )}

      {/* Level-up overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-levelUpPop bg-white rounded-3xl px-10 py-8 text-center shadow-2xl"
            style={{ border: '3px solid #4338ca' }}>
            <div className="text-5xl mb-2">🎉</div>
            <div className="text-2xl font-extrabold" style={{ color: '#4338ca' }}>레벨업!</div>
            <div className="text-xl font-bold mt-1" style={{ color: '#0f172a' }}>{levelUpLabel}</div>
          </div>
        </div>
      )}

    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
<div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-[#0f172a] text-base sm:text-lg truncate">{label}</h1>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5 truncate">
              {deckIdx + 1} / {sessionMax} · Question Bank
            </p>
          </div>
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => navigate('/quiz')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: !topicId ? '#4f6ef7' : '#f1f5f9',
                color: !topicId ? 'white' : '#64748b',
              }}
            >
              전체
            </button>
          </div>
        </div>

        {/* 누적 정답률 바 */}
        <AccuracyBar
          todayStats={todayStats}
          moduleId={currentTopicId}
          srsCards={srsCards}
          loggedIn={!!userIdState}
        />

        {quizItems.length > 0 && deck.length > 0 && (
          <QuizView
            key={topicId ?? 'all'}
            questions={quizItems}
            onAnswer={handleAnswer}
            onComplete={() => {}}
            onRequestNext={handleRequestNext}
            onSkip={handleSkip}
            sessionMax={sessionMax}
            isLoadingNext={false}
            title={label}
          />
        )}

        {loading && quizItems.length === 0 && <QuestionSkeleton />}

        {!loading && deck.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-[#0f172a] mb-1">문제가 없습니다</p>
            <p className="text-sm text-muted">Question Bank에 등록된 문제가 없습니다.</p>
          </div>
        )}
      </div>

    </div>
    </>
  );
}

// ── Accuracy bar ──────────────────────────────────────────────
function AccuracyBar({
  todayStats,
  moduleId,
  srsCards,
  loggedIn,
}: {
  todayStats: { count: number; correct: number } | null;
  moduleId: string | null;
  srsCards: Record<string, SRCard>;
  loggedIn: boolean;
}) {
  const card = moduleId ? srsCards[moduleId] : null;
  const accuracy = card ? getAccuracy(card) : -1;
  const attempts = card?.attempts ?? 0;

  const showToday = loggedIn && todayStats !== null;
  const showModule = accuracy >= 0;
  if (!showToday && !showModule) return null;

  const todayPct =
    showToday && todayStats!.count > 0
      ? Math.round((todayStats!.correct / todayStats!.count) * 100)
      : null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-[11px]">
      {showToday && (
        <span
          className="px-2.5 py-1 rounded-full font-medium"
          style={{
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            color: '#3730a3',
          }}
        >
          📅 오늘 {todayStats!.correct}/{todayStats!.count}
          {todayPct !== null && ` · ${todayPct}%`}
        </span>
      )}
      {showModule && (
        <span
          className="px-2.5 py-1 rounded-full font-medium"
          style={{
            background: accuracy >= 80 ? '#f0fdf4' : accuracy >= 50 ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${accuracy >= 80 ? '#86efac' : accuracy >= 50 ? '#fcd34d' : '#fecaca'}`,
            color: accuracy >= 80 ? '#166534' : accuracy >= 50 ? '#92400e' : '#991b1b',
          }}
        >
          📊 {moduleId} 누적 {accuracy}% ({attempts}회)
        </span>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
function QuestionSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-2">
        <span className="text-lg">📚</span>
        <p className="text-sm text-muted">Question Bank에서 문제를 불러오는 중...</p>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
      <div className="flex flex-col gap-2 mt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
