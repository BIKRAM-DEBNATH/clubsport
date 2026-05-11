const express = require('express');
const router = express.Router();
const Athlete = require('../models/Athlete');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const {
  registrationSuccessEmail,
  registrationFailedEmail,
  uploadSuccessEmail,
  uploadFailedEmail,
} = require('../utils/email');
const https = require('https');
const http = require('http');
const path = require('path');

// ✅ Helper: extract filename with extension from URL
const FIELD_LABELS = {
  photo: 'Passport_Photo', aadhaar: 'Aadhaar_Card',
  birthCertificate: 'Birth_Certificate', addressProof: 'Address_Proof',
  clubLetter: 'Club_Letter', parentConsent: 'Parent_Consent',
};

function inferExtension(url) {
  if (!url) return '';
  const cleanUrl = url.split('?')[0].split('#')[0];
  const ext = path.extname(cleanUrl).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.pdf', '.gif', '.webp', '.bmp'].includes(ext)) return ext;
  if (url.includes('/raw/upload/') || url.includes('resource_type=raw')) return '.pdf';
  return '';
}

function getFilenameFromUrl(documentUrl, fieldName) {
  const ext = inferExtension(documentUrl);
  const label = FIELD_LABELS[fieldName] || fieldName;
  return `${label}${ext}`;
}

function getContentType(documentUrl) {
  const ext = inferExtension(documentUrl);
  const mimeTypes = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.pdf': 'application/pdf', '.gif': 'image/gif', '.webp': 'image/webp',
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
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      return streamRemoteFile(response.headers.location, res, filename, contentType);
    }
    if (response.statusCode !== 200) {
      console.error(`Failed to fetch file: ${url} — status ${response.statusCode}`);
      return res.status(502).json({ message: 'Failed to fetch document from storage' });
    }
    response.pipe(res);
  });

  request.on('error', (err) => {
    console.error('Stream error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to stream document' });
  });
}

const ALLOWED_DOCUMENT_FIELDS = ['photo', 'aadhaar', 'birthCertificate', 'addressProof', 'clubLetter', 'parentConsent'];

// GET /api/athlete/download/:id/:field
router.get('/download/:id/:field', authMiddleware, async (req, res) => {
  try {
    const field = req.params.field;
    if (!ALLOWED_DOCUMENT_FIELDS.includes(field)) {
      return res.status(400).json({ message: 'Invalid document field' });
    }

    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const documentUrl = athlete.documents?.[field];
    if (!documentUrl) return res.status(404).json({ message: 'Document not found' });

    if (documentUrl.startsWith('http')) {
      const filename = getFilenameFromUrl(documentUrl, field);
      const contentType = getContentType(documentUrl);
      return streamRemoteFile(documentUrl, res, filename, contentType);
    }
    return res.redirect(documentUrl);
  } catch (err) {
    console.error('Document download error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to download document' });
  }
});

// POST /api/athlete/register
router.post('/register', async (req, res) => {
  try {
    const data = req.body;

    const existingEmail = await Athlete.findOne({ email: data.email });
    if (existingEmail) {
      registrationFailedEmail(data, 'Email already registered').catch(e => console.error('Email error:', e));
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingMobile = await Athlete.findOne({ mobile: data.mobile });
    if (existingMobile) {
      registrationFailedEmail(data, 'Mobile number already registered').catch(e => console.error('Email error:', e));
      return res.status(409).json({ message: 'Mobile number already registered' });
    }

    if (!/^\d{10}$/.test(data.mobile)) {
      registrationFailedEmail(data, 'Mobile must be exactly 10 digits').catch(e => console.error('Email error:', e));
      return res.status(400).json({ message: 'Mobile must be exactly 10 digits' });
    }

    if (data.hasInsurance && data.insuranceExpiry) {
      const expiry = new Date(data.insuranceExpiry);
      if (expiry <= new Date()) {
        registrationFailedEmail(data, 'Insurance expiry must be a future date').catch(e => console.error('Email error:', e));
        return res.status(400).json({ message: 'Insurance expiry must be a future date' });
      }
    }

    const athlete = new Athlete({ ...data, declarationDate: new Date() });
    await athlete.save();

    registrationSuccessEmail(athlete).catch(e => console.error('Email error:', e));

    res.status(201).json({
      message: 'Registration successful',
      registrationNumber: athlete.registrationNumber,
      athleteId: athlete._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      registrationFailedEmail(req.body, `${field} already exists`).catch(e => console.error('Email error:', e));
      return res.status(409).json({ message: `${field} already exists` });
    }
    console.error('Register error:', err);
    registrationFailedEmail(req.body, err.message || 'Server error').catch(e => console.error('Email error:', e));
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
          docUrls[fieldName] = `/uploads/${fieldName}/${files[0].filename}`;
        }
      }
    }

    athlete.documents = { ...athlete.documents, ...docUrls };
    await athlete.save();

    const uploadedDocs = Object.keys(docUrls).map(k => {
      const names = { photo: 'Passport Photo', aadhaar: 'Aadhaar Card', birthCertificate: 'Birth Certificate', addressProof: 'Address Proof', clubLetter: 'Club Letter', parentConsent: 'Parent Consent' };
      return names[k] || k;
    });
    uploadSuccessEmail(athlete, uploadedDocs).catch(e => console.error('Email error:', e));

    res.json({ message: 'Documents uploaded successfully', documents: athlete.documents });
  } catch (err) {
    console.error('Upload error:', err);
    Athlete.findById(req.params.id).then(athlete => {
      if (athlete) uploadFailedEmail(athlete, err.message || 'Upload failed').catch(e => console.error('Email error:', e));
    }).catch(() => {});
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
