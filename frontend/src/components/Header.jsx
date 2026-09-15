"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./Header.css"
import SignupModal from "./SignupModal"
import LoginModal from "./LoginModal"
import talentBridgeLogo from "../assets/talent-bridge-logo.svg"
import { isAuthenticated, getRole, clearSession } from "../auth"

function Header() {
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Auth state is read at render. Login/Signup/Logout perform a full-page
  // redirect, so this stays in sync without extra wiring.
  const authed = isAuthenticated()
  const role = getRole()
  const isCompany = authed && role === "company"

  const openSignupModal = (e) => {
    if (e) e.preventDefault()
    setIsSignupOpen(true)
    setIsMobileMenuOpen(false)
  }
  const closeSignupModal = () => setIsSignupOpen(false)

  const openLoginModal = (e) => {
    if (e) e.preventDefault()
    setIsLoginOpen(true)
    setIsMobileMenuOpen(false)
  }
  const closeLoginModal = () => setIsLoginOpen(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMenu = () => setIsMobileMenuOpen(false)

  const handleLogout = () => {
    clearSession()
    setIsMobileMenuOpen(false)
    window.location.href = "/"
  }

  // Handle scroll event to change header style when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isMobileMenuOpen])

  return (
    <header className={`header ${isScrolled ? "header-scrolled" : ""}`}>
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" className="header-logo-link">
            <img src={talentBridgeLogo || "/placeholder.svg"} alt="Talent Bridge Logo" className="logo-image" />
          </Link>
        </div>

        <button
          className={`mobile-menu-toggle ${isMobileMenuOpen ? "is-active" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <div className={`header-nav-container ${isMobileMenuOpen ? "is-open" : ""}`}>
          <nav className="header-nav">
            <ul className="header-nav-list">
              <li className="header-nav-item">
                <Link to="/" className="header-nav-link" onClick={closeMenu}>
                  Home
                </Link>
              </li>

              {/* Public visitor navigation */}
              {!authed && (
                <>
                  <li className="header-nav-item">
                    <a href="/#how-it-works" className="header-nav-link" onClick={closeMenu}>
                      How It Works
                    </a>
                  </li>
                  <li className="header-nav-item">
                    {/* Company entry point — opens the company-preselected auth
                        page (sign in or register). Never an internship list. */}
                    <Link to="/login?type=company" className="header-nav-link" onClick={closeMenu}>
                      Become a Partner
                    </Link>
                  </li>
                </>
              )}

              {/* Authenticated USER navigation */}
              {authed && !isCompany && (
                <>
                  <li className="header-nav-item">
                    <Link to="/dashboard" className="header-nav-link" onClick={closeMenu}>Dashboard</Link>
                  </li>
                  <li className="header-nav-item">
                    <Link to="/internships" className="header-nav-link" onClick={closeMenu}>Internships</Link>
                  </li>
                  <li className="header-nav-item">
                    <a href="/dashboard#applications" className="header-nav-link" onClick={closeMenu}>Applications</a>
                  </li>
                  <li className="header-nav-item">
                    <a href="/dashboard#profile" className="header-nav-link" onClick={closeMenu}>Profile</a>
                  </li>
                </>
              )}

              {/* Authenticated COMPANY navigation */}
              {isCompany && (
                <>
                  <li className="header-nav-item">
                    <Link to="/company/dashboard" className="header-nav-link" onClick={closeMenu}>Company Dashboard</Link>
                  </li>
                  <li className="header-nav-item">
                    <Link to="/company/opportunities" className="header-nav-link" onClick={closeMenu}>Jobs</Link>
                  </li>
                  <li className="header-nav-item">
                    <Link to="/company/post-opportunity" className="header-nav-link" onClick={closeMenu}>Post Opportunity</Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div className="header-actions">
            {authed ? (
              <button className="header-login" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <>
                <a href="/login" className="header-login" onClick={openLoginModal}>
                  Sign In
                </a>
                <button className="header-signup" onClick={openSignupModal}>
                  Sign Up
                  <span className="btn-arrow">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <SignupModal isOpen={isSignupOpen} onClose={closeSignupModal} />
      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
    </header>
  )
}

export default Header
