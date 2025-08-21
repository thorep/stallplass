"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useHorseBreeds, useHorseDisciplines } from "@/hooks/useHorseSales";
import { useFylker, useKommuner } from "@/hooks/useLocationQueries";
import { usePriceRanges } from "@/hooks/usePriceRanges";
import { useActiveServiceTypes } from "@/hooks/usePublicServiceTypes";
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
  dagsleie: string;
  // Separate price filters for each view
  stableMinPrice: string;
  stableMaxPrice: string;
  boxMinPrice: string;
  boxMaxPrice: string;
  // Service-specific filters
  serviceType: string;
  // Horse sales-specific filters
  breedId: string;
  disciplineId: string;
  gender: string;
  minAge: string;
  maxAge: string;
  horseSalesSize: string;
  // Horse wanted/sales toggle and height range (wanted)
  horseTrade?: 'sell' | 'buy';
  minHeight?: string;
  maxHeight?: string;
}

interface SearchFiltersProps {
  stableAmenities: StableAmenity[];
  boxAmenities: BoxAmenity[];
  searchMode: "stables" | "boxes" | "services" | "forhest" | "horse_sales";
  onSearchModeChange: (mode: "stables" | "boxes" | "services" | "forhest" | "horse_sales") => void;
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

  // Service types data
  const { data: serviceTypes = [], isLoading: loadingServiceTypes } = useActiveServiceTypes();

  // Horse sales data
  const { data: horseBreeds = [], isLoading: loadingHorseBreeds } = useHorseBreeds();
  const { data: horseDisciplines = [], isLoading: loadingHorseDisciplines } = useHorseDisciplines();

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

    // Count price filters based on search mode (not for forhest)
    if (searchMode !== "forhest") {
      if (searchMode === "stables") {
        if (localPrices.stableMinPrice) count++;
        if (localPrices.stableMaxPrice) count++;
      } else if (searchMode === "horse_sales") {
        if (filters.minPrice) count++;
        if (filters.maxPrice) count++;
      } else {
        if (localPrices.boxMinPrice) count++;
        if (localPrices.boxMaxPrice) count++;
      }
    }

    if (filters.selectedStableAmenityIds.length > 0) count++;
    if (filters.selectedBoxAmenityIds.length > 0) count++;
    if (filters.availableSpaces !== "any") count++;
    if (filters.boxSize !== "any") count++;
    if (filters.boxType !== "any") count++;
    if (filters.horseSize !== "any") count++;
    if (filters.occupancyStatus !== "available") count++;
    if (filters.dagsleie !== "any") count++;
    if (filters.serviceType && filters.serviceType !== "any") count++;

    // Horse sales filters
    if (filters.breedId) count++;
    if (filters.disciplineId) count++;
    if (filters.gender) count++;
    if (filters.minAge) count++;
    if (filters.maxAge) count++;
    if (filters.horseSalesSize) count++;

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
    } else if (searchMode === "horse_sales") {
      // For horse sales, use the general minPrice/maxPrice
      onFiltersChange({
        ...filters,
        minPrice: min.toString(),
        maxPrice: max.toString(),
      });
    } else if (searchMode !== "forhest") {
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
    } else if (searchMode === "horse_sales") {
      const min = filters.minPrice ? parseInt(filters.minPrice) : 0;
      const max = filters.maxPrice ? parseInt(filters.maxPrice) : 500000; // Default max for horse sales
      return [min, max];
    } else if (searchMode === "forhest") {
      return [0, 0]; // No price range for forhest
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
    const clearedFilters: Filters = {
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
      // Clear dagsleie filter
      dagsleie: "any",
      // Clear service filters
      serviceType: "any",
      // Clear horse sales filters
      breedId: "",
      disciplineId: "",
      gender: "",
      minAge: "",
      maxAge: "",
      horseSalesSize: "",
      horseTrade: 'sell',
      minHeight: "",
      maxHeight: "",
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-4">
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
        {/* Search Mode Toggle - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <label className="block text-body-sm font-medium text-gray-700 mb-3">Søk etter</label>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => onSearchModeChange("boxes")}
              variant={searchMode === "boxes" ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-full text-center touch-manipulation font-medium transition-all duration-200",
                searchMode === "boxes"
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600"
                  : "hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
              )}
            >
              <CubeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="min-w-0">Stallplasser</span>
            </Button>
            <Button
              onClick={() => onSearchModeChange("stables")}
              variant={searchMode === "stables" ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-full text-center touch-manipulation font-medium transition-all duration-200",
                searchMode === "stables"
                  ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  : "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <BuildingOffice2Icon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="min-w-0">Staller</span>
            </Button>
            <Button
              onClick={() => onSearchModeChange("services")}
              variant={searchMode === "services" ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-full text-center touch-manipulation font-medium transition-all duration-200",
                searchMode === "services"
                  ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600"
                  : "hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
              )}
            >
              {/* <WrenchScrewdriverIcon className="h-4 w-4 mr-2 flex-shrink-0" /> */}
              <span className="min-w-0">Tjenester</span>
            </Button>
            <Button
              onClick={() => onSearchModeChange("forhest")}
              variant={searchMode === "forhest" ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-full text-center touch-manipulation font-medium transition-all duration-200",
                searchMode === "forhest"
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                  : "hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              )}
            >
              {/* <SparklesIcon className="h-4 w-4 mr-2 flex-shrink-0" /> */}
              <span className="min-w-0">Fôrhest</span>
            </Button>
            <Button
              onClick={() => onSearchModeChange("horse_sales")}
              variant={searchMode === "horse_sales" ? "default" : "outline"}
              size="lg"
              className={cn(
                "w-full text-center touch-manipulation font-medium transition-all duration-200",
                searchMode === "horse_sales"
                  ? "bg-fuchsia-600 hover:bg-fuchsia-700 text-white border-fuchsia-600"
                  : "hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700"
              )}
            >
              <span className="min-w-0">Hest</span>
            </Button>
          </div>
        </div>

        {/* Kjøp / Salg (only for horse page) */}
        {searchMode === 'horse_sales' && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">Kjøp / Salg</label>
            <select
              value={filters.horseTrade || 'sell'}
              onChange={(e) => onFiltersChange({ ...filters, horseTrade: (e.target.value as 'sell' | 'buy') })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="sell">Salg</option>
              <option value="buy">Ønskes kjøpt</option>
            </select>
          </div>
        )}

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

        {/* Price Range Slider - Not for forhest */}
        {searchMode !== "forhest" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-body-sm font-medium text-gray-700">
                {searchMode === "horse_sales" ? "Prisklasse" : "Prisklasse per måned"}
              </label>
              <span className="text-caption text-gray-500">
                {formatPrice(getCurrentPriceRange()[0])} - {formatPrice(getCurrentPriceRange()[1])}{" "}
                {searchMode === "horse_sales" ? "kr" : "kr/mnd"}
              </span>
            </div>
            <div className="px-2 py-4">
              <Slider
                value={getCurrentPriceRange()}
                onValueChange={handlePriceRangeChange}
                min={
                  searchMode === "stables"
                    ? STABLE_PRICE_RANGE.min
                    : searchMode === "horse_sales"
                    ? 0
                    : BOX_PRICE_RANGE.min
                }
                max={
                  searchMode === "stables"
                    ? STABLE_PRICE_RANGE.max
                    : searchMode === "horse_sales"
                    ? 500000
                    : BOX_PRICE_RANGE.max
                }
                step={
                  searchMode === "stables"
                    ? STABLE_PRICE_RANGE.step
                    : searchMode === "horse_sales"
                    ? 5000
                    : BOX_PRICE_RANGE.step
                }
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-caption text-gray-400 mt-1">
              <span>
                {formatPrice(
                  searchMode === "stables"
                    ? STABLE_PRICE_RANGE.min
                    : searchMode === "horse_sales"
                    ? 0
                    : BOX_PRICE_RANGE.min
                )}{" "}
                kr
              </span>
              <span>
                {formatPrice(
                  searchMode === "stables"
                    ? STABLE_PRICE_RANGE.max
                    : searchMode === "horse_sales"
                    ? 500000
                    : BOX_PRICE_RANGE.max
                )}{" "}
                kr
              </span>
            </div>
          </div>
        )}

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
                Tilgjengelighet
              </label>
              <select
                value={filters.occupancyStatus || "available"}
                onChange={(e) => handleFilterChange("occupancyStatus", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="available">Kun ledige stallplasser</option>
                <option value="occupied">Kun opptatte stallplasser</option>
                <option value="all">Alle stallplasser</option>
              </select>
            </div>

            {/* Box Size */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Størrelse</label>
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
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Type</label>
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

            {/* Dagsleie */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Dagsleie</label>
              <select
                value={filters.dagsleie || "any"}
                onChange={(e) => handleFilterChange("dagsleie", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="any">Alle stallplasser</option>
                <option value="yes">Kun dagsleie</option>
                <option value="no">Ikke dagsleie</option>
              </select>
            </div>
          </div>
        )}

        {/* Service-specific filters */}
        {searchMode === "services" && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Tjenestetype
            </label>
            <select
              value={filters.serviceType || "any"}
              onChange={(e) => handleFilterChange("serviceType", e.target.value)}
              disabled={loadingServiceTypes}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
            >
              <option value="any">Alle typer</option>
              {serviceTypes.map((serviceType) => (
                <option key={serviceType.id} value={serviceType.name}>
                  {serviceType.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Horse sales/buys filters */}
        {searchMode === "horse_sales" && (
          <div className="space-y-4">
            {/* Breed Filter */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Rase</label>
              <select
                value={filters.breedId || ""}
                onChange={(e) => handleFilterChange("breedId", e.target.value)}
                disabled={loadingHorseBreeds}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
              >
                <option value="">Alle raser</option>
                {horseBreeds.map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Disiplin</label>
              <select
                value={filters.disciplineId || ""}
                onChange={(e) => handleFilterChange("disciplineId", e.target.value)}
                disabled={loadingHorseDisciplines}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors"
              >
                <option value="">Alle disipliner</option>
                {horseDisciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter (include Alle always) */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-2">Kjønn</label>
              <select
                value={filters.gender || ""}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Alle kjønn</option>
                <option value="HOPPE">Hoppe</option>
                <option value="HINGST">Hingst</option>
                <option value="VALLACH">Vallach</option>
              </select>
            </div>

            {/* Age Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-gray-700 mb-2">
                  Min alder
                </label>
                <input
                  type="number"
                  value={filters.minAge || ""}
                  onChange={(e) => handleFilterChange("minAge", e.target.value)}
                  placeholder="0"
                  min="0"
                  max="30"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-gray-700 mb-2">
                  Maks alder
                </label>
                <input
                  type="number"
                  value={filters.maxAge || ""}
                  onChange={(e) => handleFilterChange("maxAge", e.target.value)}
                  placeholder="30"
                  min="0"
                  max="30"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Size for sale OR Height range for buy */}
            {(filters.horseTrade || 'sell') === 'sell' ? (
              <div>
                <label className="block text-body-sm font-medium text-gray-700 mb-2">Størrelse</label>
                <select
                  value={filters.horseSalesSize || ""}
                  onChange={(e) => handleFilterChange("horseSalesSize", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Alle størrelser</option>
                  <option value="KATEGORI_4">Kategori 4 (Ponni)</option>
                  <option value="KATEGORI_3">Kategori 3 (Stor ponni)</option>
                  <option value="KATEGORI_2">Kategori 2 (Liten hest)</option>
                  <option value="KATEGORI_1">Kategori 1 (Stor hest)</option>
                  <option value="UNDER_160">Under 160cm</option>
                  <option value="SIZE_160_170">160-170cm</option>
                  <option value="OVER_170">Over 170cm</option>
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Min mankehøyde (cm)</label>
                  <input
                    type="number"
                    value={filters.minHeight || ''}
                    onChange={(e) => handleFilterChange('minHeight', e.target.value)}
                    placeholder="140"
                    min={50}
                    max={250}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Maks mankehøyde (cm)</label>
                  <input
                    type="number"
                    value={filters.maxHeight || ''}
                    onChange={(e) => handleFilterChange('maxHeight', e.target.value)}
                    placeholder="180"
                    min={50}
                    max={250}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-body focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
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

        {/* Stable Amenities for Box Search - Show stable amenities when searching boxes */}
        {searchMode === "boxes" && (
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-3">
              Stall-fasiliteter
            </label>
            <div className="flex flex-wrap gap-2">
              {stableAmenities.map((amenity) => (
                <button
                  key={`stable-for-box-${amenity.id}`}
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
                      ? "border-[#B39DDB] bg-[#F3EFFE] text-[#47396A]"
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
