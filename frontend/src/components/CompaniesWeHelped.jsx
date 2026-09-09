import "./CompaniesWeHelped.css"

function CompaniesWeHelped() {
  // Placeholder company logos
  const placeholderLogos = [
    { id: 1, name: "Company 1" },
    { id: 2, name: "Company 2" },
    { id: 3, name: "Company 3" },
    { id: 4, name: "Company 4" },
    { id: 5, name: "Company 5" },
  ]

  return (
    <section className="companies-helped">
      <div className="section-container">
        <div className="companies-header">
          <h2 className="section-title">Companies we helped grow</h2>
          <p className="companies-subtitle">Join these forward-thinking companies that trust our platform</p>
        </div>

        <div className="companies-content">
          <div className="companies-coming-soon">
            <div className="coming-soon-icon">
              <svg
                viewBox="0 0 24 24"
                width="40"
                height="40"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="coming-soon-title">Coming Soon!</h3>
            <p className="coming-soon-text">
              We're currently onboarding our first batch of partner companies. Stay tuned for updates as we expand our
              network of opportunities.
            </p>
            <a href="/partners" className="companies-cta-button">
              Become a Partner
            </a>
          </div>

          <div className="companies-placeholder">
            {placeholderLogos.map((company) => (
              <div key={company.id} className="company-logo-placeholder">
                <div className="logo-circle"></div>
                <span className="logo-text">{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CompaniesWeHelped

