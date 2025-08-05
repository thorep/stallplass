"use client";

import Button from "@/components/atoms/Button";
import ViewAnalytics from "@/components/molecules/ViewAnalytics";
import { useServicesByUser } from "@/hooks/useServices";
import { useStablesByOwner } from "@/hooks/useStables";
import { ServiceWithDetails } from "@/types/service";
import { StableWithBoxStats } from "@/types/stable";
import { PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import ServiceManagementCard from "./ServiceManagementCard";
import StableManagementCard from "./StableManagementCard";

interface DashboardClientProps {
  userId: string;
}

type TabType = "stables" | "services" | "analytics";

export default function DashboardClient({ userId }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const router = useRouter();
  const searchParams = useSearchParams();
  // userId is already authenticated by server component, no need for client auth check

  // Fetch stables data using TanStack Query
  const {
    data: stables = [] as StableWithBoxStats[],
    isLoading: stablesInitialLoading,
    error: stablesError,
  } = useStablesByOwner(userId);

  // Debug logging for stable data changes
  React.useEffect(() => {
    // Stables data updated successfully
  }, [stables]);

  const handleAddStable = () => {
    router.push("/ny-stall");
  };

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && ["stables", "services", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Use TanStack Query for user-specific services
  const { data: userServices = [], isLoading: servicesLoading } = useServicesByUser(userId);

  const toggleServiceStatus = async () => {
    try {
      // TODO: Use useUpdateService hook when service mutations are implemented
      toast.info("Service status toggle not yet implemented with TanStack Query hooks");
    } catch {
      toast.error("Kunne ikke oppdatere tjenesten");
    }
  };

  // Tab configuration
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

          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex justify-between sm:justify-start sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      router.push(`/dashboard?tab=${tab.id}`);
                    }}
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
                    ) : (
                      <tab.icon className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm sm:inline">{tab.name}</span>
                  </button>
                );
              })}
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
            <div data-cy="stables">
              {/* Header Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-xl overflow-hidden">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Mine staller"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Mine staller
                      </h2>
                      <p className="text-body-sm text-slate-600">
                        <span className="sm:hidden">Administrer staller og stallplasser</span>
                        <span className="hidden sm:inline">
                          Administrer dine staller og tilby stallplasser til hesteeiere
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddStable}
                    variant="primary"
                    disabled={stablesInitialLoading}
                    data-cy="add-stable-button"
                    className="min-h-[44px] min-w-[44px] px-3 py-2 sm:px-4 sm:py-2"
                  >
                    <PlusIcon className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ny stall</span>
                  </Button>
                </div>

                {stables.length > 0 && (
                  <div className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
                    {stables.length} stall{stables.length !== 1 ? "er" : ""}
                  </div>
                )}
              </div>

              {/* Stable Management */}
              {stablesInitialLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Laster staller...</p>
                  </div>
                </div>
              ) : stablesError ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Stables"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Feil ved lasting av staller
                    </h3>
                    <p className="text-slate-600 mb-4">{stablesError?.message || "Ukjent feil"}</p>
                  </div>
                </div>
              ) : stables.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/box_icon.jpeg"
                        alt="Stables"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Ingen staller registrert ennå
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Registrer din første stall og begynn å tilby stallplasser til hesteeiere
                    </p>
                    <Button
                      onClick={handleAddStable}
                      variant="primary"
                      data-cy="create-first-stable-button"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Opprett første stall
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
            <div data-cy="services">
              {/* Header Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="hidden sm:flex h-12 w-12 rounded-xl overflow-hidden">
                      <Image
                        src="/services_icon.jpeg"
                        alt="Mine tjenester"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-h2 sm:text-h2 font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Mine tjenester
                      </h2>
                      <p className="text-body-sm text-slate-600">
                        <span className="sm:hidden">Administrer tjenesteannonser</span>
                        <span className="hidden sm:inline">
                          Administrer dine tjenesteannonser som veterinær, hovslagare eller trener
                        </span>
                      </p>
                    </div>
                  </div>
                  <Link href="/tjenester/ny" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full sm:w-auto min-h-[44px]">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Ny tjeneste
                    </Button>
                  </Link>
                </div>

                {userServices.length > 0 && (
                  <div className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
                    {userServices.length} tjeneste{userServices.length !== 1 ? "r" : ""}
                  </div>
                )}
              </div>

              {/* Services Management */}
              {servicesLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Laster tjenester...</p>
                  </div>
                </div>
              ) : userServices.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full overflow-hidden mx-auto mb-4">
                      <Image
                        src="/services_icon.jpeg"
                        alt="Services"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover opacity-60"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Ingen tjenester ennå
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Opprett din første tjenesteannonse og nå kunder i hele Norge
                    </p>
                    <Link href="/tjenester/ny">
                      <Button variant="primary">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Opprett første tjeneste
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service: ServiceWithDetails) => (
                      <ServiceManagementCard
                        key={service.id}
                        service={service}
                        onToggleStatus={toggleServiceStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
