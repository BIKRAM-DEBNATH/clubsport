const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// File type whitelist with MIME types
const ALLOWED_FILE_TYPES = {
  photo: {
    mimes: ['image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },

  aadhaar: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024,
  },

  birthCertificate: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024,
  },

  addressProof: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024,
  },

  clubLetter: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024,
  },

  parentConsent: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024,
  }
};

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(uploadDir, file.fieldname);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: function (req, file, cb) {
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);

    const safeName = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);

    cb(null, `${hash}-${safeName}${ext}`);
  }
});

// File filter (type + extension check)
const fileFilter = (req, file, cb) => {
  const fileType = file.fieldname;
  const allowedConfig = ALLOWED_FILE_TYPES[fileType];

  if (!allowedConfig) {
    return cb(new Error(`Invalid field name: ${fileType}`), false);
  }

  // MIME check
  if (!allowedConfig.mimes.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type for ${fileType}. Allowed: ${allowedConfig.mimes.join(', ')}`),
      false
    );
  }

  // Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedConfig.extensions.includes(ext)) {
    return cb(
      new Error(`Invalid file extension for ${fileType}. Allowed: ${allowedConfig.extensions.join(', ')}`),
      false
    );
  }

  cb(null, true);
};

// Size + count limits
const limits = {
  fileSize: 2 * 1024 * 1024, // global 2MB
  files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 6
};

const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = upload;