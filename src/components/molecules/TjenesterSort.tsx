'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

interface TjenesterSortProps {
  onSortChange: (sort: SortOption) => void;
  currentSort: SortOption;
  totalResults: number;
  isLoading: boolean;
}

const sortOptions = [
  { value: 'newest', label: 'Nyeste først' },
  { value: 'oldest', label: 'Eldste først' },
  { value: 'price_low', label: 'Laveste pris først' },
  { value: 'price_high', label: 'Høyeste pris først' },
  { value: 'name_asc', label: 'Navn A-Å' },
  { value: 'name_desc', label: 'Navn Å-A' }
] as const;

export default function TjenesterSort({ 
  onSortChange, 
  currentSort, 
  totalResults, 
  isLoading 
}: TjenesterSortProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentSortLabel = sortOptions.find(option => option.value === currentSort)?.label || 'Sortering';

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 mb-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Results count */}
        <div className="flex items-center text-sm text-gray-600">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Laster tjenester...
            </div>
          ) : (
            <span>
              {totalResults} tjeneste{totalResults !== 1 ? 'r' : ''} funnet
            </span>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <span>Sorter: {currentSortLabel}</span>
            <ChevronDownIcon 
              className={`ml-2 h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown menu */}
              <div className="absolute right-0 z-20 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        currentSort === option.value 
                          ? 'text-indigo-600 bg-indigo-50' 
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}