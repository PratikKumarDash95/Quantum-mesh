import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { MetricSample, AnalyticsRow } from '../api/types';

interface SeriesPoint {
  t: number;
  cpu: number;
  rps: number;
  latency: number;
}

export function OverviewPage() {
  const [latest, setLatest] = useState<Record<string, MetricSample>>({});
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, AnalyticsRow>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [m, a] = await Promise.allSettled([
          api.get('/monitoring/latest'),
          api.get('/analytics/summary'),
        ]);
        if (!active) return;
        const mData =
          m.status === 'fulfilled' && m.value.data && typeof m.value.data === 'object'
            ? m.value.data
            : {};
        const aData =
          a.status === 'fulfilled' && a.value.data && typeof a.value.data === 'object'
            ? a.value.data
            : {};
        setLatest(mData);
        setAnalytics(aData);

        const avg = Object.values(mData) as MetricSample[];
        if (avg.length) {
          const cpu = avg.reduce((s, x) => s + x.cpuPercent, 0) / avg.length;
          const rps = avg.reduce((s, x) => s + x.requestsPerSecond, 0);
          const latency = avg.reduce((s, x) => s + x.latencyMillis, 0) / avg.length;
          setSeries((prev) => {
            const next = [...prev, { t: Date.now(), cpu, rps, latency }];
            return next.slice(-30);
          });
        }
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const serviceCount = Object.keys(latest).length;
  const latestValues = Object.values(latest);
  const totalRps = latestValues.reduce((s, x) => s + (x?.requestsPerSecond ?? 0), 0);
  const avgErr =
    serviceCount === 0
      ? 0
      : latestValues.reduce((s, x) => s + (x?.errorRatePercent ?? 0), 0) / serviceCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Cluster Overview</h2>
        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Services" value={serviceCount.toString()} />
        <StatCard label="Total RPS" value={totalRps.toFixed(0)} />
        <StatCard label="Avg Error %" value={avgErr.toFixed(2)} />
        <StatCard
          label="Health"
          value={avgErr < 2 ? 'Healthy' : avgErr < 5 ? 'Degraded' : 'Critical'}
          tone={avgErr < 2 ? 'good' : avgErr < 5 ? 'warn' : 'bad'}
        />
      </div>

      <Panel title="Cluster CPU / Latency (live)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis
              dataKey="t"
              tickFormatter={(t) => new Date(t).toLocaleTimeString().slice(0, 5)}
              stroke="#ffffff20"
              tick={{ fill: '#ffffff30', fontSize: 11 }}
            />
            <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff30', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0b1120', border: '1px solid #ffffff10', borderRadius: 8 }}
              labelStyle={{ color: '#ffffff50' }}
              labelFormatter={(t) => new Date(t as number).toLocaleTimeString()}
            />
            <Legend wrapperStyle={{ color: '#ffffff50', fontSize: 12 }} />
            <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#00e599" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="latency" name="Latency ms" stroke="#f59e0b" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Requests per service (live)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={Object.entries(analytics).map(([svc, row]) => ({
              service: svc,
              requests: row.requests,
              errors: row.errors,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="service" stroke="#ffffff20" tick={{ fill: '#ffffff30', fontSize: 11 }} />
            <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff30', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0b1120', border: '1px solid #ffffff10', borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ color: '#ffffff50', fontSize: 12 }} />
            <Bar dataKey="requests" fill="#00e599" radius={[3, 3, 0, 0]} />
            <Bar dataKey="errors" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-[#00e599]'
      : tone === 'warn'
      ? 'text-amber-400'
      : tone === 'bad'
      ? 'text-red-400'
      : 'text-white';
  return (
    <div className="bg-[#0b1120] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="text-[11px] uppercase tracking-wider text-white/30 font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 ${toneClass}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0b1120] rounded-xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold mb-4 text-white/50">{title}</h3>
      {children}
    </div>
  );
}
