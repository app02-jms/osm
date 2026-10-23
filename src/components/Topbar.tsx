import { useAuth } from '@/auth/AuthContext';
import { JeniusLogo } from '@/components/JeniusLogo';
import { Circle, LogOut, User as UserIcon } from 'lucide-react';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 bg-card border-b border-line/30 flex items-center justify-between px-6">
      {/* Brand & status badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <JeniusLogo className="w-7 h-7 shrink-0" />
          <span className="text-sm font-bold text-ink tracking-tight hidden md:inline">{('OMS by Jenius' || '').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
          <Circle className="w-2 h-2 fill-success text-success animate-pulse" />
          <span className="text-xs font-medium text-success">Khách sạn đang hoạt động</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft/40 border border-primary/15">
          <span className="text-xs font-medium text-ink">Jenius Grand Hotel</span>
        </div>
      </div>

      {/* User info & logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-ink leading-tight">{user?.displayName ?? 'User'}</p>
            <p className="text-[11px] text-info leading-tight">{user?.role ?? 'Staff'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
