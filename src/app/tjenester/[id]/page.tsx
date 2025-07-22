'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ServiceWithDetails } from '@/services/marketplace-service-client';
import { formatPrice } from '@/utils/formatting';
import Button from '@/components/atoms/Button';
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  PhotoIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

import { getServiceTypeLabel, getServiceTypeColor } from '@/lib/service-types';

export default function ServiceDetailPage() {
  const params = useParams();
  const [service, setService] = useState<ServiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchService(params.id as string);
    }
  }, [params.id]);

  const fetchService = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/services/${serviceId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tjenesten ble ikke funnet');
        }
        throw new Error('Kunne ikke laste tjenesten');
      }
      
      const data = await response.json();
      setService(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  const formatPriceRange = () => {
    if (!service) return '';
    
    if (!service.price_range_min && !service.price_range_max) {
      return 'Kontakt for pris';
    }
    if (service.price_range_min && service.price_range_max) {
      return `${formatPrice(service.price_range_min)} - ${formatPrice(service.price_range_max)}`;
    }
    if (service.price_range_min) {
      return `Fra ${formatPrice(service.price_range_min)}`;
    }
    if (service.price_range_max) {
      return `Opp til ${formatPrice(service.price_range_max)}`;
    }
    return 'Kontakt for pris';
  };

  const formatAreas = () => {
    if (!service || service.areas.length === 0) return '';
    
    // Group by county
    const countiesByName: { [key: string]: string[] } = {};
    service.areas.forEach(area => {
      if (!countiesByName[area.county]) {
        countiesByName[area.county] = [];
      }
      if (area.municipality) {
        countiesByName[area.county].push(area.municipality);
      }
    });

    // Format display
    return Object.entries(countiesByName).map(([county, municipalities]) => {
      if (municipalities.length === 0) {
        return county; // Whole county coverage
      }
      return `${municipalities.join(', ')} (${county})`;
    }).join(' • ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Laster tjeneste...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/tjenester" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-md h-10 px-4 text-sm rounded-lg">
            Tilbake til tjenester
          </Link>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <Link href="/tjenester" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none text-slate-700 hover:bg-slate-100 focus:ring-indigo-500 h-8 px-3 text-sm rounded-md mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Tilbake til tjenester
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Photos */}
            {service.photos && service.photos.length > 0 ? (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.photos.slice(0, 4).map((photo, index) => (
                    <Image
                      key={photo.id}
                      src={photo.photo_url}
                      alt={`${service.title} bilde ${index + 1}`}
                      width={400}
                      height={300}
                      className={`rounded-lg object-cover ${
                        index === 0 ? 'md:col-span-2 h-64 md:h-80' : 'h-48'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Ingen bilder tilgjengelig</p>
                </div>
              </div>
            )}

            {/* Title and Type */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getServiceTypeColor(service.service_type)}`}>
                  {getServiceTypeLabel(service.service_type)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Beskrivelse</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>
            </div>

            {/* Service Areas */}
            {service.areas.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Dekningsområde</h2>
                <div className="flex items-start text-gray-700">
                  <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{formatAreas()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              {/* Price */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pris</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPriceRange()}
                </div>
              </div>

              {/* Service Provider */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tjenesteleverandør</h3>
                <div className="flex items-center mb-3">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{service.user.name}</p>
                    <p className="text-sm text-gray-500">{getServiceTypeLabel(service.service_type)}</p>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => window.open(`mailto:${service.user.email}?subject=Angående ${service.title}`, '_blank')}
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send e-post
                </Button>
                
                {service.user.phone && (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => window.open(`tel:${service.user.phone}`, '_blank')}
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Ring {service.user.phone}
                  </Button>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span>{service.user.email}</span>
                </div>
                {service.user.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <span>{service.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}