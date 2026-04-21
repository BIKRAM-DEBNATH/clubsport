import { calculateAge, getAgeGroup, validateMobile, validateEmail } from '../../utils/validators';

export default function Step1Personal({ formData, update, errors, setErrors }) {
  const age = calculateAge(formData.dob);
  const ageGroup = getAgeGroup(age);

  function handleBlur(field) {
    const errs = {};
    if (field === 'mobile' && formData.mobile && !validateMobile(formData.mobile))
      errs.mobile = 'Mobile must be exactly 10 digits';
    if (field === 'email' && formData.email && !validateEmail(formData.email))
      errs.email = 'Enter a valid email address';
    setErrors(prev => ({ ...prev, ...errs }));
  }

  return (
    <div className="form-grid">
      <div>
        <label className="required">First Name</label>
        <input value={formData.firstName} onChange={e => update({ firstName: e.target.value })} placeholder="Enter first name" />
        {errors.firstName && <p className="error-msg">{errors.firstName}</p>}
      </div>
      <div>
        <label className="required">Last Name</label>
        <input value={formData.lastName} onChange={e => update({ lastName: e.target.value })} placeholder="Enter last name" />
        {errors.lastName && <p className="error-msg">{errors.lastName}</p>}
      </div>
      <div>
        <label className="required">Date of Birth</label>
        <input type="date" value={formData.dob} onChange={e => update({ dob: e.target.value })}
          max={new Date().toISOString().split('T')[0]} />
        {age !== null && (
          <p className="success-msg">Age: {age} years — {ageGroup}</p>
        )}
      </div>
      <div>
        <label className="required">Gender</label>
        <select value={formData.gender} onChange={e => update({ gender: e.target.value })}>
          <option value="">Select gender</option>
          <option>Male</option><option>Female</option><option>Other</option>
        </select>
      </div>
      <div>
        <label className="required">Mobile Number</label>
        <input value={formData.mobile} onChange={e => update({ mobile: e.target.value })}
          onBlur={() => handleBlur('mobile')} placeholder="10-digit mobile number" maxLength={10} />
        {errors.mobile && <p className="error-msg">{errors.mobile}</p>}
      </div>
      <div>
        <label className="required">Email Address</label>
        <input type="email" value={formData.email} onChange={e => update({ email: e.target.value })}
          onBlur={() => handleBlur('email')} placeholder="your@email.com" />
        {errors.email && <p className="error-msg">{errors.email}</p>}
      </div>
      <div>
        <label>Blood Group</label>
        <select value={formData.bloodGroup} onChange={e => update({ bloodGroup: e.target.value })}>
          <option value="">Select</option>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label>Nationality</label>
        <input value={formData.nationality} onChange={e => update({ nationality: e.target.value })} placeholder="Indian" />
      </div>
    </div>
  );
}
