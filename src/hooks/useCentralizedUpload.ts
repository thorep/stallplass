'use client';

import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
// Type for image upload data
export interface ImageUploadData {
  file: File;
  preview: string;
  description?: string;
}

/**
 * Centralized upload hook with consistent folder structure
 * All images go to flat folder structure within their respective buckets:
 * - stableimages/ (all stable images)
 * - boximages/ (all box images) 
 * - service-photos/ (all service images)
 * - mine-hester/ (all horse images, mapped from 'horse' type)
 */

export type EntityType = 'stable' | 'box' | 'service' | 'horse';

interface UploadParams {
  files: File[];
  entityType: EntityType;
}

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Maps entity types to their corresponding bucket names and folders
 */
const getUploadConfig = (entityType: EntityType) => {
  const configs = {
    stable: { type: 'stable', bucket: 'stableimages', folder: '' },
    box: { type: 'box', bucket: 'boximages', folder: '' },
    service: { type: 'service', bucket: 'service-photos', folder: '' },
    horse: { type: 'stable', bucket: 'mine-hester', folder: '' }, // Use mine-hester bucket for horses
  };
  
  return configs[entityType];
};

/**
 * Upload multiple files to the appropriate bucket with consistent folder structure
 */
export function useCentralizedUpload() {
  return useMutation({
    mutationFn: async ({ files, entityType }: UploadParams): Promise<UploadResult[]> => {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[useCentralizedUpload] Session error:', sessionError);
        throw new Error('Failed to get authentication session');
      }

      if (!session?.access_token) {
        console.error('[useCentralizedUpload] No valid session found');
        throw new Error('Not authenticated');
      }

      const config = getUploadConfig(entityType);
      const results: UploadResult[] = [];

      console.log(`[useCentralizedUpload] Uploading ${files.length} files to ${config.bucket} bucket for ${entityType}`);

      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', config.type);
        formData.append('entityId', config.folder); // Use empty string for flat structure

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
          } catch (parseError) {
            errorDetails = { message: response.statusText };
          }

          const errorMessage = errorDetails.error || errorDetails.message || `HTTP ${response.status}: ${response.statusText}`;
          const fullError = {
            message: errorMessage,
            status: response.status,
            statusText: response.statusText,
            details: errorDetails.details,
            fileName: file.name,
            fileSize: file.size,
            entityType,
            bucket: config.bucket
          };

          console.error('[useCentralizedUpload] Upload failed:', fullError);
          
          const error = new Error(errorMessage) as Error & { uploadDetails?: typeof fullError };
          error.uploadDetails = fullError;
          throw error;
        }

        const result = await response.json();
        results.push(result);
      }

      console.log(`[useCentralizedUpload] Successfully uploaded ${results.length} files to ${config.bucket}`);
      return results;
    },
  });
}

/**
 * Upload images from ImageUploadData array (convenience function)
 */
export function useUploadImageData() {
  const centralizedUpload = useCentralizedUpload();
  
  return useMutation({
    mutationFn: async ({ images, entityType }: { images: ImageUploadData[]; entityType: EntityType }) => {
      // Filter out images that are already uploaded (have HTTP URLs)
      const newImages = images.filter(img => 
        img.file.size > 0 && !img.preview.startsWith('http')
      );
      
      if (newImages.length === 0) {
        return [];
      }
      
      return await centralizedUpload.mutateAsync({
        files: newImages.map(img => img.file),
        entityType
      });
    },
    onSuccess: (results) => {
      console.log(`[useUploadImageData] Uploaded ${results.length} images successfully`);
    },
    onError: (error) => {
      console.error('[useUploadImageData] Upload failed:', error);
    }
  });
}