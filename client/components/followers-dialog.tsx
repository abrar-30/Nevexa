"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  isLoading?: boolean
  onFollowToggle?: (userId: string, isFollowing: boolean) => Promise<void>
  currentUserId?: string
}

export function FollowersDialog({ open, onOpenChange, title, users = [], isLoading = false, onFollowToggle, currentUserId }: FollowersDialogProps) {
  const router = useRouter();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleFollowToggle = async (e: React.MouseEvent, userId: string, isFollowing: boolean) => {
    e.stopPropagation();
    if (!onFollowToggle) return;
    setLoadingUserId(userId);
    await onFollowToggle(userId, isFollowing);
    setLoadingUserId(null);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`)
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
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading {title.toLowerCase()}...</p>
              </div>
            ) : users.length > 0 ? (
              users.map((user) => {
                const userId = user._id || user.id || "unknown"
                const userName = user.name || "Unknown User"
                const userAvatar = user.avatar || "/placeholder.svg"
                const isCurrentUser = currentUserId && (userId === currentUserId);

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

                    {!isCurrentUser && (
                      <Button
                        variant={user.isFollowing ? "outline" : "default"}
                        size="sm"
                        disabled={loadingUserId === userId}
                        onClick={(e) => handleFollowToggle(e, userId, !!user.isFollowing)}
                      >
                        {loadingUserId === userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )}
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
