"use client";

import Button from "@/components/atoms/Button";
import { StableWithBoxStats } from "@/types/stable";
import { formatLocationDisplay, formatPriceRange } from "@/utils/formatting";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface StableListingCardProps {
  stable: StableWithBoxStats;
}

export default function StableListingCard({ stable }: StableListingCardProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/stables/${stable.id}`} className="relative md:w-1/3 cursor-pointer">
          {stable.images && stable.images.length > 0 ? (
            <Image
              src={stable.images[0]}
              alt={stable.imageDescriptions?.[0] || stable.name}
              width={400}
              height={192}
              className="h-48 md:h-full w-full object-cover"
            />
          ) : (
            <div className="h-48 md:h-full w-full bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Ingen bilder</p>
              </div>
            </div>
          )}

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
        </Link>
        {/* Content */}
        <div className="p-5 md:p-6 md:w-2/3">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex-1">
              {/* Title */}
              <div className="mb-2">
                <Link href={`/stables/${stable.id}`}>
                  <h3 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                    {stable.name}
                  </h3>
                </Link>
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
                    {formatPriceRange(stable.priceRange.min, stable.priceRange.max)}
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
            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
              {stable.description}
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
                {(showAllAmenities ? stable.amenities : stable.amenities.slice(0, 6)).map(
                  (amenityRelation, index) => (
                    <span
                      key={amenityRelation.amenity.id || index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {amenityRelation.amenity.name}
                    </span>
                  )
                )}
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
          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Link href={`/stables/${stable.id}`}>
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8"
              >
                Se stall og bokser
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
