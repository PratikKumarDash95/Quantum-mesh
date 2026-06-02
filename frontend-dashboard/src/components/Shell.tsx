import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReactNode } from 'react';

function initialsOf(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const TOP_NAV = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/services', label: 'Services' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/ai', label: 'AI Engine' },
  { to: '/benchmarks', label: 'Benchmarks' },
];

const WORKSPACE_NAV = [
  { to: '/workspace/api-keys', label: 'API Keys', icon: '⌗' },
  { to: '/workspace/usage', label: 'Usage', icon: '◔' },
  { to: '/workspace/logs', label: 'Logs', icon: '≡' },
  { to: '/workspace/billing', label: 'Billing', icon: '◫' },
];

export function Shell({ children }: { children: ReactNode }) {
  const { username, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  function handleLogout() {
    logout();
    nav('/');
  }

  const isWorkspaceRoute = loc.pathname.startsWith('/workspace');
  const initials = initialsOf(username);
  const onProfile = loc.pathname === '/profile';

  return (
    <div className="min-h-screen flex flex-col bg-[#070d1a]">
      <header className="border-b border-white/5 bg-[#070d1a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#00e599] text-xl leading-none">⬡</span>
            <h1 className="text-base font-bold tracking-tight">QuantumMesh</h1>
            <span className="text-xs text-white/20 ml-1 hidden sm:inline">
              Intelligent API Gateway &amp; Service Mesh
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              title={username ? `Signed in as ${username}` : 'Profile'}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors ${
                onProfile
                  ? 'bg-[#00e599] text-black ring-2 ring-[#00e599]/40'
                  : 'bg-[#00e599]/15 text-[#00e599] border border-[#00e599]/30 hover:bg-[#00e599]/25'
              }`}
            >
              {initials}
            </Link>
            <span className="text-xs text-white/40 hidden sm:inline">{username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="max-w-[1400px] mx-auto px-6 flex gap-1 text-sm">
          {TOP_NAV.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2.5 font-medium transition-colors border-b-2 ${
                  active
                    ? 'border-[#00e599] text-white'
                    : 'border-transparent text-white/35 hover:text-white/70'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            to="/workspace/api-keys"
            className={`px-3 py-2.5 font-medium transition-colors border-b-2 ${
              isWorkspaceRoute
                ? 'border-[#00e599] text-white'
                : 'border-transparent text-white/35 hover:text-white/70'
            }`}
          >
            Workspace
          </Link>
        </nav>
      </header>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {isWorkspaceRoute && (
          <aside className="w-56 shrink-0 border-r border-white/5 py-6 px-3">
            <div className="text-[10px] uppercase tracking-widest text-white/25 font-semibold px-3 mb-3">
              Workspace
            </div>
            <nav className="flex flex-col gap-0.5">
              {WORKSPACE_NAV.map((n) => {
                const active = loc.pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-white/[0.06] text-white font-semibold'
                        : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`text-base leading-none ${
                        active ? 'text-[#00e599]' : 'text-white/30'
                      }`}
                    >
                      {n.icon}
                    </span>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}
        <main className="flex-1 w-full px-6 py-8 min-w-0">{children}</main>
      </div>

      <footer className="border-t border-white/5 text-center text-xs text-white/15 py-4">
        QuantumMesh &copy; {new Date().getFullYear()} &mdash; Distributed Platform Engineering
      </footer>
    </div>
  );
}
