import React, { createContext, useState, useEffect } from 'react';

// Create AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Logged-in user details
  const [token, setToken] = useState(null);     // JWT access token
  const [loading, setLoading] = useState(true); // Loading state (useful for routing protection)

  // ✅ Load user/token from localStorage when app starts
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoading(false); // Done checking
  }, []);

  // ✅ Login: Save user and token to state + localStorage
  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
  };

  // ✅ Logout: Clear user and token from everywhere
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // ✅ Helper: Check if logged in
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading, // useful for protecting routes
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
