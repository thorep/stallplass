import { getAllStables } from '@/services/stable-service';
import { getAllStableAmenities, getAllBoxAmenities } from '@/services/amenity-service';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import SearchPageClient from '@/components/organisms/SearchPageClient';

export default async function StallersPage() {
  // Fetch both stables and amenities server-side
  const [stables, stableAmenities, boxAmenities] = await Promise.all([
    getAllStables(true), // Get all stables with boxes data
    getAllStableAmenities(),
    getAllBoxAmenities()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Søk etter stallplasser</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Finn den perfekte stallplassen for hesten din
          </p>
        </div>

        <SearchPageClient 
          stables={stables}
          stableAmenities={stableAmenities}
          boxAmenities={boxAmenities}
        />
      </div>

      <Footer />
    </div>
  );
}