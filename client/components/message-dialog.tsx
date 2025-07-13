"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"
import { getMessages, sendMessage, type Message as ApiMessage } from "@/lib/chat-api"
import { getCurrentUser } from "@/lib/auth-api"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
}

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientId: string
  recipientName: string
  recipientAvatar?: string
}

export function MessageDialog({ open, onOpenChange, recipientId, recipientName, recipientAvatar }: MessageDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUserId(user?._id || '')
      } catch (error) {
        console.error('Failed to get current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  // Load messages when dialog opens
  useEffect(() => {
    if (open && currentUserId && recipientId) {
      loadMessages()
    }
  }, [open, currentUserId, recipientId])

  const loadMessages = async () => {
    if (!currentUserId || !recipientId) return
    
    setLoading(true)
    try {
      const apiMessages = await getMessages(currentUserId, recipientId)
      const formattedMessages: Message[] = apiMessages.map((msg: ApiMessage) => ({
        id: msg._id,
        content: msg.content,
        senderId: msg.sender,
        timestamp: msg.createdAt,
      }))
      setMessages(formattedMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || sending) return

    setSending(true)
    try {
      const sentMessage = await sendMessage({
        receiver: recipientId,
        content: newMessage.trim(),
      })

      const newMsg: Message = {
        id: sentMessage._id,
        content: sentMessage.content,
        senderId: sentMessage.sender,
        timestamp: sentMessage.createdAt,
      }

      setMessages(prev => [...prev, newMsg])
      setNewMessage("")
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={recipientAvatar || "/placeholder.svg?height=32&width=32"} />
              <AvatarFallback>{recipientName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>{recipientName}</span>
          </DialogTitle>
          <DialogDescription>Send a message to {recipientName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === currentUserId ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${message.senderId === currentUserId ? "text-blue-100" : "text-gray-500"}`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
