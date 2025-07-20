'use client';

import { useState } from 'react';
import { useUpdateStableAdmin, useDeleteStableAdmin } from '@/hooks/useAdminQueries';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Tables } from '@/types/supabase';

// Extend Supabase Stable type with admin-specific computed data
type AdminStable = Tables<'stables'> & {
  rating: number;
  reviewCount: number;
  owner: {
    id: string;
    email: string;
    name: string | null;
  };
  _count: {
    boxes: number;
    conversations: number;
    rentals: number;
  };
}

interface StablesAdminProps {
  initialStables: AdminStable[];
}

export function StablesAdmin({ initialStables }: StablesAdminProps) {
  const [stables, setStables] = useState(initialStables);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const updateStableAdmin = useUpdateStableAdmin();
  const deleteStableAdmin = useDeleteStableAdmin();

  const filteredStables = stables.filter(stable =>
    stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleFeatured = async (stableId: string, currentStatus: boolean) => {
    try {
      await updateStableAdmin.mutateAsync({
        id: stableId,
        featured: !currentStatus
      });
      
      setStables(prevStables =>
        prevStables.map(stable =>
          stable.id === stableId ? { ...stable, featured: !currentStatus } : stable
        )
      );
    } catch (error) {
      console.error('Failed to update stable featured status:', error);
    }
  };

  const handleDelete = async (stableId: string) => {
    if (deleteConfirmId !== stableId) {
      setDeleteConfirmId(stableId);
      return;
    }

    try {
      await deleteStableAdmin.mutateAsync(stableId);
      setStables(prevStables => prevStables.filter(stable => stable.id !== stableId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete stable:', error);
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
                          {stable.city ? `${stable.city}, ${stable.location}` : stable.location}
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
                      {stable.featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <SparklesIcon className="w-3 h-3 mr-1" />
                          Fremhevet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>
                        <div>{stable._count.boxes} bokser</div>
                        <div>{stable._count.rentals} leieforhold</div>
                        <div>{stable._count.conversations} samtaler</div>
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
                          onClick={() => handleToggleFeatured(stable.id, stable.featured)}
                          disabled={updateStableAdmin.isPending}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            stable.featured
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          } disabled:opacity-50`}
                        >
                          {updateStableAdmin.isPending ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Oppdaterer...
                            </span>
                          ) : (
                            stable.featured ? 'Fjern fremheving' : 'Fremhev'
                          )}
                        </button>
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
            Ingen staller funnet
          </div>
        )}
      </div>
    </div>
  );
}