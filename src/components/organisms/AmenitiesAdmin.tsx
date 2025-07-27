'use client';

import { useState } from 'react';
import { StableAmenity, BoxAmenity } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { 
  useAdminStableAmenities, 
  useAdminBoxAmenities,
  useCreateStableAmenity,
  useUpdateStableAmenity,
  useDeleteStableAmenity,
  useCreateBoxAmenity,
  useUpdateBoxAmenity,
  useDeleteBoxAmenity,
  useIsAdmin
} from '@/hooks/useAdminQueries';

export function AmenitiesAdmin() {
  const { data: isAdmin, isLoading: adminLoading, error: adminError } = useIsAdmin();
  const { data: stableAmenities = [], isLoading: stableLoading, error: stableError } = useAdminStableAmenities();
  const { data: boxAmenities = [], isLoading: boxLoading, error: boxError } = useAdminBoxAmenities();
  
  // Debug logging
  console.log('Amenities Debug:', {
    isAdmin,
    adminLoading,
    adminError,
    stableAmenities,
    stableLoading,
    stableError,
    boxAmenities,
    boxLoading,
    boxError
  });
  
  // Mutations
  const createStableAmenity = useCreateStableAmenity();
  const updateStableAmenity = useUpdateStableAmenity();
  const deleteStableAmenity = useDeleteStableAmenity();
  const createBoxAmenity = useCreateBoxAmenity();
  const updateBoxAmenity = useUpdateBoxAmenity();
  const deleteBoxAmenity = useDeleteBoxAmenity();
  
  // Local state
  const [editingStableAmenity, setEditingStableAmenity] = useState<StableAmenity | null>(null);
  const [editingBoxAmenity, setEditingBoxAmenity] = useState<BoxAmenity | null>(null);
  const [newStableAmenity, setNewStableAmenity] = useState('');
  const [newBoxAmenity, setNewBoxAmenity] = useState('');

  const isLoading = stableLoading || boxLoading;

  // Stable Amenities Functions
  const handleCreateStableAmenity = async () => {
    if (!newStableAmenity.trim()) return;
    
    try {
      await createStableAmenity.mutateAsync(newStableAmenity.trim());
      setNewStableAmenity('');
    } catch (error) {
      console.error('Error creating stable amenity:', error);
    }
  };

  const handleUpdateStableAmenity = async (id: string, name: string) => {
    try {
      await updateStableAmenity.mutateAsync({ id, name });
      setEditingStableAmenity(null);
    } catch (error) {
      console.error('Error updating stable amenity:', error);
    }
  };

  const handleDeleteStableAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?')) return;
    
    try {
      await deleteStableAmenity.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting stable amenity:', error);
    }
  };

  // Box Amenities Functions
  const handleCreateBoxAmenity = async () => {
    if (!newBoxAmenity.trim()) return;
    
    try {
      await createBoxAmenity.mutateAsync(newBoxAmenity.trim());
      setNewBoxAmenity('');
    } catch (error) {
      console.error('Error creating box amenity:', error);
    }
  };

  const handleUpdateBoxAmenity = async (id: string, name: string) => {
    try {
      await updateBoxAmenity.mutateAsync({ id, name });
      setEditingBoxAmenity(null);
    } catch (error) {
      console.error('Error updating box amenity:', error);
    }
  };

  const handleDeleteBoxAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?')) return;
    
    try {
      await deleteBoxAmenity.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting box amenity:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Laster fasiliteter...</div>
      </div>
    );
  }

  if (stableError || boxError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Feil ved lasting av fasiliteter</h3>
        {stableError && <p className="text-red-600 text-sm mt-1">Stall: {stableError.message}</p>}
        {boxError && <p className="text-red-600 text-sm mt-1">Boks: {boxError.message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stable Amenities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-slate-800">
              Stall fasiliteter ({stableAmenities.length})
            </h2>
          </div>
        </div>
        
        {/* Add new stable amenity */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newStableAmenity}
            onChange={(e) => setNewStableAmenity(e.target.value)}
            placeholder="Ny stall fasilitet..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateStableAmenity()}
          />
          <button
            onClick={handleCreateStableAmenity}
            disabled={createStableAmenity.isPending || !newStableAmenity.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {createStableAmenity.isPending ? 'Legger til...' : 'Legg til'}
          </button>
        </div>
        
        {/* Stable amenities list */}
        <div className="grid gap-2">
          {stableAmenities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Ingen stallfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            stableAmenities.map((amenity: StableAmenity) => (
            <div key={amenity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              {editingStableAmenity?.id === amenity.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    defaultValue={amenity.name}
                    className="flex-1 px-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateStableAmenity(amenity.id, e.currentTarget.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== amenity.name) {
                        handleUpdateStableAmenity(amenity.id, e.target.value);
                      } else {
                        setEditingStableAmenity(null);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <span className="text-slate-800 font-medium">{amenity.name}</span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingStableAmenity(amenity)}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                  disabled={updateStableAmenity.isPending}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteStableAmenity(amenity.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  disabled={deleteStableAmenity.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Box Amenities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-800">
              Boks fasiliteter ({boxAmenities.length})
            </h2>
          </div>
        </div>
        
        {/* Add new box amenity */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newBoxAmenity}
            onChange={(e) => setNewBoxAmenity(e.target.value)}
            placeholder="Ny boks fasilitet..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateBoxAmenity()}
          />
          <button
            onClick={handleCreateBoxAmenity}
            disabled={createBoxAmenity.isPending || !newBoxAmenity.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            {createBoxAmenity.isPending ? 'Legger til...' : 'Legg til'}
          </button>
        </div>
        
        {/* Box amenities list */}
        <div className="grid gap-2">
          {boxAmenities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Ingen boksfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            boxAmenities.map((amenity: BoxAmenity) => (
            <div key={amenity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              {editingBoxAmenity?.id === amenity.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    defaultValue={amenity.name}
                    className="flex-1 px-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateBoxAmenity(amenity.id, e.currentTarget.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== amenity.name) {
                        handleUpdateBoxAmenity(amenity.id, e.target.value);
                      } else {
                        setEditingBoxAmenity(null);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <span className="text-slate-800 font-medium">{amenity.name}</span>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingBoxAmenity(amenity)}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                  disabled={updateBoxAmenity.isPending}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBoxAmenity(amenity.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  disabled={deleteBoxAmenity.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}