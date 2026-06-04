import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { MetricSample } from '../api/types';

export function ServicesPage() {
  const [latest, setLatest] = useState<Record<string, MetricSample>>({});

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/monitoring/latest');
        setLatest(data && typeof data === 'object' ? data : {});
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Service Mesh</h2>
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
          Live
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0b1120]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Service</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">CPU %</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Memory %</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Latency ms</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">RPS</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Error %</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(latest).map((m) => (
              <tr
                key={m.service}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]" />
                    {m.service}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right text-white/60">{(m.cpuPercent ?? 0).toFixed(1)}</td>
                <td className="px-5 py-3.5 text-right text-white/60">{(m.memoryPercent ?? 0).toFixed(1)}</td>
                <td className="px-5 py-3.5 text-right text-white/60">{(m.latencyMillis ?? 0).toFixed(0)}</td>
                <td className="px-5 py-3.5 text-right text-white/60">{m.requestsPerSecond ?? 0}</td>
                <td className={`px-5 py-3.5 text-right font-medium ${
                  (m.errorRatePercent ?? 0) > 5 ? 'text-red-400' : (m.errorRatePercent ?? 0) > 2 ? 'text-amber-400' : 'text-[#00e599]'
                }`}>
                  {(m.errorRatePercent ?? 0).toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right text-white/25 text-xs">
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
            {Object.keys(latest).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-white/20 text-sm">
                  No services reporting yet — monitoring service may not be running.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
