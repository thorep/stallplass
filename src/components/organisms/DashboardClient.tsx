'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  SparklesIcon,
  HomeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useDeleteStable } from '@/hooks/useStableMutations';
import { StableWithBoxStats } from '@/types/stable';
import StableManagementCard from './StableManagementCard';
import { useAuth } from '@/lib/auth-context';
import { useAllRentals } from '@/hooks/useRentalQueries';
import { formatPrice, groupBy } from '@/utils';
import { useStableFeatures } from '@/stores';

interface DashboardClientProps {
  stables: StableWithBoxStats[];
}

/**
 * Dashboard client component for stable owners and renters
 * 
 * Features:
 * - Displays stable management interface for stable owners
 * - Shows rental information for both renters and stable owners
 * - Toggleable stable features for users who are only renters
 * - Real-time box counting and rental data
 * - Responsive design with mobile-first approach
 * 
 * @param stables - Initial stable data with box statistics
 */
export default function DashboardClient({ stables: initialStables }: DashboardClientProps) {
  const [stables, setStables] = useState(initialStables);
  const router = useRouter();
  const { user } = useAuth();
  const deleteStableMutation = useDeleteStable();
  
  // Use TanStack Query for rental data
  const { myRentals, stableRentals, isLoading: rentalsLoading } = useAllRentals(user?.uid);
  
  // UI state from Zustand store
  const { showStableFeatures, setShowStableFeatures } = useStableFeatures();
  
  // Process stable rentals data into grouped format using utility
  const groupedStableRentals = stableRentals.data ? 
    groupBy(stableRentals.data, (rental) => rental.stable.id) : {};

  /**
   * Navigates to the new stable creation page
   */
  const handleAddStable = () => {
    router.push('/ny-stall');
  };


  /**
   * Handles stable deletion with confirmation
   * @param stableId - ID of the stable to delete
   */
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

  // formatPrice utility is now imported from utils
  
  // Zustand store automatically persists showStableFeatures preference

  // Get real-time box count from all stables
  const [realTimeBoxCount, setRealTimeBoxCount] = useState<number | null>(null);
  
  /**
   * Fetches real-time box count across all user's stables
   * Used to provide accurate guidance to users with no boxes
   */
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
        setRealTimeBoxCount(totalSpaces); // Fallback to cached value
      }
    };

    if (stables.length > 0) {
      fetchRealTimeBoxCount();
    }
  }, [stables, totalSpaces]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mine staller
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Administrer dine staller og stallplasser
              </p>
            </div>
          </div>

          {/* Quick Stats Cards - Only show if user has a stable */}
          {stables.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
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
                      <li>Klikk på &quot;Administrer bokser&quot; knappen</li>
                      <li>Klikk på &quot;Legg til boks&quot; for å legge til en ny stallplass</li>
                      <li>Fyll ut navn, pris og detaljer for boksen</li>
                      <li>Gjenta for alle stallplasser du vil tilby</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Stable Button - Only show if no stables exist and stable features are shown */}
        {stables.length === 0 && showStableFeatures && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button 
                onClick={handleAddStable} 
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Opprett din første stall
              </Button>
              
              <Button 
                onClick={() => setShowStableFeatures(false)}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Nei, jeg er ikke stalleier
              </Button>
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
                Du kan registrere én stall for å komme i gang med å tilby stallplasser til hesteeiere.
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

        {/* My Rentals Section - Boxes I'm renting */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Mine leieforhold
              </h2>
              <p className="text-slate-600 text-sm">
                Stallbokser du leier
              </p>
            </div>
          </div>
          
          {rentalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600">Laster leieforhold...</p>
            </div>
          ) : !myRentals.data || myRentals.data.length === 0 ? (
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
              {myRentals.data?.map((rental) => (
                <div key={rental.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{rental.box.name}</h3>
                      <p className="text-sm text-slate-600">{rental.stable.name}</p>
                      <p className="text-sm text-slate-500">{rental.stable.location}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 text-right">
                      <div className="text-lg font-semibold text-primary">
                        {formatPrice(rental.monthlyPrice)}
                      </div>
                      <div className="text-sm text-slate-600">per måned</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {rental.box.size ? `${rental.box.size} m²` : 'Ikke oppgitt'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {rental.box.isIndoor ? 'Innendørs' : 'Utendørs'}
                    </span>
                    {rental.box.hasWindow && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vindu</span>
                    )}
                    {rental.box.hasElectricity && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Strøm</span>
                    )}
                    {rental.box.hasWater && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vann</span>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-500">
                    Leieforhold startet: {new Date(rental.startDate).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}