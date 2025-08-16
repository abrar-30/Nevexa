import type React from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { ThemeProvider } from "@/context/ThemeContext"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
  )
}
