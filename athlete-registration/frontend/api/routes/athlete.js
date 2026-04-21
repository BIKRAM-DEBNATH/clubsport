const express = require('express');
const router = express.Router();
const Athlete = require('../models/Athlete');
const upload = require('../middleware/upload');
const path = require('path');

// POST /api/athlete/register
router.post('/register', async (req, res) => {
  try {
    const data = req.body;

    // Check duplicates
    const existingEmail = await Athlete.findOne({ email: data.email });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered' });

    const existingMobile = await Athlete.findOne({ mobile: data.mobile });
    if (existingMobile) return res.status(409).json({ message: 'Mobile number already registered' });

    // Validate mobile
    if (!/^\d{10}$/.test(data.mobile)) {
      return res.status(400).json({ message: 'Mobile must be exactly 10 digits' });
    }

    // Validate insurance expiry if provided
    if (data.hasInsurance && data.insuranceExpiry) {
      const expiry = new Date(data.insuranceExpiry);
      if (expiry <= new Date()) {
        return res.status(400).json({ message: 'Insurance expiry must be a future date' });
      }
    }

    const athlete = new Athlete({
      ...data,
      declarationDate: new Date(),
    });

    await athlete.save();
    res.status(201).json({
      message: 'Registration successful',
      registrationNumber: athlete.registrationNumber,
      athleteId: athlete._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /api/athlete/upload-documents/:id
router.post('/upload-documents/:id', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'clubLetter', maxCount: 1 },
  { name: 'parentConsent', maxCount: 1 },
]), async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const docUrls = {};
    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files[0]) {
          // Simulate URL for serverless (memory buffer - extend with S3 later)
          docUrls[fieldName] = `/uploads/${fieldName}/${files[0].filename}`;
        }
      }
    }

    athlete.documents = { ...athlete.documents, ...docUrls };
    await athlete.save();

    res.json({ message: 'Documents uploaded successfully', documents: athlete.documents });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/athlete/all  (admin)
router.get('/all', require('../middleware/auth'), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { mobile: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') },
      ];
    }

    const total = await Athlete.countDocuments(query);
    const athletes = await Athlete.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    res.json({ athletes, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/athlete/:id
router.get('/:id', require('../middleware/auth'), async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id).select('-__v');
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
    res.json(athlete);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

