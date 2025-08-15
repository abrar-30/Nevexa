"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Loader2 } from "lucide-react"
import type { User } from "@/lib/posts-api"
import { apiRequest, getJwtToken } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth-api"

interface NewEditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onUserUpdated: (user: User) => void
}

export function NewEditProfileDialog({ 
  open, 
  onOpenChange, 
  user, 
  onUserUpdated 
}: NewEditProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    interests: user.interests || ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const testAuthentication = async () => {
    try {
      console.log('🧪 Testing authentication...')
      const currentUser = await getCurrentUser()
      console.log('✅ Current user:', currentUser)

      if (!currentUser || !currentUser._id) {
        console.error('❌ No current user found')
        return false
      }

      if (currentUser._id !== user._id) {
        console.error('❌ User ID mismatch:', {
          currentUserId: currentUser._id,
          profileUserId: user._id
        })
        return false
      }

      console.log('✅ Auth test successful - user can edit this profile')
      return true
    } catch (error) {
      console.error('❌ Auth test failed:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Test authentication first
    const isAuthenticated = await testAuthentication()
    if (!isAuthenticated) {
      toast({
        title: "Authentication Failed",
        description: "Please log out and log back in, then try again.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log('🔄 Updating profile...')
      console.log('📝 Form data:', formData)
      console.log('📷 Avatar file:', avatarFile)

      // Check JWT token before making request
      const token = getJwtToken()
      console.log('🔐 JWT Token check:')
      console.log('  Token exists:', !!token)
      if (token) {
        console.log('  Token length:', token.length)
        console.log('  Token preview:', token.substring(0, 20) + '...')

        // Try to decode token to check expiration
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          console.log('  Token user ID:', payload.userId || payload.id)
          console.log('  Token expires:', new Date(payload.exp * 1000))
          console.log('  Token expired:', Date.now() > payload.exp * 1000)
          console.log('  Profile user ID:', user._id)

          if (Date.now() > payload.exp * 1000) {
            throw new Error('JWT token has expired. Please log in again.')
          }

          if (payload.userId !== user._id && payload.id !== user._id) {
            throw new Error('JWT token user ID does not match profile user ID.')
          }
        } catch (decodeError) {
          console.error('❌ Token decode error:', decodeError)
          throw new Error('Invalid JWT token. Please log in again.')
        }
      } else {
        throw new Error('No JWT token found. Please log in again.')
      }

      // Create FormData for multipart upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('bio', formData.bio)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('interests', formData.interests)

      if (avatarFile) {
        console.log('📤 Uploading avatar:', {
          name: avatarFile.name,
          size: avatarFile.size,
          type: avatarFile.type
        })
        formDataToSend.append('avatar', avatarFile)
      }

      console.log('📦 FormData entries:')
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value)
      }

      // Update profile using JWT auth
      const response = await apiRequest<User>(`/users/${user._id}`, {
        method: 'PUT',
        body: formDataToSend,
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
        }
      })

      console.log('✅ Profile updated successfully:', response)
      
      onUserUpdated(response)
      onOpenChange(false)
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      })

      // Reset form
      setAvatarFile(null)
      setAvatarPreview(null)
      
    } catch (error: any) {
      console.error('❌ Profile update failed:', error)

      let errorMessage = "Failed to update profile. Please try again."

      if (error.message?.includes('401')) {
        errorMessage = "Authentication failed. Please log in again."
      } else if (error.message?.includes('400')) {
        errorMessage = "Invalid profile data. Please check your inputs."
      } else if (error.message?.includes('timeout') || error.name === 'AbortError') {
        errorMessage = "Upload timed out. Please try with a smaller image or check your connection."
      } else if (error.message?.includes('413')) {
        errorMessage = "File too large. Please select a smaller image."
      } else if (error.message?.includes('Network')) {
        errorMessage = "Network error. Please check your connection and try again."
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      interests: user.interests || ''
    })
    setAvatarFile(null)
    setAvatarPreview(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarPreview || user.avatar || ''} 
                  alt={user.name} 
                />
                <AvatarFallback className="text-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500">
              {isLoading ? "Uploading..." : "Click the camera icon to change your avatar"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/200 characters
              </p>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="interests">Interests</Label>
              <Input
                id="interests"
                value={formData.interests}
                onChange={(e) => handleInputChange('interests', e.target.value)}
                placeholder="Technology, Sports, Music..."
                maxLength={100}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const isAuth = await testAuthentication()
                toast({
                  title: isAuth ? "Authentication OK" : "Authentication Failed",
                  description: isAuth ? "You can edit this profile" : "Check console for details",
                  variant: isAuth ? "default" : "destructive",
                })
              }}
              disabled={isLoading}
              className="text-xs"
            >
              Test Auth
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
