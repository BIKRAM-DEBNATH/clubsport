export default function Step2Guardian({ formData, update, errors, isMinor }) {
  return (
    <div>
      {isMinor ? (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          ⚠️ Athlete is under 18 years old. Guardian details and parent consent are <strong>required</strong>.
        </div>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          ℹ️ Guardian details are optional for athletes 18 years and above.
        </div>
      )}

      <div className="form-grid">
        <div>
          <label className={isMinor ? 'required' : ''}>Guardian / Parent Name</label>
          <input value={formData.guardianName} onChange={e => update({ guardianName: e.target.value })}
            placeholder="Full name of guardian" />
          {errors.guardianName && <p className="error-msg">{errors.guardianName}</p>}
        </div>
        <div>
          <label className={isMinor ? 'required' : ''}>Relationship</label>
          <select value={formData.guardianRelation} onChange={e => update({ guardianRelation: e.target.value })}>
            <option value="">Select relation</option>
            <option>Father</option><option>Mother</option>
            <option>Legal Guardian</option><option>Spouse</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className={isMinor ? 'required' : ''}>Guardian Mobile</label>
          <input value={formData.guardianMobile} onChange={e => update({ guardianMobile: e.target.value })}
            placeholder="10-digit mobile" maxLength={10} />
          {errors.guardianMobile && <p className="error-msg">{errors.guardianMobile}</p>}
        </div>
        <div>
          <label>Guardian Email</label>
          <input type="email" value={formData.guardianEmail} onChange={e => update({ guardianEmail: e.target.value })}
            placeholder="guardian@email.com" />
        </div>

        {isMinor && (
          <div className="col-span-2" style={{ marginTop: 8 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12, color: 'var(--accent)' }}>
                📋 Parent / Guardian Consent
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
                I, the parent/guardian of the above-mentioned athlete, hereby give my consent for participation in all sports events and activities under the Sports Federation of India. I understand the risks involved and authorize the use of the athlete's information for registration purposes.
              </p>
              <label className="checkbox-wrap">
                <input type="checkbox" checked={formData.parentConsentGiven}
                  onChange={e => update({ parentConsentGiven: e.target.checked })} />
                <span style={{ color: 'var(--text)', fontSize: 13 }}>
                  <strong>I give my consent</strong> as parent/guardian for the above athlete to participate in sports events.
                </span>
              </label>
              {isMinor && !formData.parentConsentGiven && (
                <p className="error-msg" style={{ marginTop: 8 }}>Parent consent is required for athletes under 18.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
