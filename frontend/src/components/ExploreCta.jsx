import { useNavigate } from 'react-router-dom';
import './Landing.css';
import { isAuthenticated, BROWSE_PATH } from '../auth';

// Replaces the old static/fake "Latest internships open" cards. It never shows
// real job data on the public page — it invites the visitor to sign in (or,
// if already signed in, jump straight to browsing).
function ExploreCta() {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="cta-banner">
          <h2>Find opportunities that match your skills</h2>
          <p>Sign in to explore internships, get personalized recommendations, and apply to opportunities.</p>
          <button
            type="button"
            className="cta-button"
            onClick={() => navigate(BROWSE_PATH)}
          >
            {authed ? 'Explore Internships' : 'Sign In to Explore Jobs'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ExploreCta;
