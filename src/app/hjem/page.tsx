"use client";

import BoxListingCard from "@/components/molecules/BoxListingCard";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { Button } from "@/components/ui/button";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import type { RecentActivityItem } from "@/types/forum";
import { BoxWithStablePreview } from "@/types/stable";
import { formatShortNorDate, truncateText } from "@/utils/formatting";
import {
  BuildingOfficeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user } = useSupabaseUser();
  const router = useRouter();
  const [filteredBoxes, setFilteredBoxes] = useState<BoxWithStablePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentActivityItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoadingThreads(true);
        const res = await fetch("/api/forum/recent-activity?limit=3");
        if (!res.ok) throw new Error("Failed to fetch recent activity");
        const json = await res.json();
        setRecentItems(json.data || []);
      } catch (e) {
        setThreadsError("Kunne ikke hente nylig aktivitet");
      } finally {
        setLoadingThreads(false);
      }
    };
    fetchRecent();
  }, []);

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
              Stallplass.no –
              <span className="bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent ml-2">
                alt du trenger for hesten
              </span>
            </h1>

            {/* Description intentionally removed to reduce friction */}
            {/* Feature links (glass cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* Annonser */}
              <Link href="/sok" className="group">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 text-left hover:bg-white/25 transition-all h-full">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Annonser</h3>
                      <p className="text-xs sm:text-sm text-white/90">
                        Stallplasser, hester, fôrhester og tjenester
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Mine Hester */}
              <Link href="/mine-hester" className="group">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 text-left hover:bg-white/25 transition-all h-full">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                      <HeartIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Mine hester</h3>
                      <p className="text-xs sm:text-sm text-white/90">
                        Samle hesteinfo og del trygt med andre
                      </p>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Forum */}
              <Link href="/forum" className="group">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/30 text-left hover:bg-white/25 transition-all h-full">
                  <div className="flex items-center gap-3 text-white">
                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                      <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Forum</h3>
                      <p className="text-xs sm:text-sm text-white/90">
                        Spør, del erfaringer og få råd
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Laster stallplasser...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Why Stallplass */}
            <section>
              <div className="text-center mb-8">
                <h2 className="text-h2 font-bold text-slate-900 mb-2">
                  Hvorfor velge Stallplass.no?
                </h2>
                <p className="text-slate-600">Alt du trenger for hest – samlet på ett sted.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <MagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Finn raskt det du trenger</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Søk etter stallplasser, hester og tjenester i nærheten med relevante filtre.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-slate-900">Gratis for ryttere</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Opprett bruker, lagre favoritter og administrer hesteinformasjon uten kostnad.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">Bygget for hestemiljøet</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Del trygt med stalleier, få oversikt og still spørsmål i forumet.
                  </p>
                </div>
              </div>
            </section>

            {/* Forum feed */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h2 font-bold text-slate-900">Fra forumet</h2>
                  <p className="text-slate-600">Nylig aktivitet fra fellesskapet</p>
                </div>
                <Link href="/forum">
                  <Button variant="outline">Se alle</Button>
                </Link>
              </div>

              {loadingThreads ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B4B8A] mx-auto" />
                </div>
              ) : threadsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{threadsError}</p>
                </div>
              ) : recentItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Ingen tråder enda</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {recentItems.map((a) => {
                    const href =
                      a.type === "reply" ? `/forum/${a.threadId ?? ""}` : `/forum/${a.id}`;
                    const title =
                      a.type === "reply" ? a.threadTitle || "Svar i tråd" : a.title || "Tråd";
                    const excerpt = a.content
                      ? truncateText(a.content.replace(/<[^>]*>/g, "").trim(), 140)
                      : "";
                    return (
                      <Link
                        key={`${a.type}-${a.id}`}
                        href={href}
                        className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="text-xs text-indigo-700 font-medium mb-1">
                          {a.category?.name || "Forum"}
                        </div>
                        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2">{title}</h3>
                        {excerpt ? (
                          <p className="text-sm text-slate-600 line-clamp-3 mb-3">{excerpt}</p>
                        ) : null}
                        <div className="text-xs text-slate-500">
                          {a.author?.nickname || "Anonym"} • {formatShortNorDate(a.createdAt)} •{" "}
                          {a.type === "reply" ? "svar" : "tråd"}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Sponsored boxes */}
            {sponsoredBoxes.length > 0 && (
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-h2 md:text-h2-lg font-bold text-slate-900 mb-4">
                    Sponsede plasser
                  </h2>
                  <p className="text-slate-600 max-w-2xl mx-auto">
                    Fremhevede stallplasser som gir ekstra synlighet og rask tilgang.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sponsoredBoxes.map((box) => (
                    <BoxListingCard key={box.id} box={box} />
                  ))}
                </div>
              </section>
            )}

            {/* All boxes */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <h2 className="text-h2 font-bold text-slate-900 mb-2">Ledige stallplasser</h2>
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
                    &apos;Sjekk tilbake senere for nye stallplasser.&apos;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularBoxes.slice(0, 6).map((box) => (
                    <BoxListingCard key={box.id} box={box} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
