# Session Cookie Issue Debug Guide

## Current Situation
You have **two session cookies** which is causing authentication confusion:
1. `connect.sid` (old session)
2. `nevexa.session` (new session with user data)

## NEW DEBUG ENDPOINTS ADDED

### 1. Debug Authentication
```
https://nevexa.onrender.com/api/debug-auth
```
This will show detailed authentication state and check if user exists in database.

### 2. Test User Directly (Bypass Auth)
```
https://nevexa.onrender.com/api/test-user/abrarchhapavala05@gmail.com
```
This bypasses authentication to verify the user exists and the controller works.

## Immediate Steps to Test

### Step 1: Clear All Cookies
Visit this endpoint to clear all cookies:
```
https://nevexa.onrender.com/api/clear-cookies
```

### Step 2: Test Auth Status (Should Fail)
```
https://nevexa.onrender.com/api/auth-test
```
Should return `authenticated: false`

### Step 3: Fresh Login
Use your frontend or Postman to login again:
```
POST https://nevexa.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "abrarchhapavala05@gmail.com",
  "password": "your-password"
}
```

### Step 4: Test Auth Status (Should Work)
```
https://nevexa.onrender.com/api/auth-test
```
Should return `authenticated: true`

### Step 5: Test /api/users/me (Should Work)
```
https://nevexa.onrender.com/api/users/me
```
Should return your user data

## What to Look For

### In the Session Test Response:
- Only ONE session cookie should be present
- Should be `nevexa.session=...` (not `connect.sid`)
- `passport.user` should contain your email

### In the Auth Test Response:
- `authenticated: true`
- `user` object should be populated

### In the Server Logs:
Look for these debug messages when accessing `/api/users/me`:
```
🔐 Auth middleware - URL: /api/users/me
🔐 Auth middleware - Session ID: [session-id]
🔐 Auth middleware - User: [user-object]
✅ Authentication successful for user: abrarchhapavala05@gmail.com
```

## If Still Getting 401 Error

### Check These in Order:

1. **Multiple Cookies Issue**
   - Clear browser cookies completely
   - Use incognito/private browsing
   - Or use the `/api/clear-cookies` endpoint

2. **Frontend Cookie Settings**
   - Ensure `withCredentials: true` in your frontend requests
   - Check CORS settings allow credentials

3. **Session Store Issue**
   - Check MongoDB connection
   - Verify session collection exists

4. **Passport Deserialization Issue**
   - Check if user still exists in database
   - Verify passport configuration

## Browser Testing Commands

### Using Browser Console:
```javascript
// Clear all cookies for the domain
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Test fetch with credentials
fetch('https://nevexa.onrender.com/api/users/me', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### Using curl:
```bash
# Clear cookies and start fresh
rm -f cookies.txt

# Login and save cookies
curl -c cookies.txt -X POST https://nevexa.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abrarchhapavala05@gmail.com","password":"your-password"}'

# Test /api/users/me with saved cookies
curl -b cookies.txt https://nevexa.onrender.com/api/users/me
```

## Expected Flow After Fix

1. ✅ Clear cookies → No authentication
2. ✅ Login → Get single `nevexa.session` cookie
3. ✅ Auth test → `authenticated: true`
4. ✅ `/api/users/me` → Returns user data

## Root Cause Analysis

The issue was caused by:
1. **Environment misconfiguration** (fixed ✅)
2. **Multiple session cookies** (needs cleanup)
3. **Session name change** during deployment

The session name change from `connect.sid` to `nevexa.session` created two separate sessions, and the authentication middleware might be checking the wrong one.