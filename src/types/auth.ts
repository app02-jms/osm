// ── Auth & Multi-Hotel Access Types ───────────────────────────

export type PermissionLevel = 'hidden' | 'view' | 'update' | 'approve' | 'delete';

export type FeatureModule =
  | 'hrm'
  | 'frontdesk'
  | 'housekeeping'
  | 'inventory'
  | 'sales'
  | 'system';

/** Per-module permission matrix: module -> permission level */
export type FeaturePermissionMatrix = Partial<Record<FeatureModule, PermissionLevel>>;

export type HotelRole = 'hotel_admin' | 'staff';

export type CoreModule = 'hrm' | 'frontdesk' | 'housekeeping' | 'inventory';

export interface Hotel {
  id: string;          // htl_xxxxxxxx
  name: string;
  code: string;
  address: string;
  logo_url: string | null;
  enabled_modules: CoreModule[];
}

export interface User {
  id: string;          // usr_xxxxxxxx
  username: string;
  password: string;
  full_name: string;
  is_super_admin: boolean;
}

export interface UserHotelAccess {
  id: string;          // map_xxxxxxxx
  user_id: string;     // usr_xxxxxxxx
  hotel_id: string;    // htl_xxxxxxxx
  role: HotelRole;
  permissions: FeaturePermissionMatrix;
}

export interface Session {
  userId: string;
  username: string;
  full_name: string;
  is_super_admin: boolean;
  activeHotelId: string | null;
  expiresAt: number;
}
