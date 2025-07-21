'use client';

import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Image from 'next/image';
import Link from 'next/link';
import { StableWithBoxStats } from '@/types/stable';
import { formatPriceRange } from '@/utils/formatting';

interface StableListingCardProps {
  stable: StableWithBoxStats;
}

export default function StableListingCard({ stable }: StableListingCardProps) {
  return (
    <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 overflow-hidden hover:shadow-md transition-shadow">
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/stables/${stable.id}`} className="relative md:w-1/3 cursor-pointer">
          {stable.images && stable.images.length > 0 ? (
            <Image
              src={stable.images[0]}
              alt={stable.image_descriptions?.[0] || stable.name}
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
          {stable.featured && (
            <div className="absolute top-2 left-2 bg-warning text-gray-0 px-2 py-1 rounded-full text-xs font-medium">
              Utvalgt
            </div>
          )}
          {stable.images && stable.images.length > 0 && (
            <div className="absolute top-2 right-2 bg-gray-0 bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium">
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
                <span className="text-sm">{stable.location}</span>
              </div>
              <div className="flex items-center mb-3">
                <StarIcon className="h-4 w-4 text-warning mr-1" />
                <span className="text-sm text-gray-500">
                  {stable.rating} ({stable.review_count} anmeldelser)
                </span>
              </div>
            </div>
            {/* Mobile: Price below title, Desktop: Price on right */}
            <div className="md:text-right md:ml-4">
              {stable.totalBoxes === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  Ingen bokser tilgjengelig
                </div>
              ) : (
                <>
                  <div className="text-xl md:text-2xl font-bold text-gray-900">
                    {formatPriceRange(stable.priceRange.min, stable.priceRange.max)}
                  </div>
                  <div className="text-sm text-gray-500">per måned</div>
                </>
              )}
            </div>
          </div>

          {/* Description - shorter on mobile */}
          <p className="text-gray-700 mb-4 text-sm md:text-base line-clamp-2">
            {stable.description}
          </p>

          {/* Amenities - fewer on mobile */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {stable.amenities?.slice(0, 3).map((amenityRelation, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {amenityRelation.amenity.name}
                </span>
              ))}
              {stable.amenities && stable.amenities.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                  +{stable.amenities.length - 3} mer
                </span>
              )}
            </div>
          </div>

          {/* Availability and Contact - Mobile stacked */}
          <div className="pt-4 border-t border-gray-300">
            {/* Availability */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-500">
                  {stable.totalBoxes === 0 ? (
                    'Ingen bokser opprettet'
                  ) : (
                    `${stable.availableBoxes} av ${stable.totalBoxes} ledige`
                  )}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                stable.totalBoxes === 0 ? 'bg-gray-100 text-gray-500' :
                stable.availableBoxes > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {stable.totalBoxes === 0 ? 'Ingen bokser' :
                 stable.availableBoxes > 0 ? 'Ledig' : 'Fullt'}
              </span>
            </div>
            
            {/* Contact - Mobile: Full width button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-500">
                Eier: {stable.owner?.name || stable.owner_name}
              </div>
              <Link href={`/stables/${stable.id}`}>
                <Button size="md" variant="primary" className="w-full sm:w-auto min-h-[44px]">
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