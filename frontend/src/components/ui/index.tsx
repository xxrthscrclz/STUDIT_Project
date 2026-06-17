import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Card({
  children,
  className = '',
  hover = false,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={`
        rounded-[16px] border border-border bg-bg-card p-5 shadow-sm
        transition-all duration-200
        ${hover ? 'hover-lift cursor-pointer' : ''}
        ${className}
      `}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}) {
  const base = `
    inline-flex items-center justify-center rounded-[12px] font-medium
    transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-brand-primary text-text-inverse
      hover:bg-brand-hover hover:shadow-brand
    `,
    secondary: `
      bg-bg-muted text-text-primary
      hover:bg-bg-hover
    `,
    outline: `
      border border-brand-primary text-brand-primary bg-transparent
      hover:bg-brand-light
    `,
    ghost: `
      text-text-secondary bg-transparent
      hover:bg-bg-hover hover:text-text-primary
    `,
    danger: `
      border border-status-error text-status-error bg-transparent
      hover:bg-status-error-bg
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = '',
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`
        w-full rounded-[12px] border bg-bg-card px-4 py-3 text-sm text-text-primary
        placeholder:text-text-muted
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
        ${error ? 'border-status-error focus:ring-status-error/20 focus:border-status-error' : 'border-border'}
        ${className}
      `}
      {...props}
    />
  );
}

export function Alert({
  children,
  tone = 'info',
  className = '',
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'success' | 'warning';
  className?: string;
}) {
  const tones = {
    info: 'border-status-info bg-status-info-bg text-status-info-text',
    error: 'border-status-error bg-status-error-bg text-status-error-text',
    success: 'border-status-success bg-status-success-bg text-status-success-text',
    warning: 'border-status-warning bg-status-warning-bg text-status-warning-text',
  };

  return (
    <div
      className={`
        animate-fade-in-up rounded-[12px] border px-4 py-3 text-sm
        ${tones[tone]} ${className}
      `}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'bg-bg-muted text-text-secondary',
    success: 'bg-status-success-bg text-status-success-text',
    warning: 'bg-status-warning-bg text-status-warning-text',
    error: 'bg-status-error-bg text-status-error-text',
    info: 'bg-status-info-bg text-status-info-text',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium
        ${variants[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-[12px] ${className}`} />;
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`
        ${sizes[size]} rounded-full border-2 border-bg-muted border-t-brand-primary
        animate-spin
      `}
    />
  );
}

export function LoadingState({ message = '불러오는 중...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Spinner size="lg" />
      <p className="text-sm text-text-muted animate-pulse">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="animate-fade-in-up py-12 text-center">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="typo-body-bold text-text-primary">{title}</h3>
      {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
