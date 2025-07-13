# Authentication Troubleshooting Guide

## Current Issue
Getting 401 Unauthorized error on `/api/users/me` endpoint on Render deployment.

## Changes Made

### 1. Session Configuration Improvements
- Added explicit session name: `nevexa.session`
- Improved cookie settings for cross-origin requests
- Added better MongoDB session store configuration

### 2. CORS Configuration Updates
- Added regex pattern for Vercel preview URLs
- Improved origin checking logic
- Better logging for CORS decisions

### 3. Enhanced Debugging
- Added comprehensive logging in authentication middleware
- Added session and cookie test endpoints
- Improved error responses with debug information

## Testing Steps

### Step 1: Test Basic Connectivity
```bash
curl https://nevexa.onrender.com/api/health
```

### Step 2: Test Session Persistence
```bash
curl -c cookies.txt https://nevexa.onrender.com/api/session-test
curl -b cookies.txt https://nevexa.onrender.com/api/session-test
```
The `views` counter should increment between calls.

### Step 3: Test Cookie Handling
```bash
curl -c cookies.txt https://nevexa.onrender.com/api/cookie-test
curl -b cookies.txt https://nevexa.onrender.com/api/cookie-test
```

### Step 4: Test Authentication Flow
```bash
# Login (replace with real credentials)
curl -c cookies.txt -X POST https://nevexa.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Test auth status
curl -b cookies.txt https://nevexa.onrender.com/api/auth-test

# Test /api/users/me
curl -b cookies.txt https://nevexa.onrender.com/api/users/me
```

## Common Issues and Solutions

### Issue 1: Cookies Not Being Set
**Symptoms**: Session test shows different session IDs on each request
**Solution**: Check CORS configuration and ensure frontend is sending `withCredentials: true`

### Issue 2: Session Not Persisting
**Symptoms**: Session data resets between requests
**Possible Causes**:
- MongoDB connection issues
- Session store configuration problems
- Cookie not being sent by client

### Issue 3: CORS Blocking Requests
**Symptoms**: CORS error in browser console
**Solution**: Ensure frontend domain is in `allowedOrigins` array

### Issue 4: Secure Cookie Issues
**Symptoms**: Cookies work locally but not in production
**Solution**: Ensure HTTPS is properly configured on Render

## Frontend Configuration Required

Ensure your frontend (Vercel) is configured to send credentials:

```javascript
// For axios
axios.defaults.withCredentials = true;

// For fetch
fetch(url, {
  credentials: 'include'
});
```

## Environment Variables to Check

Ensure these are set on Render:
- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: A secure random string
- `NODE_ENV`: Set to 'production'

## Debug Endpoints Added

1. `/api/health` - Basic health check
2. `/api/session-test` - Test session persistence
3. `/api/cookie-test` - Test cookie setting/reading
4. `/api/auth-test` - Test authentication status

## Next Steps

1. Deploy the updated code to Render
2. Test the debug endpoints
3. Check Render logs for detailed error messages
4. Verify frontend is sending credentials correctly
5. Test the complete authentication flow

## Render-Specific Considerations

1. **Proxy Configuration**: Render uses proxies, ensure `proxy: true` in session config
2. **HTTPS**: All cookies must be secure in production
3. **Domain**: Don't set explicit domain in cookie config for Render
4. **Headers**: Ensure proper CORS headers are set

## If Issues Persist

1. Check Render deployment logs
2. Verify MongoDB connection is working
3. Test with a simple curl command to isolate the issue
4. Consider using Redis for session store if MongoDB sessions are problematic