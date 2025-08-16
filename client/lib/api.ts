// API configuration and helper functions
const getApiBaseUrl = () => {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('🌐 Using API URL from environment:', process.env.NEXT_PUBLIC_API_URL)
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Fallback based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    console.log('🌐 Current hostname:', hostname)

    if (hostname.includes('vercel.app') || hostname.includes('nevexa')) {
      const apiUrl = 'https://nevexa.onrender.com/api'
      console.log('🌐 Using production API URL:', apiUrl)
      return apiUrl
    }
  }

  // Local development fallback
  const localUrl = 'http://localhost:5000/api'
  console.log('🌐 Using local development API URL:', localUrl)
  return localUrl
}

const API_BASE_URL = getApiBaseUrl()
console.log('🌐 Final API Base URL:', API_BASE_URL)
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

// Remove debug log for production
// console.log('DEBUG: NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL);

// Network connectivity checker
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      timeout: 2000, // Reduced from 5000ms
    } as any)
    return response.ok
  } catch {
    return false
  }
}

// Retry mechanism
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 2, delay = 500): Promise<T> { // Reduced retries and delay
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

// JWT helpers
export function setJwtToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt', token)
  }
}
export function getJwtToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt')
  }
  return null
}
export function removeJwtToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt')
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  console.log('🌐 Making API request to:', url)
  console.log('🔧 Request options:', { method: options.method || 'GET', endpoint })

  // Attach JWT if present
  const jwt = getJwtToken()
  const headers: Record<string, string> = {
    ...options.headers as any,
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (jwt) {
    headers["Authorization"] = `Bearer ${jwt}`
    console.log('🔑 JWT token attached (length:', jwt.length, ')')
  } else {
    console.log('⚠️ No JWT token found')
  }

  const config: RequestInit = {
    headers,
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
      // Remove debug logs for production
      // console.log(`Making API request to: ${url}`)
      // console.log(`Request config:`, {
      //   method: config.method || 'GET',
      //   credentials: config.credentials,
      //   headers: config.headers
      // })
      
      const controller = new AbortController()

      // Increase timeout for file uploads
      const isFileUpload = config.body instanceof FormData
      const timeoutDuration = isFileUpload ? 30000 : 30000; // Further increased timeout for regular requests to 30 seconds

      const timeoutId = setTimeout(() => {
        console.log(`⏰ Request timeout after ${timeoutDuration/1000} seconds for:`, url)
        controller.abort()
      }, timeoutDuration)

      console.log('📡 Sending fetch request with config:', {
        method: config.method || 'GET',
        headers: Object.keys(config.headers || {}),
        hasBody: !!config.body
      })

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log('✅ Fetch response received:', response.status, response.statusText)

      // Remove debug logs for production
      // console.log(`API response status: ${response.status} for ${url}`)
      // console.log(`Response headers:`, Object.fromEntries(response.headers.entries()))

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
      // Remove debug log for production
      // console.log(`API response data:`, data)
      return data
    } catch (error) {
      // Only log non-401 errors to avoid spam in console
      if (!(error instanceof ApiError && error.status === 401)) {
        console.error(`❌ API request failed for ${url}:`, error)
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }

      if (error instanceof ApiError) {
        throw error
      }

      // Handle network errors (CORS, DNS, connection refused, etc.)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error('🌐 Network error detected. Possible causes:')
        console.error('- CORS policy blocking the request')
        console.error('- Server is down or unreachable')
        console.error('- DNS resolution failed')
        console.error('- SSL/TLS certificate issues')

        throw new ApiError(
          `Network error: Unable to connect to ${API_BASE_URL}. This might be a CORS issue or the server might be down.`,
          0,
          "NETWORK_ERROR"
        )
      }

      // Handle timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        console.error('⏰ Request timeout detected')
        throw new ApiError("Request timed out after 5 seconds. The server might be slow or unreachable.", 0, "TIMEOUT_ERROR")
      }

      // Handle other errors
      throw new ApiError("An unexpected error occurred. Please try again.", 0, "UNKNOWN_ERROR")
    }
  }

  return withRetry(operation, 2, 500) // Reduced retries and delay
}

export { apiRequest, ApiError, API_BASE_URL, withRetry }
export type { ApiResponse }
