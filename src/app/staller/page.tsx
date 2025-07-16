import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';
import SearchFilters from '@/components/organisms/SearchFilters';
import StableListingCard from '@/components/molecules/StableListingCard';

async function getStables() {
  try {
    const stables = await prisma.stable.findMany({
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return stables.map(stable => ({
      ...stable,
      owner: {
        name: stable.owner.name,
        phone: stable.owner.phone || stable.ownerPhone,
        email: stable.owner.email || stable.ownerEmail
      }
    }));
  } catch (error) {
    console.error('Error fetching stables:', error);
    return [];
  }
}

export default async function StallersPage() {
  const stables = await getStables();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ledige stallplasser</h1>
          <p className="mt-2 text-gray-600">
            Finn den perfekte stallplassen for hesten din
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Laster filtre...</div>}>
              <SearchFilters />
            </Suspense>
          </div>

          {/* Stables List */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {stables.length} staller funnet
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600">Sorter etter:</label>
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
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
              <div className="space-y-6">
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