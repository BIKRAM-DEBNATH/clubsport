# Production Deployment Guide - Athlete Registration System

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Security Best Practices](#security-best-practices)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All endpoints have proper error handling
- [ ] Input validation is implemented (express-validator)
- [ ] Security headers enabled (helmet middleware)
- [ ] Rate limiting configured
- [ ] CORS properly configured for production origins
- [ ] Console logs removed from critical paths
- [ ] No hardcoded secrets in code

### Environment Variables
- [ ] `.env` file created with production values
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] ADMIN_EMAIL and ADMIN_PASSWORD are changed from defaults
- [ ] MONGODB_URI points to production database
- [ ] NODE_ENV=production set

### Testing
- [ ] Registration form tested end-to-end
- [ ] File upload tested with max sizes
- [ ] Admin login and dashboard functional
- [ ] CSV export works correctly
- [ ] API endpoints tested with valid/invalid data

### Frontend Build
- [ ] Production build runs without errors: `npm run build`
- [ ] dist/ folder generated successfully
- [ ] No console errors in browser dev tools
- [ ] Responsive design verified on mobile

---

## 🔧 Environment Setup

### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/athlete_registration

# JWT
JWT_SECRET=your-strong-jwt-secret-min-32-chars-change-this

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=StrongPassword123!

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://api.yourdomain.com/api
# or for same-origin API:
VITE_API_URL=/api
```

---

## 🗄️ Database Configuration

### MongoDB Setup

#### Option 1: MongoDB Atlas (Recommended for Production)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (M0 free tier for testing)
3. Create database user with strong password
4. Whitelist IP addresses (or allow all for development)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
6. Update `MONGODB_URI` in `.env`

#### Option 2: Self-Hosted MongoDB
```bash
# Install MongoDB
# Start MongoDB with authentication
mongod --auth --dbpath /data/db

# Create admin user
mongo
> use admin
> db.createUser({user: "admin", pwd: "password", roles: ["root"]})
> use athlete_registration
> db.createUser({user: "app_user", pwd: "strong_pass", roles: ["readWrite"]})
```

### Database Optimization
```javascript
// Indexes are auto-created by mongoose schema
// Monitor index performance in production
db.athletes.getIndexes()
```

---

## 🚀 Backend Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Prepare Backend**
```bash
cd backend
npm install
```

2. **Create Vercel Project**
```bash
npm i -g vercel
vercel
```

3. **Set Environment Variables**
   - Go to Vercel Dashboard > Settings > Environment Variables
   - Add: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ALLOWED_ORIGINS

4. **Deploy**
```bash
vercel --prod
```

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**
```bash
npm i -g heroku
heroku login
```

2. **Create Heroku App**
```bash
heroku create athlete-registration-api
```

3. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

### Option 3: Deploy to DigitalOcean / AWS / Azure

1. **Build Docker Image (Optional)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

2. **Deploy Using Your Cloud Provider's CLI**

---

## 🎨 Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

1. **Build the Project**
```bash
cd frontend
npm install
npm run build
```

2. **Push to GitHub**
```bash
git add .
git commit -m "Production build"
git push
```

3. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set Build Command: `npm run build`
   - Set Output Directory: `dist`
   - Add Environment Variable: `VITE_API_URL=https://your-api-domain.com/api`

4. **Deploy** (Automatic on push)

### Option 2: Deploy to GitHub Pages

1. **Update vite.config.js**
```javascript
export default {
  base: '/athlete-registration/', // if deploying to subdirectory
}
```

2. **Build and Deploy**
```bash
npm run build
# Push dist/ to gh-pages branch
```

### Option 3: Deploy to AWS S3 + CloudFront

1. **Build**
```bash
npm run build
```

2. **Upload to S3**
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

---

## 🔐 Security Best Practices

### Essential Security Measures

1. **HTTPS Only**
   - Redirect all HTTP traffic to HTTPS
   - Use SSL certificates (Let's Encrypt free)

2. **API Security**
   - ✅ Rate limiting enabled (10 requests per second per IP)
   - ✅ JWT with 24h expiration
   - ✅ Input validation and sanitization
   - ✅ CORS restricted to known domains
   - ✅ Security headers (helmet middleware)
   - ✅ File upload size limits and type validation

3. **Database Security**
   - Use MongoDB Atlas with IP whitelisting
   - Enable MongoDB authentication
   - Use strong passwords
   - Regular backups

4. **Admin Credentials**
   - Change default admin@sports.com / Admin@123
   - Use strong, unique password
   - Consider 2FA if MongoDB Atlas supports it

5. **Environment Variables**
   - Never commit .env to git
   - Use `.gitignore` to exclude .env
   - Rotate secrets regularly
   - Use different secrets for dev/staging/prod

6. **File Uploads**
   - Files stored in `/uploads` directory
   - Implement virus scanning for production
   - Consider uploading to cloud storage (S3, Azure Blob)

### Security Headers Already Configured
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security
- Content-Security-Policy

---

## 📊 Monitoring & Maintenance

### Logging and Monitoring

1. **Backend Logs**
   - Monitor error logs in production
   - Use service like Sentry or LogRocket for error tracking
   - Check Vercel/Heroku logs: `vercel logs` or `heroku logs --tail`

2. **Database Monitoring**
   - Monitor MongoDB Atlas dashboard
   - Track query performance
   - Set up alerts for high latency

3. **Uptime Monitoring**
   - Use Uptime Robot or similar for health checks
   - Set up alerts for downtime

### Backup Strategy

1. **Database Backups**
   - MongoDB Atlas automatic backups
   - Download full exports weekly
   - Test restore procedures

2. **File Backups**
   - Backup upload directory daily
   - Store in separate cloud storage
   - Retention: 90 days minimum

### Performance Optimization

1. **API Performance**
   - Database indexes created ✅
   - Pagination implemented ✅
   - Response compression enabled ✅

2. **Frontend Performance**
   - Code minification ✅
   - Chunk splitting ✅
   - Image compression ✅
   - CDN distribution

---

## 🔧 Common Maintenance Tasks

### Change Admin Password
```bash
# SSH into server or use MongoDB client
db.admins.updateOne(
  { email: "admin@yourdomain.com" },
  { $set: { password: bcrypt.hashSync("newpassword", 10) } }
)
```

### Restart Backend
```bash
# Vercel: Automatic on new deployment
# Heroku: heroku restart
# Self-hosted: systemctl restart athlete-api
```

### Database Maintenance
```bash
# Check database size
db.stats()

# Rebuild indexes
db.athletes.reIndex()
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"
```
Solution:
- Check MONGODB_URI is correct
- Verify IP is whitelisted in MongoDB Atlas
- Check username/password
- Ensure network connection works
```

#### 2. "JWT token invalid"
```
Solution:
- Verify JWT_SECRET is same in all instances
- Check token expiration (24h)
- Clear localStorage and re-login
```

#### 3. "CORS error in browser"
```
Solution:
- Add domain to ALLOWED_ORIGINS in backend .env
- Format: https://yourdomain.com (no trailing slash)
- Restart backend after changes
```

#### 4. "File upload fails"
```
Solution:
- Check file size < 2MB
- Verify file type (jpg, png, pdf)
- Check /uploads directory has write permissions
- Consider moving uploads to cloud storage
```

#### 5. "Admin login not working"
```
Solution:
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in .env
- Re-seed admin in database
- Check JWT_SECRET is configured
```

### Getting Help

1. Check server logs: `vercel logs` or `heroku logs --tail`
2. Check browser console for frontend errors
3. Review MongoDB Atlas metrics
4. Check API health: `/api/health`

---

## 📝 Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Can submit athlete registration
- [ ] Admin login works
- [ ] CSV export functions
- [ ] All file uploads working
- [ ] Database backups configured
- [ ] Monitoring/alerting enabled
- [ ] SSL certificate valid
- [ ] Custom domain configured
- [ ] Admin credentials changed

---

## 🚨 Emergency Procedures

### If System Goes Down
1. Check backend logs: `vercel logs`
2. Check database status: MongoDB Atlas dashboard
3. Verify environment variables are set
4. Trigger redeploy: `vercel --prod`

### If Database Gets Corrupted
1. Restore from backup in MongoDB Atlas
2. Verify data integrity
3. Re-seed admin user if needed

### If Rate Limited
- Check IP whitelist settings
- Increase RATE_LIMIT_MAX_REQUESTS if needed
- Implement caching on frontend

---

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Production Build](https://vitejs.dev/guide/build.html)
- [OWASP Security Checklist](https://owasp.org/www-project-web-security-testing-guide/)

---

**Last Updated:** April 2026
**Version:** 1.0
**Maintainer:** Your Team
