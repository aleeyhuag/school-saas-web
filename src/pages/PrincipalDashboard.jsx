import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const BASE_NAV_ITEMS = [
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
  { to: '/principal/billing', label: 'Billing', icon: '💳' },
  { to: '/principal/backup', label: 'Data Backup', icon: '⬇' },
  { to: '/principal/id-cards', label: 'ID Cards', icon: '🪪' },
  { to: '/principal/audit', label: 'Audit Log', icon: '◌' },
  { to: '/principal/settings', label: 'Settings', icon: '⚙' },
];

const MY_TEACHING_ITEM = { to: '/principal/my-class', label: 'My Teaching', icon: '🍎' };

/**
 * Principal's dashboard reuses the EXACT same page components as
 * Proprietor's — see App.jsx for how the same components get mounted
 * under both /proprietor/* and /principal/*.
 *
 * "My Teaching" only appears if this Principal ALSO holds the
 * 'teacher' Spatie role (added via Staff > addRole) — the backend's
 * my-class/* routes are gated by role:teacher regardless of who's
 * asking, so this nav item is genuinely only useful, and only shown,
 * when it would actually work. A Principal who's also assigned as a
 * class or subject teacher previously had no way to reach their own
 * teaching duties through the UI at all — this closes that gap.
 */
export default function PrincipalDashboard() {
  const { hasRole } = useAuth();
  const navItems = hasRole('teacher') ? [...BASE_NAV_ITEMS, MY_TEACHING_ITEM] : BASE_NAV_ITEMS;

  return (
    <DashboardLayout navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
