import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

// Auth APIs
export const registerUser = (data) => axios.post(`${API_URL}/register`, data);
export const loginUser = (data) => axios.post(`${API_URL}/login`, data);

// Certificate APIs
export const uploadCertificate = (formData, token) =>
  axios.post(`${API_URL}/certificates`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Do not set Content-Type explicitly so axios can add the correct boundary
    },
  });

export const getUserCertificates = (token) =>
  axios.get(`${API_URL}/user/certificates`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAllCertificates = (token) =>
  axios.get(`${API_URL}/certificates`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const verifyCertificate = (id, status, token) =>
  axios.put(`${API_URL}/admin/certificates/${id}/verify`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
