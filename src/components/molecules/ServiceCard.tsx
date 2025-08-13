"use client";

import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import { formatServiceAreas } from "@/utils/service-formatting";
import { MapPinIcon, PhotoIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { getServiceTypeLabel, getServiceTypeColor, normalizeServiceType } from '@/lib/service-types';
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ServiceCardProps {
  service: ServiceWithDetails;
  className?: string;
}

function ServiceCard({ 
  service, 
  className = '',
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
    <Link 
      href={`/tjenester/${service.id}`}
    >
      <div className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md cursor-pointer ${className}`}>
        {/* Mobile-first: Stack layout */}
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-1/3">
            {service.images && service.images.length > 0 ? (
              <Image
                src={service.images[0]}
                alt={service.title}
                width={400}
                height={192}
                className="h-48 md:h-full w-full object-cover rounded-t-lg md:rounded-t-none md:rounded-l-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            ) : (
              <div className="h-48 md:h-full w-full bg-gray-50 flex items-center justify-center rounded-t-lg md:rounded-t-none md:rounded-l-lg">
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
          </div>

          {/* Content */}
          <div className="p-4 md:w-2/3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div className="flex-1">
                {/* Title */}
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">
                    {service.title}
                  </h3>
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
          </div>
        </div>
      </div>
    </Link>
  );
}

// Export with React.memo for performance optimization
export default React.memo(ServiceCard);
}