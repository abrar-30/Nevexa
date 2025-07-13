# Mobile Session Management Fix

## Problem
Users were getting logged out frequently/unexpectedly on mobile devices due to:

1. **Mobile Browser Behavior**: Mobile browsers are more aggressive about clearing cookies and sessions
2. **Background App Handling**: When mobile apps go to background, sessions can be lost
3. **Cross-Origin Cookie Issues**: Mobile browsers handle cross-site cookies differently
4. **Short Session Timeouts**: Original 24-hour sessions were too short for mobile usage patterns

## Solution Overview

### 1. Server-Side Changes

#### Extended Session Configuration
- **Session Duration**: Increased from 1 day to 7 days for mobile users
- **Rolling Sessions**: Added `rolling: true` to reset expiration on each request
- **Touch Frequency**: Reduced from 24 hours to 1 hour for more frequent session updates

#### Mobile Detection Middleware
```javascript
// Detects mobile browsers and extends sessions automatically
const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
```

#### Session Refresh Endpoint
- New endpoint: `POST /api/session/refresh`
- Allows mobile clients to manually refresh sessions
- Extends session expiration for authenticated users

### 2. Client-Side Changes

#### Session Manager (`lib/session-manager.ts`)
- **Mobile Detection**: Automatically detects mobile devices
- **Automatic Refresh**: Refreshes sessions every 30 minutes for mobile users
- **Visibility Handling**: Refreshes session when app becomes visible
- **Network Handling**: Refreshes session when device comes online

#### Event Handlers
- `visibilitychange`: Refreshes session when user returns to app
- `focus`: Refreshes session when window gains focus
- `online`: Refreshes session when device reconnects

#### React Integration
- **useSession Hook**: Provides session management in React components
- **Session Status Components**: Shows refresh notifications to users

### 3. Implementation Details

#### Files Modified
1. `server/app.production.js` - Production session configuration
2. `server/app.js` - Development session configuration
3. `client/lib/session-manager.ts` - New session management utility
4. `client/lib/auth-utils.ts` - Updated to use session manager
5. `client/lib/auth-api.ts` - Updated login/logout to manage sessions
6. `client/hooks/use-session.tsx` - New React hook for session management
7. `client/components/session-status.tsx` - New UI components for session feedback

#### Key Configuration Changes
```javascript
// Before
cookie: {
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  sameSite: 'none',
  secure: true
}

// After
cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: 'none',
  secure: true
},
rolling: true, // Reset expiration on each request
```

### 4. Mobile-Specific Features

#### Automatic Session Extension
- Mobile users' sessions are automatically extended on each authenticated request
- Sessions are refreshed when the app becomes visible after being backgrounded

#### Smart Refresh Strategy
- Refreshes every 30 minutes during active use
- Refreshes immediately when app regains focus
- Refreshes when network connection is restored

#### User Feedback
- Shows brief notification when session is refreshed (mobile only)
- Shows warning if session expires and needs manual refresh

### 5. Usage Instructions

#### For Developers
1. The session manager is automatically initialized
2. No additional setup required for basic functionality
3. Optional: Add session status components to your layout

```tsx
import { SessionStatus, SessionWarning } from '@/components/session-status'

export default function Layout({ children }) {
  return (
    <div>
      <SessionStatus />
      <SessionWarning />
      {children}
    </div>
  )
}
```

#### For Users
- Mobile users will experience fewer unexpected logouts
- Sessions will automatically refresh in the background
- Brief notifications will appear when sessions are refreshed

### 6. Testing

#### Test Session Refresh
```bash
# Test the session refresh endpoint
curl -X POST http://localhost:5000/api/session/refresh \
  -H "Cookie: your-session-cookie" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
```

#### Test Mobile Detection
```bash
# Check if mobile detection works
curl http://localhost:5000/api/debug-auth \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
```

### 7. Monitoring

#### Server Logs
Look for these log messages:
- `📱 Mobile device detected: true`
- `🔄 Session refresh requested`
- `✅ Session refreshed successfully`

#### Client Logs
Look for these log messages:
- `📱 Mobile user authenticated, starting session management`
- `📱 Page became visible, refreshing session for mobile`
- `✅ Session refreshed successfully`

### 8. Fallback Behavior

If session refresh fails:
1. User is redirected to login page
2. Session management is stopped
3. Error is logged for debugging

### 9. Performance Considerations

- Session refresh only occurs for mobile users
- Refresh frequency is optimized (30 minutes vs continuous)
- Network requests are minimized through smart event handling
- Desktop users are unaffected by mobile optimizations

### 10. Security Considerations

- Session refresh requires existing valid session
- Mobile detection doesn't affect security model
- Extended session duration is balanced with automatic refresh
- All existing authentication and authorization remains unchanged

## Deployment Notes

1. Deploy server changes first (both app.js and app.production.js)
2. Deploy client changes
3. Monitor logs for mobile session activity
4. Test with actual mobile devices after deployment

## Future Improvements

1. **Push Notifications**: Notify users before session expires
2. **Offline Support**: Cache session state for offline scenarios
3. **Biometric Re-auth**: Quick re-authentication using device biometrics
4. **Session Analytics**: Track session duration and refresh patterns