'use client';

import { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, BuildingOffice2Icon, CubeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StableAmenity, BoxAmenity } from '@/types';
import Button from '@/components/atoms/Button';

interface Filters {
  location: string;
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
  isRealTimeEnabled?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalResults?: number;
}

export default function SearchFilters({ 
  stableAmenities, 
  boxAmenities, 
  searchMode, 
  onSearchModeChange, 
  filters, 
  onFiltersChange,
  isRealTimeEnabled = true,
  onRefresh,
  isRefreshing = false,
  totalResults
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Apply filter changes immediately
  useEffect(() => {
    if (JSON.stringify(localFilters) !== JSON.stringify(filters)) {
      onFiltersChange(localFilters);
    }
  }, [localFilters, filters, onFiltersChange]);

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (localFilters.location) count++;
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
      location: '',
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
        
        {/* Refresh button */}
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Oppdater resultater"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
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
              value={localFilters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
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
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
            <input
              type="number"
              placeholder="Til"
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Available Spaces - Only for stable search */}
        {searchMode === 'stables' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ledige plasser
            </label>
            <select
              value={localFilters.availableSpaces}
              onChange={(e) => handleFilterChange('availableSpaces', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="any">Alle</option>
              <option value="1+">1 eller flere</option>
              <option value="3+">3 eller flere</option>
              <option value="5+">5 eller flere</option>
            </select>
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