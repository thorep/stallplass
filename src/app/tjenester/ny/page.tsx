'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import ServiceForm from '@/components/organisms/ServiceForm';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateServicePage() {
  const { user, loading: authLoading } = useAuth();

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
            Logg inn for å opprette tjeneste
          </h2>
          <p className="text-gray-600 mb-6">
            Du må være logget inn for å kunne opprette en tjenesteannonse.
          </p>
          <div className="space-y-3">
            <Link href="/auth/sign-in">
              <Button className="w-full">
                Logg inn
              </Button>
            </Link>
            <Link href="/tjenester">
              <Button variant="secondary" className="w-full">
                Tilbake til tjenester
              </Button>
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
            <Link href="/tjenester">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Tilbake til tjenester
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Opprett ny tjeneste</h1>
            <p className="mt-2 text-gray-600">
              Opprett en annonse for dine veterinær-, hovslagare- eller trenertjenester
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ServiceForm />
        </div>

      </div>
    </div>
  );
}