'use client';

import { useState } from 'react';
import { useDeleteStableAdmin } from '@/hooks/useAdminQueries';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { AdminStable } from '@/types/admin';

interface StablesAdminProps {
  initialStables: AdminStable[];
}

export function StablesAdmin({ initialStables }: StablesAdminProps) {
  const [stables, setStables] = useState(initialStables);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const deleteStableAdmin = useDeleteStableAdmin();

  const filteredStables = stables.filter(stable =>
    stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.postalPlace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleDelete = async (stableId: string) => {
    if (deleteConfirmId !== stableId) {
      setDeleteConfirmId(stableId);
      return;
    }

    try {
      await deleteStableAdmin.mutateAsync(stableId);
      setStables(prevStables => prevStables.filter(stable => stable.id !== stableId));
      setDeleteConfirmId(null);
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Staller</h2>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Søk etter navn, sted eller eier..."
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
                    Stall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Eier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statistikk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vurdering
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredStables.map((stable) => (
                  <tr key={stable.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {stable.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stable.postalPlace ? `${stable.postalCode} ${stable.postalPlace}` : stable.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-slate-900">
                          {stable.owner.name || 'Ingen navn'}
                        </div>
                        <div className="text-xs text-slate-500">{stable.owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Featured status removed - stables cannot be featured */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>
                        <div>{stable._count.boxes} bokser</div>
                        <div>{stable._count.invoiceRequests} fakturaer</div>
                        <div>{stable._count.conversations} conversations</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StarIconSolid className="h-4 w-4 text-amber-400 mr-1" />
                        <span className="text-sm text-slate-900">{stable.rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-500 ml-1">({stable.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(stable.id)}
                          disabled={deleteStableAdmin.isPending}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {deleteConfirmId === stable.id ? 'Bekreft?' : 'Slett'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredStables.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Ingen stables funnet
          </div>
        )}
      </div>
    </div>
  );
}