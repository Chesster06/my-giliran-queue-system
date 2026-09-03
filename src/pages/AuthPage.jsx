import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, signInWithGoogle } from '../lib/authStore';

export function AuthPage({ initialMode = 'login', onNavigate, onAuthSuccess, showToast }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');
  const [localToast, setLocalToast] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode]);

  function switchMode(newMode) {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setName('');
    setBusinessName('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const user = await loginUser({ email, password });
        setSuccessMsg(`Welcome back, ${user.name}! Logging you in...`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(user);
          else onNavigate('admin');
        }, 500);
      } else {
        const user = await registerUser({ name, email, password, businessName });
        setSuccessMsg(`Account created for ${user.name}! Redirecting...`);
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(user);
          else onNavigate('admin');
        }, 500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    if (showToast) {
      showToast('Coming soon');
    } else {
      setLocalToast('Coming soon');
      setTimeout(() => setLocalToast(''), 3000);
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotStatus('Please provide your email address.');
      return;
    }
    setForgotStatus('Password reset link sent! Check your inbox (mock).');
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotStatus('');
      setForgotEmail('');
    }, 2000);
  }

  return (
    <div className="auth-page-container">
      {/* Split Screen Wrapper */}
      <div className="auth-split-wrapper">
        
        {/* Left Side: Brand Visual & Hero Value Proposition */}
        <div className="auth-visual-panel">
          {/* Decorative geometric background waves */}
          <div className="auth-decor-shapes">
            <div className="auth-circle-wave wave-1"></div>
            <div className="auth-circle-wave wave-2"></div>
            <div className="auth-circle-wave wave-3"></div>
          </div>

          <div className="auth-visual-content">
            {/* Top Star/Sparkle Emblem Icon (Inspired by reference mockup) */}
            <div className="auth-star-icon" aria-hidden="true">
              <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50 0L56.5 37.5L93.3 25L67.5 53.5L97.5 78.5L59.5 73.5L50 100L40.5 73.5L2.5 78.5L32.5 53.5L6.7 25L43.5 37.5L50 0Z"
                  fill="white"
                  fillOpacity="0.95"
                />
              </svg>
            </div>

            {/* Headline with Greeting and Sparkle Icon */}
            <h1 className="auth-visual-heading">
              Hello <br />
              <span className="auth-gradient-text">MyGiliran!</span>{' '}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', color: '#10b981' }}>
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/>
              </svg>
            </h1>

            {/* Value Proposition Description */}
            <p className="auth-visual-desc">
              Skip repetitive queue chaos and manual ticketing. Get highly productive through instant QR-based automation and save tons of time!
            </p>

            {/* Highlights pill tags with SVGs */}
            <div className="auth-pill-badges">
              <span className="auth-mini-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Instant QR Scan</span>
              </span>
              <span className="auth-mini-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                <span>100% Zero-App</span>
              </span>
              <span className="auth-mini-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Live Queue Callouts</span>
              </span>
            </div>

            <div className="auth-visual-footer">
              <span>Trusted by retail counters, clinics, salons & public desks.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Form Container */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            
            {/* Brand Logo Header */}
            <div className="auth-brand-row">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="auth-logo-btn"
                title="Back to Home Page"
              >
                <img
                  src="/logo-icon.png?v=2"
                  alt="MyGiliran"
                  style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }}
                />
                <span className="auth-brand-title">
                  My<span>Giliran</span>
                </span>
              </button>

              <button
                type="button"
                className="auth-back-link"
                onClick={() => onNavigate('landing')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                <span>Back to Home</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <div key={`header-${mode}`} className="auth-header-copy auth-switch-animated">
              <h2 className="auth-title">
                {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
              </h2>
              
              <div className="auth-subtitle">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => switchMode('register')}
                    >
                      Create a new account now, it's FREE!
                    </button>{' '}
                    Takes less than a minute.
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => switchMode('login')}
                    >
                      Login now here
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="auth-alert error" role="alert">
                <span className="auth-alert-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                <div>
                  <span>{errorMsg}</span>
                  {mode === 'login' && errorMsg.toLowerCase().includes('not registered') && (
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      style={{
                        marginLeft: '6px',
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontWeight: '800',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        display: 'inline'
                      }}
                    >
                      Sign up here
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="auth-alert success" role="alert">
                <span className="auth-alert-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>{successMsg}</span>
              </div>
            )}



            {/* Authentication Form */}
            <form key={`form-${mode}`} onSubmit={handleSubmit} className="auth-form auth-switch-animated" noValidate>
              
              {/* Extra registration fields */}
              {mode === 'register' && (
                <>
                  <div className="auth-field-group">
                    <label htmlFor="auth-name" className="auth-label">
                      Full Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-input-line"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="auth-biz" className="auth-label">
                      Business or Counter Name
                    </label>
                    <input
                      id="auth-biz"
                      type="text"
                      className="auth-input-line"
                      placeholder="e.g. Main Clinic & Pharmacy"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="auth-field-group">
                <label htmlFor="auth-email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input-line"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              {/* Password */}
              <div className="auth-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="auth-password" className="auth-label">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-toggle-pass"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-line"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {/* Action Button: Dark prominent button matching reference */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : mode === 'login' ? (
                  'Login Now'
                ) : (
                  'Create Free Account'
                )}
              </button>

              {/* Google Login Button */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                <span>{mode === 'login' ? 'Login with Google' : 'Sign up with Google'}</span>
              </button>
            </form>

            {/* Forget Password Helper Link */}
            {mode === 'login' && (
              <div className="auth-footer-help">
                <span>Forget password </span>
                <button
                  type="button"
                  className="auth-forget-btn"
                  onClick={() => setShowForgotModal(true)}
                >
                  Click here
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)' }}>Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', padding: '4px' }}
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Enter your registered email address and we'll send instructions to reset your password.
            </p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                className="auth-input-line"
                placeholder="youremail@domain.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoFocus
                required
                style={{ marginBottom: '16px' }}
              />
              {forgotStatus && (
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '16px', fontWeight: '600' }}>
                  {forgotStatus}
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fallback Toast Notification */}
      {localToast && !showToast && (
        <div className="toast-container">
          <div className="toast">{localToast}</div>
        </div>
      )}

    </div>
  );
}
