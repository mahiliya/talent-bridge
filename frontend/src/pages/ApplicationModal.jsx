"use client"

import { useState, useEffect, useRef } from "react"
import "./ApplicationModal.css"
import { X, Plus, Eye, Edit2, Trash2, Upload, Check } from "lucide-react"

const API_URL = "http://localhost:3000/api"

function ApplicationModal({ internship, onClose, onApplied }) {
  const [coverLetter, setCoverLetter] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState([""])
  const [hasCV, setHasCV] = useState(false)
  const [cvName, setCvName] = useState("")
  const [cvFile, setCvFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const modalRef = useRef(null)
  const maxCharacters = 1000

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [onClose])

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscKey)

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  const handleCoverLetterChange = (e) => {
    const text = e.target.value
    if (text.length <= maxCharacters) {
      setCoverLetter(text)
    }
  }

  const handlePortfolioLinkChange = (index, value) => {
    const newLinks = [...portfolioLinks]
    newLinks[index] = value
    setPortfolioLinks(newLinks)
  }

  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, ""])
  }

  const removePortfolioLink = (index) => {
    const newLinks = [...portfolioLinks]
    newLinks.splice(index, 1)
    setPortfolioLinks(newLinks)
  }

  const handleCVUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCvName(file.name)
      setCvFile(file)
      setHasCV(true)
    }
  }

  const deleteCV = () => {
    setHasCV(false)
    setCvName("")
    setCvFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage("")

    const token = localStorage.getItem("accessToken")
    if (!token) {
      setErrorMessage("Please log in as a User before applying.")
      return
    }
    if (!cvFile) {
      setErrorMessage("Please upload your CV before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      // Encode the uploaded CV as a base64 data URL for the application API.
      const resumeUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(cvFile)
      })

      const response = await fetch(`${API_URL}/applications/jobs/${internship.id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ coverLetter, resumeUrl }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to submit your application.")
      }

      setSubmitSuccess(true)
      if (onApplied) onApplied()

      // Close modal after showing the success message.
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit your application.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="application-modal-overlay">
      <div className="application-modal" ref={modalRef}>
        <div className="application-modal-header">
          <h2>Apply for {internship.title}</h2>
          <button className="close-modal-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {submitSuccess ? (
          <div className="application-success">
            <div className="success-icon">
              <Check size={40} color="#4CAF50" />
            </div>
            <h3>Application Submitted!</h3>
            <p>Your application has been successfully submitted. We'll review it and get back to you soon.</p>
          </div>
        ) : (
          <form className="application-form" onSubmit={handleSubmit}>
            {errorMessage && (
              <p className="application-error" style={{ color: "#c0392b", marginBottom: "1rem" }}>
                {errorMessage}
              </p>
            )}
            <div className="form-section">
              <label htmlFor="coverLetter">
                Please enter your cover letter
                <span className="required-mark">*</span>
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={handleCoverLetterChange}
                placeholder="Introduce yourself and explain why you're a good fit for this position..."
                required
              ></textarea>
              <div className="character-counter">
                <span className={maxCharacters - coverLetter.length < 100 ? "warning" : ""}>
                  {maxCharacters - coverLetter.length} characters left
                </span>
              </div>
            </div>

            <div className="form-section">
              <label>Please enter your portfolio links (if any)</label>
              {portfolioLinks.map((link, index) => (
                <div key={index} className="portfolio-link-input">
                  <input
                    type="url"
                    placeholder={`Portfolio Link ${index + 1}`}
                    value={link}
                    onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                  />
                  {portfolioLinks.length > 1 && (
                    <button type="button" className="remove-link-button" onClick={() => removePortfolioLink(index)}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-link-button" onClick={addPortfolioLink}>
                <Plus size={16} />
                Add more links
              </button>
            </div>

            <div className="form-section">
              <label>
                Resume/CV
                <span className="required-mark">*</span>
              </label>
              {hasCV ? (
                <div className="cv-preview">
                  <div className="cv-info">
                    <span className="cv-name">{cvName}</span>
                  </div>
                  <div className="cv-actions">
                    <button type="button" className="cv-action-button view-button">
                      <Eye size={16} />
                      View CV
                    </button>
                    <label className="cv-action-button update-button">
                      <Edit2 size={16} />
                      Update CV
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} hidden />
                    </label>
                    <button type="button" className="cv-action-button delete-button" onClick={deleteCV}>
                      <Trash2 size={16} />
                      Delete CV
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cv-upload">
                  <label className="upload-cv-button">
                    <Upload size={18} />
                    Upload your CV
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleCVUpload} hidden required={!hasCV} />
                  </label>
                  <span className="upload-hint">Accepted formats: PDF, DOC, DOCX (Max 5MB)</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={isSubmitting || !hasCV}>
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ApplicationModal

