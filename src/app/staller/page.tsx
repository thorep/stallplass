import { getAllStables } from '@/services/stable-service';
import { getAllAmenities } from '@/services/amenity-service';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import SearchFilters from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';

export default async function StallersPage() {
  // Fetch both stables and amenities server-side
  const [stables, amenities] = await Promise.all([
    getAllStables(),
    getAllAmenities()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Mobile-first header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ledige stallplasser</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Finn den perfekte stallplassen for hesten din
          </p>
        </div>

        {/* Mobile-first layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile: Filters as collapsible section */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <SearchFilters amenities={amenities} />
          </div>

          {/* Stables List */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Mobile-optimized controls */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-500">
                {stables.length} staller funnet
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500 hidden sm:block">Sorter etter:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 sm:flex-none">
                  <option>Nyeste først</option>
                  <option>Pris: Lav til høy</option>
                  <option>Pris: Høy til lav</option>
                  <option>Flest ledige plasser</option>
                  <option>Høyest vurdert</option>
                </select>
              </div>
            </div>

            {stables.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  Ingen staller funnet
                </div>
                <p className="text-gray-400">
                  Prøv å justere søkekriteriene dine
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {stables.map((stable) => (
                  <StableListingCard key={stable.id} stable={stable} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}