import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-soft/50 mb-4">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
        <p className="text-sm text-info">
          {description ?? 'Trang này đang được phát triển. Vui lòng quay lại sau.'}
        </p>
      </div>
    </div>
  );
}
