import { useQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import * as myAssignmentsApi from '../api/myAssignments';

/**
 * ONE dashboard for every teacher — replaces the old separate
 * ClassTeacherDashboard / SubjectTeacherDashboard split. There is no
 * longer a class_teacher vs subject_teacher ROLE distinction; every
 * teacher holds the single 'teacher' role, and what this dashboard
 * shows is driven entirely by their real teacher_assignments records:
 *
 *  - Any assignment with is_class_teacher: true → shows Attendance
 *    (whole-day register) + Marksheet Review (approve/publish).
 *  - Any assignment with a subject_id → shows Score Entry + Period
 *    Attendance.
 *
 * A teacher can have either, both, or (briefly, before being
 * assigned) neither — the nav just reflects reality, with no more
 * asymmetric "only works one direction" cross-links to maintain.
 */
export default function TeacherDashboard() {
  const assignmentsQuery = useQuery({
    queryKey: ['my-assignments'],
    queryFn: myAssignmentsApi.getMyAssignments,
  });

  const assignments = assignmentsQuery.data ?? [];
  const hasClassTeacherDuties = assignments.some((a) => a.is_class_teacher);
  const hasSubjectDuties = assignments.some((a) => a.subject_id);

  const navItems = [
    ...(hasClassTeacherDuties
      ? [
          { to: '/teacher/my-class', label: 'My Class', icon: '☺', end: true },
          { to: '/teacher/attendance', label: 'Attendance', icon: '☑' },
          { to: '/teacher/marksheet', label: 'Marksheet Review', icon: '▤' },
        ]
      : []),
    ...(hasSubjectDuties
      ? [{ to: '/teacher/scores', label: 'Score Entry', icon: '✎' }]
      : []),
    { to: '/teacher/timetable', label: 'Timetable', icon: '▦' },
    { to: '/teacher/exam-timetable', label: 'Exam Timetable', icon: '▤' },
    { to: '/teacher/announcements', label: 'Announcements', icon: '📣' },
    { to: '/teacher/settings', label: 'Account', icon: '⚙' },
  ];

  return (
    <DashboardLayout navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
