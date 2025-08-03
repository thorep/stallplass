"use client";

import Button from "@/components/atoms/Button";
import BoxManagementModal from "@/components/organisms/BoxManagementModal";
import AvailabilityDateModal from "@/components/organisms/AvailabilityDateModal";
import { useDeleteBox, useUpdateBoxAvailabilityStatus, useUpdateBoxAvailabilityDate } from "@/hooks/useBoxMutations";
import { Box, BoxWithAmenities, StableWithBoxStats } from "@/types/stable";
import { formatPrice } from "@/utils/formatting";
import {
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  SpeakerWaveIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { toast } from 'sonner';
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
    // Trigger refetch immediately
    await onRefetchBoxes();

    // Close modal after refetch completes
    setShowBoxModal(false);
    setSelectedBox(null);
  };

  const handleToggleBoxAvailable = async (boxId: string, isAvailable: boolean) => {
    // Check for conflicts if trying to make unavailable
    if (!isAvailable) {
      // We'll use a simple approach here - you could also use the conflict prevention hook
      // for each box individually if needed
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
          availabilityDate: null
        });
      }
    } catch {
      toast.error("Feil ved oppdatering av tilgjengelighet. Prøv igjen.");
    }
  };

  const toggleAmenities = (boxId: string) => {
    setExpandedAmenities(prev => ({
      ...prev,
      [boxId]: !prev[boxId]
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
      await onRefetchBoxes(); // Refresh the boxes list
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting box:", error);
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

  const handleSelectAll = () => {
    const unadvertisedBoxIds = boxes.filter((box) => !box.advertisingActive).map((box) => box.id);

    if (selectedBoxIds.length === unadvertisedBoxIds.length) {
      setSelectedBoxIds([]);
    } else {
      setSelectedBoxIds(unadvertisedBoxIds);
    }
  };

  const handleBulkAdvertisingPurchase = () => {
    if (selectedBoxIds.length > 0) {
      const params = new URLSearchParams({
        boxIds: selectedBoxIds.join(","),
        stableName: stable.name,
      });
      window.location.href = `/dashboard/advertising/bulk?${params.toString()}`;
    }
  };

  const handleSetAvailabilityDate = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      setAvailabilityModalBox(box);
    }
  };

  const handleSaveAvailabilityDate = async (date: string | null) => {
    if (!availabilityModalBox) return;

    try {
      await updateBoxAvailabilityDate.mutateAsync({
        boxId: availabilityModalBox.id,
        availabilityDate: date
      });
      
      // Close modal and refresh boxes
      setAvailabilityModalBox(null);
      await onRefetchBoxes();
    } catch (error) {
      console.error('Failed to update availability date:', error);
      toast.error('Feil ved oppdatering av tilgjengelighetsdato. Prøv igjen.');
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
              <p className="text-sm text-slate-600 mt-1">
                Administrer og rediger dine stallbokser nedenfor
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleAddBox}
              data-cy="add-box-button"
              className="min-h-[44px] px-4 py-2 flex items-center text-sm sm:text-base"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Legg til boks
            </Button>
          </div>

          {/* Bulk actions bar */}
          {boxes.some((box) => !box.advertisingActive) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium border border-slate-300 hover:border-slate-400 rounded-md transition-colors duration-200"
                >
                  {selectedBoxIds.length === boxes.filter((box) => !box.advertisingActive).length
                    ? "Fjern alle valg"
                    : "Velg alle uten annonsering"}
                </button>
                {selectedBoxIds.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {selectedBoxIds.length} boks{selectedBoxIds.length !== 1 ? "er" : ""} valgt
                  </span>
                )}
              </div>
              {selectedBoxIds.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkAdvertisingPurchase}
                  className="flex items-center gap-2"
                >
                  <SpeakerWaveIcon className="h-4 w-4" />
                  Kjøp annonsering for {selectedBoxIds.length} boks
                  {selectedBoxIds.length !== 1 ? "er" : ""}
                </Button>
              )}
            </div>
          )}
        </div>

        {boxesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-500 mt-2">Laster bokser...</p>
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Ingen bokser registrert ennå</p>
            <Button variant="primary" onClick={handleAddBox} data-cy="add-first-box-button">
              Legg til din første boks
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                      {formatPrice(box.price)}
                      <span className="text-sm font-normal text-slate-500">/mnd</span>
                    </div>
                    {box.size && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Størrelse:</span> {box.size} m²
                      </p>
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
                  {!box.isAvailable && (box as Box & { availabilityDate?: Date | string }).availabilityDate && (
                    <div className="mb-4">
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium text-amber-800">
                            Ledig fra: {new Date((box as Box & { availabilityDate?: Date | string }).availabilityDate!).toLocaleDateString("nb-NO")}
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
{(box as Box & { availabilityDate?: Date | string }).availabilityDate ? "Endre ledig dato" : "Angi ledig dato"}
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
        )}
      </div>

      {/* Box Modal */}
      {showBoxModal && (
        <BoxManagementModal
          stableId={stable.id}
          box={selectedBox}
          onClose={() => setShowBoxModal(false)}
          onSave={handleBoxSaved}
        />
      )}

      {/* Availability Date Modal */}
      {availabilityModalBox && (
        <AvailabilityDateModal
          boxName={availabilityModalBox.name}
          currentDate={(availabilityModalBox as Box & { availabilityDate?: Date | string }).availabilityDate 
            ? new Date((availabilityModalBox as Box & { availabilityDate?: Date | string }).availabilityDate!).toISOString().split('T')[0]
            : null}
          isOpen={!!availabilityModalBox}
          onClose={() => setAvailabilityModalBox(null)}
          onSave={handleSaveAvailabilityDate}
          loading={updateBoxAvailabilityDate.isPending}
        />
      )}
    </>
  );
}
