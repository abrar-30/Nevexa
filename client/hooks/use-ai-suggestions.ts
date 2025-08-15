import { useState, useCallback } from 'react'
import { getAISuggestion } from '@/lib/ai-api'
import { useToast } from '@/hooks/use-toast'

interface UseAISuggestionsOptions {
  onSuggestionReceived?: (suggestion: string) => void
}

export function useAISuggestions(options: UseAISuggestionsOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const getSuggestion = useCallback(async (currentText: string = '', image?: File) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const suggestion = await getAISuggestion({
        currentText: currentText.trim(),
        image
      })

      setCurrentSuggestion(suggestion)
      options.onSuggestionReceived?.(suggestion)

      return suggestion
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI suggestion'
      setError(errorMessage)
      
      toast({
        title: "AI Suggestion Failed",
        description: errorMessage,
        variant: "destructive",
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, options, toast])

  const acceptSuggestion = useCallback(() => {
    if (currentSuggestion) {
      const accepted = currentSuggestion
      setCurrentSuggestion(null)
      return accepted
    }
    return null
  }, [currentSuggestion])

  const rejectSuggestion = useCallback(() => {
    setCurrentSuggestion(null)
  }, [])

  const clearSuggestion = useCallback(() => {
    setCurrentSuggestion(null)
    setError(null)
  }, [])

  return {
    // State
    isLoading,
    currentSuggestion,
    error,
    hasSuggestion: !!currentSuggestion,

    // Actions
    getSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  }
}