const TONES = {
  neutral: 'bg-black/5 text-muted',
  primary: 'bg-primary-soft text-primary',
  accent: 'bg-accent-soft text-warning',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/**
 * Small status/role pill — e.g. "Approved", "Pending", a role name.
 */
export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
