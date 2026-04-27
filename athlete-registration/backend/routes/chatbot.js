const express = require('express');
const { param, query, body, validationResult } = require('express-validator');
const router = express.Router();
const Athlete = require('../models/Athlete');

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

// GET /api/chatbot/status/:applicationNumber - Check application status
router.get('/status/:applicationNumber',
  param('applicationNumber').trim().notEmpty().withMessage('Application number is required'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { applicationNumber } = req.params;

      const athlete = await Athlete.findOne({ registrationNumber: applicationNumber });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Application not found. Please check your application number.'
        });
      }

      // Return status information
      res.json({
        success: true,
        data: {
          registrationNumber: athlete.registrationNumber,
          status: athlete.status,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          email: athlete.email,
          mobile: athlete.mobile,
          ageGroup: athlete.ageGroup,
          competitions: athlete.competitions,
          paymentStatus: athlete.paymentStatus,
          adminRemarks: athlete.adminRemarks || 'No remarks available',
          createdAt: athlete.createdAt,
          missingDocuments: athlete.missingDocuments || []
        }
      });

    } catch (error) {
      console.error('Error checking application status:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while checking application status. Please try again later.'
      });
    }
  }
);

// POST /api/chatbot/withdraw/:applicationNumber - Withdraw application
router.post('/withdraw/:applicationNumber',
  param('applicationNumber').trim().notEmpty().withMessage('Application number is required'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { applicationNumber } = req.params;
      const { reason } = req.body;

      const athlete = await Athlete.findOne({ registrationNumber: applicationNumber });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Application not found. Please check your application number.'
        });
      }

      // Check if application can be withdrawn
      if (athlete.status === 'Approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw an approved application. Please contact support.'
        });
      }

      if (athlete.status === 'Rejected') {
        return res.status(400).json({
          success: false,
          message: 'Application is already rejected and cannot be withdrawn.'
        });
      }

      // Update status to withdrawn (we'll add a new status or use rejected)
      athlete.status = 'Withdrawn';
      athlete.adminRemarks = reason ? `Withdrawn: ${reason}` : 'Application withdrawn by user';
      await athlete.save();

      res.json({
        success: true,
        message: 'Application has been successfully withdrawn.',
        data: {
          registrationNumber: athlete.registrationNumber,
          status: athlete.status,
          withdrawnAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error withdrawing application:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while withdrawing the application. Please try again later.'
      });
    }
  }
);

// GET /api/chatbot/search - Search application by phone number
router.get('/search',
  query('phone').trim().matches(/^\d{10}$/).withMessage('Phone number must be exactly 10 digits'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { phone } = req.query;

      const athlete = await Athlete.findOne({ mobile: phone });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'No application found with this phone number.'
        });
      }

      // Return basic application info
      res.json({
        success: true,
        data: {
          registrationNumber: athlete.registrationNumber,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          status: athlete.status,
          email: athlete.email,
          createdAt: athlete.createdAt
        }
      });

    } catch (error) {
      console.error('Error searching application by phone:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while searching for your application. Please try again later.'
      });
    }
  }
);

// GET /api/chatbot/contact - Get contact details
router.get('/contact', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        clubName: 'BikramSports Club',
        email: 'bikramdebnath905@gmail.com',
        phone: '+91 6294920220',
        address: 'BikramSports Club, Sports Complex, City, State - PIN',
        supportHours: 'Monday to Friday: 9:00 AM - 6:00 PM IST',
        emergencyContact: '+91 6294920220'
      }
    });
  } catch (error) {
    console.error('Error fetching contact details:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching contact details.'
    });
  }
});

// PUT /api/chatbot/update/:applicationNumber - Update application details
router.put('/update/:applicationNumber',
  param('applicationNumber').trim().notEmpty().withMessage('Application number is required'),
  body('email').optional().trim().toLowerCase().isEmail().withMessage('Valid email is required'),
  body('mobile').optional().trim().matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),
  body('addressLine1').optional().trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim().notEmpty().withMessage('State is required'),
  body('pincode').optional().trim().matches(/^\d{6}$/).withMessage('Pincode must be exactly 6 digits'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { applicationNumber } = req.params;
      const updateData = req.body;

      const athlete = await Athlete.findOne({ registrationNumber: applicationNumber });

      if (!athlete) {
        return res.status(404).json({
          success: false,
          message: 'Application not found. Please check your application number.'
        });
      }

      // Check if application can be updated
      if (athlete.status === 'Approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update an approved application. Please contact support for changes.'
        });
      }

      // Fields that can be updated
      const allowedFields = ['email', 'mobile', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode'];

      // Update only allowed fields
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          athlete[field] = updateData[field];
        }
      });

      // Check for email/mobile uniqueness if being updated
      if (updateData.email) {
        const existingEmail = await Athlete.findOne({
          email: updateData.email,
          registrationNumber: { $ne: applicationNumber }
        });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email is already registered with another application.'
          });
        }
      }

      if (updateData.mobile) {
        const existingMobile = await Athlete.findOne({
          mobile: updateData.mobile,
          registrationNumber: { $ne: applicationNumber }
        });
        if (existingMobile) {
          return res.status(400).json({
            success: false,
            message: 'Mobile number is already registered with another application.'
          });
        }
      }

      await athlete.save();

      res.json({
        success: true,
        message: 'Application details updated successfully.',
        data: {
          registrationNumber: athlete.registrationNumber,
          updatedFields: Object.keys(updateData),
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while updating the application. Please try again later.'
      });
    }
  }
);

module.exports = router;