import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import TjenesterPageClient from "@/components/organisms/TjenesterPageClient";
import { Suspense } from "react";

export default function TjenesterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-h1-sm md:text-h1 font-bold text-gray-900">Tjenester</h1>
              <p className="mt-2 text-body-sm md:text-body text-gray-600">
                Finn veterinærer, hovslagere og trenere i ditt område
              </p>
            </div>

            {/* Call-to-action for service providers */}
            <div className="w-full sm:w-auto sm:flex-shrink-0">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-body-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Annonser din tjeneste
              </a>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-gray-500 text-lg">Laster tjenester...</div>
            </div>
          }
        >
          <TjenesterPageClient />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
