import { useState } from 'react';
import useStudyStore from '../store/studyStore';
import { allTopics, getTopicById, areas } from '../data/far-topics';
import ConceptCard from '../components/concept/ConceptCard';
import FeynmanMode from '../components/feynman/FeynmanMode';

type ViewMode = 'concept' | 'feynman';

export default function ConceptPage() {
  const currentTopicId = useStudyStore((s) => s.currentTopicId);
  const setCurrentTopic = useStudyStore((s) => s.setCurrentTopic);
  const [viewMode, setViewMode] = useState<ViewMode>('concept');

  const topic = currentTopicId ? getTopicById(currentTopicId) : null;
  const area = topic ? areas.find((a) => a.topics.some((t) => t.id === topic.id)) : null;

  if (!topic || !area) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome */}
          <div
            className="card p-8 text-center mb-6"
            style={{ borderTop: '3px solid #4f6ef7' }}
          >
            <p className="text-5xl mb-4">📚</p>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">FAR Study App</h1>
            <p className="text-muted text-sm mb-4">
              좌측 사이드바에서 토픽을 선택하여 학습을 시작하세요
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted">
              <span>Active Recall</span>
              <span>·</span>
              <span>Spaced Repetition</span>
              <span>·</span>
              <span>Feynman Technique</span>
              <span>·</span>
              <span>Interleaving</span>
            </div>
          </div>

          {/* Quick access */}
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            전체 토픽
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {allTopics.map((t) => {
              const topicArea = areas.find((a) => a.topics.some((tp) => tp.id === t.id));
              return (
                <button
                  key={t.id}
                  onClick={() => setCurrentTopic(t.id)}
                  className="card p-4 text-left hover:shadow-md transition-shadow"
                  style={{ borderLeft: `3px solid ${topicArea?.color}` }}
                >
                  <p className="text-sm font-semibold text-[#0f172a]">{t.label}</p>
                  <p className="text-xs text-muted mt-0.5">{topicArea?.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('concept')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'concept'
                ? 'text-white'
                : 'text-muted hover:text-[#0f172a]'
            }`}
            style={viewMode === 'concept' ? { background: area.color } : { background: '#f1f5f9' }}
          >
            📋 개념 카드
          </button>
          <button
            onClick={() => setViewMode('feynman')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              viewMode === 'feynman'
                ? 'text-white'
                : 'text-muted hover:text-[#0f172a]'
            }`}
            style={viewMode === 'feynman' ? { background: '#8b5cf6' } : { background: '#f1f5f9' }}
          >
            🧠 Feynman
          </button>
        </div>

        {viewMode === 'concept' && (
          <ConceptCard topic={topic} areaColor={area.color} areaLabel={area.label} />
        )}

        {viewMode === 'feynman' && (
          <FeynmanMode topic={topic} areaColor={area.color} />
        )}
      </div>
    </div>
  );
}
