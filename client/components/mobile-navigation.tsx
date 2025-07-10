"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Users, MessageCircle, User } from "lucide-react"

export function MobileNavigation() {
  const pathname = usePathname()
  // Remove mock unread message count

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/people", label: "People", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: 3 },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
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
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center">
                    {item.badge}
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
