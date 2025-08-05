"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStableSearch } from "@/hooks/useStables";
import { useUpdateHorse } from "@/hooks/useHorseMutations";
import { Search, Building, MapPin, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StableOption {
  id: string;
  name: string;
  address?: string | null;
  postalCode?: string | null;
  postalPlace?: string | null;
  latitude: number;
  longitude: number;
}

interface StableSelectorProps {
  horseId: string;
  currentStable?: StableOption | null;
  onStableSelected?: (stable: StableOption | null) => void;
  className?: string;
}

export function StableSelector({
  horseId,
  currentStable,
  onStableSelected,
  className,
}: StableSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStable, setSelectedStable] = useState<StableOption | null>(currentStable || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateHorse = useUpdateHorse();

  // Debounced search
  const { data: searchResults, isLoading: searchLoading } = useStableSearch(
    searchQuery,
    isSearching && searchQuery.trim().length > 0
  );

  // Handle search input changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(searchQuery.trim().length > 0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectStable = async (stable: StableOption | null) => {
    try {
      await updateHorse.mutateAsync({
        id: horseId,
        data: { stableId: stable?.id },
      });

      setSelectedStable(stable);
      setIsExpanded(false);
      setSearchQuery("");
      onStableSelected?.(stable);

      toast.success(
        stable
          ? `Hesten er nå tilknyttet ${stable.name}`
          : "Hesten er ikke lenger tilknyttet en stall"
      );
    } catch (error) {
      toast.error("Kunne ikke oppdatere stallplassering. Prøv igjen.");
      console.error("Error updating horse stable:", error);
    }
  };

  const handleRemoveStable = () => {
    handleSelectStable(null);
  };

  const getFullAddress = (stable: StableOption) => {
    return [
      stable.address,
      stable.postalCode && stable.postalPlace
        ? `${stable.postalCode} ${stable.postalPlace}`
        : null,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          Velg stallplassering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection Display */}
        {selectedStable && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-body font-medium text-green-900">
                    {selectedStable.name}
                  </p>
                  {getFullAddress(selectedStable) && (
                    <p className="text-body-sm text-green-700">
                      {getFullAddress(selectedStable)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveStable}
                disabled={updateHorse.isPending}
                className="text-green-700 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Search Interface */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Søk etter stall..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsExpanded(true);
              }}
              onFocus={() => setIsExpanded(true)}
              className="pl-10 text-base h-12 border-2 focus:border-blue-500"
            />
            {(searchLoading || updateHorse.isPending) && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {isExpanded && searchQuery.trim().length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  <p className="text-body-sm">Søker...</p>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((stable: StableOption) => (
                    <button
                      key={stable.id}
                      onClick={() => handleSelectStable(stable)}
                      disabled={updateHorse.isPending}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-medium text-gray-900 truncate">
                            {stable.name}
                          </p>
                          {getFullAddress(stable) && (
                            <p className="text-body-sm text-gray-600 truncate">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {getFullAddress(stable)}
                            </p>
                          )}
                        </div>
                        {selectedStable?.id === stable.id && (
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim().length > 0 && !searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <Building className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-body-sm">Ingen staller funnet</p>
                  <p className="text-body-sm">
                    Prøv et annet søkeord
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Help Text */}
        {!selectedStable && (
          <div className="text-center py-4">
            <Building className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-body-sm text-gray-500">
              Søk og velg en stall for å tilknytte hesten
            </p>
            <Badge variant="outline" className="mt-2">
              Valgfritt
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}