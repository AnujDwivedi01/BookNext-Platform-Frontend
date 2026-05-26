import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import './Auth.css';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login }  = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const location   = useLocation();
  // Where to go after successful login (set by ProtectedRoute)
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      //  res.data = { token, userId, email, fullName, role }
      login(res.data);
      toast.success(`Welcome back, ${res.data.fullName || res.data.email}!`);
      if (from) {
        // Return the user to the page they originally wanted
        navigate(from, { replace: true });
      } else if (res.data.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/books');
      }
    } catch (err) {
      const msg = err.response?.data || 'Login failed. Please check your credentials.';
      toast.error(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Redirects to Spring Security's Google OAuth endpoint on auth-service (port 8080)
  // Spring handles the Google redirect, then calls OAuth2SuccessHandler which
  // redirects back to /oauth-success?token=...&userId=...&email=...&fullName=...&role=...
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration" />
      <div className="auth-container fade-up">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo size={24} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
            Book<em>Nest</em>
          </Link>
          <h1>Welcome back</h1>
          <p className="text-dim">Sign in to your account to continue</p>
        </div>

        {/*  Google Sign-In Button */}
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
          <span>or sign in with email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-gold auth-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-dim text-sm">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}