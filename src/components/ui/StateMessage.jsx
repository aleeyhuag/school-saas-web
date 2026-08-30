export function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden="true">—</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description = 'We could not complete this request. Please try again.', action }) {
  return (
    <div className="rounded-xl border border-danger/20 bg-danger-soft px-6 py-8 text-center" role="alert">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-danger font-bold" aria-hidden="true">!</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
