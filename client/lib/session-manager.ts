// Session management for mobile devices
import { apiRequest } from "./api"

class SessionManager {
  private refreshInterval: NodeJS.Timeout | null = null
  private isRefreshing = false
  private isMobile = false

  constructor() {
    this.detectMobile()
    this.setupVisibilityHandlers()
  }

  private detectMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      console.log('📱 Mobile device detected:', this.isMobile)
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle page visibility changes (important for mobile)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isMobile) {
          console.log('📱 Page became visible, refreshing session for mobile')
          this.refreshSession()
        }
      })

      // Handle focus events (when user returns to app)
      window.addEventListener('focus', () => {
        if (this.isMobile) {
          console.log('📱 Window focused, refreshing session for mobile')
          this.refreshSession()
        }
      })

      // Handle online/offline events
      window.addEventListener('online', () => {
        if (this.isMobile) {
          console.log('📱 Device came online, refreshing session for mobile')
          this.refreshSession()
        }
      })
    }
  }

  public startSessionRefresh(): void {
    if (!this.isMobile) {
      console.log('💻 Desktop device, skipping automatic session refresh')
      return
    }

    console.log('📱 Starting session refresh for mobile device')
    
    // Clear any existing interval
    this.stopSessionRefresh()

    // Refresh session every 30 minutes for mobile users
    this.refreshInterval = setInterval(() => {
      this.refreshSession()
    }, 30 * 60 * 1000) // 30 minutes

    // Initial refresh
    this.refreshSession()
  }

  public stopSessionRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('📱 Stopped session refresh')
    }
  }

  public async refreshSession(): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('📱 Session refresh already in progress, skipping')
      return false
    }

    this.isRefreshing = true

    try {
      console.log('📱 Refreshing session...')
      const response = await apiRequest<{
        success: boolean
        message: string
        sessionID: string
        expiresAt: string
        isMobile: boolean
      }>('/session/refresh', {
        method: 'POST'
      })

      console.log('✅ Session refreshed successfully:', response)
      return response.success
    } catch (error) {
      console.error('❌ Failed to refresh session:', error)
      
      // If session refresh fails with 401, user needs to login again
      if (error instanceof Error && error.message.includes('401')) {
        console.log('📱 Session expired, user needs to login again')
        this.stopSessionRefresh()
        // You might want to redirect to login or show a notification here
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
      
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  public isMobileDevice(): boolean {
    return this.isMobile
  }
}

// Create singleton instance
export const sessionManager = new SessionManager()

// Export for use in components
export default sessionManager