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

  // const handleVerify = async (certId, status) => {
  //   try {
  //     await verifyCertificate(certId, status, token);
  //     fetchCertificates(); // Refresh list
  //   } catch (err) {
  //     console.error("Error verifying certificate:", err);
  //     setError(err.response?.data?.error || "Failed to verify certificate");
  //   }
  // };

const handleVerify = async (certId, status) => {
  try {
    const res = await verifyCertificate(certId, status, token);
    alert(res.message); 
    console.log(res.message); // ⬅ show message
    fetchCertificates();
  } catch (err) {
    alert("Errorss : " + (err.response?.data?.error || "Something went wrong"));
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
                      {/* <td>
                        <strong>{cert.user_name}</strong>
                        <br />
                        <small>{cert.user_email}</small>
                      </td> */}
                      <td>{cert._id}</td>
                      <td>
                        <span className={`status-badge status-${cert.status}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td>{formatDate(cert.uploaded_at)}</td>
                      <td>{cert.file_name}</td>

                      <td>
                        {cert.status === "pending" ? (
                          <div className="action-buttons" style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            <button
                              className="btn-approve"
                              onClick={() => handleVerify(cert._id, "verified")}
                            >
                              Verify
                            </button>

                            <button
                              className="btn-reject"
                              onClick={() => handleVerify(cert._id, "rejected")}
                            >
                              Reject
                            </button>

                            {/* 👁️ View Button */}
                            <button
                              className="btn-view"
                              onClick={() =>
                                window.open(cert.certificate_url, "_blank")
                              }
                              style={{
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                padding: "5px 10px",
                                cursor: "pointer",
                                marginLeft: "5px",
                              }}
                              title="View Certificate"
                            >
                              👁️
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            <span className="status-text">
                              {cert.status === "verified" ? "Approved" : "Rejected"}
                            </span>
                            {/* 👁️ View Button */}
                            <button
                              className="btn-view"
                              onClick={() =>
                                window.open(cert.certificate_url, "_blank")
                              }
                              style={{
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                padding: "5px 10px",
                                cursor: "pointer",
                                marginLeft: "5px",
                              }}
                              title="View Certificate"
                            >
                              👁️
                            </button>
                          </div>
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



// import React, { useState, useEffect, useContext } from "react";
// import { getAllCertificates, verifyCertificate } from "../api";
// import { AuthContext } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import "./Dashboard.css";

// const AdminDashboard = () => {
//   const { token, user } = useContext(AuthContext);
//   const [certificates, setCertificates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // 🔎 Search
//   const [searchId, setSearchId] = useState("");
//   const [searchResult, setSearchResult] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!user || user.role !== "admin") {
//       navigate("/dashboard");
//       return;
//     }
//     fetchCertificates();
//   }, [user, token]);

//   const fetchCertificates = async () => {
//     try {
//       setLoading(true);
//       const response = await getAllCertificates(token);
//       setCertificates(response.data);
//       setError("");
//     } catch (err) {
//       console.error("Error fetching certificates:", err);
//       setError(err.response?.data?.error || "Failed to fetch certificates");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify = async (certId, status) => {
//     try {
//       await verifyCertificate(certId, status, token);
//       fetchCertificates();
//     } catch (err) {
//       console.error("Error verifying certificate:", err);
//       setError(err.response?.data?.error || "Failed to verify certificate");
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // 🔎 Search API Call
//   const handleSearch = async () => {
//     if (!searchId.trim()) return;

//     try {
//       const res = await fetch(
//         `${process.env.REACT_APP_API_URL}/api/check_certificate/${searchId}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       const data = await res.json();
//       setSearchResult(data);
//     } catch (err) {
//       console.error("Search error:", err);
//       setSearchResult({
//         valid: false,
//         message: "Error checking certificate",
//       });
//     }
//   };

//   if (!user || !token) {
//     return (
//       <div className="dashboard-container">
//         <div className="error-message">
//           <h2>Access Denied</h2>
//           <p>Please log in to access this page.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard-container">

//       {/* HEADER */}
//       <div className="dashboard-header">
//         <h2>Admin Dashboard</h2>
//         <p>Welcome, {user.name}! Manage uploaded certificates below.</p>
//       </div>

//       {/* 🔎 SEARCH SECTION */}
//       <div className="search-section" style={{ marginBottom: "20px" }}>
//         <h3>Verify Certificate by ID</h3>

//         <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
//           <input
//             type="text"
//             placeholder="Enter Certificate ID"
//             value={searchId}
//             onChange={(e) => setSearchId(e.target.value)}
//             style={{
//               padding: "10px",
//               width: "300px",
//               borderRadius: "8px",
//               border: "1px solid #ccc",
//             }}
//           />

//           <button
//             onClick={handleSearch}
//             style={{
//               backgroundColor: "purple",
//               color: "white",
//               padding: "10px 20px",
//               borderRadius: "8px",
//               cursor: "pointer",
//             }}
//           >
//             Check
//           </button>
//         </div>

//         {searchResult && (
//           <div
//             style={{
//               marginTop: "15px",
//               padding: "12px",
//               borderRadius: "8px",
//               backgroundColor: searchResult.valid ? "#e5ffe5" : "#ffe5e5",
//             }}
//           >
//             <h4>{searchResult.message}</h4>
//             {searchResult.valid && (
//               <>
//                 <p>
//                   <strong>Title:</strong> {searchResult.title}
//                 </p>
//                 <p>
//                   <strong>Status:</strong> {searchResult.status}
//                 </p>
//                 <a
//                   href={searchResult.cloudinary_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{ color: "blue", textDecoration: "underline" }}
//                 >
//                   View Certificate
//                 </a>
//               </>
//             )}
//           </div>
//         )}
//       </div>

//       {/* ERROR MESSAGE */}
//       {error && (
//         <div className="error-message">
//           <p>{error}</p>
//         </div>
//       )}

//       {/* TABLE */}
//       {loading ? (
//         <div className="loading-message">
//           <p>Loading certificates...</p>
//         </div>
//       ) : (
//         <div className="certificates-section">
//           <h3>All Uploaded Certificates ({certificates.length})</h3>

//           {certificates.length === 0 ? (
//             <div className="no-certificates">
//               <p>No certificates uploaded yet.</p>
//             </div>
//           ) : (
//             <div className="table-container">
//               <table className="certificates-table">
//                 <thead>
//                   <tr>
//                     <th>Title</th>
//                     <th>User</th>
//                     <th>Status</th>
//                     <th>Upload Date</th>
//                     <th>File Name</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {certificates.map((cert) => (
//                     <tr key={cert._id}>
//                       <td>{cert.title || "Untitled"}</td>

//                       <td>
//                         <strong>{cert.user_name}</strong>
//                         <br />
//                         <small>{cert.user_email}</small>
//                       </td>

//                       <td>
//                         <span className={`status-badge status-${cert.status}`}>
//                           {cert.status}
//                         </span>
//                       </td>

//                       <td>{formatDate(cert.uploaded_at)}</td>
//                       <td>{cert.file_name}</td>

//                       <td>
//                         {cert.status === "pending" ? (
//                           <div className="action-buttons">
//                             <button
//                               className="btn-approve"
//                               onClick={() =>
//                                 handleVerify(cert._id, "verified")
//                               }
//                             >
//                               Verify
//                             </button>
//                             <button
//                               className="btn-reject"
//                               onClick={() =>
//                                 handleVerify(cert._id, "rejected")
//                               }
//                             >
//                               Reject
//                             </button>
//                           </div>
//                         ) : (
//                           <span className="status-text">
//                             {cert.status === "verified"
//                               ? "Approved"
//                               : "Rejected"}
//                           </span>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}

//       {/* NAVIGATION BUTTONS */}
//       <div style={{ marginTop: "20px", display: "flex", gap: "15px" }}>
//         <button
//           onClick={() => navigate("/upload")}
//           style={{
//             backgroundColor: "white",
//             color: "purple",
//             border: "1px solid purple",
//             borderRadius: "8px",
//             padding: "10px 20px",
//             cursor: "pointer",
//           }}
//         >
//           Back to Upload Page
//         </button>

//         <button
//           onClick={() => navigate("/verify-certificate")}
//           style={{
//             backgroundColor: "purple",
//             color: "white",
//             border: "none",
//             borderRadius: "8px",
//             padding: "10px 20px",
//             cursor: "pointer",
//           }}
//         >
//           Go to Certificate Verification Page
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;