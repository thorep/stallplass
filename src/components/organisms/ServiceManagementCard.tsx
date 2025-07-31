"use client";

import Button from "@/components/atoms/Button";
import { ServiceType as PrismaServiceType } from "@/generated/prisma";
import {
  getServiceTypeColor,
  getServiceTypeLabel,
  prismaToAppServiceType,
} from "@/lib/service-types";
import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import {
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  PencilIcon,
  PhotoIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";

interface ServiceManagementCardProps {
  service: ServiceWithDetails;
  onDelete: (serviceId: string) => void;
  onToggleStatus: () => void;
  deletingServiceId: string | null;
}

export default function ServiceManagementCard({
  service,
  onDelete,
  onToggleStatus,
  deletingServiceId,
}: ServiceManagementCardProps) {
  const formatPriceRange = () => {
    if (!service.priceRangeMin && !service.priceRangeMax) {
      return "Kontakt for pris";
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
    return "Kontakt for pris";
  };

  const formatAreas = () => {
    if (service.areas.length === 0) return "Ingen områder";

    // Group by county name
    const countiesByName: { [key: string]: string[] } = {};
    service.areas.forEach((area) => {
      const countyName = area.countyName || area.county;
      if (!countiesByName[countyName]) {
        countiesByName[countyName] = [];
      }
      if (area.municipality) {
        const municipalityName = area.municipalityName || area.municipality;
        countiesByName[countyName].push(municipalityName);
      }
    });

    // Format display - simplified for card
    const counties = Object.keys(countiesByName);
    if (counties.length > 2) {
      return `${counties.slice(0, 2).join(", ")} + ${counties.length - 2} til`;
    }
    return counties.join(", ");
  };

  // Calculate days remaining for advertising
  const daysRemaining = service.advertisingEndDate
    ? Math.ceil(
        (new Date(service.advertisingEndDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const hasActiveAdvertising = service.advertisingActive && daysRemaining > 0;
  const isExpiringSoon = hasActiveAdvertising && daysRemaining <= 7;

  return (
    <div
      className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${
        !hasActiveAdvertising ? "border-gray-300 opacity-75" : "border-gray-200"
      }`}
    >
      <div className="relative">
        {/* Service image */}
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

        {/* Status indicator */}
        <div className="absolute top-3 left-3">
          {hasActiveAdvertising ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Annonsert
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              <ExclamationCircleIcon className="h-3 w-3 mr-1" />
              Ikke annonsert
            </span>
          )}
        </div>

        {/* Advertising days remaining badge */}
        {hasActiveAdvertising && (
          <div
            className={`absolute top-12 left-3 rounded-full px-2 py-1 text-xs font-medium text-white ${
              isExpiringSoon ? "bg-amber-500" : "bg-purple-500"
            }`}
          >
            <ClockIcon className="h-3 w-3 mr-1 inline" />
            {daysRemaining} {daysRemaining === 1 ? "dag" : "dager"} igjen
          </div>
        )}

        {/* Service type badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getServiceTypeColor(
              prismaToAppServiceType(service.serviceType as PrismaServiceType)
            )}`}
          >
            {getServiceTypeLabel(prismaToAppServiceType(service.serviceType as PrismaServiceType))}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Service name and provider info */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{service.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <CogIcon className="h-4 w-4 mr-1" />
            <span>{service.user?.name || "Ukjent leverandør"}</span>
          </div>
        </div>

        {/* Location and areas */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{formatAreas()}</span>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="mb-3 text-sm text-gray-700 line-clamp-2">{service.description}</p>
        )}

        {/* Service details */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
              {service.areas.length} område{service.areas.length !== 1 ? "r" : ""}
            </span>
            {service.photos && service.photos.length > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {service.photos.length} bilde{service.photos.length !== 1 ? "r" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-lg font-semibold text-gray-900">{formatPriceRange()}</span>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {/* Primary actions */}
          <div className="flex gap-2">
            <Link href={`/tjenester/${service.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Se detaljer
              </Button>
            </Link>

            <Link href={`/tjenester/${service.id}/rediger`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                <PencilIcon className="h-4 w-4 mr-1" />
                Rediger
              </Button>
            </Link>
          </div>

          {/* Buy advertising button if not active */}
          {!hasActiveAdvertising && (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => {
                const params = new URLSearchParams({
                  service_id: service.id,
                  service_name: service.title,
                });
                window.location.href = `/dashboard/advertising/service?${params.toString()}`;
              }}
              data-cy="buy-service-advertising-button"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Kjøp annonsering
            </Button>
          )}

          {/* Secondary actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStatus}
              className={`flex-1 ${
                service.isActive
                  ? "text-amber-600 hover:text-amber-700"
                  : "text-green-600 hover:text-green-700"
              }`}
              disabled={!service.isActive}
            >
              {service.isActive ? "Deaktiver" : "Aktiver"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(service.id)}
              disabled={deletingServiceId === service.id}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              {deletingServiceId === service.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Slett
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
