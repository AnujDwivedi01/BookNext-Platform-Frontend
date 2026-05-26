import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  return isLoggedIn()
    ? children
    : <Navigate to="/login" state={{ from: location }} replace />;
}

export function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!isLoggedIn()) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin())    return <Navigate to="/books" replace />;
  return children;
}
