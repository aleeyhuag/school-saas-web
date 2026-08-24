import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Sits at "/". Looks at the logged-in user's role and sends them to
 * the matching dashboard. This is the ONE place role -> dashboard-path
 * mapping lives — every role gets its own dedicated route, no sharing.
 *
 * If a user somehow has multiple roles, the first match in this
 * object's key order wins — reorder if you want a different priority
 * (e.g. super_admin should probably always win if ever combined with
 * another role, hence it's listed first).
 */
const ROLE_HOME_ROUTES = {
  super_admin: '/super-admin',
  proprietor: '/proprietor',
  principal: '/principal',
  exam_officer: '/exam-officer',
  bursar: '/bursar',
  teacher: '/teacher',
  parent: '/parent',
  student: '/student',
};

export default function DashboardRedirect() {
  const { roles, billingLocked, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  }

  if (billingLocked) {
    return <Navigate to={hasRole('principal') ? '/principal/billing' : '/proprietor/billing'} replace />;
  }

  const targetRoute = Object.keys(ROLE_HOME_ROUTES)
    .filter((role) => roles.includes(role))
    .map((role) => ROLE_HOME_ROUTES[role])[0];

  return <Navigate to={targetRoute ?? '/login'} replace />;
}
