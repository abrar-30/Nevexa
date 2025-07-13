"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Eye, Check, X, AlertTriangle } from "lucide-react"
import { getAllReports, resolveReport, deleteReport } from "@/lib/admin-api"

interface Report {
  _id: string
  type: "post" | "comment" | "user"
  reason: string
  description: string
  reportedBy: {
    name: string
    avatar?: string
  }
  reportedContent: {
    id: string
    content: string
    author: string
  }
  status: "pending" | "resolved" | "dismissed"
  createdAt: string
}

export function AdminReportsTab() {
  const [reports, setReports] = useState<Report[]>([])
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAllReports()
      .then((data) => {
        if (Array.isArray(data)) setReports(data)
        else if (data && Array.isArray((data as any).reports)) setReports((data as any).reports)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleResolveReport = async (reportId: string) => {
    try {
      await resolveReport(reportId)
      setReports(reports.map((report) => (report._id === reportId ? { ...report, status: "resolved" as const } : report)))
      toast({
        title: "Report Resolved",
        description: "The report has been marked as resolved.",
      })
    } catch {
      toast({ title: "Error", description: "Failed to resolve report.", variant: "destructive" })
    }
  }

  const handleDismissReport = async (reportId: string) => {
    try {
      await deleteReport(reportId)
      setReports(reports.filter((report) => report._id !== reportId))
      toast({
        title: "Report Dismissed",
        description: "The report has been dismissed.",
      })
    } catch {
      toast({ title: "Error", description: "Failed to dismiss report.", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "destructive"
      case "resolved":
        return "default"
      case "dismissed":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Reports</CardTitle>
          <CardDescription>Review and manage reported content from users</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {!loading && reports.length === 0 && <div className="text-center text-gray-500">No reports found.</div>}
        {reports.map((report) => (
          <Card key={report._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium capitalize">{report.type} Report</span>
                    <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Reason: {report.reason ? report.reason.replace("-", " ") : "N/A"}</p>
                  <p className="text-sm">{report.description}</p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {report.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleResolveReport(report._id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDismissReport(report._id)}>
                        <X className="h-4 w-4 mr-2" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">Reported by:</span>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={report.reportedBy.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{report.reportedBy && report.reportedBy.name ? report.reportedBy.name.charAt(0) : "?"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{report.reportedBy.name}</span>
                  </div>
                </div>

                <div className="border-l-4 border-gray-200 pl-4">
                  <p className="text-sm font-medium">Reported Content:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    By: {report.reportedContent && report.reportedContent.author ? report.reportedContent.author : "Unknown"}
                  </p>
                  <p className="text-sm mt-2 bg-gray-50 p-3 rounded">
                    {report.reportedContent && report.reportedContent.content ? report.reportedContent.content : "No content"}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Reported on {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
