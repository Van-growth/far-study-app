import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { allTopics, areas } from '../data/far-topics';
import useStudyStore, { QuizLogPayload } from '../store/studyStore';
import { interleaveQuestions, isDue, getAccuracy } from '../lib/srs';
import QuizView, { QuizItemWithContext, QuizResult } from '../components/quiz/QuizView';

type QuizMode = 'interleave' | 'due' | 'weak' | 'single';

export default function QuizPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const recordAnswer = useStudyStore((s) => s.recordAnswer);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);

  const mode = (params.get('mode') ?? 'interleave') as QuizMode;
  const topicId = params.get('topicId');

  // Snapshot questions once per (mode, topicId). We intentionally exclude
  // `srsCards` from deps: recordAnswer() during the quiz mutates it and would
  // otherwise re-shuffle the list under QuizView, making currentIdx land on a
  // freshly-answered question and appearing as "same question repeats".
  const questions: QuizItemWithContext[] = useMemo(() => {
    const snap = useStudyStore.getState().srsCards;
    let filtered = allTopics;

    if (topicId) {
      filtered = allTopics.filter((t) => t.id === topicId);
    } else if (mode === 'due') {
      filtered = allTopics.filter((t) => { const c = snap[t.id]; return c ? isDue(c) : false; });
    } else if (mode === 'weak') {
      filtered = allTopics.filter((t) => {
        const c = snap[t.id];
        if (!c) return false;
        const acc = getAccuracy(c);
        return acc >= 0 && acc < 60;
      });
    }

    const raw: QuizItemWithContext[] = filtered.flatMap((topic) => {
      const area = areas.find((a) => a.topics.some((t) => t.id === topic.id));
      return topic.quiz.map((q) => ({
        topicId: topic.id, topicLabel: topic.label, areaColor: area?.color ?? '#4f6ef7', ...q,
      }));
    });

    return interleaveQuestions(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topicId]);

  const handleAnswer = (result: QuizResult) => {
    const log: QuizLogPayload = {
      topicId: result.topicId,
      topicLabel: result.topicLabel,
      question: result.question,
      options: result.options,
      correct: result.correct,
      selected: result.selected,
      answer: result.answer,
    };
    recordAnswer(result.topicId, result.correct, log);
  };

  const modeLabel: Record<string, string> = {
    interleave: '전체 퀴즈 (Interleaving)',
    due: '복습 DUE 퀴즈',
    weak: '약점 집중 퀴즈',
  };
  const label = topicId
    ? allTopics.find((t) => t.id === topicId)?.label ?? '토픽 퀴즈'
    : modeLabel[mode] ?? '퀴즈';

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[#0f172a] text-lg">{label}</h1>
            <p className="text-xs text-muted mt-0.5">{questions.length}문제</p>
          </div>
          <div className="flex gap-2">
            {(['interleave', 'due', 'weak'] as QuizMode[]).map((m) => (
              <button key={m} onClick={() => navigate(`/quiz?mode=${m}`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: mode === m && !topicId ? '#4f6ef7' : '#f1f5f9', color: mode === m && !topicId ? 'white' : '#64748b' }}>
                {m === 'interleave' ? '전체' : m === 'due' ? 'DUE' : '약점'}
              </button>
            ))}
          </div>
        </div>

        {mode === 'interleave' && !topicId && (
          <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <span>🔀</span>
            <p className="text-xs text-[#4c1d95]"><strong>Interleaving 모드:</strong> 모든 토픽이 셔플됩니다.</p>
          </div>
        )}

        {!topicId && (
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => area.topics.map((t) => (
              <button key={t.id} onClick={() => { setCurrentTopic(t.id); navigate(`/quiz?topicId=${t.id}`); }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-80"
                style={{ background: area.color + '15', color: area.color, border: `1px solid ${area.color}30` }}>
                {t.label}
              </button>
            )))}
          </div>
        )}

        {questions.length > 0 && (
          <QuizView
            key={mode + topicId}
            questions={questions}
            onAnswer={handleAnswer}
            onComplete={() => {}}
            title={label}
          />
        )}
      </div>
    </div>
  );
}
