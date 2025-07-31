"use client";

import Button from "@/components/atoms/Button";
import ViewAnalytics from "@/components/molecules/ViewAnalytics";
import ConfirmModal from "@/components/molecules/ConfirmModal";
import { useDeleteStable } from "@/hooks/useStableMutations";
import { useStablesByOwner } from "@/hooks/useStables";
// import { useStableOwnerDashboard } from "@/hooks/useStableOwnerRealTime"; // TODO: Create this hook
import { useServices } from "@/hooks/useServices";
// import { useDeleteService, useUpdateService } from "@/hooks/useServiceMutations"; // TODO: Implement when service CRUD is available
import { useAuth } from "@/lib/supabase-auth-context";
import { ServiceWithDetails } from "@/types/service";
import { StableWithBoxStats } from "@/types/stable";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CogIcon,
  HomeIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StableManagementCard from "./StableManagementCard";
import ServiceManagementCard from "./ServiceManagementCard";

interface StallClientProps {
  userId: string;
}

type TabType = "overview" | "stables" | "services" | "analytics";

export default function StallClient({ userId }: StallClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [stableToDelete, setStableToDelete] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const deleteStableMutation = useDeleteStable();

  // Fetch stables data using TanStack Query
  const {
    data: stables = [] as StableWithBoxStats[],
    isLoading: stablesInitialLoading,
    error: stablesError,
    refetch: refetchStables,
  } = useStablesByOwner(userId);

  const handleAddStable = () => {
    router.push("/ny-stall");
  };

  const handleDeleteStable = (stableId: string, stableName: string) => {
    setStableToDelete({ id: stableId, name: stableName });
  };

  const confirmDeleteStable = async () => {
    if (!stableToDelete) return;
    
    try {
      await deleteStableMutation.mutateAsync(stableToDelete.id);
      setStableToDelete(null);
      // Force a refetch to ensure UI updates immediately
      await refetchStables();
    } catch {
      alert("Kunne ikke slette stallen. Prøv igjen.");
    }
  };

  const totalAvailable = stables.reduce(
    (sum: number, stable: StableWithBoxStats) => sum + (stable.availableBoxes || 0),
    0
  );
  const totalSpaces = stables.reduce(
    (sum: number, stable: StableWithBoxStats) => sum + (stable.boxes?.length || 0),
    0
  );

  // Get real-time box count from all stables using TanStack Query
  // For now, we'll calculate from the static data and later implement real-time updates
  const realTimeBoxCount = totalSpaces; // TODO: Implement real-time counting for each stable

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && ["overview", "stables", "services", "analytics"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Use TanStack Query for services
  const servicesQuery = useServices();

  // TODO: Create useServicesByUser hook when service CRUD is implemented
  // For now, filter all services by user (this is inefficient but works as placeholder)
  const userServices =
    servicesQuery.data?.filter((service: ServiceWithDetails) => service.userId === user?.id) || [];
  const servicesLoading = servicesQuery.isLoading;

  const handleDeleteService = async (_serviceId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne tjenesten?")) {
      return;
    }

    try {
      setDeletingServiceId(_serviceId);
      // TODO: Use useDeleteService hook when service mutations are implemented
      alert("Service deletion not yet implemented with TanStack Query hooks");
    } catch {
      alert("Kunne ikke slette tjenesten");
    } finally {
      setDeletingServiceId(null);
    }
  };

  const toggleServiceStatus = async () => {
    try {
      // TODO: Use useUpdateService hook when service mutations are implemented
      alert("Service status toggle not yet implemented with TanStack Query hooks");
    } catch {
      alert("Kunne ikke oppdatere tjenesten");
    }
  };

  // Tab configuration
  const tabs = [
    { id: "overview" as TabType, name: "Oversikt", icon: ChartBarIcon },
    { id: "stables" as TabType, name: "Mine staller", icon: BuildingOfficeIcon },
    { id: "services" as TabType, name: "Tjenester", icon: CogIcon },
    { id: "analytics" as TabType, name: "Analyse", icon: ChartBarIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Administrer dine staller, leieforhold og tjenester
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex justify-between sm:justify-start sm:space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
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
                    <Icon className="h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm sm:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8" data-cy="overview">
              {/* Loading state */}
              {stablesInitialLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Laster oversikt...</p>
                  </div>
                </div>
              )}

              {/* Error state - show actual error for debugging */}
              {stablesError && !stablesInitialLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-6">
                      <BuildingOfficeIcon className="h-12 w-12 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Feil ved lasting</h2>
                    <p className="text-slate-600 mb-4 max-w-2xl mx-auto">
                      Kunne ikke laste oversikten. Feilmelding:
                    </p>
                    <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                      {stablesError?.message || "Ukjent feil"}
                    </p>
                  </div>
                </div>
              )}

              {/* Empty state when user has no stables */}
              {!stablesInitialLoading && !stablesError && stables.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-indigo-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <BuildingOfficeIcon className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                      Velkommen til Stallplass.no Dashboard
                    </h2>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                      Dette er ditt kontrollsenter for å administrere staller, bokser og
                      leieforhold. For å komme i gang, opprett din første stall og begynn å tilby
                      stallplasser til hesteeiere.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200/50">
                        <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                          <PlusIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                          1. Opprett stall
                        </h3>
                        <p className="text-emerald-700 text-sm">
                          Registrer din stall med navn, lokasjon og fasiliteter
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50">
                        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                          <HomeIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          2. Legg til bokser
                        </h3>
                        <p className="text-blue-700 text-sm">
                          Opprett individuelle stallbokser med pris og detaljer
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/50">
                        <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                          <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">
                          3. Administrer
                        </h3>
                        <p className="text-purple-700 text-sm">
                          Følg opp leieforhold, meldinger og statistikk
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
                      <Button
                        onClick={handleAddStable}
                        variant="primary"
                        size="lg"
                        data-cy="create-first-stable-button"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Opprett din første stall
                      </Button>

                      <Link href="/tjenester/ny">
                        <Button variant="primary" size="lg" data-cy="create-first-service-button">
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Opprett din første tjeneste
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats Cards - Only show if user has a stable */}
              {!stablesInitialLoading && !stablesError && stables.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-medium">Ledige plasser</p>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-900">
                          {totalAvailable}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircleIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-600 text-sm font-medium">Totale plasser</p>
                        <p className="text-2xl sm:text-3xl font-bold text-amber-900">
                          {totalSpaces}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help text for users with stables but no boxes */}
              {!stablesInitialLoading &&
                !stablesError &&
                stables.length > 0 &&
                realTimeBoxCount === 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 mb-8">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                          Neste steg: Legg til bokser i stallen din
                        </h3>
                        <p className="text-blue-700 text-sm mb-4">
                          For å begynne å tilby boxes, må du legge til bokser i stallen din. Hver
                          boks representerer en stallplass som hesteeiere kan leie.
                        </p>
                        <div className="text-blue-600 text-sm">
                          <p className="mb-2">
                            <strong>Slik gjør du det:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Gå til &quot;Mine staller&quot; fanen</li>
                            <li>Klikk på &quot;Legg til boks&quot; knappen</li>
                            <li>Fyll ut navn, pris og detaljer for boksen</li>
                            <li>Gjenta for alle boxes du vil tilby</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Stables Tab */}
          {activeTab === "stables" && (
            <div
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              data-cy="stables"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Mine staller
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Administrer dine staller og tilby stallplasser til hesteeiere
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleAddStable}
                  variant="primary"
                  disabled={stablesInitialLoading}
                  data-cy="add-stable-button"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ny stall
                </Button>
              </div>

              {/* Stable Management */}
              {stablesInitialLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Laster staller...</p>
                </div>
              ) : stablesError ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BuildingOfficeIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Feil ved lasting av staller
                  </h3>
                  <p className="text-slate-600 mb-4">{stablesError?.message || "Ukjent feil"}</p>
                </div>
              ) : stables.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BuildingOfficeIcon className="h-6 w-6 text-slate-400" />
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
              ) : (
                <div className="space-y-6" data-cy="stables-list">
                  <div className="text-sm text-slate-600 mb-4">
                    {stables.length} stall{stables.length !== 1 ? "er" : ""}
                  </div>
                  {stables.map((stable: StableWithBoxStats) => (
                    <StableManagementCard
                      key={stable.id}
                      stable={stable}
                      onDelete={handleDeleteStable}
                      deleteLoading={deleteStableMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
              data-cy="services"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <CogIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Mine tjenester
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Administrer dine tjenesteannonser som veterinær, hovslagare eller trener
                    </p>
                  </div>
                </div>
                <Link href="/tjenester/ny">
                  <Button variant="primary">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ny tjeneste
                  </Button>
                </Link>
              </div>

              {servicesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Laster tjenester...</p>
                </div>
              ) : userServices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CogIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Ingen tjenester ennå</h3>
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
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-600 mb-4">
                    {userServices.length} tjeneste{userServices.length !== 1 ? "r" : ""}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service: ServiceWithDetails) => (
                      <ServiceManagementCard
                        key={service.id}
                        service={service}
                        onDelete={handleDeleteService}
                        onToggleStatus={toggleServiceStatus}
                        deletingServiceId={deletingServiceId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6" data-cy="analytics">
              {(stables.length > 0 || userServices.length > 0) && user ? (
                <ViewAnalytics ownerId={user.id} />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        Analyse
                      </h2>
                      <p className="text-slate-600 text-sm">
                        Visninger og statistikk for dine staller og tjenester
                      </p>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600">
                      Du trenger å ha registrert staller eller tjenester for å se analyse
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!stableToDelete}
        onClose={() => setStableToDelete(null)}
        onConfirm={confirmDeleteStable}
        title="Slett stall"
        message={`Er du sikker på at du vil slette stallen "${stableToDelete?.name}"? Denne handlingen kan ikke angres og vil også slette alle tilhørende bokser.`}
        confirmText="Slett stall"
        loading={deleteStableMutation.isPending}
      />
    </div>
  );
}
