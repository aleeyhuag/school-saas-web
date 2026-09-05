import { useQuery } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import * as myAssignmentsApi from '../api/myAssignments';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { hasRole } = useAuth();
  const assignmentsQuery = useQuery({ queryKey: ['my-assignments'], queryFn: myAssignmentsApi.getMyAssignments });
  const assignments = assignmentsQuery.data ?? [];
  const hasClassTeacherDuties = assignments.some((a) => a.is_class_teacher);
  const hasSubjectDuties = assignments.some((a) => a.subject_id);

  if (!assignmentsQuery.isLoading && !assignmentsQuery.isError && assignments.length === 0) {
    // Keep the workspace usable for an unassigned teacher; the pages themselves explain the missing assignment.
  }

  const managementPath = hasRole('principal') ? '/principal' : hasRole('proprietor') ? '/proprietor' : hasRole('bursar') ? '/bursar' : hasRole('exam_officer') ? '/exam-officer' : null;
  const navItems = [
    ...(hasClassTeacherDuties ? [
      { to: '/teaching/my-class', label: 'My Class', icon: '☺', end: true },
      { to: '/teaching/attendance', label: 'Attendance', icon: '☑' },
      { to: '/teaching/marksheet', label: 'Marksheet & Publishing', icon: '▤' },
    ] : []),
    ...(hasSubjectDuties ? [{ to: '/teaching/scores', label: 'Score Entry', icon: '✎' }] : []),
    { to: '/teaching/cbt', label: 'CBT Exams', icon: '📝' },
    { to: '/teaching/timetable', label: 'Timetable', icon: '▦' },
    { to: '/teaching/exam-timetable', label: 'Exam Timetable', icon: '▤' },
    { to: '/teaching/announcements', label: 'Announcements', icon: '📣' },
    { to: '/teaching/settings', label: 'Account', icon: '⚙' },
    ...(managementPath ? [{ to: managementPath, label: 'Management Dashboard', icon: '↩' }] : []),
  ];

  return <DashboardLayout navItems={navItems}><Outlet /></DashboardLayout>;
}
