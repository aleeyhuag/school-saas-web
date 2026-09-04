import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as referralsApi from '../../api/referrals';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/PageHeader';
import { Field, Input, Textarea } from '../../components/ui/FormFields';

const EMPTY_FORM = { name: '', email: '', phone: '', notes: '' };

function formatNaira(kobo) {
  if (kobo == null) return '₦0';
  return `₦${(kobo / 100).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Every referral partner (a teacher, vendor, existing proprietor —
 * anyone who introduces a school, not necessarily a Skulag user
 * themselves) and their commission history. Commission itself is
 * computed automatically by SubscriptionService::confirmPayment() —
 * this page is for creating partners, sharing their referral link,
 * and marking commissions paid out.
 */
export default function ReferralPartnersPage() {
  const queryClient = useQueryClient();

  const partnersQuery = useQuery({
    queryKey: ['platform-referral-partners'],
    queryFn: referralsApi.getReferralPartners,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const createMutation = useMutation({
    mutationFn: referralsApi.createReferralPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-referral-partners'] });
      setCreateModalOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not create this partner.'
      ),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => referralsApi.updateReferralPartner(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-referral-partners'] }),
  });

  const [detailId, setDetailId] = useState(null);
  const detailQuery = useQuery({
    queryKey: ['platform-referral-partner-detail', detailId],
    queryFn: () => referralsApi.getReferralPartner(detailId),
    enabled: !!detailId,
  });

  const markPaidMutation = useMutation({
    mutationFn: referralsApi.markCommissionPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-referral-partner-detail', detailId] });
      queryClient.invalidateQueries({ queryKey: ['platform-referral-partners'] });
    },
  });

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setCreateModalOpen(true);
  }

  function referralLink(code) {
    return `${window.location.origin}/register-school?ref=${code}`;
  }

  const columns = [
    { key: 'name', label: 'Partner' },
    {
      key: 'referral_code',
      label: 'Referral code',
      render: (row) => <span className="font-mono text-xs">{row.referral_code}</span>,
    },
    { key: 'referred_schools_count', label: 'Schools referred' },
    { key: 'commission_total_kobo', label: 'Total earned', render: (row) => formatNaira(row.commission_total_kobo) },
    { key: 'commission_paid_kobo', label: 'Paid out', render: (row) => formatNaira(row.commission_paid_kobo) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => setDetailId(row.id)}>View</Button>
          <Button
            size="sm"
            variant={row.status === 'active' ? 'danger' : 'secondary'}
            disabled={toggleStatusMutation.isPending}
            onClick={() => toggleStatusMutation.mutate({ id: row.id, status: row.status === 'active' ? 'inactive' : 'active' })}
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const detail = detailQuery.data;

  return (
    <>
      <PageHeader
        title="Referral Partners"
        description="Anyone who introduces a school — teachers, vendors, existing proprietors, anyone."
        action={<Button onClick={openCreateModal}>+ Add partner</Button>}
      />

      <div className="p-4 md:p-8">
        <Card>
          <DataTable
            columns={columns}
            rows={partnersQuery.data}
            emptyMessage={partnersQuery.isLoading ? 'Loading…' : 'No referral partners yet.'}
          />
        </Card>
      </div>

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add a referral partner">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email (optional)"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone (optional)"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Notes (optional)"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create partner'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title={detail?.partner?.name ?? 'Partner'}>
        {!detail ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted mb-1">Referral link — share this directly</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={referralLink(detail.partner.referral_code)} className="text-xs" onFocus={(e) => e.target.select()} />
                <Button
                  type="button" size="sm" variant="secondary"
                  onClick={() => navigator.clipboard?.writeText(referralLink(detail.partner.referral_code))}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted font-medium mb-2">Schools referred ({detail.partner.referred_schools?.length ?? 0})</p>
              {!detail.partner.referred_schools?.length ? (
                <p className="text-xs text-muted">None yet.</p>
              ) : (
                <ul className="text-xs text-ink space-y-1">
                  {detail.partner.referred_schools.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs text-muted font-medium mb-2">Commission history</p>
              {!detail.commissions?.length ? (
                <p className="text-xs text-muted">No commissions earned yet.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <tbody>
                      {detail.commissions.map((c) => (
                        <tr key={c.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-ink">{c.school?.name}</td>
                          <td className="px-3 py-2 text-muted">{formatDate(c.created_at)}</td>
                          <td className="px-3 py-2 text-ink">{formatNaira(c.amount_kobo)} ({c.rate_percentage_at_time}%)</td>
                          <td className="px-3 py-2 text-right">
                            {c.status === 'paid' ? (
                              <Badge tone="success">Paid</Badge>
                            ) : (
                              <Button
                                size="sm" variant="secondary"
                                disabled={markPaidMutation.isPending}
                                onClick={() => markPaidMutation.mutate(c.id)}
                              >
                                Mark paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
