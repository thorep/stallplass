'use client';

import StableMap from '@/components/molecules/StableMap';
import { StableWithBoxStats } from '@/types/stable';

interface StableMapSectionProps {
  stable: StableWithBoxStats;
}

export default function StableMapSection({ stable }: StableMapSectionProps) {
  // Only render if coordinates are available
  if (!stable.latitude || !stable.longitude) {
    return null;
  }

  return (
    <div className="p-6 border-t border-slate-100">
      <h4 className="text-lg font-semibold text-slate-900 mb-4">Kart</h4>
      <StableMap
        latitude={stable.latitude}
        longitude={stable.longitude}
        stallName={stable.name}
        address={stable.address || `${stable.postal_code} ${stable.city}`}
        className="w-full h-64"
      />
    </div>
  );
}