import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load — restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ✅ login() now receives the full response object from the backend
  // Backend returns: { token, userId, email, fullName, role }
  const login = (responseData) => {
    const userData = {
      id:       responseData.userId,    // ✅ This is what cart/order services need
      email:    responseData.email,
      fullName: responseData.fullName,
      role:     responseData.role,
    };
    localStorage.setItem('token', responseData.token);
    localStorage.setItem('user',  JSON.stringify(userData));
    setToken(responseData.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const getRole    = () => user?.role  ?? null;
  const isAdmin    = () => user?.role  === 'ADMIN';
  const isLoggedIn = () => !!token;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout,
      isAdmin, isLoggedIn, getRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);