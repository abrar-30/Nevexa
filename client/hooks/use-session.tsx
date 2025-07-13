"use client"

import { useEffect, useState } from 'react'
import { sessionManager } from '@/lib/session-manager'

export function useSession() {
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    // Initialize mobile detection
    setIsMobile(sessionManager.isMobileDevice())

    // Set up session status monitoring
    const checkSessionStatus = () => {
      // You can add additional session status checks here
      setIsSessionActive(true)
    }

    // Initial check
    checkSessionStatus()

    // Set up periodic checks for mobile devices
    if (sessionManager.isMobileDevice()) {
      const interval = setInterval(checkSessionStatus, 5 * 60 * 1000) // Check every 5 minutes
      return () => clearInterval(interval)
    }
  }, [])

  const refreshSession = async () => {
    try {
      const success = await sessionManager.refreshSession()
      if (success) {
        setLastRefresh(new Date())
        setIsSessionActive(true)
      } else {
        setIsSessionActive(false)
      }
      return success
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setIsSessionActive(false)
      return false
    }
  }

  const startSessionManagement = () => {
    sessionManager.startSessionRefresh()
  }

  const stopSessionManagement = () => {
    sessionManager.stopSessionRefresh()
  }

  return {
    isSessionActive,
    isMobile,
    lastRefresh,
    refreshSession,
    startSessionManagement,
    stopSessionManagement,
  }
}