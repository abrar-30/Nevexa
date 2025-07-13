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
  return apiRequest<Message>('/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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