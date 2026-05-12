import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import api from "../utils/api";
import { useTransitionNavigate, TransitionLink } from "../components/FootballTransition";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#04060f",
  bgDeep:    "#02040a",
  surface:   "rgba(255,255,255,0.03)",
  surfaceHi: "rgba(255,255,255,0.06)",
  border:    "rgba(255,255,255,0.07)",
  borderHi:  "rgba(99,179,237,0.35)",
  text:      "#e2e8f0",
  textMuted: "#64748b",
  textDim:   "#334155",
  accent:    "#63b3ed",
  accentGlow:"rgba(99,179,237,0.25)",
  cyan:      "#22d3ee",
  green:     "#34d399",
  greenGlow: "rgba(52,211,153,0.2)",
  orange:    "#fb923c",
  red:       "#f87171",
  yellow:    "#fbbf24",
  purple:    "#a78bfa",
  fontDisplay:"'Syne', 'DM Sans', sans-serif",
  fontMono:  "'JetBrains Mono', 'Fira Code', monospace",
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${T.bgDeep}; color: ${T.text}; font-family: ${T.fontDisplay}; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.2); border-radius: 2px; }
    input, select, button { font-family: inherit; }
    input[type="checkbox"] {
      width: 16px; height: 16px; cursor: pointer; accent-color: ${T.accent};
      border: 1px solid ${T.border}; border-radius: 3px;
    }
  `}</style>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusConfig(status) {
  if (status === "Approved") return { color: T.green, glow: T.greenGlow, dot: "#34d399" };
  if (status === "Rejected") return { color: T.red, glow: "rgba(248,113,113,0.2)", dot: "#f87171" };
  return { color: T.yellow, glow: "rgba(251,191,36,0.15)", dot: "#fbbf24" };
}

function getPaymentConfig(status) {
  if (status === "Paid") return { color: T.green, glow: T.greenGlow, dot: "#34d399" };
  if (status === "Failed") return { color: T.red, glow: "rgba(248,113,113,0.2)", dot: "#f87171" };
  return { color: T.yellow, glow: "rgba(251,191,36,0.15)", dot: "#fbbf24" };
}

// ─── Ambient Background ───────────────────────────────────────────────────────
function AmbientBackground({ mouseX, mouseY }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Deep base */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,179,237,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.05) 0%, transparent 60%), ${T.bgDeep}` }} />

      {/* Mouse spotlight */}
      <motion.div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,179,237,0.04) 0%, transparent 70%)",
        x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%",
        pointerEvents: "none",
      }} />

      {/* Floating orbs */}
      {[
        { w:500, h:500, top:"5%", left:"10%", color:"rgba(99,179,237,0.04)", dur:18 },
        { w:400, h:400, top:"60%", right:"5%", color:"rgba(167,139,250,0.04)", dur:22 },
        { w:300, h:300, top:"40%", left:"60%", color:"rgba(34,211,238,0.03)", dur:15 },
      ].map((orb, i) => (
        <motion.div key={i}
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: "easeInOut", delay: i * 3 }}
          style={{ position: "absolute", width: orb.w, height: orb.h, borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            top: orb.top, left: orb.left, right: orb.right, filter: "blur(40px)" }}
        />
      ))}

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(99,179,237,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.025) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
      }} />

      {/* Noise texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "128px",
      }} />

      {/* Horizontal light beam */}
      <motion.div
        animate={{ opacity: [0, 0.4, 0], scaleX: [0, 1, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2, ease: "easeInOut" }}
        style={{ position: "absolute", top: "30%", left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${T.accent} 50%, transparent 100%)`,
          opacity: 0, transformOrigin: "left" }}
      />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const statIconMap = {
  "👥": { gradient: "135deg, rgba(99,179,237,0.2), rgba(99,179,237,0.05)", glow: T.accentGlow, border: "rgba(99,179,237,0.25)" },
  "⏳": { gradient: "135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05)", glow: "rgba(251,191,36,0.2)", border: "rgba(251,191,36,0.25)" },
  "✅": { gradient: "135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05)", glow: T.greenGlow, border: "rgba(52,211,153,0.25)" },
  "❌": { gradient: "135deg, rgba(248,113,113,0.2), rgba(248,113,113,0.05)", glow: "rgba(248,113,113,0.2)", border: "rgba(248,113,113,0.25)" },
  "⚠️": { gradient: "135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05)", glow: "rgba(167,139,250,0.2)", border: "rgba(167,139,250,0.25)" },
};

function StatCard({ label, value, icon, color }) {
  const cfg = statIconMap[icon] || statIconMap["👥"];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "relative", padding: "24px 20px", borderRadius: 16, textAlign: "center",
        background: hovered ? T.surfaceHi : T.surface,
        border: `1px solid ${hovered ? cfg.border : T.border}`,
        backdropFilter: "blur(20px)",
        boxShadow: hovered ? `0 8px 32px ${cfg.glow}, 0 0 0 1px ${cfg.border}` : "0 2px 12px rgba(0,0,0,0.3)",
        transition: "background 0.3s, border 0.3s, box-shadow 0.3s",
        cursor: "default", overflow: "hidden",
      }}
    >
      {/* Card glow top */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${cfg.border}, transparent)`,
        opacity: hovered ? 1 : 0.4, transition: "opacity 0.3s" }} />

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, margin: "0 auto 14px",
        background: `linear-gradient(${cfg.gradient})`,
        border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, boxShadow: `0 4px 16px ${cfg.glow}`,
      }}>
        {icon}
      </div>

      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 6,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}
      >
        {value}
      </motion.div>
      <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>
        {label}
      </div>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, type = "status" }) {
  const cfg = type === "payment" ? getPaymentConfig(status) : getStatusConfig(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.glow,
      border: `1px solid ${cfg.color}30`,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0,
        boxShadow: `0 0 4px ${cfg.dot}` }} />
      {status || "Pending"}
    </span>
  );
}

// ─── Glass Panel ──────────────────────────────────────────────────────────────
function GlassPanel({ children, style = {}, animate = true }) {
  const base = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    backdropFilter: "blur(20px)",
    ...style,
  };
  if (!animate) return <div style={base}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={base}
    >
      {children}
    </motion.div>
  );
}

// ─── Premium Button ───────────────────────────────────────────────────────────
function PremiumButton({ children, onClick, disabled, variant = "secondary", style = {} }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const variants = {
    secondary: {
      bg: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
      border: hovered ? "rgba(99,179,237,0.35)" : T.border,
      color: hovered ? T.accent : T.text,
      shadow: hovered ? `0 0 16px rgba(99,179,237,0.1)` : "none",
    },
    success: {
      bg: hovered ? "rgba(52,211,153,0.2)" : "rgba(52,211,153,0.12)",
      border: hovered ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.3)",
      color: T.green,
      shadow: hovered ? `0 0 20px rgba(52,211,153,0.25)` : "none",
    },
    danger: {
      bg: hovered ? "rgba(248,113,113,0.2)" : "rgba(248,113,113,0.1)",
      border: hovered ? "rgba(248,113,113,0.5)" : "rgba(248,113,113,0.25)",
      color: T.red,
      shadow: hovered ? `0 0 20px rgba(248,113,113,0.25)` : "none",
    },
    accent: {
      bg: hovered ? "rgba(99,179,237,0.25)" : "rgba(99,179,237,0.15)",
      border: hovered ? T.accent : "rgba(99,179,237,0.4)",
      color: hovered ? "#fff" : T.accent,
      shadow: hovered ? `0 0 24px rgba(99,179,237,0.35)` : "none",
    },
  };

  const v = variants[variant] || variants.secondary;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.03)" : v.bg,
        border: `1px solid ${disabled ? T.border : v.border}`,
        color: disabled ? T.textMuted : v.color,
        boxShadow: disabled ? "none" : v.shadow,
        transition: "all 0.25s ease",
        whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6,
        letterSpacing: "0.03em", ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 20px", gap: 20 }}
    >
      <div style={{ position: "relative", width: 48, height: 48 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ width: 48, height: 48, borderRadius: "50%",
            border: `2px solid ${T.border}`,
            borderTop: `2px solid ${T.accent}`,
            boxShadow: `0 0 16px ${T.accentGlow}`,
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", inset: 8, borderRadius: "50%",
            border: `1px solid transparent`,
            borderTop: `1px solid ${T.cyan}40`,
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
        Loading Athletes…
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "64px 20px", gap: 16 }}
    >
      <div style={{ fontSize: 48, filter: "grayscale(0.5)" }}>📭</div>
      <div style={{ fontSize: 15, color: T.textMuted, fontWeight: 500 }}>No athletes found</div>
      <div style={{ fontSize: 12, color: T.textDim }}>Try adjusting your search or filters</div>
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // ── ALL ORIGINAL STATE & LOGIC (UNCHANGED) ──────────────────────────────
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
  const goTo = useTransitionNavigate();
  const [adminName] = useState(() => {
    try {
      const data = localStorage.getItem("adminUser");
      const admin = data ? JSON.parse(data) : null;
      return admin?.name || "Admin";
    } catch { return "Admin"; }
  });

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

  // ── MOUSE SPOTLIGHT ─────────────────────────────────────────────────────
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 80, damping: 20 });
  const mouseY = useSpring(rawY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const handler = (e) => { rawX.set(e.clientX); rawY.set(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [rawX, rawY]);

  // ── SEARCH DEBOUNCE INPUT ────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <GlobalStyle />
      <AmbientBackground mouseX={mouseX} mouseY={mouseY} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ position: "relative", zIndex: 1, minHeight: "100vh", paddingBottom: selectedCount > 0 ? 100 : 40 }}
      >

        {/* ── HEADER ── */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "sticky", top: 0, zIndex: 100,
            padding: "0 24px",
            background: "rgba(4,6,15,0.8)",
            backdropFilter: "blur(24px) saturate(180%)",
            borderBottom: `1px solid ${T.border}`,
            boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{
            maxWidth: 1400, margin: "0 auto",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            height: 64,
          }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <motion.div
                animate={{ boxShadow: ["0 0 12px rgba(99,179,237,0.3)", "0 0 24px rgba(99,179,237,0.6)", "0 0 12px rgba(99,179,237,0.3)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(99,179,237,0.25), rgba(34,211,238,0.15))",
                  border: "1px solid rgba(99,179,237,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}
              >
                🏟️
              </motion.div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.08em",
                  background: `linear-gradient(90deg, ${T.accent}, ${T.cyan})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  textTransform: "uppercase" }}>
                  Admin Console
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: "0.1em" }}>
                  Welcome, {adminName}
                </div>
              </div>
            </div>

            {/* Nav actions */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <TransitionLink to="/" style={{ textDecoration: "none" }}>
                <PremiumButton variant="secondary">
                  🏃 Registration
                </PremiumButton>
              </TransitionLink>
              <PremiumButton variant="secondary" onClick={logout}>
                🚪 Logout
              </PremiumButton>
            </div>
          </div>
        </motion.header>

        {/* ── BODY ── */}
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "24px 16px" : "32px 24px" }}>

          {/* ── STATS GRID ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)",
              gap: 14, marginBottom: 24,
            }}
          >
            {[
              { label: "Total", value: stats.total || 0, icon: "👥", color: T.accent },
              { label: "Pending", value: stats.pending || 0, icon: "⏳", color: T.yellow },
              { label: "Approved", value: stats.approved || 0, icon: "✅", color: T.green },
              { label: "Rejected", value: stats.rejected || 0, icon: "❌", color: T.red },
              { label: "Missing Docs", value: stats.withMissingDocs || 0, icon: "⚠️", color: T.purple },
            ].map((s, i) => (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: "easeOut" }}
              >
                <StatCard {...s} />
              </motion.div>
            ))}
          </motion.div>

          {/* ── FILTER BAR ── */}
          <GlassPanel style={{ padding: "14px 18px", marginBottom: 18 }}>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
            }}>
              {/* Search */}
              <FilterInput
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search athletes…"
                icon="⌕"
                style={{ flex: "1 1 200px", minWidth: 180 }}
              />

              {/* Status filter */}
              <FilterSelect
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </FilterSelect>

              {/* Selected count pill */}
              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: "rgba(99,179,237,0.15)", border: `1px solid rgba(99,179,237,0.35)`,
                      color: T.accent, letterSpacing: "0.05em",
                    }}
                  >
                    {selectedCount} selected
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginLeft: "auto" }}>
                <PremiumButton variant="accent" onClick={exportCSV} disabled={exporting}>
                  {exporting ? "Exporting…" : "⬇ Export CSV"}
                </PremiumButton>
              </div>
            </div>
          </GlassPanel>

          {/* ── MESSAGE ALERT ── */}
          <AnimatePresence>
            {msg && (
              <motion.div
                key="msg"
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                style={{
                  marginBottom: 16, padding: "12px 18px", borderRadius: 12,
                  fontSize: 13, fontWeight: 500,
                  background: msg.startsWith("Error")
                    ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
                  border: `1px solid ${msg.startsWith("Error") ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
                  color: msg.startsWith("Error") ? T.red : T.green,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span>{msg.startsWith("Error") ? "✕" : "✓"}</span>
                <span>{msg}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setMsg("")}
                  style={{ marginLeft: "auto", background: "none", border: "none",
                    color: "inherit", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                >×</motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DATA TABLE ── */}
          <GlassPanel style={{ overflow: "hidden", padding: 0 }}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LoadingScreen />
                </motion.div>
              ) : athletes.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EmptyState />
                </motion.div>
              ) : isMobile ? (
                <MobileCards
                  athletes={athletes}
                  selected={selected}
                  toggleSelect={toggleSelect}
                  navigate={goTo}
                />
              ) : (
                <DesktopTable
                  athletes={athletes}
                  selected={selected}
                  toggleSelect={toggleSelect}
                  toggleSelectAll={toggleSelectAll}
                  navigate={goTo}
                />
              )}
            </AnimatePresence>
          </GlassPanel>

          {/* ── PAGINATION ── */}
          <AnimatePresence>
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 16, marginTop: 20,
                }}
              >
                <PremiumButton
                  variant="secondary"
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                >
                  ← Prev
                </PremiumButton>

                <div style={{ fontSize: 12, color: T.textMuted, display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ color: T.accent, fontWeight: 700 }}>{page}</span>
                  <span>of</span>
                  <span>{totalPages}</span>
                  <span style={{ color: T.textDim }}>({total} total)</span>
                </div>

                <PremiumButton
                  variant="secondary"
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                >
                  Next →
                </PremiumButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BULK ACTION DOCK ── */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
                zIndex: 200, display: "flex", alignItems: "center", gap: 20,
                padding: "14px 24px", borderRadius: 20,
                background: "rgba(4,6,15,0.9)",
                backdropFilter: "blur(32px)",
                border: `1px solid rgba(99,179,237,0.2)`,
                boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,179,237,0.1)",
                whiteSpace: "nowrap",
              }}
            >
              {/* Glow line top */}
              <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
                background: "linear-gradient(90deg, transparent, rgba(99,179,237,0.5), transparent)" }} />

              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: "0.05em" }}>
                {selectedCount} athlete{selectedCount > 1 ? "s" : ""} selected
              </div>
              <div style={{ width: 1, height: 20, background: T.border }} />
              <div style={{ display: "flex", gap: 8 }}>
                <PremiumButton variant="success" onClick={bulkApprove} disabled={bulkActionLoading}>
                  ✓ Approve
                </PremiumButton>
                <PremiumButton variant="danger" onClick={bulkDelete} disabled={bulkActionLoading}>
                  ⌫ Delete
                </PremiumButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ─── Filter Input ─────────────────────────────────────────────────────────────
function FilterInput({ value, onChange, placeholder, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
        color: focused ? T.accent : T.textMuted, fontSize: 14, transition: "color 0.2s", pointerEvents: "none" }}>
        🔍
      </span>
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px 9px 36px", borderRadius: 10, fontSize: 13,
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(99,179,237,0.4)" : T.border}`,
          color: T.text, outline: "none", transition: "all 0.25s",
          boxShadow: focused ? `0 0 0 3px rgba(99,179,237,0.08)` : "none",
        }}
      />
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────
function FilterSelect({ value, onChange, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: "9px 14px", borderRadius: 10, fontSize: 13,
        background: focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(99,179,237,0.4)" : T.border}`,
        color: value ? T.text : T.textMuted, outline: "none",
        cursor: "pointer", transition: "all 0.25s", minWidth: 140,
        boxShadow: focused ? `0 0 0 3px rgba(99,179,237,0.08)` : "none",
      }}
    >
      {children}
    </select>
  );
}

// ─── Desktop Table ────────────────────────────────────────────────────────────
function DesktopTable({ athletes, selected, toggleSelect, toggleSelectAll, navigate }) {
  const thStyle = {
    padding: "12px 16px", fontSize: 10, fontWeight: 700, color: T.textMuted,
    textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "left",
    borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 44, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={selected.size === athletes.length && athletes.length > 0}
                onChange={toggleSelectAll}
              />
            </th>
            {["Reg. #","Name","Age / Gender","City","Club","Status","Payment","Registered"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {athletes.map((a, i) => (
            <TableRow key={a._id} a={a} i={i} selected={selected} toggleSelect={toggleSelect} navigate={navigate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ a, i, selected, toggleSelect, navigate }) {
  const [hovered, setHovered] = useState(false);
  const isSelected = selected.has(a._id);

  const tdStyle = {
    padding: "13px 16px", fontSize: 13, color: T.textMuted,
    borderBottom: `1px solid ${T.border}`,
    transition: "background 0.2s",
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.03, duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => goTo(`/admin/athlete/${a._id}`)}
      style={{
        cursor: "pointer",
        background: isSelected
          ? "rgba(99,179,237,0.07)"
          : hovered ? "rgba(255,255,255,0.035)" : "transparent",
        transition: "background 0.2s",
      }}
    >
      <td style={{ ...tdStyle, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(a._id)}
        />
      </td>
      <td style={{ ...tdStyle, fontFamily: T.fontMono, fontSize: 11, color: T.textDim }}>
        {a.registrationNumber || "—"}
      </td>
      <td style={{ ...tdStyle, color: T.text, fontWeight: 600, fontSize: 13 }}>
        {a.firstName} {a.lastName}
      </td>
      <td style={tdStyle}>{a.age ?? "—"} / {a.gender || "—"}</td>
      <td style={tdStyle}>{a.city || "—"}</td>
      <td style={tdStyle}>{a.clubName || "—"}</td>
      <td style={tdStyle}>
        <StatusBadge status={a.status || "Pending"} type="status" />
      </td>
      <td style={tdStyle}>
        <StatusBadge status={a.paymentStatus || "Pending"} type="payment" />
      </td>
      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12 }}>{formatDate(a.createdAt)}</td>
    </motion.tr>
  );
}

// ─── Mobile Cards ─────────────────────────────────────────────────────────────
function MobileCards({ athletes, selected, toggleSelect, navigate }) {
  return (
    <div style={{ padding: "12px" }}>
      {athletes.map((a, i) => {
        const isSelected = selected.has(a._id);
        return (
          <motion.div
            key={a._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={e => { if (e.target.type !== "checkbox") goTo(`/admin/athlete/${a._id}`); }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 12, marginBottom: 8,
              background: isSelected ? "rgba(99,179,237,0.07)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${isSelected ? "rgba(99,179,237,0.25)" : T.border}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(a._id)}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.firstName} {a.lastName}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.fontMono }}>
                  {a.registrationNumber || "—"}
                </span>
                <span style={{ fontSize: 11, color: T.textMuted }}>{a.city || "—"}</span>
                <StatusBadge status={a.status || "Pending"} type="status" />
              </div>
            </div>
            <div style={{ color: T.textDim, fontSize: 16 }}>›</div>
          </motion.div>
        );
      })}
    </div>
  );
}