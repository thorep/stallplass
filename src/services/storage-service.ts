import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

export type StorageBucket = 'stableimages' | 'boximages' | 'service-photos';

interface UploadOptions {
  bucket: StorageBucket;
  folder?: string;
  quality?: number;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  supabaseClient?: SupabaseClient; // Optional authenticated client
}

interface UploadResult {
  url: string;
  path: string;
}

export class StorageService {
  private static defaultCompressionOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    quality: 0.8
  };

  /**
   * Compress an image file
   */
  private static async compressImage(file: File, options?: Partial<typeof this.defaultCompressionOptions>): Promise<File> {
    const compressionOptions = { ...this.defaultCompressionOptions, ...options };

    try {
      return await imageCompression(file, compressionOptions);
    } catch {
      return file;
    }
  }

  /**
   * Generate a unique filename with timestamp and random string
   */
  private static generateFilename(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop() || 'jpg';
    const filename = `${timestamp}_${randomString}.${extension}`;
    
    return folder ? `${folder}/${filename}` : filename;
  }

  /**
   * Upload a single image to Supabase storage
   */
  static async uploadImage(file: File, options: UploadOptions): Promise<UploadResult> {
    const { bucket, folder, quality, maxSizeMB, maxWidthOrHeight, supabaseClient } = options;
    
    // Use authenticated client if provided, otherwise fall back to basic client
    const client = supabaseClient || createClient();
    
    // Compress the image
    const compressedFile = await this.compressImage(file, {
      quality,
      maxSizeMB,
      maxWidthOrHeight
    });

    // Generate unique filename
    const filePath = this.generateFilename(file.name, folder);

    // Upload to Supabase storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message || JSON.stringify(error)}`);
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(files: File[], options: UploadOptions): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(bucket: StorageBucket, path: string, supabaseClient?: SupabaseClient): Promise<void> {
    const client = supabaseClient || createClient();
    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple images from storage
   */
  static async deleteImages(bucket: StorageBucket, paths: string[]): Promise<void> {
    const { error } = await createClient().storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new Error(`Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract the storage path from a Supabase public URL
   */
  static extractPathFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('[StorageService] Empty or invalid URL provided for path extraction');
      return null;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Supabase storage URL (includes local dev URLs)
      if (urlObj.hostname.includes('supabase.co') || urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
        // Try multiple URL patterns for better compatibility
        const patterns = [
          // Standard pattern: .../storage/v1/object/public/bucket/path
          /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/,
          // Alternative pattern without v1: .../storage/object/public/bucket/path
          /\/storage\/object\/public\/[^/]+\/(.+)$/,
          // Legacy pattern: .../object/public/bucket/path
          /\/object\/public\/[^/]+\/(.+)$/
        ];
        
        for (const pattern of patterns) {
          const pathMatch = url.match(pattern);
          if (pathMatch) {
            return decodeURIComponent(pathMatch[1]);
          }
        }
        
        console.warn('[StorageService] Could not extract path from URL:', url);
      } else {
        console.warn('[StorageService] Not a Supabase URL:', url);
      }
    } catch (error) {
      console.error('[StorageService] Error parsing URL:', url, error);
    }
    return null;
  }

  /**
   * Get the bucket name from a Supabase public URL
   */
  static extractBucketFromUrl(url: string): StorageBucket | null {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.warn('[StorageService] Empty or invalid URL provided for bucket extraction');
      return null;
    }
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Supabase storage URL (includes local dev URLs)
      if (urlObj.hostname.includes('supabase.co') || urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost') {
        // Try multiple URL patterns for better compatibility
        const patterns = [
          // Standard pattern: .../storage/v1/object/public/bucket/...
          /\/storage\/v1\/object\/public\/([^/]+)\//,
          // Alternative pattern without v1: .../storage/object/public/bucket/...
          /\/storage\/object\/public\/([^/]+)\//,
          // Legacy pattern: .../object/public/bucket/...
          /\/object\/public\/([^/]+)\//
        ];
        
        for (const pattern of patterns) {
          const bucketMatch = url.match(pattern);
          if (bucketMatch) {
            const bucket = bucketMatch[1];
            
            // Validate bucket name against known types
            if (bucket === 'stableimages' || bucket === 'boximages' || bucket === 'service-photos') {
              return bucket as StorageBucket;
            } else {
              console.warn('[StorageService] Unknown bucket type:', bucket, 'from URL:', url);
              return null;
            }
          }
        }
        
        console.warn('[StorageService] Could not extract bucket from URL:', url);
      } else {
        console.warn('[StorageService] Not a Supabase URL:', url);
      }
    } catch (error) {
      console.error('[StorageService] Error parsing URL for bucket extraction:', url, error);
    }
    return null;
  }

  /**
   * Delete image by URL (extracts path and bucket automatically)
   */
  static async deleteImageByUrl(url: string): Promise<void> {
    console.log('[StorageService] Attempting to delete image from URL:', url);
    
    const bucket = this.extractBucketFromUrl(url);
    const path = this.extractPathFromUrl(url);

    console.log('[StorageService] Extracted bucket:', bucket);
    console.log('[StorageService] Extracted path:', path);

    if (!bucket && !path) {
      throw new Error(`Could not extract bucket or path from URL. URL: ${url}`);
    }
    
    if (!bucket) {
      throw new Error(`Could not extract bucket from URL. URL: ${url}. Extracted path: ${path}`);
    }
    
    if (!path) {
      throw new Error(`Could not extract path from URL. URL: ${url}. Extracted bucket: ${bucket}`);
    }

    console.log('[StorageService] Proceeding to delete from bucket:', bucket, 'path:', path);
    await this.deleteImage(bucket, path);
    console.log('[StorageService] Successfully deleted image');
  }

  /**
   * Debug utility to analyze URL structure
   */
  static debugUrl(url: string): void {
    console.log('[StorageService] URL Debug Analysis:');
    console.log('- Original URL:', url);
    
    try {
      const urlObj = new URL(url);
      console.log('- Hostname:', urlObj.hostname);
      console.log('- Pathname:', urlObj.pathname);
      console.log('- Is Supabase URL:', urlObj.hostname.includes('supabase.co') || urlObj.hostname === '127.0.0.1' || urlObj.hostname === 'localhost');
      
      // Test all patterns for bucket extraction
      const bucketPatterns = [
        { name: 'Standard v1', pattern: /\/storage\/v1\/object\/public\/([^/]+)\// },
        { name: 'No v1', pattern: /\/storage\/object\/public\/([^/]+)\// },
        { name: 'Legacy', pattern: /\/object\/public\/([^/]+)\// }
      ];
      
      console.log('- Bucket extraction attempts:');
      bucketPatterns.forEach(({ name, pattern }) => {
        const match = url.match(pattern);
        console.log(`  ${name}: ${match ? match[1] : 'NO MATCH'}`);
      });
      
      // Test all patterns for path extraction
      const pathPatterns = [
        { name: 'Standard v1', pattern: /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/ },
        { name: 'No v1', pattern: /\/storage\/object\/public\/[^/]+\/(.+)$/ },
        { name: 'Legacy', pattern: /\/object\/public\/[^/]+\/(.+)$/ }
      ];
      
      console.log('- Path extraction attempts:');
      pathPatterns.forEach(({ name, pattern }) => {
        const match = url.match(pattern);
        console.log(`  ${name}: ${match ? decodeURIComponent(match[1]) : 'NO MATCH'}`);
      });
      
    } catch (error) {
      console.error('- URL parsing error:', error);
    }
  }
}

// Convenience functions for specific buckets
export const StableImageService = {
  upload: (file: File, folder?: string) => 
    StorageService.uploadImage(file, { bucket: 'stableimages', folder }),
  
  uploadMultiple: (files: File[], folder?: string) =>
    StorageService.uploadImages(files, { bucket: 'stableimages', folder }),
    
  delete: (path: string) => 
    StorageService.deleteImage('stableimages', path),
    
  deleteByUrl: (url: string) => 
    StorageService.deleteImageByUrl(url)
};

export const BoxImageService = {
  upload: (file: File, folder?: string) => 
    StorageService.uploadImage(file, { bucket: 'boximages', folder }),
    
  uploadMultiple: (files: File[], folder?: string) =>
    StorageService.uploadImages(files, { bucket: 'boximages', folder }),
    
  delete: (path: string) => 
    StorageService.deleteImage('boximages', path),
    
  deleteByUrl: (url: string) => 
    StorageService.deleteImageByUrl(url)
};