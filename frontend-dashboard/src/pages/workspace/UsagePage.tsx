import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { workspaceApi } from '../../api/workspace';
import { UsageSummary } from '../../api/types';

const EMPTY: UsageSummary = {
  todayCostUsd: 0,
  monthCostUsd: 0,
  todayRequests: 0,
  monthRequests: 0,
  requestsByService: {},
  timeseries: [],
};

export function UsagePage() {
  const [summary, setSummary] = useState<UsageSummary>(EMPTY);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const s = await workspaceApi.summary();
        if (!active) return;
        setSummary({
          todayCostUsd: s.todayCostUsd ?? 0,
          monthCostUsd: s.monthCostUsd ?? 0,
          todayRequests: s.todayRequests ?? 0,
          monthRequests: s.monthRequests ?? 0,
          requestsByService:
            s.requestsByService && typeof s.requestsByService === 'object'
              ? s.requestsByService
              : {},
          timeseries: Array.isArray(s.timeseries) ? s.timeseries : [],
        });
      } catch {
        /* ignore */
      }
    }
    load();
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const seriesData = summary.timeseries.map((b) => ({
    t: new Date(b.bucket).getTime(),
    requests: b.requests,
    cost: b.costUsd,
  }));

  const serviceData = Object.entries(summary.requestsByService).map(([service, count]) => ({
    service,
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-white/30 font-semibold mb-1">
          § USAGE
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Usage</h2>
        <p className="text-sm text-white/40 mt-2 max-w-xl">
          Cost and request volume across your API keys. Updated every 10 seconds.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Today" value={`$${summary.todayCostUsd.toFixed(2)}`} accent />
        <Stat label="This month" value={`$${summary.monthCostUsd.toFixed(2)}`} />
        <Stat label="Requests today" value={summary.todayRequests.toLocaleString()} />
        <Stat label="Requests this month" value={summary.monthRequests.toLocaleString()} />
      </div>

      <Panel title="Requests / hour (last 24h)">
        {seriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={seriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="t"
                tickFormatter={(t) =>
                  new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                stroke="#ffffff20"
                tick={{ fill: '#ffffff30', fontSize: 11 }}
              />
              <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff30', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#0b1120',
                  border: '1px solid #ffffff10',
                  borderRadius: 8,
                }}
                labelFormatter={(t) => new Date(t as number).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#00e599"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty>No traffic in the last 24 hours.</Empty>
        )}
      </Panel>

      <Panel title="Requests by downstream service (this month)">
        {serviceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="service"
                stroke="#ffffff20"
                tick={{ fill: '#ffffff30', fontSize: 11 }}
              />
              <YAxis stroke="#ffffff20" tick={{ fill: '#ffffff30', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#0b1120',
                  border: '1px solid #ffffff10',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="#00e599" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty>No service hits yet this month.</Empty>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#0b1120] rounded-xl p-4 border border-white/5">
      <div className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 ${accent ? 'text-[#00e599]' : 'text-white'}`}>
        {value}
      </div>
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">
      {children}
    </div>
  );
}
