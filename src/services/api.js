import axios from 'axios';

// All requests go through the API Gateway on port 8085
const api = axios.create({
  baseURL: 'http://localhost:8085',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — only redirect to /login if a token already existed
// (i.e. the session expired). Guests making calls to protected endpoints
// should silently fail, NOT get force-redirected to /login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const hadToken = !!localStorage.getItem('token');
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (hadToken && !isAuthEndpoint) {
        // Session expired — clear credentials and send to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // If hadToken is false: guest got a 401 on a protected endpoint — just let it fail silently
    }
    return Promise.reject(err);
  }
);

// ─── AUTH API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) =>
    api.post('/auth/register', data),

  login: (data) =>
    api.post('/auth/login', data),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify?email=' + encodeURIComponent(email) + '&otp=' + encodeURIComponent(otp)),

  resendOtp: (email) =>
    api.post('/auth/resend?email=' + encodeURIComponent(email)),

  forgotPassword: (email) =>
    api.post('/auth/forgot?email=' + encodeURIComponent(email)),

  resetPassword: (data) =>
    api.post('/auth/reset', data),

  logout: () =>
    api.post('/auth/logout'),

  // Admin only
  getAllUsers: () =>
    api.get('/auth/users'),

  deleteUser: (userId) =>
    api.delete(`/auth/users/${userId}`),
};

// ─── BOOKS API ────────────────────────────────────────────────────────────────
export const booksAPI = {
  getAll:   ()         => api.get('/books'),
  getById:  (id)       => api.get('/books/' + id),
  add:      (data)     => api.post('/books', data),
  update:   (id, data) => api.put('/books/' + id, data),
  delete:   (id)       => api.delete('/books/' + id),
};

// ─── CART API ────────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart:        (userId)               => api.get(`/cart/${userId}`),
  addItem:        (userId, item)         => api.post(`/cart/${userId}/add`, item),
  removeItem:     (userId, itemId)       => api.delete(`/cart/${userId}/remove/${itemId}`),
  updateQuantity: (userId, itemId, data) => api.put(`/cart/${userId}/update/${itemId}`, data),
  clearCart:      (userId)               => api.delete(`/cart/${userId}/clear`),
};

// ─── ORDER API ────────────────────────────────────────────────────────────────
export const orderAPI = {
  placeOrder:   (data)      => api.post('/orders/place', data),
  getMyOrders:  ()          => api.get('/orders/my'),
  getOrderById: (orderId)   => api.get(`/orders/${orderId}`),
  cancelOrder:  (orderId)   => api.put(`/orders/${orderId}/cancel`),
  getAllOrders:  ()          => api.get('/orders/all'),
  updateStatus: (orderId, status) => api.put(`/orders/${orderId}/status?status=${status}`),
  deleteOrder:  (orderId)   => api.delete(`/orders/${orderId}`),

  // Razorpay — Step 1: reuses wallet-service's create-order endpoint (already exists)
  createRazorpayOrder: (amount) =>
    api.post('/wallet/razorpay/create-order', { amount }),

  // No verify-and-place endpoint needed — we verify via wallet service,
  // then place the order normally via /orders/place (see Checkout.js handler)
};

// ─── WALLET API ───────────────────────────────────────────────────────────────
export const walletAPI = {
  // Balance & history
  getMyWallet:       ()       => api.get('/wallet/my'),
  getMyWalletDetail: ()       => api.get('/wallet/my/detail'),
  getMyTransactions: ()       => api.get('/wallet/my/transactions'),

  // Internal wallet operations
  // addMoney: { amount: number, description?: string }
  addMoney:          (data)   => api.post('/wallet/add', data),
  // deductMoney: { amount: number, description: string }
  deductMoney:       (data)   => api.post('/wallet/deduct', data),
  transferMoney:     (data)   => api.post('/wallet/transfer', data),

  // Razorpay — Step 1: create Razorpay order on backend
  createRazorpayOrder: (amount) =>
    api.post('/wallet/razorpay/create-order', { amount }),

  // Razorpay — Step 2: verify payment + credit wallet
  verifyRazorpayPayment: (data) =>
    api.post('/wallet/razorpay/verify', data),

  // Admin only
  getAllWallets:      ()       => api.get('/wallet/all'),
  getUserWallet:     (userId) => api.get(`/wallet/user/${userId}`),
};

// ─── REVIEW API ───────────────────────────────────────────────────────────────
export const reviewAPI = {
  // Public
  getByBook:    (bookId)   => api.get(`/reviews/book/${bookId}`),
  getAvgRating: (bookId)   => api.get(`/reviews/book/${bookId}/avg-rating`),
  getById:      (reviewId) => api.get(`/reviews/${reviewId}`),

  // User (authenticated)
  addReview:    (data)     => api.post('/reviews', data),
  getMyReviews: ()         => api.get('/reviews/user'),
  updateReview: (reviewId, data) => api.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),

  // Admin only
  getAllReviews:      ()          => api.get('/reviews'),
  getByUserId:       (userId)    => api.get(`/reviews/user/${userId}`),
  adminDeleteReview: (reviewId)  => api.delete(`/reviews/${reviewId}/admin`),
};

// ─── NOTIFICATION API ─────────────────────────────────────────────────────────
export const notificationAPI = {
  // User (authenticated)
  getMyNotifications: ()         => api.get('/notifications/me'),
  getUnreadCount:     ()         => api.get('/notifications/me/unread-count'),
  markAsRead:         (id)       => api.put(`/notifications/${id}/read`),
  markAllRead:        ()         => api.put('/notifications/me/read-all'),
  deleteNotification: (id)       => api.delete(`/notifications/${id}`),

  // Internal / service-to-service
  send:               (data)     => api.post('/notifications', data),
  sendEmail:          (data)     => api.post('/notifications/email', data),

  // Admin only
  getAll:             ()         => api.get('/notifications'),
  getByType:          (type)     => api.get(`/notifications/type/${type}`),
  getByUserId:        (userId)   => api.get(`/notifications/user/${userId}`),

  // Support Tickets
  sendSupportTicket: (data) => api.post('/notifications/support/send', data),
  getMySupportTickets: (userId) => api.get(`/notifications/support/my/${userId}`),
  getAllSupportTickets: () => api.get('/notifications/support/all'),
  resolveSupportTicket: (id) => api.put(`/notifications/support/${id}/resolve`),
};

// ─── WISHLIST API ─────────────────────────────────────────────────────────────
export const wishlistAPI = {
  // User (authenticated)
  getMyWishlist: ()         => api.get('/wishlist/me'),
  addBook:       (data)     => api.post('/wishlist/me/add', data),
  removeBook:    (bookId)   => api.delete(`/wishlist/me/remove/${bookId}`),
  clearWishlist: ()         => api.delete('/wishlist/me/clear'),
  moveToCart:    (data)     => api.post('/wishlist/me/move-to-cart', data),

  // Admin only
  getAllWishlists: ()         => api.get('/wishlist/all'),
  getByUserId:     (userId)   => api.get(`/wishlist/user/${userId}`),
};

export default api;