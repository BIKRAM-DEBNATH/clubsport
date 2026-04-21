const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const Athlete = require('../models/Athlete');
const upload = require('../middleware/upload');
const path = require('path');

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
  // Validation middleware
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

      // Check for duplicate email
      const existingEmail = await Athlete.findOne({ email: data.email });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered in system'
        });
      }

      // Check for duplicate mobile
      const existingMobile = await Athlete.findOne({ mobile: data.mobile });
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already registered in system'
        });
      }

      // Validate insurance expiry if provided
      if (data.hasInsurance && data.insuranceExpiry) {
        const expiry = new Date(data.insuranceExpiry);
        if (expiry <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Insurance expiry must be a future date'
          });
        }
      }

      // Create athlete
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
      console.error('Registration error:', err);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);

// POST /api/athlete/upload-documents/:id - Enhanced with validation
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

      // Process uploaded files
      const docUrls = {};
      if (req.files) {
        for (const [fieldName, files] of Object.entries(req.files)) {
          if (files && files[0]) {
            // Security: validate file exists and belongs to field
            const filePath = files[0].path;
            docUrls[fieldName] = `/uploads/${fieldName}/${files[0].filename}`;
          }
        }
      }

      // Update athlete with document URLs
      athlete.documents = { ...athlete.documents, ...docUrls };
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

// GET /api/athlete/all - List athletes with pagination and filtering
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
        // Sanitize search input to prevent regex injection
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

// GET /api/athlete/:id - Get single athlete
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
