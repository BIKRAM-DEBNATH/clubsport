import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useTransitionNavigate } from '../components/FootballTransition';

/* ─────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg:          '#04040e',
  surface:     'rgba(255,255,255,0.035)',
  surfaceHov:  'rgba(255,255,255,0.06)',
  border:      'rgba(255,255,255,0.08)',
  borderHov:   'rgba(255,255,255,0.18)',
  borderFocus: 'rgba(139,92,246,0.7)',
  violet:      '#8b5cf6',
  violetDark:  '#6d28d9',
  sky:         '#38bdf8',
  emerald:     '#34d399',
  textPrimary: '#f1f0ff',
  textMuted:   'rgba(241,240,255,0.45)',
  textDim:     'rgba(241,240,255,0.25)',
  error:       '#f87171',
  errorBg:     'rgba(248,113,113,0.08)',
  errorBorder: 'rgba(248,113,113,0.25)',
  radius:      '18px',
  radiusSm:    '12px',
  radiusXs:    '8px',
  fontDisplay: "'Sora', 'SF Pro Display', system-ui, sans-serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
};

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED PARTICLE CANVAS
   ───────────────────────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 55;
    const pts = Array.from({ length: N }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 1.2 + 0.3,
      a:  Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.a})`;
        ctx.fill();
      }
      /* connections */
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,92,246,${0.1 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 2,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CURSOR SPOTLIGHT
   ───────────────────────────────────────────────────────────────────────────── */
function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (!ref.current) return;
      ref.current.style.left = `${e.clientX}px`;
      ref.current.style.top  = `${e.clientY}px`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={ref} style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 1,
      width: 560, height: 560,
      transform: 'translate(-50%,-50%)',
      background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 68%)',
      transition: 'left 0.07s ease, top 0.07s ease',
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED GLOW ORB
   ───────────────────────────────────────────────────────────────────────────── */
function GlowOrb({ top, left, right, bottom, color = T.violet, size = 520, opacity = 0.12 }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity, filter: 'blur(60px)',
      pointerEvents: 'none', zIndex: 1,
      animation: 'orbFloat 8s ease-in-out infinite',
    }} />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GLASS INPUT
   ───────────────────────────────────────────────────────────────────────────── */
function GlassInput({ label, icon, type, value, onChange, placeholder, required, autoFocus }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* floating label */}
      <div style={{ position: 'relative' }}>
        <label style={{
          position: 'absolute',
          left: 48, zIndex: 10,
          fontSize: focused || hasValue ? '0.7rem' : '0.875rem',
          top:      focused || hasValue ? 9 : '50%',
          transform: focused || hasValue ? 'none' : 'translateY(-50%)',
          color: focused ? T.violet : T.textMuted,
          fontFamily: T.fontBody,
          fontWeight: 500,
          letterSpacing: '0.03em',
          pointerEvents: 'none',
          transition: 'all 0.25s cubic-bezier(0.23,1,0.32,1)',
          willChange: 'top, font-size, color',
        }}>{label}</label>

        {/* icon */}
        <span style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          fontSize: '1rem', zIndex: 10, pointerEvents: 'none',
          color: focused ? T.violet : T.textMuted,
          transition: 'color 0.25s ease',
        }}>{icon}</span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={focused ? placeholder : ''}
          required={required}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            padding: '22px 16px 10px 48px',
            background: focused ? 'rgba(139,92,246,0.06)' : hovered ? T.surfaceHov : T.surface,
            border: `1px solid ${focused ? T.borderFocus : hovered ? T.borderHov : T.border}`,
            borderRadius: T.radiusSm,
            color: T.textPrimary,
            fontFamily: T.fontBody,
            fontSize: '0.95rem',
            fontWeight: 500,
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.23,1,0.32,1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            letterSpacing: '0.01em',
            boxShadow: focused
              ? `0 0 0 3px rgba(139,92,246,0.12), 0 0 24px rgba(139,92,246,0.08)`
              : 'none',
            caretColor: T.violet,
          }}
        />

        {/* focus accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          height: 2, borderRadius: 2,
          width: focused ? '90%' : '0%',
          background: `linear-gradient(90deg, transparent, ${T.violet}, ${T.sky}, transparent)`,
          transition: 'width 0.4s cubic-bezier(0.23,1,0.32,1)',
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED GRID OVERLAY
   ───────────────────────────────────────────────────────────────────────────── */
function GridOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="admingrid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admingrid)" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT — ALL ORIGINAL LOGIC PRESERVED EXACTLY
   ───────────────────────────────────────────────────────────────────────────── */
export default function AdminLogin() {
  /* ── ORIGINAL STATE — UNTOUCHED ── */
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const goTo = useTransitionNavigate();

  /* ── NEW UI STATE ── */
  const [mounted, setMounted] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* card tilt on mouse move */
  const handleCardMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width  / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    card.style.transform = `perspective(1200px) rotateX(${(-y / rect.height * 4).toFixed(2)}deg) rotateY(${(x / rect.width * 4).toFixed(2)}deg) translateY(-6px)`;
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    setCardHovered(false);
  }, []);

  /* ── ORIGINAL handleLogin — UNTOUCHED ── */
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/admin/login', form);
      const token = res?.data?.data?.token;
      const admin = res?.data?.data?.admin;

      if (!token) throw new Error('Login failed: Token not received');

      localStorage.setItem('token', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));

      goTo('/admin/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  /* ── STYLE OBJECTS ── */
  const S = {
    root: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: T.bg,
      padding: '1.5rem',
      fontFamily: T.fontBody,
      position: 'relative',
      overflow: 'hidden',
    },

    /* animated gradient mesh background */
    meshBg: {
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: `
        radial-gradient(ellipse 80% 50% at 20% 20%, rgba(109,40,217,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(56,189,248,0.1)  0%, transparent 60%),
        radial-gradient(ellipse 50% 60% at 50% 50%, rgba(52,211,153,0.05) 0%, transparent 70%),
        ${T.bg}
      `,
    },

    /* noise texture */
    noise: {
      position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0.028,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: '200px 200px',
    },

    wrapper: {
      width: '100%',
      maxWidth: 440,
      position: 'relative',
      zIndex: 10,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
      transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1)',
    },

    /* brand badge */
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: 'rgba(139,92,246,0.12)',
      border: '1px solid rgba(139,92,246,0.28)',
      borderRadius: 100,
      padding: '0.35rem 0.9rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: '#c4b5fd',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '1.5rem',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(-12px)',
      transition: 'opacity 0.7s 0.15s cubic-bezier(0.16,1,0.3,1), transform 0.7s 0.15s cubic-bezier(0.16,1,0.3,1)',
    },

    heading: {
      fontFamily: T.fontDisplay,
      fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
      fontWeight: 800,
      letterSpacing: '-0.04em',
      color: T.textPrimary,
      margin: '0 0 0.4rem',
      lineHeight: 1.1,
    },

    sub: {
      color: T.textMuted,
      fontSize: '0.88rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
      margin: '0 0 2.5rem',
      lineHeight: 1.6,
    },

    /* glassmorphism card */
    card: {
      background: 'rgba(255,255,255,0.038)',
      backdropFilter: 'blur(32px) saturate(160%)',
      WebkitBackdropFilter: 'blur(32px) saturate(160%)',
      border: `1px solid ${cardHovered ? 'rgba(255,255,255,0.14)' : T.border}`,
      borderRadius: 24,
      padding: 'clamp(2rem, 5vw, 2.75rem)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      transformStyle: 'preserve-3d',
      willChange: 'transform',
      boxShadow: cardHovered
        ? '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.07)'
        : '0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
    },

    /* top shimmer line on card */
    cardShimmer: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.7) 30%, rgba(56,189,248,0.6) 60%, transparent 100%)',
      animation: 'shimmerSlide 4s ease-in-out infinite',
    },

    /* card inner glow */
    cardGlow: {
      position: 'absolute', top: -80, right: -80,
      width: 240, height: 240, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
      pointerEvents: 'none',
    },

    /* animated border ring */
    cardRing: {
      position: 'absolute', inset: -1, borderRadius: 25, pointerEvents: 'none',
      background: 'transparent',
      border: '1px solid transparent',
      backgroundOrigin: 'border-box',
      WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'destination-out',
      maskComposite: 'exclude',
    },

    errorBox: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      background: T.errorBg,
      border: `1px solid ${T.errorBorder}`,
      borderRadius: T.radiusSm,
      padding: '0.9rem 1rem',
      marginBottom: 20,
      animation: 'errorPop 0.4s cubic-bezier(0.16,1,0.3,1) both',
    },

    errorText: {
      color: T.error,
      fontSize: '0.85rem',
      fontFamily: T.fontBody,
      fontWeight: 500,
      lineHeight: 1.5,
    },

    submitBtn: {
      width: '100%',
      padding: '1rem 1.5rem',
      borderRadius: T.radiusSm,
      border: 'none',
      background: loading
        ? 'rgba(109,40,217,0.5)'
        : btnHovered
        ? 'linear-gradient(135deg, #9d6ffc 0%, #7c3aed 50%, #4f86f7 100%)'
        : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #38bdf8 100%)',
      color: '#fff',
      fontFamily: T.fontDisplay,
      fontSize: '0.95rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
      transform: btnHovered && !loading ? 'scale(1.018) translateY(-1px)' : 'scale(1)',
      boxShadow: btnHovered && !loading
        ? '0 0 48px rgba(139,92,246,0.5), 0 12px 32px rgba(124,58,237,0.4)'
        : '0 0 24px rgba(139,92,246,0.25), 0 6px 20px rgba(124,58,237,0.2)',
      opacity: loading ? 0.7 : 1,
      marginTop: 8,
    },

    credBox: {
      marginTop: 20,
      padding: '0.9rem 1rem',
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid rgba(255,255,255,0.06)`,
      borderRadius: T.radiusXs,
      fontSize: '0.78rem',
    },

    backLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 22,
      color: T.textDim,
      textDecoration: 'none',
      fontSize: '0.82rem',
      fontWeight: 500,
      letterSpacing: '0.02em',
      transition: 'color 0.2s ease',
      fontFamily: T.fontBody,
    },
  };

  return (
    <>
      {/* ── GOOGLE FONTS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-28px) scale(1.04); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(22px) scale(0.97); }
        }
        @keyframes shimmerSlide {
          0%   { opacity: 0.4; background-position: -400px 0; }
          50%  { opacity: 1; }
          100% { opacity: 0.4; background-position: 400px 0; }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes spinDot {
          to { transform: rotate(360deg); }
        }
        @keyframes errorPop {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(52,211,153,0.8); }
          50%       { opacity: 0.6; box-shadow: 0 0 18px rgba(52,211,153,0.4); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(20,12,40,0.95) inset !important;
          -webkit-text-fill-color: #f1f0ff !important;
          caret-color: #8b5cf6;
          border-radius: 12px !important;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      <div style={S.root}>
        {/* Mesh background */}
        <div style={S.meshBg} />
        <GridOverlay />
        <CursorSpotlight />

        {/* Glow orbs */}
        <GlowOrb top="-8%" left="-6%"  color={T.violet} size={560} opacity={0.14} />
        <GlowOrb bottom="-10%" right="-5%" color={T.sky}    size={480} opacity={0.1} />
        <GlowOrb top="40%" left="60%"  color={T.emerald}  size={360} opacity={0.06} />

        {/* Particles */}
        <ParticleCanvas />

        {/* Noise */}
        <div style={S.noise} />

        {/* ── CONTENT WRAPPER ── */}
        <div style={S.wrapper}>

          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: '1.25rem',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateY(-16px)',
              transition: 'opacity 0.7s 0.05s cubic-bezier(0.16,1,0.3,1), transform 0.7s 0.05s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {/* Logo mark */}
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontWeight: 900, color: '#fff',
                boxShadow: '0 0 40px rgba(139,92,246,0.45), 0 8px 24px rgba(0,0,0,0.4)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* inner shimmer */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)',
                  borderRadius: 18,
                }} />
                <span style={{ position: 'relative' }}>⚡</span>
              </div>
            </div>

            {/* Live status badge */}
            <div style={{ ...S.badge, display: 'inline-flex' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: T.emerald,
                animation: 'statusPulse 2.2s ease infinite',
                display: 'inline-block',
              }} />
              Secure Admin Portal
            </div>

            <h1 style={{
              ...S.heading,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.75s 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.75s 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}>
              Welcome{' '}
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 60%, #34d399 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientShift 4s ease infinite',
              }}>Back</span>
            </h1>

            <p style={{
              ...S.sub,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateY(12px)',
              transition: 'opacity 0.75s 0.28s cubic-bezier(0.16,1,0.3,1), transform 0.75s 0.28s cubic-bezier(0.16,1,0.3,1)',
            }}>
              Sign in to your BikramSports control centre
            </p>
          </div>

          {/* ── GLASS CARD ── */}
          <div
            ref={cardRef}
            style={{
              ...S.card,
              opacity: mounted ? 1 : 0,
              transition: S.card.transition + ', opacity 0.8s 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={() => setCardHovered(true)}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            {/* Shimmer top border */}
            <div style={S.cardShimmer} />
            {/* Corner glow */}
            <div style={S.cardGlow} />

            {/* ── ERROR ALERT — original logic triggers this ── */}
            {error && (
              <div style={S.errorBox}>
                <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <p style={S.errorText}>{error}</p>
              </div>
            )}

            {/* ── FORM — original onSubmit handler preserved ── */}
            <form onSubmit={handleLogin} noValidate>
              <GlassInput
                label="Email Address"
                icon="✉"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@sports.com"
                required
                autoFocus
              />

              <GlassInput
                label="Password"
                icon="🔒"
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
              />

              {/* ── SUBMIT BUTTON — original disabled/loading logic preserved ── */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                style={S.submitBtn}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    {/* Premium spinner */}
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.25)',
                      borderTopColor: '#fff',
                      display: 'inline-block',
                      animation: 'spinDot 0.7s linear infinite',
                    }} />
                    Authenticating…
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Sign In
                    <span style={{
                      display: 'inline-block',
                      transform: btnHovered ? 'translateX(3px)' : 'translateX(0)',
                      transition: 'transform 0.25s ease',
                    }}>→</span>
                  </span>
                )}
              </button>
            </form>

            {/* ── CREDENTIAL HINT (preserved from original) ── */}
            <div style={S.credBox}>
              <p style={{ color: T.textMuted, marginBottom: 5, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Default credentials
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>
                  Email{' '}
                  <code style={{
                    color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(139,92,246,0.12)', padding: '1px 6px', borderRadius: 4,
                  }}>admin@sports.com</code>
                </p>
                <p style={{ color: T.textMuted, fontSize: '0.8rem', margin: 0 }}>
                  Password{' '}
                  <code style={{
                    color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(139,92,246,0.12)', padding: '1px 6px', borderRadius: 4,
                  }}>Admin@123</code>
                </p>
              </div>
            </div>
          </div>

          {/* ── BACK LINK — original route preserved ── */}
          <Link
            to="/"
            style={S.backLink}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(167,139,250,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textDim; }}
          >
            <span>←</span> Back to Registration
          </Link>
        </div>
      </div>
    </>
  );
}