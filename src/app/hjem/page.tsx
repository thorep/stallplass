"use client";

import { Button } from "@/components/ui/button";
import BoxGrid from "@/components/organisms/BoxGrid";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { BoxWithStable } from "@/types/stable";
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Stack } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const [filteredBoxes, setFilteredBoxes] = useState<BoxWithStable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/boxes?includeStable=true");
        if (response.ok) {
          const boxes = await response.json();
          setFilteredBoxes(boxes);
        } else {
          throw new Error("Failed to fetch boxes");
        }
      } catch {
        setError("Failed to load boxes");
      } finally {
        setLoading(false);
      }
    };

    fetchBoxes();
  }, [user, router]);

  const sponsoredBoxes = filteredBoxes.filter((box) => box.isSponsored);
  const regularBoxes = filteredBoxes.filter((box) => !box.isSponsored);

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
            sizes="100vw"
            quality={75}
            priority
            unoptimized
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
              <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                stallplassen
              </span>
            </h1>

            {/* Subtitle */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-10 max-w-3xl mx-auto border border-white/30">
              <p className="text-h4 text-white leading-relaxed">
                Stallplass.no er Norges første komplette plattform for hestemiljøet. Her kan
                hesteeiere enkelt finne ledige stallplasser og tjenester som veterinær, hovslager og
                hestebutikk – alt samlet på ett sted. Tjenestetilbydere vises automatisk på staller
                og stallplasser i sitt nærområde, slik at leietakere raskt finner både stallplass og
                nødvendige tjenester. <br />
                For stalleiere og tjenestetilbydere gir Stallplass.no en unik mulighet til å nå ut
                til potensielle kunder i sitt område. Ved å være synlig på relevante staller og i
                lokale søk, blir det enklere å få henvendelser fra hesteeiere som faktisk trenger
                det du tilbyr. <br />
                Du kan også registrere hesteinformasjon og dele den trygt med stalleier eller andre
                som tar hånd om hesten.
              </p>
            </div>

            {/* Search Button */}
            <div className="max-w-2xl mx-auto mb-12">
              <Link href="/sok">
                <Button
                  size="lg"
                  className="bg-[#5B4B8A] hover:bg-[#47396A] text-white shadow-2xl border-0 px-12 py-6 text-xl font-bold rounded-2xl transform hover:scale-105 transition-all duration-300 shadow-violet-500/25"
                  data-cy="search-stables-button"
                >
                  <MagnifyingGlassIcon className="h-6 w-6 mr-3" />
                  Søk etter stallplass
                </Button>
              </Link>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <CheckCircleIcon className="h-5 w-5 text-violet-300" />
                </div>
                <span className="font-medium drop-shadow-sm">Heste-spesifikke filtre</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                  <ShieldCheckIcon className="h-5 w-5 text-violet-300" />
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Quick actions */}
            <section className="text-center">
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                className="max-w-4xl mx-auto"
                sx={{
                  alignItems: 'stretch',
                  justifyContent: 'center',
                }}
              >
                <Link href="/sok" className="flex-1">
                  <div className="group bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                    <div className="h-12 w-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Søk etter stallplass</h3>
                    <p className="text-indigo-700 text-sm">
                      Finn ledige stallplasser i ditt område
                    </p>
                  </div>
                </Link>

                <Link href="/dashboard" className="flex-1">
                  <div className="group bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                    <div className="h-12 w-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-violet-900 mb-2">
                      Legg ut stallplass eller tjeneste
                    </h3>
                    <p className="text-violet-700 text-sm">
                      Registrer din stall eller tjeneste og la andre finne deg
                    </p>
                  </div>
                </Link>

                <Link href="/mine-hester" className="flex-1">
                  <div className="group bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                    <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <HeartIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      Legg til din hest på Mine Hester
                    </h3>
                    <p className="text-amber-700 text-sm">
                      Organiser hesteinformasjon og del sikkert med andre
                    </p>
                  </div>
                </Link>
              </Stack>
            </section>

            {/* Sponsored boxes */}
            {sponsoredBoxes.length > 0 && (
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-h2 md:text-h2-lg font-bold text-slate-900 mb-4">
                    Sponsede bokser
                  </h2>
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
                  <h2 className="text-h2 font-bold text-slate-900 mb-2">Ledige stallbokser</h2>
                  <p className="text-slate-600">{filteredBoxes.length} bokser tilgjengelig</p>
                </div>
                <Link href="/sok">
                  <Button variant="outline" className="mt-4 sm:mt-0">
                    Se alle stallplasser
                  </Button>
                </Link>
              </div>

              {filteredBoxes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    &apos;Ingen stallplasser tilgjengelig&apos;
                  </h3>
                  <p className="text-slate-500">
                    &apos;Sjekk tilbake senere for nye stallbokser.&apos;
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
