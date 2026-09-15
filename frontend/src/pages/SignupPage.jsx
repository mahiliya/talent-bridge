import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import SignupModal from '../components/SignupModal';
import { isAuthenticated, getRole } from '../auth';

// Dedicated /signup route. Reuses the existing SignupModal. Supports
// ?type=company (so "Become a Partner" opens company registration directly) and
// ?from= (so registration returns the visitor to the page they intended).
function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const defaultAccountType = params.get('type') === 'company' ? 'company' : 'user';
  const from = params.get('from') || undefined;

  if (isAuthenticated()) {
    return <Navigate to={from || (getRole() === 'company' ? '/company/dashboard' : '/dashboard')} replace />;
  }

  return (
    <div className="auth-page" style={{ minHeight: '100vh', background: '#f4f1e9' }}>
      <SignupModal
        isOpen
        onClose={() => navigate('/')}
        defaultAccountType={defaultAccountType}
        redirectTo={from}
      />
    </div>
  );
}

export default SignupPage;
