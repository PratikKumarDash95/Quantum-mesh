import { api } from './client';
import {
  ApiKey,
  ApiKeyCreatedResponse,
  RequestLogView,
  UsageSummary,
} from './types';

export const workspaceApi = {
  listKeys: () => api.get<ApiKey[]>('/auth/api-keys').then((r) => r.data),

  createKey: (name: string, tier: string, ttlDays?: number) =>
    api
      .post<ApiKeyCreatedResponse>('/auth/api-keys', { name, tier, ttlDays })
      .then((r) => r.data),

  revokeKey: (id: number) => api.delete(`/auth/api-keys/${id}`).then((r) => r.data),

  summary: () => api.get<UsageSummary>('/usage/me').then((r) => r.data),

  logs: (params: { limit?: number; status?: string; service?: string } = {}) =>
    api
      .get<RequestLogView[]>('/usage/me/logs', { params })
      .then((r) => r.data),
};
