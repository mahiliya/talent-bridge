import "./InternshipCard.css"

function InternshipCard({ internship }) {
  const organization = internship.organization || "Company"
  const description = internship.description || ""
  const tags = Array.isArray(internship.tags) ? internship.tags : []

  return (
    <div className="internship-card">
      <div className="internship-card-header">
        <div className="organization-logo">{organization.charAt(0)}</div>
        <div className="internship-card-title">
          <h3>{internship.title}</h3>
          <h4>{organization}</h4>
        </div>
      </div>

      <div className="internship-card-location">
        <span className="location-icon"></span>
        {internship.location}
      </div>

      <div className="internship-card-description">
        <p>
          {description.length > 120
            ? `${description.substring(0, 120)}...`
            : description}
        </p>
      </div>

      <div className="internship-card-tags">
        {tags.map((tag, index) => (
          <span key={index} className="internship-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="internship-card-footer">
        <div className="deadline-info">
          <span className="deadline-label">Deadline:</span>
          <span className="deadline-date">{internship.deadline ? new Date(internship.deadline).toLocaleDateString() : "—"}</span>
        </div>
        <button className="view-details-btn">View Details</button>
      </div>
    </div>
  )
}

export default InternshipCard

