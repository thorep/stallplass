"use client";

import { MagnifyingGlassIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

interface Address {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenummer: string;
  kommunenavn: string;
  fylkesnummer?: string;
  fylkesnavn?: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
}

interface AddressSearchProps {
  onAddressSelect: (address: {
    address: string;
    poststed: string;
    postalCode: string;
    fylke: string;
    municipality: string;
    kommuneNumber: string;
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
  initialValue = "",
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserInteracted = useRef(false);

  // Update query when initialValue changes (e.g., when modal opens with existing data)
  useEffect(() => {
    // Only update from initialValue before user interacts
    if (!hasUserInteracted.current) {
      setQuery((prev) => (prev !== initialValue ? initialValue : prev));
    }
    // Reset interaction flag when component gets empty initialValue (modal closes/resets)
    if (!initialValue) {
      hasUserInteracted.current = false;
    }
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Don't search if user hasn't interacted with the field yet
    if (!hasUserInteracted.current) {
      return;
    }

    if (justSelected) {
      setShowResults(false);
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
        const response = await fetch(
          `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(
            query
          )}&treffPerSide=10&side=0&fuzzy=true`
        );

        if (response.ok) {
          const data = await response.json();
          const validAddresses = (data.adresser || []).filter(
            (address: Address) =>
              address &&
              address.adressetekst &&
              address.postnummer &&
              address.poststed &&
              address.representasjonspunkt
          );

          setAddresses(validAddresses);
          setShowResults(true);
        }
      } catch {
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
    hasUserInteracted.current = true;
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setJustSelected(false);
  };

  const handleAddressClick = async (address: Address) => {
    // marker at vi har valgt noe
    setJustSelected(true);
    setShowResults(false);
    setAddresses([]);
    setQuery(address.adressetekst);

    const addressData = {
      address: address.adressetekst,
      poststed: address.poststed,
      postalCode: address.postnummer,
      fylke: address.fylkesnavn || "",
      municipality: address.kommunenavn || "",
      kommuneNumber: address.kommunenummer,
      lat: address.representasjonspunkt.lat,
      lon: address.representasjonspunkt.lon,
    };

    onAddressSelect(addressData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < addresses.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && addresses[selectedIndex]) {
        handleAddressClick(addresses[selectedIndex]);
      }
    } else if (e.key === "Escape") {
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
          onFocus={() => {
            if (!justSelected && query.length >= 3 && addresses.length > 0) {
              setShowResults(true);
            }
          }}
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
                index === selectedIndex ? "bg-primary/10" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{address.adressetekst}</div>
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
