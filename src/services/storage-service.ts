import { supabase } from '@/lib/supabase';
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
    } catch (_) {
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
    const client = supabaseClient || supabase;
    
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
    const client = supabaseClient || supabase;
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
    const { error } = await supabase.storage
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
    try {
      const urlObj = new URL(url);
      
      // Check if it's a Supabase storage URL
      if (urlObj.hostname.includes('supabase')) {
        // Extract path from URL pattern: .../storage/v1/object/public/bucket/path
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
      }
    } catch {
    }
    return null;
  }

  /**
   * Get the bucket name from a Supabase public URL
   */
  static extractBucketFromUrl(url: string): StorageBucket | null {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('supabase')) {
        const bucketMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\//);
        const bucket = bucketMatch ? bucketMatch[1] : null;
        
        if (bucket === 'stableimages' || bucket === 'boximages') {
          return bucket as StorageBucket;
        }
      }
    } catch {
    }
    return null;
  }

  /**
   * Delete image by URL (extracts path and bucket automatically)
   */
  static async deleteImageByUrl(url: string): Promise<void> {
    const bucket = this.extractBucketFromUrl(url);
    const path = this.extractPathFromUrl(url);

    if (!bucket || !path) {
      throw new Error('Could not extract bucket or path from URL');
    }

    await this.deleteImage(bucket, path);
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