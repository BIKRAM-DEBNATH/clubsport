---
name: fix-document-download
description: "Use this prompt to fix document download issues in the athlete registration system frontend/backend. Focus on the download route, auth headers, responseType handling, file path resolution, and Content-Disposition filename handling."
---

When the athlete document download flow is broken, inspect both sides of the implementation:

- backend: `/backend/routes/athlete.js` download route at `GET /api/athlete/download/:id/:field`
- frontend: `/frontend/src/pages/AthleteProfile.jsx` download logic using `responseType: 'blob'`

Check for:
- invalid `field` values or missing `athlete.documents` entries
- incorrect file resolution from local uploads or URL fallback
- auth token and headers being sent from the client
- proper `Content-Disposition` and `Content-Type` handling
- blob creation and anchor download logic in the browser

Examples:
- "Fix athlete document download when files download as empty or fail with 401"
- "Repair the document download route and front-end blob handling"
