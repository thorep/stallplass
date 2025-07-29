'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { formatPrice } from '@/utils/formatting';
import { Box } from '@/types/stable';

interface BulkAdvertisingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBoxes: Box[];
  stableName: string;
}

export default function BulkAdvertisingModal({
  isOpen,
  onClose,
  selectedBoxes,
  stableName
}: BulkAdvertisingModalProps) {
  const [months, setMonths] = useState(1);
  const [pricing, setPricing] = useState<{
    baseMonthlyPrice: number;
    totalMonthlyPrice: number;
    monthDiscount: number;
    monthDiscountPercentage: number;
    boxQuantityDiscount: number;
    boxQuantityDiscountPercentage: number;
    totalPrice: number;
    finalPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pricing/calculate?boxes=${selectedBoxes.length}&months=${months}`);
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedBoxes.length, months]);

  useEffect(() => {
    if (isOpen && selectedBoxes.length > 0) {
      fetchPricing();
    }
  }, [isOpen, selectedBoxes.length, months, fetchPricing]);

  const handlePurchase = () => {
    if (!pricing) return;

    // Create description for invoice
    const boxNames = selectedBoxes.map(box => box.name).join(', ');
    const description = `Annonsering for ${selectedBoxes.length} boks${selectedBoxes.length !== 1 ? 'er' : ''} i ${stableName}: ${boxNames}`;

    // Navigate to invoice page with all parameters
    const params = new URLSearchParams({
      itemType: 'BOX_ADVERTISING',
      amount: Math.round(pricing.finalPrice).toString(),
      discount: Math.round(pricing.monthDiscount + pricing.boxQuantityDiscount).toString(),
      description,
      months: months.toString(),
      // Store multiple box IDs as comma-separated string
      boxId: selectedBoxes.map(box => box.id).join(',')
    });

    window.location.href = `/dashboard/bestill?${params.toString()}`;
  };

  const monthOptions = [
    { value: 1, label: '1 måned' },
    { value: 3, label: '3 måneder' },
    { value: 6, label: '6 måneder' },
    { value: 12, label: '12 måneder' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold text-slate-900">
              Kjøp annonsering for flere bokser
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Selected boxes */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 mb-3">
                Valgte bokser ({selectedBoxes.length} stk)
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedBoxes.map(box => (
                  <div key={box.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{box.name}</span>
                    <span className="text-slate-500">{formatPrice(box.price)}/mnd</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Month selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Annonseringsperiode
              </label>
              <div className="grid grid-cols-4 gap-3">
                {monthOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setMonths(option.value)}
                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      months === option.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing breakdown */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : pricing ? (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Prisberegning</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Grunnpris ({formatPrice(pricing.baseMonthlyPrice)} × {selectedBoxes.length} bokser × {months} mnd)
                    </span>
                    <span className="text-slate-900">{formatPrice(pricing.totalPrice)}</span>
                  </div>

                  {pricing.monthDiscountPercentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Perioderabatt ({pricing.monthDiscountPercentage * 100}%)</span>
                      <span>-{formatPrice(pricing.monthDiscount)}</span>
                    </div>
                  )}

                  {pricing.boxQuantityDiscountPercentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Mengderabatt ({pricing.boxQuantityDiscountPercentage}%)</span>
                      <span>-{formatPrice(pricing.boxQuantityDiscount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-slate-900">Totalpris</span>
                      <span className="text-indigo-600">{formatPrice(pricing.finalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Per boks per måned</span>
                      <span>{formatPrice(pricing.finalPrice / selectedBoxes.length / months)}</span>
                    </div>
                  </div>
                </div>

                {(pricing.monthDiscountPercentage > 0 || pricing.boxQuantityDiscountPercentage > 0) && (
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    Du sparer {formatPrice(pricing.monthDiscount + pricing.boxQuantityDiscount)} med rabatter!
                  </div>
                )}
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                variant="primary"
                onClick={handlePurchase}
                disabled={!pricing || loading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <SpeakerWaveIcon className="h-4 w-4" />
                Gå til betaling
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}