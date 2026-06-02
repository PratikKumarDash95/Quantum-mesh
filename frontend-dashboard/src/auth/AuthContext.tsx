import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';
import { AuthResponse } from '../api/types';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  roles: string[];
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('quantummesh.token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('quantummesh.user'));
  const [roles, setRoles] = useState<string[]>(() => {
    const raw = localStorage.getItem('quantummesh.roles');
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    if (token) localStorage.setItem('quantummesh.token', token);
    else localStorage.removeItem('quantummesh.token');
  }, [token]);

  async function login(usernameInput: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      username: usernameInput,
      password,
    });
    persist(data);
  }

  async function register(usernameInput: string, email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      username: usernameInput,
      email,
      password,
    });
    persist(data);
  }

  function persist(data: AuthResponse) {
    setToken(data.accessToken);
    setUsername(data.username);
    setRoles(data.roles);
    localStorage.setItem('quantummesh.token', data.accessToken);
    localStorage.setItem('quantummesh.refresh', data.refreshToken);
    localStorage.setItem('quantummesh.user', data.username);
    localStorage.setItem('quantummesh.roles', JSON.stringify(data.roles));
  }

  function logout() {
    const refresh = localStorage.getItem('quantummesh.refresh');
    if (refresh) {
      api.post('/auth/logout', {}).catch(() => undefined);
    }
    setToken(null);
    setUsername(null);
    setRoles([]);
    localStorage.removeItem('quantummesh.token');
    localStorage.removeItem('quantummesh.refresh');
    localStorage.removeItem('quantummesh.user');
    localStorage.removeItem('quantummesh.roles');
  }

  return (
    <AuthContext.Provider value={{ token, username, roles, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
