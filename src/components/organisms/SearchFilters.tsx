'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdjustmentsHorizontalIcon, BuildingOffice2Icon, CubeIcon } from '@heroicons/react/24/outline';
import { StableAmenity, BoxAmenity } from '@/types';
import { useFylker, useKommuner } from '@/hooks/useLocationQueries';
import Button from '@/components/atoms/Button';
import { useDebounce } from 'use-debounce';


interface Filters {
  fylkeId: string;
  kommuneId: string;
  minPrice: string;
  maxPrice: string;
  selectedStableAmenityIds: string[];
  selectedBoxAmenityIds: string[];
  availableSpaces: string;
  boxSize: string;
  boxType: string;
  horseSize: string;
  occupancyStatus: string;
}

interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: 'stables' | 'boxes';
  onSearchModeChange: (mode: 'stables' | 'boxes') => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalResults?: number;
}

export default function SearchFilters({ 
  stableAmenities, 
  boxAmenities, 
  searchMode, 
  onSearchModeChange, 
  filters, 
  onFiltersChange,
  totalResults
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  
  // Debounce the filter changes for API calls
  const [debouncedFilters] = useDebounce(localFilters, 300);

  // Location data
  const { data: fylker = [], isLoading: loadingFylker } = useFylker();
  const { data: kommuner = [], isLoading: loadingKommuner } = useKommuner(localFilters.fylkeId || undefined);

  // Send debounced changes to parent
  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  // Sync with external filter changes (like URL changes)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localFilters.fylkeId) count++;
    if (localFilters.kommuneId) count++;
    if (localFilters.minPrice) count++;
    if (localFilters.maxPrice) count++;
    if (localFilters.selectedStableAmenityIds.length > 0) count++;
    if (localFilters.selectedBoxAmenityIds.length > 0) count++;
    if (localFilters.availableSpaces !== 'any') count++;
    if (localFilters.boxSize !== 'any') count++;
    if (localFilters.boxType !== 'any') count++;
    if (localFilters.horseSize !== 'any') count++;
    if (localFilters.occupancyStatus !== 'available') count++;
    return count;
  }, [localFilters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFylkeChange = (value: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      fylkeId: value,
      kommuneId: '' // Reset kommune when fylke changes
    }));
  };

  const handleKommuneChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, kommuneId: value }));
  };

  const handleStableAmenityToggle = (amenityId: string) => {
    const newSelectedIds = localFilters.selectedStableAmenityIds.includes(amenityId)
      ? localFilters.selectedStableAmenityIds.filter(id => id !== amenityId)
      : [...localFilters.selectedStableAmenityIds, amenityId];
    
    const newFilters = { ...localFilters, selectedStableAmenityIds: newSelectedIds };
    setLocalFilters(newFilters);
    
    onFiltersChange(newFilters);
  };

  const handleBoxAmenityToggle = (amenityId: string) => {
    const newSelectedIds = localFilters.selectedBoxAmenityIds.includes(amenityId)
      ? localFilters.selectedBoxAmenityIds.filter(id => id !== amenityId)
      : [...localFilters.selectedBoxAmenityIds, amenityId];
    
    const newFilters = { ...localFilters, selectedBoxAmenityIds: newSelectedIds };
    setLocalFilters(newFilters);
    
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      fylkeId: '',
      kommuneId: '',
      minPrice: '',
      maxPrice: '',
      selectedStableAmenityIds: [],
      selectedBoxAmenityIds: [],
      availableSpaces: 'any',
      boxSize: 'any',
      boxType: 'any',
      horseSize: 'any',
      occupancyStatus: 'available'
    };
    
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
          {activeFiltersCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      {/* Results summary */}
      {totalResults !== undefined && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{totalResults}</span> {searchMode === 'stables' ? 'staller' : 'bokser'} funnet
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Search Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Søk etter
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSearchModeChange('boxes')}
              className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                searchMode === 'boxes'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              Bokser
            </button>
            <button
              onClick={() => onSearchModeChange('stables')}
              className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                searchMode === 'stables'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BuildingOffice2Icon className="h-4 w-4 mr-2" />
              Staller
            </button>
          </div>
        </div>

        {/* Location Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fylke
          </label>
          <select
            value={localFilters.fylkeId}
            onChange={(e) => handleFylkeChange(e.target.value)}
            disabled={loadingFylker}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-50"
          >
            <option value="">Alle fylker</option>
            {fylker.map((fylke) => (
              <option key={fylke.id} value={fylke.id}>
                {fylke.navn}
              </option>
            ))}
          </select>
        </div>

        {localFilters.fylkeId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommune
            </label>
            <select
              value={localFilters.kommuneId}
              onChange={(e) => handleKommuneChange(e.target.value)}
              disabled={loadingKommuner}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-50"
            >
              <option value="">Hele fylket</option>
              {kommuner.map((kommune) => (
                <option key={kommune.id} value={kommune.id}>
                  {kommune.navn}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pris per måned
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fra</label>
              <input
                type="number"
                placeholder="Fra"
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Til</label>
              <input
                type="number"
                placeholder="Til"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Available Spaces - Only for stable search */}
        {searchMode === 'stables' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.availableSpaces === 'available'}
                onChange={(e) => handleFilterChange('availableSpaces', e.target.checked ? 'available' : 'any')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Kun staller med ledige plasser</span>
            </label>
          </div>
        )}

        {/* Box-specific filters */}
        {searchMode === 'boxes' && (
          <>
            {/* Occupancy Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beleggsstatus
              </label>
              <select
                value={localFilters.occupancyStatus || 'available'}
                onChange={(e) => handleFilterChange('occupancyStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="available">Kun ledige bokser</option>
                <option value="occupied">Kun opptatte bokser</option>
                <option value="all">Alle bokser</option>
              </select>
            </div>

            {/* Box Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boks størrelse
              </label>
              <select
                value={localFilters.boxSize || 'any'}
                onChange={(e) => handleFilterChange('boxSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">Alle størrelser</option>
                <option value="small">Liten (under 10 m²)</option>
                <option value="medium">Middels (10-15 m²)</option>
                <option value="large">Stor (over 15 m²)</option>
              </select>
            </div>

            {/* Indoor/Outdoor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boks type
              </label>
              <select
                value={localFilters.boxType || 'any'}
                onChange={(e) => handleFilterChange('boxType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">Alle typer</option>
                <option value="indoor">Innendørs</option>
                <option value="outdoor">Utendørs</option>
              </select>
            </div>

            {/* Horse Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hestestørrelse
              </label>
              <select
                value={localFilters.horseSize || 'any'}
                onChange={(e) => handleFilterChange('horseSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">Alle størrelser</option>
                <option value="pony">Ponni</option>
                <option value="small">Liten hest</option>
                <option value="medium">Middels hest</option>
                <option value="large">Stor hest</option>
              </select>
            </div>
          </>
        )}

        {/* Stable Amenities - Show for stable search or both */}
        {searchMode === 'stables' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stall-fasiliteter
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stableAmenities.map((amenity) => (
                <label key={`stable-${amenity.id}`} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.selectedStableAmenityIds.includes(amenity.id)}
                    onChange={() => handleStableAmenityToggle(amenity.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Box Amenities - Show for box search or both */}
        {searchMode === 'boxes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boks-fasiliteter
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {boxAmenities.map((amenity) => (
                <label key={`box-${amenity.id}`} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.selectedBoxAmenityIds.includes(amenity.id)}
                    onChange={() => handleBoxAmenityToggle(amenity.id)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

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