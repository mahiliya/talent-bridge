import { Link, useNavigate } from 'react-router-dom';
import { COMPANY_NAV_ITEMS } from './companyNav';
// Shares the existing dashboard sidebar styling.
import '../pages/UserDashboard.css';
import '../pages/CompanyDashboard.css';

function CompanySidebar({ active }) {
  const navigate = useNavigate();

  const go = (key) => {
    if (key === 'post') {
      navigate('/company/post-opportunity');
    } else if (key === 'dashboard') {
      navigate('/company/dashboard');
    } else if (key === 'opportunities') {
      navigate('/company/opportunities');
    } else {
      // Remaining sections are still rendered as placeholders by the dashboard.
      navigate('/company/dashboard', { state: { section: key } });
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    navigate('/');
  };

  return (
    <aside className="dashboard-sidebar">
      <Link to="/" className="dashboard-brand">Talent Bridge</Link>
      <p className="sidebar-label">Company</p>
      <nav>
        {COMPANY_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`company-nav-link ${active === item.key ? 'active' : ''}`}
            onClick={() => go(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="logout-button" onClick={logout}>Logout</button>
    </aside>
  );
}

export default CompanySidebar;
