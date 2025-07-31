"use client";

import Button from "@/components/atoms/Button";
import { StableWithBoxStats } from "@/types/stable";
import { formatPriceRange, formatLocationDisplay } from "@/utils/formatting";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

interface StableListingCardProps {
  stable: StableWithBoxStats;
}

export default function StableListingCard({ stable }: StableListingCardProps) {
  console.log(stable);
  return (
    <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 overflow-hidden hover:shadow-md transition-shadow">
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
            <div className="h-48 md:h-full w-full bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Ingen bilder</p>
              </div>
            </div>
          )}
          {
            /* Featured functionality removed - field not in schema */ false && (
              <div className="absolute top-2 left-2 bg-warning text-gray-0 px-2 py-1 rounded-full text-xs font-medium">
                Utvalgt
              </div>
            )
          }
          {stable.images && stable.images.length > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded-full text-xs font-medium text-white">
              {stable.images.length} bilder
            </div>
          )}
        </Link>
        {/* Content */}
        <div className="p-4 md:p-6 md:w-2/3">
          {/* Mobile: Header with price prominent */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
            <div className="flex-1">
              <Link href={`/stables/${stable.id}`}>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary transition-colors">
                  {stable.name}
                </h3>
              </Link>
              <div className="flex items-center text-gray-500 mb-2">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{formatLocationDisplay(stable)}</span>
              </div>
              <div className="flex items-center mb-3">
                <StarIcon className="h-4 w-4 text-warning mr-1" />
                <span className="text-sm text-gray-500">
                  {stable.rating} ({stable.reviewCount} anmeldelser)
                </span>
              </div>
            </div>
            {/* Mobile: Price below title, Desktop: Price on right */}
            <div className="md:text-right md:ml-4">
              {stable.availableBoxes > 0 && stable.priceRange ? (
                <>
                  <div className="text-base md:text-lg font-semibold text-gray-900">
                    {formatPriceRange(stable.priceRange.min, stable.priceRange.max)}
                  </div>
                  <div className="text-sm text-gray-500">per måned</div>
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">Ingen ledig plass</div>
              )}
            </div>
          </div>

          {/* Description - shorter on mobile */}
          <p className="text-gray-700 mb-4 text-sm md:text-base line-clamp-2">
            {stable.description}
          </p>

          {/* Amenities - show all */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {stable.amenities?.map((amenityRelation, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  {amenityRelation.amenity.name}
                </span>
              ))}
            </div>
          </div>

          {/* Contact - Mobile: Full width button */}
          <div className="pt-4 border-t border-gray-300 flex justify-end">
            <Link href={`/stables/${stable.id}`}>
              <Button size="md" variant="primary" className="w-full sm:w-auto min-h-[44px]">
                Se detaljer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
