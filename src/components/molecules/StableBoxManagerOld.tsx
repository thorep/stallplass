"use client";

import Button from "@/components/atoms/Button";
import AvailabilityDateModal from "@/components/organisms/AvailabilityDateModal";
import BoxManagementModal from "@/components/organisms/BoxManagementModal";
import SmartBoxList from "@/components/molecules/SmartBoxList";
import {
  useUpdateBoxAvailabilityDate,
} from "@/hooks/useBoxMutations";
import { Box, StableWithBoxStats } from "@/types/stable";
import {
  BuildingOfficeIcon,
  PlusIcon,
  SpeakerWaveIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
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
  const [availabilityModalBox, setAvailabilityModalBox] = useState<Box | null>(null);
  const [showFreeNotice, setShowFreeNotice] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("stableBoxManagerNoticeDismissed");
    }
    return true;
  });

  const updateBoxAvailabilityDate = useUpdateBoxAvailabilityDate();

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
                      
                      if (unadvertisedBoxIds.length > 0) {
                        const params = new URLSearchParams({
                          boxIds: unadvertisedBoxIds.join(","),
                          stableName: stable.name,
                        });
                        window.location.href = `/dashboard/advertising/bulk?${params.toString()}`;
                      }
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

        <SmartBoxList
          stable={stable}
          boxes={boxes}
          boxesLoading={boxesLoading}
          onEditBox={handleEditBox}
          onSetAvailabilityDate={handleSetAvailabilityDate}
          onRefetchBoxes={onRefetchBoxes}
        />
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
