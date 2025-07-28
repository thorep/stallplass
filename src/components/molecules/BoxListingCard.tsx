'use client';

import { MapPinIcon, StarIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
// import { useCreateConversation } from '@/hooks/useChat'; // TODO: Use when needed
import { BoxWithStablePreview } from '@/types/stable';
import { formatPrice, formatStableLocation } from '@/utils/formatting';
import { useBoxAvailability } from '@/hooks/useBoxQueries';

interface BoxListingCardProps {
  box: BoxWithStablePreview;
}

export default function BoxListingCard({ box }: BoxListingCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // Get real-time availability updates for this specific box
  const { box: realTimeBox } = useBoxAvailability(box.id);
  
  // Use real-time data if available, otherwise fall back to initial data
  const currentBox = realTimeBox || box;
  const isAvailable = currentBox.isAvailable;
  const isSponsored = currentBox.isSponsored;


  const handleContactClick = async () => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    
    try {
      // TODO: Implement conversation creation
      // await createConversation.mutateAsync({
      //   stableId: box.stable?.id || '',
      //   boxId: currentBox.id,
      //   initialMessage: `Hei! Jeg er interessert i boksen "${currentBox.name}" og vil gjerne vite mer.`
      // });
      router.push('/meldinger');
    } catch (_) {
      alert('Feil ved opprettelse av samtale. Prøv igjen.');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 transition-all ${
      !isAvailable ? 'border-gray-300 opacity-75' : 'border-gray-200'
    }`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/bokser/${currentBox.id}`}>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 cursor-pointer hover:text-primary transition-colors">
                      {currentBox.name}
                    </h3>
                  </Link>
                  {/* Availability indicator */}
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Ledig
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                        Opptatt
                      </span>
                    )}
                    {isSponsored && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Betalt plassering
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-gray-600 text-sm mb-2">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <Link 
                    href={`/stables/${box.stable?.id || ''}`}
                    className="hover:text-primary font-medium"
                  >
                    {box.stable?.name || 'Ukjent stall'}
                  </Link>
                  <span className="mx-2">•</span>
                  <span>{formatStableLocation(box.stable)}</span>
                </div>
                
                {box.stable?.rating || 0 && box.stable?.rating || 0 > 0 && (
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (box.stable?.rating || 0 || 0) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      ({box.stable?.reviewCount || 0})
                    </span>
                  </div>
                )}
              </div>
              
              {/* Price */}
              <div className="text-right sm:ml-4 mt-2 sm:mt-0">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(currentBox.price)}
                </div>
                <div className="text-sm text-gray-600">per måned</div>
              </div>
            </div>

            {/* Description */}
            {currentBox.description && (
              <p className="text-gray-600 text-sm mb-4">{currentBox.description}</p>
            )}

            {/* Box Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              {currentBox.size && (
                <div>
                  <span className="font-medium">Størrelse:</span>
                  <br />
                  <span className="text-gray-600">{currentBox.size} m²</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Type:</span>
                <br />
                <span className="text-gray-600">
                  {false /* TODO: Check amenities for indoor status */ ? 'Innendørs' : 'Utendørs'}
                </span>
              </div>
              
              {currentBox.maxHorseSize && (
                <div>
                  <span className="font-medium">Hestestørrelse:</span>
                  <br />
                  <span className="text-gray-600">{currentBox.maxHorseSize}</span>
                </div>
              )}
              
              <div>
                <span className="font-medium">Fasiliteter:</span>
                <br />
                <div className="text-gray-600">
                  {/* TODO: Add amenities when available */}
                  {'Grunnleggende'}
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {currentBox.specialNotes && (
              <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                <span className="font-medium text-blue-900">Merknad:</span>
                <span className="text-blue-800 ml-1">{currentBox.specialNotes}</span>
              </div>
            )}

            {/* Contact Info */}
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Eier:</span> {box.stable?.owner?.name || box.stable?.owner?.email || 'Ikke oppgitt'}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleContactClick}
                disabled={!isAvailable}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                {isAvailable ? 'Start samtale' : 'Ikke tilgjengelig'}
              </Button>
              <Link href={`/bokser/${currentBox.id}`} className="flex-1 sm:flex-none">
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