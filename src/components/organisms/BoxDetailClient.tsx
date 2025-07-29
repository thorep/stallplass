'use client';

import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { useCreateConversation } from '@/hooks/useChat';
import { BoxWithStablePreview } from '@/types/stable';
import Button from '@/components/atoms/Button';
import Link from 'next/link';
import { 
  MapPinIcon, 
  StarIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  HomeIcon,
  BuildingOffice2Icon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { formatPrice } from '@/utils/formatting';

interface BoxDetailClientProps {
  box: BoxWithStablePreview;
}

export default function BoxDetailClient({ box }: BoxDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const createConversation = useCreateConversation();


  const handleContactClick = async () => {
    if (!user) {
      router.push('/logg-inn');
      return;
    }
    
    try {
      await createConversation.mutateAsync();
      router.push('/meldinger');
    } catch {
      alert('Feil ved opprettelse av samtale. Prøv igjen.');
    }
  };

  return (
    <div className="bg-gray-50">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Link href="/stables" className="flex items-center text-gray-600 hover:text-gray-900">
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Tilbake til søk</span>
                  <span className="sm:hidden">Tilbake</span>
                </Link>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <HomeIcon className="h-4 w-4" />
                  <span>/</span>
                  <Link href="/stables" className="hover:text-gray-700">Staller</Link>
                  <span>/</span>
                  <Link href={`/stables/${box.stable.id}`} className="hover:text-gray-700">{box.stable.name}</Link>
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
                        href={`/stables/${box.stable.id}`}
                        className="hover:text-primary font-medium"
                      >
                        {box.stable.name}
                      </Link>
                      <span className="mx-2">•</span>
                      <span>{box.stable.location}</span>
                    </div>
                    
                    {box.stable.rating && box.stable.rating > 0 && (
                      <div className="flex items-center mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              className={`h-5 w-5 ${
                                star <= (box.stable.rating || 0) 
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
                        {'Innendørs'}
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
                      // TODO: Add amenities when available from box-amenity relationship
                      { condition: false, label: 'Vindu' },
                      { condition: false, label: 'Strøm' },
                      { condition: false, label: 'Vann' }
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
                      <Link href={`/stables/${box.stable.id}`}>
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
                    
                    <Link href={`/stables/${box.stable.id}`}>
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
                      <div className="text-sm text-gray-600">{box.stable.owner?.name || box.stable.owner?.email || 'Ikke oppgitt'}</div>
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
    );
}