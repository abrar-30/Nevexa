"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-api"
import { getJwtToken } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

// Cache authentication status to avoid repeated checks
let authCache: { isAuthenticated: boolean; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthentication = async () => {
      // Check cache first
      if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
        setIsAuthenticated(authCache.isAuthenticated)
        setIsLoading(false)
        return
      }

      // Quick token check (no server call needed)
      const token = getJwtToken()

      if (!token) {
        authCache = { isAuthenticated: false, timestamp: Date.now() }
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      // Quick token expiration check
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const isExpired = Date.now() > payload.exp * 1000

        if (isExpired) {
          localStorage.removeItem('jwt')
          authCache = { isAuthenticated: false, timestamp: Date.now() }
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        // Token exists and is valid - user is authenticated
        authCache = { isAuthenticated: true, timestamp: Date.now() }
        setIsAuthenticated(true)
        setIsLoading(false)

      } catch (decodeError) {
        localStorage.removeItem('jwt')
        authCache = { isAuthenticated: false, timestamp: Date.now() }
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    }

    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated === false && !isLoading) {
      // Simple redirect to login
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show minimal loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )
    )
  }

  // Show nothing while redirecting
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4">
            <Loader2 className="h-8 w-8" />
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}

// Higher-order component for easier usage
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard fallback={fallback}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}
