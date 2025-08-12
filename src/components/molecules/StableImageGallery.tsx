"use client";

import { StableWithBoxStats } from "@/types/stable";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UnifiedImageUpload } from "@/components/ui/UnifiedImageUpload";
import { useUpdateStable } from '@/hooks/useStableMutations';

interface StableImageGalleryProps {
  stable: StableWithBoxStats;
  onImagesUpdated?: (newImages: string[]) => void;
}

export default function StableImageGallery({ stable, onImagesUpdated }: StableImageGalleryProps) {
  const router = useRouter();
  const updateStable = useUpdateStable();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showInlineUpload, setShowInlineUpload] = useState(false);
  const [optimisticImages, setOptimisticImages] = useState<string[]>(stable.images || []);

  // Handle swipe gestures for mobile
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex !== null) {
      // Swipe left = next image
      setSelectedImageIndex((prev) =>
        prev !== null && prev < (currentImages?.length || 0) - 1 ? prev + 1 : 0
      );
    }
    if (isRightSwipe && selectedImageIndex !== null) {
      // Swipe right = previous image
      setSelectedImageIndex((prev) =>
        prev !== null && prev > 0 ? prev - 1 : (currentImages?.length || 0) - 1
      );
    }
  };

  const handleImagesChange = async (newImages: string[]) => {
    // Update optimistic state immediately
    setOptimisticImages(newImages);
    
    // Save to database
    try {
      console.log(`[StableImageGallery] Saving ${newImages.length} images to stable ${stable.id}`);
      await updateStable.mutateAsync({
        id: stable.id,
        data: {
          images: newImages,
          // Only update images, keep everything else as is
        }
      });
      console.log(`[StableImageGallery] Successfully saved images to database`);
      onImagesUpdated?.(newImages);
    } catch (error) {
      console.error('[StableImageGallery] Failed to save images to database:', error);
      // Revert optimistic update on error
      setOptimisticImages(stable.images || []);
    }
  };

  // Add keyboard support for closing modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImageIndex !== null) {
        setSelectedImageIndex(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImageIndex]);

  const currentImages = optimisticImages;

  return (
    <>
      <div className="px-4 py-6 sm:px-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-900">Bilder</h4>
          <div className="flex items-center gap-3">
            {currentImages.length < 10 && (
              <button
                onClick={() => setShowInlineUpload(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                data-cy="add-images-button"
              >
                <PlusIcon className="h-4 w-4" />
                Legg til bilder
              </button>
            )}
            <button
              onClick={() => router.push(`/dashboard/stables/${stable.id}/edit`)}
              className="text-sm text-slate-600 hover:text-slate-700 font-medium"
            >
              Rediger alle
            </button>
          </div>
        </div>

        {currentImages && currentImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {currentImages.slice(0, 4).map((image: string, index: number) => (
              <button
                key={index}
                className="relative aspect-square group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg overflow-hidden"
                onClick={() =>
                  setSelectedImageIndex(index === 3 && (currentImages?.length || 0) > 4 ? 0 : index)
                }
              >
                <Image
                  src={image}
                  alt={`Bilde ${index + 1} av ${stable.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 200px, 250px"
                  quality={75}
                />
                {/* Mobile: Always show description if exists */}
                {stable.imageDescriptions && stable.imageDescriptions[index] && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1.5 sm:p-2 text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {stable.imageDescriptions[index]}
                  </div>
                )}
                {index === 3 && (currentImages?.length || 0) > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <span className="text-white text-lg sm:text-2xl font-bold">
                      +{(currentImages?.length || 0) - 4}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <PhotoIcon className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-3">Ingen bilder lastet opp ennå</p>
            <button
              onClick={() => setShowInlineUpload(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Legg til bilder
            </button>
          </div>
        )}
      </div>

      {/* Image Viewer Modal - Mobile First */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={(e) => {
            // Close when clicking on the backdrop (not the image itself)
            if (e.target === e.currentTarget) {
              setSelectedImageIndex(null);
            }
          }}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {selectedImageIndex + 1} / {currentImages?.length || 0}
              </span>
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="p-3 text-white bg-black/30 hover:bg-white/20 rounded-full transition-colors border border-white/20"
                aria-label="Lukk"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Image Container with Touch Support */}
          <div
            className="flex-1 flex items-center justify-center p-4 cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setSelectedImageIndex(null)}
          >
            <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
              <Image
                src={currentImages?.[selectedImageIndex] || ""}
                alt={`Bilde ${selectedImageIndex + 1} av ${stable.name}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={85}
                priority
              />
              {/* Subtle hint text */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-70">
                Trykk for å lukke
              </div>
            </div>
          </div>

          {/* Description and Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {stable.imageDescriptions && stable.imageDescriptions[selectedImageIndex] && (
              <p className="text-white text-sm mb-4 text-center">
                {stable.imageDescriptions[selectedImageIndex]}
              </p>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : (currentImages?.length || 0) - 1
                  )
                }
                className="p-3 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Forrige bilde"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-1.5">
                {currentImages?.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    aria-label={`Gå til bilde ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev !== null && prev < (currentImages?.length || 0) - 1 ? prev + 1 : 0
                  )
                }
                className="p-3 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Neste bilde"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Image Upload Modal */}
      {showInlineUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Administrer stallbilder</h3>
                <button
                  onClick={() => setShowInlineUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <UnifiedImageUpload
                images={currentImages}
                onChange={handleImagesChange}
                maxImages={10}
                entityType="stable"
                title="Stallbilder"
                mode="inline"
                onUploadComplete={() => {
                  // The handleImagesChange will have been called with the new images
                  // and will save them to the database, then close the modal
                  setShowInlineUpload(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
