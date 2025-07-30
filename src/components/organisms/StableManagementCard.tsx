"use client";

import StableBoxManager from "@/components/molecules/StableBoxManager";
import StableFAQDisplay from "@/components/molecules/StableFAQDisplay";
import StableImageGallery from "@/components/molecules/StableImageGallery";
import StableMapSection from "@/components/molecules/StableMapSection";
import StableOverviewCard from "@/components/molecules/StableOverviewCard";
import StableStatsCard from "@/components/molecules/StableStatsCard";
import { useBoxesByStable } from "@/hooks/useBoxes";
import { useBoxes as useBoxesRealTime } from "@/hooks/useBoxQueries";
import { useGetFAQsByStable } from "@/hooks/useFAQs";
import { StableWithBoxStats } from "@/types/stable";
import React, { useState } from "react";
import Button from "@/components/atoms/Button";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import FAQManagementModal from "@/components/organisms/FAQManagementModal";

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stable_id: string, stable_name: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({
  stable,
  onDelete,
  deleteLoading,
}: StableManagementCardProps) {
  const [showFAQModal, setShowFAQModal] = useState(false);
  
  const {
    data: staticBoxes = [],
    isLoading: boxesLoading,
    refetch: refetchBoxes,
  } = useBoxesByStable(stable.id);

  // Use real-time boxes for this stable
  const { data: realTimeBoxes = [] } = useBoxesRealTime(stable.id, 30000);

  // Prioritize static boxes (which get refetched immediately) over real-time boxes
  // Real-time boxes are only used if static boxes are empty and real-time has data
  // This ensures newly created boxes appear immediately after refetch
  const boxes = staticBoxes && staticBoxes.length > 0 ? staticBoxes : realTimeBoxes || [];

  // Use TanStack Query hook for FAQs
  const { data: faqs = [] } = useGetFAQsByStable(stable.id);
  const faqCount = faqs.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <StableOverviewCard stable={stable} onDelete={onDelete} deleteLoading={deleteLoading} />
      {/* Images Gallery */}
      <StableImageGallery
        stable={stable}
        onImagesUpdated={() => {
          // Optionally trigger a refetch of stable data to keep everything in sync
          // For now, the component handles its own optimistic updates
        }}
      />
      {/* Stats */}
      <StableStatsCard stable={stable} boxes={boxes || []} />
      {/* FAQ Section */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-slate-600" />
            <h4 className="text-lg font-semibold text-slate-900">
              FAQ ({faqCount})
            </h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFAQModal(true)}
            className="flex items-center gap-1"
            data-cy="add-faq-button"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Administrer FAQ</span>
          </Button>
        </div>
        
        {faqCount > 0 ? (
          <StableFAQDisplay stableId={stable.id} stableName={stable.name} />
        ) : (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 text-center">
              Ingen FAQs lagt til ennå. Klikk &quot;Administrer FAQ&quot; for å legge til ofte stilte spørsmål.
            </p>
          </div>
        )}
      </div>
      {/* Box Management */}
      <StableBoxManager
        stable={stable}
        boxes={boxes || []}
        boxesLoading={boxesLoading}
        onRefetchBoxes={refetchBoxes}
      />
      {/* Map Section */}
      <StableMapSection stable={stable} />
      
      {/* FAQ Management Modal */}
      <FAQManagementModal
        stableId={stable.id}
        stableName={stable.name}
        isOpen={showFAQModal}
        onClose={() => setShowFAQModal(false)}
      />
    </div>
  );
}
