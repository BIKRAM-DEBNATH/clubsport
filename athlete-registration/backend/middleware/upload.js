const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ✅ validation rules for each document type
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const MAX_PDF_SIZE = 3 * 1024 * 1024;

const ALLOWED_FILE_TYPES = {
  photo: {
    mimes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_IMAGE_SIZE
  },
  aadhaar: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_PDF_SIZE
  },
  birthCertificate: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_PDF_SIZE
  },
  addressProof: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_PDF_SIZE
  },
  clubLetter: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_PDF_SIZE
  },
  parentConsent: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: MAX_PDF_SIZE
  }
};

const fileFilter = (req, file, cb) => {
  const field = file.fieldname;
  const config = ALLOWED_FILE_TYPES[field];

  if (!config) {
    return cb(new Error(`Invalid field: ${field}`), false);
  }

  if (!config.mimes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type for ${field}`), false);
  }

  cb(null, true);
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'athlete-documents',
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
  }),
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PDF_SIZE,
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 6
  }
});

module.exports = upload;