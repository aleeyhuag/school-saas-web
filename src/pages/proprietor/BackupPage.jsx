import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as governanceApi from '../../api/governance';
import * as exportsApi from '../../api/exports';
import { useExportPolling } from '../../hooks/useExportPolling';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const MODULES = [
  ['students', 'Students', 'Student records and enrollment data.'],
  ['staff', 'Staff', 'Staff/user records without passwords or security tokens.'],
  ['classes', 'Classes', 'Classes and class-subject assignments.'],
  ['attendance', 'Attendance', 'Attendance records.'],
  ['results', 'Results', 'Subject scores and result approvals.'],
  ['payments', 'Payments', 'Subscriptions, payments and payment reviews.'],
  ['fees', 'Fees', 'Fee structures and fee payment records.'],
  ['audit', 'Audit', 'School audit history.'],
  ['timetable', 'Timetable', 'Class and examination timetable data.'],
  ['announcements', 'Announcements', 'Announcements and read-state records.'],
];

export default function BackupPage() {
  const [message, setMessage] = useState(null);
  const [selectedModule, setSelectedModule] = useState('students');

  const fullBackup = useExportPolling(exportsApi.requestSchoolBackup);

  const moduleMutation = useMutation({
    mutationFn: governanceApi.downloadSchoolModule,
    onSuccess: () => setMessage({ type: 'success', text: `${selectedModule} export downloaded successfully.` }),
    onError: (error) => setMessage({ type: 'error', text: error.response?.data?.message ?? 'The module export could not be created.' }),
  });

  const busy = moduleMutation.isPending;

  function backupStatusLabel() {
    switch (fullBackup.status) {
      case 'requesting': return 'Requesting backup…';
      case 'queued': return 'Queued — this can take a few minutes to start.';
      case 'processing': return 'Building your backup…';
      case 'completed': return 'Your backup is ready.';
      case 'failed': return fullBackup.errorMessage ?? 'The backup could not be created.';
      default: return null;
    }
  }

  return (
    <>
      <PageHeader title="Data Backup & Export" description="Download a secure copy of your school records or export one module at a time." />
      <div className="p-4 md:p-8 max-w-4xl space-y-5">
        <Card title="Full school backup">
          <div className="space-y-4">
            <p className="text-sm text-muted">The archive contains school records, academic data, students, staff, results, attendance, fees, payments, timetable data, announcements, audit logs and referenced school files.</p>
            <div className="rounded-lg bg-primary-soft border border-border p-4 text-sm text-ink">
              <strong>Security:</strong> passwords, active login tokens, sessions and password-reset tokens are intentionally excluded. The ZIP is a recovery/data archive, not a runnable database dump.
            </div>
            <div className="rounded-lg bg-primary-soft border border-border p-4 text-sm text-ink">
              This builds in the background rather than while you wait — for a school with a lot of students, a live download risked timing out mid-way. Come back to this page any time and the status below will pick up where it left off; you'll also get a notification when it's ready.
            </div>
            {backupStatusLabel() && (
              <p className={`text-sm rounded-lg px-3 py-2 ${fullBackup.status === 'completed' ? 'text-success bg-success-soft' : fullBackup.status === 'failed' ? 'text-danger bg-danger-soft' : 'text-ink bg-primary-soft'}`}>
                {backupStatusLabel()}
              </p>
            )}
            {fullBackup.status === 'completed' ? (
              <div className="flex gap-3">
                <Button type="button" onClick={fullBackup.openDownload}>Download backup</Button>
                <Button type="button" variant="secondary" onClick={fullBackup.reset}>Start a new backup</Button>
              </div>
            ) : (
              <Button type="button" disabled={fullBackup.isBusy} onClick={() => fullBackup.request()}>
                {fullBackup.isBusy ? 'Preparing…' : 'Request full school backup'}
              </Button>
            )}
          </div>
        </Card>

        <Card title="Module export">
          <div className="space-y-4">
            <p className="text-sm text-muted">Use a module export when you only need a particular dataset. Large tables are streamed during generation to avoid loading the whole school into memory.</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="text-sm text-ink">
                <span className="block text-xs text-muted mb-1">Module</span>
                <select className="w-full border border-border rounded-lg px-3 py-2 bg-surface" value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                  {MODULES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <Button disabled={busy} onClick={() => { setMessage(null); moduleMutation.mutate(selectedModule); }}>
                {moduleMutation.isPending ? 'Preparing export…' : `Download ${selectedModule}`}
              </Button>
            </div>
            <p className="text-xs text-muted">{MODULES.find(([value]) => value === selectedModule)?.[2]}</p>
          </div>
        </Card>

        <Card title="What the full backup includes">
          <ul className="list-disc pl-5 text-sm text-muted space-y-2">
            <li>School profile and authorized user records without credentials.</li>
            <li>Students, classes, subjects, teacher assignments and promotions.</li>
            <li>Sessions, terms, attendance, assessments, scores and approvals.</li>
            <li>Fees, subscriptions, payments, payment reviews and referenced payment proofs.</li>
            <li>Timetable, announcements, notifications and audit history.</li>
            <li>Referenced school logo and other supported school files when available.</li>
            <li>Backup metadata including school, generator, timestamp, application and schema version.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
