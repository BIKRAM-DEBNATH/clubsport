import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import footballImg from '../assets/football.png';

const Ctx = createContext(null);

export function useTransition() { return useContext(Ctx); }

export function useTransitionNavigate() {
  const t = useTransition();
  return useCallback((path) => t(path), [t]);
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER — wraps the app inside <Router>
   ═══════════════════════════════════════════════════════════════ */

export function TransitionProvider({ children }) {
  const [overlay, setOverlay] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const lock = useRef(false);

  const trigger = useCallback((path) => {
    if (lock.current) return;
    if (path === location.pathname) return;
    lock.current = true;
    setOverlay({ path });
  }, [location]);

  const done = useCallback(() => {
    lock.current = false;
    setOverlay(null);
  }, []);

  return (
    <Ctx.Provider value={trigger}>
      {children}
      <AnimatePresence>
        {overlay && (
          <Overlay
            key="football-overlay"
            path={overlay.path}
            onGo={() => navigate(overlay.path)}
            onDone={done}
          />
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRANSITION LINK — drop-in <Link> replacement
   ═══════════════════════════════════════════════════════════════ */

export function TransitionLink({ to, children, style, className, onClick, replace, ...rest }) {
  const trigger = useTransition();
  return (
    <Link
      to={to}
      className={className}
      style={{ textDecoration: 'none', cursor: 'pointer', ...style }}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        trigger(to);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   OVERLAY — phase orchestrator
   ═══════════════════════════════════════════════════════════════ */

/*
  Timeline (ms):
    0      darken
    150    stadium lights + particles
    400    footballer enters from right
    700    footballer kicks (leg swing + body lean)
    950    ball appears at foot, launches toward camera
    1350   ball fills screen + flash
    1400   ◀ route navigation fires
    1500   solid cover ensures no page peek
    1650   reveal — cover fades out
    2200   done
*/

function Overlay({ path, onGo, onDone }) {
  const [phase, setPhase] = useState(0);
  const went = useRef(false);

  useEffect(() => {
    const T = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 700),
      setTimeout(() => setPhase(4), 950),
      setTimeout(() => setPhase(5), 1350),
      setTimeout(() => {
        if (!went.current) { went.current = true; onGo(); }
      }, 1400),
      setTimeout(() => setPhase(6), 1650),
      setTimeout(() => onDone(), 2200),
    ];
    return () => T.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
      style={S.root}
    >
      {/* Dark layer */}
      <motion.div
        animate={{ opacity: phase < 6 ? [0, 0.93] : [0.93, 0] }}
        transition={{ duration: 0.45 }}
        style={S.dark}
      />

      {/* Solid cover during route swap (prevents page peek) */}
      {phase >= 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 6 ? [1, 0] : [0, 1] }}
          transition={{ duration: phase >= 6 ? 0.5 : 0.15 }}
          style={S.cover}
        />
      )}

      {phase >= 1 && phase < 6 && <StadiumLights />}
      {phase >= 1 && phase < 6 && <ParticleStreaks />}
      {phase >= 2 && phase < 5 && <Footballer phase={phase} />}
      {phase >= 4 && <Ball phase={phase} />}

      {/* Camera flash */}
      {phase === 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.3 }}
          style={S.flash}
        />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STADIUM LIGHTS
   ═══════════════════════════════════════════════════════════════ */

function StadiumLights() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.65, 0.3], scale: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          position: 'absolute', top: '-12%', left: '5%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,140,0.45) 0%, transparent 65%)',
          filter: 'blur(35px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.5, 0.25], scale: 1 }}
        transition={{ duration: 0.7, delay: 0.08 }}
        style={{
          position: 'absolute', top: '-8%', right: '3%',
          width: '38vw', height: '38vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,170,255,0.4) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0.15] }}
        transition={{ duration: 0.6, delay: 0.14 }}
        style={{
          position: 'absolute', bottom: '5%', left: '25%',
          width: '50vw', height: '35vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(180,255,180,0.18) 0%, transparent 60%)',
          filter: 'blur(25px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, rotate: -25 }}
        animate={{ opacity: [0, 0.12, 0], rotate: 35 }}
        transition={{ duration: 1.4, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: '15%',
          width: '70vw', height: '130vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
          transformOrigin: 'top center',
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PARTICLE STREAKS
   ═══════════════════════════════════════════════════════════════ */

function ParticleStreaks() {
  const dots = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      dur: 0.7 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2.5,
    })), []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
      {dots.map(d => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, x: `${d.x}vw`, y: '105vh' }}
          animate={{ opacity: [0, 0.6, 0], y: '-10vh' }}
          transition={{ duration: d.dur, delay: d.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: d.size,
            height: d.size * 7,
            borderRadius: d.size,
            background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.45), transparent)',
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTBALLER SILHOUETTE
   ═══════════════════════════════════════════════════════════════ */

function Footballer({ phase }) {
  const kicking = phase >= 3;

  return (
    <motion.div
      initial={{ x: '110vw', opacity: 0 }}
      animate={{
        x: kicking ? '50vw' : ['110vw', '56vw'],
        y: kicking ? ['0px', '12px'] : '0px',
        rotate: kicking ? [0, -6] : 0,
        scale: kicking ? [1, 1.04] : [0.85, 1],
        opacity: phase >= 4 ? [1, 0] : [0, 1],
      }}
      transition={{
        x: { duration: kicking ? 0.28 : 0.55, ease: kicking ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1] },
        y: { duration: 0.28 },
        rotate: { duration: 0.28, ease: [0.7, 0, 0.3, 1] },
        scale: { duration: 0.28 },
        opacity: { duration: 0.25 },
      }}
      style={{
        position: 'absolute',
        bottom: '12vh',
        width: 180,
        height: 280,
        zIndex: 10,
        filter: 'drop-shadow(0 0 50px rgba(0,200,255,0.18)) drop-shadow(0 0 100px rgba(0,100,200,0.08))',
        willChange: 'transform, opacity',
      }}
    >
      <svg viewBox="0 0 200 300" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="pG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#151525" />
            <stop offset="100%" stopColor="#0a0a14" />
          </linearGradient>
        </defs>
        <g>
          {/* Head */}
          <circle cx="100" cy="30" r="16" fill="url(#pG)" />
          {/* Torso */}
          <path d="M84,46 L116,46 L112,138 L88,138 Z" fill="url(#pG)" />
          {/* Jersey stripe */}
          <rect x="88" y="68" width="24" height="4" rx="2" fill="rgba(100,180,255,0.08)" />
          {/* Left arm — forward balance */}
          <path d="M84,56 C68,74 48,88 32,100" stroke="url(#pG)" strokeWidth="11" strokeLinecap="round" fill="none" />
          {/* Right arm — back balance */}
          <path d="M116,56 C132,70 150,80 164,94" stroke="url(#pG)" strokeWidth="11" strokeLinecap="round" fill="none" />
          {/* Left leg — planted */}
          <path d="M92,138 L78,205 L70,232" stroke="url(#pG)" strokeWidth="13" strokeLinecap="round" fill="none" />
          {/* Left foot */}
          <path d="M70,232 L52,238" stroke="url(#pG)" strokeWidth="9" strokeLinecap="round" fill="none" />
          {/* Shorts line */}
          <path d="M88,110 L112,110" stroke="rgba(255,255,255,0.04)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Kicking right leg — animated separately */}
        <g style={{ transformOrigin: '108px 138px' }}>
          <g
            style={{
              transformOrigin: '108px 138px',
              transform: `rotate(${kicking ? 40 : -18}deg)`,
              transition: 'transform 0.32s cubic-bezier(0.22, 0, 0.36, 1)',
            }}
          >
            <path d="M108,138 L138,170 L170,180" stroke="url(#pG)" strokeWidth="13" strokeLinecap="round" fill="none" />
            <path d="M170,180 L192,183" stroke="url(#pG)" strokeWidth="9" strokeLinecap="round" fill="none" />
          </g>
        </g>

        {/* Edge highlight */}
        <g opacity="0.1" stroke="rgba(100,180,255,0.35)" strokeWidth="1" fill="none">
          <circle cx="100" cy="30" r="17" />
          <path d="M84,46 L116,46 L112,138 L88,138 Z" />
        </g>
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTBALL — with launch, scale, and reveal animation
   ═══════════════════════════════════════════════════════════════ */

function Ball({ phase }) {
  return (
    <motion.div
      initial={{ x: '58vw', y: '60vh', scale: 0, rotate: 0, opacity: 0 }}
      animate={
        phase === 4
          ? { x: '50vw', y: '50vh', scale: [0, 1.8, 3.5], rotate: [0, 240], opacity: 1 }
          : phase === 5
          ? { x: '50vw', y: '50vh', scale: [3.5, 40], rotate: [240, 720], opacity: 1 }
          : phase === 6
          ? { x: '50vw', y: '50vh', scale: 40, rotate: 720, opacity: [1, 0] }
          : {}
      }
      transition={{
        duration: phase === 4 ? 0.4 : phase === 5 ? 0.2 : 0.55,
        ease: phase === 4 ? [0.16, 1, 0.3, 1] : phase === 5 ? [0.7, 0, 0.3, 1] : [0.16, 1, 0.3, 1],
      }}
      style={{
        position: 'absolute',
        width: 90,
        height: 90,
        marginLeft: -45,
        marginTop: -45,
        zIndex: 20,
        pointerEvents: 'none',
        filter: phase === 4 ? 'blur(1.5px)' : 'blur(0px)',
        willChange: 'transform, opacity',
      }}
    >
      <img src={footballImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

      {/* Motion blur trails during launch */}
      {phase === 4 && (
        <>
          <motion.div
            animate={{ opacity: [0.35, 0], scale: [0.7, 1.4] }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'absolute', inset: -12,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)',
              filter: 'blur(10px)',
            }}
          />
          <motion.div
            animate={{ opacity: [0.2, 0], scale: [0.5, 1.8] }}
            transition={{ duration: 0.35, delay: 0.04 }}
            style={{
              position: 'absolute', inset: -22,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,220,255,0.1), transparent 70%)',
              filter: 'blur(14px)',
            }}
          />
        </>
      )}

      {/* Dynamic shadow under ball */}
      {(phase === 4) && (
        <motion.div
          animate={{ opacity: [0, 0.25], scaleX: [1, 2.5] }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute', bottom: -18, left: '50%',
            transform: 'translateX(-50%)',
            width: 70, height: 14, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            filter: 'blur(10px)',
          }}
        />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLE CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const S = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 100000,
    pointerEvents: 'all',
    overflow: 'hidden',
    isolation: 'isolate',
  },
  dark: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 60% 55%, rgba(0,15,30,0.96), rgba(0,0,0,0.99))',
    zIndex: 1,
  },
  cover: {
    position: 'absolute',
    inset: 0,
    background: '#05060f',
    zIndex: 15,
  },
  flash: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,1), rgba(200,225,255,0.5) 40%, transparent 72%)',
    zIndex: 30,
  },
};
