import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allTopics, areas } from '../data/far-topics';
import useStudyStore, { QuizLogPayload } from '../store/studyStore';
import QuizView, { QuizItemWithContext, QuizResult } from '../components/quiz/QuizView';
import { saveHistory, ConceptCard } from '../hooks/useDynamicQuiz';

// Payload shape stashed by DashboardPage's "replay wrong" button.
interface ReplayItem {
  id: string;
  moduleId: string;
  question: string;
  options: string[];
  correctAnswer: string; // letter "A"-"D"
}

function letterToIdx(letter: string): number {
  const idx = ['A', 'B', 'C', 'D'].indexOf(letter.toUpperCase());
  return idx >= 0 ? idx : 0;
}

export default function ReplayPage() {
  const navigate = useNavigate();
  const recordAnswer = useStudyStore((s) => s.recordAnswer);
  const [payload, setPayload] = useState<ReplayItem[] | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('far_replay_payload');
      if (!raw) {
        setPayload([]);
        return;
      }
      const parsed = JSON.parse(raw) as ReplayItem[];
      setPayload(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPayload([]);
    }
  }, []);

  const quizItems = useMemo<QuizItemWithContext[]>(() => {
    if (!payload) return [];
    return payload.map((p) => {
      const area = areas.find((a) => a.topics.some((t) => t.id === p.moduleId));
      const label = allTopics.find((t) => t.id === p.moduleId)?.label ?? p.moduleId;
      // Ensure exactly 4 options — pad or trim as needed.
      const opts = [...p.options];
      while (opts.length < 4) opts.push('');
      return {
        topicId: p.moduleId,
        topicLabel: label,
        areaColor: area?.color ?? '#4f6ef7',
        q: p.question,
        opts: [opts[0], opts[1], opts[2], opts[3]] as [string, string, string, string],
        ans: letterToIdx(p.correctAnswer),
        exp: '',
      };
    });
  }, [payload]);

  const handleAnswer = (result: QuizResult) => {
    const log: QuizLogPayload = {
      topicId: result.topicId,
      topicLabel: result.topicLabel,
      question: result.question,
      options: result.options,
      correct: result.correct,
      selected: result.selected,
      answer: result.answer,
      elapsedSeconds: result.elapsedSeconds,
    };
    recordAnswer(result.topicId, result.correct, log);
  };

  const handleConceptCardReady = (card: ConceptCard, result: QuizResult) => {
    const ALPHA = ['A', 'B', 'C', 'D'];
    saveHistory({
      moduleId: result.topicId,
      question: result.question,
      options: result.options,
      correctAnswer: ALPHA[result.answer] ?? String(result.answer),
      userAnswer: ALPHA[result.selected] ?? String(result.selected),
      isCorrect: result.correct,
      elapsed_seconds: result.elapsedSeconds,
      conceptCard: card,
    }).catch(() => {/* background */});
  };

  if (payload === null) {
    return <div className="p-6 text-center text-sm text-muted">로딩 중...</div>;
  }

  if (payload.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto card p-8 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="font-semibold text-[#0f172a] mb-1">다시 풀 문제가 없습니다</p>
          <p className="text-sm text-muted mb-4">
            현황 탭의 풀이 히스토리에서 "틀린 N문제 다시 풀기"를 눌러 시작하세요.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: '#4f6ef7' }}
          >
            현황으로 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[#0f172a] text-lg">📕 틀린 문제 다시 풀기</h1>
            <p className="text-xs text-muted mt-0.5">
              {payload.length}문제 · 히스토리에 저장된 원본 문제
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: '#f1f5f9', color: '#64748b' }}
          >
            현황으로
          </button>
        </div>

        <QuizView
          questions={quizItems}
          onAnswer={handleAnswer}
          onConceptCardReady={handleConceptCardReady}
          onComplete={() => {/* noop */}}
          sessionMax={quizItems.length}
          title="오답 재출제"
        />
      </div>
    </div>
  );
}
