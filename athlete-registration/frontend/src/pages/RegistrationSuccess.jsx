import { useParams, Link } from 'react-router-dom';

export default function RegistrationSuccess() {
  const { regNo } = useParams();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
        {/* Animated check */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(0,230,118,0.15)', border: '3px solid var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px', fontSize: 48,
          boxShadow: '0 0 40px rgba(0,230,118,0.3)',
          animation: 'fadeIn 0.5s ease',
        }}>
          ✅
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--green)', letterSpacing: 2, marginBottom: 12 }}>
          REGISTRATION SUCCESSFUL!
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32 }}>
          Your athlete registration has been submitted successfully and is pending review by the admin.
        </p>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, marginBottom: 32 }}>
          <p style={{ color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.08, marginBottom: 8 }}>Registration Number</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', letterSpacing: 4 }}>{regNo}</p>
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 12 }}>Please save this number for future reference.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <InfoCard icon="📧" text="You will receive a confirmation email shortly." />
          <InfoCard icon="⏳" text="Admin review takes 2–5 working days." />
          <InfoCard icon="📄" text="Ensure all documents are uploaded via the form." />
          <InfoCard icon="📞" text="Contact us for queries with your reg. number." />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary">← Register Another</button>
          </Link>
          <Link to="/admin/login" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">Admin Login →</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, text }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, textAlign: 'left' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 8 }}>{text}</p>
    </div>
  );
}
