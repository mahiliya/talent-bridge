import React, { useState, useEffect, useRef } from 'react';
import './SignupModal.css';
import LoginModal from "./LoginModal"

function SignupModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accountType, setAccountType] = useState('user');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  
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
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
  
    // Validate inputs
    let isValid = true;
  
    if (!name.trim()) {
      setNameError('Name is required');
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
  
    if (!termsAccepted) {
      setTermsError('You must accept the terms and conditions');
      isValid = false;
    }
  
    if (accountType === 'company') {
      setEmailError('Company registration is coming soon. Choose User to continue.');
      isValid = false;
    }

    if (isValid) {
      setIsLoading(true);
  
      try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: name,
            email: email,
            password: password,
            confirmPassword: confirmPassword,
          }),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          console.log('Signup successful:', data);
          const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, userType: 'user' }),
          });
          const loginData = await loginResponse.json();
          if (!loginResponse.ok) throw new Error(loginData.message || 'Registration succeeded, but login failed.');
          localStorage.setItem('accessToken', loginData.accessToken);
          localStorage.setItem('refreshToken', loginData.refreshToken);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          onClose(); // Close the modal after successful signup
          window.location.href = '/dashboard';
        } else {
          console.error('Signup failed:', data);
          alert(data.message || 'Signup failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during signup:', error);
        alert('An error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
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
          <h2 className="signup-modal-title">Create Your Account</h2>
          <p className="signup-modal-subtitle">Join our community and discover opportunities</p>
        </div>

        <div className="account-type-selector" role="group" aria-label="Account type">
          <button type="button" className={accountType === 'user' ? 'selected' : ''} onClick={() => setAccountType('user')}>User</button>
          <button type="button" className={accountType === 'company' ? 'selected' : ''} onClick={() => setAccountType('company')}>Company</button>
        </div>
        
        <div className="signup-social-buttons">
          <button type="button" className="social-signup-button google-button">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
            </svg>
            <span>Sign up with Google</span>
          </button>
          
        </div>
        
        <div className="signup-divider">
          <span>or sign up with email</span>
        </div>
        
        <form className="signup-modal-form" onSubmit={handleSubmit}>
          <div className={`signup-form-group ${nameError ? 'has-error' : ''}`}>
            <label htmlFor="signup-name">Full Name</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                id="signup-name" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {nameError && <div className="signup-error-message">{nameError}</div>}
          </div>
          
          <div className={`signup-form-group ${emailError ? 'has-error' : ''}`}>
            <label htmlFor="signup-email">Email Address</label>
            <div className="signup-input-wrapper">
              <svg className="signup-input-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                id="signup-email" 
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <div className="signup-error-message">{emailError}</div>}
          </div>
          
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
          
          <button 
            type="submit" 
            className={`signup-modal-submit ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="signup-spinner"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        
        
        <div className="signup-modal-footer">
          <p>Already have an account? <a href="/login" className="login-link">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}

export default SignupModal;
