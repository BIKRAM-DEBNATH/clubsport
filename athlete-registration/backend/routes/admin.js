const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Athlete = require('../models/Athlete');
const authMiddleware = require('../middleware/auth');

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

// POST /api/admin/login - Enhanced with validation and security
router.post('/login',
  body('email').trim().toLowerCase().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role || 'admin'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email
          }
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  }
);

// PUT /api/admin/status-update/:id - Update athlete status
router.put('/status-update/:id',
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid athlete ID'),
  body('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status'),
  body('adminRemarks').optional().trim().isLength({ max: 500 }).withMessage('Remarks too long'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;

      const athlete = await Athlete.findByIdAndUpdate(
        req.params.id,
        {
          status,
          adminRemarks: adminRemarks || ''
        },
        { new: true }
      );

      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      res.json({
        success: true,
        message: `Status updated to ${status}`,
        data: athlete
      });
    } catch (err) {
      console.error('Status update error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update status'
      });
    }
  }
);

// GET /api/admin/export-csv - Export athlete data
router.get('/export-csv', authMiddleware, async (req, res) => {
  try {
    const athletes = await Athlete.find().sort({ createdAt: -1 }).lean();

    const fields = [
      'registrationNumber', 'firstName', 'lastName', 'email', 'mobile',
      'dob', 'age', 'ageGroup', 'gender', 'bloodGroup', 'nationality',
      'guardianName', 'guardianRelation', 'guardianMobile',
      'addressLine1', 'city', 'state', 'pincode',
      'clubName', 'coachName', 'representingState',
      'competitions', 'category', 'eventType',
      'hasInsurance', 'insuranceProvider', 'insurancePolicyNo', 'insuranceExpiry',
      'status', 'adminRemarks', 'paymentStatus', 'registrationFee', 'createdAt'
    ];

    const csvRows = [fields.join(',')];

    for (const a of athletes) {
      const row = fields.map(field => {
        let val = a[field];
        if (Array.isArray(val)) val = val.join('; ');
        if (val instanceof Date) val = val.toISOString().split('T')[0];
        if (val === undefined || val === null) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="athletes_${timestamp}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to export CSV'
    });
  }
});

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, pending, approved, rejected, withMissingDocs] = await Promise.all([
      Athlete.countDocuments(),
      Athlete.countDocuments({ status: 'Pending' }),
      Athlete.countDocuments({ status: 'Approved' }),
      Athlete.countDocuments({ status: 'Rejected' }),
      Athlete.countDocuments({ missingDocuments: { $not: { $size: 0 } } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
        withMissingDocs
      }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
