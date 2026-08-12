import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academicApi from '../../api/academic';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const EMPTY_FORM = { name: '', email: '', phone: '', role: '' };

// Roles ANY inviter (proprietor or principal) can assign.
// Note: 'parent' and 'student' are deliberately NOT here — parents
// get their own dedicated Parents page, and students get a login
// automatically when added on the Students page. Neither goes
// through the general staff invite flow anymore.
const OPERATIONAL_ROLES = [
  { value: 'teacher', label: 'Teacher' },
];

// Senior roles — Stage 11: only a Proprietor can assign these.
const SENIOR_ROLES = [
  { value: 'principal', label: 'Principal' },
  { value: 'bursar', label: 'Bursar' },
  { value: 'exam_officer', label: 'Exam Officer' },
];

const ROLE_BADGE_TONES = {
  proprietor: 'accent',
  principal: 'accent',
  bursar: 'primary',
  exam_officer: 'primary',
  teacher: 'success',
  parent: 'neutral',
  student: 'neutral',
};

export default function StaffPage() {
  const { hasRole } = useAuth();
  const isProprietor = hasRole('proprietor');
  const queryClient = useQueryClient();

  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: () => academicApi.getStaff() });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // shows the temporary password after a successful invite

  const inviteMutation = useMutation({
    mutationFn: academicApi.inviteUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setResult(data);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not invite this person.'
      ),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: academicApi.toggleStaffStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });

  const [resetResult, setResetResult] = useState(null);
  const resetPasswordMutation = useMutation({
    mutationFn: academicApi.resetStaffPassword,
    onSuccess: (data) => setResetResult(data),
  });

  const [roleModalStaff, setRoleModalStaff] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleError, setRoleError] = useState(null);

  const addRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => academicApi.addStaffRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setRoleModalStaff(null);
      setNewRole('');
    },
    onError: (err) =>
      setRoleError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not add this role.'
      ),
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => academicApi.removeStaffRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });

  function openRoleModal(staffMember) {
    setRoleModalStaff(staffMember);
    setNewRole('');
    setRoleError(null);
  }

  // Which roles this staff member could still be granted — every
  // role minus ones they already have, and minus senior roles if the
  // current logged-in user isn't a Proprietor (mirrors the invite
  // form's restriction).
  function availableRolesFor(staffMember) {
    const all = isProprietor
      ? [...SENIOR_ROLES, ...OPERATIONAL_ROLES]
      : OPERATIONAL_ROLES;
    return all.filter((r) => !staffMember.roles.includes(r.value));
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setResult(null);
    setModalOpen(true);
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'roles',
      label: 'Role',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((role) => (
            <span key={role} className="inline-flex items-center gap-1">
              <Badge tone={ROLE_BADGE_TONES[role] ?? 'neutral'}>{role.replace('_', ' ')}</Badge>
              {role !== 'proprietor' && row.roles.length > 1 && (
                <button
                  onClick={() => removeRoleMutation.mutate({ userId: row.id, role })}
                  className="text-muted hover:text-danger text-xs leading-none"
                  title={`Remove ${role.replace('_', ' ')} role`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'disabled' ? 'danger' : row.status === 'pending' ? 'warning' : 'success'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.roles.includes('proprietor') ? null : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => openRoleModal(row)}>
              + Role
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => resetPasswordMutation.mutate(row.id)}
              disabled={resetPasswordMutation.isPending}
            >
              Reset password
            </Button>
            <Button
              variant={row.status === 'disabled' ? 'secondary' : 'danger'}
              size="sm"
              onClick={() => toggleStatusMutation.mutate(row.id)}
            >
              {row.status === 'disabled' ? 'Re-enable' : 'Disable'}
            </Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone with a login to your school's account."
        action={<Button onClick={openModal}>+ Invite staff</Button>}
      />

      <div className="p-4 md:p-8">
        <Card>
          <DataTable
            columns={columns}
            rows={staffQuery.data}
            emptyMessage={staffQuery.isLoading ? 'Loading…' : 'No staff invited yet.'}
          />
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Invite staff">
        {result ? (
          <div>
            <p className="text-sm text-ink mb-3">
              <strong>{result.user.name}</strong> has been invited as{' '}
              <span className="capitalize">{result.role.replace('_', ' ')}</span>.
            </p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted mb-1">Temporary password (share this with them securely):</p>
              <p className="font-mono text-sm text-ink">{result.temporary_password}</p>
            </div>
            <p className="text-xs text-muted mb-4">
              This is shown once. Once SMS/email is set up, this will be sent automatically instead.
            </p>
            <Button className="w-full" onClick={() => setModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate(form);
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

            <Field label="Phone (optional)">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>

            <Field
              label="Role"
              hint={
                !isProprietor
                  ? 'Only the proprietor can appoint a principal, bursar, or exam officer.'
                  : undefined
              }
            >
              <Select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="" disabled>
                  Select a role
                </option>
                {isProprietor && (
                  <optgroup label="Senior roles">
                    {SENIOR_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Operational roles">
                  {OPERATIONAL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>

            <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending invite…' : 'Send invite'}
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={!!resetResult} onClose={() => setResetResult(null)} title="Password reset">
        {resetResult && (
          <div>
            <p className="text-sm text-ink mb-3">{resetResult.message}</p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-muted mb-1">New temporary password:</p>
              <p className="font-mono text-sm text-ink">{resetResult.temporary_password}</p>
            </div>
            <Button className="w-full" onClick={() => setResetResult(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={!!roleModalStaff}
        onClose={() => setRoleModalStaff(null)}
        title={`Add a role for ${roleModalStaff?.name ?? ''}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRoleMutation.mutate({ userId: roleModalStaff.id, role: newRole });
          }}
        >
          {roleError && <p className="text-sm text-danger mb-4">{roleError}</p>}
          <p className="text-xs text-muted mb-4">
            This lets one person hold more than one role — e.g. someone already a Class Teacher can
            also become a Subject Teacher for a specific subject.
          </p>
          <Field label="Additional role">
            <Select required value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="" disabled>
                Select a role
              </option>
              {roleModalStaff &&
                availableRolesFor(roleModalStaff).map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
            </Select>
            {roleModalStaff && availableRolesFor(roleModalStaff).length === 0 && (
              <span className="block text-xs text-muted mt-1">
                This person already has every role you're able to grant.
              </span>
            )}
          </Field>
          <Button type="submit" className="w-full" disabled={addRoleMutation.isPending || !newRole}>
            {addRoleMutation.isPending ? 'Adding…' : 'Add role'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
