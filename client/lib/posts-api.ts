import { apiRequest, ApiError } from "./api"

export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  interests?: string
  followers?: string[]
  following?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Comment {
  _id: string
  content: string
  user: User
  post: string
  createdAt: string
  updatedAt: string
}

export interface Post {
  _id: string
  content: string
  fileUrl?: string
  fileType?: string
  user: User
  comments: Comment[]
  likes: string[]
  createdAt: string
  updatedAt: string
}

export interface CreatePostData {
  content: string
  file?: File
}

// Remove MOCK_POSTS and all mock/fallback logic

// Get all posts
export async function getAllPosts(): Promise<Post[]> {
  try {
    console.log("Attempting to fetch posts...")
    const response = await apiRequest<{ posts: Post[] }>("/posts")
    console.log("Successfully fetched posts:", response)
    return response.posts || []
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    throw error
  }
}

// Get single post by ID
export async function getPostById(postId: string): Promise<Post> {
  try {
    const response = await apiRequest<{ post: Post }>(`/posts/${postId}`)
    return response.post || (response as any)
  } catch (error) {
    console.error("Failed to fetch post:", error)
    throw error
  }
}

// Create new post
export async function createPost(data: CreatePostData): Promise<Post> {
  try {
    const formData = new FormData()
    formData.append("content", data.content)

    if (data.file) {
      formData.append("file", data.file)
    }

    const response = await apiRequest<{ post: Post }>("/posts", {
      method: "POST",
      body: formData,
    })

    return response.post || (response as any)
  } catch (error) {
    console.error("Failed to create post:", error)
    throw error
  }
}

// Update post
export async function updatePost(postId: string, data: CreatePostData): Promise<Post> {
  try {
    const formData = new FormData()
    formData.append("content", data.content)

    if (data.file) {
      formData.append("file", data.file)
    }

    const response = await apiRequest<{ post: Post }>(`/posts/${postId}`, {
      method: "PUT",
      body: formData,
    })

    return response.post || (response as any)
  } catch (error) {
    console.error("Failed to update post:", error)
    throw error
  }
}

// Delete post
export async function deletePost(postId: string): Promise<void> {
  try {
    await apiRequest(`/posts/${postId}`, {
      method: "DELETE",
    })
  } catch (error) {
    console.error("Failed to delete post:", error)
    throw error
  }
}

// Like post
export async function likePost(postId: string): Promise<void> {
  try {
    await apiRequest(`/posts/${postId}/like`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Failed to like post:", error)
    throw error
  }
}

// Unlike post
export async function unlikePost(postId: string): Promise<void> {
  try {
    await apiRequest(`/posts/${postId}/unlike`, {
      method: "PATCH",
    })
  } catch (error) {
    console.error("Failed to unlike post:", error)
    throw error
  }
}

// Add comment to post
export async function addComment(postId: string, content: string): Promise<Comment> {
  try {
    const response = await apiRequest<{ comment: Comment }>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })

    return response.comment || (response as any)
  } catch (error) {
    console.error("Failed to add comment:", error)
    throw error
  }
}
