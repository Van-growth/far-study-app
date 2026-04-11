import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
    // Dragging left = wider panel (since panel is on the right)
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
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <Header email={email} onSignOut={signOut} />
      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: 54 }}>
        {!isScience && <Sidebar />}
        <main className="flex-1 overflow-auto min-w-0" style={{ background: '#f0f4f8' }}>
          <Routes>
            <Route path="/" element={<ConceptPage />} />
            <Route path="/flashcard" element={<FlashCardPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wrong" element={<WrongPage />} />
            <Route path="/science" element={<SciencePage />} />
          </Routes>
        </main>
        {!isScience && (
          <div
            style={{
              width: isPanelOpen ? panelWidth : 0,
              overflow: 'hidden',
              flexShrink: 0,
              transition: isDragging.current ? 'none' : 'width 0.25s ease',
              position: 'relative',
            }}
          >
            {/* Drag handle */}
            {isPanelOpen && (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 6,
                  cursor: 'col-resize',
                  zIndex: 10,
                }}
                className="group"
              >
                {/* Visible bar on hover */}
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
      <div className="min-h-screen flex items-center justify-center bg-bg">
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
