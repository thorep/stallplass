"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ImageGalleryProps {
  images: string[];
  imageDescriptions?: (string | null)[];
  alt: string; // Base alt text, will be suffixed with image number
}

export default function ImageGallery({ images, imageDescriptions, alt }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Handle escape key for lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showImageLightbox) {
        setShowImageLightbox(false);
      }
    };

    if (showImageLightbox) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showImageLightbox]);

  // Image gallery navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Lightbox navigation
  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setShowImageLightbox(true);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        <div
          className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 cursor-pointer w-full"
          onClick={() => openLightbox(currentImageIndex)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox(currentImageIndex);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Åpne bilde ${currentImageIndex + 1} i fullskjerm`}
        >
          <Image
            src={images[currentImageIndex]}
            alt={
              imageDescriptions?.[currentImageIndex] ||
              `${alt} - Bilde ${currentImageIndex + 1}`
            }
            width={800}
            height={500}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            quality={75}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                aria-label="Forrige bilde"
                type="button"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                aria-label="Neste bilde"
                type="button"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full ${
                      index === currentImageIndex
                        ? "bg-white"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Gå til bilde ${index + 1}`}
                    type="button"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Image Description */}
        {imageDescriptions?.[currentImageIndex] && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 italic">
              {imageDescriptions[currentImageIndex]}
            </p>
          </div>
        )}

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-6 gap-2">
            {images.slice(0, 6).map((image, index) => (
              <button
                key={`thumb-${index}`}
                onClick={() => setCurrentImageIndex(index)}
                onDoubleClick={() => openLightbox(index)}
                className={`aspect-square rounded-lg overflow-hidden transition-all bg-gray-100 ${
                  index === currentImageIndex ? "ring-2 ring-blue-500" : "hover:opacity-80"
                }`}
                title="Klikk for å velge, dobbeltklikk for fullskjerm"
                aria-label={`Velg bilde ${index + 1}`}
                type="button"
              >
                <Image
                  src={image}
                  alt={imageDescriptions?.[index] || `Miniature ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain"
                  sizes="200px"
                  quality={60}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {showImageLightbox && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          {/* Navigation arrows for lightbox */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevLightboxImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full z-10"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>

              <button
                onClick={nextLightboxImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full z-10"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Close button */}
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-10"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          {/* Main image */}
          <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
            <Image
              src={images[lightboxImageIndex]}
              alt={
                imageDescriptions?.[lightboxImageIndex] ||
                `${alt} - Bilde ${lightboxImageIndex + 1}`
              }
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              sizes="100vw"
              quality={90}
            />
          </div>

          {/* Image info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <div className="text-sm">
              {lightboxImageIndex + 1} av {images.length}
            </div>
            {imageDescriptions?.[lightboxImageIndex] && (
              <div className="text-xs mt-1 opacity-80">
                {imageDescriptions[lightboxImageIndex]}
              </div>
            )}
          </div>

          {/* Background click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowImageLightbox(false)}
          />
        </div>
      )}
    </>
  );
}