"use client";

import { StableWithBoxStats } from "@/types/stable";
import { formatLocationDisplay, formatPriceRange } from "@/utils/formatting";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useState } from "react";

interface StableListingCardProps {
  stable: StableWithBoxStats;
  highlightedAmenityIds?: string[];
  source?: "search" | "featured" | "direct";
}

export default function StableListingCard({
  stable,
  highlightedAmenityIds = [],
  source = "search",
}: StableListingCardProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const postHog = usePostHog();
  return (
    <Link
      href={`/sok/${stable.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-gray-300 cursor-pointer"
    >
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative md:w-1/3">
          <div className="relative h-48 md:h-full w-full overflow-hidden">
            {stable.images && stable.images.length > 0 ? (
              <Image
                src={stable.images[0]}
                alt={stable.imageDescriptions?.[0] || stable.name}
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

          {/* Availability status pill - top-right */}
          <div className="absolute top-3 right-3">
            {stable.availableBoxes > 0 ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-lg">
                {stable.availableBoxes} ledig{stable.availableBoxes !== 1 ? "e" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white shadow-lg">
                Fullt
              </span>
            )}
          </div>

          {stable.images && stable.images.length > 0 && (
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
              {stable.images.length} bilder
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-5 md:p-6 md:w-2/3">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex-1">
              {/* Title */}
              <div className="mb-2">
                <h3 className="text-xl font-bold text-gray-900">{stable.name}</h3>
              </div>
              {/* Location with icon */}
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                <span className="font-medium">{formatLocationDisplay(stable)}</span>
              </div>
              {/* Rating */}
              {stable.rating > 0 && (
                <div className="flex items-center mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-4 w-4 ${
                          star <= stable.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({stable.reviewCount || 0})</span>
                </div>
              )}
            </div>
            {/* Price - larger and more prominent */}
            <div className="md:text-right md:ml-4 mt-2 md:mt-0">
              {stable.availableBoxes > 0 && stable.priceRange ? (
                <>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPriceRange(
                      stable.priceRange.min,
                      stable.priceRange.max,
                      postHog.isFeatureEnabled("price-format")
                    )}
                  </div>
                  <div className="text-sm text-gray-500">pr måned</div>
                </>
              ) : (
                <div className="text-lg font-semibold text-gray-500 italic">
                  Ingen ledige plasser
                </div>
              )}
            </div>
          </div>
          {/* Description */}
          {stable.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed break-words overflow-hidden">
              {stable.description.length > 250
                ? `${stable.description.substring(0, 250)}...`
                : stable.description}
            </p>
          )}
          {/* Box Stats - icon-based display */}
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            {stable.boxes && (
              <div className="flex items-center bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-blue-600 font-semibold">🏠</span>
                <span className="text-blue-900 font-medium ml-2">
                  {stable.boxes.length} bokser totalt
                </span>
              </div>
            )}
          </div>
          {/* Amenities - modern pill design with expand/collapse */}
          {stable.amenities && stable.amenities.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {(showAllAmenities
                  ? stable.amenities
                  : (() => {
                      // Prioritize highlighted amenities to ensure they're visible
                      const highlighted = stable.amenities.filter((amenityRelation) =>
                        highlightedAmenityIds.includes(amenityRelation.amenity.id)
                      );
                      const nonHighlighted = stable.amenities.filter(
                        (amenityRelation) =>
                          !highlightedAmenityIds.includes(amenityRelation.amenity.id)
                      );
                      const remainingSlots = Math.max(0, 6 - highlighted.length);
                      return [...highlighted, ...nonHighlighted.slice(0, remainingSlots)];
                    })()
                ).map((amenityRelation, index) => {
                  const isHighlighted = highlightedAmenityIds.includes(amenityRelation.amenity.id);
                  return (
                    <span
                      key={amenityRelation.amenity.id || index}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                        isHighlighted
                          ? "bg-blue-500 text-white ring-2 ring-blue-300 ring-offset-1 shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {amenityRelation.amenity.name}
                    </span>
                  );
                })}
                {stable.amenities.length > 6 && (
                  <button
                    onClick={() => setShowAllAmenities(!showAllAmenities)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    {showAllAmenities ? <>Vis færre</> : <>+{stable.amenities.length - 6} mer</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
