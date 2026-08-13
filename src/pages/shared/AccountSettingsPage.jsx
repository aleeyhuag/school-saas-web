import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../api/auth';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import { Field, Input } from '../../components/ui/FormFields';

export default function AccountSettingsPage() {
  const { user, refreshCurrentUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) setForm({ name: user.name ?? '', email: user.email ?? '', phone: user.phone ?? '' });
  }, [user]);

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: async (data) => {
      setMessage({ type: 'success', text: data.message ?? 'Profile updated successfully.' });
      await refreshCurrentUser();
    },
    onError: (err) => setMessage({
      type: 'error',
      text: err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message ?? 'Could not update your profile.',
    }),
  });

  return (
    <>
      <PageHeader title="Account" description="Update your personal information and password." />
      <div className="p-4 md:p-8 max-w-2xl space-y-6">
        <Card title="Personal information">
          {message && <p className={`text-sm rounded-lg px-3 py-2 mb-4 ${message.type === 'success' ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'}`}>{message.text}</p>}
          <form onSubmit={(e) => { e.preventDefault(); setMessage(null); mutation.mutate(form); }} className="space-y-1">
            <Field label="Full name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone (optional)"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save profile'}</Button>
          </form>
        </Card>
        <ChangePasswordCard />
      </div>
    </>
  );
}
