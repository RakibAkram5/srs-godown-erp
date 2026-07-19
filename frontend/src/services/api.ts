import axios, { AxiosError, AxiosInstance } from 'axios';

export const TOKEN_KEY = 'srs-token';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

/* ── Request interceptor: attach bearer token ───────────── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Response interceptor: normalize errors ─────────────── */
export interface NormalizedError {
  status: number;
  message: string;
  details?: unknown;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; details?: unknown }>) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ??
      (status === 0 ? 'Network error — check your connection' : 'Something went wrong');

    // Auto-logout on expired/invalid session.
    if (status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    const normalized: NormalizedError = {
      status,
      message,
      details: error.response?.data?.details,
    };
    return Promise.reject(normalized);
  },
);

/* Unwrap the { success, message, data } envelope. */
export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}
