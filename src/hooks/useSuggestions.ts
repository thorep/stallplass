'use client';

import { useMutation } from '@tanstack/react-query';

/**
 * TanStack Query hooks for suggestions management
 */

/**
 * Submit a suggestion - no auth required, creates GitHub issue
 */
export function usePostSuggestion() {
  return useMutation({
    mutationFn: async (data: {
      type: 'feature' | 'bug';
      title?: string;
      description: string;
    }) => {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Failed to submit suggestion: ${response.statusText}`);
      }
      return response.json();
    }
  });
}