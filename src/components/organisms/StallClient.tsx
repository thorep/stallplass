'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useDeleteStable } from '@/hooks/useStableMutations';
import { StableWithBoxStats } from '@/types/stable';
import StableManagementCard from './StableManagementCard';
import { useAuth } from '@/lib/supabase-auth-context';
import { useAllRentals } from '@/hooks/useRentalQueries';
import { formatPrice, groupBy } from '@/utils';
import { useStableFeatures } from '@/stores';
import { useStableOwnerDashboard } from '@/hooks/useStableOwnerRealTime';

interface StallClientProps {
  stables: StableWithBoxStats[];
}

export default function StallClient({ stables: initialStables }: StallClientProps) {
  const [stables, setStables] = useState(initialStables);
  const router = useRouter();
  const { user } = useAuth();
  const deleteStableMutation = useDeleteStable();
  
  // Use TanStack Query for rental data (for showing rented out boxes)
  const { stableRentals } = useAllRentals(user?.uid);
  
  // Real-time dashboard data
  const {
    rentals: realTimeRentals,
    rentalStats,
    newRequests,
    hasNewRequests,
    actions: { acknowledgeNewRequests }
  } = useStableOwnerDashboard();
  
  // UI state from Zustand store
  const { showStableFeatures, setShowStableFeatures } = useStableFeatures();
  
  // Process stable rentals data into grouped format using utility
  const groupedStableRentals = stableRentals.data ? 
    groupBy(stableRentals.data, (rental) => rental.stable.id) : {};

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Staller
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Administrer dine staller og stallbokser
              </p>
            </div>
          </div>

          {/* New Rental Requests Alert */}
          {hasNewRequests && newRequests.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="text-green-900 font-semibold">
                      {newRequests.length} nye leieforespørsler!
                    </h3>
                    <p className="text-green-700 text-sm mt-1">
                      {newRequests.slice(0, 2).map((req: typeof newRequests[0]) => 
                        `${req.rider.name || req.rider.email} ønsker å leie ${req.box.name}`
                      ).join(', ')}
                      {newRequests.length > 2 && ` og ${newRequests.length - 2} flere...`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={acknowledgeNewRequests}
                  className="text-green-700 hover:text-green-800 font-medium text-sm"
                >
                  Lukk
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats Cards - Only show if user has a stable */}
          {stables.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
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
                    For å begynne å tilby stallplasser, må du legge til bokser i stallen din. 
                    Hver boks representerer en stallplass som hesteeiere kan leie.
                  </p>
                  <div className="text-blue-600 text-sm">
                    <p className="mb-2"><strong>Slik gjør du det:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Gå til din stall nedenfor</li>
                      <li>Klikk på &quot;Legg til boks&quot; knappen</li>
                      <li>Fyll ut navn, pris og detaljer for boksen</li>
                      <li>Gjenta for alle stallplasser du vil tilby</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Stable Button - Show for all users with stable features enabled */}
        {showStableFeatures && (
          <div className="mb-8">
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
              
              {stables.length === 0 && (
                <Button 
                  onClick={() => setShowStableFeatures(false)}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Nei, jeg er ikke stalleier
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Show stable features toggle when hidden */}
        {!showStableFeatures && (
          <div className="mb-8">
            <Button 
              onClick={() => setShowStableFeatures(true)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Vis stalleierfunksjoner
            </Button>
          </div>
        )}

        {/* Stable Management */}
        {showStableFeatures && (
          stables.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-24 w-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <BuildingOfficeIcon className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Ingen staller registrert ennå
              </h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Registrer dine staller for å tilby stallplasser til hesteeiere.
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
                                  Fra: {new Date(rental.startDate).toLocaleDateString('nb-NO')}
                                </p>
                              </div>
                              <div className="mt-2 sm:mt-0 sm:ml-4 text-right">
                                <div className="text-lg font-semibold text-green-600">
                                  {formatPrice(rental.monthlyPrice)}
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
          )
        )}
      </div>
    </div>
  );
}