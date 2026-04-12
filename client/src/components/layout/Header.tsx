import { useNavigate, useLocation } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';
import useClaudeStore from '../../store/claudeStore';

const desktopTabs = [
  { label: '퀴즈', path: '/quiz?mode=interleave' },
  { label: '🤖 AI 코치', path: '/coach' },
  { label: '📝 문제 분석', path: '/analyze' },
  { label: '📕 오답노트', path: '/wrong' },
  { label: '현황', path: '/dashboard' },
  { label: '🧬 학습 과학', path: '/science' },
];

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

  const isActive = (path: string) => {
    const base = path.split('?')[0];
    if (base === '/') return location.pathname === '/';
    return location.pathname.startsWith(base);
  };

  return (
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
        {desktopTabs.map((tab) => (
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
  );
}
