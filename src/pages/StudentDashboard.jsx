import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/student/overview', label: 'Overview', icon: '⌂', end: true },
  { to: '/student/timetable', label: 'Timetable', icon: '▦' },
  { to: '/student/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/student/cbt', label: 'CBT Examinations', icon: '📝' },
  { to: '/student/announcements', label: 'Announcements', icon: '📣' },
  { to: '/student/settings', label: 'Account', icon: '⚙' },
];

export default function StudentDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
