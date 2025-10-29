import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // ✅ Import Navigate
import { AuthProvider } from './context/AuthContext'; // ✅ Import AuthProvider
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import UploadCertificate from './components/UploadCertificate';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/upload" element={<UploadCertificate />} />
          {/* Redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
