'use client';

import { ServiceWithDetails } from '@/types/service';
import { useServicesForArea } from '@/hooks/useServices';
import ServiceCard from '@/components/molecules/ServiceCard';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface AreaServicesSectionProps {
  county: string;
  municipality?: string;
  className?: string;
}

export default function AreaServicesSection({ 
  county, 
  municipality, 
  className = '' 
}: AreaServicesSectionProps) {
  // Use TanStack Query hook for services
  const { data: allServices = [], isLoading: loading, error } = useServicesForArea(county, municipality);
  
  // Limit to max 3 services for preview
  const services = allServices.slice(0, 3);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
          <span className="ml-3">Laster tjenester...</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return null; // Don't show section if no services
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Tjenester i området
        </h3>
        {allServices.length > 3 && (
          <Link href={`/tjenester?county=${encodeURIComponent(county)}${municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''}`}>
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
          <Link href={`/tjenester?county=${encodeURIComponent(county)}${municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''}`}>
            <Button variant="outline">
              Se alle tjenester i {municipality || county}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}