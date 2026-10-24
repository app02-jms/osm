import { useAuth } from '@/auth/AuthContext';
import { getPermissionForSubFeature } from '@/store/authStore';
import type { SubFeature, PermissionLevel } from '@/types/auth';

const LEVEL_RANK: Record<PermissionLevel, number> = {
  hidden: 0,
  view: 1,
  update: 2,
  approve: 3,
  delete: 4,
};

/**
 * Resolves the current user's permission level for HRM sub-features.
 * Super admins always get 'delete' (full access).
 */
export function useHrmPermission() {
  const { user, session } = useAuth();
  const isSuperAdmin = user?.is_super_admin === true;
  const activeHotelId = session?.activeHotelId ?? null;

  const getLevel = (subFeature: SubFeature): PermissionLevel => {
    if (isSuperAdmin) return 'delete';
    if (!user || !activeHotelId) return 'hidden';
    return getPermissionForSubFeature(user.id, activeHotelId, subFeature);
  };

  const can = (subFeature: SubFeature, minLevel: PermissionLevel): boolean => {
    return LEVEL_RANK[getLevel(subFeature)] >= LEVEL_RANK[minLevel];
  };

  return { getLevel, can, isSuperAdmin, LEVEL_RANK };
}
