import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as governanceApi from '../../api/governance';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function BackupPage() {
  const [message, setMessage] = useState(null);
  const mutation = useMutation({
    mutationFn: governanceApi.downloadSchoolBackup,
    onSuccess: () => setMessage({ type: 'success', text: 'Backup downloaded successfully. Store it somewhere secure.' }),
    onError: (error) => setMessage({ type: 'error', text: error.response?.data?.message ?? 'The backup could not be created.' }),
  });

  return (
    <>
      <PageHeader title="Data Backup" description="Download a portable copy of your school records before production and whenever you need one." />
      <div className="p-4 md:p-8 max-w-3xl space-y-5">
        <Card title="School data backup">
          <div className="space-y-4">
            <p className="text-sm text-muted">The archive contains your school records, academic data, students, staff records, results, attendance, fees, timetable data, billing records, audit logs and referenced school files.</p>
            <div className="rounded-lg bg-primary-soft border border-border p-4 text-sm text-ink">
              <strong>Security note:</strong> passwords, active login tokens, sessions and password-reset tokens are intentionally excluded. Protect the downloaded ZIP like any other sensitive school record.
            </div>
            {message && <p className={`text-sm rounded-lg px-3 py-2 ${message.type === 'success' ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'}`}>{message.text}</p>}
            <Button type="button" disabled={mutation.isPending} onClick={() => { setMessage(null); mutation.mutate(); }}>
              {mutation.isPending ? 'Preparing secure backup…' : 'Download full school backup'}
            </Button>
          </div>
        </Card>
        <Card title="What is included?">
          <ul className="list-disc pl-5 text-sm text-muted space-y-2">
            <li>School profile and authorized user records without credentials.</li>
            <li>Students, classes, subjects, teacher assignments and promotions.</li>
            <li>Sessions, terms, attendance, assessments, scores and approvals.</li>
            <li>Fees, payments, subscriptions and payment references.</li>
            <li>Timetable, announcements and audit history.</li>
            <li>Referenced school logo and payment-proof files when available.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
