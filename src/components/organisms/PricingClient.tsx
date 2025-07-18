'use client';

import { CheckIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { useState } from 'react';
import { BasePrice, PricingDiscount } from '@prisma/client';

interface PricingClientProps {
  basePrice: BasePrice | null;
  discounts: PricingDiscount[];
}

export default function PricingClient({ basePrice, discounts }: PricingClientProps) {
  const [selectedBoxes, setSelectedBoxes] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Get base price (fallback to 10 kr if no base price)
  const basePriceInKr = basePrice?.price || 10;

  // Convert discounts array to object for easier lookup
  const discountMap = discounts.reduce((acc, discount) => {
    acc[discount.months] = discount.percentage;
    return acc;
  }, {} as Record<number, number>);

  // Fallback to hardcoded discounts if no database discounts
  const discountPercentages = {
    1: discountMap[1] || 0,     // 1 month: no discount
    3: discountMap[3] || 0.05,  // 3 months: 5% discount
    6: discountMap[6] || 0.12,  // 6 months: 12% discount
    12: discountMap[12] || 0.15 // 12 months: 15% discount
  };

  const calculatePrice = (boxes: number, months: number) => {
    const totalMonthlyPrice = boxes * basePriceInKr;
    const totalPrice = totalMonthlyPrice * months;
    const discount = discountPercentages[months as keyof typeof discountPercentages] || 0;
    const discountedPrice = totalPrice * (1 - discount);
    return {
      monthlyPrice: totalMonthlyPrice,
      totalPrice: totalPrice,
      discountedPrice: discountedPrice,
      savings: totalPrice - discountedPrice,
      discount: discount * 100
    };
  };

  const pricing = calculatePrice(selectedBoxes, selectedPeriod);

  const periods = [
    { months: 1, label: '1 måned', discount: '0%' },
    { months: 3, label: '3 måneder', discount: '5%' },
    { months: 6, label: '6 måneder', discount: '12%' },
    { months: 12, label: '12 måneder', discount: '15%' }
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
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
          {basePriceInKr} kr per boks per måned for markedsføring og synlighet. Du betaler for alle bokser i stallen din, 
          uavhengig av om de er ledige eller utleid.
        </p>
      </div>

      {/* Pricing Calculator */}
      <div className="max-w-4xl mx-auto mb-12 sm:mb-20">
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
                  <div className="grid grid-cols-2 gap-3">
                    {periods.map((period) => (
                      <button
                        key={period.months}
                        onClick={() => setSelectedPeriod(period.months)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          selectedPeriod === period.months
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
              </div>
              
              {/* Results Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prissammendrag
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Månedspris:</span>
                    <span className="font-semibold">{pricing.monthlyPrice} kr/mnd</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Periode:</span>
                    <span className="font-semibold">{selectedPeriod} måned{selectedPeriod !== 1 ? 'er' : ''}</span>
                  </div>
                  
                  {pricing.discount > 0 && (
                    <>
                      <div className="flex justify-between text-gray-500 line-through">
                        <span>Ordinær pris:</span>
                        <span>{pricing.totalPrice} kr</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Rabatt ({pricing.discount}%):</span>
                        <span>-{pricing.savings.toFixed(0)} kr</span>
                      </div>
                    </>
                  )}
                  
                  <hr className="border-gray-200" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total kostnad:</span>
                    <span className="text-indigo-600">{pricing.discountedPrice.toFixed(0)} kr</span>
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
          <Link href="/staller">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
              Se eksempler
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}