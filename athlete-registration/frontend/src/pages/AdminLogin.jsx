import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/admin/login', form);

      
      const token = res?.data?.data?.token;
      const admin = res?.data?.data?.admin;

      
      if (!token) {
        throw new Error("Login failed: Token not received");
      }

      
      localStorage.setItem('token', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      
      navigate('/admin/dashboard');

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏟️</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
            ADMIN PORTAL
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
            Sports Federation of India
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 24, color: 'var(--text)' }}>
            Sign In
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            
            <div style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@sports.com"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: 14, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span className="loader" style={{ width: 16, height: 16 }} />
                  Signing in...
                </span>
              ) : (
                '🔐 Sign In'
              )}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: 14, background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
            <p style={{ color: 'var(--text3)', marginBottom: 4 }}>
              Default credentials (change in production):
            </p>
            <p style={{ color: 'var(--text2)' }}>
              Email: <code style={{ color: 'var(--accent)' }}>admin@sports.com</code>
            </p>
            <p style={{ color: 'var(--text2)' }}>
              Password: <code style={{ color: 'var(--accent)' }}>Admin@123</code>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text3)', fontSize: 12 }}>
          <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            ← Back to Registration
          </Link>
        </p>
      </div>
    </div>
  );
}