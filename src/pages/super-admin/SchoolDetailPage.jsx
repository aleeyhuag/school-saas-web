import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as platformApi from '../../api/platform';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/PageHeader';
import { Input } from '../../components/ui/FormFields';

const SUBSCRIPTION_TONES = {
  trialing: 'primary',
  active: 'success',
  past_due: 'warning',
  expired: 'danger',
};

const PAYMENT_TONES = {
  pending_review: 'warning',
  success: 'success',
  rejected: 'danger',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNaira(kobo) {
  if (kobo == null) return '—';
  return `₦${(kobo / 100).toLocaleString()}`;
}

function roleLabel(role) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Full-page Super Admin view of one school — replaces the old 295-line
 * modal, which only ever showed two counts and contact details.
 * Everything a platform owner would actually want when they click into
 * a school lives here: when it registered, who the proprietor is, a
 * staff breakdown by role, and a real billing picture (current
 * subscription state + recent payment history) — not just a name and
 * a delete button.
 */
export default function SchoolDetailPage() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const detailQuery = useQuery({
    queryKey: ['platform-school-detail', schoolId],
    queryFn: () => platformApi.getSchoolDetail(schoolId),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: () => platformApi.toggleSchoolActive(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-school-detail', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['platform-schools'] });
    },
  });

  const backupMutation = useMutation({
    mutationFn: () => platformApi.downloadSchoolBackup(schoolId),
  });

  const deleteMutation = useMutation({
    mutationFn: (name) => platformApi.deleteSchool(schoolId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-schools'] });
      navigate('/super-admin');
    },
  });

  if (detailQuery.isLoading) {
    return <div className="p-4 md:p-8 text-sm text-muted">Loading…</div>;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-sm text-danger">Could not load this school.</p>
        <Link to="/super-admin" className="text-sm text-primary hover:underline">← Back to schools</Link>
      </div>
    );
  }

  const { school, proprietor, staff_summary: staffSummary, students_summary: studentsSummary, billing } = detailQuery.data;
  const subscription = billing?.subscription;

  const staffByRoleRows = Object.entries(staffSummary?.by_role ?? {}).map(([role, count]) => ({ role, count }));

  const paymentColumns = [
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'plan', label: 'Plan', render: (row) => row.plan?.name ?? '—' },
    { key: 'amount', label: 'Amount', render: (row) => formatNaira(row.amount_kobo) },
    { key: 'method', label: 'Method', render: (row) => (row.method ?? '—').replace(/_/g, ' ') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={PAYMENT_TONES[row.status] ?? 'neutral'}>{roleLabel(row.status ?? 'unknown')}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={school.name}
        description={`Registered ${formatDate(school.created_at)}`}
        action={
          <>
            <Link to="/super-admin" className="text-sm text-primary hover:underline self-center mr-2">
              ← All schools
            </Link>
            <Button
              variant={school.is_active ? 'danger' : 'secondary'}
              size="sm"
              disabled={toggleActiveMutation.isPending}
              onClick={() => toggleActiveMutation.mutate()}
            >
              {school.is_active ? 'Disable school' : 'Enable school'}
            </Button>
          </>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card title="Status">
            <Badge tone={school.is_active ? 'success' : 'danger'}>
              {school.is_active ? 'Active' : 'Disabled'}
            </Badge>
            {!school.is_active && school.deactivation_reason && (
              <p className="text-xs text-muted mt-2">{roleLabel(school.deactivation_reason)}</p>
            )}
          </Card>
          <Card title="Staff">
            <p className="text-2xl font-bold font-display text-ink">{staffSummary?.total ?? 0}</p>
          </Card>
          <Card title="Students">
            <p className="text-2xl font-bold font-display text-ink">{studentsSummary?.total ?? 0}</p>
          </Card>
          <Card title="Subscription">
            <Badge tone={SUBSCRIPTION_TONES[subscription?.status] ?? 'neutral'}>
              {subscription ? roleLabel(subscription.status) : 'No subscription'}
            </Badge>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="School contact">
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Email</dt>
                <dd className="text-ink text-right">{school.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Phone</dt>
                <dd className="text-ink text-right">{school.phone ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Address</dt>
                <dd className="text-ink text-right">{school.address ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Payment reference code</dt>
                <dd className="text-ink text-right font-mono text-xs">{school.payment_reference_code ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Current academic session</dt>
                <dd className="text-ink text-right">{school.academic_sessions?.[0]?.name ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Proprietor">
            {proprietor ? (
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Name</dt>
                  <dd className="text-ink text-right">{proprietor.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Email</dt>
                  <dd className="text-ink text-right">{proprietor.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Phone</dt>
                  <dd className="text-ink text-right">{proprietor.phone ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Account status</dt>
                  <dd className="text-ink text-right">{roleLabel(proprietor.status ?? 'unknown')}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Account created</dt>
                  <dd className="text-ink text-right">{formatDate(proprietor.created_at)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted">No proprietor account found for this school.</p>
            )}
          </Card>
        </div>

        <Card title="Staff by role">
          {staffByRoleRows.length ? (
            <div className="flex flex-wrap gap-2">
              {staffByRoleRows.map((row) => (
                <Badge key={row.role} tone="neutral">
                  {roleLabel(row.role)}: {row.count}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No staff accounts yet.</p>
          )}
        </Card>

        <Card title="Subscription">
          {subscription ? (
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Plan</dt>
                <dd className="text-ink text-right">{subscription.plan?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Status</dt>
                <dd className="text-right">
                  <Badge tone={SUBSCRIPTION_TONES[subscription.status] ?? 'neutral'}>
                    {roleLabel(subscription.status)}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Trial ends</dt>
                <dd className="text-ink text-right">{formatDate(subscription.trial_ends_at)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Current period ends</dt>
                <dd className="text-ink text-right">{formatDate(subscription.current_period_ends_at)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Grace period ends</dt>
                <dd className="text-ink text-right">{formatDate(subscription.grace_ends_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">This school has no subscription record.</p>
          )}
        </Card>

        <Card title="Recent payments">
          <DataTable
            columns={paymentColumns}
            rows={billing?.recent_payments}
            emptyMessage="No payments recorded yet."
          />
        </Card>

        <Card title="Recovery">
          <p className="text-xs text-muted mb-2">
            Download a complete recovery archive for this school. Credentials and active tokens are excluded.
          </p>
          <Button size="sm" disabled={backupMutation.isPending} onClick={() => backupMutation.mutate()}>
            {backupMutation.isPending ? 'Preparing backup…' : 'Download school backup'}
          </Button>
        </Card>

        <Card title="Danger zone" className="border-danger/30">
          <p className="text-xs text-danger font-medium mb-2">
            This permanently deletes the school and everything in it — students, staff accounts, results,
            payments, backups. This cannot be undone.
          </p>
          <p className="text-xs text-muted mb-2">
            Type <strong>{school.name}</strong> to confirm.
          </p>
          <Input
            className="mb-2 max-w-sm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={school.name}
          />
          <Button
            variant="danger"
            size="sm"
            disabled={deleteConfirmText !== school.name || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteConfirmText)}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete school permanently'}
          </Button>
        </Card>
      </div>
    </>
  );
}
