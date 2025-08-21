"use client";

import type { HorseSale } from "@/hooks/useHorseSales";
import { formatLocationDisplay } from "@/utils/formatting";
import { MapPinIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface HorseSaleCardProps {
  horseSale: HorseSale;
}

export default function HorseSaleCard({ horseSale }: HorseSaleCardProps) {
  const formatLocation = () => {
    if (horseSale.municipalities && horseSale.counties) {
      return formatLocationDisplay({
        postalPlace: horseSale.postalPlace,
        municipalities: horseSale.municipalities,
        counties: horseSale.counties,
      });
    }

    const parts = [];
    if (horseSale.postalPlace) parts.push(horseSale.postalPlace);
    if (horseSale.municipalities?.name) parts.push(horseSale.municipalities.name);
    if (horseSale.counties?.name) parts.push(horseSale.counties.name);
    return parts.join(", ") || "Ingen lokasjon oppgitt";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nb-NO").format(price);
  };

  const formatGender = (gender: string) => {
    switch (gender) {
      case "HOPPE":
        return "Hoppe";
      case "HINGST":
        return "Hingst";
      case "VALLACH":
        return "Vallach";
      default:
        return gender;
    }
  };

  const formatSize = (size: string) => {
    switch (size) {
      case "KATEGORI_4":
        return "Kategori 4";
      case "KATEGORI_3":
        return "Kategori 3";
      case "KATEGORI_2":
        return "Kategori 2";
      case "KATEGORI_1":
        return "Kategori 1";
      case "UNDER_160":
        return "Under 160cm";
      case "SIZE_160_170":
        return "160-170cm";
      case "OVER_170":
        return "Over 170cm";
      default:
        return size;
    }
  };

  return (
    <Link href={`/hest/${horseSale.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 cursor-pointer">
        {/* Mobile-first: Stack layout with image on left for desktop */}
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/3">
            <div className="relative h-48 md:h-full w-full overflow-hidden">
              {horseSale.images && horseSale.images.length > 0 ? (
                <Image
                  src={horseSale.images[0]}
                  alt={horseSale.name}
                  width={800}
                  height={400}
                  className="h-48 md:h-full w-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
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
            {horseSale.images && horseSale.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-md">
                📸 {horseSale.images.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6">
            {/* Title and Price */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-0 line-clamp-1">
                {horseSale.name}
              </h3>
              <div className="text-lg font-semibold flex-shrink-0">
                {formatPrice(horseSale.price)} kr
              </div>
            </div>

            {/* Horse details */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              <span>{horseSale.age} år</span>
              <span>{formatGender(horseSale.gender)}</span>
              <span>{horseSale.breed.name}</span>
              {horseSale.height && <span>{horseSale.height}cm</span>}
              <span>{formatSize(horseSale.size)}</span>
            </div>

            {/* Description */}
            {horseSale.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{horseSale.description}</p>
            )}

            {/* Location */}
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{formatLocation()}</span>
            </div>

            {/* Discipline */}
            {horseSale.discipline && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {horseSale.discipline.name}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
