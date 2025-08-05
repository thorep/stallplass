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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 ${className}`}>
      {/* Mobile-first: Stack layout */}
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <Link href={`/tjenester/${service.id}`} className="relative md:w-1/3 cursor-pointer">
          {service.photos && service.photos.length > 0 ? (
            <Image
              src={service.photos[0].photoUrl}
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
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getServiceTypeColor(normalizeServiceType(service.serviceType))}`}>
              {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
            </span>
          </div>

          {/* Image count pill - top-right */}
          {service.photos && service.photos.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
              {service.photos.length} bilder
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-5 md:p-6 md:w-2/3">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
            <div className="flex-1">
              {/* Title */}
              <div className="mb-2">
                <Link href={`/tjenester/${service.id}`}>
                  <h3 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors">
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
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-500" />
                  <span className="font-medium">{formatServiceAreas(service.areas)}</span>
                </div>
              )}
            </div>
            {/* Price - larger and more prominent */}
            <div className="md:text-right md:ml-4 mt-2 md:mt-0">
              <div className="text-3xl font-bold text-gray-900">
                {formatPriceRange()}
              </div>
            </div>
          </div>
          
          {/* Description */}
          {service.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            {showContactInfo ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="md" 
                  className="flex-1 sm:flex-none min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8"
                  onClick={() => window.open(`mailto:${service.contactEmail}?subject=Angående ${service.title}`, '_blank')}
                >
                  Send e-post
                </Button>
                {service.contactPhone && (
                  <Button 
                    variant="secondary" 
                    size="md" 
                    className="flex-1 sm:flex-none min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8"
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
                  size="md" 
                  className="w-full sm:w-auto min-h-[48px] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-8"
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