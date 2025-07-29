'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPinIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LocationSuggestion {
  id: string;
  text: string;
  type: 'city' | 'county' | 'address' | 'stable';
  subtext?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface RealTimeLocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: LocationSuggestion) => void;
  placeholder?: string;
  suggestions?: LocationSuggestion[];
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  showRecentSearches?: boolean;
}

// Norwegian locations for suggestions
const norwegianLocations: LocationSuggestion[] = [
  { id: 'oslo', text: 'Oslo', type: 'city', subtext: 'Oslo fylke' },
  { id: 'bergen', text: 'Bergen', type: 'city', subtext: 'Vestland fylke' },
  { id: 'trondheim', text: 'Trondheim', type: 'city', subtext: 'Trøndelag fylke' },
  { id: 'stavanger', text: 'Stavanger', type: 'city', subtext: 'Rogaland fylke' },
  { id: 'kristiansand', text: 'Kristiansand', type: 'city', subtext: 'Agder fylke' },
  { id: 'fredrikstad', text: 'Fredrikstad', type: 'city', subtext: 'Østfold fylke' },
  { id: 'drammen', text: 'Drammen', type: 'city', subtext: 'Buskerud fylke' },
  { id: 'asker', text: 'Asker', type: 'city', subtext: 'Viken fylke' },
  { id: 'sandnes', text: 'Sandnes', type: 'city', subtext: 'Rogaland fylke' },
  { id: 'tromsø', text: 'Tromsø', type: 'city', subtext: 'Troms og Finnmark fylke' },
  
  // Counties
  { id: 'viken', text: 'Viken', type: 'county' },
  { id: 'innlandet', text: 'Innlandet', type: 'county' },
  { id: 'vestfold-telemark', text: 'Vestfold og Telemark', type: 'county' },
  { id: 'agder', text: 'Agder', type: 'county' },
  { id: 'rogaland', text: 'Rogaland', type: 'county' },
  { id: 'vestland', text: 'Vestland', type: 'county' },
  { id: 'møre-romsdal', text: 'Møre og Romsdal', type: 'county' },
  { id: 'trøndelag', text: 'Trøndelag', type: 'county' },
  { id: 'nordland', text: 'Nordland', type: 'county' },
  { id: 'troms-finnmark', text: 'Troms og Finnmark', type: 'county' },
];

export default function RealTimeLocationSearch({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Søk etter sted...',
  suggestions: customSuggestions,
  isLoading = false,
  className = '',
  disabled = false,
  showRecentSearches = true
}: RealTimeLocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<LocationSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      try {
        const stored = localStorage.getItem('stallplass-recent-locations');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {
      }
    }
  }, [showRecentSearches]);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    const allSuggestions = customSuggestions || norwegianLocations;
    
    if (!value.trim()) {
      return showRecentSearches ? recentSearches.slice(0, 5) : [];
    }

    const searchTerm = value.toLowerCase().trim();
    return allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchTerm) ||
      suggestion.subtext?.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
  }, [value, customSuggestions, recentSearches, showRecentSearches]);

  // Save to recent searches
  const saveToRecentSearches = (location: LocationSuggestion) => {
    if (!showRecentSearches) return;

    try {
      const updated = [
        location,
        ...recentSearches.filter(item => item.id !== location.id)
      ].slice(0, 10); // Keep only last 10

      setRecentSearches(updated);
      localStorage.setItem('stallplass-recent-locations', JSON.stringify(updated));
    } catch {
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    onChange(location.text);
    saveToRecentSearches(location);
    setIsOpen(false);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim() && !isOpen) {
      setIsOpen(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    // Add more keyboard navigation if needed
  };

  // Get icon for location type
  const getLocationIcon = (type: LocationSuggestion['type']) => {
    switch (type) {
      case 'city':
        return '🏙️';
      case 'county':
        return '🏞️';
      case 'address':
        return '📍';
      case 'stable':
        return '🐎';
      default:
        return '📍';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        />
        
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          {filteredSuggestions.length > 0 ? (
            <>
              {!value.trim() && showRecentSearches && recentSearches.length > 0 && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Nylige søk
                </div>
              )}
              
              {value.trim() && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Forslag
                </div>
              )}
              
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getLocationIcon(suggestion.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.subtext && (
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.subtext}
                        </div>
                      )}
                    </div>
                    <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </>
          ) : value.trim() ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Ingen steder funnet</p>
              <p className="text-xs text-gray-400 mt-1">
                Prøv å søke etter by, fylke eller adresse
              </p>
            </div>
          ) : showRecentSearches ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Begynn å skrive for å søke</p>
              <p className="text-xs text-gray-400 mt-1">
                Søk etter by, fylke eller adresse
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for real-time location-based filtering
 */
export function useLocationBasedFiltering<T extends { location?: string | null; address?: string | null; city?: string | null; county?: string | null }>(
  items: T[],
  locationQuery: string
): T[] {
  return useMemo(() => {
    if (!locationQuery.trim()) return items;

    const query = locationQuery.toLowerCase().trim();
    
    return items.filter(item => {
      // Check various location fields
      const fields = [
        item.location,
        item.address,
        item.city,
        item.county
      ].filter(Boolean);

      return fields.some(field => 
        field?.toLowerCase().includes(query)
      );
    });
  }, [items, locationQuery]);
}

/**
 * Hook for getting location suggestions from real data
 */
export function useLocationSuggestions(
  stables: Array<{ id: string; name: string; location?: string | null; city?: string | null; county?: string | null }>,
  query: string
): LocationSuggestion[] {
  return useMemo(() => {
    if (!query.trim()) return [];

    const suggestions: LocationSuggestion[] = [];
    const seen = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add stable suggestions
    stables.forEach(stable => {
      if (stable.name.toLowerCase().includes(queryLower)) {
        const suggestion: LocationSuggestion = {
          id: `stable-${stable.id}`,
          text: stable.name,
          type: 'stable',
          subtext: stable.location || stable.city || undefined
        };
        
        if (!seen.has(suggestion.text.toLowerCase())) {
          suggestions.push(suggestion);
          seen.add(suggestion.text.toLowerCase());
        }
      }
    });

    // Add city suggestions from stables
    stables.forEach(stable => {
      if (stable.city && stable.city.toLowerCase().includes(queryLower)) {
        const suggestion: LocationSuggestion = {
          id: `city-${stable.city}`,
          text: stable.city,
          type: 'city',
          subtext: stable.county || undefined
        };
        
        if (!seen.has(suggestion.text.toLowerCase())) {
          suggestions.push(suggestion);
          seen.add(suggestion.text.toLowerCase());
        }
      }
    });

    // Add predefined Norwegian locations
    norwegianLocations.forEach(location => {
      if (
        location.text.toLowerCase().includes(queryLower) ||
        location.subtext?.toLowerCase().includes(queryLower)
      ) {
        if (!seen.has(location.text.toLowerCase())) {
          suggestions.push(location);
          seen.add(location.text.toLowerCase());
        }
      }
    });

    return suggestions.slice(0, 10);
  }, [stables, query]);
}