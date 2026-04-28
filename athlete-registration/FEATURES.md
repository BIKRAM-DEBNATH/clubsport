# Athlete Registration System — Feature Documentation

---

## 1. Document Download (Fixed)

### What Works Now
- All 6 document types can be downloaded: `photo`, `aadhaar`, `birthCertificate`, `addressProof`, `clubLetter`, `parentConsent`
- PDFs download correctly (proper MIME type)
- JPGs download with `.jpg` extension (not as PNG)
- Files stream through backend (no redirect/CORS issues)

### How It Works
- Backend validates the `field` parameter (removed broken `.toLowerCase()`)
- Extracts filename + extension from Cloudinary URL
- Proxies the file via `https.get()` with `Content-Disposition: attachment` header
- Frontend receives blob with correct content-type

---

## 2. Email Notifications (Nodemailer)

### Emails Sent Automatically
| Event | Recipient | Template |
|-------|-----------|----------|
| Registration success | Athlete email | Registration confirmation with reg number |
| Registration failed | Athlete email | Error reason (duplicate, validation, server error) |
| Document upload success | Athlete email | List of uploaded documents |
| Document upload failed | Athlete email | Error details |
| Status updated (single) | Athlete email | Old status → New status with admin remarks |
| Status updated (bulk) | Each athlete email | Same as above for each selected |
| Athlete deleted (bulk) | Each athlete email | Deletion confirmation |

### Configuration
Set these environment variables in `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 3. Mobile-Responsive Admin Dashboard

### Desktop View (>768px)
- Full data table: Reg No, Name, Mobile, Age Group, State, Competitions, Docs, Status, Date
- Horizontal scroll if screen is narrow
- Click row to view athlete profile

### Mobile View (<768px)
- Card layout instead of table
- Each card shows: Reg No, Name, Status Badge, Mobile, State, Date, Missing Docs warning
- "View Profile" button on each card
- Fully readable on phone screens

---

## 4. Bulk Select / Approve / Delete

### Features
- Checkbox on each row (both desktop table and mobile cards)
- "Select All" checkbox
- Selected rows highlighted in blue
- Floating action bar appears at bottom when items are selected

### Actions
- **Approve Selected** — Changes status to "Approved" for all selected athletes
- **Delete Selected** — Permanently deletes all selected athletes (with confirmation)
- **Clear** — Deselects all

### Backend Endpoints
```
PUT  /api/admin/bulk-status  { ids: [...], status: "Approved"|"Rejected", adminRemarks: "..." }
DELETE /api/admin/bulk-delete { ids: [...] }
```

---

## API Endpoints

### Athlete Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/athlete/register | No | Register new athlete |
| POST | /api/athlete/upload-documents/:id | No | Upload documents |
| GET | /api/athlete/download/:id/:field | Yes | Download document |
| GET | /api/athlete/all | Yes | List athletes (paginated) |
| GET | /api/athlete/:id | Yes | Get athlete details |

### Admin Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/admin/login | No | Admin login |
| PUT | /api/admin/status-update/:id | Yes | Update single status |
| PUT | /api/admin/bulk-status | Yes | Bulk update status |
| DELETE | /api/admin/bulk-delete | Yes | Bulk delete athletes |
| GET | /api/admin/export-csv | Yes | Export all data as CSV |
| GET | /api/admin/stats | Yes | Dashboard statistics |

---

## Setup Instructions

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your real credentials
npm start
```

### Frontend (Development)
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Frontend (Production/Vercel)
```bash
cd frontend
npm install
npm run build
# Deploy dist/ folder to Vercel
# Set environment variables in Vercel dashboard
```

---

## Tech Stack
- **Frontend**: React + Vite + React Router
- **Backend**: Express + Mongoose + Cloudinary
- **Database**: MongoDB
- **Email**: Nodemailer (SMTP)
- **Auth**: JWT (Bearer tokens)
- **Deployment**: Vercel (frontend) + Render/Railway (backend)
