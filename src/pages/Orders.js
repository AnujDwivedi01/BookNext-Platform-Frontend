import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderAPI, walletAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Orders.css';

const STATUS_CONFIG = {
  PLACED:     { label: 'Placed',     color: '#d4a017', bg: 'rgba(212,160,23,0.1)'   },
  CONFIRMED:  { label: 'Confirmed',  color: '#4a90d9', bg: 'rgba(74,144,217,0.1)'   },
  DISPATCHED: { label: 'Dispatched', color: '#8b6fcb', bg: 'rgba(139,111,203,0.1)'  },
  DELIVERED:  { label: 'Delivered',  color: '#4caf82', bg: 'rgba(76,175,130,0.1)'   },
  CANCELLED:  { label: 'Cancelled',  color: '#c0392b', bg: 'rgba(192,57,43,0.1)'    },
};

const PAYMENT_LABELS = {
  COD:         'Cash on Delivery',
  UPI:         'UPI',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD:  'Debit Card',
  NET_BANKING: 'Net Banking',
  WALLET:      'Wallet',
};

export default function Orders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const { isLoggedIn } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      // Find the order to check payment method before cancelling
      const order = orders.find(o => o.orderId === orderId);
      await orderAPI.cancelOrder(orderId);

      // If paid via Wallet, refund the amount back
      if (order?.modeOfPayment === 'WALLET' && order?.totalAmount) {
        try {
          await walletAPI.addMoney({
            amount:      order.totalAmount,
            description: `Refund for cancelled Order #${orderId}`,
          });
          toast.success(`Order cancelled. ₹${order.totalAmount.toFixed(2)} refunded to your wallet.`);
        } catch {
          // Cancellation succeeded but refund failed — server-side safety net will handle it
          toast.success('Order cancelled. Wallet refund will be processed shortly.');
        }
      } else {
        toast.success('Order cancelled successfully');
      }

      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this order');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="spinner" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-header">
          <h1>My Orders</h1>
        </div>
        <div className="orders-empty">
          <div className="orders-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
              <polyline points="7.5 19.79 7.5 14.6 3 12"/>
              <polyline points="21 12 16.5 14.6 16.5 19.79"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h2>No orders yet</h2>
          <p>When you place an order, it will appear here.</p>
          <Link to="/books" className="btn-gold-link">Browse Books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p className="orders-count">
            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
          </p>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const statusCfg = STATUS_CONFIG[order.orderStatus] || {
            label: order.orderStatus,
            color: '#888',
            bg: 'rgba(128,128,128,0.1)',
          };
          const canCancel = order.orderStatus === 'PLACED';

          return (
            <div key={order.orderId} className="order-card">

              {/* Card Header */}
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-id">Order #{order.orderId}</span>
                  <span className="order-date">{formatDate(order.orderDate)}</span>
                </div>
                <span
                  className="order-status-badge"
                  style={{ color: statusCfg.color, background: statusCfg.bg }}
                >
                  {statusCfg.label}
                </span>
              </div>

              {/* Items */}
              <div className="order-items-list">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <Link to={`/books/${item.bookId}`} className="order-item-cover">
                        {(item.bookTitle || 'B')[0].toUpperCase()}
                      </Link>
                      <div className="order-item-info">
                        <Link to={`/books/${item.bookId}`} className="order-item-title">{item.bookTitle}</Link>
                        <span className="order-item-qty">
                          {item.bookAuthor && `by ${item.bookAuthor} · `}Qty: {item.quantity}
                        </span>
                      </div>
                      <span className="order-item-price">
                        &#8377;{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Footer */}
              <div className="order-card-footer">
                <div className="order-address">
                  <span className="address-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className="address-text">
                    {[order.fullName, order.flatNumber, order.city, order.state, order.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>

                <div className="order-footer-right">
                  <div className="order-payment-method">
                    {PAYMENT_LABELS[order.modeOfPayment] || order.modeOfPayment?.replace(/_/g, ' ')}
                  </div>
                  <div className="order-total-amount">
                    Total: <strong>&#8377;{order.totalAmount?.toFixed(2)}</strong>
                  </div>
                  {canCancel && (
                    <button
                      className="btn-cancel-order"
                      onClick={() => handleCancel(order.orderId)}
                      disabled={cancellingId === order.orderId}
                    >
                      {cancellingId === order.orderId ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}