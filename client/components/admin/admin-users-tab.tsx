"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, ShieldOff, Edit, Trash2 } from "lucide-react"
import { getAllUsers, blockUser, unblockUser, deleteUser } from "@/lib/admin-api"

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role: "general" | "admin"
  status: "active" | "blocked"
  postsCount: number
  followersCount: number
  joinedDate: string
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAllUsers()
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
        else if (data && Array.isArray((data as any).users)) setUsers((data as any).users)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleBlockUser = async (userId: string, status: string) => {
    try {
      if (status === "active") {
        await blockUser(userId)
        setUsers(users.map((user) => user._id === userId ? { ...user, status: "blocked" as const } : user))
        toast({ title: "User Blocked", description: `User has been blocked.` })
      } else {
        await unblockUser(userId)
        setUsers(users.map((user) => user._id === userId ? { ...user, status: "active" as const } : user))
        toast({ title: "User Unblocked", description: `User has been unblocked.` })
      }
    } catch {
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setUsers(users.filter((user) => user._id !== userId))
      toast({ title: "User Deleted", description: `User has been permanently deleted.`, variant: "destructive" })
    } catch {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {!loading && filteredUsers.length === 0 && <div className="text-center text-gray-500">No users found.</div>}
        {filteredUsers.map((user) => (
          <Card key={user._id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{user.postsCount} posts</span>
                      <span>{user.followersCount} followers</span>
                      <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    variant={user.status === "active" ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleBlockUser(user._id, user.status)}
                  >
                    {user.status === "active" ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Block
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Unblock
                      </>
                    )}
                  </Button>

                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user._id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
