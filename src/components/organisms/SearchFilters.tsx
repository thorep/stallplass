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
  // Separate price filters for each view
  stableMinPrice: string;
  stableMaxPrice: string;
  boxMinPrice: string;
  boxMaxPrice: string;
}

interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: 'stables' | 'boxes';
  onSearchModeChange: (mode: 'stables' | 'boxes') => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function SearchFilters({ 
  stableAmenities, 
  boxAmenities, 
  searchMode, 
  onSearchModeChange, 
  filters, 
  onFiltersChange
}: SearchFiltersProps) {
  // Local state for price inputs only (for immediate UI feedback)
  const [localPrices, setLocalPrices] = useState({
    stableMinPrice: filters.stableMinPrice,
    stableMaxPrice: filters.stableMaxPrice,
    boxMinPrice: filters.boxMinPrice,
    boxMaxPrice: filters.boxMaxPrice,
  });
  
  // Debounce only the price changes for API calls
  const [debouncedPrices] = useDebounce(localPrices, 300);

  // Location data
  const { data: fylker = [], isLoading: loadingFylker } = useFylker();
  const { data: kommuner = [], isLoading: loadingKommuner } = useKommuner(filters.fylkeId || undefined);

  // Send debounced price changes to parent
  useEffect(() => {
    // Only update if debounced prices are different from current filters
    if (
      debouncedPrices.stableMinPrice !== filters.stableMinPrice ||
      debouncedPrices.stableMaxPrice !== filters.stableMaxPrice ||
      debouncedPrices.boxMinPrice !== filters.boxMinPrice ||
      debouncedPrices.boxMaxPrice !== filters.boxMaxPrice
    ) {
      onFiltersChange({
        ...filters,
        ...debouncedPrices
      });
    }
  }, [debouncedPrices, filters, onFiltersChange]);

  // Count active filters based on search mode
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.fylkeId) count++;
    if (filters.kommuneId) count++;
    
    // Count price filters based on search mode
    if (searchMode === 'stables') {
      if (localPrices.stableMinPrice) count++;
      if (localPrices.stableMaxPrice) count++;
    } else {
      if (localPrices.boxMinPrice) count++;
      if (localPrices.boxMaxPrice) count++;
    }
    
    if (filters.selectedStableAmenityIds.length > 0) count++;
    if (filters.selectedBoxAmenityIds.length > 0) count++;
    if (filters.availableSpaces !== 'any') count++;
    if (filters.boxSize !== 'any') count++;
    if (filters.boxType !== 'any') count++;
    if (filters.horseSize !== 'any') count++;
    if (filters.occupancyStatus !== 'available') count++;
    return count;
  }, [filters, localPrices, searchMode]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceChange = (key: keyof typeof localPrices, value: string) => {
    setLocalPrices(prev => ({ ...prev, [key]: value }));
  };

  const handleFylkeChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      fylkeId: value,
      kommuneId: '' // Reset kommune when fylke changes
    });
  };

  const handleKommuneChange = (value: string) => {
    onFiltersChange({ ...filters, kommuneId: value });
  };

  const handleStableAmenityToggle = (amenityId: string) => {
    const newSelectedIds = filters.selectedStableAmenityIds.includes(amenityId)
      ? filters.selectedStableAmenityIds.filter(id => id !== amenityId)
      : [...filters.selectedStableAmenityIds, amenityId];
    
    onFiltersChange({ ...filters, selectedStableAmenityIds: newSelectedIds });
  };

  const handleBoxAmenityToggle = (amenityId: string) => {
    const newSelectedIds = filters.selectedBoxAmenityIds.includes(amenityId)
      ? filters.selectedBoxAmenityIds.filter(id => id !== amenityId)
      : [...filters.selectedBoxAmenityIds, amenityId];
    
    onFiltersChange({ ...filters, selectedBoxAmenityIds: newSelectedIds });
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
      occupancyStatus: 'available',
      // Clear separate price fields
      stableMinPrice: '',
      stableMaxPrice: '',
      boxMinPrice: '',
      boxMaxPrice: ''
    };
    
    setLocalPrices({
      stableMinPrice: '',
      stableMaxPrice: '',
      boxMinPrice: '',
      boxMaxPrice: ''
    });
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
            value={filters.fylkeId}
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

        {filters.fylkeId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kommune
            </label>
            <select
              value={filters.kommuneId}
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
                value={searchMode === 'stables' ? localPrices.stableMinPrice : localPrices.boxMinPrice}
                onChange={(e) => handlePriceChange(
                  searchMode === 'stables' ? 'stableMinPrice' : 'boxMinPrice', 
                  e.target.value
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Til</label>
              <input
                type="number"
                placeholder="Til"
                value={searchMode === 'stables' ? localPrices.stableMaxPrice : localPrices.boxMaxPrice}
                onChange={(e) => handlePriceChange(
                  searchMode === 'stables' ? 'stableMaxPrice' : 'boxMaxPrice', 
                  e.target.value
                )}
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
                checked={filters.availableSpaces === 'available'}
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
                value={filters.occupancyStatus || 'available'}
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
                value={filters.boxSize || 'any'}
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
                value={filters.boxType || 'any'}
                onChange={(e) => handleFilterChange('boxType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="any">Alle typer</option>
                <option value="boks">Boks</option>
                <option value="utegang">Utegang</option>
              </select>
            </div>

            {/* Horse Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hestestørrelse
              </label>
              <select
                value={filters.horseSize || 'any'}
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
            <div className="space-y-2">
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
        )}

        {/* Box Amenities - Show for box search or both */}
        {searchMode === 'boxes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boks-fasiliteter
            </label>
            <div className="space-y-2">
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