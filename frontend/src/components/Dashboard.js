import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UploadCertificate from './UploadCertificate';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard-container">
      {/* <h2>Dashboard</h2> */}

      {/* Show UploadCertificate form only */}
      <UploadCertificate />
      
      {/* Remove the certificates table completely */}
      {/* All table code is removed */}
    </div>
  );
};

export default Dashboard;
