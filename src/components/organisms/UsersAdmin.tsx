'use client';

import { useState } from 'react';
import { useUpdateUserAdmin } from '@/hooks/useAdminQueries';
import { formatDate } from '@/utils/formatting';
import { ShieldCheckIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import { Tables } from '@/types/supabase';

// Extend Supabase User type with admin-specific computed data
type AdminUser = Tables<'users'> & {
  _count: {
    stables: number;
    rentals: number;
  };
}

interface UsersAdminProps {
  initialUsers: AdminUser[];
}

export function UsersAdmin({ initialUsers }: UsersAdminProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const updateUserAdmin = useUpdateUserAdmin();

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firebase_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserAdmin.mutateAsync({
        id: userId,
        isAdmin: !currentStatus
      });
      
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        )
      );
    } catch (error) {
      console.error('Failed to update user admin status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Brukere</h2>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Søk etter navn, e-post eller Firebase ID..."
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
                    Bruker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Statistikk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Registrert
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {user.name || 'Ingen navn'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.firebase_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-slate-900">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-slate-500">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <ShieldCheckIcon className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        )}
                        {user._count.stables > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <HomeModernIcon className="w-3 h-3 mr-1" />
                            Stall eier
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>
                        <div>{user._count.stables} stables</div>
                        <div>{user._count.rentals} leieforhold</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(user.created_at || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                        disabled={updateUserAdmin.isPending}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          user.is_admin
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        } disabled:opacity-50`}
                      >
                        {updateUserAdmin.isPending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Oppdaterer...
                          </span>
                        ) : (
                          user.is_admin ? 'Fjern admin' : 'Gjør til admin'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Ingen users funnet
          </div>
        )}
      </div>
    </div>
  );
}