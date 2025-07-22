'use client';

import { Suspense } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import SearchPageClientSimple from '@/components/organisms/SearchPageClientSimple';
import { useStablesWithBoxStats, useAllAmenities } from '@/hooks';

function SearchPageContent() {
  const { data: stables, isLoading: stablesLoading, error: stablesError } = useStablesWithBoxStats();
  const { 
    stableAmenities, 
    boxAmenities, 
    isLoading: amenitiesLoading, 
    isError: amenitiesError 
  } = useAllAmenities();

  if (stablesLoading || amenitiesLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (stablesError || amenitiesError) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Feil ved lasting av data. Prøv igjen senere.</p>
        </div>
      </div>
    );
  }

  return (
    <SearchPageClientSimple 
      stables={stables || []}
      stableAmenities={stableAmenities}
      boxAmenities={boxAmenities}
    />
  );
}

export default function StallersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Søk etter boxes</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Finn den perfekte stallplassen for hesten din
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <SearchPageContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}