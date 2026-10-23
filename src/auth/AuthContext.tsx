import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User, Hotel } from '@/types/auth';
import { getUsers, getUserHotelAccess, getHotelById, getActiveHotelId, setActiveHotelId, getHotels } from '@/store/authStore';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  activeHotel: Hotel | null;
  hotels: Hotel[];
  needsHotelSelection: boolean;
  login: (username: string, password: string) => { ok: boolean; needsHotelSelect: boolean; hotels: Hotel[] };
  selectHotel: (hotelId: string) => void;
  switchHotel: (hotelId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'oms_session';
const SESSION_DURATION = 60 * 60 * 1000;

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

const INITIAL_SESSION = loadSession();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(INITIAL_SESSION);
  const [needsHotelSelection, setNeedsHotelSelection] = useState(false);

  const login = (username: string, password: string): { ok: boolean; needsHotelSelect: boolean; hotels: Hotel[] } => {
    const users = getUsers();
    const user = users.find((u) => u.username === username.trim() && u.password === password);
    if (!user) {
      return { ok: false, needsHotelSelect: false, hotels: [] };
    }

    const accessRecords = getUserHotelAccess(user.id);
    const userHotels = accessRecords
      .map((a) => getHotelById(a.hotel_id))
      .filter((h): h is Hotel => h !== undefined);

    // Super admin with no explicit mappings gets access to all hotels
    const effectiveHotels = userHotels.length > 0 ? userHotels : (user.is_super_admin ? getHotels() : []);

    if (effectiveHotels.length === 0) {
      return { ok: false, needsHotelSelect: false, hotels: [] };
    }

    // Single hotel — auto-select
    if (effectiveHotels.length === 1) {
      const newSession: Session = {
        userId: user.id,
        username: user.username,
        full_name: user.full_name,
        is_super_admin: user.is_super_admin,
        activeHotelId: effectiveHotels[0].id,
        expiresAt: Date.now() + SESSION_DURATION,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession)); } catch { /* ignore */ }
      setActiveHotelId(effectiveHotels[0].id);
      setNeedsHotelSelection(false);
      setSession(newSession);
      return { ok: true, needsHotelSelect: false, hotels: effectiveHotels };
    }

    // Multiple hotels — create session with no hotel selected yet
    const partialSession: Session = {
      userId: user.id,
      username: user.username,
      full_name: user.full_name,
      is_super_admin: user.is_super_admin,
      activeHotelId: null,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(partialSession)); } catch { /* ignore */ }
    setNeedsHotelSelection(true);
    setSession(partialSession);
    return { ok: true, needsHotelSelect: true, hotels: effectiveHotels };
  };

  const selectHotel = (hotelId: string) => {
    if (!session) return;
    const newSession: Session = { ...session, activeHotelId: hotelId };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession)); } catch { /* ignore */ }
    setActiveHotelId(hotelId);
    setNeedsHotelSelection(false);
    setSession(newSession);
  };

  const switchHotel = (hotelId: string) => {
    if (!session) return;
    const newSession: Session = { ...session, activeHotelId: hotelId };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession)); } catch { /* ignore */ }
    setActiveHotelId(hotelId);
    setSession(newSession);
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('oms_active_hotel_id');
    } catch { /* ignore */ }
    setNeedsHotelSelection(false);
    setSession(null);
  };

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const stored = loadSession();
      if (!stored) {
        setNeedsHotelSelection(false);
        setSession(null);
      }
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Derive user, active hotel, and accessible hotels from session
  const user = session ? getUsers().find((u) => u.id === session.userId) ?? null : null;

  const accessRecords = user ? getUserHotelAccess(user.id) : [];
  const mappedHotels = accessRecords
    .map((a) => getHotelById(a.hotel_id))
    .filter((h): h is Hotel => h !== undefined);
  const activeHotel = session?.activeHotelId ? getHotelById(session.activeHotelId) ?? null : null;

  const value: AuthContextValue = {
    session,
    user,
    activeHotel,
    hotels: user?.is_super_admin ? getHotels() : mappedHotels,
    needsHotelSelection,
    login,
    selectHotel,
    switchHotel,
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
