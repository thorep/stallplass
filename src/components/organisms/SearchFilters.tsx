"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useFylker, useKommuner } from "@/hooks/useLocationQueries";
import { usePriceRanges } from "@/hooks/usePriceRanges";
import { cn } from "@/lib/utils";
import { BoxAmenity, StableAmenity } from "@/types";
import {
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

interface Filters {
  fylkeId: string;
  kommuneId: string;
  minPrice: string;
  maxPrice: string;
  selectedStableAmenityIds: string[];
  selectedBoxAmenityIds: string[];
  availableSpaces: string;
  boxSize: string;
  boxType: string;
  horseSize: string;
  occupancyStatus: string;
  // Separate price filters for each view
  stableMinPrice: string;
  stableMaxPrice: string;
  boxMinPrice: string;
  boxMaxPrice: string;
}

interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: "stables" | "boxes";
  onSearchModeChange: (mode: "stables" | "boxes") => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function SearchFilters({
  stableAmenities,
  boxAmenities,
  searchMode,
  onSearchModeChange,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  // Local state for price range slider (for immediate UI feedback)
  const [localPrices, setLocalPrices] = useState({
    stableMinPrice: filters.stableMinPrice,
    stableMaxPrice: filters.stableMaxPrice,
    boxMinPrice: filters.boxMinPrice,
    boxMaxPrice: filters.boxMaxPrice,
  });

  // Debounce only the price changes for API calls
  const [debouncedPrices] = useDebounce(localPrices, 300);

  // Price range data
  const { data: priceRanges } = usePriceRanges();

  // Price range constants with fallbacks
  const STABLE_PRICE_RANGE = {
    min: 0,
    max: priceRanges?.stables.max || 15000,
    step: 100,
  };
  const BOX_PRICE_RANGE = {
    min: 0,
    max: priceRanges?.boxes.max || 10000,
    step: 50,
  };

  // Location data
  const { data: fylker = [], isLoading: loadingFylker } = useFylker();
  const { data: kommuner = [], isLoading: loadingKommuner } = useKommuner(
    filters.fylkeId || undefined
  );

  // Send debounced price changes to parent
  useEffect(() => {
    // Only update if debounced prices are different from current filters
    if (
      debouncedPrices.stableMinPrice !== filters.stableMinPrice ||
      debouncedPrices.stableMaxPrice !== filters.stableMaxPrice ||
      debouncedPrices.boxMinPrice !== filters.boxMinPrice ||
      debouncedPrices.boxMaxPrice !== filters.boxMaxPrice
    ) {
      onFiltersChange({
        ...filters,
        ...debouncedPrices,
      });
    }
  }, [debouncedPrices, filters, onFiltersChange]);

  // Count active filters based on search mode
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.fylkeId) count++;
    if (filters.kommuneId) count++;

    // Count price filters based on search mode
    if (searchMode === "stables") {
      if (localPrices.stableMinPrice) count++;
      if (localPrices.stableMaxPrice) count++;
    } else {
      if (localPrices.boxMinPrice) count++;
      if (localPrices.boxMaxPrice) count++;
    }

    if (filters.selectedStableAmenityIds.length > 0) count++;
    if (filters.selectedBoxAmenityIds.length > 0) count++;
    if (filters.availableSpaces !== "any") count++;
    if (filters.boxSize !== "any") count++;
    if (filters.boxType !== "any") count++;
    if (filters.horseSize !== "any") count++;
    if (filters.occupancyStatus !== "available") count++;
    return count;
  }, [filters, localPrices, searchMode]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Handle price range slider changes
  const handlePriceRangeChange = (values: number[]) => {
    const [min, max] = values;
    if (searchMode === "stables") {
      setLocalPrices((prev) => ({
        ...prev,
        stableMinPrice: min.toString(),
        stableMaxPrice: max.toString(),
      }));
    } else {
      setLocalPrices((prev) => ({
        ...prev,
        boxMinPrice: min.toString(),
        boxMaxPrice: max.toString(),
      }));
    }
  };

  // Get current price range for slider
  const getCurrentPriceRange = (): [number, number] => {
    if (searchMode === "stables") {
      const min = localPrices.stableMinPrice
        ? parseInt(localPrices.stableMinPrice)
        : STABLE_PRICE_RANGE.min;
      const max = localPrices.stableMaxPrice
        ? parseInt(localPrices.stableMaxPrice)
        : STABLE_PRICE_RANGE.max;
      return [min, max];
    } else {
      const min = localPrices.boxMinPrice ? parseInt(localPrices.boxMinPrice) : BOX_PRICE_RANGE.min;
      const max = localPrices.boxMaxPrice ? parseInt(localPrices.boxMaxPrice) : BOX_PRICE_RANGE.max;
      return [min, max];
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nb-NO").format(price);
  };

  const handleFylkeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      fylkeId: value,
      kommuneId: "", // Reset kommune when fylke changes
    });
  };

  const handleKommuneChange = (value: string) => {
    onFiltersChange({ ...filters, kommuneId: value });
  };

  const handleStableAmenityToggle = (amenityId: string) => {
    const newSelectedIds = filters.selectedStableAmenityIds.includes(amenityId)
      ? filters.selectedStableAmenityIds.filter((id) => id !== amenityId)
      : [...filters.selectedStableAmenityIds, amenityId];

    onFiltersChange({ ...filters, selectedStableAmenityIds: newSelectedIds });
  };

  const handleBoxAmenityToggle = (amenityId: string) => {
    const newSelectedIds = filters.selectedBoxAmenityIds.includes(amenityId)
      ? filters.selectedBoxAmenityIds.filter((id) => id !== amenityId)
      : [...filters.selectedBoxAmenityIds, amenityId];

    onFiltersChange({ ...filters, selectedBoxAmenityIds: newSelectedIds });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      fylkeId: "",
      kommuneId: "",
      minPrice: "",
      maxPrice: "",
      selectedStableAmenityIds: [],
      selectedBoxAmenityIds: [],
      availableSpaces: "any",
      boxSize: "any",
      boxType: "any",
      horseSize: "any",
      occupancyStatus: "available",
      // Clear separate price fields
      stableMinPrice: "",
      stableMaxPrice: "",
      boxMinPrice: "",
      boxMaxPrice: "",
    };

    setLocalPrices({
      stableMinPrice: "",
      stableMaxPrice: "",
      boxMinPrice: "",
      boxMaxPrice: "",
    });
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-h4 text-gray-900">Filtre</h2>
          {activeFiltersCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-blue-100 text-blue-800">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Search Mode Toggle */}
        <div>
          <label className="block text-body-sm font-medium text-gray-700 mb-3">Søk etter</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSearchModeChange("boxes")}
              className={cn(
                "flex items-center justify-center px-4 py-3 text-button rounded-xl border-2 transition-all duration-200 touch-manipulation",
                searchMode === "boxes"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <CubeIcon className="h-4 w-4 mr-2" />
              Bokser
            </button>
            <button
              onClick={() => onSearchModeChange("stables")}
              className={cn(
                "flex items-center justify-center px-4 py-3 text-button rounded-xl border-2 transition-all duration-200 touch-manipulation",
                searchMode === "stables"
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <BuildingOffice2Icon className="h-4 w-4 mr-2" />
              Staller
            </button>
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Fylke</label>
            <select
              value={filters.fylkeId}
              onChange={(e) => handleFylkeChange(e.target.value)}
              disabled={loadingFylker}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
            >
              <option value="">Alle fylker</option>
              {fylker.map((fylke) => (
                <option key={fylke.id} value={fylke.id}>
                  {fylke.navn}
                </option>
              ))}
            </select>
          </div>

          {filters.fylkeId && (
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Kommune</label>
              <select
                value={filters.kommuneId}
                onChange={(e) => handleKommuneChange(e.target.value)}
                disabled={loadingKommuner}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
              >
                <option value="">Hele fylket</option>
                {kommuner.map((kommune) => (
                  <option key={kommune.id} value={kommune.id}>
                    {kommune.navn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Price Range Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-body-sm font-medium text-gray-700">Prisklasse per måned</label>
            <span className="text-caption text-gray-500">
              {formatPrice(getCurrentPriceRange()[0])} - {formatPrice(getCurrentPriceRange()[1])}{" "}
              kr/mnd
            </span>
          </div>
          <div className="px-2 py-4">
            <Slider
              value={getCurrentPriceRange()}
              onValueChange={handlePriceRangeChange}
              min={searchMode === "stables" ? STABLE_PRICE_RANGE.min : BOX_PRICE_RANGE.min}
              max={searchMode === "stables" ? STABLE_PRICE_RANGE.max : BOX_PRICE_RANGE.max}
              step={searchMode === "stables" ? STABLE_PRICE_RANGE.step : BOX_PRICE_RANGE.step}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-caption text-gray-400 mt-1">
            <span>
              {formatPrice(searchMode === "stables" ? STABLE_PRICE_RANGE.min : BOX_PRICE_RANGE.min)}{" "}
              kr
            </span>
            <span>
              {formatPrice(searchMode === "stables" ? STABLE_PRICE_RANGE.max : BOX_PRICE_RANGE.max)}{" "}
              kr
            </span>
          </div>
        </div>

        {/* Available Spaces - Only for stable search */}
        {searchMode === "stables" && (
          <div>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.availableSpaces === "available"}
                onChange={(e) =>
                  handleFilterChange("availableSpaces", e.target.checked ? "available" : "any")
                }
                className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded transition-colors"
              />
              <span className="ml-3 text-body text-gray-700 group-hover:text-gray-900 transition-colors">
                Kun staller med ledige plasser
              </span>
            </label>
          </div>
        )}

        {/* Box-specific filters */}
        {searchMode === "boxes" && (
          <div className="space-y-4">
            {/* Occupancy Status */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">
                Beleggsstatus
              </label>
              <select
                value={filters.occupancyStatus || "available"}
                onChange={(e) => handleFilterChange("occupancyStatus", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="available">Kun ledige bokser</option>
                <option value="occupied">Kun opptatte bokser</option>
                <option value="all">Alle bokser</option>
              </select>
            </div>

            {/* Box Size */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">
                Boks størrelse
              </label>
              <select
                value={filters.boxSize || "any"}
                onChange={(e) => handleFilterChange("boxSize", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="any">Alle størrelser</option>
                <option value="SMALL">Liten</option>
                <option value="MEDIUM">Middels (ca 3x3m)</option>
                <option value="LARGE">Stor</option>
              </select>
            </div>

            {/* Indoor/Outdoor */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Boks type</label>
              <select
                value={filters.boxType || "any"}
                onChange={(e) => handleFilterChange("boxType", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="any">Alle typer</option>
                <option value="boks">Boks</option>
                <option value="utegang">Utegang</option>
              </select>
            </div>

            {/* Horse Size */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">
                Hestestørrelse
              </label>
              <select
                value={filters.horseSize || "any"}
                onChange={(e) => handleFilterChange("horseSize", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="any">Alle størrelser</option>
                <option value="pony">Ponni</option>
                <option value="small">Liten hest</option>
                <option value="medium">Middels hest</option>
                <option value="large">Stor hest</option>
              </select>
            </div>
          </div>
        )}

        {/* Stable Amenities - Show for stable search */}
        {searchMode === "stables" && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-3">
              Stall-fasiliteter
            </label>
            <div className="flex flex-wrap gap-2">
              {stableAmenities.map((amenity) => (
                <button
                  key={`stable-${amenity.id}`}
                  onClick={() => handleStableAmenityToggle(amenity.id)}
                  className={cn(
                    "px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full text-caption sm:text-xs font-medium border transition-all duration-200 touch-manipulation",
                    filters.selectedStableAmenityIds.includes(amenity.id)
                      ? "border-blue-500 bg-blue-100 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {amenity.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Box Amenities - Show for box search */}
        {searchMode === "boxes" && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-3">
              Boks-fasiliteter
            </label>
            <div className="flex flex-wrap gap-2">
              {boxAmenities.map((amenity) => (
                <button
                  key={`box-${amenity.id}`}
                  onClick={() => handleBoxAmenityToggle(amenity.id)}
                  className={cn(
                    "px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full text-caption sm:text-xs font-medium border transition-all duration-200 touch-manipulation",
                    filters.selectedBoxAmenityIds.includes(amenity.id)
                      ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  {amenity.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full py-2.5 text-button hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-colors"
          >
            Nullstill filtre
          </Button>
        </div>
      </div>
    </div>
  );
}
