import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/principal', label: 'Overview', icon: '⌂', end: true },
  { to: '/principal/classes-subjects', label: 'Classes & Subjects', icon: '▤' },
  { to: '/principal/students', label: 'Students', icon: '☺' },
  { to: '/principal/promotion', label: 'Promotion', icon: '↗' },
  { to: '/principal/staff', label: 'Staff', icon: '⚇' },
  { to: '/principal/parents', label: 'Parents', icon: '♥' },
  { to: '/principal/teacher-assignments', label: 'Teacher Assignments', icon: '⇄' },
  { to: '/principal/sessions-terms', label: 'Sessions & Terms', icon: '▦' },
  { to: '/principal/fees', label: 'Fees', icon: '₦' },
  { to: '/principal/timetable', label: 'Timetable', icon: '▦' },
  { to: '/principal/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/principal/results-export', label: 'Results Export', icon: '⬇' },
  { to: '/principal/announcements', label: 'Announcements', icon: '📣' },
  { to: '/principal/school-health', label: 'School Health', icon: '♡' },
  { to: '/principal/id-cards', label: 'ID Cards', icon: '🪪' },
  { to: '/principal/audit', label: 'Audit Log', icon: '◌' },
  { to: '/principal/settings', label: 'Settings', icon: '⚙' },
];

/**
 * Principal's dashboard reuses the EXACT same page components as
 * Proprietor's (OverviewPage, ClassesAndSubjectsPage, StudentsPage,
 * StaffPage, TeacherAssignmentsPage, SessionsAndTermsPage, FeesPage,
 * SettingsPage) — per Stage 11's permission matrix, Principal has
 * full operational parity with Proprietor except senior-staff
 * appointment (already handled inside StaffPage's own hasRole check)
 * and grading edits (already view-only for everyone until Exam
 * Officer's dashboard exists). Only this layout shell + App.jsx's
 * routing differ — see App.jsx for how the same components get
 * mounted under both /proprietor/* and /principal/*.
 */
export default function PrincipalDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
