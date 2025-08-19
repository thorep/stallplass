"use client";

import React, { forwardRef, useState } from "react";
import {
  UnifiedImageUpload,
  UnifiedImageUploadRef,
} from "@/components/ui/UnifiedImageUpload";
import type { EntityType } from "@/hooks/useCentralizedUpload";

interface ImageUploadFieldProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onDescriptionsChange: (descriptions: Record<string, string>) => void;
  initialDescriptions: Record<string, string>;
  entityType: EntityType;
  maxImages?: number;
  required?: boolean;
  mode?: "create" | "edit";
  onCountChange?: (count: number) => void;
}

export const ImageUploadField = forwardRef<UnifiedImageUploadRef, ImageUploadFieldProps>(
  (
    {
      images,
      onImagesChange,
      onDescriptionsChange,
      initialDescriptions,
      entityType,
      maxImages = 10,
      required,
      mode = "create",
      onCountChange,
    },
    ref
  ) => {
    const [count, setCount] = useState<number>(images.length || 0);

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Bilder</h3>
        <UnifiedImageUpload
          ref={ref}
          images={images}
          onChange={(urls) => onImagesChange(urls)}
          onDescriptionsChange={onDescriptionsChange}
          initialDescriptions={initialDescriptions}
          maxImages={maxImages}
          entityType={entityType}
          hideUploadButton={true}
          selectedImageCountFunc={(c) => {
            setCount(c);
            onCountChange?.(c);
          }}
        />
        {required && count < 1 && (
          <p className="mt-1 text-sm text-red-600">Legg til minst ett bilde</p>
        )}
      </div>
    );
  }
);

ImageUploadField.displayName = "ImageUploadField";
