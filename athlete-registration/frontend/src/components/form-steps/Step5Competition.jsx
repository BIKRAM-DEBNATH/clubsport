import { COMPETITIONS } from '../../utils/validators';

export default function Step5Competition({ formData, update, errors, ageGroup }) {
  function toggleCompetition(comp) {
    const list = formData.competitions || [];
    if (list.includes(comp)) {
      update({ competitions: list.filter(c => c !== comp) });
    } else {
      update({ competitions: [...list, comp] });
    }
  }

  return (
    <div>
      {ageGroup && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          🏆 Age Group: <strong>{ageGroup}</strong> — You will compete in the appropriate category.
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: 24 }}>
        <div>
          <label>Category</label>
          <select value={formData.category} onChange={e => update({ category: e.target.value })}>
            <option value="">Select category</option>
            <option>Track Events</option>
            <option>Field Events</option>
            <option>Road Events</option>
            <option>Combined Events</option>
          </select>
          {errors.category && <p className="error-msg" style={{ marginTop: 6 }}>{errors.category}</p>}
        </div>
        <div>
          <label>Event Type</label>
          <select value={formData.eventType} onChange={e => update({ eventType: e.target.value })}>
            <option value="">Select type</option>
            <option>Individual</option>
            <option>Team</option>
            <option>Both</option>
          </select>
          {errors.eventType && <p className="error-msg" style={{ marginTop: 6 }}>{errors.eventType}</p>}
        </div>
        {(formData.eventType === 'Team' || formData.eventType === 'Both') && (
          <div className="col-span-2">
            <label>Team Name</label>
            <input value={formData.teamName} onChange={e => update({ teamName: e.target.value })}
              placeholder="Name of your team" />
            {errors.teamName && <p className="error-msg" style={{ marginTop: 6 }}>{errors.teamName}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="required" style={{ marginBottom: 12 }}>
          Select Competitions (select all that apply)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {COMPETITIONS.map(comp => {
            const selected = formData.competitions?.includes(comp);
            return (
              <div key={comp} onClick={() => toggleCompetition(comp)}
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'rgba(0,200,255,0.1)' : 'var(--bg2)',
                  color: selected ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: selected ? 600 : 400,
                  fontSize: 13,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <span style={{ fontSize: 16 }}>{selected ? '✅' : '⬜'}</span>
                {comp}
              </div>
            );
          })}
        </div>
        {formData.competitions?.length > 0 && (
          <p className="success-msg" style={{ marginTop: 12 }}>
            {formData.competitions.length} event(s) selected
          </p>
        )}
        {errors.competitions && <p className="error-msg">{errors.competitions}</p>}
      </div>
    </div>
  );
}
