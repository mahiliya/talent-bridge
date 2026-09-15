import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';
import hero from '../assets/inten2.jpg';
import { BROWSE_PATH } from '../auth';

function Hero() {
  const navigate = useNavigate();

  // "Find My Internship" targets the protected browsing page. ProtectedRoute
  // sends an unauthenticated visitor to /login and returns them here after
  // sign-in; an authenticated visitor goes straight through.
  const handleFindInternship = () => navigate(BROWSE_PATH);

  // "Become a Partner" is the company entry point: a company-preselected auth
  // page that offers both sign in and registration.
  const handleBecomePartner = () => navigate('/login?type=company');

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-text">
          <h1 className="hero-title">
            Connect Your Skills With <br />
            <span className="hero-title-highlight">Your Next Opportunity</span>
          </h1>
          <p className="hero-description">
            Talent Bridge helps students and graduates discover internship
            opportunities that match their skills, interests, and career goals.
          </p>
          <div className="hero-cta-group">
            <button className="hero-cta-primary" onClick={handleFindInternship}>
              Find My Internship
            </button>
            <button className="hero-cta-secondary" onClick={handleBecomePartner}>
              Become a Partner
            </button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={hero} alt="A student working on a laptop" className="hero-image" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
