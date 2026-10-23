import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-info mb-1.5">{label}</label>
      {children}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function TextInput({ className = '', ...props }: TextInputProps) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg border border-line/50 bg-bg-main text-ink text-sm placeholder:text-line/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${className}`}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 rounded-lg border border-line/50 bg-bg-main text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5"
    >
      <div
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-line/40'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <div
          className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[20px]' : 'translate-x-0.5'}`}
        />
      </div>
      {label && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20',
    secondary: 'bg-primary-soft/40 text-ink hover:bg-primary-soft/60 border border-line/40',
    danger: 'bg-danger text-white hover:bg-danger/90',
    ghost: 'text-info hover:text-ink hover:bg-primary-soft/30',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'success' | 'danger' | 'info' | 'primary';
}

export function Badge({ children, color = 'info' }: BadgeProps) {
  const colors = {
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    info: 'bg-primary-soft/40 text-info border-line/40',
    primary: 'bg-primary/10 text-primary border-primary/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-line">{icon}</div>}
      <p className="text-sm font-medium text-info">{title}</p>
      {description && <p className="text-xs text-line mt-1">{description}</p>}
    </div>
  );
}
