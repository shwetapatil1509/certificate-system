import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUserCertificates } from '../api';
import UploadCertificate from './UploadCertificate';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) {
      fetchUserCertificates();
    }
  }, [user, token]);

  const fetchUserCertificates = async () => {
    try {
      setLoading(true);
      const response = await getUserCertificates(token);
      setCertificates(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching user certificates:', err);
      setError(err.response?.data?.error || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>User Dashboard</h2>
        <p>Welcome, {user?.name}! You can upload and view your certificates here.</p>
      </div>

      {/* Upload form */}
      <UploadCertificate onUploadSuccess={fetchUserCertificates} />

      {/* Certificates section */}
      <div className="certificates-section">
        <h3>Your Uploaded Certificates ({certificates.length})</h3>

        {loading ? (
          <div className="loading-message">
            <p>Loading your certificates...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="no-certificates">
            <p>You haven’t uploaded any certificates yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="certificates-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Upload Date</th>
                  <th>File Name</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert._id}>
                    <td>{cert.title || 'Untitled'}</td>
                    <td>
                      <span className={`status-badge status-${cert.status}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td>{formatDate(cert.uploaded_at)}</td>
                    <td>{cert.file_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
