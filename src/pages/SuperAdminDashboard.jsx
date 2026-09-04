import { Outlet } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const NAV_ITEMS = [
  { to: '/super-admin', label: 'Schools', icon: '⌂', end: true },
  { to: '/super-admin/stats', label: 'Platform Stats & Audit', icon: '♡' },
  { to: '/super-admin/billing', label: 'Billing', icon: '💳' },
  { to: '/super-admin/backup', label: 'Platform Backup', icon: '⬇' },
  { to: '/super-admin/admins', label: 'Super Admins', icon: '☺' },
  { to: '/super-admin/leads', label: 'Leads', icon: '☆' },
  { to: '/super-admin/campaigns', label: 'Campaigns', icon: '✉' },
  { to: '/super-admin/referrals', label: 'Referral Partners', icon: '🤝' },
  { to: '/super-admin/settings', label: 'Account', icon: '⚙' },
];

/**
 * Super Admin's dashboard — same layout shell + nested routes pattern
 * every other role uses (see App.jsx). DashboardLayout already
 * falls back to "Platform" for the sidebar identity block when
 * `school` is null, which it always is for a cross-tenant Super
 * Admin — no special-casing needed there.
 */
export default function SuperAdminDashboard() {
  return (
    <DashboardLayout navItems={NAV_ITEMS}>
      <Outlet />
    </DashboardLayout>
  );
}
