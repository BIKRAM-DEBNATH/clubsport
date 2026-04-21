import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function AdminDashboard() {
  const [athletes, setAthletes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [athRes, statsRes] = await Promise.all([
        api.get('/athlete/all', { params }),
        api.get('/admin/stats'),
      ]);
      setAthletes(athRes.data.athletes);
      setTotalPages(athRes.data.pages);
      setTotal(athRes.data.total);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const res = await api.get('/admin/export-csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `athletes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏟️</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
                ADMIN DASHBOARD
              </h1>
              <p style={{ color: 'var(--text3)', fontSize: 11 }}>Welcome, {admin.name || 'Admin'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary btn-sm">🏃 Registration</button>
            </Link>
            <button className="btn-secondary btn-sm" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard label="Total" value={stats.total || 0} icon="👥" color="var(--accent)" />
          <StatCard label="Pending" value={stats.pending || 0} icon="⏳" color="var(--orange)" />
          <StatCard label="Approved" value={stats.approved || 0} icon="✅" color="var(--green)" />
          <StatCard label="Rejected" value={stats.rejected || 0} icon="❌" color="var(--red)" />
          <StatCard label="Missing Docs" value={stats.withMissingDocs || 0} icon="⚠️" color="var(--yellow)" />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ maxWidth: 300 }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Search name, email, mobile, reg. no." />
          <select style={{ maxWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option>Pending</option><option>Approved</option><option>Rejected</option>
          </select>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn-primary btn-sm" onClick={exportCSV} disabled={exporting}>
              {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>
                <div className="loader" style={{ margin: '0 auto 16px', width: 32, height: 32 }} />
                <p>Loading athletes...</p>
              </div>
            ) : athletes.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏋️</div>
                <p>No athletes found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reg. No.</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Age Group</th>
                    <th>State</th>
                    <th>Competitions</th>
                    <th>Docs</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map(a => (
                    <tr key={a._id} onClick={() => navigate(`/admin/athlete/${a._id}`)}>
                      <td><code style={{ color: 'var(--accent)', fontSize: 12 }}>{a.registrationNumber}</code></td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{a.firstName} {a.lastName}</td>
                      <td>{a.mobile}</td>
                      <td>{a.ageGroup || '—'}</td>
                      <td>{a.state || '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.competitions?.slice(0, 2).join(', ')}{a.competitions?.length > 2 ? ` +${a.competitions.length - 2}` : ''}
                      </td>
                      <td>
                        {a.missingDocuments?.length > 0 ? (
                          <span style={{ color: 'var(--yellow)', fontSize: 12 }}>⚠️ {a.missingDocuments.length} missing</span>
                        ) : (
                          <span style={{ color: 'var(--green)', fontSize: 12 }}>✅ Complete</span>
                        )}
                      </td>
                      <td><span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                      <td style={{ fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>Showing {athletes.length} of {total} athletes</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ padding: '6px 14px', color: 'var(--text2)', fontSize: 13 }}>Page {page} / {totalPages}</span>
                <button className="btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.06 }}>{label}</div>
    </div>
  );
}
