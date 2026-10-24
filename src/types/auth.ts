// ── Auth & Multi-Hotel Access Types ───────────────────────────

export type PermissionLevel = 'hidden' | 'view' | 'view_all' | 'update' | 'approve' | 'delete';

export type FeatureModule =
  | 'hrm'
  | 'frontdesk'
  | 'housekeeping'
  | 'inventory'
  | 'sales'
  | 'system';

/** Granular sub-features that permissions are applied to */
export type SubFeature =
  | 'hrm_profiles'
  | 'hrm_schedules'
  | 'hrm_attendance'
  | 'hrm_closures'
  | 'frontdesk_departure'
  | 'frontdesk_rooms'
  | 'housekeeping_tasks'
  | 'inventory_stock'
  | 'sales_minirms'
  | 'sales_rates'
  | 'system_users'
  | 'system_hotel_config';

/** Maps each parent module to its sub-features */
export const MODULE_SUBFEATURES: Record<FeatureModule, SubFeature[]> = {
  hrm: ['hrm_profiles', 'hrm_schedules', 'hrm_attendance', 'hrm_closures'],
  frontdesk: ['frontdesk_departure', 'frontdesk_rooms'],
  housekeeping: ['housekeeping_tasks'],
  inventory: ['inventory_stock'],
  sales: ['sales_minirms', 'sales_rates'],
  system: ['system_users', 'system_hotel_config'],
};

/** Per sub-feature permission matrix */
export type FeaturePermissionMatrix = Partial<Record<SubFeature, PermissionLevel>>;

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
