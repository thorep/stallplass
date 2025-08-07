"use client";

import Button from "@/components/atoms/Button";
import AvailabilityDateModal from "@/components/organisms/AvailabilityDateModal";
import BoxManagementModal from "@/components/organisms/BoxManagementModal";
import SmartBoxList from "@/components/molecules/SmartBoxList";
import {
  useDeleteBox,
  useUpdateBoxAvailabilityDate,
  useUpdateBoxAvailabilityStatus,
} from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities, StableWithBoxStats } from "@/types/stable";
import { formatBoxSize, formatPrice } from "@/utils/formatting";
import {
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  SpeakerWaveIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { useNewOldMineStallerDesignFlag } from "@/hooks/useFlags";
// import { updateBoxAvailabilityDate } from '@/services/box-service'; // TODO: Create API endpoint for availability date updates

interface StableBoxManagerProps {
  stable: StableWithBoxStats;
  boxes: Box[];
  boxesLoading: boolean;
  onRefetchBoxes: () => void;
}

export default function StableBoxManager({
  stable,
  boxes,
  boxesLoading,
  onRefetchBoxes,
}: StableBoxManagerProps) {
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [expandedAmenities, setExpandedAmenities] = useState<{ [boxId: string]: boolean }>({});
  const [availabilityModalBox, setAvailabilityModalBox] = useState<Box | null>(null);
  const [showFreeNotice, setShowFreeNotice] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("stableBoxManagerNoticeDismissed");
    }
    return true;
  });

  // Get the feature flag
  const { useNewDesign } = useNewOldMineStallerDesignFlag();

  const updateBoxAvailability = useUpdateBoxAvailabilityStatus();
  const updateBoxAvailabilityDate = useUpdateBoxAvailabilityDate();
  const deleteBox = useDeleteBox();

  const handleAddBox = () => {
    setSelectedBox(null);
    setShowBoxModal(true);
  };

  const handleEditBox = (box: Box) => {
    setSelectedBox(box);
    setShowBoxModal(true);
  };

  const handleBoxSaved = async () => {
    await onRefetchBoxes();
    setShowBoxModal(false);
    setSelectedBox(null);
  };

  const handleToggleBoxAvailable = async (boxId: string, isAvailable: boolean) => {
    // Check for conflicts if trying to make unavailable
    if (!isAvailable) {
      const hasRental = false; // This would come from rental data

      if (hasRental) {
        toast.error("Kan ikke markere boksen som utilgjengelig da den har et aktivt leieforhold.");
        return;
      }
    }

    try {
      await updateBoxAvailability.mutateAsync({ boxId, isAvailable });

      // If marking as available, clear the availability date
      if (isAvailable) {
        await updateBoxAvailabilityDate.mutateAsync({
          boxId,
          availabilityDate: null,
        });
      }
    } catch {
      toast.error("Feil ved oppdatering av tilgjengelighet. Prøv igjen.");
    }
  };

  const toggleAmenities = (boxId: string) => {
    setExpandedAmenities((prev) => ({
      ...prev,
      [boxId]: !prev[boxId],
    }));
  };

  const handleSponsoredPlacement = (boxId: string, boxName: string) => {
    const params = new URLSearchParams({
      boxId,
      boxName,
      stableName: stable.name,
    });
    window.location.href = `/dashboard/boost/single?${params.toString()}`;
  };

  const handleDeleteBox = async (boxId: string) => {
    if (deleteConfirmId !== boxId) {
      setDeleteConfirmId(boxId);
      return;
    }

    try {
      await deleteBox.mutateAsync(boxId);
      await onRefetchBoxes();
      setDeleteConfirmId(null);
    } catch {
      toast.error("Feil ved sletting av boks. Prøv igjen.");
      setDeleteConfirmId(null);
    }
  };

  const handleToggleBoxSelection = (boxId: string) => {
    setSelectedBoxIds((prev) => {
      if (prev.includes(boxId)) {
        return prev.filter((id) => id !== boxId);
      } else {
        return [...prev, boxId];
      }
    });
  };

  const handleBulkAdvertisingPurchase = (boxIds?: string[]) => {
    const idsToUse = boxIds || selectedBoxIds;
    if (idsToUse.length > 0) {
      const params = new URLSearchParams({
        boxIds: idsToUse.join(","),
        stableName: stable.name,
      });
      window.location.href = `/dashboard/advertising/bulk?${params.toString()}`;
    }
  };

  const handleSetAvailabilityDate = (boxId: string) => {
    const box = boxes.find((b) => b.id === boxId);
    if (box) {
      setAvailabilityModalBox(box);
    }
  };

  const handleSaveAvailabilityDate = async (date: string | null) => {
    if (!availabilityModalBox) return;

    try {
      await updateBoxAvailabilityDate.mutateAsync({
        boxId: availabilityModalBox.id,
        availabilityDate: date,
      });

      setAvailabilityModalBox(null);
      await onRefetchBoxes();
    } catch {
      // Error handling in SmartBoxList
    }
  };

  return (
    <>
      <div className="px-3 py-6 sm:px-6">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
              <p className="text-sm text-slate-600 mt-1">
                Administrer og rediger dine stallbokser nedenfor
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="primary"
                onClick={handleAddBox}
                data-cy="add-box-button"
                className="w-full sm:w-auto min-h-[44px] text-sm"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="whitespace-nowrap">Legg til stallplass</span>
              </Button>
            </div>
          </div>

          {/* Free box creation notice */}
          {showFreeNotice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
              <button
                onClick={() => {
                  setShowFreeNotice(false);
                  localStorage.setItem("stableBoxManagerNoticeDismissed", "true");
                }}
                className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="Lukk melding"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="flex items-start pr-8">
                <svg
                  className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-800 mb-1">
                    Oppretting av stallplasser er helt gratis
                  </h5>
                  <p className="text-sm text-blue-700">
                    Legg til så mange stallplasser du vil uten kostnad. Du betaler kun når du
                    aktiverer annonsering for stallen din. Til da er alt gratis å bruke og sette
                    opp.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk actions bar */}
          {boxes.some((box) => !box.advertisingActive) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                {boxes.filter((box) => !box.advertisingActive).length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const unadvertisedBoxIds = boxes
                        .filter((box) => !box.advertisingActive)
                        .map((box) => box.id);
                      handleBulkAdvertisingPurchase(unadvertisedBoxIds);
                    }}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <SpeakerWaveIcon className="h-4 w-4" />
                    Kjøp annonsering for alle stallplasser
                  </Button>
                )}
              </div>
              <div className="text-sm text-slate-500 text-center sm:text-left">
                {boxes.filter((box) => !box.advertisingActive).length === 1
                  ? "1 boks mangler annonsering"
                  : `${
                      boxes.filter((box) => !box.advertisingActive).length
                    } bokser mangler annonsering`}
              </div>
            </div>
          )}
        </div>

{useNewDesign ? (
          <SmartBoxList
            stable={stable}
            boxes={boxes}
            boxesLoading={boxesLoading}
            onEditBox={handleEditBox}
            onSetAvailabilityDate={handleSetAvailabilityDate}
            onRefetchBoxes={onRefetchBoxes}
          />
        ) : (
          // Old card-based design
          boxesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-500 mt-2">Laster bokser...</p>
            </div>
          ) : boxes.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">Ingen bokser registrert ennå</p>
              <Button variant="primary" onClick={handleAddBox} data-cy="add-first-box-button">
                Legg til din første stallplass
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
                >
                  {/* Selection checkbox for unadvertised boxes */}
                  {!box.advertisingActive && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedBoxIds.includes(box.id)}
                        onChange={() => handleToggleBoxSelection(box.id)}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={`Velg ${box.name} for annonsering`}
                      />
                    </div>
                  )}

                  {/* Image Section */}
                  <div className="relative h-48 bg-slate-100">
                    {box.images && box.images.length > 0 ? (
                      <Image
                        src={box.images[0]}
                        alt={`${box.name}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 text-slate-400 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-slate-500">Ingen bilder</p>
                        </div>
                      </div>
                    )}

                    {/* Status badges and delete button */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                            box.isAvailable
                              ? "bg-emerald-500/90 text-white"
                              : "bg-red-500/90 text-white"
                          }`}
                        >
                          {box.isAvailable ? "Ledig" : "Opptatt"}
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          disabled={deleteBox.isPending}
                          className={`p-1.5 rounded-full transition-colors backdrop-blur-sm ${
                            deleteConfirmId === box.id
                              ? "bg-red-600/90 text-white hover:bg-red-700/90"
                              : "bg-white/90 text-slate-400 hover:text-red-600 hover:bg-red-50/90"
                          } disabled:opacity-50`}
                          data-cy={`delete-box-${box.id}`}
                          title={
                            deleteConfirmId === box.id
                              ? "Klikk for å bekrefte sletting"
                              : "Slett boks"
                          }
                        >
                          {deleteConfirmId === box.id ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {box.advertisingActive && (
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/90 text-white backdrop-blur-sm"
                          data-cy={`box-advertised-${box.id}`}
                        >
                          Annonsert ({box.advertisingDaysRemaining || 0} dager igjen)
                        </div>
                      )}
                      {box.isSponsored && (
                        <div
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/90 text-white backdrop-blur-sm"
                          data-cy={`box-boosted-${box.id}`}
                        >
                          ⭐ Boost aktiv ({box.boostDaysRemaining || 0} dager igjen)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{box.name}</h3>
                      <div className="text-2xl font-bold text-indigo-600 mb-3">
                        {formatPrice(box.price)}
                        <span className="text-sm font-normal text-slate-500">/mnd</span>
                      </div>
                      {box.size && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                />
                              </svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                                Størrelse
                              </span>
                              <span className="text-sm text-blue-900 font-semibold">
                                {formatBoxSize(box.size)}
                                {box.size === "SMALL" && " • ~9m²"}
                                {box.size === "MEDIUM" && " • ~12m²"}
                                {box.size === "LARGE" && " • ~16m²"}
                              </span>
                            </div>
                          </div>
                          {box.sizeText && (
                            <div className="pt-2 border-t border-blue-100">
                              <p className="text-xs text-blue-700">
                                <span className="font-medium">Notat:</span> {box.sizeText}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {box.maxHorseSize && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow mb-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                            <span className="text-lg">🐎</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-green-600 font-medium uppercase tracking-wider">
                              Maks hestestørrelse
                            </span>
                            <span className="text-sm text-green-900 font-semibold">
                              {box.maxHorseSize}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(expandedAmenities[box.id]
                          ? (box as BoxWithAmenities).amenities
                          : (box as BoxWithAmenities).amenities?.slice(0, 3)
                        )?.map((amenityLink: { amenity: { name: string } }, index: number) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200"
                          >
                            {amenityLink.amenity.name}
                          </span>
                        ))}
                        {(box as BoxWithAmenities).amenities &&
                          (box as BoxWithAmenities).amenities!.length > 3 && (
                            <button
                              onClick={() => toggleAmenities(box.id)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                              data-cy="toggle-amenities-button"
                            >
                              {expandedAmenities[box.id]
                                ? "Vis færre"
                                : `+${(box as BoxWithAmenities).amenities!.length - 3} flere`}
                            </button>
                          )}
                        {(!(box as BoxWithAmenities).amenities ||
                          (box as BoxWithAmenities).amenities?.length === 0) && (
                          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                            Ingen fasiliteter
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Availability Date */}
                    {!box.isAvailable &&
                      (box as Box & { availabilityDate?: Date | string }).availabilityDate && (
                        <div className="mb-4">
                          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-amber-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-sm font-medium text-amber-800">
                                Ledig fra:{" "}
                                {new Date(
                                  (
                                    box as Box & { availabilityDate?: Date | string }
                                  ).availabilityDate!
                                ).toLocaleDateString("nb-NO")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="space-y-2.5">
                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleToggleBoxAvailable(box.id, !box.isAvailable)}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            box.isAvailable
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200"
                          }`}
                          data-cy={
                            box.isAvailable ? `mark-rented-${box.id}` : `mark-available-${box.id}`
                          }
                        >
                          {box.isAvailable ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Marker utleid
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Marker ledig
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleEditBox(box)}
                          className="px-3 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                          data-cy={`edit-box-${box.id}`}
                        >
                          <PencilIcon className="w-4 h-4" />
                          Rediger
                        </button>
                      </div>

                      {/* Secondary Actions */}
                      {!box.isAvailable && (
                        <button
                          onClick={() => handleSetAvailabilityDate(box.id)}
                          className="w-full px-3 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {(box as Box & { availabilityDate?: Date | string }).availabilityDate
                            ? "Endre ledig dato"
                            : "Angi ledig dato"}
                        </button>
                      )}

                      {/* Advertising purchase */}
                      {!box.advertisingActive && (
                        <button
                          onClick={() => {
                            const params = new URLSearchParams({
                              boxId: box.id,
                              stableName: stable.name,
                            });
                            window.location.href = `/dashboard/advertising/single?${params.toString()}`;
                          }}
                          className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <SpeakerWaveIcon className="w-4 h-4" />
                          Kjøp annonsering
                        </button>
                      )}

                      {/* Sponsored placement - only show if box has advertising but no boost */}
                      {box.advertisingActive && !box.isSponsored && (
                        <button
                          onClick={() => handleSponsoredPlacement(box.id, box.name)}
                          className="w-full px-3 py-2.5 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          <SparklesIcon className="w-4 h-4" />
                          Boost til topp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Box Modal */}
      <BoxManagementModal
        stableId={stable.id}
        box={selectedBox}
        open={showBoxModal}
        onOpenChange={setShowBoxModal}
        onSave={handleBoxSaved}
      />

      {/* Availability Date Modal */}
      {availabilityModalBox && (
        <AvailabilityDateModal
          boxName={availabilityModalBox.name}
          currentDate={
            (availabilityModalBox as Box & { availabilityDate?: Date | string }).availabilityDate
              ? new Date(
                  (
                    availabilityModalBox as Box & { availabilityDate?: Date | string }
                  ).availabilityDate!
                )
                  .toISOString()
                  .split("T")[0]
              : null
          }
          isOpen={!!availabilityModalBox}
          onClose={() => setAvailabilityModalBox(null)}
          onSave={handleSaveAvailabilityDate}
          loading={updateBoxAvailabilityDate.isPending}
        />
      )}
    </>
  );
}
