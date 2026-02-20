import axios from 'axios';

const STORAGE_KEY = 'xpense_user';

export const axiosInstance = axios.create({
  baseURL: '', // same origin; proxy rewrites /api/* to backend
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw) as { token?: string };
      if (session.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      // Let the app handle redirect (e.g. by checking session in App)
    }
    return Promise.reject(err);
  }
);

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredSession(): { token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { token?: string };
    return session.token ? { token: session.token } : null;
  } catch {
    return null;
  }
}
