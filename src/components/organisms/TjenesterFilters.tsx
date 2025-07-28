'use client';

import { ServiceSearchFilters } from '@/types/service';
import { getAllServiceTypes } from '@/lib/service-types';
import Button from '@/components/atoms/Button';

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
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ServiceSearchFilters];
    return value !== undefined && value !== null && value !== '';
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filtrer tjenester</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Fjern alle
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Service Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tjenestetype
          </label>
          <div className="space-y-2">
            {[
              { value: '', label: 'Alle typer' },
              ...getAllServiceTypes()
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="service_type"
                  value={option.value}
                  checked={(filters.service_type || '') === option.value}
                  onChange={(e) => onFiltersChange({ 
                    service_type: e.target.value === '' ? undefined : e.target.value as 'veterinarian' | 'farrier' | 'trainer'
                  })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fylke
          </label>
          <input
            type="text"
            value={filters.county || ''}
            onChange={(e) => onFiltersChange({ county: e.target.value || undefined })}
            placeholder="f.eks. Oslo"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kommune
          </label>
          <input
            type="text"
            value={filters.municipality || ''}
            onChange={(e) => onFiltersChange({ municipality: e.target.value || undefined })}
            placeholder="f.eks. Drammen"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Prisområde (kr)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fra</label>
              <input
                type="number"
                value={filters.price_min || ''}
                onChange={(e) => onFiltersChange({ 
                  price_min: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="500"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Til</label>
              <input
                type="number"
                value={filters.price_max || ''}
                onChange={(e) => onFiltersChange({ 
                  price_max: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="5000"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {isLoading ? 'Laster...' : `${totalResults} tjeneste${totalResults !== 1 ? 'r' : ''}`}
            </span>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}