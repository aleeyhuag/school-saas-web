import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/parent/children', label: 'My Children', icon: '☺', end: true },
  { to: '/parent/timetable', label: 'Timetable', icon: '▦' },
  { to: '/parent/exam-timetable', label: 'Exam Timetable', icon: '▤' },
  { to: '/parent/announcements', label: 'Announcements', icon: '📣' },
  { to: '/parent/settings', label: 'Account', icon: '⚙' },
];

export default function ParentDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
