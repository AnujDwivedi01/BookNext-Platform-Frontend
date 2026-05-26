import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Wishlist.css';

// ─── Fallback cover when no image URL is available ────────────────────────────
const PLACEHOLDER = 'https://via.placeholder.com/120x170?text=No+Cover';

// ─── Single Wishlist Card ─────────────────────────────────────────────────────

function WishlistCard({ item, onRemove, onMoveToCart, actionLoading }) {
  const isActioning = actionLoading === item.bookId;

  return (
    <div className={`wishlist-card${isActioning ? ' actioning' : ''}`}>
      {/* Book cover */}
      <Link to={`/books/${item.bookId}`} className="wishlist-card-cover">
        <img
          src={item.coverImageUrl || PLACEHOLDER}
          alt={item.bookTitle}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
      </Link>

      {/* Book details */}
      <Link to={`/books/${item.bookId}`} className="wishlist-card-info">
        <h3 className="wishlist-card-title">{item.bookTitle}</h3>
        {item.author && (
          <p className="wishlist-card-author">by {item.author}</p>
        )}
        <p className="wishlist-card-price">
          ₹{item.bookPrice?.toFixed(2)}
        </p>
      </Link>

      {/* Actions */}
      <div className="wishlist-card-actions">
        <button
          className="btn-move-to-cart"
          disabled={isActioning}
          onClick={() => onMoveToCart(item)}
          title="Move to cart"
        >
          {isActioning ? (
            <span className="btn-spinner" />
          ) : (
            <>Move to Cart</>
          )}
        </button>
        <button
          className="btn-remove"
          disabled={isActioning}
          onClick={() => onRemove(item.bookId)}
          title="Remove from wishlist"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyWishlist({ onBrowse }) {
  return (
    <div className="wishlist-empty">
      <div className="wishlist-empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <h2>Your wishlist is empty</h2>
      <p>Save books you love here and come back to them anytime.</p>
      <button className="btn-browse" onClick={onBrowse}>
        Browse Books
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Wishlist() {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const toast    = useToast();
  const navigate = useNavigate();

  const [wishlist,     setWishlist]     = useState(null);   // WishlistResponse
  const [loading,      setLoading]      = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // bookId currently processing
  const [clearLoading, setClearLoading] = useState(false);

  // ── Fetch wishlist ──────────────────────────────────────────────────────────
  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wishlistAPI.getMyWishlist();
      setWishlist(res.data);
    } catch (err) {
      toast.error('Failed to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // ── Remove book ─────────────────────────────────────────────────────────────
  const handleRemove = async (bookId) => {
    setActionLoading(bookId);
    try {
      const res = await wishlistAPI.removeBook(bookId);
      setWishlist(res.data);
      toast.success('Book removed from wishlist.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove book.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Move to cart ────────────────────────────────────────────────────────────
  const handleMoveToCart = async (item) => {
    setActionLoading(item.bookId);
    try {
      const res = await wishlistAPI.moveToCart({ bookId: item.bookId, quantity: 1 });
      toast.success(res.data?.message || `"${item.bookTitle}" moved to cart!`);
      await fetchCart(); // ✅ refresh CartContext so cart page / badge updates
      // Refresh wishlist to reflect the removed item
      const updated = await wishlistAPI.getMyWishlist();
      setWishlist(updated.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to move item to cart.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Clear wishlist ──────────────────────────────────────────────────────────
  const handleClear = async () => {
    if (!window.confirm('Clear your entire wishlist? This cannot be undone.')) return;
    setClearLoading(true);
    try {
      await wishlistAPI.clearWishlist();
      toast.success('Wishlist cleared.');
      await fetchWishlist();
    } catch (err) {
      toast.error('Failed to clear wishlist.');
    } finally {
      setClearLoading(false);
    }
  };

  // ── Move ALL to cart ────────────────────────────────────────────────────────
  const handleMoveAllToCart = async () => {
    if (!wishlist?.items?.length) return;
    if (!window.confirm(`Move all ${wishlist.totalItems} books to your cart?`)) return;

    let successCount = 0;
    let failCount    = 0;

    // Process sequentially to avoid race conditions
    for (const item of wishlist.items) {
      setActionLoading(item.bookId);
      try {
        await wishlistAPI.moveToCart({ bookId: item.bookId, quantity: 1 });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setActionLoading(null);
    await fetchCart();     // ✅ refresh CartContext so cart page / badge updates
    await fetchWishlist();

    if (successCount > 0) toast.success(`${successCount} book(s) moved to cart!`);
    if (failCount    > 0) toast.error(`${failCount} book(s) could not be moved.`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-loading">
          <div className="wishlist-spinner" />
          <p>Loading your wishlist…</p>
        </div>
      </div>
    );
  }

  const items = wishlist?.items || [];

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="wishlist-header">
          <div className="wishlist-header-left">
            <h1>
              My Wishlist
              {items.length > 0 && (
                <span className="wishlist-count-badge">{items.length}</span>
              )}
            </h1>
            {items.length > 0 && (
              <p className="wishlist-subtitle">
                {items.length} {items.length === 1 ? 'book' : 'books'} saved
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="wishlist-header-actions">
              <button
                className="btn-move-all"
                onClick={handleMoveAllToCart}
                disabled={!!actionLoading || clearLoading}
              >
                Move All to Cart
              </button>
              <button
                className="btn-clear-all"
                onClick={handleClear}
                disabled={!!actionLoading || clearLoading}
              >
                {clearLoading ? 'Clearing…' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <EmptyWishlist onBrowse={() => navigate('/books')} />
        ) : (
          <div className="wishlist-grid">
            {items.map(item => (
              <WishlistCard
                key={item.itemId}
                item={item}
                onRemove={handleRemove}
                onMoveToCart={handleMoveToCart}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* ── Footer hint ─────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <p className="wishlist-footer-hint">
            Prices shown are at the time of adding. Final price is confirmed at checkout.
          </p>
        )}

      </div>
    </div>
  );
}