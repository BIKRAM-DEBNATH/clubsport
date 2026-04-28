import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 16 }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div>{label}</div>
    </div>
  );
}

function getStatusBadge(status) {
  if (status === "Approved") return "badge-approved";
  if (status === "Rejected") return "badge-rejected";
  return "badge-pending";
}

function getPaymentBadge(status) {
  if (status === "Paid") return "badge-approved";
  if (status === "Failed") return "badge-rejected";
  return "badge-pending";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboard() {
  const [athletes, setAthletes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  let admin = null;
  try {
    const data = localStorage.getItem("adminUser");
    admin = data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Invalid JSON:", err);
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [athRes, statsRes] = await Promise.all([
        api.get("/athlete/all", { params }),
        api.get("/admin/stats"),
      ]);
      const athletesData = athRes.data?.data;
      setAthletes(athletesData?.athletes || []);
      setTotalPages(athletesData?.pagination?.pages || 1);
      setTotal(athletesData?.pagination?.total || 0);
      setStats(statsRes.data?.data || {});
    } catch (err) {
      console.error("Fetch Error:", err);
      setAthletes([]);
      setTotalPages(1);
      setTotal(0);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const res = await api.get("/admin/export-csv", { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `athletes_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === athletes.length && athletes.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(athletes.map(a => a._id)));
    }
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    if (!window.confirm(`Approve ${selected.size} selected athlete(s)?`)) return;
    setBulkActionLoading(true);
    setMsg("");
    try {
      await api.put("/admin/bulk-status", { ids: Array.from(selected), status: "Approved" });
      setMsg(`Approved ${selected.size} athlete(s)`);
      fetchData();
    } catch (err) {
      setMsg("Error: " + (err.response?.data?.message || "Bulk approve failed"));
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(`Permanently delete ${selected.size} athlete(s)? This cannot be undone.`)) return;
    setBulkActionLoading(true);
    setMsg("");
    try {
      await api.delete("/admin/bulk-delete", { data: { ids: Array.from(selected) } });
      setMsg(`Deleted ${selected.size} athlete(s)`);
      fetchData();
    } catch (err) {
      setMsg("Error: " + (err.response?.data?.message || "Bulk delete failed"));
    } finally {
      setBulkActionLoading(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: selectedCount > 0 ? 80 : 0 }}>

      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏟️</span>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>ADMIN DASHBOARD</h1>
              <p style={{ fontSize: 11 }}>Welcome, {admin?.name || "Admin"}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/"><button className="btn-secondary btn-sm">🏃 Registration</button></Link>
            <button className="btn-secondary btn-sm" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="dashboard-body">

        {/* STATS */}
        <div className="stats-grid">
          <StatCard label="Total" value={stats.total || 0} icon="👥" color="var(--accent)" />
          <StatCard label="Pending" value={stats.pending || 0} icon="⏳" color="var(--orange)" />
          <StatCard label="Approved" value={stats.approved || 0} icon="✅" color="var(--green)" />
          <StatCard label="Rejected" value={stats.rejected || 0} icon="❌" color="var(--red)" />
          <StatCard label="Missing Docs" value={stats.withMissingDocs || 0} icon="⚠️" color="var(--yellow)" />
        </div>

        {/* FILTER */}
        <div className="filter-bar">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search..." />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

          {selectedCount > 0 && (
            <span className="selected-count">{selectedCount} selected</span>
          )}

          <div style={{ marginLeft: "auto" }}>
            <button className="btn-secondary" onClick={exportCSV} disabled={exporting}>
              {exporting ? "Exporting..." : "⬇️ Export CSV"}
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {msg && (
          <div className={`alert ${msg.startsWith("Error") ? "alert-error" : "alert-success"}`}>
            {msg}
          </div>
        )}

        {/* DATA */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-state">
              <div className="loader" />
              <span>Loading athletes…</span>
            </div>
          ) : athletes.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 32 }}>📭</span>
              <p>No athletes found</p>
            </div>
          ) : isMobile ? (
            <div style={{ padding: 16 }}>
              {athletes.map(a => (
                <div key={a._id} className="mobile-card" onClick={(e) => {
                  if (e.target.type !== "checkbox") navigate(`/admin/athlete/${a._id}`);
                }}>
                  <input
                    type="checkbox"
                    checked={selected.has(a._id)}
                    onChange={() => toggleSelect(a._id)}
                  />
                  <div className="mobile-card-info">
                    <p>{a.firstName} {a.lastName}</p>
                    <small>{a.registrationNumber || "—"} • {a.city || "—"} • <span className={`badge ${getStatusBadge(a.status)}`}>{a.status}</span></small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selected.size === athletes.length && athletes.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Reg. #</th>
                    <th>Name</th>
                    <th>Age / Gender</th>
                    <th>City</th>
                    <th>Club</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map(a => (
                    <tr key={a._id} onClick={() => navigate(`/admin/athlete/${a._id}`)}>
                      <td onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(a._id)}
                          onChange={() => toggleSelect(a._id)}
                        />
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.registrationNumber || "—"}</td>
                      <td style={{ color: "var(--text)", fontWeight: 600 }}>{a.firstName} {a.lastName}</td>
                      <td>{a.age ?? "—"} / {a.gender || "—"}</td>
                      <td>{a.city || "—"}</td>
                      <td>{a.clubName || "—"}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(a.status)}`}>
                          {a.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPaymentBadge(a.paymentStatus)}`}>
                          {a.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td>{formatDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn-secondary btn-sm"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
            >
              ← Prev
            </button>
            <span>Page {page} of {totalPages} ({total} total)</span>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* BULK ACTION BAR */}
      {selectedCount > 0 && (
        <div className="bulk-action-bar">
          <span>{selectedCount} athlete(s) selected</span>
          <div className="bulk-action-buttons">
            <button className="btn-success" onClick={bulkApprove} disabled={bulkActionLoading}>
              ✅ Approve
            </button>
            <button className="btn-danger" onClick={bulkDelete} disabled={bulkActionLoading}>
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

