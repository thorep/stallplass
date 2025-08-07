"use client";

import Button from "@/components/atoms/Button";
import ConfirmModal from "@/components/molecules/ConfirmModal";
import { useDeleteService } from "@/hooks/useServiceMutations";
import {
  getServiceTypeColor,
  getServiceTypeLabel,
  normalizeServiceType,
} from "@/lib/service-types";
import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  PencilIcon,
  PhotoIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ServiceManagementCardProps {
  service: ServiceWithDetails;
  onToggleStatus: () => void;
}

export default function ServiceManagementCard({
  service,
  onToggleStatus,
}: ServiceManagementCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteServiceMutation = useDeleteService();

  // Handle deletion
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteServiceMutation.mutateAsync(service.id);
      setShowDeleteModal(false);
      // TanStack Query automatically invalidates and updates all related queries
    } catch (error) {
      // Error is handled by the mutation hook
      // Error handled by mutation hook
    }
  };

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

    // Format display with better clarity
    const formattedAreas = Object.entries(countiesByName).map(([county, municipalities]) => {
      if (municipalities.length === 0) {
        // Whole county coverage
        return county;
      } else if (municipalities.length === 1) {
        // Single municipality in county
        return municipalities[0];
      } else if (municipalities.length === 2) {
        // Two municipalities - show both names
        return `${municipalities.join(" og ")} (${county})`;
      } else {
        // Three or more municipalities - show first two + count
        return `${municipalities[0]}, ${municipalities[1]} +${municipalities.length - 2} (${county})`;
      }
    });

    // Join all areas
    const result = formattedAreas.join(", ");
    
    // If the result is too long, truncate it
    if (result.length > 60) {
      // Show total count instead
      const totalMunicipalities = Object.values(countiesByName).flat().length;
      const countyCount = Object.keys(countiesByName).length;
      
      if (totalMunicipalities > 0) {
        return `${totalMunicipalities} kommuner i ${countyCount} fylke${countyCount !== 1 ? "r" : ""}`;
      } else {
        return `${countyCount} fylke${countyCount !== 1 ? "r" : ""}`;
      }
    }
    
    return result;
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
      className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md ${
        !hasActiveAdvertising ? "border-gray-300 opacity-75" : "border-gray-200"
      }`}
    >
      <div className="relative">
        {/* Service image */}
        {service.images && service.images.length > 0 ? (
          <Image
            src={service.images[0]}
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

        {/* Service type badge and delete button */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {service.serviceType && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getServiceTypeColor(
                normalizeServiceType(service.serviceType)
              )}`}
            >
              {getServiceTypeLabel(normalizeServiceType(service.serviceType))}
            </span>
          )}
          
          <button
            onClick={handleDeleteClick}
            disabled={deleteServiceMutation.isPending}
            className="p-1.5 rounded-full bg-white/90 hover:bg-white text-red-600 hover:text-red-700 transition-colors shadow-sm"
            data-cy="delete-service-button"
          >
            {deleteServiceMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Service name */}
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{service.title}</h3>
        </div>

        {/* Location and areas */}
        <div className="mb-2">
          <div className="flex items-start text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <span className="break-words">{formatAreas()}</span>
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
            {service.images && service.images.length > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                {service.images.length} bilde{service.images.length !== 1 ? "r" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-lg font-semibold text-gray-900">{formatPriceRange()}</span>
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          {/* Primary actions */}
          <div className="flex gap-2">
            <Link href={`/tjenester/${service.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full min-h-[40px] rounded-lg font-medium transition-all duration-200">
                Se detaljer
              </Button>
            </Link>

            <Link href={`/tjenester/${service.id}/rediger`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full min-h-[40px] rounded-lg font-medium transition-all duration-200">
                <PencilIcon className="h-4 w-4 mr-1" />
                Rediger
              </Button>
            </Link>
          </div>

          {/* Buy advertising button if not active */}
          {!hasActiveAdvertising && (
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  service_id: service.id,
                  service_name: service.title,
                });
                window.location.href = `/dashboard/advertising/service?${params.toString()}`;
              }}
              className="w-full min-h-[40px] px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              data-cy="buy-service-advertising-button"
            >
              <SparklesIcon className="h-4 w-4" />
              Kjøp annonsering
            </button>
          )}

          {/* Secondary action */}
          {hasActiveAdvertising && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStatus}
              className="w-full min-h-[40px] rounded-lg font-medium text-amber-600 hover:text-amber-700 transition-all duration-200"
            >
              Deaktiver
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Slett tjeneste"
        message={`Er du sikker på at du vil slette tjenesten "${service.title}"? Denne handlingen kan ikke angres.`}
        confirmText="Slett tjeneste"
        loading={deleteServiceMutation.isPending}
      />
    </div>
  );
}
