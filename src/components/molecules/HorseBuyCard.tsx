"use client";

import type { HorseBuy } from "@/hooks/useHorseBuys";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface HorseBuyCardProps {
  horseBuy: HorseBuy;
}

const formatNumber = (n?: number) => (typeof n === 'number' ? new Intl.NumberFormat('nb-NO').format(n) : undefined);

export default function HorseBuyCard({ horseBuy }: HorseBuyCardProps) {
  const price = [formatNumber(horseBuy.priceMin), formatNumber(horseBuy.priceMax)].filter(Boolean).join(' - ');
  const age = [horseBuy.ageMin, horseBuy.ageMax].filter((v) => v !== undefined).join(' - ');
  const height = [horseBuy.heightMin, horseBuy.heightMax].filter((v) => v !== undefined).join(' - ');
  const gender = horseBuy.gender ? (horseBuy.gender === 'HOPPE' ? 'Hoppe' : horseBuy.gender === 'HINGST' ? 'Hingst' : 'Vallach') : 'Alle kjønn';

  return (
    <Link href={`/hest-onskes-kjopt/${horseBuy.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 cursor-pointer">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/3">
            <div className="relative h-48 md:h-full w-full overflow-hidden">
              {horseBuy.images && horseBuy.images.length > 0 ? (
                <Image
                  src={horseBuy.images[0]}
                  alt={horseBuy.name}
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
            {horseBuy.images && horseBuy.images.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded-md">📸 {horseBuy.images.length}</div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-0 line-clamp-1">{horseBuy.name}</h3>
              <div className="text-lg font-semibold text-red-600 flex-shrink-0">{price ? `${price} kr` : 'Pris ikke oppgitt'}</div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
              {age && <span>{age} år</span>}
              <span>{gender}</span>
              {horseBuy.breed?.name && <span>{horseBuy.breed.name}</span>}
              {height && <span>{height} cm</span>}
            </div>

            {horseBuy.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{horseBuy.description}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

