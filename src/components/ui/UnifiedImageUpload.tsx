"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useCentralizedUpload, type EntityType } from "@/hooks/useCentralizedUpload";
import { StorageService } from "@/services/storage-service";
import { IMAGE_CONSTRAINTS } from "@/utils/constants";
import { compressImage, isValidImageType } from "@/utils/image-compression";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  Bars3Icon,
  CheckIcon,
  PencilIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button as MuiButton, TextField } from "@mui/material";
import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface ImageData {
  url: string; // Either blob URL (staging) or real URL (uploaded)
  description?: string;
  id: string;
  isUploaded: boolean; // Track if this is uploaded or just staged
  file?: File; // Only present for staged images
}

interface UnifiedImageUploadProps {
  images: string[]; // Current uploaded image URLs
  onChange: (images: string[]) => void; // Callback with uploaded URLs
  onDescriptionsChange?: (descriptions: Record<string, string>) => void;
  initialDescriptions?: Record<string, string>;
  maxImages?: number;
  entityType: EntityType;
  title?: string;
  mode?: "inline" | "modal"; // Inline shows directly, modal shows upload button + modal
  className?: string;
  disabled?: boolean;
  onUploadComplete?: () => void; // Callback when upload is complete (for external modal control)
  hideUploadButton?: boolean; // Hide the upload button in form contexts
  selectedImageCountFunc?: (count: number) => void;
}

export interface UnifiedImageUploadRef {
  uploadPendingImages: () => Promise<string[]>; // Returns uploaded image URLs
}

const UnifiedImageUpload = forwardRef<UnifiedImageUploadRef, UnifiedImageUploadProps>(
  (
    {
      images,
      onChange,
      onDescriptionsChange,
      initialDescriptions = {},
      maxImages = 10,
      entityType,
      title = "Bildebehandling",
      mode = "inline",
      className = "",
      disabled = false,
      onUploadComplete,
      hideUploadButton = false,
      selectedImageCountFunc,
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadFiles = useCentralizedUpload();

    // State
    const [imageData, setImageData] = useState<ImageData[]>(() =>
      images.map((url, index) => ({
        url,
        description: initialDescriptions[url] || "",
        id: `uploaded-${index}-${Date.now()}`,
        isUploaded: true,
      }))
    );
    const [showModal, setShowModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
      if (selectedImageCountFunc) {
        selectedImageCountFunc(imageData.length);
      }
    }, [imageData, selectedImageCountFunc]);

    // Expose methods to parent components
    useImperativeHandle(
      ref,
      () => ({
        uploadPendingImages: async (): Promise<string[]> => {
          const stagedImages = imageData.filter((img) => !img.isUploaded && img.file);
          if (stagedImages.length === 0) {
            // No pending images, return current uploaded URLs
            return imageData.filter((img) => img.isUploaded).map((img) => img.url);
          }

          // Upload staged images using the internal logic
          setIsUploading(true);
          setError(null);

          try {
            console.log(
              `[UnifiedImageUpload] Form uploading ${stagedImages.length} images for ${entityType}`
            );

            // Compress and upload
            const filesToUpload: File[] = [];

            for (const stagedImage of stagedImages) {
              if (!stagedImage.file) continue;

              try {
                // Compress image
                const compressionResult = await compressImage(stagedImage.file, {
                  maxSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
                  maxWidthOrHeight: 1920,
                });

                filesToUpload.push(compressionResult.file);
              } catch {
                console.warn(`Failed to compress ${stagedImage.file.name}, using original`);
                filesToUpload.push(stagedImage.file);
              }
            }

            // Upload files
            const uploadResults = await uploadFiles.mutateAsync({
              files: filesToUpload,
              entityType,
            });

            const uploadedUrls = uploadResults.map((result) => result.url);

            // Update image data - replace staged with uploaded
            const updatedImageData = imageData.map((img) => {
              if (!img.isUploaded && img.file) {
                const uploadIndex = stagedImages.findIndex((staged) => staged.id === img.id);
                if (uploadIndex !== -1 && uploadedUrls[uploadIndex]) {
                  // Clean up blob URL
                  URL.revokeObjectURL(img.url);
                  return {
                    ...img,
                    url: uploadedUrls[uploadIndex],
                    isUploaded: true,
                    file: undefined,
                  };
                }
              }
              return img;
            });

            setImageData(updatedImageData);

            // Update parent with uploaded URLs
            const allUploadedUrls = updatedImageData
              .filter((img) => img.isUploaded)
              .map((img) => img.url);
            onChange(allUploadedUrls);

            // Update descriptions
            if (onDescriptionsChange) {
              const descriptions: Record<string, string> = {};
              updatedImageData.forEach((img) => {
                if (img.description && img.isUploaded) {
                  descriptions[img.url] = img.description;
                }
              });
              onDescriptionsChange(descriptions);
            }

            console.log(
              `[UnifiedImageUpload] Form successfully uploaded ${uploadedUrls.length} images`
            );

            return allUploadedUrls;
          } catch (uploadError) {
            console.error("[UnifiedImageUpload] Form upload failed:", uploadError);
            setError(
              `Feil ved opplasting: ${
                uploadError instanceof Error ? uploadError.message : "Ukjent feil"
              }`
            );
            throw uploadError;
          } finally {
            setIsUploading(false);
          }
        },
      }),
      [imageData, entityType, uploadFiles, onChange, onDescriptionsChange]
    );

    // Handle file selection
    const handleFileSelect = async (files: FileList) => {
      if (disabled) return;

      const newFiles = Array.from(files);
      const remainingSlots = maxImages - imageData.filter((img) => img.isUploaded).length;

      if (newFiles.length > remainingSlots) {
        setError(`Du kan kun laste opp ${remainingSlots} flere bilder`);
        return;
      }

      setError(null);

      // Stage files for preview
      const stagedImages: ImageData[] = [];

      for (const file of newFiles) {
        if (!isValidImageType(file)) {
          setError(`${file.name} har ugyldig filtype. Kun JPEG, PNG og WebP er tillatt.`);
          continue;
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        stagedImages.push({
          url: preview,
          description: "",
          id: `staged-${Date.now()}-${Math.random()}`,
          isUploaded: false,
          file,
        });
      }

      setImageData((prev) => [...prev, ...stagedImages]);
    };

    // Upload staged images
    const uploadStagedImages = async (closeModalAfter = false) => {
      const stagedImages = imageData.filter((img) => !img.isUploaded && img.file);
      if (stagedImages.length === 0) {
        // If no staged images but closeModalAfter is true, just close
        if (closeModalAfter) {
          setShowModal(false);
        }
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        console.log(
          `[UnifiedImageUpload] Uploading ${stagedImages.length} images for ${entityType}`
        );

        // Compress and upload
        const filesToUpload: File[] = [];

        for (const stagedImage of stagedImages) {
          if (!stagedImage.file) continue;

          try {
            // Compress image
            const compressionResult = await compressImage(stagedImage.file, {
              maxSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
              maxWidthOrHeight: 1920,
            });

            filesToUpload.push(compressionResult.file);
          } catch {
            console.warn(`Failed to compress ${stagedImage.file.name}, using original`);
            filesToUpload.push(stagedImage.file);
          }
        }

        // Upload files
        const uploadResults = await uploadFiles.mutateAsync({
          files: filesToUpload,
          entityType,
        });

        const uploadedUrls = uploadResults.map((result) => result.url);

        // Update image data - replace staged with uploaded
        const updatedImageData = imageData.map((img) => {
          if (!img.isUploaded && img.file) {
            const uploadIndex = stagedImages.findIndex((staged) => staged.id === img.id);
            if (uploadIndex !== -1 && uploadedUrls[uploadIndex]) {
              // Clean up blob URL
              URL.revokeObjectURL(img.url);
              return {
                ...img,
                url: uploadedUrls[uploadIndex],
                isUploaded: true,
                file: undefined,
              };
            }
          }
          return img;
        });

        setImageData(updatedImageData);

        // Update parent with uploaded URLs
        const allUploadedUrls = updatedImageData
          .filter((img) => img.isUploaded)
          .map((img) => img.url);
        onChange(allUploadedUrls);

        // Update descriptions
        if (onDescriptionsChange) {
          const descriptions: Record<string, string> = {};
          updatedImageData.forEach((img) => {
            if (img.description && img.isUploaded) {
              descriptions[img.url] = img.description;
            }
          });
          onDescriptionsChange(descriptions);
        }

        console.log(`[UnifiedImageUpload] Successfully uploaded ${uploadedUrls.length} images`);

        // Call onUploadComplete callback if provided
        if (onUploadComplete) {
          onUploadComplete();
        }

        // Close modal if requested (after successful upload)
        if (closeModalAfter) {
          setShowModal(false);
        }
      } catch (uploadError) {
        console.error("[UnifiedImageUpload] Upload failed:", uploadError);
        setError(
          `Feil ved opplasting: ${
            uploadError instanceof Error ? uploadError.message : "Ukjent feil"
          }`
        );
      } finally {
        setIsUploading(false);
      }
    };

    // Handle drag and drop
    const handleDragEnd = (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(imageData);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setImageData(items);

      // Update parent with new order (only uploaded images)
      const uploadedUrls = items.filter((img) => img.isUploaded).map((img) => img.url);
      onChange(uploadedUrls);
    };

    // Delete image
    const deleteImage = async (index: number) => {
      const imageToDelete = imageData[index];

      // If it's an uploaded image, delete from Supabase
      if (imageToDelete.isUploaded) {
        try {
          console.log(`[UnifiedImageUpload] Deleting image from Supabase: ${imageToDelete.url}`);
          await StorageService.deleteImageByUrl(imageToDelete.url);
          console.log(`[UnifiedImageUpload] Successfully deleted image from Supabase`);
        } catch (error) {
          console.error("[UnifiedImageUpload] Failed to delete image from Supabase:", error);
          // Still remove from UI even if delete fails (best effort)
        }
      } else {
        // Clean up blob URL if it's a staged image
        URL.revokeObjectURL(imageToDelete.url);
      }

      const newImageData = imageData.filter((_, i) => i !== index);
      setImageData(newImageData);

      // Update parent (only uploaded images)
      const uploadedUrls = newImageData.filter((img) => img.isUploaded).map((img) => img.url);
      onChange(uploadedUrls);
    };

    // Description editing
    const startEditingDescription = (id: string, currentDescription: string) => {
      setEditingId(id);
      setEditDescription(currentDescription);
    };

    const saveDescription = (id: string) => {
      const newImageData = imageData.map((img) =>
        img.id === id ? { ...img, description: editDescription } : img
      );
      setImageData(newImageData);

      if (onDescriptionsChange) {
        const descriptions: Record<string, string> = {};
        newImageData.forEach((img) => {
          if (img.description && img.isUploaded) {
            descriptions[img.url] = img.description;
          }
        });
        onDescriptionsChange(descriptions);
      }

      setEditingId(null);
      setEditDescription("");
    };

    // File input component
    const FileInput = () => (
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <div className="space-y-3">
          <div className="text-slate-400">
            <svg
              className="h-10 w-10 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-body mb-2">Dra og slipp bilder her, eller klikk for å velge</p>
            <p className="text-body-sm text-slate-500 mb-4">
              Maks {maxImages - imageData.filter((img) => img.isUploaded).length} flere bilder
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              disabled={disabled}
              data-cy="image-file-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Velg bilder
            </Button>
          </div>
        </div>
      </div>
    );

    // Image gallery component
    const ImageGallery = () => {
      if (imageData.length === 0) {
        return (
          <div className="text-center py-8 text-slate-500">
            <PhotoIcon className="h-16 w-16 mx-auto mb-2" />
            <p>Ingen bilder ennå</p>
          </div>
        );
      }

      return (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {imageData.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${
                          snapshot.isDragging ? "shadow-lg" : ""
                        } ${!image.isUploaded ? "border-blue-200 bg-blue-50" : ""}`}
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative w-full sm:w-48 h-48 sm:h-32">
                            <Image
                              src={image.url}
                              alt={image.description || `Bilde ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 192px"
                            />
                            {!image.isUploaded && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                Ikke lastet opp
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                                >
                                  <Bars3Icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  Bilde {index + 1}
                                </span>
                              </div>
                            </div>

                            {/* Description editing */}
                            <div className="space-y-2">
                              {editingId === image.id ? (
                                <div className="space-y-2">
                                  <TextField
                                    key={`description-${image.id}`}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Beskrivelse av bildet..."
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    autoFocus
                                    inputProps={{ 'data-cy': 'image-description-input' }}
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <MuiButton
                                      type="button"
                                      variant="contained"
                                      size="medium"
                                      color="primary"
                                      startIcon={<CheckIcon className="h-4 w-4" />}
                                      sx={{
                                        height: "40px",
                                        textTransform: "none",
                                        minWidth: "100px",
                                        backgroundColor: "#4f46e5",
                                        "&:hover": {
                                          backgroundColor: "#4338ca",
                                        },
                                      }}
                                      onClick={() => saveDescription(image.id)}
                                      data-cy="image-description-save-button"
                                    >
                                      Lagre
                                    </MuiButton>
                                    <MuiButton
                                      type="button"
                                      variant="outlined"
                                      size="medium"
                                      color="primary"
                                      startIcon={<XMarkIcon className="h-4 w-4" />}
                                      sx={{
                                        height: "40px",
                                        textTransform: "none",
                                        minWidth: "100px",
                                      }}
                                      onClick={() => setEditingId(null)}
                                    >
                                      Avbryt
                                    </MuiButton>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <div
                                    className="flex-1 cursor-pointer py-2 px-1 -mx-1 rounded hover:bg-slate-50 transition-colors"
                                    onClick={() =>
                                      startEditingDescription(image.id, image.description || "")
                                    }
                                    data-cy="image-description-open"
                                  >
                                    <p className="text-sm text-slate-600" data-cy="image-description-text">
                                      {image.description || (
                                        <span className="italic text-slate-400">
                                          Klikk for å legge til beskrivelse
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      startEditingDescription(image.id, image.description || "")
                                    }
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteImage(index)}
                              >
                                <TrashIcon className="h-3 w-3" />
                                Slett
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      );
    };

    // Main content
    const content = (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">{title}</h3>
          <div className="text-sm text-slate-500">
            {imageData.filter((img) => img.isUploaded).length} av {maxImages}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* File input - only show if we have space */}
        {imageData.filter((img) => img.isUploaded).length < maxImages && <FileInput />}

        {/* Image gallery */}
        <ImageGallery />

        {/* Upload staged images button - hidden in form contexts */}
        {!hideUploadButton && imageData.some((img) => !img.isUploaded) && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <MuiButton
              type="button"
              variant="outlined"
              size="large"
              className="w-full sm:w-auto"
              sx={{
                height: { xs: "48px", sm: "40px" },
                textTransform: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 500,
              }}
              onClick={() => {
                // Remove staged images
                const stagedImages = imageData.filter((img) => !img.isUploaded);
                stagedImages.forEach((img) => URL.revokeObjectURL(img.url));
                setImageData((prev) => prev.filter((img) => img.isUploaded));
              }}
            >
              Avbryt
            </MuiButton>
            <MuiButton
              type="button"
              variant="contained"
              size="large"
              className="w-full sm:w-auto"
              sx={{
                height: { xs: "48px", sm: "40px" },
                textTransform: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 500,
                backgroundColor: "#4f46e5",
                "&:hover": {
                  backgroundColor: "#4338ca",
                },
              }}
              onClick={() => uploadStagedImages(true)}
              disabled={isUploading}
            >
              {isUploading
                ? "Laster opp..."
                : `Last opp ${imageData.filter((img) => !img.isUploaded).length} bilder`}
            </MuiButton>
          </div>
        )}
      </div>
    );

    // Return based on mode
    if (mode === "modal") {
      return (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowModal(true)}
            disabled={disabled}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Legg til bilder
          </Button>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={title} maxWidth="xl">
            {content}
          </Modal>
        </>
      );
    }

    return content;
  }
);

// Set display name for debugging
UnifiedImageUpload.displayName = "UnifiedImageUpload";

// Export as default and named
export default UnifiedImageUpload;
export { UnifiedImageUpload };
