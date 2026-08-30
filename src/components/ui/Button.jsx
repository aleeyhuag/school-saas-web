const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-primary-soft text-primary hover:bg-primary-soft/70',
  accent: 'bg-accent text-ink hover:bg-accent/90',
  ghost: 'bg-transparent text-muted hover:bg-black/5',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft/70',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="h-4 w-4 rounded-full border-2 border-current/25 border-t-current animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
