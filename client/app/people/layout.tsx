import type React from "react"
import { ErrorBoundary } from "@/components/error-boundary"

export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
