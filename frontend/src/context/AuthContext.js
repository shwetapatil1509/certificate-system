import React, { createContext, useState, useEffect } from 'react';

// Create AuthContext
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Stores logged-in user info
  const [token, setToken] = useState(null);     // Stores JWT token

  // Load user/token from localStorage on page load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  // Login function
  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
