import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Role gate plus the frontend half of the Stage 55 billing lock.
 * The API is the real security boundary; this redirect prevents a locked
 * Proprietor/Principal from manually navigating around the Billing page in
 * the SPA and then seeing a dashboard shell full of guaranteed 403s.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, hasRole, billingLocked, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  if (billingLocked) {
    const billingPath = hasRole('principal') ? '/principal/billing' : '/proprietor/billing';
    if (location.pathname !== billingPath) {
      return <Navigate to={billingPath} replace />;
    }
  }

  return children;
}
