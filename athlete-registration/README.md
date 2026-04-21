# 🏟️ Athlete Registration System

A full-stack athlete registration portal with 8-step form, admin dashboard, file uploads, and CSV export.

---

## 🗂️ Project Structure

```
athlete-registration/
├── backend/          ← Node.js + Express + MongoDB
│   ├── models/       ← Mongoose schemas (Athlete, Admin)
│   ├── routes/       ← API routes (athlete, admin)
│   ├── middleware/   ← Auth (JWT) + Upload (Multer)
│   ├── uploads/      ← Uploaded files stored here
│   ├── server.js     ← Entry point
│   ├── .env          ← Environment variables
│   └── package.json
│
└── frontend/         ← React + Vite
    ├── src/
    │   ├── pages/    ← RegistrationForm, AdminLogin, AdminDashboard, AthleteProfile
    │   ├── components/form-steps/  ← Step1–Step8
    │   ├── utils/    ← API client, validators, helpers
    │   └── index.css ← Design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** running locally on port 27017
  - Install: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (update MONGODB_URI in `.env`)

---

## 🚀 Quick Start

### 1. Start MongoDB
```bash
mongod
# or on Mac with Homebrew:
brew services start mongodb-community
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
# ✅ Runs on http://localhost:5000
# ✅ Auto-seeds admin: admin@sports.com / Admin@123
```

### 3. Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# ✅ Runs on http://localhost:5173
```

---

## 🔗 URLs

| Page | URL |
|------|-----|
| Athlete Registration Form | http://localhost:5173 |
| Admin Login | http://localhost:5173/admin/login |
| Admin Dashboard | http://localhost:5173/admin/dashboard |
| API Health Check | http://localhost:5000/api/health |

---

## 🔐 Admin Credentials (Default)

```
Email:    admin@sports.com
Password: Admin@123
```
> Change these in `backend/.env` before going to production.

---

## 📋 API Endpoints

### Athlete
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/athlete/register` | Register new athlete |
| POST | `/api/athlete/upload-documents/:id` | Upload documents |
| GET | `/api/athlete/all` | List all (admin, JWT required) |
| GET | `/api/athlete/:id` | Get one (admin, JWT required) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login → returns JWT |
| PUT | `/api/admin/status-update/:id` | Update athlete status |
| GET | `/api/admin/export-csv` | Download all athletes as CSV |
| GET | `/api/admin/stats` | Dashboard statistics |

---

## 🎯 Features Implemented

### 8-Step Registration Form
- ✅ Personal Details (name, DOB, gender, mobile, email)
- ✅ Guardian Details (conditional for under-18 with consent)
- ✅ Address (PIN → auto-detects state)
- ✅ Club / Representation
- ✅ Competition (multi-select events)
- ✅ Document Upload (drag & drop, preview, image compression)
- ✅ Declaration (with insurance section)
- ✅ Payment (UI only, gateway-ready)

### Validation
- ✅ Mobile: exactly 10 digits
- ✅ Email: valid format
- ✅ DOB: auto-calculates age + age group
- ✅ Age < 18: shows parent consent section
- ✅ Insurance expiry: must be future date
- ✅ Duplicate email/mobile: blocked at backend

### Smart Features
- ✅ Auto age group (Sub-Junior, Junior, Youth, U23, Senior, Masters)
- ✅ Auto state from PIN code (major states covered)
- ✅ Save draft to localStorage (auto-save on every change)
- ✅ Conditional insurance section
- ✅ Multi-select competitions with visual toggle

### File Upload
- ✅ Image compression (max 1MB for photo, 2MB for docs)
- ✅ Resize to max 1024px
- ✅ PDF validation (max 2MB)
- ✅ Drag & drop UI with preview
- ✅ Remove/replace files
- ✅ Multer backend with type & size validation

### Admin Dashboard
- ✅ JWT authentication
- ✅ Stats cards (Total, Pending, Approved, Rejected, Missing Docs)
- ✅ Searchable, filterable table
- ✅ Pagination
- ✅ Full athlete profile view
- ✅ Document viewer + download
- ✅ Status toggle (Approve / Reject / Pending)
- ✅ Admin remarks field
- ✅ Missing document highlighting

### Export
- ✅ Export all athletes to CSV
- ✅ All fields included
- ✅ One-click download

---

## 🧪 Testing Checklist

1. **Full flow**: Open http://localhost:5173 → Fill 8 steps → Submit → Check dashboard
2. **Validation**: Try submitting with 9-digit mobile, bad email, past insurance date
3. **Duplicate**: Register same email/mobile twice → Should get error
4. **Guardian**: Set DOB < 18 years → Guardian section appears with consent checkbox
5. **PIN auto-state**: Enter a valid 6-digit PIN → State auto-fills
6. **Documents**: Drag & drop images and PDFs, check compression
7. **Admin login**: Go to /admin/login, use credentials above
8. **Status update**: Open athlete profile, change status, add remarks
9. **CSV export**: Click "Export CSV" on dashboard

---

## 🔧 Environment Variables (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/athlete_registration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
ADMIN_EMAIL=admin@sports.com
ADMIN_PASSWORD=Admin@123
NODE_ENV=development
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS with CSS variables |
| HTTP Client | Axios |
| Image Compression | browser-image-compression |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| File Upload | Multer |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Export | Custom CSV serialization |

---

## 🚀 Production Deployment

### Quick Start (5 minutes)
1. **Set up MongoDB**: Create free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Configure Backend**: Update `backend/.env` with production values
3. **Configure Frontend**: Update `frontend/.env.production` with API URL
4. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) guide

### Recommended Platforms
- **Frontend**: Vercel (automatic deploys from GitHub)
- **Backend**: Vercel Serverless Functions or Heroku
- **Database**: MongoDB Atlas (free tier available)

### Security Checklist
- ✅ JWT tokens with 24h expiration
- ✅ Rate limiting (100 requests/15 min per IP)
- ✅ Security headers (helmet middleware)
- ✅ Input validation & sanitization
- ✅ File upload restrictions (type & size)
- ✅ CORS configured for known domains only
- ✅ Database indexes optimized
- ✅ Error handling & logging

**👉 See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment guide.**

---

## 🔒 Security Features

- **Authentication**: JWT tokens with bcrypt password hashing
- **CORS**: Restricted to whitelisted origins
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Express-validator on all endpoints
- **File Security**: Type & size validation, secure filenames
- **Error Handling**: Structured error responses, no sensitive data leaks
- **Database**: Unique indexes on email/mobile to prevent duplicates
- **Headers**: Security headers via Helmet middleware

---

## 📊 Performance Optimizations

- **Frontend**: Code splitting, minification, image compression
- **Backend**: Database indexes, pagination, response compression
- **API**: Efficient queries, proper response caching headers
- **Files**: Smart chunk loading, lazy initialization

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

This project is private and confidential.

---

## 📞 Support

For deployment questions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Last Updated**: April 2026 | **Status**: Production-Ready ✅
