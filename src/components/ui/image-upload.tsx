'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploadData {
  file: File;
  preview: string;
  description: string;
}

interface ImageUploadProps {
  images: ImageUploadData[];
  onChange: (images: ImageUploadData[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE = 10; // 10MB

export function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Filtype ${file.type} er ikke støttet. Kun ${acceptedTypes.join(', ')} er tillatt.`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `Filen er for stor (${fileSizeMB.toFixed(1)}MB). Maksimal størrelse er ${maxSize}MB.`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;

    // Check if we would exceed max images
    if (images.length + files.length > maxImages) {
      alert(`Du kan kun laste opp maksimalt ${maxImages} bilder totalt.`);
      return;
    }

    const newImages: ImageUploadData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      newImages.push({
        file,
        preview,
        description: '',
      });
    }

    if (errors.length > 0) {
      alert(`Feil ved opplasting:\n${errors.join('\n')}`);
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(images[index].preview);
    
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const updateDescription = (index: number, description: string) => {
    if (disabled) return;
    
    const newImages = [...images];
    newImages[index].description = description;
    onChange(newImages);
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          images.length >= maxImages && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || images.length >= maxImages}
        />
        
        <div className="space-y-2">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {dragActive ? <Upload className="h-full w-full" /> : <ImageIcon className="h-full w-full" />}
          </div>
          <div className="text-body">
            {images.length >= maxImages ? (
              <span className="text-gray-500">Maksimalt antall bilder nådd</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Klikk for å laste opp</span>
                <span className="text-gray-500"> eller dra og slipp her</span>
              </>
            )}
          </div>
          <p className="text-body-sm text-gray-500">
            {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} opp til {maxSize}MB
          </p>
          <p className="text-body-sm text-gray-500">
            {images.length}/{maxImages} bilder
          </p>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-body">Opplastede bilder</Label>
          {images.map((image, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-body-sm font-medium">{image.file.name}</p>
                        <p className="text-body-sm text-gray-500">
                          {(image.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor={`description-${index}`} className="text-body-sm">
                        Bildebeskrivelse (valgfritt)
                      </Label>
                      <Input
                        id={`description-${index}`}
                        placeholder="Beskriv bildet..."
                        value={image.description}
                        onChange={(e) => updateDescription(index, e.target.value)}
                        disabled={disabled}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}