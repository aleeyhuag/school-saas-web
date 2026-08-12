import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import Card from './ui/Card';
import Button from './ui/Button';
import { Field, Input } from './ui/FormFields';

const EMPTY_FORM = { current_password: '', new_password: '', new_password_confirmation: '' };

/**
 * Self-service password change — identical for every role, so it's
 * extracted here rather than duplicated across each role's Settings
 * page. Used by Proprietor/Principal's full SettingsPage and by
 * narrower role-specific settings pages (e.g. Bursar's) alike.
 */
export default function ChangePasswordCard() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setSuccess(true);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not change password.'
      ),
  });

  return (
    <Card title="Change Password">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSuccess(false);
          changePasswordMutation.mutate(form);
        }}
      >
        {success && (
          <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 mb-4">
            Password changed successfully.
          </p>
        )}
        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <Field label="Current password">
          <Input
            type="password"
            required
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input
            type="password"
            required
            minLength={8}
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            required
            value={form.new_password_confirmation}
            onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
          />
        </Field>
        <Button type="submit" disabled={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </Card>
  );
}
