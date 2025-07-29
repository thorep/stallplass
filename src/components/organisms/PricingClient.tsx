'use client';

import { CheckIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { BasePrice, PricingDiscount } from '@/types';

interface PricingClientProps {
  boxAdvertisingPrice: BasePrice | null;
  sponsoredPrice: BasePrice | null;
  serviceBasePrice: BasePrice | null;
  discounts: PricingDiscount[];
  boostDiscounts: Array<{id: string; days: number; percentage: number; isActive: boolean}>;
}

export default function PricingClient({ boxAdvertisingPrice, sponsoredPrice, serviceBasePrice, discounts, boostDiscounts }: PricingClientProps) {
  const [selectedBoxes, setSelectedBoxes] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  
  // Sponsored placement state
  const [sponsoredBoxes, setSponsoredBoxes] = useState(1);
  const [sponsoredDays, setSponsoredDays] = useState(1);

  // Service advertising state
  const [serviceDays, setServiceDays] = useState(1);
  const [serviceDiscounts, setServiceDiscounts] = useState<Array<{days: number, percentage: number}>>([]);

  // Get base price (fallback to 10 kr if no base price)
  const basePriceInKr = boxAdvertisingPrice?.price || 10;
  
  // Get service base price (fallback to 2 kr if no service price)
  const serviceBasePriceInKr = serviceBasePrice?.price || 2;
  
  // Get sponsored placement price (fallback to 2 kr if no sponsored price)
  const sponsoredPriceInKr = sponsoredPrice?.price || 2;

  // Load service discounts on component mount
  useEffect(() => {
    const loadServiceDiscounts = async () => {
      try {
        const response = await fetch('/api/pricing/service');
        if (response.ok) {
          const data = await response.json();
          setServiceDiscounts(data.discounts || []);
        }
      } catch (error) {
        console.error('Failed to load service discounts:', error);
        // Use fallback discounts if API fails
        setServiceDiscounts([
          { days: 30, percentage: 10 },
          { days: 60, percentage: 15 },
          { days: 90, percentage: 20 }
        ]);
      }
    };
    
    loadServiceDiscounts();
  }, []);

  // Convert discounts array to object for easier lookup
  const discountMap = discounts.reduce((acc, discount) => {
    acc[discount.months] = discount.percentage;
    return acc;
  }, {} as Record<number, number>);

  // Convert database discounts (stored as percentages like 5, 12, 15) to decimals (0.05, 0.12, 0.15)
  const discountPercentages = {
    1: (discountMap[1] ? discountMap[1] / 100 : 0),       // 1 month: no discount
    3: (discountMap[3] ? discountMap[3] / 100 : 0),       // 3 months: use database value
    6: (discountMap[6] ? discountMap[6] / 100 : 0),       // 6 months: use database value
    12: (discountMap[12] ? discountMap[12] / 100 : 0)     // 12 months: use database value
  };


  const calculatePrice = (boxes: number, months: number) => {
    const totalMonthlyPrice = boxes * basePriceInKr;
    const totalPrice = totalMonthlyPrice * months;
    
    // Apply month-based discount
    const monthDiscount = discountPercentages[months as keyof typeof discountPercentages] || 0;
    
    // Validate that discount is a reasonable percentage (0-100%)
    const validatedDiscount = Math.max(0, Math.min(1, monthDiscount));
    
    const discountedPrice = totalPrice * (1 - validatedDiscount);
    const savings = totalPrice - discountedPrice;
    
    return {
      monthlyPrice: totalMonthlyPrice,
      totalPrice: totalPrice,
      monthDiscount: validatedDiscount * 100, // Return validated discount as percentage for display
      discountedPrice: discountedPrice,
      savings: savings
    };
  };

  const pricing = calculatePrice(selectedBoxes, selectedPeriod);
  
  const calculateSponsoredPrice = (boxes: number, days: number) => {
    const baseTotal = boxes * sponsoredPriceInKr * days;
    let totalPrice = baseTotal;
    let discount = 0;
    let discountPercentage = 0;

    // Apply boost discounts from database
    const applicableDiscount = boostDiscounts
      .filter(d => d.isActive && days >= d.days)
      .sort((a, b) => b.percentage - a.percentage)[0]; // Get highest applicable discount
    
    if (applicableDiscount) {
      discountPercentage = applicableDiscount.percentage;
      discount = baseTotal * (discountPercentage / 100);
      totalPrice = baseTotal - discount;
    }

    return {
      dailyPrice: sponsoredPriceInKr,
      baseTotal: baseTotal,
      discount: discount,
      discountPercentage: discountPercentage,
      totalPrice: totalPrice,
      pricePerBoxPerDay: sponsoredPriceInKr
    };
  };
  
  const sponsoredPricing = calculateSponsoredPrice(sponsoredBoxes, sponsoredDays);

  const calculateServicePrice = (days: number) => {
    const dailyPrice = serviceBasePriceInKr; // Use database value for service advertising
    let totalPrice = dailyPrice * days;
    let discount = 0;
    let discountPercentage = 0;

    // Apply duration discounts from database
    const applicableDiscount = serviceDiscounts
      .filter(d => days >= d.days)
      .sort((a, b) => b.percentage - a.percentage)[0]; // Get highest applicable discount
    
    if (applicableDiscount) {
      discountPercentage = applicableDiscount.percentage;
    }

    if (discountPercentage > 0) {
      discount = totalPrice * (discountPercentage / 100);
      totalPrice = totalPrice - discount;
    }

    return {
      dailyPrice: dailyPrice,
      baseTotal: dailyPrice * days,
      discount: discount,
      discountPercentage: discountPercentage,
      totalPrice: totalPrice,
      days: days
    };
  };
  
  const servicePricing = calculateServicePrice(serviceDays);

  const periods = [
    { months: 1, label: '1 måned', discount: '0%' },
    { months: 3, label: '3 måneder', discount: discountMap[3] ? `${discountMap[3]}%` : '0%' },
    { months: 6, label: '6 måneder', discount: discountMap[6] ? `${discountMap[6]}%` : '0%' },
    { months: 12, label: '12 måneder', discount: discountMap[12] ? `${discountMap[12]}%` : '0%' }
  ];

  const features = [
    'Full synlighet for din stall',
    'Kun bokser du velger vises i søk',
    'Kontaktinformasjon til interesserte',
    'Ubegrenset visninger av annonser',
    'Dashboard for administrasjon',
    'Mobiloptimalisert',
    'E-post og telefonstøtte'
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-20">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Betal per boks for maksimal synlighet
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto" data-cy="box-advertising-hero-price">
          {basePriceInKr} kr per boks per måned for markedsføring og synlighet. Du betaler for alle bokser i stallen din, 
          uavhengig av om de er ledige eller utleid.
        </p>
      </div>

      {/* Pricing Calculator */}
      <div className="max-w-4xl mx-auto mb-12 sm:mb-20" data-cy="pricing-calculator">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 p-6 sm:p-8">
            <div className="flex items-center justify-center mb-4">
              <CalculatorIcon className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Prisberegner
              </h2>
            </div>
            <p className="text-indigo-100 text-center">
              Beregn kostnad for markedsføring av din stall
            </p>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Antall bokser i stallen din
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedBoxes(Math.max(1, selectedBoxes - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={selectedBoxes}
                      onChange={(e) => setSelectedBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
                      data-cy="box-quantity-input"
                    />
                    <button
                      onClick={() => setSelectedBoxes(selectedBoxes + 1)}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Markedsføringsperiode
                  </label>
                  <div className="grid grid-cols-2 gap-3" data-cy="pricing-periods">
                    {periods.map((period) => (
                      <button
                        key={period.months}
                        onClick={() => setSelectedPeriod(period.months)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedPeriod === period.months
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        data-cy={`period-${period.months}-month${period.months !== 1 ? 's' : ''}`}
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
              </div>
              
              {/* Results Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prissammendrag
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Månedspris:</span>
                    <span className="font-semibold" data-cy="monthly-price">{pricing.monthlyPrice} kr/mnd</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Periode:</span>
                    <span className="font-semibold">{selectedPeriod} måned{selectedPeriod !== 1 ? 'er' : ''}</span>
                  </div>
                  
                  {pricing.monthDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-gray-500 line-through">
                        <span>Ordinær pris:</span>
                        <span>{pricing.totalPrice} kr</span>
                      </div>
                      <div className="flex justify-between text-emerald-600" data-cy="discount-savings">
                        <span data-cy="discount-percentage-display">Tidsrabatt ({pricing.monthDiscount.toFixed(1)}%):</span>
                        <span>-{pricing.savings.toFixed(0)} kr</span>
                      </div>
                    </>
                  )}
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total kostnad:</span>
                    <span className="text-indigo-600" data-cy="total-price">{pricing.discountedPrice.toFixed(0)} kr</span>
                  </div>
                  
                  {pricing.savings > 0 && (
                    <div className="text-center bg-emerald-100 rounded-lg p-3 mt-4">
                      <span className="text-emerald-700 font-semibold">
                        Du sparer {pricing.savings.toFixed(0)} kr!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsored Placement Calculator */}
      <div className="max-w-4xl mx-auto mb-12 sm:mb-20" data-cy="boost-calculator">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 sm:p-8">
            <div className="flex items-center justify-center mb-4">
              <CalculatorIcon className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Betalt plassering
              </h2>
            </div>
            <p className="text-purple-100 text-center">
              Få boksene dine øverst i søkeresultatene
            </p>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Antall bokser for betalt plassering
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSponsoredBoxes(Math.max(1, sponsoredBoxes - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={sponsoredBoxes}
                      onChange={(e) => setSponsoredBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
                      data-cy="boost-boxes-input"
                    />
                    <button
                      onClick={() => setSponsoredBoxes(sponsoredBoxes + 1)}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Antall dager
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSponsoredDays(Math.max(1, sponsoredDays - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={sponsoredDays}
                      onChange={(e) => setSponsoredDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
                      data-cy="boost-days-input"
                    />
                    <button
                      onClick={() => setSponsoredDays(sponsoredDays + 1)}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Maksimalt antall dager avhenger av din aktive annonseringsperiode
                  </p>
                </div>
              </div>
              
              {/* Results Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prissammendrag
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris per boks per dag:</span>
                    <span className="font-semibold" data-cy="boost-daily-price-display">{sponsoredPricing.dailyPrice} kr</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bokser:</span>
                    <span className="font-semibold">{sponsoredBoxes}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dager:</span>
                    <span className="font-semibold">{sponsoredDays}</span>
                  </div>

                  {sponsoredPricing.baseTotal && sponsoredPricing.baseTotal !== sponsoredPricing.totalPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grunnpris:</span>
                      <span className="font-semibold">{sponsoredPricing.baseTotal} kr</span>
                    </div>
                  )}

                  {sponsoredPricing.discountPercentage > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span data-cy="boost-discount-percentage">Rabatt ({sponsoredPricing.discountPercentage}%):</span>
                      <span data-cy="boost-discount-amount">-{sponsoredPricing.discount} kr</span>
                    </div>
                  )}
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total kostnad:</span>
                    <span className="text-purple-600" data-cy="boost-total-price">{sponsoredPricing.totalPrice} kr</span>
                  </div>
                </div>
                
                <div className="bg-purple-100 rounded-lg p-4 mt-4">
                  <div className="text-purple-800 text-sm">
                    <strong>Viktig:</strong> Betalt plassering kan kun kjøpes for bokser som allerede har aktiv annonsering. 
                    Boksene dine vil vises øverst i søkeresultatene med &quot;Betalt plassering&quot; merke.
                  </div>
                </div>

                {boostDiscounts.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-4 mt-4" data-cy="boost-discounts-info">
                    <div className="text-emerald-800 text-sm">
                      <strong>Rabatter:</strong>
                      <ul className="mt-2 space-y-1">
                        {boostDiscounts
                          .filter(discount => discount.isActive)
                          .sort((a, b) => a.days - b.days)
                          .map((discount, index) => (
                            <li key={index}>• {discount.days}+ dager: {discount.percentage}% rabatt</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Advertising Calculator */}
      <div className="max-w-4xl mx-auto mb-12 sm:mb-20" data-cy="service-calculator">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 sm:p-8">
            <div className="flex items-center justify-center mb-4">
              <CalculatorIcon className="h-8 w-8 text-white mr-3" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Tjenester
              </h2>
            </div>
            <p className="text-emerald-100 text-center">
              Markedsfør dine tjenester (veterinær, hovslagare, trener)
            </p>
          </div>
          
          <div className="p-6 sm:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Antall dager markedsføring
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setServiceDays(Math.max(1, serviceDays - 1))}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={serviceDays}
                      onChange={(e) => setServiceDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
                      data-cy="service-days-input"
                    />
                    <button
                      onClick={() => setServiceDays(serviceDays + 1)}
                      className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Tjenesten din vil være synlig øverst i søkeresultatene
                  </p>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="text-emerald-800 text-sm">
                    <strong>Hva inkluderer tjeneste-markedsføring?</strong>
                    <ul className="mt-2 space-y-1">
                      <li>• Øverst i søkeresultater for ditt område</li>
                      <li>• Fremhevet profil med &ldquo;Anbefalt&rdquo; merke</li>
                      <li>• Prioritert visning på tjensteoversikten</li>
                      <li>• Økt synlighet for potensielle kunder</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Results Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prissammendrag
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris per dag:</span>
                    <span className="font-semibold" data-cy="service-daily-price-display">{servicePricing.dailyPrice} kr</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Antall dager:</span>
                    <span className="font-semibold">{servicePricing.days}</span>
                  </div>

                  {servicePricing.baseTotal && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grunnpris:</span>
                      <span className="font-semibold">{servicePricing.baseTotal} kr</span>
                    </div>
                  )}

                  {servicePricing.discountPercentage > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span data-cy="service-discount-percentage">Rabatt ({servicePricing.discountPercentage}%):</span>
                      <span data-cy="service-discount-amount">-{servicePricing.discount} kr</span>
                    </div>
                  )}
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total kostnad:</span>
                    <span className="text-emerald-600" data-cy="service-total-price">{servicePricing.totalPrice} kr</span>
                  </div>
                </div>
                
                <div className="bg-blue-100 rounded-lg p-4 mt-4">
                  <div className="text-blue-800 text-sm">
                    <strong>Tips:</strong> Start med 7-14 dager for å teste hvor mye interesse 
                    tjenesten din genererer. Du kan alltid forlenge senere basert på resultatet.
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 mt-4" data-cy="service-discounts-info">
                  <div className="text-emerald-800 text-sm">
                    <strong>Rabatter:</strong>
                    <ul className="mt-2 space-y-1">
                      {serviceDiscounts.map((discount, index) => (
                        <li key={index}>• {discount.days}+ dager: {discount.percentage}% rabatt</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-20">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Hva får du?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
          Ofte stilte spørsmål
        </h2>
        
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Kan jeg opprette stall gratis?
            </h3>
            <p className="text-gray-600">
              Ja! Du kan registrere stall og legge til bokser helt gratis. Din stall vil ikke være synlig 
              for potensielle leietakere før du velger å betale for markedsføring. Dette gir deg tid til 
              å sette opp alt perfekt før du starter.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hvordan fungerer prissystemet?
            </h3>
            <p className="text-gray-600">
              Du betaler {basePriceInKr} kr per boks per måned for alle bokser i stallen din, uavhengig av om de er ledige eller utleid. 
              Har du 8 bokser totalt, betaler du {basePriceInKr * 8} kr per måned. Dette gir deg rett til å markedsføre stallen din og 
              velge hvilke bokser som skal være synlige for potensielle leietakere.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hva er forskjellen på aktive og inaktive bokser?
            </h3>
            <p className="text-gray-600">
              Aktive bokser vises i søkeresultater og på din stalls offentlige side. Inaktive bokser 
              er ikke synlige for potensielle leietakere. Du kan enkelt aktivere/deaktivere bokser 
              fra dashboardet ditt når som helst.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hvordan fungerer rabattene?
            </h3>
            <p className="text-gray-600">
              Ved å velge lengre annonseringsperioder får du rabatt: 5% for 3 måneder, 
              12% for 6 måneder og 15% for 12 måneder. Rabatten beregnes automatisk 
              basert på valgt periode.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Kan jeg skjule bokser fra søkeresultater?
            </h3>
            <p className="text-gray-600">
              Ja, du kan velge hvilke bokser som skal være synlige for potensielle leietakere. 
              Selv om du betaler for alle bokser, kan du skjule bokser som er utleid eller 
              ikke tilgjengelige fra søkeresultater og din offentlige stallprofil.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Er det noen bindingstid?
            </h3>
            <p className="text-gray-600">
              Nei, det er ingen bindingstid eller automatisk fornyelse. Du betaler på forhånd 
              for den perioden du velger. Når perioden utløper, stopper markedsføringen automatisk.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Hvordan fungerer markedsføring av tjenester?
            </h3>
            <p className="text-gray-600">
              Tjenester (veterinær, hovslagare, trener) markedsføres for 2 kr per dag. Din tjeneste 
              vil vises øverst i søkeresultatene for ditt område med et &ldquo;Anbefalt&rdquo; merke. Du kan 
              kjøpe markedsføring for så få eller mange dager du ønsker.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl p-8 sm:p-12 text-center mt-12 sm:mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Klar til å starte annonsering?
        </h2>
        <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
          Registrer din stall i dag og få kontroll over hvilke bokser som skal være aktive. 
          Betal kun for det du faktisk annonserer.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/registrer">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Registrer deg gratis
            </Button>
          </Link>
          <Link href="/stables">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
              Se eksempler
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}