import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quantummesh.token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = !!err.config?.headers?.Authorization;
      if (hadToken) {
        localStorage.removeItem('quantummesh.token');
        localStorage.removeItem('quantummesh.refresh');
        localStorage.removeItem('quantummesh.user');
        localStorage.removeItem('quantummesh.roles');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);
