import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as authApi from '../api/auth';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/FormFields';

import { BRAND } from '../config/brand';
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'This reset link is invalid or has expired.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-border text-center">
          <p className="text-sm text-danger mb-4">This reset link is missing some information.</p>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <img src={BRAND.logoPath} alt={`${BRAND.productName} logo`} className="w-12 h-12 object-contain" />
          <div>
            <p className="font-display font-bold text-xl text-ink">{BRAND.productName}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted">by {BRAND.parentCompany}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Reset password</h1>
        <p className="text-sm text-muted mb-6">Choose a new password for {email}.</p>

        {done ? (
          <p className="text-sm text-success bg-success-soft border border-success/20 rounded-lg px-3 py-2">
            Password reset — redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <Field label="New password">
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
