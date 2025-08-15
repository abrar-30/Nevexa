"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-api"
import { Loader2 } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const redirectToUserProfile = async () => {
      try {
        console.log('🔄 Getting current user for profile redirect...')
        const user = await getCurrentUser()
        
        if (user && user._id) {
          console.log('✅ Current user found, redirecting to:', `/profile/${user._id}`)
          // Redirect to the user's specific profile page
          router.replace(`/profile/${user._id}`)
        } else {
          console.log('❌ No current user found, redirecting to login')
          // If no user, redirect to login
          setError('Please log in to view your profile')
          setTimeout(() => {
            router.replace('/auth/login')
          }, 2000)
        }
      } catch (error) {
        console.error('❌ Error getting current user:', error)
        setError('Failed to load profile. Please try logging in again.')
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }

    redirectToUserProfile()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return null
}
