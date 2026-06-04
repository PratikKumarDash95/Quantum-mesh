import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

function initialsOf(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ProfilePage() {
  const { username, roles, logout } = useAuth();
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav('/');
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-1">
          § Account
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-sm text-white/40 mt-2">
          Your account details and session.
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0b1120] p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[#00e599]/15 border border-[#00e599]/30 flex items-center justify-center text-2xl font-extrabold text-[#00e599]">
          {initialsOf(username)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold">{username ?? 'Anonymous'}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {roles.length === 0 ? (
              <span className="text-xs text-white/30">No roles</span>
            ) : (
              roles.map((r) => (
                <span
                  key={r}
                  className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border bg-white/5 text-white/60 border-white/10"
                >
                  {r}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0b1120] divide-y divide-white/5">
        <Row label="Username" value={username ?? '—'} />
        <Row label="Roles" value={roles.join(', ') || '—'} />
        <Row
          label="Workspace"
          value={
            <button
              type="button"
              onClick={() => nav('/workspace/api-keys')}
              className="text-[#00e599] hover:underline"
            >
              Manage API keys →
            </button>
          }
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-white/35 font-semibold">
        {label}
      </span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}
