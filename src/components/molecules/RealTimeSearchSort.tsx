'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { StableWithBoxStats, BoxWithStable, BoxWithStablePreview } from '@/types/stable';

type SortOption = 
  | 'newest'
  | 'oldest'
  | 'price_low'
  | 'price_high'
  | 'rating_high'
  | 'rating_low'
  | 'available_high'
  | 'available_low'
  | 'featured_first'
  | 'sponsored_first'
  | 'name_asc'
  | 'name_desc';

interface SortConfig {
  key: SortOption;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface RealTimeSearchSortProps {
  searchMode: 'stables' | 'boxes';
  onSortChange: (sortOption: SortOption) => void;
  currentSort?: SortOption;
  totalResults: number;
  isLoading?: boolean;
  isRealTime?: boolean;
}

const stableSortOptions: SortConfig[] = [
  { 
    key: 'featured_first', 
    label: 'Utvalgte først', 
    description: 'Fremhevede stables øverst'
  },
  { 
    key: 'newest', 
    label: 'Nyeste først', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Nylig opprettede stables'
  },
  { 
    key: 'oldest', 
    label: 'Eldste først', 
    icon: <ArrowUpIcon className="w-3 h-3" />,
    description: 'Etablerte stables'
  },
  { 
    key: 'rating_high', 
    label: 'Høyest vurdert', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Best kundevurdering'
  },
  { 
    key: 'available_high', 
    label: 'Flest ledige plasser', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Mest tilgjengelig'
  },
  { 
    key: 'available_low', 
    label: 'Færrest ledige plasser', 
    icon: <ArrowUpIcon className="w-3 h-3" />,
    description: 'Nesten fulltegnet'
  },
  { 
    key: 'price_low', 
    label: 'Laveste pris', 
    icon: <ArrowUpIcon className="w-3 h-3" />,
    description: 'Budsjettvenlig'
  },
  { 
    key: 'price_high', 
    label: 'Høyeste pris', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Premium tilbud'
  },
  { 
    key: 'name_asc', 
    label: 'Navn A-Å', 
    description: 'Alfabetisk sortering'
  },
  { 
    key: 'name_desc', 
    label: 'Navn Å-A', 
    description: 'Omvendt alfabetisk'
  },
];

const boxSortOptions: SortConfig[] = [
  { 
    key: 'sponsored_first', 
    label: 'Sponsede først', 
    description: 'Fremhevede bokser øverst'
  },
  { 
    key: 'newest', 
    label: 'Nyeste først', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Nylig opprettede bokser'
  },
  { 
    key: 'oldest', 
    label: 'Eldste først', 
    icon: <ArrowUpIcon className="w-3 h-3" />,
    description: 'Etablerte bokser'
  },
  { 
    key: 'price_low', 
    label: 'Laveste pris', 
    icon: <ArrowUpIcon className="w-3 h-3" />,
    description: 'Budsjettvenlig'
  },
  { 
    key: 'price_high', 
    label: 'Høyeste pris', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Premium bokser'
  },
  { 
    key: 'rating_high', 
    label: 'Høyest vurdert stall', 
    icon: <ArrowDownIcon className="w-3 h-3" />,
    description: 'Fra best vurderte stables'
  },
  { 
    key: 'name_asc', 
    label: 'Navn A-Å', 
    description: 'Alfabetisk sortering'
  },
  { 
    key: 'name_desc', 
    label: 'Navn Å-A', 
    description: 'Omvendt alfabetisk'
  },
];

export default function RealTimeSearchSort({
  searchMode,
  onSortChange,
  currentSort = 'newest',
  totalResults,
  isLoading = false,
  isRealTime = true
}: RealTimeSearchSortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const sortOptions = searchMode === 'stables' ? stableSortOptions : boxSortOptions;
  const currentSortConfig = sortOptions.find(opt => opt.key === currentSort) || sortOptions[0];

  // Update timestamp when results change
  useEffect(() => {
    if (isRealTime && !isLoading) {
      setLastUpdateTime(new Date());
    }
  }, [totalResults, isRealTime, isLoading]);

  const handleSortChange = (sortOption: SortOption) => {
    onSortChange(sortOption);
    setIsOpen(false);
  };

  // Format last update time
  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s siden`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m siden`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}t siden`;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      {/* Results summary */}
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalResults}</span>{' '}
          {searchMode === 'stables' ? 'stables' : 'bokser'} funnet
        </div>
        
        {isRealTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${
              isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`} />
            <span>
              {isLoading ? 'Oppdaterer...' : `Oppdatert ${formatLastUpdate(lastUpdateTime)}`}
            </span>
          </div>
        )}
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-auto min-w-[200px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            {currentSortConfig.icon}
            <span>Sorter: {currentSortConfig.label}</span>
          </div>
          <ChevronDownIcon 
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 z-20 w-72 mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Sorteringsalternativer
                </div>
                
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSortChange(option.key)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      currentSort === option.key
                        ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </div>
                      {currentSort === option.key && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                    {option.description && (
                      <div className="mt-1 text-xs text-gray-500">
                        {option.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Utility function to sort stables based on the selected option
 */
export function sortStables(stables: StableWithBoxStats[], sortOption: SortOption): StableWithBoxStats[] {
  const sorted = [...stables];
  
  switch (sortOption) {
    case 'featured_first':
      return sorted.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
    case 'oldest':
      return sorted.sort((a, b) => 
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
      
    case 'price_low':
      return sorted.sort((a, b) => a.priceRange.min - b.priceRange.min);
      
    case 'price_high':
      return sorted.sort((a, b) => b.priceRange.max - a.priceRange.max);
      
    case 'rating_high':
      return sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
      
    case 'rating_low':
      return sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingA - ratingB;
      });
      
    case 'available_high':
      return sorted.sort((a, b) => b.availableBoxes - a.availableBoxes);
      
    case 'available_low':
      return sorted.sort((a, b) => a.availableBoxes - b.availableBoxes);
      
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'no'));
      
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'no'));
      
    default:
      return sorted;
  }
}

/**
 * Utility function to sort boxes based on the selected option
 */
export function sortBoxes(boxes: BoxWithStablePreview[], sortOption: SortOption): BoxWithStablePreview[] {
  const sorted = [...boxes];
  
  switch (sortOption) {
    case 'sponsored_first':
      return sorted.sort((a, b) => {
        // First by sponsored status
        if (a.is_sponsored && !b.is_sponsored) return -1;
        if (!a.is_sponsored && b.is_sponsored) return 1;
        
        // Then by availability
        if (a.is_available && !b.is_available) return -1;
        if (!a.is_available && b.is_available) return 1;
        
        // Finally by price
        return a.price - b.price;
      });
      
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      
    case 'oldest':
      return sorted.sort((a, b) => 
        new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
      
    case 'price_low':
      return sorted.sort((a, b) => a.price - b.price);
      
    case 'price_high':
      return sorted.sort((a, b) => b.price - a.price);
      
    case 'rating_high':
      return sorted.sort((a, b) => {
        const ratingA = a.stable?.rating || 0;
        const ratingB = b.stable?.rating || 0;
        return ratingB - ratingA;
      });
      
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'no'));
      
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'no'));
      
    default:
      return sorted;
  }
}