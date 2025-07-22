'use client';

import { useState, useEffect } from 'react';
import { ServiceWithDetails } from '@/services/marketplace-service';
import ServiceCard from '@/components/molecules/ServiceCard';
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
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAreaServices();
  }, [county, municipality]);

  const fetchAreaServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append('county', county);
      if (municipality) {
        queryParams.append('municipality', municipality);
      }

      const response = await fetch(`/api/services?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke laste tjenester');
      }
      
      const data = await response.json();
      // Limit to max 3 services for preview
      setServices(data.slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tjenester i området
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || services.length === 0) {
    return null; // Don't show section if there are no services or an error
  }

  const areaDescription = municipality 
    ? `${municipality}, ${county}` 
    : county;

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Tjenester i {areaDescription}
          </h3>
          <p className="text-gray-600 text-sm">
            Veterinærer, hovslagere og trenere i nærheten
          </p>
        </div>
        
        <Button variant="ghost" size="sm" asChild>
          <Link 
            href={`/tjenester?county=${encodeURIComponent(county)}${
              municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''
            }`}
          >
            Se alle <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="transform scale-95">
            <ServiceCard 
              service={service} 
              showContactInfo={true}
              className="h-full"
            />
          </div>
        ))}
      </div>
      
      {services.length > 0 && (
        <div className="text-center mt-4">
          <Button variant="secondary" asChild>
            <Link 
              href={`/tjenester?county=${encodeURIComponent(county)}${
                municipality ? `&municipality=${encodeURIComponent(municipality)}` : ''
              }`}
            >
              Se alle tjenester i {areaDescription}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}