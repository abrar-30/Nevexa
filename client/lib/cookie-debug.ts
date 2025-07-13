// Cookie debugging utilities for mobile session issues

import { apiRequest } from "./api"

export async function testCookieSupport() {
  console.log('🍪 Testing cookie support...')
  
  try {
    // Test 1: Basic cookie test
    console.log('🍪 Test 1: Basic cookie functionality')
    const cookieTest = await apiRequest<any>('/cookie-test')
    console.log('🍪 Cookie test result:', cookieTest)
    
    // Wait a moment for cookies to be set
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 2: Check if cookies are being sent back
    console.log('🍪 Test 2: Checking if cookies are sent back')
    const cookieTest2 = await apiRequest<any>('/cookie-test')
    console.log('🍪 Second cookie test result:', cookieTest2)
    
    // Test 3: Mobile-specific debug
    console.log('🍪 Test 3: Mobile-specific debugging')
    const mobileDebug = await apiRequest<any>('/mobile-debug')
    console.log('🍪 Mobile debug result:', mobileDebug)
    
    // Test 4: Session test
    console.log('🍪 Test 4: Session functionality')
    const sessionTest = await apiRequest<any>('/session-test')
    console.log('🍪 Session test result:', sessionTest)
    
    return {
      success: true,
      tests: {
        cookieTest,
        cookieTest2,
        mobileDebug,
        sessionTest
      }
    }
  } catch (error) {
    console.error('🍪 Cookie test failed:', error)
    return {
      success: false,
      error: error
    }
  }
}

export async function debugSessionIssue() {
  console.log('🔍 Debugging session issue...')
  
  const isMobile = typeof window !== 'undefined' && 
    /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  console.log('📱 Client is mobile:', isMobile)
  console.log('🌐 Current URL:', window.location.href)
  console.log('🍪 Document cookies:', document.cookie)
  
  try {
    // Test authentication endpoint
    const authTest = await apiRequest<any>('/debug-auth')
    console.log('🔐 Auth debug result:', authTest)
    
    return {
      isMobile,
      currentUrl: window.location.href,
      documentCookies: document.cookie,
      authTest
    }
  } catch (error) {
    console.error('🔍 Session debug failed:', error)
    return {
      isMobile,
      currentUrl: window.location.href,
      documentCookies: document.cookie,
      error
    }
  }
}

// Function to manually set a test cookie
export function setTestCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'client-test-cookie=test-value; path=/; max-age=3600'
    console.log('🍪 Set test cookie from client')
    console.log('🍪 Document cookies after setting:', document.cookie)
  }
}

// Function to check if cookies are enabled
export function areCookiesEnabled(): boolean {
  if (typeof document === 'undefined') return false
  
  try {
    document.cookie = 'cookietest=1; path=/'
    const cookiesEnabled = document.cookie.indexOf('cookietest=') !== -1
    // Clean up
    document.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/'
    return cookiesEnabled
  } catch (e) {
    return false
  }
}

// Export all functions for easy testing
export const cookieDebugUtils = {
  testCookieSupport,
  debugSessionIssue,
  setTestCookie,
  areCookiesEnabled
}