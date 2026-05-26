import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Cart.css';

export default function Cart() {
  const { cartItems, totalPrice, totalItems, removeItem, updateQuantity, clearCart, loading } = useCart();
  const { isLoggedIn } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [updatingId, setUpdatingId] = useState(null);
  const [clearing,   setClearing]   = useState(false);

  // ── Not logged in — redirect to login, come back after ─────────────────────
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cart-page">
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-header fade-up">
            <h1>My Cart</h1>
          </div>
          <div className="empty-state fade-up">
            <div className="icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h3>Your cart is empty</h3>
            <p>Browse our collection and add books you love.</p>
            <Link to="/books" className="btn btn-gold" style={{ marginTop: 'var(--gap-lg)' }}>
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Quantity change ─────────────────────────────────────────────────────────
  const handleQtyChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateQuantity(itemId, newQty);
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Remove item ─────────────────────────────────────────────────────────────
  const handleRemove = async (itemId, title) => {
    setUpdatingId(itemId);
    try {
      await removeItem(itemId);
      toast.success(`"${title}" removed from cart`);
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Clear cart ──────────────────────────────────────────────────────────────
  const handleClear = async () => {
    if (!window.confirm('Clear all items from your cart?')) return;
    setClearing(true);
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    } finally {
      setClearing(false);
    }
  };

  // ── Proceed to checkout ─────────────────────────────────────────────────────
  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="cart-page">
      <div className="container">
        {/* Header */}
        <div className="cart-header fade-up">
          <div>
            <h1>My Cart</h1>
            <p className="text-dim">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            disabled={clearing}
          >
            {clearing ? 'Clearing…' : 'Clear Cart'}
          </button>
        </div>

        <div className="cart-layout">
          {/* ── Cart Items ─────────────────────────────────────────────────── */}
          <div className="cart-items fade-up">
            {cartItems.map((item, idx) => (
              <div
                key={item.itemId}
                className="cart-item card"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                {/* Book Cover */}
                <Link to={`/books/${item.bookId}`} className="item-cover">
                  <span className="item-initial">
                    {(item.bookTitle || 'B')[0].toUpperCase()}
                  </span>
                </Link>

                {/* Book Details */}
                <div className="item-details">
                  <Link to={`/books/${item.bookId}`} className="item-title">
                    {item.bookTitle}
                  </Link>
                  <p className="item-author text-dim">by {item.bookAuthor}</p>
                  <p className="item-price text-gold">₹{item.price?.toFixed(2)} each</p>
                </div>

                {/* Quantity Controls */}
                <div className="item-qty">
                  <button
                    className="qty-btn"
                    onClick={() => handleQtyChange(item.itemId, item.quantity - 1)}
                    disabled={updatingId === item.itemId || item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className="qty-value">
                    {updatingId === item.itemId ? '…' : item.quantity}
                  </span>
                  <button
                    className="qty-btn"
                    onClick={() => handleQtyChange(item.itemId, item.quantity + 1)}
                    disabled={updatingId === item.itemId}
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="item-subtotal">
                  <span className="subtotal-label text-dim text-sm">Subtotal</span>
                  <span className="subtotal-value text-gold">
                    ₹{item.subtotal?.toFixed(2)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  className="item-remove"
                  onClick={() => handleRemove(item.itemId, item.bookTitle)}
                  disabled={updatingId === item.itemId}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* ── Order Summary ───────────────────────────────────────────────── */}
          <div className="cart-summary card fade-up">
            <h3>Order Summary</h3>
            <div className="divider" />

            <div className="summary-rows">
              <div className="summary-row">
                <span className="text-dim">Items ({totalItems})</span>
                <span>₹{totalPrice?.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="text-dim">Delivery</span>
                <span className="text-gold">Free</span>
              </div>
            </div>

            <div className="divider" />

            <div className="summary-row summary-total">
              <span>Total</span>
              <span className="text-gold" style={{ fontSize: 22, fontWeight: 700 }}>
                ₹{totalPrice?.toFixed(2)}
              </span>
            </div>

            <button
              className="btn btn-gold"
              style={{ width: '100%', marginTop: 'var(--gap-lg)', justifyContent: 'center' }}
              onClick={handleCheckout}
            >
              Proceed to Checkout →
            </button>

            <Link to="/books" className="btn btn-ghost" style={{ width: '100%', marginTop: 'var(--gap-sm)', justifyContent: 'center' }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}