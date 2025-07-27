'use client';

import { useState, useEffect } from 'react';
import { StableWithBoxStats } from '@/types/stable';
import { useBoxesByStable } from '@/hooks/useBoxes';
import { useBoxes as useBoxesRealTime } from '@/hooks/useBoxQueries';
import FAQSuggestionBanner from '@/components/molecules/FAQSuggestionBanner';
import StableOverviewCard from '@/components/molecules/StableOverviewCard';
import StableImageGallery from '@/components/molecules/StableImageGallery';
import StableStatsCard from '@/components/molecules/StableStatsCard';
import StableBoxManager from '@/components/molecules/StableBoxManager';
import StableAdvertisingManager from '@/components/molecules/StableAdvertisingManager';
import StableMapSection from '@/components/molecules/StableMapSection';

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stable_id: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({ stable, onDelete, deleteLoading }: StableManagementCardProps) {
  const { data: staticBoxes = [], isLoading: boxesLoading, refetch: refetchBoxes } = useBoxesByStable(stable.id);
  
  // Use real-time boxes for this stable
  const { data: realTimeBoxes = [] } = useBoxesRealTime(stable.id, 30000);
  
  // Use real-time boxes if available and populated, otherwise fall back to static data
  // This ensures we always show the most up-to-date data
  const boxes = realTimeBoxes && realTimeBoxes.length > 0 ? realTimeBoxes : (staticBoxes || []);
  
  // FAQ state
  const [faqCount, setFaqCount] = useState<number | null>(null);

  const totalBoxes = boxes?.length || 0;

  // Fetch FAQ count for this stable
  useEffect(() => {
    const fetchFAQCount = async () => {
      try {
        const response = await fetch(`/api/stables/${stable.id}/faqs`);
        if (response.ok) {
          const faqs = await response.json();
          setFaqCount(faqs.length);
        }
      } catch {
        // Error fetching FAQ count
        setFaqCount(0);
      }
    };
    
    fetchFAQCount();
  }, [stable.id]);

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

      {/* Advertising Manager */}
      <StableAdvertisingManager 
        stable={stable} 
        totalBoxes={totalBoxes} 
        onRefetchBoxes={refetchBoxes} 
      />

      {/* FAQ Suggestion Banner */}
      {faqCount === 0 && (
        <div className="px-6">
          <FAQSuggestionBanner stableId={stable.id} stableName={stable.name} />
        </div>
      )}

      {/* Box Management */}
      <StableBoxManager 
        stable={stable} 
        boxes={boxes || []} 
        boxesLoading={boxesLoading} 
        onRefetchBoxes={refetchBoxes} 
      />
      
      {/* Map Section */}
      <StableMapSection stable={stable} />
    </div>
  );
}