import { Suspense } from 'react';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import TjenesterPageClient from '@/components/organisms/TjenesterPageClient';

export default function TjenesterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tjenester</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Finn veterinærer, hovslagere og trenere i ditt område
          </p>
        </div>

        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-500 text-lg">
              Laster tjenester...
            </div>
          </div>
        }>
          <TjenesterPageClient />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}