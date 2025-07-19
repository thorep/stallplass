'use client';

import { useState } from 'react';
import { MapPinIcon, StarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useCreateConversation, useConfirmRental } from '@/hooks/useQueries';

interface BoxWithStable {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  size?: number | null;
  isIndoor: boolean;
  maxHorseSize?: string | null;
  hasWindow: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  specialNotes?: string | null;
  stable: {
    id: string;
    name: string;
    location: string;
    ownerName: string;
    rating: number;
    reviewCount: number;
  };
}

interface BoxListingCardProps {
  box: BoxWithStable;
}

export default function BoxListingCard({ box }: BoxListingCardProps) {
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                  {box.name}
                </h3>
                <div className="flex items-center text-gray-600 text-sm mb-2">
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
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= box.stable.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({box.stable.reviewCount})
                    </span>
                  </div>
                )}
              </div>
              
              {/* Price */}
              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(box.price)}
                </div>
                <div className="text-sm text-gray-600">per måned</div>
              </div>
            </div>

            {/* Description */}
            {box.description && (
              <p className="text-gray-600 text-sm mb-4">{box.description}</p>
            )}

            {/* Box Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              {box.size && (
                <div>
                  <span className="font-medium">Størrelse:</span>
                  <br />
                  <span className="text-gray-600">{box.size} m²</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Type:</span>
                <br />
                <span className="text-gray-600">
                  {box.isIndoor ? 'Innendørs' : 'Utendørs'}
                </span>
              </div>
              
              {box.maxHorseSize && (
                <div>
                  <span className="font-medium">Hestestørrelse:</span>
                  <br />
                  <span className="text-gray-600">{box.maxHorseSize}</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Fasiliteter:</span>
                <br />
                <div className="text-gray-600">
                  {[
                    box.hasWindow && 'Vindu',
                    box.hasElectricity && 'Strøm',
                    box.hasWater && 'Vann'
                  ].filter(Boolean).join(', ') || 'Grunnleggende'}
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {box.specialNotes && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                <span className="font-medium text-blue-900">Merknad:</span>
                <span className="text-blue-800 ml-1">{box.specialNotes}</span>
              </div>
            )}

            {/* Contact Info */}
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Eier:</span> {box.stable.ownerName}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleContactClick}
                className="flex-1 sm:flex-none"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Start samtale
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRentClick}
                className="flex-1 sm:flex-none"
              >
                Lei denne boksen
              </Button>
              <Link href={`/staller/${box.stable.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Se stall
                </Button>
              </Link>
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

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowRentalModal(false)}
                  disabled={createConversation.isPending || confirmRental.isPending}
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDirectRental}
                  disabled={createConversation.isPending || confirmRental.isPending}
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