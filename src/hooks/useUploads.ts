'use client';

import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

/**
 * TanStack Query hooks for file upload management
 * Updated to use official Supabase SSR pattern instead of deprecated useAuth context
 */

/**
 * Upload a file
 */
export function usePostUpload() {
  return useMutation({
    mutationFn: async (data: {
      file: File;
      type: 'stable' | 'box' | 'service' | 'profile';
      entityId?: string;
    }) => {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[usePostUpload] Session error:', sessionError);
        throw new Error('Failed to get authentication session');
      }

      if (!session?.access_token) {
        console.error('[usePostUpload] No valid session found');
        throw new Error('Not authenticated');
      }
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('type', data.type);
      if (data.entityId) {
        formData.append('entityId', data.entityId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = { message: response.statusText };
        }

        const errorMessage = errorDetails.error || errorDetails.message || `HTTP ${response.status}: ${response.statusText}`;
        const fullError = {
          message: errorMessage,
          status: response.status,
          statusText: response.statusText,
          details: errorDetails.details,
          fileName: data.file.name,
          fileSize: data.file.size,
          uploadType: data.type,
          entityId: data.entityId
        };

        console.error('[usePostUpload] Upload failed:', fullError);
        
        interface UploadError extends Error {
          uploadDetails?: typeof fullError;
        }
        
        const error = new Error(errorMessage) as UploadError;
        error.uploadDetails = fullError;
        throw error;
      }

      const result = await response.json();
      return result;
    },
  });
}

/**
 * Upload multiple files sequentially
 */
export function usePostMultipleUploads() {

  return useMutation({
    mutationFn: async (data: {
      files: File[];
      type: 'stable' | 'box' | 'service' | 'profile';
      entityId?: string;
    }) => {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[usePostMultipleUploads] Session error:', sessionError);
        throw new Error('Failed to get authentication session');
      }

      if (!session?.access_token) {
        console.error('[usePostMultipleUploads] No valid session found');
        throw new Error('Not authenticated');
      }

      const results = [];

      // Upload files sequentially to avoid overwhelming the server
      for (const file of data.files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', data.type);
        if (data.entityId) {
          formData.append('entityId', data.entityId);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Failed to upload file ${file.name}: ${response.statusText}`);
        }

        const result = await response.json();
        results.push(result);
      }

      return results;
    },
  });
}