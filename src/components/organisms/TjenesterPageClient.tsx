'use client';

import { useState, useEffect, useMemo } from 'react';
import { ServiceWithDetails, ServiceSearchFilters, searchServices } from '@/services/marketplace-service-client';
import ServiceGrid from '@/components/organisms/ServiceGrid';
import TjenesterFilters from '@/components/organisms/TjenesterFilters';
import TjenesterSort from '@/components/molecules/TjenesterSort';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_asc' | 'name_desc';

interface TjenesterPageClientProps {
  initialServices: ServiceWithDetails[];
}

export default function TjenesterPageClient({ initialServices }: TjenesterPageClientProps) {
  const [services, setServices] = useState<ServiceWithDetails[]>(initialServices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ServiceSearchFilters>({});

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Fetch services when filters change
  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await searchServices(filters);
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod ved lasting av tjenester');
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting to services
  const sortedServices = useMemo(() => {
    const sorted = [...services];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
      case 'price_low':
        return sorted.sort((a, b) => (a.price_range_min || 0) - (b.price_range_min || 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.price_range_max || 0) - (a.price_range_max || 0));
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
              <Button onClick={fetchServices} variant="outline">
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