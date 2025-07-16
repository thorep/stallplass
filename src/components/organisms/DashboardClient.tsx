'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useDeleteStable } from '@/hooks/useStableMutations';

interface StableData {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  availableSpaces: number;
  totalSpaces: number;
  amenities: string[];
  images: string[];
  owner: {
    name: string;
    phone: string;
    email: string;
  };
}

interface DashboardClientProps {
  stables: StableData[];
}

export default function DashboardClient({ stables: initialStables }: DashboardClientProps) {
  const [stables, setStables] = useState(initialStables);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();
  const deleteStableMutation = useDeleteStable();

  const handleAddStable = () => {
    setShowAddModal(true);
  };

  const handleDeleteStable = async (stableId: string) => {
    if (confirm('Er du sikker på at du vil slette denne stallen?')) {
      try {
        await deleteStableMutation.mutateAsync(stableId);
        // Optimistically update the UI
        setStables(stables.filter(s => s.id !== stableId));
        // Refresh the page to get updated data
        router.refresh();
      } catch (error) {
        console.error('Error deleting stable:', error);
        alert('Kunne ikke slette stallen. Prøv igjen.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
      {/* Mobile-first header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mine staller</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Administrer dine staller og stallplasser
        </p>
      </div>

      {/* Add Stable Button - Mobile full width */}
      <div className="mb-6">
        <Button onClick={handleAddStable} className="flex items-center w-full sm:w-auto justify-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Legg til ny stall
        </Button>
      </div>

      {/* Stables List - Mobile optimized */}
      {stables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Du har ingen staller registrert ennå
          </div>
          <Button onClick={handleAddStable} variant="primary" className="w-full sm:w-auto">
            Opprett din første stall
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stables.map((stable) => (
            <div key={stable.id} className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{stable.name}</h3>
                <div className="flex space-x-2 flex-shrink-0">
                  <button className="text-gray-500 hover:text-primary p-1 transition-colors">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteStable(stable.id)}
                    className="text-gray-500 hover:text-error p-1 transition-colors"
                    disabled={deleteStableMutation.isPending}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-3">{stable.location}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pris:</span>
                  <span className="font-medium text-leather">{stable.price.toLocaleString()} kr/måned</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ledige plasser:</span>
                  <span className="font-medium">{stable.availableSpaces}/{stable.totalSpaces}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    stable.availableSpaces > 0 
                      ? 'bg-success/10 text-success' 
                      : 'bg-error/10 text-error'
                  }`}>
                    {stable.availableSpaces > 0 ? 'Ledig' : 'Fullt'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics - Mobile stacked */}
      <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Totalt antall staller</h3>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{stables.length}</div>
        </div>
        
        <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Ledige plasser</h3>
          <div className="text-2xl sm:text-3xl font-bold text-success">
            {stables.reduce((sum, stable) => sum + stable.availableSpaces, 0)}
          </div>
        </div>
        
        <div className="bg-gray-0 rounded-lg shadow-sm border border-gray-300 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Totale plasser</h3>
          <div className="text-2xl sm:text-3xl font-bold text-leather">
            {stables.reduce((sum, stable) => sum + stable.totalSpaces, 0)}
          </div>
        </div>
      </div>

      {/* Add Stable Modal - Mobile optimized */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-0 rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Legg til ny stall</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Denne funksjonen kommer snart. Her vil du kunne legge til nye staller med all nødvendig informasjon.
            </p>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                className="w-full sm:w-auto"
              >
                Lukk
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}