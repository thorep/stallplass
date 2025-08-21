"use client";

import { Button } from "@/components/ui/button";
import SmartBoxList from "@/components/molecules/SmartBoxList";
import BoxManagementModal from "@/components/organisms/BoxManagementModal";
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

  return (
    <>
      <div className="px-3 py-6 sm:px-6">
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
              <p className="text-sm text-slate-600 mt-1">
                Administrer og rediger dine stallbokser nedenfor. Når noen sender deg en melding på
                stallboksen vil vi sende deg en epost.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="default"
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

    </>
  );
}
