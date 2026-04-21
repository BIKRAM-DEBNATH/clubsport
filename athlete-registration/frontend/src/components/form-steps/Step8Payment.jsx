export default function Step8Payment({ formData, onSubmit, loading, errors }) {
  const fee = formData.registrationFee || 500;

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        💡 Payment gateway integration coming soon. Click <strong>Submit Registration</strong> to complete your registration. Payment can be made later.
      </div>

      {/* Summary */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', marginBottom: 16, letterSpacing: 1 }}>
          REGISTRATION SUMMARY
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <SummaryRow label="Full Name" value={`${formData.firstName} ${formData.lastName}`} />
          <SummaryRow label="Email" value={formData.email} />
          <SummaryRow label="Mobile" value={formData.mobile} />
          <SummaryRow label="Gender" value={formData.gender} />
          <SummaryRow label="Date of Birth" value={formData.dob} />
          <SummaryRow label="Age Group" value={formData.ageGroup || 'Auto-calculated'} />
          <SummaryRow label="State" value={formData.state} />
          <SummaryRow label="Club" value={formData.clubName || 'Independent'} />
          <div style={{ gridColumn: 'span 2' }}>
            <SummaryRow label="Competitions" value={formData.competitions?.join(', ') || 'Not selected'} />
          </div>
        </div>
      </div>

      {/* Payment card (UI only) */}
      <div style={{ background: 'linear-gradient(135deg, #1a2235, #0f1525)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text)', marginBottom: 20, letterSpacing: 1 }}>
          💳 PAYMENT DETAILS
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text2)' }}>Registration Fee</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', fontWeight: 700 }}>₹{fee}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: 'var(--text2)' }}>GST (18%)</span>
          <span style={{ color: 'var(--text2)' }}>₹{Math.round(fee * 0.18)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>Total Amount</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', fontWeight: 700 }}>₹{fee + Math.round(fee * 0.18)}</span>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ marginBottom: 12 }}>Payment Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['UPI / QR Code', 'Net Banking', 'Credit / Debit Card'].map(m => (
              <div key={m} style={{
                padding: '12px 10px', borderRadius: 8, border: '1.5px solid var(--border)',
                textAlign: 'center', color: 'var(--text3)', fontSize: 12, fontWeight: 600,
                opacity: 0.5, cursor: 'not-allowed'
              }}>
                {m === 'UPI / QR Code' ? '📱' : m === 'Net Banking' ? '🏦' : '💳'} {m}
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 11, textAlign: 'center', marginTop: 10 }}>Payment gateway coming soon</p>
        </div>
      </div>

      {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>By submitting, you confirm your declaration and registration details are correct.</p>
        </div>
        <button className="btn-primary" onClick={onSubmit} disabled={loading || !formData.declarationAccepted}
          style={{ minWidth: 200, padding: '14px 32px', fontSize: 16 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="loader" style={{ width: 16, height: 16 }} /> Submitting...
            </span>
          ) : '🚀 Submit Registration'}
        </button>
      </div>
      {!formData.declarationAccepted && (
        <p className="error-msg" style={{ textAlign: 'right', marginTop: 8 }}>Please accept the declaration in Step 7 to proceed.</p>
      )}
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <p style={{ color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{value || '—'}</p>
    </div>
  );
}
