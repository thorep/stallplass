"use client";

import { Button } from "@/components/ui/button";
import AdvertisingPromotionCard from "@/components/molecules/AdvertisingPromotionCard";
import BoxListingCard from "@/components/molecules/BoxListingCard";
import HorseSaleCard from "@/components/molecules/HorseSaleCard";
import HorseBuyCard from "@/components/molecules/HorseBuyCard";
import PartLoanHorseCard from "@/components/molecules/PartLoanHorseCard";
import SearchSort from "@/components/molecules/SearchSort";
import ServiceCard from "@/components/molecules/ServiceCard";
import StableListingCard from "@/components/molecules/StableListingCard";
import SearchFiltersComponent from "@/components/organisms/SearchFilters";
import { useAdvertisementInjection } from "@/hooks/useAdvertisementInjection";
import { HorseSale } from "@/hooks/useHorseSales";
import { PartLoanHorse } from "@/hooks/usePartLoanHorses";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import {
  useInfiniteBoxSearch,
  useInfiniteHorseSalesSearch,
  useInfiniteHorseBuysSearch,
  useInfinitePartLoanHorseSearch,
  useInfiniteServiceSearch,
  useInfiniteStableSearch,
} from "@/hooks/useUnifiedSearch";
import { cn } from "@/lib/utils";
import { SearchFilters, SearchPageClientProps } from "@/types/components";
import { ServiceWithDetails } from "@/types/service";
import { StableWithBoxStats } from "@/types/stable";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SearchMode = "stables" | "boxes" | "services" | "forhest" | "horse_sales";
type SortOption =
  | "newest"
  | "oldest"
  | "price_low"
  | "price_high"
  | "rating_high"
  | "rating_low"
  | "available_high"
  | "available_low"
  | "sponsored_first"
  | "name_asc"
  | "name_desc";

export default function SearchPageClientSimple({
  stableAmenities,
  boxAmenities,
}: SearchPageClientProps) {
  // URL parameter hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { searchResultClicked } = usePostHogEvents();

  const [searchMode, setSearchMode] = useState<SearchMode>("boxes");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const [filters, setFilters] = useState<SearchFilters>({
    fylkeId: "",
    kommuneId: "",
    minPrice: "",
    maxPrice: "",
    horseTrade: 'sell',
    selectedStableAmenityIds: [],
    selectedBoxAmenityIds: [],
    availableSpaces: "any",
    boxSize: "any",
    boxType: "any",
    horseSize: "any",
    occupancyStatus: "available", // Default to available boxes only
    dagsleie: "any",
    // Separate price filters for each view
    stableMinPrice: "",
    stableMaxPrice: "",
    boxMinPrice: "",
    boxMaxPrice: "",
    // Service-specific filters
    serviceType: "any",
    // Horse sales-specific filters
    breedId: "",
    disciplineId: "",
    gender: "",
    minAge: "",
    maxAge: "",
    horseSalesSize: "",
    minHeight: "",
    maxHeight: "",
  });

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const mode = searchParams.get("mode") as SearchMode;
    const sort = searchParams.get("sort") as SortOption;

    if (
      mode === "stables" ||
      mode === "boxes" ||
      mode === "services" ||
      mode === "forhest" ||
      mode === "horse_sales"
    ) {
      setSearchMode(mode);
    }

    if (sort) {
      setSortOption(sort);
    }

    // Initialize filters from URL
    const urlFilters: SearchFilters = {
      fylkeId: searchParams.get("fylkeId") || "",
      kommuneId: searchParams.get("kommuneId") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      horseTrade: (searchParams.get("horseTrade") as 'sell' | 'buy') || 'sell',
      selectedStableAmenityIds:
        searchParams.get("stableAmenities")?.split(",").filter(Boolean) || [],
      selectedBoxAmenityIds: searchParams.get("boxAmenities")?.split(",").filter(Boolean) || [],
      availableSpaces: searchParams.get("availableSpaces") || "any",
      boxSize: searchParams.get("boxSize") || "any",
      boxType: searchParams.get("boxType") || "any",
      horseSize: searchParams.get("horseSize") || "any",
      occupancyStatus: searchParams.get("occupancyStatus") || "available",
      dagsleie: searchParams.get("dagsleie") || "any",
      // Separate price filters from URL
      stableMinPrice: searchParams.get("stableMinPrice") || "",
      stableMaxPrice: searchParams.get("stableMaxPrice") || "",
      boxMinPrice: searchParams.get("boxMinPrice") || "",
      boxMaxPrice: searchParams.get("boxMaxPrice") || "",
      serviceType: searchParams.get("serviceType") || "any",
      // Horse sales filters from URL
      breedId: searchParams.get("breedId") || "",
      disciplineId: searchParams.get("disciplineId") || "",
      gender: searchParams.get("gender") || "",
      minAge: searchParams.get("minAge") || "",
      maxAge: searchParams.get("maxAge") || "",
      horseSalesSize: searchParams.get("horseSalesSize") || "",
      minHeight: searchParams.get("minHeight") || "",
      maxHeight: searchParams.get("maxHeight") || "",
    };

    setFilters(urlFilters);
  }, [searchParams]); // Run when URL parameters change

  // Update URL when filters, search mode, or sort changes (debounced for price inputs)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      // Add search mode and sort
      if (searchMode !== "boxes") params.set("mode", searchMode);
      if (sortOption !== "newest") params.set("sort", sortOption);

      // Add filters to URL (only if they have non-default values)
      if (filters.fylkeId) params.set("fylkeId", filters.fylkeId);
      if (filters.kommuneId) params.set("kommuneId", filters.kommuneId);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (searchMode === 'horse_sales' && filters.horseTrade && filters.horseTrade !== 'sell') params.set('horseTrade', filters.horseTrade);

      // Add separate price filters
      if (filters.stableMinPrice) params.set("stableMinPrice", filters.stableMinPrice);
      if (filters.stableMaxPrice) params.set("stableMaxPrice", filters.stableMaxPrice);
      if (filters.boxMinPrice) params.set("boxMinPrice", filters.boxMinPrice);
      if (filters.boxMaxPrice) params.set("boxMaxPrice", filters.boxMaxPrice);

      if (filters.selectedStableAmenityIds.length > 0) {
        params.set("stableAmenities", filters.selectedStableAmenityIds.join(","));
      }
      if (filters.selectedBoxAmenityIds.length > 0) {
        params.set("boxAmenities", filters.selectedBoxAmenityIds.join(","));
      }
      if (filters.availableSpaces !== "any") params.set("availableSpaces", filters.availableSpaces);
      if (filters.boxSize !== "any") params.set("boxSize", filters.boxSize);
      if (filters.boxType !== "any") params.set("boxType", filters.boxType);
      if (filters.horseSize !== "any") params.set("horseSize", filters.horseSize);
      if (filters.occupancyStatus !== "available")
        params.set("occupancyStatus", filters.occupancyStatus);
      if (filters.dagsleie !== "any") params.set("dagsleie", filters.dagsleie);
      if (filters.serviceType !== "any") params.set("serviceType", filters.serviceType);
      // Horse sales filters
      if (filters.breedId) params.set("breedId", filters.breedId);
      if (filters.disciplineId) params.set("disciplineId", filters.disciplineId);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.minAge) params.set("minAge", filters.minAge);
      if (filters.maxAge) params.set("maxAge", filters.maxAge);
      if (filters.horseSalesSize && filters.horseTrade !== 'buy') params.set("horseSalesSize", filters.horseSalesSize);
      if (filters.minHeight && filters.horseTrade === 'buy') params.set('minHeight', filters.minHeight);
      if (filters.maxHeight && filters.horseTrade === 'buy') params.set('maxHeight', filters.maxHeight);

      // Update URL without causing a navigation
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce to avoid excessive URL updates while typing in price fields

    return () => clearTimeout(timeoutId);
  }, [filters, searchMode, sortOption, pathname, router]);

  // Convert SearchFilters to unified search format
  const searchFilters = useMemo(
    () => ({
      fylkeId: filters.fylkeId || undefined,
      kommuneId: filters.kommuneId || undefined,
      minPrice:
        searchMode === "stables"
          ? filters.stableMinPrice
            ? parseInt(filters.stableMinPrice)
            : undefined
          : searchMode === "horse_sales"
          ? filters.minPrice
            ? parseInt(filters.minPrice)
            : undefined
          : filters.boxMinPrice
          ? parseInt(filters.boxMinPrice)
          : undefined,
      maxPrice:
        searchMode === "stables"
          ? filters.stableMaxPrice
            ? parseInt(filters.stableMaxPrice)
            : undefined
          : searchMode === "horse_sales"
          ? filters.maxPrice
            ? parseInt(filters.maxPrice)
            : undefined
          : filters.boxMaxPrice
          ? parseInt(filters.boxMaxPrice)
          : undefined,
      amenityIds:
        searchMode === "stables"
          ? filters.selectedStableAmenityIds.length > 0
            ? filters.selectedStableAmenityIds
            : undefined
          : filters.selectedBoxAmenityIds.length > 0
          ? filters.selectedBoxAmenityIds
          : undefined,

      // Pass stable amenity IDs separately for box search
      stableAmenityIds:
        searchMode === "boxes" && filters.selectedStableAmenityIds.length > 0
          ? filters.selectedStableAmenityIds
          : undefined,

      // Box-specific filters (ignored when mode is 'stables')
      occupancyStatus: filters.occupancyStatus as "all" | "available" | "occupied" | undefined,
      boxSize: filters.boxSize !== "any" ? filters.boxSize : undefined,
      boxType: filters.boxType !== "any" ? (filters.boxType as "boks" | "utegang") : undefined,
      horseSize: filters.horseSize !== "any" ? filters.horseSize : undefined,
      dagsleie: filters.dagsleie !== "any" ? filters.dagsleie === "yes" : undefined,

      // Stable-specific filters (ignored when mode is 'boxes')
      availableSpaces:
        filters.availableSpaces !== "any" ? (filters.availableSpaces as "available") : undefined,

      // Service-specific filters (ignored when mode is not 'services')
      serviceType:
        searchMode === "services" && filters.serviceType !== "any"
          ? filters.serviceType
          : undefined,

      // Horse sales/buys filters (ignored when mode is not 'horse_sales')
      horseTrade: searchMode === 'horse_sales' ? (filters.horseTrade || 'sell') : undefined,
      breedId: searchMode === 'horse_sales' && filters.breedId ? filters.breedId : undefined,
      disciplineId: searchMode === 'horse_sales' && filters.disciplineId ? filters.disciplineId : undefined,
      gender: searchMode === 'horse_sales' && filters.gender ? (filters.gender as 'HOPPE' | 'HINGST' | 'VALLACH') : undefined,
      minAge: searchMode === 'horse_sales' && filters.minAge ? parseInt(filters.minAge) : undefined,
      maxAge: searchMode === 'horse_sales' && filters.maxAge ? parseInt(filters.maxAge) : undefined,
      horseSalesSize: searchMode === 'horse_sales' && filters.horseTrade !== 'buy' && filters.horseSalesSize
        ? (filters.horseSalesSize as 'KATEGORI_4' | 'KATEGORI_3' | 'KATEGORI_2' | 'KATEGORI_1' | 'UNDER_160' | 'SIZE_160_170' | 'OVER_170')
        : undefined,
      minHeight: searchMode === 'horse_sales' && filters.horseTrade === 'buy' && filters.minHeight ? parseInt(filters.minHeight) : undefined,
      maxHeight: searchMode === 'horse_sales' && filters.horseTrade === 'buy' && filters.maxHeight ? parseInt(filters.maxHeight) : undefined,
    }),
    [filters, searchMode]
  );

  // Add sortBy to searchFilters
  const searchFiltersWithSort = useMemo(
    () => ({
      ...searchFilters,
      sortBy: sortOption,
    }),
    [searchFilters, sortOption]
  );

  // Use infinite search hooks
  const {
    data: stablesData,
    isLoading: stablesLoading,
    error: stablesError,
    fetchNextPage: fetchNextStablesPage,
    hasNextPage: hasNextStablesPage,
    isFetchingNextPage: isFetchingNextStablesPage,
    refetch: refetchStables,
  } = useInfiniteStableSearch(searchMode === "stables" ? searchFiltersWithSort : {});

  const {
    data: boxesData,
    isLoading: boxesLoading,
    error: boxesError,
    fetchNextPage: fetchNextBoxesPage,
    hasNextPage: hasNextBoxesPage,
    isFetchingNextPage: isFetchingNextBoxesPage,
    refetch: refetchBoxes,
  } = useInfiniteBoxSearch(searchMode === "boxes" ? searchFiltersWithSort : {});

  const {
    data: servicesData,
    isLoading: servicesLoading,
    error: servicesError,
    fetchNextPage: fetchNextServicesPage,
    hasNextPage: hasNextServicesPage,
    isFetchingNextPage: isFetchingNextServicesPage,
    refetch: refetchServices,
  } = useInfiniteServiceSearch(searchMode === "services" ? searchFiltersWithSort : {});

  const {
    data: partLoanHorsesData,
    isLoading: partLoanHorsesLoading,
    error: partLoanHorsesError,
    fetchNextPage: fetchNextPartLoanHorsesPage,
    hasNextPage: hasNextPartLoanHorsesPage,
    isFetchingNextPage: isFetchingNextPartLoanHorsesPage,
    refetch: refetchPartLoanHorses,
  } = useInfinitePartLoanHorseSearch(searchMode === "forhest" ? searchFiltersWithSort : {});

  const {
    data: horseSalesData,
    isLoading: horseSalesLoading,
    error: horseSalesError,
    fetchNextPage: fetchNextHorseSalesPage,
    hasNextPage: hasNextHorseSalesPage,
    isFetchingNextPage: isFetchingNextHorseSalesPage,
    refetch: refetchHorseSales,
  } = useInfiniteHorseSalesSearch(searchMode === "horse_sales" && (filters.horseTrade || 'sell') === 'sell' ? searchFiltersWithSort : {});

  // Horse buys (wanted)
  const {
    data: horseBuysData,
    isLoading: horseBuysLoading,
    error: horseBuysError,
    fetchNextPage: fetchNextHorseBuysPage,
    hasNextPage: hasNextHorseBuysPage,
    isFetchingNextPage: isFetchingNextHorseBuysNextPage,
    refetch: refetchHorseBuys,
  } = useInfiniteHorseBuysSearch(searchMode === 'horse_sales' && filters.horseTrade === 'buy' ? searchFiltersWithSort : {} as any);

  // Flatten paginated data
  const stables = useMemo(
    () => stablesData?.pages?.flatMap((page) => page.items) || [],
    [stablesData]
  );

  const boxes = useMemo(() => boxesData?.pages?.flatMap((page) => page.items) || [], [boxesData]);

  const services = useMemo(
    () => servicesData?.pages?.flatMap((page) => page.items) || [],
    [servicesData]
  );

  const partLoanHorses = useMemo(
    () => partLoanHorsesData?.pages?.flatMap((page) => page.items) || [],
    [partLoanHorsesData]
  );

  const horseSales = useMemo(() => horseSalesData?.pages?.flatMap((page) => page.items) || [], [horseSalesData]);
  const horseBuys = useMemo(() => horseBuysData?.pages?.flatMap((page) => page.items as HorseBuy[]) || [], [horseBuysData]);

  // Create a search key that changes when filters/sort change to trigger ad recalculation
  const searchKey = useMemo(() => {
    return JSON.stringify({ searchFiltersWithSort, searchMode });
  }, [searchFiltersWithSort, searchMode]);

  // Advertisement injection for each search type
  const { shouldShowAd: shouldShowBoxAd, adPosition: boxAdPosition } = useAdvertisementInjection({
    items: boxes,
    enabled: searchMode === "boxes",
    searchKey,
  });

  const { shouldShowAd: shouldShowStableAd, adPosition: stableAdPosition } =
    useAdvertisementInjection({
      items: stables,
      enabled: searchMode === "stables",
      searchKey,
    });

  const { shouldShowAd: shouldShowServiceAd, adPosition: serviceAdPosition } =
    useAdvertisementInjection({
      items: services,
      enabled: searchMode === "services",
      searchKey,
    });

  const { shouldShowAd: shouldShowPartLoanHorseAd, adPosition: partLoanHorseAdPosition } =
    useAdvertisementInjection({
      items: partLoanHorses,
      enabled: searchMode === "forhest",
      searchKey,
    });

  const { shouldShowAd: shouldShowHorseSaleAd, adPosition: horseSaleAdPosition } =
    useAdvertisementInjection({
      items: horseSales,
      enabled: searchMode === "horse_sales",
      searchKey,
    });

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Determine current loading and error states
  const isLoading =
    searchMode === "stables"
      ? stablesLoading
      : searchMode === "boxes"
      ? boxesLoading
      : searchMode === "services"
      ? servicesLoading
      : searchMode === "forhest"
      ? partLoanHorsesLoading
      : (filters.horseTrade || 'sell') === 'buy' ? horseBuysLoading : horseSalesLoading;
  const error =
    searchMode === "stables"
      ? stablesError
        ? stablesError.message
        : null
      : searchMode === "boxes"
      ? boxesError
        ? boxesError.message
        : null
      : searchMode === "services"
      ? servicesError
        ? servicesError.message
        : null
      : searchMode === "forhest"
      ? partLoanHorsesError
        ? partLoanHorsesError.message
        : null
      : (filters.horseTrade || 'sell') === 'buy'
      ? (horseBuysError ? (horseBuysError as any).message : null)
      : horseSalesError
      ? horseSalesError.message
      : null;

  // Current items are already sorted by the API
  const currentItems =
    searchMode === "stables"
      ? stables
      : searchMode === "boxes"
      ? boxes
      : searchMode === "services"
      ? services
      : searchMode === "forhest"
      ? partLoanHorses
      : (filters.horseTrade || 'sell') === 'buy' ? (horseBuys as HorseBuy[]) : horseSales;

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    if (searchMode === "stables" && hasNextStablesPage && !isFetchingNextStablesPage) {
      fetchNextStablesPage();
    } else if (searchMode === "boxes" && hasNextBoxesPage && !isFetchingNextBoxesPage) {
      fetchNextBoxesPage();
    } else if (searchMode === "services" && hasNextServicesPage && !isFetchingNextServicesPage) {
      fetchNextServicesPage();
    } else if (
      searchMode === "forhest" &&
      hasNextPartLoanHorsesPage &&
      !isFetchingNextPartLoanHorsesPage
    ) {
      fetchNextPartLoanHorsesPage();
    } else if (searchMode === "horse_sales") {
      if ((filters.horseTrade || 'sell') === 'buy') {
        if (hasNextHorseBuysPage && !isFetchingNextHorseBuysNextPage) fetchNextHorseBuysPage();
      } else {
        if (hasNextHorseSalesPage && !isFetchingNextHorseSalesPage) fetchNextHorseSalesPage();
      }
    }
  }, [
    searchMode,
    hasNextStablesPage,
    isFetchingNextStablesPage,
    fetchNextStablesPage,
    hasNextBoxesPage,
    isFetchingNextBoxesPage,
    fetchNextBoxesPage,
    hasNextServicesPage,
    isFetchingNextServicesPage,
    fetchNextServicesPage,
    hasNextPartLoanHorsesPage,
    isFetchingNextPartLoanHorsesPage,
    fetchNextPartLoanHorsesPage,
    hasNextHorseSalesPage,
    isFetchingNextHorseSalesPage,
    fetchNextHorseSalesPage,
    filters.horseTrade,
    hasNextHorseBuysPage,
    isFetchingNextHorseBuysNextPage,
    fetchNextHorseBuysPage,
  ]);

  // Check if we can load more
  const canLoadMore =
    searchMode === "stables"
      ? hasNextStablesPage
      : searchMode === "boxes"
      ? hasNextBoxesPage
      : searchMode === "services"
      ? hasNextServicesPage
      : searchMode === "forhest"
      ? hasNextPartLoanHorsesPage
      : (filters.horseTrade || 'sell') === 'buy' ? hasNextHorseBuysPage : hasNextHorseSalesPage;
  const isLoadingMore =
    searchMode === "stables"
      ? isFetchingNextStablesPage
      : searchMode === "boxes"
      ? isFetchingNextBoxesPage
      : searchMode === "services"
      ? isFetchingNextServicesPage
      : searchMode === "forhest"
      ? isFetchingNextPartLoanHorsesPage
      : (filters.horseTrade || 'sell') === 'buy' ? isFetchingNextHorseBuysNextPage : isFetchingNextHorseSalesPage;

  // Intersection observer for automatic infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && canLoadMore && !isLoadingMore) {
        handleLoadMore();
      }
    },
    [canLoadMore, isLoadingMore, handleLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [observerCallback]);

  // Track search events when filters change
  useEffect(() => {
    // Skip tracking on initial load (when all filters are empty)
    const hasActiveFilters =
      filters.fylkeId ||
      filters.kommuneId ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.selectedStableAmenityIds.length > 0 ||
      filters.selectedBoxAmenityIds.length > 0 ||
      filters.availableSpaces !== "any" ||
      filters.boxSize !== "any" ||
      filters.boxType !== "any" ||
      filters.horseSize !== "any" ||
      filters.occupancyStatus !== "available" ||
      filters.dagsleie !== "any" ||
      filters.stableMinPrice ||
      filters.stableMaxPrice ||
      filters.boxMinPrice ||
      filters.boxMaxPrice ||
      filters.serviceType !== "any" ||
      filters.breedId ||
      filters.disciplineId ||
      filters.gender ||
      filters.minAge ||
      filters.maxAge ||
      filters.horseSalesSize;

    if (hasActiveFilters) {
      // Create a query string representation for tracking
      const queryParts: string[] = [];
      if (filters.fylkeId) queryParts.push(`fylke:${filters.fylkeId}`);
      if (filters.kommuneId) queryParts.push(`kommune:${filters.kommuneId}`);
      if (filters.serviceType !== "any") queryParts.push(`service:${filters.serviceType}`);
    }
  }, [searchFiltersWithSort, searchMode, currentItems.length, filters]);

  // Auto-hide filters on mobile when search mode changes
  const handleSearchModeChange = (
    mode: "stables" | "boxes" | "services" | "forhest" | "horse_sales"
  ) => {
    setSearchMode(mode);
    // Optionally hide filters on mobile after selection
    if (isMobile) {
      setShowFilters(false);
    }
  };

  const handleRefresh = () => {
    if (searchMode === "stables") {
      refetchStables();
    } else if (searchMode === "boxes") {
      refetchBoxes();
    } else if (searchMode === "services") {
      refetchServices();
    } else if (searchMode === "forhest") {
      refetchPartLoanHorses();
    } else {
      refetchHorseSales();
    }
  };

  // Click handlers for search result tracking
  const handleStableClick = (stable: StableWithBoxStats, index: number) => {
    searchResultClicked({
      result_type: "stable",
      result_id: stable.id,
      position: index + 1,
    });
  };

  const handleBoxClick = (box: { id: string }, index: number) => {
    searchResultClicked({
      result_type: "box",
      result_id: box.id,
      position: index + 1,
    });
  };

  const handleServiceClick = (service: ServiceWithDetails, index: number) => {
    searchResultClicked({
      result_type: "service",
      result_id: service.id,
      position: index + 1,
    });
  };

  const handlePartLoanHorseClick = (partLoanHorse: PartLoanHorse, index: number) => {
    searchResultClicked({
      result_type: "forhest",
      result_id: partLoanHorse.id,
      position: index + 1,
    });
  };

  const handleHorseSaleClick = (horseSale: HorseSale, index: number) => {
    searchResultClicked({
      result_type: "horse_sale",
      result_id: horseSale.id,
      position: index + 1,
    });
  };

  const handleHorseBuyClick = (horseBuy: HorseBuy, index: number) => {
    searchResultClicked({
      result_type: "horse_buy",
      result_id: horseBuy.id,
      position: index + 1,
    });
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
      {/* Mobile: Filter Toggle Button */}
      <div className="lg:hidden mb-4 order-0">
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center"
        >
          {showFilters ? (
            <>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Skjul filtre
            </>
          ) : (
            <>
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Vis filtre
            </>
          )}
        </Button>

        {/* Mobile: Search Mode Toggle Pills - Outside expandable filters */}
        <div className="mt-3">
            <div className="bg-gray-100 p-1 rounded-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => handleSearchModeChange("boxes")}
                  className={cn(
                    "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center",
                    searchMode === "boxes"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-cyan-700 hover:bg-white"
                )}
              >
                Stallplasser
              </button>
              <button
                onClick={() => handleSearchModeChange("horse_sales")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center",
                  searchMode === "horse_sales"
                    ? "bg-fuchsia-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-fuchsia-700 hover:bg-white"
                )}
              >
                Hest
              </button>
              <button
                onClick={() => handleSearchModeChange("forhest")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center",
                  searchMode === "forhest"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-orange-700 hover:bg-white"
                )}
              >
                Fôrhest
              </button>
              <button
                onClick={() => handleSearchModeChange("stables")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center",
                  searchMode === "stables"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-blue-700 hover:bg-white"
                )}
              >
                Staller
              </button>
                <button
                  onClick={() => handleSearchModeChange("services")}
                  className={cn(
                    "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center",
                    searchMode === "services"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-violet-700 hover:bg-white"
                )}
              >
                Tjenester
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`lg:col-span-1 order-1 ${showFilters ? "block" : "hidden lg:block"}`}>
        <SearchFiltersComponent
          stableAmenities={stableAmenities}
          boxAmenities={boxAmenities}
          searchMode={searchMode}
          onSearchModeChange={handleSearchModeChange}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Results List */}
      <div className="lg:col-span-3 order-2 min-h-0">
        {/* Search sorting */}
        <SearchSort
          searchMode={searchMode}
          onSortChange={setSortOption}
          currentSort={sortOption}
          totalResults={currentItems.length}
          isLoading={isLoading}
        />
        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">
              Feil ved lasting av{" "}
              {searchMode === "stables"
                ? "staller"
                : searchMode === "boxes"
                ? "bokser"
                : searchMode === "services"
                ? "tjenester"
                : searchMode === "forhest"
                ? "fôrhester"
                : "hester til salgs"}
            </div>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Prøv igjen
            </Button>
          </div>
        )}
        {isLoading && !error ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B4B8A] mx-auto mb-4"></div>
            <div className="text-gray-500 text-lg">
              Laster{" "}
              {searchMode === "stables"
                ? "staller"
                : searchMode === "boxes"
                ? "bokser"
                : searchMode === "services"
                ? "tjenester"
                : searchMode === "forhest"
                ? "fôrhester"
                : "hester til salgs"}
              ...
            </div>
          </div>
        ) : currentItems.length === 0 && !error ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              Ingen{" "}
              {searchMode === "stables"
                ? "staller"
                : searchMode === "boxes"
                ? "bokser"
                : searchMode === "services"
                ? "tjenester"
                : searchMode === "forhest"
                ? "fôrhester"
                : "hester til salgs"}{" "}
              funnet
            </div>
            <p className="text-gray-400">Prøv å justere søkekriteriene dine</p>
          </div>
        ) : (
          <div>
            <div className="space-y-4 sm:space-y-6">
              {searchMode === "stables"
                ? (() => {
                    const results: React.ReactNode[] = [];

                    stables.forEach((stable, index) => {
                      // Insert ad before this stable if we've reached the ad position
                      if (shouldShowStableAd && index === stableAdPosition) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }

                      results.push(
                        <div key={stable.id} onClick={() => handleStableClick(stable, index)}>
                          <StableListingCard
                            stable={stable}
                            highlightedAmenityIds={filters.selectedStableAmenityIds}
                          />
                        </div>
                      );
                    });

                    // If ad position is at the end, add it at the end
                    if (shouldShowStableAd && stableAdPosition === stables.length) {
                      results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                    }

                    return results;
                  })()
                : searchMode === "boxes"
                ? (() => {
                    const results: React.ReactNode[] = [];

                    boxes.forEach((box, index) => {
                      // Insert ad before this box if we've reached the ad position
                      if (shouldShowBoxAd && index === boxAdPosition) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }

                      results.push(
                        <div key={box.id} onClick={() => handleBoxClick(box, index)}>
                          <BoxListingCard
                            box={box}
                            highlightedBoxAmenityIds={filters.selectedBoxAmenityIds}
                            highlightedStableAmenityIds={filters.selectedStableAmenityIds}
                          />
                        </div>
                      );
                    });

                    // If ad position is at the end, add it at the end
                    if (shouldShowBoxAd && boxAdPosition === boxes.length) {
                      results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                    }

                    return results;
                  })()
                : searchMode === "services"
                ? (() => {
                    const results: React.ReactNode[] = [];

                    services.forEach((service, index) => {
                      // Insert ad before this service if we've reached the ad position
                      if (shouldShowServiceAd && index === serviceAdPosition) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }

                      results.push(
                        <div key={service.id} onClick={() => handleServiceClick(service, index)}>
                          <ServiceCard service={service} />
                        </div>
                      );
                    });

                    // If ad position is at the end, add it at the end
                    if (shouldShowServiceAd && serviceAdPosition === services.length) {
                      results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                    }

                    return results;
                  })()
                : searchMode === "forhest"
                ? (() => {
                    const results: React.ReactNode[] = [];

                    partLoanHorses.forEach((partLoanHorse, index) => {
                      // Insert ad before this part-loan horse if we've reached the ad position
                      if (shouldShowPartLoanHorseAd && index === partLoanHorseAdPosition) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }

                      results.push(
                        <div
                          key={partLoanHorse.id}
                          onClick={() => handlePartLoanHorseClick(partLoanHorse, index)}
                        >
                          <PartLoanHorseCard partLoanHorse={partLoanHorse} />
                        </div>
                      );
                    });

                    // If ad position is at the end, add it at the end
                    if (
                      shouldShowPartLoanHorseAd &&
                      partLoanHorseAdPosition === partLoanHorses.length
                    ) {
                      results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                    }

                    return results;
                  })()
                : (() => {
                    const results: React.ReactNode[] = [];
                    const isBuy = filters.horseTrade === 'buy';

                    if (isBuy) {
                      (horseBuys as HorseBuy[]).forEach((horseBuy, index) => {
                        if (shouldShowHorseSaleAd && index === horseSaleAdPosition) {
                          results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                        }
                        results.push(
                          <div key={horseBuy.id} onClick={() => handleHorseBuyClick(horseBuy, index)}>
                            <HorseBuyCard horseBuy={horseBuy} />
                          </div>
                        );
                      });
                      if (shouldShowHorseSaleAd && horseSaleAdPosition === horseBuys.length) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }
                    } else {
                      horseSales.forEach((horseSale, index) => {
                        if (shouldShowHorseSaleAd && index === horseSaleAdPosition) {
                          results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                        }
                        results.push(
                          <div key={horseSale.id} onClick={() => handleHorseSaleClick(horseSale, index)}>
                            <HorseSaleCard horseSale={horseSale} />
                          </div>
                        );
                      });
                      if (shouldShowHorseSaleAd && horseSaleAdPosition === horseSales.length) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }
                    }

                    return results;
                  })()}

              {/* Infinite Scroll Trigger */}
              {canLoadMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isLoadingMore ? (
                    <div className="flex items-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5B4B8A] mr-3"></div>
                      Laster flere{" "}
                      {searchMode === "stables"
                        ? "staller"
                        : searchMode === "boxes"
                        ? "bokser"
                        : searchMode === "services"
                        ? "tjenester"
                        : searchMode === "forhest"
                        ? "fôrhester"
                        : filters.horseTrade === 'buy' ? 'ønskes kjøpt' : "hester til salgs"}
                      ...
                    </div>
                  ) : (
                    <Button onClick={handleLoadMore} variant="outline" className="min-w-[200px]">
                      Last flere{" "}
                      {searchMode === "stables"
                        ? "staller"
                        : searchMode === "boxes"
                        ? "bokser"
                        : searchMode === "services"
                        ? "tjenester"
                        : searchMode === "forhest"
                        ? "fôrhester"
                        : filters.horseTrade === 'buy' ? 'ønskes kjøpt' : "hester til salgs"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
