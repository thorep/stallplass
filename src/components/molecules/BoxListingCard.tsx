"use client";

import Button from "@/components/atoms/Button";
import { useBoxAvailability } from "@/hooks/useBoxQueries";
import { BoxWithStablePreview } from "@/types/stable";
import { formatLocationDisplay, formatPrice, formatBoxSize } from "@/utils/formatting";
import { ClockIcon, MapPinIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface BoxListingCardProps {
  box: BoxWithStablePreview;
}

export default function BoxListingCard({ box }: BoxListingCardProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  // Get real-time availability updates for this specific box
  const { box: realTimeBox } = useBoxAvailability(box.id); //NOT NEEDED

  // Use real-time data if available, otherwise fall back to initial data
  const currentBox = realTimeBox || box;
  const isAvailable = currentBox.isAvailable;
  const isSponsored = currentBox.isSponsored;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 ${
        !isAvailable ? "opacity-75" : ""
      }`}
    >
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/bokser/${currentBox.id}`} className="relative md:w-1/3 cursor-pointer">
          <div className="relative h-48 md:h-full w-full overflow-hidden">
            {currentBox.images && currentBox.images.length > 0 ? (
              <Image
                src={currentBox.images[0]}
                alt={currentBox.imageDescriptions?.[0] || currentBox.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Ingen bilder</p>
                </div>
              </div>
            )}
          </div>

          {/* Status pill - positioned at top-right */}
          <div className="absolute top-3 right-3">
            {isAvailable ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-lg">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Ledig
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white shadow-lg">
                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                Opptatt
              </span>
            )}
          </div>

          {currentBox.images && currentBox.images.length > 0 && (
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
              {currentBox.images.length} bilder
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-5 md:p-6 md:w-2/3">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex-1">
                {/* Title and Type */}
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/bokser/${currentBox.id}`}>
                    <h3 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                      {currentBox.name}
                    </h3>
                  </Link>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {currentBox.boxType === "BOKS" ? "Boks" : "Utegang"}
                  </span>
                  {isSponsored && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-purple-500 text-white">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Sponset
                    </span>
                  )}
                </div>
                {/* Stable name - smaller and gray */}
                <div className="mb-2">
                  <Link
                    href={`/staller/${box.stable?.id || ""}`}
                    className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                  >
                    {box.stable?.name || "Ukjent stall"}
                  </Link>
                </div>
                {/* Location with icon */}
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{formatLocationDisplay(box)}</span>
                </div>
                {/* Additional location info if available */}
                {box.stable?.location && box.stable.location !== formatLocationDisplay(box) && (
                  <div className="text-xs text-gray-500 ml-5 mb-3">{box.stable.location}</div>
                )}
                {/* Rating display - commented out for now, may use later
                {box.stable?.rating && box.stable.rating > 0 && (
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (box.stable?.rating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({box.stable?.reviewCount || 0})
                    </span>
                  </div>
                )}
                */}
              </div>

              {/* Price - larger and more prominent */}
              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPrice(currentBox.price)}
                </div>
                <div className="text-sm text-gray-500">pr måned</div>
              </div>
            </div>

            {/* Description */}
            {currentBox.description && (
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{currentBox.description}</p>
            )}
            {/* Key Details - icon-based display */}
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              {currentBox.size && (
                <div className="flex items-center bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-blue-600 font-semibold">📐</span>
                  <span className="text-blue-900 font-medium ml-2">{formatBoxSize(currentBox.size)}</span>
                </div>
              )}

              {currentBox.maxHorseSize && (
                <div className="flex items-center bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-green-600 font-semibold">🐎</span>
                  <span className="text-green-900 font-medium ml-2">{currentBox.maxHorseSize}</span>
                </div>
              )}
            </div>
            {/* Amenities - modern pill design with expand/collapse */}
            {box.amenities && box.amenities.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {(showAllAmenities ? box.amenities : box.amenities.slice(0, 6)).map(
                    (amenityRelation, index) => (
                      <span
                        key={amenityRelation.amenity.id || index}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {amenityRelation.amenity.name}
                      </span>
                    )
                  )}
                  {box.amenities.length > 6 && (
                    <button
                      onClick={() => setShowAllAmenities(!showAllAmenities)}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      {showAllAmenities ? <>Vis færre</> : <>+{box.amenities.length - 6} mer</>}
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Special Notes */}
            {currentBox.specialNotes && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                <span className="font-medium text-blue-900">Merknad:</span>
                <span className="text-blue-800 ml-1">{currentBox.specialNotes}</span>
              </div>
            )}
            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Link href={`/bokser/${currentBox.id}`}>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                  disabled={!isAvailable}
                >
                  {isAvailable ? "Se detaljer" : "Ikke tilgjengelig"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
