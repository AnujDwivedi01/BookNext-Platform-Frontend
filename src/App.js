import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Navbar         from './components/Navbar';
import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Books          from './pages/Books';
import BookDetail     from './pages/BookDetail';
import Dashboard      from './pages/Dashboard';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import Orders         from './pages/Orders';
import Wallet         from './pages/Wallet';
import MyReviews      from './pages/MyReviews';
import Notifications  from './pages/Notifications';
import Wishlist       from './pages/Wishlist';      
import NotFound       from './pages/NotFound';
import OAuthSuccess   from './pages/OAuthSuccess';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/"                element={<Home />} />
                <Route path="/login"           element={<Login />} />
                <Route path="/register"        element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/books"           element={<Books />} />
                <Route path="/books/:id"       element={<BookDetail />} />
                <Route path="/oauth-success"   element={<OAuthSuccess />} />

                {/* Cart */}
                <Route path="/cart" element={<Cart />} />

                {/* Protected routes */}
                <Route path="/checkout" element={
                  <ProtectedRoute><Checkout /></ProtectedRoute>
                } />

                <Route path="/orders" element={
                  <ProtectedRoute><Orders /></ProtectedRoute>
                } />

                <Route path="/wallet" element={
                  <ProtectedRoute><Wallet /></ProtectedRoute>
                } />

                <Route path="/my-reviews" element={
                  <ProtectedRoute><MyReviews /></ProtectedRoute>
                } />

                <Route path="/notifications" element={
                  <ProtectedRoute><Notifications /></ProtectedRoute>
                } />

                {/*  Wishlist page — customers only */}
                <Route path="/wishlist" element={
                  <ProtectedRoute><Wishlist /></ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}