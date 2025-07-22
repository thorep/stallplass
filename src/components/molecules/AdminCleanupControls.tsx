'use client';

import { useState } from 'react';
import { TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/supabase-auth-context';

interface CleanupResult {
  expiredStables: number;
  deactivatedBoxes: number;
  expiredSponsoredBoxes: number;
  timestamp: string;
}

interface UserSyncResult {
  success: boolean;
  message: string;
  user?: any;
}

export function AdminCleanupControls() {
  const { user, getIdToken } = useAuth();
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [userSyncLoading, setUserSyncLoading] = useState(false);
  const [userSyncResult, setUserSyncResult] = useState<UserSyncResult | null>(null);

  const handleManualCleanup = async () => {
    if (!user) return;
    
    setCleanupLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCleanupResult(data.results);
      } else {
        alert('Feil ved opprydding. Prøv igjen.');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Feil ved opprydding. Prøv igjen.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleUserSync = async () => {
    if (!user) return;
    
    setUserSyncLoading(true);
    try {
      const token = await getIdToken();
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserSyncResult({
          success: true,
          message: 'Bruker synkronisert til database',
          user: data.user
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setUserSyncResult({
          success: false,
          message: errorData.error || 'Feil ved synkronisering av bruker'
        });
      }
    } catch (error) {
      console.error('User sync error:', error);
      setUserSyncResult({
        success: false,
        message: 'Feil ved synkronisering av bruker'
      });
    } finally {
      setUserSyncLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Manuell opprydding</h3>
          <p className="text-sm text-slate-600">
            Fjern utløpt annonsering og betalt plassering manuelt
          </p>
        </div>
        <button
          onClick={handleManualCleanup}
          disabled={cleanupLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-4 w-4" />
          <span>{cleanupLoading ? 'Rydder opp...' : 'Kjør opprydding'}</span>
        </button>
      </div>
      
      {cleanupResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Opprydding fullført</h4>
          <div className="space-y-1 text-sm text-green-800">
            <div>• {cleanupResult.expiredStables} stables med utløpt annonsering deaktivert</div>
            <div>• {cleanupResult.deactivatedBoxes} bokser deaktivert</div>
            <div>• {cleanupResult.expiredSponsoredBoxes} utløpte betalte plasseringer fjernet</div>
            <div className="text-xs text-green-600 mt-2">
              Utført: {new Date(cleanupResult.timestamp).toLocaleString('nb-NO')}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Hva gjør oppryddingen:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Deaktiverer stables som har utløpt annonsering</li>
            <li>Deaktiverer bokser som tilhører stables med utløpt annonsering</li>
            <li>Fjerner betalt plassering som har utløpt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}