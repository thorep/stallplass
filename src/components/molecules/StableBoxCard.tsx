"use client";

import Button from "@/components/atoms/Button";
import { BoxWithAmenities } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import { ChatBubbleLeftRightIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
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
      className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
        !isAvailable ? "border-orange-200 bg-orange-50" : "border-gray-200"
      }`}
    >
      <div className="relative">
        {/* Box image or stable image as fallback */}
        {box.images && box.images.length > 0 ? (
          <Image
            src={box.images[0]}
            alt={box.imageDescriptions?.[0] || box.name}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
          />
        ) : stableImages && stableImages.length > 0 ? (
          <Image
            src={stableImages[0]}
            alt={stableImageDescriptions?.[0] || `Stall - ${box.name}`}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-gray-100 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Ingen bilder</p>
            </div>
          </div>
        )}

        {/* Availability indicator */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Ledig
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              <ClockIcon className="h-3 w-3 mr-1" />
              Ledig snart
            </span>
          )}
        </div>

        {/* Sponsored badge if applicable */}
        {box.isSponsored && (
          <div className="absolute top-12 left-3 rounded-full bg-purple-500 px-2 py-1 text-xs font-medium text-white">
            <ExclamationCircleIcon className="h-3 w-3 mr-1 inline" />
            Sponset
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700">
          {box.boxType === "BOKS" ? "Boks" : "Utegang"}
        </div>
      </div>

      <div className="p-4">
        {/* Box name and availability date */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{box.name}</h3>
          {!isAvailable && (box as BoxWithAmenities & { availabilityDate?: Date | string }).availabilityDate && (
            <div className="text-orange-600 font-medium text-sm mt-1">
              Ledig fra: {new Date((box as BoxWithAmenities & { availabilityDate?: Date | string }).availabilityDate!).toLocaleDateString("nb-NO")}
            </div>
          )}
        </div>

        {/* Description */}
        {box.description && (
          <p className="mb-3 text-sm text-gray-700 line-clamp-2">{box.description}</p>
        )}

        {/* Box details as badges */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 text-xs">
            {box.size && (
              <div className="flex items-center bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-blue-600 font-semibold">📐</span>
                <span className="text-blue-900 font-medium ml-2">{box.size} m²</span>
              </div>
            )}
            {box.maxHorseSize && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {box.maxHorseSize}
              </span>
            )}
          </div>
        </div>

        {/* Box amenities */}
        {box.amenities && box.amenities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 text-xs">
              {(showAllAmenities ? box.amenities : box.amenities.slice(0, 3)).map((amenityLink) => (
                <span
                  key={amenityLink.amenity.id}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {amenityLink.amenity.name}
                </span>
              ))}
              {box.amenities.length > 3 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                  data-cy="toggle-amenities-button"
                >
                  {showAllAmenities ? "Vis færre" : `+${box.amenities.length - 3} flere`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Special notes */}
        {box.specialNotes && (
          <div
            className={`mb-3 p-2 rounded text-xs ${
              isAvailable
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-orange-50 text-orange-800 border border-orange-200"
            }`}
          >
            <span className="font-medium">Merknad:</span> {box.specialNotes}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-lg font-semibold text-gray-900">{formatPrice(box.price)}</span>
            <span className="text-sm text-gray-600">/måned</span>
          </div>
        </div>

        {/* View details button */}
        {!isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onBoxClick(box.id)}
            className={`w-full ${!isAvailable ? "bg-orange-600 hover:bg-orange-700" : ""}`}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
Se detaljer
          </Button>
        )}
      </div>
    </div>
  );
}
