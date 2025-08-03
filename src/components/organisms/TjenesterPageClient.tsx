'use client';

import { useState, useEffect, useMemo } from 'react';
import { ServiceWithDetails, ServiceSearchFilters } from '@/types/service';
import ServiceGrid from '@/components/organisms/ServiceGrid';
import TjenesterFilters from '@/components/organisms/TjenesterFilters';
import TjenesterSort from '@/components/molecules/TjenesterSort';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useServiceSearch } from '@/hooks/useServices';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

interface TjenesterPageClientProps {
  initialServices: ServiceWithDetails[];
}

export default function TjenesterPageClient({ initialServices }: TjenesterPageClientProps) {
  // URL parameter hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ServiceSearchFilters>({});
  
  // Use TanStack Query hook for data fetching
  const { data: searchResults, isLoading: loading, error: queryError, refetch } = useServiceSearch(filters);
  const services = searchResults || initialServices;
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'En feil oppstod') : null;

  // Initialize state from URL parameters on mount
  useEffect(() => {
    const sort = searchParams.get('sort') as SortOption;
    
    if (sort) {
      setSortOption(sort);
    }

    // Initialize filters from URL
    const urlFilters: ServiceSearchFilters = {};
    
    const serviceType = searchParams.get('service_type');
    if (serviceType === 'veterinarian' || serviceType === 'farrier' || serviceType === 'trainer') {
      urlFilters.service_type = serviceType;
    }
    
    const county = searchParams.get('county');
    if (county) {
      urlFilters.county = county;
    }
    
    const municipality = searchParams.get('municipality');
    if (municipality) {
      urlFilters.municipality = municipality;
    }
    
    const priceMin = searchParams.get('price_min');
    if (priceMin) {
      const parsed = parseInt(priceMin);
      if (!isNaN(parsed)) {
        urlFilters.price_min = parsed;
      }
    }
    
    const priceMax = searchParams.get('price_max');
    if (priceMax) {
      const parsed = parseInt(priceMax);
      if (!isNaN(parsed)) {
        urlFilters.price_max = parsed;
      }
    }

    setFilters(urlFilters);
  }, [searchParams]); // Run when URL parameters change

  // Update URL when filters or sort changes (debounced for price inputs)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      // Add sort
      if (sortOption !== 'newest') params.set('sort', sortOption);
      
      // Add filters to URL (only if they have non-default values)
      if (filters.service_type) params.set('service_type', filters.service_type);
      if (filters.county) params.set('county', filters.county);
      if (filters.municipality) params.set('municipality', filters.municipality);
      if (filters.price_min !== undefined) params.set('price_min', filters.price_min.toString());
      if (filters.price_max !== undefined) params.set('price_max', filters.price_max.toString());

      // Update URL without causing a navigation
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce to avoid excessive URL updates while typing in price fields

    return () => clearTimeout(timeoutId);
  }, [filters, sortOption, pathname, router]);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);


  // Apply sorting to services
  const sortedServices = useMemo(() => {
    const sorted = [...services];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      case 'price_low':
        return sorted.sort((a, b) => (a.priceRangeMin || 0) - (b.priceRangeMin || 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.priceRangeMax || 0) - (a.priceRangeMax || 0));
      case 'name_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'name_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [services, sortOption]);

  const handleFilterChange = (newFilters: Partial<ServiceSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Auto-hide filters on mobile after filter change
  const handleFilterChangeWithHide = (newFilters: Partial<ServiceSearchFilters>) => {
    handleFilterChange(newFilters);
    if (isMobile) {
      setShowFilters(false);
    }
  };

  return (
    <>
      {/* Mobile-first layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Mobile: Filter Toggle Button */}
        <div className="lg:hidden mb-4 order-0">
          <Button
            variant={showFilters ? "primary" : "outline"}
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
        </div>

        {/* Filters - Always visible on desktop, toggleable on mobile */}
        <div className={`lg:col-span-1 order-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <TjenesterFilters
            filters={filters}
            onFiltersChange={handleFilterChangeWithHide}
            onClearFilters={clearFilters}
            totalResults={sortedServices.length}
            isLoading={loading}
          />
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 order-2">
          {/* Sort component */}
          <TjenesterSort
            onSortChange={setSortOption}
            currentSort={sortOption}
            totalResults={sortedServices.length}
            isLoading={loading}
          />

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">
                Feil ved lasting av tjenester
              </div>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={() => refetch()} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {loading && !error ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-gray-500 text-lg">
                Laster tjenester...
              </div>
            </div>
          ) : sortedServices.length === 0 && !error ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">
                Ingen tjenester funnet
              </div>
              <p className="text-gray-400">
                Prøv å justere søkekriteriene dine
              </p>
            </div>
          ) : (
            <div>
              <ServiceGrid services={sortedServices} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}