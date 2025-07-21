"use client"

import type React from "react"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { ImageIcon, X } from "lucide-react"
import { createPost, type Post } from "@/lib/posts-api"
import { ApiError } from "@/lib/api"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated: (post: Post) => void
}

export function CreatePostDialog({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image or video file.",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && !file) {
      toast({
        title: "Empty Post",
        description: "Please add some content or attach a file.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newPost = await createPost({
        content: content.trim(),
        file: file || undefined,
      })

      onPostCreated(newPost)

      // Reset form
      setContent("")
      setFile(null)
      setPreview(null)

      toast({
        title: "Post Created",
        description: "Your post has been shared successfully!",
      })
    } catch (err) {
      console.error("Failed to create post:", err)

      let errorMessage = "Failed to create post. Please try again."

      if (err instanceof ApiError) {
        errorMessage = err.message

        // Handle authentication errors specifically
        if (err.message.includes('Authentication required') || err.message.includes('Unauthorized')) {
          errorMessage = "Your session has expired. Please log in again."
          // Optionally redirect to login
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 2000)
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isVideo = file?.type.startsWith("video/")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>Share what's on your mind with your followers.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">What's happening?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">{content.length}/500</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Add Photo/Video</Label>
            <div className="flex items-center space-x-2">
              <Input id="file" type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file")?.click()}
                disabled={isLoading}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {file && <span className="text-sm text-muted-foreground truncate max-w-[200px]">{file.name}</span>}
            </div>
          </div>

          {preview && (
            <div className="relative">
              {isVideo ? (
                <video src={preview} className="w-full h-48 object-cover rounded-lg" controls />
              ) : (
                <img
                  src={preview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}



          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!content.trim() && !file)}>
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
