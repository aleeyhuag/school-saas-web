import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authApi from '../api/auth';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/FormFields';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      // Deliberately show the same success state whether or not the
      // email exists — the backend already gives the same response
      // either way, so the frontend shouldn't leak the difference.
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg">
      <div className="w-full max-w-sm bg-surface p-8 rounded-xl shadow-sm border border-border">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-display font-bold mb-4">
          S
        </div>
        <h1 className="text-2xl font-bold text-ink mb-1">Forgot password</h1>
        <p className="text-sm text-muted mb-6">
          Enter your account email and we'll send you a link to reset it.
        </p>

        {submitted ? (
          <p className="text-sm text-success bg-success-soft border border-success/20 rounded-lg px-3 py-2">
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
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
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="text-xs text-muted text-center mt-4">
          <Link to="/login" className="text-primary hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
