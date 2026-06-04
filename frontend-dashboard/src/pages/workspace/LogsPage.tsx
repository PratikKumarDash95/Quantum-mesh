import { useEffect, useMemo, useState } from 'react';
import { workspaceApi } from '../../api/workspace';
import { RequestLogView } from '../../api/types';

export function LogsPage() {
  const [rows, setRows] = useState<RequestLogView[]>([]);
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      const data = await workspaceApi.logs({
        limit: 200,
        status: status || undefined,
        service: service || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, service]);

  const services = useMemo(() => {
    const s = new Set(rows.map((r) => r.downstreamService));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.path.toLowerCase().includes(q) ||
        r.downstreamService.toLowerCase().includes(q) ||
        String(r.statusCode).includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-1">
          § LOGS
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Request logs</h2>
        <p className="text-sm text-white/40 mt-2 max-w-xl">
          Every API call through the gateway, with downstream service and latency.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by path, service, or status…"
          title="Search"
          className="flex-1 min-w-[260px] bg-[#0b1120] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00e599]/40"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          title="Status filter"
          className="bg-[#0b1120] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40"
        >
          <option value="">All status</option>
          <option value="2xx">2xx</option>
          <option value="4xx">4xx</option>
          <option value="5xx">5xx</option>
        </select>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          title="Service filter"
          className="bg-[#0b1120] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40"
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0b1120] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <Th>Time</Th>
              <Th>Method</Th>
              <Th>Service</Th>
              <Th>Path</Th>
              <Th align="right">Cost</Th>
              <Th align="right">Latency</Th>
              <Th align="right">Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3 text-xs text-white/40 whitespace-nowrap">
                  {new Date(r.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3">
                  <MethodBadge method={r.method} />
                </td>
                <td className="px-5 py-3 font-medium text-white/80">{r.downstreamService}</td>
                <td className="px-5 py-3 text-white/50 text-xs font-mono truncate max-w-[280px]">
                  {r.path}
                </td>
                <td className="px-5 py-3 text-right text-white/60">
                  ${(r.costMicros / 1_000_000).toFixed(4)}
                </td>
                <td className="px-5 py-3 text-right text-white/60">
                  {r.latencyMs < 1000
                    ? `${r.latencyMs}ms`
                    : `${(r.latencyMs / 1000).toFixed(1)}s`}
                </td>
                <td className="px-5 py-3 text-right">
                  <StatusBadge code={r.statusCode} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-white/20 text-sm">
                  No requests match. Hit the API with a key, then come back.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th
      className={`px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function MethodBadge({ method }: { method: string }) {
  const m = method.toUpperCase();
  const style =
    m === 'GET'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : m === 'POST'
      ? 'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20'
      : m === 'PUT' || m === 'PATCH'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : m === 'DELETE'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-white/5 text-white/40 border-white/10';
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ${style}`}
    >
      {m}
    </span>
  );
}

function StatusBadge({ code }: { code: number }) {
  const style =
    code >= 200 && code < 300
      ? 'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20'
      : code >= 400 && code < 500
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : code >= 500
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-white/5 text-white/40 border-white/10';
  return (
    <span
      className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ${style}`}
    >
      {code || '—'}
    </span>
  );
}
