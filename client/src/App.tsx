import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { getSession, onAuthChange, signOut } from './lib/auth';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ClaudePanel from './components/claude/ClaudePanel';
import ConceptPage from './pages/ConceptPage';
import FlashCardPage from './pages/FlashCardPage';
import QuizPage from './pages/QuizPage';
import DashboardPage from './pages/DashboardPage';
import WrongPage from './pages/WrongPage';
import SciencePage from './pages/SciencePage';
import AuthPage from './pages/AuthPage';
import useClaudeStore from './store/claudeStore';
import useStudyStore from './store/studyStore';

const PANEL_MIN = 280;
const PANEL_MAX = 600;
const PANEL_DEFAULT = 340;

// ── Bottom Tab Bar (mobile only) ──────────────────────────────
const MOBILE_TABS = [
  { label: '개념', icon: '📋', path: '/' },
  { label: '카드', icon: '🔁', path: '/flashcard' },
  { label: '퀴즈', icon: '✏️', path: '/quiz?mode=interleave' },
  { label: '현황', icon: '📊', path: '/dashboard' },
  { label: '더보기', icon: '···', path: '/more' },
];

function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/quiz')) return location.pathname === '/quiz';
    return location.pathname.startsWith(path);
  };

  const moreActive =
    location.pathname === '/wrong' || location.pathname === '/science';

  return (
    <>
      {/* More menu popup */}
      {showMore && (
        <div className="fixed inset-0 z-50" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-16 right-3 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { label: '📕 오답노트', path: '/wrong' },
              { label: '🧬 학습 과학', path: '/science' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setShowMore(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around"
        style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {MOBILE_TABS.map((tab) => {
          const active = tab.path === '/more' ? moreActive : isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => {
                if (tab.path === '/more') { setShowMore(!showMore); return; }
                navigate(tab.path);
                setShowMore(false);
              }}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? '#4f6ef7' : '#94a3b8' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Claude Modal (mobile only) ────────────────────────────────
function ClaudeModal() {
  const isOpen = useClaudeStore((s) => s.isOpen);
  const closePanel = useClaudeStore((s) => s.closePanel);

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closePanel} />
      {/* Panel — slides up from bottom, full height minus status bar */}
      <div
        className="relative mt-8 flex-1 bg-white rounded-t-2xl overflow-hidden animate-slideUp"
        style={{ maxHeight: 'calc(100dvh - 32px)' }}
      >
        <ClaudePanel modal />
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────
function AppLayout({ email }: { email: string }) {
  const location = useLocation();
  const isScience = location.pathname === '/science';
  const isPanelOpen = useClaudeStore((s) => s.isOpen);

  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startW.current = panelWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = startX.current - e.clientX;
    const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, startW.current + delta));
    setPanelWidth(next);
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg">
      <Header email={email} onSignOut={signOut} />

      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: 54 }}>
        {/* Sidebar — desktop only */}
        {!isScience && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        {/* Main content — extra bottom padding on mobile for tab bar */}
        <main
          className="flex-1 overflow-auto min-w-0 pb-16 md:pb-0"
          style={{ background: '#f0f4f8' }}
        >
          <Routes>
            <Route path="/" element={<ConceptPage />} />
            <Route path="/flashcard" element={<FlashCardPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wrong" element={<WrongPage />} />
            <Route path="/science" element={<SciencePage />} />
          </Routes>
        </main>

        {/* Claude side panel — desktop only */}
        {!isScience && (
          <div
            className="hidden md:block"
            style={{
              width: isPanelOpen ? panelWidth : 0,
              overflow: 'hidden',
              flexShrink: 0,
              transition: isDragging.current ? 'none' : 'width 0.25s ease',
              position: 'relative',
            }}
          >
            {isPanelOpen && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0, width: 6,
                  cursor: 'col-resize', zIndex: 10,
                }}
                className="group"
              >
                <div
                  className="absolute inset-y-0 left-[2px] w-[2px] rounded-full transition-colors group-hover:bg-[#4f6ef7] group-active:bg-[#4f6ef7]"
                  style={{ background: '#e2e8f0' }}
                />
              </div>
            )}
            <div style={{ width: panelWidth, height: '100%' }}>
              <ClaudePanel />
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      {!isScience && <BottomTabBar />}

      {/* Mobile Claude modal */}
      <ClaudeModal />
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const initStore = useStudyStore((s) => s.initStore);

  const bootstrap = async () => {
    const { data } = await getSession();
    const user = data.session?.user ?? null;
    setUserEmail(user?.email ?? null);
    if (user) await initStore(user.id);
    setLoading(false);
  };

  useEffect(() => {
    bootstrap();
    const { data: { subscription } } = onAuthChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUserEmail(user?.email ?? null);
      if (user) await initStore(user.id);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#4f6ef7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return <AuthPage onAuth={bootstrap} />;
  }

  return (
    <BrowserRouter>
      <AppLayout email={userEmail} />
    </BrowserRouter>
  );
}
