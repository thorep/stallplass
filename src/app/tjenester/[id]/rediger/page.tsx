'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase-auth-context';
import { ServiceWithDetails } from '@/services/marketplace-service';
import ServiceForm from '@/components/organisms/ServiceForm';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, getIdToken } = useAuth();
  
  const [service, setService] = useState<ServiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id && user) {
      fetchService(params.id as string);
    }
  }, [params.id, user]);

  const fetchService = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getIdToken();
      const response = await fetch(`/api/services/${serviceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tjenesten ble ikke funnet');
        }
        throw new Error('Kunne ikke laste tjenesten');
      }
      
      const data = await response.json();
      
      // Check if user owns this service
      if (data.user_id !== user?.uid) {
        throw new Error('Du har ikke tilgang til å redigere denne tjenesten');
      }
      
      setService(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/tjenester/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/tjenester/${params.id}`);
  };

  if (authLoading || loading) {
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
            Logg inn for å redigere tjeneste
          </h2>
          <p className="text-gray-600 mb-6">
            Du må være logget inn for å kunne redigere tjenester.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/sign-in">
                Logg inn
              </Link>
            </Button>
            <Button variant="secondary" asChild className="w-full">
              <Link href={`/tjenester/${params.id}`}>
                Tilbake til tjeneste
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Feil</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/tjenester">
                Tilbake til tjenester
              </Link>
            </Button>
            {params.id && (
              <Button variant="secondary" asChild className="w-full">
                <Link href={`/tjenester/${params.id}`}>
                  Tilbake til tjeneste
                </Link>
              </Button>
            )}
          </div>
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
          <div className="py-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href={`/tjenester/${params.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Tilbake til tjeneste
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Rediger tjeneste</h1>
            <p className="mt-2 text-gray-600">
              Oppdater informasjonen for din tjeneste
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ServiceForm
            service={service}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}