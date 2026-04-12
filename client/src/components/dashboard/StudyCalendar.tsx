import { useEffect, useState } from 'react';
import useStudyStore from '../../store/studyStore';
import { getCalendar } from '../../lib/db';
import { localDateStr } from '../../lib/date';

interface DayData {
  date: string;
  quiz_count: number;
  correct_count: number;
}

const CELL_SIZE = 13;
const GAP = 3;
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DAYS_LABEL = ['', '월', '', '수', '', '금', ''];

function getColor(count: number): string {
  if (count === 0) return '#f1f5f9';
  if (count <= 5) return '#bfdbfe';
  if (count <= 15) return '#60a5fa';
  return '#1d4ed8';
}

export default function StudyCalendar() {
  const userId = useStudyStore((s) => s.userId);
  const [data, setData] = useState<DayData[]>([]);

  useEffect(() => {
    if (!userId) return;
    getCalendar(userId).then((d) => setData(d as DayData[]));
  }, [userId]);

  // Build 52-week grid (364 days)
  const today = new Date();
  const grid: { date: Date; count: number; correct: number }[][] = [];
  const dayMap = new Map(data.map((d) => [d.date, d]));

  // Go back 363 days to start on a Monday
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  // Adjust to Monday
  while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

  const cursor = new Date(start);
  let currentWeek: { date: Date; count: number; correct: number }[] = [];

  while (cursor <= today) {
    // Local date — must match the format used when session rows were
    // written (db.ts updateTodaySession), otherwise the heatmap cell
    // lookup misses by 1 day.
    const dateStr = localDateStr(cursor);
    const entry = dayMap.get(dateStr);
    currentWeek.push({
      date: new Date(cursor),
      count: entry?.quiz_count ?? 0,
      correct: entry?.correct_count ?? 0,
    });
    if (currentWeek.length === 7) {
      grid.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) grid.push(currentWeek);

  // Month labels
  const monthLabels: { text: string; col: number }[] = [];
  let lastMonth = -1;
  grid.forEach((week, wi) => {
    const firstDay = week[0]?.date;
    if (firstDay) {
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ text: MONTHS[m], col: wi });
        lastMonth = m;
      }
    }
  });

  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-[#0f172a] mb-4">학습 캘린더</h3>

      <div className="relative overflow-x-auto">
        {/* Month labels */}
        <div className="flex mb-1" style={{ marginLeft: 28 }}>
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="text-[10px] text-muted absolute"
              style={{ left: 28 + m.col * (CELL_SIZE + GAP) }}
            >
              {m.text}
            </span>
          ))}
        </div>

        <div className="flex gap-0 mt-4" style={{ position: 'relative' }}>
          {/* Day labels */}
          <div className="flex flex-col shrink-0" style={{ width: 24, gap: GAP }}>
            {DAYS_LABEL.map((d, i) => (
              <div key={i} className="text-[10px] text-muted" style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex" style={{ gap: GAP }}>
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-[#4f6ef7]"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: getColor(day.count),
                    }}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const dateStr = `${day.date.getMonth() + 1}/${day.date.getDate()}`;
                      setTooltip({
                        x: r.left + r.width / 2,
                        y: r.top - 8,
                        text: `${dateStr} — ${day.count}문제, ${day.correct}정답`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-muted">적음</span>
          {[0, 3, 10, 20].map((n) => (
            <div key={n} className="rounded-sm" style={{ width: 10, height: 10, background: getColor(n) }} />
          ))}
          <span className="text-[10px] text-muted">많음</span>
        </div>
      </div>

      {/* Tooltip portal */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg text-xs text-white font-medium pointer-events-none"
          style={{
            background: '#0f172a',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
