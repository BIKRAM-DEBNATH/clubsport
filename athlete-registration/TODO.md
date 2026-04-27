# Chatbot Backend Connection Routing Fix - TODO

## Plan Steps

- [x] 1. Analyze codebase and identify routing issues
- [x] 2. Update `frontend/src/components/Chatbot.jsx` - Replace `fetch()` with centralized `api` utility
- [x] 3. Update `frontend/api/index.js` - Add missing chatbot route import and mounting
- [x] 4. Create `frontend/api/routes/chatbot.js` - Add serverless-compatible chatbot routes
- [x] 5. Test and verify the fixes

## Notes
- Chatbot.jsx currently uses raw `fetch()` with hardcoded `/api/chatbot/...` paths
- Other components properly use `api` utility from `../utils/api`
- Vercel serverless API (`frontend/api/index.js`) missing chatbot routes entirely
- No `frontend/api/routes/chatbot.js` exists for serverless deployment

