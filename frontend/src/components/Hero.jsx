import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Hero.css'; // Import the CSS file
import hero from '../assets/inten2.jpg'; 


function Hero() {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSearchClick = () => {
    navigate('/internships'); // Navigate to the internships page
  };

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-text">
          <h1 className="hero-title">
            Discover <br /> more than <br />
            <span className="hero-title-highlight">500+ Internships</span>
          </h1>
          <p className="hero-description">
            The ultimate hub for internship seekers aiming to elevate their careers and explore exciting opportunities with startups.
          </p>
          <div className="hero-search-form">
            <input
              type="text"
              placeholder="Internship title or keyword"
              className="hero-input"
            />
            <select className="hero-select">
              <option>Addis Ababa, Ethiopia</option>
            </select>
            <button className="hero-button" onClick={handleSearchClick}>  {/* Add onClick handler */}
              Search my Internship
            </button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={hero} alt="a girl with laptop"
            className="hero-image"
          />
        </div>

      </div>
    </section>
  );
}

export default Hero;