"use client";

import { BoxWithStablePreview } from "@/types/stable";
import {
  formatBoxSize,
  formatHorseSize,
  formatLocationDisplay,
  formatPrice,
} from "@/utils/formatting";
import { ClockIcon, MapPinIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Box, Stack } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import React from "react";

interface BoxListingCardProps {
  box: BoxWithStablePreview;
  highlightedBoxAmenityIds?: string[];
  highlightedStableAmenityIds?: string[];
}

function BoxListingCard({
  box,
  highlightedBoxAmenityIds = [],
  highlightedStableAmenityIds = [],
}: BoxListingCardProps) {
  const postHog = usePostHog();
  const showAllAmenities = false;
  const showAllStableAmenities = false;

  const availableQuantity =
    ("availableQuantity" in box ? (box.availableQuantity as number) : 0) ?? 0;
  const isAvailable = availableQuantity > 0;
  const isSponsored = box.isSponsored;

  return (
    <Link
      href={`/bokser/${box.id}`}
      className={`block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-gray-300 cursor-pointer ${
        !isAvailable ? "opacity-75" : ""
      }`}
    >
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative md:w-1/3">
          <div className="relative h-48 md:h-full w-full overflow-hidden">
            {box.images && box.images.length > 0 ? (
              <Image
                src={box.images[0]}
                alt={box.imageDescriptions?.[0] || box.name}
                width={800}
                height={400}
                className="h-48 md:h-full w-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
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
                {availableQuantity} ledig{availableQuantity === 1 ? "" : "e"}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white shadow-lg">
                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                Opptatt
              </span>
            )}
          </div>

          {box.images && box.images.length > 0 && (
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
              {box.images.length} bilder
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 md:w-2/3">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1">
              <div className="flex-1">
                {/* Title and Type */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{box.name}</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {box.boxType === "BOKS" ? "Boks" : "Utegang"}
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
                  <span className="text-sm font-medium text-gray-600">
                    {box.stable?.name || "Ukjent stall"}
                  </span>
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
              </div>
              {/* Price - larger and more prominent */}
              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                <div className="text-3xl font-bold text-gray-900">{formatPrice(box.price)}</div>
                <div className="text-sm text-gray-500">pr måned</div>
              </div>
            </div>

            <div className="flex items-start space-x-4 text-sm text-slate-600 mb-4">
              {box.size && (
                <Stack>
                  <span className="flex items-center">
                    <span className="font-medium">Størrelse:</span>
                    <span className="ml-1 font-normal">{formatBoxSize(box.size)}</span>
                  </span>
                  {box.sizeText && (
                    <Box>
                      <span className="font-medium">Notat:</span>
                      <span className="ml-1 font-normal">{box.sizeText}</span>
                    </Box>
                  )}
                </Stack>
              )}
              {box.maxHorseSize && (
                <span className="flex items-center flex-wrap">
                  <span className="font-medium">Hestestørrelse:</span>
                  <span className="ml-1 font-normal">{formatHorseSize(box.maxHorseSize)}</span>
                </span>
              )}
            </div>
            {/* Description */}
            {box.description && (
              <p className="text-gray-600 text-sm mb-4 leading-relaxed break-words overflow-hidden">
                {box.description.length > 250
                  ? `${box.description.substring(0, 250)}...`
                  : box.description}
              </p>
            )}
            {/* Key Details - icon-based display */}
            {/* Stable Amenities - Show when stable has amenities */}

            {/* Box Amenities - modern pill design with expand/collapse */}
            {box.amenities && box.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Boks-fasiliteter
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(showAllAmenities
                    ? box.amenities
                    : (() => {
                        // Prioritize highlighted amenities to ensure they're visible
                        const highlighted = box.amenities.filter((amenityRelation) =>
                          highlightedBoxAmenityIds.includes(amenityRelation.amenity.id)
                        );
                        const nonHighlighted = box.amenities.filter(
                          (amenityRelation) =>
                            !highlightedBoxAmenityIds.includes(amenityRelation.amenity.id)
                        );
                        const remainingSlots = Math.max(0, 6 - highlighted.length);
                        return [...highlighted, ...nonHighlighted.slice(0, remainingSlots)];
                      })()
                  ).map((amenityRelation, index) => {
                    const isHighlighted = highlightedBoxAmenityIds.includes(
                      amenityRelation.amenity.id
                    );
                    return (
                      <span
                        key={amenityRelation.amenity.id || index}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                          isHighlighted
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-300 ring-offset-1 shadow-md scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {amenityRelation.amenity.name}
                      </span>
                    );
                  })}
                  {box.amenities.length > 6 && !showAllAmenities && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                      +{box.amenities.length - 6} mer
                    </span>
                  )}
                </div>
              </div>
            )}
            {box.stable?.amenities && box.stable.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Stall-fasiliteter
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(showAllStableAmenities
                    ? box.stable.amenities
                    : (() => {
                        // Prioritize highlighted amenities to ensure they're visible
                        const highlighted = box.stable.amenities.filter((amenityRelation) =>
                          highlightedStableAmenityIds.includes(amenityRelation.amenity.id)
                        );
                        const nonHighlighted = box.stable.amenities.filter(
                          (amenityRelation) =>
                            !highlightedStableAmenityIds.includes(amenityRelation.amenity.id)
                        );
                        const remainingSlots = Math.max(0, 6 - highlighted.length);
                        return [...highlighted, ...nonHighlighted.slice(0, remainingSlots)];
                      })()
                  ).map((amenityRelation, index) => {
                    const isHighlighted = highlightedStableAmenityIds.includes(
                      amenityRelation.amenity.id
                    );
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
                  {box.stable.amenities.length > 6 && !showAllStableAmenities && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                      +{box.stable.amenities.length - 6} mer
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Special Notes */}
            {box.specialNotes && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm break-words overflow-hidden">
                <span className="font-medium text-blue-900">Merknad:</span>
                <span className="text-blue-800 ml-1">
                  {box.specialNotes.length > 250
                    ? `${box.specialNotes.substring(0, 250)}...`
                    : box.specialNotes}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Export with React.memo for performance optimization
export default React.memo(BoxListingCard);
