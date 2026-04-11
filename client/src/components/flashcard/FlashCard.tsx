import { useState } from 'react';
import { Topic } from '../../data/far-topics';
import useStudyStore from '../../store/studyStore';

interface FlashCardProps {
  topic: Topic;
  areaColor: string;
  onNext?: () => void;
}

type Step = 1 | 2 | 3;

export default function FlashCard({ topic, areaColor, onNext }: FlashCardProps) {
  const [step, setStep] = useState<Step>(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [selfRating, setSelfRating] = useState<'correct' | 'wrong' | null>(null);
  const updateSRSCard = useStudyStore((s) => s.updateSRSCard);

  const handleRate = (correct: boolean) => {
    setSelfRating(correct ? 'correct' : 'wrong');
    updateSRSCard(topic.id, correct);
  };

  const handleNext = () => {
    setStep(1);
    setUserAnswer('');
    setSelfRating(null);
    onNext?.();
  };

  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${areaColor}` }}>
      {/* Progress Steps */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  background: step >= s ? areaColor : '#e2e8f0',
                  color: step >= s ? 'white' : '#94a3b8',
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className="w-12 h-0.5 rounded"
                  style={{ background: step > s ? areaColor : '#e2e8f0' }}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-muted">
            {step === 1 && '토픽 확인'}
            {step === 2 && '직접 작성'}
            {step === 3 && '자기평가'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-[#0f172a]">{topic.label}</h3>
      </div>

      <div className="p-5">
        {/* Step 1: Show topic label only */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: areaColor + '0d', border: `2px dashed ${areaColor}40` }}
            >
              <p className="text-5xl mb-3">🧠</p>
              <p className="text-sm text-muted mb-1">이 토픽에 대해 알고 있는 것을</p>
              <p className="font-bold text-[#0f172a]">답을 보기 전에 먼저 떠올려보세요</p>
              <p className="text-xs text-muted mt-2">Rules, 공식, 함정 포인트 모두 생각해보기</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: areaColor }}
            >
              준비됐어요 — 작성하러 가기 →
            </button>
          </div>
        )}

        {/* Step 2: Write answer */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-lg" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <p className="text-xs font-semibold text-[#6d28d9]">
                ✍️ 노트를 보지 말고 아는 것만 써보세요
              </p>
            </div>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={`"${topic.label}"에 대해 기억나는 Rules, 공식, 주의할 점을 모두 적어보세요...`}
              className="w-full p-4 rounded-xl text-sm text-[#0f172a] resize-none leading-relaxed"
              style={{
                border: '1.5px solid #e2e8f0',
                minHeight: 180,
                outline: 'none',
                fontFamily: '"DM Sans", sans-serif',
              }}
              onFocus={(e) => (e.target.style.borderColor = areaColor)}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-gray-100 transition-colors"
                style={{ border: '1px solid #e2e8f0' }}
              >
                ← 돌아가기
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={userAnswer.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: areaColor }}
              >
                정답 확인하기 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Compare and self-rate */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            {/* User's answer */}
            <div>
              <p className="text-xs font-semibold text-muted mb-2">📝 내가 쓴 답</p>
              <div
                className="p-4 rounded-xl text-sm text-[#0f172a] leading-relaxed"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}
              >
                {userAnswer || <span className="text-muted italic">작성 내용 없음</span>}
              </div>
            </div>

            {/* Correct answer */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: areaColor }}>
                ✅ 핵심 Rules (정답)
              </p>
              <div
                className="p-4 rounded-xl"
                style={{ background: areaColor + '08', border: `1.5px solid ${areaColor}30` }}
              >
                <ul className="flex flex-col gap-2">
                  {topic.rules.slice(0, 4).map((rule, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[#0f172a] leading-relaxed">
                      <span className="shrink-0 font-bold" style={{ color: areaColor }}>
                        {i + 1}.
                      </span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Self-rating */}
            {!selfRating ? (
              <div>
                <p className="text-sm font-medium text-[#0f172a] mb-3 text-center">
                  비교해보고 스스로 평가하세요
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRate(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                    style={{ background: '#fff5f5', color: '#ef4444', border: '1.5px solid #fecaca' }}
                  >
                    ❌ 틀렸어요 / 부족해요
                  </button>
                  <button
                    onClick={() => handleRate(true)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                    style={{ background: '#f0fdf4', color: '#22c55e', border: '1.5px solid #bbf7d0' }}
                  >
                    ✅ 맞았어요!
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: selfRating === 'correct' ? '#f0fdf4' : '#fff5f5',
                    border: `1.5px solid ${selfRating === 'correct' ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <p className="text-2xl mb-1">{selfRating === 'correct' ? '🎉' : '📚'}</p>
                  <p className="font-semibold text-sm" style={{ color: selfRating === 'correct' ? '#22c55e' : '#ef4444' }}>
                    {selfRating === 'correct'
                      ? '훌륭해요! 복습 간격이 늘어납니다.'
                      : '괜찮아요. 내일 다시 복습합니다.'}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: areaColor }}
                >
                  다음 카드로 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
