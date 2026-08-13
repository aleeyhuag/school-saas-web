import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/auth';
import Card from './ui/Card';
import Button from './ui/Button';
import { Field, Input } from './ui/FormFields';

export default function AccountProfileCard() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,

    onSuccess: (data) => {
      // The API has already saved the profile and returns the updated
      // user. Keep the form synchronized with that response instead
      // of making a second /auth/me request.
      const updatedUser = data?.user;

      if (updatedUser) {
        setForm({
          name: updatedUser.name ?? '',
          email: updatedUser.email ?? '',
          phone: updatedUser.phone ?? '',
        });
      }

      setMessage({
        type: 'success',
        text: data?.message ?? 'Profile updated successfully.',
      });
    },

    onError: (err) => {
      setMessage({
        type: 'error',
        text:
          err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(' ')
            : err.response?.data?.message ?? 'Could not update profile.',
      });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(form);
  }

  return (
    <Card title="My Profile">
      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 mb-4 ${
            message.type === 'success'
              ? 'text-success bg-success-soft'
              : 'text-danger bg-danger-soft'
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="Full name">
          <Input
            required
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </Field>

        <Field label="Email">
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </Field>

        <Field label="Phone (optional)">
          <Input
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </Field>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </Card>
  );
}