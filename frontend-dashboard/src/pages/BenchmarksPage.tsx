import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface Trend {
  avg: number;
  min: number;
  med: number;
  max: number;
  p90: number;
  p95: number;
  p99: number;
}

interface BenchmarkJson {
  scenario: string;
  generatedAt: string;
  target: string;
  durationSeconds: number;
  totalRequests: number;
  requestsPerSecond: number;
  errorRatePercent: number;
  httpReqDuration: Trend | null;
  iterationDuration: Trend | null;
  perEndpoint: Record<string, Trend | null>;
  rateLimited: number;
  rateLimitedRatio: number;
}

const PLACEHOLDER: BenchmarkJson = {
  scenario: 'placeholder',
  generatedAt: '',
  target: 'not yet run',
  durationSeconds: 0,
  totalRequests: 0,
  requestsPerSecond: 0,
  errorRatePercent: 0,
  httpReqDuration: null,
  iterationDuration: null,
  perEndpoint: {},
  rateLimited: 0,
  rateLimitedRatio: 0,
};

const AI_ROUTING_COMPARISON = [
  { phase: 'Round-robin', p95: 120, p99: 240 },
  { phase: 'AI-weighted', p95: 42, p99: 95 },
];

const TOOLTIP_STYLE = { background: '#0b1120', border: '1px solid #ffffff10', borderRadius: 8 };
const TICK_STYLE = { fill: '#ffffff30', fontSize: 11 };
const GRID_STROKE = '#ffffff08';
const AXIS_STROKE = '#ffffff15';

export function BenchmarksPage() {
  const [data, setData] = useState<BenchmarkJson>(PLACEHOLDER);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/benchmarks/latest.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: BenchmarkJson) => setData(j))
      .catch((e) => setError(e.message));
  }, []);

  const hasRealData = data.scenario !== 'placeholder' && data.totalRequests > 0;

  const percentileData = data.httpReqDuration
    ? [
        { name: 'p50', ms: data.httpReqDuration.med },
        { name: 'p90', ms: data.httpReqDuration.p90 },
        { name: 'p95', ms: data.httpReqDuration.p95 },
        { name: 'p99', ms: data.httpReqDuration.p99 },
        { name: 'max', ms: data.httpReqDuration.max },
      ]
    : [];

  const endpointData = Object.entries(data.perEndpoint || {})
    .filter(([, t]) => t)
    .map(([name, t]) => ({ name, p50: t!.med, p95: t!.p95, p99: t!.p99 }));

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Benchmarks</h2>
        <div className="text-xs text-white/25">
          {hasRealData ? (
            <>
              Scenario <span className="text-white/60">{data.scenario}</span> against{' '}
              <span className="text-white/60">{data.target}</span> &middot;{' '}
              {new Date(data.generatedAt).toLocaleString()}
            </>
          ) : (
            <>No k6 run yet &middot; see <code className="text-white/40">tests/load/README.md</code></>
          )}
        </div>
      </div>

      {!hasRealData && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 px-4 py-3 text-sm">
          No benchmark data yet. Run{' '}
          <code className="font-mono text-amber-300">./tests/load/run.sh baseline</code> against the
          gateway to populate this page with real numbers.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 px-4 py-3 text-sm">
          Could not load benchmarks: {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Throughput" value={hasRealData ? data.requestsPerSecond.toFixed(0) : '—'} suffix={hasRealData ? ' rps' : ''} measured={hasRealData} />
        <StatCard label="p95 latency" value={data.httpReqDuration ? data.httpReqDuration.p95.toFixed(0) : '—'} suffix={data.httpReqDuration ? ' ms' : ''} measured={hasRealData} />
        <StatCard label="Error rate" value={hasRealData ? data.errorRatePercent.toFixed(2) : '—'} suffix={hasRealData ? ' %' : ''} tone={data.errorRatePercent < 1 ? 'good' : data.errorRatePercent < 5 ? 'warn' : 'bad'} measured={hasRealData} />
        <StatCard label="Rate limited" value={hasRealData ? data.rateLimited.toString() : '—'} suffix={hasRealData ? ' resp' : ''} measured={hasRealData} />
      </div>

      <Panel title="Latency distribution (measured)" badge={hasRealData ? 'real' : 'no data'}>
        {percentileData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={percentileData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" stroke={AXIS_STROKE} tick={TICK_STYLE} />
              <YAxis stroke={AXIS_STROKE} tick={TICK_STYLE} label={{ value: 'ms', position: 'insideLeft', fill: '#ffffff30' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="ms" fill="#00e599" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </Panel>

      <Panel title="Per-endpoint p50 / p95 / p99 (measured)" badge={endpointData.length ? 'real' : 'no data'}>
        {endpointData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={endpointData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" stroke={AXIS_STROKE} tick={TICK_STYLE} />
              <YAxis stroke={AXIS_STROKE} tick={TICK_STYLE} label={{ value: 'ms', position: 'insideLeft', fill: '#ffffff30' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: '#ffffff50', fontSize: 12 }} />
              <Bar dataKey="p50" fill="#00e599" radius={[3, 3, 0, 0]} />
              <Bar dataKey="p95" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="p99" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </Panel>

      <Panel title="AI-weighted routing vs round-robin" badge="representative" badgeTone="warn" subtitle="Synthetic numbers — switch routing mode and re-run k6 to replace with measured values.">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={AI_ROUTING_COMPARISON}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="phase" stroke={AXIS_STROKE} tick={TICK_STYLE} />
            <YAxis stroke={AXIS_STROKE} tick={TICK_STYLE} label={{ value: 'ms', position: 'insideLeft', fill: '#ffffff30' }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: '#ffffff50', fontSize: 12 }} />
            <Bar dataKey="p95" name="p95 latency" radius={[3, 3, 0, 0]}>
              {AI_ROUTING_COMPARISON.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#1e2d45' : '#00e599'} />
              ))}
            </Bar>
            <Bar dataKey="p99" name="p99 latency" radius={[3, 3, 0, 0]}>
              {AI_ROUTING_COMPARISON.map((_, i) => (
                <Cell key={i} fill={i === 0 ? '#253650' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Reproduce">
        <pre className="text-xs bg-[#070d1a] border border-white/5 rounded-lg p-4 overflow-x-auto text-white/40 leading-relaxed">
{`# 1. Start the stack
docker-compose up -d

# 2. Wait ~60s for services to become healthy
# 3. Run baseline (writes public/benchmarks/latest.json)
BASE_URL=http://localhost:8080 ./tests/load/run.sh baseline

# 4. Confirm rate limiter trips under burst
BASE_URL=http://localhost:8080 ./tests/load/run.sh burst

# 5. Reload this page`}
        </pre>
      </Panel>
    </div>
  );
}

function StatCard({ label, value, suffix, tone, measured }: {
  label: string; value: string; suffix?: string; tone?: 'good' | 'warn' | 'bad'; measured?: boolean;
}) {
  const toneClass = tone === 'good' ? 'text-[#00e599]' : tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-red-400' : 'text-white';
  return (
    <div className="bg-[#0b1120] rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">{label}</div>
        {measured !== undefined && (
          <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${measured ? 'bg-[#00e599]/10 text-[#00e599]' : 'bg-white/5 text-white/20'}`}>
            {measured ? 'real' : 'n/a'}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${toneClass}`}>
        {value}
        {suffix && <span className="text-sm text-white/30 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, badge, badgeTone, children }: {
  title: string; subtitle?: string; badge?: string; badgeTone?: 'warn'; children: React.ReactNode;
}) {
  const badgeClass = badgeTone === 'warn'
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : badge === 'real'
    ? 'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/20'
    : 'bg-white/5 text-white/30 border-white/10';
  return (
    <div className="bg-[#0b1120] rounded-xl p-5 border border-white/5">
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-white/60">{title}</h3>
          {subtitle && <div className="text-xs text-white/25 mt-0.5">{subtitle}</div>}
        </div>
        {badge && (
          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-white/20 text-sm">
      No data — run a k6 scenario first.
    </div>
  );
}
