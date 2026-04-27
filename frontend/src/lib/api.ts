const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
let authTokenProvider: (() => string | null) | null = null;

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export function setAuthTokenProvider(provider: () => string | null) {
  authTokenProvider = provider;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authTokenProvider?.();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const json = (await res.json()) as ApiEnvelope<T> | { message?: string };
  if (!res.ok || !(json as ApiEnvelope<T>).success) {
    throw new Error((json as { message?: string }).message || 'Request failed');
  }
  return (json as ApiEnvelope<T>).data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
