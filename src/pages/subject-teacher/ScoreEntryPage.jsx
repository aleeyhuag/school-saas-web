import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as myAssignmentsApi from '../../api/myAssignments';
import * as academicApi from '../../api/academic';
import * as scoresApi from '../../api/scores';
import * as resultsApi from '../../api/results';
import * as sessionsApi from '../../api/sessions';
import { submitOrQueue } from '../../offline/syncEngine';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Select, Input } from '../../components/ui/FormFields';

const EMPTY_ROW = {
  ca_score: '', ca_max: '20',
  assignment_score: '', assignment_max: '10',
  exam_score: '', exam_max: '100',
  teacher_comment: '',
};

export default function ScoreEntryPage() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments'],
    queryFn: myAssignmentsApi.getMyAssignments,
  });
  // Only the actual subject assignments — not their class-teacher one, if they have both.
  const subjectAssignments = (assignmentsQuery.data ?? []).filter((a) => a.subject_id);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  useEffect(() => {
    if (!selectedAssignmentId && subjectAssignments.length) {
      setSelectedAssignmentId(String(subjectAssignments[0].id));
    }
  }, [subjectAssignments, selectedAssignmentId]);

  const activeAssignment = subjectAssignments.find((a) => a.id === Number(selectedAssignmentId));

  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  const studentsQuery = useQuery({
    queryKey: ['students', activeAssignment?.school_class_id],
    queryFn: () => academicApi.getStudents({ school_class_id: activeAssignment.school_class_id }),
    enabled: !!activeAssignment,
  });

  const existingScoresQuery = useQuery({
    queryKey: ['subject-scores', activeAssignment?.school_class_id, activeAssignment?.subject_id, termId],
    queryFn: () =>
      scoresApi.getSubjectScores({
        school_class_id: activeAssignment.school_class_id,
        subject_id: activeAssignment.subject_id,
        term_id: termId,
      }),
    enabled: !!activeAssignment && !!termId,
  });

  // The class teacher may have permanently published this class's
  // results since scores were last entered — once that's happened,
  // editing is blocked (also enforced server-side; this just avoids
  // a teacher filling in a whole row only to have the save rejected).
  const statusQuery = useQuery({
    queryKey: ['approval-status', activeAssignment?.school_class_id, termId],
    queryFn: () => resultsApi.getApprovalStatus(activeAssignment.school_class_id, termId),
    enabled: !!activeAssignment && !!termId,
  });
  const isLocked = !!statusQuery.data?.locked;

  const [rows, setRows] = useState({});

  // Seed the editable rows once students + any existing scores load —
  // previously-entered scores stay editable, everyone else starts blank.
  useEffect(() => {
    if (!studentsQuery.data) return;
    const existingByStudent = Object.fromEntries(
      (existingScoresQuery.data ?? []).map((r) => [r.student_id, r])
    );
    setRows(
      Object.fromEntries(
        studentsQuery.data.map((s) => {
          const existing = existingByStudent[s.id];
          return [
            s.id,
            existing
              ? {
                  ca_score: existing.ca.score ?? '',
                  ca_max: existing.ca.max ?? '20',
                  assignment_score: existing.assignment.score ?? '',
                  assignment_max: existing.assignment.max ?? '10',
                  exam_score: existing.exam.score ?? '',
                  exam_max: existing.exam.max ?? '100',
                  teacher_comment: existing.teacher_comment ?? '',
                }
              : { ...EMPTY_ROW },
          ];
        })
      )
    );
  }, [studentsQuery.data, existingScoresQuery.data]);

  const { queue: syncQueue } = useSyncQueue();
  const [queuedByStudent, setQueuedByStudent] = useState({});

  const [savedStudentId, setSavedStudentId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const saveMutation = useMutation({
    mutationFn: (payload) => submitOrQueue('score_save', payload),
    onSuccess: (result, variables) => {
      setSaveError(null);

      if (result.queued) {
        setQueuedByStudent((prev) => ({ ...prev, [variables.student_id]: result.clientUuid }));
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['subject-scores'] });
      setSavedStudentId(variables.student_id);
      setTimeout(() => setSavedStudentId(null), 2000);
    },
    onError: (error) => {
      const validation = error.response?.data?.errors;
      const firstError = validation ? Object.values(validation).flat()[0] : null;
      setSaveError(firstError || error.response?.data?.message || 'Could not save this score. Please try again.');
    },
  });

  // A row stays flagged "offline — pending sync" only as long as its
  // queued operation is still actually sitting in the queue. Once the
  // sync engine drains it (or it's resolved as a conflict — the global
  // OfflineIndicator handles that part), it naturally drops out here.
  function isRowQueued(studentId) {
    const uuid = queuedByStudent[studentId];
    return !!uuid && syncQueue.some((item) => item.client_uuid === uuid);
  }

  function updateRow(studentId, field, value) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  }

  function saveRow(studentId) {
    const row = rows[studentId];
    saveMutation.mutate({
      term_id: termId,
      school_class_id: activeAssignment.school_class_id,
      subject_id: activeAssignment.subject_id,
      student_id: studentId,
      ca_score: row.ca_score === '' ? null : Number(row.ca_score),
      ca_max: Number(row.ca_max),
      assignment_score: row.assignment_score === '' ? null : Number(row.assignment_score),
      assignment_max: Number(row.assignment_max),
      exam_score: row.exam_score === '' ? null : Number(row.exam_score),
      exam_max: Number(row.exam_max),
      teacher_comment: row.teacher_comment || null,
    });
  }

  const numberInputClasses = 'w-16 px-2 py-1 border border-border rounded text-sm text-center';

  if (!assignmentsQuery.isLoading && subjectAssignments.length === 0) {
    return (
      <>
        <PageHeader title="Score Entry" description="Enter CA, assignment, and exam scores." />
        <div className="p-4 md:p-8">
          <Card>
            <p className="text-sm text-muted">
              You aren't assigned to teach any subject yet — ask your school admin to assign you
              under Teacher Assignments.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Score Entry"
        description="Enter each student's raw scores — totals and grades are computed automatically."
        action={
          subjectAssignments.length > 1 && (
            <Select
              className="w-64"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
            >
              {subjectAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.school_class.name} {a.school_class.arm} — {a.subject.name}
                </option>
              ))}
            </Select>
          )
        }
      />

      <div className="p-4 md:p-8">
        {activeAssignment && (
          <p className="text-sm text-muted mb-4">
            {activeAssignment.school_class.name} {activeAssignment.school_class.arm} —{' '}
            <Badge tone="success">{activeAssignment.subject.name}</Badge>
          </p>
        )}

        {currentTermQuery.isError && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-danger bg-danger-soft">
            No current term has been set for this school. Ask the school administrator to activate a term before entering scores.
          </p>
        )}

        {saveError && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-danger bg-danger-soft">
            {saveError}
          </p>
        )}

        {isLocked && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-muted bg-primary-soft">
            This class's results have been permanently published for this term — scores are locked and
            can no longer be edited.
          </p>
        )}

        <Card>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                  <th className="px-5 py-2">Student</th>
                  <th className="px-3 py-2">CA</th>
                  <th className="px-3 py-2">/Max</th>
                  <th className="px-3 py-2">Assignment</th>
                  <th className="px-3 py-2">/Max</th>
                  <th className="px-3 py-2">Exam</th>
                  <th className="px-3 py-2">/Max</th>
                  <th className="px-3 py-2">Comment</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {studentsQuery.data?.map((student) => {
                  const row = rows[student.id] ?? EMPTY_ROW;
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 font-medium text-ink whitespace-nowrap">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.ca_score}
                          onChange={(e) => updateRow(student.id, 'ca_score', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.ca_max}
                          onChange={(e) => updateRow(student.id, 'ca_max', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.assignment_score}
                          onChange={(e) => updateRow(student.id, 'assignment_score', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.assignment_max}
                          onChange={(e) => updateRow(student.id, 'assignment_max', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.exam_score}
                          onChange={(e) => updateRow(student.id, 'exam_score', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          type="number"
                          className={numberInputClasses}
                          value={row.exam_max}
                          onChange={(e) => updateRow(student.id, 'exam_max', e.target.value)}
                        />
                      </td>
                      <td className="px-1 py-2">
                        <Input
                          disabled={isLocked}
                          className="w-40 px-2 py-1 text-sm"
                          value={row.teacher_comment}
                          onChange={(e) => updateRow(student.id, 'teacher_comment', e.target.value)}
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveRow(student.id)}
                            disabled={isLocked || saveMutation.isPending || !termId}
                          >
                            {savedStudentId === student.id ? 'Saved ✓' : 'Save'}
                          </Button>
                          {isRowQueued(student.id) && (
                            <span className="text-[10px] text-warning bg-warning-soft px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              Offline — pending sync
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {studentsQuery.isLoading && (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-muted">Loading students…</td>
                  </tr>
                )}
                {studentsQuery.data?.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-muted">No students in this class yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
