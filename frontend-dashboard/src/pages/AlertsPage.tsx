import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Alert } from '../api/types';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/notifications/alerts?limit=100');
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function pushDemo() {
    setBusy(true);
    try {
      await api.post('/notifications/alerts', {
        service: 'gateway-service',
        severity: 'WARN',
        message: 'High latency spike detected in last 60s',
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <button
          type="button"
          onClick={pushDemo}
          disabled={busy}
          className="text-xs px-4 py-2 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold disabled:opacity-50 transition-colors"
        >
          Trigger demo alert
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((a, idx) => (
          <div
            key={a.id ?? idx}
            className="flex items-start gap-4 bg-[#0b1120] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
          >
            <SeverityBadge severity={a.severity} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white/90">{a.service}</div>
              <div className="text-sm text-white/50 mt-0.5">{a.message}</div>
            </div>
            <div className="text-xs text-white/25 flex-shrink-0">
              {new Date(a.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center text-white/20 py-16 text-sm bg-[#0b1120] rounded-xl border border-white/5">
            No alerts yet. System is running clean.
          </div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const sev = severity.toUpperCase();
  const style =
    sev === 'CRITICAL'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : sev === 'WARN' || sev === 'WARNING'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-white/5 text-white/40 border-white/10';
  return (
    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border flex-shrink-0 ${style}`}>
      {sev}
    </span>
  );
}
