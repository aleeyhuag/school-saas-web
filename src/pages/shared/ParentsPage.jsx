import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as parentsApi from '../../api/parents';
import * as academicApi from '../../api/academic';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { Field, Input } from '../../components/ui/FormFields';

function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatNaira(amount) {
  return `₦${Number(amount ?? 0).toLocaleString()}`;
}

/**
 * A dedicated page for parent accounts — pulled out of the general
 * Staff list, since parents aren't staff. Shared across Proprietor,
 * Principal, and Bursar dashboards (same component, each role's
 * backend route already permits it). "Send reminder" actually emails
 * the parent now (Stage 33) — "Copy text" alongside it is a fallback
 * for forwarding the message manually yourself (e.g. via WhatsApp),
 * since there's no SMS/WhatsApp channel wired up yet.
 */
export default function ParentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);
  const parentsQuery = useQuery({
    queryKey: ['parents', debouncedSearch],
    queryFn: () => parentsApi.getParents({ search: debouncedSearch || undefined }),
  });

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [reminderMessage, setReminderMessage] = useState(null); // { id, tone, text }

  const sendReminderMutation = useMutation({
    mutationFn: (parentId) => parentsApi.sendFeeReminder(parentId),
    onSuccess: (data, parentId) =>
      setReminderMessage({ id: parentId, tone: 'success', text: data.message }),
    onError: (err, parentId) =>
      setReminderMessage({
        id: parentId,
        tone: 'danger',
        text: err.response?.data?.message ?? 'Could not send reminder.',
      }),
  });

  const inviteMutation = useMutation({
    mutationFn: academicApi.inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setInviteModalOpen(false);
      setForm({ name: '', email: '', phone: '' });
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not invite this parent.'
      ),
  });

  function copyReminder(parent) {
    const owing = parent.children.filter((c) => (c.fee_balance ?? 0) > 0);
    const lines = owing.map((c) => `- ${c.name} (${c.class}): ${formatNaira(c.fee_balance)} outstanding`);
    const message =
      `Dear ${parent.name},\n\nThis is a reminder that the following fee balance(s) are outstanding:\n\n` +
      lines.join('\n') +
      `\n\nPlease make payment at your earliest convenience. Thank you.`;

    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(parent.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'children',
      label: 'Children',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.children.length ? (
            row.children.map((c) => (
              <Badge key={c.id} tone={c.fee_balance > 0 ? 'danger' : 'neutral'}>
                {c.name} ({c.class})
              </Badge>
            ))
          ) : (
            <span className="text-muted text-xs">No children linked</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        row.has_defaulting_child ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1.5">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setReminderMessage(null);
                  sendReminderMutation.mutate(row.id);
                }}
                disabled={sendReminderMutation.isPending && sendReminderMutation.variables === row.id}
              >
                {sendReminderMutation.isPending && sendReminderMutation.variables === row.id
                  ? 'Sending…'
                  : 'Send reminder'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyReminder(row)}>
                {copiedId === row.id ? 'Copied ✓' : 'Copy text'}
              </Button>
            </div>
            {reminderMessage?.id === row.id && (
              <p className={`text-xs ${reminderMessage.tone === 'success' ? 'text-success' : 'text-danger'}`}>
                {reminderMessage.text}
              </p>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Parents"
        description="Every invited parent account and the children linked to them."
        action={<Button onClick={() => { setError(null); setInviteModalOpen(true); }}>+ Invite parent</Button>}
      />

      <div className="p-4 md:p-8">
        <Card>
          <Input
            className="mb-4"
            placeholder="Search parents by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DataTable
            columns={columns}
            rows={parentsQuery.data}
            emptyMessage={parentsQuery.isLoading ? 'Loading…' : 'No parents invited yet.'}
          />
        </Card>
      </div>

      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite a parent">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate({ ...form, role: 'parent' });
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Full name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone (optional)">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <p className="text-xs text-muted mb-4">
            After inviting, link them to a child from that student's "Guardians" button on the
            Students page.
          </p>
          <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Inviting…' : 'Send invite'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
