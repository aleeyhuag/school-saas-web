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
  const isBillingReason = reason === 'trial_expired' || reason === 'subscription_expired';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data = await login({ email, password });

      // admin.skulag.com.ng is Super Admin's dedicated, exclusive
      // entry point — anyone else authenticating successfully here
      // still gets logged straight back out, rather than landing on
      // their normal dashboard. This is a convenience/access boundary,
      // not the actual security boundary — every protected route still
      // enforces its own role check server-side regardless of which
      // hostname the request came from, so this can't be bypassed by
      // hitting the API directly. It just keeps this address from
      // quietly working as an alternate login for every role.
      const isSuperAdminOnlyDomain = window.location.hostname.startsWith('admin.');
      if (isSuperAdminOnlyDomain && !data.roles?.includes('super_admin')) {
        await logout();
        setError('This portal is for platform administrators only. Please use the main site to sign in.');
        return;
      }

      // A Proprietor locked out for a billing reason CAN still log
      // in (see LoginController's exception) — but almost every
      // other route will 403 for them, so send them straight to
      // Billing instead of a dashboard that won't load.
      if (data.billing_locked) {
        const billingPath = data.roles?.includes('principal') ? '/principal/billing' : '/proprietor/billing';
        navigate(billingPath);
      } else {
        navigate('/');
      }
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-border"
      >
        <div className="flex items-center gap-2 mb-4">
          <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-12 h-12 object-contain" />
          <div>
            <p className="font-display font-bold text-xl text-ink">{BRAND.productName}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">by {BRAND.parentCompany}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-6">Access your school dashboard</p>

        {disabledSchoolMessage && !error && (
          <div className="mb-4 text-sm text-warning bg-warning-soft border border-warning/20 rounded-lg px-3 py-2">
            {disabledSchoolMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com"
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>

        {/* Real forgot-password flow now — see ForgotPassword.jsx */}
        <p className="text-xs text-muted text-center mt-4">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot your password?</Link>
        </p>
      </form>
    </div>
  );
}
