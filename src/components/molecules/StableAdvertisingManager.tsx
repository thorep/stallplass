'use client';

import { useState } from 'react';
import { SpeakerWaveIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import PaymentModal from '@/components/organisms/PaymentModal';
import { StableWithBoxStats } from '@/types/stable';
import { useBasePrice } from '@/hooks/useQueries';
import { calculatePricingWithDiscounts } from '@/services/pricing-service';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface StableAdvertisingManagerProps {
  stable: StableWithBoxStats;
  totalBoxes: number;
  onRefetchBoxes: () => void;
}

export default function StableAdvertisingManager({ 
  stable, 
  totalBoxes, 
  onRefetchBoxes 
}: StableAdvertisingManagerProps) {
  const queryClient = useQueryClient();
  const [showAdvertisingModal, setShowAdvertisingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWarningMessage, setShowWarningMessage] = useState(true);
  const [paymentPeriod, setPaymentPeriod] = useState(1);
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    finalPrice: number;
    monthSavings: number;
    boxQuantityDiscount: number;
    boxQuantityDiscountPercentage: number;
    monthDiscountPercentage: number;
  } | null>(null);
  
  const { data: basePriceData } = useBasePrice();

  // Calculate pricing with discounts
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricing = await calculatePricingWithDiscounts(totalBoxes, paymentPeriod);
        setPricingBreakdown({
          finalPrice: pricing.finalPrice,
          monthSavings: pricing.monthDiscount,
          boxQuantityDiscount: pricing.boxQuantityDiscount,
          boxQuantityDiscountPercentage: pricing.boxQuantityDiscountPercentage,
          monthDiscountPercentage: pricing.monthDiscountPercentage
        });
      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Fallback to legacy calculation
        setPricingBreakdown(null);
      }
    };
    
    if (totalBoxes > 0) {
      loadPricing();
    }
  }, [totalBoxes, paymentPeriod]);

  const handleStartAdvertising = () => {
    setShowAdvertisingModal(true);
  };

  const handleProceedToPayment = () => {
    setShowAdvertisingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    
    // Invalidate queries to refresh stable and box data
    await queryClient.invalidateQueries({ queryKey: ['stables'] });
    await queryClient.invalidateQueries({ queryKey: ['stables', 'user'] });
    await queryClient.invalidateQueries({ queryKey: ['boxes', stable.id] });
    
    // Refetch boxes immediately to show updated status
    await onRefetchBoxes();
    
    alert('Betaling fullført! Stallen din er nå annonsert og synlig for potensielle leietakere.');
  };

  const calculatePaymentCost = () => {
    // Use new pricing breakdown if available
    if (pricingBreakdown) {
      return Math.round(pricingBreakdown.finalPrice);
    }
    
    // Fallback to legacy calculation
    const basePrice = basePriceData?.price || 10;
    const discounts = { 1: 0, 3: 0.05, 6: 0.12, 12: 0.15 };
    const totalMonthlyPrice = totalBoxes * basePrice;
    const totalPrice = totalMonthlyPrice * paymentPeriod;
    const discount = discounts[paymentPeriod as keyof typeof discounts] || 0;
    return Math.round(totalPrice * (1 - discount));
  };

  return (
    <>
      {/* Action Button */}
      {totalBoxes > 0 && !stable.advertising_active && (
        <div className="px-6 py-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStartAdvertising}
            className="flex items-center justify-center w-full sm:w-auto"
          >
            <SpeakerWaveIcon className="h-4 w-4 mr-2" />
            Start annonsering
          </Button>
        </div>
      )}

      {/* No Active Advertisements Warning */}
      {totalBoxes > 0 && !stable.advertising_active && showWarningMessage && (
        <div className="mx-6 mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800">
                Stallen din er ikke annonsert
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                Kunder vil ikke se din stall i søkeresultatene. Start annonsering for å bli synlig.
              </p>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleStartAdvertising}
                  className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 text-xs px-3 py-1"
                >
                  <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                  Start annonsering
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowWarningMessage(false)}
                className="text-yellow-400 hover:text-yellow-600 transition-colors"
                aria-label="Lukk melding"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advertising Modal */}
      {showAdvertisingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Start markedsføring</h2>
              <p className="text-gray-600 mt-2">
                Du betaler {basePriceData?.price || 10} kr per boks per måned for alle {totalBoxes} bokser i stallen din. 
                {totalBoxes >= 2 && <span className="text-blue-600 font-medium"> Du får volumrabatt for flere bokser!</span>}
                <br />Hele stallen din vil være synlig og annonsert for potensielle leietakere.
              </p>
            </div>
            
            <div className="p-6">
              {/* Period Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Velg markedsføringsperiode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { months: 1, label: '1 måned', discount: '0%' },
                    { months: 3, label: '3 måneder', discount: '5%' },
                    { months: 6, label: '6 måneder', discount: '12%' },
                    { months: 12, label: '12 måneder', discount: '15%' }
                  ].map((period) => (
                    <button
                      key={period.months}
                      onClick={() => setPaymentPeriod(period.months)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        paymentPeriod === period.months
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div>{period.label}</div>
                      {period.discount !== '0%' && (
                        <div className="text-emerald-600 text-xs font-semibold">
                          -{period.discount} rabatt
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              {pricingBreakdown && (pricingBreakdown.boxQuantityDiscountPercentage > 0 || pricingBreakdown.monthDiscountPercentage > 0) && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Pristilbud:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Grunnpris ({totalBoxes} bokser):</span>
                      <span className="font-medium text-blue-900">{Math.round(totalBoxes * (basePriceData?.price || 10) * paymentPeriod)} kr</span>
                    </div>
                    {pricingBreakdown.monthDiscountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Tidsrabatt ({pricingBreakdown.monthDiscountPercentage}%):</span>
                        <span>-{Math.round(pricingBreakdown.monthSavings)} kr</span>
                      </div>
                    )}
                    {pricingBreakdown.boxQuantityDiscountPercentage > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Volum rabatt ({pricingBreakdown.boxQuantityDiscountPercentage}%):</span>
                        <span>-{Math.round(pricingBreakdown.boxQuantityDiscount)} kr</span>
                      </div>
                    )}
                    <div className="border-t border-blue-200 pt-2">
                      <div className="flex justify-between font-semibold text-blue-900">
                        <span>Totalkostnad:</span>
                        <span>{calculatePaymentCost()} kr</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Viktig å vite:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Du betaler for alle {totalBoxes} bokser i stallen din</li>
                  <li>• Du kan selv velge hvilke bokser som skal være synlige i søkeresultatene</li>
                  <li>• Bokser kan enkelt fjernes fra søk eller legges tilbake når du ønsker</li>
                  <li>• Hele stallen din vil være synlig og annonsert for potensielle leietakere</li>
                  <li>• Markedsføringen gjelder for hele stallen</li>
                  {totalBoxes >= 2 && (
                    <li>• <strong>Du får volumrabatt</strong> pga. {totalBoxes} bokser - spar penger!</li>
                  )}
                  <li>• <strong>Kostnaden er {calculatePaymentCost()} kr for {paymentPeriod} måned{paymentPeriod !== 1 ? 'er' : ''}</strong></li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAdvertisingModal(false)}>
                Avbryt
              </Button>
              <Button 
                variant="primary" 
                onClick={handleProceedToPayment}
              >
                Fortsett til betaling ({calculatePaymentCost()} kr)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        totalBoxes={totalBoxes}
        selectedPeriod={paymentPeriod}
        totalCost={calculatePaymentCost()}
        stableId={stable.id}
      />
    </>
  );
}