'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useCreateConversation, useConfirmRental } from '@/hooks/useQueries';
import { BoxWithStable } from '@/types/stable';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { 
  MapPinIcon, 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  BuildingOffice2Icon,
  CurrencyEuroIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface BoxDetailClientProps {
  box: BoxWithStable;
}

export default function BoxDetailClient({ box }: BoxDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showRentalModal, setShowRentalModal] = useState(false);
  const createConversation = useCreateConversation();
  const confirmRental = useConfirmRental();

  const formatPrice = (price: number) => {
    return `${Math.floor(price / 100).toLocaleString()} kr`;
  };

  const handleContactClick = async () => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    
    try {
      await createConversation.mutateAsync({
        stableId: box.stable.id,
        boxId: box.id,
        initialMessage: `Hei! Jeg er interessert i boksen "${box.name}" og vil gjerne vite mer.`
      });
      router.push('/meldinger');
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Feil ved opprettelse av samtale. Prøv igjen.');
    }
  };

  const handleRentClick = () => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    
    setShowRentalModal(true);
  };

  const handleDirectRental = async () => {
    if (!user) return;
    
    try {
      // First create conversation with rental intent message
      const conversation = await createConversation.mutateAsync({
        stableId: box.stable.id,
        boxId: box.id,
        initialMessage: "Jeg vil gjerne leie denne boksen. Kan vi bekrefte leien?"
      });
      
      // Then confirm the rental immediately
      await confirmRental.mutateAsync({
        conversationId: conversation.id,
        startDate: new Date().toISOString()
      });

      // Success! Close modal and redirect to messages
      setShowRentalModal(false);
      router.push('/meldinger');
      
    } catch (error) {
      console.error('Error with direct rental:', error);
      alert('Kunne ikke bekrefte leien. Prøv igjen eller kontakt stallieren.');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Link href="/staller" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Tilbake til søk</span>
                  <span className="sm:hidden">Tilbake</span>
                </Link>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <HomeIcon className="h-4 w-4" />
                  <span>/</span>
                  <Link href="/staller" className="hover:text-gray-700">Staller</Link>
                  <span>/</span>
                  <Link href={`/staller/${box.stable.id}`} className="hover:text-gray-700">{box.stable.name}</Link>
                  <span>/</span>
                  <span className="text-gray-900">{box.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Box Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {box.name}
                    </h1>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-4">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <Link 
                        href={`/staller/${box.stable.id}`}
                        className="hover:text-primary font-medium"
                      >
                        {box.stable.name}
                      </Link>
                      <span className="mx-2">•</span>
                      <span>{box.stable.location}</span>
                    </div>
                    
                    {box.stable.rating > 0 && (
                      <div className="flex items-center mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-5 w-5 ${
                                star <= box.stable.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {box.stable.rating} ({box.stable.reviewCount} anmeldelser)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right sm:ml-6 mt-4 sm:mt-0">
                    <div className="text-3xl font-bold text-primary">
                      {formatPrice(box.price)}
                    </div>
                    <div className="text-sm text-gray-600">per måned</div>
                  </div>
                </div>

                {/* Description */}
                {box.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Beskrivelse</h3>
                    <p className="text-gray-700 leading-relaxed">{box.description}</p>
                  </div>
                )}

                {/* Box Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {box.size && (
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Størrelse</div>
                        <div className="text-sm text-gray-600">{box.size} m²</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <HomeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Type</div>
                      <div className="text-sm text-gray-600">
                        {box.isIndoor ? 'Innendørs' : 'Utendørs'}
                      </div>
                    </div>
                  </div>
                  
                  {box.maxHorseSize && (
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Hestestørrelse</div>
                        <div className="text-sm text-gray-600">{box.maxHorseSize}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Fasiliteter</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { condition: box.hasWindow, label: 'Vindu' },
                      { condition: box.hasElectricity, label: 'Strøm' },
                      { condition: box.hasWater, label: 'Vann' }
                    ].map((facility, index) => (
                      <div key={index} className="flex items-center">
                        <CheckIcon 
                          className={`h-5 w-5 mr-2 ${
                            facility.condition ? 'text-green-500' : 'text-gray-300'
                          }`} 
                        />
                        <span className={facility.condition ? 'text-gray-900' : 'text-gray-400'}>
                          {facility.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Notes */}
                {box.specialNotes && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Viktig informasjon</h3>
                    <p className="text-blue-800 text-sm">{box.specialNotes}</p>
                  </div>
                )}
              </div>

              {/* Stable Images */}
              {box.stable.images && box.stable.images.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bilder fra stallen</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {box.stable.images.slice(0, 4).map((image, index) => (
                      <div key={index} className="relative aspect-video">
                        <Image
                          src={image}
                          alt={box.stable.imageDescriptions?.[index] || `Bilde ${index + 1} fra ${box.stable.name}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                  {box.stable.images.length > 4 && (
                    <div className="mt-4 text-center">
                      <Link href={`/staller/${box.stable.id}`}>
                        <Button variant="outline" size="sm">
                          Se alle {box.stable.images.length} bilder
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Booking Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatPrice(box.price)}
                    </div>
                    <div className="text-sm text-gray-600">per måned</div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleContactClick}
                      className="w-full"
                      disabled={createConversation.isPending}
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      {createConversation.isPending ? 'Starter samtale...' : 'Start samtale'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleRentClick}
                      className="w-full"
                    >
                      Lei denne boksen
                    </Button>
                    
                    <Link href={`/staller/${box.stable.id}`}>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full"
                      >
                        Se hele stallen
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Kontaktinformasjon</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Eier</div>
                      <div className="text-sm text-gray-600">{box.stable.ownerName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Stall</div>
                      <div className="text-sm text-gray-600">{box.stable.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Lokasjon</div>
                      <div className="text-sm text-gray-600">{box.stable.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rental Confirmation Modal */}
      {showRentalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bekreft leie av stallboks
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900">{box.name}</div>
                  <div className="text-sm text-blue-700">
                    {formatPrice(box.price)}/måned
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    {box.description}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Størrelse:</span>
                    <span className="font-medium">{box.size ? `${box.size} m²` : 'Ikke oppgitt'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{box.isIndoor ? 'Innendørs' : 'Utendørs'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pris:</span>
                    <span className="font-medium text-primary">{formatPrice(box.price)}/måned</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-yellow-800 text-sm">
                      <strong>Viktig:</strong> Ved å bekrefte leien vil stallboksen bli reservert og 
                      markert som utilgjengelig for andre. En samtale vil bli opprettet med stallieren.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowRentalModal(false)}
                  disabled={createConversation.isPending || confirmRental.isPending}
                  className="w-full sm:w-auto"
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleDirectRental}
                  disabled={createConversation.isPending || confirmRental.isPending}
                  className="w-full sm:w-auto"
                >
                  {(createConversation.isPending || confirmRental.isPending) ? 'Bekrefter...' : 'Bekreft leie'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}