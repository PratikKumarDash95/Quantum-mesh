import { useState } from 'react';
import { api } from '../api/client';

interface Prediction {
  service: string;
  predicted_rps: number;
  confidence: number;
  horizon_seconds: number;
}

export function AiPage() {
  const [service, setService] = useState('gateway-service');
  const [horizon, setHorizon] = useState(60);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function predict() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<Prediction>('/ai/predict', {
        service,
        horizon_seconds: horizon,
      });
      setPrediction(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'AI engine unreachable');
    } finally {
      setBusy(false);
    }
  }

  async function seed() {
    setBusy(true);
    setError(null);
    try {
      const now = Date.now();
      const points = Array.from({ length: 30 }).map((_, i) => ({
        service,
        timestamp: new Date(now - (29 - i) * 5_000).toISOString(),
        requests_per_second: 100 + i * 4 + Math.random() * 10,
        cpu_percent: 30 + i * 1.5,
        latency_ms: 50 + Math.random() * 20,
      }));
      await api.post('/ai/ingest/batch', points);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Seeding failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">AI Traffic Engine</h2>
      <p className="text-sm text-white/35 max-w-2xl leading-relaxed">
        The AI engine predicts near-future request load per service using a sliding-window
        linear regression. Seed the engine with synthetic samples, then ask it to forecast.
      </p>

      <div className="bg-[#0b1120] p-5 rounded-xl border border-white/5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
              Service
            </label>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              title="Service name"
              placeholder="gateway-service"
              className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
              Horizon (seconds)
            </label>
            <input
              type="number"
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              title="Horizon in seconds"
              placeholder="60"
              className="w-full bg-[#070d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00e599]/40 transition-colors"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={seed}
              className="flex-1 text-sm px-3 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-50 transition-colors"
            >
              Seed samples
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={predict}
              className="flex-1 text-sm px-3 py-2.5 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold disabled:opacity-50 transition-colors"
            >
              Predict
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2.5 border border-red-500/20">
            {error}
          </div>
        )}

        {prediction && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <ResultCard label="Predicted RPS" value={prediction.predicted_rps.toFixed(0)} accent />
            <ResultCard label="Confidence" value={`${(prediction.confidence * 100).toFixed(0)}%`} />
            <ResultCard label="Horizon" value={`${prediction.horizon_seconds}s`} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#070d1a] rounded-xl p-4 border border-white/5">
      <div className="text-[11px] uppercase tracking-wider text-white/30 font-semibold">{label}</div>
      <div className={`text-2xl font-bold mt-1.5 ${accent ? 'text-[#00e599]' : 'text-white'}`}>{value}</div>
    </div>
  );
}
