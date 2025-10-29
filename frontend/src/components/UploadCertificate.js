import React, { useState, useContext } from 'react';
import { uploadCertificate } from '../api';
import './UploadCertificate.css';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const UploadCertificate = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!file) return setError("Please select a file");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("description", description);

  try {
    // Use the shared API helper so the base URL and headers are consistent.
    const res = await uploadCertificate(formData, token);

    setSuccess("Certificate uploaded successfully!");
    setFile(null);
    setTitle("");
    setDescription("");

    if (onUpload) onUpload();
  } catch (err) {
    console.error("Upload error:", err.response || err.message);
    setError(err.response?.data?.error || "File is not uploaded");
  }
};


  return (
    <div className='upload-container'>
      <h2 className='title'>Upload Certificate</h2>
      {error && <p style={{ color: '#ff0000' ,fontSize:'1.5rem'}}>{error}</p>}
      {success && <p style={{ color: '#00ff00' ,fontSize:'1.5rem'}}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>

      <div>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
};


export default UploadCertificate;