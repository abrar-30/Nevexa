"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from "next/navigation"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Don't catch Next.js redirects or navigation errors
    if (
      error.message?.includes("NEXT_REDIRECT") ||
      error.message?.includes("Redirect") ||
      error.name === "RedirectError"
    ) {
      return { hasError: false }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Don't log Next.js redirects
    if (
      error.message?.includes("NEXT_REDIRECT") ||
      error.message?.includes("Redirect") ||
      error.name === "RedirectError"
    ) {
      return
    }

    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />
    }

    return this.props.children
  }
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const router = useRouter()

  const handleGoHome = () => {
    onReset()
    router.push("/dashboard")
  }

  const handleReload = () => {
    onReset()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error?.message || "An unexpected error occurred while loading the application."}
          </p>

          <div className="space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button onClick={handleReload} variant="outline" className="w-full bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">Error Details</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">{error.stack}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
