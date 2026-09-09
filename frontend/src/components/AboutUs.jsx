import React, { useState } from 'react';
import './AboutUs.css';
import { ArrowLeft, Users, Award, Calendar, Target, ChevronDown, ChevronUp, Globe, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import TestimonialSection from './TestimonialSection';

function AboutUs() {
  const [activeTab, setActiveTab] = useState('mission');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

 

  return (
    <div className="about-us-page">
      <div className="about-hero">
        <div className="about-container">
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
          <h1 className="about-title">About Talent Bridge</h1>
          <p className="about-subtitle">Connecting ambitious talent with meaningful opportunities across Africa</p>
        </div>
        <div className="hero-shape"></div>
      </div>

      <div className="about-container">
        <div className="about-tabs">
          <button 
            className={`tab-button ${activeTab === 'mission' ? 'active' : ''}`}
            onClick={() => setActiveTab('mission')}
          >
            <Target size={20} />
            Our Mission
          </button>
          <button 
            className={`tab-button ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            <Calendar size={20} />
            Our Story
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'values' ? 'active' : ''}`}
            onClick={() => setActiveTab('values')}
          >
            <Award size={20} />
            Our Values
          </button>
          <button 
            className={`tab-button ${activeTab === 'testimonials' ? 'active' : ''}`}
            onClick={() => setActiveTab('testimonials')}
          >
            <Award size={20} />
            Testminoals
          </button>
        </div>

        <div className="about-content">
          {activeTab === 'mission' && (
            <div className="mission-section">
              <h2>Our Mission</h2>
              <div className="mission-content">
                <div className="mission-text">
                  <p className="mission-statement">
                    "To bridge the gap between education and employment by connecting ambitious young talent with quality internship opportunities across Africa."
                  </p>
                  <p>
                  Welcome to Talent Bridge, an innovative internship matching web application designed to connect students with companies seeking fresh talent. Our mission is to provide students with hands-on experience in their desired fields, enabling them to develop essential skills and bridge the gap between education and employment.
                  </p>
                  <p>
                  By intelligently matching students with organizations that align with their career goals, we not only empower the next generation of professionals but also help companies save time and resources while effectively doubling their manpower. At Talent Bridge, we are dedicated to fostering valuable connections that enhance learning and drive success for both students and businesses alike.
                  </p>
                </div>
                <div className="mission-stats">
                  <div className="stat-card">
                    <span className="stat-number">5,000+</span>
                    <span className="stat-label">Internships Posted</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">10,000+</span>
                    <span className="stat-label">Registered Users</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">15+</span>
                    <span className="stat-label">African Countries</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">85%</span>
                    <span className="stat-label">Placement Rate</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="story-section">
              <h2>Our Story</h2>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h3>2025</h3>
                    <h4>The Beginning</h4>
                    {/* <p>Talent Bridge was born out of a simple observation: despite abundant talent across Africa, many graduates struggled to find quality internships to launch their careers. Our founder, Sarah Johnson, experienced this firsthand and decided to create a solution.</p> */}
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h3>2025</h3>
                    <h4>First Partnerships</h4>
                    {/* <p>We launched with 50 partner companies in Ethiopia, connecting over 200 interns with meaningful opportunities in their first year. The feedback was overwhelmingly positive, confirming the need for our platform.</p> */}
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h3>2025</h3>
                    <h4>Expansion Across Africa</h4>
                    {/* <p>Building on our initial success, we expanded to Kenya, Nigeria, and Ghana, quadrupling our user base and establishing partnerships with multinational corporations seeking local talent.</p> */}
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h3>2025</h3>
                    <h4>Platform Evolution</h4>
                    {/* <p>We launched our redesigned platform with enhanced features for skills matching, remote internship opportunities, and resources to help interns succeed in their placements.</p> */}
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h3>Today</h3>
                    <h4>Growing Impact</h4>
                    {/* <p>Talent Bridge now operates in 15+ African countries, with thousands of successful placements and a growing community of alumni who have launched successful careers through our platform.</p> */}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="team-section">
              <h2>Meet Our Team</h2>
              <p className="team-intro">We're a diverse team of professionals passionate about connecting talent with opportunity across Africa.</p>
              <div className="team-grid">
                {teamMembers.map(member => (
                  <div key={member.id} className="team-card">
                    <div className="team-image-container">
                      <img src={member.image || "/placeholder.svg"} alt={member.name} className="team-image" />
                    </div>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-bio">{member.bio}</p>
                  </div>
                ))}
              </div>
             
            </div>
          )}

 {activeTab === 'testimonials' && (
            <div className="team-section">
    <TestimonialSection />
  </div>
)}
          {activeTab === 'values' && (
            <div className="values-section">
              <h2>Our Core Values</h2>
              <div className="values-grid">
                <div className="value-card">
                  <div className="value-icon" style={{backgroundColor: '#e0f2fe'}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#0ea5e9" strokeWidth="2" fill="none">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                      <line x1="6" y1="1" x2="6" y2="4"></line>
                      <line x1="10" y1="1" x2="10" y2="4"></line>
                      <line x1="14" y1="1" x2="14" y2="4"></line>
                    </svg>
                  </div>
                  <h3>Accessibility</h3>
                  <p>We believe quality opportunities should be accessible to all talented individuals, regardless of background or connections.</p>
                </div>
                <div className="value-card">
                  <div className="value-icon" style={{backgroundColor: '#fef3c7'}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#f59e0b" strokeWidth="2" fill="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </div>
                  <h3>Excellence</h3>
                  <p>We're committed to providing the highest quality experience for both interns and companies, with a focus on continuous improvement.</p>
                </div>
                <div className="value-card">
                  <div className="value-icon" style={{backgroundColor: '#dcfce7'}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#10b981" strokeWidth="2" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                  </div>
                  <h3>Community</h3>
                  <p>We foster a supportive community where knowledge is shared, connections are made, and everyone can grow together.</p>
                </div>
                <div className="value-card">
                  <div className="value-icon" style={{backgroundColor: '#dbeafe'}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="#3b82f6" strokeWidth="2" fill="none">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <h3>Integrity</h3>
                  <p>We operate with transparency and honesty in all our interactions, building trust with our users and partners.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        
        <div className="about-contact">
          <h2>Get in Touch</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <h3>Email Us</h3>
              <p>tihitnatesfaye5@gmail.com</p>
            </div>
            <div className="contact-card">
              <div className="contact-icon">
                <Phone size={24} />
              </div>
              <h3>Call Us</h3>
              <p>+251 98 810 3240</p>
              <p>Mon-Fri, 9am-5pm EAT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;