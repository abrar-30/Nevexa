"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react'
import { cookieDetector, type CookieDetectionResult } from '@/lib/cookie-detector'

interface CookieWarningProps {
  onDismiss?: () => void
  showOnSuccess?: boolean
  className?: string
}

export function CookieWarning({ onDismiss, showOnSuccess = false, className = '' }: CookieWarningProps) {
  const [detectionResult, setDetectionResult] = useState<CookieDetectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const runDetection = async () => {
      try {
        setIsLoading(true)
        const result = await cookieDetector.detect()
        setDetectionResult(result)
      } catch (error) {
        console.error('Cookie detection failed:', error)
        // Assume everything is working if detection fails
        setDetectionResult({
          cookiesEnabled: true,
          localStorageEnabled: true,
          sessionStorageEnabled: true,
          thirdPartyCookiesBlocked: false,
          crossDomainCookiesWorking: true,
          browserInfo: {
            userAgent: navigator.userAgent,
            isMobile: false,
            isSafari: false,
            isChrome: false,
            isFirefox: false
          },
          recommendations: ['Your browser settings look good for this application']
        })
      } finally {
        setIsLoading(false)
      }
    }

    runDetection()
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  if (isLoading) {
    return null
  }

  if (!detectionResult) {
    return null
  }

  const hasIssues = !detectionResult.cookiesEnabled || 
                   detectionResult.thirdPartyCookiesBlocked || 
                   !detectionResult.crossDomainCookiesWorking

  // Don't show anything if there are no issues and we don't want to show success
  if (!hasIssues && !showOnSuccess) {
    return null
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null
  }

  if (hasIssues) {
    return (
      <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium mb-2">
                Browser Settings May Affect Login
              </p>
              <p className="text-sm mb-3">
                Your browser settings might prevent you from staying logged in. This is common on mobile devices.
              </p>
              <ul className="text-sm space-y-1">
                {detectionResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (showOnSuccess) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium mb-2">
                Browser Settings Look Good
              </p>
              <p className="text-sm">
                Your browser is properly configured for this application. You should be able to log in and stay logged in without issues.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

// Hook for using cookie detection in other components
export function useCookieDetection() {
  const [detectionResult, setDetectionResult] = useState<CookieDetectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const runDetection = async () => {
      try {
        setIsLoading(true)
        const result = await cookieDetector.detect()
        setDetectionResult(result)
      } catch (error) {
        console.error('Cookie detection failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    runDetection()
  }, [])

  return {
    detectionResult,
    isLoading,
    hasIssues: detectionResult ? (!detectionResult.cookiesEnabled || 
                                 detectionResult.thirdPartyCookiesBlocked || 
                                 !detectionResult.crossDomainCookiesWorking) : false,
    isAuthenticationLikelyToWork: cookieDetector.isAuthenticationLikelyToWork()
  }
} 