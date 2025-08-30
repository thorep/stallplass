"use client";

import FavoriteCount from "@/components/molecules/FavoriteCount";
import { useDeleteService } from "@/hooks/useServiceMutations";
import { getServiceTypeColor, normalizeServiceType } from "@/lib/service-types";
import { ServiceWithDetails } from "@/types/service";
import { formatPrice } from "@/utils/formatting";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MapPinIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import UpdateServiceModal from "@/components/organisms/UpdateServiceModal";

interface SmartServiceListProps {
  services: ServiceWithDetails[];
  servicesLoading: boolean;
}

export default function SmartServiceList({
  services,
  servicesLoading,
}: SmartServiceListProps) {
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ServiceWithDetails | null>(null);
  
  const deleteService = useDeleteService();

  const toggleExpanded = (serviceId: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const toggleDescriptionExpanded = (serviceId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleDeleteService = async (serviceId: string) => {
    if (deleteConfirmId !== serviceId) {
      setDeleteConfirmId(serviceId);
      return;
    }

    try {
      await deleteService.mutateAsync(serviceId);
      setDeleteConfirmId(null);
    } catch {
      toast.error("Feil ved sletting av tjeneste");
      setDeleteConfirmId(null);
    }
  };

  const formatPriceRange = (service: ServiceWithDetails) => {
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

  const formatAreas = (service: ServiceWithDetails) => {
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

    // Format display
    const formattedAreas = Object.entries(countiesByName).map(([county, municipalities]) => {
      if (municipalities.length === 0) {
        return county;
      } else if (municipalities.length === 1) {
        return municipalities[0];
      } else if (municipalities.length === 2) {
        return `${municipalities.join(" og ")} (${county})`;
      } else {
        return `${municipalities[0]}, ${municipalities[1]} +${municipalities.length - 2} (${county})`;
      }
    });

    const result = formattedAreas.join(", ");
    
    if (result.length > 60) {
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


  if (servicesLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Ingen tjenester registrert ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-2">
      {services.map((service) => {
        const isExpanded = expandedServices.has(service.id);
        return (
          <div
            key={service.id}
            className={cn(
              "bg-white border border-slate-200 rounded-xl sm:rounded-lg transition-all duration-200 hover:border-slate-300 shadow-sm sm:shadow-none hover:shadow-md",
              isExpanded && "shadow-lg sm:shadow-sm"
            )}
          >
            {/* Main Row - Always Visible */}
            <div className="sm:p-5">
              {/* Mobile Layout - Entire row clickable */}
              <div
                className="sm:hidden p-4 cursor-pointer hover:bg-slate-50 transition-colors duration-150 rounded-xl"
                onClick={() => toggleExpanded(service.id)}
              >
                {/* Top row - Image, title, and expand indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Service image thumbnail */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {service.images && service.images.length > 0 ? (
                        <Image
                          src={service.images[0]}
                          alt={service.title}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>

                     {/* Title and main status */}
                     <div className="flex-1 min-w-0">
                       <h3 className="text-h3 font-semibold text-slate-900 mb-1 leading-tight">
                         {service.title}
                       </h3>
                       {/* Service type badge */}
                       <div className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                         {service.displayName || ""}
                       </div>
                     </div>
                  </div>

                  {/* Expand chevron */}
                  <div className="p-2 ml-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-6 w-6 text-slate-400 transition-transform duration-200" />
                    ) : (
                      <ChevronRightIcon className="h-6 w-6 text-slate-400 transition-transform duration-200" />
                    )}
                  </div>
                </div>

                {/* Price and service type row */}
                <div className="mb-3">
                  <div className="text-h2 font-bold text-indigo-600 mb-1">
                    {formatPriceRange(service)}
                  </div>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {service.serviceType && (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getServiceTypeColor(
                              normalizeServiceType(service.serviceType)
                            )}`}
                          >
                            {service.displayName || ""}
                          </span>
                        )}
                        <FavoriteCount
                          entityType="SERVICE"
                          entityId={service.id}
                          className="text-xs"
                          showZero={true}
                        />
                      </div>
                   </div>
                </div>

              </div>

              {/* Desktop Layout - Only chevron clickable */}
              <div className="hidden sm:flex items-center justify-between p-5">
                {/* Left side - Service info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Service image thumbnail */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {service.images && service.images.length > 0 ? (
                      <Image
                        src={service.images[0]}
                        alt={service.title}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Service details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{service.title}</h3>
                      {/* Service type indicator */}
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {service.displayName || ""}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="font-semibold text-indigo-600">
                        {formatPriceRange(service)}
                      </span>
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {formatAreas(service)}
                      </span>
                      {service.serviceType && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getServiceTypeColor(
                            normalizeServiceType(service.serviceType)
                          )}`}
                        >
                          {service.displayName || ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Status badges and actions */}
                <div className="flex items-center space-x-2 ml-4">

                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpanded(service.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 pt-4 px-4 sm:px-5 border-t border-slate-100 space-y-5">
                  {/* Description */}
                  {service.description && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Beskrivelse</h4>
                      <div className="text-sm text-slate-600">
                        <div className="sm:hidden">
                          {/* Mobile - show less text */}
                          {service.description.length > 60 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(service.id)
                                  ? service.description
                                  : `${service.description.substring(0, 60)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(service.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(service.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:block">
                          {/* Desktop - show more text */}
                          {service.description.length > 120 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(service.id)
                                  ? service.description
                                  : `${service.description.substring(0, 120)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(service.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(service.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Areas */}
                  {service.areas && service.areas.length > 0 && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Dekningsområder</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.areas.slice(0, 6).map((area, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
                          >
                            {area.municipalityName || area.municipality || area.countyName || area.county}
                          </span>
                        ))}
                        {service.areas.length > 6 && (
                          <span className="px-2 py-1 bg-slate-50 text-slate-700 text-sm rounded-lg border border-slate-200">
                            +{service.areas.length - 6} flere
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-1 pb-2">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Handlinger</h4>
                    <div
                      className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* View details */}
                      <Link href={`/tjenester/${service.id}`}>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: "none",
                            borderRadius: "0.75rem",
                            fontSize: "0.875rem",
                            minHeight: "2.5rem",
                            "@media (max-width: 640px)": {
                              minHeight: "3rem",
                              fontSize: "1rem",
                              width: "100%",
                            },
                          }}
                        >
                          Se detaljer
                        </Button>
                      </Link>

                      {/* Edit */}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PencilIcon className="h-4 w-4" />}
                        onClick={() => setEditingService(service)}
                        sx={{
                          textTransform: "none",
                          borderRadius: "0.75rem",
                          fontSize: "0.875rem",
                          minHeight: "2.5rem",
                          "@media (max-width: 640px)": {
                            minHeight: "3rem",
                            fontSize: "1rem",
                            width: "100%",
                          },
                        }}
                      >
                        Rediger
                      </Button>


                      {/* Delete */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(service.id);
                        }}
                        startIcon={<TrashIcon className="h-4 w-4" />}
                        sx={{
                          textTransform: "none",
                          borderRadius: "0.75rem",
                          fontSize: "0.875rem",
                          minHeight: "2.5rem",
                          "@media (max-width: 640px)": {
                            minHeight: "3rem",
                            fontSize: "1rem",
                            width: "100%",
                          },
                        }}
                      >
                        {deleteConfirmId === service.id ? "Bekreft" : "Slett"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Edit Modal */}
      {editingService && (
        <UpdateServiceModal
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null);
            }
          }}
          onSave={() => {
            // The service list will be automatically updated via TanStack Query
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
}
