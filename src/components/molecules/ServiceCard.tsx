"use client";

import Button from "@/components/atoms/Button";
import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import { MapPinIcon, PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { getServiceTypeLabel, getServiceTypeColor, normalizeServiceType } from '@/lib/service-types';
import Image from "next/image";
import Link from "next/link";

interface ServiceCardProps {
  service: ServiceWithDetails;
  showContactInfo?: boolean;
  className?: string;
}

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


  return (
    <div className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${className}`}>
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/tjenester/${service.id}`} className="relative md:w-1/3 cursor-pointer">
          {service.images && service.images.length > 0 ? (
            <Image
              src={service.images[0]}
              alt={service.title}
              width={400}
              height={192}
              className="h-48 md:h-full w-full object-cover"
            />
          ) : (
            <div className="h-48 md:h-full w-full bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Ingen bilder</p>
              </div>
            </div>
          )}

          {/* Service type pill - top-left */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(normalizeServiceType(service.serviceType))}`}>
              {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
            </span>
          </div>

          {/* Image count pill - top-right */}
          {service.images && service.images.length > 1 && (
            <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700">
              {service.images.length} bilder
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-4 md:w-2/3">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex-1">
              {/* Title */}
              <div className="mb-2">
                <Link href={`/tjenester/${service.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                </Link>
              </div>
              {/* Provider name with icon */}
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <UserCircleIcon className="h-4 w-4 mr-1 text-gray-500" />
                <span className="font-medium">{service.profile.nickname}</span>
              </div>
              {/* Location with icon */}
              {formatServiceAreas(service.areas) && (
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{formatServiceAreas(service.areas)}</span>
                </div>
              )}
            </div>
            {/* Price - consistent with box card */}
            <div className="text-right sm:ml-4 mt-2 sm:mt-0">
              <div className="text-lg font-semibold text-gray-900">
                {formatPriceRange()}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {service.description && (
            <p className="mb-3 text-sm text-gray-700 line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {showContactInfo ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex-1 sm:flex-none"
                  onClick={() => window.open(`mailto:${service.contactEmail}?subject=Angående ${service.title}`, '_blank')}
                >
                  Send e-post
                </Button>
                {service.contactPhone && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 sm:flex-none"
                    onClick={() => window.open(`tel:${service.contactPhone}`, '_blank')}
                  >
                    Ring
                  </Button>
                )}
              </div>
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
    </div>
  );
}