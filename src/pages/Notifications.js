import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import './Notifications.css';

// ─── Type → icon / badge class mapping ───────────────────────────────────────

const TYPE_META = {
  ORDER_PLACED:     { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
  ), iconClass: 'order', badgeClass: 'order-placed', label: 'Order Placed' },
  ORDER_CONFIRMED:  { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
  ), iconClass: 'order', badgeClass: 'order-placed', label: 'Confirmed' },
  ORDER_DISPATCHED: { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
  ), iconClass: 'order', badgeClass: 'order-dispatched', label: 'Dispatched' },
  ORDER_DELIVERED:  { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>
  ), iconClass: 'order', badgeClass: 'order-delivered', label: 'Delivered' },
  ORDER_CANCELLED:  { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
  ), iconClass: 'order', badgeClass: 'order-cancelled', label: 'Cancelled' },
  PAYMENT_SUCCESS:  { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  ), iconClass: 'payment', badgeClass: 'payment-success', label: 'Payment Success' },
  PAYMENT_FAILED:   { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ), iconClass: 'payment', badgeClass: 'payment-failed', label: 'Payment Failed' },
  LOW_STOCK:        { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
  ), iconClass: 'admin', badgeClass: 'low-stock', label: 'Low Stock' },
  NEW_ORDER:        { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ), iconClass: 'admin', badgeClass: 'new-order', label: 'New Order' },
  GENERAL:          { icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ), iconClass: 'general', badgeClass: 'general', label: 'General' },
};

const getMeta = (type) =>
  TYPE_META[type] || { 
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ), 
    iconClass: 'general', 
    badgeClass: 'general', 
    label: type 
  };

// ─── Time formatter ───────────────────────────────────────────────────────────

const formatTime = (createdAt) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now  = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60)        return 'Just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Filter options ───────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { label: 'All',      value: 'ALL'      },
  { label: 'Unread',   value: 'UNREAD'   },
  { label: 'Orders',   value: 'ORDERS'   },
  { label: 'Payments', value: 'PAYMENTS' },
];

const matchesFilter = (n, filter) => {
  if (filter === 'ALL')      return true;
  if (filter === 'UNREAD')   return !n.isRead;
  if (filter === 'ORDERS')   return n.type.startsWith('ORDER_');
  if (filter === 'PAYMENTS') return n.type.startsWith('PAYMENT_');
  return true;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [filter,        setFilter]        = useState('ALL');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getMyNotifications(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.data?.unreadCount ?? 0);
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Mark single as read ──────────────────────────────────────────────────────

  const handleMarkRead = async (id) => {
    setActionLoading(id);
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      setError('Could not mark notification as read.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Mark all as read ─────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError('Could not mark all notifications as read.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await notificationAPI.deleteNotification(id);
      const deleted = notifications.find(n => n.notificationId === id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      setError('Could not delete notification.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────────

  const filtered = notifications.filter(n => matchesFilter(n, filter));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="notifications-page">
      <div className="notifications-container">

        {/* Header */}
        <div className="notifications-header">
          <h1>
            Notifications
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={handleMarkAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Error */}
        {error && <div className="notif-error">{error}</div>}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-tab${filter === opt.value ? ' active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="notif-loading">Loading notifications…</div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <h3>No notifications here</h3>
            <p>
              {filter === 'UNREAD'
                ? "You're all caught up! No unread notifications."
                : 'Nothing to show for this filter yet.'}
            </p>
          </div>
        )}

        {/* Notification Cards */}
        {!loading && filtered.map(n => {
          const meta       = getMeta(n.type);
          const isActioning = actionLoading === n.notificationId;

          return (
            <div
              key={n.notificationId}
              className={`notification-card${!n.isRead ? ' unread' : ''}`}
            >
              {/* Icon */}
              <div className={`notif-icon ${meta.iconClass}`}>
                {meta.icon}
              </div>

              {/* Content */}
              <div className="notif-content">
                <div className="notif-message">{n.message}</div>
                <div className="notif-meta">
                  <span className={`notif-type-badge ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                  <span className="notif-time">
                    {formatTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {/* Unread dot */}
              {!n.isRead && <div className="unread-dot" />}

              {/* Actions */}
              <div className="notif-actions">
                {!n.isRead && (
                  <button
                    className="notif-action-btn"
                    title="Mark as read"
                    disabled={isActioning}
                    onClick={() => handleMarkRead(n.notificationId)}
                  >
                    ✓
                  </button>
                )}
                <button
                  className="notif-action-btn delete"
                  title="Delete"
                  disabled={isActioning}
                  onClick={() => handleDelete(n.notificationId)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}