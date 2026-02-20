import { useCallback, useState } from 'react';
import type { UserSession } from '../types/auth';
import { clearSession, getStoredSession } from '../core-utils/axiosInstance';

const STORAGE_KEY = 'xpense_user';

function loadSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(loadSession);

  const setSession = useCallback((session: UserSession | null) => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const isAuthenticated = !!getStoredSession();

  return { user, setSession, logout, isAuthenticated };
}
