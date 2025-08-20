"use client";

import Button from "@/components/atoms/Button";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import SmartHorseBuyList from "@/components/molecules/SmartHorseBuyList";
import SmartHorseSaleList from "@/components/molecules/SmartHorseSaleList";
import SmartPartLoanHorseList from "@/components/molecules/SmartPartLoanHorseList";
import SmartServiceList from "@/components/molecules/SmartServiceList";
import ViewAnalytics from "@/components/molecules/ViewAnalytics";
import CreateServiceModal from "@/components/organisms/CreateServiceModal";
import HorseBuyModal from "@/components/organisms/HorseBuyModal";
import HorseSaleModal from "@/components/organisms/HorseSaleModal";
import NewStableModal from "@/components/organisms/NewStableModal";
import PartLoanHorseModal from "@/components/organisms/PartLoanHorseModal";
import { useHorseBuysByUser } from "@/hooks/useHorseBuys";
import { useHorseSalesByUser } from "@/hooks/useHorseSales";
import { usePartLoanHorsesByUser } from "@/hooks/usePartLoanHorses";
import { useServicesByUser } from "@/hooks/useServices";
import { useStablesByOwner } from "@/hooks/useStables";
import type { StableAmenity, StableWithBoxStats } from "@/types";
import { PlusIcon } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import StableManagementCard from "./StableManagementCard";

interface DashboardClientProps {
  userId: string;
  user: User;
  amenities: StableAmenity[];
}

type TabType = "analytics" | "stables" | "services" | "forhest" | "horse-sales";

export default function DashboardClient({ userId, user, amenities }: DashboardClientProps) {
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isNewStableModalOpen, setIsNewStableModalOpen] = useState(false);
  const [isPartLoanHorseModalOpen, setIsPartLoanHorseModalOpen] = useState(false);
  const [isHorseSaleModalOpen, setIsHorseSaleModalOpen] = useState(false);
  const [isHorseBuyModalOpen, setIsHorseBuyModalOpen] = useState(false);
  // Two-button design (equal weight)
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Get initial tab from URL or default to analytics
  const getInitialTab = (): TabType => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "stables" ||
      tabParam === "services" ||
      tabParam === "analytics" ||
      tabParam === "forhest" ||
      tabParam === "horse-sales"
    ) {
      return tabParam as TabType;
    }
    return "analytics";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  // Update URL when tab changes
  const handleTabChange = useCallback(
    (newTab: TabType) => {
      setActiveTab(newTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", newTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Sync state with URL changes (for browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "stables" ||
      tabParam === "services" ||
      tabParam === "analytics" ||
      tabParam === "forhest" ||
      tabParam === "horse-sales"
    ) {
      setActiveTab(tabParam as TabType);
    } else if (!tabParam) {
      // If no tab param, default to analytics
      setActiveTab("analytics");
    }
  }, [searchParams]);

  // Data fetching
  const {
    data: stables = [] as StableWithBoxStats[],
    isLoading: stablesLoading,
    error: stablesError,
  } = useStablesByOwner(userId);

  const {
    data: userServices = [],
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useServicesByUser(userId);

  const { data: partLoanHorses = [], isLoading: partLoanHorsesLoading } =
    usePartLoanHorsesByUser(userId);

  const { data: horseSales = [], isLoading: horseSalesLoading } = useHorseSalesByUser(userId);

  const { data: horseBuys = [], isLoading: horseBuysLoading } = useHorseBuysByUser(userId);

  const handleAddStable = () => {
    // Allow creating multiple stables; open creation modal directly
    setIsNewStableModalOpen(true);
  };

  const handleServiceCreated = () => {
    setIsServiceModalOpen(false);
    refetchServices();
  };

  // Tab configuration with original icons
  const tabs = [
    { id: "analytics" as TabType, name: "Analyse", icon: "custom-analytics" },
    { id: "stables" as TabType, name: "Mine staller", icon: "custom-stables" },
    { id: "horse-sales" as TabType, name: "Hest", icon: "custom-horse-sales" },
    { id: "services" as TabType, name: "Tjenester", icon: "custom-services" },
    { id: "forhest" as TabType, name: "Fôrhest", icon: "custom-forhest" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-1 py-0 pb-4 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-6 hidden sm:flex">
            <div className="h-12 w-12 rounded-xl overflow-hidden">
              <Image
                src="/dashboard_icon_cropped.jpeg"
                alt="Dashboard"
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <h1 className="text-h1 sm:text-h1 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-body-sm text-slate-600">
                Administrer dine staller, leieforhold og tjenester
              </p>
            </div>
          </div>

          {/* Tab Navigation with URL persistence */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex justify-between sm:justify-start sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  data-cy={`dashboard-tab-${tab.id}`}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap min-w-0 flex-1 sm:flex-initial ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {tab.icon === "custom-analytics" ? (
                    <div className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src="/analytics_icon.jpeg"
                        alt="Analytics"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : tab.icon === "custom-stables" ? (
                    <div className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Stables"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : tab.icon === "custom-services" ? (
                    <div className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src="/services_icon.jpeg"
                        alt="Services"
                        width={34}
                        height={34}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : tab.icon === "custom-forhest" ? (
                    <div className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Fôrhest"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : tab.icon === "custom-horse-sales" ? (
                    <div className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Salg av hest"
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <span className="text-xs sm:text-sm sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6" data-cy="analytics">
              {stables.length > 0 ||
              userServices.length > 0 ||
              partLoanHorses.length > 0 ||
              horseSales.length > 0 ? (
                <ViewAnalytics ownerId={userId} />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl overflow-hidden">
                      <Image
                        src="/analytics_icon.jpeg"
                        alt="Analytics"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Analyse
                      </h2>
                      <p className="text-body-sm text-slate-600">
                        Visninger og statistikk for dine staller, tjenester og fôrhest
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/analytics_icon.jpeg"
                        alt="Analytics"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <p className="text-slate-600">
                      Du trenger å ha registrert staller, tjenester, fôrhest eller hestesalg for å
                      se analyse
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stables Tab */}
          {activeTab === "stables" && (
            <div className="space-y-6" data-cy="stables">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src="/box_icon.jpeg"
                      alt="Stables"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Mine staller
                    </h2>
                    <p className="text-body-sm text-slate-600">
                      Administrer dine registrerte staller og stallbokser
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={handleAddStable}
                    variant="primary"
                    data-cy="add-stable-button"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                  >
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="whitespace-nowrap">Legg til ny stall</span>
                  </Button>
                </div>
              </div>

              {stablesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : stablesError ? (
                <div className="text-center py-12">
                  <p className="text-red-600">Feil ved lasting av staller</p>
                </div>
              ) : stables.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/box_icon.jpeg"
                        alt="No stables"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ingen staller registrert
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Du har ikke registrert noen staller ennå. Opprett din første stall for å komme
                      i gang.
                    </p>
                    <Button
                      onClick={handleAddStable}
                      variant="primary"
                      className="flex items-center space-x-2 mx-auto"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Opprett din første stall</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4" data-cy="stables-list">
                  {stables.map((stable: StableWithBoxStats) => (
                    <StableManagementCard key={stable.id} stable={stable} userId={userId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6" data-cy="services">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl overflow-hidden">
                    <Image
                      src="/services_icon.jpeg"
                      alt="Services"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Tjenester
                    </h2>
                    <p className="text-body-sm text-slate-600">Administrer dine tjenesteannonser</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsServiceModalOpen(true)}
                  variant="primary"
                  data-cy="add-service-button"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="whitespace-nowrap">Legg til ny tjeneste</span>
                </Button>
              </div>

              {servicesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : userServices.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/services_icon.jpeg"
                        alt="No services"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ingen tjenester registrert
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Du har ikke registrert noen tjenester ennå. Opprett din første tjeneste for å
                      komme i gang.
                    </p>
                    <Button
                      onClick={() => setIsServiceModalOpen(true)}
                      variant="primary"
                      className="flex items-center space-x-2 mx-auto"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Opprett din første tjeneste</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <SmartServiceList services={userServices} servicesLoading={servicesLoading} />
              )}
            </div>
          )}

          {/* Fôrhest Tab */}
          {activeTab === "forhest" && (
            <div className="space-y-6" data-cy="forhest">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl overflow-hidden">
                    <Image
                      src="/box_icon.jpeg"
                      alt="Fôrhest"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Fôrhest
                    </h2>
                    <p className="text-body-sm text-slate-600">Administrer dine fôrhest annonser</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsPartLoanHorseModalOpen(true)}
                  variant="primary"
                  data-cy="add-forhest-button"
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 text-sm min-h-[44px]"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="whitespace-nowrap">Legg til ny fôrhest</span>
                </Button>
              </div>

              {partLoanHorsesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : partLoanHorses.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/box_icon.jpeg"
                        alt="No fôrhest"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ingen fôrhest registrert
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Du har ikke registrert noen fôrhest ennå. Opprett din første fôrhest annonse
                      for å komme i gang.
                    </p>
                    <Button
                      onClick={() => setIsPartLoanHorseModalOpen(true)}
                      variant="primary"
                      className="flex items-center space-x-2 mx-auto"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Opprett din første fôrhest</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <SmartPartLoanHorseList
                  partLoanHorses={partLoanHorses}
                  partLoanHorsesLoading={partLoanHorsesLoading}
                  user={user}
                />
              )}
            </div>
          )}

          {/* Horse Sales Tab */}
          {activeTab === "horse-sales" && (
            <div className="space-y-6" data-cy="horse-sales">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl overflow-hidden">
                    <Image
                      src="/box_icon.jpeg"
                      alt="Salg av hest"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Salg av hest
                    </h2>
                    <p className="text-body-sm text-slate-600">
                      Administrer dine hestesalg annonser
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  {/* Primærhandling: Legg ut hest til salgs */}
                  <Button
                    onClick={() => setIsHorseSaleModalOpen(true)}
                    variant="primary"
                    aria-label="Legg ut hest til salgs"
                    data-cy="add-horse-sale-button"
                    className="w-full md:w-auto flex items-center justify-center text-sm min-h-[44px] md:min-w-[240px] whitespace-nowrap shadow-xs hover:shadow-sm"
                  >
                    {/* lucide-react Upload/PlusCircle icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <span>Legg ut hest til salgs</span>
                  </Button>

                  {/* Sekundærhandling: Legg ut ønskes kjøpt */}
                  <Button
                    onClick={() => setIsHorseBuyModalOpen(true)}
                    variant="outline"
                    aria-label="Legg ut ønskes kjøpt"
                    className="w-full md:w-auto flex items-center justify-center text-sm min-h-[44px] md:min-w-[220px] whitespace-nowrap hover:border-indigo-300"
                  >
                    {/* lucide-react Search icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <span>Legg ut ønskes kjøpt</span>
                  </Button>
                </div>
              </div>

              {horseSalesLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : horseSales.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/box_icon.jpeg"
                        alt="No horse sales"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                        unoptimized
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ingen hestesalg registrert
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Du har ikke registrert noen hestesalg ennå. Opprett din første hestesalg
                      annonse for å komme i gang.
                    </p>
                    <Button
                      onClick={() => setIsHorseSaleModalOpen(true)}
                      variant="primary"
                      className="flex items-center space-x-2 mx-auto"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Opprett din første hestesalg</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <SmartHorseSaleList
                  horseSales={horseSales}
                  horseSalesLoading={horseSalesLoading}
                  user={user}
                />
              )}

              {/* Horse Buys Section */}
              <div className="pt-4">
                <h3 className="text-h3 font-semibold text-slate-900 mb-2">Ønskes kjøpt</h3>
                {horseBuysLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <SmartHorseBuyList
                    horseBuys={horseBuys as any}
                    horseBuysLoading={horseBuysLoading}
                    user={user}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Creation Modal */}
      <CreateServiceModal
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
        onSuccess={handleServiceCreated}
        user={user}
      />

      {/* New Stable Modal */}
      <NewStableModal
        isOpen={isNewStableModalOpen}
        onClose={() => setIsNewStableModalOpen(false)}
        amenities={amenities}
        user={user}
      />

      {/* Part Loan Horse Modal */}
      <PartLoanHorseModal
        isOpen={isPartLoanHorseModalOpen}
        onClose={() => setIsPartLoanHorseModalOpen(false)}
        user={user}
      />

      {/* Horse Sale Modal */}
      <HorseSaleModal
        isOpen={isHorseSaleModalOpen}
        onClose={() => setIsHorseSaleModalOpen(false)}
        user={user}
      />

      {/* Horse Buy Modal */}
      <HorseBuyModal
        isOpen={isHorseBuyModalOpen}
        onClose={() => setIsHorseBuyModalOpen(false)}
        user={user}
      />
    </div>
  );
}
