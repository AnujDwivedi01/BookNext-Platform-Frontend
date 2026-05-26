import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderAPI, walletAPI } from '../services/api';
import './Checkout.css';

const PAYMENT_METHODS = [
  { value: 'COD',         label: 'Cash on Delivery',  desc: 'Pay when your order arrives',  icon: null },
  { value: 'WALLET',      label: 'Wallet',             desc: 'Pay using your BookNest wallet', icon: null },
  { value: 'UPI',         label: 'UPI',                desc: 'Pay via any UPI app',           icon: null },
  { value: 'CREDIT_CARD', label: 'Credit Card',        desc: 'Visa, Mastercard, Amex',        icon: null },
  { value: 'DEBIT_CARD',  label: 'Debit Card',         desc: 'All major bank cards accepted', icon: null },
  { value: 'NET_BANKING', label: 'Net Banking',         desc: 'All major banks supported',    icon: null },
];

const RAZORPAY_METHOD_MAP = {
  UPI:         'upi',
  CREDIT_CARD: 'card',
  DEBIT_CARD:  'card',
  NET_BANKING: 'netbanking',
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id  = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName:      user?.fullName || '',
    mobileNumber:  '',
    flatNumber:    '',
    city:          '',
    state:         '',
    pincode:       '',
    modeOfPayment: 'COD',
  });
  const [placing,       setPlacing]       = useState(false);
  const [errors,        setErrors]        = useState({});
  const [walletBalance, setWalletBalance] = useState(null);

  // Fetch wallet balance to show alongside the Wallet option
  useEffect(() => {
    walletAPI.getMyWallet()
      .then(res => setWalletBalance(res.data?.balance ?? 0))
      .catch(() => setWalletBalance(0));
  }, []);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <div className="checkout-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Add some books before checking out.</p>
          <Link to="/books" className="btn-primary">Browse Books</Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())     e.fullName     = 'Full name is required';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobileNumber.trim())) e.mobileNumber = 'Enter a valid 10-digit number';
    if (!form.flatNumber.trim())   e.flatNumber   = 'Address is required';
    if (!form.city.trim())         e.city         = 'City is required';
    if (!form.state.trim())        e.state        = 'State is required';
    if (!form.pincode.trim())      e.pincode      = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';
    return e;
  };

  const buildPayload = (extraFields = {}) => ({
    fullName:      form.fullName.trim(),
    mobileNumber:  form.mobileNumber.trim(),
    flatNumber:    form.flatNumber.trim(),
    city:          form.city.trim(),
    state:         form.state.trim(),
    pincode:       form.pincode.trim(),
    modeOfPayment: form.modeOfPayment,
    // ✅ NEW — include user email so backend can send order confirmation email
    userEmail:     user?.email || '',
    items: cartItems.map(item => ({
      bookId:     item.bookId,
      bookTitle:  item.bookTitle,
      bookAuthor: item.bookAuthor || '',
      price:      item.price,
      quantity:   item.quantity,
    })),
    ...extraFields,
  });

  // ── COD flow ────────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setPlacing(true);
    try {
      await orderAPI.placeOrder(buildPayload());
      await clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── WALLET flow ─────────────────────────────────────────────────────────────
  const handleWallet = async () => {
    if (walletBalance !== null && walletBalance < totalPrice) {
      toast.error(`Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}`);
      return;
    }
    setPlacing(true);
    try {
      // Step 1 — Deduct from wallet
      await walletAPI.deductMoney({
        amount:      totalPrice,
        description: `Payment for order (${totalItems} book${totalItems > 1 ? 's' : ''})`,
      });
      // Step 2 — Place order
      try {
        await orderAPI.placeOrder(buildPayload());
        await clearCart();
        // Refresh balance display
        walletAPI.getMyWallet().then(r => setWalletBalance(r.data?.balance ?? 0)).catch(() => {});
        toast.success('Order placed! Amount deducted from your wallet.');
        navigate('/orders');
      } catch (orderErr) {
        // Order failed after wallet deduction — refund immediately
        await walletAPI.addMoney({
          amount:      totalPrice,
          description: 'Refund: order placement failed after wallet deduction',
        });
        toast.error('Order failed. Wallet has been refunded.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wallet payment failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Razorpay flow ────────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setPlacing(true);
    try {
      // Step 1 — Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setPlacing(false);
        return;
      }

      // Step 2 — Create Razorpay order (reuses wallet-service endpoint)
      const orderRes = await orderAPI.createRazorpayOrder(totalPrice);
      const { orderId, keyId, currency } = orderRes.data;

      const preferredMethod = RAZORPAY_METHOD_MAP[form.modeOfPayment];

      const options = {
        key:         keyId,
        amount:      Math.round(totalPrice * 100),
        currency:    currency || 'INR',
        name:        'BookNest',
        description: `Order for ${totalItems} book${totalItems > 1 ? 's' : ''}`,
        order_id:    orderId,
        prefill: {
          name:    form.fullName.trim(),
          contact: form.mobileNumber.trim(),
          email:   user?.email || '',
        },
        theme: { color: '#c9a84c' },
        method: preferredMethod ? { [preferredMethod]: true } : undefined,

        // Step 3 — On payment success: place the order
        handler: async (response) => {
          try {
            // The signature verification is done by wallet-service internally;
            // we trust the Razorpay handler only fires on genuine success.
            // Just place the order now.
            await orderAPI.placeOrder(buildPayload({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }));
            await clearCart();
            toast.success('Payment successful! Order placed.');
            navigate('/orders');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment succeeded but order failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
          } finally {
            setPlacing(false);
          }
        },

        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.');
            setPlacing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setPlacing(false);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment. Please try again.');
      setPlacing(false);
    }
  };

  // ── Main handler ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error('Please fill all required fields correctly');
      return;
    }
    if      (form.modeOfPayment === 'COD')    await handleCOD();
    else if (form.modeOfPayment === 'WALLET') await handleWallet();
    else                                       await handleRazorpay();
  };

  const isOnlinePayment  = !['COD', 'WALLET'].includes(form.modeOfPayment);
  const isWalletPayment  = form.modeOfPayment === 'WALLET';
  const walletInsufficient = isWalletPayment && walletBalance !== null && walletBalance < totalPrice;

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ── Left: Form ──────────────────────────────────────── */}
        <div className="checkout-form-section">

          {/* Delivery Address */}
          <div className="checkout-card">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Delivery Address
            </div>

            <div className="form-group">
              <label>Full Name <span className="req">*</span></label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                placeholder="Enter your full name" className={errors.fullName ? 'input-error' : ''} />
              {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label>Mobile Number <span className="req">*</span></label>
              <input type="tel" name="mobileNumber" value={form.mobileNumber} onChange={handleChange}
                placeholder="10-digit mobile number" maxLength={10}
                className={errors.mobileNumber ? 'input-error' : ''} />
              {errors.mobileNumber && <span className="error-msg">{errors.mobileNumber}</span>}
            </div>

            <div className="form-group">
              <label>Flat / House No. / Building <span className="req">*</span></label>
              <input type="text" name="flatNumber" value={form.flatNumber} onChange={handleChange}
                placeholder="House no., Building, Street, Area"
                className={errors.flatNumber ? 'input-error' : ''} />
              {errors.flatNumber && <span className="error-msg">{errors.flatNumber}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City <span className="req">*</span></label>
                <input type="text" name="city" value={form.city} onChange={handleChange}
                  placeholder="City" className={errors.city ? 'input-error' : ''} />
                {errors.city && <span className="error-msg">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>State <span className="req">*</span></label>
                <input type="text" name="state" value={form.state} onChange={handleChange}
                  placeholder="State" className={errors.state ? 'input-error' : ''} />
                {errors.state && <span className="error-msg">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label>Pincode <span className="req">*</span></label>
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange}
                  placeholder="6-digit pincode" maxLength={6}
                  className={errors.pincode ? 'input-error' : ''} />
                {errors.pincode && <span className="error-msg">{errors.pincode}</span>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-card">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Payment Method
            </div>
            <div className="payment-options">
              {PAYMENT_METHODS.map(pm => {
                const isWalletOption   = pm.value === 'WALLET';
                const insufficient     = isWalletOption && walletBalance !== null && walletBalance < totalPrice;
                return (
                  <label key={pm.value}
                    className={`payment-option ${form.modeOfPayment === pm.value ? 'selected' : ''} ${insufficient ? 'wallet-insufficient' : ''}`}>
                    <input type="radio" name="modeOfPayment" value={pm.value}
                      checked={form.modeOfPayment === pm.value} onChange={handleChange} />
                    <div className="payment-option-radio">
                      <div className="radio-dot" />
                    </div>
                    <div className="payment-option-icon">{pm.icon}</div>
                    <div className="payment-option-text">
                      <span className="payment-label">{pm.label}</span>
                      <span className="payment-desc">
                        {isWalletOption && walletBalance !== null
                          ? <>Balance: <strong style={{ color: insufficient ? '#c0392b' : 'var(--gold)' }}>₹{walletBalance.toFixed(2)}</strong>{insufficient ? ' — Insufficient' : ''}</>
                          : pm.desc}
                      </span>
                    </div>
                    {!['COD', 'WALLET'].includes(pm.value) && (
                      <div className="razorpay-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        Razorpay
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {isOnlinePayment && (
              <div className="razorpay-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                You'll be redirected to Razorpay's secure payment gateway to complete your payment.
              </div>
            )}

            {isWalletPayment && !walletInsufficient && walletBalance !== null && (
              <div className="wallet-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <path d="M16 3h-8L4 7"/>
                  <circle cx="16" cy="14" r="1"/>
                </svg>
                ₹{totalPrice?.toFixed(2)} will be deducted from your wallet (balance: ₹{walletBalance.toFixed(2)}).
              </div>
            )}

            {walletInsufficient && (
              <div className="wallet-error-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Wallet balance ₹{walletBalance.toFixed(2)} is less than ₹{totalPrice?.toFixed(2)}.
                <Link to="/wallet" className="topup-link"> Top up wallet →</Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary ─────────────────────────────── */}
        <div className="checkout-summary-section">
          <div className="checkout-card summary-card">
            <div className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="12" y2="16"/>
              </svg>
              Order Summary
            </div>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.itemId} className="summary-item">
                  <Link to={`/books/${item.bookId}`} className="summary-item-cover">
                    {(item.bookTitle || 'B')[0].toUpperCase()}
                  </Link>
                  <div className="summary-item-info">
                    <Link to={`/books/${item.bookId}`} className="summary-item-title">{item.bookTitle}</Link>
                    <span className="summary-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="summary-item-price">
                    &#8377;{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />
            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>&#8377;{totalPrice?.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="free-tag">FREE</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>&#8377;{totalPrice?.toFixed(2)}</strong>
            </div>

            <button
              className={`place-order-btn${isOnlinePayment ? ' razorpay-btn' : ''}${isWalletPayment ? ' wallet-btn' : ''}`}
              onClick={handlePlaceOrder}
              disabled={placing || walletInsufficient}
            >
              {placing ? (
                <>
                  <span className="btn-spinner" />
                  {isOnlinePayment ? 'Opening Payment...' : isWalletPayment ? 'Processing...' : 'Placing Order...'}
                </>
              ) : isOnlinePayment ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  Pay &#8377;{totalPrice?.toFixed(2)}
                </>
              ) : isWalletPayment ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                    <circle cx="16" cy="14" r="1"/>
                  </svg>
                  Pay &#8377;{totalPrice?.toFixed(2)} from Wallet
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Place Order
                </>
              )}
            </button>

            {isOnlinePayment && (
              <div className="secure-payment-note">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                100% Secure Payment via Razorpay
              </div>
            )}

            <Link to="/cart" className="back-to-cart">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Cart
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}