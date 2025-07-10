"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post-card"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { FollowersDialog } from "@/components/followers-dialog"
import { MessageDialog } from "@/components/message-dialog"
import { Edit, MessageCircle, MapPin, Calendar, UserPlus, Users, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"
import ProfileSkeleton from "@/components/profile-skeleton"
import PostSkeleton from "@/components/post-skeleton"
import type { User, Post } from "@/lib/posts-api";
import { API_BASE_URL } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-api"
import { useRouter } from "next/navigation"

// API functions for actual backend integration
const fetchUserProfile = async (userId: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch user profile")
  }

  const data = await response.json()
  return data.user || data
}

const fetchUserPosts = async (userId: string): Promise<Post[]> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/posts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch user posts")
  }

  const data = await response.json()
  return data.posts || data || []
}

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to get current user")
  }

  const data = await response.json()
  return data.user || data
}

const followUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to follow user")
  }
}

const unfollowUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/unfollow`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to unfollow user")
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params?.userId as string
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPostsLoading, setIsPostsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const { toast } = useToast()

  const loadProfile = async () => {
    if (!userId) return

    try {
      const [profileData, currentUserData] = await Promise.all([fetchUserProfile(userId), fetchCurrentUser()])

      setUser(profileData)
      setCurrentUser(currentUserData)
      
      // Check if current user is following this user
      if (currentUserData && profileData.followers) {
        setIsFollowing(profileData.followers.includes(currentUserData._id))
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPosts = async () => {
    if (!userId) return

    try {
      const postsData = await fetchUserPosts(userId)
      setPosts(postsData)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPostsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadProfile()
      loadPosts()
    }
  }, [userId])

  const handleFollowToggle = async () => {
    if (!user || !currentUser) return
    
    setIsFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(user._id)
        setIsFollowing(false)
        setUser(prev => prev ? {
          ...prev,
          followers: prev.followers?.filter(id => id !== currentUser._id) || []
        } : null)
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${user.name}`,
        })
      } else {
        await followUser(user._id)
        setIsFollowing(true)
        setUser(prev => prev ? {
          ...prev,
          followers: [...(prev.followers || []), currentUser._id]
        } : null)
        toast({
          title: "Following",
          description: `You are now following ${user.name}`,
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFollowLoading(false)
    }
  }

  const isOwnProfile = currentUser && user && currentUser._id === user._id

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
        <Navbar user={currentUser ? { name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar } : undefined} />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <ProfileSkeleton />
          <div className="space-y-6">
            {[...Array(2)].map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
        <Navbar user={currentUser ? { name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar } : undefined} />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
              <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or has been removed.</p>
              <Button onClick={loadProfile} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
        <MobileNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
      <Navbar user={currentUser ? { name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar } : undefined} />

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
                {isOwnProfile ? (
                  <Button 
                    onClick={() => setShowEditProfile(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowMessage(true)}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      variant={isFollowing ? "outline" : "default"}
                      className={isFollowing 
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" 
                        : "bg-black text-white hover:bg-gray-800 border-black"
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isFollowLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  </>
                )}
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

        <Tabs defaultValue="posts" className="w-full">
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
              <div className="space-y-6">
                {[...Array(2)].map((_, index) => (
                  <PostSkeleton key={index} />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={() => {}}
                    onComment={() => {}}
                    currentUserId={currentUser?._id || "currentUser"}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-600">When {user.name} shares their first post, it will appear here.</p>
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
                <p className="text-gray-600">Posts that {user.name} likes will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={showEditProfile}
          onOpenChange={setShowEditProfile}
          user={user}
          onUserUpdated={(updatedUser) => setUser(updatedUser)}
        />
      )}

      <FollowersDialog
        open={showFollowers}
        onOpenChange={setShowFollowers}
        title="Followers"
        users={[]} // This would be populated from API
      />

      <FollowersDialog
        open={showFollowing}
        onOpenChange={setShowFollowing}
        title="Following"
        users={[]} // This would be populated from API
      />

      {!isOwnProfile && (
        <MessageDialog
          open={showMessage}
          onOpenChange={setShowMessage}
          recipientId={user._id}
          recipientName={user.name}
        />
      )}

      <MobileNavigation />
    </div>
  )
}
