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
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  }

  return isAuthenticated ? <DashboardRedirect /> : <Landing />;
}
