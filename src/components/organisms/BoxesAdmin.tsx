'use client';

import { useState, useEffect } from 'react';
import { useUpdateBoxAdmin, useDeleteBoxAdmin } from '@/hooks/useAdminQueries';
import { formatPrice } from '@/utils/formatting';
import { TrashIcon } from '@heroicons/react/24/outline';
import { subscribeToAllBoxes, unsubscribeFromBoxChannel } from '@/services/box-service';
import { Tables } from '@/types/supabase';

// Extend Supabase Box type with admin-specific relations and computed data
type AdminBox = Tables<'boxes'> & {
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
  _count: {
    conversations: number;
    rentals: number;
  };
}

interface BoxesAdminProps {
  initialBoxes: AdminBox[];
}

export function BoxesAdmin({ initialBoxes }: BoxesAdminProps) {
  const [boxes, setBoxes] = useState(initialBoxes);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const updateBoxAdmin = useUpdateBoxAdmin();
  const deleteBoxAdmin = useDeleteBoxAdmin();

  // Set up real-time subscription for box updates
  useEffect(() => {
    const handleBoxChange = (updatedBox: {
      id: string;
      name: string;
      maanedlig_pris: number;
      er_tilgjengelig: boolean | null;
      size: number | null;
      er_innendors: boolean | null;
      har_vindu: boolean | null;
      _deleted?: boolean;
    }) => {
      if (updatedBox._deleted) {
        // Remove deleted box
        setBoxes(prev => prev.filter(box => box.id !== updatedBox.id));
        return;
      }

      // Update existing box or add new one
      setBoxes(prev => {
        const existingIndex = prev.findIndex(box => box.id === updatedBox.id);
        
        if (existingIndex >= 0) {
          // Update existing box
          const newBoxes = [...prev];
          newBoxes[existingIndex] = {
            ...newBoxes[existingIndex],
            name: updatedBox.name,
            maanedlig_pris: updatedBox.maanedlig_pris,
            er_tilgjengelig: updatedBox.er_tilgjengelig ?? false,
            size: updatedBox.size,
            er_innendors: updatedBox.er_innendors ?? false,
            har_vindu: updatedBox.har_vindu ?? false,
          };
          return newBoxes;
        } else {
          // This is a new box, we might not want to add it to admin view
          // unless it matches our current filters
          return prev;
        }
      });
    };

    const channel = subscribeToAllBoxes(handleBoxChange);

    return () => {
      unsubscribeFromBoxChannel(channel);
    };
  }, []);

  const filteredBoxes = boxes.filter(box =>
    box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.stable.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleToggleAvailable = async (boxId: string, currentStatus: boolean) => {
    try {
      await updateBoxAdmin.mutateAsync({
        id: boxId,
        isAvailable: !currentStatus
      });
      
      setBoxes(prevBoxes =>
        prevBoxes.map(box =>
          box.id === boxId ? { ...box, er_tilgjengelig: !currentStatus } : box
        )
      );
    } catch (error) {
      console.error('Failed to update box availability:', error);
    }
  };

  const handleDelete = async (boxId: string) => {
    if (deleteConfirmId !== boxId) {
      setDeleteConfirmId(boxId);
      return;
    }

    try {
      await deleteBoxAdmin.mutateAsync(boxId);
      setBoxes(prevBoxes => prevBoxes.filter(box => box.id !== boxId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Bokser</h2>
          <div className="flex items-center text-sm text-green-600">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Sanntidsoppdateringer aktive
          </div>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Søk etter boksnavn, stall eller eier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Boks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pris
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tilgjengelighet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Egenskaper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statistikk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredBoxes.map((box) => (
                  <tr key={box.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {box.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-slate-900">{box.stable.name}</div>
                        <div className="text-xs text-slate-500">
                          {box.stable.owner.name || box.stable.owner.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatPrice(box.maanedlig_pris)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        box.er_tilgjengelig ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {box.er_tilgjengelig ? 'Ledig' : 'Opptatt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="text-xs space-y-1">
                        {box.size && <div>{box.size} m²</div>}
                        <div>{box.er_innendors ? 'Innendørs' : 'Utendørs'}</div>
                        {box.har_vindu && <div>Vindu</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>
                        <div>{box._count.conversations} samtaler</div>
                        <div>{box._count.rentals} leieforhold</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleAvailable(box.id, box.er_tilgjengelig || false)}
                          disabled={updateBoxAdmin.isPending}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            box.er_tilgjengelig
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          } disabled:opacity-50`}
                        >
                          {box.er_tilgjengelig ? 'Merk opptatt' : 'Merk ledig'}
                        </button>
                        <button
                          onClick={() => handleDelete(box.id)}
                          disabled={deleteBoxAdmin.isPending}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {deleteConfirmId === box.id ? 'Bekreft?' : <TrashIcon className="h-3 w-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBoxes.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Ingen bokser funnet
          </div>
        )}
      </div>
    </div>
  );
}