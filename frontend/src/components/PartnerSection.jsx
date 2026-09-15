import { useNavigate } from 'react-router-dom';
import './Landing.css';

// Company-facing call to action. "Become a Partner" opens company registration
// (the existing signup flow, pre-set to the company account type).
function PartnerSection() {
  const navigate = useNavigate();

  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="cta-banner partner">
          <h2>Looking for talented interns?</h2>
          <p>
            Are you a company looking for talented interns? Sign in to your company
            account or register to post opportunities and review applicants.
          </p>
          <button
            type="button"
            className="cta-button"
            onClick={() => navigate('/login?type=company')}
          >
            Become a Partner
          </button>
        </div>
      </div>
    </section>
  );
}

export default PartnerSection;
