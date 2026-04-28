const multer = require('multer');
const path = require('path');

// Memory storage for serverless (no disk writes)
// ✅ memoryStorage() does NOT accept options — file.buffer holds data in memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedDocs = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

  if (file.fieldname === 'photo') {
    if (allowedImages.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Photo must be JPG or PNG'), false);
  } else {
    if (allowedDocs.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Documents must be PDF, JPG, or PNG'), false);
  }
};

const limits = {
  fileSize: 2 * 1024 * 1024 // 2MB max per file
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;

