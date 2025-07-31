"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, SpeakerWaveIcon } from "@heroicons/react/24/outline";
import Button from "@/components/atoms/Button";
import { formatPrice } from "@/utils/formatting";
import { useGetPublicDiscounts } from "@/hooks/usePricing";

function ServiceAdvertisingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const serviceId = searchParams.get('service_id') || '';
  const serviceName = searchParams.get('service_name') || 'Din tjeneste';
  
  const [months, setMonths] = useState(1);

  // Fetch discounts using TanStack Query (public endpoint)
  const { data: discountsData } = useGetPublicDiscounts();
  
  // For now, use a fixed price for service ads
  const monthlyPrice = 490; // 490 kr per month
  const pricingData = { basePrice: monthlyPrice };
  const pricingLoading = false;

  // Redirect back if no service selected
  useEffect(() => {
    if (!serviceId) {
      router.replace('/dashboard?tab=services');
    }
  }, [serviceId, router]);

  const handlePurchase = () => {
    if (!pricingData || !serviceId) return;

    // Calculate pricing
    const totalPrice = pricingData.basePrice * months;

    // Create description for invoice
    const description = `Annonsering for tjeneste "${serviceName}" i ${months} ${months === 1 ? 'måned' : 'måneder'}`;

    // Navigate to invoice page
    const params = new URLSearchParams({
      itemType: 'SERVICE_AD',
      amount: Math.round(totalPrice).toString(),
      discount: '0', // Service ads don't have month-based discounts yet
      description: description.substring(0, 500),
      months: months.toString(),
      serviceId: serviceId
    });

    router.push(`/dashboard/bestill?${params.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  // Create month options
  const monthOptions = [
    { value: 1, label: '1 måned' },
    { value: 3, label: '3 måneder' },
    { value: 6, label: '6 måneder' },
    { value: 12, label: '12 måneder' }
  ].map(option => {
    const discount = discountsData?.find((d: { months: number; percentage: number }) => d.months === option.value);
    return {
      ...option,
      discount: discount?.percentage || 0
    };
  });

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ingen tjeneste valgt</p>
          <Button onClick={handleBack} className="mt-4">
            Tilbake
          </Button>
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
              Kjøp annonsering for tjeneste
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Form */}
          <div className="space-y-6">
            {/* Selected service */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Valgt tjeneste</h2>
              <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-4">
                <div>
                  <span className="font-medium text-gray-900">{serviceName}</span>
                  <p className="text-gray-500 text-xs">Tjenesteannonse</p>
                </div>
              </div>
            </div>

            {/* Period selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Annonseringsperiode</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {monthOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setMonths(option.value)}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                      months === option.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    data-cy={`duration-${option.value}-months`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{option.label}</span>
                      {option.discount > 0 && (
                        <span className={`text-xs mt-1 ${
                          months === option.value ? 'text-green-200' : 'text-green-600'
                        }`}>
                          -{option.discount}%
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Pricing */}
          <div className="lg:order-last">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Prisberegning</h2>
              
              {pricingLoading || !pricingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Beregner pris...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Grunnpris ({formatPrice(pricingData.basePrice)} × {months} mnd)
                      </span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(pricingData.basePrice * months)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between font-semibold text-lg">
                        <span className="text-gray-900">Totalpris</span>
                        <span className="text-indigo-600">
                          {formatPrice(pricingData.basePrice * months)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Per måned</span>
                        <span>{formatPrice(pricingData.basePrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button
                      onClick={handlePurchase}
                      disabled={!pricingData || pricingLoading}
                      className="w-full flex items-center justify-center gap-2"
                      size="lg"
                      data-cy="go-to-payment-button"
                    >
                      <SpeakerWaveIcon className="h-5 w-5" />
                      Gå til betaling
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={handleBack}
                      className="w-full"
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Viktig informasjon:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Annonsering aktiveres umiddelbart etter bestilling</li>
            <li>• Tjenesten din vil vises i søkeresultater for ditt område</li>
            <li>• Du vil motta faktura på e-post innen 1-2 virkedager</li>
            <li>• Betalingsfrist er 14 dager fra fakturadato</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ServiceAdvertisingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    }>
      <ServiceAdvertisingPageContent />
    </Suspense>
  );
}