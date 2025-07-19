'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ResponsiveImageProps {
  src?: string;
  alt: string;
  aspectRatio?: number; // e.g., 16/9, 4/3, 1
  className?: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'smart';
  placeholder?: React.ReactNode;
  showAspectRatioContainer?: boolean;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  priority?: boolean;
  detectPhoneOrientation?: boolean; // Automatically adjust for phone photos
}

export default function ResponsiveImage({
  src,
  alt,
  aspectRatio = 16/9,
  className = '',
  width = 400,
  height,
  objectFit = 'cover',
  placeholder,
  showAspectRatioContainer = true,
  fallbackIcon: FallbackIcon = PhotoIcon,
  priority = false,
  detectPhoneOrientation = false
}: ResponsiveImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const calculatedHeight = height || Math.round(width / aspectRatio);

  const containerStyle = showAspectRatioContainer ? {
    paddingBottom: `${(1 / aspectRatio) * 100}%`
  } : {};

  // Smart object-fit logic for phone photos
  const getSmartObjectFit = () => {
    if (objectFit !== 'smart') return objectFit;
    
    // For phone photos, use contain for portrait images in landscape containers
    // and cover for landscape images in portrait containers
    if (detectPhoneOrientation) {
      // If container is landscape (aspectRatio > 1) but likely contains portrait phone photo
      if (aspectRatio > 1.2) {
        return 'contain'; // Show full portrait photo in landscape container
      }
      // If container is portrait but likely contains landscape photo
      else if (aspectRatio < 0.8) {
        return 'cover'; // Crop landscape photo to fit portrait container
      }
    }
    
    return 'cover'; // Default fallback
  };

  const finalObjectFit = getSmartObjectFit();

  const renderFallback = () => (
    <div className={`w-full h-full bg-slate-100 flex items-center justify-center ${className}`}>
      {placeholder || (
        <div className="text-center">
          <FallbackIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Ingen bilde</p>
        </div>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className={`w-full h-full bg-slate-200 animate-pulse flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="h-8 w-8 bg-slate-300 rounded mx-auto mb-2"></div>
        <div className="h-3 w-16 bg-slate-300 rounded"></div>
      </div>
    </div>
  );

  if (!src || imageError) {
    return showAspectRatioContainer ? (
      <div className="relative w-full" style={containerStyle}>
        <div className="absolute inset-0">
          {renderFallback()}
        </div>
      </div>
    ) : renderFallback();
  }

  return showAspectRatioContainer ? (
    <div className="relative w-full" style={containerStyle}>
      <div className="absolute inset-0">
        {imageLoading && renderLoadingState()}
        <Image
          src={src}
          alt={alt}
          fill
          className={`${finalObjectFit === 'cover' ? 'object-cover' : 
                      finalObjectFit === 'contain' ? 'object-contain' : 
                      finalObjectFit === 'fill' ? 'object-fill' : 
                      'object-scale-down'} ${className} ${
                      imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  ) : (
    <div className="relative">
      {imageLoading && renderLoadingState()}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={calculatedHeight}
        className={`${finalObjectFit === 'cover' ? 'object-cover' : 
                    finalObjectFit === 'contain' ? 'object-contain' : 
                    finalObjectFit === 'fill' ? 'object-fill' : 
                    'object-scale-down'} ${className} ${
                    imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}