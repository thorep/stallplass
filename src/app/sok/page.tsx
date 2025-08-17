"use client";
import Button from "@/components/atoms/Button";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import SearchPageClientSimple from "@/components/organisms/SearchPageClientSimple";
import { useAllAmenities } from "@/hooks";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-shrink-0">
              {/* Map button */}
              <Button
                variant="emerald"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => router.push("/kart")}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                Kartvisning
              </Button>

              {/* Call-to-action for stable owners */}
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => router.push("/dashboard")}
              >
                Opprett annonse
              </Button>
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
