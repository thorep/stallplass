"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UnifiedImageUpload, UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { Modal } from "@/components/ui/modal";
import { createCustomLogAction } from "@/app/actions/logs";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  horseId: string;
  horseName: string;
  logType: "custom";
  customCategoryId: string;
  onLogCreated?: () => void;
}

export function LogModal({
  isOpen,
  onClose,
  horseId,
  horseName,
  logType,
  customCategoryId,
  onLogCreated,
}: LogModalProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Beskrivelse er påkrevd");
      return;
    }

    if (!customCategoryId) {
      toast.error("Ingen kategori valgt");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload any pending images first
      const imageUrls = (await imageUploadRef.current?.uploadPendingImages()) || images;

      const formData = new FormData();
      formData.append('description', description.trim());
      if (imageUrls.length > 0) {
        imageUrls.forEach(url => formData.append('images', url));
        // Add image descriptions in the same order as images
        imageUrls.forEach(url => {
          const desc = imageDescriptions[url] || '';
          formData.append('imageDescriptions', desc);
        });
      }

      startTransition(async () => {
        try {
          await createCustomLogAction(horseId, customCategoryId || '', formData);
          toast.success("Logg lagt til");

          // Reset form
          setDescription("");
          setImages([]);
          setImageDescriptions({});
          onLogCreated?.();
          onClose();
        } catch (error) {
          toast.error("Kunne ikke legge til logg");
          console.error(`Error creating ${logType} log:`, error);
        }
      });
    } catch (error) {
      toast.error("Kunne ikke laste opp bilder");
      console.error("Error uploading images:", error);
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
             onDescriptionsChange={setImageDescriptions}
             initialDescriptions={imageDescriptions}
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
