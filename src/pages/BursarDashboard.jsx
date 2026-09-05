import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const BASE_NAV_ITEMS = [
  { to: '/bursar', label: 'Overview', icon: '⌂', end: true },
  { to: '/bursar/fees', label: 'Fees', icon: '₦' },
  { to: '/bursar/parents', label: 'Parents', icon: '♥' },
  { to: '/bursar/announcements', label: 'Announcements', icon: '📣' },
  { to: '/bursar/settings', label: 'Settings', icon: '⚙' },
];

const MY_TEACHING_ITEM = { to: '/teaching', label: 'My Teaching', icon: '🍎' };

/**
 * Bursar's dashboard is deliberately narrow — just Overview, Fees
 * (reusing Proprietor's FeesPage as-is, since the backend already
 * scopes fee routes to proprietor|principal|bursar equally), and a
 * minimal Settings (password only, no grading view — see
 * BursarSettingsPage). No classes/students/staff/teacher-assignments/
 * sessions-terms — those stay Proprietor/Principal-only.
 *
 * "My Teaching" only appears if this Bursar ALSO holds the 'teacher'
 * role (added via Staff > addRole) — see PrincipalDashboard's
 * docblock for the full reasoning, same mechanism here.
 */
export default function BursarDashboard() {
  const { hasRole } = useAuth();
  const navItems = hasRole('teacher') ? [...BASE_NAV_ITEMS, MY_TEACHING_ITEM] : BASE_NAV_ITEMS;

  return (
    <DashboardLayout navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
