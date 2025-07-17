'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useDeleteStable } from '@/hooks/useStableMutations';
import { StableWithBoxStats } from '@/types/stable';
import StableManagementCard from './StableManagementCard';

interface DashboardClientProps {
  stables: StableWithBoxStats[];
}

export default function DashboardClient({ stables: initialStables }: DashboardClientProps) {
  const [stables, setStables] = useState(initialStables);
  const router = useRouter();
  const deleteStableMutation = useDeleteStable();

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

  const totalStables = stables.length;
  const totalAvailable = stables.reduce((sum, stable) => sum + stable.availableBoxes, 0);
  const totalSpaces = stables.reduce((sum, stable) => sum + stable.totalBoxes, 0);

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
        </div>

        {/* Add Stable Button - Only show if no stables exist */}
        {stables.length === 0 && (
          <div className="mb-8">
            <Button 
              onClick={handleAddStable} 
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Opprett din første stall
            </Button>
          </div>
        )}

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
              Du kan registrere én stall for å komme i gang med å tilby stallplasser til hesteeiere.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {stables.map((stable) => (
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
    </div>
  );
}