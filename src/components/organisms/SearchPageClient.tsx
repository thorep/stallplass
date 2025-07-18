'use client';

import { useState } from 'react';
import { Stable } from '@/types/stable';
import { StableAmenity, BoxAmenity } from '@/types/amenity';
import SearchFilters from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';
import BoxListingCard from '@/components/molecules/BoxListingCard';

interface SearchPageClientProps {
  stables: Stable[];
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
}

type SearchMode = 'stables' | 'boxes';

export default function SearchPageClient({ 
  stables, 
  stableAmenities, 
  boxAmenities 
}: SearchPageClientProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>('stables');

  // Get all available boxes from all stables
  const allBoxes = stables.flatMap(stable => 
    stable.boxes?.filter(box => box.isAvailable && box.isActive)?.map(box => ({
      ...box,
      stable: {
        id: stable.id,
        name: stable.name,
        location: stable.location,
        ownerName: stable.ownerName,
        rating: stable.rating,
        reviewCount: stable.reviewCount
      }
    })) || []
  );

  const isStableMode = searchMode === 'stables';
  const currentItems = isStableMode ? stables : allBoxes;

  return (
    <>
      {/* Search Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSearchMode('stables')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'stables'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Søk staller
          </button>
          <button
            onClick={() => setSearchMode('boxes')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              searchMode === 'boxes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Søk bokser
          </button>
        </div>
      </div>

      {/* Mobile-first layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Mobile: Filters above results */}
        <div className="lg:col-span-1 order-1">
          <SearchFilters 
            stableAmenities={stableAmenities} 
            boxAmenities={boxAmenities}
            searchMode={searchMode}
          />
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 order-2">
          {/* Mobile-optimized controls */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              {currentItems.length} {isStableMode ? 'staller' : 'bokser'} funnet
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-500 hidden sm:block">Sorter etter:</label>
              <select className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 sm:flex-none">
                <option>Nyeste først</option>
                <option>Pris: Lav til høy</option>
                <option>Pris: Høy til lav</option>
                {isStableMode && <option>Flest ledige plasser</option>}
                <option>Høyest vurdert</option>
              </select>
            </div>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Ingen {isStableMode ? 'staller' : 'bokser'} funnet
              </div>
              <p className="text-gray-400">
                Prøv å justere søkekriteriene dine
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {isStableMode ? (
                stables.map((stable) => (
                  <StableListingCard key={stable.id} stable={stable} />
                ))
              ) : (
                allBoxes.map((box) => (
                  <BoxListingCard key={box.id} box={box} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}