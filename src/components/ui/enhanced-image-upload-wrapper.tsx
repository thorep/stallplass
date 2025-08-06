'use client';

import { EnhancedImageUpload, type ImageUploadData } from './enhanced-image-upload';
import { useCompressionFlag } from '@/hooks/useCompressionFlag';

interface EnhancedImageUploadWrapperProps {
  images: ImageUploadData[];
  onChange: (images: ImageUploadData[]) => void;
  maxImages?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  entityType?: 'stable' | 'box' | 'service' | 'horse';
  entityId?: string;
}

/**
 * Client component wrapper that uses the feature flag hook and passes it to the enhanced upload component
 */
export default function EnhancedImageUploadWrapper(props: EnhancedImageUploadWrapperProps) {
  const showCompressionInfo = useCompressionFlag();
  
  return (
    <EnhancedImageUpload
      {...props}
      showCompressionInfo={showCompressionInfo}
    />
  );
}