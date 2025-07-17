"use client"

import type React from "react"

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
import { API_BASE_URL, apiRequest } from "@/lib/api"
import { ApiError } from "@/lib/api"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onUserUpdated: (user: User) => void
}

export function EditProfileDialog({ open, onOpenChange, user, onUserUpdated }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio,
    location: user.location,
    interests: user.interests,
  })
  const [avatar, setAvatar] = useState<string>(user.avatar || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      // Use apiRequest to ensure JWT is included
      const data = await apiRequest(`/users/${user._id}/avatar`, {
        method: 'POST',
        body: formData,
      })
      setAvatar((data as { avatar: string }).avatar)
      toast({
        title: "Avatar Updated",
        description: "Your avatar has been updated successfully!",
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Use apiRequest to ensure JWT is included
      const response = await apiRequest(`/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      // Support both { user: ... } and plain user object
      const updatedUser = (response as any).user || response as User;
      onUserUpdated(updatedUser);
      onOpenChange(false);
      setIsLoading(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "TIMEOUT_ERROR") {
        toast({
          title: "Request Timed Out",
          description: "The server took too long to respond. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      // Only show error if the profile was NOT updated
      if (error instanceof ApiError && error.status === 401) {
        setIsLoading(false);
        return;
      }
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {/* Red underline under avatar */}
              <div className="absolute left-0 right-0 bottom-0 h-1 bg-red-500 rounded-b"></div>
              <Button 
                type="button" 
                size="sm" 
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                onClick={handleCameraClick}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Where are you based?"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              placeholder="What are you interested in?"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
