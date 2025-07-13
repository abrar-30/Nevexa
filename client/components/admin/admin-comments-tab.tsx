"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Trash2, Eye } from "lucide-react"
import { getAllComments, deleteComment } from "@/lib/admin-api"

interface Comment {
  _id: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  post: {
    id: string
    content: string
    author: string
  }
  createdAt: string
}

export function AdminCommentsTab() {
  const [comments, setComments] = useState<Comment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAllComments()
      .then((data) => {
        if (Array.isArray(data)) setComments(data)
        else if (data && Array.isArray((data as any).comments)) setComments((data as any).comments)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments(comments.filter((comment) => comment._id !== commentId))
      toast({
        title: "Comment Deleted",
        description: "The comment has been permanently deleted.",
        variant: "destructive",
      })
    } catch {
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comment Management</CardTitle>
          <CardDescription>View and moderate user comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {!loading && filteredComments.length === 0 && <div className="text-center text-gray-500">No comments found.</div>}
        {filteredComments.map((comment) => (
          <Card key={comment._id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user && comment.user.avatar ? comment.user.avatar : "/placeholder.svg"} />
                      <AvatarFallback>{comment.user && comment.user.name ? comment.user.name.charAt(0) : "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{comment.user && comment.user.name ? comment.user.name : "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Post
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteComment(comment._id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{comment.content}</p>
                </div>

                <div className="border-l-4 border-gray-200 pl-4">
                  <p className="text-xs text-muted-foreground">Comment on post by {comment.post && comment.post.author ? comment.post.author : "Unknown"}:</p>
                  <p className="text-sm text-muted-foreground mt-1">{comment.post && comment.post.content ? comment.post.content.substring(0, 100) + "..." : "No post content."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
