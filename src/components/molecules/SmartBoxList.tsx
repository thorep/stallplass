"use client";

import FavoriteCount from "@/components/molecules/FavoriteCount";
import { useDeleteBox, useUpdateBoxAvailabilityStatus } from "@/hooks/useBoxMutations";
import { cn } from "@/lib/utils";
import { Box, BoxWithAmenities, StableWithBoxStats } from "@/types/stable";
import { formatBoxSize, formatHorseSize, formatPrice } from "@/utils/formatting";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface SmartBoxListProps {
  stable: StableWithBoxStats;
  boxes: Box[];
  boxesLoading: boolean;
  onEditBox: (box: Box) => void;
  onRefetchBoxes: () => void;
}

export default function SmartBoxList({
  stable,
  boxes,
  boxesLoading,
  onEditBox,
  onRefetchBoxes,
}: SmartBoxListProps) {
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [expandedSpecialNotes, setExpandedSpecialNotes] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const updateBoxAvailability = useUpdateBoxAvailabilityStatus();
  const deleteBox = useDeleteBox();

  const toggleExpanded = (boxId: string) => {
    setExpandedBoxes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  const toggleDescriptionExpanded = (boxId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  const toggleSpecialNotesExpanded = (boxId: string) => {
    setExpandedSpecialNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(boxId)) {
        newSet.delete(boxId);
      } else {
        newSet.add(boxId);
      }
      return newSet;
    });
  };

  const handleUpdateQuantity = async (boxId: string, change: number) => {
    const currentBox = boxes.find((b) => b.id === boxId);
    if (!currentBox) return;

    const currentQuantity =
      ("availableQuantity" in currentBox ? (currentBox.availableQuantity as number) : 0) ?? 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    try {
      await updateBoxAvailability.mutateAsync({ boxId, availableQuantity: newQuantity });
    } catch {
      toast.error("Feil ved oppdatering av antall");
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    if (deleteConfirmId !== boxId) {
      setDeleteConfirmId(boxId);
      return;
    }

    try {
      await deleteBox.mutateAsync(boxId);
      onRefetchBoxes();
      setDeleteConfirmId(null);
    } catch {
      toast.error("Feil ved sletting av boks");
      setDeleteConfirmId(null);
    }
  };

  const handleBoost = (boxId: string, boxName: string) => {
    const params = new URLSearchParams({
      boxId,
      boxName,
      stableName: stable.name,
    });
    window.location.href = `/dashboard/boost/single?${params.toString()}`;
  };

  if (boxesLoading) {
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

  if (boxes.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Ingen bokser registrert ennå</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-2">
      {boxes.map((box) => {
        const isExpanded = expandedBoxes.has(box.id);
        const boxWithAmenities = box as BoxWithAmenities;
        const availableQuantity =
          ("availableQuantity" in box ? (box.availableQuantity as number) : 0) ?? 0;
        const isAvailable = availableQuantity > 0;

        return (
          <div
            key={box.id}
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
                onClick={() => toggleExpanded(box.id)}
              >
                {/* Top row - Image, name, and expand indicator */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Image thumbnail - larger on mobile */}
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                      {box.images && box.images.length > 0 ? (
                        <Image
                          src={box.images[0]}
                          alt={box.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-slate-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 4h16v16H4z" />
                          </svg>
                        </div>
                      )}
                    </div>

                     {/* Name and main status */}
                     <div className="flex-1 min-w-0">
                       <h3 className="text-h3 font-semibold text-slate-900 mb-1 leading-tight">
                         {box.name}
                       </h3>
                       {/* Status badge - larger on mobile */}
                       <div
                         className={cn(
                           "inline-flex px-3 py-1.5 rounded-full text-sm font-medium",
                           isAvailable ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"
                         )}
                       >
                         {isAvailable
                           ? `${availableQuantity} ledig${availableQuantity === 1 ? "" : "e"}`
                           : "Opptatt"}
                       </div>
                     </div>
                  </div>

                  {/* Expand chevron - purely visual indicator */}
                  <div className="p-2 ml-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-6 w-6 text-slate-400 transition-transform duration-200" />
                    ) : (
                      <ChevronRightIcon
                        className="h-6 w-6 text-slate-400 transition-transform duration-200"
                        data-cy="expand-box"
                      />
                    )}
                  </div>
                </div>

                {/* Price row - prominent on mobile */}
                <div className="mb-3">
                  <div className="text-h2 font-bold text-indigo-600 mb-1">
                    {formatPrice(box.price)}/mnd
                  </div>
                  {(box.size || box.maxHorseSize) && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Detaljer</h4>
                      <div className="flex items-start space-x-4 text-sm text-slate-600">
                        {box.size && (
                          <span className="flex items-center">
                            <span className="font-medium">Størrelse:</span>
                            <span className="ml-1 font-normal">
                              {formatBoxSize(box.size)}

                              {/* <InformationCircleIcon className="h-5 w-5 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600" /> */}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open("/hjelp/storrelser#boks-storrelse", "_blank");
                              }}
                              title="Les mer om boksstørrelser"
                            >
                              <InformationCircleIcon className="h-5 w-5 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600" />
                            </button>
                          </span>
                        )}
                        {box.maxHorseSize && (
                          <span className="flex items-center flex-wrap">
                            <span className="font-medium">Hestestørrelse:</span>
                            <span className="ml-1 font-normal">
                              {formatHorseSize(box.maxHorseSize)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open("/hjelp/storrelser#heste-storrelse", "_blank");
                              }}
                              title="Les mer om hestestørrelser"
                            >
                              <InformationCircleIcon className="h-5 w-5 sm:h-4 sm:w-4 text-slate-400 hover:text-slate-600" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                 {/* Status badges row */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     {box.isSponsored && (
                       <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                         ⭐ Fremhevet ({box.boostDaysRemaining || 0}d)
                       </div>
                     )}
                   </div>
                   <FavoriteCount
                     entityType="BOX"
                     entityId={box.id}
                     className="text-xs"
                     showZero={true}
                   />
                 </div>
              </div>

              {/* Desktop Layout - Only chevron clickable */}
              <div className="hidden sm:flex items-center justify-between p-5">
                {/* Left side - Box info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Image thumbnail */}
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {box.images && box.images.length > 0 ? (
                      <Image
                        src={box.images[0]}
                        alt={box.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-slate-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M4 4h16v16H4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Box details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{box.name}</h3>
                      {/* Status indicator */}
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          isAvailable ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {isAvailable
                          ? `${availableQuantity} ledig${availableQuantity === 1 ? "" : "e"}`
                          : "Opptatt"}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="font-semibold text-indigo-600">
                        {formatPrice(box.price)}/mnd
                      </span>
                      {box.size && (
                        <span className="flex items-center">
                          <span className="font-semibold">Størrelse:</span>
                          <span className="ml-1">{formatBoxSize(box.size)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open("/hjelp/storrelser#boks-storrelse", "_blank");
                            }}
                            className="ml-1 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
                            title="Les mer om boksstørrelser"
                          >
                            <InformationCircleIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                          </button>
                        </span>
                      )}
                      {box.maxHorseSize && (
                        <span className="flex items-center">
                          <span className="font-semibold">Hestestørrelse:</span>
                          <span className="ml-1">{formatHorseSize(box.maxHorseSize)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open("/hjelp/storrelser#heste-storrelse", "_blank");
                            }}
                            className="ml-1 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
                            title="Les mer om hestestørrelser"
                          >
                            <InformationCircleIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Status badges and actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Advertising status - removed */}

                  {/* Boost status */}
                  {box.isSponsored && (
                    <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                      ⭐ {box.boostDaysRemaining || 0}d
                    </div>
                  )}

                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpanded(box.id)}
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
                  {box.description && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Beskrivelse</h4>
                      <div className="text-sm text-slate-600">
                        <div className="sm:hidden">
                          {/* Mobile - show less text */}
                          {box.description.length > 60 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(box.id)
                                  ? box.description
                                  : `${box.description.substring(0, 70)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(box.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(box.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {box.description}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:block">
                          {/* Desktop - show more text */}
                          {box.description.length > 120 ? (
                            <div>
                              <p className="leading-relaxed break-words overflow-hidden">
                                {expandedDescriptions.has(box.id)
                                  ? box.description
                                  : `${box.description.substring(0, 120)}...`}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDescriptionExpanded(box.id);
                                }}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                {expandedDescriptions.has(box.id) ? "Vis mindre" : "Vis mer"}
                              </button>
                            </div>
                          ) : (
                            <p className="leading-relaxed break-words overflow-hidden">
                              {box.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Notes */}
                  {box.specialNotes && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">
                        Spesielle merknader
                      </h4>
                      <div className="text-sm text-slate-600">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="sm:hidden">
                            {/* Mobile - show less text */}
                            {box.specialNotes.length > 60 ? (
                              <div>
                                <p className="leading-relaxed break-words overflow-hidden">
                                  {expandedSpecialNotes.has(box.id)
                                    ? box.specialNotes
                                    : `${box.specialNotes.substring(0, 60)}...`}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSpecialNotesExpanded(box.id);
                                  }}
                                  className="mt-2 text-amber-700 hover:text-amber-900 text-sm font-medium"
                                >
                                  {expandedSpecialNotes.has(box.id) ? "Vis mindre" : "Vis mer"}
                                </button>
                              </div>
                            ) : (
                              <p className="leading-relaxed break-words overflow-hidden">
                                {box.specialNotes}
                              </p>
                            )}
                          </div>
                          <div className="hidden sm:block">
                            {/* Desktop - show more text */}
                            {box.specialNotes.length > 120 ? (
                              <div>
                                <p className="leading-relaxed break-words overflow-hidden">
                                  {expandedSpecialNotes.has(box.id)
                                    ? box.specialNotes
                                    : `${box.specialNotes.substring(0, 120)}...`}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSpecialNotesExpanded(box.id);
                                  }}
                                  className="mt-2 text-amber-700 hover:text-amber-900 text-sm font-medium"
                                >
                                  {expandedSpecialNotes.has(box.id) ? "Vis mindre" : "Vis mer"}
                                </button>
                              </div>
                            ) : (
                              <p className="leading-relaxed break-words overflow-hidden">
                                {box.specialNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {boxWithAmenities.amenities && boxWithAmenities.amenities.length > 0 && (
                    <div className="px-1">
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Fasiliteter</h4>
                      <div className="flex flex-wrap gap-2">
                        {boxWithAmenities.amenities.map((amenityLink, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-violet-50 text-violet-700 text-sm rounded-lg border border-violet-200"
                          >
                            {amenityLink.amenity.name}
                          </span>
                        ))}
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
                      {/* Quantity controls */}
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">Antall ledige:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQuantity(box.id, -1);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-700 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{availableQuantity}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateQuantity(box.id, +1);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Edit */}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBox(box);
                        }}
                        startIcon={<PencilIcon className="h-4 w-4" />}
                        sx={{
                          textTransform: "none",
                          borderRadius: "0.75rem",
                          fontSize: "0.875rem",
                          minHeight: "2.5rem",
                          "@media (max-width: 640px)": {
                            minHeight: "3rem",
                            fontSize: "1rem",
                          },
                        }}
                      >
                        Rediger
                      </Button>

                      {/* Boost */}
                      {!box.isSponsored && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoost(box.id, box.name);
                          }}
                          startIcon={<SparklesIcon className="h-4 w-4" />}
                          sx={{
                            textTransform: "none",
                            borderRadius: "0.75rem",
                            fontSize: "0.875rem",
                            minHeight: "2.5rem",
                            background: "linear-gradient(45deg, #8b5cf6, #ec4899)",
                            "@media (max-width: 640px)": {
                              minHeight: "3rem",
                              fontSize: "1rem",
                            },
                          }}
                        >
                          Boost til topp
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBox(box.id);
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
                          },
                        }}
                      >
                        {deleteConfirmId === box.id ? "Bekreft" : "Slett"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
