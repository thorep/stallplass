'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon,
  HomeIcon,
  XMarkIcon,
  CogIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useDeleteStable } from '@/hooks/useStableMutations';
import { StableWithBoxStats } from '@/types/stable';
import StableManagementCard from './StableManagementCard';
import { useAuth } from '@/lib/supabase-auth-context';
import { useAllRentals } from '@/hooks/useRentalQueries';
import { formatPrice, groupBy } from '@/utils';
import { useStableOwnerDashboard } from '@/hooks/useStableOwnerRealTime';
import ViewAnalytics from '@/components/molecules/ViewAnalytics';
import { ServiceWithDetails } from '@/services/marketplace-service-client';

interface StallClientProps {
  stables: StableWithBoxStats[];
}

type TabType = 'overview' | 'stables' | 'rentals' | 'services' | 'analytics';

export default function StallClient({ stables: initialStables }: StallClientProps) {
  const [stables, setStables] = useState(initialStables);
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userServices, setUserServices] = useState<ServiceWithDetails[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getIdToken } = useAuth();
  const deleteStableMutation = useDeleteStable();
  
  // Use TanStack Query for rental data (for showing rented out boxes)
  const rentals = useAllRentals(user?.id);
  
  // Real-time dashboard data
  const {
    rentalStats
  } = useStableOwnerDashboard();
  
  
  // Process stable rentals data into grouped format using utility
  const groupedStableRentals = rentals.data ? 
    groupBy(rentals.data, (rental) => rental.stable.id) : {};

  const handleAddStable = () => {
    router.push('/ny-stall');
  };

  const handleDeleteStable = async (stableId: string) => {
    if (confirm('Er du sikker på at du vil slette denne stallen?')) {
      try {
        await deleteStableMutation.mutateAsync(stableId);
        setStables(stables.filter(s => s.id !== stableId));
        router.refresh();
      } catch (error) {
        console.error('Error deleting stable:', error);
        alert('Kunne ikke slette stallen. Prøv igjen.');
      }
    }
  };

  const totalAvailable = stables.reduce((sum, stable) => sum + (stable.availableBoxes || 0), 0);
  const totalSpaces = stables.reduce((sum, stable) => sum + (stable.totalBoxes || 0), 0);

  // Get real-time box count from all stables
  const [realTimeBoxCount, setRealTimeBoxCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchRealTimeBoxCount = async () => {
      try {
        let totalBoxes = 0;
        for (const stable of stables) {
          const response = await fetch(`/api/stables/${stable.id}/boxes`);
          if (response.ok) {
            const boxes = await response.json();
            totalBoxes += boxes.length;
          }
        }
        setRealTimeBoxCount(totalBoxes);
      } catch (error) {
        console.error('Error fetching real-time box count:', error);
        setRealTimeBoxCount(totalSpaces);
      }
    };

    if (stables.length > 0) {
      fetchRealTimeBoxCount();
    }
  }, [stables, totalSpaces]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['overview', 'stables', 'rentals', 'services', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch user services when services tab is active
  useEffect(() => {
    if (activeTab === 'services' && user) {
      fetchUserServices();
    }
  }, [activeTab, user]);

  // Load disclaimer preference from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('stallplass-legal-disclaimer-dismissed');
    if (dismissed === 'true') {
      setShowLegalDisclaimer(false);
    }
  }, []);

  // Handle disclaimer dismiss
  const handleDismissDisclaimer = () => {
    setShowLegalDisclaimer(false);
    localStorage.setItem('stallplass-legal-disclaimer-dismissed', 'true');
  };

  const fetchUserServices = async () => {
    if (!user) return;
    
    try {
      setServicesLoading(true);
      const token = await getIdToken();
      const response = await fetch(`/api/services?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const services = await response.json();
        setUserServices(services);
      }
    } catch (error) {
      console.error('Failed to fetch user services:', error);
    } finally {
      setServicesLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne tjenesten?')) {
      return;
    }

    try {
      setDeletingServiceId(serviceId);
      const token = await getIdToken();
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setUserServices(prev => prev.filter(s => s.id !== serviceId));
      }
    } catch (error) {
      alert('Kunne ikke slette tjenesten');
    } finally {
      setDeletingServiceId(null);
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (response.ok) {
        setUserServices(prev => prev.map(s => 
          s.id === serviceId ? { ...s, is_active: !isActive } : s
        ));
      }
    } catch (error) {
      alert('Kunne ikke oppdatere tjenesten');
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview' as TabType, name: 'Oversikt', icon: ChartBarIcon },
    { id: 'stables' as TabType, name: 'Mine staller', icon: BuildingOfficeIcon },
    { id: 'rentals' as TabType, name: 'Leieforhold', icon: HomeIcon },
    { id: 'services' as TabType, name: 'Tjenester', icon: CogIcon },
    { id: 'analytics' as TabType, name: 'Analyse', icon: ChartBarIcon }
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
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-3 sm:py-4 px-4 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap min-w-0 flex-1 sm:flex-initial ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Empty state when user has no stables */}
              {stables.length === 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="mx-auto h-24 w-24 bg-gradient-to-br from-indigo-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <BuildingOfficeIcon className="h-12 w-12 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                      Velkommen til Stallplass Dashboard
                    </h2>
                    <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                      Dette er ditt kontrollsenter for å administrere staller, bokser og leieforhold. 
                      For å komme i gang, opprett din første stall og begynn å tilby stallplasser til hesteeiere.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200/50">
                        <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-4">
                          <PlusIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-900 mb-2">1. Opprett stall</h3>
                        <p className="text-emerald-700 text-sm">
                          Registrer din stall med navn, lokasjon og fasiliteter
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50">
                        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                          <HomeIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">2. Legg til bokser</h3>
                        <p className="text-blue-700 text-sm">
                          Opprett individuelle stallbokser med pris og detaljer
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/50">
                        <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                          <SparklesIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">3. Administrer</h3>
                        <p className="text-purple-700 text-sm">
                          Følg opp leieforhold, meldinger og statistikk
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddStable} 
                      variant="primary"
                      size="lg"
                      className="mb-4"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Opprett din første stall
                    </Button>
                    
                    <p className="text-sm text-slate-500">
                      Du kan også administrere tjenester og se analyse når du har registrert staller
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Stats Cards - Only show if user has a stable */}
              {stables.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-medium">Ledige plasser</p>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-900">{totalAvailable}</p>
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
                        <p className="text-2xl sm:text-3xl font-bold text-amber-900">{totalSpaces}</p>
                      </div>
                      <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Aktive leieforhold</p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-900">{rentalStats.activeRentals}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <BuildingOfficeIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">Månedsomsetning</p>
                        <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                          {formatPrice(rentalStats.monthlyRevenue)}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Help text for users with stables but no boxes */}
          {stables.length > 0 && realTimeBoxCount === 0 && (
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
                    For å begynne å tilby boxes, må du legge til bokser i stallen din. 
                    Hver boks representerer en stallplass som hesteeiere kan leie.
                  </p>
                  <div className="text-blue-600 text-sm">
                    <p className="mb-2"><strong>Slik gjør du det:</strong></p>
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
          {activeTab === 'stables' && (
            <div className="space-y-8">
              {/* Add Stable Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button 
                  onClick={handleAddStable} 
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {stables.length === 0 ? 'Opprett din første stall' : 'Legg til ny stall'}
                </Button>
              </div>


              {/* Stable Management */}
              {stables.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                    <BuildingOfficeIcon className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Ingen staller registrert ennå
                  </h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Registrer dine staller for å tilby bokser til hesteeiere.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {stables.map((stable) => (
                    <div key={stable.id} className="space-y-6">
                      <StableManagementCard 
                        stable={stable}
                        onDelete={handleDeleteStable}
                        deleteLoading={deleteStableMutation.isPending}
                      />
                      
                      {/* Rented Out Boxes for this Stable */}
                      {groupedStableRentals[stable.id] && groupedStableRentals[stable.id].length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4 ml-4">
                          <h4 className="font-semibold text-slate-900 mb-3">
                            Utleide bokser ({groupedStableRentals[stable.id].length})
                          </h4>
                          <div className="space-y-3">
                            {groupedStableRentals[stable.id].map((rental) => (
                              <div key={rental.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-slate-900">{rental.box.name}</h5>
                                    <p className="text-sm text-slate-600">
                                      Leier: {rental.rider?.name || rental.rider?.email}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      Fra: {new Date(rental.start_date).toLocaleDateString('nb-NO')}
                                    </p>
                                  </div>
                                  <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
                                    <div className="text-lg font-semibold text-green-600">
                                      {formatPrice(rental.monthly_price)}
                                    </div>
                                    <div className="text-sm text-slate-600">per måned</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <HomeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Mine leieforhold
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Stallbokser som jeg leier
                  </p>
                </div>
              </div>

              {/* Important Legal Disclaimer */}
              {showLegalDisclaimer && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-amber-800">
                          Viktig informasjon om leieforhold
                        </h3>
                        <button
                          onClick={handleDismissDisclaimer}
                          className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-amber-100 transition-colors"
                          title="Lukk melding"
                        >
                          <XMarkIcon className="h-4 w-4 text-amber-600" />
                        </button>
                      </div>
                      <div className="text-sm text-amber-700 space-y-1">
                        <p>
                          <strong>Leieforholdene som vises her er kun for administrasjon og oppfølging på plattformen.</strong>
                        </p>
                        <p>
                          Dette er <strong>ikke juridiske leiekontrakter</strong> med stallen. Reelle leievilkår, betalingsordninger 
                          og juridiske forhold må avtales direkte mellom deg og stallieren utenfor denne plattformen.
                        </p>
                        <p className="mt-2 font-medium">
                          Plattformen brukes kun til å:
                        </p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li>Vise oversikt over dine bokser</li>
                          <li>Følge opp kommunikasjon med stallieren</li>
                          <li>Holde styr på kontaktinformasjon og detaljer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {rentals.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-slate-600">Laster leieforhold...</p>
                </div>
              ) : !rentals.data || rentals.data.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HomeIcon className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4">Du har ingen aktive leieforhold</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/staller')}
                  >
                    Finn stallplass
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rentals.data?.map((rental) => (
                    <div key={rental.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{rental.box.name}</h3>
                          <p className="text-sm text-slate-600">{rental.stable.name}</p>
                          <p className="text-sm text-slate-500">{rental.stable.location}</p>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4 text-right">
                          <div className="text-lg font-semibold text-primary">
                            {formatPrice(rental.monthly_price)}
                          </div>
                          <div className="text-sm text-slate-600">per måned</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {rental.box.size ? `${rental.box.size} m²` : 'Ikke oppgitt'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {rental.box.is_indoor ? 'Innendørs' : 'Utendørs'}
                        </span>
                        {rental.box.has_window && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vindu</span>
                        )}
                        {rental.box.has_electricity && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Strøm</span>
                        )}
                        {rental.box.has_water && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vann</span>
                        )}
                      </div>
                      
                      <div className="mt-4 text-sm text-slate-500">
                        Leieforhold startet: {new Date(rental.start_date).toLocaleDateString('nb-NO')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-600 mb-4">
                    {userServices.length} tjeneste{userServices.length !== 1 ? 'r' : ''}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service) => (
                      <div key={service.id} className={`rounded-lg border bg-white shadow-sm transition-opacity ${
                        !service.is_active ? 'opacity-60' : ''
                      }`}>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
                              {service.title}
                            </h3>
                            {!service.is_active && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                Inaktiv
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                            {service.description}
                          </p>

                          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                            <span>
                              {service.areas?.length || 0} område{(service.areas?.length || 0) !== 1 ? 'r' : ''}
                            </span>
                            <span>
                              Utløper: {new Date(service.expires_at).toLocaleDateString('no-NO')}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link href={`/tjenester/${service.id}`} className="flex-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                              >
                                Se detaljer
                              </Button>
                            </Link>
                            
                            <Link href={`/tjenester/${service.id}/rediger`}>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleServiceStatus(service.id, service.is_active || false)}
                              className={service.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            >
                              {service.is_active ? 'Deaktiver' : 'Aktiver'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              disabled={deletingServiceId === service.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingServiceId === service.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
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
                    <p className="text-slate-600">Du trenger å ha registrert staller eller tjenester for å se analyse</p>
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