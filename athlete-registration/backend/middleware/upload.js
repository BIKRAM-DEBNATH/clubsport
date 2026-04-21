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
  documents: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024, // 2MB
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(uploadDir, file.fieldname);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate cryptographically secure filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    // Clean filename to prevent directory traversal
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    cb(null, `${hash}-${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const fileType = file.fieldname;
  const allowedConfig = ALLOWED_FILE_TYPES[fileType];

  if (!allowedConfig) {
    return cb(new Error(`Invalid field name: ${fileType}`), false);
  }

  // Check MIME type
  if (!allowedConfig.mimes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type for ${fileType}. Allowed: ${allowedConfig.mimes.join(', ')}`), false);
  }

  // Check file extension to prevent spoofing
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedConfig.extensions.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${allowedConfig.extensions.join(', ')}`), false);
  }

  cb(null, true);
};

const limits = {
  fileSize: Math.max(...Object.values(ALLOWED_FILE_TYPES).map(f => f.maxSize)),
  files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 5
};

// Create multer instance with security options
const upload = multer({
  storage,
  fileFilter,
  limits,
  // Prevent files from being uploaded without explicit handler
  dest: undefined
});

module.exports = upload;
