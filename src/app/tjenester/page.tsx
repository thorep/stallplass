import { Suspense } from 'react';
import { getAllServices } from '@/services/marketplace-service-client';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import TjenesterPageClient from '@/components/organisms/TjenesterPageClient';

async function TjenesterPageContent() {
  try {
    const services = await getAllServices();
    return <TjenesterPageClient initialServices={services} />;
  } catch {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Feil ved lasting av tjenester. Prøv igjen senere.</p>
        </div>
      </div>
    );
  }
}

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
          <div className="flex justify-center items-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }>
          <TjenesterPageContent />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}