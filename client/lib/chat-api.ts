import { apiRequest, API_BASE_URL } from './api';

export interface Message {
  _id: string;
  content: string;
  sender: string;
  receiver: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Conversation {
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
  unreadCount: number;
  messages: {
    id: string;
    content: string;
    senderId: string;
    timestamp: string;
    read: boolean;
  }[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface MessagesResponse {
  messages: Message[];
}

export interface SendMessageRequest {
  receiver: string;
  content: string;
}

export interface SearchUsersResponse {
  users: User[];
}

// Get all conversations for the current user
export async function getConversations(): Promise<ConversationsResponse> {
  try {
    const response = await apiRequest<ConversationsResponse>('/chat/conversations');
    
    // Ensure we have the right structure
    if (response && Array.isArray(response.conversations)) {
      return response;
    } else if (response && Array.isArray(response)) {
      // Handle case where API returns array directly
      return { conversations: response as any };
    } else {
      return { conversations: [] };
    }
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return { conversations: [] };
  }
}

// Get messages between two users
export async function getMessages(user1: string, user2: string): Promise<Message[]> {
  const response = await apiRequest<Message[]>(`/chat/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
  return response;
}

// Send a new message
export async function sendMessage(data: SendMessageRequest): Promise<Message> {
  try {
    return await apiRequest<Message>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    // Re-throw error for sendMessage as it's critical for UX
    // But suppress 401 error logging
    if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
      console.error('Failed to send message:', error);
    }
    throw error;
  }
}

// Mark conversation as read
export async function markConversationAsRead(conversationId: string): Promise<void> {
  try {
    console.log('Marking conversation as read:', conversationId);
    const response = await apiRequest<{ success: boolean; message: string; messagesMarked: number }>(`/chat/conversations/${conversationId}/read`, {
      method: 'PATCH',
    });
    console.log('Mark as read response:', response);
    return;
  } catch (error: any) {
    // Suppress 401 errors and other API errors - not critical for UX
    if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
      console.error('Failed to mark conversation as read:', error);
    }
    // Don't throw - this is not critical for user experience
  }
}

// Search users for starting new conversations
export async function searchUsers(query: string): Promise<SearchUsersResponse> {
  try {
    return await apiRequest<SearchUsersResponse>(`/users/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error('Failed to search users:', error);
    return { users: [] };
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>(`/users/${userId}`);
}