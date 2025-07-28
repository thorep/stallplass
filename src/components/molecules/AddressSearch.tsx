'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { locationService } from '@/services/location-service';

interface Address {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenummer: string;
  kommunenavn: string;
  fylkesnummer?: string; // May be available in API response
  fylkesnavn?: string;   // May be available in API response
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

interface AddressSearchProps {
  onAddressSelect: (address: {
    address: string;
    poststed: string; // Norwegian postal place name
    postalCode: string;
    fylke: string; // Actual fylke name from database lookup
    municipality: string; // Kommune name from database lookup
    kommuneNumber: string; // Official kommune number for precise location matching
    lat: number;
    lon: number;
  }) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export default function AddressSearch({
  onAddressSelect,
  placeholder = "Søk etter adresse...",
  className = "",
  initialValue = ""
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Don't search if an address was just selected
    if (justSelected) {
      setJustSelected(false);
      return;
    }

    if (query.length < 3) {
      setAddresses([]);
      setShowResults(false);
      return;
    }

    const searchAddresses = async () => {
      setLoading(true);
      try {
        // Add fuzzy search parameter
        const response = await fetch(
          `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query)}&treffPerSide=10&side=0&fuzzy=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Filter out addresses with incomplete data
          const validAddresses = (data.adresser || []).filter((address: Address) => 
            address && 
            address.adressetekst &&
            address.postnummer &&
            address.poststed &&
            address.representasjonspunkt
          );
          
          setAddresses(validAddresses);
          setShowResults(true);
        }
      } catch (_) {
        setAddresses([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    };

    const delayedSearch = setTimeout(searchAddresses, 300);
    return () => clearTimeout(delayedSearch);
  }, [query, justSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setJustSelected(false);
  };

  const handleAddressClick = async (address: Address) => {
    
    // Lookup correct fylke and kommune information using kommunenummer
    const locationData = await locationService.findLocationIdsByKommuneNumber(address.kommunenummer);
    
    
    const addressData = {
      address: address.adressetekst,
      poststed: address.poststed,
      postalCode: address.postnummer,
      fylke: locationData.fylke_navn || address.kommunenavn, // Use fylke name from lookup, fallback to kommune name
      municipality: locationData.kommune_navn || address.kommunenavn, // Use kommune name from lookup
      kommuneNumber: address.kommunenummer, // Official kommune number
      lat: address.representasjonspunkt.lat,
      lon: address.representasjonspunkt.lon,
    };


    setJustSelected(true);
    setQuery(address.adressetekst);
    setShowResults(false);
    setAddresses([]);
    onAddressSelect(addressData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < addresses.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && addresses[selectedIndex]) {
        handleAddressClick(addresses[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          data-cy="address-search-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 3 && !justSelected && addresses.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {showResults && addresses.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {addresses.map((address, index) => (
            <button
              key={index}
              onClick={() => handleAddressClick(address)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-primary/10' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {address.adressetekst}
                  </div>
                  <div className="text-sm text-gray-500">
                    {address.postnummer} {address.poststed}, {address.kommunenavn}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && addresses.length === 0 && query.length >= 3 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-center">
            Ingen adresser funnet for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}