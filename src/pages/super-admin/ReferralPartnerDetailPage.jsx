import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../api/referrals';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/PageHeader';
import { Field, Input } from '../../components/ui/FormFields';

function n(kobo) { return `₦${((kobo || 0) / 100).toLocaleString()}`; }
function date(value) { return value ? new Date(value).toLocaleString() : '—'; }

export default function ReferralPartnerDetailPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const q = useQuery({ queryKey: ['platform-referral-partner-detail', partnerId], queryFn: () => api.getReferralPartner(partnerId) });
  const mark = useMutation({ mutationFn: api.markCommissionPaid, onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform-referral-partner-detail', partnerId] }); qc.invalidateQueries({ queryKey: ['platform-referral-partners'] }); } });
  const del = useMutation({ mutationFn: () => api.deleteReferralPartner(partnerId, { confirm_name: confirmName }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform-referral-partners'] }); navigate('/super-admin/referrals'); }, onError: (err) => setDeleteError(err.response?.data?.errors?.confirm_name?.[0] || err.response?.data?.message || 'Could not delete partner.') });

  if (q.isLoading) return <div className="p-8">Loading…</div>;
  if (q.isError) return <div className="p-8 text-danger">Could not load this referral partner.</div>;
  const d = q.data;
  const link = `${window.location.origin}/register-school?ref=${d.partner.referral_code}`;

  return <>
    <PageHeader title={d.partner.name} description="Referral partner details, payment information, referred schools and commission history." action={<Button variant="danger" onClick={() => { setConfirmName(''); setDeleteError(null); setDeleteOpen(true); }}>Delete partner</Button>} />
    <div className="p-4 md:p-8 space-y-4">
      <Card><div className="grid md:grid-cols-2 gap-4 text-sm">
        <div><p className="text-xs text-muted">Email</p><p className="text-ink">{d.partner.email || '—'}</p></div>
        <div><p className="text-xs text-muted">Phone</p><p className="text-ink">{d.partner.phone || '—'}</p></div>
        <div><p className="text-xs text-muted">Referral code</p><p className="font-mono text-ink">{d.partner.referral_code}</p></div>
        <div><p className="text-xs text-muted">Registration date</p><p className="text-ink">{date(d.partner.created_at)}</p></div>
        <div><p className="text-xs text-muted">Status</p><Badge tone={d.partner.status === 'active' ? 'success' : 'neutral'}>{d.partner.status}</Badge></div>
      </div><p className="text-xs text-muted mt-5">Referral link</p><p className="text-sm text-primary break-all">{link}</p></Card>
      <Card><h2 className="font-bold text-ink mb-3">Bank / payment details</h2><div className="grid md:grid-cols-3 gap-4 text-sm"><div><p className="text-xs text-muted">Bank name</p><p className="text-ink">{d.partner.bank_name || 'Not provided'}</p></div><div><p className="text-xs text-muted">Account name</p><p className="text-ink">{d.partner.account_name || 'Not provided'}</p></div><div><p className="text-xs text-muted">Account number</p><p className="font-mono text-ink">{d.partner.account_number || 'Not provided'}</p></div></div></Card>
      <Card><h2 className="font-bold text-ink mb-3">Referred schools</h2>{d.partner.referred_schools?.map(s => <div key={s.id} className="flex justify-between py-2 border-b border-border text-sm"><span>{s.name}</span><Badge tone={s.is_active ? 'success' : 'neutral'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></div>)}</Card>
      <Card><h2 className="font-bold text-ink mb-3">Commission history</h2>{d.commissions?.map(c => <div key={c.id} className="flex justify-between items-center py-3 border-b border-border text-sm"><span>{c.school?.name}<br/><span className="text-xs text-muted">{date(c.created_at)} · {c.rate_percentage_at_time}%</span></span><span>{n(c.amount_kobo)} {c.status === 'paid' ? <Badge tone="success">Paid</Badge> : <Button size="sm" variant="secondary" disabled={mark.isPending} onClick={() => mark.mutate(c.id)}>Mark paid</Button>}</span></div>)}</Card>
    </div>
    <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Permanently delete referral partner">
      <p className="text-sm text-danger mb-4">This cannot be undone. The partner account and partner-owned commission records will be deleted. Referred schools remain and lose only the partner attribution.</p>
      {deleteError && <p className="text-sm text-danger mb-4">{deleteError}</p>}
      <Field label={`Type “${d.partner.name}” to confirm`}><Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} autoFocus /></Field>
      <Button variant="danger" className="w-full" disabled={confirmName !== d.partner.name || del.isPending} onClick={() => del.mutate()}>{del.isPending ? 'Deleting…' : 'Permanently delete partner'}</Button>
    </Modal>
  </>;
}
