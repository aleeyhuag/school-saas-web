import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/partner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Field, Input } from '../components/ui/FormFields';

function n(kobo) { return `₦${((kobo || 0) / 100).toLocaleString()}`; }

export default function PartnerDashboard() {
  const [data, setData] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', bank_name: '', account_name: '', account_number: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  async function load() {
    try { setData(await api.me()); }
    catch { localStorage.removeItem('partner_token'); nav('/partner/login'); }
  }
  useEffect(() => { load(); }, []);

  function openProfile() {
    const p = data?.partner;
    setForm({ name: p?.name || '', phone: p?.phone || '', bank_name: p?.bank_name || '', account_name: p?.account_name || '', account_number: p?.account_number || '' });
    setError(null); setProfileOpen(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError(null);
    try { await api.updateProfile(form); await load(); setProfileOpen(false); }
    catch (err) { setError(err.response?.data?.message || 'Could not update your details.'); }
    finally { setSaving(false); }
  }

  if (!data) return <div className="p-8">Loading…</div>;
  const earned = data.commissions?.reduce((x, c) => x + Number(c.amount_kobo), 0) || 0;
  const paid = data.commissions?.filter((c) => c.status === 'paid').reduce((x, c) => x + Number(c.amount_kobo), 0) || 0;
  const link = `${window.location.origin}/register-school?ref=${data.partner.referral_code}`;

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div><h1 className="text-2xl font-bold text-ink">Partner dashboard</h1><p className="text-sm text-muted">Welcome, {data.partner.name}</p></div>
          <div className="flex gap-2"><Button variant="secondary" onClick={openProfile}>My details & payment</Button><Button variant="secondary" onClick={async () => { await api.logout().catch(() => {}); localStorage.removeItem('partner_token'); nav('/'); }}>Sign out</Button></div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><p className="text-xs text-muted">Referral code</p><p className="font-mono font-bold text-ink mt-2">{data.partner.referral_code}</p></Card>
          <Card><p className="text-xs text-muted">Total earned</p><p className="text-xl font-bold text-ink mt-2">{n(earned)}</p></Card>
          <Card><p className="text-xs text-muted">Paid</p><p className="text-xl font-bold text-ink mt-2">{n(paid)}</p></Card>
        </div>

        <Card className="mt-4"><p className="text-xs text-muted">Registration date</p><p className="text-sm text-ink mt-1">{data.partner.created_at ? new Date(data.partner.created_at).toLocaleString() : '—'}</p><p className="text-xs text-muted mt-4">Your referral link</p><p className="text-sm text-ink break-all mt-2">{link}</p><button className="text-sm text-primary font-semibold mt-3" onClick={() => navigator.clipboard?.writeText(link)}>Copy link</button></Card>

        <Card className="mt-4">
          <h2 className="font-bold text-ink mb-3">Payment details</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-muted">Bank</p><p className="text-ink">{data.partner.bank_name || 'Not provided'}</p></div><div><p className="text-xs text-muted">Account name</p><p className="text-ink">{data.partner.account_name || 'Not provided'}</p></div><div><p className="text-xs text-muted">Account number</p><p className="font-mono text-ink">{data.partner.account_number || 'Not provided'}</p></div></div>
        </Card>

        <Card className="mt-4"><h2 className="font-bold text-ink mb-3">Referred schools</h2>{!data.referred_schools?.length ? <p className="text-sm text-muted">No schools yet.</p> : data.referred_schools.map((s) => <div key={s.id} className="py-2 border-b border-border text-sm text-ink">{s.name}</div>)}</Card>
        <Card className="mt-4"><h2 className="font-bold text-ink mb-3">Commission history</h2>{data.commissions?.map((c) => <div key={c.id} className="flex justify-between py-2 border-b border-border text-sm"><span>{c.school?.name}</span><span>{n(c.amount_kobo)} · {c.status}</span></div>)}</Card>
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="My details & payment details">
        <form onSubmit={saveProfile}>
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <Field label="Name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Bank name"><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
          <Field label="Account name"><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} /></Field>
          <Field label="Account number"><Input inputMode="numeric" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</Button>
        </form>
      </Modal>
    </div>
  );
}
