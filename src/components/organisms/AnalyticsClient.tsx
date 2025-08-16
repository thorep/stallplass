'use client';

import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ViewAnalytics from '@/components/molecules/ViewAnalytics';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Button from '@/components/atoms/Button';

export default function AnalyticsClient() {
  const { user, loading } = useSupabaseUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/logg-inn');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Laster...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analyse</h1>
            <p className="text-gray-600">Se statistikk og visninger for dine staller og tjenester</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Hjem
          </Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-gray-900">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Analyse</span>
        </nav>
      </div>

      {/* Analytics Content */}
      <ViewAnalytics ownerId={user.id} />

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200/50">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Tips for å øke visninger
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Hold stallbeskrivelsen oppdatert med detaljert informasjon</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Legg til flere bilder av høy kvalitet</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Sørg for at priser og tilgjengelighet er korrekt</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Aktiver annonsering for å få mer synlighet i søkeresultater</span>
          </li>
        </ul>
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard?tab=stables')}
          >
            Administrer staller
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/priser')}
          >
            Se priser
          </Button>
        </div>
      </div>
    </div>
  );
}