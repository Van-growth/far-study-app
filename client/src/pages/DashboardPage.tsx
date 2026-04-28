import { useState, useEffect } from 'react';
import useStudyStore from '../store/studyStore';
import { getExamDate, setExamDate, getDailyGoal, saveDailyGoal } from '../lib/db';

const EXAM_LS_KEY = 'far_exam_date'
function syncExamDateLS(val: string | null) {
  try {
    if (val) localStorage.setItem(EXAM_LS_KEY, val)
    else localStorage.removeItem(EXAM_LS_KEY)
  } catch { /* ignore */ }
}
import Dashboard from '../components/dashboard/Dashboard';
import StudyCalendar from '../components/dashboard/StudyCalendar';

export default function DashboardPage() {
  const userId = useStudyStore((s) => s.userId);
  const setDailyGoalStore = useStudyStore((s) => s.setDailyGoal);
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [dailyGoal, setDailyGoalState] = useState(10);
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getExamDate(userId).then((d) => {
      setExamDateState(d);
      setInputVal(d ?? '');
      syncExamDateLS(d);
    });
    getDailyGoal(userId).then((g) => {
      setDailyGoalState(g);
      setDailyGoalStore(g);
    });
  }, [userId]);

  const handleGoalChange = async (next: number) => {
    if (!userId || goalSaving) return;
    const clamped = Math.max(1, Math.min(50, next));
    setDailyGoalState(clamped);
    setDailyGoalStore(clamped);
    setGoalSaving(true);
    await saveDailyGoal(userId, clamped);
    setGoalSaving(false);
  };

  const dDayCount = examDate
    ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSave = async () => {
    if (!userId) return;
    const val = inputVal || null;
    await setExamDate(userId, val);
    setExamDateState(val);
    syncExamDateLS(val);
    setEditing(false);
  };

  const dDayLabel = dDayCount === null
    ? null
    : dDayCount > 0
    ? `D-${dDayCount}`
    : dDayCount === 0
    ? 'D-Day'
    : '시험 완료';

  const dDayColor = dDayCount !== null && dDayCount <= 7 ? '#ef4444' : '#4f6ef7';
  const dDayBg = dDayCount !== null && dDayCount <= 7 ? '#fff1f2' : '#eef2ff';
  const dDayBorder = dDayCount !== null && dDayCount <= 7 ? '#fecaca' : '#c7d2fe';

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0f172a]">학습 현황</h1>

          {/* D-Day 배너 */}
          {!editing && dDayLabel && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: dDayBg, border: `1px solid ${dDayBorder}` }}
            >
              <span className="text-xs text-muted">시험일까지</span>
              <span className="text-xl font-bold" style={{ color: dDayColor }}>{dDayLabel}</span>
              <span className="text-xs text-muted">{examDate}</span>
            </button>
          )}

          {!editing && !examDate && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#eef2ff', color: '#4338ca' }}
            >
              + 시험일 설정
            </button>
          )}

          {editing && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="text-sm px-2 py-1.5 rounded-lg outline-none"
                style={{ border: '1.5px solid #c7d2fe' }}
                autoFocus
              />
              <button
                onClick={handleSave}
                className="text-sm px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ background: '#4f6ef7' }}
              >
                저장
              </button>
              {examDate && (
                <button
                  onClick={async () => {
                    if (!userId) return;
                    await setExamDate(userId, null);
                    setExamDateState(null);
                    syncExamDateLS(null);
                    setInputVal('');
                    setEditing(false);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-[#ef4444]"
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => setEditing(false)}
                className="text-sm px-2.5 py-1.5 rounded-lg text-muted"
              >
                취소
              </button>
            </div>
          )}
        </div>

        <StudyCalendar />
        <Dashboard />

        {/* Daily goal settings */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'white', border: '1.5px solid #e2e8f0' }}
        >
          <h3 className="text-sm font-bold text-[#0f172a] mb-4">⚙️ 복습 설정</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#374151]">하루 복습 목표</p>
              <p className="text-xs text-[#94a3b8] mt-0.5">1 ~ 50개 범위</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleGoalChange(dailyGoal - 1)}
                disabled={dailyGoal <= 1 || goalSaving}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-opacity disabled:opacity-30"
                style={{ background: '#f1f5f9', color: '#374151' }}
              >
                −
              </button>
              <span className="text-xl font-extrabold w-8 text-center" style={{ color: '#4f6ef7' }}>
                {dailyGoal}
              </span>
              <button
                onClick={() => void handleGoalChange(dailyGoal + 1)}
                disabled={dailyGoal >= 50 || goalSaving}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-opacity disabled:opacity-30"
                style={{ background: '#eef2ff', color: '#4338ca' }}
              >
                +
              </button>
            </div>
          </div>
          {goalSaving && (
            <p className="text-[10px] text-[#94a3b8] text-right mt-2">저장 중…</p>
          )}
        </div>
      </div>
    </div>
  );
}
