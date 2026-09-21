import React, { useState, useEffect, useRef } from 'react';
import './SignupModal.css';
import LoginModal from "./LoginModal"
import { capitalizeFirst } from "../utils/capitalize"

const API_URL = 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 15000;

// POST JSON with a hard timeout so the UI can never get stuck waiting on a
// request that hangs or a backend that is unreachable. Always settles: it
// either resolves with { response, data } or throws a friendly Error.
const postJson = async (path, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Unable to reach the server. Please make sure the backend is running and try again.');
  } finally {
    clearTimeout(timer);
  }
};

// Icons reused across the company fields (kept lightweight and inline to match
// the existing modal styling).
const FieldIcon = () => (
  <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"></path>
    <path d="M5 21V7l7-4 7 4v14"></path>
    <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"></path>
  </svg>
);

function SignupModal({ isOpen, onClose, defaultAccountType = 'user', redirectTo }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accountType, setAccountType] = useState(defaultAccountType);

  // Company-only fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [industryError, setIndustryError] = useState('');
  const [companyTypeError, setCompanyTypeError] = useState('');
  const [locationError, setLocationError] = useState('');
  // Prominent, form-level error shown right next to the submit button.
  const [formError, setFormError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  const isCompany = accountType === 'company';

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Validate email
  const validateEmail = (value) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(value).toLowerCase());
  };

  const resetErrors = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setPhoneError('');
    setIndustryError('');
    setCompanyTypeError('');
    setLocationError('');
    setFormError('');
  };

  // Shared field validation (name/email/password/confirm/terms + company extras).
  const validateForm = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError(isCompany ? 'Company name is required' : 'Name is required');
      isValid = false;
    }

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (isCompany) {
      if (!phoneNumber.trim()) {
        setPhoneError('Phone number is required');
        isValid = false;
      }
      if (!industry.trim()) {
        setIndustryError('Industry is required');
        isValid = false;
      }
      if (!companyType.trim()) {
        setCompanyTypeError('Company type is required');
        isValid = false;
      }
      if (!location.trim()) {
        setLocationError('Location is required');
        isValid = false;
      }
    }

    if (!termsAccepted) {
      setTermsError('You must accept the terms and conditions');
      isValid = false;
    }

    return isValid;
  };

  // Register a company, then authenticate as a COMPANY and go to the dashboard.
  // Returns true if navigation has started (so loading state stays until unload).
  const registerCompany = async () => {
    const { response, data } = await postJson('/companies/register', {
      name,
      email,
      phoneNumber,
      industry,
      companyType,
      location,
      website,
      password,
      confirmPassword,
    });

    if (!response.ok) {
      // Surface the failure both on the email field and in a prominent banner
      // next to the submit button so it is not missed at the bottom of the form.
      if (response.status === 409) {
        setEmailError('This email is already registered.');
        setFormError('This email is already registered. Please sign in to your company account.');
      } else {
        const message = data.message || 'Company registration failed. Please check your details and try again.';
        setEmailError(message);
        setFormError(message);
      }
      return false;
    }

    const { response: loginResponse, data: loginData } = await postJson('/auth/login', {
      email,
      password,
      userType: 'company',
    });
    if (!loginResponse.ok) {
      throw new Error(loginData.message || 'Registration succeeded, but automatic sign-in failed. Please sign in.');
    }

    // Store the company session using the existing token mechanism.
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('company', JSON.stringify(loginData.company));
    // Single full-page navigation only — see LoginModal: calling onClose()
    // (which is navigate('/') on the /signup page) alongside a window.location
    // assignment races two navigations and can bounce the visitor back to the
    // form. `replace` also keeps /signup out of the history stack.
    // A company that started from a protected page returns there; otherwise the
    // company dashboard.
    window.location.replace(redirectTo || '/company/dashboard');
    return true;
  };

  // Register a user, then authenticate as a USER (same success flow as before,
  // now with a timeout and a visible error banner instead of a blocking alert).
  const registerUser = async () => {
    const { response, data } = await postJson('/auth/register', {
      fullName: name,
      email,
      password,
      confirmPassword,
    });

    if (!response.ok) {
      const message = data.message || 'Signup failed. Please try again.';
      setEmailError(message);
      setFormError(message);
      return false;
    }

    const { response: loginResponse, data: loginData } = await postJson('/auth/login', {
      email,
      password,
      userType: 'user',
    });
    if (!loginResponse.ok) {
      throw new Error(loginData.message || 'Registration succeeded, but automatic sign-in failed. Please sign in.');
    }
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    // Single full-page navigation only (see the company branch above): avoid the
    // onClose()/navigate('/') + window.location race that bounces the visitor
    // back to the form. `replace` keeps /signup out of the history stack.
    // Return to the intended protected page (e.g. /internships) after signing
    // up, falling back to the user dashboard.
    window.location.replace(redirectTo || '/dashboard');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // guard against accidental double-submit
    resetErrors();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isCompany) {
        await registerCompany();
      } else {
        await registerUser();
      }
    } catch (error) {
      // Network failures, timeouts, or a failed auto-login land here. Show the
      // reason in the banner above the submit button — never leave it stuck.
      console.error('Error during signup:', error);
      setFormError(error.message || 'An error occurred. Please try again later.');
    } finally {
      // Always clear loading. On the success path the page is already
      // navigating away, so this is a harmless no-op.
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="signup-modal-overlay">
      <div className="signup-modal" ref={modalRef}>
        <button className="signup-modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="signup-modal-header">
          <h2 className="signup-modal-title">{isCompany ? 'Create a Company Account' : 'Create Your Account'}</h2>
          <p className="signup-modal-subtitle">
            {isCompany ? 'Post opportunities and reach the right candidates' : 'Join our community and discover opportunities'}
          </p>
        </div>

        <div className="account-type-selector" role="group" aria-label="Account type">
          <button type="button" className={accountType === 'user' ? 'selected' : ''} onClick={() => setAccountType('user')}>User</button>
          <button type="button" className={accountType === 'company' ? 'selected' : ''} onClick={() => setAccountType('company')}>Company</button>
        </div>

        <form className="signup-modal-form" onSubmit={handleSubmit}>
          <div className={`signup-form-group ${nameError ? 'has-error' : ''}`}>
            <label htmlFor="signup-name">{isCompany ? 'Company Name' : 'Full Name'}</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                id="signup-name"
                placeholder={isCompany ? 'Enter your company name' : 'Enter your full name'}
                value={name}
                onChange={(e) => setName(capitalizeFirst(e.target.value))}
              />
            </div>
            {nameError && <div className="signup-error-message">{nameError}</div>}
          </div>

          <div className={`signup-form-group ${emailError ? 'has-error' : ''}`}>
            <label htmlFor="signup-email">{isCompany ? 'Company Email' : 'Email Address'}</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                id="signup-email"
                placeholder={isCompany ? 'Enter your company email' : 'Enter your email address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <div className="signup-error-message">{emailError}</div>}
          </div>

          {isCompany && (
            <>
              <div className={`signup-form-group ${phoneError ? 'has-error' : ''}`}>
                <label htmlFor="signup-phone">Phone Number</label>
                <div className="signup-input-wrapper">
                  <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    id="signup-phone"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                {phoneError && <div className="signup-error-message">{phoneError}</div>}
              </div>

              <div className={`signup-form-group ${industryError ? 'has-error' : ''}`}>
                <label htmlFor="signup-industry">Industry</label>
                <div className="signup-input-wrapper">
                  <FieldIcon />
                  <input
                    type="text"
                    id="signup-industry"
                    placeholder="e.g. Software, Finance, Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(capitalizeFirst(e.target.value))}
                  />
                </div>
                {industryError && <div className="signup-error-message">{industryError}</div>}
              </div>

              <div className={`signup-form-group ${companyTypeError ? 'has-error' : ''}`}>
                <label htmlFor="signup-company-type">Company Type</label>
                <div className="signup-input-wrapper">
                  <FieldIcon />
                  <select
                    id="signup-company-type"
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                  >
                    <option value="">Select company type</option>
                    <option value="Private Company">Private Company</option>
                    <option value="Startup">Startup</option>
                    <option value="NGO / Non-profit">NGO / Non-profit</option>
                    <option value="Government">Government</option>
                    <option value="Educational">Educational</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {companyTypeError && <div className="signup-error-message">{companyTypeError}</div>}
              </div>

              <div className={`signup-form-group ${locationError ? 'has-error' : ''}`}>
                <label htmlFor="signup-location">Location</label>
                <div className="signup-input-wrapper">
                  <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <input
                    type="text"
                    id="signup-location"
                    placeholder="e.g. Addis Ababa"
                    value={location}
                    onChange={(e) => setLocation(capitalizeFirst(e.target.value))}
                  />
                </div>
                {locationError && <div className="signup-error-message">{locationError}</div>}
              </div>

              <div className="signup-form-group">
                <label htmlFor="signup-website">Website <span className="optional-hint">(optional)</span></label>
                <div className="signup-input-wrapper">
                  <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <input
                    type="url"
                    id="signup-website"
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className={`signup-form-group ${passwordError ? 'has-error' : ''}`}>
            <label htmlFor="signup-password">Password</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                id="signup-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {passwordError && <div className="signup-error-message">{passwordError}</div>}
            <p className="password-hint">Password must be at least 8 characters</p>
          </div>

          <div className={`signup-form-group ${confirmPasswordError ? 'has-error' : ''}`}>
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                id="signup-confirm-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {confirmPasswordError && <div className="signup-error-message">{confirmPasswordError}</div>}
          </div>

          <div className={`signup-form-group terms-group ${termsError ? 'has-error' : ''}`}>
            <label className="terms-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="terms-text">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </span>
            </label>
            {termsError && <div className="signup-error-message">{termsError}</div>}
          </div>

          {formError && <div className="signup-form-error" role="alert">{formError}</div>}

          <button
            type="submit"
            className={`signup-modal-submit ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="signup-spinner"></span>
            ) : (
              isCompany ? 'Create Company Account' : 'Create Account'
            )}
          </button>
        </form>

        <div className="signup-modal-footer">
          <p>
            Already have an account?{' '}
            <a
              href={`/login?type=${accountType}${redirectTo ? `&from=${encodeURIComponent(redirectTo)}` : ''}`}
              className="login-link"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupModal;
