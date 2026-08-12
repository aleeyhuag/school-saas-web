import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as myAssignmentsApi from '../../api/myAssignments';
import * as academicApi from '../../api/academic';
import * as scoresApi from '../../api/scores';
import * as resultsApi from '../../api/results';
import * as sessionsApi from '../../api/sessions';
import * as reportsApi from '../../api/reports';
import { readBlobError } from '../../utils/download';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Select } from '../../components/ui/FormFields';

export default function ClassTeacherMarksheetPage() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments'],
    queryFn: myAssignmentsApi.getMyAssignments,
  });
  const myClassAssignment = assignmentsQuery.data?.find((a) => a.is_class_teacher);
  const schoolClassId = myClassAssignment?.school_class_id;

  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  const marksheetQuery = useQuery({
    queryKey: ['marksheet', schoolClassId, termId],
    queryFn: () => scoresApi.getClassMarksheet(schoolClassId, termId),
    enabled: !!schoolClassId && !!termId,
  });

  const subjects = marksheetQuery.data?.subjects ?? [];

  const classResultQuery = useQuery({
    queryKey: ['class-term-result', schoolClassId, termId],
    queryFn: () => resultsApi.getClassTermResult(schoolClassId, termId),
    enabled: !!schoolClassId && !!termId,
  });
  const overallByStudent = Object.fromEntries((classResultQuery.data ?? []).map((r) => [r.student_id, r]));

  // Drives which of Publish / Unpublish / Publish Permanently is
  // shown and enabled — rather than the buttons always being active
  // regardless of the actual current state.
  const statusQuery = useQuery({
    queryKey: ['approval-status', schoolClassId, termId],
    queryFn: () => resultsApi.getApprovalStatus(schoolClassId, termId),
    enabled: !!schoolClassId && !!termId,
  });
  const isPublished = !!statusQuery.data?.published;
  const isLocked = !!statusQuery.data?.locked;
  const marksheetRows = marksheetQuery.data?.students ?? [];

  const [actionMessage, setActionMessage] = useState(null);
  // '' = overview grid (all subjects at once, totals only). Selecting
  // a specific subject switches to a detailed CA/Assignment/Exam
  // breakdown for just that subject — lets a class teacher check one
  // subject at a time, and also makes it obvious whether a subject
  // that "looks missing" from the overview genuinely has no scores
  // yet, or was never synced to this class (Classes & Subjects page).
  const [viewSubjectId, setViewSubjectId] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => resultsApi.approveClassResults(schoolClassId, termId),
    onSuccess: (data) => {
      setActionMessage({ tone: 'success', text: data.message });
      queryClient.invalidateQueries({ queryKey: ['approval-status', schoolClassId, termId] });
    },
    onError: (err) => setActionMessage({ tone: 'danger', text: err.response?.data?.message ?? 'Could not approve.' }),
  });

  const revokeMutation = useMutation({
    mutationFn: () => resultsApi.revokeClassResults(schoolClassId, termId),
    onSuccess: (data) => {
      setActionMessage({ tone: 'success', text: data.message });
      queryClient.invalidateQueries({ queryKey: ['approval-status', schoolClassId, termId] });
    },
    onError: (err) => setActionMessage({ tone: 'danger', text: err.response?.data?.message ?? 'Could not unpublish.' }),
  });

  const [showPermanentModal, setShowPermanentModal] = useState(false);
  const publishPermanentlyMutation = useMutation({
    mutationFn: () => resultsApi.publishPermanently(schoolClassId, termId),
    onSuccess: (data) => {
      setActionMessage({ tone: 'success', text: data.message });
      setShowPermanentModal(false);
      queryClient.invalidateQueries({ queryKey: ['approval-status', schoolClassId, termId] });
    },
    onError: (err) => {
      setShowPermanentModal(false);
      setActionMessage({ tone: 'danger', text: err.response?.data?.message ?? 'Could not publish permanently.' });
    },
  });

  const [isExportingPdfs, setIsExportingPdfs] = useState(false);

  async function handleBulkDownload() {
    setIsExportingPdfs(true);
    setActionMessage(null);
    try {
      await reportsApi.downloadClassReportCards(schoolClassId, termId);
    } catch (err) {
      setActionMessage({ tone: 'danger', text: await readBlobError(err) });
    } finally {
      setIsExportingPdfs(false);
    }
  }

  if (!assignmentsQuery.isLoading && !myClassAssignment) {
    return (
      <>
        <PageHeader title="Marksheet Review" description="Review every subject's scores for your class." />
        <div className="p-4 md:p-8">
          <Card>
            <p className="text-sm text-muted">
              You aren't set up as a Class Teacher for any class yet — ask your school admin to
              assign you under Teacher Assignments.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Marksheet Review"
        description={myClassAssignment ? `${myClassAssignment.school_class.name} ${myClassAssignment.school_class.arm}` : ''}
        action={
          <div className="flex gap-2 items-center">
            {subjects.length > 0 && (
              <Select
                className="w-48"
                value={viewSubjectId}
                onChange={(e) => setViewSubjectId(e.target.value)}
              >
                <option value="">Overview (all subjects)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — detail view</option>
                ))}
              </Select>
            )}
            <Button
              variant="secondary"
              onClick={handleBulkDownload}
              disabled={isExportingPdfs}
            >
              {isExportingPdfs ? 'Zipping…' : '↓ All Report Cards (PDF)'}
            </Button>

            {isLocked ? (
              <Badge tone="primary">Permanently published</Badge>
            ) : isPublished ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => revokeMutation.mutate()}
                  disabled={revokeMutation.isPending}
                >
                  {revokeMutation.isPending ? 'Unpublishing…' : 'Unpublish'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowPermanentModal(true)}
                  disabled={publishPermanentlyMutation.isPending}
                >
                  Publish Permanently
                </Button>
              </>
            ) : (
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? 'Publishing…' : 'Approve & Publish'}
              </Button>
            )}
          </div>
        }
      />

      <div className="p-4 md:p-8">
        {actionMessage && (
          <p
            className={`text-sm rounded-lg px-3 py-2 mb-4 ${
              actionMessage.tone === 'success' ? 'text-success bg-success-soft' : 'text-danger bg-danger-soft'
            }`}
          >
            {actionMessage.text}
          </p>
        )}

        {currentTermQuery.isError && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-danger bg-danger-soft">
            No current term has been set for this school. Ask the school administrator to activate a term before reviewing the marksheet.
          </p>
        )}

        {marksheetQuery.isError && !currentTermQuery.isError && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-danger bg-danger-soft">
            {marksheetQuery.error?.response?.data?.message ?? 'Could not load the marksheet.'}
          </p>
        )}

        <Card>
          <p className="text-xs text-muted mb-4">
            {isLocked
              ? 'Results are permanently published — parents and students can see them, and scores can no longer be edited or unpublished.'
              : isPublished
                ? "Results are published — parents and students can see them. You can still unpublish if a mistake is found, or make it permanent once you're confident it's final."
                : 'Scores are compiled by each subject teacher. Once you approve, parents and students can see this term\'s results.'}
          </p>

          {subjects.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">
              No subjects are attached to this class yet — ask your admin to set that up under
              Classes & Subjects.
            </p>
          ) : viewSubjectId ? (
            <SubjectDetailTable
              subject={subjects.find((s) => s.id === Number(viewSubjectId))}
              rows={marksheetRows}
              subjectId={Number(viewSubjectId)}
              isLoading={marksheetQuery.isLoading}
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                    <th className="px-5 py-2">Student</th>
                    {subjects.map((s) => (
                      <th key={s.id} className="px-5 py-2 whitespace-nowrap">{s.name}</th>
                    ))}
                    <th className="px-5 py-2">Total</th>
                    <th className="px-5 py-2">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {marksheetRows.map((row) => (
                    <tr key={row.student_id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium text-ink whitespace-nowrap">{row.student_name}</td>
                      {subjects.map((s) => {
                        const cell = row.scores[s.id];
                        return (
                          <td key={s.id} className="px-5 py-3 whitespace-nowrap">
                            {cell ? (
                              <span>
                                {cell.total_score} <Badge tone="primary">{cell.grade ?? '—'}</Badge>
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-5 py-3 font-semibold text-ink">
                        {overallByStudent[row.student_id]?.grand_total ?? '—'}
                      </td>
                      <td className="px-5 py-3">{overallByStudent[row.student_id]?.position ?? '—'}</td>
                    </tr>
                  ))}
                  {marksheetQuery.isLoading && (
                    <tr>
                      <td colSpan={subjects.length + 3} className="px-5 py-8 text-center text-muted">
                        Loading marksheet…
                      </td>
                    </tr>
                  )}
                  {marksheetRows.length === 0 && !marksheetQuery.isLoading && (
                    <tr>
                      <td colSpan={subjects.length + 3} className="px-5 py-8 text-center text-muted">
                        No scores entered yet for this class this term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal open={showPermanentModal} onClose={() => setShowPermanentModal(false)} title="Publish results permanently?">
        <div className="space-y-4">
          <p className="text-sm text-ink">
            This makes {myClassAssignment?.school_class.name} {myClassAssignment?.school_class.arm}'s results
            for this term <strong>permanent</strong>. After this:
          </p>
          <ul className="text-sm text-muted list-disc pl-5 space-y-1">
            <li>Scores can no longer be edited by any subject teacher.</li>
            <li>Results can no longer be unpublished.</li>
            <li>Parents and students keep seeing them exactly as they are now.</li>
          </ul>
          <p className="text-sm text-muted">
            This can't be undone from here — only school management can help if a correction is needed
            after this point. Make sure everything is correct first.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPermanentModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => publishPermanentlyMutation.mutate()}
              disabled={publishPermanentlyMutation.isPending}
            >
              {publishPermanentlyMutation.isPending ? 'Publishing…' : 'Yes, publish permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/**
 * The detailed, single-subject view shown when a specific subject is
 * picked from the dropdown — full CA/Assignment/Exam breakdown per
 * student, not just the total+grade the overview grid shows. Uses
 * data already fetched for the overview (no extra API call).
 */
function SubjectDetailTable({ subject, rows, subjectId, isLoading }) {
  if (isLoading) {
    return <p className="text-sm text-muted py-8 text-center">Loading…</p>;
  }

  const studentsWithScores = (rows ?? []).filter((row) => row.scores[subjectId]);

  if (studentsWithScores.length === 0) {
    return (
      <p className="text-sm text-muted py-8 text-center">
        No scores entered yet for {subject?.name ?? 'this subject'} this term.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
            <th className="px-5 py-2">Student</th>
            <th className="px-3 py-2">CA</th>
            <th className="px-3 py-2">Assignment</th>
            <th className="px-3 py-2">Exam</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Grade</th>
            <th className="px-3 py-2">Comment</th>
          </tr>
        </thead>
        <tbody>
          {studentsWithScores.map((row) => {
            const cell = row.scores[subjectId];
            return (
              <tr key={row.student_id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 font-medium text-ink whitespace-nowrap">{row.student_name}</td>
                <td className="px-3 py-3">{cell.ca.score ?? '—'} / {cell.ca.max}</td>
                <td className="px-3 py-3">{cell.assignment.score ?? '—'} / {cell.assignment.max}</td>
                <td className="px-3 py-3">{cell.exam.score ?? '—'} / {cell.exam.max}</td>
                <td className="px-3 py-3 font-semibold text-ink">{cell.total_score}</td>
                <td className="px-3 py-3"><Badge tone="primary">{cell.grade ?? '—'}</Badge></td>
                <td className="px-3 py-3 text-muted text-xs">{cell.teacher_comment ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
