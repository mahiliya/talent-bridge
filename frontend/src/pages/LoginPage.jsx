import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import { isAuthenticated, getRole } from '../auth';

// Dedicated /login route. ProtectedRoute redirects here (passing the intended
// location in router state); it is also reached via ?type=company&from=... links
// so the role choice and intended destination survive the Login<->Signup hop.
// It reuses the existing LoginModal rather than duplicating the form.
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // Intended destination: from router state (ProtectedRoute) or a ?from= param.
  const stateFrom = location.state?.from;
  const from = stateFrom
    ? `${stateFrom.pathname}${stateFrom.search || ''}`
    : params.get('from') || undefined;

  // Pre-selected role (e.g. "Become a Partner" -> company). Selector stays visible.
  const type = params.get('type') === 'company' ? 'company' : 'user';

  // Already signed in? Skip the login screen.
  if (isAuthenticated()) {
    const fallback = getRole() === 'company' ? '/company/dashboard' : '/dashboard';
    return <Navigate to={from || fallback} replace />;
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: '#f4f1e9' }}>
      <LoginModal isOpen onClose={() => navigate('/')} redirectTo={from} defaultAccountType={type} />
    </div>
  );
}

export default LoginPage;
