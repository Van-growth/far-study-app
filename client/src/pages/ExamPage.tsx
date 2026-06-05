import { useState, useEffect } from 'react';

const NAVY = '#1a2744';
const BORDER = '1px solid #e0e0e0';
const STORAGE_KEY = 'far_exam_info';

interface ExamInfo {
  examDate: string;
  location: string;
  memo: string;
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExamPage() {
  const [info, setInfo] = useState<ExamInfo>({ examDate: '', location: '', memo: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setInfo(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const days = daysUntil(info.examDate);

  return (
    <div style={{ background: '#fff', minHeight: '100%', maxWidth: 560, margin: '0 auto', padding: 24 }}>
      {/* D-Day */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {days !== null ? (
          <>
            <div style={{ fontSize: 72, fontWeight: 800, color: NAVY, letterSpacing: '-3px', lineHeight: 1 }}>
              {days > 0 ? `D-${days}` : days === 0 ? 'D-Day' : `D+${Math.abs(days)}`}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
              {info.examDate} {info.location && `· ${info.location}`}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 20, color: '#aaa', fontWeight: 600 }}>시험 날짜를 입력해주세요</div>
        )}
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 6 }}>
            시험 날짜
          </label>
          <input
            type="date"
            value={info.examDate}
            onChange={e => setInfo(prev => ({ ...prev, examDate: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px', border: BORDER, borderRadius: 8,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 6 }}>
            시험 장소
          </label>
          <input
            type="text"
            value={info.location}
            onChange={e => setInfo(prev => ({ ...prev, location: e.target.value }))}
            placeholder="예: 서울 강남 Prometric"
            style={{
              width: '100%', padding: '10px 12px', border: BORDER, borderRadius: 8,
              fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: NAVY, display: 'block', marginBottom: 6 }}>
            전략 메모
          </label>
          <textarea
            value={info.memo}
            onChange={e => setInfo(prev => ({ ...prev, memo: e.target.value }))}
            placeholder="시험 전략, 목표 점수, 집중 파트 등 자유롭게 기록..."
            rows={6}
            style={{
              width: '100%', padding: '10px 12px', border: BORDER, borderRadius: 8,
              fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: '12px', background: saved ? '#16a34a' : NAVY, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          {saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}
