import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';
import { authAPI, notificationAPI, wishlistAPI } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { totalItems: cartCount } = useCart();
  const toast    = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [wishlistCount,  setWishlistCount]  = useState(0);

  const profileRef = useRef(null);
  const pollRef    = useRef(null);

  // ── Poll notification count ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn() || isAdmin()) { setUnreadCount(0); return; }
    const fetchCount = async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        setUnreadCount(res.data?.unreadCount ?? 0);
      } catch {}
    };
    fetchCount();
    pollRef.current = setInterval(fetchCount, 30_000);
    return () => clearInterval(pollRef.current);
  }, [isLoggedIn, isAdmin, location.pathname]);

  // ── Fetch wishlist count ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn() || isAdmin()) { setWishlistCount(0); return; }
    wishlistAPI.getMyWishlist()
      .then(res => setWishlistCount(res.data?.totalItems ?? 0))
      .catch(() => {});
  }, [isLoggedIn, isAdmin, location.pathname]);

  // ── Close profile dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Close dropdown on route change ───────────────────────────────────────
  useEffect(() => { setProfileOpen(false); setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    logout();
    setProfileOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">
            <Logo size={24} />
          </span>
          <span className="logo-text">Book<em>Next</em></span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links">
          <Link to="/books" className={`nav-link ${isActive('/books') ? 'active' : ''}`}>Catalog</Link>
          {isLoggedIn() && !isAdmin() && (
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>My Orders</Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/my-reviews" className={`nav-link ${isActive('/my-reviews') ? 'active' : ''}`}>My Reviews</Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/wallet" className={`nav-link ${isActive('/wallet') ? 'active' : ''}`}>Wallet</Link>
          )}
          {isLoggedIn() && (
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              {isAdmin() ? 'Admin Panel' : 'Dashboard'}
            </Link>
          )}
        </div>

        {/* Desktop right: Profile dropdown or Login/Register */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {isLoggedIn() ? (
            <div className="profile-menu-wrap" ref={profileRef}>
              <button
                className={`profile-trigger ${profileOpen ? 'open' : ''}`}
                onClick={() => setProfileOpen(prev => !prev)}
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">
                  {displayName[0].toUpperCase()}
                </span>
                <span className="profile-name">{displayName}</span>
                {isAdmin() && <span className="badge-admin">Admin</span>}

                {/* Combined badge for cart + wishlist + notifs */}
                {!isAdmin() && (cartCount + wishlistCount + unreadCount) > 0 && (
                  <span className="profile-alert-dot" />
                )}

                <svg className="profile-chevron" width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {profileOpen && (
                <div className="profile-dropdown">

                  {/* User info header */}
                  <div className="dropdown-header">
                    <span className="dropdown-avatar">{displayName[0].toUpperCase()}</span>
                    <div>
                      <div className="dropdown-name">{displayName}</div>
                      <div className="dropdown-email">{user?.email || ''}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Customer-only items */}
                  {!isAdmin() && (
                    <>
                      <Link to="/cart" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <span className="dropdown-item-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.61L23 6H6"/>
                          </svg>
                        </span>
                        <span className="dropdown-item-label">Cart</span>
                        {cartCount > 0 && <span className="dropdown-badge">{cartCount}</span>}
                      </Link>

                      <Link to="/wishlist" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <span className="dropdown-item-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                          </svg>
                        </span>
                        <span className="dropdown-item-label">Wishlist</span>
                        {wishlistCount > 0 && <span className="dropdown-badge">{wishlistCount}</span>}
                      </Link>

                      <Link
                        to="/notifications"
                        className="dropdown-item"
                        onClick={() => { setProfileOpen(false); setUnreadCount(0); }}
                      >
                        <span className="dropdown-item-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 01-3.46 0"/>
                          </svg>
                        </span>
                        <span className="dropdown-item-label">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="dropdown-badge notif">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                      </Link>

                      <div className="dropdown-divider" />
                    </>
                  )}

                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-item-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </span>
                    <span className="dropdown-item-label">Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-gold  btn-sm">Register</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu fade-in">
          <Link to="/books" onClick={() => setMenuOpen(false)}>Catalog</Link>
          {isLoggedIn() && !isAdmin() && (
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/my-reviews" onClick={() => setMenuOpen(false)}>My Reviews</Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/wallet" onClick={() => setMenuOpen(false)}>Wallet</Link>
          )}
          {isLoggedIn() && !isAdmin() && (
            <Link to="/notifications" onClick={() => { setMenuOpen(false); setUnreadCount(0); }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Link>
          )}
          {isLoggedIn() && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
              {isAdmin() ? 'Admin Panel' : 'Dashboard'}
            </Link>
          )}
          {isLoggedIn() ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}