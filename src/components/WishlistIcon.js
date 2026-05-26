import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './WishlistIcon.css';

/**
 * WishlistIcon — shown in the Navbar next to CartIcon.
 * Displays a live badge with the number of items in the user's wishlist.
 * Refreshes whenever the route changes (similar to CartIcon).
 */
export default function WishlistIcon() {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Only fetch for logged-in, non-admin customers
    if (!isLoggedIn() || isAdmin()) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await wishlistAPI.getMyWishlist();
        if (!cancelled) {
          setCount(res.data?.totalItems ?? 0);
        }
      } catch {
        // Silently ignore — never disrupt the UI
      }
    };

    fetchCount();

    return () => { cancelled = true; };
  }, [location.pathname, isLoggedIn, isAdmin]);

  // Don't render for guests or admins
  if (!isLoggedIn() || isAdmin()) return null;

  return (
    <Link to="/wishlist" className="wishlist-icon-link" title="My Wishlist">
      <span className="wishlist-icon-emoji">💝</span>
      {count > 0 && (
        <span className="wishlist-icon-badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}