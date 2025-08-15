"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getJwtToken } from "@/lib/api"

interface InstantAuthGuardProps {
  children: React.ReactNode
}

// Ultra-fast auth guard with no loading state
export function InstantAuthGuard({ children }: InstantAuthGuardProps) {
  const router = useRouter()

  useEffect(() => {
    // Instant check - no async operations
    const token = getJwtToken()
    
    if (!token) {
      router.replace('/auth/login')
      return
    }

    // Quick token expiration check
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const isExpired = Date.now() > payload.exp * 1000
      
      if (isExpired) {
        localStorage.removeItem('jwt')
        router.replace('/auth/login')
        return
      }
    } catch (decodeError) {
      localStorage.removeItem('jwt')
      router.replace('/auth/login')
      return
    }
  }, [router])

  // Always render children immediately - no loading state
  return <>{children}</>
}

// Higher-order component version
export function withInstantAuthGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function InstantAuthGuardedComponent(props: P) {
    return (
      <InstantAuthGuard>
        <Component {...props} />
      </InstantAuthGuard>
    )
  }
}
