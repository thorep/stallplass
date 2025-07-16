import { MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { Stable } from '@/types/stable';
import Button from '@/components/atoms/Button';

interface StableCardProps {
  stable: Stable;
  onViewDetails: (stableId: string) => void;
}

export default function StableCard({ stable, onViewDetails }: StableCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <img
          src={stable.images[0]}
          alt={stable.name}
          className="h-48 w-full rounded-t-lg object-cover"
        />
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
              {stable.rating} ({stable.reviewCount})
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
          {stable.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
            >
              {amenity}
            </span>
          ))}
          {stable.amenities.length > 3 && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              +{stable.amenities.length - 3} mer
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-gray-900">
              {stable.price.toLocaleString()} kr
            </span>
            <span className="text-sm text-gray-600">/{stable.priceUnit}</span>
          </div>
          
          <div className="text-sm text-gray-600">
            {stable.availableSpaces} av {stable.totalSpaces} ledige
          </div>
        </div>
        
        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onViewDetails(stable.id)}
            className="w-full"
          >
            Se detaljer
          </Button>
        </div>
      </div>
    </div>
  );
}