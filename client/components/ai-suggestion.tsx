"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AISuggestionProps {
  isLoading: boolean
  suggestion: string | null
  onAccept: () => void
  onReject: () => void
  className?: string
}

export function AISuggestion({ 
  isLoading, 
  suggestion, 
  onAccept, 
  onReject,
  className 
}: AISuggestionProps) {
  if (!isLoading && !suggestion) {
    return null
  }

  return (
    <Card className={cn("border-blue-200 bg-blue-50/50", className)}>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        ) : suggestion ? (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-1">AI Suggestion:</p>
                <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={onAccept}
                className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                className="h-7 px-3 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}