'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for admin cleanup operations
 */

/**
 * Cleanup stale data (admin only)
 */
export function usePostAdminCleanup() {
  const { getIdToken } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      cleanupType: 'stale_ads' | 'orphaned_images' | 'inactive_profiles' | 'all';
      dryRun?: boolean;
    }) => {
      const token = await getIdToken();
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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