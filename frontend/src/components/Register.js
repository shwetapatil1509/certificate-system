import React, { useState } from 'react';
import { registerUser } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await registerUser({ name, email, password });
      if (res.status === 201) {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {/* <div className="password-wrapper"> */}
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span> */}
        {/* </div> */}

        <button type="submit">Register</button>
      </form>

      {error && <p className="error-msg">{error}</p>}

      <Link to="/login" className="link">
        Already have an account? <strong>Login</strong>
      </Link>
    </div>
  );
};

export default Register;
