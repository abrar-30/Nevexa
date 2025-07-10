"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated (you can implement proper auth check here)
    const checkAuth = async () => {
      // For now, always redirect to dashboard
      // In a real app, you'd check authentication status here
      router.replace("/dashboard")
    }
    checkAuth()
  }, [router])

  // No loading UI, just return null
  return null
}
