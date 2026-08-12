export function Field({ label, hint, error, children }) {
  return (
    <label className="block mb-4">
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

const baseInputClasses =
  'w-full px-3 py-2 border border-border rounded-lg text-sm text-ink bg-surface ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors';

export function Input({ className = '', ...props }) {
  return <input className={`${baseInputClasses} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${baseInputClasses} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${baseInputClasses} ${className}`} {...props} />;
}
