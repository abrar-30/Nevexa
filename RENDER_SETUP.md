# Render Environment Setup

## Critical Issue Found
Your Render deployment is running in **development mode** instead of production mode. This is causing the authentication issues.

## Required Environment Variables on Render

Go to your Render dashboard → Your service → Environment tab and set these variables:

### 1. NODE_ENV (CRITICAL)
```
NODE_ENV=production
```

### 2. Session Secret
```
SESSION_SECRET=your-super-secret-random-string-here
```

### 3. MongoDB URI
```
MONGODB_URI=your-mongodb-connection-string
```

### 4. Optional: Force Production (Backup)
```
FORCE_PRODUCTION=true
```

## How to Set Environment Variables on Render

1. Go to https://dashboard.render.com
2. Click on your service (nevexa backend)
3. Go to the "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable above

## After Setting Environment Variables

1. **Redeploy** your service (Render should auto-deploy)
2. **Test the session endpoint** again:
   ```
   https://nevexa.onrender.com/api/session-test
   ```
3. Look for these changes in the response:
   - `"environment": "production"`
   - `"isProduction": true`
   - `"actuallyProduction": true`
   - Cookie should show `"secure": true` and `"sameSite": "none"`

## Expected Session Test Response (After Fix)
```json
{
  "sessionID": "some-session-id",
  "views": 1,
  "session": {
    "cookie": {
      "originalMaxAge": 86400000,
      "expires": "2025-07-15T...",
      "secure": true,
      "httpOnly": true,
      "path": "/",
      "sameSite": "none"
    },
    "views": 1
  },
  "cookies": "nevexa.session=s%3A...",
  "environment": "production",
  "isProduction": true,
  "actuallyProduction": true
}
```

## Why This Fixes the Authentication Issue

1. **Secure Cookies**: In production mode, cookies are marked as `secure: true`
2. **SameSite None**: Required for cross-origin requests (Vercel → Render)
3. **Proper Session Name**: Will use `nevexa.session` instead of `connect.sid`
4. **HTTPS Required**: Secure cookies only work over HTTPS (which Render provides)

## Testing After Fix

1. **Deploy** the updated code
2. **Set environment variables** on Render
3. **Test session persistence**:
   ```bash
   curl -c cookies.txt https://nevexa.onrender.com/api/session-test
   curl -b cookies.txt https://nevexa.onrender.com/api/session-test
   ```
4. **Test authentication flow** with your frontend

## If Still Having Issues

Check the Render logs for the startup messages. You should see:
```
🌍 Environment Variables:
NODE_ENV: production
isProduction: true
...
✅ Server running in production mode on port 10000
🔧 Actual mode: PRODUCTION
🍪 Cookies will be: secure with sameSite=none
```