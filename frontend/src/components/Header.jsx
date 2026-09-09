"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import "./Header.css"
import SignupModal from "./SignupModal"
import LoginModal from "./LoginModal"
import talentBridgeLogo from "../assets/talent-bridge-logo.svg"


function Header() {
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const openSignupModal = (e) => {
    e.preventDefault()
    setIsSignupOpen(true)
    setIsMobileMenuOpen(false)
  }

  const closeSignupModal = () => setIsSignupOpen(false)

  const openLoginModal = (e) => {
    e.preventDefault()
    setIsLoginOpen(true)
    setIsMobileMenuOpen(false)
  }

  const closeLoginModal = () => setIsLoginOpen(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Handle scroll event to change header style when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
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
                <Link to="/" className="header-nav-link">
                  Home
                </Link>
              </li>
              <li className="header-nav-item">
                <Link to="/internships" className="header-nav-link">
                  Find Internships
                </Link>
              </li>
              <li className="header-nav-item">
                <Link to="/internships" className="header-nav-link">
                  Browse Companies
                </Link>
              </li>
              <li className="header-nav-item">
                <Link to="/about" className="header-nav-link">
                  About Us
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-actions">
            <a href="/login" className="header-login" onClick={openLoginModal}>
              Login
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
          </div>
        </div>
      </div>

      <SignupModal isOpen={isSignupOpen} onClose={closeSignupModal} />
      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
    </header>
  )
}

export default Header

