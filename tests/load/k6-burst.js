// k6-burst.js — burst test to confirm the gateway rate limiter trips.
// Run: BASE_URL=http://localhost:8080 k6 run tests/load/k6-burst.js
//
// 500 VUs hammer /api/v1/auth/login for ~10 seconds. We expect a significant
// fraction of responses to be 429 once the FREE tier token bucket drains.

import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { handleSummary as buildSummary } from './summary.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    burst: {
      executor: 'constant-vus',
      vus: 500,
      duration: '10s',
    },
  },
  thresholds: {
    rate_limited_ratio: ['rate>0.1'],
  },
};

const rateLimitedRatio = new Rate('rate_limited_ratio');
const rateLimitedCount = new Counter('rate_limited_count');

export default function () {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username: 'burst', password: 'burst' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'burst_login' } }
  );

  const is429 = res.status === 429;
  rateLimitedRatio.add(is429);
  if (is429) rateLimitedCount.add(1);

  check(res, {
    'received response': (r) => r.status > 0,
    'not 5xx': (r) => r.status < 500,
  });
}

export function handleSummary(data) {
  return buildSummary(data, 'burst');
}
