import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, register, token } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (token) nav('/dashboard', { replace: true });
  }, [token, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      nav('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00e599]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-[#00e599] text-2xl leading-none">⬡</span>
            <span className="text-xl font-bold tracking-tight">QuantumMesh</span>
          </div>
          <p className="text-sm text-white/35 mt-1">
            {mode === 'login' ? 'Sign in to the control plane' : 'Create your account'}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-[#0b1120] border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                title="Username"
                placeholder="admin"
                className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e599]/50 transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  title="Email"
                  placeholder="you@example.com"
                  className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e599]/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                title="Password"
                placeholder="••••••••"
                className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e599]/50 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="mt-5 w-full bg-[#00e599] hover:bg-[#00d488] active:bg-[#00c47a] disabled:opacity-50 text-black font-bold rounded-lg py-2.5 text-sm transition-colors"
          >
            {busy ? 'Signing in…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="mt-3 w-full text-xs text-white/25 hover:text-white/50 transition-colors py-1"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>

          <p className="text-[11px] text-white/15 text-center mt-4">
            Default admin:{' '}
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/30">admin / admin123</code>
          </p>
        </form>
      </div>
    </div>
  );
}
