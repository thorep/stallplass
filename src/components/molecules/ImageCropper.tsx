'use client';

import { useState, useRef, useCallback } from 'react';
import { Cropper, ReactCropperElement } from 'react-cropper';
// CropperJS 2.0 doesn't require CSS import
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';

interface ImageCropperProps {
  src: string;
  aspectRatio?: number; // e.g., 16/9, 4/3, 1 (square)
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function ImageCropper({ 
  src, 
  aspectRatio = 16/9, 
  onCrop, 
  onCancel,
  title = "Beskjær bilde"
}: ImageCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCrop = useCallback(async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsProcessing(true);
    try {
      const canvas = cropper.getCroppedCanvas({
        width: 800, // Standard width for stable images
        height: Math.round(800 / aspectRatio),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
      onCrop(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [aspectRatio, onCrop]);

  const getAspectRatioName = (ratio: number) => {
    if (ratio === 1) return 'Kvadrat (1:1)';
    if (ratio === 16/9) return 'Bredformat (16:9)';
    if (ratio === 4/3) return 'Standard (4:3)';
    if (ratio === 3/2) return 'Foto (3:2)';
    return `Tilpasset (${ratio.toFixed(2)}:1)`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              Beskjær bildet til {getAspectRatioName(aspectRatio)}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cropper */}
        <div className="p-4 max-h-[60vh] overflow-hidden">
          <Cropper
            ref={cropperRef}
            src={src}
            style={{ height: '100%', width: '100%', maxHeight: '50vh' }}
            aspectRatio={aspectRatio}
            guides={true}
            background={false}
            responsive={true}
            autoCropArea={0.8}
            checkOrientation={false}
            viewMode={1}
            dragMode="move"
            cropBoxMovable={true}
            cropBoxResizable={true}
            toggleDragModeOnDblclick={false}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Dra og tilpass området du vil beholde i bildet
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Avbryt
            </Button>
            <Button
              variant="primary"
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Beskjærer...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Bruk dette utsnitt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}