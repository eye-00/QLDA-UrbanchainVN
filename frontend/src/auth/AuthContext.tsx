import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, setAuthTokenProvider } from '../lib/api';
import { clearStoredToken, getStoredToken, storeToken } from './authStorage';
import { UserRole } from './roles';

export type AuthUser = {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithVneidMock: (identityNumber?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setAuthTokenProvider(() => getStoredToken());
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiGet<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setLoading(false));
  }, [clearSession, token]);

  async function login(email: string, password: string) {
    const data = await apiPost<LoginResponse>('/auth/login', { email, password });
    storeToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  async function loginWithVneidMock(identityNumber?: string) {
    const data = await apiPost<LoginResponse>('/auth/vneid/mock', { identityNumber });
    storeToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, loginWithVneidMock, logout: clearSession }),
    [clearSession, loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
