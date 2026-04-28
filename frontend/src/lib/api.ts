const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
let authTokenProvider: (() => string | null) | null = null;

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  errors?: unknown[];
  data: T;
}

export class ApiRequestError extends Error {
  statusCode: number;
  errors: unknown[];

  constructor(message: string, statusCode: number, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function setAuthTokenProvider(provider: () => string | null) {
  authTokenProvider = provider;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authTokenProvider?.();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const json = (await res.json()) as ApiEnvelope<T> | { message?: string; errors?: unknown[] };
  if (!res.ok || !(json as ApiEnvelope<T>).success) {
    throw new ApiRequestError(
      (json as { message?: string }).message || 'Request failed',
      res.status,
      (json as { errors?: unknown[] }).errors ?? []
    );
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

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, {
    method: 'DELETE'
  });
}
