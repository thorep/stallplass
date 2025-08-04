'use client';

import { useState } from 'react';
import { StableAmenity, BoxAmenity } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AmenitiesAdmin() {
  useIsAdmin();
  const { data: stableAmenities = [], isLoading: stableLoading, error: stableError } = useAdminStableAmenities();
  const { data: boxAmenities = [], isLoading: boxLoading, error: boxError } = useAdminBoxAmenities();
  
  // Debug logging removed
  
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
  const [editingStableValue, setEditingStableValue] = useState('');
  const [editingBoxValue, setEditingBoxValue] = useState('');
  const [newStableAmenity, setNewStableAmenity] = useState('');
  const [newBoxAmenity, setNewBoxAmenity] = useState('');

  const isLoading = stableLoading || boxLoading;

  // Helper functions for editing workflow  
  const startEditingStableAmenity = (amenity: StableAmenity) => {
    setEditingStableAmenity(amenity);
    setEditingStableValue(amenity.name);
  };

  const startEditingBoxAmenity = (amenity: BoxAmenity) => {
    setEditingBoxAmenity(amenity);
    setEditingBoxValue(amenity.name);
  };

  const cancelStableEdit = () => {
    setEditingStableAmenity(null);
    setEditingStableValue('');
  };

  const cancelBoxEdit = () => {
    setEditingBoxAmenity(null);
    setEditingBoxValue('');
  };

  const saveStableEdit = async () => {
    if (!editingStableAmenity || !editingStableValue.trim()) return;
    await handleUpdateStableAmenity(editingStableAmenity.id, editingStableValue.trim());
  };

  const saveBoxEdit = async () => {
    if (!editingBoxAmenity || !editingBoxValue.trim()) return;
    await handleUpdateBoxAmenity(editingBoxAmenity.id, editingBoxValue.trim());
  };

  // Stable Amenities Functions
  const handleCreateStableAmenity = async () => {
    if (!newStableAmenity.trim()) return;
    
    try {
      await createStableAmenity.mutateAsync(newStableAmenity.trim());
      setNewStableAmenity('');
    } catch {
    }
  };

  const handleUpdateStableAmenity = async (id: string, name: string) => {
    try {
      await updateStableAmenity.mutateAsync({ id, name });
      setEditingStableAmenity(null);
      setEditingStableValue('');
    } catch {
    }
  };

  const handleDeleteStableAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?')) return;
    
    try {
      await deleteStableAmenity.mutateAsync(id);
    } catch {
    }
  };

  // Box Amenities Functions
  const handleCreateBoxAmenity = async () => {
    if (!newBoxAmenity.trim()) return;
    
    try {
      await createBoxAmenity.mutateAsync(newBoxAmenity.trim());
      setNewBoxAmenity('');
    } catch {
    }
  };

  const handleUpdateBoxAmenity = async (id: string, name: string) => {
    try {
      await updateBoxAmenity.mutateAsync({ id, name });
      setEditingBoxAmenity(null);
      setEditingBoxValue('');
    } catch {
    }
  };

  const handleDeleteBoxAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?')) return;
    
    try {
      await deleteBoxAmenity.mutateAsync(id);
    } catch {
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
    <div className="space-y-8 p-4">
      {/* Stable Amenities */}
      <div>
        <div className="flex items-center mb-6">
          <BuildingOfficeIcon className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-h2 sm:text-h2-sm text-slate-800">
            Stall fasiliteter ({stableAmenities.length})
          </h2>
        </div>
        
        {/* Add new stable amenity */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="text"
            value={newStableAmenity}
            onChange={(e) => setNewStableAmenity(e.target.value)}
            placeholder="Ny stall fasilitet..."
            className="h-12 text-body"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateStableAmenity()}
          />
          <Button
            onClick={handleCreateStableAmenity}
            disabled={createStableAmenity.isPending || !newStableAmenity.trim()}
            className="h-12 min-w-[140px] bg-green-600 hover:bg-green-700 text-button"
            size="lg"
          >
            <PlusIcon className="h-4 w-4" />
            {createStableAmenity.isPending ? 'Legger til...' : 'Legg til'}
          </Button>
        </div>
        
        {/* Stable amenities list */}
        <div className="space-y-3">
          {stableAmenities.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-body">Ingen stallfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            stableAmenities.map((amenity: StableAmenity) => (
            <div key={amenity.id} className="bg-slate-50 rounded-lg p-4">
              {editingStableAmenity?.id === amenity.id ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={editingStableValue}
                    onChange={(e) => setEditingStableValue(e.target.value)}
                    className="h-12 text-body"
                    autoFocus
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={saveStableEdit}
                      disabled={updateStableAmenity.isPending || !editingStableValue.trim()}
                      className="h-11 min-h-[44px] bg-green-600 hover:bg-green-700 flex-1 sm:flex-none sm:min-w-[100px]"
                      size="sm"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {updateStableAmenity.isPending ? 'Lagrer...' : 'Lagre'}
                    </Button>
                    <Button
                      onClick={cancelStableEdit}
                      variant="outline"
                      className="h-11 min-h-[44px] flex-1 sm:flex-none sm:min-w-[100px]"
                      size="sm"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium text-slate-800">{amenity.name}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEditingStableAmenity(amenity)}
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-indigo-600 hover:bg-indigo-50"
                      disabled={updateStableAmenity.isPending}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteStableAmenity(amenity.id)}
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-red-600 hover:bg-red-50"
                      disabled={deleteStableAmenity.isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </div>

      {/* Box Amenities */}
      <div>
        <div className="flex items-center mb-6">
          <ArchiveBoxIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-h2 sm:text-h2-sm text-slate-800">
            Boks fasiliteter ({boxAmenities.length})
          </h2>
        </div>
        
        {/* Add new box amenity */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            type="text"
            value={newBoxAmenity}
            onChange={(e) => setNewBoxAmenity(e.target.value)}
            placeholder="Ny boks fasilitet..."
            className="h-12 text-body"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateBoxAmenity()}
          />
          <Button
            onClick={handleCreateBoxAmenity}
            disabled={createBoxAmenity.isPending || !newBoxAmenity.trim()}
            className="h-12 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-button"
            size="lg"
          >
            <PlusIcon className="h-4 w-4" />
            {createBoxAmenity.isPending ? 'Legger til...' : 'Legg til'}
          </Button>
        </div>
        
        {/* Box amenities list */}
        <div className="space-y-3">
          {boxAmenities.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-body">Ingen boksfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            boxAmenities.map((amenity: BoxAmenity) => (
            <div key={amenity.id} className="bg-slate-50 rounded-lg p-4">
              {editingBoxAmenity?.id === amenity.id ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    value={editingBoxValue}
                    onChange={(e) => setEditingBoxValue(e.target.value)}
                    className="h-12 text-body"
                    autoFocus
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={saveBoxEdit}
                      disabled={updateBoxAmenity.isPending || !editingBoxValue.trim()}
                      className="h-11 min-h-[44px] bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none sm:min-w-[100px]"
                      size="sm"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {updateBoxAmenity.isPending ? 'Lagrer...' : 'Lagre'}
                    </Button>
                    <Button
                      onClick={cancelBoxEdit}
                      variant="outline"
                      className="h-11 min-h-[44px] flex-1 sm:flex-none sm:min-w-[100px]"
                      size="sm"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium text-slate-800">{amenity.name}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEditingBoxAmenity(amenity)}
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-indigo-600 hover:bg-indigo-50"
                      disabled={updateBoxAmenity.isPending}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteBoxAmenity(amenity.id)}
                      variant="ghost"
                      size="sm"
                      className="h-11 w-11 min-h-[44px] min-w-[44px] p-0 text-red-600 hover:bg-red-50"
                      disabled={deleteBoxAmenity.isPending}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}