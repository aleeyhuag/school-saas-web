import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/FormFields';
import { BRAND } from '../config/brand';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const REASON_MESSAGES = {
    trial_expired: 'Your free trial has ended. Subscribe to keep access.',
    subscription_expired: 'Your subscription has lapsed. Renew to regain access.',
    disabled: 'Your school has been disabled. Please contact your proprietor or principal.',
  };
  const disabledSchoolMessage = REASON_MESSAGES[reason] ?? null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [schoolChoices, setSchoolChoices] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const data = await login({ email, password, ...(selectedSchoolId ? { school_id: Number(selectedSchoolId) } : {}) });
      setSchoolChoices([]);
      const isSuperAdminOnlyDomain = window.location.hostname.startsWith('admin.');
      if (isSuperAdminOnlyDomain && !data.roles?.includes('super_admin')) {
        await logout();
        setError('This portal is for platform administrators only. Please use the main site to sign in.');
        return;
      }
      if (data.billing_locked) {
        const billingPath = data.roles?.includes('principal') ? '/principal/billing' : '/proprietor/billing';
        navigate(billingPath);
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.school_choices) {
        setSchoolChoices(err.response.data.school_choices);
        return;
      }
      const status = err.response?.status;
      const serverMessage = err.response?.data?.errors?.email?.[0] || err.response?.data?.message;
      let message = serverMessage;
      if (!err.response) {
        message = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
          ? 'Skulag is taking too long to respond. Please check your internet connection and try again.'
          : 'Unable to connect to Skulag. Please check your internet connection and try again.';
      } else if (status === 401 || status === 422) {
        message = serverMessage || 'Incorrect email or password. Please check and try again.';
      } else if (status >= 500) {
        message = 'Skulag is temporarily unavailable. Please try again shortly.';
      } else {
        message = serverMessage || 'We could not complete your login right now. Please try again.';
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-12 h-12 object-contain" />
          <div>
            <p className="font-display font-bold text-xl text-ink">{BRAND.productName}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">by {BRAND.parentCompany}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-6">Access your school dashboard</p>
        {disabledSchoolMessage && !error && <div className="mb-4 text-sm text-warning bg-warning-soft border border-warning/20 rounded-lg px-3 py-2">{disabledSchoolMessage}</div>}
        {error && <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">{error}</div>}
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" /></Field>
        <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
        {schoolChoices.length > 0 && (
          <div className="mb-4 rounded-lg border border-border bg-bg p-3">
            <p className="text-sm font-medium text-ink mb-2">This email is used at more than one school. Choose where to sign in:</p>
            <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink" value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} required>
              <option value="">Select school…</option>
              {schoolChoices.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-muted text-center mt-4"><Link to="/forgot-password" className="text-primary hover:underline">Forgot your password?</Link></p>
        <p className="text-xs text-muted text-center mt-2">Don&apos;t have a school account? <Link to="/register-school" className="text-primary font-medium hover:underline">Register your school</Link></p>
        <p className="text-xs text-muted text-center mt-2"><Link to="/" className="text-primary hover:underline">← Back to Skulag landing page</Link></p>
      </form>
    </div>
  );
}
