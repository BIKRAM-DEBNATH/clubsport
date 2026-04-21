export function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function getAgeGroup(age) {
  if (age === null || age === undefined) return '';
  if (age < 10) return 'Sub-Junior (U10)';
  if (age < 14) return 'Junior (U14)';
  if (age < 18) return 'Youth (U18)';
  if (age < 23) return 'Under-23';
  if (age < 35) return 'Senior';
  return 'Masters (35+)';
}

export function validateMobile(mobile) {
  return /^\d{10}$/.test(mobile);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePincode(pin) {
  return /^\d{6}$/.test(pin);
}

// PIN code to state (basic mapping for common prefixes)
export function getStateFromPin(pin) {
  if (!pin || pin.length < 2) return '';
  const prefix = parseInt(pin.substring(0, 2));
  const map = {
    11: 'Delhi', 12: 'Haryana', 13: 'Haryana', 14: 'Punjab', 15: 'Punjab',
    16: 'Punjab', 17: 'Himachal Pradesh', 18: 'Jammu & Kashmir', 19: 'Jammu & Kashmir',
    20: 'Uttar Pradesh', 21: 'Uttar Pradesh', 22: 'Uttar Pradesh', 23: 'Uttar Pradesh',
    24: 'Uttar Pradesh', 25: 'Uttar Pradesh', 26: 'Uttar Pradesh', 27: 'Uttar Pradesh',
    28: 'Uttar Pradesh',
    30: 'Rajasthan', 31: 'Rajasthan', 32: 'Rajasthan', 33: 'Rajasthan', 34: 'Rajasthan',
    36: 'Gujarat', 37: 'Gujarat', 38: 'Gujarat', 39: 'Gujarat',
    40: 'Maharashtra', 41: 'Maharashtra', 42: 'Maharashtra', 43: 'Maharashtra',
    44: 'Maharashtra', 45: 'Madhya Pradesh', 46: 'Madhya Pradesh', 47: 'Madhya Pradesh',
    48: 'Madhya Pradesh', 49: 'Madhya Pradesh',
    50: 'Telangana', 51: 'Andhra Pradesh', 52: 'Andhra Pradesh', 53: 'Andhra Pradesh',
    56: 'Karnataka', 57: 'Karnataka', 58: 'Karnataka', 59: 'Karnataka',
    60: 'Tamil Nadu', 61: 'Tamil Nadu', 62: 'Tamil Nadu', 63: 'Tamil Nadu',
    64: 'Tamil Nadu', 67: 'Kerala', 68: 'Kerala', 69: 'Kerala',
    70: 'West Bengal', 71: 'West Bengal', 72: 'West Bengal', 73: 'West Bengal',
    74: 'West Bengal', 75: 'Odisha', 76: 'Odisha', 77: 'Odisha',
    78: 'Assam', 79: 'Assam',
    80: 'Bihar', 81: 'Bihar', 82: 'Bihar', 83: 'Bihar', 84: 'Bihar', 85: 'Bihar',
    90: 'Jharkhand', 91: 'Jharkhand', 92: 'Jharkhand',
  };
  return map[prefix] || '';
}

export const COMPETITIONS = [
  'Sprint (100m)', 'Sprint (200m)', 'Sprint (400m)',
  'Middle Distance (800m)', 'Middle Distance (1500m)',
  'Long Distance (5000m)', 'Long Distance (10000m)', 'Marathon',
  'Hurdles (110m/100m)', 'Hurdles (400m)',
  'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault',
  'Shot Put', 'Discus Throw', 'Javelin Throw', 'Hammer Throw',
  'Relay (4x100m)', 'Relay (4x400m)',
  'Decathlon / Heptathlon', 'Race Walk',
];

export const STATES = [
  'Andaman & Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Daman & Diu', 'Delhi',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
];
