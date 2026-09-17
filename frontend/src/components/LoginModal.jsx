"use client"

import { useState, useEffect, useRef } from "react"
import "./LoginModal.css"

function LoginModal({ isOpen, onClose, redirectTo, defaultAccountType = "user" }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accountType, setAccountType] = useState(defaultAccountType)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const modalRef = useRef(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onClose])

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [isOpen, onClose])

  // Validate email
  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(String(email).toLowerCase())
  }

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault()

  setEmailError("")
  setPasswordError("")

  let isValid = true

  if (!email) {
    setEmailError("Email is required")
    isValid = false
  } else if (!validateEmail(email)) {
    setEmailError("Please enter a valid email")
    isValid = false
  }

  if (!password) {
    setPasswordError("Password is required")
    isValid = false
  }

  if (!isValid) return

  setIsLoading(true)

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        userType: accountType,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Clear, friendly guidance — and never silently continue to a dashboard.
      setPasswordError(
        data.message ||
          "Invalid email or password. Please sign in with your registered account, or create an account first."
      )
      return
    }

    console.log("Login successful:", data)

    // Save authentication data
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken)
    }

    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken)
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user))
    }

    if (data.company) {
      localStorage.setItem("company", JSON.stringify(data.company))
    }

    // Redirect to the intended destination (or the role-appropriate dashboard)
    // using a SINGLE, full-page navigation.
    //
    // We deliberately do NOT also call onClose() here. Every entry point renders
    // this same modal, but onClose differs: from the Header it only toggles React
    // state, while from the /login page (Find My Internship, Become a Partner,
    // Explore, and any ProtectedRoute redirect) onClose is `navigate('/')`.
    // Running a client-side route change AND a window.location assignment in the
    // same tick races two navigations against each other — the SPA re-renders
    // through /login and its route guards and the visitor is bounced back to the
    // form (the "page reloads / re-enter credentials" bug). One full-page
    // navigation removes the race and is consistent with the app's existing
    // architecture (auth is read from localStorage at render, so a full load also
    // refreshes the Header and route guards). `replace` keeps /login out of the
    // history stack, preventing a back-button redirect loop.
    const fallback = accountType === "company" ? "/company/dashboard" : "/dashboard"
    window.location.replace(redirectTo || fallback)
    return

  } catch (error) {
    console.error("Login error:", error)
    setPasswordError("Unable to connect to the server. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-header">
          <h2 className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Sign in to access your account</p>
        </div>

        <div className="account-type-selector" role="group" aria-label="Account type">
          <button type="button" className={accountType === "user" ? "selected" : ""} onClick={() => setAccountType("user")}>User</button>
          <button type="button" className={accountType === "company" ? "selected" : ""} onClick={() => setAccountType("company")}>Company</button>
        </div>

        <div className="modal-social-login">
          <button className="social-button google-button">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                fill="currentColor"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

        </div>

        <div className="modal-divider">
          <span>or</span>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className={`form-group ${emailError ? "has-error" : ""}`}>
            <label htmlFor="login-email">Email</label>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                id="login-email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <div className="error-message">{emailError}</div>}
          </div>

          <div className={`form-group ${passwordError ? "has-error" : ""}`}>
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
              <a href="/forgot-password" className="forgot-password">
                Forgot password?
              </a>
            </div>
            <div className="input-wrapper">
              <svg
                className="input-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                id="login-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {passwordError && <div className="error-message">{passwordError}</div>}
          </div>

          <div className="form-group remember-me">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
          </div>

          <button type="submit" className={`submit-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? <span className="loading-spinner"></span> : "Sign In"}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            Don't have an account?{" "}
            <a
              href={`/signup?type=${accountType}${redirectTo ? `&from=${encodeURIComponent(redirectTo)}` : ""}`}
              className="signup-link"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginModal