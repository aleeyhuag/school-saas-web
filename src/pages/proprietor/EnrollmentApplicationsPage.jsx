import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as enrollmentApi from '../../api/enrollmentApplications';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/PageHeader';
import { Field, Textarea } from '../../components/ui/FormFields';

const STATUS_TONES = { pending: 'warning', approved: 'success', rejected: 'danger' };

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Review queue for applications submitted through the school's public
 * enrollment link (see Settings for the link + toggle). Nothing here
 * becomes a real student until Approve is clicked — see
 * EnrollmentApplicationController::approve() for what that actually
 * creates.
 */
export default function EnrollmentApplicationsPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: ['enrollment-applications'],
    queryFn: enrollmentApi.getEnrollmentApplications,
  });

  const [detailId, setDetailId] = useState(null);
  const detailQuery = useQuery({
    queryKey: ['enrollment-application-detail', detailId],
    queryFn: () => enrollmentApi.getEnrollmentApplication(detailId),
    enabled: !!detailId,
  });

  const [approveResult, setApproveResult] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState(null);

  const approveMutation = useMutation({
    mutationFn: enrollmentApi.approveEnrollmentApplication,
    onSuccess: (data) => {
      setApproveResult(data);
      queryClient.invalidateQueries({ queryKey: ['enrollment-applications'] });
    },
    onError: (err) => setActionError(err.response?.data?.message ?? 'Could not approve this application.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => enrollmentApi.rejectEnrollmentApplication(id, reason),
    onSuccess: () => {
      setDetailId(null);
      queryClient.invalidateQueries({ queryKey: ['enrollment-applications'] });
    },
    onError: (err) => setActionError(err.response?.data?.message ?? 'Could not reject this application.'),
  });

  function openDetail(id) {
    setDetailId(id);
    setApproveResult(null);
    setShowRejectForm(false);
    setRejectReason('');
    setActionError(null);
  }

  function closeDetail() {
    setDetailId(null);
  }

  const columns = [
    { key: 'student', label: 'Student', render: (row) => `${row.first_name} ${row.last_name}` },
    { key: 'class', label: 'Class', render: (row) => row.school_class ? `${row.school_class.name} ${row.school_class.arm}` : '—' },
    { key: 'guardian_name', label: 'Guardian' },
    { key: 'created_at', label: 'Applied', render: (row) => formatDate(row.created_at) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openDetail(row.id)}>
          View
        </Button>
      ),
    },
  ];

  const detail = detailQuery.data;

  return (
    <>
      <PageHeader
        title="Enrollment Applications"
        description="Applications submitted through your school's online enrollment link."
      />

      <div className="p-4 md:p-8">
        <Card>
          <DataTable
            columns={columns}
            rows={listQuery.data}
            emptyMessage={listQuery.isLoading ? 'Loading…' : 'No applications yet.'}
          />
        </Card>
      </div>

      <Modal open={!!detailId} onClose={closeDetail} title="Enrollment application">
        {!detail ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : approveResult ? (
          <div className="space-y-3 text-sm">
            <p className="text-ink">
              <strong>{approveResult.student.first_name} {approveResult.student.last_name}</strong> enrolled
              — admission number <strong>{approveResult.student.admission_number}</strong>.
            </p>
            <div className="bg-warning-soft border border-warning/20 rounded-lg p-3">
              <p className="text-xs text-muted mb-1">Student login temporary password (share once):</p>
              <p className="font-mono text-sm text-ink">{approveResult.student_temporary_password}</p>
            </div>
            {approveResult.guardian_temporary_password && (
              <div className="bg-warning-soft border border-warning/20 rounded-lg p-3">
                <p className="text-xs text-muted mb-1">
                  Guardian login ({approveResult.guardian_email}) temporary password:
                </p>
                <p className="font-mono text-sm text-ink">{approveResult.guardian_temporary_password}</p>
              </div>
            )}
            <Button className="w-full" onClick={closeDetail}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            {actionError && <p className="text-danger">{actionError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-muted text-xs">Student</p><p className="text-ink">{detail.application.first_name} {detail.application.last_name}</p></div>
              <div><p className="text-muted text-xs">Class</p><p className="text-ink">{detail.application.school_class ? `${detail.application.school_class.name} ${detail.application.school_class.arm}` : '—'}</p></div>
              <div><p className="text-muted text-xs">Date of birth</p><p className="text-ink">{formatDate(detail.application.date_of_birth)}</p></div>
              <div><p className="text-muted text-xs">Gender</p><p className="text-ink">{detail.application.gender ?? '—'}</p></div>
              <div><p className="text-muted text-xs">Guardian</p><p className="text-ink">{detail.application.guardian_name}</p></div>
              <div><p className="text-muted text-xs">Contact</p><p className="text-ink">{detail.application.guardian_email}<br/>{detail.application.guardian_phone}</p></div>
            </div>

            {detail.payment_proof_url && (
              <div>
                <p className="text-muted text-xs mb-2">Proof of payment</p>
                <a href={detail.payment_proof_url} target="_blank" rel="noreferrer">
                  <img src={detail.payment_proof_url} alt="Payment proof" className="max-h-64 rounded-lg border border-border" />
                </a>
              </div>
            )}

            {detail.application.status === 'pending' && (
              showRejectForm ? (
                <div className="border-t border-border pt-4">
                  <Field label="Reason for rejecting">
                    <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                    <Button
                      variant="danger"
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ id: detailId, reason: rejectReason })}
                    >
                      {rejectMutation.isPending ? 'Rejecting…' : 'Confirm rejection'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button
                    className="flex-1"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(detailId)}
                  >
                    {approveMutation.isPending ? 'Approving…' : 'Approve & enroll'}
                  </Button>
                  <Button variant="danger" onClick={() => setShowRejectForm(true)}>Reject</Button>
                </div>
              )
            )}

            {detail.application.status === 'rejected' && (
              <p className="text-xs text-muted border-t border-border pt-3">
                Rejected: {detail.application.rejection_reason}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
