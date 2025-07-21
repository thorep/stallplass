'use client';

import { useState, useEffect } from 'react';
import { StableWithBoxStats } from '@/types/stable';
import { useBoxes } from '@/hooks/useQueries';
import { useRealTimeBoxes } from '@/hooks/useRealTimeBoxes';
import FAQSuggestionBanner from '@/components/molecules/FAQSuggestionBanner';
import StableOverviewCard from '@/components/molecules/StableOverviewCard';
import StableImageGallery from '@/components/molecules/StableImageGallery';
import StableStatsCard from '@/components/molecules/StableStatsCard';
import StableBoxManager from '@/components/molecules/StableBoxManager';
import StableAdvertisingManager from '@/components/molecules/StableAdvertisingManager';
import StableMapSection from '@/components/molecules/StableMapSection';

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stall_id: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({ stable, onDelete, deleteLoading }: StableManagementCardProps) {
  const { data: staticBoxes = [], isLoading: boxesLoading, refetch: refetchBoxes } = useBoxes(stable.id);
  
  // Use real-time boxes for this stable
  const { boxes: realTimeBoxes } = useRealTimeBoxes({
    stableId: stable.id,
    enabled: true
  });
  
  // Use real-time boxes if available, otherwise fall back to static data
  const boxes = realTimeBoxes.length > 0 ? realTimeBoxes : staticBoxes;
  
  // FAQ state
  const [faqCount, setFaqCount] = useState<number | null>(null);

  const totalBoxes = boxes.length;

  // Fetch FAQ count for this stable
  useEffect(() => {
    const fetchFAQCount = async () => {
      try {
        const response = await fetch(`/api/stables/${stable.id}/faqs`);
        if (response.ok) {
          const faqs = await response.json();
          setFaqCount(faqs.length);
        }
      } catch (error) {
        console.error('Error fetching FAQ count:', error);
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
      <StableImageGallery stable={stable} />

      {/* Stats */}
      <StableStatsCard stable={stable} boxes={boxes} />

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
        boxes={boxes} 
        boxesLoading={boxesLoading} 
        onRefetchBoxes={refetchBoxes} 
      />
      
      {/* Map Section */}
      <StableMapSection stable={stable} />
    </div>
  );
}