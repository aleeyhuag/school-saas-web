import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as gradingApi from '../../api/grading';
import * as schoolApi from '../../api/school';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import ChangePasswordCard from '../../components/ChangePasswordCard';
import AccountProfileCard from '../../components/AccountProfileCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import { Field, Input } from '../../components/ui/FormFields';

export default function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ['assessment-settings'],
    queryFn: gradingApi.getAssessmentSettings,
  });
  const boundariesQuery = useQuery({
    queryKey: ['grade-boundaries'],
    queryFn: gradingApi.getGradeBoundaries,
  });

  const boundaryColumns = [
    { key: 'grade', label: 'Grade', render: (row) => <Badge tone="primary">{row.grade}</Badge> },
    { key: 'remark', label: 'Remark' },
    { key: 'range', label: 'Score range', render: (row) => `${row.min_score} – ${row.max_score}` },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Your account and school configuration." />

      <div className="p-4 md:p-8 space-y-6 max-w-2xl">
        <AccountProfileCard />

        <SchoolProfileCard />

        <ChangePasswordCard />

        <Card title="Assessment Weights">
          <p className="text-xs text-muted mb-4">
            View only — only your Exam Officer can change how CA, assignment, and exam scores are
            weighted.
          </p>
          {settingsQuery.data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold font-display text-ink">{settingsQuery.data.ca_weight}%</p>
                <p className="text-xs text-muted mt-1">Continuous Assessment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-display text-ink">
                  {settingsQuery.data.assignment_weight}%
                </p>
                <p className="text-xs text-muted mt-1">Assignment</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-display text-ink">{settingsQuery.data.exam_weight}%</p>
                <p className="text-xs text-muted mt-1">Exam</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </Card>

        <Card title="Grade Boundaries">
          <p className="text-xs text-muted mb-4">
            View only — only your Exam Officer can add or change grade boundaries.
          </p>
          <DataTable
            columns={boundaryColumns}
            rows={boundariesQuery.data}
            emptyMessage={boundariesQuery.isLoading ? 'Loading…' : 'No grade boundaries set up yet.'}
          />
        </Card>
      </div>
    </>
  );
}

/**
 * Lets Proprietor/Principal edit their own school's name, contact
 * info, and logo — previously not editable from within the school's
 * own dashboard at all (only super_admin could even see this data).
 */
function SchoolProfileCard() {
  const { school } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({ queryKey: ['school-profile'], queryFn: schoolApi.getSchoolProfile });

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name ?? '',
        email: profileQuery.data.email ?? '',
        phone: profileQuery.data.phone ?? '',
        address: profileQuery.data.address ?? '',
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () => schoolApi.updateSchoolProfile(form, logoFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] }); // school name/logo shown in the sidebar
      setSuccess(true);
      setError(null);
      setLogoFile(null);
    },
    onError: (err) =>
      setError(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : err.response?.data?.message ?? 'Could not update school profile.'
      ),
  });

  function handleLogoChange(e) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  const currentLogo = logoPreview ?? profileQuery.data?.logo_url ?? school?.logo_url;

  return (
    <Card title="School Profile">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSuccess(false);
          updateMutation.mutate();
        }}
      >
        {success && (
          <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 mb-4">
            School profile updated.
          </p>
        )}
        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg bg-primary-soft flex items-center justify-center overflow-hidden">
            {currentLogo ? (
              <img src={currentLogo} alt="School logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-display font-bold text-primary">
                {form.name?.[0] ?? 'S'}
              </span>
            )}
          </div>
          <div>
            <label className="text-sm text-primary hover:underline cursor-pointer">
              Change logo
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoChange} className="hidden" />
            </label>
            <p className="text-xs text-muted">PNG, JPEG, or WebP — up to 2MB.</p>
          </div>
        </div>

        <Field label="School name">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email (optional)">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone (optional)">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Address (optional)">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save school profile'}
        </Button>
      </form>
    </Card>
  );
}
