import { useSyncExternalStore } from 'react';
import type { User, UserHotelAccess, Hotel, FeaturePermissionMatrix, HotelRole, PermissionLevel, FeatureModule, CoreModule } from '@/types/auth';
import { ID } from '@/utils/idGenerator';

// ── Storage keys ──────────────────────────────────────────────
const K_USERS = 'oms_auth_users';
const K_HOTELS = 'oms_auth_hotels';
const K_MAPPINGS = 'oms_auth_user_hotel_mappings';
const K_ACTIVE_HOTEL = 'oms_active_hotel_id';

// ── Permission presets ────────────────────────────────────────
export const FULL_PERMISSIONS: FeaturePermissionMatrix = {
  hrm: 'delete',
  frontdesk: 'delete',
  housekeeping: 'delete',
  inventory: 'delete',
  sales: 'delete',
  system: 'delete',
};

export const STAFF_PERMISSIONS: FeaturePermissionMatrix = {
  hrm: 'view',
  frontdesk: 'update',
  housekeeping: 'update',
  inventory: 'view',
  sales: 'hidden',
  system: 'hidden',
};

export const HOTEL_ADMIN_PERMISSIONS: FeaturePermissionMatrix = {
  hrm: 'approve',
  frontdesk: 'approve',
  housekeeping: 'approve',
  inventory: 'approve',
  sales: 'approve',
  system: 'view',
};

// ── Seed data ─────────────────────────────────────────────────
const SEED_HOTEL_1: Hotel = {
  id: 'htl_seed001',
  name: 'Jenius Grand Hotel',
  code: 'JGH',
  address: '123 Nguyễn Huệ, Q.1, TP. HCM',
  logo_url: null,
  enabled_modules: ['hrm', 'frontdesk', 'housekeeping', 'inventory'],
};

const SEED_HOTEL_2: Hotel = {
  id: 'htl_seed002',
  name: 'Jenius Beach Resort',
  code: 'JBR',
  address: '456 Võ Nguyên Giáp, Đà Nẵng',
  logo_url: null,
  enabled_modules: ['hrm', 'frontdesk', 'housekeeping'],
};

const SEED_SUPER_ADMIN: User = {
  id: 'usr_seedadm',
  username: 'admin',
  password: '123',
  full_name: 'System Administrator',
  is_super_admin: true,
};

const SEED_HOTEL_ADMIN: User = {
  id: 'usr_seedhad',
  username: 'manager',
  password: '123',
  full_name: 'Hotel Manager',
  is_super_admin: false,
};

const SEED_STAFF: User = {
  id: 'usr_seedstf',
  username: 'staff',
  password: '123',
  full_name: 'Nhân viên Lễ tân',
  is_super_admin: false,
};

const SEED_MAPPINGS: UserHotelAccess[] = [
  {
    id: 'map_seed01',
    user_id: 'usr_seedadm',
    hotel_id: 'htl_seed001',
    role: 'hotel_admin',
    permissions: FULL_PERMISSIONS,
  },
  {
    id: 'map_seed02',
    user_id: 'usr_seedadm',
    hotel_id: 'htl_seed002',
    role: 'hotel_admin',
    permissions: FULL_PERMISSIONS,
  },
  {
    id: 'map_seed03',
    user_id: 'usr_seedhad',
    hotel_id: 'htl_seed001',
    role: 'hotel_admin',
    permissions: HOTEL_ADMIN_PERMISSIONS,
  },
  {
    id: 'map_seed04',
    user_id: 'usr_seedstf',
    hotel_id: 'htl_seed001',
    role: 'staff',
    permissions: STAFF_PERMISSIONS,
  },
];

// ── localStorage helpers ──────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (!Array.isArray(fallback) && (typeof parsed !== 'object' || parsed === null)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Reactive store ────────────────────────────────────────────
class SimpleStore<T> {
  private key: string;
  private value: T;
  private listeners = new Set<() => void>();

  constructor(key: string, initial: T) {
    this.key = key;
    this.value = load(key, initial);
    try { if (localStorage.getItem(key) === null) save(key, this.value); } catch { /* ignore */ }
  }

  get = (): T => this.value;
  getSnapshot = (): T => this.value;

  set(updater: T | ((prev: T) => T)): void {
    this.value = typeof updater === 'function'
      ? (updater as (prev: T) => T)(this.value)
      : updater;
    save(this.key, this.value);
    this.listeners.forEach((l) => l());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

// ── Store instances ──────────────────────────────────────────
const usersStore = new SimpleStore<User[]>(K_USERS, [SEED_SUPER_ADMIN, SEED_HOTEL_ADMIN, SEED_STAFF]);
const hotelsStore = new SimpleStore<Hotel[]>(K_HOTELS, [SEED_HOTEL_1, SEED_HOTEL_2]);
const mappingsStore = new SimpleStore<UserHotelAccess[]>(K_MAPPINGS, SEED_MAPPINGS);

// ── Hooks ─────────────────────────────────────────────────────
export function useUsers(): [User[], (updater: (prev: User[]) => User[]) => void] {
  const value = useSyncExternalStore(usersStore.subscribe, usersStore.getSnapshot);
  const update = (updater: (prev: User[]) => User[]) => usersStore.set(updater);
  return [value, update];
}

export function useHotels(): [Hotel[], (updater: (prev: Hotel[]) => Hotel[]) => void] {
  const value = useSyncExternalStore(hotelsStore.subscribe, hotelsStore.getSnapshot);
  const update = (updater: (prev: Hotel[]) => Hotel[]) => hotelsStore.set(updater);
  return [value, update];
}

export function useMappings(): [UserHotelAccess[], (updater: (prev: UserHotelAccess[]) => UserHotelAccess[]) => void] {
  const value = useSyncExternalStore(mappingsStore.subscribe, mappingsStore.getSnapshot);
  const update = (updater: (prev: UserHotelAccess[]) => UserHotelAccess[]) => mappingsStore.set(updater);
  return [value, update];
}

// ── Non-reactive getters (for login flow) ─────────────────────
export function getUsers(): User[] {
  return usersStore.get();
}

export function getHotels(): Hotel[] {
  return hotelsStore.get();
}

export function getMappings(): UserHotelAccess[] {
  return mappingsStore.get();
}

export function getUserHotelAccess(userId: string): UserHotelAccess[] {
  return mappingsStore.get().filter((m) => m.user_id === userId);
}

export function getHotelById(hotelId: string): Hotel | undefined {
  return hotelsStore.get().find((h) => h.id === hotelId);
}

// ── Active hotel persistence ──────────────────────────────────
export function getActiveHotelId(): string | null {
  try { return localStorage.getItem(K_ACTIVE_HOTEL); } catch { return null; }
}

export function setActiveHotelId(hotelId: string | null): void {
  try {
    if (hotelId) localStorage.setItem(K_ACTIVE_HOTEL, hotelId);
    else localStorage.removeItem(K_ACTIVE_HOTEL);
  } catch { /* ignore */ }
}

// ── CRUD actions ──────────────────────────────────────────────
export function addUser(data: Omit<User, 'id'>): User {
  const user: User = { ...data, id: ID.user() };
  usersStore.set((prev) => [...prev, user]);
  return user;
}

export function updateUser(id: string, patch: Partial<User>): void {
  usersStore.set((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

export function deleteUser(id: string): void {
  usersStore.set((prev) => prev.filter((u) => u.id !== id));
  mappingsStore.set((prev) => prev.filter((m) => m.user_id !== id));
}

export function addHotel(data: Omit<Hotel, 'id'>): Hotel {
  const hotel: Hotel = { ...data, id: ID.hotel() };
  hotelsStore.set((prev) => [...prev, hotel]);
  return hotel;
}

export function updateHotel(id: string, patch: Partial<Hotel>): void {
  hotelsStore.set((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
}

export function deleteUserHotelMapping(id: string): void {
  mappingsStore.set((prev) => prev.filter((m) => m.id !== id));
}

export function setUserHotelMappings(userId: string, assignments: { hotel_id: string; role: HotelRole; permissions: FeaturePermissionMatrix }[]): void {
  mappingsStore.set((prev) => {
    const filtered = prev.filter((m) => m.user_id !== userId);
    const newMappings: UserHotelAccess[] = assignments.map((a) => ({
      id: ID.mapping(),
      user_id: userId,
      hotel_id: a.hotel_id,
      role: a.role,
      permissions: a.permissions,
    }));
    return [...filtered, ...newMappings];
  });
}

export function getPermissionForModule(
  userId: string,
  hotelId: string,
  module: FeatureModule
): PermissionLevel {
  const mapping = mappingsStore.get().find((m) => m.user_id === userId && m.hotel_id === hotelId);
  if (!mapping) return 'hidden';
  return mapping.permissions[module] ?? 'hidden';
}

// ── Permission level labels ───────────────────────────────────
export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  hidden: 'Không hiển thị',
  view: 'Xem',
  update: 'Cập nhật',
  approve: 'Duyệt',
  delete: 'Xóa',
};

export const MODULE_LABELS: Record<FeatureModule, string> = {
  hrm: 'Nhân sự',
  frontdesk: 'Lễ tân',
  housekeeping: 'Buồng phòng',
  inventory: 'Kho',
  sales: 'Sales & RMS',
  system: 'Hệ thống',
};
