import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../auth';

// Route guard for pages that must never be reachable by an unauthenticated
// visitor (e.g. internship browsing and job details). Unauthenticated users are
// sent to /login, remembering where they were headed so login can return them
// there. This is the single source of truth for gating — buttons are hidden for
// UX only, never for security.
function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
