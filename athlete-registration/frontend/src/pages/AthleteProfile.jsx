import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function AthleteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/athlete/${id}`)
      .then(res => { setAthlete(res.data); setRemarks(res.data.adminRemarks || ''); })
      .catch(() => navigate('/admin/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status) {
    setUpdating(true);
    setMsg('');
    try {
      const res = await api.put(`/admin/status-update/${id}`, { status, adminRemarks: remarks });
      setAthlete(res.data.athlete);
      setMsg(`✅ Status updated to ${status}`);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Update failed'));
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!athlete) return null;

  const docs = athlete.documents || {};

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-secondary btn-sm" onClick={() => navigate('/admin/dashboard')}>← Back</button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)', letterSpacing: 1 }}>
                {athlete.firstName} {athlete.lastName}
              </h1>
              <p style={{ color: 'var(--text3)', fontSize: 12 }}>Reg: <code style={{ color: 'var(--accent)' }}>{athlete.registrationNumber}</code></p>
            </div>
          </div>
          <span className={`badge badge-${athlete.status?.toLowerCase()}`} style={{ fontSize: 13, padding: '6px 16px' }}>
            {athlete.status}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section title="Personal Details" icon="👤">
            <Grid>
              <Field label="First Name" value={athlete.firstName} />
              <Field label="Last Name" value={athlete.lastName} />
              <Field label="Date of Birth" value={new Date(athlete.dob).toLocaleDateString('en-IN')} />
              <Field label="Age / Age Group" value={`${athlete.age} yrs — ${athlete.ageGroup}`} />
              <Field label="Gender" value={athlete.gender} />
              <Field label="Blood Group" value={athlete.bloodGroup} />
              <Field label="Mobile" value={athlete.mobile} />
              <Field label="Email" value={athlete.email} />
              <Field label="Nationality" value={athlete.nationality} />
            </Grid>
          </Section>

          {(athlete.guardianName || athlete.age < 18) && (
            <Section title="Guardian Details" icon="👪">
              <Grid>
                <Field label="Guardian Name" value={athlete.guardianName} />
                <Field label="Relation" value={athlete.guardianRelation} />
                <Field label="Guardian Mobile" value={athlete.guardianMobile} />
                <Field label="Guardian Email" value={athlete.guardianEmail} />
                <Field label="Consent Given" value={athlete.parentConsentGiven ? '✅ Yes' : '❌ No'} />
              </Grid>
            </Section>
          )}

          <Section title="Address" icon="📍">
            <Grid>
              <Field label="Address Line 1" value={athlete.addressLine1} />
              <Field label="Address Line 2" value={athlete.addressLine2} />
              <Field label="City" value={athlete.city} />
              <Field label="State" value={athlete.state} />
              <Field label="PIN Code" value={athlete.pincode} />
              <Field label="Country" value={athlete.country} />
            </Grid>
          </Section>

          <Section title="Club / Representation" icon="🏃">
            <Grid>
              <Field label="Club Name" value={athlete.clubName} />
              <Field label="Club Code" value={athlete.clubCode} />
              <Field label="Coach Name" value={athlete.coachName} />
              <Field label="Coach Mobile" value={athlete.coachMobile} />
              <Field label="Representing State" value={athlete.representingState} />
              <Field label="Representing District" value={athlete.representingDistrict} />
            </Grid>
          </Section>

          <Section title="Competition" icon="🏆">
            <Grid>
              <Field label="Category" value={athlete.category} />
              <Field label="Event Type" value={athlete.eventType} />
              <Field label="Team Name" value={athlete.teamName} />
            </Grid>
            {athlete.competitions?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {athlete.competitions.map(c => (
                  <span key={c} style={{ background: 'rgba(0,200,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {athlete.hasInsurance && (
            <Section title="Insurance" icon="🛡️">
              <Grid>
                <Field label="Provider" value={athlete.insuranceProvider} />
                <Field label="Policy No." value={athlete.insurancePolicyNo} />
                <Field label="Expiry" value={athlete.insuranceExpiry ? new Date(athlete.insuranceExpiry).toLocaleDateString('en-IN') : '—'} />
              </Grid>
            </Section>
          )}

          {/* Documents */}
          <Section title="Documents" icon="📄">
            {athlete.missingDocuments?.length > 0 && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                ⚠️ Missing documents: {athlete.missingDocuments.join(', ')}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {Object.entries({
                photo: 'Passport Photo', aadhaar: 'Aadhaar Card',
                birthCertificate: 'Birth Certificate', addressProof: 'Address Proof',
                clubLetter: 'Club Letter', parentConsent: 'Parent Consent'
              }).map(([key, label]) => {
                const url = docs[key];
                const isPdf = url?.endsWith('.pdf');
                return (
                  <div key={key} style={{ background: 'var(--bg2)', border: `1px solid ${url ? 'var(--accent2)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: 12, textAlign: 'center' }}>
                    {url ? (
                      <>
                        {isPdf ? (
                          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        ) : (
                          <img src={url} alt={label} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
                        )}
                        <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>{label}</p>
                        <a href={url} download target="_blank" rel="noreferrer">
                          <button className="btn-secondary btn-sm" style={{ width: '100%', fontSize: 11 }}>⬇️ Download</button>
                        </a>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📎</div>
                        <p style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</p>
                        <p style={{ fontSize: 10, color: 'var(--red)', marginTop: 4 }}>Not uploaded</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status update */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16, color: 'var(--text)' }}>Update Status</h3>
            <div style={{ marginBottom: 16 }}>
              <label>Admin Remarks</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Add remarks or reason..." rows={4}
                style={{ resize: 'vertical' }} />
            </div>
            {msg && <p style={{ fontSize: 13, color: msg.startsWith('✅') ? 'var(--green)' : 'var(--red)', marginBottom: 12 }}>{msg}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-success" onClick={() => updateStatus('Approved')} disabled={updating || athlete.status === 'Approved'}>
                ✅ Approve
              </button>
              <button className="btn-danger" onClick={() => updateStatus('Rejected')} disabled={updating || athlete.status === 'Rejected'}>
                ❌ Reject
              </button>
              <button className="btn-secondary" onClick={() => updateStatus('Pending')} disabled={updating || athlete.status === 'Pending'}>
                ⏳ Set Pending
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12, color: 'var(--text)' }}>Registration Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Reg. Number" value={athlete.registrationNumber} />
              <Field label="Registered On" value={new Date(athlete.createdAt).toLocaleString('en-IN')} />
              <Field label="Payment Status" value={athlete.paymentStatus} />
              <Field label="Declaration" value={athlete.declarationAccepted ? '✅ Accepted' : '❌ Not accepted'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5 }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>{children}</div>;
}

function Field({ label, value }) {
  return (
    <div>
      <p style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text)', fontSize: 13 }}>{value || '—'}</p>
    </div>
  );
}
