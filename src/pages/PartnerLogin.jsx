import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api/partner';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/FormFields';

export default function PartnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  async function go(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('partner_token', data.token);
      nav('/partner/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <form onSubmit={go} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-ink mb-5">Partner sign in</h1>
        {error && <p className="text-sm text-danger mb-4">{error}</p>}
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-xs text-muted text-center mt-4"><Link className="text-primary" to="/partner/register">Become a partner</Link></p>
      </form>
    </div>
  );
}
