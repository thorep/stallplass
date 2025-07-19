'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BoxWithStable } from '@/types/stable';
import Header from '@/components/organisms/Header';
import BoxGrid from '@/components/organisms/BoxGrid';
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
import Image from 'next/image';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [allBoxes, setAllBoxes] = useState<BoxWithStable[]>([]);
  const [filteredBoxes, setFilteredBoxes] = useState<BoxWithStable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/boxes?includeStable=true');
        if (response.ok) {
          const boxes = await response.json();
          setAllBoxes(boxes);
          setFilteredBoxes(boxes);
          
        } else {
          throw new Error('Failed to fetch boxes');
        }
      } catch (err) {
        setError('Failed to load boxes');
        console.error('Error fetching boxes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoxes();
  }, [user, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setFilteredBoxes(allBoxes);
      return;
    }
    
    const filtered = allBoxes.filter(box => 
      box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.stable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.stable.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      box.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBoxes(filtered);
  };


  const sponsoredBoxes = filteredBoxes.filter(box => box.isSponsored);
  const regularBoxes = filteredBoxes.filter(box => !box.isSponsored);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Modern Hero Section */}
      <section className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-horses.jpg"
            alt="Horses in stable"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/70"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 text-sm font-medium text-white mb-6">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Norges ledende stallplattform
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Finn den perfekte
              <br />
              <span className="bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                stallboksen
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Norges første hestespesifikke plattform for stallplass. Søk med heste-filtre som hestestørrelse, 
              innendørs/utendørs, strøm, vann og mer. Laget spesielt for ryttere og stall-eiere.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Søk etter stallboks, stall eller sted..."
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
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-300" />
                </div>
                <span className="font-medium drop-shadow-sm">Heste-spesifikke filtre</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <ShieldCheckIcon className="h-5 w-5 text-indigo-300" />
                </div>
                <span className="font-medium drop-shadow-sm">Laget for heste-miljøet</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <HeartIcon className="h-5 w-5 text-amber-300" />
                </div>
                <span className="font-medium drop-shadow-sm">Gratis for ryttere</span>
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
            <p className="text-slate-500">Laster stallbokser...</p>
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
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Søk bokser</h3>
                    <p className="text-indigo-700 text-sm">Finn ledige stallbokser i ditt område</p>
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

            {/* Sponsored boxes */}
            {sponsoredBoxes.length > 0 && (
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">Sponsede bokser</h2>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Fremhevede stallbokser som gir ekstra synlighet og rask tilgang.
                  </p>
                </div>
                <BoxGrid boxes={sponsoredBoxes} />
              </section>
            )}
            
            {/* All boxes */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {searchQuery ? `Søkeresultater for "${searchQuery}"` : 'Ledige stallbokser'}
                  </h2>
                  <p className="text-slate-600">
                    {filteredBoxes.length} bokser tilgjengelig
                  </p>
                </div>
                <Link href="/staller">
                  <Button variant="outline" className="mt-4 sm:mt-0">
                    Se alle staller
                  </Button>
                </Link>
              </div>
              
              {filteredBoxes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {searchQuery ? 'Ingen resultater' : 'Ingen bokser tilgjengelig'}
                  </h3>
                  <p className="text-slate-500">
                    {searchQuery 
                      ? 'Prøv et annet søkeord eller juster filtere.' 
                      : 'Sjekk tilbake senere for nye stallbokser.'
                    }
                  </p>
                </div>
              ) : (
                <BoxGrid boxes={regularBoxes.slice(0, 6)} />
              )}
            </section>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}