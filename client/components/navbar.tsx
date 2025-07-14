"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Home, Users, MessageCircle, User, LogOut, Settings, Shield } from "lucide-react"
import { getCurrentUser, logoutUser } from "@/lib/auth-api";

interface NavbarProps {
  userRole?: "general" | "admin"
  user?: {
    name: string
    email: string
    avatar?: string
  }
  unreadMessagesCount?: number
}

export function Navbar({ userRole = "general", unreadMessagesCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<NavbarProps["user"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCurrentUser()
      .then(u => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/people", label: "People", icon: Users },
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: unreadMessagesCount },
  ]

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/auth/login"
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">Nevexa</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={pathname === item.href ? "default" : "ghost"} className="relative">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{item.badge}</Badge>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {userRole === "admin" && (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {loading ? (
                    <div className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">...</div>
                  ) : (
                    <>
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{loading ? "Loading..." : user?.name || "Guest"}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {loading ? "" : user?.email || "Not logged in"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
