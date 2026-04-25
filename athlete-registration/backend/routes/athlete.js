const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const router = express.Router();
const Athlete = require('../models/Athlete');
const upload = require('../middleware/upload');



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
        return res.status(409).json({
          success: false,
          message: 'Email already registered in system'
        });
      }

      const existingMobile = await Athlete.findOne({ mobile: data.mobile });
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already registered in system'
        });
      }

      if (data.hasInsurance && data.insuranceExpiry) {
        const expiry = new Date(data.insuranceExpiry);
        if (expiry <= new Date()) {
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
            docUrls[fieldName] = `${req.protocol}://${req.get('host')}/uploads/${fieldName}/${files[0].filename}`;
          }
        }
      }

      // ✅ FIX 2: MERGE WITH EXISTING DOCUMENTS
      athlete.documents = { ...(athlete.documents || {}), ...docUrls };

      await athlete.save();

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: athlete.documents
      });

    } catch (err) {
      console.error('Document upload error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents'
      });
    }
  }
);

const ALLOWED_DOCUMENT_FIELDS = ['photo', 'aadhaar', 'birthCertificate', 'addressProof', 'clubLetter', 'parentConsent'];

function resolveDocumentPath(documentUrl, fieldName) {
  if (!documentUrl || !fieldName) return null;

  let fileName = documentUrl;
  try {
    if (/^https?:\/\//.test(documentUrl)) {
      const parsed = new URL(documentUrl);
      fileName = path.basename(parsed.pathname);
    } else {
      fileName = path.basename(documentUrl);
    }
  } catch (err) {
    fileName = path.basename(documentUrl);
  }

  if (!fileName) return null;
  const fullPath = path.join(__dirname, '..', 'uploads', fieldName, fileName);
  if (!fs.existsSync(fullPath)) {
    console.error('Resolved file path does not exist:', fullPath);
    return null;
  }
  return fullPath;
}

// GET /api/athlete/download/:id/:field
router.get('/download/:id/:field', require('../middleware/auth'),
  param('id').isMongoId().withMessage('Invalid athlete ID'),
  param('field').isIn(ALLOWED_DOCUMENT_FIELDS).withMessage('Invalid document field'),
  handleValidationErrors,

  async (req, res) => {
    try {
      const athlete = await Athlete.findById(req.params.id);
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      const documentUrl = athlete.documents?.[req.params.field];
      if (!documentUrl) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Try to serve from local file system first
      const filePath = resolveDocumentPath(documentUrl, req.params.field);
      if (filePath) {
        return res.download(filePath, path.basename(filePath), err => {
          if (err) {
            console.error('Document download error:', err);
            if (!res.headersSent) {
              res.status(500).json({
                success: false,
                message: 'Failed to download document'
              });
            }
          }
        });
      }

      // Fallback: Fetch from stored URL and serve as download
      console.log('Local file not found, fetching from stored URL:', documentUrl);
      try {
        const urlObj = new URL(documentUrl);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
          protocol.get(documentUrl, { timeout: 10000 }, (fileResponse) => {
            if (fileResponse.statusCode !== 200) {
              res.status(503).json({
                success: false,
                message: 'Document storage unavailable'
              });
              return resolve();
            }

            const fileName = path.basename(urlObj.pathname);
            const contentType = fileResponse.headers['content-type'] || 'application/octet-stream';

            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', contentType);
            fileResponse.pipe(res);
            fileResponse.on('end', resolve);
            fileResponse.on('error', reject);
          }).on('error', (err) => {
            console.error('Failed to fetch from stored URL:', err.message);
            if (!res.headersSent) {
              res.status(503).json({
                success: false,
                message: 'Document storage unavailable'
              });
            }
            resolve();
          });
        });
      } catch (urlErr) {
        console.error('Invalid document URL:', urlErr.message);
        return res.status(400).json({
          success: false,
          message: 'Invalid document URL'
        });
      }
    } catch (err) {
      console.error('Document download error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to download document'
      });
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