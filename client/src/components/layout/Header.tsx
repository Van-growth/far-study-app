import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';
import useClaudeStore from '../../store/claudeStore';
import Sidebar from './Sidebar';

const ADMIN_EMAIL = 'sg.van.p@gmail.com';

// Main desktop nav: 2 primary entries only.
// AI 튜터 중심으로 포지셔닝 전환. 퀴즈/대시보드/어드민은 더보기 드롭다운으로.
// Coach/오답노트/학습 과학/Valuation 은 URL 은 유지하되 네비에서 제거.
const mainTabs = [
  { label: '홈', path: '/' },
  { label: '📝 분석', path: '/analyze' },
  { label: '📊 대시보드', path: '/dashboard' },
];

const moreTabs = [
  { label: '✏️ 퀴즈', path: '/quiz?mode=interleave' },
  { label: '📈 학습 효과', path: '/learning' },
];
const adminTab = { label: '🛠️ Admin', path: '/admin' };

const MORE_PATHS = new Set([...moreTabs, adminTab].map((t) => t.path));

interface HeaderProps {
  email: string;
  onSignOut: () => void;
}

export default function Header({ email, onSignOut }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const getDueCount = useStudyStore((s) => s.getDueCount);
  const dueCount = getDueCount();
  const isScience = location.pathname === '/science';
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
  const moreMenuItems = [...moreTabs, ...(isAdmin ? [adminTab] : [])];

  return (
    <>
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
                📚 Becker 목차
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* DUE button */}
        <button
          onClick={() => navigate('/quiz?mode=due')}
          className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-lg text-[12px] md:text-[13px] font-medium"
          style={{
            background: dueCount > 0 ? '#fff5f5' : '#f8fafc',
            color: dueCount > 0 ? '#ef4444' : '#64748b',
            border: `1px solid ${dueCount > 0 ? '#fecaca' : '#e2e8f0'}`,
          }}
        >
          DUE
          {dueCount > 0 && (
            <span className="w-4 h-4 md:w-5 md:h-5 rounded-full text-white text-[10px] md:text-[11px] font-bold inline-flex items-center justify-center" style={{ background: '#ef4444' }}>
              {dueCount}
            </span>
          )}
        </button>

        {/* All quiz — desktop only */}
        <button
          onClick={() => navigate('/quiz?mode=interleave')}
          className="hidden md:block px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-white hover:opacity-90"
          style={{ background: '#4f6ef7' }}
        >
          전체퀴즈
        </button>

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
            💬 <span className="hidden md:inline">Claude</span>
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
    </header>

    {/* Becker 목차 드로어 */}
    {tocOpen && (
      <div className="fixed inset-0 z-50 flex" onClick={() => setTocOpen(false)}>
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="relative flex flex-col bg-white shadow-xl overflow-hidden"
          style={{ width: 280, marginTop: 54, maxHeight: 'calc(100dvh - 54px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">📚 Becker 목차</span>
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
