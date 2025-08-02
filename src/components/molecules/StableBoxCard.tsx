"use client";

import { BoxWithAmenities } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useState } from "react";

interface StableBoxCardProps {
  box: BoxWithAmenities;
  stableImages?: string[];
  stableImageDescriptions?: string[];
  onBoxClick: (boxId: string) => void;
  isOwner?: boolean;
  variant?: "available" | "rented";
}

export default function StableBoxCard({
  box,
  stableImages,
  stableImageDescriptions,
  onBoxClick,
  isOwner = false,
  variant = "available",
}: StableBoxCardProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const isAvailable = variant === "available";

  return (
    <div 
      className="flex gap-4 p-0 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors duration-200 p-3 -m-3"
      onClick={() => onBoxClick(box.id)}
    >
      {/* Image section - smaller on mobile */}
      <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
        {box.images && box.images.length > 0 ? (
          <Image
            src={box.images[0]}
            alt={box.imageDescriptions?.[0] || box.name}
            width={128}
            height={128}
            className="w-full h-full rounded-lg object-cover"
          />
        ) : stableImages && stableImages.length > 0 ? (
          <Image
            src={stableImages[0]}
            alt={stableImageDescriptions?.[0] || `Stall - ${box.name}`}
            width={128}
            height={128}
            className="w-full h-full rounded-lg object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <PhotoIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}

        {/* Availability indicator */}
        <div className="absolute -top-2 -right-2">
          {isAvailable ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
              <CheckCircleIcon className="h-3 w-3" />
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white shadow-sm">
              <ClockIcon className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 min-w-0">
        {/* Header with name and price */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-h3 text-gray-900 truncate">{box.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                {box.boxType === "BOKS" ? "Boks" : "Utegang"}
              </span>
              {!isAvailable && (box as BoxWithAmenities & { availabilityDate?: Date | string }).availabilityDate && (
                <span className="text-xs text-orange-600 font-medium">
                  Ledig fra: {new Date((box as BoxWithAmenities & { availabilityDate?: Date | string }).availabilityDate!).toLocaleDateString("nb-NO")}
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-3">
            <div className="text-lg font-bold text-primary">{formatPrice(box.price)}</div>
            <div className="text-xs text-gray-600">/måned</div>
          </div>
        </div>

        {/* Description */}
        {box.description && (
          <p className="mb-2 text-sm text-gray-700 line-clamp-2">{box.description}</p>
        )}

        {/* Box details and amenities in one row */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {box.size && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                📐 {box.size} m²
              </span>
            )}
            {box.maxHorseSize && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-xs font-medium text-green-700">
                🐎 {box.maxHorseSize}
              </span>
            )}
            {box.amenities && box.amenities.length > 0 && (
              <>
                {(showAllAmenities ? box.amenities : box.amenities.slice(0, 3)).map((amenityLink) => (
                  <span
                    key={amenityLink.amenity.id}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-700"
                  >
                    {amenityLink.amenity.name}
                  </span>
                ))}
                {box.amenities.length > 3 && (
                  <button
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-xs font-medium text-blue-700 cursor-pointer"
                    data-cy="toggle-amenities-button"
                  >
                    {showAllAmenities ? "Vis færre" : `+${box.amenities.length - 3} flere`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Special notes */}
        {box.specialNotes && (
          <div
            className={`mb-3 p-2 rounded-lg text-xs ${
              isAvailable
                ? "bg-blue-50 text-blue-800"
                : "bg-orange-50 text-orange-800"
            }`}
          >
            <span className="font-medium">Merknad:</span> {box.specialNotes}
          </div>
        )}

      </div>
    </div>
  );
}
