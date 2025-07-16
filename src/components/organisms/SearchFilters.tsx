'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';

export default function SearchFilters() {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    amenities: [] as string[],
    availableSpaces: 'any'
  });

  const amenityOptions = [
    'Ridehall',
    'Daglig utgang',
    'Springbane',
    'Dressurarena',
    'Turstier',
    'Solarium',
    'Vaskeboks',
    'Hestesvømming',
    'Instruktører',
    'Veterinær',
    'Familievennlig',
    'Personlig oppfølging'
  ];

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      amenities: [],
      availableSpaces: 'any'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
      <div className="flex items-center mb-6">
        <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Filtre</h2>
      </div>

      <div className="space-y-6">
        {/* Location Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sted
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter sted..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Til"
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fasiliteter
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {amenityOptions.map((amenity) => (
              <label key={amenity} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-4 border-t border-gray-200">
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