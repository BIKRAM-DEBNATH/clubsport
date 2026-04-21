# Security Policy

## 🔒 Overview

This document outlines the security measures implemented in the Athlete Registration System.

---

## Security Layers

### 1. Authentication & Authorization

**JWT (JSON Web Tokens)**
- 24-hour token expiration
- Tokens stored in localStorage (httpOnly for production recommended)
- Tokens verified on protected routes
- Automatic logout on token expiration

**Password Hashing**
- bcryptjs with salt rounds (10)
- Never store plain passwords
- Unique admin credentials per environment

### 2. Input Validation & Sanitization

**Backend Validation**
- Express-validator on all endpoints
- Type checking (string, number, date, enum)
- Length limits (min/max)
- Format validation (email, phone, dates)
- Regex for phone numbers (10 digits only)

**Frontend Validation**
- Real-time field validation
- Mobile: exactly 10 digits
- Email: standard email format
- DOB: past date only, auto-calculates age
- PIN: 6 digits, auto-detects state

**Regex Injection Protection**
- Search terms sanitized to prevent regex injection
- Special characters escaped in MongoDB queries

### 3. API Security

**Rate Limiting**
```
Global: 100 requests per 15 minutes per IP
Auth: 5 login attempts per 15 minutes per IP
```

**CORS (Cross-Origin Resource Sharing)**
```
- Whitelist specific origins only
- Credentials allowed for auth
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Custom headers: Content-Type, Authorization
```

**Security Headers (Helmet)**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: ...
```

### 4. File Upload Security

**Validation**
- MIME type checking (whitelist approach)
- File extension validation
- File size limits: 2MB per file
- Maximum 5 files per upload

**Secure Storage**
```
- Files stored in backend/uploads/
- Cryptographically secure filenames
- Served statically with cache headers
- No code execution from uploads directory
```

**Allowed File Types**
```
Images: JPG, JPEG, PNG (max 2MB)
Documents: PDF, JPG, JPEG, PNG (max 2MB)
```

### 5. Database Security

**MongoDB**
- Connection pooling (10 connections)
- Proper authentication in production
- Indexes on frequently queried fields
- Unique constraints on email/mobile
- No sensitive data in logs

**Indexes**
```javascript
email (unique)
mobile (unique)
registrationNumber (unique)
status
ageGroup
createdAt
```

### 6. Secure Practices

**Environment Variables**
```bash
# ✅ DO
ADMIN_PASSWORD=StrongPassword123!
JWT_SECRET=min32charsecuresecretkey

# ❌ DON'T
admin_password in code
JWT_SECRET in frontend code
```

**Error Handling**
- Generic error messages to users
- Detailed logs for developers (development only)
- No stack traces exposed in production
- Database errors properly handled

**Logging**
- Errors logged with timestamp
- No passwords logged
- No sensitive data in logs
- Configurable log levels

### 7. Network Security

**HTTPS**
- Required for production
- SSL/TLS certificates
- Redirect HTTP → HTTPS
- Secure cookies (production)

**API Endpoints**
- Protected routes require JWT
- Tokens verified on each request
- Token validation errors return 401

---

## Vulnerability Scanning

### Dependencies
- Regularly update npm packages
- Run `npm audit` to check for vulnerabilities
- Use `npm audit fix` to patch issues

```bash
npm outdated    # Check for updates
npm update      # Update packages
npm audit       # Check security vulnerabilities
```

### Testing
- Input validation testing
- File upload security testing
- Authentication flow testing
- Rate limiting testing

---

## Production Security Checklist

- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure ALLOWED_ORIGINS properly
- [ ] Set NODE_ENV=production
- [ ] Database backups configured
- [ ] Error logging/monitoring enabled
- [ ] Rate limiting tested
- [ ] File upload directory restrictions set
- [ ] Regular security audits scheduled

---

## Incident Response

### If Credentials Compromised
1. Change admin password immediately
2. Rotate JWT_SECRET
3. Invalidate existing tokens
4. Check access logs
5. Update database audit trail

### If Database Breached
1. Restore from clean backup
2. Change all credentials
3. Review access logs
4. Notify users if needed
5. Update security policies

### If API Attacked
1. Check rate limiting logs
2. Block malicious IPs
3. Scale resources if DDoS
4. Review error logs for patterns
5. Consider WAF (Web Application Firewall)

---

## Updates & Patches

### Regular Updates
- Check for npm package updates monthly
- Subscribe to security advisories
- Test updates in staging environment
- Deploy patches to production

### Security Advisories
- npm Security Advisories: https://www.npmjs.com/advisories
- GitHub Security Alerts: Enable in repository settings
- MongoDB Security Releases: https://docs.mongodb.com/manual/release-notes/

---

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security details privately
3. Include: Description, Impact, Reproduction steps
4. Allow 48 hours for initial response

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)
- [npm Security Documentation](https://docs.npmjs.com/cli/v7/using-npm/security)

---

**Last Updated**: April 2026
**Status**: Production Ready
