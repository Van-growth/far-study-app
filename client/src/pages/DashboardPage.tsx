import { useState } from 'react';
import Dashboard from '../components/dashboard/Dashboard';
import StudyCalendar from '../components/dashboard/StudyCalendar';
import HistoryView from '../components/dashboard/HistoryView';
import BriefingTab from '../components/dashboard/BriefingTab';
import ErrorPatternBoard from '../components/dashboard/ErrorPatternBoard';
import ErrorChainTab from '../components/dashboard/ErrorChainTab';

type TabId = 'briefing' | 'board' | 'health' | 'chain';

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: 'briefing', label: '오늘 브리핑', sub: 'Claude AI' },
  { id: 'board',    label: 'Error Pattern Board', sub: '나 vs 전체' },
  { id: 'health',   label: '토픽 Health', sub: '모듈별 정확도' },
  { id: 'chain',    label: 'Error Chain', sub: '원인→결과 탐색' },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<TabId>('briefing');

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">학습 현황</h1>
          <p className="text-sm text-muted mt-0.5">
            Error Pattern Library · "왜 틀렸는가"를 구조화해서 쌓는 공간
          </p>
        </div>

        {/* Tab nav */}
        <div className="card p-1 flex items-stretch gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-start px-3 py-2 rounded-lg text-left shrink-0 transition-colors"
                style={{
                  background: active ? '#4f6ef7' : 'transparent',
                  color: active ? 'white' : '#0f172a',
                  minWidth: 120,
                }}
              >
                <span className="text-xs font-semibold">{t.label}</span>
                <span
                  className="text-[10px] mt-0.5"
                  style={{ color: active ? 'rgba(255,255,255,0.8)' : '#64748b' }}
                >
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'briefing' && <BriefingTab />}
        {tab === 'board' && <ErrorPatternBoard />}
        {tab === 'health' && (
          <div className="flex flex-col gap-6">
            <StudyCalendar />
            <Dashboard />
          </div>
        )}
        {tab === 'chain' && <ErrorChainTab />}

        {/* History — tab 과 독립적으로 항상 아래 표시 */}
        <HistoryView />
      </div>
    </div>
  );
}
