import { useEffect, useState } from 'react';
import { workspaceApi } from '../../api/workspace';
import { ApiKey, ApiKeyCreatedResponse } from '../../api/types';

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [reveal, setReveal] = useState<ApiKeyCreatedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await workspaceApi.listKeys();
      setKeys(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to load keys');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRevoke(id: number) {
    if (!window.confirm('Revoke this key? Any service using it will lose access.')) return;
    try {
      await workspaceApi.revokeKey(id);
      await load();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Revoke failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-1">
            § API
          </div>
          <h2 className="text-2xl font-bold tracking-tight">API keys</h2>
          <p className="text-sm text-white/40 mt-2 max-w-xl">
            Use a secret key to authenticate API requests. Never expose your key in client-side
            code.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="text-xs px-4 py-2 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold transition-colors"
        >
          + Create key
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/5 bg-[#0b1120] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <Th>Name</Th>
              <Th>Secret</Th>
              <Th>Tier</Th>
              <Th>Created</Th>
              <Th>Last used</Th>
              <Th>Status</Th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr
                key={k.id}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3.5 font-semibold text-white/90">{k.name}</td>
                <td className="px-5 py-3.5">
                  <code className="bg-white/5 px-2 py-1 rounded text-xs text-white/60 font-mono">
                    {k.prefix}…
                  </code>
                </td>
                <td className="px-5 py-3.5">
                  <TierBadge tier={k.tier} />
                </td>
                <td className="px-5 py-3.5 text-white/50 text-xs">
                  {new Date(k.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3.5 text-white/40 text-xs">
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  {k.revoked ? (
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border bg-white/5 text-white/30 border-white/10">
                      Revoked
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!k.revoked && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      className="text-xs text-white/40 hover:text-red-400 font-semibold transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-white/20 text-sm">
                  No API keys yet. Click "+ Create key" to mint your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(res) => {
            setShowCreate(false);
            setReveal(res);
            load();
          }}
        />
      )}

      {reveal && <RevealModal data={reveal} onClose={() => setReveal(null)} />}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">
      {children}
    </th>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const t = tier.toUpperCase();
  const style =
    t === 'ADMIN'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : t === 'PREMIUM'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-white/5 text-white/40 border-white/10';
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ${style}`}
    >
      {t}
    </span>
  );
}

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (res: ApiKeyCreatedResponse) => void;
}) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('FREE');
  const [ttlDays, setTtlDays] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await workspaceApi.createKey(
        name || 'unnamed-key',
        tier,
        ttlDays ? Number(ttlDays) : undefined,
      );
      onCreated(res);
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message || 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <form
        onSubmit={submit}
        className="bg-[#0b1120] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <h3 className="text-lg font-bold mb-4">Create API key</h3>
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="prod-pipeline"
              title="Key name"
              className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40"
            />
          </Field>
          <Field label="Tier">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              title="Tier"
              className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40"
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM (admin only)</option>
              <option value="ADMIN">ADMIN (admin only)</option>
            </select>
          </Field>
          <Field label="TTL (days, optional)">
            <input
              type="number"
              min={1}
              value={ttlDays}
              onChange={(e) => setTtlDays(e.target.value)}
              placeholder="never expires"
              title="TTL days"
              className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40"
            />
          </Field>
        </div>
        {err && (
          <div className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold disabled:opacity-50 transition-colors"
          >
            {busy ? 'Creating…' : 'Create key'}
          </button>
        </div>
      </form>
    </Backdrop>
  );
}

function RevealModal({
  data,
  onClose,
}: {
  data: ApiKeyCreatedResponse;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.plaintextKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <Backdrop onClose={onClose}>
      <div className="bg-[#0b1120] border border-[#00e599]/20 rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-bold mb-1">Your new API key</h3>
        <p className="text-sm text-amber-400/90 mb-4">
          Copy it now — it will not be shown again.
        </p>
        <div className="bg-[#070d1a] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-[#00e599] break-all">
          {data.plaintextKey}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={copy}
            className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
