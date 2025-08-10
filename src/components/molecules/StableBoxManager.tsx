"use client";

import Button from "@/components/atoms/Button";
import SmartBoxList from "@/components/molecules/SmartBoxList";
import AvailabilityDateModal from "@/components/organisms/AvailabilityDateModal";
import BoxManagementModal from "@/components/organisms/BoxManagementModal";
import { useUpdateBoxAvailabilityDate } from "@/hooks/useBoxMutations";
import { Box, StableWithBoxStats } from "@/types/stable";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

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
    onRefetchBoxes();
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
      onRefetchBoxes();
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
