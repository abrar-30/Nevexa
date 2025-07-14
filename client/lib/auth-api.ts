import { apiRequest, setJwtToken, removeJwtToken } from './api';
import { ApiError } from './api';
import type { User } from "./posts-api"
import { performanceMonitor } from "./performance"

export interface AuthUser extends User {
  role?: "general" | "admin"
}

// Get current authenticated user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const stopTimer = performanceMonitor.startTimer("getCurrentUser")
  
  try {
    console.log("Attempting to fetch current user...")
    const response = await apiRequest<{ user: AuthUser }>("/users/me")
    console.log("Successfully fetched current user:", response)
    stopTimer()
    return response.user || (response as any)
  } catch (error) {
    stopTimer()
    // console.error("Failed to get current user:", error)

    if (error instanceof ApiError) {
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        console.log("User not authenticated")
        return null
      }

      // Handle network errors
      if (error.status === 0) {
        console.log("Network error fetching current user")
        return null
      }
    }

    throw error
  }
}

// Check if user is authenticated
export async function checkAuthStatus(): Promise<boolean> {
  const stopTimer = performanceMonitor.startTimer("checkAuthStatus")
  
  try {
    const user = await getCurrentUser()
    stopTimer()
    return user !== null
  } catch (error) {
    stopTimer()
    console.error("Auth check failed:", error)
    return false
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const stopTimer = performanceMonitor.startTimer("loginUser")
  
  try {
    const response = await apiRequest<{ user: AuthUser, token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.token) {
      setJwtToken(response.token)
    }
    const user = response.user || (response as any)
    
    stopTimer()
    return user
  } catch (error) {
    stopTimer()
    console.error("Failed to login:", error)
    throw error
  }
}

// Register user
export async function registerUser(userData: {
  name: string
  email: string
  password: string
}): Promise<AuthUser> {
  const stopTimer = performanceMonitor.startTimer("registerUser")
  
  try {
    const response = await apiRequest<{ user: AuthUser, token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    if (response.token) {
      setJwtToken(response.token)
    }
    stopTimer()
    return response.user || (response as any)
  } catch (error) {
    stopTimer()
    console.error("Failed to register:", error)
    throw error
  }
}

export function logoutUser() {
  removeJwtToken()
}
