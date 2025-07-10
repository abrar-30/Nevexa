"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ReportDialog } from "@/components/report-dialog"
import { Heart, MessageCircle, Share, MoreHorizontal, Flag } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Post } from "@/lib/posts-api"

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string, comment: string) => void
  currentUserId: string
  userRole?: "general" | "admin"
}

export function PostCard({ post, onLike, onComment, currentUserId, userRole = "general" }: PostCardProps) {
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const router = useRouter()

  const isLiked = post.likes.includes(currentUserId)
  const likesCount = post.likes.length
  const commentsCount = post.comments.length

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      onComment(post._id, comment)
      setComment("")
    }
  }

  const handleDoubleClick = () => {
    onLike(post._id)
  }

  const handleUserClick = (userId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${userId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderMedia = () => {
    if (!post.fileUrl) return null

    const isVideo =
      post.fileType === "video" ||
      post.fileUrl.includes(".mp4") ||
      post.fileUrl.includes(".webm") ||
      post.fileUrl.includes(".ogg")

    if (mediaError) {
      return (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center">
          <p className="text-gray-500">Failed to load media</p>
        </div>
      )
    }

    if (isVideo) {
      return (
        <div className="relative rounded-lg overflow-hidden" onDoubleClick={handleDoubleClick}>
          <video
            src={post.fileUrl}
            controls
            className="w-full h-auto object-cover cursor-pointer max-h-96"
            onError={() => setMediaError(true)}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    return (
      <div className="relative rounded-lg overflow-hidden" onDoubleClick={handleDoubleClick}>
        <Image
          src={post.fileUrl || "/placeholder.svg"}
          alt={`Post by ${post.user.name}`}
          width={600}
          height={400}
          className="w-full h-auto object-cover cursor-pointer"
          onError={() => setMediaError(true)}
          priority={false}
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar
            className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            onClick={(e) => handleUserClick(post.user._id, e)}
          >
            <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{post.user && post.user.name ? post.user.name.charAt(0) : "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p
              className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors"
              onClick={(e) => handleUserClick(post.user._id, e)}
            >
              {post.user.name}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
              <Flag className="mr-2 h-4 w-4" />
              Report Post
            </DropdownMenuItem>
            {userRole === "admin" && (
              <>
                <DropdownMenuItem>Edit Post</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete Post</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pb-2">
        {post.content && <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>}

        {renderMedia()}
      </CardContent>

      <CardFooter className="flex flex-col space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post._id)}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-4 w-4 mr-1" />
              {commentsCount}
            </Button>

            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="w-full space-y-3">
            <Separator />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {post.comments.map((comment) => (
                <div key={comment._id} className="flex items-start space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{comment.user.name}</span> {comment.content}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={!comment.trim()}>
                Post
              </Button>
            </form>
          </div>
        )}
      </CardFooter>

      <ReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} postId={post._id} />
    </Card>
  )
}
