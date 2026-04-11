import { useState } from 'react';
import { Topic } from '../../data/far-topics';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

interface FeynmanModeProps {
  topic: Topic;
  areaColor: string;
}

export default function FeynmanMode({ topic, areaColor }: FeynmanModeProps) {
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!explanation.trim()) return;
    setLoading(true);
    setError('');
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/claude/feynman`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: explanation,
          topic: topic.label,
          feynmanPrompt: topic.feynmanPrompt,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { feedback: string };
      setFeedback(data.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const renderFeedback = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**'))
        return <p key={i} className="font-bold text-[#4f6ef7] bg-[#4f6ef7]/5 px-3 py-2 rounded-lg text-sm">{line.slice(2, -2)}</p>;
      if (line.startsWith('•') || line.startsWith('-'))
        return <li key={i} className="text-sm text-[#0f172a] ml-4 list-disc leading-relaxed">{line.slice(1).trim()}</li>;
      if (line.match(/^\d\./))
        return <p key={i} className="text-sm font-semibold text-[#0f172a] mt-3 mb-1">{line}</p>;
      if (line.trim())
        return <p key={i} className="text-sm text-[#0f172a] leading-relaxed">{line}</p>;
      return <div key={i} className="h-2" />;
    });

  return (
    <div className="card overflow-hidden" style={{ borderTop: `3px solid ${areaColor}` }}>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🧠</span>
          <h3 className="text-lg font-bold text-[#0f172a]">Feynman Technique</h3>
        </div>
        <p className="text-sm text-muted">설명하면서 이해한다 — 막히는 지점이 모르는 지점</p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="p-4 rounded-xl" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#6d28d9' }}>📝 설명해볼 질문</p>
          <p className="text-sm text-[#0f172a] leading-relaxed">{topic.feynmanPrompt}</p>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <span>💡</span>
          <p className="text-xs text-[#92400e]">노트나 교재를 보지 말고 한국어로 자유롭게 작성하세요.</p>
        </div>

        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="여기에 개념을 설명해보세요..."
          className="w-full p-4 rounded-xl text-sm text-[#0f172a] resize-none leading-relaxed"
          style={{ border: '1.5px solid #e2e8f0', minHeight: 160, outline: 'none' }}
          onFocus={(e) => (e.target.style.borderColor = '#4f6ef7')}
          onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{explanation.length}자</span>
          <button
            onClick={handleSubmit}
            disabled={loading || explanation.trim().length < 10}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: '#4f6ef7' }}
          >
            {loading ? '분석 중...' : '🤖 피드백 받기'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626' }}>
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
            <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted">Claude가 분석 중...</p>
          </div>
        )}

        {feedback && (
          <div className="p-5 rounded-xl flex flex-col gap-2" style={{ background: '#f8faff', border: '1.5px solid #c7d2fe' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <p className="font-semibold text-sm text-[#4f6ef7]">Claude의 피드백</p>
            </div>
            <div className="flex flex-col gap-1">{renderFeedback(feedback)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
