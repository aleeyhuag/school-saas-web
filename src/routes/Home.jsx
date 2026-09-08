import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardRedirect from './DashboardRedirect';
import Landing from '../pages/Landing';
import SkulagLoader from '../components/ui/SkulagLoader';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SkulagLoader fullScreen label="Preparing Skulag…" />;
  }

  if (isAuthenticated) {
    return <DashboardRedirect />;
  }

  if (window.location.hostname.startsWith('admin.')) {
    return <Navigate to="/login" replace />;
  }

  return <Landing />;
}
