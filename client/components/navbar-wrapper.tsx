"use client"
import { useEffect, useState } from "react";
import { Navbar } from "./navbar";
import { getConversations } from "@/lib/chat-api";

export function NavbarWrapper() {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const response = await getConversations();
        if (response && response.conversations) {
          const totalUnread = response.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
        }
      } catch (e) {
        setUnreadMessagesCount(0);
      }
    }
    fetchUnread();
  }, []);

  return <Navbar unreadMessagesCount={unreadMessagesCount} />;
} 