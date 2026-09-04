import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as publicEnrollmentApi from '../api/publicEnrollment';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/FormFields';
import { BRAND } from '../config/brand';

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '', gender: '',
  school_class_id: '', guardian_name: '', guardian_email: '', guardian_phone: '',
};

/**
 * Public, unauthenticated — a school's own shareable enrollment link
 * (skulag.com.ng/enroll/{slug}). Submitting here does NOT create a
 * student; it creates a pending application the school's own
 * Proprietor/Principal reviews and approves from
 * EnrollmentApplicationsPage. See PublicEnrollmentController for why.
 */
export default function EnrollPage() {
  const { slug } = useParams();
  const infoQuery = useQuery({
    queryKey: ['enrollment-info', slug],
    queryFn: () => publicEnrollmentApi.getEnrollmentInfo(slug),
    retry: false,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [proofFile, setProofFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () => publicEnrollmentApi.submitEnrollmentApplication(slug, form, proofFile),
    onSuccess: () => setSubmitted(true),
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not submit your application. Please try again.'
      ),
  });

  if (infoQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted">Loading…</div>;
  }

  if (infoQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-display font-bold text-ink mb-2">Enrollment link not available</h1>
          <p className="text-sm text-muted">
            This link may be out of date, or the school hasn't turned on online enrollment. Please
            contact the school directly.
          </p>
        </div>
      </div>
    );
  }

  const school = infoQuery.data.school;
  const classes = infoQuery.data.classes ?? [];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-display font-bold text-ink mb-2">Application submitted</h1>
          <p className="text-sm text-muted mb-4">
            Thank you — {school.name} will review your application and get in touch once it's
            approved. Keep an eye on the email and phone number you provided.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-10 px-4">
      <div className="max-w-lg mx-auto bg-surface border border-border rounded-xl p-6 md:p-8">
        <div className="text-center mb-6">
          {school.logo_path && (
            <img src={school.logo_path} alt="" className="w-14 h-14 object-contain mx-auto mb-3" />
          )}
          <h1 className="text-xl font-display font-bold text-ink">{school.name}</h1>
          <p className="text-sm text-muted mt-1">Student enrollment application</p>
        </div>

        {error && <div className="mb-4 text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2">{error}</div>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!proofFile) {
              setError('Please attach proof of payment before submitting.');
              return;
            }
            submitMutation.mutate();
          }}
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Student details</p>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="First name">
              <Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Last name">
              <Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Date of birth (optional)">
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </Field>
            <Field label="Gender (optional)">
              <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
          </div>
          <Field label="Class applying for">
            <Select required value={form.school_class_id} onChange={(e) => setForm({ ...form, school_class_id: e.target.value })}>
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </Select>
          </Field>

          <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-5 mb-3">Guardian details</p>
          <Field label="Your full name">
            <Input required value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Your email">
              <Input type="email" required value={form.guardian_email} onChange={(e) => setForm({ ...form, guardian_email: e.target.value })} />
            </Field>
            <Field label="Your phone">
              <Input required value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
            </Field>
          </div>

          <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-5 mb-3">Payment</p>
          <Field label="Proof of payment" hint="A clear photo or screenshot of your transfer receipt (JPEG, PNG or WebP, up to 5MB).">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
          </Field>

          <Button type="submit" className="w-full mt-4" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting…' : 'Submit application'}
          </Button>
        </form>

        <p className="text-xs text-muted text-center mt-6">Powered by {BRAND.productName}</p>
      </div>
    </div>
  );
}
