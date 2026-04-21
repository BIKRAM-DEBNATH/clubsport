const mongoose = require('mongoose');

const athleteSchema = new mongoose.Schema({
  // Step 1: Personal Details
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dob: { type: Date, required: true },
  age: { type: Number },
  ageGroup: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  nationality: { type: String, default: 'Indian' },

  // Step 2: Guardian Details (required if age < 18)
  guardianName: { type: String },
  guardianRelation: { type: String },
  guardianMobile: { type: String },
  guardianEmail: { type: String },
  parentConsentGiven: { type: Boolean, default: false },

  // Step 3: Address
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true, match: /^\d{6}$/ },
  country: { type: String, default: 'India' },

  // Step 4: Club / Representation
  clubName: { type: String },
  clubCode: { type: String },
  coachName: { type: String },
  coachMobile: { type: String },
  representingState: { type: String },
  representingDistrict: { type: String },

  // Step 5: Competition
  competitions: [{ type: String }],
  category: { type: String },
  eventType: { type: String, enum: ['Individual', 'Team', 'Both'] },
  teamName: { type: String },

  // Step 6: Documents
  documents: {
    photo: { type: String },
    aadhaar: { type: String },
    birthCertificate: { type: String },
    addressProof: { type: String },
    clubLetter: { type: String },
    parentConsent: { type: String },
  },

  // Insurance
  hasInsurance: { type: Boolean, default: false },
  insuranceProvider: { type: String },
  insurancePolicyNo: { type: String },
  insuranceExpiry: { type: Date },

  // Step 7: Declaration
  declarationAccepted: { type: Boolean, required: true, default: false },
  declarationDate: { type: Date },

  // Step 8: Payment (UI only)
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentReference: { type: String },
  registrationFee: { type: Number, default: 500 },

  // Admin fields
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminRemarks: { type: String },
  missingDocuments: [{ type: String }],
  registrationNumber: { type: String, unique: true },
}, {
  timestamps: true
});

// Auto-generate registration number
athleteSchema.pre('save', async function (next) {
  if (!this.registrationNumber) {
    const count = await mongoose.model('Athlete').countDocuments();
    this.registrationNumber = `ATH${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
  }

  // Auto-calculate age
  if (this.dob) {
    const today = new Date();
    const birth = new Date(this.dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    this.age = age;
    this.ageGroup = calculateAgeGroup(age);
  }

  // Check missing documents
  const required = ['photo', 'aadhaar', 'birthCertificate'];
  this.missingDocuments = required.filter(doc => !this.documents[doc]);

  next();
});

function calculateAgeGroup(age) {
  if (age < 10) return 'Sub-Junior (U10)';
  if (age < 14) return 'Junior (U14)';
  if (age < 18) return 'Youth (U18)';
  if (age < 23) return 'Under-23';
  if (age < 35) return 'Senior';
  return 'Masters (35+)';
}

module.exports = mongoose.model('Athlete', athleteSchema);

