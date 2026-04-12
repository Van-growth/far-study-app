import Dashboard from '../components/dashboard/Dashboard';
import StudyCalendar from '../components/dashboard/StudyCalendar';
import HistoryView from '../components/dashboard/HistoryView';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">학습 현황</h1>
          <p className="text-sm text-muted mt-0.5">Spaced Repetition 스케줄 · 진도 · 약점 분석</p>
        </div>
        <StudyCalendar />
        <Dashboard />
        <HistoryView />
      </div>
    </div>
  );
}
