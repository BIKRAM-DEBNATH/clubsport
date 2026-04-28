const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Athlete = require('../models/Athlete');
const authMiddleware = require('../middleware/auth');
const {
  statusUpdateEmail,
  bulkDeleteEmail,
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

      const athlete = await Athlete.findById(req.params.id);
      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Athlete not found'
        });
      }

      const oldStatus = athlete.status;

      const updated = await Athlete.findByIdAndUpdate(
        req.params.id,
        { status, adminRemarks: adminRemarks || '' },
        { new: true }
      );

      // ✅ Send status update email (non-blocking)
      statusUpdateEmail(updated, oldStatus, status, adminRemarks || '').catch(e => console.error('Email error:', e));

      res.json({
        success: true,
        message: `Status updated to ${status}`,
        data: updated
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

// ✅ PUT /api/admin/bulk-status - Bulk update athlete status
router.put('/bulk-status',
  authMiddleware,
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId().withMessage('Each ID must be a valid MongoId'),
  body('status').isIn(['Pending', 'Approved', 'Rejected']).withMessage('Invalid status'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ids, status, adminRemarks } = req.body;
      const athletes = await Athlete.find({ _id: { $in: ids } });
      const updateResult = await Athlete.updateMany(
        { _id: { $in: ids } },
        { status, adminRemarks: adminRemarks || '' }
      );

      // ✅ Send emails to all affected athletes (non-blocking)
      for (const athlete of athletes) {
        const oldStatus = athlete.status;
        statusUpdateEmail(athlete, oldStatus, status, adminRemarks || '').catch(e => console.error('Email error:', e));
      }

      res.json({
        success: true,
        message: `Updated ${updateResult.modifiedCount} athlete(s) to ${status}`,
        modifiedCount: updateResult.modifiedCount,
      });
    } catch (err) {
      console.error('Bulk status error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update status in bulk'
      });
    }
  }
);

// ✅ DELETE /api/admin/bulk-delete - Bulk delete athletes
router.delete('/bulk-delete',
  authMiddleware,
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId().withMessage('Each ID must be a valid MongoId'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ids } = req.body;
      const athletes = await Athlete.find({ _id: { $in: ids } });
      const deleteResult = await Athlete.deleteMany({ _id: { $in: ids } });

      // ✅ Send delete emails to all affected athletes (non-blocking)
      for (const athlete of athletes) {
        bulkDeleteEmail(athlete).catch(e => console.error('Email error:', e));
      }

      res.json({
        success: true,
        message: `Deleted ${deleteResult.deletedCount} athlete(s)`,
        deletedCount: deleteResult.deletedCount,
      });
    } catch (err) {
      console.error('Bulk delete error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete athletes in bulk'
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
