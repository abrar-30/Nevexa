"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-api"
import { ThemeProvider } from "../context/ThemeContext";

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          router.replace("/dashboard")
        } else {
          router.replace("/auth/login")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        // If auth check fails, redirect to login
        router.replace("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }
    
    // Add a small delay to show loading state
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
