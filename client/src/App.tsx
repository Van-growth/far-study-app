import { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthChange, signOut } from './lib/auth';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ClaudePanel from './components/claude/ClaudePanel';
import QuizPage from './pages/QuizPage';
import DashboardPage from './pages/DashboardPage';
import WrongPage from './pages/WrongPage';
import SciencePage from './pages/SciencePage';
import AnalyzePage from './pages/AnalyzePage';
import ReplayPage from './pages/ReplayPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import ValuationPage from './pages/ValuationPage';
import HomePage from './pages/HomePage';
import LearningEffectPage from './pages/LearningEffectPage';
import BadgesPage from './pages/BadgesPage';
import HistoryPage from './pages/HistoryPage';

const ADMIN_EMAIL = 'sg.van.p@gmail.com';
import useClaudeStore from './store/claudeStore';
import useStudyStore from './store/studyStore';

const PANEL_MIN = 280;
const PANEL_MAX = 600;
const PANEL_DEFAULT = 340;

// ── Bottom Tab Bar (mobile only) ──────────────────────────────
// New 3-tab structure: Home (AI tutor briefing) / Analyze / More.
// Coach, Wrong, Science, Valuation still resolve as URLs but are not
// reachable through the nav (intentional per the 2026-04 repositioning).
const MOBILE_TABS = [
  { label: '홈', icon: '🏠', path: '/' },
  { label: '분석', icon: '📝', path: '/analyze' },
  { label: '기록', icon: '📋', path: '/history' },
  { label: '더보기', icon: '···', path: '/more' },
];

function BottomTabBar({ email }: { email: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/quiz')) return location.pathname === '/quiz';
    return location.pathname.startsWith(path);
  };

  const morePaths = ['/quiz', '/admin', '/dashboard'];
  const moreActive = morePaths.some((p) => location.pathname.startsWith(p));

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
              { label: '📊 대시보드', path: '/dashboard' },
              { label: '✏️ 퀴즈', path: '/quiz?mode=interleave' },
              { label: '🏆 뱃지 & 성취', path: '/badges' },
              { label: '📈 학습 효과', path: '/learning' },
              ...(isAdmin ? [{ label: '🛠️ Admin', path: '/admin' }] : []),
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setShowMore(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-border my-1" />
            <button
              onClick={() => { setTocOpen(true); setShowMore(false); }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              📚 Becker 목차
            </button>
          </div>
        </div>
      )}

      {/* Becker 목차 모달 — 모바일 */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setTocOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative flex flex-col bg-white shadow-xl overflow-hidden"
            style={{ width: '85vw', maxWidth: 320, marginTop: 54, maxHeight: 'calc(100dvh - 54px - 56px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">📚 Becker 목차</span>
              <button onClick={() => setTocOpen(false)} className="text-muted hover:text-[#0f172a] text-lg leading-none px-1">×</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onItemClick={() => setTocOpen(false)} />
            </div>
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
      <Header email={email} onSignOut={async () => {
        await signOut();
        window.location.href = '/';
      }} />

      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ paddingTop: 54 }}>

        {/* Main content — extra bottom padding on mobile for tab bar */}
        <main
          className="flex-1 overflow-auto min-w-0 pb-16 md:pb-0"
          style={{ background: '#f0f4f8' }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flashcard" element={<Navigate to="/" replace />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wrong" element={<WrongPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/replay" element={<ReplayPage />} />
            <Route path="/science" element={<SciencePage />} />
            <Route path="/learning" element={<LearningEffectPage />} />
            <Route path="/valuation" element={<ValuationPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/badges" element={<BadgesPage />} />
            {email.toLowerCase() === ADMIN_EMAIL && (
              <Route path="/admin" element={<AdminPage email={email} />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
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
      {!isScience && <BottomTabBar email={email} />}

      {/* Mobile Claude modal */}
      <ClaudeModal />
    </div>
  );
}

// Module-level guard: ensures bootstrap runs at most once per page load,
// even if React 18 StrictMode double-invokes the mount effect in dev.
let bootstrapHasRun = false;
const lastInitStoredUid: { current: string | null } = { current: null };

export default function App() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const initStore = useStudyStore((s) => s.initStore);

  useEffect(() => {
    // Bootstrap-once guard: protects against StrictMode double-invoke AND
    // any other remount of the root <App>.
    if (bootstrapHasRun) {
      setLoading(false);
      return;
    }
    bootstrapHasRun = true;

    // Check env vars at startup
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log('[App] ENV check:', {
      VITE_SUPABASE_URL: url ? `✅ ${(url as string).slice(0, 30)}...` : '❌ missing',
      VITE_SUPABASE_ANON_KEY: key ? '✅ set' : '❌ missing',
      VITE_API_URL: import.meta.env.VITE_API_URL ?? '❌ missing',
    });

    if (!url || !key) {
      console.error('[App] Supabase env vars missing — showing login page');
      setInitError('Supabase 환경변수가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }

    // ── Event-driven auth bootstrap ──────────────────────────
    // Previously we called getSession() wrapped in a hard timeout and
    // fell back to "null user" when it didn't settle in time. That was
    // brittle: on slow token refresh we'd mistakenly show AuthPage while
    // the real session was still loading, and any immediate DB write ran
    // without a JWT and failed RLS with 400.
    //
    // New approach: subscribe to onAuthStateChange and let Supabase tell
    // us when the session is ready. It emits `INITIAL_SESSION` right
    // after client init (usually within a few milliseconds) with the
    // restored session or null. We unblock the loading screen on that
    // first event — no timeout, no polling, no fallback.
    //
    // The only safety net is a long (30s) "stuck" detector that shows
    // an error banner if Supabase somehow never emits anything (broken
    // config, CSP blocking, etc.), but it does NOT silently swap in a
    // null user — it just surfaces the problem.
    let initialHandled = false;

    const stuckTimer = window.setTimeout(() => {
      if (initialHandled) return;
      console.error('[App] Supabase never emitted an initial auth event in 30s');
      setInitError('Supabase 연결이 지연되고 있습니다. 새로고침해주세요.');
      setLoading(false);
    }, 30000);

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = onAuthChange(async (event, session) => {
        const user = session?.user ?? null;
        console.log('[App] onAuthStateChange', event, { user: user?.email });
        setUserEmail(user?.email ?? null);

        if (user) {
          if (lastInitStoredUid.current !== user.id) {
            lastInitStoredUid.current = user.id;
            // Fire-and-forget: initStore sets `userId` synchronously at
            // the top of its body, so subsequent store reads see it even
            // if the remote sync takes a while.
            initStore(user.id).catch((e) =>
              console.warn('[App] initStore failed:', e?.message ?? e),
            );
          }
        } else {
          lastInitStoredUid.current = null;
        }

        // Unblock the loading screen on the FIRST event (INITIAL_SESSION
        // or an immediate SIGNED_IN). Subsequent events just update state.
        if (!initialHandled) {
          initialHandled = true;
          window.clearTimeout(stuckTimer);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    } catch (e) {
      console.error('[App] onAuthChange subscription error:', e);
      window.clearTimeout(stuckTimer);
      setInitError('인증 구독 실패');
      setLoading(false);
    }

    return () => {
      window.clearTimeout(stuckTimer);
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#4f6ef7] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">로딩 중...</p>
          {initError && (
            <p className="text-xs text-[#ef4444] mt-2">{initError}</p>
          )}
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return <AuthPage onAuth={() => window.location.reload()} />;
  }

  return (
    <BrowserRouter>
      <AppLayout email={userEmail} />
    </BrowserRouter>
  );
}
