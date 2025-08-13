'use client';

import { useMutation } from '@tanstack/react-query';

/**
 * TanStack Query hooks for admin cleanup operations
 */

/**
 * Cleanup stale data (admin only)
 */
export function usePostAdminCleanup() {
  return useMutation({
    mutationFn: async (data: {
      cleanupType: 'stale_ads' | 'orphaned_images' | 'inactive_profiles' | 'all';
      dryRun?: boolean;
    }) => {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to run cleanup: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

/**
 * Image cleanup for archived stables and boxes (admin only)
 */
export function usePostAdminImageCleanup() {
  return useMutation({
    mutationFn: async () => {
      try {
        console.log('🔧 Image cleanup: Starting request');
        
        const response = await fetch('/api/admin/cleanup/images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('🔧 Image cleanup: Response status:', response.status);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error('🔧 Image cleanup: Error response:', error);
          throw new Error(error.message || `Failed to scan for unused images: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🔧 Image cleanup: Success result:', result);
        return result;
      } catch (error) {
        console.error('🔧 Image cleanup: Exception:', error);
        throw error;
      }
    },
  });
}