const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ✅ validation rules for each document type
const ALLOWED_FILE_TYPES = {
  photo: {
    mimes: ['image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  },
  aadhaar: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  },
  birthCertificate: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  },
  addressProof: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  },
  clubLetter: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  },
  parentConsent: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    maxSize: 2 * 1024 * 1024
  }
};

// ✅ File filter for multer
const fileFilter = (req, file, cb) => {
  const field = file.fieldname;
  const config = ALLOWED_FILE_TYPES[field];

  if (!config) {
    return cb(new Error(`Invalid field: ${field}`), false);
  }

  if (!config.mimes.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type for ${field}`),
      false
    );
  }

  cb(null, true);
};

// ✅ Cloudinary storage 
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const field = file.fieldname;

    return {
      folder: `athletes/${field}`,
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  }
});

// ✅ Multer setup
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 6
  }
});

module.exports = upload;