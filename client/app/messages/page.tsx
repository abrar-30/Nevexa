"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Send, MoreHorizontal, Phone, Video, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
  read: boolean
}

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    avatar?: string
    isOnline: boolean
    lastSeen?: string
  }
  lastMessage: {
    content: string
    timestamp: string
    senderId: string
  }
  unreadCount: number
  messages: Message[]
}

// Mock API functions - replace with actual API calls
const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const response = await fetch("http://localhost:5000/api/conversations", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("API not available")
    }

    const data = await response.json()
    return data.conversations || []
  } catch (error) {
    console.warn("API not available, using mock data:", error)

    // Return mock conversations when API is not available
    return [
      {
        id: "conv1",
        user: {
          id: "user1",
          name: "Alice Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: true,
        },
        lastMessage: {
          content: "Hey! How are you doing?",
          timestamp: "2024-01-15T10:30:00Z",
          senderId: "user1",
        },
        unreadCount: 2,
        messages: [
          {
            id: "msg1",
            content: "Hey! How are you doing?",
            senderId: "user1",
            timestamp: "2024-01-15T10:30:00Z",
            read: false,
          },
          {
            id: "msg2",
            content: "I'm doing great! Thanks for asking. How about you?",
            senderId: "currentUser",
            timestamp: "2024-01-15T10:35:00Z",
            read: true,
          },
          {
            id: "msg3",
            content: "That's awesome! I'm doing well too. Working on some exciting projects.",
            senderId: "user1",
            timestamp: "2024-01-15T10:40:00Z",
            read: false,
          },
        ],
      },
      {
        id: "conv2",
        user: {
          id: "user2",
          name: "Bob Smith",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: false,
          lastSeen: "2024-01-15T09:00:00Z",
        },
        lastMessage: {
          content: "Thanks for sharing that article!",
          timestamp: "2024-01-15T09:00:00Z",
          senderId: "currentUser",
        },
        unreadCount: 0,
        messages: [
          {
            id: "msg4",
            content: "Did you see that new article about AI?",
            senderId: "user2",
            timestamp: "2024-01-15T08:45:00Z",
            read: true,
          },
          {
            id: "msg5",
            content: "Thanks for sharing that article!",
            senderId: "currentUser",
            timestamp: "2024-01-15T09:00:00Z",
            read: true,
          },
        ],
      },
      {
        id: "conv3",
        user: {
          id: "user3",
          name: "Charlie Brown",
          avatar: "/placeholder.svg?height=40&width=40",
          isOnline: true,
        },
        lastMessage: {
          content: "Let's catch up soon!",
          timestamp: "2024-01-14T18:00:00Z",
          senderId: "user3",
        },
        unreadCount: 1,
        messages: [
          {
            id: "msg6",
            content: "Let's catch up soon!",
            senderId: "user3",
            timestamp: "2024-01-14T18:00:00Z",
            read: false,
          },
        ],
      },
    ]
  }
}

const sendMessage = async (conversationId: string, content: string): Promise<Message> => {
  try {
    const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error("API not available")
    }

    const data = await response.json()
    return data.message
  } catch (error) {
    console.warn("API not available, simulating message:", error)

    // Return mock message when API is not available
    return {
      id: Date.now().toString(),
      content,
      senderId: "currentUser",
      timestamp: new Date().toISOString(),
      read: true,
    }
  }
}

const getCurrentUser = async () => {
  const response = await fetch("http://localhost:5000/api/users/me", {
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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const loadConversations = async () => {
    try {
      const [fetchedConversations, user] = await Promise.all([fetchConversations(), getCurrentUser()])

      setConversations(fetchedConversations)
      setCurrentUser(user)

      // Auto-select conversation if user parameter is provided
      const userId = searchParams.get("user")
      if (userId) {
        const conversation = fetchedConversations.find((conv) => conv.user.id === userId)
        if (conversation) {
          handleConversationSelect(conversation)
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [searchParams])

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || isSending) return

    setIsSending(true)

    try {
      const message = await sendMessage(selectedConversation.id, newMessage)

      // Update conversations
      setConversations(
        conversations.map((conv) => {
          if (conv.id === selectedConversation.id) {
            return {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: {
                content: newMessage,
                timestamp: message.timestamp,
                senderId: currentUser?.id || "currentUser",
              },
            }
          }
          return conv
        }),
      )

      // Update selected conversation
      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
        lastMessage: {
          content: newMessage,
          timestamp: message.timestamp,
          senderId: currentUser?.id || "currentUser",
        },
      })

      setNewMessage("")
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setShowMobileChat(true)

    // Mark messages as read
    if (conversation.unreadCount > 0) {
      setConversations(conversations.map((conv) => (conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv)))
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  const ConversationSkeleton = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar user={currentUser} />

      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <Card className={`lg:col-span-1 ${showMobileChat ? "hidden lg:block" : ""}`}>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <ConversationSkeleton key={index} />
                    ))}
                  </>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <div key={conversation.id}>
                      <div
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                        }`}
                        onClick={() => handleConversationSelect(conversation)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={conversation.user.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {conversation.user.isOnline && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conversation.user.name}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="h-5 w-5 rounded-full p-0 text-xs">{conversation.unreadCount}</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.senderId === (currentUser?.id || "currentUser") ? "You: " : ""}
                              {conversation.lastMessage.content}
                            </p>
                            {!conversation.user.isOnline && conversation.user.lastSeen && (
                              <p className="text-xs text-muted-foreground">
                                Last seen {formatTime(conversation.user.lastSeen)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`lg:col-span-2 ${!showMobileChat ? "hidden lg:block" : ""}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowMobileChat(false)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={selectedConversation.user.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{selectedConversation.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {selectedConversation.user.isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedConversation.user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.user.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-0 flex flex-col h-[calc(100vh-20rem)]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === (currentUser?.id || "currentUser") ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.senderId === (currentUser?.id || "currentUser")
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === (currentUser?.id || "currentUser")
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        disabled={isSending}
                      />
                      <Button type="submit" disabled={!newMessage.trim() || isSending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to start messaging.</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <MobileNavigation />
    </div>
  )
}
