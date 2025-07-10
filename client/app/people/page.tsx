"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, UserPlus, MessageCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api"
import { getCurrentUser } from "@/lib/auth-api"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  followers?: string[]
  following?: string[]
  isFollowing?: boolean
  mutualFollowers?: number
}

// API functions for actual backend integration
const searchUsers = async (query: string): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to search users")
  }

  const data = await response.json()
  return data.users || data || []
}

const getSuggestions = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to get suggestions")
  }

  const data = await response.json()
  return data.users || data || []
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

export default function PeoplePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearched, setIsSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [user, suggestionsData] = await Promise.all([fetchCurrentUser(), getSuggestions()])
        setCurrentUser(user)
        setSuggestions(suggestionsData)
      } catch (err) {
        console.error("Failed to load initial data:", err)
        toast({
          title: "Error",
          description: "Failed to load suggestions. Please try again.",
          variant: "destructive",
        })
      }
    }
    loadInitialData()
  }, [toast])

  // Real-time search as user types
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      } else {
        setUsers([])
        setIsSearched(false)
      }
    }, 200) // Reduced debounce time

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setUsers([])
      setIsSearched(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const results = await searchUsers(searchTerm)
      setUsers(results)
      setIsSearched(true)
    } catch (err) {
      setError("Failed to search users. Please try again.")
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const user = [...users, ...suggestions].find((u) => u._id === userId)
      if (!user) return

      if (user.isFollowing) {
        await unfollowUser(userId)
        // Update user state
        const updateUser = (u: User) =>
          u._id === userId
            ? {
                ...u,
                isFollowing: false,
                followers: u.followers?.filter((id) => id !== currentUser?._id) || [],
              }
            : u

        setUsers(users.map(updateUser))
        setSuggestions(suggestions.map(updateUser))

        toast({
          title: "Unfollowed",
          description: `You unfollowed ${user.name}`,
        })
      } else {
        await followUser(userId)
        // Update user state
        const updateUser = (u: User) =>
          u._id === userId
            ? {
                ...u,
                isFollowing: true,
                followers: [...(u.followers || []), currentUser?._id],
              }
            : u

        setUsers(users.map(updateUser))
        setSuggestions(suggestions.map(updateUser))

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
    }
  }

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const handleMessage = (userId: string, userName: string) => {
    router.push(`/messages?user=${userId}`)
  }

  const UserCard = ({ user, showMutual = true }: { user: User; showMutual?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleUserClick(user._id)}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.location || "No location"}</p>
              </div>

              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={user.isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => handleFollow(user._id)}
                  className={user.isFollowing 
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white" 
                    : "bg-black text-white hover:bg-gray-800 border-black"
                  }
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {user.isFollowing ? "Unfollow" : "Follow"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleMessage(user._id, user.name)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{user.bio || "No bio available"}</p>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                <strong>{user.followers?.length || 0}</strong> followers
              </span>
              <span>
                <strong>{user.following?.length || 0}</strong> following
              </span>
              {showMutual && user.mutualFollowers && user.mutualFollowers > 0 && (
                <Badge variant="secondary">{user.mutualFollowers} mutual</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LoadingSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-18" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-16 md:pb-0">
      <Navbar user={currentUser} />

      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Find People</h1>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search people by name, bio, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mt-3" />}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {error && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Search Error</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {isSearched && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Search Results</h2>
              {users.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Found {users.length} result{users.length !== 1 ? "s" : ""} for "{searchTerm}"
                  </p>
                  {users.map((user) => (
                    <UserCard key={user._id} user={user} />
                  ))}
                </>
              ) : (
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">No users found matching "{searchTerm}"</p>
                    <p className="text-sm text-gray-600 mt-2">Try searching with different keywords</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Suggestions */}
          {!isSearched && suggestions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Suggested for you</h2>
              {suggestions.map((user) => (
                <UserCard key={user._id} user={user} showMutual={false} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isSearched && suggestions.length === 0 && !error && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Exploring</h3>
                <p className="text-gray-600">Search for people to connect with</p>
                <p className="text-sm text-gray-600 mt-2">
                  Enter a name, bio keyword, or location to find users
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MobileNavigation />
    </div>
  )
}
