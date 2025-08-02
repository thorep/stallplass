'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import { usePostInvoiceRequest } from '@/hooks/useInvoiceRequests';
import { useCalculatePricing } from '@/hooks/usePricing';
import { formatPrice } from '@/utils/formatting';
import { type InvoiceItemType } from '@/generated/prisma';
import PriceBreakdown from '@/components/molecules/PriceBreakdown';
import { toast } from 'sonner';

function BestillPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const itemType = searchParams.get('itemType') as InvoiceItemType;
  const amount = parseFloat(searchParams.get('amount') || '0');
  const discount = parseFloat(searchParams.get('discount') || '0');
  const description = searchParams.get('description') || '';
  const months = searchParams.get('months') ? parseInt(searchParams.get('months')!) : undefined;
  const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined;
  const slots = searchParams.get('slots') ? parseInt(searchParams.get('slots')!) : undefined;
  const stableId = searchParams.get('stableId') || undefined;
  const serviceId = searchParams.get('serviceId') || undefined;
  const boxId = searchParams.get('boxId') || undefined;

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: ''
  });

  const createInvoiceRequest = usePostInvoiceRequest();

  // Calculate pricing based on URL parameters for BOX_ADVERTISING
  // For bulk purchases, boxId contains comma-separated box IDs
  const boxCount = boxId ? boxId.split(',').length : 1;
  const { data: pricing, isLoading: pricingLoading } = useCalculatePricing(
    boxCount, // Correct number of boxes (1 for single, multiple for bulk)
    months || 1
  );

  // Redirect back if required parameters are missing
  useEffect(() => {
    if (!itemType || !amount || !description) {
      console.log('Missing required parameters:', { itemType, amount, description });
      // Use replace instead of back to avoid navigation issues
      router.replace('/dashboard?tab=stables');
    }
  }, [itemType, amount, description, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use updated pricing for BOX_ADVERTISING if available
    const finalAmount = itemType === 'BOX_ADVERTISING' && pricing ? 
      Math.round(pricing.finalPrice) : amount;
    const finalDiscount = itemType === 'BOX_ADVERTISING' && pricing ? 
      Math.round(pricing.monthDiscount + pricing.boxQuantityDiscount) : discount;

    try {
      await createInvoiceRequest.mutateAsync({
        ...formData,
        amount: finalAmount,
        discount: finalDiscount,
        description,
        itemType,
        months,
        days,
        slots,
        stableId,
        serviceId,
        boxId
      });

      // Show success message
      toast.success('Takk! Din bestilling er aktivert og du vil motta faktura på e-post.');
      router.push('/dashboard?tab=stables');
    } catch {
      // Error is handled by TanStack Query
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            <h1 className="text-2xl font-semibold text-gray-900">Bestill med faktura</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Bestillingsdetaljer</h2>
              <div className="space-y-3">
                <p className="text-gray-600">{description}</p>
                
                {itemType === 'BOX_ADVERTISING' && pricingLoading ? (
                  <div className="border-t pt-3 text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Beregner pris...</p>
                  </div>
                ) : itemType === 'BOX_ADVERTISING' && pricing ? (
                  <>
                    <PriceBreakdown 
                      basePrice={pricing.baseMonthlyPrice}
                      quantity={months || 1}
                      quantityLabel="måned"
                      discount={pricing.monthDiscountPercentage > 0 ? {
                        percentage: pricing.monthDiscountPercentage,
                        amount: pricing.monthDiscount,
                        label: "Perioderabatt"
                      } : undefined}
                      finalPrice={pricing.finalPrice}
                      className="border-t pt-3"
                    />
                    {pricing.monthDiscountPercentage > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-green-700 font-medium">
                          🎉 Du sparer {formatPrice(pricing.monthDiscount)} med lengre periode!
                        </p>
                      </div>
                    )}
                  </>
                ) : itemType === 'BOX_SPONSORED' && days ? (
                  <PriceBreakdown 
                    basePrice={amount / days}
                    quantity={days}
                    quantityLabel="dag"
                    discount={discount > 0 ? {
                      percentage: Math.round((discount / (amount + discount)) * 100),
                      amount: discount,
                      label: "Rabatt"
                    } : undefined}
                    finalPrice={amount}
                    className="border-t pt-3"
                  />
                ) : itemType === 'SERVICE_ADVERTISING' && months ? (
                  <PriceBreakdown 
                    basePrice={amount / months}
                    quantity={months}
                    quantityLabel="måned"
                    discount={discount > 0 ? {
                      percentage: Math.round((discount / (amount + discount)) * 100),
                      amount: discount,
                      label: "Perioderabatt"
                    } : undefined}
                    finalPrice={amount}
                    className="border-t pt-3"
                  />
                ) : (
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beløp:</span>
                      <span className="font-medium">{amount.toFixed(2)} kr</span>
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Rabatt:</span>
                        <span>-{discount.toFixed(0)}%</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Totalt:</span>
                      <span>{amount.toFixed(2)} kr</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Viktig informasjon:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Din bestilling aktiveres umiddelbart</li>
                  <li>• Du vil motta faktura på e-post innen 1-2 virkedager</li>
                  <li>• Betalingsfrist er 14 dager fra fakturadato</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Fakturaopplysninger</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fullt navn *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    placeholder="Skriv inn fullt navn"
                    className="w-full"
                    data-cy="full-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Gateadresse"
                    className="w-full"
                    data-cy="address-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postnr *
                    </label>
                    <Input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      required
                      placeholder="1234"
                      className="w-full"
                      data-cy="postal-code-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sted *
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      placeholder="Oslo"
                      className="w-full"
                      data-cy="city-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    placeholder="12345678"
                    className="w-full"
                    data-cy="phone-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    placeholder="din@epost.no"
                    className="w-full"
                    data-cy="email-input"
                  />
                </div>

                <ErrorMessage error={createInvoiceRequest.error} />

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    loading={createInvoiceRequest.isPending}
                    className="flex-1"
                    data-cy="submit-invoice-request-button"
                  >
                    Bestill med faktura
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BestillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laster...</p>
        </div>
      </div>
    }>
      <BestillPageContent />
    </Suspense>
  );
}