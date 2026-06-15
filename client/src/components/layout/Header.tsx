import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';
import useClaudeStore from '../../store/claudeStore';
import MoneyRainOverlay from '../MoneyRainOverlay';

const DAILY_GOAL = 10;

const ADMIN_EMAIL = 'sg.van.p@gmail.com';

const mainTabs = [
  { label: '개념', path: '/concept-notes' },
  { label: 'F/S Map', path: '/fsmap' },
  { label: '복습', path: '/wrong-answers' },
  { label: '시험', path: '/exam' },
];

interface HeaderProps {
  email: string;
  onSignOut: () => void;
}

export default function Header({ email, onSignOut }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const todayReviewCount = useStudyStore((s) => s.todayReviewCount);
  const prevCountRef = useRef(0);
  const isScience = location.pathname === '/science';
  const [moneyRainOpen, setMoneyRainOpen] = useState(false);

  useEffect(() => {
    if (todayReviewCount >= DAILY_GOAL && prevCountRef.current < DAILY_GOAL) {
      setMoneyRainOpen(true);
    }
    prevCountRef.current = todayReviewCount;
  }, [todayReviewCount]);
  const isPanelOpen = useClaudeStore((s) => s.isOpen);
  const togglePanel = useClaudeStore((s) => s.togglePanel);

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    if (base === '/') return location.pathname === '/';
    return location.pathname.startsWith(base);
  };

  return (
    <>
    <MoneyRainOverlay open={moneyRainOpen} count={DAILY_GOAL} onClose={() => setMoneyRainOpen(false)} />
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-3 md:px-5 bg-white border-b border-border"
      style={{ height: 54 }}
    >
      {/* Logo */}
      <div
        className="font-semibold text-[15px] text-[#0f172a] mr-4 md:mr-6 cursor-pointer shrink-0"
        onClick={() => navigate('/')}
        style={{ letterSpacing: '-0.3px' }}
      >
        <span style={{ color: '#4f6ef7' }}>FAR</span> Study
      </div>

      {/* Desktop nav tabs — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0">
        {mainTabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 ${
              isActive(tab.path)
                ? 'bg-[#1a2744]/10 text-[#1a2744] font-semibold'
                : 'text-muted hover:text-[#0f172a] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Claude toggle */}
        {!isScience && (
          <button
            onClick={togglePanel}
            className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg text-[12px] md:text-[13px] font-medium transition-all"
            style={{
              background: isPanelOpen ? '#4f6ef7' : '#f8fafc',
              color: isPanelOpen ? 'white' : '#4f6ef7',
              border: `1px solid ${isPanelOpen ? '#4f6ef7' : '#c7d2fe'}`,
            }}
          >
            🧙 <span className="hidden md:inline">Harry</span>
          </button>
        )}

        {/* User — desktop only */}
        <div className="hidden md:flex items-center gap-2 ml-1 pl-2 border-l border-border">
          <span className="text-[11px] text-muted truncate max-w-[120px]">{email}</span>
          <button
            onClick={onSignOut}
            className="text-[11px] text-muted hover:text-[#ef4444] transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* User — mobile: just sign out icon */}
        <button
          onClick={onSignOut}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-gray-100 text-sm"
          title="로그아웃"
        >
          ↪
        </button>
      </div>

      {/* Daily progress gauge — 3px strip at header bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: '#f1f5f9',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min((todayReviewCount / DAILY_GOAL) * 100, 100)}%`,
            background: todayReviewCount >= DAILY_GOAL ? '#22c55e' : '#4f6ef7',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </header>

    </>
  );
}
