import { useState, useMemo } from 'react';
import { useRouter } from '@/router/RouterContext';
import { useAuth } from '@/auth/AuthContext';
import { NAVIGATION, type NavConfigItem, type NavChildItem } from '@/config/navigation';
import { ChevronDown } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const SUPER_ADMIN_ONLY_PATHS = new Set(['/system/hotel-config']);

export default function Sidebar() {
  const { path, navigate } = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin === true;
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand the module containing the current path
    const initial = new Set<string>();
    for (const nav of NAVIGATION) {
      if (nav.children.some((c) => path === c.path || path.startsWith(c.path + '/'))) {
        initial.add(nav.module);
      }
    }
    return initial;
  });

  const toggle = (module: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const handleNavigate = (to: string) => {
    navigate(to);
  };

  // Filter nav items: hide super-admin-only routes from non-super-admins
  const visibleNav = useMemo<NavConfigItem[]>(() => {
    return NAVIGATION.map((nav) => ({
      ...nav,
      children: nav.children.filter((c: NavChildItem) =>
        isSuperAdmin || !SUPER_ADMIN_ONLY_PATHS.has(c.path)
      ),
    })).filter((nav) => nav.children.length > 0);
  }, [isSuperAdmin]);

  return (
    <aside className="w-64 shrink-0 bg-ink h-full flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10">
        <Logo className="w-9 h-9 shrink-0" />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">OMS by Jenius</p>
          <p className="text-white/50 text-[10px] leading-tight">Hotel Management</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2">
        {visibleNav.map((nav) => {
          const isOpen = expanded.has(nav.module);
          const Icon = nav.icon;
          const hasActiveChild = nav.children.some(
            (c) => path === c.path || path.startsWith(c.path + '/')
          );

          return (
            <div key={nav.module} className="mb-1">
              {/* Parent */}
              <button
                onClick={() => toggle(nav.module)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all group ${
                  hasActiveChild ? 'bg-primary/20' : 'hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    hasActiveChild ? 'text-primary-soft' : 'text-white/70 group-hover:text-white'
                  }`}
                />
                <span className="text-white font-semibold text-sm tracking-wide flex-1 text-left uppercase">
                  {nav.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/40 transition-transform shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Children */}
              {isOpen && (
                <div className="pl-8 ml-3 border-l border-line/30 mt-1 mb-2 space-y-0.5">
                  {nav.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = path === child.path || path.startsWith(child.path + '/');
                    return (
                      <button
                        key={child.path}
                        onClick={() => handleNavigate(child.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all ${
                          isActive
                            ? 'text-white bg-primary/40 font-medium rounded-md'
                            : 'text-primary-soft hover:text-white hover:bg-primary/20 hover:rounded-md'
                        }`}
                      >
                        <ChildIcon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-white/40 text-[10px]">Version 1.0.0</p>
      </div>
    </aside>
  );
}
