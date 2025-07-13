"use client"

import { useState } from 'react'
import { cookieDebugUtils } from '@/lib/cookie-debug'

export function CookieDebugPanel() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      console.log('🧪 Starting cookie debug tests...')
      
      // Check if cookies are enabled
      const cookiesEnabled = cookieDebugUtils.areCookiesEnabled()
      console.log('🍪 Cookies enabled:', cookiesEnabled)
      
      // Set a test cookie
      cookieDebugUtils.setTestCookie()
      
      // Run cookie support test
      const cookieTest = await cookieDebugUtils.testCookieSupport()
      
      // Run session debug
      const sessionDebug = await cookieDebugUtils.debugSessionIssue()
      
      setResults({
        cookiesEnabled,
        cookieTest,
        sessionDebug,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('🧪 Debug tests failed:', error)
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">🍪 Cookie Debug Panel</h3>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Running Tests...' : 'Run Cookie Tests'}
      </button>
      
      {results && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Test Results:</h4>
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Run Cookie Tests" to test cookie functionality</li>
          <li>Check the browser console for detailed logs</li>
          <li>Check the Network tab to see cookie headers</li>
          <li>Test on both desktop and mobile browsers</li>
        </ol>
      </div>
    </div>
  )
}