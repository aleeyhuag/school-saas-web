import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/FormFields';

import { BRAND } from '../config/brand';
const EMPTY_FORM = {
  school_name: '', school_email: '', school_phone: '', school_address: '',
  terms_accepted: false, privacy_acknowledged: false,
  admin_role: 'proprietor', referral_code: '',
  admin_name: '', admin_email: '', admin_password: '', admin_password_confirmation: '',
};

export default function RegisterSchool() {
  const { hydrateFromToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [form, setForm] = useState({ ...EMPTY_FORM, referral_code: referralCode ?? '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await authApi.registerSchool(form);
      await hydrateFromToken(data.token);
      navigate('/'); // "/" resolves to the right dashboard based on role
    } catch (err) {
      const errors = err.response?.data?.errors;
      const message =
        (errors && Object.values(errors).flat()[0]) ||
        err.response?.data?.message ||
        'Could not register your school. Please check the details and try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-surface p-6 md:p-8 rounded-xl shadow-sm border border-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-12 h-12 object-contain" />
          <div>
            <p className="font-display font-bold text-xl text-ink">{BRAND.productName}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">by {BRAND.parentCompany}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Register your school</h1>
        <p className="text-sm text-muted mb-6">
          This creates your school and your own account together — you'll be signed in right
          after.
        </p>

        {error && (
          <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {referralCode && (
          <div className="mb-4 text-sm text-primary bg-primary-soft border border-primary/20 rounded-lg px-3 py-2">
            Referral code <strong>{referralCode}</strong> applied — thanks for coming from a Skulag partner.
          </div>
        )}

        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">School details</p>
        <Field label="School name">
          <Input required value={form.school_name} onChange={set('school_name')} placeholder="Bright Future Academy" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="School email (optional)">
            <Input type="email" value={form.school_email} onChange={set('school_email')} />
          </Field>
          <Field label="School phone (optional)">
            <Input value={form.school_phone} onChange={set('school_phone')} />
          </Field>
        </div>
        <Field label="School address (optional)">
          <Input value={form.school_address} onChange={set('school_address')} />
        </Field>

        <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-5 mb-3">Your account</p>
        <Field label="I am registering as the school's...">
          <div className="grid grid-cols-2 gap-3 mb-1">
            {[
              { value: 'proprietor', label: 'Proprietor', hint: 'School owner' },
              { value: 'principal', label: 'Principal', hint: 'Academic head' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center text-center gap-0.5 rounded-lg border px-3 py-3 cursor-pointer transition-colors ${
                  form.admin_role === opt.value
                    ? 'border-primary bg-primary-soft'
                    : 'border-border hover:bg-bg'
                }`}
              >
                <input
                  type="radio"
                  name="admin_role"
                  value={opt.value}
                  checked={form.admin_role === opt.value}
                  onChange={() => setForm((f) => ({ ...f, admin_role: opt.value }))}
                  className="sr-only"
                />
                <span className="font-medium text-sm text-ink">{opt.label}</span>
                <span className="text-xs text-muted">{opt.hint}</span>
              </label>
            ))}
          </div>
        </Field>
        <p className="text-xs text-muted -mt-1 mb-3">
          Not sure, or the actual proprietor isn't with you right now? Either is fine — whoever
          registers can invite the other one later from Staff.
        </p>
        <Field label="Your full name">
          <Input required value={form.admin_name} onChange={set('admin_name')} />
        </Field>
        <Field label="Your email">
          <Input type="email" required value={form.admin_email} onChange={set('admin_email')} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Password">
            <Input type="password" required minLength={8} value={form.admin_password} onChange={set('admin_password')} placeholder="••••••••" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" required minLength={8} value={form.admin_password_confirmation} onChange={set('admin_password_confirmation')} placeholder="••••••••" />
          </Field>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-bg p-3">
          <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={form.terms_accepted}
              onChange={(e) => setForm((f) => ({ ...f, terms_accepted: e.target.checked, privacy_acknowledged: e.target.checked }))}
              className="mt-1 accent-primary"
            />
            <span>
              I agree to the <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>
              {' '}and confirm that I have read the <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
            </span>
          </label>
        </div>

        <Button type="submit" className="w-full mt-2" disabled={submitting || !form.terms_accepted}>
          {submitting ? 'Setting up your school…' : 'Register your school'}
        </Button>

        <p className="text-xs text-muted text-center mt-4">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
