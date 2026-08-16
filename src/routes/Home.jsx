import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardRedirect from './DashboardRedirect';
import Landing from '../pages/Landing';

/**
 * Sits at "/". An anonymous visitor sees the marketing landing page
 * — this is the site's actual homepage. A signed-in user is handed
 * off to DashboardRedirect instead, which sends them to whichever
 * dashboard matches their role. Kept as its own component (rather
 * than inlining this check into Landing.jsx) so Landing stays a pure
 * presentational page with no auth-awareness of its own.
 *
 * admin.skulag.com.ng is the same deploy as the main site (one
 * Netlify build, reachable at both hostnames) — the only difference
 * is that an anonymous visitor there skips the marketing page and
 * goes straight to /login, since that subdomain's whole purpose is
 * being Super Admin's dedicated entry point. A logged-in Super Admin
 * still lands on /super-admin via the normal DashboardRedirect either
 * way — this only changes what a LOGGED-OUT visitor sees.
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  }

  if (isAuthenticated) {
    return <DashboardRedirect />;
  }

  if (window.location.hostname.startsWith('admin.')) {
    return <Navigate to="/login" replace />;
  }

  return <Landing />;
}
