"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getConversations } from '@/lib/chat-api'
import { getCurrentUser } from '@/lib/auth-api'
import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/lib/api'

interface MessageContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  decrementUnreadCount: (amount?: number) => void
  incrementUnreadCount: (amount?: number) => void
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  // Fetch current user
  useEffect(() => {
    getCurrentUser()
      .then(user => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
  }, [])

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await getConversations()
      if (response && response.conversations) {
        const totalUnread = response.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      setUnreadCount(0)
    }
  }, [])

  // Initialize unread count
  useEffect(() => {
    if (currentUser) {
      refreshUnreadCount()
    }
  }, [currentUser, refreshUnreadCount])

  // Socket connection for real-time updates
  useEffect(() => {
    if (!currentUser) return

    const socketUrl = API_BASE_URL.replace(/\/api$/, "")
    const newSocket = io(socketUrl, { 
      transports: ["websocket"] 
    })
    
    newSocket.on("connect", () => {
      newSocket.emit("join", String(currentUser._id))
    })

    newSocket.on("receive-message", (msg) => {
      // Only increment if the message is for the current user (not sent by them)
      if (msg.receiver === currentUser._id && msg.sender !== currentUser._id) {
        setUnreadCount(prev => prev + 1)
      }
    })

    newSocket.on("unread-count-update", (data) => {
      if (data.increment) {
        setUnreadCount(prev => prev + data.increment)
      } else if (data.decrement) {
        setUnreadCount(prev => Math.max(0, prev - data.decrement))
      }
    })

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })
    
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [currentUser])

  // Manual count adjustment functions
  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount))
  }, [])

  const incrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount(prev => prev + amount)
  }, [])

  const value: MessageContextType = {
    unreadCount,
    refreshUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount
  }

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  )
}

export function useMessageContext() {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider')
  }
  return context
}

// Hook for components that want to use message count but don't require the context
export function useMessageCount() {
  const context = useContext(MessageContext)
  return context?.unreadCount ?? 0
}
