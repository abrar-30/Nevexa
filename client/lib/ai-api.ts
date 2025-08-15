import { apiRequest } from "./api"

export interface AISuggestionRequest {
  currentText?: string
  image?: File
}

export interface AISuggestionResponse {
  success: boolean
  suggestion: string
  hasImage: boolean
}

export interface AIHealthResponse {
  success: boolean
  status: 'healthy' | 'unhealthy'
  message?: string
  error?: string
}

/**
 * Get AI caption suggestion based on current text and optional image
 */
export async function getAISuggestion(data: AISuggestionRequest): Promise<string> {
  try {
    const formData = new FormData()
    
    if (data.currentText) {
      formData.append('currentText', data.currentText)
    }
    
    if (data.image) {
      formData.append('image', data.image)
    }

    const response = await apiRequest<AISuggestionResponse>('/ai/suggest-caption', {
      method: 'POST',
      body: formData,
    })

    if (!response.success) {
      throw new Error('Failed to get AI suggestion')
    }

    return response.suggestion
  } catch (error) {
    console.error('AI suggestion error:', error)
    throw error
  }
}

/**
 * Check AI service health
 */
export async function checkAIHealth(): Promise<AIHealthResponse> {
  try {
    const response = await apiRequest<AIHealthResponse>('/ai/health')
    return response
  } catch (error) {
    console.error('AI health check error:', error)
    return {
      success: false,
      status: 'unhealthy',
      error: 'Failed to check AI service health'
    }
  }
}