import React, { useState, useEffect, useCallback } from 'react';
import { walletAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Wallet.css';

// ─── Load Razorpay script dynamically ────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id  = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Wallet() {
  const toast = useToast();

  const [walletDetail,     setWalletDetail]     = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [addAmount,        setAddAmount]         = useState('');
  const [addDesc,          setAddDesc]           = useState('');
  const [addLoading,       setAddLoading]        = useState(false);

  // ── Fetch wallet ────────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletAPI.getMyWalletDetail();
      setWalletDetail(res.data);
    } catch {
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  // ── Add Money via Razorpay ──────────────────────────────────────────────────
  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount (min ₹1)');
      return;
    }

    setAddLoading(true);

    try {
      // Step 1 — Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setAddLoading(false);
        return;
      }

      // Step 2 — Create Razorpay order on backend
      const orderRes = await walletAPI.createRazorpayOrder(amount);
      const { orderId, keyId, currency } = orderRes.data;

      // Step 3 — Open Razorpay checkout popup
      const options = {
        key:      keyId,
        amount:   amount * 100,  // in paise
        currency: currency || 'INR',
        name:     'BookNest',
        description: `Add ₹${amount.toFixed(2)} to Wallet`,
        order_id: orderId,
        theme:    { color: '#2c3e7a' },

        // ── Payment Success handler ──────────────────────────────────────────
        handler: async (response) => {
          try {
            // Step 4 — Verify signature on backend → wallet gets credited
            await walletAPI.verifyRazorpayPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount,
            });

            toast.success(`✅ ₹${amount.toFixed(2)} added to your wallet!`);
            setAddAmount('');
            setAddDesc('');
            fetchWallet();
          } catch (err) {
            toast.error(
              err.response?.data?.error ||
              'Payment verification failed. Contact support.'
            );
          } finally {
            setAddLoading(false);
          }
        },

        // ── Modal closed / dismissed ─────────────────────────────────────────
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.');
            setAddLoading(false);
          },
        },

        // ── Prefill user info (optional — makes checkout faster) ─────────────
        prefill: {
          name:  '',
          email: '',
          contact: '',
        },
      };

      const rzp = new window.Razorpay(options);

      // ── Payment failed inside popup ──────────────────────────────────────────
      rzp.on('payment.failed', (response) => {
        toast.error(
          `Payment failed: ${response.error?.description || 'Unknown error'}`
        );
        setAddLoading(false);
      });

      rzp.open();

    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Failed to initiate payment. Please try again.'
      );
      setAddLoading(false);
    }
  };



  // ── Quick amounts ───────────────────────────────────────────────────────────
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="wallet-page">
        <div className="container">
          <div className="loading-wrap"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  const balance      = walletDetail?.balance      ?? 0;
  const transactions = walletDetail?.transactions ?? [];

  return (
    <div className="wallet-page">
      <div className="container">

        {/* Header */}
        <div className="wallet-header fade-up">
          <h1>My Wallet</h1>
          <p className="text-dim">Manage your BookNest wallet balance</p>
        </div>

        <div className="wallet-grid">

          {/* ── Left column ──────────────────────────────────────────────────── */}
          <div className="wallet-left">

            {/* Balance card */}
            <div className="balance-card fade-up">
              <div className="balance-label">Available Balance</div>
              <div className="balance-amount">₹{balance.toFixed(2)}</div>
              <div className="balance-sub">BookNest Wallet</div>
            </div>

            {/* Actions card */}
            <div className="card wallet-actions-card fade-up">

              {/* ── Add Money via Razorpay ──────────────────────────────────── */}
              <form onSubmit={handleAddMoney} className="wallet-form">

                  {/* Razorpay badge */}
                  <div className="razorpay-badge">
                    <span>Secured by</span>
                    <strong> Razorpay</strong>
                    <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: 6 }}>
                      UPI · Cards · Net Banking
                    </span>
                  </div>

                  {/* Quick amounts */}
                  <div className="quick-amounts">
                    {quickAmounts.map(amt => (
                      <button
                        type="button"
                        key={amt}
                        className={`quick-btn ${parseFloat(addAmount) === amt ? 'selected' : ''}`}
                        onClick={() => setAddAmount(String(amt))}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      max="100000"
                      placeholder="Enter amount"
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold btn-full"
                    disabled={addLoading}
                  >
                    {addLoading ? 'Opening payment…' : 'Pay & Add Money'}
                  </button>

                  <p style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center', marginTop: 8 }}>
                    You will be redirected to Razorpay's secure payment page
                  </p>
                </form>
            </div>
          </div>

          {/* ── Right column — Transaction history ───────────────────────────── */}
          <div className="wallet-right">
            <div className="card fade-up">
              <div className="txn-header">
                <h3>Transaction History</h3>
                <span className="text-dim text-sm">{transactions.length} transactions</span>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3>No transactions yet</h3>
                  <p>Add money to get started</p>
                </div>
              ) : (
                <div className="txn-list">
                  {transactions.map(tx => (
                    <div key={tx.transactionId} className={`txn-row ${tx.type.toLowerCase()}`}>
                      <div className="txn-icon">
                        {tx.type === 'CREDIT' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="18 15 12 9 6 15"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        )}
                      </div>
                      <div className="txn-info">
                        <div className="txn-desc">{tx.description}</div>
                        <div className="txn-date text-dim text-sm">
                          {formatDate(tx.transactionDate)}
                        </div>
                      </div>
                      <div className="txn-right">
                        <div className={`txn-amount ${tx.type === 'CREDIT' ? 'credit' : 'debit'}`}>
                          {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </div>
                        <div className="txn-balance text-dim text-sm">
                          Bal: ₹{tx.balanceAfter.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}