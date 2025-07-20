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
import { useAuth } from '@/lib/auth-context';

interface AmenitiesAdminProps {
  initialStableAmenities: StableAmenity[];
  initialBoxAmenities: BoxAmenity[];
}

export function AmenitiesAdmin({ initialStableAmenities, initialBoxAmenities }: AmenitiesAdminProps) {
  const { user } = useAuth();
  const [stableAmenities, setStableAmenities] = useState(initialStableAmenities);
  const [boxAmenities, setBoxAmenities] = useState(initialBoxAmenities);
  const [isLoading, setIsLoading] = useState(false);
  const [editingStableAmenity, setEditingStableAmenity] = useState<StableAmenity | null>(null);
  const [editingBoxAmenity, setEditingBoxAmenity] = useState<BoxAmenity | null>(null);
  const [newStableAmenity, setNewStableAmenity] = useState('');
  const [newBoxAmenity, setNewBoxAmenity] = useState('');

  // Stable Amenities Functions
  const handleCreateStableAmenity = async () => {
    if (!newStableAmenity.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/amenities/stable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newStableAmenity.trim() }),
      });

      if (response.ok) {
        const newAmenity = await response.json();
        setStableAmenities([...stableAmenities, newAmenity]);
        setNewStableAmenity('');
      } else {
        console.error('Failed to create stable amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error creating stable amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStableAmenity = async (id: string, name: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/amenities/stable', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, name }),
      });

      if (response.ok) {
        const updatedAmenity = await response.json();
        setStableAmenities(stableAmenities.map(amenity => 
          amenity.id === id ? updatedAmenity : amenity
        ));
        setEditingStableAmenity(null);
      } else {
        console.error('Failed to update stable amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error updating stable amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStableAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?') || !user) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/amenities/stable?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStableAmenities(stableAmenities.filter(amenity => amenity.id !== id));
      } else {
        console.error('Failed to delete stable amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting stable amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Box Amenities Functions
  const handleCreateBoxAmenity = async () => {
    if (!newBoxAmenity.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/amenities/box', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBoxAmenity.trim() }),
      });

      if (response.ok) {
        const newAmenity = await response.json();
        setBoxAmenities([...boxAmenities, newAmenity]);
        setNewBoxAmenity('');
      } else {
        console.error('Failed to create box amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error creating box amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBoxAmenity = async (id: string, name: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/amenities/box', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, name }),
      });

      if (response.ok) {
        const updatedAmenity = await response.json();
        setBoxAmenities(boxAmenities.map(amenity => 
          amenity.id === id ? updatedAmenity : amenity
        ));
        setEditingBoxAmenity(null);
      } else {
        console.error('Failed to update box amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error updating box amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBoxAmenity = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne fasiliteten?') || !user) return;
    
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/amenities/box?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBoxAmenities(boxAmenities.filter(amenity => amenity.id !== id));
      } else {
        console.error('Failed to delete box amenity:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting box amenity:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            onKeyPress={(e) => e.key === 'Enter' && handleCreateStableAmenity()}
          />
          <button
            onClick={handleCreateStableAmenity}
            disabled={isLoading || !newStableAmenity.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Legg til
          </button>
        </div>
        
        {/* Stable amenities list */}
        <div className="grid gap-2">
          {stableAmenities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Ingen stallfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            stableAmenities.map((amenity) => (
            <div key={amenity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              {editingStableAmenity?.id === amenity.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    defaultValue={amenity.name}
                    className="flex-1 px-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyPress={(e) => {
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
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteStableAmenity(amenity.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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
            onKeyPress={(e) => e.key === 'Enter' && handleCreateBoxAmenity()}
          />
          <button
            onClick={handleCreateBoxAmenity}
            disabled={isLoading || !newBoxAmenity.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Legg til
          </button>
        </div>
        
        {/* Box amenities list */}
        <div className="grid gap-2">
          {boxAmenities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Ingen boksfasiliteter funnet. Legg til den første!</p>
            </div>
          ) : (
            boxAmenities.map((amenity) => (
            <div key={amenity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
              {editingBoxAmenity?.id === amenity.id ? (
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    defaultValue={amenity.name}
                    className="flex-1 px-3 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyPress={(e) => {
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
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBoxAmenity(amenity.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
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