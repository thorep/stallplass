'use client';

import { useState, useEffect } from 'react';
import { ServiceWithDetails, ServiceSearchFilters } from '@/services/marketplace-service';
import ServiceGrid from '@/components/organisms/ServiceGrid';
import Button from '@/components/atoms/Button';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function ServiceListingPage() {
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [filters]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      if (filters.service_type) queryParams.append('service_type', filters.service_type);
      if (filters.county) queryParams.append('county', filters.county);
      if (filters.municipality) queryParams.append('municipality', filters.municipality);
      if (filters.min_price) queryParams.append('min_price', filters.min_price.toString());
      if (filters.max_price) queryParams.append('max_price', filters.max_price.toString());

      const response = await fetch(`/api/services?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ServiceSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Tjenester</h1>
            <p className="mt-2 text-gray-600">
              Finn veterinærer, hovslagere og trenere i ditt område
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            
            {Object.keys(filters).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Fjern alle filtre
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Service Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tjenestetype
                  </label>
                  <select
                    value={filters.service_type || ''}
                    onChange={(e) => handleFilterChange({ 
                      service_type: e.target.value as 'veterinarian' | 'farrier' | 'trainer' | undefined 
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Alle typer</option>
                    <option value="veterinarian">Veterinær</option>
                    <option value="farrier">Hovslagare</option>
                    <option value="trainer">Trener</option>
                  </select>
                </div>

                {/* County Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fylke
                  </label>
                  <input
                    type="text"
                    value={filters.county || ''}
                    onChange={(e) => handleFilterChange({ county: e.target.value || undefined })}
                    placeholder="f.eks. Oslo"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Municipality Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kommune
                  </label>
                  <input
                    type="text"
                    value={filters.municipality || ''}
                    onChange={(e) => handleFilterChange({ municipality: e.target.value || undefined })}
                    placeholder="f.eks. Drammen"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prisområde
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={filters.min_price || ''}
                      onChange={(e) => handleFilterChange({ 
                        min_price: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      placeholder="Fra"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={filters.max_price || ''}
                      onChange={(e) => handleFilterChange({ 
                        max_price: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      placeholder="Til"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Laster tjenester...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Feil: {error}</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={fetchServices}
            >
              Prøv igjen
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {services.length} tjeneste{services.length !== 1 ? 'r' : ''} funnet
              </p>
            </div>
            <ServiceGrid services={services} />
          </>
        )}
      </div>
    </div>
  );
}