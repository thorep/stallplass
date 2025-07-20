'use client';

import { useState, useEffect } from 'react';
import { formatPrice, formatPriceRange } from '@/utils/formatting';
import Image from 'next/image';
import { 
  TrashIcon, 
  MapPinIcon,
  PlusIcon,
  BuildingOfficeIcon,
  SpeakerWaveIcon,
  PencilIcon,
  EyeIcon,
  ClockIcon,
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import BoxManagementModal from './BoxManagementModal';
import PaymentModal from './PaymentModal';
import SponsoredPlacementModal from '@/components/molecules/SponsoredPlacementModal';
import { StableWithBoxStats, Box } from '@/types/stable';

// Remove local interface - use the proper Box type from types/stable
import { useRouter } from 'next/navigation';
import StableMap from '@/components/molecules/StableMap';
import FAQSuggestionBanner from '@/components/molecules/FAQSuggestionBanner';
import { differenceInDays } from 'date-fns';
import { useBoxes, useUpdateBox, useBasePrice } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

interface StableManagementCardProps {
  stable: StableWithBoxStats;
  onDelete: (stable_id: string) => void;
  deleteLoading: boolean;
}

export default function StableManagementCard({ stable, onDelete, deleteLoading }: StableManagementCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: boxes = [], isLoading: boxesLoading, refetch: refetchBoxes } = useBoxes(stable.id);
  const updateBox = useUpdateBox();
  const { data: basePriceData } = useBasePrice();
  
  // FAQ state
  const [faqCount, setFaqCount] = useState<number | null>(null);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showAdvertisingModal, setShowAdvertisingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPeriod, setPaymentPeriod] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSponsoredModal, setShowSponsoredModal] = useState(false);
  const [selectedBoxForSponsored, setSelectedBoxForSponsored] = useState<{ id: string; name: string } | null>(null);

  // Boxes are now loaded automatically via TanStack Query

  const availableBoxes = boxes.filter(box => box.is_available).length;
  const sponsoredBoxes = boxes.filter(box => box.is_sponsored).length;
  const totalBoxes = boxes.length;
  const priceRange = boxes.length > 0 ? {
    min: Math.min(...boxes.map(b => b.price)),
    max: Math.max(...boxes.map(b => b.price))
  } : null;

  const handleAddBox = () => {
    setSelectedBox(null);
    setShowBoxModal(true);
  };

  const handleEditBox = (box: Box) => {
    setSelectedBox(box);
    setShowBoxModal(true);
  };

  const handleBoxSaved = () => {
    setShowBoxModal(false);
    setSelectedBox(null);
    refetchBoxes(); // Refresh boxes via TanStack Query
  };

  const handleToggleBoxAvailable = async (boxId: string, is_available: boolean) => {
    try {
      await updateBox.mutateAsync({ id: boxId, is_available: is_available });
    } catch (error) {
      console.error('Error updating box availability:', error);
    }
  };

  const handleSponsoredPlacement = (boxId: string, boxName: string) => {
    setSelectedBoxForSponsored({ id: boxId, name: boxName });
    setShowSponsoredModal(true);
  };

  const handleStartAdvertising = () => {
    // All boxes will be advertised
    setShowAdvertisingModal(true);
  };

  const handleProceedToPayment = () => {
    setShowAdvertisingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    // Payment completion is handled by the VippsService which activates stable-level advertising
    // No need to manually activate individual boxes since we use stable-level advertising approach
    
    setShowPaymentModal(false);
    
    // Invalidate queries to refresh stable and box data
    await queryClient.invalidateQueries({ queryKey: ['stables'] });
    await queryClient.invalidateQueries({ queryKey: ['stables', 'user'] });
    await queryClient.invalidateQueries({ queryKey: ['boxes', stable.id] });
    
    // Refetch boxes immediately to show updated status
    await refetchBoxes();
    
    alert('Betaling fullført! Stallen din er nå annonsert og synlig for potensielle leietakere.');
  };

  const calculatePaymentCost = () => {
    const basePrice = basePriceData?.price || 10;
    const discounts = { 1: 0, 3: 0.05, 6: 0.12, 12: 0.15 };
    const totalMonthlyPrice = totalBoxes * basePrice;
    const totalPrice = totalMonthlyPrice * paymentPeriod;
    const discount = discounts[paymentPeriod as keyof typeof discounts] || 0;
    return Math.round(totalPrice * (1 - discount));
  };

  const getAdvertisingStatus = () => {
    if (!stable.advertisingEndDate || !stable.advertisingActive) {
      return null;
    }

    const daysLeft = differenceInDays(new Date(stable.advertisingEndDate), new Date());
    
    if (daysLeft <= 0) {
      return { status: 'expired', daysLeft: 0 };
    } else if (daysLeft <= 7) {
      return { status: 'expiring', daysLeft };
    } else {
      return { status: 'active', daysLeft };
    }
  };

  const advertisingStatus = getAdvertisingStatus();

  // Fetch FAQ count for this stable
  useEffect(() => {
    const fetchFAQCount = async () => {
      try {
        const response = await fetch(`/api/stables/${stable.id}/faqs`);
        if (response.ok) {
          const faqs = await response.json();
          setFaqCount(faqs.length);
        }
      } catch (error) {
        console.error('Error fetching FAQ count:', error);
        setFaqCount(0);
      }
    };
    
    fetchFAQCount();
  }, [stable.id]);

  // Handle swipe gestures for mobile
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex !== null) {
      // Swipe left = next image
      setSelectedImageIndex(prev => 
        prev !== null && prev < stable.images.length - 1 ? prev + 1 : 0
      );
    }
    if (isRightSwipe && selectedImageIndex !== null) {
      // Swipe right = previous image
      setSelectedImageIndex(prev => 
        prev !== null && prev > 0 ? prev - 1 : stable.images.length - 1
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{stable.name}</h3>
              <div className="flex items-center text-slate-600 mb-2">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{stable.location}</span>
                {stable.city && <span className="text-sm ml-1">• {stable.city}</span>}
              </div>
              <p className="text-slate-600 text-sm line-clamp-2">{stable.description}</p>
              
              {advertisingStatus && (
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  advertisingStatus.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700'
                    : advertisingStatus.status === 'expiring'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  <ClockIcon className="h-4 w-4" />
                  {advertisingStatus.status === 'expired' 
                    ? 'Annonsering utløpt'
                    : `${advertisingStatus.daysLeft} dager igjen av annonseringsperioden`
                  }
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 ml-4">
              <button 
                onClick={() => router.push(`/staller/${stable.id}`)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Forhåndsvis stall"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => router.push(`/dashboard/staller/${stable.id}/edit`)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title="Rediger stall"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => onDelete(stable.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                disabled={deleteLoading}
                title="Slett stall"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900">Bilder</h4>
            <button 
              onClick={() => router.push(`/dashboard/staller/${stable.id}/edit`)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Rediger bilder
            </button>
          </div>
          
          {stable.images && stable.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {stable.images.slice(0, 4).map((image, index) => (
                <button
                  key={index} 
                  className="relative aspect-square group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg overflow-hidden"
                  onClick={() => setSelectedImageIndex(index === 3 && stable.images.length > 4 ? 0 : index)}
                >
                  <Image
                    src={image}
                    alt={`Bilde ${index + 1} av ${stable.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  {/* Mobile: Always show description if exists */}
                  {stable.image_descriptions && stable.image_descriptions[index] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1.5 sm:p-2 text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {stable.image_descriptions[index]}
                    </div>
                  )}
                  {index === 3 && stable.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-lg sm:text-2xl font-bold">+{stable.images.length - 4}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-8 text-center">
              <PhotoIcon className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-3">Ingen bilder lastet opp ennå</p>
              <button 
                onClick={() => router.push(`/dashboard/staller/${stable.id}/edit`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Legg til bilder
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{totalBoxes}</div>
              <div className="text-sm text-slate-500">Totalt bokser</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{availableBoxes}</div>
              <div className="text-sm text-slate-500">Ledige</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{sponsoredBoxes}</div>
              <div className="text-sm text-slate-500">Boost aktiv</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {priceRange ? formatPriceRange(priceRange.min, priceRange.max) : '0'}
              </div>
              <div className="text-sm text-slate-500">Prisklasse (kr)</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleAddBox}
              className="flex items-center justify-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Legg til boks
            </Button>
            {totalBoxes > 0 && !stable.advertisingActive && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStartAdvertising}
                className="flex items-center justify-center"
              >
                <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                Start annonsering
              </Button>
            )}
          </div>
        </div>

        {/* No Active Advertisements Warning */}
        {totalBoxes > 0 && !stable.advertisingActive && (
          <div className="mx-6 mt-4 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
            </div>
          </div>
        )}

        {/* FAQ Suggestion Banner */}
        {faqCount === 0 && (
          <div className="px-6">
            <FAQSuggestionBanner stable_id={stable.id} stableName={stable.name} />
          </div>
        )}

        {/* Box Management */}
        <div className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-900">Stallbokser</h4>
              <p className="text-sm text-slate-600 mt-1">
                Administrer og rediger dine stallbokser nedenfor
              </p>
            </div>

            {boxesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-slate-500 mt-2">Laster bokser...</p>
              </div>
            ) : boxes.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <BuildingOfficeIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">Ingen bokser registrert ennå</p>
                <Button variant="primary" onClick={handleAddBox}>
                  Legg til din første boks
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boxes.map((box) => (
                  <div 
                    key={box.id} 
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {box.images && box.images.length > 0 ? (
                          <Image 
                            src={box.images[0]} 
                            alt={`${box.name} thumbnail`}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <h5 className="font-semibold text-slate-900">{box.name}</h5>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                          box.is_available 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {box.is_available ? 'Ledig' : 'Opptatt'}
                        </div>
                        {box.is_sponsored && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium text-center bg-purple-100 text-purple-700">
                            Boost aktiv
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div>Pris: <span className="font-medium text-slate-900">{formatPrice(box.price)}/mnd</span></div>
                      {box.size && <div>Størrelse: {box.size} m²</div>}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {/* eslint-disable @typescript-eslint/no-explicit-any */}
                        {(box as any).amenities?.map((amenityLink: any, index: number) => (
                          <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded text-center">
                            {amenityLink.amenity.name}
                          </span>
                        ))}
                        {/* eslint-disable @typescript-eslint/no-explicit-any */}
                        {(!(box as any).amenities || (box as any).amenities?.length === 0) && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded text-center">Ingen fasiliteter</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggleBoxAvailable(box.id, !box.is_available)}
                          className={`flex-1 text-sm py-3 px-4 rounded-md font-medium transition-colors ${
                            box.is_available 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {box.is_available ? 'Marker som utleid' : 'Marker som ledig'}
                        </button>
                      </div>
                      <button 
                        onClick={() => handleEditBox(box as any)}
                        className="w-full text-sm py-3 px-4 bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 font-medium rounded-md transition-colors"
                      >
                        Rediger boks
                      </button>
                      {box.is_active && stable.advertisingActive && (
                        box.is_sponsored ? (
                          <button 
                            onClick={() => handleSponsoredPlacement(box.id, box.name)}
                            className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            <SparklesIcon className="h-4 w-4" />
                            Forleng boost
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleSponsoredPlacement(box.id, box.name)}
                            className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                          >
                            <SparklesIcon className="h-4 w-4" />
                            Boost til topp i søk
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
        
        {/* Map Section */}
        {stable.latitude && stable.longitude && (
          <div className="p-6 border-t border-slate-100">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Kart</h4>
            <StableMap
              latitude={stable.latitude}
              longitude={stable.longitude}
              stallName={stable.name}
              address={stable.address || `${stable.postal_code} ${stable.city}`}
              className="w-full h-64"
            />
          </div>
        )}
      </div>

      {/* Box Modal */}
      {showBoxModal && (
        <BoxManagementModal
          stable_id={stable.id}
          box={selectedBox}
          onClose={() => setShowBoxModal(false)}
          onSave={handleBoxSaved}
        />
      )}

      {/* Advertising Modal */}
      {showAdvertisingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Start markedsføring</h2>
              <p className="text-gray-600 mt-2">
                Du betaler {basePriceData?.price || 10} kr per boks per måned for alle {totalBoxes} bokser i stallen din. 
                Hele stallen din vil være synlig og annonsert for potensielle leietakere.
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

              
              <div className="mt-6 bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">Viktig å vite:</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Du betaler for alle {totalBoxes} bokser i stallen din</li>
                  <li>• Du kan selv velge hvilke bokser som skal være synlige i søkeresultatene</li>
                  <li>• Bokser kan enkelt fjernes fra søk eller legges tilbake når du ønsker</li>
                  <li>• Hele stallen din vil være synlig og annonsert for potensielle leietakere</li>
                  <li>• Markedsføringen gjelder for hele stallen</li>
                  <li>• Kostnaden er {calculatePaymentCost()} kr for {paymentPeriod} måned{paymentPeriod !== 1 ? 'er' : ''}</li>
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
        stable_id={stable.id}
      />

      {/* Image Viewer Modal - Mobile First */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">
                {selectedImageIndex + 1} / {stable.images.length}
              </span>
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Lukk"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Image Container with Touch Support */}
          <div 
            className="flex-1 flex items-center justify-center p-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={stable.images[selectedImageIndex]}
                alt={`Bilde ${selectedImageIndex + 1} av ${stable.name}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Description and Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            {stable.image_descriptions && stable.image_descriptions[selectedImageIndex] && (
              <p className="text-white text-sm mb-4 text-center">
                {stable.image_descriptions[selectedImageIndex]}
              </p>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedImageIndex(prev => 
                  prev !== null && prev > 0 ? prev - 1 : stable.images.length - 1
                )}
                className="p-3 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Forrige bilde"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              
              {/* Dots Indicator */}
              <div className="flex gap-1.5">
                {stable.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Gå til bilde ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setSelectedImageIndex(prev => 
                  prev !== null && prev < stable.images.length - 1 ? prev + 1 : 0
                )}
                className="p-3 text-white hover:bg-white/20 rounded-full transition-colors"
                aria-label="Neste bilde"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sponsored Placement Modal */}
      {showSponsoredModal && selectedBoxForSponsored && (
        <SponsoredPlacementModal
          boxId={selectedBoxForSponsored.id}
          boxName={selectedBoxForSponsored.name}
          isOpen={showSponsoredModal}
          onClose={() => {
            setShowSponsoredModal(false);
            setSelectedBoxForSponsored(null);
          }}
        />
      )}
    </>
  );
}