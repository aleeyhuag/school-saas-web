import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as platformApi from '../../api/platform';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function SuperAdminBackupPage() {
  const [message, setMessage] = useState(null);
  const mutation = useMutation({
    mutationFn: platformApi.downloadPlatformBackup,
    onSuccess: () => setMessage({ type: 'success', text: 'Platform backup downloaded successfully. Store it somewhere secure.' }),
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.message ?? 'The platform backup could not be created.' }),
  });
  return <>
    <PageHeader title="Platform Backup" description="Download a complete EduVentor data-recovery archive." />
    <div className="p-4 md:p-8 max-w-3xl space-y-5">
      <Card title="Full platform backup">
        <div className="space-y-4">
          <p className="text-sm text-muted">This backup covers every school and platform record, including academic, billing, attendance, results, timetable, promotion and audit data.</p>
          <div className="rounded-lg bg-primary-soft border border-border p-4 text-sm text-ink"><strong>Security:</strong> passwords, personal access tokens, sessions, password-reset tokens, queues and caches are never included.</div>
          {message && <p className={`text-sm rounded-lg px-3 py-2 ${message.type === 'success' ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'}`}>{message.text}</p>}
          <Button disabled={mutation.isPending} onClick={() => { setMessage(null); mutation.mutate(); }}>{mutation.isPending ? 'Preparing platform backup…' : 'Download platform backup'}</Button>
        </div>
      </Card>
    </div>
  </>;
}
