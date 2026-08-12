export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 px-4 py-4 md:px-8 md:py-6 border-b border-border bg-surface">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-ink">{title}</h1>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
