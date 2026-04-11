import { useNavigate, useLocation } from 'react-router-dom';
import useStudyStore from '../../store/studyStore';
import useClaudeStore from '../../store/claudeStore';

const tabs = [
  { label: '개념트리', path: '/' },
  { label: '플래시카드', path: '/flashcard' },
  { label: '현황', path: '/dashboard' },
  { label: '📕 오답노트', path: '/wrong' },
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

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 bg-white border-b border-border"
      style={{ height: 54 }}
    >
      <div
        className="font-semibold text-[15px] text-[#0f172a] mr-6 cursor-pointer shrink-0"
        onClick={() => navigate('/')}
        style={{ letterSpacing: '-0.3px' }}
      >
        <span style={{ color: '#4f6ef7' }}>FAR</span> Study
      </div>

      <nav className="flex items-center gap-1 flex-1 min-w-0">
        {tabs.map((tab) => (
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

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/quiz?mode=due')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium"
          style={{
            background: dueCount > 0 ? '#fff5f5' : '#f8fafc',
            color: dueCount > 0 ? '#ef4444' : '#64748b',
            border: `1px solid ${dueCount > 0 ? '#fecaca' : '#e2e8f0'}`,
          }}
        >
          DUE
          {dueCount > 0 && (
            <span className="w-5 h-5 rounded-full text-white text-[11px] font-bold inline-flex items-center justify-center" style={{ background: '#ef4444' }}>
              {dueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/quiz?mode=interleave')}
          className="px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-white hover:opacity-90"
          style={{ background: '#4f6ef7' }}
        >
          전체퀴즈
        </button>

        {!isScience && (
          <button
            onClick={togglePanel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: isPanelOpen ? '#4f6ef7' : '#f8fafc',
              color: isPanelOpen ? 'white' : '#4f6ef7',
              border: `1px solid ${isPanelOpen ? '#4f6ef7' : '#c7d2fe'}`,
            }}
          >
            💬 Claude
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
          <span className="text-[11px] text-muted truncate max-w-[120px]">{email}</span>
          <button
            onClick={onSignOut}
            className="text-[11px] text-muted hover:text-[#ef4444] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
