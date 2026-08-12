import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a single page. Usage:
 *
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   } />
 *
 * Or restrict to specific roles:
 *
 *   <Route path="/admin" element={
 *     <ProtectedRoute allowedRoles={['proprietor', 'principal']}>
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   } />
 *
 * If the user isn't logged in, they're sent to /login. If they ARE
 * logged in but don't have an allowed role, they're sent to /
 * (which redirects them to whatever dashboard actually matches their
 * role — see App.jsx).
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
