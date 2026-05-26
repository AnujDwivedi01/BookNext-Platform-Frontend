import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import './Auth.css';

const STEPS = { EMAIL: 'email', RESET: 'reset', DONE: 'done' };

// Must match backend @Pattern in ResetPasswordRequest.java
const RULES = [
  { id: 'upper',   label: 'One uppercase letter',              test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',              test: (p) => /[a-z]/.test(p) },
  { id: 'digit',   label: 'One number',                        test: (p) => /\d/.test(p) },
  { id: 'special', label: 'One special character (@#$%^&+=*)', test: (p) => /[@#$%^&+=*]/.test(p) },
  { id: 'length',  label: 'At least 8 characters',             test: (p) => p.length >= 8 },
];

export default function ForgotPassword() {
  const [step,    setStep]   = useState(STEPS.EMAIL);
  const [email,   setEmail]  = useState('');
  const [form,    setForm]   = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  const passedRules    = RULES.filter(r => r.test(form.newPassword));
  const isPasswordValid = passedRules.length === RULES.length;
  const passwordsMatch  = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent to your email');
      setStep(STEPS.RESET);
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: reset password ──────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!form.otp)        { toast.error('Enter the OTP'); return; }
    if (!isPasswordValid) { toast.error('Password does not meet the requirements below'); return; }
    if (!passwordsMatch)  { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp: form.otp, newPassword: form.newPassword });
      toast.success('Password reset! Please log in with your new password.');
      setStep(STEPS.DONE);
    } catch (err) {
      const data = err.response?.data;
      // Surface Spring @Valid constraint violation messages
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        toast.error(data.errors[0].defaultMessage || 'Validation error');
      } else if (typeof data === 'string') {
        toast.error(data);
      } else {
        toast.error('Reset failed. Check your OTP and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (step === STEPS.DONE) {
    return (
      <div className="auth-page">
        <div className="auth-container fade-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 'var(--gap-lg)' }}>✅</div>
          <h2>Password Reset!</h2>
          <p className="text-dim" style={{ marginTop: 8 }}>
            Your password has been updated. Please log in with your new password.
          </p>
          <Link to="/login" className="btn btn-gold" style={{ marginTop: 'var(--gap-xl)', display: 'inline-flex' }}>
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  // ── Reset step ──────────────────────────────────────────────────────────────
  if (step === STEPS.RESET) {
    return (
      <div className="auth-page">
        <div className="auth-decoration" />
        <div className="auth-container fade-up">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <Logo size={24} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
              Book<em>Nest</em>
            </Link>
            <h1>Reset Password</h1>
            <p className="text-dim">
              OTP sent to <strong style={{ color: 'var(--gold)' }}>{email}</strong>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleReset}>

            {/* OTP */}
            <div className="form-group">
              <label>OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={form.otp}
                onChange={e => setForm({ ...form, otp: e.target.value })}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            {/* New Password */}
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  autoComplete="new-password"
                  style={{
                    borderColor: form.newPassword.length > 0
                      ? (isPasswordValid ? 'var(--green)' : 'var(--red)')
                      : undefined
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
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
            </div>

            {/* Live strength checklist */}
            {form.newPassword.length > 0 && (
              <div style={{
                background: 'var(--bg-soft)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                display: 'flex', flexDirection: 'column', gap: 5, marginTop: -8
              }}>
                {RULES.map(r => {
                  const ok = r.test(form.newPassword);
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: ok ? 'var(--green)' : 'var(--red)', fontWeight: 700, width: 14 }}>
                        {ok ? '✓' : '✗'}
                      </span>
                      <span style={{ color: ok ? 'var(--green)' : 'var(--text-dim)' }}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm Password */}
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  style={{
                    borderColor: form.confirmPassword.length > 0
                      ? (passwordsMatch ? 'var(--green)' : 'var(--red)')
                      : undefined
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
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
              {form.confirmPassword.length > 0 && !passwordsMatch && (
                <span style={{ color: 'var(--red)', fontSize: 12, marginTop: 2 }}>
                  ✗ Passwords do not match
                </span>
              )}
              {form.confirmPassword.length > 0 && passwordsMatch && (
                <span style={{ color: 'var(--green)', fontSize: 12, marginTop: 2 }}>
                  ✓ Passwords match
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-gold auth-submit"
              disabled={loading || !isPasswordValid || !passwordsMatch || !form.otp}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="resend-row" style={{ marginTop: 'var(--gap-lg)' }}>
            <span>Didn't receive OTP?</span>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 12px', fontSize: 13 }}
              onClick={async () => {
                try { await authAPI.forgotPassword(email); toast.info('OTP resent'); }
                catch { toast.error('Failed to resend'); }
              }}
            >
              Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Email step ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-decoration" />
      <div className="auth-container fade-up">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo size={24} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
            Book<em>Nest</em>
          </Link>
          <h1>Forgot Password?</h1>
          <p className="text-dim">Enter your email and we'll send you a reset OTP</p>
        </div>

        <form className="auth-form" onSubmit={handleSendOtp}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-gold auth-submit" disabled={loading}>
            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-dim text-sm">
            Remember it? <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
