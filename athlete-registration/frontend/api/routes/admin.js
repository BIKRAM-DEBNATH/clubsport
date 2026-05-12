const express = require('express');
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

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/status-update/:id
router.put('/status-update/:id', authMiddleware, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    if (!['Pending', 'Approved', 'Rejected', 'Withdrawn'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const oldStatus = athlete.status;
    const updated = await Athlete.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks },
      { new: true }
    );

    statusUpdateEmail(updated, oldStatus, status, adminRemarks || '').catch(e => console.error('Email error:', e));

    res.json({ message: `Status updated to ${status}`, athlete: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ PUT /api/admin/bulk-status
router.put('/bulk-status', authMiddleware, async (req, res) => {
  try {
    const { ids, status, adminRemarks } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids must be a non-empty array' });

    const athletes = await Athlete.find({ _id: { $in: ids } });
    const updateResult = await Athlete.updateMany(
      { _id: { $in: ids } },
      { status, adminRemarks: adminRemarks || '' }
    );

    for (const athlete of athletes) {
      statusUpdateEmail(athlete, athlete.status, status, adminRemarks || '').catch(e => console.error('Email error:', e));
    }

    res.json({ message: `Updated ${updateResult.modifiedCount} athlete(s) to ${status}`, modifiedCount: updateResult.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE /api/admin/bulk-delete
router.delete('/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids must be a non-empty array' });

    const athletes = await Athlete.find({ _id: { $in: ids } });
    const deleteResult = await Athlete.deleteMany({ _id: { $in: ids } });

    for (const athlete of athletes) {
      bulkDeleteEmail(athlete).catch(e => console.error('Email error:', e));
    }

    res.json({ message: `Deleted ${deleteResult.deletedCount} athlete(s)`, deletedCount: deleteResult.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/export-csv
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=athletes_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Athlete.countDocuments();
    const pending = await Athlete.countDocuments({ status: 'Pending' });
    const approved = await Athlete.countDocuments({ status: 'Approved' });
    const rejected = await Athlete.countDocuments({ status: 'Rejected' });
    const withMissingDocs = await Athlete.countDocuments({ missingDocuments: { $not: { $size: 0 } } });
    res.json({ total, pending, approved, rejected, withMissingDocs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
