"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { Modal } from "@/components/ui/modal";
import { CreateLogData, useCreateCustomLog } from "@/hooks/useHorseLogs";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  horseName: string;
  logType: "custom";
  customCategoryId: string;
}

export function LogModal({
  isOpen,
  onClose,
  horseId,
  horseName,
  logType,
  customCategoryId,
}: LogModalProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const createCustomLog = useCreateCustomLog();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Beskrivelse er påkrevd");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || images;

      const logData: CreateLogData = {
        description: description.trim(),
        images: imageUrls,
        imageDescriptions: [], // Not handling descriptions for horse logs yet
      };

      await createCustomLog.mutateAsync({ horseId, categoryId: customCategoryId, data: logData });
      toast.success("Logg lagt til");

      // Reset form
      setDescription("");
      setImages([]);
      onClose();
    } catch (error) {
      toast.error("Kunne ikke legge til logg");
      console.error(`Error creating ${logType} log:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image upload changes
  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Legg til logg"
      maxWidth="lg"
      dataCy="log-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Horse info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-body-sm text-gray-600">
            Logg for: <span className="font-medium">{horseName}</span>
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Beskrivelse *</Label>
          <Textarea
            id="description"
            placeholder="Beskriv det som ble utført..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            data-cy="description"
          />
        </div>

        {/* Images */}
        <div className="space-y-4">
          <Label>Bilder (valgfritt)</Label>
          <UnifiedImageUpload
            ref={imageUploadRef}
            images={images}
            onChange={handleImagesChange}
            maxImages={5}
            entityType="horse"
            title="Bilder av hesten"
            mode="inline"
            disabled={isSubmitting}
            hideUploadButton={true}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
            data-cy="save-horse-button"
          >
            {isSubmitting
              ? images.length > 0
                ? "Laster opp bilder..."
                : "Lagrer..."
              : "Opprett"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
