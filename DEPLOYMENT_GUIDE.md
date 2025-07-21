# Nevexa Deployment Guide

## 🚀 Current Deployment Status
- **Frontend**: Vercel (`https://nevexa.vercel.app`)
- **Backend**: Render (`https://nevexa.onrender.com`)

## 🔧 CORS Issue Fix

### Problem
CORS errors when frontend tries to access backend API:
```
Access to fetch at 'https://nevexa.onrender.com/api/auth/login' from origin 'https://nevexa.vercel.app' has been blocked by CORS policy
```

### Solution Applied

#### 1. **Enhanced CORS Configuration** (server/app.production.js)
- Added comprehensive CORS headers
- Improved preflight request handling
- Added debugging logs for CORS requests

#### 2. **Environment Variables Required**

**Vercel (Frontend):**
```bash
NEXT_PUBLIC_API_URL=https://nevexa.onrender.com/api
```

**Render (Backend):**
```bash
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

#### 3. **Deployment Steps**

**For Vercel:**
1. Set environment variable: `NEXT_PUBLIC_API_URL=https://nevexa.onrender.com/api`
2. Redeploy the application

**For Render:**
1. Ensure all environment variables are set
2. Redeploy the service
3. Check logs for CORS debugging messages

#### 4. **Troubleshooting**

**Check CORS logs on Render:**
```bash
# Look for these log messages:
CORS request from origin: https://nevexa.vercel.app
CORS allowed for origin: https://nevexa.vercel.app
```

**Test API directly:**
```bash
curl -X OPTIONS https://nevexa.onrender.com/api/auth/login \
  -H "Origin: https://nevexa.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```

**Expected response headers:**
```
Access-Control-Allow-Origin: https://nevexa.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name
Access-Control-Allow-Credentials: true
```

## 🔍 Additional Debugging

### Client-side debugging:
- Check browser console for API Base URL log
- Verify network requests in DevTools
- Check if JWT tokens are being sent

### Server-side debugging:
- Monitor Render logs for CORS messages
- Check if requests are reaching the server
- Verify environment variables are loaded

## 📋 Quick Fix Checklist

1. ✅ Enhanced CORS configuration
2. ✅ Added explicit OPTIONS handling
3. ✅ Improved API URL detection
4. ✅ Added debugging logs
5. ⏳ Set environment variables on Vercel
6. ⏳ Redeploy both services

## 🆘 If Issues Persist

1. **Check Vercel environment variables**
2. **Verify Render service is running**
3. **Test API endpoints directly**
4. **Check browser network tab for actual requests**
5. **Review Render logs for CORS errors**
