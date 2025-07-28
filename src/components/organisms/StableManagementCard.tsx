'use client';

import React from 'react';
import { StableWithBoxStats } from '@/types/stable';
import { useBoxesByStable } from '@/hooks/useBoxes';
import { useBoxes as useBoxesRealTime } from '@/hooks/useBoxQueries';
import { useGetFAQsByStable } from '@/hooks/useFAQs';
import FAQSuggestionBanner from '@/components/molecules/FAQSuggestionBanner';
import StableOverviewCard from '@/components/molecules/StableOverviewCard';
import StableImageGallery from '@/components/molecules/StableImageGallery';
import StableStatsCard from '@/components/molecules/StableStatsCard';
import StableBoxManager from '@/components/molecules/StableBoxManager';
import StableAdvertisingManager from '@/components/molecules/StableAdvertisingManager';
import StableMapSection from '@/components/molecules/StableMapSection';
import StableFAQDisplay from '@/components/molecules/StableFAQDisplay';

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stable_id: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({ stable, onDelete, deleteLoading }: StableManagementCardProps) {
  const { data: staticBoxes = [], isLoading: boxesLoading, refetch: refetchBoxes } = useBoxesByStable(stable.id);
  
  // Use real-time boxes for this stable
  const { data: realTimeBoxes = [] } = useBoxesRealTime(stable.id, 30000);
  
  // Prioritize static boxes (which get refetched immediately) over real-time boxes
  // Real-time boxes are only used if static boxes are empty and real-time has data
  // This ensures newly created boxes appear immediately after refetch
  const boxes = (staticBoxes && staticBoxes.length > 0) 
    ? staticBoxes 
    : (realTimeBoxes || []);
  
  // Use TanStack Query hook for FAQs
  const { data: faqs = [] } = useGetFAQsByStable(stable.id);
  const faqCount = faqs.length;

  const totalBoxes = boxes?.length || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <StableOverviewCard 
        stable={stable} 
        onDelete={onDelete} 
        deleteLoading={deleteLoading} 
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
      {faqCount > 0 ? (
        <StableFAQDisplay stableId={stable.id} stableName={stable.name} />
      ) : (
        <div className="px-6">
          <FAQSuggestionBanner stableId={stable.id} stableName={stable.name} />
        </div>
      )}

      {/* Box Management with integrated advertising controls */}
      <StableBoxManager 
        stable={stable} 
        boxes={boxes || []} 
        boxesLoading={boxesLoading} 
        onRefetchBoxes={refetchBoxes} 
        advertisingManager={
          <StableAdvertisingManager 
            stable={stable} 
            totalBoxes={totalBoxes} 
            onRefetchBoxes={refetchBoxes}
            boxes={boxes}
          />
        }
      />
      
      {/* Map Section */}
      <StableMapSection stable={stable} />
    </div>
  );
}