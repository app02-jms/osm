import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'oms_session';
const SESSION_DURATION = 60 * 60 * 1000; // 60 minutes

const SEED_USER: User = {
  username: 'admin',
  displayName: 'Administrator',
  role: 'System Admin',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || typeof parsed.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Initialize synchronously so the first render knows auth state (no blank flash)
const INITIAL_SESSION = loadSession();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(INITIAL_SESSION);

  const login = (username: string, password: string): boolean => {
    if (username.trim() === SEED_USER.username && password === '123') {
      const newSession: Session = {
        user: SEED_USER,
        expiresAt: Date.now() + SESSION_DURATION,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession)); } catch { /* ignore */ }
      setSession(newSession);
      return true;
    }
    return false;
  };

  const logout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setSession(null);
  };

  // Check session expiry on interval
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const stored = loadSession();
      if (!stored) {
        setSession(null);
      }
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    login,
    logout,
    isAuthenticated: !!session && Date.now() < session.expiresAt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
