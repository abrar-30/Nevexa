"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Edit, Trash2, Eye } from "lucide-react"
import Image from "next/image"
import { getAllPosts, deletePost } from "@/lib/admin-api"

interface Post {
  _id: string
  content: string
  fileUrl?: string
  fileType?: string
  user: {
    name: string
    avatar?: string
  }
  likesCount: number
  commentsCount: number
  createdAt: string
}

export function AdminPostsTab() {
  const [posts, setPosts] = useState<Post[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAllPosts()
      .then((data) => {
        if (Array.isArray(data)) setPosts(data)
        else if (data && Array.isArray((data as any).posts)) setPosts((data as any).posts)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId)
      setPosts(posts.filter((post) => post._id !== postId))
      toast({
        title: "Post Deleted",
        description: "The post has been permanently deleted.",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" })
    }
  }

  const renderMedia = (post: Post) => {
    if (!post.fileUrl) return null;

    const isVideo = post.fileType === 'video' || post.fileUrl.includes('.mp4') || post.fileUrl.includes('.mov') || post.fileUrl.includes('.avi');
    const isImage = post.fileType === 'image' || !isVideo;

    if (isVideo) {
      return (
        <div className="relative w-full max-w-md">
          <video
            src={post.fileUrl}
            controls
            className="rounded-lg w-full max-w-md"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-md">
        <Image
          src={post.fileUrl || "/placeholder.svg"}
          alt="Post content"
          width={300}
          height={200}
          className="rounded-lg object-cover"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Post Management</CardTitle>
          <CardDescription>View, edit, and moderate user posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {!loading && filteredPosts.length === 0 && <div className="text-center text-gray-500">No posts found.</div>}
        {filteredPosts.map((post) => (
          <Card key={post._id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={post.user && post.user.avatar ? post.user.avatar : "/placeholder.svg"} />
                      <AvatarFallback>{post.user && post.user.name ? post.user.name.charAt(0) : "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.user && post.user.name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post._id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                <p className="text-sm">{post.content}</p>

                {renderMedia(post)}

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
