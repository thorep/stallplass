'use client';

import { useState } from 'react';
import { Stable } from '@/types/stable';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface StableLandingClientProps {
  stable: Stable;
}

export default function StableLandingClient({ stable }: StableLandingClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [confirmingRental, setConfirmingRental] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === stable.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? stable.images.length - 1 : prev - 1
    );
  };

  const formatPrice = (price: number) => {
    return `${Math.floor(price / 100).toLocaleString()} kr`;
  };

  const handleContactClick = (boxId?: string) => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    setSelectedBoxId(boxId || null);
    setShowMessageModal(true);
  };

  const handleRentClick = (boxId: string) => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    
    setSelectedBoxId(boxId);
    setShowRentalModal(true);
  };

  const handleDirectRental = async () => {
    if (!user || !selectedBoxId) return;
    
    try {
      setConfirmingRental(true);
      
      // First create conversation with rental intent message
      const conversationResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riderId: user.uid,
          stableId: stable.id,
          boxId: selectedBoxId,
          initialMessage: "Jeg vil gjerne leie denne boksen. Kan vi bekrefte leien?"
        }),
      });

      if (!conversationResponse.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation = await conversationResponse.json();
      
      // Then confirm the rental immediately
      const rentalResponse = await fetch(`/api/conversations/${conversation.id}/confirm-rental`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          startDate: new Date().toISOString(),
          monthlyPrice: stable.boxes?.find(b => b.id === selectedBoxId)?.price
        }),
      });

      if (!rentalResponse.ok) {
        throw new Error('Failed to confirm rental');
      }

      // Success! Close modal and redirect to messages
      setShowRentalModal(false);
      setSelectedBoxId(null);
      router.push('/meldinger');
      
    } catch (error) {
      console.error('Error with direct rental:', error);
      alert('Kunne ikke bekrefte leien. Prøv igjen eller kontakt stallieren.');
    } finally {
      setConfirmingRental(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !messageText.trim()) return;

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riderId: user.uid,
          stableId: stable.id,
          boxId: selectedBoxId,
          initialMessage: messageText.trim()
        }),
      });

      if (response.ok) {
        setShowMessageModal(false);
        setMessageText('');
        setSelectedBoxId(null);
        router.push('/meldinger');
      } else {
        alert('Kunne ikke sende melding. Prøv igjen.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Feil ved sending av melding. Prøv igjen.');
    } finally {
      setSendingMessage(false);
    }
  };

  const availableBoxes = stable.boxes?.filter(box => box.isAvailable && box.isActive) || [];
  const priceRange = availableBoxes.length > 0 ? {
    min: Math.min(...availableBoxes.map(box => box.price)),
    max: Math.max(...availableBoxes.map(box => box.price))
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/staller" className="text-primary hover:text-primary-hover">
            ← Tilbake til søk
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            {stable.images.length > 0 && (
              <div className="relative">
                <div className="aspect-[16/10] rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={stable.images[currentImageIndex]}
                    alt={`${stable.name} - Bilde ${currentImageIndex + 1}`}
                    width={800}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                  
                  {stable.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRightIcon className="h-6 w-6" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {stable.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex 
                                ? 'bg-white' 
                                : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {stable.images.length > 1 && (
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {stable.images.slice(0, 6).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded-lg overflow-hidden ${
                          index === currentImageIndex 
                            ? 'ring-2 ring-primary' 
                            : 'hover:opacity-80'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Miniature ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{stable.name}</h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{stable.location}</span>
                  </div>
                  
                  {stable.rating > 0 && (
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-5 w-5 ${
                              star <= stable.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({stable.reviewCount} anmeldelser)
                      </span>
                    </div>
                  )}
                </div>
                
                {priceRange && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Fra</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(priceRange.min)}
                    </div>
                    <div className="text-sm text-gray-600">per måned</div>
                  </div>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">{stable.description}</p>
            </div>

            {/* Amenities */}
            {stable.amenities && stable.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fasiliteter</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stable.amenities.map((item) => (
                    <div key={item.amenity.id} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span>{item.amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Boxes */}
            {availableBoxes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tilgjengelige bokser ({availableBoxes.length})
                </h2>
                <div className="space-y-4">
                  {availableBoxes.map((box) => (
                    <div key={box.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{box.name}</h3>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            {formatPrice(box.price)}
                          </div>
                          <div className="text-sm text-gray-600">per måned</div>
                        </div>
                      </div>
                      
                      {box.description && (
                        <p className="text-gray-600 text-sm mb-3">{box.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      
                      {box.specialNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-900">Merknad:</span>
                          <span className="text-blue-800 ml-1">{box.specialNotes}</span>
                        </div>
                      )}
                      
                      {/* Box Contact Buttons */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleContactClick(box.id)}
                            className="flex-1"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            Kontakt om denne boksen
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRentClick(box.id)}
                            className="flex-1"
                          >
                            Lei denne boksen
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt eier</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-primary font-medium text-sm">
                        {stable.ownerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{stable.ownerName}</span>
                  </div>
                  
                  {showContactInfo && (
                    <>
                      <div className="flex items-center text-gray-600">
                        <PhoneIcon className="h-5 w-5 mr-3" />
                        <a href={`tel:${stable.ownerPhone}`} className="hover:text-primary">
                          {stable.ownerPhone}
                        </a>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <EnvelopeIcon className="h-5 w-5 mr-3" />
                        <a href={`mailto:${stable.ownerEmail}`} className="hover:text-primary">
                          {stable.ownerEmail}
                        </a>
                      </div>
                    </>
                  )}
                </div>
                
                {!showContactInfo ? (
                  <div className="space-y-2">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => handleContactClick()}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Send melding
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowContactInfo(true)}
                    >
                      Vis kontaktinfo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => handleContactClick()}
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Send melding
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = `tel:${stable.ownerPhone}`}
                    >
                      Ring nå
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = `mailto:${stable.ownerEmail}?subject=Forespørsel om stallplass - ${stable.name}`}
                    >
                      Send e-post
                    </Button>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasjon</h3>
                <div className="space-y-2 text-gray-600">
                  {stable.address && <div>{stable.address}</div>}
                  <div>{stable.postalCode} {stable.city}</div>
                  {stable.county && <div>{stable.county}</div>}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Oversikt</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totalt bokser:</span>
                    <span className="font-medium">{stable.boxes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tilgjengelige:</span>
                    <span className="font-medium text-green-600">{availableBoxes.length}</span>
                  </div>
                  {stable.amenities && stable.amenities.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fasiliteter:</span>
                      <span className="font-medium">{stable.amenities.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send melding til {stable.ownerName}
              </h3>
              
              {selectedBoxId && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-900">
                    <strong>Angående:</strong> {availableBoxes.find(box => box.id === selectedBoxId)?.name}
                  </div>
                  <div className="text-sm text-blue-700">
                    {formatPrice(availableBoxes.find(box => box.id === selectedBoxId)?.price || 0)}/måned
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Melding
                </label>
                <textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={selectedBoxId 
                    ? "Hei! Jeg er interessert i denne stallplassen. Kan du fortelle meg mer om..."
                    : "Hei! Jeg er interessert i stallplasser hos dere. Kan du fortelle meg mer om..."
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText('');
                    setSelectedBoxId(null);
                  }}
                  disabled={sendingMessage}
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                >
                  {sendingMessage ? 'Sender...' : 'Send melding'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rental Confirmation Modal */}
      {showRentalModal && selectedBoxId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bekreft leie av stallboks
              </h3>
              
              {(() => {
                const box = availableBoxes.find(b => b.id === selectedBoxId);
                if (!box) return null;
                
                return (
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
                );
              })()}

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRentalModal(false);
                    setSelectedBoxId(null);
                  }}
                  disabled={confirmingRental}
                >
                  Avbryt
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDirectRental}
                  disabled={confirmingRental}
                >
                  {confirmingRental ? 'Bekrefter...' : 'Bekreft leie'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}