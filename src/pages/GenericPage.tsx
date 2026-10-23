import type { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Placeholder from '@/components/Placeholder';

interface GenericPageProps {
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description?: string;
  tabs?: { key: string; label: string }[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
}

export default function GenericPage({
  path,
  icon,
  title,
  subtitle,
  description,
  tabs,
  activeTab,
  onTabChange,
}: GenericPageProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6">
        <PageHeader
          path={path}
          icon={icon}
          title={title}
          subtitle={subtitle}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
      <Placeholder title={title} description={description} />
    </div>
  );
}
