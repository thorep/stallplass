"use client";

import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import SearchPageClientSimple from "@/components/organisms/SearchPageClientSimple";
import { useAllAmenities } from "@/hooks";
import { usePostHog } from "posthog-js/react";
import { Suspense } from "react";

function SearchPageContent() {
  const {
    stableAmenities,
    boxAmenities,
    isLoading: amenitiesLoading,
    isError: amenitiesError,
  } = useAllAmenities();

  if (amenitiesLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (amenitiesError) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Feil ved lasting av data. Prøv igjen senere.</p>
        </div>
      </div>
    );
  }

  return <SearchPageClientSimple stableAmenities={stableAmenities} boxAmenities={boxAmenities} />;
}
export default function StallersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h1-sm md:text-h1 font-bold text-gray-900">
                Søk etter stall eller plass
              </h1>
              <p className="mt-2 text-body-sm md:text-body text-gray-600">
                Finn den perfekte stallplassen for hesten din
              </p>
            </div>

            {/* Call-to-action for stable owners */}
            <div className="w-full sm:w-auto sm:flex-shrink-0">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-body-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Annonser din stall, stallplass eller tjeneste
              </a>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          }
        >
          <SearchPageContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
