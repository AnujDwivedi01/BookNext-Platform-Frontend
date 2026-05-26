import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();
  const toast          = useToast();
  const navigate       = useNavigate();

  useEffect(() => {
    const token    = searchParams.get('token');
    const userId   = searchParams.get('userId');
    const email    = searchParams.get('email');
    const fullName = searchParams.get('fullName');
    const role     = searchParams.get('role');

    if (!token || !userId) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
      return;
    }

    login({
      token,
      userId: Number(userId),
      email,
      fullName,
      role,
    });

    toast.success(`Welcome, ${fullName || email}!`);

    if (role === 'ADMIN') {
      navigate('/dashboard');
    } else {
      navigate('/books');
    }
  }, [searchParams, login, toast, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      color: 'var(--cream-dim)',
    }}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <p>Completing Google sign-in...</p>
    </div>
  );
}