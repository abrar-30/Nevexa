"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Info } from 'lucide-react'
import { cookieDetector, type CookieDetectionResult } from '@/lib/cookie-detector'

export function CookieDebug() {
  const [detectionResult, setDetectionResult] = useState<CookieDetectionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

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

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
      runDetection()
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-sm border-orange-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Cookie Debug</CardTitle>
            <CardDescription className="text-xs">Development only</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={runDetection}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {detectionResult ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Cookies Enabled</span>
                <Badge variant={detectionResult.cookiesEnabled ? "default" : "destructive"} className="text-xs">
                  {detectionResult.cookiesEnabled ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Cross-Domain Cookies</span>
                <Badge variant={detectionResult.crossDomainCookiesWorking ? "default" : "destructive"} className="text-xs">
                  {detectionResult.crossDomainCookiesWorking ? "Working" : "Blocked"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Third-Party Cookies</span>
                <Badge variant={detectionResult.thirdPartyCookiesBlocked ? "destructive" : "default"} className="text-xs">
                  {detectionResult.thirdPartyCookiesBlocked ? "Blocked" : "Allowed"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium">Browser Info:</span>
              <div className="text-xs space-y-1">
                <div>Mobile: {detectionResult.browserInfo.isMobile ? "Yes" : "No"}</div>
                <div>Safari: {detectionResult.browserInfo.isSafari ? "Yes" : "No"}</div>
                <div>Chrome: {detectionResult.browserInfo.isChrome ? "Yes" : "No"}</div>
                <div>Firefox: {detectionResult.browserInfo.isFirefox ? "Yes" : "No"}</div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium">Recommendations:</span>
              <ul className="text-xs space-y-1">
                {detectionResult.recommendations.map((rec, index) => (
                  <li key={index} className="text-orange-600">• {rec}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  console.log('Cookie Detection Result:', detectionResult)
                  console.log('Authentication likely to work:', cookieDetector.isAuthenticationLikelyToWork())
                }}
              >
                <Info className="h-3 w-3 mr-1" />
                Log to Console
              </Button>
            </div>
          </>
        ) : (
          <div className="text-xs text-gray-500">
            {isLoading ? "Detecting..." : "No detection result"}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 