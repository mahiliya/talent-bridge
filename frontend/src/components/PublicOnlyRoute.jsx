import { Navigate } from 'react-router-dom';
import { isAuthenticated, getRole } from '../auth';

// Wraps the public landing page. The Home page is the pre-authentication
// experience only; a signed-in visitor belongs on their dashboard (the
// authenticated "home"), so send them there instead of the marketing page.
function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to={getRole() === 'company' ? '/company/dashboard' : '/dashboard'} replace />;
  }
  return children;
}

export default PublicOnlyRoute;
