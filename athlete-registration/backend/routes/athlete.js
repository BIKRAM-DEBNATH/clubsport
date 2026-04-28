const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const router = express.Router();
const Athlete = require('../models/Athlete');
const upload = require('../middleware/upload');
const {
  registrationSuccessEmail,
  registrationFailedEmail,
  uploadSuccessEmail,
  uploadFailedEmail,
} = require('../utils/email');



// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/athlete/register - with comprehensive validation
router.post('/register',
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().toLowerCase().isEmail().withMessage('Valid email is required'),
  body('mobile').trim().matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('declarationAccepted').isBoolean().withMessage('Declaration must be accepted'),
  handleValidationErrors,

  async (req, res) => {
    try {
      const data = req.body;
      // ✅ FIX: Convert empty strings to undefined for optional enum fields
      const optionalEnumFields = ['eventType', 'category', 'bloodGroup'];

      optionalEnumFields.forEach(field => {
        if (data[field] === '' || data[field] === null) {
          delete data[field];
        }
      });

      // Validate required enum fields
      if (!data.gender || !['Male', 'Female', 'Other'].includes(data.gender)) {
        return res.status(400).json({
          success: false,
          message: 'Valid gender is required'
        });
      }

      const existingEmail = await Athlete.findOne({ email: data.email });
      if (existingEmail) {
        registrationFailedEmail(data, 'Email already registered in system').catch(e => console.error('Email error:', e));
        return res.status(409).json({
          success: false,
          message: 'Email already registered in system'
        });
      }

      const existingMobile = await Athlete.findOne({ mobile: data.mobile });
      if (existingMobile) {
        registrationFailedEmail(data, 'Mobile number already registered in system').catch(e => console.error('Email error:', e));
        return res.status(409).json({
          success: false,
          message: 'Mobile number already registered in system'
        });
      }

      if (data.hasInsurance && data.insuranceExpiry) {
        const expiry = new Date(data.insuranceExpiry);
        if (expiry <= new Date()) {
          registrationFailedEmail(data, 'Insurance expiry must be a future date').catch(e => console.error('Email error:', e));
          return res.status(400).json({
            success: false,
            message: 'Insurance expiry must be a future date'
          });
        }
      }

      const athlete = new Athlete({
        ...data,
        declarationDate: new Date(),
      });

      await athlete.save();

      // ✅ Send success email (non-blocking)
      registrationSuccessEmail(athlete).catch(e => console.error('Email error:', e));

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          registrationNumber: athlete.registrationNumber,
          athleteId: athlete._id,
        }
      });
    } catch (err) {
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        registrationFailedEmail(req.body, `${field} already registered`).catch(e => console.error('Email error:', e));
        return res.status(409).json({
          success: false,
          message: `${field} already registered`
        });
      }
      console.error('Registration error:', {
        message: err.message,
        stack: err.stack,
        code: err.code
      });
      registrationFailedEmail(req.body, err.message || 'Server error during registration').catch(e => console.error('Email error:', e));
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);

// POST /api/athlete/upload-documents/:id
router.post('/upload-documents/:id',
  param('id').isMongoId().withMessage('Invalid athlete ID'),
  handleValidationErrors,

  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadhaar', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'clubLetter', maxCount: 1 },
    { name: 'parentConsent', maxCount: 1 },
  ]),

  async (req, res) => {
    try {
      const athlete = await Athlete.findById(req.params.id);
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      const docUrls = {};

      if (req.files) {
        for (const [fieldName, files] of Object.entries(req.files)) {
          if (files && files[0]) {

            // ✅ FIX 1: SAVE FULL PUBLIC URL
            docUrls[fieldName] = files[0].path;
          }
        }
      }

      // ✅ FIX 2: MERGE WITH EXISTING DOCUMENTS
      athlete.documents = { ...(athlete.documents || {}), ...docUrls };

      await athlete.save();

      // ✅ Send upload success email (non-blocking)
      const uploadedDocs = Object.keys(docUrls).map(k => {
        const names = { photo: 'Passport Photo', aadhaar: 'Aadhaar Card', birthCertificate: 'Birth Certificate', addressProof: 'Address Proof', clubLetter: 'Club Letter', parentConsent: 'Parent Consent' };
        return names[k] || k;
      });
      uploadSuccessEmail(athlete, uploadedDocs).catch(e => console.error('Email error:', e));

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: athlete.documents
      });

    } catch (err) {
      console.error('Document upload error:', err);
      Athlete.findById(req.params.id).then(athlete => {
        if (athlete) uploadFailedEmail(athlete, err.message || 'Failed to upload documents').catch(e => console.error('Email error:', e));
      }).catch(() => {});
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents'
      });
    }
  }
);

const ALLOWED_DOCUMENT_FIELDS = ['photo', 'aadhaar', 'birthCertificate', 'addressProof', 'clubLetter', 'parentConsent'];

// ✅ Helper: extract filename with extension from Cloudinary URL
function getFilenameFromUrl(documentUrl, fieldName) {
  if (!documentUrl || !fieldName) return `${fieldName}`;

  let fileName = `${fieldName}`;
  try {
    const parsed = new URL(documentUrl);
    const baseName = path.basename(parsed.pathname);
    if (baseName) {
      // Keep the extension from Cloudinary URL (e.g., .jpg, .png, .pdf)
      fileName = baseName;
    }
  } catch (err) {
    // fallback: keep fieldName
  }
  return fileName;
}

// ✅ Helper: determine content type from URL extension
function getContentType(documentUrl) {
  if (!documentUrl) return 'application/octet-stream';
  const ext = path.extname(documentUrl).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ✅ Helper: stream file from remote URL to response
function streamRemoteFile(url, res, filename, contentType) {
  const client = url.startsWith('https') ? https : http;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);

  const request = client.get(url, (response) => {
    // Handle redirects manually
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      return streamRemoteFile(response.headers.location, res, filename, contentType);
    }

    if (response.statusCode !== 200) {
      console.error(`Failed to fetch file: ${url} — status ${response.statusCode}`);
      return res.status(502).json({
        success: false,
        message: 'Failed to fetch document from storage'
      });
    }

    response.pipe(res);
  });

  request.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to stream document'
      });
    }
  });
}

router.get('/download/:id/:field', require('../middleware/auth'),
  param('id').isMongoId().withMessage('Invalid athlete ID'),
  param('field')
    .trim()
    .isIn(ALLOWED_DOCUMENT_FIELDS)
    .withMessage('Invalid document field'),
  handleValidationErrors,

  async (req, res) => {
    try {
      const field = req.params.field.trim();
      console.log('FIELD USED:', field);

      const athlete = await Athlete.findById(req.params.id);
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      const documentUrl = athlete.documents?.[field];
      if (!documentUrl) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const filename = getFilenameFromUrl(documentUrl, field);
      const contentType = getContentType(documentUrl);

      // ✅ Stream file instead of redirect — fixes CORS, blob issues, and preserves headers
      return streamRemoteFile(documentUrl, res, filename, contentType);

    } catch (err) {
      console.error('Document download error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download document'
        });
      }
    }
  }
);

// GET /api/athlete/all
router.get('/all', require('../middleware/auth'),
  query('status').optional().isIn(['Pending', 'Approved', 'Rejected']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidationErrors,

  async (req, res) => {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      const query = {};

      if (status) query.status = status;

      if (search && search.trim()) {
        const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { firstName: new RegExp(sanitized, 'i') },
          { lastName: new RegExp(sanitized, 'i') },
          { email: new RegExp(sanitized, 'i') },
          { mobile: new RegExp(sanitized, 'i') },
          { registrationNumber: new RegExp(sanitized, 'i') },
        ];
      }

      const total = await Athlete.countDocuments(query);
      const athletes = await Athlete.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .select('-__v');

      res.json({
        success: true,
        data: {
          athletes,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (err) {
      console.error('Fetch athletes error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch athletes'
      });
    }
  }
);

// GET /api/athlete/:id
router.get('/:id', require('../middleware/auth'),
  param('id').isMongoId().withMessage('Invalid athlete ID'),
  handleValidationErrors,

  async (req, res) => {
    try {
      const athlete = await Athlete.findById(req.params.id).select('-__v');
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      res.json({
        success: true,
        data: athlete
      });

    } catch (err) {
      console.error('Fetch athlete error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch athlete'
      });
    }
  }
);

module.exports = router;
