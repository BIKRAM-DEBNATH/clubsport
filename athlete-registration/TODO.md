# Athlete Registration System - Vercel Production Deployment TODO

## Current Status
✅ Plan approved and updated

## Deployment Steps (Vercel Monorepo - Frontend + Serverless Backend)

### 1. Setup Prerequisites [Pending]
- [ ] Create MongoDB Atlas free cluster, get MONGODB_URI
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Git init/commit/push to GitHub (if not repo exists)

### 2. Code Changes
- [x] Update frontend/.env with VITE_API_URL=/api
- [x] Update frontend/src/utils/api.js to use VITE_API_URL
- [x] Update frontend/vite.config.js (remove proxy)
- [x] Create frontend/vercel.json (rewrites)
- [x] Refactor backend to frontend/api/index.js (serverless handler)
- [x] Update CORS in api/index.js to allow Vercel origins

[x] Merge backend deps to frontend/package.json (manual npm install done next)

### 3. Local Test [Pending]
- [ ] `cd athlete-registration/frontend && npm install`
- [ ] `vercel dev` (tests monorepo)
- [ ] Test registration flow + admin

### 4. Deploy [Pending]
- [ ] `vercel login`
- [ ] `vercel` (deploy preview)
- [ ] Set env vars in Vercel dashboard: MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
- [ ] `vercel --prod`

### 5. Post-Deploy [Pending]
- [ ] Test prod URLs
- [ ] If separate backend needed, change VITE_API_URL and redeploy frontend

**Next Step**: User to complete prerequisites (Atlas URI), then I'll implement code changes step-by-step.

