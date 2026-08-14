import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as governanceApi from '../../api/governance';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

function tone(action) {
  if (action === 'created') return 'success';
  if (action === 'deleted') return 'danger';
  if (action === 'backup_downloaded') return 'primary';
  if (action === 'login') return 'default';
  return 'accent';
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ action: '', user_id: '', from: '', to: '', page: 1 });
  const metaQuery = useQuery({ queryKey: ['audit-meta'], queryFn: governanceApi.getAuditMeta });
  const logsQuery = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => governanceApi.getAuditLogs({ ...filters, per_page: 25 }),
  });
  const rows = logsQuery.data?.data ?? [];
  const meta = metaQuery.data;
  const pagination = logsQuery.data;

  const userOptions = useMemo(() => meta?.users ?? [], [meta]);
  const [exporting, setExporting] = useState(false);

  async function exportAudit() {
    setExporting(true);
    try {
      await governanceApi.downloadSchoolModule('audit');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader title="Audit Log" description="Review important actions performed in your school system." action={<Button type="button" disabled={exporting} onClick={exportAudit}>{exporting ? 'Preparing…' : 'Export audit'}</Button>} />
      <div className="p-4 md:p-8 space-y-5">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="border border-border rounded-lg px-3 py-2 text-sm bg-surface" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}>
              <option value="">All actions</option>
              {(meta?.actions ?? []).map((action) => <option key={action} value={action}>{action.replaceAll('_', ' ')}</option>)}
            </select>
            <select className="border border-border rounded-lg px-3 py-2 text-sm bg-surface" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value, page: 1 })}>
              <option value="">All users</option>
              {userOptions.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" className="border border-border rounded-lg px-3 py-2 text-sm bg-surface" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })} />
            <input type="date" className="border border-border rounded-lg px-3 py-2 text-sm bg-surface" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })} />
            <Button type="button" onClick={() => setFilters({ action: '', user_id: '', from: '', to: '', page: 1 })}>Clear filters</Button>
          </div>
        </Card>

        <Card title="Recent activity">
          {logsQuery.isLoading ? <p className="text-sm text-muted py-6">Loading audit history…</p> : rows.length === 0 ? <p className="text-sm text-muted py-6">No audit events match these filters.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">User</th><th className="py-3 pr-4">Action</th><th className="py-3 pr-4">Description</th><th className="py-3 pr-4">IP</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0 align-top">
                      <td className="py-3 pr-4 whitespace-nowrap text-muted">{new Date(row.created_at).toLocaleString()}</td>
                      <td className="py-3 pr-4"><div className="font-medium text-ink">{row.user?.name ?? 'System'}</div><div className="text-xs text-muted">{row.user?.email ?? ''}</div></td>
                      <td className="py-3 pr-4"><Badge tone={tone(row.action)}>{row.action.replaceAll('_', ' ')}</Badge></td>
                      <td className="py-3 pr-4 text-ink min-w-[280px]">{row.description}</td>
                      <td className="py-3 pr-4 text-muted whitespace-nowrap">{row.ip_address ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <span className="text-xs text-muted">Page {pagination.current_page} of {pagination.last_page}</span>
              <div className="flex gap-2">
                <Button type="button" disabled={pagination.current_page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</Button>
                <Button type="button" disabled={pagination.current_page >= pagination.last_page} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
