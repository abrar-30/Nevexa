"use client"
import { Navbar } from "./navbar";
import { useMessageCount } from "@/contexts/message-context";

export function NavbarWrapper() {
  const unreadMessagesCount = useMessageCount();
  return <Navbar unreadMessagesCount={unreadMessagesCount} />;
}