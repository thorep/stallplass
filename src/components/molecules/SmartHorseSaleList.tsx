"use client";

import HorseSaleModal from "@/components/organisms/HorseSaleModal";
import type { HorseSale } from "@/hooks/useHorseSales";
import { useHorseSaleMutations } from "@/hooks/useHorseSales";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/formatting";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MapPinIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@mui/material";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface SmartHorseSaleListProps {
  horseSales: HorseSale[];
  horseSalesLoading: boolean;
  user: User;
}

export default function SmartHorseSaleList({
  horseSales,
  horseSalesLoading,
  user,
}: SmartHorseSaleListProps) {
  const [expandedHorseSales, setExpandedHorseSales] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingHorseSale, setEditingHorseSale] = useState<HorseSale | null>(null);

  const { deleteHorseSale } = useHorseSaleMutations();

  const toggleExpanded = (horseSaleId: string) => {
    setExpandedHorseSales((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(horseSaleId)) {
        newSet.delete(horseSaleId);
      } else {
        newSet.add(horseSaleId);
      }
      return newSet;
    });
  };

  const toggleDescriptionExpanded = (horseSaleId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(horseSaleId)) {
        newSet.delete(horseSaleId);
      } else {
        newSet.add(horseSaleId);
      }
      return newSet;
    });
  };

  const handleDeleteHorseSale = async (horseSaleId: string) => {
    if (deleteConfirmId !== horseSaleId) {
      setDeleteConfirmId(horseSaleId);
      return;
    }

    try {
      await deleteHorseSale.mutateAsync(horseSaleId);
      setDeleteConfirmId(null);
      toast.success("Hestesalg slettet");
    } catch {
      toast.error("Feil ved sletting av hestesalg");
      setDeleteConfirmId(null);
    }
  };

  const formatLocation = (horseSale: HorseSale) => {
    const parts = [];
    if (horseSale.address) parts.push(horseSale.address);
    if (horseSale.postalCode && horseSale.postalPlace) {
      parts.push(`${horseSale.postalCode} ${horseSale.postalPlace}`);
    }
    if (horseSale.municipalities?.name) {
      parts.push(horseSale.municipalities.name);
    }
    return parts.join(", ") || "Ingen adresse oppgitt";
  };

  const formatGender = (gender: string) => {
    switch (gender) {
      case 'HOPPE':
        return 'Hoppe';
      case 'HINGST':
        return 'Hingst';
      case 'VALLACH':
        return 'Vallach';
      default:
        return gender;
    }
  };

  const formatSize = (size: string) => {
    switch (size) {
      case 'KATEGORI_4':
        return 'Kategori 4 (< 107 cm)';
      case 'KATEGORI_3':
        return 'Kategori 3 (107-130 cm)';
      case 'KATEGORI_2':
        return 'Kategori 2 (130-140 cm)';
      case 'KATEGORI_1':
        return 'Kategori 1 (140,5-148 cm)';
      case 'UNDER_160':
        return 'Under 160cm';
      case 'SIZE_160_170':
        return '160-170cm';
      case 'OVER_170':
        return 'Over 170cm';
      default:
        return size;
    }
  };

  if (horseSalesLoading) {
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

  if (horseSales.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Ingen hestesalg registrert ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-2">
      {horseSales.map((horseSale) => {
        const isExpanded = expandedHorseSales.has(horseSale.id);
        return (
          <div
            key={horseSale.id}
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
                onClick={() => toggleExpanded(horseSale.id)}
              >
                {/* Top row - Image, title, and expand indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Horse image thumbnail */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {horseSale.images && horseSale.images.length > 0 ? (
                        <Image
                          src={horseSale.images[0]}
                          alt={horseSale.name}
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

                    {/* Title and main info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-h3 font-semibold text-slate-900 mb-1 leading-tight">
                        {horseSale.name}
                      </h3>
                      <div className="text-sm text-slate-600 mb-2">
                        {horseSale.breed?.name} • {formatGender(horseSale.gender)} • {horseSale.age} år
                      </div>
                      <div className="text-h2 font-bold text-indigo-600">
                        {formatPrice(horseSale.price)}
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

                {/* Stats row */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">📸 {horseSale.images.length} bilder</span>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Only chevron clickable */}
              <div className="hidden sm:flex items-center justify-between p-5">
                {/* Left side - Horse info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Horse image thumbnail */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {horseSale.images && horseSale.images.length > 0 ? (
                      <Image
                        src={horseSale.images[0]}
                        alt={horseSale.name}
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

                  {/* Horse details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{horseSale.name}</h3>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {formatPrice(horseSale.price)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span>{horseSale.breed?.name} • {formatGender(horseSale.gender)} • {horseSale.age} år</span>
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {formatLocation(horseSale)}
                      </span>
                      <span>📸 {horseSale.images.length} bilder</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpanded(horseSale.id)}
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
                  {horseSale.description && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Beskrivelse</h4>
                      <div className="text-sm text-slate-600">
                        <div className="sm:hidden">
                          {/* Mobile - show less text */}
                          {horseSale.description.length > 60 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(horseSale.id)
                                  ? horseSale.description
                                  : `${horseSale.description.substring(0, 60)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(horseSale.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(horseSale.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {horseSale.description}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:block">
                          {/* Desktop - show more text */}
                          {horseSale.description.length > 120 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(horseSale.id)
                                  ? horseSale.description
                                  : `${horseSale.description.substring(0, 120)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(horseSale.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(horseSale.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {horseSale.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Horse Details */}
                  <div className="px-1">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Hestedetaljer</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Rase:</span> {horseSale.breed?.name}
                      </div>
                      <div>
                        <span className="font-medium">Disiplin:</span> {horseSale.discipline?.name}
                      </div>
                      <div>
                        <span className="font-medium">Størrelse:</span> {formatSize(horseSale.size)}
                      </div>
                      {horseSale.height && (
                        <div>
                          <span className="font-medium">Høyde:</span> {horseSale.height}cm
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Details */}
                  {(horseSale.address || horseSale.municipalities?.name || horseSale.counties?.name) && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Lokasjon</h4>
                      <div className="space-y-1 text-sm text-slate-600">
                        {horseSale.address && <p>{horseSale.address}</p>}
                        {horseSale.postalCode && horseSale.postalPlace && (
                          <p>
                            {horseSale.postalCode} {horseSale.postalPlace}
                          </p>
                        )}
                        {horseSale.municipalities?.name && (
                          <p>
                            {horseSale.municipalities.name}
                            {horseSale.counties?.name ? `, ${horseSale.counties.name}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="px-1">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Kontaktinformasjon</h4>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p><span className="font-medium">Navn:</span> {horseSale.contactName}</p>
                      <p><span className="font-medium">E-post:</span> {horseSale.contactEmail}</p>
                      {horseSale.contactPhone && (
                        <p><span className="font-medium">Telefon:</span> {horseSale.contactPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-1 pb-2">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Handlinger</h4>
                    <div
                      className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* View details */}
                      <Link href={`/hestesalg/${horseSale.id}`}>
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
                        onClick={() => setEditingHorseSale(horseSale)}
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
                          handleDeleteHorseSale(horseSale.id);
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
                        {deleteConfirmId === horseSale.id ? "Bekreft" : "Slett"}
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
      {editingHorseSale && (
        <HorseSaleModal
          isOpen={!!editingHorseSale}
          onClose={() => setEditingHorseSale(null)}
          user={user}
          horseSale={editingHorseSale}
          mode="edit"
        />
      )}
    </div>
  );
}