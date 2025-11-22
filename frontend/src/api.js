// src/api.js
import axios from 'axios';

// Base URL of your Flask backend
const API_URL = 'http://127.0.0.1:5000/api';

// Create axios instance
const API = axios.create({
  baseURL: API_URL,
});

// ✅ Automatically attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ============================
// AUTH ROUTES
// ============================
export const registerUser = (data) => API.post('/register', data);
export const loginUser = (data) => API.post('/login', data);

// ============================
// CERTIFICATE ROUTES (USER)
// ============================
export const uploadCertificate = (formData) =>
  API.post('/certificates', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const getUserCertificates = () => API.get('/certificates');

// ============================
// ADMIN ROUTES
// ============================
export const getAllCertificates = () => API.get('/certificates');

export const verifyCertificate = async (id, status, token) => {
  const res = await API.put(
    `/admin/certificates/${id}/verify`,
    { status },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return res.data;  // return real JSON
};

