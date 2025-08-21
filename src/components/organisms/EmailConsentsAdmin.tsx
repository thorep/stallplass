'use client';

import { useState } from 'react';
import { useAdminEmailConsents } from '@/hooks/useAdminQueries';
import { formatDate } from '@/utils/formatting';
import { EnvelopeIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmailConsentData {
  id: string;
  email: string;
  nickname: string;
  firstname: string | null;
  lastname: string | null;
  createdAt: string;
}

export function EmailConsentsAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: emailData, isLoading, error } = useAdminEmailConsents();

  const filteredEmails = emailData?.emails?.filter((user: EmailConsentData) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastname?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/email-consents?format=csv', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `email-consents-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-slate-600">Laster e-postsamtykker...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <span className="text-red-700 text-sm font-medium">
              Kunne ikke laste e-postsamtykker: {error instanceof Error ? error.message : 'Ukjent feil'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">E-postsamtykker</h2>
          <p className="text-slate-600">
            Brukere som har samtykket til å motta markedsførings-e-post ({emailData?.totalCount || 0} totalt)
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#A0521D] transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Eksporter CSV
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Søk etter e-post eller navn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center">
            <EnvelopeIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchTerm ? 'Ingen resultater' : 'Ingen e-postsamtykker'}
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Prøv å endre søkekriteriene.' 
                : 'Ingen brukere har samtykket til markedsførings-e-post ennå.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">E-post</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Kallenavn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Navn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800">Registrert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmails.map((user: EmailConsentData) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-800">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{user.nickname}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {[user.firstname, user.lastname].filter(Boolean).join(' ') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredEmails.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Viser {filteredEmails.length} av {emailData?.totalCount || 0} e-postsamtykker
          </span>
        </div>
      )}
    </div>
  );
}
