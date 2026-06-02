export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  roles: string[];
}

export interface MetricSample {
  service: string;
  instanceId: string;
  cpuPercent: number;
  memoryPercent: number;
  latencyMillis: number;
  requestsPerSecond: number;
  errorRatePercent: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  service: string;
  severity: string;
  message: string;
  timestamp: string;
}

export interface AnalyticsRow {
  requests: number;
  errors: number;
  errorRatePercent: number;
  avgLatencyMillis: number;
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  tier: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revoked: boolean;
  createdAt: string;
}

export interface ApiKeyCreatedResponse {
  meta: ApiKey;
  plaintextKey: string;
}

export interface RequestLogView {
  id: number;
  method: string;
  path: string;
  downstreamService: string;
  apiKeyPrefix: string | null;
  statusCode: number;
  latencyMs: number;
  costMicros: number;
  timestamp: string;
}

export interface UsageBucket {
  bucket: string;
  requests: number;
  costUsd: number;
}

export interface UsageSummary {
  todayCostUsd: number;
  monthCostUsd: number;
  todayRequests: number;
  monthRequests: number;
  requestsByService: Record<string, number>;
  timeseries: UsageBucket[];
}
