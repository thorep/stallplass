import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { PhotoIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { ServiceWithDetails } from '@/types/service';
import { formatPrice } from '@/utils/formatting';
import Button from '@/components/atoms/Button';
import Image from 'next/image';
import Link from 'next/link';

interface ServiceCardProps {
  service: ServiceWithDetails;
  showContactInfo?: boolean;
  className?: string;
}

import { getServiceTypeLabel, getServiceTypeColor, normalizeServiceType } from '@/lib/service-types';

export default function ServiceCard({ 
  service, 
  showContactInfo = false,
  className = '' 
}: ServiceCardProps) {
  const formatPriceRange = () => {
    if (!service.priceRangeMin && !service.priceRangeMax) {
      return 'Kontakt for pris';
    }
    if (service.priceRangeMin && service.priceRangeMax) {
      return `${formatPrice(service.priceRangeMin)} - ${formatPrice(service.priceRangeMax)}`;
    }
    if (service.priceRangeMin) {
      return `Fra ${formatPrice(service.priceRangeMin)}`;
    }
    if (service.priceRangeMax) {
      return `Opp til ${formatPrice(service.priceRangeMax)}`;
    }
    return 'Kontakt for pris';
  };

  const formatAreas = () => {
    if (service.areas.length === 0) return '';
    
    // Group by county
    const countiesByName: { [key: string]: string[] } = {};
    service.areas.forEach(area => {
      if (!countiesByName[area.county]) {
        countiesByName[area.county] = [];
      }
      if (area.municipality) {
        countiesByName[area.county].push(area.municipality);
      }
    });

    // Format display
    const countyStrings = Object.entries(countiesByName).map(([county, municipalities]) => {
      if (municipalities.length === 0) {
        return county; // Whole county coverage
      }
      return `${municipalities.join(', ')} (${county})`;
    });

    return countyStrings.join(' • ');
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className="relative">
        {service.photos && service.photos.length > 0 ? (
          <Image
            src={service.photos[0].photoUrl}
            alt={service.title}
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
        
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getServiceTypeColor(normalizeServiceType(service.serviceType))}`}>
            {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
        </div>

        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <UserCircleIcon className="h-4 w-4 mr-1.5" />
            <span>{service.profile.nickname}</span>
          </div>
          
          {formatAreas() && (
            <div className="flex items-start text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{formatAreas()}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="text-lg font-semibold text-gray-900">
            {formatPriceRange()}
          </div>
        </div>

        {showContactInfo && (
          <div className="space-y-2 mb-4 pt-3 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              <a href={`mailto:${service.contactEmail}`} className="hover:text-blue-600">
                {service.contactEmail}
              </a>
            </div>
            {service.contactPhone && (
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <a href={`tel:${service.contactPhone}`} className="hover:text-blue-600">
                  {service.contactPhone}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          {showContactInfo ? (
            <>
              <Button 
                variant="primary" 
                size="sm" 
                className="flex-1"
                onClick={() => window.open(`mailto:${service.contactEmail}?subject=Angående ${service.title}`, '_blank')}
              >
                Send e-post
              </Button>
              {service.contactPhone && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`tel:${service.contactPhone}`, '_blank')}
                >
                  Ring
                </Button>
              )}
            </>
          ) : (
            <Link href={`/tjenester/${service.id}`}>
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full"
              >
                Se detaljer
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}