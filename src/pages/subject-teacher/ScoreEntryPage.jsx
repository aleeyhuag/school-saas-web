import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as myAssignmentsApi from '../../api/myAssignments';
import * as academicApi from '../../api/academic';
import * as scoresApi from '../../api/scores';
import * as resultsApi from '../../api/results';
import * as sessionsApi from '../../api/sessions';
import * as gradingApi from '../../api/grading';
import { queueOnly } from '../../offline/syncEngine';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import QueryBoundary from '../../components/ui/QueryBoundary';
import { Select, Input } from '../../components/ui/FormFields';

/**
 * Score entry.
 *
 * Every score is typed directly OUT OF ITS WEIGHT — the exam officer decides how
 * many CAs the school has and what each carries (CA 1 /10, CA 2 /10, Exam /70 …),
 * and the column headers show it. There is no "max score" to fill in.
 *
 * Teachers fill in the whole class and press ONE Save all button; only the
 * students whose scores changed are sent, in a single request.
 */

// Handled here so the input never fights the shared <Input>'s w-full / px-3.
const NUMBER_INPUT_CLASSES =
  'w-20! min-w-20 px-2! py-1.5! text-center ' +
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const FALLBACK_COMPONENTS = [
  { key: 'ca', label: 'CA', weight: 30 },
  { key: 'assignment', label: 'Assignment', weight: 10 },
  { key: 'exam', label: 'Exam', weight: 60 },
];

function numberOrNull(value) {
  return value === '' || value == null ? null : Number(value);
}

export default function ScoreEntryPage() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments'],
    queryFn: myAssignmentsApi.getMyAssignments,
  });
  // Only the actual subject assignments — not their class-teacher one, if they have both.
  const subjectAssignments = (assignmentsQuery.data ?? []).filter((a) => a.subject_id);

  // Until the teacher picks one, the first assignment is used (no effect needed).
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const currentAssignmentId = selectedAssignmentId || (subjectAssignments[0] ? String(subjectAssignments[0].id) : '');
  const activeAssignment = subjectAssignments.find((a) => a.id === Number(currentAssignmentId));
  const classId = activeAssignment?.school_class_id;
  const subjectId = activeAssignment?.subject_id;

  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  // The exam officer's setup: which score columns exist and what each is out of.
  const settingsQuery = useQuery({
    queryKey: ['assessment-settings'],
    queryFn: gradingApi.getAssessmentSettings,
    staleTime: 5 * 60 * 1000,
  });
  const components = settingsQuery.data?.components ?? FALLBACK_COMPONENTS;
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);

  const studentsQuery = useQuery({
    // "lite" skips guardians/login/class details this page never shows (fewer
    // database queries on the server) — a separate key keeps it apart from the
    // full student lists used elsewhere.
    queryKey: ['students-roster', classId],
    queryFn: () => academicApi.getStudents({ school_class_id: classId, lite: 1 }),
    enabled: !!activeAssignment,
  });
  const students = studentsQuery.data;

  const existingScoresQuery = useQuery({
    queryKey: ['subject-scores', classId, subjectId, termId],
    queryFn: () => scoresApi.getSubjectScores({ school_class_id: classId, subject_id: subjectId, term_id: termId }),
    enabled: !!activeAssignment && !!termId,
  });

  // The class teacher may have permanently published this class's results since
  // scores were last entered — once that's happened, editing is blocked (also
  // enforced server-side; this just avoids filling in a whole class for nothing).
  const statusQuery = useQuery({
    queryKey: ['approval-status', classId, termId],
    queryFn: () => resultsApi.getApprovalStatus(classId, termId),
    enabled: !!activeAssignment && !!termId,
  });
  const isLocked = !!statusQuery.data?.locked;

  // ---- What's saved on the server (the baseline) ----
  const baseline = useMemo(() => {
    const byStudent = {};
    (existingScoresQuery.data ?? []).forEach((row) => {
      const values = { teacher_comment: row.teacher_comment ?? '' };
      ['ca', 'ca2', 'ca3', 'assignment', 'exam'].forEach((key) => {
        const part = row[key];
        if (!part || part.score == null) {
          values[`${key}_score`] = '';
        } else if (Number(part.max) === Number(part.weight)) {
          values[`${key}_score`] = String(part.score);
        } else {
          // Older entry that was marked out of a different number: show it as
          // points out of the weight, so what's on screen matches the total.
          values[`${key}_score`] = String(part.weighted);
        }
      });
      byStudent[row.student_id] = values;
    });
    return byStudent;
  }, [existingScoresQuery.data]);

  // ---- What the teacher has typed since (only changed cells are kept) ----
  const [edits, setEdits] = useState({});
  const [serverErrors, setServerErrors] = useState({}); // "studentId:field" -> message
  const [banner, setBanner] = useState(null); // { tone: 'success' | 'error' | 'info', text }
  const [saving, setSaving] = useState(false);

  const { queue: syncQueue } = useSyncQueue();
  const [queuedByStudent, setQueuedByStudent] = useState({});
  const [conflictStudentIds, setConflictStudentIds] = useState({});

  function valueOf(studentId, field) {
    return edits[studentId]?.[field] ?? baseline[studentId]?.[field] ?? '';
  }

  function isRowQueued(studentId) {
    const uuid = queuedByStudent[studentId];
    return !!uuid && syncQueue.some((item) => item.client_uuid === uuid);
  }

  // Students whose typed values differ from what's saved (and aren't already waiting offline).
  const dirtyIds = useMemo(() => {
    return Object.keys(edits)
      .map(Number)
      .filter((id) => {
        if (queuedByStudent[id]) return false;
        return Object.entries(edits[id]).some(([field, value]) => value !== (baseline[id]?.[field] ?? ''));
      });
  }, [edits, baseline, queuedByStudent]);

  function cellProblem(studentId, component) {
    const raw = valueOf(studentId, `${component.key}_score`);
    if (raw === '') return null;
    const number = Number(raw);
    if (Number.isNaN(number) || number < 0) return 'Enter a number from 0 upward.';
    if (number > component.weight) return `${component.label} cannot be more than ${component.weight}.`;
    return null;
  }

  const problemCount = useMemo(() => {
    let count = 0;
    dirtyIds.forEach((id) => {
      components.forEach((component) => {
        if (cellProblem(id, component)) count += 1;
      });
    });
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyIds, edits, components]);

  function updateCell(studentId, field, value) {
    setEdits((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setBanner(null);
    if (serverErrors[`${studentId}:${field}`]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[`${studentId}:${field}`];
        return next;
      });
    }
  }

  function rowPayload(studentId) {
    const payload = { student_id: studentId, teacher_comment: valueOf(studentId, 'teacher_comment') || null };
    components.forEach((component) => {
      payload[`${component.key}_score`] = numberOrNull(valueOf(studentId, `${component.key}_score`));
    });
    return payload;
  }

  function nameOf(studentId) {
    const student = (students ?? []).find((s) => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : `student ${studentId}`;
  }

  async function saveAll() {
    if (dirtyIds.length === 0 || problemCount > 0 || saving || !termId) return;

    setSaving(true);
    setBanner(null);
    setServerErrors({});
    const ids = [...dirtyIds];
    const scores = ids.map(rowPayload);

    try {
      await scoresApi.saveSubjectScoresBulk({
        term_id: termId,
        school_class_id: classId,
        subject_id: subjectId,
        scores,
      });
      // Refresh from the server BEFORE clearing what was typed, so the saved
      // numbers never flash back to the old ones.
      await queryClient.invalidateQueries({ queryKey: ['subject-scores'] });
      setEdits((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setBanner({ tone: 'success', text: `Saved ${ids.length} student${ids.length === 1 ? '' : 's'}. ✓` });
    } catch (error) {
      if (!error.response) {
        // Couldn't reach the server (offline / very slow). Keep the work safe on
        // this device — it uploads by itself when the connection is back.
        const nextQueued = {};
        for (const row of scores) {
          const result = await queueOnly('score_save', {
            term_id: termId,
            school_class_id: classId,
            subject_id: subjectId,
            ...row,
          });
          nextQueued[row.student_id] = result.clientUuid;
        }
        setQueuedByStudent((prev) => ({ ...prev, ...nextQueued }));
        setBanner({
          tone: 'info',
          text: `No connection — ${ids.length} student${ids.length === 1 ? '' : 's'} saved on this device. They will upload automatically when you are back online.`,
        });
      } else if (error.response.status === 422 && error.response.data?.errors) {
        // Point at the exact cells: keys look like "scores.3.ca_score".
        const mapped = {};
        const lines = [];
        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
          const match = key.match(/^scores\.(\d+)\.(.+)$/);
          const message = Array.isArray(messages) ? messages[0] : messages;
          if (match) {
            const studentId = scores[Number(match[1])]?.student_id;
            if (studentId) {
              mapped[`${studentId}:${match[2]}`] = message;
              lines.push(`${nameOf(studentId)}: ${message}`);
              return;
            }
          }
          lines.push(message);
        });
        setServerErrors(mapped);
        setBanner({ tone: 'error', text: `Nothing was saved. ${lines.slice(0, 3).join(' ')}` });
      } else {
        setBanner({
          tone: 'error',
          text: error.response?.data?.message ?? 'Could not save the scores. Please try again.',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  // When saves that were waiting offline have uploaded, refresh from the server.
  useEffect(() => {
    const waiting = Object.entries(queuedByStudent);
    if (waiting.length === 0) return;
    const allDone = waiting.every(([, uuid]) => !syncQueue.some((item) => item.client_uuid === uuid));
    if (allDone) {
      queryClient.invalidateQueries({ queryKey: ['subject-scores'] });
      setEdits((prev) => {
        const next = { ...prev };
        waiting.forEach(([id]) => delete next[id]);
        return next;
      });
      setQueuedByStudent({});
    }
  }, [syncQueue, queuedByStudent, queryClient]);

  // Don't let a refresh or a closed tab silently throw away typed scores.
  useEffect(() => {
    if (dirtyIds.length === 0) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyIds.length]);

  function changeAssignment(nextId) {
    if (dirtyIds.length > 0 && !window.confirm('You have unsaved scores. Discard them and switch?')) return;
    setEdits({});
    setServerErrors({});
    setBanner(null);
    setQueuedByStudent({});
    setConflictStudentIds({});
    setSelectedAssignmentId(nextId);
  }

  // Enter moves down to the same column on the next student, like a spreadsheet.
  function handleEnter(event, studentIndex, field) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const next = students?.[studentIndex + 1];
    if (next) document.getElementById(`cell-${field}-${next.id}`)?.focus();
  }

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

  const saveBar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        {isLocked
          ? 'Scores are locked.'
          : problemCount > 0
          ? `${problemCount} score${problemCount === 1 ? '' : 's'} need fixing before you can save.`
          : dirtyIds.length > 0
          ? `${dirtyIds.length} student${dirtyIds.length === 1 ? '' : 's'} changed — not saved yet.`
          : 'No changes to save.'}
      </p>
      <Button
        onClick={saveAll}
        disabled={isLocked || saving || !termId || dirtyIds.length === 0 || problemCount > 0}
      >
        {saving ? 'Saving…' : dirtyIds.length > 0 ? `Save all (${dirtyIds.length})` : 'Save all'}
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Score Entry"
        description="Type each score out of the number shown in the column heading. Totals and grades are worked out for you."
        action={
          subjectAssignments.length > 1 && (
            <Select className="w-64" value={currentAssignmentId} onChange={(e) => changeAssignment(e.target.value)}>
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

        {banner && (
          <p
            role="status"
            className={`text-sm rounded-lg px-3 py-2 mb-4 ${
              banner.tone === 'success'
                ? 'text-success bg-success-soft'
                : banner.tone === 'info'
                ? 'text-warning bg-warning-soft'
                : 'text-danger bg-danger-soft'
            }`}
          >
            {banner.text}
          </p>
        )}

        {isLocked && (
          <p className="text-sm rounded-lg px-3 py-2 mb-4 text-muted bg-primary-soft">
            This class's results have been permanently published for this term — scores are locked and
            can no longer be edited.
          </p>
        )}

        <Card>
          <QueryBoundary
            query={settingsQuery}
            loadingLabel="Loading the score setup…"
            errorTitle="Could not load the score setup"
          >
            <QueryBoundary query={studentsQuery} loadingLabel="Loading students…" errorTitle="Could not load the students">
              <div className="mb-4">{saveBar}</div>

              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                      <th className="px-5 py-2">Student</th>
                      {components.map((component) => (
                        <th key={component.key} className="px-2 py-2 text-center whitespace-nowrap">
                          {component.label}
                          <span className="block normal-case font-semibold text-ink text-[11px]">
                            out of {component.weight}
                          </span>
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center whitespace-nowrap">
                        Total
                        <span className="block normal-case font-semibold text-ink text-[11px]">
                          out of {totalWeight}
                        </span>
                      </th>
                      <th className="px-3 py-2">Comment</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students?.map((student, index) => {
                      const filled = components.filter((c) => valueOf(student.id, `${c.key}_score`) !== '');
                      const total = filled.reduce((sum, c) => sum + (Number(valueOf(student.id, `${c.key}_score`)) || 0), 0);
                      const isDirty = dirtyIds.includes(student.id);
                      return (
                        <tr
                          key={student.id}
                          className={`border-b border-border last:border-0 ${isDirty ? 'bg-primary-soft/40' : ''}`}
                        >
                          <td className="px-5 py-2 font-medium text-ink whitespace-nowrap">
                            {student.first_name} {student.last_name}
                          </td>
                          {components.map((component) => {
                            const field = `${component.key}_score`;
                            const problem = cellProblem(student.id, component) ?? serverErrors[`${student.id}:${field}`];
                            return (
                              <td key={component.key} className="px-2 py-2 text-center">
                                <Input
                                  id={`cell-${field}-${student.id}`}
                                  disabled={isLocked}
                                  type="number"
                                  inputMode="decimal"
                                  step="any"
                                  min="0"
                                  title={problem ?? ''}
                                  aria-invalid={problem ? 'true' : undefined}
                                  className={`${NUMBER_INPUT_CLASSES} ${problem ? 'border-danger! bg-danger-soft!' : ''}`}
                                  value={valueOf(student.id, field)}
                                  onChange={(e) => updateCell(student.id, field, e.target.value)}
                                  onKeyDown={(e) => handleEnter(e, index, field)}
                                />
                              </td>
                            );
                          })}
                          <td className="px-2 py-2 text-center font-semibold text-ink">
                            {filled.length ? Math.round(total * 10) / 10 : '—'}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              disabled={isLocked}
                              className="w-48! px-2! py-1.5! text-sm"
                              value={valueOf(student.id, 'teacher_comment')}
                              onChange={(e) => updateCell(student.id, 'teacher_comment', e.target.value)}
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {isRowQueued(student.id) && (
                              <span className="text-[10px] text-warning bg-warning-soft px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                Saved on device — waiting to upload
                              </span>
                            )}
                            {conflictStudentIds[student.id] && (
                              <span className="text-[10px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                Not saved — needs review
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {students?.length === 0 && (
                      <tr>
                        <td colSpan={components.length + 4} className="px-5 py-8 text-center text-muted">
                          No students in this class yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 sticky bottom-0 bg-surface border-t border-border pt-3 pb-1">{saveBar}</div>
            </QueryBoundary>
          </QueryBoundary>
        </Card>
      </div>
    </>
  );
}
