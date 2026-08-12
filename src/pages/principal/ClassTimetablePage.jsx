import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as timetableApi from '../../api/timetable';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/FormFields';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MAX_PERIODS = 10;

const EMPTY_FORM = {
  teacher_assignment_id: '', room: '',
};
const EMPTY_PERIOD_FORM = { start_time: '', end_time: '' };

// "08:00:00" (as Laravel's time cast returns it) → "08:00"
function formatTime(t) {
  return t ? t.slice(0, 5) : '';
}

export default function ClassTimetablePage({ readOnly = false }) {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');

  const classesQuery = useQuery({ queryKey: ['classes'], queryFn: academicApi.getClasses });
  const assignmentsQuery = useQuery({
    queryKey: ['teacher-assignments', classId],
    queryFn: () => academicApi.getTeacherAssignments({ school_class_id: classId }),
    enabled: !!classId,
  });

  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });
  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    if (!sessionId && sessionsQuery.data?.length) {
      const current = sessionsQuery.data.find((s) => s.is_current);
      setSessionId(String((current ?? sessionsQuery.data[0]).id));
    }
  }, [sessionsQuery.data, sessionId]);

  // Periods are school-wide (not per-class) — the Principal defines
  // how many there are and what time each one runs, instead of the
  // platform assuming a fixed 6-8 period day for every school.
  const periodsQuery = useQuery({ queryKey: ['periods'], queryFn: timetableApi.getPeriods });
  const periods = (periodsQuery.data ?? []).slice().sort((a, b) => a.period_number - b.period_number);
  const nextPeriodNumber = periods.length
    ? Math.max(...periods.map((p) => p.period_number)) + 1
    : 1;

  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD_FORM);
  const [periodError, setPeriodError] = useState(null);

  const savePeriodMutation = useMutation({
    mutationFn: timetableApi.savePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      setPeriodModalOpen(false);
      setPeriodForm(EMPTY_PERIOD_FORM);
    },
    onError: (err) => setPeriodError(err.response?.data?.message ?? 'Could not save this period.'),
  });

  const deletePeriodMutation = useMutation({
    mutationFn: timetableApi.deletePeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periods'] }),
    onError: (err) => setPeriodError(err.response?.data?.message ?? 'Could not remove this period.'),
  });

  const timetableQuery = useQuery({
    queryKey: ['class-timetable', classId, sessionId],
    queryFn: () => timetableApi.getClassTimetable({
      school_class_id: classId,
      academic_session_id: sessionId,
    }),
    enabled: !!classId && !!sessionId,
  });

  // Build a lookup: day → period → entry
  const grid = {};
  if (timetableQuery.data) {
    Object.entries(timetableQuery.data).forEach(([day, entries]) => {
      grid[day] = {};
      entries.forEach((e) => { grid[day][e.period] = e; });
    });
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editCell, setEditCell] = useState(null); // { day, period, existingEntry }
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const saveMutation = useMutation({
    mutationFn: timetableApi.saveClassTimetableEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-timetable'] });
      setModalOpen(false);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not save this slot.'),
  });

  const deleteMutation = useMutation({
    mutationFn: timetableApi.deleteClassTimetableEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-timetable'] }),
  });

  function openCell(dayIndex, period) {
    if (readOnly) return;
    const existingEntry = grid[dayIndex + 1]?.[period];
    const matchingAssignment = existingEntry
      ? classAssignments.find(
          (a) => Number(a.subject_id) === Number(existingEntry.subject_id)
            && Number(a.user_id) === Number(existingEntry.user_id)
        )
      : null;

    setEditCell({ day: dayIndex + 1, period, existingEntry });
    setForm({
      teacher_assignment_id: matchingAssignment ? String(matchingAssignment.id) : '',
      room: existingEntry?.room ?? '',
    });
    setError(null);
    setModalOpen(true);
  }

  const classAssignments = (assignmentsQuery.data ?? []).filter((a) => a.subject_id && a.subject);
  const selectedClass = classesQuery.data?.find((c) => c.id === Number(classId));
  const editingPeriod = periods.find((p) => p.period_number === editCell?.period);

  return (
    <>
      <PageHeader
        title="Class Timetable"
        description={readOnly ? "Your school's weekly class schedule." : 'Build and edit the weekly class schedule. Click any cell to set or change a slot.'}
      />
      <div className="p-4 md:p-8">
        {!readOnly && (
          <Card title="Periods" className="mb-6">
            <p className="text-xs text-muted mb-4">
              Set how many periods your school runs each day and what time each one starts and
              ends — every timetable across the school will use these times.
            </p>
            {periodError && <p className="text-sm text-danger mb-3">{periodError}</p>}
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-ink">Period {p.period_number}</span>
                  <span className="text-muted">{formatTime(p.start_time)} – {formatTime(p.end_time)}</span>
                  <button
                    type="button"
                    className="text-muted hover:text-danger"
                    disabled={deletePeriodMutation.isPending}
                    onClick={() => {
                      setPeriodError(null);
                      deletePeriodMutation.mutate(p.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {periods.length < MAX_PERIODS && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPeriodError(null);
                    setPeriodForm(EMPTY_PERIOD_FORM);
                    setPeriodModalOpen(true);
                  }}
                >
                  + Add period
                </Button>
              )}
            </div>
            {periods.length === 0 && (
              <p className="text-xs text-muted mt-2">
                No periods set up yet — add your first one above before building the timetable.
              </p>
            )}
          </Card>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <Select className="w-56" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessionsQuery.data?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select className="w-56" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select a class…</option>
            {classesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
            ))}
          </Select>
        </div>

        {!classId ? (
          <Card><p className="text-sm text-muted">Select a class above to view its timetable.</p></Card>
        ) : periods.length === 0 ? (
          <Card><p className="text-sm text-muted">Set up at least one period above before building the timetable.</p></Card>
        ) : (
          <Card title={selectedClass ? `${selectedClass.name} ${selectedClass.arm}` : ''}>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2 text-left text-xs text-muted font-medium uppercase w-28">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className="px-3 py-2 text-left text-xs text-muted font-medium uppercase">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.period_number} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 text-xs text-muted font-medium">
                        Period {p.period_number}
                        <br />
                        <span className="text-[11px] opacity-70">
                          {formatTime(p.start_time)} – {formatTime(p.end_time)}
                        </span>
                      </td>
                      {DAYS.map((_, dayIdx) => {
                        const entry = grid[dayIdx + 1]?.[p.period_number];
                        return (
                          <td
                            key={dayIdx}
                            onClick={() => openCell(dayIdx, p.period_number)}
                            className={`px-3 py-2 min-w-[120px] ${!readOnly ? 'cursor-pointer hover:bg-bg' : ''} transition-colors`}
                          >
                            {entry ? (
                              <div>
                                <p className="font-medium text-ink text-xs">{entry.subject?.name}</p>
                                {entry.teacher && (
                                  <p className="text-muted text-xs">{entry.teacher.name}</p>
                                )}
                                {entry.room && (
                                  <p className="text-muted text-xs">{entry.room}</p>
                                )}
                              </div>
                            ) : (
                              !readOnly && (
                                <span className="text-muted text-xs opacity-40">+ Add</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {!readOnly && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`${DAYS[(editCell?.day ?? 1) - 1]} — Period ${editCell?.period}${editingPeriod ? ` (${formatTime(editingPeriod.start_time)}–${formatTime(editingPeriod.end_time)})` : ''}`}
        >
          {error && <p className="text-sm text-danger mb-4">{error}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.teacher_assignment_id) {
                setError('Please select an assigned subject and teacher.');
                return;
              }
              saveMutation.mutate({
                school_class_id: Number(classId),
                teacher_assignment_id: Number(form.teacher_assignment_id),
                academic_session_id: Number(sessionId),
                day_of_week: editCell.day,
                period: editCell.period,
                room: form.room || null,
              });
            }}
          >
            <Field label="Assigned subject & teacher">
              <Select required value={form.teacher_assignment_id} onChange={(e) => setForm({ ...form, teacher_assignment_id: e.target.value })}>
                <option value="" disabled>Select an assigned subject…</option>
                {classAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.subject?.name} — {a.teacher?.name}
                  </option>
                ))}
              </Select>
              {assignmentsQuery.isLoading && (
                <p className="text-xs text-muted mt-1">Loading this class's teacher assignments…</p>
              )}
              {!assignmentsQuery.isLoading && classAssignments.length === 0 && (
                <p className="text-xs text-muted mt-1">No subject-teacher assignments exist for this class yet. Set them up under Teacher Assignments first.</p>
              )}
            </Field>
            <Field label="Room (optional)">
              <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </Field>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending || classAssignments.length === 0}>
                {saveMutation.isPending ? 'Saving…' : 'Save slot'}
              </Button>
              {editCell?.existingEntry && (
                <Button
                  variant="danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    deleteMutation.mutate(editCell.existingEntry.id);
                    setModalOpen(false);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}

      <Modal
        open={periodModalOpen}
        onClose={() => setPeriodModalOpen(false)}
        title={`Add Period ${nextPeriodNumber}`}
      >
        {periodError && <p className="text-sm text-danger mb-4">{periodError}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPeriodError(null);
            savePeriodMutation.mutate({
              period_number: nextPeriodNumber,
              start_time: periodForm.start_time,
              end_time: periodForm.end_time,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time">
              <Input
                type="time"
                required
                value={periodForm.start_time}
                onChange={(e) => setPeriodForm({ ...periodForm, start_time: e.target.value })}
              />
            </Field>
            <Field label="End time">
              <Input
                type="time"
                required
                value={periodForm.end_time}
                onChange={(e) => setPeriodForm({ ...periodForm, end_time: e.target.value })}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" disabled={savePeriodMutation.isPending}>
            {savePeriodMutation.isPending ? 'Saving…' : 'Save period'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
