import { MapPinIcon, StarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Image from 'next/image';

interface StableListingCardProps {
  stable: {
    id: string;
    name: string;
    description: string;
    location: string;
    price: number;
    availableSpaces: number;
    totalSpaces: number;
    rating: number;
    reviewCount: number;
    images: string[];
    amenities: string[];
    featured: boolean;
    owner: {
      name: string;
      phone: string;
      email: string;
    };
  };
}

export default function StableListingCard({ stable }: StableListingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-1/3 relative">
          <Image
            src={stable.images[0] || '/api/placeholder/400/300'}
            alt={stable.name}
            width={400}
            height={192}
            className="h-48 md:h-full w-full object-cover"
          />
          {stable.featured && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Utvalgt
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium">
            {stable.images.length} bilder
          </div>
        </div>

        {/* Content */}
        <div className="md:w-2/3 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {stable.name}
              </h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{stable.location}</span>
              </div>
              <div className="flex items-center mb-3">
                <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">
                  {stable.rating} ({stable.reviewCount} anmeldelser)
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {stable.price.toLocaleString()} kr
              </div>
              <div className="text-sm text-gray-600">per måned</div>
            </div>
          </div>

          <p className="text-gray-700 mb-4 line-clamp-2">
            {stable.description}
          </p>

          {/* Amenities */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {stable.amenities.slice(0, 4).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {amenity}
                </span>
              ))}
              {stable.amenities.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  +{stable.amenities.length - 4} mer
                </span>
              )}
            </div>
          </div>

          {/* Availability and Contact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center mb-3 sm:mb-0">
              <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {stable.availableSpaces} av {stable.totalSpaces} plasser ledige
              </span>
              <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                stable.availableSpaces > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {stable.availableSpaces > 0 ? 'Ledig' : 'Fullt'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Kontakt {stable.owner.name}
              </div>
              <div className="flex space-x-2">
                <a
                  href={`tel:${stable.owner.phone}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Ring"
                >
                  <PhoneIcon className="h-4 w-4" />
                </a>
                <a
                  href={`mailto:${stable.owner.email}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Send e-post"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                </a>
              </div>
              <Button size="sm" variant="primary">
                Se detaljer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}