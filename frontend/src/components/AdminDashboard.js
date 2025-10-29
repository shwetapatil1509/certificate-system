import React, { useState, useEffect, useContext } from 'react';
import { getAllCertificates, verifyCertificate } from '../api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user exists and has token
    if (!user || !token) {
      setError('Please log in to access this page.');
      setLoading(false);
      return;
    }

    fetchCertificates();
  }, [user, token]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await getAllCertificates(token);
      setCertificates(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.response?.data?.error || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (certId, status) => {
    try {
      await verifyCertificate(certId, status, token);
      // Refresh certificates list
      fetchCertificates();
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setError(err.response?.data?.error || 'Failed to verify certificate');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h3>Uploaded Certificates ({certificates.length})</h3>
          
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
                    <th>File Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert._id}>
                      <td className="cert-title">
                        {cert.title || 'Untitled'}
                      </td>
                      <td className="user-info">
                        <div>
                          <strong>{cert.user_name}</strong>
                          <br />
                          <small>{cert.user_email}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${cert.status}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(cert.uploaded_at)}
                      </td>
                      <td className="file-info">
                        {cert.file_name}
                      </td>
                      <td className="actions-cell">
                        {cert.status === 'pending' && (
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={() => handleVerify(cert._id, 'verified')}
                            >
                              Verify
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleVerify(cert._id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {cert.status !== 'pending' && (
                          <span className="status-text">
                            {cert.status === 'verified' ? 'Approved' : 'Rejected'}
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

      <div>
        <Link  to="/dashboard">Back to User Dashboard</Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
