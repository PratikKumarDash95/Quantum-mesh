// summary.js — k6 handleSummary helper.
// Normalizes k6's raw metrics into a JSON shape the Benchmarks page consumes.
// Writes to ../../frontend-dashboard/public/benchmarks/<scenario>.json AND
// updates ../../frontend-dashboard/public/benchmarks/latest.json so the page
// always picks up the most recent run.

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

function num(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
}

function metricToTrend(m) {
  if (!m || !m.values) return null;
  return {
    avg: num(m.values.avg),
    min: num(m.values.min),
    med: num(m.values['med']),
    max: num(m.values.max),
    p90: num(m.values['p(90)']),
    p95: num(m.values['p(95)']),
    p99: num(m.values['p(99)']),
  };
}

export function handleSummary(data, scenario = 'baseline') {
  const m = data.metrics || {};
  const httpReqDuration = metricToTrend(m.http_req_duration);
  const iterationDuration = metricToTrend(m.iteration_duration);
  const requests = m.http_reqs ? num(m.http_reqs.values.count) : 0;
  const duration = data.state && data.state.testRunDurationMs
    ? data.state.testRunDurationMs / 1000
    : 0;
  const rps = duration > 0 ? num(requests / duration) : 0;
  const errorRate = m.http_req_failed
    ? num((m.http_req_failed.values.rate || 0) * 100)
    : 0;

  const perEndpoint = {};
  for (const key of Object.keys(m)) {
    if (key.endsWith('_latency')) {
      perEndpoint[key.replace(/_latency$/, '')] = metricToTrend(m[key]);
    }
  }

  const result = {
    scenario,
    generatedAt: new Date().toISOString(),
    target: __ENV.BASE_URL || 'http://localhost:8080',
    durationSeconds: num(duration),
    totalRequests: requests,
    requestsPerSecond: rps,
    errorRatePercent: errorRate,
    httpReqDuration,
    iterationDuration,
    perEndpoint,
    rateLimited: m.rate_limited_responses
      ? num(m.rate_limited_responses.values.count)
      : (m.rate_limited_count ? num(m.rate_limited_count.values.count) : 0),
    rateLimitedRatio: m.rate_limited_ratio
      ? num((m.rate_limited_ratio.values.rate || 0) * 100)
      : 0,
  };

  const out = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
  out[`../../frontend-dashboard/public/benchmarks/${scenario}.json`] = JSON.stringify(result, null, 2);
  out['../../frontend-dashboard/public/benchmarks/latest.json'] = JSON.stringify(result, null, 2);
  return out;
}
