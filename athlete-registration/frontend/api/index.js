const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const athleteRoutes = require('./routes/athlete');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware - Updated for production
app.use(cors({
  origin: '*', // Allow Vercel frontend domains
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - Disabled for serverless (uploads are memory buffers, URLs simulated)
 // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/athlete', athleteRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Athlete Registration API is running on Vercel', timestamp: new Date() });
});

// MongoDB connect (env var from Vercel dashboard)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Comment out auto-seed for prod - create admin manually once
/*
async function seedAdmin() {
  // ...
}
seedAdmin();
*/

const PORT = process.env.PORT || 5000;
// Remove app.listen() - Vercel handles
// app.listen(PORT, () => { ... });

module.exports = app;

