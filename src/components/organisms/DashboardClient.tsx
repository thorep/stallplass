"use client";

import React, { useState } from "react";
import Image from "next/image";
import Button from "@/components/atoms/Button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useStablesByOwner } from "@/hooks/useStables";
import { useServicesByUser } from "@/hooks/useServices";
import ViewAnalytics from "@/components/molecules/ViewAnalytics";
import StableManagementCard from "./StableManagementCard";
import ServiceManagementCard from "./ServiceManagementCard";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import CreateServiceModal from "@/components/organisms/CreateServiceModal";
import type { StableWithBoxStats } from "@/types";
import type { ServiceWithDetails } from "@/types/service";
import type { User } from "@supabase/supabase-js";

interface DashboardClientProps {
  userId: string;
  user: User;
}

type TabType = "analytics" | "stables" | "services";

export default function DashboardClient({ userId, user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const router = useRouter();

  // Data fetching
  const {
    data: stables = [] as StableWithBoxStats[],
    isLoading: stablesLoading,
    error: stablesError,
  } = useStablesByOwner(userId);

  const { data: userServices = [], isLoading: servicesLoading, refetch: refetchServices } = useServicesByUser(userId);

  const handleAddStable = () => {
    router.push("/ny-stall");
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
      <div className="mx-auto max-w-7xl px-2 py-6 sm:py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-6">
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
        <div className="mt-8">
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
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl overflow-hidden">
                    <Image
                      src="/box_icon.jpeg"
                      alt="Stables"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Mine staller
                    </h2>
                    <p className="text-body-sm text-slate-600">
                      Administrer dine registrerte staller og stallbokser
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAddStable}
                  variant="primary"
                  data-cy="add-stable-button"
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ny stall</span>
                  <span className="sm:hidden">Ny</span>
                </Button>
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
                      Du har ikke registrert noen staller ennå. Opprett din første stall for å komme i gang.
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
                <div className="space-y-4 sm:space-y-6" data-cy="stables-list">
                  {stables.map((stable: StableWithBoxStats) => (
                    <StableManagementCard key={stable.id} stable={stable} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6" data-cy="services">
              <div className="flex justify-between items-center">
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
                    <p className="text-body-sm text-slate-600">
                      Administrer dine tjenesteannonser
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsServiceModalOpen(true)}
                  variant="primary"
                  data-cy="add-service-button"
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ny tjeneste</span>
                  <span className="sm:hidden">Ny</span>
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
                      Du har ikke registrert noen tjenester ennå. Opprett din første tjeneste for å komme i gang.
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
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service: ServiceWithDetails) => (
                      <ServiceManagementCard
                        key={service.id}
                        service={service}
                        onToggleStatus={() => {
                          // TODO: Use useUpdateService hook when service mutations are implemented
                        }}
                      />
                    ))}
                  </div>
                </div>
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
    </div>
  );
}