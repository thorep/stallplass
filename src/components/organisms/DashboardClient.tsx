"use client";

import Button from "@/components/atoms/Button";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import SmartServiceList from "@/components/molecules/SmartServiceList";
import ViewAnalytics from "@/components/molecules/ViewAnalytics";
import CreateServiceModal from "@/components/organisms/CreateServiceModal";
import NewStableModal from "@/components/organisms/NewStableModal";
import StableLimitModal from "@/components/organisms/StableLimitModal";
import { useServicesByUser } from "@/hooks/useServices";
import { useStablesByOwner } from "@/hooks/useStables";
import type { StableAmenity, StableWithBoxStats } from "@/types";
import { PlusIcon } from "@heroicons/react/24/outline";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import StableManagementCard from "./StableManagementCard";

interface DashboardClientProps {
  userId: string;
  user: User;
  amenities: StableAmenity[];
}

type TabType = "analytics" | "stables" | "services";

export default function DashboardClient({ userId, user, amenities }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isNewStableModalOpen, setIsNewStableModalOpen] = useState(false);
  const [isStableLimitModalOpen, setIsStableLimitModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Check for tab parameter and set initial tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "stables" || tabParam === "services" || tabParam === "analytics") {
      setActiveTab(tabParam as TabType);
      // Clean up the URL parameter after setting the tab
      const url = new URL(window.location.href);
      url.searchParams.delete("tab");
      window.history.replaceState(null, "", url.pathname);
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

  const handleAddStable = () => {
    // Check if user already has 1 or more stables
    if (stables && stables.length >= 1) {
      setIsStableLimitModalOpen(true);
    } else {
      setIsNewStableModalOpen(true);
    }
  };

  const handleServiceCreated = () => {
    setIsServiceModalOpen(false);
    refetchServices();
  };

  // Tab configuration with original icons
  const tabs = [
    { id: "analytics" as TabType, name: "Analyse", icon: "custom-analytics" },
    { id: "stables" as TabType, name: "Mine staller", icon: "custom-stables" },
    { id: "services" as TabType, name: "Tjenester", icon: "custom-services" },
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

          {/* Tab Navigation - NO router.push, NO searchParams */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex justify-between sm:justify-start sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
              {stables.length > 0 || userServices.length > 0 ? (
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
                      />
                    </div>
                    <div>
                      <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Analyse
                      </h2>
                      <p className="text-body-sm text-slate-600">
                        Visninger og statistikk for dine staller og tjenester
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
                      />
                    </div>
                    <p className="text-slate-600">
                      Du trenger å ha registrert staller eller tjenester for å se analyse
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

      {/* Stable Limit Modal */}
      <StableLimitModal
        isOpen={isStableLimitModalOpen}
        onClose={() => setIsStableLimitModalOpen(false)}
      />
    </div>
  );
}
