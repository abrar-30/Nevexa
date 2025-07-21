"use client"
import { MobileNavigation } from "./mobile-navigation";
import { useMessageCount } from "@/contexts/message-context";

export function MobileNavigationWrapper() {
  const unreadMessagesCount = useMessageCount();
  return <MobileNavigation unreadMessagesCount={unreadMessagesCount} />;
}
