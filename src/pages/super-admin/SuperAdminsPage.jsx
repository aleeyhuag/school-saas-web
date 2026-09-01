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

const EMPTY_FORM = { name: '', email: '' };

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * The platform owner's own team — every super_admin account, and a
 * way to add more without touching the database directly. Same
 * "generate a temporary password, show it once" pattern used when
 * onboarding a school's proprietor from SchoolsPage.
 */
export default function SuperAdminsPage() {
  const queryClient = useQueryClient();

  const adminsQuery = useQuery({
    queryKey: ['platform-super-admins'],
    queryFn: platformApi.getSuperAdmins,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [createResult, setCreateResult] = useState(null);

  const createMutation = useMutation({
    mutationFn: platformApi.createSuperAdmin,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-super-admins'] });
      setCreateResult(data);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not create this account.'
      ),
  });

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setCreateResult(null);
    setCreateModalOpen(true);
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'approved' ? 'success' : 'neutral'}>{row.status}</Badge>
      ),
    },
    { key: 'created_at', label: 'Added', render: (row) => formatDate(row.created_at) },
  ];

  return (
    <>
      <PageHeader
        title="Super Admins"
        description="Everyone with full platform owner access."
        action={<Button onClick={openCreateModal}>+ Add super admin</Button>}
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 text-xs text-ink">
          Anyone added here gets the same full platform access you have — every school, every
          payment, every backup, and the ability to add or remove other super admins. Only add
          people you'd trust with all of it.
        </div>

        <Card>
          <DataTable
            columns={columns}
            rows={adminsQuery.data}
            emptyMessage={adminsQuery.isLoading ? 'Loading…' : 'No super admins found.'}
          />
        </Card>
      </div>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add a super admin">
        {createResult ? (
          <div>
            <p className="text-sm text-ink mb-3">
              <strong>{createResult.user.name}</strong> ({createResult.user.email}) can now sign in.
            </p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted mb-1">Temporary password (share this securely — shown once):</p>
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

            <Field label="Full name">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create super admin'}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
