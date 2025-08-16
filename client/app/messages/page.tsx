"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, ArrowLeft, Loader2, MessageCircle, Plus, X, RefreshCw } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-api";
import { getConversations, searchUsers, sendMessage, markConversationAsRead, type Conversation, type User } from "@/lib/chat-api";
import { Navbar } from "@/components/navbar";
import { MobileNavigationWrapper } from "@/components/mobile-navigation-wrapper";
import { useMessageContext } from "@/contexts/message-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { InstantAuthGuard } from "@/components/instant-auth-guard";
import { ThemeProvider } from "../../context/ThemeContext";

interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  read: boolean;
}

// Define the type for theme styles
interface ThemeStyles {
  background: string;
  cardBackground: string;
  hoverBackground: string;
  primaryText: string;
  secondaryText: string;
  disabledText: string;
  accentBlue: string;
  accentPurple: string;
  border: string;
}

// Updated light theme styles to match PeoplePage
const lightThemeStyles: ThemeStyles = {
  background: "#F9FAFB", // Matches the gradient light background
  cardBackground: "#FFFFFF", // White background for cards
  hoverBackground: "#F3F4F6", // Slightly darker for hover effects
  primaryText: "#111827", // Dark text for readability
  secondaryText: "#6B7280", // Muted text for descriptions
  disabledText: "#D1D5DB", // Light gray for disabled elements
  accentBlue: "#3B82F6", // Accent color for buttons and highlights
  accentPurple: "#8B5CF6", // Secondary accent color
  border: "#E5E7EB", // Light gray for borders
};

// Updated dark theme styles to match the new design
const darkThemeStyles: ThemeStyles = {
  background: "#121212", // Deep black-gray for primary background
  cardBackground: "#1E1E1E", // Dark gray for cards and panels
  hoverBackground: "#2C2C2C", // Slightly lighter gray for hover effects and inputs
  primaryText: "#FFFFFF", // White text for primary content
  secondaryText: "#B3B3B3", // Subtle gray for secondary text
  disabledText: "#666666", // Muted gray for disabled elements
  accentBlue: "#3B82F6", // Blue accent for highlights
  accentPurple: "#8B5CF6", // Purple accent for highlights
  border: "#2A2A2A", // Divider and stroke color
};

// Updated to use class toggling for dark mode without interfering with light mode
const isDarkMode = false; // Replace with actual theme detection logic

function MessagesPageContent() {
  // Core state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectingUser, setSelectingUser] = useState<string | null>(null);

  // Message input state
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Refs
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message context for unread count management
  const { decrementUnreadCount } = useMessageContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchParams = useSearchParams();

  // Manual refresh function
  const refreshConversations = useCallback(async () => {
    if (!currentUser) return;

    setConversationsLoading(true);
    setConversationsError(null);
    
    try {
      const response = await getConversations();
      
      if (response && response.conversations) {
        setConversations(response.conversations);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setConversationsError(error instanceof Error ? error.message : 'Failed to refresh conversations');
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, [currentUser]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      console.log('Mobile detection:', isMobileView, 'Window width:', window.innerWidth);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error: any) {
        // Suppress 401 errors - auth guard will handle redirects
        if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
          console.error('Failed to load current user:', error);
        }
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Load conversations
  useEffect(() => {
    if (!currentUser) {
      setConversationsLoading(false);
      return;
    }

    const loadConversations = async () => {
      setConversationsLoading(true);
      setConversationsError(null);
      
      try {
        const response = await getConversations();
        
        if (response && response.conversations) {
          setConversations(response.conversations);
        } else {
          setConversations([]);
        }
      } catch (error: any) {
        // Suppress 401 errors - auth guard will handle redirects
        if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
          console.error('Failed to load conversations:', error);
          setConversationsError(error instanceof Error ? error.message : 'Failed to load conversations');
        }
        setConversations([]);
      } finally {
        setConversationsLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  // Implemented search functionality for the search area
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      const results = await searchUsers(searchQuery); // Fetch users from API
      setSearchResults(results.users || []); // Ensure results are correctly set
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]); // Reset to an empty array on error
      setShowSearchResults(true); // Show dropdown with "No users found"
    } finally {
      setSearchLoading(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = searchInputRef.current?.parentElement;
      
      if (searchContainer && !searchContainer.contains(target)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Socket connection
  useEffect(() => {
    if (!currentUser) return;

    const socketUrl = API_BASE_URL.replace(/\/api$/, "");
    console.log("Connecting to socket URL:", socketUrl);
    const socket = io(socketUrl, { 
      transports: ["websocket"] 
    });
    
    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    socketRef.current = socket;
    socket.emit("join", String(currentUser._id));
    console.log("Socket connected and joined room:", currentUser._id);

    socket.on("receive-message", (msg) => {
      console.log("Received message via socket:", msg);
      
      const newMessage: Message = {
        id: msg._id,
        content: msg.content,
        senderId: msg.sender,
        timestamp: msg.createdAt || new Date().toISOString(),
        read: true
      };

      // Determine the other user ID (the one we're chatting with)
      const otherUserId = msg.sender === currentUser._id ? msg.receiver : msg.sender;

      // Update selected conversation if it matches the other user
      setSelectedConversation(prev => {
        if (prev && prev.user.id === otherUserId) {
          console.log("Updating selected conversation with new message");
          
          // Check if we already have this message (to avoid duplicates)
          const messageExists = prev.messages.some(m => m.id === msg._id);
          if (messageExists) {
            console.log("Message already exists, skipping");
            return prev;
          }
          
          // Replace optimistic message if it exists
          const filteredMessages = prev.messages.filter(m => !m.id.startsWith('temp-'));
          
          return {
            ...prev,
            messages: [...filteredMessages, newMessage],
            lastMessage: {
              content: msg.content,
              timestamp: msg.createdAt || new Date().toISOString(),
              senderId: msg.sender
            }
          };
        }
        return prev;
      });

      // Update conversations list
      setConversations(prevConvs => {
        const existingIndex = prevConvs.findIndex(c => c.user.id === otherUserId);
        
        if (existingIndex !== -1) {
          console.log("Updating conversation in list");
          const updated = [...prevConvs];
          
          // Check if we already have this message (to avoid duplicates)
          const messageExists = updated[existingIndex].messages.some(m => m.id === msg._id);
          if (messageExists) {
            console.log("Message already exists in conversation list, skipping");
            return prevConvs;
          }
          
          // Replace optimistic message if it exists
          const filteredMessages = updated[existingIndex].messages.filter(m => !m.id.startsWith('temp-'));
          
          updated[existingIndex] = {
            ...updated[existingIndex],
            messages: [...filteredMessages, newMessage],
            lastMessage: {
              content: msg.content,
              timestamp: msg.createdAt || new Date().toISOString(),
              senderId: msg.sender
            }
          };
          // Move to top
          const [updatedConv] = updated.splice(existingIndex, 1);
          return [updatedConv, ...updated];
        } else {
          console.log("Conversation not found in list, might need to create new one");
          // If conversation doesn't exist, we might need to create it
          // This could happen if the receiver hasn't loaded conversations yet
        }
        
        return prevConvs;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Handle URL parameters
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId && currentUser && !userLoading && conversations.length > 0) {
      const existingConv = conversations.find(c => c.user.id === userId);
      if (existingConv) {
        handleConversationSelect(existingConv);
      }
    }
  }, [searchParams, currentUser, userLoading, conversations]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  // Handle conversation selection
  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    try {
      console.log('Selecting conversation:', conversation.user.name, 'Mobile:', isMobile);
      setSelectedConversation(conversation);

      // Scroll sidebar to the top
      const sidebarElement = document.querySelector('.sidebar-class'); // Replace with actual sidebar class or ID
      if (sidebarElement) {
        sidebarElement.scrollTop = 0;
      }

      // Mark conversation as read if there are unread messages
      if (conversation.unreadCount > 0) {
        const unreadAmount = conversation.unreadCount;

        // Optimistically update UI first for better UX
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversation.id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
        decrementUnreadCount(unreadAmount);

        // Try to mark as read on server (non-blocking)
        markConversationAsRead(conversation.user.id).catch((error: any) => {
          // Silently handle errors - UI is already updated
          if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
            console.error('Failed to mark conversation as read on server:', error);
          }
        });
      }

      if (isMobile) {
        console.log('Opening mobile chat');
        setMobileChatOpen(true);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
    }
  }, [isMobile, decrementUnreadCount]);

  // Handle user selection from search
  const handleUserSelect = useCallback(async (user: User) => {
    setSelectingUser(user._id);
    setShowSearchResults(false);
    setSearchQuery("");

    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.user.id === user._id);
      
      if (existingConv) {
        handleConversationSelect(existingConv);
      } else {
        // Create new conversation
        const newConv: Conversation = {
          id: user._id,
          user: {
            id: user._id,
            name: user.name,
            avatar: user.avatar
          },
          lastMessage: {
            content: "",
            timestamp: "",
            senderId: ""
          },
          unreadCount: 0,
          messages: []
        };
        
        setConversations(prev => [newConv, ...prev]);
        setSelectedConversation(newConv);
        
        if (isMobile) {
          setMobileChatOpen(true);
        }
      }
    } catch (error) {
      console.error('Error selecting user:', error);
    } finally {
      setSelectingUser(null);
    }
  }, [conversations, isMobile, handleConversationSelect]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser || sending) {
      console.log('Cannot send message:', { 
        hasInput: !!messageInput.trim(), 
        hasConversation: !!selectedConversation, 
        hasUser: !!currentUser, 
        isSending: sending 
      });
      return;
    }

    console.log('Sending message on mobile:', isMobile);
    setSending(true);
    
    try {
      // Create optimistic message for immediate UI update
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        content: messageInput.trim(),
        senderId: currentUser._id,
        timestamp: new Date().toISOString(),
        read: true
      };

      // Update selected conversation optimistically
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, optimisticMsg],
        lastMessage: {
          content: optimisticMsg.content,
          timestamp: optimisticMsg.timestamp,
          senderId: optimisticMsg.senderId
        }
      } : prev);

      // Update conversations list optimistically
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.user.id === selectedConversation.user.id);
        
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            messages: [...updated[existingIndex].messages, optimisticMsg],
            lastMessage: {
              content: optimisticMsg.content,
              timestamp: optimisticMsg.timestamp,
              senderId: optimisticMsg.senderId
            }
          };
          // Move to top
          const [updatedConv] = updated.splice(existingIndex, 1);
          return [updatedConv, ...updated];
        }
        
        return prev;
      });

      setMessageInput("");
      
      // Emit via socket (the backend will handle saving and broadcasting)
      socketRef.current?.emit("send-message", {
        sender: currentUser._id,
        receiver: selectedConversation.user.id,
        content: messageInput.trim()
      });
      
      console.log("Emitted message via socket:", {
        sender: currentUser._id,
        receiver: selectedConversation.user.id,
        content: messageInput.trim()
      });
      
    } catch (error: any) {
      // Suppress 401 errors - auth guard will handle redirects
      if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
        console.error('Failed to send message:', error);
      }
    } finally {
      setSending(false);
    }
  }, [messageInput, selectedConversation, currentUser, sending]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return "";
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) // 7 days
      {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error, timestamp);
      return "";
    }
  };

  // Loading states
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar hideOnMobile={isMobile && mobileChatOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
        <MobileNavigationWrapper />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar hideOnMobile={isMobile && mobileChatOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">You must be logged in to view messages.</p>
          </div>
        </div>
        <MobileNavigationWrapper />
      </div>
    );
  }

  // Updated layout for mobile view to hide chat area initially and show only text area after selecting a chat
  return (
    <div
      className={`min-h-screen flex flex-col overflow-hidden ${isDarkMode ? 'dark' : ''}`}
    >
      <Navbar hideOnMobile={isMobile && mobileChatOpen} />

      <div className="flex-1 flex w-full overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div
      className={`w-full md:w-1/3 flex-col bg-[#FFFFFF] dark:bg-[#1E1E1E] border-[#E5E7EB] dark:border-[#2A2A2A] ${isMobile && mobileChatOpen ? 'hidden' : 'flex'} h-screen`}
    >
          {/* Search Header */}
          <div className="p-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#4B5563] dark:text-[#B3B3B3]"
              />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search users to chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setShowSearchResults(true);
                  }
                }}
                className="pl-10 pr-10 bg-[#F9FAFB] dark:bg-[#1E1E1E] text-[#111827] dark:text-[#FFFFFF] border-[#D1D5DB] dark:border-[#3A3A3A] placeholder-[#9CA3AF] dark:placeholder-[#666666]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#4B5563] dark:text-[#B3B3B3] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 bg-[#FFFFFF] dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      <span className="text-sm text-[#4B5563] dark:text-[#B3B3B3] mt-2">Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[#4B5563] dark:text-[#B3B3B3] text-sm">
                      No users found
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user._id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                        className="p-3 border-b border-[#E5E7EB] dark:border-[#2A2A2A] last:border-b-0 transition-colors duration-150 hover:bg-[#F3F4F6] dark:hover:bg-[#2C2C2C] cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-[#111827] dark:text-[#FFFFFF]">
                              {user.name}
                            </p>
                            <p className="text-xs text-[#4B5563] dark:text-[#B3B3B3]">
                              {user.email}
                            </p>
                          </div>
                          <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleUserSelect(user);
        }}
        className="ml-auto text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
      >
        Start Chat
      </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default browser behavior
                  e.stopPropagation(); // Stop event propagation
                  handleConversationSelect(conversation);
                  if (isMobile) setMobileChatOpen(true);
                }}
                className={`p-4 cursor-pointer transition-colors bg-[#FFFFFF] dark:bg-[#1E1E1E] hover:bg-[#F3F4F6] dark:hover:bg-[#2C2C2C] text-[#111827] dark:text-[#FFFFFF]`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.user.avatar} />
                    <AvatarFallback>{conversation.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {conversation.user.name}
                    </p>
                    <p className="text-xs text-[#4B5563] dark:text-[#B3B3B3] truncate">
                      {conversation.lastMessage.content || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div
          className={`flex-1 flex flex-col bg-[#FFFFFF] dark:bg-[#1E1E1E] ${isMobile && !mobileChatOpen ? 'hidden' : 'flex'} h-[75vh] overflow-y-auto`}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="sticky top-0 z-10 p-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1E1E1E] flex items-center space-x-3">
                {isMobile && (
                  <button
                    onClick={() => setMobileChatOpen(false)}
                    className="mr-2 text-[#111827] dark:text-[#FFFFFF] hover:text-[#2563EB] dark:hover:text-[#2563EB]"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedConversation.user.avatar} />
                  <AvatarFallback>{selectedConversation.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-medium text-[#111827] dark:text-[#FFFFFF]">
                  {selectedConversation.user.name}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 mt-20 pb-10">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === currentUser?._id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === currentUser?._id
                            ? "bg-[#2563EB] text-white"
                            : "bg-[#E5E7EB] text-[#111827]"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input - Stick to bottom */}
              <div className="border-t border-[#E5E7EB] dark:border-[#2A2A2A] p-4 flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex space-x-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#F9FAFB] dark:bg-[#1E1E1E] text-[#111827] dark:text-[#FFFFFF] border-[#D1D5DB] dark:border-[#3A3A3A] placeholder-[#9CA3AF] dark:placeholder-[#666666]"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={sending || !messageInput.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium text-[#111827] dark:text-[#FFFFFF]">
                  Select a conversation
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
      <MobileNavigationWrapper />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ThemeProvider>
      <InstantAuthGuard>
        <MessagesPageContent />
      </InstantAuthGuard>
    </ThemeProvider>
  );
}
