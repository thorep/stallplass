"use client";

import type { PartLoanHorse } from "@/hooks/usePartLoanHorses";
import { formatLocationDisplay } from "@/utils/formatting";
import { MapPinIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface PartLoanHorseCardProps {
  partLoanHorse: PartLoanHorse;
}

export default function PartLoanHorseCard({ partLoanHorse }: PartLoanHorseCardProps) {
  const formatLocation = () => {
    if (partLoanHorse.municipalities && partLoanHorse.counties) {
      return formatLocationDisplay({
        postalPlace: partLoanHorse.postalPlace,
        municipalities: partLoanHorse.municipalities,
        counties: partLoanHorse.counties,
      });
    }
    
    const parts = [];
    if (partLoanHorse.postalPlace) parts.push(partLoanHorse.postalPlace);
    if (partLoanHorse.municipalities?.name) parts.push(partLoanHorse.municipalities.name);
    if (partLoanHorse.counties?.name) parts.push(partLoanHorse.counties.name);
    return parts.join(", ") || "Ingen lokasjon oppgitt";
  };

  return (
    <Link href={`/forhest/${partLoanHorse.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 cursor-pointer">
        {/* Mobile-first: Stack layout with image on left for desktop */}
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/3">
            <div className="relative h-48 md:h-full w-full overflow-hidden">
              {partLoanHorse.images && partLoanHorse.images.length > 0 ? (
                <Image
                  src={partLoanHorse.images[0]}
                  alt={partLoanHorse.name}
                  width={800}
                  height={400}
                  className="h-48 md:h-full w-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                  quality={75}
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
            
            {/* Image count badge */}
            {partLoanHorse.images && partLoanHorse.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-md">
                📸 {partLoanHorse.images.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
              {partLoanHorse.name}
            </h3>

            {/* Description */}
            {partLoanHorse.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {partLoanHorse.description}
              </p>
            )}

            {/* Location */}
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{formatLocation()}</span>
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
