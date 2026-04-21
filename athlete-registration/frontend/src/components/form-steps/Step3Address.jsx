import { useEffect } from 'react';
import { getStateFromPin, STATES } from '../../utils/validators';

export default function Step3Address({ formData, update, errors }) {
  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      const state = getStateFromPin(formData.pincode);
      if (state) update({ state });
    }
  }, [formData.pincode]);

  return (
    <div className="form-grid">
      <div className="col-span-2">
        <label className="required">Address Line 1</label>
        <input value={formData.addressLine1} onChange={e => update({ addressLine1: e.target.value })}
          placeholder="House No., Street, Area" />
        {errors.addressLine1 && <p className="error-msg">{errors.addressLine1}</p>}
      </div>
      <div className="col-span-2">
        <label>Address Line 2</label>
        <input value={formData.addressLine2} onChange={e => update({ addressLine2: e.target.value })}
          placeholder="Landmark, Colony (optional)" />
      </div>
      <div>
        <label className="required">PIN Code</label>
        <input value={formData.pincode} onChange={e => update({ pincode: e.target.value })}
          placeholder="6-digit PIN" maxLength={6} />
        {formData.pincode && formData.pincode.length === 6 && getStateFromPin(formData.pincode) && (
          <p className="success-msg">📍 State auto-detected: {getStateFromPin(formData.pincode)}</p>
        )}
        {errors.pincode && <p className="error-msg">{errors.pincode}</p>}
      </div>
      <div>
        <label className="required">City</label>
        <input value={formData.city} onChange={e => update({ city: e.target.value })} placeholder="City name" />
        {errors.city && <p className="error-msg">{errors.city}</p>}
      </div>
      <div>
        <label className="required">State</label>
        <select value={formData.state} onChange={e => update({ state: e.target.value })}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
        {errors.state && <p className="error-msg">{errors.state}</p>}
      </div>
      <div>
        <label>Country</label>
        <input value={formData.country} onChange={e => update({ country: e.target.value })} placeholder="India" />
      </div>
    </div>
  );
}
