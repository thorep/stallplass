import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { StableWithBoxStats } from '@/types/stable';
import { formatPriceRange } from '@/utils/formatting';
import Button from '@/components/atoms/Button';
import Image from 'next/image';
import Link from 'next/link';

interface StableCardProps {
  stable: StableWithBoxStats;
}

export default function StableCard({ stable }: StableCardProps) {
  return (
    <Link href={`/stables/${stable.id}`} className="block">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        {stable.images && stable.images.length > 0 ? (
          <Image
            src={stable.images[0]}
            alt={stable.image_descriptions?.[0] || stable.name}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-gray-100 rounded-t-lg flex items-center justify-center">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Ingen bilder</p>
            </div>
          </div>
        )}
        {stable.featured && (
          <div className="absolute top-3 left-3 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
            Utvalgt
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{stable.name}</h3>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-600">
              {stable.rating} ({stable.review_count})
            </span>
          </div>
        </div>
        
        <div className="mb-2 flex items-center text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4 mr-1" />
          {stable.location}
        </div>
        
        <p className="mb-3 text-sm text-gray-700 line-clamp-2">
          {stable.description}
        </p>
        
        <div className="mb-3 flex flex-wrap gap-1">
          {stable.amenities && stable.amenities.length > 0 ? (
            <>
              {stable.amenities.slice(0, 3).map((amenityRelation: { amenity: { name: string } }, index: number) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  {amenityRelation.amenity.name}
                </span>
              ))}
              {stable.amenities.length > 3 && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  +{stable.amenities.length - 3} mer
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500">Ingen fasiliteter oppgitt</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            {(stable.totalBoxes === 0) || (!stable.priceRange) ? (
              <span className="text-sm text-gray-500 italic">
                Ingen bokser tilgjengelig
              </span>
            ) : (
              <>
                <span className="text-lg font-semibold text-gray-900">
                  {formatPriceRange(stable.priceRange.min, stable.priceRange.max)}
                </span>
                <span className="text-sm text-gray-600">/måned</span>
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {(stable.totalBoxes === undefined || stable.totalBoxes === 0) ? 'Ingen bokser opprettet' : `${stable.availableBoxes || 0} av ${stable.totalBoxes} ledige`}
          </div>
        </div>
        
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
          >
            Se detaljer
          </Button>
        </div>
      </div>
    </div>
    </Link>
  );
}