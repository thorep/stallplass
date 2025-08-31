"use client";

import AdvertisingPromotionCard from "@/components/molecules/AdvertisingPromotionCard";
import BoxListingCard from "@/components/molecules/BoxListingCard";
import HorseBuyCard from "@/components/molecules/HorseBuyCard";
import HorseSaleCard from "@/components/molecules/HorseSaleCard";
import PartLoanHorseCard from "@/components/molecules/PartLoanHorseCard";
import SearchSort from "@/components/molecules/SearchSort";
import ServiceCard from "@/components/molecules/ServiceCard";
import StableListingCard from "@/components/molecules/StableListingCard";
import SearchFiltersComponent from "@/components/organisms/SearchFilters";
import { Button } from "@/components/ui/button";
import { useAdvertisementInjection } from "@/hooks/useAdvertisementInjection";
import type { HorseBuy } from "@/hooks/useHorseBuys";
import { HorseSale } from "@/hooks/useHorseSales";
import { PartLoanHorse } from "@/hooks/usePartLoanHorses";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import type { UnifiedSearchFilters } from "@/hooks/useUnifiedSearch";
import {
  useBoxSearchPage,
  useHorseBuysSearchPage,
  useHorseSalesSearchPage,
  usePartLoanHorseSearchPage,
  useServiceSearchPage,
  useStableSearchPage,
} from "@/hooks/useUnifiedSearch";
import { cn } from "@/lib/utils";
import { SearchFilters, SearchPageClientProps } from "@/types/components";
import { ServiceWithDetails } from "@/types/service";
import { StableWithBoxStats } from "@/types/stable";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const { searchResultClicked, searchPaginationClicked } = usePostHogEvents();

  const [searchMode, setSearchMode] = useState<SearchMode>("boxes");
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  // Page from URL (default 1)
  const pageFromUrl = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const [filters, setFilters] = useState<SearchFilters>({
    fylkeId: "",
    kommuneId: "",
    minPrice: "",
    maxPrice: "",
    horseTrade: "sell",
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

  // Compute a key for URL params that ignores only `page`, so page changes don't re-init filters
  const nonPageParamsKey = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    return p.toString();
  }, [searchParams]);

  // Initialize state from URL parameters (ignore pure `page` changes)
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
      if (mode !== searchMode) setSearchMode(mode);
    }

    if (sort && sort !== sortOption) {
      setSortOption(sort);
    }

    // Initialize filters from URL
    const urlFilters: SearchFilters = {
      fylkeId: searchParams.get("fylkeId") || "",
      kommuneId: searchParams.get("kommuneId") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      horseTrade: (searchParams.get("horseTrade") as "sell" | "buy") || "sell",
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

    // Only set filters when the content actually differs
    setFilters((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(urlFilters);
      return same ? prev : urlFilters;
    });
  }, [nonPageParamsKey]);

  // Track the last query key for filters/mode/sort to allow page to update only on actual changes
  const lastQueryKeyRef = useRef<string>("");

  // Update URL when filters, search mode, or sort changes (debounced for price inputs)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const queryKey = JSON.stringify({ searchMode, sortOption, filters });
      const hasChanged = queryKey !== lastQueryKeyRef.current;
      lastQueryKeyRef.current = queryKey;
      const params = new URLSearchParams();

      // Add search mode and sort
      if (searchMode !== "boxes") params.set("mode", searchMode);
      if (sortOption !== "newest") params.set("sort", sortOption);

      // Add filters to URL (only if they have non-default values)
      if (filters.fylkeId) params.set("fylkeId", filters.fylkeId);
      if (filters.kommuneId) params.set("kommuneId", filters.kommuneId);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (searchMode === "horse_sales" && filters.horseTrade && filters.horseTrade !== "sell")
        params.set("horseTrade", filters.horseTrade);

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
      if (filters.horseSalesSize && filters.horseTrade !== "buy")
        params.set("horseSalesSize", filters.horseSalesSize);
      if (filters.minHeight && filters.horseTrade === "buy")
        params.set("minHeight", filters.minHeight);
      if (filters.maxHeight && filters.horseTrade === "buy")
        params.set("maxHeight", filters.maxHeight);

      // Reset to first page only when filters/mode/sort actually change; otherwise keep current page
      params.set("page", hasChanged ? "1" : String(pageFromUrl));

      // Update URL without causing a navigation
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce to avoid excessive URL updates while typing in price fields

    return () => clearTimeout(timeoutId);
  }, [filters, searchMode, sortOption, pathname, router, pageFromUrl]);

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
      horseTrade: searchMode === "horse_sales" ? filters.horseTrade || "sell" : undefined,
      breedId: searchMode === "horse_sales" && filters.breedId ? filters.breedId : undefined,
      disciplineId:
        searchMode === "horse_sales" && filters.disciplineId ? filters.disciplineId : undefined,
      gender:
        searchMode === "horse_sales" && filters.gender
          ? (filters.gender as "HOPPE" | "HINGST" | "VALLACH")
          : undefined,
      minAge: searchMode === "horse_sales" && filters.minAge ? parseInt(filters.minAge) : undefined,
      maxAge: searchMode === "horse_sales" && filters.maxAge ? parseInt(filters.maxAge) : undefined,
      horseSalesSize:
        searchMode === "horse_sales" && filters.horseTrade !== "buy" && filters.horseSalesSize
          ? (filters.horseSalesSize as
              | "KATEGORI_4"
              | "KATEGORI_3"
              | "KATEGORI_2"
              | "KATEGORI_1"
              | "UNDER_160"
              | "SIZE_160_170"
              | "OVER_170")
          : undefined,
      minHeight:
        searchMode === "horse_sales" && filters.horseTrade === "buy" && filters.minHeight
          ? parseInt(filters.minHeight)
          : undefined,
      maxHeight:
        searchMode === "horse_sales" && filters.horseTrade === "buy" && filters.maxHeight
          ? parseInt(filters.maxHeight)
          : undefined,
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

  // Use paged search hooks
  const {
    data: stablesPage,
    isLoading: stablesLoading,
    error: stablesError,
    refetch: refetchStables,
  } = useStableSearchPage(
    searchMode === "stables"
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  const {
    data: boxesPage,
    isLoading: boxesLoading,
    error: boxesError,
    refetch: refetchBoxes,
  } = useBoxSearchPage(
    searchMode === "boxes"
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  const {
    data: servicesPage,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useServiceSearchPage(
    searchMode === "services"
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  const {
    data: partLoanHorsesPage,
    isLoading: partLoanHorsesLoading,
    error: partLoanHorsesError,
    refetch: refetchPartLoanHorses,
  } = usePartLoanHorseSearchPage(
    searchMode === "forhest"
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  const isSellMode = searchMode === "horse_sales" && (filters.horseTrade || "sell") === "sell";
  const {
    data: horseSalesPage,
    isLoading: horseSalesLoading,
    error: horseSalesError,
    refetch: refetchHorseSales,
  } = useHorseSalesSearchPage(
    isSellMode
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  // Horse buys (wanted)
  const {
    data: horseBuysPage,
    isLoading: horseBuysLoading,
    error: horseBuysError,
    refetch: refetchHorseBuys,
  } = useHorseBuysSearchPage(
    searchMode === "horse_sales" && filters.horseTrade === "buy"
      ? { ...searchFiltersWithSort, page: pageFromUrl }
      : ({ page: 1 } as unknown as Omit<UnifiedSearchFilters, "mode"> & { page: number })
  );

  // Current page data
  const stables = useMemo(() => stablesPage?.items || [], [stablesPage]);
  const boxes = useMemo(() => boxesPage?.items || [], [boxesPage]);
  const services = useMemo(() => servicesPage?.items || [], [servicesPage]);
  const partLoanHorses = useMemo(() => partLoanHorsesPage?.items || [], [partLoanHorsesPage]);
  const horseSales = useMemo(() => horseSalesPage?.items || [], [horseSalesPage]);
  const horseBuys = useMemo(() => (horseBuysPage?.items as HorseBuy[]) || [], [horseBuysPage]);

  // Total results from first page's pagination (stable across infinite scroll)
  const totalResults = useMemo(() => {
    if (searchMode === "stables") return stablesPage?.pagination?.totalItems ?? 0;
    if (searchMode === "boxes") return boxesPage?.pagination?.totalItems ?? 0;
    if (searchMode === "services") return servicesPage?.pagination?.totalItems ?? 0;
    if (searchMode === "forhest") return partLoanHorsesPage?.pagination?.totalItems ?? 0;
    if ((filters.horseTrade || "sell") === "buy") return horseBuysPage?.pagination?.totalItems ?? 0;
    return horseSalesPage?.pagination?.totalItems ?? 0;
  }, [
    searchMode,
    filters.horseTrade,
    stablesPage,
    boxesPage,
    servicesPage,
    partLoanHorsesPage,
    horseSalesPage,
    horseBuysPage,
  ]);

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
      : (filters.horseTrade || "sell") === "buy"
      ? horseBuysLoading
      : horseSalesLoading;
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
      : (filters.horseTrade || "sell") === "buy"
      ? horseBuysError
        ? horseBuysError.message
        : null
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
      : (filters.horseTrade || "sell") === "buy"
      ? (horseBuys as HorseBuy[])
      : horseSales;

  // Pagination helpers
  const activePagination = useMemo(() => {
    if (searchMode === "stables") return stablesPage?.pagination;
    if (searchMode === "boxes") return boxesPage?.pagination;
    if (searchMode === "services") return servicesPage?.pagination;
    if (searchMode === "forhest") return partLoanHorsesPage?.pagination;
    if ((filters.horseTrade || "sell") === "buy") return horseBuysPage?.pagination;
    return horseSalesPage?.pagination;
  }, [
    searchMode,
    filters.horseTrade,
    stablesPage,
    boxesPage,
    servicesPage,
    partLoanHorsesPage,
    horseSalesPage,
    horseBuysPage,
  ]);

  const handlePageChange = (newPage: number) => {
    if (!activePagination) return;
    const clamped = Math.max(1, Math.min(newPage, activePagination.totalPages || 1));
    const from = activePagination.page || 1;
    const action: "next" | "prev" | "number" =
      clamped === from + 1 ? "next" : clamped === from - 1 ? "prev" : "number";
    // Capture event
    searchPaginationClicked({
      action,
      from_page: from,
      to_page: clamped,
      mode: searchMode,
      horse_trade: searchMode === "horse_sales" ? filters.horseTrade || "sell" : undefined,
      page_size: activePagination.pageSize,
      total_pages: activePagination.totalPages,
      total_results: activePagination.totalItems,
      sort_by: sortOption,
    });
    const params = new URLSearchParams(searchParams.toString());
    if (clamped <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(clamped));
    }
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  const pageNumbers = useMemo<(number | "ellipsis")[]>(() => {
    if (!activePagination) return [];
    const total = activePagination.totalPages || 0;
    const current = activePagination.page || 1;
    if (total <= 1) return [1];
    const pages: (number | "ellipsis")[] = [];
    const pushRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) pages.push(i);
    };
    if (total <= 7) {
      pushRange(1, total);
    } else {
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      pages.push(1);
      if (start > 2) pages.push("ellipsis");
      else if (start === 2) pages.push(2);
      pushRange(start, end);
      if (end < total - 1) pages.push("ellipsis");
      else if (end === total - 1) pages.push(total - 1);
      pages.push(total);
    }
    return pages;
  }, [activePagination]);

  // Pagination mode; no infinite observer

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
      if ((filters.horseTrade || "sell") === "buy") {
        refetchHorseBuys();
      } else {
        refetchHorseSales();
      }
    }
  };

  const pageOffset =
    (activePagination?.page ? activePagination.page - 1 : 0) * (activePagination?.pageSize || 0);

  // Click handlers for search result tracking
  const handleStableClick = (stable: StableWithBoxStats, index: number) => {
    searchResultClicked({
      result_type: "stable",
      result_id: stable.id,
      position: pageOffset + index + 1,
    });
  };

  const handleBoxClick = (box: { id: string }, index: number) => {
    searchResultClicked({
      result_type: "box",
      result_id: box.id,
      position: pageOffset + index + 1,
    });
  };

  const handleServiceClick = (service: ServiceWithDetails, index: number) => {
    searchResultClicked({
      result_type: "service",
      result_id: service.id,
      position: pageOffset + index + 1,
    });
  };

  const handlePartLoanHorseClick = (partLoanHorse: PartLoanHorse, index: number) => {
    searchResultClicked({
      result_type: "forhest",
      result_id: partLoanHorse.id,
      position: pageOffset + index + 1,
    });
  };

  const handleHorseSaleClick = (horseSale: HorseSale, index: number) => {
    searchResultClicked({
      result_type: "horse_sale",
      result_id: horseSale.id,
      position: pageOffset + index + 1,
    });
  };

  const handleHorseBuyClick = (horseBuy: HorseBuy, index: number) => {
    searchResultClicked({
      result_type: "horse_buy",
      result_id: horseBuy.id,
      position: pageOffset + index + 1,
    });
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8 lg:items-start">
      {/* Mobile: Filter Toggle Button */}
      <div className="lg:hidden mb-3 md:mb-5 lg:mb-7 order-0">
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
        <div className="mt-3 md:mt-5 lg:mt-7">
          <div className="bg-gray-100 p-1 rounded-lg">
            <div className="flex gap-1">
              <button
                onClick={() => handleSearchModeChange("boxes")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center border",
                  searchMode === "boxes"
                    ? "bg-[#5B4B8A] text-white shadow-none border-transparent"
                    : "bg-[#F5F5F5] text-[#444444] border-transparent hover:bg-[#F3EAFE] hover:text-[#5B4B8A] hover:border-[#E0E0E0]"
                )}
                data-cy="mode-mobile-boxes"
              >
                Stallplasser
              </button>
              <button
                onClick={() => handleSearchModeChange("horse_sales")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center border",
                  searchMode === "horse_sales"
                    ? "bg-[#5B4B8A] text-white shadow-none border-transparent"
                    : "bg-[#F5F5F5] text-[#444444] border-transparent hover:bg-[#F3EAFE] hover:text-[#5B4B8A] hover:border-[#E0E0E0]"
                )}
                data-cy="mode-mobile-horse-sales"
              >
                Hest
              </button>
              <button
                onClick={() => handleSearchModeChange("forhest")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center border",
                  searchMode === "forhest"
                    ? "bg-[#5B4B8A] text-white shadow-none border-transparent"
                    : "bg-[#F5F5F5] text-[#444444] border-transparent hover:bg-[#F3EAFE] hover:text-[#5B4B8A] hover:border-[#E0E0E0]"
                )}
                data-cy="mode-mobile-forhest"
              >
                Fôrhest
              </button>
              <button
                onClick={() => handleSearchModeChange("stables")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center border",
                  searchMode === "stables"
                    ? "bg-[#5B4B8A] text-white shadow-none border-transparent"
                    : "bg-[#F5F5F5] text-[#444444] border-transparent hover:bg-[#F3EAFE] hover:text-[#5B4B8A] hover:border-[#E0E0E0]"
                )}
                data-cy="mode-mobile-stables"
              >
                Staller
              </button>
              <button
                onClick={() => handleSearchModeChange("services")}
                className={cn(
                  "flex-1 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 touch-manipulation text-center border",
                  searchMode === "services"
                    ? "bg-[#5B4B8A] text-white shadow-none border-transparent"
                    : "bg-[#F5F5F5] text-[#444444] border-transparent hover:bg-[#F3EAFE] hover:text-[#5B4B8A] hover:border-[#E0E0E0]"
                )}
                data-cy="mode-mobile-services"
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
          totalResults={totalResults}
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
            <div className="space-y-4 sm:space-y-6" data-cy="search-results">
              {searchMode === "stables"
                ? (() => {
                    const results: React.ReactNode[] = [];

                    stables.forEach((stable, index) => {
                      // Insert ad before this stable if we've reached the ad position
                      if (shouldShowStableAd && index === stableAdPosition) {
                        results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                      }

                      results.push(
                        <div
                          key={stable.id}
                          onClick={() => handleStableClick(stable, index)}
                          data-cy="search-result-stable"
                        >
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
                    const isBuy = filters.horseTrade === "buy";

                    if (isBuy) {
                      (horseBuys as HorseBuy[]).forEach((horseBuy, index) => {
                        if (shouldShowHorseSaleAd && index === horseSaleAdPosition) {
                          results.push(<AdvertisingPromotionCard key="advertising-promotion" />);
                        }
                        results.push(
                          <div
                            key={horseBuy.id}
                            onClick={() => handleHorseBuyClick(horseBuy, index)}
                          >
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
                          <div
                            key={horseSale.id}
                            onClick={() => handleHorseSaleClick(horseSale, index)}
                          >
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

              {/* Pagination Controls */}
              {activePagination && activePagination.totalPages > 0 && (
                <div className="flex items-center justify-center gap-2 py-8" data-cy="pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePagination.page <= 1}
                    onClick={() => handlePageChange(activePagination.page - 1)}
                    data-cy="pagination-prev"
                  >
                    Forrige
                  </Button>
                  {pageNumbers.map((p, idx) =>
                    p === "ellipsis" ? (
                      <span key={`el-${idx}`} className="px-2 text-gray-500">
                        …
                      </span>
                    ) : (
                      <Button
                        key={`p-${p}`}
                        variant={p === activePagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(p)}
                        data-cy={`pagination-page-${p}`}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activePagination.page >= activePagination.totalPages}
                    onClick={() => handlePageChange(activePagination.page + 1)}
                    data-cy="pagination-next"
                  >
                    Neste
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
