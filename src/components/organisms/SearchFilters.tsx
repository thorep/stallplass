'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { StableAmenity, BoxAmenity } from '@prisma/client';
import Button from '@/components/atoms/Button';

interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
}

export default function SearchFilters({ stableAmenities, boxAmenities }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    selectedStableAmenityIds: [] as string[],
    selectedBoxAmenityIds: [] as string[],
    availableSpaces: 'any'
  });

  const handleStableAmenityToggle = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedStableAmenityIds: prev.selectedStableAmenityIds.includes(amenityId)
        ? prev.selectedStableAmenityIds.filter(id => id !== amenityId)
        : [...prev.selectedStableAmenityIds, amenityId]
    }));
  };

  const handleBoxAmenityToggle = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedBoxAmenityIds: prev.selectedBoxAmenityIds.includes(amenityId)
        ? prev.selectedBoxAmenityIds.filter(id => id !== amenityId)
        : [...prev.selectedBoxAmenityIds, amenityId]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      selectedStableAmenityIds: [],
      selectedBoxAmenityIds: [],
      availableSpaces: 'any'
    });
  };

  return (
    <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-6 sticky top-4">
      <div className="flex items-center mb-6">
        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
      </div>

      <div className="space-y-6">
        {/* Location Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sted
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Søk etter sted..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pris per måned
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Fra"
              value={filters.minPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
            <input
              type="number"
              placeholder="Til"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Available Spaces */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ledige plasser
          </label>
          <select
            value={filters.availableSpaces}
            onChange={(e) => setFilters(prev => ({ ...prev, availableSpaces: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Alle</option>
            <option value="1+">1 eller flere</option>
            <option value="3+">3 eller flere</option>
            <option value="5+">5 eller flere</option>
          </select>
        </div>

        {/* Stable Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stall-fasiliteter
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {stableAmenities.map((amenity) => (
              <label key={`stable-${amenity.id}`} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.selectedStableAmenityIds.includes(amenity.id)}
                  onChange={() => handleStableAmenityToggle(amenity.id)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Box Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Boks-fasiliteter
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {boxAmenities.map((amenity) => (
              <label key={`box-${amenity.id}`} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.selectedBoxAmenityIds.includes(amenity.id)}
                  onChange={() => handleBoxAmenityToggle(amenity.id)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-4 border-t border-gray-300">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full"
          >
            Nullstill filtre
          </Button>
        </div>
      </div>
    </div>
  );
}