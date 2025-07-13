import { getCurrentUser } from "./auth-api"

export async function checkAuthenticationStatus(): Promise<{
  isAuthenticated: boolean
  user: any | null
  redirectTo: string
}> {
  try {
    const user = await getCurrentUser(); // Don't use fallback for auth check

    if (user) {
      return {
        isAuthenticated: true,
        user,
        redirectTo: "/dashboard",
      }
    }

    return {
      isAuthenticated: false,
      user: null,
      redirectTo: "/auth/login",
    }
  } catch (error) {
    console.log("Auth check failed:", error)
    
    return {
      isAuthenticated: false,
      user: null,
      redirectTo: "/auth/login",
    }
  }
}
