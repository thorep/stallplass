'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { useSponsoredPlacementInfo, usePurchaseSponsoredPlacement } from '@/hooks/useQueries';

interface SponsoredPlacementModalProps {
  boxId: string;
  boxName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SponsoredPlacementModal({ boxId, boxName, isOpen, onClose }: SponsoredPlacementModalProps) {
  const [days, setDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const { data: sponsoredInfo, isLoading: infoLoading } = useSponsoredPlacementInfo(boxId, isOpen);
  const purchaseMutation = usePurchaseSponsoredPlacement();
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDays(1);
      setError(null);
    }
  }, [isOpen]);
  
  // Daily price - fallback to 2 kr
  const dailyPrice = 2; // We could fetch this from the pricing service if needed
  const totalCost = days * dailyPrice;
  
  const handlePurchase = async () => {
    try {
      setError(null);
      await purchaseMutation.mutateAsync({ boxId, days });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kunne ikke kjøpe betalt plassering');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Boost til topp i søk
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {infoLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Laster informasjon...</p>
            </div>
          ) : (
            <>
              
              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Antall dager
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                      disabled={purchaseMutation.isPending}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={sponsoredInfo?.maxDaysAvailable || 999}
                      value={days}
                      onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
                      disabled={purchaseMutation.isPending}
                    />
                    <button
                      onClick={() => setDays(Math.min(sponsoredInfo?.maxDaysAvailable || 999, days + 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                      disabled={purchaseMutation.isPending}
                    >
                      +
                    </button>
                  </div>
                  {sponsoredInfo && (
                    <p className="text-sm text-gray-500 mt-2">
                      Maksimalt {sponsoredInfo.maxDaysAvailable} dager tilgjengelig
                    </p>
                  )}
                </div>
                
                {/* Cost summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pris per dag:</span>
                      <span className="font-medium">{dailyPrice} kr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Antall dager:</span>
                      <span className="font-medium">{days}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-base">
                      <span className="font-medium">Total kostnad:</span>
                      <span className="font-bold text-purple-600">{totalCost} kr</span>
                    </div>
                  </div>
                </div>
                
                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-800 text-sm">
                    <strong>Viktig:</strong> Boost kan kun kjøpes for bokser som allerede har aktiv annonsering. 
                    Boksen din vil vises øverst i søkeresultatene med boost-merke.
                  </div>
                </div>

                {/* Development/Test Mode Notice */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-amber-800 text-sm">
                      <strong>🧪 Test-modus:</strong> Dette er en test-kjøp som ikke krever ekte betaling. 
                      Boost-funksjonen blir aktivert umiddelbart for testing.
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 text-sm">
                      <strong>Feil:</strong> {error}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={purchaseMutation.isPending}
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePurchase}
                  disabled={purchaseMutation.isPending || !sponsoredInfo?.maxDaysAvailable || days > sponsoredInfo.maxDaysAvailable}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {purchaseMutation.isPending 
                    ? 'Kjøper...' 
                    : process.env.NODE_ENV === 'development' 
                      ? `🧪 Test-kjøp (${totalCost} kr)` 
                      : `Kjøp for ${totalCost} kr`
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}