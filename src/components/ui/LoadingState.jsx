export function LoadingSpinner({ size = 'md', label = 'Loading' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-8 w-8 border-[3px]' };
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-primary/20 border-t-primary animate-spin ${sizes[size] ?? sizes.md}`}
    />
  );
}

export default function LoadingState({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-muted ${fullPage ? 'min-h-[40vh]' : 'py-10'}`} role="status">
      <LoadingSpinner label={label} />
      <span>{label}</span>
    </div>
  );
}
