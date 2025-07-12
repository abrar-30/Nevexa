import { apiRequest, ApiError } from "./api"
import type { User } from "./posts-api"

export interface AuthUser extends User {
  role?: "general" | "admin"
}

// Get current authenticated user
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log("Attempting to fetch current user...")
    const response = await apiRequest<{ user: AuthUser }>("/users/me")
    console.log("Successfully fetched current user:", response)
    return response.user || (response as any)
  } catch (error) {
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
  try {
    const user = await getCurrentUser()
    return user !== null
  } catch (error) {
    console.error("Auth check failed:", error)
    return false
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  try {
    const response = await apiRequest<{ user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    return response.user || (response as any)
  } catch (error) {
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
  try {
    const response = await apiRequest<{ user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    return response.user || (response as any)
  } catch (error) {
    console.error("Failed to register:", error)
    throw error
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    })
  } catch (error) {
    console.error("Failed to logout:", error)
    throw error
  }
}
