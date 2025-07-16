'use client';

import { useState } from 'react';
import { dummyStables } from '@/data/dummy-stables';
import Header from '@/components/organisms/Header';
import HeroSection from '@/components/organisms/HeroSection';
import StableGrid from '@/components/organisms/StableGrid';
import Footer from '@/components/organisms/Footer';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStables, setFilteredStables] = useState(dummyStables);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStables(dummyStables);
      return;
    }
    
    const filtered = dummyStables.filter(stable =>
      stable.name.toLowerCase().includes(query.toLowerCase()) ||
      stable.location.toLowerCase().includes(query.toLowerCase()) ||
      stable.description.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredStables(filtered);
  };

  const handleViewDetails = (stableId: string) => {
    console.log('View details for stable:', stableId);
  };

  const featuredStables = filteredStables.filter(stable => stable.featured);
  const regularStables = filteredStables.filter(stable => !stable.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection onSearch={handleSearch} />
      
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
            <p className="text-gray-600">
              {filteredStables.length} staller funnet
            </p>
          </div>
          <StableGrid stables={regularStables} onViewDetails={handleViewDetails} />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}