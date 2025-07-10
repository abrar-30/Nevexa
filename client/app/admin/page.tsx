"use client"

import { Navbar } from "@/components/navbar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminPostsTab } from "@/components/admin/admin-posts-tab"
import { AdminUsersTab } from "@/components/admin/admin-users-tab"
import { AdminReportsTab } from "@/components/admin/admin-reports-tab"
import { AdminCommentsTab } from "@/components/admin/admin-comments-tab"
import { Shield, Users, FileText, MessageSquare, Flag } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1234</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5678</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">9012</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <Flag className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">23</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-6">
            <AdminReportsTab />
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <AdminPostsTab />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <AdminCommentsTab />
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavigation />
    </div>
  )
}
