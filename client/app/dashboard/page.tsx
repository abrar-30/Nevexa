"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MobileNavigationWrapper } from "@/components/mobile-navigation-wrapper"
import { PostCard } from "@/components/post-card"
import { CreatePostDialog } from "@/components/create-post-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, RefreshCw, AlertCircle, Wifi } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllPosts, likePost, unlikePost, addComment, deletePost, type Post } from "@/lib/posts-api"
import { getCurrentUser, debugAuthStatus, isAuthenticated, type AuthUser } from "@/lib/auth-api"
import { InstantAuthGuard } from "@/components/instant-auth-guard"
import { ApiError } from "@/lib/api"
import { PostsList } from "@/components/posts-list";

interface DashboardState {
  posts: Post[]
  currentUser: AuthUser | null
  isLoading: boolean
  isRefreshing: boolean
  showCreatePost: boolean
  error: string | null
  isOfflineMode: boolean
  lastFetchTime: Date | null
  isInitialized: boolean
}

function DashboardPageContent() {
  const router = useRouter()
  const [state, setState] = useState<DashboardState>({
    posts: [],
    currentUser: null,
    isLoading: true,
    isRefreshing: false,
    showCreatePost: false,
    error: null,
    isOfflineMode: false,
    lastFetchTime: null,
    isInitialized: false,
  })

  const { toast } = useToast()

  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const loadPosts = useCallback(
    async (isRefresh = false) => {
      console.log(`Loading posts... (refresh: ${isRefresh})`)

      updateState({
        [isRefresh ? "isRefreshing" : "isLoading"]: true,
        error: null,
      })

      try {
        const fetchedPosts = await getAllPosts()

        updateState({
          posts: fetchedPosts,
          isOfflineMode: false,
          lastFetchTime: new Date(),
        })

        if (isRefresh) {
          toast({
            title: "Posts Refreshed",
            description: "Latest posts have been loaded.",
          })
        }

        console.log(`Successfully loaded ${fetchedPosts.length} posts`)
      } catch (err) {
        console.error("Error loading posts:", err)

        let errorMessage = "Failed to load posts. Please try again."
        let isOffline = false

        if (err instanceof ApiError) {
          if (err.status === 0) {
            errorMessage = "Unable to connect to server. Showing cached content."
            isOffline = true
          } else if (err.status === 401) {
            // Silent redirect for 401 errors - no error message
            return
          } else {
            errorMessage = `Failed to load posts: ${err.message}`
          }
        }

        updateState({
          error: errorMessage,
          isOfflineMode: isOffline,
        })

        if (!isOffline) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        updateState({
          isLoading: false,
          isRefreshing: false,
        })
      }
    },
    [updateState, toast, router],
  )

  const loadCurrentUser = useCallback(async () => {
    console.log("Loading current user...")

    try {
      const user = await getCurrentUser()
      updateState({ currentUser: user })
      console.log("Successfully loaded current user:", user?.name)
    } catch (err) {
      // Suppress all errors during user loading - auth guard will handle redirects
      if (err instanceof ApiError && err.status === 401) {
        // Silent return for 401 errors
        return
      }

      // Only show non-auth errors
      if (err instanceof ApiError && err.status !== 401) {
        toast({
          title: "Warning",
          description: "Unable to load user profile. Some features may be limited.",
        })
      }
    } finally {
      updateState({ isLoading: false })
    }
  }, [updateState, toast, router])

  const handleRetry = useCallback(() => {
    console.log("Retrying data load...")
    loadCurrentUser()
    loadPosts(true)
  }, [loadCurrentUser, loadPosts])

  useEffect(() => {
    if (!state.isInitialized) {
      console.log("Dashboard component mounted, loading initial data...");
      updateState({ isInitialized: true });
      loadCurrentUser();
      loadPosts();
    }
  }, [state.isInitialized, updateState, loadCurrentUser, loadPosts]);

  // Debug: Log posts to console
  console.log('Dashboard posts:', state.posts);

  const handleLike = async (postId: string) => {
    if (!state.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like posts.",
        variant: "destructive",
      })
      return
    }

    const post = state.posts.find((p) => p._id === postId)
    if (!post) return

    const isLiked = post.likes.includes(state.currentUser._id)

    try {
      // Optimistic update
      updateState({
        posts: state.posts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              likes: isLiked
                ? p.likes.filter((id) => id !== state.currentUser!._id)
                : [...p.likes, state.currentUser!._id],
            }
          }
          return p
        }),
      })

      // Make API call
      if (isLiked) {
        await unlikePost(postId)
      } else {
        await likePost(postId)
      }
    } catch (err: any) {
      // Suppress 401 errors - auth guard will handle redirects
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        return
      }

      console.error("Error updating like:", err)

      // Revert optimistic update on error
      updateState({
        posts: state.posts.map((p) => {
          if (p._id === postId) {
            return {
              ...p,
              likes: isLiked
                ? [...p.likes, state.currentUser!._id]
                : p.likes.filter((id) => id !== state.currentUser!._id),
            }
          }
          return p
        }),
      })

      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  const handleComment = async (postId: string, comment: string) => {
    console.log('🔄 Attempting to add comment...')

    if (!state.currentUser) {
      console.log('❌ No current user found')
      toast({
        title: "Authentication Required",
        description: "Please log in to comment on posts.",
        variant: "destructive",
      })
      return
    }

    // Check if token exists (but don't auto-logout on token issues)
    const tokenExists = !!localStorage.getItem('jwt')
    if (!tokenExists) {
      console.log('❌ No JWT token found')
      toast({
        title: "Session Expired",
        description: "Please log in again to comment on posts.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('✅ User authenticated, adding comment...')
      const newComment = await addComment(postId, comment)
      console.log('✅ Comment created:', newComment)

      // Refresh posts to show the new comment
      console.log('🔄 Refreshing posts...')
      await loadPosts(true)

      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      })
    } catch (err: any) {
      // Suppress 401 errors - auth guard will handle redirects
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        return
      }

      console.error('❌ Comment error:', err)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!state.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete posts.",
        variant: "destructive",
      })
      return
    }

    try {
      await deletePost(postId)
      // Remove the deleted post from the local state
      updateState({
        posts: state.posts.filter(post => post._id !== postId)
      })
      toast({
        title: "Post Deleted",
        description: "Your post has been deleted successfully.",
      })
    } catch (error: any) {
      // Suppress 401 errors - auth guard will handle redirects
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return
      }

      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handlePostCreated = (newPost: Post) => {
    updateState({
      posts: [newPost, ...state.posts],
      showCreatePost: false,
    })

    toast({
      title: "Post Created",
      description: "Your post has been shared successfully!",
    })
  }

  const PostSkeleton = () => (
    <Card className="w-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar userRole={state.currentUser?.role || "general"} user={state.currentUser ? { name: state.currentUser.name, email: state.currentUser.email, avatar: state.currentUser.avatar } : undefined} />

      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Home Feed</h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => loadPosts(true)} disabled={state.isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${state.isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => updateState({ showCreatePost: true })}>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {state.isOfflineMode && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Wifi className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Running in offline mode. Some features may be limited.
              {state.lastFetchTime && (
                <span className="block text-sm mt-1">Last updated: {state.lastFetchTime.toLocaleTimeString()}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {state.error && !state.isOfflineMode && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-red-800">{state.error}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <PostsList
          posts={state.posts}
          onLike={handleLike}
          onComment={handleComment}
          currentUserId={state.currentUser?._id || ""}
          onCreatePost={() => updateState({ showCreatePost: true })}
          onDelete={handleDeletePost}
        />
      </div>

      <CreatePostDialog
        open={state.showCreatePost}
        onOpenChange={(open) => updateState({ showCreatePost: open })}
        onPostCreated={handlePostCreated}
      />

      <MobileNavigationWrapper />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <InstantAuthGuard>
      <DashboardPageContent />
    </InstantAuthGuard>
  )
}
