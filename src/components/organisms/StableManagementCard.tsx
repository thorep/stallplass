"use client";

import Button from "@/components/atoms/Button";
import ConfirmModal from "@/components/molecules/ConfirmModal";
import StableBoxManager from "@/components/molecules/StableBoxManager";
import StableFAQDisplay from "@/components/molecules/StableFAQDisplay";
import StableImageGallery from "@/components/molecules/StableImageGallery";
import StableMapSection from "@/components/molecules/StableMapSection";
import StableOverviewCard from "@/components/molecules/StableOverviewCard";
import StableStatsCard from "@/components/molecules/StableStatsCard";
import FAQManagementModal from "@/components/organisms/FAQManagementModal";
import { useBoxesByStable } from "@/hooks/useBoxes";
import { useBoxes as useBoxesRealTime } from "@/hooks/useBoxQueries";
import { useGetFAQsByStable } from "@/hooks/useFAQs";
import { useDeleteStable } from "@/hooks/useStableMutations";
import { StableWithBoxStats } from "@/types/stable";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";

interface StableManagementCardProps {
  readonly stable: StableWithBoxStats;
  readonly userId: string;
}

export default function StableManagementCard({ stable, userId }: StableManagementCardProps) {
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Handle deletion internally
  const deleteStableMutation = useDeleteStable();

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

  // Handle deletion
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStableMutation.mutateAsync(stable.id);
      setShowDeleteModal(false);
      // TanStack Query automatically invalidates and updates all related queries
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <StableOverviewCard
        stable={stable}
        onDelete={handleDeleteClick}
        deleteLoading={deleteStableMutation.isPending}
        userId={userId}
      />

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
      <div className="px-4 py-4 sm:px-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-slate-600" />
            <h4 className="text-lg font-semibold text-slate-900">FAQ ({faqCount})</h4>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFAQModal(true)}
            className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
            data-cy="add-faq-button"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
            <span>Administrer FAQ</span>
          </Button>
        </div>

        {faqCount > 0 ? (
          <StableFAQDisplay stableId={stable.id} />
        ) : (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 text-center">
              Ingen FAQs lagt til ennå. Klikk &quot;Administrer FAQ&quot; for å legge til ofte
              stilte spørsmål.
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
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Slett stall"
        message={`Er du sikker på at du vil slette stallen "${stable.name}"? Denne handlingen kan ikke angres og vil også slette alle tilhørende bokser.`}
        confirmText="Slett stall"
        loading={deleteStableMutation.isPending}
      />
    </div>
  );
}
