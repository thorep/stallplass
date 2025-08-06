"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IMAGE_CONSTRAINTS } from "@/utils/constants";
import { compressImage, formatFileSize, isValidImageType } from "@/utils/image-compression";
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export interface ImageUploadData {
  file: File;
  preview: string;
  description?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

interface EnhancedImageUploadProps {
  images: ImageUploadData[];
  onChange: (images: ImageUploadData[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  entityType?: "stable" | "box" | "service" | "horse"; // For logging
  entityId?: string; // For logging
  showCompressionInfo?: boolean; // Controlled by feature flag showCompressionInfoFrontend
}

export function EnhancedImageUpload({
  images,
  onChange,
  maxImages = 5,
  maxSize = IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024), // Use our 4MB limit
  acceptedTypes = IMAGE_CONSTRAINTS.ALLOWED_TYPES as unknown as string[],
  className,
  disabled = false,
  entityType = "stable",
  entityId,
  showCompressionInfo = false,
}: EnhancedImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<string[]>([]);

  const logUploadAttempt = useCallback(
    (
      file: File,
      status: "start" | "compressed" | "failed" | "success",
      details?: Record<string, unknown>
    ) => {
      const logData = {
        timestamp: new Date().toISOString(),
        entityType,
        entityId,
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        fileType: file.type,
        status,
        ...details,
      };

      console.log(`[IMAGE_UPLOAD_${status.toUpperCase()}]`, logData);
    },
    [entityType, entityId]
  );

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!isValidImageType(file)) {
      logUploadAttempt(file, "failed", { reason: "invalid_type", allowedTypes: acceptedTypes });
      return `Filtype ${file.type} er ikke støttet. Kun JPEG, PNG og WebP er tillatt.`;
    }

    // File size will be checked after compression
    return null;
  };

  const processFile = async (file: File): Promise<ImageUploadData | null> => {
    const originalSize = file.size;
    const originalSizeMB = originalSize / (1024 * 1024);

    logUploadAttempt(file, "start", { originalSizeMB: originalSizeMB.toFixed(2) });

    // Always try to compress, even if file is under limit
    // This helps with resizing for optimal viewing
    try {
      console.log(`🎨 Starting compression for ${file.name} (${originalSizeMB.toFixed(2)}MB)`);

      const compressionResult = await compressImage(file, {
        maxSizeMB: maxSize,
        maxWidthOrHeight: 1920, // Optimal for both mobile and desktop
      });

      const compressedFile = compressionResult.file;
      const compressedSizeMB = compressedFile.size / (1024 * 1024);

      // Log detailed compression results
      const compressionLog = {
        fileName: file.name,
        originalSize: formatFileSize(originalSize),
        originalSizeMB: originalSizeMB.toFixed(2),
        compressedSize: formatFileSize(compressedFile.size),
        compressedSizeMB: compressedSizeMB.toFixed(2),
        compressionRatio: `${compressionResult.compressionRatio}%`,
        savedBytes: originalSize - compressedFile.size,
        savedMB: (originalSizeMB - compressedSizeMB).toFixed(2),
      };

      console.log("✅ COMPRESSION SUCCESSFUL:", compressionLog);
      logUploadAttempt(file, "compressed", compressionLog);

      // Check if compressed file is still too large
      if (compressedSizeMB > maxSize) {
        const errorMsg = `Bilde kunne ikke komprimeres nok. Selv etter komprimering er filen ${compressedSizeMB.toFixed(
          1
        )}MB (maks ${maxSize}MB). Prøv et mindre bilde.`;

        console.warn("⚠️ COMPRESSION INSUFFICIENT:", {
          fileName: file.name,
          compressedSizeMB: compressedSizeMB.toFixed(2),
          maxSizeMB: maxSize,
          stillExceedsBy: (compressedSizeMB - maxSize).toFixed(2),
        });

        logUploadAttempt(file, "failed", {
          reason: "still_too_large_after_compression",
          compressedSizeMB: compressedSizeMB.toFixed(2),
          maxSizeMB: maxSize,
        });

        alert(errorMsg);
        return null;
      }

      // Create preview URL
      const preview = URL.createObjectURL(compressedFile);

      logUploadAttempt(compressedFile, "success", compressionLog);

      // Add compression info message
      if (compressionResult.compressionRatio > 0) {
        const statMsg = `✓ ${file.name}: Komprimert ${
          compressionResult.compressionRatio
        }% (${originalSizeMB.toFixed(1)}MB → ${compressedSizeMB.toFixed(1)}MB)`;
        setCompressionStats((prev) => [...prev, statMsg]);
        console.log("📊 USER FEEDBACK:", statMsg);
      }

      return {
        file: compressedFile,
        preview,
        description: "",
        originalSize,
        compressedSize: compressedFile.size,
        compressionRatio: compressionResult.compressionRatio,
      };
    } catch (error) {
      console.error("❌ COMPRESSION ERROR:", {
        fileName: file.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      logUploadAttempt(file, "failed", {
        reason: "compression_error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // If compression fails, check original file size
      if (originalSizeMB > maxSize) {
        alert(
          `Komprimering feilet og original fil er for stor (${originalSizeMB.toFixed(
            1
          )}MB). Maksimal størrelse er ${maxSize}MB.`
        );
        return null;
      }

      // Use original file if under size limit
      const preview = URL.createObjectURL(file);
      return {
        file,
        preview,
        description: "",
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
      };
    }
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;

    // Check if we would exceed max images
    if (images.length + files.length > maxImages) {
      console.warn("MAX_IMAGES_EXCEEDED:", {
        current: images.length,
        attempting: files.length,
        maxImages,
      });
      alert(`Du kan kun laste opp maksimalt ${maxImages} bilder totalt.`);
      return;
    }

    setIsCompressing(true);
    setCompressionStats([]);
    const newImages: ImageUploadData[] = [];
    const errors: string[] = [];

    console.log(`📤 Processing ${files.length} files for upload...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const processedImage = await processFile(file);
      if (processedImage) {
        newImages.push(processedImage);
      }
    }

    setIsCompressing(false);

    if (errors.length > 0) {
      console.error("UPLOAD_ERRORS:", errors);
      alert(`Feil ved opplasting:\n${errors.join("\n")}`);
    }

    if (newImages.length > 0) {
      console.log(`✅ Successfully processed ${newImages.length} images`);
      onChange([...images, ...newImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);

    // Clean up preview URL
    if (images[index].preview) {
      URL.revokeObjectURL(images[index].preview);
    }

    console.log("IMAGE_REMOVED:", {
      fileName: images[index].file.name,
      index,
      remainingImages: newImages.length,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center">
            {isCompressing ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-body-sm text-muted-foreground">
                  Komprimerer og optimaliserer bilder...
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-body mb-2">Dra og slipp bilder her, eller klikk for å velge</p>
                <p className="text-body-sm text-muted-foreground mb-4">
                  Maks {maxImages} bilder
                  <br />
                  Bilder blir automatisk komprimert og optimalisert for visning
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes.join(",")}
                  multiple
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                  disabled={disabled}
                  data-cy="image-upload-input"
                  data-testid="image-upload-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || images.length >= maxImages}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Velg bilder
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compression stats */}
      {showCompressionInfo && compressionStats.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-body-sm font-medium text-green-900">Bilder optimalisert</p>
                {compressionStats.map((stat, i) => (
                  <p key={i} className="text-body-sm text-green-700">
                    {stat}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <Image
                    src={image.preview}
                    alt={`Bilde ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {showCompressionInfo &&
                  image.compressionRatio !== undefined &&
                  image.compressionRatio > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      -{image.compressionRatio}%
                    </p>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info message */}
      {images.length === 0 && !isCompressing && (
        <div className="flex items-start space-x-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p className="text-body-sm">
            Tips: Bilder blir automatisk tilpasset for optimal visning på mobil og PC
          </p>
        </div>
      )}
    </div>
  );
}
