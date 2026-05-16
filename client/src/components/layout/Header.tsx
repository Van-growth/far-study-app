import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';
import useClaudeStore from '../../store/claudeStore';
import Sidebar from './Sidebar';
import { MORE_MENU_ITEMS, ADMIN_MENU_ITEM } from '../../constants/navigation';
import MoneyRainOverlay from '../MoneyRainOverlay';

const DAILY_GOAL = 10;

const ADMIN_EMAIL = 'sg.van.p@gmail.com';

const mainTabs = [
  { label: '홈', path: '/' },
  { label: '⚡ 복습', path: '/sprint' },
  { label: '📑 개념', path: '/concept-notes' },
  { label: '🗺️ 개념맵', path: '/concept-map' },
];

const MORE_PATHS = new Set<string>([...MORE_MENU_ITEMS, ADMIN_MENU_ITEM].map((t) => t.path));

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

  const [moreOpen, setMoreOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen]);

  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTocOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tocOpen]);

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    if (base === '/') return location.pathname === '/';
    return location.pathname.startsWith(base);
  };
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
  const moreActive = MORE_PATHS.has(
    // Match by path prefix, same semantics as isActive.
    [...MORE_PATHS].find((p) => location.pathname.startsWith(p.split('?')[0])) ?? '',
  );
  const moreMenuItems = [...MORE_MENU_ITEMS, ...(isAdmin ? [ADMIN_MENU_ITEM] : [])];

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
                ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]'
                : 'text-muted hover:text-[#0f172a] hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors shrink-0 ${
              moreActive || moreOpen
                ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]'
                : 'text-muted hover:text-[#0f172a] hover:bg-gray-100'
            }`}
          >
            더보기 ▾
          </button>
          {moreOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[180px] z-50"
            >
              {moreMenuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMoreOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                    isActive(item.path) ? 'text-[#4f6ef7] font-semibold' : 'text-[#0f172a]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setTocOpen(true); setMoreOpen(false); }}
                className="w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors text-[#0f172a]"
              >
                📚 FAR 목차
              </button>
            </div>
          )}
        </div>
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

    {/* FAR 목차 드로어 */}
    {tocOpen && (
      <div className="fixed inset-0 z-50 flex" onClick={() => setTocOpen(false)}>
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="relative flex flex-col bg-white shadow-xl overflow-hidden"
          style={{ width: 280, marginTop: 54, maxHeight: 'calc(100dvh - 54px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">📚 FAR 목차</span>
            <button
              onClick={() => setTocOpen(false)}
              className="text-muted hover:text-[#0f172a] text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar onItemClick={() => setTocOpen(false)} />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
