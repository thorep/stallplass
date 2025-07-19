'use client';

import { useState } from 'react';
import { useUpdateBoxAdmin, useDeleteBoxAdmin } from '@/hooks/useAdminQueries';
import { formatPrice } from '@/utils/formatting';
import { CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Box {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  size: number | null;
  isIndoor: boolean;
  hasWindow: boolean;
  createdAt: string;
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
  initialBoxes: Box[];
}

export function BoxesAdmin({ initialBoxes }: BoxesAdminProps) {
  const [boxes, setBoxes] = useState(initialBoxes);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const updateBoxAdmin = useUpdateBoxAdmin();
  const deleteBoxAdmin = useDeleteBoxAdmin();

  const filteredBoxes = boxes.filter(box =>
    box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.stable.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = async (boxId: string, currentStatus: boolean) => {
    try {
      await updateBoxAdmin.mutateAsync({
        id: boxId,
        isActive: !currentStatus
      });
      
      setBoxes(prevBoxes =>
        prevBoxes.map(box =>
          box.id === boxId ? { ...box, isActive: !currentStatus } : box
        )
      );
    } catch (error) {
      console.error('Failed to update box active status:', error);
    }
  };

  const handleToggleAvailable = async (boxId: string, currentStatus: boolean) => {
    try {
      await updateBoxAdmin.mutateAsync({
        id: boxId,
        isAvailable: !currentStatus
      });
      
      setBoxes(prevBoxes =>
        prevBoxes.map(box =>
          box.id === boxId ? { ...box, isAvailable: !currentStatus } : box
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
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Bokser</h2>
        
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
                    Status
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
                      {formatPrice(box.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          box.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {box.isActive ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Aktiv
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Inaktiv
                            </>
                          )}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          box.isAvailable ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {box.isAvailable ? 'Ledig' : 'Opptatt'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="text-xs space-y-1">
                        {box.size && <div>{box.size} m²</div>}
                        <div>{box.isIndoor ? 'Innendørs' : 'Utendørs'}</div>
                        {box.hasWindow && <div>Vindu</div>}
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
                          onClick={() => handleToggleActive(box.id, box.isActive)}
                          disabled={updateBoxAdmin.isPending}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            box.isActive
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50`}
                        >
                          {box.isActive ? 'Deaktiver' : 'Aktiver'}
                        </button>
                        <button
                          onClick={() => handleToggleAvailable(box.id, box.isAvailable)}
                          disabled={updateBoxAdmin.isPending}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            box.isAvailable
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          } disabled:opacity-50`}
                        >
                          {box.isAvailable ? 'Merk opptatt' : 'Merk ledig'}
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