import { useState, useEffect } from 'react';
import api from '../utils/api';
import { calculateAge, getAgeGroup } from '../utils/validators';
import { useNavigate } from 'react-router-dom';

// Step components
import Step1Personal from '../components/form-steps/Step1Personal';
import Step2Guardian from '../components/form-steps/Step2Guardian';
import Step3Address from '../components/form-steps/Step3Address';
import Step4Club from '../components/form-steps/Step4Club';
import Step5Competition from '../components/form-steps/Step5Competition';
import Step6Documents from '../components/form-steps/Step6Documents';
import Step7Declaration from '../components/form-steps/Step7Declaration';
import Step8Payment from '../components/form-steps/Step8Payment';

const STEPS = [
  { id: 1, label: 'Personal', icon: '👤' },
  { id: 2, label: 'Guardian', icon: '👪' },
  { id: 3, label: 'Address', icon: '📍' },
  { id: 4, label: 'Club', icon: '🏃' },
  { id: 5, label: 'Competition', icon: '🏆' },
  { id: 6, label: 'Documents', icon: '📄' },
  { id: 7, label: 'Declaration', icon: '✍️' },
  { id: 8, label: 'Payment', icon: '💳' },
];

const STORAGE_KEY = 'athlete_form_draft';

const initialData = {
  firstName: '', lastName: '', dob: '', gender: '', email: '', mobile: '',
  bloodGroup: '', nationality: 'Indian',

  guardianName: '', guardianRelation: '', guardianMobile: '', guardianEmail: '', parentConsentGiven: false,

  addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',

  clubName: '', clubCode: '', coachName: '', coachMobile: '', representingState: '', representingDistrict: '',

  competitions: [], category: '', eventType: '', teamName: '',

  hasInsurance: false, insuranceProvider: '', insurancePolicyNo: '', insuranceExpiry: '',

  declarationAccepted: false, paymentStatus: 'Pending', registrationFee: 500,

  // ✅ FIXED FILE FIELDS
  photo: null,
  aadhaar: null
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try { return { ...initialData, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return initialData; }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [athleteId, setAthleteId] = useState(null);
  const navigate = useNavigate();

  // Auto save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const age = calculateAge(formData.dob);
const ageGroup = getAgeGroup(age);
const isMinor = age !== null && age < 18;

// ✅ UPDATED FUNCTION (WITH FILE SIZE VALIDATION)
function update(fields) {
  let newErrors = {};

  // File size validation
  if (fields.photo && fields.photo.size > 2 * 1024 * 1024) {
    newErrors.photo = "Photo must be less than 2MB";
    fields.photo = null;
  }

 if (fields.aadhaar && fields.aadhaar.size > 2 * 1024 * 1024) {
  newErrors.aadhaar = "PDF must be less than 2MB";
  fields.aadhaar = null;
}

  setFormData(prev => ({ ...prev, ...fields }));

  // Clear errors for changed fields
  const cleared = {};
  Object.keys(fields).forEach(k => { cleared[k] = undefined; });

  setErrors(prev => ({ ...prev, ...cleared, ...newErrors }));
}

// ✅ VALIDATION (IMPROVED MESSAGE)
function validateStep() {
  let newErrors = {};

  if (step === 1) {
    if (!formData.firstName) newErrors.firstName = "First name required";
    if (!formData.lastName) newErrors.lastName = "Last name required";
    if (!formData.mobile) newErrors.mobile = "Mobile required";
  }

  if (step === 6) {
    if (!formData.photo) newErrors.photo = "Photo required";
    if (!formData.aadhaar) newErrors.aadhaar = "Aadhaar PDF required";
  }

  if (step === 7) {
    if (!formData.declarationAccepted) {
      newErrors.declarationAccepted = "Accept declaration first";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}

  function goNext() {
  // Skip validation only for payment page
  if (step !== 8) {
    const isValid = validateStep();
    if (!isValid) return;
  }

  if (step < STEPS.length) setStep(s => s + 1);
}
  function goPrev() {
    if (step > 1) setStep(s => s - 1);
  }

  async function handleSubmit() {
  setLoading(true);
    // ❌ BLOCK SUBMIT IF FILE SIZE > 2MB
  if (formData.photo && formData.photo.size > 2 * 1024 * 1024) {
    setErrors({ submit: "Photo must be less than 2MB" });
    setLoading(false);
    return;
  }

  if (formData.aadhaar && formData.aadhaar.size > 2 * 1024 * 1024) {
    setErrors({ submit: "Aadhaar PDF must be less than 2MB" });
    setLoading(false);
    return;
  }
  try {
    // If already registered
    if (athleteId) {
      navigate(`/success/${formData.registrationNumber || 'N/A'}`);
      return;
    }

    // ✅ STEP 1: SEND NORMAL DATA (NO FILES)
    const normalData = { ...formData };

    // remove files
    delete normalData.photo;
    delete normalData.aadhaar;

    // add calculated fields
    normalData.age = age;
    normalData.ageGroup = ageGroup;

    const res = await api.post('/athlete/register', normalData);

    const id = res.data?.data?.athleteId;
    const registrationNumber = res.data?.data?.registrationNumber;

    // ✅ STEP 2: UPLOAD FILES
    const fileData = new FormData();

    if (formData.photo) fileData.append("photo", formData.photo);

    // 🔥 IMPORTANT: map document → aadhaar
    if (formData.aadhaar) fileData.append("aadhaar", formData.aadhaar);

    await api.post(`/athlete/upload-documents/${id}`, fileData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    // ✅ SUCCESS
    setAthleteId(id);
    localStorage.removeItem(STORAGE_KEY);
    navigate(`/success/${registrationNumber}`);

  } catch (err) {
    setErrors({
      submit: err.response?.data?.message || 'Registration failed. Please try again.'
    });
  } finally {
    setLoading(false);
  }
}

  const stepProps = { formData, update, errors, setErrors, age, ageGroup, isMinor };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px 16px 60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 32 }}>🏟️</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
            ATHLETE REGISTRATION
          </h1>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>Bikram Sports Club — Official Registration Portal</p>
      </div>

      {/* Progress Bar */}
      <ProgressBar step={step} total={STEPS.length} steps={STEPS} />

      {/* Form Card */}
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div className="card fade-in" key={step}>
          <StepHeader step={step} steps={STEPS} />

          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

          {step === 1 && <Step1Personal {...stepProps} />}
          {step === 2 && <Step2Guardian {...stepProps} />}
          {step === 3 && <Step3Address {...stepProps} />}
          {step === 4 && <Step4Club {...stepProps} />}
          {step === 5 && <Step5Competition {...stepProps} />}
          {step === 6 && <Step6Documents {...stepProps} athleteId={athleteId} />}
          {step === 7 && <Step7Declaration {...stepProps} />}
          {step === 8 && <Step8Payment {...stepProps} onSubmit={handleSubmit} loading={loading} />}

          {/* Navigation */}
          {step < 8 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
              <button className="btn-secondary" onClick={goPrev} disabled={step === 1}>
                ← Previous
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary btn-sm" onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))} title="Draft saved">
                  💾 Save Draft
                </button>
                <button className="btn-primary" onClick={goNext}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text3)', fontSize: 12 }}>
          Your progress is automatically saved. <a href="/admin/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Admin Login →</a>
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ step, total, steps }) {
  const pct = ((step - 1) / (total - 1)) * 100;
  return (
    <div style={{ maxWidth: 780, margin: '0 auto 24px', padding: '0 4px' }}>
      {/* Step labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {steps.map(s => (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.id < step ? 'var(--accent2)' : s.id === step ? 'var(--accent)' : 'var(--card2)',
              border: s.id === step ? '2px solid var(--accent)' : '2px solid var(--border)',
              fontSize: s.id < step ? 14 : 16, color: '#fff',
              boxShadow: s.id === step ? '0 0 12px rgba(0,200,255,0.5)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {s.id < step ? '✓' : s.icon}
            </div>
            <span style={{ fontSize: 10, color: s.id === step ? 'var(--accent)' : 'var(--text3)', marginTop: 4, fontWeight: s.id === step ? 700 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      {/* Bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent2), var(--accent))', transition: 'width 0.4s ease', borderRadius: 2 }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Step {step} of {total}</p>
    </div>
  );
}

function StepHeader({ step, steps }) {
  const s = steps[step - 1];
  return (
    <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>{s.icon}</span>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>
            {s.label} Details
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 12 }}>Step {step} of 8</p>
        </div>
      </div>
    </div>
  );
}
