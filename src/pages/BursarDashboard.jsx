import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/bursar', label: 'Overview', icon: '⌂', end: true },
  { to: '/bursar/fees', label: 'Fees', icon: '₦' },
  { to: '/bursar/parents', label: 'Parents', icon: '♥' },
  { to: '/bursar/announcements', label: 'Announcements', icon: '📣' },
  { to: '/bursar/settings', label: 'Settings', icon: '⚙' },
];

/**
 * Bursar's dashboard is deliberately narrow — just Overview, Fees
 * (reusing Proprietor's FeesPage as-is, since the backend already
 * scopes fee routes to proprietor|principal|bursar equally), and a
 * minimal Settings (password only, no grading view — see
 * BursarSettingsPage). No classes/students/staff/teacher-assignments/
 * sessions-terms — those stay Proprietor/Principal-only.
 */
export default function BursarDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
