import { useState } from 'react';
import { Topic } from '../../data/far-topics';
import useClaudeStore from '../../store/claudeStore';
import { useClaudeChat } from '../../hooks/useClaudeChat';

interface ConceptCardProps {
  topic: Topic;
  areaColor: string;
  areaLabel: string;
}

type CardTab = 'rules' | 'formulas' | 'tips' | 'triggers';

export default function ConceptCard({ topic, areaColor, areaLabel }: ConceptCardProps) {
  const [activeTab, setActiveTab] = useState<CardTab>('rules');

  const openPanel = useClaudeStore((s) => s.openPanel);
  const { sendMessage } = useClaudeChat(topic.label);

  const askAboutRule = (rule: string) => {
    openPanel();
    sendMessage(`FAR "${topic.label}"에서 다음 Rule을 쉬운 예시와 함께 설명해줘:\n\n"${rule}"`);
  };

  const askAboutTrigger = (trigger: string) => {
    openPanel();
    sendMessage(`다음 Trigger의 실제 FAR 시험 적용 예시를 보여줘:\n\n"${trigger}"`);
  };

  const tabs: { key: CardTab; label: string; emoji: string }[] = [
    { key: 'rules', label: 'Rules', emoji: '📋' },
    { key: 'formulas', label: '공식', emoji: '🔢' },
    { key: 'tips', label: '함정/Tips', emoji: '⚠️' },
    { key: 'triggers', label: 'Trigger→Rule', emoji: '⚡' },
  ];

  return (
    <div
      className="card overflow-hidden"
      style={{ borderTop: `3px solid ${areaColor}` }}
    >
      {/* Card Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: areaColor + '18', color: areaColor }}
          >
            {areaLabel}
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">{topic.label}</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-5 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-[#4f6ef7] text-[#4f6ef7]'
                : 'border-transparent text-muted hover:text-[#0f172a]'
            }`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === 'rules' && (
          <ul className="flex flex-col gap-3">
            {topic.rules.map((rule, i) => (
              <li key={i} className="flex gap-3 group">
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: areaColor }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-[#0f172a] leading-relaxed pt-0.5 flex-1">{rule}</p>
                {/* "?" button */}
                <button
                  onClick={() => askAboutRule(rule)}
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  style={{
                    background: '#eef2ff',
                    color: '#4f6ef7',
                    border: '1px solid #c7d2fe',
                  }}
                  title="Claude에게 이 Rule 설명 요청"
                >
                  ?
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'formulas' && (
          <div className="flex flex-col gap-3">
            {topic.formulas.length > 0 ? (
              topic.formulas.map((formula, i) => (
                <div key={i} className="formula-block">
                  {formula}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted italic">이 토픽에 별도 공식이 없습니다.</p>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <ul className="flex flex-col gap-3">
            {topic.tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-3 p-3 rounded-lg"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <span className="shrink-0 text-base">⚠️</span>
                <p className="text-sm text-[#92400e] leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'triggers' && (
          <div className="flex flex-col gap-2">
            {topic.triggers.map((trigger, i) => (
              <div key={i} className="flex items-start gap-2 group">
                <div className="trigger-block flex-1">{trigger}</div>
                {/* "?" button */}
                <button
                  onClick={() => askAboutTrigger(trigger)}
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  style={{
                    background: '#eef2ff',
                    color: '#4f6ef7',
                    border: '1px solid #c7d2fe',
                  }}
                  title="Claude에게 이 Trigger 예시 요청"
                >
                  ?
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
