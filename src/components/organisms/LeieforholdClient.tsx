'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useAuth } from '@/lib/supabase-auth-context';
import { useAllRentals } from '@/hooks/useRentalQueries';
import { formatPrice } from '@/utils';

export default function LeieforholdClient() {
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  
  // Use TanStack Query for rental data
  const { myRentals, isLoading: rentalsLoading } = useAllRentals(user?.id);

  // Load disclaimer preference from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('stallplass-legal-disclaimer-dismissed');
    if (dismissed === 'true') {
      setShowLegalDisclaimer(false);
    }
  }, []);

  // Handle disclaimer dismiss
  const handleDismissDisclaimer = () => {
    setShowLegalDisclaimer(false);
    localStorage.setItem('stallplass-legal-disclaimer-dismissed', 'true');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Leieforhold
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Stallbokser du leier
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          
          {/* Important Legal Disclaimer */}
          {showLegalDisclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-amber-800">
                      Viktig informasjon om leieforhold
                    </h3>
                    <button
                      onClick={handleDismissDisclaimer}
                      className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-amber-100 transition-colors"
                      title="Lukk melding"
                    >
                      <XMarkIcon className="h-4 w-4 text-amber-600" />
                    </button>
                  </div>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p>
                      <strong>Leieforholdene som vises her er kun for administrasjon og oppfølging på plattformen.</strong>
                    </p>
                    <p>
                      Dette er <strong>ikke juridiske leiekontrakter</strong> med stallen. Reelle leievilkår, betalingsordninger 
                      og juridiske forhold må avtales direkte mellom deg og stallieren utenfor denne plattformen.
                    </p>
                    <p className="mt-2 font-medium">
                      Plattformen brukes kun til å:
                    </p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      <li>Vise oversikt over dine stallplasser</li>
                      <li>Følge opp kommunikasjon med stallieren</li>
                      <li>Holde styr på kontaktinformasjon og detaljer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Rental List */}
          {rentalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-600">Laster leieforhold...</p>
            </div>
          ) : !myRentals.data || myRentals.data.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 mb-4">Du har ingen aktive leieforhold</p>
              <Button
                variant="outline"
                onClick={() => router.push('/staller')}
              >
                Finn stallplass
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRentals.data?.map((rental) => (
                <div key={rental.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{rental.box.name}</h3>
                      <p className="text-sm text-slate-600">{rental.stable.name}</p>
                      <p className="text-sm text-slate-500">{rental.stable.location}</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 text-right">
                      <div className="text-lg font-semibold text-primary">
                        {formatPrice(rental.monthlyPrice)}
                      </div>
                      <div className="text-sm text-slate-600">per måned</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {rental.box.size ? `${rental.box.size} m²` : 'Ikke oppgitt'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {rental.box.isIndoor ? 'Innendørs' : 'Utendørs'}
                    </span>
                    {rental.box.hasWindow && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vindu</span>
                    )}
                    {rental.box.hasElectricity && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Strøm</span>
                    )}
                    {rental.box.hasWater && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Vann</span>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-500">
                    Leieforhold startet: {new Date(rental.startDate).toLocaleDateString('nb-NO')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}