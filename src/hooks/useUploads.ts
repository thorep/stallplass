'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase-auth-context';

/**
 * TanStack Query hooks for file upload management
 */

/**
 * Upload a file
 */
export function usePostUpload() {
  const { getIdToken } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      type: 'stable' | 'box' | 'service' | 'profile';
      entityId?: string;
    }) => {
      const token = await getIdToken();
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('type', data.type);
      if (data.entityId) {
        formData.append('entityId', data.entityId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to upload file: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

/**
 * Upload multiple files
 */
export function usePostMultipleUploads() {
  const { getIdToken } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      files: File[];
      type: 'stable' | 'box' | 'service' | 'profile';
      entityId?: string;
    }) => {
      const token = await getIdToken();
      const formData = new FormData();
      
      data.files.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });
      formData.append('type', data.type);
      formData.append('fileCount', data.files.length.toString());
      if (data.entityId) {
        formData.append('entityId', data.entityId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to upload files: ${response.statusText}`);
      }
      return response.json();
    },
  });
}