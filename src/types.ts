// Re-export auth types from the new location
export type { User, Session, Hotel, UserHotelAccess, HotelRole, FeaturePermissionMatrix, FeatureModule, SubFeature, PermissionLevel } from './types/auth';
export { MODULE_SUBFEATURES } from './types/auth';

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  module: string;
  label: string;
  children: NavChild[];
}

export interface BreadcrumbItem {
  label: string;
}

export interface PageTab {
  key: string;
  label: string;
}
