import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as timetableApi from '../../api/timetable';
import * as academicApi from '../../api/academic';
import * as sessionsApi from '../../api/sessions';
import * as familyApi from '../../api/family';
import * as myAssignmentsApi from '../../api/myAssignments';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import { Select } from '../../components/ui/FormFields';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// "08:00:00" (as Laravel's time cast returns it) → "08:00"
function formatTime(t) {
  return t ? t.slice(0, 5) : '';
}

/**
 * Read-only timetable view shared across Proprietor, Exam Officer,
 * Teacher, Student, and Parent. Each role gets a sensible starting
 * point: teachers see their own schedule; students/parents auto-scope
 * to the relevant class; Proprietor/ExamOfficer get a class picker.
 */
export default function TimetableViewPage() {
  const { hasRole } = useAuth();
  const periodsQuery = useQuery({ queryKey: ['periods'], queryFn: timetableApi.getPeriods });
  const periods = (periodsQuery.data ?? []).slice().sort((a, b) => a.period_number - b.period_number);
  const isTeacher = hasRole('teacher');
  const isStudent = hasRole('student');
  const isParent  = hasRole('parent');

  const sessionsQuery = useQuery({ queryKey: ['sessions'], queryFn: sessionsApi.getSessions });
  const [sessionId, setSessionId] = useState('');
  useEffect(() => {
    if (!sessionId && sessionsQuery.data?.length) {
      const current = sessionsQuery.data.find((s) => s.is_current);
      setSessionId(String((current ?? sessionsQuery.data[0]).id));
    }
  }, [sessionsQuery.data, sessionId]);

  const classesQuery = useQuery({
    queryKey: ['classes'],
    queryFn: academicApi.getClasses,
    enabled: !isTeacher && !isStudent && !isParent,
  });
  const [classId, setClassId] = useState('');

  // Teacher: class teachers see their whole class timetable; subject-only teachers see assigned entries
  const myScheduleQuery = useQuery({
    queryKey: ['my-schedule', sessionId],
    queryFn: () => timetableApi.getMySchedule({ academic_session_id: sessionId }),
    enabled: isTeacher && !!sessionId,
  });

  // Student: find their class from their own record
  const myRecordQuery = useQuery({
    queryKey: ['my-student-record'],
    queryFn: familyApi.getMyStudentRecord,
    enabled: isStudent,
  });
  useEffect(() => {
    if (myRecordQuery.data?.school_class_id) setClassId(String(myRecordQuery.data.school_class_id));
  }, [myRecordQuery.data]);

  // Parent: pick a child, then use that child's class
  const childrenQuery = useQuery({
    queryKey: ['my-children'],
    queryFn: familyApi.getMyChildren,
    enabled: isParent,
  });
  const [selectedChildId, setSelectedChildId] = useState('');
  useEffect(() => {
    if (!selectedChildId && childrenQuery.data?.length)
      setSelectedChildId(String(childrenQuery.data[0].id));
  }, [childrenQuery.data, selectedChildId]);
  const selectedChild = childrenQuery.data?.find((c) => c.id === Number(selectedChildId));
  useEffect(() => {
    if (selectedChild?.school_class_id) setClassId(String(selectedChild.school_class_id));
  }, [selectedChild]);

  // Standard class timetable (all non-teacher roles)
  const timetableQuery = useQuery({
    queryKey: ['class-timetable', classId, sessionId],
    queryFn: () => timetableApi.getClassTimetable({
      school_class_id: classId,
      academic_session_id: sessionId,
    }),
    enabled: !isTeacher && !!classId && !!sessionId,
  });

  const rawData = isTeacher ? myScheduleQuery.data : timetableQuery.data;
  const grid = {};
  if (rawData) {
    Object.entries(rawData).forEach(([day, entries]) => {
      grid[day] = {};
      entries.forEach((e) => { grid[day][e.period] = e; });
    });
  }

  const isLoading = isTeacher ? myScheduleQuery.isLoading : timetableQuery.isLoading;

  return (
    <>
      <PageHeader title="Class Timetable" description={isTeacher ? 'Class Teachers see the complete timetable for their class; subject teachers see their assigned timetable.' : 'Weekly schedule of subjects, teachers, and rooms.'} />
      <div className="p-4 md:p-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <Select className="w-56" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessionsQuery.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>

          {/* Admin roles: class picker */}
          {!isTeacher && !isStudent && !isParent && (
            <Select className="w-56" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select a class…</option>
              {classesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.arm}</option>
              ))}
            </Select>
          )}

          {/* Parent: child selector */}
          {isParent && childrenQuery.data?.length > 1 && (
            <Select className="w-56" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
              {childrenQuery.data.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </Select>
          )}
        </div>

        {!classId && !isTeacher ? (
          <Card><p className="text-sm text-muted">Select a class to view its timetable.</p></Card>
        ) : (
          <Card>
            {isLoading ? <p className="text-sm text-muted">Loading…</p> : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-2 text-left text-xs text-muted font-medium uppercase w-24">Period</th>
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
                            <td key={dayIdx} className="px-3 py-2 min-w-[120px]">
                              {entry ? (
                                <div>
                                  <p className="font-medium text-ink text-xs">{entry.subject?.name}</p>
                                  {entry.teacher && <p className="text-muted text-xs">{entry.teacher.name}</p>}
                                  {isTeacher && entry.school_class && (
                                    <p className="text-primary text-xs">{entry.school_class.name} {entry.school_class.arm}</p>
                                  )}
                                  {entry.room && <p className="text-muted text-xs">{entry.room}</p>}
                                </div>
                              ) : (
                                <span className="text-muted text-xs opacity-30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {periods.length === 0 && (
                      <tr>
                        <td colSpan={DAYS.length + 1} className="px-5 py-8 text-center text-muted">
                          No periods have been set up for this school yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
