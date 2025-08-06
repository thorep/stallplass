/**
 * Image compression and resizing utilities using browser-image-compression
 * Automatically compresses and resizes images for optimal viewing on mobile and laptop
 */

import imageCompression from 'browser-image-compression';
import { IMAGE_CONSTRAINTS } from '@/utils/constants';

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Default compression options optimized for mobile/laptop viewing
 * Most phone screens are 1080-1440px wide, laptops 1920px
 * We'll resize to max 1920px which covers both use cases well
 */
const DEFAULT_COMPRESSION_OPTIONS = {
  maxSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024), // Use our 4MB limit
  maxWidthOrHeight: 1920, // Good for both mobile and laptop viewing
  useWebWorker: true, // Use web worker for better performance
  maxIteration: 10, // Try up to 10 times to get under size limit
  initialQuality: 0.8, // Start with 80% quality
  alwaysKeepResolution: false, // Allow resizing if needed to meet size limit
} as const;

/**
 * Compress and resize a single image file
 * @param file - The image file to compress
 * @param options - Optional compression settings
 * @returns Compressed file with metadata
 */
export async function compressImage(
  file: File,
  options?: Partial<typeof DEFAULT_COMPRESSION_OPTIONS>
): Promise<CompressionResult> {
  const originalSize = file.size;
  
  // Skip compression if file is already small enough
  const sizeMB = originalSize / (1024 * 1024);
  if (sizeMB <= 1) {
    console.log(`Image ${file.name} is already small (${sizeMB.toFixed(2)}MB), skipping compression`);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }

  try {
    const compressionOptions = {
      ...DEFAULT_COMPRESSION_OPTIONS,
      ...options,
      // Log progress for debugging
      onProgress: (progress: number) => {
        console.log(`Compressing ${file.name}: ${Math.round(progress)}%`);
      },
    };

    console.log(`Starting compression for ${file.name} (${(originalSize / (1024 * 1024)).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    const compressedSize = compressedFile.size;
    const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
    
    console.log(
      `✓ Compressed ${file.name}: ${(originalSize / (1024 * 1024)).toFixed(2)}MB → ${(
        compressedSize / (1024 * 1024)
      ).toFixed(2)}MB (${compressionRatio}% reduction)`
    );

    return {
      file: new File([compressedFile], file.name, {
        type: compressedFile.type || file.type,
        lastModified: Date.now(),
      }),
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } catch (error) {
    console.error(`Failed to compress ${file.name}:`, error);
    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
}

/**
 * Compress multiple images in parallel
 * @param files - Array of image files to compress
 * @param options - Optional compression settings
 * @returns Array of compressed files with metadata
 */
export async function compressImages(
  files: File[],
  options?: Partial<typeof DEFAULT_COMPRESSION_OPTIONS>
): Promise<CompressionResult[]> {
  console.log(`Starting batch compression for ${files.length} images`);
  
  const compressionPromises = files.map((file) => compressImage(file, options));
  const results = await Promise.all(compressionPromises);
  
  // Log summary
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const averageRatio = Math.round((totalSaved / totalOriginal) * 100);
  
  console.log(
    `✓ Batch compression complete: ${(totalOriginal / (1024 * 1024)).toFixed(2)}MB → ${(
      totalCompressed / (1024 * 1024)
    ).toFixed(2)}MB (saved ${(totalSaved / (1024 * 1024)).toFixed(2)}MB, ${averageRatio}% reduction)`
  );
  
  return results;
}

/**
 * Check if a file needs compression based on size
 * @param file - The file to check
 * @param maxSizeMB - Maximum size in MB (default: 4MB)
 * @returns True if file needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 4): boolean {
  const sizeMB = file.size / (1024 * 1024);
  return sizeMB > maxSizeMB;
}

/**
 * Format file size for user-friendly display
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get compression options for specific use cases
 */
export const CompressionPresets = {
  // High quality for main stable/box images
  highQuality: {
    maxSizeMB: 4,
    maxWidthOrHeight: 1920,
    initialQuality: 0.9,
  },
  
  // Medium quality for gallery images
  mediumQuality: {
    maxSizeMB: 2,
    maxWidthOrHeight: 1440,
    initialQuality: 0.8,
  },
  
  // Low quality for thumbnails
  thumbnail: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 480,
    initialQuality: 0.7,
  },
  
  // Aggressive compression when size is critical
  aggressive: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1080,
    initialQuality: 0.6,
    alwaysKeepResolution: false,
  },
} as const;

/**
 * Validate if file is an image
 * @param file - File to validate
 * @returns True if file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  return IMAGE_CONSTRAINTS.ALLOWED_TYPES.some(type => type === file.type);
}