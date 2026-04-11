import { useState } from 'react';
import { signUp, signIn } from '../lib/auth';

interface AuthPageProps {
  onAuth: () => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error: err } = await signUp(email, password);
      setLoading(false);
      if (err) { setError(err.message); return; }
      setSignupDone(true);
    } else {
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) { setError(err.message); return; }
      onAuth();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-md p-8" style={{ borderTop: '3px solid #4f6ef7' }}>
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>
            <span style={{ color: '#4f6ef7' }}>FAR</span> Study · USCPA
          </p>
          <p className="text-sm text-muted mt-1">Ivy League 학습법으로 FAR 합격</p>
        </div>

        {signupDone ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">✉️</p>
            <p className="font-semibold text-[#0f172a] mb-1">인증 이메일을 확인하세요</p>
            <p className="text-sm text-muted mb-4">{email}로 전송된 링크를 클릭하면 가입이 완료됩니다.</p>
            <button
              onClick={() => { setSignupDone(false); setMode('login'); }}
              className="text-sm font-medium"
              style={{ color: '#4f6ef7' }}
            >
              로그인하기 →
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1.5px solid #e2e8f0' }}>
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    background: mode === m ? '#4f6ef7' : 'white',
                    color: mode === m ? 'white' : '#64748b',
                  }}
                >
                  {m === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white outline-none"
                  style={{ border: '1.5px solid #e2e8f0' }}
                  placeholder="you@example.com"
                  onFocus={(e) => (e.target.style.borderColor = '#4f6ef7')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white outline-none"
                  style={{ border: '1.5px solid #e2e8f0' }}
                  placeholder={mode === 'signup' ? '6자 이상' : '비밀번호'}
                  onFocus={(e) => (e.target.style.borderColor = '#4f6ef7')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl text-sm" style={{ background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
                style={{ background: '#4f6ef7' }}
              >
                {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-[11px] text-muted mt-6">
          Active Recall · Spaced Repetition · Feynman · Interleaving
        </p>
      </div>
    </div>
  );
}
