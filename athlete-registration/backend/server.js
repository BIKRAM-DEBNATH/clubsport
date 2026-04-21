const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const athleteRoutes = require('./routes/athlete');
const adminRoutes = require('./routes/admin');

const app = express();
const isDev = process.env.NODE_ENV === 'development';

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration - read from env or use defaults
const allowedOrigins = isDev 
  ? ['http://localhost:5173', 'http://localhost:3000', 'https://sportclub-p3rp.onrender.com']
  : (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Rate limiting for general routes
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

// Body size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/admin/login', authLimiter);

// ============================================
// STATIC FILES & ROUTES
// ============================================

// Static files for uploads with security
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1h',
  etag: false
}));

// Routes
app.use('/api/athlete', athleteRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Athlete Registration API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error
  console.error('❌ Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode,
    message: err.message,
    ...(isDevelopment && { stack: err.stack })
  });

  res.status(statusCode).json({
    success: false,
    message: isDevelopment ? err.message : 'An error occurred',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    const mongoOptions = {
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      retryWrites: true,
    };

    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ MongoDB connected successfully');
    
    // Seed admin on first run
    await seedAdmin();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Seed default admin user
async function seedAdmin() {
  try {
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sports.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existing = await Admin.findOne({ email: adminEmail });
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await Admin.create({
        email: adminEmail,
        password: hash,
        name: 'Super Admin'
      });
      console.log(`✅ Admin user seeded: ${adminEmail}`);
    }
  } catch (err) {
    console.error('⚠️  Admin seed warning:', err.message);
  }
}

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server is running`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n✅ All systems initialized successfully\n`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});
