'use client';

import { useGetStables } from '@/hooks/useStables';
import StableListingCard from '@/components/molecules/StableListingCard';

export default function StablesList() {
  const { data: stables = [], isLoading, error } = useGetStables();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Laster staller...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-red-600 mb-4">
          Kunne ikke laste staller. Prøv igjen.
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800"
        >
          Last på nytt
        </button>
      </div>
    );
  }

  if (stables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          Ingen staller funnet
        </div>
        <p className="text-gray-400">
          Prøv å justere søkekriteriene dine
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stables.map((stable) => (
        <StableListingCard key={stable.id} stable={stable} />
      ))}
    </div>
  );
}