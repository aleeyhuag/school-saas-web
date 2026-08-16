import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as myAssignmentsApi from '../../api/myAssignments';
import * as academicApi from '../../api/academic';
import * as attendanceApi from '../../api/attendance';
import * as sessionsApi from '../../api/sessions';
import { submitOrQueue } from '../../offline/syncEngine';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/FormFields';

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'];

const STATUS_STYLES = {
  present: 'bg-success-soft text-success border-success/30',
  absent: 'bg-danger-soft text-danger border-danger/30',
  late: 'bg-warning-soft text-warning border-warning/30',
  excused: 'bg-primary-soft text-primary border-primary/30',
};

export default function ClassTeacherAttendancePage() {
  const queryClient = useQueryClient();

  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments'],
    queryFn: myAssignmentsApi.getMyAssignments,
  });
  const myClassAssignment = assignmentsQuery.data?.find((a) => a.is_class_teacher);
  const schoolClassId = myClassAssignment?.school_class_id;

  const currentTermQuery = useQuery({ queryKey: ['current-term'], queryFn: sessionsApi.getCurrentTerm });
  const termId = currentTermQuery.data?.id;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const studentsQuery = useQuery({
    queryKey: ['students', schoolClassId],
    queryFn: () => academicApi.getStudents({ school_class_id: schoolClassId }),
    enabled: !!schoolClassId,
  });

  const existingAttendanceQuery = useQuery({
    queryKey: ['attendance', schoolClassId, date],
    queryFn: () => attendanceApi.getAttendance({ school_class_id: schoolClassId, date }),
    enabled: !!schoolClassId && !!date,
  });

  const [statuses, setStatuses] = useState({});

  // Whenever the day's existing records load (or the date/class
  // changes), seed the form: previously-marked students keep their
  // saved status, everyone else defaults to "present".
  useEffect(() => {
    if (!studentsQuery.data) return;
    const existingByStudent = Object.fromEntries(
      (existingAttendanceQuery.data ?? []).map((a) => [a.student_id, a.status])
    );
    setStatuses(
      Object.fromEntries(studentsQuery.data.map((s) => [s.id, existingByStudent[s.id] ?? 'present']))
    );
  }, [studentsQuery.data, existingAttendanceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => submitOrQueue('attendance_mark', payload),
    onSuccess: (result) => {
      // A queued (offline) save hasn't actually changed anything on
      // the server yet. Neither has a full 'conflict' response — the
      // request reached the server fine (so `queued` is false) but
      // the server declined to overwrite every record because it saw
      // a newer change it didn't know about. Only refetch once we
      // know the server's data actually moved — 'applied' fully, or
      // 'partial' for the subset that wasn't in conflict.
      if (!result.queued && (result.data?.status === 'applied' || result.data?.status === 'partial')) {
        queryClient.invalidateQueries({ queryKey: ['attendance', schoolClassId, date] });
      }
    },
    onError: (error) => {
      setSubmitError(error.response?.data?.message
        ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
        ?? 'Could not save attendance. Please try again.');
    },
  });
  const [submitError, setSubmitError] = useState(null);

  const allMarked = useMemo(
    () => studentsQuery.data?.every((s) => statuses[s.id]),
    [studentsQuery.data, statuses]
  );

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    saveMutation.mutate({
      term_id: termId,
      school_class_id: schoolClassId,
      subject_id: null, // whole-day, official register — class teacher only
      date,
      records: Object.entries(statuses).map(([student_id, status]) => ({
        student_id: Number(student_id),
        status,
      })),
    });
  }

  if (!assignmentsQuery.isLoading && !myClassAssignment) {
    return (
      <>
        <PageHeader title="Attendance" description="Mark your class's daily attendance." />
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
        title="Attendance"
        description={
          myClassAssignment
            ? `${myClassAssignment.school_class.name} ${myClassAssignment.school_class.arm} — whole-day register`
            : 'Loading your class…'
        }
        action={
          <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        }
      />

      <div className="p-4 md:p-8">
        <Card>
          {saveMutation.isSuccess && (() => {
            const result = saveMutation.data;
            if (result.queued) {
              return (
                <p className="text-sm text-warning bg-warning-soft rounded-lg px-3 py-2 mb-4">
                  You're offline — attendance for {date} is saved on this device and will sync automatically once you're back online.
                </p>
              );
            }
            if (result.data?.status === 'conflict') {
              return (
                <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2 mb-4">
                  This wasn't saved — every student's attendance for {date} was already changed elsewhere since you loaded this page. Open the sync status icon in the top bar to review and resolve it.
                </p>
              );
            }
            if (result.data?.status === 'partial') {
              return (
                <p className="text-sm text-warning bg-warning-soft rounded-lg px-3 py-2 mb-4">
                  Most of {date}'s attendance was saved, but some students' records were already changed elsewhere. Open the sync status icon in the top bar to review those.
                </p>
              );
            }
            return (
              <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 mb-4">
                Attendance saved for {date}.
              </p>
            );
          })()}
          {saveMutation.isError && (
            <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2 mb-4">{submitError}</p>
          )}
          {existingAttendanceQuery.isFetching ? (
            <p className="text-sm text-muted mb-4">Checking records for {date}…</p>
          ) : existingAttendanceQuery.data?.length > 0 ? (
            <p className="text-sm text-primary bg-primary-soft rounded-lg px-3 py-2 mb-4">
              Attendance already recorded for {date} — shown below, editable if needed.
            </p>
          ) : (
            <p className="text-sm text-muted bg-bg rounded-lg px-3 py-2 mb-4 border border-border">
              No attendance recorded yet for {date} — mark below and save.
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-2 mb-5">
              {studentsQuery.data?.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between border border-border rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-ink font-medium">
                    {student.first_name} {student.last_name}
                  </span>
                  <Select
                    className={`w-36 ${STATUS_STYLES[statuses[student.id]] ?? ''}`}
                    value={statuses[student.id] ?? 'present'}
                    onChange={(e) => setStatuses({ ...statuses, [student.id]: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
              {studentsQuery.isLoading && <p className="text-sm text-muted">Loading students…</p>}
              {studentsQuery.data?.length === 0 && (
                <p className="text-sm text-muted">No students in this class yet.</p>
              )}
            </div>
            <Button type="submit" disabled={!allMarked || saveMutation.isPending || !termId}>
              {saveMutation.isPending ? 'Saving…' : 'Save attendance'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
