'use client';

import { MapPinIcon, StarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useCreateConversation } from '@/hooks/useQueries';
import { BoxWithStable } from '@/types/stable';

interface BoxListingCardProps {
  box: BoxWithStable;
}

export default function BoxListingCard({ box }: BoxListingCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createConversation = useCreateConversation();

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/bokser/${box.id}`}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                      {box.name}
                    </h3>
                  </Link>
                  {box.isSponsored && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      Betalt plassering
                    </span>
                  )}
                </div>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleContactClick}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                Start samtale
              </Button>
              <Link href={`/bokser/${box.id}`} className="flex-1 sm:flex-none">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full min-h-[44px]"
                >
                  Se detaljer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
}