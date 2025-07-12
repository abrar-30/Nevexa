"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Menu, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth-api";
import { Navbar } from "@/components/navbar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";

interface User {
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

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  messages: Message[];
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // State for how many messages to show
  const [visibleMsgCount, setVisibleMsgCount] = useState(0);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const AVG_MSG_HEIGHT = 48; // px, adjust as needed
  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Mobile chat state
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setConversationsLoading(true);
    fetch(`${API_BASE_URL}/chat/conversations`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setConversations(data.conversations || []))
      .finally(() => setConversationsLoading(false));
  }, [currentUser]);

  useEffect(() => {
    if (!search) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(search)}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setResults(data.users || []);
          setShowDropdown(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  // Handle selecting a user from search or sidebar
  const handleUserSelect = (user: User | { id: string; name: string; avatar?: string }) => {
    setShowDropdown(false);
    setSearch("");
    const userId = (user as any).id || (user as any)._id;
    const userName = (user as any).name;
    const userAvatar = (user as any).avatar;
    // Always create a new conversation if it doesn't exist
    let conv = conversations.find(c => c.user.id === userId);
    if (!conv) {
      const newConv = {
        id: userId,
        user: { id: userId, name: userName, avatar: userAvatar },
        lastMessage: { content: "", timestamp: "", senderId: "" },
        messages: []
      };
      setConversations(prev => {
        const updated = [newConv, ...prev.filter(c => c.user.id !== userId)];
        setTimeout(() => {
          setSelectedConversation(updated[0]);
          if (window.innerWidth < 768) setMobileChatOpen(true);
        }, 0);
        return updated;
      });
    } else {
      setSelectedConversation(conv);
      if (window.innerWidth < 768) setMobileChatOpen(true);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const socketUrl = API_BASE_URL.replace(/\/api$/, "");
    const socket = io(socketUrl, { transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;
    socket.emit("join", String(currentUser._id));

    socket.on("receive-message", (msg) => {
      setConversations(prevConvs => {
        const idx = prevConvs.findIndex(c => c.user.id === msg.sender || c.user.id === msg.receiver);
        if (selectedConversation && (selectedConversation.user.id === msg.sender || selectedConversation.user.id === msg.receiver)) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            messages: [...prev.messages, {
              id: msg._id,
              content: msg.content,
              senderId: msg.sender,
              timestamp: msg.timestamp,
              read: true
            }]
          } : prev);
        }
        if (idx !== -1) {
          const updated = [...prevConvs];
          updated[idx] = {
            ...updated[idx],
            messages: [...updated[idx].messages, {
              id: msg._id,
              content: msg.content,
              senderId: msg.sender,
              timestamp: msg.timestamp,
              read: true
            }],
            lastMessage: {
              content: msg.content,
              timestamp: msg.timestamp,
              senderId: msg.sender
            }
          };
          return updated;
        }
        return prevConvs;
      });
    });

    return () => { socket.disconnect(); };
  }, [currentUser, selectedConversation]);

  useEffect(() => {
    // If ?user= is present, open chat with that user
    const userId = searchParams.get("user");
    if (userId && currentUser && !userLoading) {
      // Check if conversation already exists
      let conv = conversations.find(c => c.user.id === userId);
      if (conv) {
        setSelectedConversation(conv);
        if (window.innerWidth < 768) setMobileChatOpen(true);
      } else {
        // Fetch user info if not in conversations
        fetch(`${API_BASE_URL}/users/${userId}`, { credentials: "include" })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              handleUserSelect({ id: data.user._id, name: data.user.name, avatar: data.user.avatar });
            }
          });
      }
    }
    // Only run when conversations, currentUser, or userLoading changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, currentUser, userLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  // Handler to load more messages on scroll up
  const handleChatScroll = () => {
    if (!chatWindowRef.current) return;
    if (chatWindowRef.current.scrollTop === 0) {
      // At top, load more messages if available
      setVisibleMsgCount((prev) => {
        const total = selectedConversation?.messages.length || 0;
        return Math.min(prev + 10, total);
      });
    }
  };

  // Set initial visibleMsgCount based on chat window height
  useEffect(() => {
    if (!chatWindowRef.current || !selectedConversation) return;
    const chatHeight = chatWindowRef.current.clientHeight;
    const total = selectedConversation.messages.length;
    const fitCount = Math.max(1, Math.floor((chatHeight * 0.5) / AVG_MSG_HEIGHT));
    setVisibleMsgCount(Math.min(fitCount, total));
  }, [selectedConversation?.id]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser) return;
    const receiverId = selectedConversation.user.id;
    const msg = {
      sender: currentUser._id,
      receiver: receiverId,
      content: messageInput.trim()
    };
    socketRef.current?.emit("send-message", msg);
    const newMsg = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      senderId: currentUser._id,
      timestamp: new Date().toISOString(),
      read: true
    };
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
      lastMessage: {
        content: newMsg.content,
        timestamp: newMsg.timestamp,
        senderId: newMsg.senderId
      }
    } : prev);
    // If this conversation is not in the sidebar, add it
    setConversations(prev => {
      const exists = prev.some(c => c.user.id === receiverId);
      if (exists) {
        // Update messages for existing conversation
        return prev.map(c =>
          c.user.id === receiverId
            ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: {
                  content: newMsg.content,
                  timestamp: newMsg.timestamp,
                  senderId: newMsg.senderId
                }
              }
            : c
        );
      } else {
        // Add new conversation to the top
        return [
          {
            id: receiverId,
            user: selectedConversation.user,
            lastMessage: {
              content: newMsg.content,
              timestamp: newMsg.timestamp,
              senderId: newMsg.senderId
            },
            messages: [newMsg]
          },
          ...prev
        ];
      }
    });
    setMessageInput("");
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-gray-400 mt-10">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-red-500 mt-10">You must be logged in to view messages.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <Navbar />
      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-4 mt-6 px-2 overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        {/* Mobile: show search + recent chats, or chat window only */}
        {/* Desktop: show both */}
        {/* MOBILE: Show search + recent chats if not in chat, else show chat window only */}
        <div className={`w-full md:w-1/3 ${mobileChatOpen ? 'hidden md:flex' : ''} bg-white rounded-2xl shadow-lg p-4 flex flex-col md:static`} style={{ minWidth: 0 }}>
          <input
            ref={inputRef}
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search users to chat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => search && setShowDropdown(true)}
          />
          {showDropdown && (
            <div className="absolute bg-white border rounded-xl shadow-lg mt-2 w-full z-20">
              {loading ? (
                <div className="p-4 text-gray-400 text-center">Loading...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">No users found</div>
              ) : (
                results.map(user => (
                  <div key={user._id} className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer" onClick={() => { handleUserSelect(user); if (window.innerWidth < 768) setMobileChatOpen(true); }}>
                    <img src={user.avatar || "/placeholder-avatar.png"} alt={user.name} className="w-8 h-8 rounded-full border" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          <div className="mt-4 flex-1 overflow-visible md:overflow-y-auto md:custom-scrollbar">
            {conversationsLoading ? (
              <div className="text-gray-400 text-center">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="text-gray-400 text-center">No recent chats</div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-blue-50 ${selectedConversation?.id === conv.id ? "bg-blue-100" : ""}`} onClick={() => { setSelectedConversation(conv); if (window.innerWidth < 768) setMobileChatOpen(true); }}>
                  <img src={conv.user.avatar || "/placeholder-avatar.png"} alt={conv.user.name} className="w-10 h-10 rounded-full border" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 truncate">{conv.user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{conv.lastMessage.content}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {conv.lastMessage.timestamp && new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Chat Window */}
        <div className={`w-full md:flex-1 bg-white rounded-2xl shadow-lg flex flex-col ${mobileChatOpen ? '' : 'hidden'} md:flex`} style={{ minWidth: 0, height: 'calc(100vh - 5rem)' }}>
          {selectedConversation ? (
            <>
              {/* Mobile back button */}
              <div className="flex items-center gap-3 border-b px-6 py-4">
                {window.innerWidth < 768 && (
                  <button className="mr-2 md:hidden" onClick={() => setMobileChatOpen(false)} aria-label="Back to chats">
                    <ArrowLeft size={24} />
                  </button>
                )}
                <img src={selectedConversation.user.avatar || "/placeholder-avatar.png"} alt={selectedConversation.user.name} className="w-10 h-10 rounded-full border" />
                <div className="font-semibold text-gray-800 text-lg">{selectedConversation.user.name}</div>
              </div>

              <div
                className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar"
                ref={chatWindowRef}
                onScroll={handleChatScroll}
                style={{ minHeight: 0 }}
              >
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-gray-400 text-center mt-10">No messages yet. Start the conversation!</div>
                ) : (
                  (() => {
                    const uniqueMessages: typeof selectedConversation.messages = [];
                    const seen = new Set();
                    for (const msg of selectedConversation.messages) {
                      const key = msg.id + '-' + msg.timestamp;
                      if (!seen.has(key)) {
                        uniqueMessages.push(msg);
                        seen.add(key);
                      }
                    }
                    // Show only the most recent visibleMsgCount messages
                    const visibleMessages = uniqueMessages.slice(-visibleMsgCount);
                    return visibleMessages.map(msg => (
                      <div key={msg.id + '-' + msg.timestamp} className={`flex mb-3 ${msg.senderId === currentUser._id ? "justify-end" : "justify-start"}`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm shadow ${msg.senderId === currentUser._id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}
                          style={{ maxWidth: '50%', width: 'fit-content', minWidth: 32, wordBreak: 'break-word' }}>
                          <div>{msg.content}</div>
                          <div className="text-[10px] text-gray-500 text-right mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t px-4 py-3 flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-center px-4">
              <p>Select a chat or search for a user to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
