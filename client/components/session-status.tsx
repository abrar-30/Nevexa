"use client"

import { useEffect, useState } from 'react'
import { useSession } from '@/hooks/use-session'

export function SessionStatus() {
  const { isMobile, lastRefresh, isSessionActive } = useSession()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Only show status for mobile users
    if (isMobile && lastRefresh) {
      setShowStatus(true)
      // Hide after 3 seconds
      const timer = setTimeout(() => setShowStatus(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isMobile, lastRefresh])

  if (!isMobile || !showStatus) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      📱 Session refreshed
    </div>
  )
}

export function SessionWarning() {
  const { isMobile, isSessionActive } = useSession()

  if (!isMobile || isSessionActive) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm text-center">
      ⚠️ Session expired. Please refresh the page or login again.
    </div>
  )
}