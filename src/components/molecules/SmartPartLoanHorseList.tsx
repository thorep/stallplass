"use client";

import { usePartLoanHorseMutations } from "@/hooks/usePartLoanHorses";
import type { PartLoanHorse } from "@/hooks/usePartLoanHorses";
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
import PartLoanHorseModal from "@/components/organisms/PartLoanHorseModal";
import type { User } from "@supabase/supabase-js";

interface SmartPartLoanHorseListProps {
  partLoanHorses: PartLoanHorse[];
  partLoanHorsesLoading: boolean;
  user: User;
}

export default function SmartPartLoanHorseList({
  partLoanHorses,
  partLoanHorsesLoading,
  user,
}: SmartPartLoanHorseListProps) {
  const [expandedHorses, setExpandedHorses] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingHorse, setEditingHorse] = useState<PartLoanHorse | null>(null);
  
  const { delete: deleteHorse } = usePartLoanHorseMutations();

  const toggleExpanded = (horseId: string) => {
    setExpandedHorses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(horseId)) {
        newSet.delete(horseId);
      } else {
        newSet.add(horseId);
      }
      return newSet;
    });
  };

  const toggleDescriptionExpanded = (horseId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(horseId)) {
        newSet.delete(horseId);
      } else {
        newSet.add(horseId);
      }
      return newSet;
    });
  };

  const handleDeleteHorse = async (horseId: string) => {
    if (deleteConfirmId !== horseId) {
      setDeleteConfirmId(horseId);
      return;
    }

    try {
      await deleteHorse.mutateAsync(horseId);
      setDeleteConfirmId(null);
      toast.success("Fôrhest slettet");
    } catch {
      toast.error("Feil ved sletting av fôrhest");
      setDeleteConfirmId(null);
    }
  };

  const formatLocation = (horse: PartLoanHorse) => {
    const parts = [];
    if (horse.address) parts.push(horse.address);
    if (horse.postalCode && horse.postalPlace) {
      parts.push(`${horse.postalCode} ${horse.postalPlace}`);
    }
    if (horse.municipalities?.name) {
      parts.push(horse.municipalities.name);
    }
    return parts.join(", ") || "Ingen adresse oppgitt";
  };

  if (partLoanHorsesLoading) {
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

  if (partLoanHorses.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Ingen fôrhest registrert ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-2">
      {partLoanHorses.map((horse) => {
        const isExpanded = expandedHorses.has(horse.id);
        return (
          <div
            key={horse.id}
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
                onClick={() => toggleExpanded(horse.id)}
              >
                {/* Top row - Image, title, and expand indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Horse image thumbnail */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {horse.images && horse.images.length > 0 ? (
                        <Image
                          src={horse.images[0]}
                          alt={horse.name}
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
                        {horse.name}
                      </h3>
                      <div className="text-sm text-slate-600 mb-2">
                        {horse.description && horse.description.length > 50 
                          ? `${horse.description.substring(0, 50)}...`
                          : horse.description
                        }
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
                    <span className="flex items-center">
                      📸 {horse.images.length} bilder
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Only chevron clickable */}
              <div className="hidden sm:flex items-center justify-between p-5">
                {/* Left side - Horse info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Horse image thumbnail */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {horse.images && horse.images.length > 0 ? (
                      <Image
                        src={horse.images[0]}
                        alt={horse.name}
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
                      <h3 className="font-semibold text-slate-900 truncate">{horse.name}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {formatLocation(horse)}
                      </span>
                      <span>👁 {horse.viewCount} visninger</span>
                      <span>📸 {horse.images.length} bilder</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpanded(horse.id)}
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
                  {horse.description && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Beskrivelse</h4>
                      <div className="text-sm text-slate-600">
                        <div className="sm:hidden">
                          {/* Mobile - show less text */}
                          {horse.description.length > 60 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(horse.id)
                                  ? horse.description
                                  : `${horse.description.substring(0, 60)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(horse.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(horse.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {horse.description}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:block">
                          {/* Desktop - show more text */}
                          {horse.description.length > 120 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(horse.id)
                                  ? horse.description
                                  : `${horse.description.substring(0, 120)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(horse.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(horse.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {horse.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location Details */}
                  {(horse.address || horse.municipalities?.name || horse.counties?.name) && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Lokasjon</h4>
                      <div className="space-y-1 text-sm text-slate-600">
                        {horse.address && <p>{horse.address}</p>}
                        {horse.postalCode && horse.postalPlace && (
                          <p>{horse.postalCode} {horse.postalPlace}</p>
                        )}
                        {horse.municipalities?.name && (
                          <p>{horse.municipalities.name}{horse.counties?.name ? `, ${horse.counties.name}` : ""}</p>
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
                      <Link href={`/forhest/${horse.id}`}>
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
                        onClick={() => setEditingHorse(horse)}
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
                          handleDeleteHorse(horse.id);
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
                        {deleteConfirmId === horse.id ? "Bekreft" : "Slett"}
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
      {editingHorse && (
        <PartLoanHorseModal
          isOpen={!!editingHorse}
          onClose={() => setEditingHorse(null)}
          user={user}
          partLoanHorse={editingHorse}
          mode="edit"
        />
      )}
    </div>
  );
}