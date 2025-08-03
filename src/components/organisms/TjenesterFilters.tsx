'use client';

import { useMemo } from 'react';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { ServiceSearchFilters } from '@/types/service';
import { getAllServiceTypes } from '@/lib/service-types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface TjenesterFiltersProps {
  filters: ServiceSearchFilters;
  onFiltersChange: (filters: Partial<ServiceSearchFilters>) => void;
  onClearFilters: () => void;
  totalResults: number;
  isLoading: boolean;
}

export default function TjenesterFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalResults,
  isLoading
}: TjenesterFiltersProps) {
  // Price range constants
  const PRICE_RANGE = useMemo(() => ({ 
    min: 0, 
    max: 10000, 
    step: 100 
  }), []);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.service_type) count++;
    if (filters.county) count++;
    if (filters.municipality) count++;
    if (filters.price_min && filters.price_min > PRICE_RANGE.min) count++;
    if (filters.price_max && filters.price_max < PRICE_RANGE.max) count++;
    return count;
  }, [filters, PRICE_RANGE.min, PRICE_RANGE.max]);

  // Handle price range slider changes
  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values;
    onFiltersChange({
      price_min: min === PRICE_RANGE.min ? undefined : min,
      price_max: max === PRICE_RANGE.max ? undefined : max
    });
  };

  // Get current price range for slider
  const getCurrentPriceRange = (): [number, number] => {
    const min = filters.price_min || PRICE_RANGE.min;
    const max = filters.price_max || PRICE_RANGE.max;
    return [min, max];
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO').format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-h4 text-gray-900">Filtrer tjenester</h2>
          {activeFiltersCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-emerald-100 text-emerald-800">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Price Range Slider - First Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-body-sm font-medium text-gray-700">
              Prisklasse
            </label>
            <span className="text-caption text-gray-500">
              {formatPrice(getCurrentPriceRange()[0])} - {formatPrice(getCurrentPriceRange()[1])} kr
            </span>
          </div>
          <div className="px-2 py-4">
            <Slider
              value={getCurrentPriceRange()}
              onValueChange={handlePriceRangeChange}
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              step={PRICE_RANGE.step}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-caption text-gray-400 mt-1">
            <span>{formatPrice(PRICE_RANGE.min)} kr</span>
            <span>{formatPrice(PRICE_RANGE.max)} kr</span>
          </div>
        </div>

        {/* Service Type Filter */}
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-3">
            Tjenestetype
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'Alle typer' },
              ...getAllServiceTypes()
            ].map(option => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ 
                  service_type: option.value === '' ? undefined : option.value as 'veterinarian' | 'farrier' | 'trainer'
                })}
                className={cn(
                  "px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full text-caption sm:text-xs font-medium border transition-all duration-200 touch-manipulation",
                  (filters.service_type || '') === option.value
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filters */}
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Fylke
            </label>
            <input
              type="text"
              value={filters.county || ''}
              onChange={(e) => onFiltersChange({ county: e.target.value || undefined })}
              placeholder="f.eks. Oslo"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Kommune
            </label>
            <input
              type="text"
              value={filters.municipality || ''}
              onChange={(e) => onFiltersChange({ municipality: e.target.value || undefined })}
              placeholder="f.eks. Drammen"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="w-full py-2.5 text-button hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-colors"
          >
            Nullstill filtre
          </Button>
        </div>

        {/* Results Summary */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-gray-600">
              {isLoading ? 'Laster...' : `${totalResults} tjeneste${totalResults !== 1 ? 'r' : ''}`}
            </span>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}