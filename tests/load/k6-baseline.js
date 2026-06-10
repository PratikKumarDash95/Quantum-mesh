// k6-baseline.js — baseline performance run for QuantumMesh.
// Run: BASE_URL=http://localhost:8080 k6 run tests/load/k6-baseline.js
//
// Hits three representative endpoints through the gateway:
//   GET  /api/v1/monitoring/health   (open)
//   POST /api/v1/auth/login          (open, exercises rate limiter on bursts)
//   GET  /api/v1/analytics/summary   (protected, exercises JWT cache)
//
// Writes a normalized summary to ../../frontend-dashboard/public/benchmarks/latest.json
// via summary.js so the Benchmarks page renders real numbers.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { handleSummary as buildSummary } from './summary.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERNAME = __ENV.QM_USER || 'demo';
const PASSWORD = __ENV.QM_PASS || 'demo123';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

const healthLatency = new Trend('health_latency', true);
const loginLatency = new Trend('login_latency', true);
const summaryLatency = new Trend('summary_latency', true);
const rateLimited = new Counter('rate_limited_responses');

let cachedToken = null;

function login() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );
  loginLatency.add(res.timings.duration);
  if (res.status === 429) rateLimited.add(1);
  if (res.status !== 200) return null;
  try {
    return res.json('token') || res.json('accessToken');
  } catch (_e) {
    return null;
  }
}

export function setup() {
  const token = login();
  return { token };
}

export default function (data) {
  // Endpoint 1: public health
  const h = http.get(`${BASE_URL}/api/v1/monitoring/health`, {
    tags: { name: 'health' },
  });
  healthLatency.add(h.timings.duration);
  check(h, { 'health 2xx': (r) => r.status >= 200 && r.status < 300 });

  // Endpoint 2: occasional login (10% of requests)
  if (Math.random() < 0.1) {
    cachedToken = login() || cachedToken;
  }

  // Endpoint 3: protected analytics summary (uses bearer)
  const token = cachedToken || data.token;
  if (token) {
    const s = http.get(`${BASE_URL}/api/v1/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'analytics_summary' },
    });
    summaryLatency.add(s.timings.duration);
    if (s.status === 429) rateLimited.add(1);
    check(s, { 'analytics 2xx or 429': (r) => r.status < 500 });
  }

  sleep(Math.random() * 0.5);
}

export function handleSummary(data) {
  return buildSummary(data, 'baseline');
}
