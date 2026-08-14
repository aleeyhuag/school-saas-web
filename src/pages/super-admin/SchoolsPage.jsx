import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as platformApi from '../../api/platform';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/PageHeader';
import { Field, Input } from '../../components/ui/FormFields';

const EMPTY_FORM = {
  school_name: '', school_email: '', school_phone: '', school_address: '',
  admin_name: '', admin_email: '',
};

/**
 * The platform owner's school list — cross-tenant, built against the
 * /api/platform/* endpoints (super_admin only). Every other dashboard
 * page in this app is scoped to one school; this is the one screen
 * that intentionally sees across all of them.
 */
export default function SchoolsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const schoolsQuery = useQuery({
    queryKey: ['platform-schools', search],
    queryFn: () => platformApi.getSchools(search || undefined),
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [createResult, setCreateResult] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const deleteMutation = useMutation({
    mutationFn: ({ id, name }) => platformApi.deleteSchool(id, name),
    onSuccess: () => {
      // Was invalidating the wrong query key (['schools'] — this
      // page's list actually uses ['platform-schools', search]) and
      // calling setDetailId, a function that doesn't exist here (the
      // real setter is setDetailSchoolId below). That second line
      // threw immediately, which aborted the rest of this handler —
      // the modal never closed and the list never refreshed because
      // neither line after it ever ran.
      queryClient.invalidateQueries({ queryKey: ['platform-schools'] });
      setDetailSchoolId(null);
      setDeleteConfirmText('');
    },
  });

  const createMutation = useMutation({
    mutationFn: platformApi.createSchool,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-schools'] });
      setCreateResult(data);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not create this school.'
      ),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: platformApi.toggleSchoolActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-schools'] }),
  });

  const backupMutation = useMutation({
    mutationFn: platformApi.downloadSchoolBackup,
  });

  const [detailSchoolId, setDetailSchoolId] = useState(null);
  const detailQuery = useQuery({
    queryKey: ['platform-school-detail', detailSchoolId],
    queryFn: () => platformApi.getSchoolDetail(detailSchoolId),
    enabled: !!detailSchoolId,
  });

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setCreateResult(null);
    setCreateModalOpen(true);
  }

  const columns = [
    {
      key: 'name',
      label: 'School',
      render: (row) => (
        <button
          onClick={() => setDetailSchoolId(row.id)}
          className="font-medium text-ink hover:text-primary hover:underline text-left"
        >
          {row.name}
        </button>
      ),
    },
    { key: 'users_count', label: 'Staff/Users' },
    { key: 'students_count', label: 'Students' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          variant={row.is_active ? 'danger' : 'secondary'}
          size="sm"
          disabled={toggleActiveMutation.isPending}
          onClick={() => toggleActiveMutation.mutate(row.id)}
        >
          {row.is_active ? 'Disable' : 'Enable'}
        </Button>
      ),
    },
  ];

  const detailSchool = schoolsQuery.data?.find((s) => s.id === detailSchoolId);

  return (
    <>
      <PageHeader
        title="Schools"
        description="Every school registered on the platform."
        action={<Button onClick={openCreateModal}>+ New school</Button>}
      />

      <div className="p-4 md:p-8">
        <Card>
          <Input
            className="mb-4"
            placeholder="Search schools by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DataTable
            columns={columns}
            rows={schoolsQuery.data}
            emptyMessage={schoolsQuery.isLoading ? 'Loading…' : 'No schools found.'}
          />
        </Card>
      </div>

      {/* Create school */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Onboard a new school">
        {createResult ? (
          <div>
            <p className="text-sm text-ink mb-3">
              <strong>{createResult.school.name}</strong> created — proprietor{' '}
              <strong>{createResult.proprietor.name}</strong> ({createResult.proprietor.email}).
            </p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted mb-1">Temporary password (share this securely):</p>
              <p className="font-mono text-sm text-ink">{createResult.temporary_password}</p>
            </div>
            <Button className="w-full" onClick={() => setCreateModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            {error && <p className="text-sm text-danger mb-4">{error}</p>}

            <Field label="School name">
              <Input
                required
                value={form.school_name}
                onChange={(e) => setForm({ ...form, school_name: e.target.value })}
              />
            </Field>
            <Field label="School email (optional)">
              <Input
                type="email"
                value={form.school_email}
                onChange={(e) => setForm({ ...form, school_email: e.target.value })}
              />
            </Field>
            <Field label="School phone (optional)">
              <Input
                value={form.school_phone}
                onChange={(e) => setForm({ ...form, school_phone: e.target.value })}
              />
            </Field>
            <Field label="School address (optional)">
              <Input
                value={form.school_address}
                onChange={(e) => setForm({ ...form, school_address: e.target.value })}
              />
            </Field>

            <div className="pt-2 mt-2 border-t border-border">
              <p className="text-xs text-muted mb-3">Proprietor account for this school</p>
              <Field label="Proprietor's name">
                <Input
                  required
                  value={form.admin_name}
                  onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                />
              </Field>
              <Field label="Proprietor's email">
                <Input
                  type="email"
                  required
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                />
              </Field>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create school'}
            </Button>
          </form>
        )}
      </Modal>

      {/* School detail */}
      <Modal open={!!detailSchoolId} onClose={() => setDetailSchoolId(null)} title={detailSchool?.name ?? 'School'}>
        {detailQuery.data ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Card title="Staff/Users">
                <p className="text-2xl font-bold font-display text-ink">{detailQuery.data.users_count}</p>
              </Card>
              <Card title="Students">
                <p className="text-2xl font-bold font-display text-ink">{detailQuery.data.students_count}</p>
              </Card>
            </div>
            <p><span className="text-muted">Email:</span> {detailQuery.data.email ?? '—'}</p>
            <p><span className="text-muted">Phone:</span> {detailQuery.data.phone ?? '—'}</p>
            <p><span className="text-muted">Address:</span> {detailQuery.data.address ?? '—'}</p>
            <p>
              <span className="text-muted">Status:</span>{' '}
              <Badge tone={detailQuery.data.is_active ? 'success' : 'danger'}>
                {detailQuery.data.is_active ? 'Active' : 'Disabled'}
              </Badge>
            </p>
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs text-muted font-medium mb-2">Recovery</p>
              <p className="text-xs text-muted mb-2">Download a complete recovery archive for this school. Credentials and active tokens are excluded.</p>
              <Button
                size="sm"
                disabled={backupMutation.isPending}
                onClick={() => backupMutation.mutate(detailQuery.data.id)}
              >
                {backupMutation.isPending ? 'Preparing backup…' : 'Download school backup'}
              </Button>
            </div>
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs text-danger font-medium mb-2">Danger zone</p>
              <p className="text-xs text-muted mb-2">
                Type <strong>{detailQuery.data.name}</strong> to permanently delete this school and everything in it.
              </p>
              <Input
                className="mb-2"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={detailQuery.data.name}
              />
              <Button
                variant="danger"
                size="sm"
                disabled={deleteConfirmText !== detailQuery.data.name || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate({ id: detailQuery.data.id, name: deleteConfirmText })}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete School Permanently'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Modal>
    </>
  );
}
