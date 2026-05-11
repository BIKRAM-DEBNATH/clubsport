const multer = require('multer');
const path = require('path');

const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const MAX_PDF_SIZE = 3 * 1024 * 1024;

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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PDF_SIZE,
    files: 6
  }
});

module.exports = upload;

