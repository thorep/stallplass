import { MapPinIcon, StarIcon, HomeIcon } from '@heroicons/react/24/solid';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { BoxWithStable } from '@/types/stable';
import Button from '@/components/atoms/Button';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatting';

interface BoxCardProps {
  box: BoxWithStable;
}

export default function BoxCard({ box }: BoxCardProps) {

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        {/* Box image or stable image as fallback */}
        {box.images && box.images.length > 0 ? (
          <Image
            src={box.images[0]}
            alt={box.image_descriptions?.[0] || box.name}
            width={400}
            height={192}
            className="h-48 w-full rounded-t-lg object-cover"
          />
        ) : box.stable.images && box.stable.images.length > 0 ? (
          <Image
            src={box.stable.images[0]}
            alt={`${box.stable.name} - ${box.name}`}
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
        
        {/* Sponsored badge */}
        {box.is_sponsored && (
          <div className="absolute top-3 left-3 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
            Sponset
          </div>
        )}
        
        {/* Indoor/Outdoor badge */}
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700">
          {box.is_indoor ? 'Innendørs' : 'Utendørs'}
        </div>
      </div>
      
      <div className="p-4">
        {/* Box name and stable info */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{box.name}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <HomeIcon className="h-4 w-4 mr-1" />
            <span>{box.stable.name}</span>
          </div>
        </div>
        
        {/* Location and rating */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {box.stable.location}
          </div>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-600">
              {box.stable.rating} ({box.stable.review_count})
            </span>
          </div>
        </div>
        
        {/* Description */}
        {box.description && (
          <p className="mb-3 text-sm text-gray-700 line-clamp-2">
            {box.description}
          </p>
        )}
        
        {/* Box details */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 text-xs">
            {box.size && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                {box.size} m²
              </span>
            )}
            {box.max_horse_size && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {box.max_horse_size}
              </span>
            )}
            {box.has_window && (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-yellow-700">
                Vindu
              </span>
            )}
            {box.has_electricity && (
              <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">
                Strøm
              </span>
            )}
            {box.has_water && (
              <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">
                Vann
              </span>
            )}
          </div>
        </div>
        
        {/* Price and action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(box.price)}
            </span>
            <span className="text-sm text-gray-600">/måned</span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <Link href={`/staller/${box.stable.id}`}>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
            >
              Se stall og kontakt
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}