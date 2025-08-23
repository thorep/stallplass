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
    box.stable.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleUpdateQuantity = async (boxId: string, change: number) => {
    const currentBox = boxes.find(box => box.id === boxId);
    if (!currentBox) return;
    
    const currentQuantity = ('availableQuantity' in currentBox ? (currentBox.availableQuantity as number) : 0) ?? 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    try {
      await updateBoxAdmin.mutateAsync({
        id: boxId,
        availableQuantity: newQuantity
      });
      
      setBoxes(prevBoxes =>
        prevBoxes.map(box =>
          box.id === boxId ? { ...box, availableQuantity: newQuantity } : box
        )
      );
    } catch {
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
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Stallplasser</h2>
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
                          {box.stable.owner.nickname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatPrice(box.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ('availableQuantity' in box && (box.availableQuantity as number) > 0) ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {('availableQuantity' in box && (box.availableQuantity as number) > 0) ? `${(box.availableQuantity as number)} ledig${(box.availableQuantity as number) === 1 ? '' : 'e'}` : 'Opptatt'}
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
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                          <button
                            onClick={() => handleUpdateQuantity(box.id, -1)}
                            disabled={updateBoxAdmin.isPending}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-700 transition-colors disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {('availableQuantity' in box ? (box.availableQuantity as number) : 0) ?? 0}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(box.id, +1)}
                            disabled={updateBoxAdmin.isPending}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
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
