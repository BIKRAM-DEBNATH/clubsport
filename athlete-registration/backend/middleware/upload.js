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

const fileSizeLimit = (req, file, cb) => {
  const isPdf = file.mimetype === 'application/pdf';
  const maxBytes = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  if (file.size && file.size > maxBytes) {
    return cb(new Error(`File too large. Max ${isPdf ? '3MB' : '1MB'} for ${file.fieldname}`), false);
  }
  cb(null, true);
};

// ✅ Cloudinary storage 
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const field = file.fieldname;
    const isPdf = file.mimetype === 'application/pdf';
    const ext = file.originalname.split('.').pop();

    if (isPdf) {
      return {
        folder: `athletes/${field}`,
        resource_type: 'raw',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        format: ext,
      };
    }

    return {
      folder: `athletes/${field}`,
      resource_type: 'image',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  }
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