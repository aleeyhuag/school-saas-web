import { BRAND } from '../../config/brand';

export default function SkulagLoader({ fullScreen = false, label = 'Loading…' }) {
  const wrapper = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-bg'
    : 'flex items-center justify-center py-10';

  return (
    <div className={wrapper} role="status" aria-live="polite" aria-label={label}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <span className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-xl bg-surface flex items-center justify-center shadow-sm overflow-hidden">
            <img
              src={BRAND.faviconPath}
              alt=""
              className="w-7 h-7 object-contain"
            />
          </div>
        </div>
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}
