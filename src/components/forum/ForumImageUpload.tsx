'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { UnifiedImageUpload, UnifiedImageUploadRef } from '@/components/ui/UnifiedImageUpload';

interface ForumImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  title?: string;
  compact?: boolean; // For reply forms
}

export interface ForumImageUploadRef {
  uploadPendingImages: () => Promise<string[]>;
}

/**
 * Forum-specific image upload component
 * Uses the forum bucket with compression optimized for forum posts
 */
export const ForumImageUpload = forwardRef<ForumImageUploadRef, ForumImageUploadProps>(
  ({ 
    images, 
    onChange, 
    maxImages = 5, // Reasonable limit for forum posts
    className = '',
    disabled = false,
    title,
    compact = false
  }, ref) => {
    const unifiedUploadRef = useRef<UnifiedImageUploadRef>(null);

    // Expose upload method to parent components
    useImperativeHandle(
      ref,
      () => ({
        uploadPendingImages: async (): Promise<string[]> => {
          if (!unifiedUploadRef.current) {
            return images; // Return current images if ref not available
          }
          return await unifiedUploadRef.current.uploadPendingImages();
        },
      }),
      [images]
    );

    return (
      <UnifiedImageUpload
        ref={unifiedUploadRef}
        images={images}
        onChange={onChange}
        maxImages={maxImages}
        entityType="forum"
        title={title || (compact ? "Bilder" : "Legg til bilder")}
        mode="inline"
        className={className}
        disabled={disabled}
        hideUploadButton={true} // We'll handle uploads in form submission
      />
    );
  }
);

ForumImageUpload.displayName = 'ForumImageUpload';