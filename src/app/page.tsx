'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StableWithBoxStats } from '@/types/stable';
import Header from '@/components/organisms/Header';
import StableGrid from '@/components/organisms/StableGrid';
import Footer from '@/components/organisms/Footer';
import Button from '@/components/atoms/Button';
import { useAuth } from '@/lib/auth-context';
import { 
  MagnifyingGlassIcon, 
  CheckCircleIcon,
  BuildingOfficeIcon,
  HeartIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allStables, setAllStables] = useState<StableWithBoxStats[]>([]);
  const [filteredStables, setFilteredStables] = useState<StableWithBoxStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStables = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stables?withBoxStats=true');
        if (response.ok) {
          const stables = await response.json();
          setAllStables(stables);
          setFilteredStables(stables);
          
        } else {
          throw new Error('Failed to fetch stables');
        }
      } catch (err) {
        setError('Failed to load stables');
        console.error('Error fetching stables:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStables();
  }, [user, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredStables(allStables);
      return;
    }
    
    const filtered = allStables.filter(stable => 
      stable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stable.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stable.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStables(filtered);
  };


  const featuredStables = filteredStables.filter(stable => stable.featured);
  const regularStables = filteredStables.filter(stable => !stable.featured);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Modern Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-emerald-50 pt-8 pb-16 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 mb-6">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Norges ledende stallplattform
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-emerald-900 bg-clip-text text-transparent mb-6 leading-tight">
              Finn den perfekte
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                stallplassen
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Søk blant hundrevis av kvalitetsstaller og finn det beste stedet for hesten din. 
              Trygt, enkelt og helt gratis.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Søk etter stallplass, sted eller navn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-50 transition-colors"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="sm:px-8">
                  Søk
                </Button>
              </div>
            </form>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-3 text-slate-600">
                <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="font-medium">Kvalitetsgaranti</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-slate-600">
                <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="font-medium">Trygg kommunikasjon</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-slate-600">
                <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <HeartIcon className="h-5 w-5 text-amber-600" />
                </div>
                <span className="font-medium">Gratis for ryttere</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Laster staller...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Quick actions */}
            <section className="text-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Link href="/staller">
                  <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Søk staller</h3>
                    <p className="text-indigo-700 text-sm">Finn ledige stallplasser i ditt område</p>
                  </div>
                </Link>

                <Link href="/registrer">
                  <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">Bli stalleier</h3>
                    <p className="text-emerald-700 text-sm">Registrer din stall og tjén penger</p>
                  </div>
                </Link>
              </div>
            </section>

            {/* Featured stables */}
            {featuredStables.length > 0 && (
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Utvalgte staller</h2>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Høykvalitetsstaller som skiller seg ut med eksepsjonell service og fasiliteter.
                  </p>
                </div>
                <StableGrid stables={featuredStables} />
              </section>
            )}
            
            {/* All stables */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {searchQuery ? `Søkeresultater for "${searchQuery}"` : 'Alle staller'}
                  </h2>
                  <p className="text-slate-600">
                    {filteredStables.length} staller tilgjengelig
                  </p>
                </div>
                <Link href="/staller">
                  <Button variant="outline" className="mt-4 sm:mt-0">
                    Se alle staller
                  </Button>
                </Link>
              </div>
              
              {filteredStables.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchQuery ? 'Ingen resultater' : 'Ingen staller tilgjengelig'}
                  </h3>
                  <p className="text-slate-500">
                    {searchQuery 
                      ? 'Prøv et annet søkeord eller juster filtere.' 
                      : 'Sjekk tilbake senere for nye stallplasser.'
                    }
                  </p>
                </div>
              ) : (
                <StableGrid stables={regularStables.slice(0, 6)} />
              )}
            </section>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}