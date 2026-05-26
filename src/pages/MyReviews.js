import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './MyReviews.css';

function Stars({ rating, size = 16, interactive = false, onRate }) {
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
        >★</span>
      ))}
    </div>
  );
}

export default function MyReviews() {
  const toast = useToast();
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editId,      setEditId]      = useState(null);
  const [editRating,  setEditRating]  = useState(5);
  const [editComment, setEditComment] = useState('');
  const [saving,      setSaving]      = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getMyReviews();
      setReviews(res.data || []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const openEdit = (review) => {
    setEditId(review.reviewId);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const cancelEdit = () => setEditId(null);

  const handleSave = async (reviewId) => {
    setSaving(true);
    try {
      await reviewAPI.updateReview(reviewId, { rating: editRating, comment: editComment });
      toast.success('Review updated!');
      setEditId(null);
      fetchReviews();
    } catch {
      toast.error('Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await reviewAPI.deleteReview(reviewId);
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r.reviewId !== reviewId));
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

  return (
    <div className="my-reviews-page">
      <div className="container">

        <div className="page-header fade-up">
          <h1>⭐ My Reviews</h1>
          <p className="text-dim">All the books you've reviewed</p>
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="icon">📖</div>
            <h3>No reviews yet</h3>
            <p>Go to a book's page and write your first review</p>
            <Link to="/books" className="btn btn-gold" style={{ marginTop: 'var(--gap-md)' }}>
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="reviews-grid fade-up">
            {reviews.map(review => (
              <div key={review.reviewId} className="mr-card">

                {/* Header */}
                <div className="mr-card-header">
                  <div className="book-ref">
                    <span className="book-id-label">Book ID</span>
                    <Link to={`/books/${review.bookId}`} className="book-id-link">
                      #{review.bookId} →
                    </Link>
                  </div>
                  {review.verified && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>

                {/* View mode */}
                {editId !== review.reviewId ? (
                  <>
                    <Stars rating={review.rating} size={18} />
                    {review.comment && (
                      <p className="review-comment">{review.comment}</p>
                    )}
                    <div className="mr-footer">
                      <span className="text-dim text-sm">{formatDate(review.reviewDate)}</span>
                      <div className="mr-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(review)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(review.reviewId)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Edit mode */
                  <div className="mr-edit-form">
                    <div className="rating-picker">
                      <label>Rating</label>
                      <Stars rating={editRating} size={24} interactive onRate={setEditRating} />
                      <span className="text-dim text-sm">{LABELS[editRating]}</span>
                    </div>
                    <div className="mr-group">
                      <label>Comment</label>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={editComment}
                        onChange={e => setEditComment(e.target.value)}
                        placeholder="Update your comment..."
                      />
                      <span className="char-count text-dim text-sm">{editComment.length}/1000</span>
                    </div>
                    <div className="mr-edit-actions">
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => handleSave(review.reviewId)}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : '✓ Save'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}