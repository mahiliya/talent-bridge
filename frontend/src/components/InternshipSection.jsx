import React from 'react';
import "./InternshipSection.css";
import { MapPin, Calendar, ChevronRight, Clock, Briefcase, Tag } from 'lucide-react';

function InternshipSection() {
  // Enhanced data for internships with more realistic information
  const internships = [
    {
      id: 1,
      title: "Frontend Development Internship",
      company: "TechCorp",
      address: "Addis Ababa, Ethiopia",
      color: "#6ea2ef",
      type: "Remote",
      duration: "3 months",
      skills: ["React", "JavaScript", "HTML/CSS"],
      category: "Development"
    },
    {
      id: 2,
      title: "Data Science Internship",
      company: "DataMinds",
      address: "Nairobi, Kenya",
      color: "#4c6ef5",
      type: "In Person",
      duration: "6 months",
      skills: ["Python", "SQL", "Machine Learning"],
      category: "Data"
    },
    {
      id: 3,
      title: "UI/UX Design Internship",
      company: "DesignHub",
      address: "Lagos, Nigeria",
      color: "#3b82f6",
      type: "Hybrid",
      duration: "4 months",
      skills: ["Figma", "Adobe XD", "Prototyping"],
      category: "Design"
    },
    {
      id: 4,
      title: "Digital Marketing Internship",
      company: "BrandBoost",
      address: "Accra, Ghana",
      color: "#2563eb",
      type: "Remote",
      duration: "3 months",
      skills: ["Social Media", "SEO", "Content Creation"],
      category: "Marketing"
    },
    {
      id: 5,
      title: "Graphic Design Internship",
      company: "CreativeMinds",
      address: "Cape Town, South Africa",
      color: "#1d4ed8",
      type: "In Person",
      duration: "4 months",
      skills: ["Photoshop", "Illustrator", "Typography"],
      category: "Design"
    },
    {
      id: 6,
      title: "Accounting Internship",
      company: "FinanceFirst",
      address: "Cairo, Egypt",
      color: "#1e40af",
      type: "Hybrid",
      duration: "6 months",
      skills: ["Bookkeeping", "Financial Analysis", "Excel"],
      category: "Finance"
    },
     {
      id: 7,
      title: "Accounting Internship",
      company: "FinanceFirst",
      address: "Cairo, Egypt",
      color: "#1e40af",
      type: "Hybrid",
      duration: "6 months",
      skills: ["Bookkeeping", "Financial Analysis", "Excel"],
      category: "Finance"
    },
      {
      id: 8,
      title: "Accounting Internship",
      company: "FinanceFirst",
      address: "Cairo, Egypt",
      color: "#1e40af",
      type: "Hybrid",
      duration: "6 months",
      skills: ["Bookkeeping", "Financial Analysis", "Excel"],
      category: "Finance"
    },
  ];

  return (
    <section className="internship-section">
      <div className="section-container">
        <div className="internship-section-header">
          <h2 className="section-title">
            Latest <span className="section-title-highlight">internships open</span>
          </h2>
          <a href="/internships" className="section-show-all">
            Show all jobs <span className="arrow-icon">→</span>
          </a>
        </div>
        <div className="internship-grid">
          {internships.slice(0, 6).map((internship) => (  // Use slice(0, 6)
            <a
              href={`/internship/${internship.id}`}
              key={internship.id}
              className="internship-card"
              style={{ backgroundColor: internship.color }}
            >
              <div className="internship-logo">{internship.company.charAt(0)}</div>
              <div className="internship-content">
                <div className="internship-type-badge">{internship.type}</div>
                <h3 className="internship-title">{internship.title}</h3>
                <p className="internship-company">{internship.company}</p>
                <div className="internship-details">
                  <div className="internship-detail">
                    <MapPin size={14} />
                    <span>{internship.address}</span>
                  </div>
                  <div className="internship-detail">
                    <Clock size={14} />
                    <span>{internship.duration}</span>
                  </div>
                  <div className="internship-detail">
                    <Tag size={14} />
                    <span>{internship.category}</span>
                  </div>
                </div>
                <div className="internship-skills">
                  {internship.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="internship-buttons">
                <button className="internship-schedule-button">
                  <Calendar size={14} />
                  <span>Apply Now</span>
                </button>
                <button className="internship-related-button">
                  <span>Details</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default InternshipSection;