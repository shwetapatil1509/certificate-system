import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import UploadCertificate from "./components/UploadCertificate";
import VerifyCertificate from "./components/VerifyCertificate"; // ✅ Import the verification page
import { AuthContext } from "./context/AuthContext";
import "./App.css";

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* ✅ Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-certificate" element={<VerifyCertificate />} /> 
        {/* Anyone can verify certificates */}

        {/* ✅ Protected routes (require login) */}
        {user ? (
          <>
            {user.role === "admin" ? (
              <>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/upload" element={<UploadCertificate />} />
                {/* Default redirect for admin */}
                <Route path="*" element={<Navigate to="/admin-dashboard" />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadCertificate />} />
                {/* Default redirect for user */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            )}
          </>
        ) : (
          // If not logged in → only login/register/verify allowed
          <>
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
