import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VerifyCertificate = () => {
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [message, setMessage] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // -----------------------------
  // 1️⃣ SEARCH CERTIFICATE BY ID
  // -----------------------------
  const handleSearch = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:5000/api/admin/certificates",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const found = res.data.find(
        (c) => c._id === certificateId.trim()
      );

      if (!found) {
        setCertificate(null);
        setMessage("Certificate not found or invalid ID.");
        return;
      }

      setCertificate(found);
      setMessage("");
    } catch (err) {
      console.log(err);
      setCertificate(null);
      setMessage("Server error while searching.");
    }
  };

  // -------------------------------------
  // 2️⃣ CALL VERIFY OR REJECT BACKEND API
  // -------------------------------------
  const handleVerify = async (status) => {
    try {
      await axios.put(
        `http://127.0.0.1:5000/api/admin/certificates/${certificateId}/verify`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(`Certificate ${status} successfully.`);

      // Refresh the certificate data
      handleSearch();
    } catch (err) {
      console.log(err);
      setMessage("Failed to update status.");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Verify Certificate</h2>

      <input
        type="text"
        placeholder="Enter Certificate ID"
        value={certificateId}
        onChange={(e) => setCertificateId(e.target.value)}
        style={{ padding: "10px", width: "300px", marginRight: "10px" }}
      />

      <button onClick={handleSearch}>Search</button>

      {message && <p>{message}</p>}

      {certificate && (
        <div style={{ marginTop: "20px" }}>
          <h4>Certificate Details</h4>

          <p>
            <strong>Title:</strong> {certificate.title}
          </p>
          <p>
            <strong>User:</strong> {certificate.user_name}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  certificate.status === "verified"
                    ? "green"
                    : certificate.status === "rejected"
                    ? "red"
                    : "orange",
                fontWeight: "bold",
              }}
            >
              {certificate.status}
            </span>
          </p>

          <div style={{ marginTop: "10px" }}>
            <button
              onClick={() => handleVerify("verified")}
              style={{
                backgroundColor: "green",
                color: "white",
                padding: "8px 16px",
                marginRight: "10px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Verify
            </button>

            <button
              onClick={() => handleVerify("rejected")}
              style={{
                backgroundColor: "red",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/admin-dashboard")}
        style={{
          background: "none",
          color: "purple",
          textDecoration: "underline",
          border: "none",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        ← Back to Admin Dashboard
      </button>
    </div>
  );
};

export default VerifyCertificate;
