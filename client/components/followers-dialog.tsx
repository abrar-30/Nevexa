"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface User {
  _id?: string
  id?: string
  name: string
  avatar?: string
  isFollowing?: boolean
}

interface FollowersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  users: User[]
}

export function FollowersDialog({ open, onOpenChange, title, users = [] }: FollowersDialogProps) {
  const handleFollowToggle = (userId: string) => {
    // Handle follow/unfollow logic
    console.log(`Toggle follow for user ${userId}`)
  }

  const handleUserClick = (userId: string) => {
    // Navigate to user profile
    console.log(`Navigate to user ${userId} profile`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {users.length} {title.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4">
            {users.length > 0 ? (
              users.map((user) => {
                const userId = user._id || user.id || "unknown"
                const userName = user.name || "Unknown User"
                const userAvatar = user.avatar || "/placeholder.svg"

                return (
                  <div key={userId} className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => handleUserClick(userId)}
                    >
                      <Avatar>
                        <AvatarImage src={userAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{userName}</p>
                      </div>
                    </div>

                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollowToggle(userId)}
                    >
                      {user.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No {title.toLowerCase()} yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
