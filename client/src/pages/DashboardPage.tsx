import Dashboard from '../components/dashboard/Dashboard';
import StudyCalendar from '../components/dashboard/StudyCalendar';

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">학습 현황</h1>
        </div>
        <StudyCalendar />
        <Dashboard />
      </div>
    </div>
  );
}
