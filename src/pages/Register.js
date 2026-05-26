import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import './Auth.css';

const STEPS = { REGISTER: 'register', VERIFY: 'verify' };

export default function Register() {
  const [step, setStep]       = useState(STEPS.REGISTER);
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [form, setForm]       = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs               = useRef([]);
  const toast                 = useToast();
  const navigate              = useNavigate();

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
  };



  const validatePassword = (pass) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=*]).{8,}$/;
    return regex.test(pass);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validatePassword(form.password)) {
      toast.error('Password does not meet requirements (Min 8 chars, Upper, Lower, Number, Special)');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(form);
      setEmail(form.email);
      toast.success('OTP sent to your email!');
      setStep(STEPS.VERIFY);
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(email, code);
      toast.success('Account verified! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.resendOtp(email);
      toast.info('OTP resent to your email');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  // Google OAuth — goes directly to Spring Security endpoint
  // No OTP needed for Google users — they're auto-verified in OAuth2SuccessHandler
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  if (step === STEPS.VERIFY) {
    return (
      <div className="auth-page">
        <div className="auth-decoration" />
        <div className="auth-container fade-up">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <Logo size={24} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
              Book<em>Nest</em>
            </Link>
            <h1>Verify Email</h1>
            <p className="text-dim">We sent a 6-digit OTP to</p>
            <p className="text-gold" style={{ fontWeight: 600 }}>{email}</p>
          </div>

          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-info">
              Enter the OTP from your email to activate your account.
            </div>

            <div className="form-group">
              <label>One-Time Password</label>
              <div className="otp-inputs">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
          </form>

          <div className="resend-row" style={{ marginTop: 'var(--gap-lg)' }}>
            <span>Didn't receive it?</span>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }} onClick={handleResend}>
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration" />
      <div className="auth-container fade-up">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo size={24} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
            Book<em>Nest</em>
          </Link>
          <h1>Create Account</h1>
          <p className="text-dim">Join BookNest today</p>
        </div>

        {/* ✅ Google Sign-Up Button */}
        <button className="btn-google" onClick={handleGoogleLogin} type="button">
          <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>  
           

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min 8 chars, upper, lower, number, special"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            <span className="password-hint">
              Must contain uppercase, lowercase, number, and special character (@#$%^&+=*)
            </span>
          </div>

          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-dim text-sm">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}