// API configuration and helper functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

interface ApiResponse<T> {
  success?: boolean
  data?: T
  message?: string
  error?: string
}

class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = "ApiError"
  }
}

// Network connectivity checker
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      timeout: 5000,
    } as any)
    return response.ok
  } catch {
    return false
  }
}

// Retry mechanism
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on authentication errors (401, 403)
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        throw error
      }

      // Don't retry on client errors (400-499) except for 408 (timeout) and 429 (rate limit)
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408 &&
        error.status !== 429
      ) {
        throw error
      }

      if (attempt === maxRetries) {
        break
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`API request failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    if (config.headers && typeof config.headers === 'object' && !Array.isArray(config.headers)) {
      const headers = config.headers as Record<string, string>;
      delete headers["Content-Type"];
      config.headers = headers;
    }
  }

  const operation = async (): Promise<T> => {
    try {
      console.log(`Making API request to: ${url}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`API response status: ${response.status} for ${url}`)

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

        // Only log errors that are not 401 or 403 Unauthorized/Forbidden
        if (response.status !== 401 && response.status !== 403) {
          console.error(`API request failed for ${url}:`, errorMessage)
        }
        throw new ApiError(errorMessage, response.status, errorCode)
      }

      const data = await response.json()
      console.log(`API response data:`, data)
      return data
    } catch (error) {
      // Only log errors that are not 401 or 403 Unauthorized/Forbidden
      if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) {
        console.error(`API request failed for ${url}:`, error)
      }

      if (error instanceof ApiError) {
        throw error
      }

      // Handle network errors
      if (error instanceof TypeError && typeof error.message === 'string' && error.message.includes("fetch")) {
        throw new ApiError("Network connection failed. Please check your internet connection.", 0, "NETWORK_ERROR")
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timed out. Please try again.", 0, "TIMEOUT_ERROR")
      }

      // Handle other errors
      throw new ApiError("An unexpected error occurred. Please try again.", 0, "UNKNOWN_ERROR")
    }
  }

  return withRetry(operation, 3, 1000)
}

export { apiRequest, ApiError, API_BASE_URL, withRetry }
export type { ApiResponse }
