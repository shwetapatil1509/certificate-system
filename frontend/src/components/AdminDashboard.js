import React, { useState, useEffect, useContext } from "react";
import { getAllCertificates, verifyCertificate } from "../api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const AdminDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admin users
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchCertificates();
  }, [user, token]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await getAllCertificates(token);
      setCertificates(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.response?.data?.error || "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (certId, status) => {
    try {
      await verifyCertificate(certId, status, token);
      fetchCertificates(); // Refresh list
    } catch (err) {
      console.error("Error verifying certificate:", err);
      setError(err.response?.data?.error || "Failed to verify certificate");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user || !token) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>Welcome, {user.name}! Manage uploaded certificates below.</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-message">
          <p>Loading certificates...</p>
        </div>
      ) : (
        <div className="certificates-section">
          <h3>All Uploaded Certificates ({certificates.length})</h3>

          {certificates.length === 0 ? (
            <div className="no-certificates">
              <p>No certificates uploaded yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="certificates-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Upload Date</th>
                    <th>File Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert._id}>
                      <td>{cert.title || "Untitled"}</td>
                      <td>
                        <strong>{cert.user_name}</strong>
                        <br />
                        <small>{cert.user_email}</small>
                      </td>
                      <td>
                        <span className={`status-badge status-${cert.status}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td>{formatDate(cert.uploaded_at)}</td>
                      <td>{cert.file_name}</td>
                      <td>
                        {cert.status === "pending" ? (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={() =>
                                handleVerify(cert._id, "verified")
                              }
                            >
                              Verify
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() =>
                                handleVerify(cert._id, "rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="status-text">
                            {cert.status === "verified"
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ✅ Navigation Buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
        <button
          onClick={() => navigate("/upload")}
          style={{
            backgroundColor: "white",
            color: "purple",
            border: "1px solid purple",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Back to Upload Page
        </button>

        <button
          onClick={() => navigate("/verify-certificate")}
          style={{
            backgroundColor: "purple",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Go to Certificate Verification Page
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
