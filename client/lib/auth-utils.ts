import { getCurrentUser } from "./auth-api"
import { sessionManager } from "./session-manager"

export async function checkAuthenticationStatus(): Promise<{
  isAuthenticated: boolean
  user: any | null
  redirectTo: string
}> {
  try {
    const user = await getCurrentUser(); // Don't use fallback for auth check

    if (user) {
      // Start session management for mobile users
      if (sessionManager.isMobileDevice()) {
        console.log("📱 Mobile user authenticated, starting session management")
        sessionManager.startSessionRefresh()
      }

      return {
        isAuthenticated: true,
        user,
        redirectTo: "/dashboard",
      }
    }

    // Stop session refresh if user is not authenticated
    sessionManager.stopSessionRefresh()

    return {
      isAuthenticated: false,
      user: null,
      redirectTo: "/auth/login",
    }
  } catch (error) {
    console.log("Auth check failed:", error)
    
    // Stop session refresh on auth failure
    sessionManager.stopSessionRefresh()
    
    return {
      isAuthenticated: false,
      user: null,
      redirectTo: "/auth/login",
    }
  }
}
