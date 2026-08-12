/**
 * A plain, reusable data table. `columns` is an array of
 * { key, label, render? } — render(row) lets a column show something
 * other than a raw field (a Badge, a formatted date, action buttons).
 *
 * Deliberately NOT trying to be a generic "smart" table (no built-in
 * sorting/pagination) — keeping it simple and predictable matches the
 * "modern but not overly complex" direction. Add sorting later only
 * if a specific screen genuinely needs it.
 */
export default function DataTable({ columns, rows, keyField = 'id', emptyMessage = 'Nothing here yet.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-2 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="border-b border-border last:border-0 hover:bg-bg/60">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3 text-ink whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
