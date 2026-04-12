import { useState } from 'react';
import useStudyStore from '../store/studyStore';
import { allTopics, areas } from '../data/far-topics';
import FlashCard from '../components/flashcard/FlashCard';

export default function FlashCardPage() {
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);
  const srsCards = useStudyStore((s) => s.srsCards);

  const [cardIdx, setCardIdx] = useState(() => {
    if (!currentTopicId) return 0;
    const idx = allTopics.findIndex((t) => t.id === currentTopicId);
    return idx >= 0 ? idx : 0;
  });

  // Always cycle through all topics so "next" advances to a different card.
  const topicsToStudy = allTopics;
  const currentTopic = topicsToStudy[cardIdx % topicsToStudy.length];
  const selectedTopicId = currentTopic?.id ?? null;
  const area = areas.find((a) => a.topics.some((t) => t.id === currentTopic?.id));

  const handleNext = () => {
    setCardIdx((i) => (i + 1) % topicsToStudy.length);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Controls */}
        <div className="card p-4 flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted block mb-1">토픽 선택</label>
            <select
              value={selectedTopicId ?? ''}
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setCardIdx(0);
                  return;
                }
                const idx = allTopics.findIndex((t) => t.id === id);
                if (idx >= 0) setCardIdx(idx);
              }}
              className="w-full text-sm rounded-lg px-3 py-2 border border-border bg-white text-[#0f172a]"
              style={{ outline: 'none' }}
            >
              <option value="">전체 토픽 (순서대로)</option>
              {areas.map((area) => (
                <optgroup key={area.id} label={area.label}>
                  {area.topics.map((t) => {
                    const card = srsCards[t.id];
                    const attempts = card?.attempts ?? 0;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.label} {attempts > 0 ? `(${attempts}회)` : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted mb-1">진행</p>
            <p className="font-bold text-[#0f172a]">
              {(cardIdx % topicsToStudy.length) + 1} / {topicsToStudy.length}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentTopic(currentTopic?.id ?? null);
              setCardIdx(0);
            }}
            className="px-3 py-2 text-sm rounded-lg text-muted hover:bg-gray-100 transition-colors"
            style={{ border: '1px solid #e2e8f0' }}
          >
            리셋
          </button>
        </div>

        {/* How it works */}
        <div
          className="p-3 rounded-xl flex items-start gap-3"
          style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
        >
          <span>💡</span>
          <div>
            <p className="text-xs font-semibold text-[#6d28d9] mb-0.5">Active Recall 3단계</p>
            <p className="text-xs text-[#4c1d95]">
              Step 1: 토픽 확인 → Step 2: 직접 작성 (답 보기 전!) → Step 3: 비교 후 자기평가
            </p>
          </div>
        </div>

        {/* Flash Card */}
        {currentTopic && area && (
          <FlashCard
            key={currentTopic.id + '-' + cardIdx}
            topic={currentTopic}
            areaColor={area.color}
            onNext={handleNext}
          />
        )}

        {/* Navigation */}
        {topicsToStudy.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setCardIdx((i) => (i - 1 + topicsToStudy.length) % topicsToStudy.length)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-gray-100 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}
            >
              ← 이전 토픽
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-gray-100 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}
            >
              다음 토픽 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
