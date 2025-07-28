'use client';

import { useState } from 'react';
import { useUpdateBoxAdmin, useDeleteBoxAdmin } from '@/hooks/useAdminQueries';
import { formatPrice } from '@/utils/formatting';
import { TrashIcon } from '@heroicons/react/24/outline';
import { AdminBox } from '@/types/admin';

interface BoxesAdminProps {
  initialBoxes: AdminBox[];
}

export function BoxesAdmin({ initialBoxes }: BoxesAdminProps) {
  const [boxes, setBoxes] = useState(initialBoxes);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const updateBoxAdmin = useUpdateBoxAdmin();
  const deleteBoxAdmin = useDeleteBoxAdmin();

  // TODO: Implement real-time updates when needed
  // For now, the component will show the initial data and updates via mutations

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
          box.id === boxId ? { ...box, isAvailable: !currentStatus } : box
        )
      );
    } catch (error) {
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
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Bokser</h2>
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
                      {formatPrice(box.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        box.isAvailable ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {box.isAvailable ? 'Ledig' : 'Opptatt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="text-xs space-y-1">
                        {box.size && <div>{box.size} m²</div>}
                        <div>Stallplass</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>
                        <div>{box._count.conversations} conversations</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleAvailable(box.id, box.isAvailable || false)}
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