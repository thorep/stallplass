"use client";

import Button from "@/components/atoms/Button";
import { useBoxAvailability } from "@/hooks/useBoxQueries";
import { BoxWithStablePreview } from "@/types/stable";
import { formatLocationDisplay, formatPrice } from "@/utils/formatting";
import { ClockIcon, MapPinIcon, PhotoIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

interface BoxListingCardProps {
  box: BoxWithStablePreview;
}

export default function BoxListingCard({ box }: BoxListingCardProps) {
  // Get real-time availability updates for this specific box
  const { box: realTimeBox } = useBoxAvailability(box.id);

  // Use real-time data if available, otherwise fall back to initial data
  const currentBox = realTimeBox || box;
  const isAvailable = currentBox.isAvailable;
  const isSponsored = currentBox.isSponsored;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all ${
        !isAvailable ? "border-gray-300 opacity-75" : "border-gray-200"
      }`}
    >
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/bokser/${currentBox.id}`} className="relative md:w-1/3 cursor-pointer">
          {currentBox.images && currentBox.images.length > 0 ? (
            <Image
              src={currentBox.images[0]}
              alt={currentBox.imageDescriptions?.[0] || currentBox.name}
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
          {currentBox.images && currentBox.images.length > 0 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded-full text-xs font-medium text-white">
              {currentBox.images.length} bilder
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4 md:p-6 md:w-2/3">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/bokser/${currentBox.id}`}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                      {currentBox.name}
                    </h3>
                  </Link>
                  {/* Availability indicator */}
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Ledig
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                        Opptatt
                      </span>
                    )}
                    {isSponsored && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Betalt plassering
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <Link
                    href={`/stables/${box.stable?.id || ""}`}
                    className="hover:text-primary font-medium"
                  >
                    {box.stable?.name || "Ukjent stall"}
                  </Link>
                  <span className="mx-2">•</span>
                  <span>{formatLocationDisplay(box)}</span>
                </div>

                {box.stable?.rating ||
                  (0 && box.stable?.rating) ||
                  (0 > 0 && (
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (box.stable?.rating || 0 || 0)
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
                  ))}
              </div>

              {/* Price */}
              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(currentBox.price)}
                </div>
                <div className="text-sm text-gray-600">pr måned</div>
              </div>
            </div>

            {/* Description */}
            {currentBox.description && (
              <p className="text-gray-600 text-sm mb-4">{currentBox.description}</p>
            )}

            {/* Box Details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
              {currentBox.size && (
                <div>
                  <span className="font-medium">Størrelse:</span>
                  <br />
                  <span className="text-gray-600">{currentBox.size} m²</span>
                </div>
              )}

              <div>
                <span className="font-medium">Type:</span>
                <br />
                <span className="text-gray-600">
                  {currentBox.boxType === "BOKS" ? "Boks" : "Utegang"}
                </span>
              </div>

              {currentBox.maxHorseSize && (
                <div>
                  <span className="font-medium">Hestestørrelse:</span>
                  <br />
                  <span className="text-gray-600">{currentBox.maxHorseSize}</span>
                </div>
              )}
            </div>

            {/* Amenities */}
            {box.amenities && box.amenities.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {box.amenities.map((amenityRelation, index) => (
                    <span
                      key={amenityRelation.amenity.id || index}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      {amenityRelation.amenity.name}
                    </span>
                  ))}
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
            <div className="pt-4 border-t border-gray-300 flex justify-end">
              <Link href={`/bokser/${currentBox.id}`}>
                <Button variant="primary" size="md" className="w-full sm:w-auto min-h-[44px]">
                  Se detaljer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
