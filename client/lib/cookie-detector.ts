// Cookie detection utility for cross-domain authentication
// Detects if cookies are blocked or disabled in the browser

export interface CookieDetectionResult {
  cookiesEnabled: boolean
  localStorageEnabled: boolean
  sessionStorageEnabled: boolean
  thirdPartyCookiesBlocked: boolean
  crossDomainCookiesWorking: boolean
  browserInfo: {
    userAgent: string
    isMobile: boolean
    isSafari: boolean
    isChrome: boolean
    isFirefox: boolean
  }
  recommendations: string[]
}

export class CookieDetector {
  private static instance: CookieDetector
  private detectionResult: CookieDetectionResult | null = null

  static getInstance(): CookieDetector {
    if (!CookieDetector.instance) {
      CookieDetector.instance = new CookieDetector()
    }
    return CookieDetector.instance
  }

  private getBrowserInfo() {
    const userAgent = navigator.userAgent
    return {
      userAgent,
      isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent)
    }
  }

  private testLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, 'test')
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private testSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__'
      sessionStorage.setItem(test, 'test')
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  private testCookies(): boolean {
    try {
      document.cookie = 'testCookie=1; path=/'
      const hasCookie = document.cookie.indexOf('testCookie=') !== -1
      document.cookie = 'testCookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
      return hasCookie
    } catch {
      return false
    }
  }

  private async testCrossDomainCookies(): Promise<boolean> {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_BASE_URL}/api/cookie-test`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.message === 'Test cookie set'
    } catch {
      return false
    }
  }

  private generateRecommendations(result: CookieDetectionResult): string[] {
    const recommendations: string[] = []

    if (!result.cookiesEnabled) {
      recommendations.push('Enable cookies in your browser settings')
    }

    if (result.thirdPartyCookiesBlocked) {
      recommendations.push('Allow third-party cookies in your browser settings')
    }

    if (result.browserInfo.isSafari && result.browserInfo.isMobile) {
      recommendations.push('On iOS Safari: Go to Settings > Safari > Privacy & Security and disable "Prevent Cross-Site Tracking"')
    }

    if (result.browserInfo.isChrome && result.browserInfo.isMobile) {
      recommendations.push('On Android Chrome: Go to Settings > Site Settings > Cookies and enable "Allow third-party cookies"')
    }

    if (!result.crossDomainCookiesWorking) {
      recommendations.push('Try using a different browser (Chrome or Firefox recommended)')
      recommendations.push('Make sure you are using HTTPS (not HTTP)')
    }

    if (recommendations.length === 0) {
      recommendations.push('Your browser settings look good for this application')
    }

    return recommendations
  }

  async detect(): Promise<CookieDetectionResult> {
    if (this.detectionResult) {
      return this.detectionResult
    }

    const browserInfo = this.getBrowserInfo()
    const cookiesEnabled = this.testCookies()
    const localStorageEnabled = this.testLocalStorage()
    const sessionStorageEnabled = this.testSessionStorage()
    const crossDomainCookiesWorking = await this.testCrossDomainCookies()

    // Estimate if third-party cookies are blocked based on browser and settings
    let thirdPartyCookiesBlocked = false
    if (browserInfo.isSafari && browserInfo.isMobile) {
      // Safari on iOS blocks third-party cookies by default
      thirdPartyCookiesBlocked = !crossDomainCookiesWorking
    } else if (browserInfo.isChrome && browserInfo.isMobile) {
      // Chrome on mobile might block in incognito or with strict settings
      thirdPartyCookiesBlocked = !crossDomainCookiesWorking
    }

    this.detectionResult = {
      cookiesEnabled,
      localStorageEnabled,
      sessionStorageEnabled,
      thirdPartyCookiesBlocked,
      crossDomainCookiesWorking,
      browserInfo,
      recommendations: []
    }

    this.detectionResult.recommendations = this.generateRecommendations(this.detectionResult)

    return this.detectionResult
  }

  isAuthenticationLikelyToWork(): boolean {
    if (!this.detectionResult) {
      return true // Assume it works until we detect otherwise
    }
    return this.detectionResult.cookiesEnabled && this.detectionResult.crossDomainCookiesWorking
  }

  getDetectionResult(): CookieDetectionResult | null {
    return this.detectionResult
  }

  reset(): void {
    this.detectionResult = null
  }
}

export const cookieDetector = CookieDetector.getInstance() 