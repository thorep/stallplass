'use client';

import { useState, useEffect } from 'react';
import { getAllStables, searchStables } from '@/lib/stable-service';
import { Stable } from '@/types/stable';
import Header from '@/components/organisms/Header';
import { HeroBanner } from '@/components/organisms/HeroBanner';
import StableGrid from '@/components/organisms/StableGrid';
import Footer from '@/components/organisms/Footer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allStables, setAllStables] = useState<Stable[]>([]);
  const [filteredStables, setFilteredStables] = useState<Stable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStables = async () => {
      try {
        setLoading(true);
        const stables = await getAllStables();
        setAllStables(stables);
        setFilteredStables(stables);
      } catch (err) {
        setError('Failed to load stables');
        console.error('Error fetching stables:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStables();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStables(allStables);
      return;
    }
    
    try {
      const filtered = await searchStables(query);
      setFilteredStables(filtered);
    } catch (err) {
      console.error('Error searching stables:', err);
      setError('Failed to search stables');
    }
  };

  const handleViewDetails = (stableId: string) => {
    console.log('View details for stable:', stableId);
  };

  const featuredStables = filteredStables.filter(stable => stable.featured);
  const regularStables = filteredStables.filter(stable => !stable.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroBanner 
          title="Finn den perfekte stallplassen"
          subtitle="Norges største plattform for stallplasser. Søk blant hundrevis av staller og finn det beste stedet for hesten din."
          placeholder="Søk etter stallplass..."
          onSearch={handleSearch}
          variant="neutral"
        />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Laster staller...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroBanner 
          title="Finn den perfekte stallplassen"
          subtitle="Norges største plattform for stallplasser. Søk blant hundrevis av staller og finn det beste stedet for hesten din."
          placeholder="Søk etter stallplass..."
          onSearch={handleSearch}
          variant="neutral"
        />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-error">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroBanner 
        title="Finn den perfekte stallplassen"
        subtitle="Norges største plattform for stallplasser. Søk blant hundrevis av staller og finn det beste stedet for hesten din."
        placeholder="Søk etter stallplass..."
        onSearch={handleSearch}
        variant="neutral"
      />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {featuredStables.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Utvalgte staller</h2>
            <StableGrid stables={featuredStables} onViewDetails={handleViewDetails} />
          </section>
        )}
        
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Søkeresultater for "${searchQuery}"` : 'Alle staller'}
            </h2>
            <p className="text-gray-500">
              {filteredStables.length} staller funnet
            </p>
          </div>
          {filteredStables.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'Ingen staller funnet for søket ditt.' : 'Ingen staller tilgjengelig for øyeblikket.'}
              </p>
            </div>
          ) : (
            <StableGrid stables={regularStables} onViewDetails={handleViewDetails} />
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}