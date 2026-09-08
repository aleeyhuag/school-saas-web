import SkulagLoader from './SkulagLoader';

// LoadingState is the compatibility layer for the older loading API.
// Keeping the export means existing pages do not need to be rewritten one by
// one, while every shared LoadingState now renders the branded Skulag loader.
export function LoadingSpinner({ size = 'md', label = 'Loading' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-2 border-primary/20 border-t-primary animate-spin ${sizes[size] ?? sizes.md}`}
    />
  );
}

export default function LoadingState({ label = 'Loading…', fullPage = false }) {
  return <SkulagLoader fullScreen={fullPage} label={label} />;
}
