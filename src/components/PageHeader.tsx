import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { findNavByPath } from '@/config/navigation';

interface PageHeaderProps {
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tabs?: { key: string; label: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  children?: ReactNode;
}

export default function PageHeader({
  path,
  icon: Icon,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}: PageHeaderProps) {
  const navInfo = findNavByPath(path);

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-info mb-2">
        {navInfo && (
          <>
            <span>{navInfo.moduleLabel}</span>
            <ChevronRight className="w-3 h-3 text-line" />
            <span className="text-ink">{navInfo.childLabel}</span>
          </>
        )}
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink leading-tight">{title}</h1>
            <p className="text-sm text-info mt-0.5">{subtitle}</p>
          </div>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="mt-4 inline-flex gap-1 bg-primary-soft/30 border border-line/40 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-info hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
