'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { formatPrice } from '@/utils/formatting';
import { useSponsoredPlacementInfo, usePurchaseSponsoredPlacement } from '@/hooks/useBoxMutations';

function SingleBoostPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const boxId = searchParams.get('boxId') || '';
  const boxName = searchParams.get('boxName') || '';
  const stableName = searchParams.get('stableName') || '';
  
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const sponsoredInfoMutation = useSponsoredPlacementInfo(boxId);
  const purchaseMutation = usePurchaseSponsoredPlacement();

  // Redirect back if no box selected
  useEffect(() => {
    if (!boxId) {
      router.replace('/dashboard?tab=stables');
    }
  }, [boxId, router]);

  const handlePurchase = async () => {
    try {
      setError(null);
      await purchaseMutation.mutateAsync({ boxId, days });
      
      // Show success message and redirect back to dashboard
      alert('Boost aktivert! Boksen din vil nå vises øverst i søkeresultatene.');
      router.push('/dashboard?tab=stables');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kunne ikke kjøpe boost');
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Daily price - we should eventually fetch this from pricing service
  const dailyPrice = 2; // kr per day
  const totalCost = days * dailyPrice;
  const maxDaysAvailable = sponsoredInfoMutation.data?.maxDaysAvailable || 365;

  if (sponsoredInfoMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster boost-informasjon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Tilbake
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Boost boks til topp
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Form */}
          <div className="space-y-6">
            {/* Selected box */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Valgt boks</h2>
              <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-4">
                <div>
                  <span className="font-medium text-gray-900">{boxName}</span>
                  <p className="text-gray-500 text-xs">i {stableName}</p>
                </div>
                <div className="flex items-center text-purple-600">
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs font-medium">Boost aktiv</span>
                </div>
              </div>
            </div>

            {/* Duration selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Boost-periode</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antall dager
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                      disabled={purchaseMutation.isPending}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxDaysAvailable}
                      value={days}
                      onChange={(e) => setDays(Math.max(1, Math.min(maxDaysAvailable, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={purchaseMutation.isPending}
                    />
                    <button
                      onClick={() => setDays(Math.min(maxDaysAvailable, days + 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                      disabled={purchaseMutation.isPending}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Maksimalt {maxDaysAvailable} dager tilgjengelig
                  </p>
                </div>

                {/* Quick select buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 7, 14].map(option => (
                    <button
                      key={option}
                      onClick={() => setDays(Math.min(maxDaysAvailable, option))}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        days === option
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                      disabled={purchaseMutation.isPending || option > maxDaysAvailable}
                    >
                      {option} dag{option !== 1 ? 'er' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Pricing */}
          <div className="lg:order-last">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Prisberegning</h2>
              
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Pris per dag
                    </span>
                    <span className="text-gray-900 font-medium">{formatPrice(dailyPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Antall dager
                    </span>
                    <span className="text-gray-900 font-medium">{days}</span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Totalpris</span>
                      <span className="text-purple-600">{formatPrice(totalCost)}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ {error}
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending || !maxDaysAvailable || days > maxDaysAvailable}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                    size="lg"
                    data-cy="purchase-boost-button"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    {purchaseMutation.isPending 
                      ? 'Kjøper boost...' 
                      : process.env.NODE_ENV === 'development' 
                        ? `🧪 Test-kjøp (${formatPrice(totalCost)})` 
                        : `Kjøp boost for ${formatPrice(totalCost)}`
                    }
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={handleBack}
                    className="w-full"
                    disabled={purchaseMutation.isPending}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Hva er boost?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Boksen din vises øverst i alle søkeresultater</li>
            <li>• Boost-merke gjør boksen mer synlig for potensielle leietakere</li>
            <li>• Boost kan kun kjøpes for bokser som allerede har aktiv annonsering</li>
            <li>• Boost aktiveres umiddelbart etter kjøp</li>
            <li>• Du kan forlenge boost når som helst før utløp</li>
          </ul>
        </div>

        {/* Development/Test Mode Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-amber-50 rounded-lg p-6">
            <h3 className="font-medium text-amber-900 mb-2">🧪 Test-modus aktiv</h3>
            <p className="text-sm text-amber-800">
              Dette er en test-kjøp som ikke krever ekte betaling. 
              Boost-funksjonen blir aktivert umiddelbart for testing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SingleBoostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    }>
      <SingleBoostPageContent />
    </Suspense>
  );
}