import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import videoBg from '../assets/backgroud video.mp4';
import basketball from '../assets/basketball.png';
import swimming from '../assets/swimming.png';
import gym from '../assets/gym.png';
import chatImage1 from '../assets/ChatGPT Image Apr 20, 2026, 10_36_23 PM.png';
import chatImage2 from '../assets/ChatGPT Image Apr 20, 2026, 10_38_12 PM.png';
import chatImage3 from '../assets/ChatGPT Image Apr 20, 2026, 10_49_30 PM.png';
import Chatbot from './Chatbot';
import { TransitionLink } from './FootballTransition';
import './LandingPage.css';

/* ─── Utility: useInView ─────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Scroll Progress Bar ────────────────────────────────────────────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
      background: 'rgba(255,255,255,0.08)',
    }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: 'linear-gradient(90deg, #a78bfa, #38bdf8, #34d399)',
        transition: 'width 0.1s linear',
        boxShadow: '0 0 12px #a78bfa88',
      }} />
    </div>
  );
}

/* ─── Particle Canvas ────────────────────────────────────────────────────── */
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 70;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(167,139,250,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 2,
    }} />
  );
}

/* ─── Spotlight Cursor ───────────────────────────────────────────────────── */
function CursorSpotlight() {
  const spotRef = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (!spotRef.current) return;
      spotRef.current.style.left = `${e.clientX}px`;
      spotRef.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <div ref={spotRef} style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 1,
      width: 500, height: 500,
      transform: 'translate(-50%,-50%)',
      background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
      transition: 'left 0.06s ease, top 0.06s ease',
    }} />
  );
}

/* ─── Reveal Wrapper ─────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useInView(0.1);
  const transforms = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(-40px)', right: 'translateX(40px)' };
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : transforms[direction],
      transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  );
}

/* ─── Magnetic Button ────────────────────────────────────────────────────── */
function MagneticBtn({ children, className, to, href, onClick, style }) {
  const btnRef = useRef(null);
  const handleMove = (e) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  };
  const handleLeave = () => {
    if (btnRef.current) btnRef.current.style.transform = 'translate(0,0)';
  };
  const inner = <span ref={btnRef} onMouseMove={handleMove} onMouseLeave={handleLeave}
    style={{ display: 'inline-block', transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)', ...style }}
    className={className} onClick={onClick}>{children}</span>;
  if (to) return <TransitionLink to={to} style={{ textDecoration: 'none' }}>{inner}</TransitionLink>;
  if (href) return <a href={href} style={{ textDecoration: 'none' }}>{inner}</a>;
  return inner;
}

/* ─── Glass Card ─────────────────────────────────────────────────────────── */
function GlassCard({ children, className = '', style = {}, hover = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={`bsc-glass-card ${className}`}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid rgba(255,255,255,${hovered ? 0.18 : 0.08})`,
        borderRadius: 20,
        padding: '2rem',
        transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        transform: hovered ? 'translateY(-6px) scale(1.015)' : 'none',
        boxShadow: hovered
          ? '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
        willChange: 'transform, box-shadow',
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ─── Program Image Card ─────────────────────────────────────────────────── */
function ProgramCard({ img, title, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          border: `1px solid rgba(255,255,255,${hovered ? 0.15 : 0.07})`,
          background: 'rgba(255,255,255,0.03)',
          transition: 'all 0.5s cubic-bezier(0.23,1,0.32,1)',
          transform: hovered ? 'translateY(-8px) scale(1.02)' : 'none',
          boxShadow: hovered ? '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.2)' : '0 8px 24px rgba(0,0,0,0.3)',
          aspectRatio: '4/3',
          cursor: 'default',
        }}>
        <img src={img} alt={title} style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, rgba(5,5,15,${hovered ? 0.85 : 0.5}) 0%, transparent 60%)`,
          transition: 'background 0.4s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.25rem 1.5rem',
          transform: hovered ? 'translateY(0)' : 'translateY(4px)',
          transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)',
        }}>
          <div style={{
            display: 'inline-block', marginBottom: 6,
            background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)',
            borderRadius: 20, padding: '2px 10px', fontSize: 11, color: '#c4b5fd',
            letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
          }}>Program</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{title}</div>
        </div>
      </div>
    </Reveal>
  );
}

/* ─── Noise Texture Overlay ─────────────────────────────────────────────── */
function NoiseOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      opacity: 0.025,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: '200px 200px',
    }} />
  );
}

/* ─── Animated Grid Lines ────────────────────────────────────────────────── */
function GridLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#competitions', label: 'Competitions' },
    { href: '#programs', label: 'Programs' },
    { href: '#contact', label: 'Contact' },
  ];

  const stats = [
    { value: 2400, suffix: '+', label: 'Athletes Trained' },
    { value: 18, suffix: '', label: 'Years of Excellence' },
    { value: 140, suffix: '+', label: 'Tournaments Won' },
    { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  ];

  const aboutCards = [
    {
      icon: '🏀', title: 'Basketball Excellence',
      desc: 'Professional coaching and competitive leagues for all skill levels, from beginners to elite players.',
      accent: '#f97316',
    },
    {
      icon: '🏊', title: 'Swimming Academy',
      desc: 'Olympic-sized pool with certified instructors who craft personalized programs for every swimmer.',
      accent: '#38bdf8',
    },
    {
      icon: '💪', title: 'Multi-Sport Programs',
      desc: 'Football, tennis, and fitness programs designed to build champions in body and mind.',
      accent: '#34d399',
    },
  ];

  const competitions = [
    { icon: '🏆', title: 'League 2026', desc: 'Premier basketball tournament for U12-U18 athletes. Register now to secure your spot.', badge: 'Upcoming', color: '#f97316' },
    { icon: '🥇', title: 'Swim Championship', desc: 'Regional swimming competition bringing together the finest aquatic talent.', badge: 'Open', color: '#38bdf8' },
    { icon: '🎽', title: 'Multi-Sport Fest', desc: 'Our celebrated annual sports festival — a week of competition, community, and glory.', badge: 'Annual', color: '#a78bfa' },
  ];

  return (
    <div style={{ background: '#05050f', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <ScrollProgress />
      <CursorSpotlight />
      <NoiseOverlay />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
        background: scrolled ? 'rgba(5,5,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        padding: scrolled ? '0.75rem 0' : '1.25rem 0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff',
              boxShadow: '0 0 20px rgba(167,139,250,0.4)',
            }}>B</div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Bikram<span style={{ background: 'linear-gradient(90deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sports</span>
            </span>
          </div>

          {/* Desktop nav */}
          <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.25rem' }}>
            {navLinks.map(l => (
              <li key={l.href}>
                <a href={l.href} style={{
                  color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.875rem',
                  fontWeight: 500, padding: '0.5rem 0.875rem', borderRadius: 10, display: 'block',
                  transition: 'all 0.2s ease', letterSpacing: '0.01em',
                }}
                  onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.7)'; e.target.style.background = 'transparent'; }}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <MagneticBtn to="/register" style={{
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              color: '#fff', padding: '0.55rem 1.25rem', borderRadius: 12,
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.01em',
              boxShadow: '0 0 24px rgba(167,139,250,0.35)',
              transition: 'all 0.3s ease', border: 'none', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget && (e.currentTarget.style.boxShadow = '0 0 40px rgba(167,139,250,0.6)'); }}
            >Register</MagneticBtn>
            <MagneticBtn to="/admin/login" style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)',
              padding: '0.55rem 1.25rem', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '0.01em', cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}>Admin</MagneticBtn>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <video src={videoBg} autoPlay muted loop playsInline webkit-playsinline="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,5,15,0.65) 0%, rgba(5,5,15,0.4) 50%, rgba(5,5,15,0.95) 100%)', zIndex: 1 }} />
        <GridLines />
        <ParticleField />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', zIndex: 2, pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)', zIndex: 2, pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '0 1.5rem', maxWidth: 900, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '2rem',
            background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 100, padding: '0.4rem 1rem',
            animation: 'fadeSlideDown 0.8s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 10px #a78bfa', display: 'inline-block', animation: 'pulse 2s ease infinite' }} /> */}
            {/* <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Premier Sports Club Est. 2006</span> */}
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.04em', color: '#fff', margin: '0 0 1.5rem',
            animation: 'fadeSlideDown 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both',
          }}>
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>BikramSports</span>
            <br />Club
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'rgba(255,255,255,0.6)',
            maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7, fontWeight: 400,
            animation: 'fadeSlideDown 1s cubic-bezier(0.16,1,0.3,1) 0.2s both',
          }}>
            Your premier destination for excellence in basketball, swimming, and elite multi-sport programs. Forging champions since 2006.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeSlideDown 1.1s cubic-bezier(0.16,1,0.3,1) 0.3s both',
          }}>
            <MagneticBtn to="/register" style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              color: '#fff', padding: '1rem 2.5rem', borderRadius: 16,
              fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em',
              boxShadow: '0 0 40px rgba(167,139,250,0.4), 0 8px 32px rgba(124,58,237,0.3)',
              border: 'none', cursor: 'pointer', display: 'inline-block',
              transition: 'all 0.3s ease',
            }}>Get Started →</MagneticBtn>
            <MagneticBtn href="#about" style={{
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              padding: '1rem 2.5rem', borderRadius: 16, fontSize: '1rem', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.14)', letterSpacing: '-0.01em',
              cursor: 'pointer', display: 'inline-block', transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}>Explore Programs</MagneticBtn>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeSlideDown 1.3s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll to explore</span>
            <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(167,139,250,0.6), transparent)', animation: 'scrollLine 2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '4rem 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem' }}>
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem',
                }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: 'clamp(5rem,10vw,8rem) 0', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{ display: 'inline-block', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 100, padding: '0.35rem 1rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Who We Are</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 1rem', lineHeight: 1.1 }}>
                Built for{' '}
                <span style={{ background: 'linear-gradient(135deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Champions</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontSize: '1.05rem' }}>
                Two decades of building athletes, forging discipline, and creating champions across every discipline we touch.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {aboutCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 120}>
                <GlassCard>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${card.accent}18`, border: `1px solid ${card.accent}30`,
                    fontSize: '1.5rem', marginBottom: '1.25rem',
                    boxShadow: `0 0 24px ${card.accent}20`,
                  }}>{card.icon}</div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>{card.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>{card.desc}</p>
                  <div style={{ marginTop: '1.5rem', width: 40, height: 2, background: `linear-gradient(90deg, ${card.accent}, transparent)`, borderRadius: 2 }} />
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETITIONS ── */}
      <section id="competitions" style={{ padding: 'clamp(5rem,10vw,8rem) 0', background: 'rgba(255,255,255,0.015)', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(167,139,250,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', position: 'relative' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{ display: 'inline-block', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 100, padding: '0.35rem 1rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Compete</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 1rem', lineHeight: 1.1 }}>
                Upcoming{' '}
                <span style={{ background: 'linear-gradient(135deg,#38bdf8,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Competitions</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Register now and compete on the grandest stages. Your moment of glory awaits.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
            {competitions.map((comp, i) => (
              <Reveal key={comp.title} delay={i * 130}>
                <GlassCard style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Top accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${comp.color}, transparent)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${comp.color}15`, border: `1px solid ${comp.color}25`, fontSize: '1.5rem',
                    }}>{comp.icon}</div>
                    <span style={{
                      background: `${comp.color}20`, border: `1px solid ${comp.color}40`,
                      color: comp.color, borderRadius: 100, padding: '0.25rem 0.75rem',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{comp.badge}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>{comp.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 1.5rem', fontSize: '0.9rem' }}>{comp.desc}</p>
                  <TransitionLink to="/register" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: comp.color, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
                    letterSpacing: '0.01em', transition: 'gap 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.gap = '10px'; }}
                    onMouseLeave={e => { e.currentTarget.style.gap = '6px'; }}>
                    Register Now <span>→</span>
                  </TransitionLink>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section id="programs" style={{ padding: 'clamp(5rem,10vw,8rem) 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div style={{ display: 'inline-block', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 100, padding: '0.35rem 1rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Programs</div>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 1rem', lineHeight: 1.1 }}>
                World-Class{' '}
                <span style={{ background: 'linear-gradient(135deg,#34d399,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Training</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>From grassroots to elite performance — we have a program sculpted for your journey.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
            <ProgramCard img={basketball} title="Youth Basketball" delay={0} />
            <ProgramCard img={swimming} title="Swim Training" delay={80} />
            <ProgramCard img={gym} title="Fitness & Conditioning" delay={160} />
            <ProgramCard img={chatImage1} title="Elite Coaching" delay={240} />
            <ProgramCard img={chatImage2} title="Tournaments" delay={320} />
            <ProgramCard img={chatImage3} title="World-Class Facilities" delay={400} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" style={{
        padding: 'clamp(5rem,10vw,8rem) 0', position: 'relative', overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Animated gradient bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(124,58,237,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '30%', left: '20%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(60px)',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 2rem', textAlign: 'center', position: 'relative' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 100, padding: '0.4rem 1rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6ee7b7', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Open for Enrollment</span>
            </div>
            <h2 style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em',
              color: '#fff', margin: '0 0 1rem', lineHeight: 1.1,
            }}>
              Ready to Start Your<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa 0%,#38bdf8 50%,#34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Championship Journey?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 2.5rem' }}>
              Join thousands of athletes who chose BikramSports to unlock their true potential. Your future starts here.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <MagneticBtn to="/register" style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: '#fff', padding: '1.1rem 3rem', borderRadius: 16,
                fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em',
                boxShadow: '0 0 60px rgba(167,139,250,0.4), 0 12px 40px rgba(124,58,237,0.3)',
                border: 'none', cursor: 'pointer', display: 'inline-block',
              }}>Register as Athlete →</MagneticBtn>
              <MagneticBtn to="/admin/login" style={{
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)',
                padding: '1.1rem 2.5rem', borderRadius: 16, fontSize: '1rem', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.12)', letterSpacing: '-0.01em',
                cursor: 'pointer', display: 'inline-block', backdropFilter: 'blur(10px)',
              }}>Admin Portal</MagneticBtn>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
        padding: '3rem 0 2rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: '#fff',
              }}>B</div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>BikramSports</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {navLinks.map(l => (
                <a key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.4)'; }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', margin: 0 }}>© 2026 BikramSports Club. All rights reserved.</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', margin: 0 }}>Excellence · Discipline · Glory</p>
          </div>
        </div>
      </footer>

      <Chatbot />

      {/* ── Global keyframes injected inline ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes scrollLine {
          0% { opacity: 0; transform: scaleY(0); transform-origin: top; }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scaleY(1); transform-origin: top; }
        }

        html { scroll-behavior: smooth; }

        @media (max-width: 768px) {
          nav ul { display: none !important; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #05050f; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.4); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.7); }
      `}</style>
    </div>
  );
};

export default LandingPage;