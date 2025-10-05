import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await axios.post(`${API_BASE}/api/auth/register`, { username, password });
      setOk('Registered! You can now login.');
    } catch (err) {
      setError(err.response?.data?.error || 'Register failed');
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the chat community</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Create Account
          </button>

          {ok && <div className="alert alert-success">{ok}</div>}
          {error && <div className="alert alert-error">{error}</div>}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <a className="auth-link" href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}


