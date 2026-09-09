"use client"
import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import "./InternshipDetailsPage.css"
import { ArrowLeft, Calendar, Clock, MapPin, Award, Briefcase } from "lucide-react"
import ApplicationModal from "./ApplicationModal"

const API_URL = "http://localhost:3000/api"

// Turn backend enum values like FULL_TIME / ENTRY_LEVEL into "Full Time" / "Entry Level".
const humanize = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

function InternshipDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  const token = localStorage.getItem("accessToken")

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await fetch(`${API_URL}/jobs/${id}`)
        if (!response.ok) {
          throw new Error("This opportunity could not be found.")
        }
        setJob(await response.json())
      } catch (error) {
        setLoadError(error.message || "This opportunity could not be found.")
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [id])

  // Determine whether the logged-in user has already applied to this job so the
  // applied state survives a page refresh.
  useEffect(() => {
    if (!token) return

    const loadAppliedState = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const meResponse = await fetch(`${API_URL}/auth/me`, { headers })
        if (!meResponse.ok) return
        const meData = await meResponse.json()
        if (!meData.user) return

        const applicationsResponse = await fetch(`${API_URL}/applications/user/${meData.user.id}`, { headers })
        if (!applicationsResponse.ok) return
        const applications = await applicationsResponse.json()
        if (Array.isArray(applications) && applications.some((application) => application.jobId === id)) {
          setHasApplied(true)
        }
      } catch {
        // Non-blocking: if this fails we simply show the Apply button.
      }
    }

    loadAppliedState()
  }, [id, token])

  const openApplicationModal = () => {
    if (!token) {
      navigate("/")
      return
    }
    setIsApplicationModalOpen(true)
  }

  const closeApplicationModal = () => {
    setIsApplicationModalOpen(false)
  }

  const handleApplied = () => {
    setHasApplied(true)
  }

  // Calculate days left until deadline
  const calculateDaysLeft = () => {
    if (!job?.deadline) return 0
    const deadlineDate = new Date(job.deadline)
    const currentDate = new Date()
    const timeDiff = deadlineDate - currentDate
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
    return daysLeft > 0 ? daysLeft : 0
  }

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—")

  if (loading) {
    return <div className="internship-details-page"><p style={{ padding: "2rem" }}>Loading opportunity...</p></div>
  }

  if (loadError || !job) {
    return (
      <div className="internship-details-page">
        <div className="back-button-container">
          <Link to="/internships" className="back-button-c">
            <ArrowLeft size={18} />
            <span>Back to Internships</span>
          </Link>
        </div>
        <p style={{ padding: "2rem" }}>{loadError || "Internship not found."}</p>
      </div>
    )
  }

  const organization = job.company?.name || "Company"
  const categories = [humanize(job.jobType), humanize(job.experienceLevel)].filter(Boolean)
  const requiredSkills = Array.isArray(job.requirements) ? job.requirements : []
  const responsibilities = Array.isArray(job.responsibilities) ? job.responsibilities : []

  return (
    <div className="internship-details-page">
      <div className="back-button-container">
        <Link to="/internships" className="back-button-c">
          <ArrowLeft size={18} />
          <span>Back to Internships</span>
        </Link>
      </div>

      <header className="internship-header">
        <h1>{job.title}</h1>
        <h3>{organization}</h3>
        <h4>{job.location}</h4>
      </header>

      <div className="internship-details-container">
        {/* Main Content */}
        <div className="internship-details-description">
          <section>
            <h2>Description</h2>
            <p>{job.description}</p>
          </section>

          {responsibilities.length > 0 && (
            <section>
              <h2>Responsibilities</h2>
              <ul className="fancy-list">
                {responsibilities.map((responsibility, index) => (
                  <li key={index}>{responsibility}</li>
                ))}
              </ul>
            </section>
          )}

          {requiredSkills.length > 0 && (
            <section>
              <h2>Requirements</h2>
              <ul className="bullet-list">
                {requiredSkills.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </section>
          )}

          {hasApplied ? (
            <button className="apply-button" disabled>
              You applied for this job
            </button>
          ) : (
            <button className="apply-button" onClick={openApplicationModal}>
              Apply Now
            </button>
          )}
        </div>

        {/* Sidebar */}
        <aside className="internship-details-about">
          <div className="sidebar-header">
            <div className="organization-logo">{organization.charAt(0)}</div>
            <div className="organization-info">
              <h3>{organization}</h3>
              <p>{job.company?.industry || "Organization"}</p>
            </div>
          </div>

          <div className="deadline-banner">
            <div className="deadline-info">
              <Clock size={18} />
              <div>
                <p className="deadline-label">Application Deadline</p>
                <p className="deadline-date">{formatDate(job.deadline)}</p>
              </div>
            </div>
            <div className="days-left">
              <span className="days-number">{calculateDaysLeft()}</span>
              <span className="days-text">days left</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Internship Details</h3>

            {job.internshipDuration && (
              <div className="detail-item">
                <div className="detail-icon">
                  <Clock size={18} />
                </div>
                <div className="detail-content">
                  <p className="detail-label">Duration</p>
                  <p className="detail-value">{job.internshipDuration}</p>
                </div>
              </div>
            )}

            <div className="detail-item">
              <div className="detail-icon">
                <MapPin size={18} />
              </div>
              <div className="detail-content">
                <p className="detail-label">Location</p>
                <p className="detail-value">{job.location}</p>
              </div>
            </div>

            {job.salary && (
              <div className="detail-item">
                <div className="detail-icon">
                  <Briefcase size={18} />
                </div>
                <div className="detail-content">
                  <p className="detail-label">Salary</p>
                  <p className="detail-value">{job.salary}</p>
                </div>
              </div>
            )}

            <div className="detail-item">
              <div className="detail-icon">
                <Calendar size={18} />
              </div>
              <div className="detail-content">
                <p className="detail-label">Posted On</p>
                <p className="detail-value">{formatDate(job.postedAt)}</p>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">Categories</h3>
              <div className="categories-container">
                {categories.map((category, index) => (
                  <div key={index} className="category-badge">
                    <Award size={14} />
                    <span>{category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requiredSkills.length > 0 && (
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">Required Skills</h3>
              <div className="skills-container">
                {requiredSkills.map((skill, index) => (
                  <div key={index} className={`skill-badge skill-${index + 1}`}>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasApplied ? (
            <button className="sidebar-apply-button" disabled>
              You applied for this job
            </button>
          ) : (
            <button className="sidebar-apply-button" onClick={openApplicationModal}>
              Apply for this Internship
            </button>
          )}
        </aside>
      </div>

      {isApplicationModalOpen && (
        <ApplicationModal internship={job} onClose={closeApplicationModal} onApplied={handleApplied} />
      )}
    </div>
  )
}

export default InternshipDetailsPage
