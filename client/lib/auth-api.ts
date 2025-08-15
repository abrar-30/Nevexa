import { apiRequest, setJwtToken, removeJwtToken, getJwtToken } from './api';
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

// Debug function to check authentication status
export function debugAuthStatus(): void {
  const token = getJwtToken()
  console.log('🔐 Auth Debug Status:')
  console.log('Token exists:', !!token)
  if (token) {
    console.log('Token length:', token.length)
    console.log('Token preview:', token.substring(0, 20) + '...')

    // Try to decode JWT payload (without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('Token payload:', payload)
      console.log('Token expires:', new Date(payload.exp * 1000))
      console.log('Token expired:', Date.now() > payload.exp * 1000)

      if (Date.now() > payload.exp * 1000) {
        console.log('⚠️ Token is expired! User needs to log in again.')
        return false
      }
      return true
    } catch (e) {
      console.log('Could not decode token:', e)
      return false
    }
  }
  return false
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getJwtToken()
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() < payload.exp * 1000
  } catch (e) {
    return false
  }
}
