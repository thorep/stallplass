'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Header from '@/components/organisms/Header';

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
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stables, setStables] = useState<StableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated') {
      router.push('/logg-inn');
      return;
    }

    if (session) {
      fetchStables();
    }
  }, [session, status, router]);

  const fetchStables = async () => {
    try {
      const response = await fetch('/api/stables/my-stables');
      if (response.ok) {
        const data = await response.json();
        setStables(data);
      } else {
        console.error('Failed to fetch stables');
      }
    } catch (error) {
      console.error('Error fetching stables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStable = () => {
    setShowAddModal(true);
  };

  const handleDeleteStable = async (stableId: string) => {
    if (confirm('Er du sikker på at du vil slette denne stallen?')) {
      try {
        const response = await fetch(`/api/stables/${stableId}`, { 
          method: 'DELETE' 
        });
        
        if (response.ok) {
          setStables(stables.filter(s => s.id !== stableId));
        } else {
          console.error('Failed to delete stable');
        }
      } catch (error) {
        console.error('Error deleting stable:', error);
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-600">Laster...</div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mine staller</h1>
          <p className="mt-2 text-gray-600">
            Administrer dine staller og stallplasser
          </p>
        </div>

        {/* Add Stable Button */}
        <div className="mb-8">
          <Button onClick={handleAddStable} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Legg til ny stall
          </Button>
        </div>

        {/* Stables List */}
        {stables.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              Du har ingen staller registrert ennå
            </div>
            <Button onClick={handleAddStable} variant="primary">
              Opprett din første stall
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stables.map((stable) => (
              <div key={stable.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stable.name}</h3>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-blue-600">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteStable(stable.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{stable.location}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris:</span>
                    <span className="font-medium">{stable.price.toLocaleString()} kr/måned</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ledige plasser:</span>
                    <span className="font-medium">{stable.availableSpaces}/{stable.totalSpaces}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      stable.availableSpaces > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stable.availableSpaces > 0 ? 'Ledig' : 'Fullt'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Totalt antall staller</h3>
            <div className="text-3xl font-bold text-blue-600">{stables.length}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ledige plasser</h3>
            <div className="text-3xl font-bold text-green-600">
              {stables.reduce((sum, stable) => sum + stable.availableSpaces, 0)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Totale plasser</h3>
            <div className="text-3xl font-bold text-gray-600">
              {stables.reduce((sum, stable) => sum + stable.totalSpaces, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Add Stable Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Legg til ny stall</h2>
            <p className="text-gray-600 mb-4">
              Denne funksjonen kommer snart. Her vil du kunne legge til nye staller med all nødvendig informasjon.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
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