'use client';

import { MapPinIcon, StarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Image from 'next/image';
import Link from 'next/link';
import { StableWithAmenities } from '@/services/stable-service';

interface StableListingCardProps {
  stable: StableWithAmenities;
}

export default function StableListingCard({ stable }: StableListingCardProps) {
  return (
    <Link href={`/staller/${stable.id}`} className="block">
      <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 overflow-hidden hover:shadow-md transition-shadow">
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative md:w-1/3">
          <Image
            src={stable.images[0] || '/api/placeholder/400/300'}
            alt={stable.name}
            width={400}
            height={192}
            className="h-48 md:h-full w-full object-cover"
          />
          {stable.featured && (
            <div className="absolute top-2 left-2 bg-warning text-gray-0 px-2 py-1 rounded-full text-xs font-medium">
              Utvalgt
            </div>
          )}
          <div className="absolute top-2 right-2 bg-gray-0 bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium">
            {stable.images.length} bilder
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 md:w-2/3">
          {/* Mobile: Header with price prominent */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">
                {stable.name}
              </h3>
              <div className="flex items-center text-gray-500 mb-2">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{stable.location}</span>
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
              <div className="text-xl md:text-2xl font-bold text-gray-900">
                {stable.boxes && stable.boxes.length > 0 ? (
                  stable.boxes.length === 1 ? (
                    `${stable.boxes[0].price.toLocaleString()} kr`
                  ) : (
                    `${Math.min(...stable.boxes.map(b => b.price)).toLocaleString()} - ${Math.max(...stable.boxes.map(b => b.price)).toLocaleString()} kr`
                  )
                ) : (
                  'Pris på forespørsel'
                )}
              </div>
              <div className="text-sm text-gray-500">per måned</div>
            </div>
          </div>

          {/* Description - shorter on mobile */}
          <p className="text-gray-700 mb-4 text-sm md:text-base line-clamp-2">
            {stable.description}
          </p>

          {/* Amenities - fewer on mobile */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {stable.amenities.slice(0, 3).map((amenityRelation, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {amenityRelation.amenity.name}
                </span>
              ))}
              {stable.amenities.length > 3 && (
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
                  {stable.boxes ? (
                    `${stable.boxes.filter(b => b.isAvailable).length} av ${stable.boxes.length} ledige`
                  ) : (
                    'Tilgjengelighet ukjent'
                  )}
                </span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                stable.boxes && stable.boxes.some(b => b.isAvailable)
                  ? 'bg-success/10 text-success' 
                  : 'bg-error/10 text-error'
              }`}>
                {stable.boxes && stable.boxes.some(b => b.isAvailable) ? 'Ledig' : 'Fullt'}
              </span>
            </div>
            
            {/* Contact - Mobile: Full width button and contact info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center justify-between sm:justify-start">
                <div className="text-sm text-gray-500">
                  Kontakt {stable.owner.name || stable.ownerName}
                </div>
                <div className="flex space-x-2 sm:ml-3">
                  <a
                    href={`tel:${stable.ownerPhone}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Ring"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={`mailto:${stable.owner.email || stable.ownerEmail}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Send e-post"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <Button size="sm" variant="primary" className="w-full sm:w-auto">
                Se detaljer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Link>
  );
}