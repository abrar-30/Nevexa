"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api"
import type { User, Post } from "@/lib/posts-api"
import { PostsList } from "@/components/posts-list"
import ProfileSkeleton from "@/components/profile-skeleton"
import PostSkeleton from "@/components/post-skeleton"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { Edit, MapPin, Calendar, Users, Heart, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/auth-api"
import { deletePost } from "@/lib/posts-api"
import { useRouter } from "next/navigation"
import { FollowersDialog } from "@/components/followers-dialog"
import { apiRequest } from "@/lib/api"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter()
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followersData, setFollowersData] = useState<User[]>([])
  const [followingData, setFollowingData] = useState<User[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false)

  // Helper to fetch user details for followers/following
  const fetchUserDetails = async (userIds: any[]): Promise<User[]> => {
    if (!userIds || userIds.length === 0) return [];
    const actualIds = userIds.map(id => (typeof id === 'string' ? id : id?._id)).filter(Boolean)
    if (actualIds.length === 0) return [];
    const url = `/users/batch?ids=${actualIds.join(',')}`
    try {
      const res = await apiRequest<{ users: User[] }>(url);
      return res.users || []
    } catch (e) {
      return []
    }
  }

  // Load followers/following data when dialogs are opened
  useEffect(() => {
    if (showFollowers && user?.followers?.length) {
      setIsLoadingFollowers(true)
      fetchUserDetails(user.followers).then(setFollowersData).finally(() => setIsLoadingFollowers(false))
    }
  }, [showFollowers, user?.followers])
  useEffect(() => {
    if (showFollowing && user?.following?.length) {
      setIsLoadingFollowing(true)
      fetchUserDetails(user.following).then(setFollowingData).finally(() => setIsLoadingFollowing(false))
    }
  }, [showFollowing, user?.following])

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId)
      // Remove the deleted post from the local state
      setPosts(posts.filter(post => post._id !== postId))
      toast({ 
        title: "Post Deleted", 
        description: "Your post has been deleted successfully." 
      })
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete post", 
        variant: "destructive" 
      })
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userData = await getCurrentUser()
        if (!userData) {
          router.push("/auth/login")
          return
        }
        setUser(userData)
      } catch (err: any) {
        setError(err.message || "Failed to load user profile")
        toast({ title: "Error", description: err.message || "Failed to load user profile", variant: "destructive" })
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [toast, router])

  useEffect(() => {
    const fetchPosts = async () => {
      setIsPostsLoading(true)
      setError(null)
      try {
        if (!user?._id) return
        const res = await fetch(`${API_BASE_URL}/users/${user._id}/posts`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed to load posts")
        const data = await res.json()
        setPosts(data.posts || [])
      } catch (err: any) {
        setError(err.message || "Failed to load posts")
        toast({ title: "Error", description: err.message || "Failed to load posts", variant: "destructive" })
      } finally {
        setIsPostsLoading(false)
      }
    }
    if (user?._id) fetchPosts()
  }, [user, toast])

  // Follow/unfollow logic for dialog
  const handleDialogFollowToggle = async (userId: string, isFollowing: boolean, type: 'followers' | 'following') => {
    try {
      if (isFollowing) {
        await apiRequest(`/users/${userId}/unfollow`, { method: 'PATCH' });
      } else {
        await apiRequest(`/users/${userId}/follow`, { method: 'PATCH' });
      }
      // Refresh dialog data and profile user state
      if (type === 'followers') {
        if (user?.followers?.length) {
          setIsLoadingFollowers(true);
          fetchUserDetails(user.followers).then(setFollowersData).finally(() => setIsLoadingFollowers(false));
        }
      } else {
        if (user?.following?.length) {
          setIsLoadingFollowing(true);
          fetchUserDetails(user.following).then(setFollowingData).finally(() => setIsLoadingFollowing(false));
        }
      }
      // Also refresh main user state to update counts
      if (user?._id) {
        const updatedUser = await apiRequest<User>(`/users/${user._id}`);
        setUser(updatedUser);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update follow status', variant: 'destructive' });
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
        <Navbar user={undefined} />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <ProfileSkeleton />
          <div className="space-y-6">{[...Array(2)].map((_, i) => <PostSkeleton key={i} />)}</div>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
        <Navbar user={undefined} />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
      <Navbar user={{ name: user.name, email: user.email, avatar: user.avatar }} />
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
            <div className="absolute -bottom-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <CardHeader className="pt-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">{user.email}</p>
                
                {user.bio && (
                  <p className="text-gray-700 max-w-2xl">{user.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                  {user.location && (
                    <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                      <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                      {user.location}
                    </div>
                  )}
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4 mr-1 text-purple-500" />
                    Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-4 md:mt-0">
                <Button 
                  onClick={() => setEditOpen(true)}
                  className="bg-black text-white hover:bg-gray-800 border-black shadow-lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            <div className="flex space-x-8 text-sm mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{posts.length || 0}</div>
                <div className="text-gray-600">Posts</div>
              </div>
              <button
                onClick={() => setShowFollowers(true)}
                className="text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-2xl font-bold text-gray-900">{user.followers?.length || 0}</div>
                <div className="text-gray-600">Followers</div>
              </button>
              <button
                onClick={() => setShowFollowing(true)}
                className="text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="text-2xl font-bold text-gray-900">{user.following?.length || 0}</div>
                <div className="text-gray-600">Following</div>
              </button>
            </div>
          </CardHeader>
        </Card>
        
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          user={user}
          onUserUpdated={handleUserUpdated}
        />
        <FollowersDialog
          open={showFollowers}
          onOpenChange={setShowFollowers}
          title="Followers"
          users={followersData}
          isLoading={isLoadingFollowers}
          currentUserId={user._id}
          onFollowToggle={async (userId, isFollowing) => handleDialogFollowToggle(userId, isFollowing, 'followers')}
        />
        <FollowersDialog
          open={showFollowing}
          onOpenChange={setShowFollowing}
          title="Following"
          users={followingData}
          isLoading={isLoadingFollowing}
          currentUserId={user._id}
          onFollowToggle={async (userId, isFollowing) => handleDialogFollowToggle(userId, isFollowing, 'following')}
        />
        
        <Tabs defaultValue="posts" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
            <TabsTrigger value="posts" className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6 mt-6">
            {isPostsLoading ? (
              <div className="space-y-6">{[...Array(2)].map((_, i) => <PostSkeleton key={i} />)}</div>
            ) : posts.length > 0 ? (
              <PostsList
                posts={posts}
                onLike={() => {}}
                onComment={() => {}}
                currentUserId={user._id}
                onDelete={handleDeletePost}
              />
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-600">Share your first post to get started!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Liked Posts Yet</h3>
                <p className="text-gray-600">Posts that you like will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MobileNavigation />
    </div>
  )
}
