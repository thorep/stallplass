'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { ServiceWithDetails } from '@/services/marketplace-service-client';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MyServicesPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      const response = await fetch(`/api/services?user_id=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke laste dine tjenester');
      }
      
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne tjenesten?')) {
      return;
    }

    try {
      setDeletingId(serviceId);
      
      const token = await getIdToken();
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke slette tjenesten');
      }
      
      // Remove from local state
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'En feil oppstod ved sletting');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere tjenesten');
      }
      
      // Update local state
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, isActive: !isActive } : s
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'En feil oppstod ved oppdatering');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Logg inn for å se dine tjenester
          </h2>
          <p className="text-gray-600 mb-6">
            Du må være logget inn for å kunne administrere dine tjenester.
          </p>
          <div className="space-y-3">
            <Link href="/auth/sign-in" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-md h-10 px-4 text-sm rounded-lg w-full">
              Logg inn
            </Link>
            <Link href="/tjenester" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus:ring-emerald-500 hover:shadow-md h-10 px-4 text-sm rounded-lg w-full">
              Bla gjennom tjenester
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mine tjenester</h1>
                <p className="mt-2 text-gray-600">
                  Administrer dine tjenesteannonser
                </p>
              </div>
              <Link href="/tjenester/ny" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-md h-10 px-4 text-sm rounded-lg">
                <PlusIcon className="h-4 w-4 mr-2" />
                Ny tjeneste
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Laster dine tjenester...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Feil: {error}</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={fetchMyServices}
            >
              Prøv igjen
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen tjenester ennå
            </h3>
            <p className="text-gray-500 mb-6">
              Du har ikke opprettet noen tjenesteannonser ennå. Kom i gang ved å opprette din første tjeneste.
            </p>
            <Link href="/tjenester/ny" className="inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-md h-10 px-4 text-sm rounded-lg">
              <PlusIcon className="h-4 w-4 mr-2" />
              Opprett første tjeneste
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {services.length} tjeneste{services.length !== 1 ? 'r' : ''}
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.id} className="relative">
                  <div className={`rounded-lg border bg-white shadow-sm transition-opacity ${
                    !service.isActive ? 'opacity-60' : ''
                  }`}>
                    {/* Service Card */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {service.title}
                        </h3>
                        {!service.isActive && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>
                          {service.areas.length} område{service.areas.length !== 1 ? 'r' : ''}
                        </span>
                        <span>
                          Opprettet {new Date(service.createdAt).toLocaleDateString('no-NO')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link href={`/tjenester/${service.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                          >
                            Se detaljer
                          </Button>
                        </Link>
                        
                        <Link href={`/tjenester/${service.id}/rediger`}>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleServiceStatus(service.id, service.isActive || false)}
                          className={service.isActive ? 'text-red-600' : 'text-green-600'}
                        >
                          {service.isActive ? 'Deaktiver' : 'Aktiver'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          disabled={deletingId === service.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingId === service.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}