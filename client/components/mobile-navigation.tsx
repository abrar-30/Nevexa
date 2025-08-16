"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Users, MessageCircle, User } from "lucide-react"
import { getConversations } from "@/lib/chat-api"

interface MobileNavigationProps {
  unreadMessagesCount?: number
}

export function MobileNavigation({ unreadMessagesCount = 0 }: MobileNavigationProps) {
  const pathname = usePathname()
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadMessagesCount)

  // Update local count when prop changes
  useEffect(() => {
    setLocalUnreadCount(unreadMessagesCount)
  }, [unreadMessagesCount])

  // Fetch unread count if not provided
  useEffect(() => {
    if (unreadMessagesCount === 0) {
      const fetchUnreadCount = async () => {
        try {
          const response = await getConversations()
          if (response && response.conversations) {
            const totalUnread = response.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
            setLocalUnreadCount(totalUnread)
          }
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      }
      fetchUnreadCount()
    }
  }, [unreadMessagesCount])

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/people", label: "People", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: localUnreadCount },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1">
            <Button
              variant={pathname === item.href ? "default" : "ghost"}
              size="sm"
              className="w-full flex flex-col items-center space-y-1 h-auto py-2 relative"
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 hover:bg-red-600 text-white border-white border-2">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  )
}
