// Fixed authentication API with better cross-domain cookie handling
import { ApiError } from "./api"
import type { User } from "./posts-api"
import { performanceMonitor } from "./performance"

export interface AuthUser extends User {
  role?: "general" | "admin"
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Enhanced API request function specifically for auth
async function authApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Ensure endpoint starts with /api
  if (!endpoint.startsWith('/api') && !endpoint.startsWith('/auth')) {
    endpoint = `/api${endpoint}`;
  }
  
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Critical for cross-domain cookies
    ...options,
  }

  try {
    console.log(`Auth API request to: ${url}`)

    const response = await fetch(url, config)

    console.log(`Auth API response status: ${response.status} for ${url}`)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorCode = response.status.toString()

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        errorCode = errorData.code || errorCode
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new ApiError(errorMessage, response.status, errorCode)
    }

    // For non-JSON responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    } else {
      // Handle non-JSON responses (like text)
      const text = await response.text()
      try {
        // Try to parse as JSON anyway in case content-type is wrong
        return JSON.parse(text)
      } catch {
        // Return as text wrapped in an object
        return { text } as unknown as T
      }
    }
  } catch (error) {
    console.error(`Auth API request failed for ${url}:`, error)
    throw error
  }
}

// Get current authenticated user
export async function getCurrentUser(): Promise<AuthUser | null> {
  const stopTimer = performanceMonitor.startTimer("getCurrentUser")
  
  try {
    console.log("Attempting to fetch current user...")
    // First try the auth test endpoint
    try {
      const authTest = await authApiRequest<{authenticated: boolean, user?: AuthUser}>("/api/auth-test")
      if (authTest.authenticated && authTest.user) {
        console.log("Auth test successful, user authenticated:", authTest.user)
        stopTimer()
        return authTest.user
      }
    } catch (error) {
      console.log("Auth test failed, trying regular endpoint...")
    }
    
    // Fall back to regular endpoint
    const response = await authApiRequest<{ user: AuthUser }>("/api/users/me")
    console.log("Successfully fetched current user:", response)
    stopTimer()
    return response.user || (response as any)
  } catch (error) {
    stopTimer()
    console.error("Failed to get current user:", error)

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

    return null
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
    const response = await authApiRequest<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    stopTimer()
    return response.user || (response as any)
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
    const response = await authApiRequest<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    stopTimer()
    return response.user || (response as any)
  } catch (error) {
    stopTimer()
    console.error("Failed to register:", error)
    throw error
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  const stopTimer = performanceMonitor.startTimer("logoutUser")
  
  try {
    await authApiRequest("/api/auth/logout", {
      method: "POST",
    })
    stopTimer()
  } catch (error) {
    stopTimer()
    console.error("Failed to logout:", error)
    throw error
  }
}