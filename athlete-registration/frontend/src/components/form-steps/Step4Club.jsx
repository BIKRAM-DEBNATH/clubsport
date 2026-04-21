import { STATES } from '../../utils/validators';

export default function Step4Club({ formData, update, errors }) {
  return (
    <div className="form-grid">
      <div>
        <label>Club / Academy Name</label>
        <input value={formData.clubName} onChange={e => update({ clubName: e.target.value })}
          placeholder="Name of your club / academy" />
      </div>
      <div>
        <label>Club Code</label>
        <input value={formData.clubCode} onChange={e => update({ clubCode: e.target.value })}
          placeholder="Club registration code (if any)" />
      </div>
      <div>
        <label>Coach Name</label>
        <input value={formData.coachName} onChange={e => update({ coachName: e.target.value })}
          placeholder="Your coach's full name" />
      </div>
      <div>
        <label>Coach Mobile</label>
        <input value={formData.coachMobile} onChange={e => update({ coachMobile: e.target.value })}
          placeholder="Coach contact number" maxLength={10} />
      </div>
      <div>
        <label>Representing State</label>
        <select value={formData.representingState} onChange={e => update({ representingState: e.target.value })}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label>Representing District</label>
        <input value={formData.representingDistrict} onChange={e => update({ representingDistrict: e.target.value })}
          placeholder="District name" />
      </div>

      <div className="col-span-2">
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, marginTop: 8 }}>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>
            💡 If you are an independent athlete not affiliated with any club, you may leave club fields blank. You will still be able to compete as an individual.
          </p>
        </div>
      </div>
    </div>
  );
}
