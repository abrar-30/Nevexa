"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-api"
import { Loader2, Sun, Moon } from "lucide-react"
import { InstantAuthGuard } from "@/components/instant-auth-guard"
import { ThemeProvider, useTheme } from "../../context/ThemeContext"

function ProfilePageContent() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const redirectToUserProfile = async () => {
      try {
        const user = await getCurrentUser()
        if (user && user._id) {
          router.replace(`/profile/${user._id}`)
        } else {
          setError("Please log in to view your profile")
          setTimeout(() => router.replace("/auth/login"), 2000)
        }
      } catch (error) {
        setError("Failed to load profile. Please try logging in again.")
        setTimeout(() => router.replace("/auth/login"), 3000)
      } finally {
        setIsLoading(false)
      }
    }

    redirectToUserProfile()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-[#121212] dark:text-white">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 dark:bg-red-600">
            <Loader2 className="h-8 w-8 text-red-500 dark:text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Profile Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 dark:bg-[#121212] dark:text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-[#121212] dark:text-white">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold">Profile</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="container mx-auto py-6 px-4">
        <div className="p-6 rounded-lg bg-gray-100 text-gray-900 dark:bg-[#1E1E1E] dark:text-gray-300">
          <p>Welcome to your profile page!</p>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ThemeProvider>
      <InstantAuthGuard>
        <ProfilePageContent />
      </InstantAuthGuard>
    </ThemeProvider>
  )
}
