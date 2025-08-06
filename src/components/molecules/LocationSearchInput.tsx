'use client';

import { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useSearchLocations } from '@/hooks/useLocations';

interface LocationResult {
  id: string;
  navn: string;
  type: 'fylke' | 'kommune' | 'tettsted';
  fylke?: string;
  kommune?: string;
}

interface LocationSearchInputProps {
  placeholder?: string;
  onLocationSelect?: (location: LocationResult) => void;
  className?: string;
}

export default function LocationSearchInput({ 
  placeholder = "Søk etter sted, kommune eller fylke...",
  onLocationSelect,
  className = ""
}: LocationSearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  // Use TanStack Query hook for location search
  const { data: results = [], isLoading } = useSearchLocations(query);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);


  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleLocationSelect(results[selectedIndex]);
        } else if (query.trim()) {
          // If no selection but has query, redirect to general search
          router.push(`/sok?q=${encodeURIComponent(query.trim())}`);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleLocationSelect = (location: LocationResult) => {
    setQuery(location.navn);
    setShowResults(false);
    setSelectedIndex(-1);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    } else {
      // Default behavior: redirect to search with location filter
      const params = new URLSearchParams();
      if (location.type === 'fylke') {
        params.set('fylkeId', location.id);
      } else if (location.type === 'kommune') {
        params.set('kommuneId', location.id);
      } else {
        // For tettsted, search by name
        params.set('q', location.navn);
      }
      router.push(`/sok?${params.toString()}`);
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'fylke': return 'Fylke';
      case 'kommune': return 'Kommune';
      case 'tettsted': return 'Sted';
      default: return '';
    }
  };

  const formatLocationDisplay = (location: LocationResult) => {
    let display = location.navn;
    if (location.kommune && location.fylke) {
      display += ` (${location.kommune}, ${location.fylke})`;
    } else if (location.fylke && location.type === 'kommune') {
      display += ` (${location.fylke})`;
    }
    return display;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="w-full pl-12 pr-4 py-4 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-50 transition-colors"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto"
        >
          {results.map((location: LocationResult, index: number) => (
            <button
              key={`${location.type}-${location.id}`}
              type="button"
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 focus:outline-none focus:bg-slate-50 ${
                index === selectedIndex ? 'bg-indigo-50 border-indigo-200' : ''
              }`}
              onClick={() => handleLocationSelect(location)}
            >
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-medium truncate">
                    {formatLocationDisplay(location)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {getLocationTypeLabel(location.type)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}