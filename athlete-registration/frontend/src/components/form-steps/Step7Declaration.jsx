export default function Step7Declaration({ formData, update, errors }) {
  return (
    <div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', marginBottom: 16, letterSpacing: 1 }}>
          DECLARATION & UNDERTAKING
        </h3>
        <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.9 }}>
          <p style={{ marginBottom: 12 }}>I, <strong style={{ color: 'var(--text)' }}>{formData.firstName} {formData.lastName}</strong>, hereby declare that:</p>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>All the information provided in this registration form is true, correct, and complete to the best of my knowledge.</li>
            <li>I am eligible to participate in the selected events as per the rules and regulations of the Sports Federation of India.</li>
            <li>I have not been banned, suspended, or disqualified from any sports event or federation.</li>
            <li>I agree to abide by the rules, regulations, and code of conduct set by the Sports Federation of India.</li>
            <li>I understand that submission of false or misleading information may result in immediate disqualification and legal action.</li>
            <li>I give consent for my photographs and performance data to be used for official sports promotion purposes.</li>
            <li>I agree to undergo anti-doping tests as required by the federation.</li>
            <li>I accept that the federation's decision in all matters related to this registration shall be final and binding.</li>
          </ol>
        </div>
      </div>

      {/* Insurance Section */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', marginBottom: 16, letterSpacing: 1 }}>
          INSURANCE INFORMATION
        </h3>
        <label className="checkbox-wrap" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={formData.hasInsurance}
            onChange={e => update({ hasInsurance: e.target.checked })} />
          <span style={{ color: 'var(--text)', fontSize: 13 }}>I have valid sports/accident insurance coverage</span>
        </label>

        {formData.hasInsurance && (
          <div className="form-grid fade-in">
            <div>
              <label className="required">Insurance Provider</label>
              <input value={formData.insuranceProvider} onChange={e => update({ insuranceProvider: e.target.value })}
                placeholder="e.g., LIC, HDFC Ergo" />
            </div>
            <div>
              <label className="required">Policy Number</label>
              <input value={formData.insurancePolicyNo} onChange={e => update({ insurancePolicyNo: e.target.value })}
                placeholder="Policy / Certificate number" />
            </div>
            <div className="col-span-2">
              <label className="required">Insurance Expiry Date</label>
              <input type="date" value={formData.insuranceExpiry}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => update({ insuranceExpiry: e.target.value })} />
              {formData.insuranceExpiry && new Date(formData.insuranceExpiry) <= new Date() && (
                <p className="error-msg">⚠️ Insurance expiry must be a future date</p>
              )}
              {formData.insuranceExpiry && new Date(formData.insuranceExpiry) > new Date() && (
                <p className="success-msg">✅ Insurance is valid</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Final consent checkbox */}
      <div style={{ background: 'rgba(0,200,255,0.05)', border: '1.5px solid rgba(0,200,255,0.3)', borderRadius: 'var(--radius)', padding: 20 }}>
        <label className="checkbox-wrap">
          <input type="checkbox" checked={formData.declarationAccepted}
            onChange={e => update({ declarationAccepted: e.target.checked })} />
          <span style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>
            <strong>I have read and agree</strong> to the above declaration and undertaking. I confirm that all information provided is accurate and I accept the terms and conditions of the Sports Federation of India.
          </span>
        </label>
        {errors.declarationAccepted && <p className="error-msg" style={{ marginTop: 8 }}>{errors.declarationAccepted}</p>}
      </div>
    </div>
  );
}
