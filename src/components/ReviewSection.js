import React, { useState, useEffect, useCallback } from 'react';
import { reviewAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import './ReviewSection.css';

// ── Interactive / display star row ───────────────────────────────────────────
function Stars({ rating, size = 18, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= (interactive ? (hovered || rating) : rating) ? 'filled' : ''}`}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReviewSection({ bookId }) {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();

  const [reviews,       setReviews]       = useState([]);
  const [avgData,       setAvgData]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [myReview,      setMyReview]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [hasPurchased,  setHasPurchased]  = useState(false);  // ✅ purchase gate

  // Form fields
  const [rating,     setRating]     = useState(5);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsRes, avgRes] = await Promise.all([
        reviewAPI.getByBook(bookId),
        reviewAPI.getAvgRating(bookId),
      ]);
      const list = reviewsRes.data || [];
      setReviews(list);
      setAvgData(avgRes.data);

      if (isLoggedIn() && user?.id) {
        const mine = list.find(r => r.userId === Number(user.id));
        setMyReview(mine || null);

        // ✅ Check if user has purchased this book
        try {
          const ordersRes = await orderAPI.getMyOrders();
          const orders = ordersRes.data || [];
          const purchased = orders.some(order =>
            (order.items || []).some(item => item.bookId === Number(bookId))
          );
          setHasPurchased(purchased);
        } catch {
          setHasPurchased(false);
        }
      }
    } catch {
      // non-critical — silently ignore
    } finally {
      setLoading(false);
    }
  }, [bookId, user, isLoggedIn]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // ── Open forms ─────────────────────────────────────────────────────────────
  const openAddForm = () => {
    setRating(5); setComment(''); setEditMode(false); setShowForm(true);
  };
  const openEditForm = () => {
    setRating(myReview.rating);
    setComment(myReview.comment || '');
    setEditMode(true);
    setShowForm(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editMode) {
        await reviewAPI.updateReview(myReview.reviewId, { rating, comment });
        toast.success('Review updated!');
      } else {
        await reviewAPI.addReview({ bookId: Number(bookId), rating, comment });
        toast.success('Review submitted!');
      }
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || err.response?.data || '';
      if (status === 403) {
        toast.error('You must be logged in to submit a review.');
      } else if (typeof msg === 'string' && msg.toLowerCase().includes('already reviewed')) {
        toast.error('You have already reviewed this book.');
      } else {
        toast.error('Could not submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewAPI.deleteReview(myReview.reviewId);
      toast.success('Review deleted');
      setMyReview(null);
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const otherReviews = reviews.filter(r => r.userId !== Number(user?.id));

  return (
    <div className="review-section">

      {/* ── Heading + avg rating ─────────────────────────────────────────── */}
      <div className="review-header">
        <h2 className="review-title">Reviews &amp; Ratings</h2>
        {avgData && Number(avgData.totalReviews) > 0 && (
          <div className="avg-rating-block">
            <span className="avg-number">
              {Number(avgData.avgRating).toFixed(1)}
            </span>
            <div className="avg-right">
              <Stars rating={Math.round(avgData.avgRating || 0)} size={20} />
              <span className="avg-count text-dim text-sm">
                {avgData.totalReviews} {Number(avgData.totalReviews) === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── My review card / write button ───────────────────────────────── */}
      {isLoggedIn() && !showForm && (
        <div className="my-review-zone">
          {myReview ? (
            <div className="my-review-card">
              <div className="my-review-label">Your Review</div>
              <Stars rating={myReview.rating} size={18} />
              {myReview.comment && <p className="review-comment">{myReview.comment}</p>}
              <div className="my-review-actions">
                <button className="btn btn-ghost btn-sm" onClick={openEditForm}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
              </div>
            </div>
          ) : hasPurchased ? (
            // ✅ Only show Write a Review if user has purchased this book
            <button className="btn btn-gold" onClick={openAddForm}>
              ✍️ Write a Review
            </button>
          ) : (
            // ❌ Not purchased — show informational message
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-soft)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', fontSize: 14
            }}>
              🛒 Purchase this book to write a review
            </div>
          )}
        </div>
      )}

      {/* ── Not logged in ────────────────────────────────────────────────── */}
      {!isLoggedIn() && (
        <div className="login-prompt">
          <Link to="/login" className="btn btn-outline btn-sm">
            Login to write a review
          </Link>
        </div>
      )}

      {/* ── Review form ──────────────────────────────────────────────────── */}
      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="form-section-title">
            {editMode ? 'Edit your review' : 'Write a review'}
          </div>

          <div className="rating-picker">
            <label>Your Rating</label>
            <Stars rating={rating} size={28} interactive onRate={setRating} />
            <span className="rating-word text-dim text-sm">{LABELS[rating]}</span>
          </div>

          <div className="rform-group">
            <label>Comment <span className="text-dim">(optional)</span></label>
            <textarea
              rows={4}
              maxLength={1000}
              placeholder="Share your thoughts about this book..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <span className="char-count text-dim text-sm">{comment.length}/1000</span>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-gold" disabled={submitting}>
              {submitting ? 'Submitting…' : editMode ? 'Update Review' : 'Submit Review'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Reviews list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : reviews.length === 0 ? (
        <div className="no-reviews-msg">
          <span>⭐</span>
          <p>No reviews yet — be the first to review this book!</p>
        </div>
      ) : (
        <div className="reviews-list">

          {/* Own review at top */}
          {myReview && (
            <div className="review-card own-card">
              <div className="review-card-top">
                <div className="reviewer-avatar own-av">You</div>
                <div className="reviewer-info">
                  <div className="reviewer-name">
                    You
                    {myReview.verified && (
                      <span className="verified-badge">✓ Verified Purchase</span>
                    )}
                  </div>
                  <div className="text-dim text-sm">{formatDate(myReview.reviewDate)}</div>
                </div>
                <Stars rating={myReview.rating} size={15} />
              </div>
              {myReview.comment && <p className="review-comment">{myReview.comment}</p>}
            </div>
          )}

          {/* Other reviews */}
          {otherReviews.map(r => (
            <div key={r.reviewId} className="review-card">
              <div className="review-card-top">
                <div className="reviewer-avatar">
                  {String(r.userId).slice(-2)}
                </div>
                <div className="reviewer-info">
                  <div className="reviewer-name">
                    User #{r.userId}
                    {r.verified && (
                      <span className="verified-badge">✓ Verified Purchase</span>
                    )}
                  </div>
                  <div className="text-dim text-sm">{formatDate(r.reviewDate)}</div>
                </div>
                <Stars rating={r.rating} size={15} />
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}