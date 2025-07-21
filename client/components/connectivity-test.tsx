"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

export function ConnectivityTest() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    setResults([])
    
    const tests = [
      {
        name: "API Base URL Check",
        test: async () => {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
          return { success: true, message: `Using: ${apiUrl}` }
        }
      },
      {
        name: "Server Health Check",
        test: async () => {
          try {
            const response = await fetch('https://nevexa.onrender.com/api/health', {
              method: 'GET',
              mode: 'cors'
            })
            if (response.ok) {
              const data = await response.json()
              return { success: true, message: `Server OK: ${data.status}` }
            } else {
              return { success: false, message: `Server responded with ${response.status}` }
            }
          } catch (error) {
            return { success: false, message: `Connection failed: ${error.message}` }
          }
        }
      },
      {
        name: "CORS Preflight Test",
        test: async () => {
          try {
            const response = await fetch('https://nevexa.onrender.com/api/auth/login', {
              method: 'OPTIONS',
              headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
              }
            })
            if (response.ok) {
              return { success: true, message: 'CORS preflight successful' }
            } else {
              return { success: false, message: `CORS preflight failed: ${response.status}` }
            }
          } catch (error) {
            return { success: false, message: `CORS test failed: ${error.message}` }
          }
        }
      },
      {
        name: "DNS Resolution Test",
        test: async () => {
          try {
            const response = await fetch('https://nevexa.onrender.com', {
              method: 'HEAD',
              mode: 'no-cors'
            })
            return { success: true, message: 'DNS resolution successful' }
          } catch (error) {
            return { success: false, message: `DNS resolution failed: ${error.message}` }
          }
        }
      }
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        setResults(prev => [...prev, { name: test.name, ...result }])
      } catch (error) {
        setResults(prev => [...prev, { 
          name: test.name, 
          success: false, 
          message: `Test failed: ${error.message}` 
        }])
      }
    }
    
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Connectivity Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Connectivity Tests'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "PASS" : "FAIL"}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Test Results Details:</h4>
              {results.map((result, index) => (
                <div key={index} className="text-sm mb-1">
                  <strong>{result.name}:</strong> {result.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
