'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import Header from '@/components/organisms/Header';
import Footer from '@/components/organisms/Footer';

interface SyncResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
}

export default function DevSyncPage() {
  const { user } = useAuth();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleUserSync = async () => {
    if (!user) return;
    
    setSyncLoading(true);
    setSyncResult(null);
    
    try {
      const requestData = {
        userId: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User'
      };
      
      console.log('Sending user sync request:', requestData);
      
      const response = await fetch('/api/dev-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        setSyncResult({
          success: true,
          message: 'Bruker synkronisert til database! Du kan nå gå til admin panelet.',
          user: data
        });
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        setSyncResult({
          success: false,
          message: `HTTP ${response.status}: ${errorData.error || errorText}`
        });
      }
    } catch (error) {
      console.error('User sync error:', error);
      setSyncResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSyncLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h1 className="text-xl font-medium text-slate-900 mb-4">Utvikler Synkronisering</h1>
            <p className="text-slate-600 mb-4">
              Du må være logget inn for å synkronisere brukeren din til databasen.
            </p>
            <a 
              href="/logg-inn" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Logg inn
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-medium text-slate-900 mb-4">Utvikler Synkronisering</h1>
          
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-2">
              <strong>Logget inn som:</strong> {user.email}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              <strong>Bruker ID:</strong> {user.id}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              Hvis du ikke kan få tilgang til admin panelet etter database reset, 
              klikk knappen nedenfor for å synkronisere brukeren din til databasen.
            </p>
          </div>

          <button
            onClick={handleUserSync}
            disabled={syncLoading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span>{syncLoading ? 'Synkroniserer...' : 'Synkroniser bruker til database'}</span>
          </button>
          
          {syncResult && (
            <div className={`p-4 rounded-lg border ${
              syncResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium mb-2">
                {syncResult.success ? 'Synkronisering fullført!' : 'Feil'}
              </p>
              <p className="text-sm">{syncResult.message}</p>
              
              {syncResult.success && (
                <div className="mt-4">
                  <a 
                    href="/admin" 
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Gå til admin panel
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              <strong>Utvikler notis:</strong> Denne siden er kun tilgjengelig i utviklingsmodus 
              og skal brukes når databasen har blitt resatt og din bruker ikke finnes i users tabellen.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}