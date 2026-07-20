import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'srs-access';
const REFRESH_KEY = 'srs-refresh';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

/* ─────────────────────────────────────────────────────────
 * Token store
 * "Remember me" → localStorage (survives browser close).
 * Otherwise     → sessionStorage (cleared when browser closes).
 * We always read from whichever storage currently holds the tokens.
 * ───────────────────────────────────────────────────────── */
export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string, remember: boolean) {
    this.clear();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(ACCESS_KEY, accessToken);
    store.setItem(REFRESH_KEY, refreshToken);
  },
  // Update just the access token, keeping it in the same storage as the refresh token.
  setAccess(accessToken: string) {
    const store = localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage;
    store.setItem(ACCESS_KEY, accessToken);
  },
  clear() {
    [localStorage, sessionStorage].forEach((s) => {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
    });
  },
};

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

/* ── Request interceptor: attach access token ───────────── */
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response interceptor: normalize + auto-refresh ─────── */
export interface NormalizedError {
  status: number;
  message: string;
  details?: unknown;
}

function forceLogout() {
  tokenStore.clear();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

// De-duplicate concurrent refreshes: many 401s share one refresh call.
let refreshing: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error('No refresh token');

  // Bare axios (not `api`) to avoid interceptor recursion.
  const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
  const newAccess: string = res.data.data.accessToken;
  tokenStore.setAccess(newAccess);
  return newAccess;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; details?: unknown }>) => {
    const status = error.response?.status ?? 0;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';

    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    // Try a silent refresh once for expired access tokens.
    if (status === 401 && original && !original._retry && !isAuthEndpoint && tokenStore.getRefresh()) {
      original._retry = true;
      try {
        refreshing = refreshing ?? runRefresh();
        const newAccess = await refreshing;
        refreshing = null;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        refreshing = null;
        forceLogout();
      }
    } else if (status === 401 && !isAuthEndpoint && tokenStore.getAccess()) {
      forceLogout();
    }

    const message =
      error.response?.data?.message ??
      (status === 0 ? 'Network error — check your connection' : 'Something went wrong');

    return Promise.reject({
      status,
      message,
      details: error.response?.data?.details,
    } as NormalizedError);
  },
);

/* Unwrap the { success, message, data } envelope. */
export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}
