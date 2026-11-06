import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import * as academicApi from '../api/academic';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Select } from './ui/FormFields';

/**
 * Get student sign-in details.
 *
 * Passwords are stored hashed, so an existing password can never be shown. This
 * sets a NEW password for each chosen student (their old one stops working) and
 * shows it once, together with the username — the student's admission number.
 *
 *  - `students` given  -> reset just those students (the "Get login" button on a row)
 *  - `students` null   -> pick a class and reset everyone in it (class login slips)
 *
 * The parent mounts this only while it is open, so every opening starts fresh.
 * Results can be printed as cut-out slips, downloaded as CSV, or copied as text.
 */
function downloadTextFile(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function StudentLoginSlipsModal({ open, onClose, classes = [], students = null }) {
  const { school } = useAuth();
  const [classId, setClassId] = useState('');
  const [step, setStep] = useState('choose'); // choose | working | done
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const loginAddress = Capacitor.isNativePlatform() ? 'skulag.com.ng' : window.location.host;
  const singleMode = Array.isArray(students);
  const selectedClass = classes.find((c) => String(c.id) === String(classId));

  async function generate() {
    setError(null);
    setStep('working');
    try {
      let ids;
      if (singleMode) {
        ids = students.map((s) => s.id);
      } else {
        const classStudents = await academicApi.getStudents({ school_class_id: classId });
        ids = classStudents.map((s) => s.id);
        if (ids.length === 0) {
          setError('There are no students in this class yet.');
          setStep('choose');
          return;
        }
      }
      setProgress({ done: 0, total: ids.length });
      const data = await academicApi.resetStudentLogins(ids, (done, total) => setProgress({ done, total }));
      setResult(data);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not get the login details. Check your connection and try again.');
      setStep('choose');
    }
  }

  const credentials = result?.credentials ?? [];

  function downloadCsv() {
    const rows = credentials.map((c) => [c.name, c.class, c.username, c.temporary_password].map(csvCell).join(','));
    downloadTextFile('student-logins.csv', ['name,class,username,password', ...rows].join('\n'));
  }

  async function copyAll() {
    const text = credentials
      .map((c) => `${c.name} (${c.class})\nUsername: ${c.username}\nPassword: ${c.temporary_password}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(`${school?.name ?? 'Skulag'} — student logins\nSign in at ${loginAddress}\n\n${text}`);
      setCopied(true);
    } catch {
      setError('Could not copy. Use Download CSV instead.');
    }
  }

  const title = singleMode ? 'Student login' : 'Student login slips';

  return (
    <>
      <Modal open={open} onClose={onClose} title={title}>
        {step === 'choose' && (
          <div>
            {error && <p className="text-sm text-danger mb-3">{error}</p>}
            {singleMode ? (
              <p className="text-sm text-ink mb-3">
                Get a login for{' '}
                <strong>
                  {students[0].first_name} {students[0].last_name}
                </strong>
                . The username is the admission number (<span className="font-mono">{students[0].admission_number}</span>).
              </p>
            ) : (
              <>
                <p className="text-sm text-ink mb-3">
                  Choose a class to print a login slip for every student in it. The username is each student's
                  admission number.
                </p>
                <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="mb-3">
                  <option value="">Select a class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.arm}
                    </option>
                  ))}
                </Select>
              </>
            )}
            <p className="text-xs text-warning bg-warning-soft rounded-lg px-3 py-2 mb-4">
              A password already chosen by a student cannot be read back, so this sets a <strong>new</strong> password
              {singleMode ? '' : ' for every student in the class'}. The old password stops working and the student is
              signed out of other devices.
            </p>
            <Button className="w-full" disabled={!singleMode && !selectedClass} onClick={generate}>
              {singleMode ? 'Set new password and show it' : 'Generate login slips'}
            </Button>
          </div>
        )}

        {step === 'working' && (
          <p className="text-sm text-muted text-center py-6">
            Working… {progress.total > 0 ? `${progress.done} of ${progress.total} students` : ''}
          </p>
        )}

        {step === 'done' && (
          <div>
            {error && <p className="text-sm text-danger mb-3">{error}</p>}
            <p className="text-sm text-ink mb-3">
              {credentials.length} login{credentials.length === 1 ? '' : 's'} ready. Passwords are shown only now —
              print or save them before closing.
            </p>

            <div className="max-h-64 overflow-y-auto border border-border rounded-lg mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="px-2 py-1.5">Student</th>
                    <th className="px-2 py-1.5">Username</th>
                    <th className="px-2 py-1.5">Password</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr key={c.student_id} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5 text-ink">{c.name}</td>
                      <td className="px-2 py-1.5 font-mono">{c.username}</td>
                      <td className="px-2 py-1.5 font-mono">{c.temporary_password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result?.skipped?.length > 0 && (
              <p className="text-xs text-danger mb-3">
                {result.skipped.length} could not be done: {result.skipped.map((s) => s.name ?? `#${s.student_id}`).join(', ')}.
                Try those again.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" onClick={() => window.print()} disabled={credentials.length === 0}>
                Print
              </Button>
              <Button size="sm" variant="secondary" onClick={downloadCsv} disabled={credentials.length === 0}>
                CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={copyAll} disabled={credentials.length === 0}>
                {copied ? 'Copied ✓' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] text-muted mt-3">
              Printing does not work inside the Android app — use Copy or CSV there, or print from the website.
            </p>
          </div>
        )}
      </Modal>

      {/* Print-only slips. Rendered outside the app so the browser prints just these. */}
      {open &&
        step === 'done' &&
        createPortal(
          <div id="login-slips-print">
            <style>{`
              #login-slips-print { display: none; }
              @media print {
                body > *:not(#login-slips-print) { display: none !important; }
                #login-slips-print { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; padding: 8px; font-family: Arial, sans-serif; color: #000; }
                #login-slips-print .slip { border: 1px dashed #555; border-radius: 6px; padding: 10px 12px; break-inside: avoid; page-break-inside: avoid; }
                #login-slips-print .slip h4 { margin: 0 0 6px; font-size: 13px; }
                #login-slips-print .slip p { margin: 2px 0; font-size: 12px; }
                #login-slips-print .slip .mono { font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; }
                #login-slips-print .slip .small { font-size: 10px; color: #444; margin-top: 6px; }
              }
            `}</style>
            {credentials.map((c) => (
              <div className="slip" key={c.student_id}>
                <h4>{school?.name ?? 'Skulag'} — Student login</h4>
                <p>
                  <strong>{c.name}</strong>
                  {c.class ? ` · ${c.class}` : ''}
                </p>
                <p>
                  Username: <span className="mono">{c.username}</span>
                </p>
                <p>
                  Password: <span className="mono">{c.temporary_password}</span>
                </p>
                <p className="small">Sign in at {loginAddress} or the Skulag app. Keep this private.</p>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
