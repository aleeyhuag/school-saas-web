import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as attendanceApi from '../api/attendance';
import * as resultsApi from '../api/results';
import * as feesApi from '../api/fees';
import * as reportsApi from '../api/reports';
import Card from './ui/Card';
import Badge from './ui/Badge';

function formatNaira(amount) {
  return `₦${Number(amount ?? 0).toLocaleString()}`;
}

/**
 * The three read-only sections a Parent (for one selected child) or
 * a Student (for themselves) sees: attendance %, term result (gated
 * by Stage 9's approval workflow), and fee status. Shared between
 * both dashboards since the content is identical either way.
 */
export default function ChildOverview({ studentId, termId }) {
  const attendanceQuery = useQuery({
    queryKey: ['attendance-summary', studentId, termId],
    queryFn: () => attendanceApi.getStudentAttendanceSummary(studentId, termId),
    enabled: !!studentId && !!termId,
    retry: false,
  });

  const resultQuery = useQuery({
    queryKey: ['student-term-result', studentId, termId],
    queryFn: () => resultsApi.getStudentTermResult(studentId, termId),
    enabled: !!studentId && !!termId,
    retry: false,
  });

  const feeStatusQuery = useQuery({
    queryKey: ['fee-status', studentId, termId],
    queryFn: () => feesApi.getStudentFeeStatus(studentId, termId),
    enabled: !!studentId && !!termId,
  });

  const [downloadState, setDownloadState] = useState('idle'); // idle | downloading | error

  async function handleDownload() {
    setDownloadState('downloading');
    try {
      await reportsApi.downloadReportCard(studentId, termId);
      setDownloadState('idle');
    } catch (err) {
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 4000);
      console.error('Report card download failed:', err);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Attendance">
        {attendanceQuery.isError ? (
          <p className="text-sm text-muted">
            {attendanceQuery.error?.response?.data?.message ?? "Couldn't load attendance."}
          </p>
        ) : attendanceQuery.data ? (
          <>
            <p className="text-3xl font-bold font-display text-ink">
              {attendanceQuery.data.attendance_percentage ?? '—'}
              {attendanceQuery.data.attendance_percentage !== null && '%'}
            </p>
            <p className="text-sm text-muted mt-1">
              {attendanceQuery.data.total_days_marked} day(s) recorded this term
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Card>

      <Card title="Term Result">
        {resultQuery.isError ? (
          <p className="text-sm text-muted">
            {resultQuery.error?.response?.data?.message ??
              "This term's result hasn't been published yet."}
          </p>
        ) : resultQuery.data ? (
          <>
            <p className="text-3xl font-bold font-display text-ink">
              {resultQuery.data.overall_average ?? '—'}
            </p>
            <p className="text-sm text-muted mt-1">
              Position {resultQuery.data.overall_position ?? '—'} of {resultQuery.data.class_size ?? '—'}
            </p>
            <div className="mt-3 space-y-1">
              {resultQuery.data.subjects?.slice(0, 4).map((s) => (
                <div key={s.subject_id} className="flex justify-between text-xs">
                  <span className="text-muted">{s.subject_name}</span>
                  <span className="text-ink font-medium">
                    {s.total_score} <Badge tone="primary">{s.grade ?? '—'}</Badge>
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadState === 'downloading'}
              className="mt-3 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {downloadState === 'downloading' ? 'Preparing PDF…' : '↓ Download Report Card (PDF)'}
            </button>
            {downloadState === 'error' && (
              <p className="text-xs text-danger mt-1">Could not start the report card download. Please try again.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Card>

      <Card title="Fees">
        {feeStatusQuery.data ? (
          <>
            <p className="text-3xl font-bold font-display text-ink">
              {formatNaira(feeStatusQuery.data.total_balance)}
            </p>
            <p className="text-sm text-muted mt-1">
              {feeStatusQuery.data.total_balance > 0 ? 'Outstanding balance' : 'Fully paid'}
            </p>
            <div className="mt-3 space-y-1">
              {feeStatusQuery.data.fees?.map((fee) => (
                <div key={fee.fee_structure_id} className="flex justify-between text-xs">
                  <span className="text-muted">{fee.name}</span>
                  <span className="text-ink font-medium">
                    {formatNaira(fee.amount_paid)} / {formatNaira(fee.amount_due)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Loading…</p>
        )}
      </Card>
    </div>
  );
}
