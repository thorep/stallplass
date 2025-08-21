'use client';

import { ServiceWithDetails } from '@/types/service';
import { useServicesForStable } from '@/hooks/useServices';
import ServiceCard from '@/components/molecules/ServiceCard';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface StableServicesSectionProps {
  countyId: string;
  municipalityId?: string;
  countyName?: string;
  municipalityName?: string;
  className?: string;
}

/**
 * Component to display services that cover a stable's location using hierarchical matching.
 * 
 * Uses advanced location matching logic:
 * - Exact municipality match: Service covers "Vestfold->Sandefjord" → matches stable in "Vestfold->Sandefjord"  
 * - County-wide coverage: Service covers "Telemark" → matches any stable in Telemark county
 * 
 * This ensures users see the most relevant services for their stable's specific location.
 */
export default function StableServicesSection({ 
  countyId, 
  municipalityId, 
  countyName,
  municipalityName,
  className = '' 
}: StableServicesSectionProps) {
  // Use the specialized hook for stable location matching
  const { data: allServices = [], isLoading: loading, error } = useServicesForStable(countyId, municipalityId);
  
  // Limit to max 3 services for preview on stable page
  const services = allServices.slice(0, 3);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-3">Laster tjenester i området...</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border p-6 ${className}`}>
        <div className="text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ingen tjenester i dette området
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Vi fant ingen aktive tjenester som dekker {municipalityName || countyName}.
          </p>
          <Link href="/tjenester">
            <Button variant="outline" size="sm">
              Se alle tjenester
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build location display name for readable URLs and descriptions
  const locationName = municipalityName ? `${municipalityName}, ${countyName}` : countyName;
  const searchUrlParams = new URLSearchParams();
  if (countyName) searchUrlParams.append('county', countyName);
  if (municipalityName) searchUrlParams.append('municipality', municipalityName);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tjenester i området
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Tjenester som dekker {locationName}
          </p>
        </div>
        {allServices.length > 3 && (
          <Link href={`/tjenester?${searchUrlParams.toString()}`}>
            <Button variant="secondary" size="sm">
              Se alle ({allServices.length})
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      <ErrorMessage error={error} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service: ServiceWithDetails) => (
          <ServiceCard 
            key={service.id} 
            service={service}
          />
        ))}
      </div>

      {allServices.length > 3 && (
        <div className="mt-4 text-center">
          <Link href={`/tjenester?${searchUrlParams.toString()}`}>
            <Button variant="outline">
              Se alle tjenester i {locationName}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
